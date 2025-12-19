import { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const useServerWarmup = () => {
  const [isWarming, setIsWarming] = useState(true);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const warmupServer = async () => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000); // 8 second timeout

        await axios.get(`${API_URL.replace('/api', '')}/api/health`, {
          signal: controller.signal,
          timeout: 8000
        });

        clearTimeout(timeout);
        setIsReady(true);
        setIsWarming(false);
      } catch (error) {
        console.log('Server warmup in progress...');
        // Retry after 2 seconds
        setTimeout(warmupServer, 2000);
      }
    };

    warmupServer();
  }, []);

  return { isWarming, isReady };
};

// Ping server on app load to wake it up
export const pingServer = async () => {
  try {
    await axios.get(`${API_URL.replace('/api', '')}/api/health`, { timeout: 5000 });
    console.log('✅ Server is awake');
    return true;
  } catch (error) {
    console.log('⚠️ Server warming up...');
    return false;
  }
};
