import { createClient } from "@supabase/supabase-js";
import 'dotenv/config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSupabase() {
  console.log("Testing Supabase connection...");
  
  const { data, error } = await supabase.from('profiles').select('*').limit(1);
  if (error) {
    console.error("Error fetching profiles:", error.message);
  } else {
    console.log("Profiles data:", data);
  }

  const { data: photos, error: pErr } = await supabase.from('user_photos').select('*').limit(1);
  if (pErr) {
    console.error("Error fetching user_photos:", pErr.message);
  } else {
    console.log("User photos data:", photos);
  }
}

testSupabase();
