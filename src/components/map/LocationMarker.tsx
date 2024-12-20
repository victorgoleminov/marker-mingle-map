import { Marker, Popup } from 'react-leaflet';
import { Location } from './types';

interface LocationMarkerProps {
  location: Location;
}

export const LocationMarker = ({ location }: LocationMarkerProps) => {
  return (
    <Marker position={[location.latitude, location.longitude]}>
      <Popup>
        <div className="flex flex-col items-center gap-2">
          {location.profiles?.avatar_url && (
            <img
              src={location.profiles.avatar_url}
              alt={location.profiles?.username || 'User'}
              className="w-8 h-8 rounded-full"
            />
          )}
          <span>{location.profiles?.username || 'Unknown user'}</span>
          <span className="text-sm text-gray-500">
            Last updated: {new Date(location.updated_at).toLocaleTimeString()}
          </span>
        </div>
      </Popup>
    </Marker>
  );
};