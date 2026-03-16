import { createClient } from '@supabase/supabase-js';

const CV_SUPABASE_URL = import.meta.env.VITE_CV_SUPABASE_URL;
const CV_SUPABASE_ANON_KEY = import.meta.env.VITE_CV_SUPABASE_ANON_KEY;

// Dedicated client for the CV module edge functions
export const cvSupabase = createClient(CV_SUPABASE_URL, CV_SUPABASE_ANON_KEY);
