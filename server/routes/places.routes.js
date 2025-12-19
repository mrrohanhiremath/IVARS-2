import express from 'express';
import { getNearbyPlaces } from '../controllers/places.controller.js';

const router = express.Router();

router.get('/nearby', getNearbyPlaces);

export default router;
