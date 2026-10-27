import { setCookie } from "../../_lib/util.js";

export async function onRequestGet({ request, env }) {
  if (!env.GITHUB_CLIENT_ID) return new Response("GITHUB_CLIENT_ID அமைக்கப்படவில்லை", { status: 500 });
  const url = new URL(request.url);
  const state = crypto.randomUUID();
  const auth = new URL("https://github.com/login/oauth/authorize");
  auth.searchParams.set("client_id", env.GITHUB_CLIENT_ID);
  auth.searchParams.set("redirect_uri", `${url.origin}/api/auth/callback`);
  auth.searchParams.set("scope", "read:user");
  auth.searchParams.set("state", state);
  return new Response(null, { status: 302, headers: { Location: auth.toString(), "Set-Cookie": setCookie("yaanar_state", state, 600, "/api/auth") } });
}
