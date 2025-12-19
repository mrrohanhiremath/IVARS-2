import express from 'express';
import { getResponders, updateProfile } from '../controllers/user.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/responders', protect, getResponders);
router.put('/profile', protect, updateProfile);

export default router;
