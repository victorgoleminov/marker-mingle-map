import React from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { LocationMarker } from './map/LocationMarker';
import { MapControls } from './map/MapControls';
import { useLocationTracking } from './map/useLocationTracking';

// Fix for default marker icons in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MapUpdater = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  React.useEffect(() => {
    if (map) {
      map.setView(center);
    }
  }, [center, map]);
  return null;
};

const LocationMap = () => {
  const {
    position,
    loading,
    locations,
    isSharing,
    getLocation,
    toggleLocationSharing,
  } = useLocationTracking();

  // Set default position to a fallback location if no position is available
  const defaultPosition: [number, number] = position || [51.505, -0.09];

  // Filter out inactive locations and the current user's location
  const activeLocations = locations.filter(
    loc => loc.is_active && loc.user_id !== (position ? 'current' : undefined)
  );

  return (
    <div className="relative w-full h-screen">
      <MapContainer
        center={defaultPosition}
        zoom={13}
        className="w-full h-full"
        scrollWheelZoom={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {activeLocations.map((loc) => (
          <LocationMarker key={loc.id} location={loc} />
        ))}
        {position && isSharing && (
          <>
            <LocationMarker
              location={{
                id: 'current',
                user_id: '',
                latitude: position[0],
                longitude: position[1],
                updated_at: new Date().toISOString(),
                is_active: true,
                profiles: {
                  username: 'Your location',
                  avatar_url: null,
                },
              }}
            />
            <MapUpdater center={position} />
          </>
        )}
      </MapContainer>

      <MapControls
        isSharing={isSharing}
        loading={loading}
        position={position}
        onToggleSharing={toggleLocationSharing}
        onUpdateLocation={getLocation}
      />
    </div>
  );
};

export default LocationMap;