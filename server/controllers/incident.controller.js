import Incident from '../models/Incident.model.js';
import cloudinary from '../config/cloudinary.js';
import { sendEmergencyAlert } from '../services/email.service.js';

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

    // Send emergency alert email
    try {
      await sendEmergencyAlert({
        reportId,
        name,
        contact,
        location,
        description,
        severity: severity || 'medium'
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

    const incidents = await Incident.find(query)
      .populate('user', 'name email')
      .populate('responderAssigned', 'name email contact')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

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
      .sort({ createdAt: -1 });

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
