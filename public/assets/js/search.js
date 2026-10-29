/* ஆய்வுத் தேடல் — சொல் வடிவங்கள் (சாதி, சாதியை, சாதியம்…) + AI தொடர்புடைய பகுதிகள் */
Y.boot(async (ctx) => {
  const { esc, icons, byId } = Object.assign({}, Y, ctx);
  const WORD_RE = /[\u0B80-\u0BFFA-Za-z0-9]+/g;
  const PULLI = "\u0BCD";

  /* ---------- தமிழ்ச் சொல் வடிவ விதிகள் (rule-based) ---------- */
  const CASE_SUFFIXES = ["களுக்கு", "களின்", "களில்", "களால்", "களை", "கள்", "க்கு", "ுக்கு", "ின்", "ில்", "ால்", "ாக", "ோடு", "ுடன்", "ிடம்", "ும்", "ை", "ஐ"];
  function candidates(word) {
    const w = word.normalize("NFC").toLowerCase();
    const set = new Set([w]);
    const m = w.match(/^(.*[\u0BBF\u0BC0])\u0BAF(ை|ின்|ில்|ால்|ம்|ாக|ுடன்|ோடு|ிடம்|ும்|ே|ிலும்|ிற்கு)?$/); // சாதி+யை / யம் / யின் …
    if (m) set.add(m[1]);
    for (const s of CASE_SUFFIXES) if (w.endsWith(s) && w.length - s.length >= 2) set.add(w.slice(0, -s.length));
    if (w.endsWith("ம" + PULLI)) {                       // மரம் → மரமும், மரத்தை, மரங்கள்
      const b = w.slice(0, -2);
      set.add(b + "ம"); set.add(b + "த்த"); set.add(b + "ங்க");
    }
    if (w.endsWith("ு")) {                               // வீடு → வீட்டை
      const stem = w.slice(0, -1), c = stem.slice(-1);
      if (c === "ட" || c === "ற") set.add(stem + PULLI + c);
    }
    return [...set].filter((c) => Y.graphemes(c).length >= 2 || c === w);
  }
  function matcher(query) {
    const words = query.normalize("NFC").split(/[^\u0B80-\u0BFFA-Za-z0-9]+/).filter(Boolean);
    const sets = words.map(candidates);
    const hit = (tok, set) => { tok = tok.toLowerCase(); return set.some((c) => tok.startsWith(c)); };
    return { words, sets, any: (tok) => sets.some((s) => hit(tok, s)), chunk: (text) => { const t = text.match(WORD_RE) || []; return sets.length > 0 && sets.every((s) => t.some((x) => hit(x, s))); } };
  }
  function markHtml(s, m) {
    let out = "", last = 0;
    s.replace(WORD_RE, (t, off) => { out += esc(s.slice(last, off)) + (m && m.any(t) ? `<mark>${esc(t)}</mark>` : esc(t)); last = off + t.length; return t; });
    return out + esc(s.slice(last));
  }
  function snippet(text, m, mode) {
    const LIM = 340;
    if (text.length <= LIM) return markHtml(text, m);
    let first = -1, r;
    const re = new RegExp(WORD_RE.source, "g");
    while ((r = re.exec(text))) if (m && m.any(r[0])) { first = r.index; break; }
    let start = 0, end = LIM - 40;
    if (mode !== "head" && first > 110) {
      start = first - 110; end = first + 230;
      const sp = text.indexOf(" ", start); if (sp > -1 && sp < first) start = sp + 1;
    }
    end = Math.min(text.length, end);
    const sp2 = text.lastIndexOf(" ", end); if (end < text.length && sp2 > start + 40) end = sp2;
    return (start > 0 ? "… " : "") + markHtml(text.slice(start, end), m) + (end < text.length ? " …" : "");
  }

  /* ---------- தேடல் குறியீடு ---------- */
  let chunks;
  try { chunks = (await Y.json("/data/search-index.json")).chunks; } catch { chunks = null; }
  if (!chunks || !chunks.length) {
    chunks = ctx.list.flatMap((iv) => (iv.qa || []).map((x, i) => ({ id: `${iv.id}#${i + 1}`, iid: iv.id, n: i + 1, q: x.q, a: x.a, hl: x.hl || "" })));
  }
  const byChunk = new Map(chunks.map((c) => [c.id, c]));

  const app = document.getElementById("app");
  const initial = new URLSearchParams(location.search).get("q") || "";
  app.innerHTML = `${Y.topbar(ctx, "search")}
    <main>
      <div class="page-head">
        <p class="label" style="color:var(--primary-text)">ஆய்வு மாணவர்களுக்காக</p><span class="rule" style="margin-top:.75rem"></span>
        <h1>ஆய்வுத் தேடல்</h1>
        <p class="lead">ஒரு சொல்லை எழுதுங்கள். எல்லா எழுத்தாளர்களின் நேர்காணல்களிலும் அந்தச் சொல் (அதன் வேற்றுமை, தொகை வடிவங்கள் உட்பட) வரும் பகுதிகள் எழுத்தாளர் வாரியாகத் தொகுத்துக் காட்டப்படும்.</p>
      </div>
      <form class="rs-form" id="f" role="search">
        <div class="rs-big">${icons.search("lg")}<label class="sr-only" for="q">தேடும் சொல்</label>
          <input id="q" type="search" placeholder="எ.கா. சாதி" value="${esc(initial)}" autocomplete="off" autofocus>
          <button class="btn solid" type="submit">தேடு</button></div>
        <div class="rs-opts"><label><input type="checkbox" id="ai" checked> AI மூலம் தொடர்புடைய பகுதிகளையும் காட்டு (தேடு பொத்தானை அழுத்தும்போது)</label></div>
      </form>
      <p class="rs-note" id="note"></p>
      <div id="out"></div>
      <section class="ask rs-sec" aria-labelledby="ask-h">
        <h2 id="ask-h"><i></i>ஆய்வாளர் உதவி</h2>
        <form class="ask-form" id="ask-f">
          <p class="lead">நீங்கள் ஆய்வு செய்யும் எழுத்தாளர் பெயரையோ, உங்கள் ஆய்வுக் கேள்வியையோ எழுதுங்கள்.</p>
          <label class="sr-only" for="ask-q">ஆய்வுக் கேள்வி</label>
          <textarea id="ask-q" rows="3" maxlength="300" placeholder="எ.கா. செழியன் அருணாசலம் தன் எழுத்து முறை பற்றி என்ன கூறினார்?"></textarea>
          <div class="ask-row">
            <div class="rs-opts" role="radiogroup" aria-label="பதில் வகை">
              <label><input type="radio" name="ask-mode" value="sources" checked> இணைப்புகள் மட்டும்</label>
              <label><input type="radio" name="ask-mode" value="answer"> சுருக்கப் பதிலும் இணைப்புகளும்</label>
            </div>
            <button class="btn solid" type="submit" id="ask-btn">கேள்</button>
          </div>
        </form>
        <div id="ask-out" aria-live="polite"></div>
      </section>
    </main>${Y.footer(ctx)}`;

  const $ = (id) => document.getElementById(id);
  const out = $("out"), note = $("note");
  let seq = 0;

  function group(hits) {
    const g = new Map();
    hits.forEach((h) => { (g.get(h.c.iid) || g.set(h.c.iid, []).get(h.c.iid)).push(h); });
    return [...g.entries()].sort((a, b) => b[1].length - a[1].length);
  }
  function hitHtml(h, m, ai) {
    const w = byId[h.c.iid];
    const by = Y.people(w).length ? ` · நேர்கண்டவர்: ${Y.people(w).join(", ")}` : "";
    const cite = `${w.name}${w.period ? ", " + w.period : ""} · நேர்காணல் ${Y.fmtFull(w.date)}${by} · கேள்வி ${h.c.n}`;
    const body = ai ? snippet(h.c.a, m, "head") : snippet(h.c.a, m);
    return `<article class="hit">
      <p class="hq">கே.${h.c.n} — ${markHtml(h.c.q, m)}</p>
      <p class="ha">${body}</p>
      <p class="cite"><span>மேற்கோள்: ${esc(cite)}</span>${ai ? `<span class="sim">தொடர்பு ${Math.round(h.score * 100)}%</span>` : ""}
        <a href="${Y.ivUrl(h.c.iid, h.c.n)}">முழு நேர்காணல் ${icons.arrow("sm")}</a></p></article>`;
  }
  function groupsHtml(hits, m, ai) {
    return group(hits).map(([iid, hs]) => {
      const w = byId[iid];
      return `<section class="writer"><div class="who"><img src="${esc(w.photo)}" alt="" loading="lazy">
        <div><h3>${esc(w.name)}</h3><span>${esc(w.category)} · ${hs.length} பகுதிகள்</span></div></div>
        <div class="hits">${hs.map((h) => hitHtml(h, m, ai)).join("")}</div></section>`;
    }).join("");
  }

  async function run() {
    const query = $("q").value.trim();
    const my = ++seq;
    const u = new URL(location.href); query ? u.searchParams.set("q", query) : u.searchParams.delete("q"); history.replaceState(null, "", u);
    if (!query) { out.innerHTML = ""; note.textContent = ""; return; }
    const m = matcher(query);
    const hits = chunks.filter((c) => m.chunk(c.q + " " + c.a)).map((c) => ({ c }));
    const forms = new Set();
    hits.forEach(({ c }) => (c.q + " " + c.a).replace(WORD_RE, (t) => { if (m.any(t)) forms.add(t); return t; }));
    const writers = new Set(hits.map((h) => h.c.iid)).size;
    note.innerHTML = hits.length
      ? `“${esc(query)}” — <strong>${writers}</strong> எழுத்தாளர்கள், <strong>${hits.length}</strong> பகுதிகள். கண்டறிந்த வடிவங்கள்: ${[...forms].slice(0, 12).map((f) => `<mark style="background:var(--teal-deep);color:var(--primary-foreground);padding:0 .25em">${esc(f)}</mark>`).join(" ")}`
      : `“${esc(query)}” என்ற சொல் எந்த நேர்காணலிலும் இல்லை.`;
    out.innerHTML = `<div class="rs-sec"><h2><i></i>சொல் வரும் இடங்கள்</h2>${groupsHtml(hits, m, false) || '<p class="empty">பொருத்தமான பகுதி இல்லை.</p>'}</div><div id="ai-out"></div>`;

    if (!$("ai").checked || !arguments[0]) return;
    const box = $("ai-out");
    box.innerHTML = `<div class="rs-sec"><h2><i></i>AI: பொருண்மையில் தொடர்புடையவை</h2><p class="rs-note" style="padding-top:0">தேடுகிறது…</p></div>`;
    try {
      const r = await fetch("/api/search", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ q: query }) });
      if (!r.ok) throw new Error(String(r.status));
      const data = await r.json();
      if (my !== seq) return;
      const have = new Set(hits.map((h) => h.c.id));
      const rel = (data.results || []).map((x) => ({ c: byChunk.get(x.id), score: x.score })).filter((x) => x.c && !have.has(x.c.id) && byId[x.c.iid]);
      box.innerHTML = `<div class="rs-sec"><h2><i></i>AI: பொருண்மையில் தொடர்புடையவை</h2>${rel.length ? groupsHtml(rel, m, true) : '<p class="rs-note">கூடுதலாகத் தொடர்புடைய பகுதிகள் இல்லை.</p>'}</div>`;
    } catch {
      if (my !== seq) return;
      box.innerHTML = `<div class="rs-sec"><h2><i></i>AI: பொருண்மையில் தொடர்புடையவை</h2><p class="rs-note">AI தேடல் தளம் Cloudflare-ல் வெளியிடப்பட்டு, தேடல் குறியீடு புதுப்பிக்கப்பட்ட பிறகே இயங்கும். இப்போது சொல் அடிப்படைத் தேடல் மட்டும் கிடைக்கிறது.</p></div>`;
    }
  }

  /* ---------- ஆய்வாளர் உதவி (/api/ask — Cloudflare AI Search) ---------- */
  async function ask() {
    const q = $("ask-q").value.trim();
    if (!q) return;
    const mode = document.querySelector('input[name="ask-mode"]:checked').value;
    const box = $("ask-out"), btn = $("ask-btn");
    box.innerHTML = `<p class="rs-note">தேடுகிறது…</p>`;
    btn.disabled = true;
    try {
      const r = await fetch("/api/ask", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ q, mode }) });
      const d = await r.json().catch(() => ({ error: "இணைப்புப் பிழை. மீண்டும் முயலுங்கள்." }));
      if (d.error || d.message) { box.innerHTML = `<p class="rs-note">${esc(d.error || d.message)}</p>`; return; }
      const src = (d.sources || []).filter((s) => byId[s.iid]);
      const ref = (n) => `<a class="ask-ref" href="#ask-s${n}">[${n}]</a>`;
      box.innerHTML = (d.answer ? `<div class="ask-answer"><h3>சுருக்கப் பதில்</h3>
          <p>${esc(d.answer).replace(/\[(\d+)\]/g, (_, n) => ref(n))}</p>
          <p class="ask-warn">குறிப்பு: இது AI தொகுத்த சுருக்கம். ஆய்வேட்டில் மேற்கோள் இடும்போது கீழே உள்ள மூல நேர்காணலைப் படித்து அதிலிருந்தே மேற்கோள் காட்டுங்கள்.</p></div>` : "")
        + `<h3 class="ask-src-h">தொடர்புடைய நேர்காணல்கள்</h3>`
        + (src.length ? src.map((s) => {
          const w = byId[s.iid];
          return `<article class="hit ask-src" id="ask-s${s.n}">
            <p class="hq">[${s.n}] ${esc(w.name)} — கேள்வி ${s.q}</p>
            <p class="ha">${esc(s.snippet)}…</p>
            <p class="cite"><span>மேற்கோள்: ${esc(w.name)} · நேர்காணல் ${esc(Y.fmtFull(w.date))} · கேள்வி ${s.q}</span>
              <a href="${Y.ivUrl(s.iid, s.q)}">முழு நேர்காணல் ${icons.arrow("sm")}</a></p></article>`;
        }).join("") : `<p class="rs-note">தொடர்புடைய நேர்காணல் எதுவும் கிடைக்கவில்லை.</p>`);
    } catch {
      box.innerHTML = `<p class="rs-note">இணைப்புப் பிழை. மீண்டும் முயலுங்கள்.</p>`;
    } finally {
      btn.disabled = false;
    }
  }
  $("ask-f").addEventListener("submit", (e) => { e.preventDefault(); ask(); });

  $("f").addEventListener("submit", (e) => { e.preventDefault(); run(true); });
  let t; $("q").addEventListener("input", () => { clearTimeout(t); t = setTimeout(() => run(false), 250); });
  if (initial) run(true);
});
