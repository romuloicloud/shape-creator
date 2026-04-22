import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session?.user_id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  return NextResponse.json({ key: process.env.GEMINI_API_KEY });
}
