// நிர்வாகி மட்டும்: தேடல் குறியீட்டைப் புதுப்பிக்கும்
//  1) public/data/search-index.json  — சொல் அடிப்படைத் தேடலுக்கான பகுதிகள்
//  2) public/data/embeddings.json    — Cloudflare Workers AI (bge-m3) வெக்டர்கள் (AI தேடலுக்கு)
import { SITE_DIR, ghGet, ghPut, json, requireAdmin } from "../_lib/util.js";

const MODEL = "@cf/baai/bge-m3";
const BATCH = 40;

export async function onRequestPost({ request, env }) {
  const deny = await requireAdmin(request, env);
  if (deny) return deny;
  try {
    const src = await ghGet(env, `${SITE_DIR}/data/interviews.json`);
    if (!src) return json({ error: "interviews.json கிடைக்கவில்லை" }, 404);
    const { interviews } = JSON.parse(src.text);
    const chunks = interviews.flatMap((iv) => (iv.qa || []).map((x, i) => ({ id: `${iv.id}#${i + 1}`, iid: iv.id, n: i + 1, q: x.q || "", a: x.a || "", hl: x.hl || "" })));

    // 1) சொல் குறியீடு
    const idx = await ghGet(env, `${SITE_DIR}/data/search-index.json`);
    await ghPut(env, `${SITE_DIR}/data/search-index.json`, {
      text: JSON.stringify({ version: 1, built: new Date().toISOString(), chunks }),
      sha: idx?.sha, message: "admin: reindex (search-index)",
    });

    // 2) AI வெக்டர்கள்
    let embedded = 0, aiNote = "";
    if (env.AI) {
      const items = [];
      for (let i = 0; i < chunks.length; i += BATCH) {
        const part = chunks.slice(i, i + BATCH);
        const res = await env.AI.run(MODEL, { text: part.map((c) => `${c.q}\n${c.a}`.slice(0, 1200)) });
        part.forEach((c, k) => {
          const v = res.data[k];
          const norm = Math.hypot(...v) || 1;
          items.push({ id: c.id, v: v.map((x) => Math.round((x / norm) * 127)) }); // int8 அளவில் சுருக்கம்
        });
        embedded += part.length;
      }
      const emb = await ghGet(env, `${SITE_DIR}/data/embeddings.json`);
      await ghPut(env, `${SITE_DIR}/data/embeddings.json`, {
        text: JSON.stringify({ model: MODEL, dim: items[0]?.v.length || 0, built: new Date().toISOString(), items }),
        sha: emb?.sha, message: "admin: reindex (embeddings)",
      });
    } else {
      aiNote = "AI binding இல்லை; சொல் குறியீடு மட்டும் புதுப்பிக்கப்பட்டது.";
    }

    // 3) AI Search (ஆய்வாளர் உதவி): ஒவ்வொரு கேள்வி–பதிலும் R2-ல் ஒரு .md கோப்பு → <id>/q-NN.md
    let r2 = 0;
    if (env.INTERVIEWS_BUCKET) {
      const keep = new Set();
      for (const iv of interviews) {
        const by = (iv.interviewers || []).filter(Boolean).join(", ");
        for (const [i, x] of (iv.qa || []).entries()) {
          if (!(x.q || x.a)) continue;
          const key = `${iv.id}/q-${String(i + 1).padStart(2, "0")}.md`;
          keep.add(key);
          const md = [
            `# ${iv.name} — ${iv.title || ""}`,
            `எழுத்தாளர்: ${iv.name}${iv.period ? ` (${iv.period})` : ""} · வகை: ${iv.category || ""} · நேர்காணல் நாள்: ${iv.date || ""}${by ? ` · நேர்கண்டவர்: ${by}` : ""}`,
            "",
            `## கேள்வி ${i + 1}: ${x.q || ""}`,
            "",
            x.a || "",
          ].join("\n");
          await env.INTERVIEWS_BUCKET.put(key, md, { httpMetadata: { contentType: "text/markdown; charset=utf-8" } });
          r2++;
        }
      }
      // நீக்கப்பட்ட கேள்விகள் / நேர்காணல்களின் பழைய கோப்புகளை அகற்று
      let cursor;
      do {
        const page = await env.INTERVIEWS_BUCKET.list({ cursor });
        const stale = page.objects.map((o) => o.key).filter((k) => !keep.has(k));
        if (stale.length) await env.INTERVIEWS_BUCKET.delete(stale);
        cursor = page.truncated ? page.cursor : undefined;
      } while (cursor);
    } else {
      aiNote += (aiNote ? "\n" : "") + "R2 bucket (INTERVIEWS_BUCKET) இணைக்கப்படவில்லை; ஆய்வாளர் உதவிக்கான கோப்புகள் எழுதப்படவில்லை.";
    }
    return json({ ok: true, chunks: chunks.length, embedded, r2, note: aiNote });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}
