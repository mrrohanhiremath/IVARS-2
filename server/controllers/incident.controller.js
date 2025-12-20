import Incident from '../models/Incident.model.js';
import User from '../models/User.model.js';
import cloudinary from '../config/cloudinary.js';
import { sendEmergencyAlert } from '../services/email.service.js';

// Helper function to calculate distance between two coordinates (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in km
};

// Find nearby available responders
const findNearbyResponders = async (lat, lng, radiusKm = 50) => {
  try {
    console.log(`🔍 Searching for responders near [${lat}, ${lng}] within ${radiusKm}km...`);
    
    // Get all available responders with coordinates
    const responders = await User.find({
      role: { $in: ['responder', 'admin'] },
      responderStatus: 'available',
      'coordinates.lat': { $ne: null },
      'coordinates.lng': { $ne: null },
      email: { $exists: true, $ne: '' }
    }).select('name email responderType coordinates');

    console.log(`👥 Total responders found in DB: ${responders.length}`);
    
    if (responders.length > 0) {
      console.log('📋 Responder details:');
      responders.forEach(r => {
        console.log(`   - ${r.name} (${r.email}): [${r.coordinates?.lat}, ${r.coordinates?.lng}]`);
      });
    }

    if (responders.length === 0) {
      console.log('⚠️  No responders found with coordinates');
      return [];
    }

    // Calculate distance and filter by radius
    const nearbyResponders = responders
      .map(responder => {
        const distance = calculateDistance(lat, lng, responder.coordinates.lat, responder.coordinates.lng);
        console.log(`   📏 Distance to ${responder.name}: ${distance.toFixed(2)}km`);
        return {
          ...responder.toObject(),
          distance
        };
      })
      .filter(responder => responder.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance);

    console.log(`📍 Found ${nearbyResponders.length} responders within ${radiusKm}km`);
    if (nearbyResponders.length > 0) {
      console.log('✅ Nearby responders:', nearbyResponders.map(r => `${r.name} (${r.distance.toFixed(2)}km)`).join(', '));
    }
    
    return nearbyResponders;
  } catch (error) {
    console.error('Error finding nearby responders:', error);
    return [];
  }
};

// @desc    Create new incident report
// @route   POST /api/incidents
// @access  Public/Private
export const createIncident = async (req, res) => {
  try {
    const { name, contact, vehicleNo, location, coordinates, description, witnessInfo, severity } = req.body;

    // Debug logging
    console.log('📝 Received incident data:', { name, contact, location });
    console.log('📎 Files received:', req.files ? req.files.length : 0);
    if (req.files && req.files.length > 0) {
      console.log('📸 File details:', req.files.map(f => ({ name: f.originalname, size: f.size })));
    }

    // Validate required fields
    if (!name || !contact || !location || !coordinates || !description) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide all required fields' 
      });
    }

    // Generate unique report ID
    const reportId = `ACC-${Date.now()}`;

    // Parse coordinates
    let parsedCoordinates;
    try {
      parsedCoordinates = typeof coordinates === 'string' ? JSON.parse(coordinates) : coordinates;
    } catch (error) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid coordinates format' 
      });
    }

    // Upload images to Cloudinary if provided
    let uploadedImages = [];
    
    if (req.files && req.files.length > 0) {
      console.log(`🔄 Attempting to upload ${req.files.length} file(s) to Cloudinary...`);
      
      for (const file of req.files) {
        try {
          // Upload file buffer with simpler config
          const streamUpload = (buffer) => {
            return new Promise((resolve, reject) => {
              const stream = cloudinary.uploader.upload_stream(
                { 
                  folder: 'emergency-reports',
                  resource_type: 'auto',
                  use_filename: true
                },
                (error, result) => {
                  if (error) {
                    console.error('Cloudinary stream error:', error);
                    reject(error);
                  } else {
                    console.log('✅ Cloudinary upload success:', result.secure_url);
                    resolve(result);
                  }
                }
              );
              stream.end(buffer);
            });
          };

          const uploadResult = await streamUpload(file.buffer);
          uploadedImages.push({
            url: uploadResult.secure_url,
            publicId: uploadResult.public_id
          });
          console.log(`✅ Uploaded: ${file.originalname} -> ${uploadResult.secure_url}`);
        } catch (uploadError) {
          console.error(`❌ Failed to upload ${file.originalname}:`, uploadError.message);
          // Continue with other files even if one fails
        }
      }
      
      if (uploadedImages.length > 0) {
        console.log(`✅ Successfully uploaded ${uploadedImages.length} out of ${req.files.length} images to Cloudinary`);
      } else {
        console.log('⚠️  No images were uploaded to Cloudinary - continuing without images');
      }
    }

    // Create incident
    const incident = await Incident.create({
      reportId,
      user: req.user?._id || null,
      name,
      contact,
      vehicleNo: vehicleNo || '',
      location,
      coordinates: parsedCoordinates,
      description,
      witnessInfo: witnessInfo || '',
      images: uploadedImages,
      severity: severity || 'medium',
      status: 'pending'
    });

    // Find nearby responders and send emergency alert emails
    try {
      // Find responders within 50km radius
      const nearbyResponders = await findNearbyResponders(
        parsedCoordinates.lat, 
        parsedCoordinates.lng, 
        50
      );

      // Extract responder emails
      const responderEmails = nearbyResponders.map(r => r.email);
      
      console.log(`📧 Responder emails to notify: ${responderEmails.length > 0 ? responderEmails.join(', ') : 'NONE'}`);
      
      if (responderEmails.length > 0) {
        console.log(`📧 Sending alerts to ${responderEmails.length} nearby responder(s)`);
      } else {
        console.log('⚠️  No nearby responders found, sending to default emergency email');
      }

      await sendEmergencyAlert({
        reportId,
        name,
        contact,
        location,
        coordinates: parsedCoordinates,
        description,
        severity: severity || 'medium',
        vehicleNo: vehicleNo || '',
        witnessInfo: witnessInfo || '',
        images: uploadedImages,
        responderEmails
      });
      
      console.log('✅ Emergency alert email sent successfully');
    } catch (emailError) {
      console.error('⚠️  Email sending failed:', emailError.message);
      // Don't fail the request if email fails - the report is still created
      console.log('⚠️  Report created successfully, but email notification failed');
    }

    res.status(201).json({
      success: true,
      data: incident,
      message: 'Incident reported successfully. Emergency responders have been notified.'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all incidents
// @route   GET /api/incidents
// @access  Private (Responders/Admin)
export const getIncidents = async (req, res) => {
  try {
    const { status, severity, limit = 50 } = req.query;

    let query = {};
    if (status) query.status = status;
    if (severity) query.severity = severity;

    // Use lean() for faster queries (returns plain JS objects instead of Mongoose documents)
    const incidents = await Incident.find(query)
      .populate('user', 'name email')
      .populate('responderAssigned', 'name email contact')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean()
      .exec();

    // Set cache headers (5 seconds for active data)
    res.set('Cache-Control', 'public, max-age=5');
    
    res.json({
      success: true,
      count: incidents.length,
      data: incidents
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user's own incidents
// @route   GET /api/incidents/my-reports
// @access  Private (Citizens)
export const getMyIncidents = async (req, res) => {
  try {
    const userId = req.user.id;

    const incidents = await Incident.find({ user: userId })
      .populate('responderAssigned', 'name email contact role responderType')
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    // Cache user's own reports for 10 seconds
    res.set('Cache-Control', 'private, max-age=10');

    res.json({
      success: true,
      count: incidents.length,
      data: incidents
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single incident
// @route   GET /api/incidents/:id
// @access  Private
export const getIncident = async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id)
      .populate('user', 'name email contact')
      .populate('responderAssigned', 'name email contact');

    if (!incident) {
      return res.status(404).json({ success: false, message: 'Incident not found' });
    }

    res.json({
      success: true,
      data: incident
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update incident status
// @route   PUT /api/incidents/:id
// @access  Private (Responders/Admin)
export const updateIncident = async (req, res) => {
  try {
    const { status, responderAssigned, estimatedResponseTime, notes } = req.body;

    const incident = await Incident.findById(req.params.id);

    if (!incident) {
      return res.status(404).json({ success: false, message: 'Incident not found' });
    }

    // Security check: Only the assigned responder can resolve/close the incident
    if (status === 'resolved') {
      // Check if incident has an assigned responder
      if (!incident.responderAssigned) {
        return res.status(403).json({ 
          success: false, 
          message: 'Cannot resolve an unassigned incident' 
        });
      }
      
      // Check if the requesting user is the assigned responder
      const assignedResponderId = incident.responderAssigned.toString();
      const currentUserId = req.user._id.toString();
      
      if (assignedResponderId !== currentUserId && req.user.role !== 'admin') {
        return res.status(403).json({ 
          success: false, 
          message: 'Only the assigned responder can resolve this incident' 
        });
      }
    }

    // Update fields
    if (status) incident.status = status;
    if (responderAssigned) incident.responderAssigned = responderAssigned;
    if (estimatedResponseTime) incident.estimatedResponseTime = estimatedResponseTime;
    if (notes) incident.notes = notes;
    
    if (status === 'resolved') {
      incident.resolvedAt = new Date();
    }

    await incident.save();

    res.json({
      success: true,
      data: incident,
      message: 'Incident updated successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete incident
// @route   DELETE /api/incidents/:id
// @access  Private (Admin only)
export const deleteIncident = async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id);

    if (!incident) {
      return res.status(404).json({ success: false, message: 'Incident not found' });
    }

    // Delete images from Cloudinary
    if (incident.images && incident.images.length > 0) {
      for (const image of incident.images) {
        await cloudinary.uploader.destroy(image.publicId);
      }
    }

    await incident.deleteOne();

    res.json({
      success: true,
      message: 'Incident deleted successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get incident statistics
// @route   GET /api/incidents/stats/overview
// @access  Private
export const getIncidentStats = async (req, res) => {
  try {
    const totalReports = await Incident.countDocuments();
    const pendingReports = await Incident.countDocuments({ status: 'pending' });
    const activeReports = await Incident.countDocuments({ status: 'active' });
    const resolvedReports = await Incident.countDocuments({ status: 'resolved' });

    const severityStats = await Incident.aggregate([
      {
        $group: {
          _id: '$severity',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        totalReports,
        pendingReports,
        activeReports,
        resolvedReports,
        severityBreakdown: severityStats
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};
