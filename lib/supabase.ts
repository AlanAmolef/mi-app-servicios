import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://wobpqdnnmaxgnkpvbzbh.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvYnBxZG5ubWF4Z25rcHZiemJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyMTcwMTQsImV4cCI6MjA5MTc5MzAxNH0.ou4zNZ78aKN8pVLPVHb9Us0aGkaZflkEQwzdb21xNzI";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);