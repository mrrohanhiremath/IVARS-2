import express from 'express';
import { getDistance } from '../controllers/distance.controller.js';

const router = express.Router();

router.get('/calculate', getDistance);

export default router;
