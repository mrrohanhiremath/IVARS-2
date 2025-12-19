import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import compression from 'compression';
import connectDB from './config/db.js';
import { startKeepAlive, warmupDatabase } from './utils/keepAlive.js';

// Load environment variables
dotenv.config();

// Initialize app first
const app = express();

// Connect to MongoDB and start services
connectDB()
  .then(async () => {
    console.log('✅ MongoDB connected successfully');
    
    // Wait a bit for connection to fully establish
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Warm up database after connection
    await warmupDatabase();
    
    // Start keep-alive service in production
    if (process.env.NODE_ENV === 'production') {
      startKeepAlive();
    }
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
  });

// Middleware - CORS with proper configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.CLIENT_URL || 'http://localhost:3000'] 
    : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(compression()); // Compress all responses
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
import authRoutes from './routes/auth.routes.js';
import incidentRoutes from './routes/incident.routes.js';
import userRoutes from './routes/user.routes.js';
import placesRoutes from './routes/places.routes.js';
import distanceRoutes from './routes/distance.routes.js';

app.use('/api/auth', authRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/places', placesRoutes);
app.use('/api/distance', distanceRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: err.message || 'Server Error' 
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
