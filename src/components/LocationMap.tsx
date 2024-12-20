import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap, Popup } from 'react-leaflet';
import { toast } from 'sonner';
import { Loader2, Compass, Copy, Share2, Eye, EyeOff } from 'lucide-react';
import { useSession } from '@supabase/auth-helpers-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
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
    avatar_url: string | null;
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
  const [isSharing, setIsSharing] = useState(false);
  const [locationInterval, setLocationInterval] = useState<number | null>(null);

  const updateLocation = async (latitude: number, longitude: number) => {
    if (!session?.user) return;

    try {
      const { error } = await supabase
        .from('locations')
        .upsert({
          user_id: session.user.id,
          latitude,
          longitude,
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating location:', error);
      toast.error('Failed to update location');
    }
  };

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
        await updateLocation(latitude, longitude);
        setLoading(false);
      },
      (error) => {
        toast.error('Unable to retrieve your location');
        setLoading(false);
      }
    );
  };

  const toggleLocationSharing = async () => {
    if (!session?.user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_sharing_location: !isSharing })
        .eq('id', session.user.id);

      if (error) throw error;

      setIsSharing(!isSharing);
      
      if (!isSharing) {
        getLocation();
        const interval = window.setInterval(getLocation, 10000); // Update every 10 seconds
        setLocationInterval(interval);
        toast.success('Location sharing enabled');
      } else {
        if (locationInterval) {
          clearInterval(locationInterval);
          setLocationInterval(null);
        }
        toast.success('Location sharing disabled');
      }
    } catch (error) {
      console.error('Error toggling location sharing:', error);
      toast.error('Failed to update location sharing settings');
    }
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
    if (session?.user) {
      // Get initial sharing status
      supabase
        .from('profiles')
        .select('is_sharing_location')
        .eq('id', session.user.id)
        .single()
        .then(({ data, error }) => {
          if (!error && data) {
            setIsSharing(data.is_sharing_location);
            if (data.is_sharing_location) {
              getLocation();
              const interval = window.setInterval(getLocation, 10000);
              setLocationInterval(interval);
            }
          }
        });
    }

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
            .select('*, profiles(username, avatar_url)')
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
      if (locationInterval) {
        clearInterval(locationInterval);
      }
      supabase.removeChannel(channel);
    };
  }, [session]);

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
              <div className="flex flex-col items-center gap-2">
                {loc.profiles?.avatar_url && (
                  <img
                    src={loc.profiles.avatar_url}
                    alt={loc.profiles?.username || 'User'}
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <span>{loc.profiles?.username || 'Unknown user'}</span>
                <span className="text-sm text-gray-500">
                  Last updated: {new Date(loc.updated_at).toLocaleTimeString()}
                </span>
              </div>
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
        <div className="bg-white p-4 rounded-lg shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <Switch
              checked={isSharing}
              onCheckedChange={toggleLocationSharing}
              aria-label="Toggle location sharing"
            />
            <span className="text-sm">
              {isSharing ? 'Sharing location' : 'Location sharing off'}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <Button
              onClick={getLocation}
              className="w-full"
              disabled={loading}
              size="sm"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Compass className="h-4 w-4" />
              )}
              <span className="ml-2">Update location</span>
            </Button>
            <Button
              onClick={copyLocation}
              className="w-full"
              disabled={!position}
              variant="outline"
              size="sm"
            >
              <Copy className="h-4 w-4" />
              <span className="ml-2">Copy coordinates</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationMap;