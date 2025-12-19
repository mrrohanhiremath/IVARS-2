import mongoose from 'mongoose';

const incidentSchema = new mongoose.Schema({
  reportId: {
    type: String,
    required: true,
    unique: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  name: {
    type: String,
    required: [true, 'Please add reporter name']
  },
  contact: {
    type: String,
    required: [true, 'Please add contact number']
  },
  vehicleNo: {
    type: String,
    default: ''
  },
  location: {
    type: String,
    required: [true, 'Please add location']
  },
  coordinates: {
    lat: {
      type: Number,
      required: true
    },
    lng: {
      type: Number,
      required: true
    }
  },
  description: {
    type: String,
    required: [true, 'Please add description']
  },
  witnessInfo: {
    type: String,
    default: ''
  },
  images: [{
    url: String,
    publicId: String
  }],
  status: {
    type: String,
    enum: ['pending', 'active', 'resolved', 'cancelled'],
    default: 'pending'
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  responderAssigned: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  estimatedResponseTime: {
    type: String,
    default: ''
  },
  resolvedAt: {
    type: Date,
    default: null
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Index for geospatial queries
incidentSchema.index({ 'coordinates.lat': 1, 'coordinates.lng': 1 });

const Incident = mongoose.model('Incident', incidentSchema);

export default Incident;
