/* முகப்பு — hero = "சிறப்பு நேர்காணல்"; கீழே 3 அட்டைகள்; வலப்புறம் இரண்டு அனிமேட் "இன்றைய வரி" */
Y.boot((ctx) => {
  const { site, list, featured, cats } = ctx;
  const { esc, icons } = Y;
  const app = document.getElementById("app");

  function heroLines(iv) {
    const given = (iv.heroLines || []).map((s) => s.trim()).filter(Boolean);
    if (given.length) return given.slice(0, 3);
    const qa = iv.qa || [];
    const words = ((qa[0] && (qa[0].hl || qa[0].q)) || iv.title || iv.name).split(/\s+/);
    if (words.length >= 3) {
      const k = Math.ceil(words.length / 3);
      return [words.slice(0, k).join(" "), words.slice(k, 2 * k).join(" "), words.slice(2 * k).join(" ")].filter(Boolean);
    }
    return words;
  }
  let ci = 0;
  const bounce = (text) =>
    text.split(/\s+/).map((w) =>
      `<span class="w">${Y.graphemes(w).map((g) => `<span class="ch" aria-hidden="true" style="--i:${ci++}">${esc(g)}</span>`).join("")}</span>`
    ).join(" ");

  const lines = heroLines(featured);
  const cards = list.filter((i) => i.id !== featured.id).slice(0, 3);
  const firstQ = featured.qa && featured.qa[0] ? featured.qa[0].q : featured.summary || "";
  const nav = [["முகப்பு", "/"], ["நேர்காணல்", Y.ivUrl(featured.id)], ["தொகுப்பு", "/collection.html"], ["எங்களைப் பற்றி", "/about.html"]];

  /* ---------- இன்றைய வரிகள்: ஒவ்வொரு எழுத்தாளரிடமிருந்தும் ஒரு குறுகிய வரி; நாளுக்கு நாள் வரிசை மாறும் ---------- */
  const seed = [...new Date().toISOString().slice(0, 10)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  let seq = list.map((iv, k) => {
    const all = (iv.qa || []).map((x, i) => (x.hl ? { iv, n: i + 1, text: x.hl } : null)).filter(Boolean);
    const short = all.filter((p) => p.text.length <= 40);
    const from = short.length ? short : all;
    return from.length ? from[(seed + k) % from.length] : null;
  }).filter(Boolean);
  if (seq.length) { const r = seed % seq.length; seq = seq.slice(r).concat(seq.slice(0, r)); }

  const CYCLE = 7000;
  let at = 0;
  const bodyHtml = (q, k) => `<a class="today-link" href="${Y.ivUrl(q.iv.id, q.n)}"><span class="mark" aria-hidden="true">“</span>
      <blockquote class="tq ${q.text.length > 40 ? "long" : ""}">${q.text.split(/\s+/).map((w, i) => `<span class="qw" style="--k:${i + k * 3}">${esc(w)}</span>`).join(" ")}</blockquote>
      <span class="who"><img src="${esc(q.iv.photo)}" alt=""><span><b>${esc(q.iv.name)}</b><small>${esc(q.iv.title)}</small></span></span></a>`;
  const quoteCard = (k) => seq.length > k ? `<div class="today cream half ${k ? "alt" : ""}" data-k="${k}">
      <span class="t-prog" style="animation-duration:${CYCLE}ms"></span>
      <span class="t-circle"></span><span class="t-bar b1"></span><span class="t-bar b2"></span>
      <div class="t-head"><span class="label">இன்றைய வரி · 0${k + 1}</span><i></i>${k === 0 && seq.length > 2 ? `<button class="shuffle" aria-label="வேறு வரிகள்">${icons.arrow("sm")}<span>மற்றொன்று</span></button>` : ""}</div>
      <div class="t-body">${bodyHtml(seq[(at + k) % seq.length], k)}</div></div>` : "";

  document.title = `${site.title} — ${site.tagline || "நேர்காணல் இதழ்"}`;
  app.innerHTML = `<div class="page-grid">
    <main>
      <section class="hero">
        <div class="hero-text">
          <div class="brandbar">
            <button class="menu-btn" aria-label="மெனு">${icons.menu("lg primary")}</button>
            <a class="brand" href="/">${esc(site.title)}</a>
            <nav class="nav-inline label" aria-label="முதன்மை மெனு">${nav.map(([t, h]) => `<a href="${h}" ${h === "/" ? 'aria-current="page"' : ""}>${t}</a>`).join("")}</nav>
            <a class="hsearch" href="/search.html" aria-label="ஆய்வுத் தேடல்">${icons.search()}</a>
          </div>
          <p class="label hero-kicker">${esc(site.heroKicker || "")}</p>
          <span class="rule" style="margin-top:.6rem"></span>
          <h1 aria-label="${esc(lines.join(" "))}">${lines.map((l, i) => `<span class="ln l${i + 1}">${bounce(l)}</span>`).join("")}</h1>
          <div class="cats label">${cats.map((c) => `<a href="/collection.html?cat=${encodeURIComponent(c)}">${esc(c)}</a>`).join("")}<a class="all" href="/collection.html">அனைத்தும் →</a></div>
          <div class="hero-lower">
            <div><p class="label" style="line-height:1.7">${esc(site.tagline || "")}</p><span class="rule" style="margin-top:.6rem"></span></div>
            <div>
              <p class="bracket">[ ${esc(featured.name)} · ${esc(featured.period || "")} ]</p>
              <p class="firstq muted">${esc(firstQ)}</p>
              <a class="cta" href="${Y.ivUrl(featured.id)}"><span class="circ">${icons.arrow("sm")}</span><span class="label">நேர்காணலைப் படிக்க</span></a>
            </div>
          </div>
        </div>
        <div class="hero-img"><img src="${esc(featured.photo)}" alt="${esc(featured.name)}" width="1024" height="1024"></div>
      </section>
      <section class="cards3" aria-label="மேலும் நேர்காணல்கள்">
        ${cards.map((c, i) => `<a class="card3" href="${Y.ivUrl(c.id)}">
          <img src="${esc(c.photo)}" alt="${esc(c.name)}" loading="lazy" width="1024" height="640">
          <div class="no">0${i + 1}<i></i><span class="muted">${esc(c.category)}</span></div>
          <div class="story"><div><h3>${esc(c.title)}</h3><p>${esc(c.name)}</p></div>${icons.arrow("lg")}</div></a>`).join("")}
      </section>
    </main>
    <aside class="aside" aria-label="இன்றைய வரிகள்">${quoteCard(0)}${quoteCard(1)}</aside>
  </div>${Y.footer(ctx)}`;

  /* ---------- மாறுதல், நிறுத்தம், ஆழ அசைவு ---------- */
  const qcards = [...document.querySelectorAll(".today.half")];
  const aside = document.querySelector(".aside");
  let timer = null;
  function restartProgress() { qcards.forEach((c) => { const p = c.querySelector(".t-prog"); if (p) p.replaceWith(p.cloneNode()); }); }
  function swap() {
    at = (at + qcards.length) % seq.length;
    qcards.forEach((c, k) => setTimeout(() => {
      const body = c.querySelector(".t-body");
      body.classList.add("leaving");
      setTimeout(() => {
        body.classList.remove("leaving");
        body.innerHTML = bodyHtml(seq[(at + k) % seq.length], k);
        const p = c.querySelector(".t-prog"); if (p) p.replaceWith(p.cloneNode());
      }, 700);
    }, k * 600));
  }
  const start = () => { clearInterval(timer); if (seq.length > qcards.length) timer = setInterval(swap, CYCLE); };
  start();
  const btn = document.querySelector(".shuffle");
  if (btn) btn.addEventListener("click", () => { swap(); start(); });
  aside.addEventListener("pointerenter", () => clearInterval(timer));
  aside.addEventListener("pointerleave", () => {
    qcards.forEach((c) => { c.style.setProperty("--px", 0); c.style.setProperty("--py", 0); });
    restartProgress(); start();
  });
  aside.addEventListener("pointermove", (e) => {
    qcards.forEach((c) => {
      const r = c.getBoundingClientRect();
      c.style.setProperty("--px", ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
      c.style.setProperty("--py", ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
    });
  });
});
