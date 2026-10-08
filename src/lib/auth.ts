export const AUTH_COOKIE = "fh_auth";

// Cookie-Wert = SHA-256 des gemeinsamen Passworts; so steht das Passwort selbst nicht im Cookie.
export async function authToken(password = process.env.APP_PASSWORD ?? ""): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`flathunting:${password}`));
  return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, "0")).join("");
}
