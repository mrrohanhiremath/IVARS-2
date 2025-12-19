import axios from 'axios';
import mongoose from 'mongoose';

// Keep server and database warm with periodic pings
export const startKeepAlive = () => {
  const SERVER_URL = process.env.SERVER_URL || 'http://localhost:5000';
  const PING_INTERVAL = 14 * 60 * 1000; // 14 minutes (free tier sleeps after 15 min)

  console.log('🔄 Keep-alive service started');

  // Ping server every 14 minutes to prevent cold starts
  setInterval(async () => {
    try {
      await axios.get(`${SERVER_URL}/api/health`, { timeout: 5000 });
      console.log('💚 Keep-alive ping successful');
    } catch (error) {
      console.log('⚠️ Keep-alive ping failed:', error.message);
    }
  }, PING_INTERVAL);
};

// Warm up database connections on startup
export const warmupDatabase = async () => {
  try {
    // Wait for connection to be ready
    if (mongoose.connection.readyState !== 1) {
      console.log('⏳ Waiting for database connection...');
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Connection timeout')), 10000);
        mongoose.connection.once('open', () => {
          clearTimeout(timeout);
          resolve();
        });
      });
    }
    
    // Execute a simple query to warm up the connection
    if (mongoose.connection.db) {
      await mongoose.connection.db.admin().ping();
      console.log('🔥 Database warmed up successfully');
    } else {
      console.log('⚠️ Database connection not fully established');
    }
  } catch (error) {
    console.error('⚠️ Database warmup failed:', error.message);
  }
};
