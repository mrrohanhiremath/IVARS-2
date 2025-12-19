
import { useState, useEffect } from 'react';
import Header from '../../components/feature/Header';
import Card from '../../components/base/Card';
import Button from '../../components/base/Button';
import { incidentAPI } from '../../services/incident.service';
import LiveIncidentMap from '../../components/feature/LiveIncidentMap';
import Map from '../../components/base/Map';

interface Incident {
  id: string;
  reportId: string;
  name: string;
  location: string;
  coordinates: { lat: number; lng: number };
  description: string;
  status: 'pending' | 'active' | 'resolved';
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  responderAssigned?: string;
  vehicleNo?: string;
  contact: string;
  estimatedResponseTime?: string;
}

interface Responder {
  id: string;
  name: string;
  type: 'police' | 'ambulance' | 'fire';
  status: 'available' | 'busy' | 'offline';
  location: string;
  contact: string;
}

interface NearbyResource {
  name: string;
  type: 'hospital' | 'police' | 'fire';
  distance: string;
  address: string;
  place_id: string;
  location: { lat: number; lng: number };
  is_open?: boolean;
  rating?: number;
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'incidents' | 'responders' | 'analytics'>('overview');
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [responders, setResponders] = useState<Responder[]>([]);
  const [selectedIncident, _setSelectedIncident] = useState<any>(null);
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [mapIncident, setMapIncident] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [nearbyResources, setNearbyResources] = useState<NearbyResource[]>([]);
  const [loadingResources, setLoadingResources] = useState(false);
  const [showNavigateModal, setShowNavigateModal] = useState(false);
  const [selectedResource, setSelectedResource] = useState<NearbyResource | null>(null);
  const [resourcesCache, setResourcesCache] = useState<Record<string, { data: NearbyResource[], timestamp: number }>>({});

  useEffect(() => {
    fetchIncidents();
  }, []);

  const fetchIncidents = async () => {
    try {
      const response = await incidentAPI.getIncidents();
      if (response.success) {
        // Transform backend data to match frontend interface
        const transformedIncidents = response.data.map((incident: any) => ({
          id: incident._id,
          reportId: incident.reportId,
          name: incident.name,
          location: incident.location,
          coordinates: incident.coordinates,
          description: incident.description,
          status: incident.status,
          severity: incident.severity,
          timestamp: incident.createdAt,
          vehicleNo: incident.vehicleNo || '',
          contact: incident.contact,
          responderAssigned: incident.responderAssigned?.name || '',
          estimatedResponseTime: incident.estimatedResponseTime || ''
        }));
        setIncidents(transformedIncidents);
      }
    } catch (error) {
      console.error('Failed to fetch incidents:', error);
    }
  };

  // Fetch real responders data
  useEffect(() => {
    fetchResponders();
    
    // Auto-refresh responders every 10 seconds if on responders tab
    const interval = setInterval(() => {
      if (activeTab === 'responders') {
        fetchResponders();
      }
    }, 10000);
    
    return () => clearInterval(interval);
  }, [activeTab]);

  const fetchResponders = async () => {
    try {
      const { userAPI } = await import('../../services/user.service');
      const response = await userAPI.getResponders();
      console.log('Responders API response:', response);
      if (response.success) {
        // Transform backend data to match frontend interface
        const transformedResponders = response.data.map((responder: any) => {
          console.log('Responder raw data:', {
            name: responder.name,
            responderType: responder.responderType,
            responderStatus: responder.responderStatus
          });
          
          return {
            id: responder._id,
            name: responder.name,
            type: responder.responderType || 'ambulance', // Default to ambulance if not specified
            status: responder.responderStatus || 'offline',
            location: responder.location || 'Not specified',
            contact: responder.contact || responder.email
          };
        });
        console.log('Transformed responders:', transformedResponders);
        setResponders(transformedResponders);
      }
    } catch (error) {
      console.error('Failed to fetch responders:', error);
      // Fallback to empty array if fetch fails
      setResponders([]);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getResponderStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'busy': return 'bg-red-100 text-red-800';
      case 'offline': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredIncidents = incidents.filter(incident => {
    const statusMatch = filterStatus === 'all' || incident.status === filterStatus;
    const severityMatch = filterSeverity === 'all' || incident.severity === filterSeverity;
    return statusMatch && severityMatch;
  });

  const updateIncidentStatus = async (incidentId: string, newStatus: 'pending' | 'active' | 'resolved') => {
    try {
      const response = await incidentAPI.updateIncident(incidentId, { status: newStatus });
      if (response.success) {
        setIncidents(prev => prev.map(incident => 
          incident.id === incidentId ? { ...incident, status: newStatus } : incident
        ));
        alert(`Incident status updated to ${newStatus}`);
      }
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Failed to update incident status');
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const stats = {
    totalIncidents: incidents.length,
    activeIncidents: incidents.filter(i => i.status === 'active').length,
    pendingIncidents: incidents.filter(i => i.status === 'pending').length,
    resolvedToday: incidents.filter(i => i.status === 'resolved').length,
    averageResponseTime: '12 minutes',
    availableResponders: responders.filter(r => r.status === 'available').length
  };

  const handleViewOnMap = (incident: any) => {
    setMapIncident(incident);
    setIsMapModalOpen(true);
    fetchNearbyResources(incident.coordinates.lat, incident.coordinates.lng);
  };

  const fetchNearbyResources = async (lat: number, lng: number) => {
    setLoadingResources(true);
    setNearbyResources([]);
    
    try {
      // Create cache key from coordinates (rounded to 3 decimals = ~100m precision)
      const cacheKey = `${lat.toFixed(3)},${lng.toFixed(3)}`;
      const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
      
      // Check cache first
      const cached = resourcesCache[cacheKey];
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log('Using cached resources for:', cacheKey);
        setNearbyResources(cached.data);
        setLoadingResources(false);
        return;
      }
      
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      const useGooglePlaces = apiKey && apiKey !== 'YOUR_GOOGLE_MAPS_API_KEY_HERE';
      
      let resources: NearbyResource[] = [];
      const searchRadius = 10000;
      
      console.log('Searching for resources near:', { lat, lng, radius: searchRadius, method: useGooglePlaces ? 'Google Places' : 'Overpass API' });
      
      if (useGooglePlaces) {
        // Try Google Places API first
        try {
          resources = await searchNearbyPlacesWithGoogle(lat, lng, searchRadius);
          console.log('Google Places API: Total resources found:', resources.length);
        } catch (error) {
          console.warn('Google Places API failed, falling back to Overpass API:', error);
          resources = await searchNearbyPlacesWithOverpass(lat, lng, searchRadius);
        }
      } else {
        // Use Overpass API directly if no Google API key
        resources = await searchNearbyPlacesWithOverpass(lat, lng, searchRadius);
      }
      
      // Sort by score (open status + distance + rating)
      resources.sort((a, b) => {
        const scoreA = (a as any).score || 0;
        const scoreB = (b as any).score || 0;
        return scoreB - scoreA;
      });
      
      // Ensure balanced mix: 4 hospitals, 1 police, 1 fire
      const hospitals = resources.filter(r => r.type === 'hospital').slice(0, 4);
      const police = resources.filter(r => r.type === 'police').slice(0, 1);
      const fire = resources.filter(r => r.type === 'fire').slice(0, 1);
      
      const balancedResources = [...hospitals, ...police, ...fire];
      const finalResources = balancedResources.slice(0, 6);
      
      // Cache the results
      setResourcesCache(prev => {
        const newCache = { ...prev };
        newCache[cacheKey] = { data: finalResources, timestamp: Date.now() };
        
        // Keep only last 20 cache entries to prevent memory bloat
        const cacheKeys = Object.keys(newCache);
        if (cacheKeys.length > 20) {
          delete newCache[cacheKeys[0]];
        }
        
        return newCache;
      });
      
      setNearbyResources(finalResources);
    } catch (error) {
      console.error('Failed to fetch nearby resources:', error);
    } finally {
      setLoadingResources(false);
    }
  };

  // Google Places API method (via backend proxy)
  const searchNearbyPlacesWithGoogle = async (lat: number, lng: number, radius: number): Promise<NearbyResource[]> => {
    const resources: NearbyResource[] = [];
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    
    const types = [
      { type: 'hospital', resourceType: 'hospital' as const },
      { type: 'police', resourceType: 'police' as const },
      { type: 'fire_station', resourceType: 'fire' as const }
    ];
    
    for (const { type, resourceType } of types) {
      try {
        const response = await fetch(
          `${apiUrl}/places/nearby?lat=${lat}&lng=${lng}&radius=${radius}&type=${type}`
        );
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        
        if (data.error) {
          throw new Error(`Google Places API error: ${data.error}`);
        }
        
        if (data.status === 'REQUEST_DENIED' || data.status === 'INVALID_REQUEST') {
          throw new Error(`Google Places API error: ${data.status}`);
        }
        
        if (data.results && Array.isArray(data.results)) {
          console.log(`Google Places: Found ${data.results.length} ${type}(s)`);
          
          if (data.results.length === 0) {
            console.warn(`No ${type} found in area, may need to increase radius or check data availability`);
          }
          
          resources.push(...data.results.slice(0, 5).map((place: any) => ({
            name: place.name,
            type: resourceType,
            distance: calculateDistance(
              lat,
              lng,
              place.geometry.location.lat,
              place.geometry.location.lng
            ),
            address: place.vicinity || place.formatted_address || 'Address not available',
            place_id: place.place_id,
            location: place.geometry.location,
            is_open: place.is_open,
            rating: place.rating
          })));
        }
      } catch (error) {
        console.error(`Google Places API error for ${type}:`, error);
        throw error; // Re-throw to trigger fallback
      }
    }
    
    console.log(`Total resources from Google Places: ${resources.length} (hospitals, police, fire stations)`);
    return resources;
  };

  // Overpass API fallback method
  const searchNearbyPlacesWithOverpass = async (lat: number, lng: number, radius: number): Promise<NearbyResource[]> => {
    const resources: NearbyResource[] = [];
    
    console.log('Using Overpass API fallback...');
    
    // Fetch hospitals
    const hospitals = await searchNearbyPlaces(lat, lng, 'hospital', radius);
    console.log('Found hospitals:', hospitals.length);
    resources.push(...hospitals.map((place: any) => ({
      name: place.name,
      type: 'hospital' as const,
      distance: place.distance,
      address: place.vicinity || place.formatted_address || '',
      place_id: place.place_id,
      location: place.geometry.location,
      is_open: place.is_open,
      rating: place.rating
    })));
    
    // Fetch police stations
    const policeStations = await searchNearbyPlaces(lat, lng, 'police', radius);
    console.log('Found police stations:', policeStations.length);
    resources.push(...policeStations.map((place: any) => ({
      name: place.name,
      type: 'police' as const,
      distance: place.distance,
      address: place.vicinity || place.formatted_address || '',
      place_id: place.place_id,
      location: place.geometry.location,
      is_open: place.is_open,
      rating: place.rating
    })));
    
    // Fetch fire stations
    const fireStations = await searchNearbyPlaces(lat, lng, 'fire_station', radius);
    console.log('Found fire stations:', fireStations.length);
    resources.push(...fireStations.map((place: any) => ({
      name: place.name,
      type: 'fire' as const,
      distance: place.distance,
      address: place.vicinity || place.formatted_address || '',
      place_id: place.place_id,
      location: place.geometry.location,
      is_open: place.is_open,
      rating: place.rating
    })));
    
    return resources;
  };

  const searchNearbyPlaces = async (lat: number, lng: number, type: string, radius: number) => {
    try {
      const radiusMeters = radius;
      let query = '';
      
      // Build different queries based on type to search multiple tags
      if (type === 'hospital') {
        query = `
          [out:json][timeout:25];
          (
            node["amenity"="hospital"](around:${radiusMeters},${lat},${lng});
            way["amenity"="hospital"](around:${radiusMeters},${lat},${lng});
            node["amenity"="clinic"](around:${radiusMeters},${lat},${lng});
            way["amenity"="clinic"](around:${radiusMeters},${lat},${lng});
            node["healthcare"](around:${radiusMeters},${lat},${lng});
            way["healthcare"](around:${radiusMeters},${lat},${lng});
          );
          out center;
        `;
      } else if (type === 'police') {
        query = `
          [out:json][timeout:25];
          (
            node["amenity"="police"](around:${radiusMeters},${lat},${lng});
            way["amenity"="police"](around:${radiusMeters},${lat},${lng});
          );
          out center;
        `;
      } else if (type === 'fire_station') {
        query = `
          [out:json][timeout:25];
          (
            node["amenity"="fire_station"](around:${radiusMeters},${lat},${lng});
            way["amenity"="fire_station"](around:${radiusMeters},${lat},${lng});
          );
          out center;
        `;
      }
      
      const overpassUrl = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
      
      console.log(`Fetching ${type} from Overpass API...`);
      const response = await fetch(overpassUrl);
      
      if (!response.ok) {
        console.error(`Overpass API error: ${response.status} ${response.statusText}`);
        return [];
      }
      
      const data = await response.json();
      console.log(`Overpass API response for ${type}:`, data);
      
      if (data.elements && Array.isArray(data.elements) && data.elements.length > 0) {
        // Process results and calculate distances
        const results = data.elements.map((element: any) => {
          const elementLat = element.lat || element.center?.lat;
          const elementLng = element.lon || element.center?.lon;
          
          if (!elementLat || !elementLng) return null;
          
          const distance = calculateDistance(lat, lng, elementLat, elementLng);
          
          return {
            name: element.tags?.name || `${type.replace('_', ' ')} (Unnamed)`,
            distance,
            vicinity: element.tags?.['addr:street'] || element.tags?.['addr:city'] || 'Address not available',
            formatted_address: [
              element.tags?.['addr:street'],
              element.tags?.['addr:city'],
              element.tags?.['addr:postcode']
            ].filter(Boolean).join(', ') || 'Address not available',
            place_id: `osm-${element.type}-${element.id}`,
            geometry: {
              location: {
                lat: elementLat,
                lng: elementLng
              }
            }
          };
        }).filter(Boolean);
        
        return results.slice(0, 5);
      }
      
      console.warn(`No ${type} found in area`);
      return [];
    } catch (error) {
      console.error(`Failed to fetch ${type}:`, error);
      return [];
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): string => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distanceKm = R * c;
    const distanceMi = distanceKm * 0.621371;
    return distanceMi.toFixed(1);
  };

  const handleGetDirections = (incident: any) => {
    const { lat, lng } = incident.coordinates;
    const destination = `${lat},${lng}`;
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`;
    window.open(googleMapsUrl, '_blank');
  };

  const calculateETA = async (destinationLat: number, destinationLng: number): Promise<string> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve('ETA unavailable');
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude: originLat, longitude: originLng } = position.coords;
          
          try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            
            // Use backend proxy for Google Distance Matrix API
            const response = await fetch(
              `${apiUrl}/distance/calculate?originLat=${originLat}&originLng=${originLng}&destLat=${destinationLat}&destLng=${destinationLng}`
            );
            
            if (response.ok) {
              const data = await response.json();
              
              if (data.status === 'OK' && data.duration) {
                const durationSeconds = data.duration.value;
                const durationMinutes = Math.round(durationSeconds / 60);
                
                if (durationMinutes < 1) {
                  resolve('< 1 min');
                } else if (durationMinutes < 60) {
                  resolve(`${durationMinutes} min`);
                } else {
                  const hours = Math.floor(durationMinutes / 60);
                  const mins = durationMinutes % 60;
                  resolve(`${hours}h ${mins}m`);
                }
                return;
              }
            }
            
            // Fallback calculation if API fails
            const R = 6371;
            const dLat = (destinationLat - originLat) * Math.PI / 180;
            const dLon = (destinationLng - originLng) * Math.PI / 180;
            const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                     Math.cos(originLat * Math.PI / 180) * Math.cos(destinationLat * Math.PI / 180) *
                     Math.sin(dLon/2) * Math.sin(dLon/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            const distance = R * c;
            const roadDistance = distance * 1.4;
            const timeInMinutes = Math.round((roadDistance / 60) * 60);
            
            if (timeInMinutes < 1) {
              resolve('< 1 min');
            } else if (timeInMinutes < 60) {
              resolve(`~${timeInMinutes} min`);
            } else {
              const hours = Math.floor(timeInMinutes / 60);
              const mins = timeInMinutes % 60;
              resolve(`~${hours}h ${mins}m`);
            }
          } catch (error) {
            console.error('ETA calculation error:', error);
            resolve('ETA unavailable');
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          resolve('ETA unavailable');
        }
      );
    });
  };

  const handleAssignResponder = async (incident: any) => {
    try {
      const userData = localStorage.getItem('user');
      if (!userData) {
        alert('Please login to assign yourself');
        return;
      }
      
      // Check if already assigned to someone else
      if (incident.responderAssigned) {
        alert('This incident is already being handled by another responder');
        return;
      }
      
      // Calculate real-time ETA
      const eta = await calculateETA(incident.coordinates.lat, incident.coordinates.lng);
      
      const user = JSON.parse(userData);
      const response = await incidentAPI.updateIncident(incident.id, {
        responderAssigned: user._id || user.id,
        status: 'active',
        estimatedResponseTime: eta
      });

      if (response.success) {
        alert(`You are now handling this incident! ETA: ${eta}`);
        setIsMapModalOpen(false);
        fetchIncidents(); // Refresh the incidents list
      }
    } catch (error) {
      console.error('Failed to assign responder:', error);
      alert('Failed to assign responder. Please try again.');
    }
  };

  const handleContactReporter = (incident: any) => {
    if (incident.contact) {
      window.location.href = `tel:${incident.contact}`;
    } else {
      alert('Reporter contact information not available');
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <i className="ri-alarm-warning-line text-red-600 text-lg sm:text-xl"></i>
            </div>
            <div className="ml-3">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Active Incidents</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.activeIncidents}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <i className="ri-team-line text-blue-600 text-xl"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Available Responders</p>
              <p className="text-2xl font-bold text-gray-900">{stats.availableResponders}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <i className="ri-time-line text-green-600 text-xl"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
              <p className="text-2xl font-bold text-gray-900">{stats.averageResponseTime}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <i className="ri-check-double-line text-yellow-600 text-xl"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Resolved Today</p>
              <p className="text-2xl font-bold text-gray-900">{stats.resolvedToday}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Live Map */}
        <div className="lg:col-span-2">
          <Card>
            <div className="flex justify-between items-center mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Live Incident Map</h3>
              <Button variant="secondary" size="sm" className="text-xs sm:text-sm">
                <i className="ri-fullscreen-line sm:mr-2"></i>
                <span className="hidden sm:inline">Fullscreen</span>
              </Button>
            </div>
            <LiveIncidentMap incidents={incidents} height="500px" />
          </Card>
        </div>

        {/* Recent Incidents */}
        <div>
          <Card>
            <div className="flex justify-between items-center mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Recent Incidents</h3>
              <Button variant="secondary" size="sm" onClick={() => setActiveTab('incidents')} className="text-xs sm:text-sm">
                <i className="ri-eye-line sm:mr-2"></i>
                <span className="hidden sm:inline">View All</span>
                <span className="sm:hidden">All</span>
              </Button>
            </div>
            <div className="space-y-3">
              {incidents.slice(0, 5).map((incident) => (
                <div key={incident.id} className="p-3 border border-gray-200 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(incident.severity)}`}>
                        {incident.severity}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">{formatTime(incident.timestamp)}</span>
                  </div>
                  <p className="text-xs sm:text-sm font-medium text-gray-900 mb-1">{incident.reportId}</p>
                  <p className="text-xs text-gray-600 mb-2 line-clamp-1">{incident.location}</p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button 
                      size="sm" 
                      variant="secondary"
                      onClick={() => handleViewOnMap(incident)}
                      className="w-full sm:w-auto text-xs"
                    >
                      <i className="ri-map-pin-line mr-2"></i>
                      View on Map
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );

  const renderIncidents = () => (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 sm:gap-4">
          <div className="flex items-center space-x-2">
            <label className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">Status:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-2 sm:px-3 py-1 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent flex-1 sm:flex-none"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">Severity:</label>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="border border-gray-300 rounded-lg px-2 sm:px-3 py-1 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent flex-1 sm:flex-none"
            >
              <option value="all">All</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <Button variant="secondary" size="sm" className="w-full sm:w-auto text-xs sm:text-sm">
            <i className="ri-refresh-line mr-2"></i>
            Refresh
          </Button>
        </div>
      </Card>

      {/* Incidents List */}
      <div className="grid gap-4 sm:gap-6">
        {filteredIncidents.map((incident) => (
          <Card key={incident.id} className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start justify-between mb-3 sm:mb-4 gap-3">
              <div className="flex-1 w-full">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">{incident.reportId}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(incident.status)}`}>
                    {incident.status}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(incident.severity)}`}>
                    {incident.severity}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                  <div className="space-y-1">
                    <p><strong>Reporter:</strong> {incident.name}</p>
                    <p><strong>Contact:</strong> {incident.contact}</p>
                    <p><strong>Vehicle:</strong> {incident.vehicleNo || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="line-clamp-1"><strong>Location:</strong> {incident.location}</p>
                    <p><strong>Time:</strong> {formatTime(incident.timestamp)}</p>
                    <p className="line-clamp-1"><strong>Assigned:</strong> {incident.responderAssigned || 'Unassigned'}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <p className="text-gray-700 mb-4">{incident.description}</p>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                {incident.status === 'pending' && (
                  <Button
                    size="sm"
                    onClick={() => updateIncidentStatus(incident.id, 'active')}
                    className="flex-1 sm:flex-none text-xs sm:text-sm"
                  >
                    <i className="ri-play-line mr-2"></i>
                    Activate
                  </Button>
                )}
                {incident.status === 'active' && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => updateIncidentStatus(incident.id, 'resolved')}
                    className="flex-1 sm:flex-none text-xs sm:text-sm"
                  >
                    <i className="ri-check-line mr-2"></i>
                    Resolve
                  </Button>
                )}
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={() => handleViewOnMap(incident)}
                  className="flex-1 sm:flex-none text-xs sm:text-sm"
                >
                  <i className="ri-map-pin-line sm:mr-2"></i>
                  <span className="hidden sm:inline">View on Map</span>
                  <span className="sm:hidden">Map</span>
                </Button>
                <Button 
                  size="sm"
                  onClick={() => handleGetDirections(incident)}
                  className="flex-1 sm:flex-none text-xs sm:text-sm"
                >
                  <i className="ri-navigation-line sm:mr-2"></i>
                  <span className="hidden sm:inline">Get Directions</span>
                  <span className="sm:hidden">Directions</span>
                </Button>
              </div>
              {incident.estimatedResponseTime && (
                <span className="text-xs sm:text-sm text-blue-600 font-medium text-center sm:text-right">
                  ETA: {incident.estimatedResponseTime}
                </span>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderResponders = () => (
    <div className="space-y-4 sm:space-y-6">
      <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">Emergency Responders</h2>

      {responders.length === 0 ? (
        <Card className="p-12 text-center">
          <i className="ri-team-line text-6xl text-gray-300 mb-4"></i>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Responders Found</h3>
          <p className="text-gray-600 mb-4">
            No emergency responders have registered yet. Create a new account with "Emergency Responder" role to get started.
          </p>
          <Button onClick={() => window.location.href = '/'}>
            <i className="ri-user-add-line mr-2"></i>
            Register Responder
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {responders.map((responder) => (
          <Card key={responder.id} className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="flex items-center min-w-0 flex-1">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0 ${
                  responder.type === 'police' ? 'bg-blue-100' :
                  responder.type === 'ambulance' ? 'bg-red-100' : 'bg-orange-100'
                }`}>
                  <i className={`text-lg sm:text-2xl ${
                    responder.type === 'police' ? 'ri-police-car-line text-blue-600' :
                    responder.type === 'ambulance' ? 'ri-hospital-line text-red-600' :
                    'ri-fire-line text-orange-600'
                  }`}></i>
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-semibold text-gray-900 truncate">{responder.name}</h3>
                  <p className="text-xs sm:text-sm text-gray-600 capitalize">{responder.type}</p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${getResponderStatusColor(responder.status)}`}>
                {responder.status}
              </span>
            </div>
            
            <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
              <p className="truncate"><strong>Location:</strong> {responder.location}</p>
              <p className="truncate"><strong>Contact:</strong> {responder.contact}</p>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="secondary" 
                size="sm" 
                className="flex-1 text-xs sm:text-sm"
                onClick={() => {
                  // Check if contact is email or phone
                  if (responder.contact.includes('@')) {
                    window.location.href = `mailto:${responder.contact}?subject=Emergency Alert - Urgent`;
                  } else {
                    window.location.href = `sms:${responder.contact}?body=Emergency Alert - Need immediate assistance`;
                  }
                }}
              >
                <i className="ri-message-line sm:mr-2"></i>
                <span className="hidden sm:inline">Message</span>
              </Button>
              <Button 
                variant="secondary" 
                size="sm" 
                className="flex-1 text-xs sm:text-sm"
                onClick={() => {
                  // If location coordinates are available, use them; otherwise search by location name
                  if (responder.location && responder.location !== 'Not specified') {
                    const searchQuery = encodeURIComponent(responder.location);
                    window.open(`https://www.google.com/maps/search/?api=1&query=${searchQuery}`, '_blank');
                  } else {
                    alert('Responder location not available');
                  }
                }}
              >
                <i className="ri-map-pin-line sm:mr-2"></i>
                <span className="hidden sm:inline">Track</span>
              </Button>
            </div>
          </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderAnalytics = () => {
    const totalIncidents = incidents.length;
    const resolvedIncidents = incidents.filter(i => i.status === 'resolved').length;
    const resolutionRate = totalIncidents > 0 ? ((resolvedIncidents / totalIncidents) * 100).toFixed(1) : '0';
    const availableCount = responders.filter(r => r.status === 'available').length;
    const busyCount = responders.filter(r => r.status === 'busy').length;
    const totalResponders = responders.length;
    
    // Severity breakdown
    const criticalCount = incidents.filter(i => i.severity === 'critical').length;
    const highCount = incidents.filter(i => i.severity === 'high').length;
    const mediumCount = incidents.filter(i => i.severity === 'medium').length;
    const lowCount = incidents.filter(i => i.severity === 'low').length;

    return (
      <div className="space-y-4 sm:space-y-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          <Card className="p-4 sm:p-6 text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-4">
              <i className="ri-time-line text-xl sm:text-2xl text-blue-600"></i>
            </div>
            <h3 className="text-xs sm:text-sm lg:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">Avg Response Time</h3>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-600">{stats.averageResponseTime}</p>
            <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Based on active incidents</p>
          </Card>

          <Card className="p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="ri-check-double-line text-2xl text-green-600"></i>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Resolution Rate</h3>
            <p className="text-3xl font-bold text-green-600">{resolutionRate}%</p>
            <p className="text-sm text-gray-600">{resolvedIncidents} of {totalIncidents} resolved</p>
          </Card>

          <Card className="p-6 text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="ri-team-line text-2xl text-purple-600"></i>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Responders</h3>
            <p className="text-3xl font-bold text-purple-600">{totalResponders}</p>
            <p className="text-sm text-gray-600">{availableCount} available, {busyCount} busy</p>
          </Card>

          <Card className="p-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="ri-alarm-warning-line text-2xl text-red-600"></i>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Incidents</h3>
            <p className="text-3xl font-bold text-red-600">{totalIncidents}</p>
            <p className="text-sm text-gray-600">{stats.activeIncidents} currently active</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
          <Card className="p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Incident Severity Distribution</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Critical</span>
                  <span className="text-sm font-medium text-red-600">{criticalCount}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-red-600 h-3 rounded-full" style={{ width: `${totalIncidents > 0 ? (criticalCount / totalIncidents) * 100 : 0}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">High</span>
                  <span className="text-sm font-medium text-orange-600">{highCount}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-orange-600 h-3 rounded-full" style={{ width: `${totalIncidents > 0 ? (highCount / totalIncidents) * 100 : 0}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Medium</span>
                  <span className="text-sm font-medium text-yellow-600">{mediumCount}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-yellow-600 h-3 rounded-full" style={{ width: `${totalIncidents > 0 ? (mediumCount / totalIncidents) * 100 : 0}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Low</span>
                  <span className="text-sm font-medium text-green-600">{lowCount}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-green-600 h-3 rounded-full" style={{ width: `${totalIncidents > 0 ? (lowCount / totalIncidents) * 100 : 0}%` }}></div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Responder Status</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Available</span>
                  <span className="text-sm font-medium text-green-600">{availableCount}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-green-600 h-3 rounded-full" style={{ width: `${totalResponders > 0 ? (availableCount / totalResponders) * 100 : 0}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Busy</span>
                  <span className="text-sm font-medium text-red-600">{busyCount}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-red-600 h-3 rounded-full" style={{ width: `${totalResponders > 0 ? (busyCount / totalResponders) * 100 : 0}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Offline</span>
                  <span className="text-sm font-medium text-gray-600">{totalResponders - availableCount - busyCount}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-gray-600 h-3 rounded-full" style={{ width: `${totalResponders > 0 ? ((totalResponders - availableCount - busyCount) / totalResponders) * 100 : 0}%` }}></div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="mb-4 sm:mb-8">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Emergency Response Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-600">Monitor and manage emergency incidents in real-time</p>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-4 sm:mb-8 overflow-x-auto">
          <nav className="-mb-px flex space-x-4 sm:space-x-8 min-w-max">
            {[
              { id: 'overview', name: 'Overview', icon: 'ri-dashboard-line' },
              { id: 'incidents', name: 'Active Incidents', icon: 'ri-alarm-warning-line' },
              { id: 'responders', name: 'Responders', icon: 'ri-team-line' },
              { id: 'analytics', name: 'Analytics', icon: 'ri-bar-chart-line' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-xs sm:text-sm cursor-pointer whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <i className={`${tab.icon} mr-1 sm:mr-2`}></i>
                <span className="hidden sm:inline">{tab.name}</span>
                <span className="sm:hidden">{tab.name.split(' ')[0]}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'incidents' && renderIncidents()}
        {activeTab === 'responders' && renderResponders()}
        {activeTab === 'analytics' && renderAnalytics()}
      </div>

      {/* Incident Details Modal */}
      {isIncidentModalOpen && selectedIncident && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-center mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-2xl font-bold text-gray-900">Incident Details</h2>
                <button
                  onClick={() => setIsIncidentModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <i className="ri-close-line text-xl"></i>
                </button>
              </div>

              <div className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-2 sm:mb-3">Incident Information</h3>
                    <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">ID:</span>
                        <span className="font-medium">{selectedIncident.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Type:</span>
                        <span className="font-medium">{selectedIncident.type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Severity:</span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          selectedIncident.severity === 'Critical' ? 'bg-red-100 text-red-800' :
                          selectedIncident.severity === 'High' ? 'bg-orange-100 text-orange-800' :
                          selectedIncident.severity === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {selectedIncident.severity}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          selectedIncident.status === 'Active' ? 'bg-red-100 text-red-800' :
                          selectedIncident.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {selectedIncident.status}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Time:</span>
                        <span className="font-medium">{selectedIncident.time}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Location</h3>
                    <p className="text-gray-600 mb-3">{selectedIncident.location}</p>
                    <div className="aspect-video bg-gray-200 rounded-lg">
                      <iframe
                        src={`https://maps.google.com/maps?q=${selectedIncident.coordinates.lat},${selectedIncident.coordinates.lng}&z=15&output=embed`}
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        loading="lazy"
                        className="rounded-lg"
                      ></iframe>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Description</h3>
                  <p className="text-gray-600">{selectedIncident.description}</p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Assigned Responders</h3>
                  <div className="space-y-2">
                    {selectedIncident.responders?.map((responder: any, index: number) => (
                      <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          <i className="ri-user-line text-blue-600"></i>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{responder.name}</div>
                          <div className="text-sm text-gray-600">{responder.unit} - {responder.eta}</div>
                        </div>
                      </div>
                    )) || (
                      <p className="text-gray-500 italic">No responders assigned yet</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button onClick={() => handleAssignResponder(selectedIncident)}>
                    <i className="ri-user-add-line mr-2"></i>
                    Assign Responder
                  </Button>
                  <Button variant="secondary" onClick={() => {
                    const newStatus = selectedIncident.status === 'pending' ? 'active' : 'resolved';
                    updateIncidentStatus(selectedIncident.id, newStatus);
                    setIsIncidentModalOpen(false);
                  }}>
                    <i className="ri-edit-line mr-2"></i>
                    Update Status
                  </Button>
                  <Button variant="secondary" onClick={() => handleViewOnMap(selectedIncident)}>
                    <i className="ri-map-pin-line mr-2"></i>
                    View on Map
                  </Button>
                  <Button onClick={() => handleGetDirections(selectedIncident)}>
                    <i className="ri-navigation-line mr-2"></i>
                    Get Directions
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Map Modal */}
      {isMapModalOpen && mapIncident && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg max-w-5xl w-full max-h-[95vh] overflow-y-auto">
            <div className="p-3 sm:p-6">
              <div className="flex justify-between items-start mb-4 sm:mb-6">
                <div className="flex-1 pr-2">
                  <h2 className="text-lg sm:text-2xl font-bold text-gray-900">Incident Location</h2>
                  <p className="text-xs sm:text-base text-gray-600 line-clamp-1">{mapIncident.type} - {mapIncident.location}</p>
                </div>
                <button
                  onClick={() => setIsMapModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <i className="ri-close-line text-xl"></i>
                </button>
              </div>

              <div className="grid lg:grid-cols-3 gap-3 sm:gap-6">
                <div className="lg:col-span-2">
                  <div className="bg-gray-200 rounded-lg" style={{ height: '450px', maxHeight: '60vh' }}>
                    <Map
                      center={[mapIncident.coordinates.lat, mapIncident.coordinates.lng]}
                      zoom={16}
                      markers={[{
                        position: [mapIncident.coordinates.lat, mapIncident.coordinates.lng],
                        popup: `${mapIncident.type} - ${mapIncident.location}`
                      }]}
                      height="100%"
                    />
                  </div>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  <Card>
                    <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-2 sm:mb-3">Incident Details</h3>
                    <div className="space-y-1.5 sm:space-y-2">
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="text-gray-600">ID:</span>
                        <span className="font-medium truncate ml-2">{mapIncident.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Severity:</span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          mapIncident.severity === 'Critical' ? 'bg-red-100 text-red-800' :
                          mapIncident.severity === 'High' ? 'bg-orange-100 text-orange-800' :
                          mapIncident.severity === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {mapIncident.severity}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Time:</span>
                        <span className="font-medium text-xs sm:text-sm">{formatTime(mapIncident.timestamp || mapIncident.time)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Coordinates:</span>
                        <span className="font-medium text-xs">{`${mapIncident.coordinates.lat}, ${mapIncident.coordinates.lng}`}</span>
                      </div>
                    </div>
                  </Card>

                  <Card>
                    <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-2 sm:mb-3">Quick Actions</h3>
                    <div className="space-y-2">
                      <Button 
                        size="sm" 
                        className="w-full text-xs sm:text-sm"
                        onClick={() => handleGetDirections(mapIncident)}
                      >
                        <i className="ri-navigation-line mr-2"></i>
                        Get Directions
                      </Button>
                      {mapIncident.responderAssigned ? (
                        <div className="w-full p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-center">
                          <i className="ri-shield-check-line text-green-600 mr-2"></i>
                          <span className="text-green-800 font-medium">Being Handled</span>
                        </div>
                      ) : (
                        <Button 
                          size="sm" 
                          className="w-full bg-green-600 hover:bg-green-700"
                          onClick={() => handleAssignResponder(mapIncident)}
                        >
                          <i className="ri-hand-heart-line mr-2"></i>
                          I Will Handle
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant="secondary" 
                        className="w-full"
                        onClick={() => handleContactReporter(mapIncident)}
                      >
                        <i className="ri-phone-line mr-2"></i>
                        Contact Reporter
                      </Button>
                    </div>
                  </Card>
                </div>
              </div>

              {/* Nearby Emergency Resources - Below Map */}
              <div className="mt-3 sm:mt-4">
                <Card className="border-t-4 border-blue-600">
                  <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-2 sm:mb-3">Nearby Emergency Resources</h3>
                  {loadingResources ? (
                    <div className="flex items-center justify-center py-4">
                      <i className="ri-loader-4-line animate-spin text-2xl text-blue-600"></i>
                      <span className="ml-2 text-sm text-gray-600">Finding nearby resources...</span>
                    </div>
                  ) : nearbyResources.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                      {nearbyResources.map((resource, index) => (
                        <div 
                          key={index}
                          className={`flex items-start justify-between p-2 sm:p-3 rounded cursor-pointer hover:shadow-md transition ${
                            resource.type === 'hospital' ? 'bg-blue-50 hover:bg-blue-100' :
                            resource.type === 'fire' ? 'bg-red-50 hover:bg-red-100' :
                            'bg-green-50 hover:bg-green-100'
                          }`}
                          onClick={() => {
                            window.open(
                              `https://www.google.com/maps/search/?api=1&query=${resource.location.lat},${resource.location.lng}&query_place_id=${resource.place_id}`,
                              '_blank'
                            );
                          }}
                          title="Click to view on Google Maps"
                        >
                          <div className="flex items-start flex-1">
                            <i className={`${
                              resource.type === 'hospital' ? 'ri-hospital-line text-blue-600' :
                              resource.type === 'fire' ? 'ri-fire-line text-red-600' :
                              'ri-police-car-line text-green-600'
                            } text-lg sm:text-xl mr-2 mt-0.5 flex-shrink-0`}></i>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1">
                                <span className="text-xs sm:text-sm font-medium line-clamp-1">{resource.name}</span>
                                <div className="flex items-center gap-1 flex-wrap">
                                  {resource.is_open !== undefined && resource.is_open !== null && (
                                    <span className={`text-xs px-2 py-1 rounded-full flex items-center ${
                                      resource.is_open 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-red-100 text-red-800'
                                    }`}>
                                      <i className={`${resource.is_open ? 'ri-time-line' : 'ri-close-circle-line'} mr-1`}></i>
                                      {resource.is_open ? 'Open' : 'Closed'}
                                    </span>
                                  )}
                                  {resource.rating && (
                                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full flex items-center">
                                      <i className="ri-star-fill text-yellow-500 mr-1"></i>
                                      {resource.rating}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <span className="text-xs text-gray-600 block mt-1 line-clamp-2">{resource.address}</span>
                              <div className="flex items-center justify-between mt-1.5 sm:mt-2">
                                <span className="text-xs font-semibold text-gray-700">{resource.distance} km</span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedResource(resource);
                                    setShowNavigateModal(true);
                                  }}
                                  className="text-xs text-blue-600 hover:text-blue-800 whitespace-nowrap"
                                >
                                  <i className="ri-navigation-line"></i> Navigate
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      <i className="ri-map-pin-line text-2xl mb-2"></i>
                      <p>No nearby resources found</p>
                      <p className="text-xs mt-1">Try viewing the incident on map</p>
                    </div>
                  )}
                </Card>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigate Origin Selection Modal */}
      {showNavigateModal && selectedResource && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Choose Starting Point</h3>
            <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
              Navigate to <span className="font-semibold line-clamp-1">{selectedResource.name}</span> from:
            </p>
            
            <div className="space-y-2 sm:space-y-3">
              <button
                onClick={() => {
                  window.open(
                    `https://www.google.com/maps/dir/?api=1&destination=${mapIncident.coordinates.lat},${mapIncident.coordinates.lng}`,
                    '_blank'
                  );
                  setShowNavigateModal(false);
                }}
                className="w-full p-3 sm:p-4 border-2 border-red-500 rounded-lg hover:bg-red-50 transition text-left"
              >
                <div className="flex items-center">
                  <i className="ri-map-pin-2-fill text-red-500 text-xl sm:text-2xl mr-2 sm:mr-3 flex-shrink-0"></i>
                  <div className="min-w-0">
                    <div className="text-sm sm:text-base font-semibold">Navigate to Accident Location</div>
                    <div className="text-xs sm:text-sm text-gray-600 line-clamp-1">From my location to {mapIncident.location}</div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => {
                  window.open(
                    `https://www.google.com/maps/dir/?api=1&destination=${selectedResource.location.lat},${selectedResource.location.lng}`,
                    '_blank'
                  );
                  setShowNavigateModal(false);
                }}
                className="w-full p-3 sm:p-4 border-2 border-blue-500 rounded-lg hover:bg-blue-50 transition text-left"
              >
                <div className="flex items-center">
                  <i className={`${
                    selectedResource.type === 'hospital' ? 'ri-hospital-fill text-blue-500' :
                    selectedResource.type === 'fire' ? 'ri-fire-fill text-red-500' :
                    'ri-police-car-fill text-green-500'
                  } text-xl sm:text-2xl mr-2 sm:mr-3 flex-shrink-0`}></i>
                  <div className="min-w-0">
                    <div className="text-sm sm:text-base font-semibold line-clamp-1">Navigate to {selectedResource.name}</div>
                    <div className="text-xs sm:text-sm text-gray-600">From my location • {selectedResource.distance} km</div>
                  </div>
                </div>
              </button>
            </div>

            <button
              onClick={() => setShowNavigateModal(false)}
              className="mt-4 w-full py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
