import { AUTH_COOKIE, authToken } from "@/lib/auth";

export async function POST(req: Request) {
  const { password } = await req.json();
  if (!process.env.APP_PASSWORD || password !== process.env.APP_PASSWORD) {
    return new Response("Falsches Passwort", { status: 401 });
  }
  const res = new Response(null, { status: 204 });
  res.headers.append(
    "Set-Cookie",
    `${AUTH_COOKIE}=${await authToken()}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${60 * 60 * 24 * 90}`,
  );
  return res;
}
