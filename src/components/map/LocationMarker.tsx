import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Button } from '../ui/button';
import { MessageCircle } from 'lucide-react';
import { useState } from 'react';
import { ChatDialog } from '../chat/ChatDialog';
import type { Location } from './types';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

interface LocationMarkerProps {
  location: Location;
}

export function LocationMarker({ location }: LocationMarkerProps) {
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Create a custom div element for the marker
  const markerHtml = document.createElement('div');
  markerHtml.className = 'custom-marker';
  
  // Create the avatar element
  const avatar = document.createElement('div');
  avatar.className = 'w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-lg';
  
  // Create and style the image
  const img = document.createElement('img');
  img.src = location.profiles?.avatar_url || '/placeholder.svg';
  img.className = 'w-full h-full object-cover';
  img.alt = location.profiles?.username || 'User avatar';
  
  // Append elements
  avatar.appendChild(img);
  markerHtml.appendChild(avatar);

  // Create custom icon
  const customIcon = new L.DivIcon({
    html: markerHtml,
    className: 'custom-marker',
    iconSize: L.point(40, 40),
    iconAnchor: L.point(20, 40),
    popupAnchor: L.point(0, -40)
  });

  return (
    <>
      <Marker 
        position={[location.latitude, location.longitude]} 
        icon={customIcon}
      >
        <Popup>
          <div className="flex flex-col items-center gap-2 p-2">
            <Avatar className="w-16 h-16">
              <AvatarImage src={location.profiles?.avatar_url || '/placeholder.svg'} alt={location.profiles?.username || 'User'} />
              <AvatarFallback>{(location.profiles?.username || 'U')[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <p className="font-medium">{location.profiles?.username || "Unknown user"}</p>
            <Button
              onClick={() => setIsChatOpen(true)}
              variant="outline"
              size="sm"
              className="w-full"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Chat
            </Button>
          </div>
        </Popup>
      </Marker>
      
      <ChatDialog
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        recipientId={location.user_id}
        recipientName={location.profiles?.username || "Unknown user"}
      />
    </>
  );
}