// நிர்வாகி மட்டும்: data/site.json, data/interviews.json படிக்க/எழுத (ஒவ்வொரு சேமிப்பும் GitHub commit)
import { SITE_DIR, ghGet, ghPut, json, requireAdmin } from "../_lib/util.js";

const ALLOWED = new Set(["data/site.json", "data/interviews.json"]);

export async function onRequest({ request, env }) {
  const deny = await requireAdmin(request, env);
  if (deny) return deny;
  if (!env.GITHUB_TOKEN || !env.GITHUB_REPO) return json({ error: "GITHUB_TOKEN / GITHUB_REPO அமைக்கப்படவில்லை" }, 500);

  try {
    if (request.method === "GET") {
      const path = new URL(request.url).searchParams.get("path");
      if (!ALLOWED.has(path)) return json({ error: "path not allowed" }, 400);
      const f = await ghGet(env, `${SITE_DIR}/${path}`);
      if (!f) return json({ error: "not found" }, 404);
      return json({ sha: f.sha, data: JSON.parse(f.text) });
    }
    if (request.method === "PUT") {
      const { path, data, sha, message } = await request.json();
      if (!ALLOWED.has(path)) return json({ error: "path not allowed" }, 400);
      if (typeof data !== "object" || data === null) return json({ error: "invalid data" }, 400);
      const newSha = await ghPut(env, `${SITE_DIR}/${path}`, { text: JSON.stringify(data, null, 2) + "\n", sha, message: message || `admin: update ${path}` });
      return json({ sha: newSha });
    }
    return json({ error: "method not allowed" }, 405);
  } catch (e) {
    return json({ error: e.message }, e.status === 409 || e.status === 422 ? 409 : 500);
  }
}
