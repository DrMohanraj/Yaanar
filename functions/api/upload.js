// நிர்வாகி மட்டும்: படம் பதிவேற்றம் → public/assets/img/uploads/ (GitHub commit)
import { SITE_DIR, ghPut, json, requireAdmin } from "../_lib/util.js";

export async function onRequestPost({ request, env }) {
  const deny = await requireAdmin(request, env);
  if (deny) return deny;
  try {
    const { name, data } = await request.json();           // data: base64 (JPEG/PNG/WebP)
    if (!data || data.length > 6_000_000) return json({ error: "படம் மிகப் பெரியது (≈4MB வரை)" }, 413);
    const ext = (String(name).match(/\.(jpe?g|png|webp)$/i) || [, "jpg"])[1].toLowerCase().replace("jpeg", "jpg");
    const slug = String(name).replace(/\.[^.]+$/, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "photo";
    const file = `${Date.now().toString(36)}-${slug}.${ext}`;
    await ghPut(env, `${SITE_DIR}/assets/img/uploads/${file}`, { base64: data, message: `admin: upload ${file}` });
    return json({ url: `/assets/img/uploads/${file}` });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}
