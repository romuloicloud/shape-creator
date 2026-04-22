import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    
    // Attempt to register the user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error || !data.user || !data.session) {
      return NextResponse.json({ error: error?.message || "Erro no cadastro. Tente outra senha ou email." }, { status: 401 });
    }

    // Initialize session automatically if registration logs them in
    const session = await getSession();
    session.user_id = data.user.id;
    session.email = data.user.email;
    session.access_token = data.session.access_token;
    session.refresh_token = data.session.refresh_token;
    await session.save();

    return NextResponse.json({ ok: true, user_id: data.user.id, accessToken: data.session.access_token, refreshToken: data.session.refresh_token });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
