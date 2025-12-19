import axios from 'axios';

// In-memory cache for distance calculations
const cache = new Map();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes (traffic changes more frequently)

export const getDistance = async (req, res) => {
  try {
    const { originLat, originLng, destLat, destLng } = req.query;

    if (!originLat || !originLng || !destLat || !destLng) {
      return res.status(400).json({ error: 'Origin and destination coordinates are required' });
    }

    // Create cache key
    const cacheKey = `${parseFloat(originLat).toFixed(3)},${parseFloat(originLng).toFixed(3)}-${parseFloat(destLat).toFixed(3)},${parseFloat(destLng).toFixed(3)}`;
    
    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log(`Distance Cache HIT for ${cacheKey}`);
      return res.json(cached.data);
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ error: 'Google Maps API key not configured' });
    }

    const origin = `${originLat},${originLng}`;
    const destination = `${destLat},${destLng}`;

    console.log(`Fetching distance from ${origin} to ${destination}`);

    const url = `https://maps.googleapis.com/maps/api/distancematrix/json`;
    
    const response = await axios.get(url, {
      params: {
        origins: origin,
        destinations: destination,
        mode: 'driving',
        departure_time: 'now',
        key: apiKey
      }
    });

    console.log(`Distance Matrix API response status: ${response.data.status}`);

    if (response.data.status === 'REQUEST_DENIED' || response.data.status === 'INVALID_REQUEST') {
      return res.status(400).json({ 
        error: 'Google Distance Matrix API error',
        status: response.data.status,
        message: response.data.error_message 
      });
    }

    if (response.data.status === 'OK' && response.data.rows[0]?.elements[0]) {
      const element = response.data.rows[0].elements[0];
      
      if (element.status === 'OK') {
        const responseData = {
          distance: element.distance,
          duration: element.duration,
          duration_in_traffic: element.duration_in_traffic || element.duration,
          status: 'OK'
        };
        
        // Store in cache
        cache.set(cacheKey, {
          data: responseData,
          timestamp: Date.now()
        });
        
        // Clean old cache entries (keep last 100)
        if (cache.size > 100) {
          const firstKey = cache.keys().next().value;
          cache.delete(firstKey);
        }
        
        console.log(`Distance Cache MISS for ${cacheKey} - Stored in cache`);
        console.log(`ETA: ${responseData.duration.text} (${responseData.distance.text})`);
        
        return res.json(responseData);
      }
    }

    // If we get here, the API didn't return valid data
    res.status(500).json({ 
      error: 'Could not calculate distance',
      status: response.data.status 
    });
  } catch (error) {
    console.error('Error fetching distance:', error);
    
    // Return 429 if it's a rate limit error from Google
    if (error.response && error.response.status === 429) {
      return res.status(429).json({ 
        error: 'Google API rate limit exceeded',
        message: 'Please try again in a few minutes',
        retryAfter: 60
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to fetch distance',
      message: error.message 
    });
  }
};
