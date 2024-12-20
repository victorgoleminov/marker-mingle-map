import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import { toast } from 'sonner';
import { Loader2, Compass, Copy } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to handle map center updates
const MapUpdater = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
};

const LocationMap = () => {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(false);

  const getLocation = () => {
    setLoading(true);
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setPosition([latitude, longitude]);
        setLoading(false);
        toast.success('Location updated successfully');
      },
      (error) => {
        toast.error('Unable to retrieve your location');
        setLoading(false);
      }
    );
  };

  const copyLocation = () => {
    if (!position) {
      toast.error('No location to copy');
      return;
    }
    const [lat, lng] = position;
    const text = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    navigator.clipboard.writeText(text).then(
      () => toast.success('Location copied to clipboard'),
      () => toast.error('Failed to copy location')
    );
  };

  useEffect(() => {
    getLocation();
  }, []);

  return (
    <div className="relative w-full h-screen">
      <MapContainer
        center={position || [0, 0]}
        zoom={13}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {position && (
          <>
            <Marker position={position} />
            <MapUpdater center={position} />
          </>
        )}
      </MapContainer>

      <button
        onClick={getLocation}
        className="location-button"
        disabled={loading}
        aria-label="Get current location"
      >
        {loading ? (
          <Loader2 className="h-6 w-6 animate-spin" />
        ) : (
          <Compass className="h-6 w-6" />
        )}
      </button>

      <button
        onClick={copyLocation}
        className="copy-button"
        disabled={!position}
        aria-label="Copy location coordinates"
      >
        <Copy className="h-6 w-6" />
      </button>
    </div>
  );
};

export default LocationMap;