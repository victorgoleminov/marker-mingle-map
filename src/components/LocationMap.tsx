import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap, Popup } from 'react-leaflet';
import { toast } from 'sonner';
import { Loader2, Compass, Copy } from 'lucide-react';
import { useSession } from '@supabase/auth-helpers-react';
import { supabase } from '@/integrations/supabase/client';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Location {
  id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  updated_at: string;
  profiles: {
    username: string;
  };
}

const MapUpdater = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
};

const LocationMap = () => {
  const session = useSession();
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);

  const getLocation = () => {
    setLoading(true);
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setPosition([latitude, longitude]);
        
        if (session?.user) {
          try {
            const { error } = await supabase
              .from('locations')
              .upsert({
                user_id: session.user.id,
                latitude,
                longitude,
              });

            if (error) throw error;
            toast.success('Location updated successfully');
          } catch (error) {
            console.error('Error updating location:', error);
            toast.error('Failed to update location');
          }
        }
        
        setLoading(false);
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

    // Subscribe to location updates
    const channel = supabase
      .channel('locations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'locations'
        },
        async () => {
          // Fetch updated locations
          const { data, error } = await supabase
            .from('locations')
            .select('*, profiles(username)')
            .order('updated_at.desc');
          
          if (error) {
            console.error('Error fetching locations:', error);
            return;
          }
          
          setLocations(data);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="relative w-full h-screen">
      <MapContainer
        center={position || [0, 0]}
        zoom={13}
        className="w-full h-full"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {locations.map((loc) => (
          <Marker key={loc.id} position={[loc.latitude, loc.longitude]}>
            <Popup>
              {loc.profiles?.username || 'Unknown user'}
            </Popup>
          </Marker>
        ))}
        {position && (
          <>
            <Marker position={position}>
              <Popup>Your location</Popup>
            </Marker>
            <MapUpdater center={position} />
          </>
        )}
      </MapContainer>

      <div className="absolute bottom-4 right-4 flex flex-col gap-2">
        <button
          onClick={getLocation}
          className="bg-white p-2 rounded-full shadow-lg hover:bg-gray-100"
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
          className="bg-white p-2 rounded-full shadow-lg hover:bg-gray-100"
          disabled={!position}
          aria-label="Copy location coordinates"
        >
          <Copy className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
};

export default LocationMap;