/* முகப்பு — hero = "சிறப்பு நேர்காணல்"; கீழே 3 நேர்காணல் அட்டைகள் */
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
  const nav = [["முகப்பு", "/"], ["நேர்காணல்", Y.ivUrl(featured.id)], ["தொகுப்பு", "/collection.html"], ["ஆசிரியர் குழு", "/about.html"]];

  document.title = `${site.title} — ${site.tagline || "நேர்காணல் இதழ்"}`;
  app.innerHTML = `<div class="page-grid solo">
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
  </div>${Y.footer(ctx)}`;
});
