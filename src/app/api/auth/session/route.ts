import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  
  if (!session.user_id) {
    return NextResponse.json({ error: "No session" }, { status: 401 });
  }

  return NextResponse.json({
    user: {
      id: session.user_id,
      email: session.email,
    },
    accessToken: session.access_token,
    refreshToken: session.refresh_token
  });
}
