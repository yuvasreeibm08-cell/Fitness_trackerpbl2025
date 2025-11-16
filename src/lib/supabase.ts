import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Workout {
  id: string;
  user_id: string;
  name: string;
  duration_minutes: number;
  calories_burned: number;
  notes: string;
  date: string;
  created_at: string;
}

export interface DailyStat {
  id: string;
  user_id: string;
  date: string;
  steps: number;
  calories_burned: number;
  created_at: string;
  updated_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  goal_type: string;
  target_value: number;
  current_value: number;
  timeframe: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
