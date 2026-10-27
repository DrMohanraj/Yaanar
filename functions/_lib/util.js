// பொதுப் பணிகள்: session cookie (HMAC கையொப்பம்), GitHub contents API
const enc = new TextEncoder();
const dec = new TextDecoder();

export const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...headers } });

const b64url = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const unb64url = (s) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));

async function hmac(secret, data) {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
  return key;
}
export async function sign(secret, payload) {
  const body = b64url(enc.encode(JSON.stringify(payload)));
  const sig = await crypto.subtle.sign("HMAC", await hmac(secret), enc.encode(body));
  return `${body}.${b64url(sig)}`;
}
export async function verify(secret, token) {
  if (!token || !token.includes(".")) return null;
  const [body, sig] = token.split(".");
  const ok = await crypto.subtle.verify("HMAC", await hmac(secret), unb64url(sig), enc.encode(body));
  if (!ok) return null;
  const payload = JSON.parse(dec.decode(unb64url(body)));
  return payload.exp && payload.exp > Date.now() / 1000 ? payload : null;
}

export function cookie(request, name) {
  const m = (request.headers.get("Cookie") || "").match(new RegExp("(?:^|;\\s*)" + name + "=([^;]+)"));
  return m ? m[1] : null;
}
export const setCookie = (name, value, maxAge, path = "/") =>
  `${name}=${value}; Path=${path}; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;

export const allowedUsers = (env) => (env.ALLOWED_USERS || "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);

/** நிர்வாகி உள்நுழைந்திருந்தால் {login}; இல்லையெனில் null */
export async function getSession(request, env) {
  if (!env.SESSION_SECRET) return null;
  const p = await verify(env.SESSION_SECRET, cookie(request, "yaanar_session"));
  if (!p || !allowedUsers(env).includes(String(p.login).toLowerCase())) return null;
  return p;
}
export async function requireAdmin(request, env) {
  const s = await getSession(request, env);
  return s ? null : json({ error: "unauthorized" }, 401);
}

/* ---------- GitHub contents API ---------- */
const utf8ToB64 = (str) => {
  const bytes = enc.encode(str); let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
};
const b64ToUtf8 = (b64) => dec.decode(Uint8Array.from(atob(b64.replace(/\n/g, "")), (c) => c.charCodeAt(0)));

const gh = (env, path, init = {}) =>
  fetch(`https://api.github.com/repos/${env.GITHUB_REPO}/contents/${path.split("/").map(encodeURIComponent).join("/")}${init.method && init.method !== "GET" ? "" : `?ref=${env.GITHUB_BRANCH || "main"}`}`, {
    ...init,
    headers: { Authorization: `Bearer ${env.GITHUB_TOKEN}`, Accept: "application/vnd.github+json", "User-Agent": "yaanar-admin", "X-GitHub-Api-Version": "2022-11-28", ...(init.headers || {}) },
  });

export async function ghGet(env, path) {
  const r = await gh(env, path);
  if (r.status === 404) return null;
  if (!r.ok) throw new Error("GitHub " + r.status + " " + (await r.text()));
  const j = await r.json();
  return { sha: j.sha, text: b64ToUtf8(j.content) };
}
export async function ghPut(env, path, { text, base64, sha, message }) {
  const r = await gh(env, path, {
    method: "PUT",
    body: JSON.stringify({ message, content: base64 ?? utf8ToB64(text), branch: env.GITHUB_BRANCH || "main", ...(sha ? { sha } : {}) }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error(j.message || "GitHub " + r.status); e.status = r.status; throw e; }
  return j.content.sha;
}
export const SITE_DIR = "public"; // GitHub repo-வில் தளக் கோப்புகள் இருக்கும் அடைவு
