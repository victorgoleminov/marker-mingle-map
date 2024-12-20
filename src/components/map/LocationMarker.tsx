import { Marker, Popup } from 'react-leaflet';
import { Location } from './types';
import L from 'leaflet';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface LocationMarkerProps {
  location: Location;
}

export const LocationMarker = ({ location }: LocationMarkerProps) => {
  // Create a custom icon for the marker
  const customIcon = L.divIcon({
    className: 'custom-marker',
    html: `
      <div class="w-12 h-12 rounded-full border-4 border-white shadow-lg overflow-hidden bg-white">
        <img 
          src="${location.profiles?.avatar_url || '/placeholder.svg'}" 
          alt="${location.profiles?.username || 'User'}"
          class="w-full h-full object-cover"
        />
      </div>
    `,
    iconSize: [48, 48],
    iconAnchor: [24, 48],
    popupAnchor: [0, -48]
  });

  return (
    <Marker position={[location.latitude, location.longitude]} icon={customIcon}>
      <Popup>
        <div className="flex flex-col items-center gap-2 p-2">
          <Avatar className="w-16 h-16">
            <AvatarImage 
              src={location.profiles?.avatar_url || undefined} 
              alt={location.profiles?.username || 'User'} 
            />
            <AvatarFallback>
              {location.profiles?.username?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium">{location.profiles?.username || 'Unknown user'}</span>
          <span className="text-sm text-gray-500">
            Last updated: {new Date(location.updated_at).toLocaleTimeString()}
          </span>
        </div>
      </Popup>
    </Marker>
  );
};