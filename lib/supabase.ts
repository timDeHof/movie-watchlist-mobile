import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// Initialize Supabase with environment variables
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl as string;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase configuration. Please check your app.config.ts');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Types for database
export type Tables = {
  profiles: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    bio: string | null;
    default_privacy_setting: 'public' | 'private';
    updated_at: string;
    created_at: string;
  };
  watchlists: {
    id: string;
    user_id: string;
    title: string;
    description: string;
    privacy_setting: 'public' | 'private';
    created_at: string;
  };
  watchlist_items: {
    id: string;
    watchlist_id: string;
    tmdb_id: number;
    media_type: 'movie' | 'tv';
    watched_status: boolean;
    created_at: string;
  };
  shared_links: {
    id: string;
    watchlist_id: string;
    share_code: string;
    created_at: string;
    expires_at?: string;
  };
};