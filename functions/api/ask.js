// பொது: ஆய்வாளர் உதவி — Cloudflare AI Search (R2-ல் உள்ள <id>/q-NN.md கோப்புகள்) மூலம் தேடல்
// POST /api/ask   body: { "q": "கேள்வி", "mode": "sources" | "answer" }
//   sources: தொடர்புடைய கேள்வி–பதில் இணைப்புகள் மட்டும் (AI எழுதாது)
//   answer : கிடைத்த பகுதிகளிலிருந்து மட்டும் AI தொகுத்த சுருக்கப் பதில் + மூல இணைப்புகள்
import { json } from "../_lib/util.js";

const MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
const MAX_QUESTION_CHARS = 300;

const SYSTEM_PROMPT = `நீ ஒரு தமிழ் நேர்காணல் இதழின் ஆய்வு உதவியாளர்.
கீழே கொடுக்கப்பட்ட நேர்காணல் பகுதிகளில் உள்ளவற்றை மட்டுமே பயன்படுத்தி, தமிழில் பதில் எழுது.
விதிகள்:
1. பகுதிகளில் இல்லாத எதையும் சேர்க்காதே; ஊகிக்காதே; உன் பொது அறிவைப் பயன்படுத்தாதே.
2. கேள்விக்கான தகவல் பகுதிகளில் இல்லையென்றால், "கொடுக்கப்பட்ட நேர்காணல்களில் இது பற்றிய தகவல் இல்லை" என்று மட்டும் சொல்.
3. ஒவ்வொரு கருத்தின் முடிவிலும் அது எடுக்கப்பட்ட பகுதியின் எண்ணை [1], [2] என்று குறிப்பிடு.
4. நேர்காணப்பட்டவர் சொல்லாத கருத்தை அவர் சொன்னதாக எழுதாதே.
5. பதில் 150 சொற்களுக்குள் இருக்கட்டும்.`;

// "sezhiyan/q-03.md" → { iid: "sezhiyan", n: 3 }
function parseKey(filename = "") {
  const m = String(filename).match(/([^/]+)\/q-(\d+)\.md$/i);
  return m ? { iid: m[1], n: +m[2] } : null;
}

// தேடல் முடிவுகளின் வடிவம் மாறினாலும் உடையாமல்
function normalizeHits(res) {
  const byFile = new Map();
  for (const it of Array.isArray(res?.data) ? res.data : []) {
    const filename = it.filename || it.file_id || "";
    const key = parseKey(filename);
    const text = Array.isArray(it.content)
      ? it.content.map((c) => c.text || "").join(" ").trim()
      : String(it.content || it.text || "").trim();
    if (!key || !text) continue;
    const entry = byFile.get(filename) || { ...key, score: it.score, passages: [] };
    entry.passages.push(text);
    byFile.set(filename, entry);
  }
  return [...byFile.values()];
}

export async function onRequestPost({ request, env }) {
  if (!env.AI) return json({ error: "AI இணைப்பு இல்லை" }, 503);
  let body;
  try { body = await request.json(); } catch { return json({ error: "தவறான கோரிக்கை" }, 400); }

  const q = String(body.q || "").trim();
  const mode = body.mode === "answer" ? "answer" : "sources";
  if (!q || q.length > MAX_QUESTION_CHARS) {
    return json({ error: `கேள்வி 1 முதல் ${MAX_QUESTION_CHARS} எழுத்துகளுக்குள் இருக்க வேண்டும்` }, 400);
  }

  try {
    // 1) தொடர்புடைய கேள்வி–பதில்களைத் தேடுதல்
    const res = await env.AI.autorag(env.AI_SEARCH_NAME || "yaanar-interviews").search({
      query: q,
      rewrite_query: true,
      max_num_results: 6,
      ranking_options: { score_threshold: 0.3 },
    });
    const hits = normalizeHits(res);
    if (!hits.length) return json({ answer: null, sources: [], message: "தொடர்புடைய நேர்காணல் எதுவும் கிடைக்கவில்லை." });

    const sources = hits.map((h, i) => ({ n: i + 1, iid: h.iid, q: h.n, snippet: h.passages[0].slice(0, 300) }));
    if (mode === "sources") return json({ answer: null, sources });

    // 2) AI பதில்: கிடைத்த பகுதிகளை மட்டும் கொடுத்து எழுதச் சொல்லுதல்
    const context = hits.map((h, i) => `[${i + 1}]\n${h.passages.join("\n")}`).join("\n\n");
    const out = await env.AI.run(MODEL, {
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `நேர்காணல் பகுதிகள்:\n${context}\n\nகேள்வி: ${q}` },
      ],
      max_tokens: 700,
    });
    return json({ answer: out?.response || null, sources });
  } catch (err) {
    console.error("ask error:", err);
    return json({ error: "தற்போது தேட இயலவில்லை. சிறிது நேரம் கழித்து முயலுங்கள்." }, 500);
  }
}
