/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/authContext';
import type { UserProfile, Location } from '@/lib/riskEngine';
import { generateNearbyLocation } from '@/lib/riskEngine';

// Default Mumbai coordinates for simulation
const DEFAULT_LAT = 19.076;
const DEFAULT_LNG = 72.8777;

function generateDefaultLocations(baseLat: number, baseLng: number): Location[] {
  return Array.from({ length: 5 }, () => generateNearbyLocation(baseLat, baseLng, 8));
}

function generateDefaultRoute(baseLat: number, baseLng: number): Location[] {
  return Array.from({ length: 6 }, (_, i) => ({
    lat: baseLat + (i * 0.005),
    lng: baseLng + (i * 0.003),
  }));
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (data) {
      // Auto-populate location data if empty
      const recentLocs: any[] = Array.isArray(data.recent_locations) && data.recent_locations.length > 0
        ? data.recent_locations as any[]
        : generateDefaultLocations(DEFAULT_LAT, DEFAULT_LNG);

      const travelRoute: any[] = Array.isArray(data.travel_route) && data.travel_route.length > 0
        ? data.travel_route as any[]
        : generateDefaultRoute(DEFAULT_LAT, DEFAULT_LNG);

      const needsUpdate = (
        (!Array.isArray(data.recent_locations) || data.recent_locations.length === 0) ||
        (!Array.isArray(data.travel_route) || data.travel_route.length === 0) ||
        data.home_lat === 0
      );

      if (needsUpdate) {
        const updates: any = {
          recent_locations: recentLocs,
          travel_route: travelRoute,
          home_lat: DEFAULT_LAT + (Math.random() - 0.5) * 0.1,
          home_lng: DEFAULT_LNG + (Math.random() - 0.5) * 0.1,
          workplace_lat: DEFAULT_LAT + (Math.random() - 0.5) * 0.05,
          workplace_lng: DEFAULT_LNG + (Math.random() - 0.5) * 0.05,
          account_age_days: Math.floor((Date.now() - new Date(data.created_at).getTime()) / 86400000),
        };
        await supabase.from('profiles').update(updates).eq('user_id', user.id);
        setProfile({ ...data, ...updates });
      } else {
        setProfile(data);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return { profile, loading, refetch: fetchProfile };
}

export function useAllProfiles() {
  const [profiles, setProfiles] = useState<any[]>([]);

  useEffect(() => {
    supabase.from('profiles').select('user_id, name, email, mobile').then(({ data }) => {
      if (data) setProfiles(data);
    });
  }, []);

  return profiles;
}
