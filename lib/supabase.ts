import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lwrbnavrnohdhwdlsfln.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3cmJuYXZybm9oZGh3ZGxzZmxuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4NDI0MTcsImV4cCI6MjA2ODQxODQxN30.u6s6cFwAGsnVAQ1dXyXOmj5mC9sSMTCa-aLaFjpr4DI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);