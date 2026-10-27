// பொது: பொருண்மைத் தேடல் (semantic). கேள்வியை Workers AI மூலம் வெக்டராக்கி, embeddings.json உடன் ஒப்பிடும்.
const MODEL = "@cf/baai/bge-m3";
const MIN_SCORE = 0.45; // இதற்குக் குறைவான ஒற்றுமை காட்டப்படாது (தேவைக்கேற்ப மாற்றலாம்)
const TOP_K = 15;

let cache = null; // isolate-இல் மீண்டும் பயன்படுத்த

export async function onRequestPost({ request, env }) {
  const head = { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" };
  const fail = (status, error) => new Response(JSON.stringify({ error }), { status, headers: head });
  if (!env.AI) return fail(503, "ai_unavailable");

  let q = "";
  try { q = String((await request.json()).q || "").trim().slice(0, 120); } catch { /* ignore */ }
  if (q.length < 2) return fail(400, "query_too_short");

  if (!cache) {
    const r = await env.ASSETS.fetch(new URL("/data/embeddings.json", request.url));
    if (!r.ok) return fail(503, "no_embeddings");
    cache = await r.json();
  }
  if (!cache.items?.length) return fail(503, "empty_embeddings");

  const out = await env.AI.run(MODEL, { text: [q] });
  const qv = out.data[0];
  const qn = Math.hypot(...qv) || 1;
  const results = [];
  for (const it of cache.items) {
    let dot = 0;
    for (let i = 0; i < qv.length; i++) dot += qv[i] * it.v[i];
    const score = dot / (qn * 127);
    if (score >= MIN_SCORE) results.push({ id: it.id, score: Math.round(score * 1000) / 1000 });
  }
  results.sort((a, b) => b.score - a.score);
  return new Response(JSON.stringify({ results: results.slice(0, TOP_K) }), { headers: head });
}
