import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Button } from '../ui/button';
import { MessageCircle } from 'lucide-react';
import { useState } from 'react';
import { ChatDialog } from '../chat/ChatDialog';
import type { Location } from './types';

interface LocationMarkerProps {
  location: Location;
}

export function LocationMarker({ location }: LocationMarkerProps) {
  const [isChatOpen, setIsChatOpen] = useState(false);

  const customIcon = L.icon({
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  return (
    <>
      <Marker 
        position={[location.latitude, location.longitude]} 
        icon={customIcon}
      >
        <Popup>
          <div className="flex flex-col gap-2">
            <p>{location.profiles?.username || "Unknown user"}</p>
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