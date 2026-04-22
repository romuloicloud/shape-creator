import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function POST() {
  const session = await getSession();
  
  if (session.access_token) {
    /* Set the session on the server client and sign out properly on Supabase */
    await supabase.auth.setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token || "",
    });
    await supabase.auth.signOut();
  }

  session.destroy();
  return NextResponse.json({ ok: true });
}
