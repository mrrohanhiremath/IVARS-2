import axios from 'axios';

// In-memory cache for API responses
const cache = new Map();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

// Rate limiting tracker
const requestTracker = new Map();
const MAX_REQUESTS_PER_MINUTE = 10;

export const getNearbyPlaces = async (req, res) => {
  try {
    const { lat, lng, radius, type } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    // Create cache key
    const cacheKey = `${parseFloat(lat).toFixed(3)},${parseFloat(lng).toFixed(3)},${type}`;
    
    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log(`Cache HIT for ${cacheKey} - Age: ${Math.round((Date.now() - cached.timestamp) / 1000)}s`);
      return res.json(cached.data);
    }
    
    // Rate limiting check
    const now = Date.now();
    const clientKey = req.ip || 'unknown';
    const clientRequests = requestTracker.get(clientKey) || [];
    const recentRequests = clientRequests.filter(time => now - time < 60000);
    
    if (recentRequests.length >= MAX_REQUESTS_PER_MINUTE) {
      console.warn(`Rate limit exceeded for ${clientKey}`);
      return res.status(429).json({ 
        error: 'Too many requests. Please try again later.',
        retryAfter: 60 
      });
    }
    
    requestTracker.set(clientKey, [...recentRequests, now]);

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ error: 'Google Maps API key not configured' });
    }

    const searchRadius = radius || 10000;
    const placeType = type || 'hospital';

    console.log(`Searching for ${placeType} near ${lat},${lng} with radius ${searchRadius}m`);

    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json`;
    
    const response = await axios.get(url, {
      params: {
        location: `${lat},${lng}`,
        radius: searchRadius,
        type: placeType,
        key: apiKey,
        rankby: 'prominence' // Sort by prominence (includes rating)
      }
    });

    console.log(`Google Places API response status: ${response.data.status}`);
    console.log(`Found ${response.data.results?.length || 0} ${placeType}(s) in initial search`);

    if (response.data.status === 'REQUEST_DENIED' || response.data.status === 'INVALID_REQUEST') {
      return res.status(400).json({ 
        error: 'Google Places API error',
        status: response.data.status,
        message: response.data.error_message 
      });
    }

    // Fetch detailed information for each place to get opening hours
    const placesWithDetails = await Promise.all(
      response.data.results.slice(0, 20).map(async (place) => {
        try {
          // Fetch place details to get opening hours
          const detailsResponse = await axios.get(
            `https://maps.googleapis.com/maps/api/place/details/json`,
            {
              params: {
                place_id: place.place_id,
                fields: 'opening_hours,business_status',
                key: apiKey
              }
            }
          );

          const details = detailsResponse.data.result || {};
          const isOpen = details.opening_hours?.open_now ?? null;
          const businessStatus = details.business_status;

          const distance = calculateDistance(
            parseFloat(lat),
            parseFloat(lng),
            place.geometry.location.lat,
            place.geometry.location.lng
          );

          // Enhanced scoring: open status (40%), distance (30%), rating (20%), reviews (10%)
          const distanceScore = Math.max(0, 100 - (distance * 10)); // Closer = higher score
          const ratingScore = (place.rating || 0) * 20; // 5-star = 100 points
          
          // Reviews credibility score - favor places with more reviews
          const reviewCount = place.user_ratings_total || 0;
          let reviewScore = 0;
          if (reviewCount >= 50) reviewScore = 100;
          else if (reviewCount >= 20) reviewScore = 80;
          else if (reviewCount >= 10) reviewScore = 60;
          else if (reviewCount >= 5) reviewScore = 40;
          else if (reviewCount >= 2) reviewScore = 20;
          else reviewScore = 0; // Very suspicious if only 0-1 reviews
          
          // Open status is critical - heavily favor open places
          let openScore = 0;
          if (isOpen === true) {
            openScore = 100; // Currently open
          } else if (isOpen === false) {
            openScore = 0; // Currently closed
          } else {
            openScore = 30; // Unknown status (no hours data)
          }

          // Only consider operational businesses
          if (businessStatus === 'CLOSED_PERMANENTLY' || businessStatus === 'CLOSED_TEMPORARILY') {
            openScore = -100; // Exclude closed businesses
          }

          // Exclude likely fake/unreliable places (1 or fewer reviews)
          if (reviewCount <= 1) {
            openScore = -50; // Heavily penalize suspicious places
          }

          const totalScore = (openScore * 0.4) + (distanceScore * 0.3) + (ratingScore * 0.2) + (reviewScore * 0.1);

          return {
            ...place,
            distance: distance.toFixed(1),
            score: totalScore,
            rating: place.rating || 0,
            user_ratings_total: place.user_ratings_total || 0,
            is_open: isOpen,
            business_status: businessStatus,
            opening_hours: details.opening_hours
          };
        } catch (error) {
          console.error(`Error fetching details for ${place.name}:`, error.message);
          // Return place without details if fetch fails
          const distance = calculateDistance(
            parseFloat(lat),
            parseFloat(lng),
            place.geometry.location.lat,
            place.geometry.location.lng
          );
          return {
            ...place,
            distance: distance.toFixed(1),
            score: 50,
            rating: place.rating || 0,
            is_open: null
          };
        }
      })
    );

    // Sort by score (open status + proximity + rating)
    placesWithDetails.sort((a, b) => b.score - a.score);

    const responseData = {
      ...response.data,
      results: placesWithDetails
    };
    
    // Store in cache
    cache.set(cacheKey, {
      data: responseData,
      timestamp: Date.now()
    });
    
    // Clean old cache entries (keep last 50)
    if (cache.size > 50) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    
    console.log(`Cache MISS for ${cacheKey} - Stored in cache`);

    res.json(responseData);
  } catch (error) {
    console.error('Error fetching nearby places:', error);
    
    // Return 429 if it's a rate limit error from Google
    if (error.response && error.response.status === 429) {
      return res.status(429).json({ 
        error: 'Google API rate limit exceeded',
        message: 'Please try again in a few minutes',
        retryAfter: 120
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to fetch nearby places',
      message: error.message 
    });
  }
};

// Helper function to calculate distance between two points
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distanceKm = R * c;
  return distanceKm; // Return distance in kilometers
};
