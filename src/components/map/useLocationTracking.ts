import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useSession } from '@supabase/auth-helpers-react';
import { supabase } from '@/integrations/supabase/client';
import { Location } from './types';

export const useLocationTracking = () => {
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
        const interval = window.setInterval(getLocation, 10000);
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

  useEffect(() => {
    if (session?.user) {
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

  return {
    position,
    loading,
    locations,
    isSharing,
    getLocation,
    toggleLocationSharing,
  };
};