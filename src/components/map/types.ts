export interface Profile {
  username: string | null;
  avatar_url: string | null;
}

export interface Location {
  id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  updated_at: string;
  is_active?: boolean;
  profiles?: Profile;
}