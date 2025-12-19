import { useEffect, useState, useRef } from 'react';
import { APIProvider, Map as GoogleMap, AdvancedMarker, InfoWindow, useMap } from '@vis.gl/react-google-maps';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Incident {
  id: string;
  reportId: string;
  location: string;
  coordinates: { lat: number; lng: number };
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: string;
  description: string;
}

interface LiveIncidentMapProps {
  incidents: Incident[];
  height?: string;
}

// Get marker color based on severity
const getMarkerColor = (severity: string) => {
  const colors = {
    low: '#22c55e',      // green
    medium: '#eab308',   // yellow
    high: '#f97316',     // orange
    critical: '#ef4444'  // red
  };
  return colors[severity as keyof typeof colors] || '#ef4444';
};

// Custom marker component with severity-based coloring
function IncidentMarker({ 
  incident, 
  onClick,
  isSelected 
}: { 
  incident: Incident; 
  onClick: () => void;
  isSelected: boolean;
}) {
  const color = getMarkerColor(incident.severity);
  
  return (
    <>
      <AdvancedMarker
        position={{ lat: incident.coordinates.lat, lng: incident.coordinates.lng }}
        onClick={onClick}
      >
        <div style={{ position: 'relative', cursor: 'pointer' }}>
          <svg width="30" height="40" viewBox="0 0 30 40" xmlns="http://www.w3.org/2000/svg">
            <path 
              d="M15 0C8.925 0 4 4.925 4 11c0 8.25 11 24 11 24s11-15.75 11-24c0-6.075-4.925-11-11-11z" 
              fill={color} 
              stroke="#ffffff" 
              strokeWidth="2"
            />
            <circle cx="15" cy="11" r="4" fill="#ffffff"/>
          </svg>
          <div style={{
            position: 'absolute',
            top: '-8px',
            right: '-8px',
            background: color,
            color: 'white',
            borderRadius: '50%',
            width: '20px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 'bold',
            border: '2px solid white',
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
          }}>!</div>
        </div>
      </AdvancedMarker>
      
      {isSelected && (
        <InfoWindow
          position={{ lat: incident.coordinates.lat, lng: incident.coordinates.lng }}
          onCloseClick={onClick}
        >
          <div style={{ minWidth: '200px' }}>
            <h3 style={{ fontWeight: 'bold', marginBottom: '8px', color: '#1f2937' }}>
              {incident.reportId}
            </h3>
            <div style={{ marginBottom: '4px' }}>
              <span style={{ fontWeight: 600 }}>Location:</span> {incident.location}
            </div>
            <div style={{ marginBottom: '4px' }}>
              <span style={{ fontWeight: 600 }}>Status:</span>{' '}
              <span style={{
                padding: '2px 8px',
                borderRadius: '9999px',
                fontSize: '12px',
                backgroundColor: incident.status === 'pending' ? '#fef3c7' : incident.status === 'active' ? '#dbeafe' : '#d1fae5',
                color: incident.status === 'pending' ? '#92400e' : incident.status === 'active' ? '#1e40af' : '#065f46'
              }}>
                {incident.status}
              </span>
            </div>
            <div style={{ marginBottom: '4px' }}>
              <span style={{ fontWeight: 600 }}>Severity:</span>{' '}
              <span style={{
                padding: '2px 8px',
                borderRadius: '9999px',
                fontSize: '12px',
                backgroundColor: 
                  incident.severity === 'low' ? '#d1fae5' :
                  incident.severity === 'medium' ? '#fef3c7' :
                  incident.severity === 'high' ? '#fed7aa' :
                  '#fee2e2',
                color:
                  incident.severity === 'low' ? '#065f46' :
                  incident.severity === 'medium' ? '#92400e' :
                  incident.severity === 'high' ? '#9a3412' :
                  '#991b1b'
              }}>
                {incident.severity}
              </span>
            </div>
            <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #e5e7eb' }}>
              <p style={{ fontSize: '13px', color: '#4b5563' }}>{incident.description}</p>
            </div>
          </div>
        </InfoWindow>
      )}
    </>
  );
}

// Component to handle map fitting
function MapController({ incidents }: { incidents: Incident[] }) {
  const map = useMap();
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (!map || incidents.length === 0 || hasInitialized.current) return;

    const bounds = new google.maps.LatLngBounds();
    incidents.forEach(incident => {
      if (incident.coordinates?.lat && incident.coordinates?.lng) {
        bounds.extend({ lat: incident.coordinates.lat, lng: incident.coordinates.lng });
      }
    });

    map.fitBounds(bounds, { padding: { top: 50, bottom: 50, left: 50, right: 50 } });
    hasInitialized.current = true;
  }, [map, incidents]);

  return null;
}

// Leaflet fallback component
function LeafletIncidentMap({ incidents, height = '500px' }: LiveIncidentMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.Marker[]>([]);

  const createLeafletMarkerIcon = (severity: string) => {
    const color = getMarkerColor(severity);

    return L.divIcon({
      className: 'custom-div-icon',
      html: `
        <div style="position: relative;">
          <svg width="30" height="40" viewBox="0 0 30 40" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 0C8.925 0 4 4.925 4 11c0 8.25 11 24 11 24s11-15.75 11-24c0-6.075-4.925-11-11-11z" 
                  fill="${color}" 
                  stroke="#ffffff" 
                  stroke-width="2"/>
            <circle cx="15" cy="11" r="4" fill="#ffffff"/>
          </svg>
          <div style="
            position: absolute;
            top: -8px;
            right: -8px;
            background: ${color};
            color: white;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: bold;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          ">!</div>
        </div>
      `,
      iconSize: [30, 40],
      iconAnchor: [15, 40],
      popupAnchor: [0, -40]
    });
  };

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize map only once
    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current).setView([20.5937, 78.9629], 5);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(mapRef.current);
    }

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add markers for each incident
    if (incidents && incidents.length > 0) {
      const bounds: L.LatLngExpression[] = [];

      incidents.forEach((incident) => {
        if (incident.coordinates?.lat && incident.coordinates?.lng) {
          const { lat, lng } = incident.coordinates;
          bounds.push([lat, lng]);

          const marker = L.marker([lat, lng], {
            icon: createLeafletMarkerIcon(incident.severity)
          }).addTo(mapRef.current!);

          const popupContent = `
            <div style="min-width: 200px;">
              <h3 style="font-weight: bold; margin-bottom: 8px; color: #1f2937;">${incident.reportId}</h3>
              <div style="margin-bottom: 4px;">
                <span style="font-weight: 600;">Location:</span> ${incident.location}
              </div>
              <div style="margin-bottom: 4px;">
                <span style="font-weight: 600;">Status:</span> 
                <span style="
                  padding: 2px 8px;
                  border-radius: 9999px;
                  font-size: 12px;
                  background-color: ${incident.status === 'pending' ? '#fef3c7' : incident.status === 'active' ? '#dbeafe' : '#d1fae5'};
                  color: ${incident.status === 'pending' ? '#92400e' : incident.status === 'active' ? '#1e40af' : '#065f46'};
                ">${incident.status}</span>
              </div>
              <div style="margin-bottom: 4px;">
                <span style="font-weight: 600;">Severity:</span> 
                <span style="
                  padding: 2px 8px;
                  border-radius: 9999px;
                  font-size: 12px;
                  background-color: ${
                    incident.severity === 'low' ? '#d1fae5' :
                    incident.severity === 'medium' ? '#fef3c7' :
                    incident.severity === 'high' ? '#fed7aa' :
                    '#fee2e2'
                  };
                  color: ${
                    incident.severity === 'low' ? '#065f46' :
                    incident.severity === 'medium' ? '#92400e' :
                    incident.severity === 'high' ? '#9a3412' :
                    '#991b1b'
                  };
                ">${incident.severity}</span>
              </div>
              <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb;">
                <p style="font-size: 13px; color: #4b5563;">${incident.description}</p>
              </div>
            </div>
          `;

          marker.bindPopup(popupContent);
          markersRef.current.push(marker);
        }
      });

      // Fit map to show all markers
      if (bounds.length > 0) {
        mapRef.current?.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      }
    }

    return () => {
      markersRef.current.forEach(marker => marker.remove());
    };
  }, [incidents]);

  return (
    <div 
      ref={mapContainerRef} 
      style={{ height, width: '100%', borderRadius: '8px', overflow: 'hidden' }}
      className="shadow-lg"
    />
  );
}

// Google Maps component
function GoogleIncidentMap({ incidents, height = '500px' }: LiveIncidentMapProps) {
  const [selectedIncident, setSelectedIncident] = useState<string | null>(null);
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  const handleMarkerClick = (incidentId: string) => {
    setSelectedIncident(prev => prev === incidentId ? null : incidentId);
  };

  return (
    <div style={{ height, width: '100%', borderRadius: '8px', overflow: 'hidden' }} className="shadow-lg">
      <APIProvider apiKey={apiKey}>
        <GoogleMap
          defaultCenter={{ lat: 20.5937, lng: 78.9629 }}
          defaultZoom={5}
          mapId="live-incident-map"
          gestureHandling="greedy"
        >
          <MapController incidents={incidents} />
          
          {incidents.map((incident) => (
            incident.coordinates?.lat && incident.coordinates?.lng && (
              <IncidentMarker
                key={incident.id}
                incident={incident}
                onClick={() => handleMarkerClick(incident.id)}
                isSelected={selectedIncident === incident.id}
              />
            )
          ))}
        </GoogleMap>
      </APIProvider>
    </div>
  );
}

export default function LiveIncidentMap(props: LiveIncidentMapProps) {
  const [useGoogleMaps, setUseGoogleMaps] = useState(true);
  const [googleMapsError, setGoogleMapsError] = useState(false);
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    // Check if Google Maps API key is available
    if (!apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
      setUseGoogleMaps(false);
      return;
    }

    // Listen for Google Maps API errors
    const handleError = (event: ErrorEvent) => {
      if (event.message && (
        event.message.includes('Google Maps') ||
        event.message.includes('RefererNotAllowedMapError') ||
        event.message.includes('ApiNotActivatedMapError') ||
        event.message.includes('InvalidKeyMapError')
      )) {
        console.warn('Google Maps failed, falling back to OpenStreetMap:', event.message);
        setGoogleMapsError(true);
        setUseGoogleMaps(false);
      }
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, [apiKey]);

  // Use Leaflet if Google Maps is disabled or errored
  if (!useGoogleMaps || googleMapsError) {
    return <LeafletIncidentMap {...props} />;
  }

  // Try Google Maps first
  return <GoogleIncidentMap {...props} />;
}
