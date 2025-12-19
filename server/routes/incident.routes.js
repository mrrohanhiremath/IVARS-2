import express from 'express';
import {
  createIncident,
  getIncidents,
  getMyIncidents,
  getIncident,
  updateIncident,
  deleteIncident,
  getIncidentStats
} from '../controllers/incident.controller.js';
import { protect, authorize, optionalAuth } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';

const router = express.Router();

// Public routes (with optional authentication)
router.post('/', optionalAuth, upload.array('images', 5), createIncident);
router.get('/', getIncidents); // Made public for dashboard view

// Protected routes (require authentication) - MUST come before /:id
router.get('/my-reports', protect, getMyIncidents); // Get user's own reports
router.get('/stats/overview', protect, getIncidentStats);

// Dynamic routes (must be after specific paths)
router.get('/:id', getIncident); // Made public for viewing incident details
router.put('/:id', protect, authorize('responder', 'admin'), updateIncident);
router.delete('/:id', protect, authorize('admin'), deleteIncident);

export default router;
