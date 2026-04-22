import { getIronSession } from "iron-session";
import { cookies } from "next/headers";

export interface SessionData {
  user_id?: string;
  email?: string;
  access_token?: string;
  refresh_token?: string;
}

export const sessionOptions = {
  password: process.env.SESSION_SECRET as string,
  cookieName: "shape_criator_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
  },
};

export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}
