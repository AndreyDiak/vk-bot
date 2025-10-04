import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Missing Supabase configuration. Please check your environment variables."
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Database types for events
export const EVENTS_TABLE = "events";
export const REGISTRATIONS_TABLE = "event_registrations";
