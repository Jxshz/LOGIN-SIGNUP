
const SUPABASE_URL = 'https://feiluaahiyeqfcqnslij.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZlaWx1YWFoaXllcWZjcW5zbGlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxMTUyMTksImV4cCI6MjA5MDY5MTIxOX0.of18W6hKhdlerr5N0QJJ0EDKgujTJTf1HspED54PQuI';

// Initialize the Supabase client using the global window variable from the CDN
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
