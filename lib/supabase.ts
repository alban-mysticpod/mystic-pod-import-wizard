import { createClient } from '@supabase/supabase-js';

// Supabase Admin Client (Server-side only)
// Uses SERVICE_ROLE_KEY to bypass RLS
// ⚠️ NEVER expose this client to the frontend
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

// Type definitions for our database
export interface User {
  user_id: string;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserSettings {
  user_id: string;
  default_shop_id: string | null;
  default_preset_id: string | null;
  locale: string | null;
  timezone: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserProfile extends User {
  user_settings: UserSettings | null;
}

