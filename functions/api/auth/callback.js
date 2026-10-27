import { allowedUsers, cookie, setCookie, sign } from "../../_lib/util.js";

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const back = (q) => new Response(null, { status: 302, headers: { Location: "/admin/" + q, "Set-Cookie": setCookie("yaanar_state", "", 0, "/api/auth") } });
  if (!code || !state || state !== cookie(request, "yaanar_state")) return back("?error=state");

  const tok = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: env.GITHUB_CLIENT_ID, client_secret: env.GITHUB_CLIENT_SECRET, code, redirect_uri: `${url.origin}/api/auth/callback` }),
  }).then((r) => r.json());
  if (!tok.access_token) return back("?error=token");

  const user = await fetch("https://api.github.com/user", {
    headers: { Authorization: `Bearer ${tok.access_token}`, "User-Agent": "yaanar-admin", Accept: "application/vnd.github+json" },
  }).then((r) => r.json());
  const login = String(user.login || "").toLowerCase();
  if (!login || !allowedUsers(env).includes(login)) return back("?error=denied");

  // GitHub token-ஐ சேமிக்கத் தேவையில்லை; அடையாளம் மட்டும் 8 மணி நேர session-ஆக
  const session = await sign(env.SESSION_SECRET, { login, exp: Math.floor(Date.now() / 1000) + 8 * 3600 });
  const res = back("");
  res.headers.append("Set-Cookie", setCookie("yaanar_session", session, 8 * 3600));
  return res;
}
