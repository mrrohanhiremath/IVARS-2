# Google Maps API Setup Guide

## Overview
The Emergency Alert System uses Google Maps API to fetch real-time nearby emergency resources (hospitals, police stations, fire stations) based on incident locations.

## How to Get Your Google Maps API Key

### Step 1: Create a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. Click "Select a project" → "New Project"
4. Enter project name (e.g., "Emergency-Alert-System")
5. Click "Create"

### Step 2: Enable Required APIs
1. In the Google Cloud Console, go to "APIs & Services" → "Library"
2. Search for and enable the following APIs:
   - **Maps JavaScript API**
   - **Places API**
   - **Geocoding API**
   - **Directions API** (optional, for routing)

### Step 3: Create API Key
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "API Key"
3. Copy the generated API key
4. Click "Edit API key" to configure restrictions (recommended)

### Step 4: Configure API Key Restrictions (Recommended)
For security, restrict your API key:

**Application Restrictions:**
- Select "HTTP referrers (web sites)"
- Add your allowed domains:
  - `http://localhost:3000/*`
  - `http://localhost:5173/*` (Vite dev server)
  - Your production domain (e.g., `https://yourdomain.com/*`)

**API Restrictions:**
- Select "Restrict key"
- Choose the APIs you enabled:
  - Maps JavaScript API
  - Places API
  - Geocoding API

### Step 5: Add API Key to Your Project
1. Open `.env` file in your project root
2. Replace `YOUR_GOOGLE_MAPS_API_KEY_HERE` with your actual API key:
   ```
   VITE_GOOGLE_MAPS_API_KEY=AIzaSyD-xxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
3. Save the file
4. Restart your development server

## Features Powered by Google Maps API

### 1. **Real-Time Nearby Resources**
When an incident is viewed on the map, the system automatically:
- Searches for hospitals within 5km radius
- Finds nearby police stations
- Locates fire stations in the vicinity
- Calculates actual distances
- Displays them in order of proximity

### 2. **Interactive Resource Cards**
Each resource card shows:
- Resource name and address
- Real distance from incident
- Click to view on Google Maps
- Navigate button for turn-by-turn directions

### 3. **Emergency Response Optimization**
The system helps responders by:
- Identifying the closest emergency facilities
- Providing navigation options
- Enabling quick communication with facilities
- Highlighting critical resources during emergencies

## API Usage & Billing

### Free Tier
Google provides a generous free tier:
- **$200 free credit** per month
- Places API: ~50,000 requests/month free
- Maps JavaScript API: Unlimited map loads

### Cost Optimization Tips
1. **Use API key restrictions** to prevent unauthorized use
2. **Cache results** when possible
3. **Limit search radius** (currently set to 5km)
4. **Monitor usage** in Google Cloud Console

## Troubleshooting

### "API key not configured" Warning
- Make sure you've added the API key to `.env` file
- Restart your development server after adding the key
- Check that the variable name is exactly `VITE_GOOGLE_MAPS_API_KEY`

### "No nearby resources found"
- Verify your API key is valid
- Check if Places API is enabled in Google Cloud Console
- Ensure the incident location has valid coordinates
- Try increasing the search radius in the code

### CORS Errors
- The system uses `allorigins.win` as a proxy to handle CORS
- If blocked, consider setting up your own backend proxy
- For production, implement server-side API calls

### "This API project is not authorized"
- Check API key restrictions match your domain
- Ensure Places API is enabled for your project
- Verify billing is enabled (even for free tier)

## Alternative: Server-Side Implementation

For better security and to avoid CORS issues, consider implementing the Places API on your backend:

```javascript
// In your server/controllers/incident.controller.js
import axios from 'axios';

export const getNearbyResources = async (req, res) => {
  const { lat, lng } = req.query;
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  
  try {
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json`,
      {
        params: {
          location: `${lat},${lng}`,
          radius: 5000,
          type: 'hospital',
          key: apiKey
        }
      }
    );
    
    res.json({ success: true, data: response.data.results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
```

## Support
For issues with Google Maps API:
- [Google Maps Platform Documentation](https://developers.google.com/maps/documentation)
- [Places API Documentation](https://developers.google.com/maps/documentation/places/web-service)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/google-maps-api)
