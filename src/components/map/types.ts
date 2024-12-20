export interface Location {
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