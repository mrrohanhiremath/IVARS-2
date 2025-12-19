import { APIProvider, Map as GoogleMap, AdvancedMarker, InfoWindow } from '@vis.gl/react-google-maps';
import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default Leaflet marker icon
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapProps {
  center: [number, number];
  zoom?: number;
  markers?: Array<{
    position: [number, number];
    popup?: string;
  }>;
  height?: string;
  onMapClick?: (lat: number, lng: number) => void;
}

// Leaflet click handler
function MapClickHandler({ onMapClick }: { onMapClick?: (lat: number, lng: number) => void }) {
  const map = useMap();

  useEffect(() => {
    if (onMapClick) {
      map.on('click', (e) => {
        onMapClick(e.latlng.lat, e.latlng.lng);
      });
    }

    return () => {
      map.off('click');
    };
  }, [map, onMapClick]);

  return null;
}

// Google Maps iframe fallback (no API key required)
function GoogleMapsIframeFallback({ center, zoom = 13 }: MapProps) {
  return (
    <div style={{ height: '100%', width: '100%' }} className="rounded-lg overflow-hidden border border-gray-300">
      <iframe
        src={`https://maps.google.com/maps?q=${center[0]},${center[1]}&z=${zoom}&output=embed`}
        width="100%"
        height="100%"
        style={{ border: 0 }}
        loading="lazy"
        allowFullScreen
      ></iframe>
    </div>
  );
}

// Google Maps component
function GoogleMapsComponent({ center, zoom = 13, markers = [], height = '400px', onMapClick }: MapProps) {
  const [selectedMarker, setSelectedMarker] = useState<number | null>(null);
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (onMapClick && e.detail.latLng) {
      onMapClick(e.detail.latLng.lat, e.detail.latLng.lng);
    }
  };

  return (
    <div style={{ height, width: '100%' }} className="rounded-lg overflow-hidden border border-gray-300">
      <APIProvider apiKey={apiKey}>
        <GoogleMap
          defaultCenter={{ lat: center[0], lng: center[1] }}
          defaultZoom={zoom}
          mapId="emergency-alert-map"
          onClick={handleMapClick}
          gestureHandling="greedy"
          disableDefaultUI={false}
        >
          {markers.map((marker, index) => (
            <div key={index}>
              <AdvancedMarker
                position={{ lat: marker.position[0], lng: marker.position[1] }}
                onClick={() => setSelectedMarker(index)}
              />
              {selectedMarker === index && marker.popup && (
                <InfoWindow
                  position={{ lat: marker.position[0], lng: marker.position[1] }}
                  onCloseClick={() => setSelectedMarker(null)}
                >
                  <div>{marker.popup}</div>
                </InfoWindow>
              )}
            </div>
          ))}
        </GoogleMap>
      </APIProvider>
    </div>
  );
}

export default function Map(props: MapProps) {
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
        event.message.includes('ApiNotActivatedMapError')
      )) {
        console.warn('Google Maps API failed, falling back to Google Maps iframe:', event.message);
        setGoogleMapsError(true);
        setUseGoogleMaps(false);
      }
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, [apiKey]);

  // Use Google Maps iframe if API key is missing or errored
  if (!useGoogleMaps || googleMapsError) {
    return <GoogleMapsIframeFallback {...props} />;
  }

  // Try Google Maps with API key first
  return <GoogleMapsComponent {...props} />;
}
