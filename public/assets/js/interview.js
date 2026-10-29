/* நேர்காணல் பக்கம் — அறிமுகம் + 20 கேள்வி–பதில், ஒவ்வொன்றிலும் முக்கிய வரி "splash" */
Y.boot((ctx) => {
  const { site, list, byId, featured } = ctx;
  const { esc, pad, icons } = Y;
  const id = new URLSearchParams(location.search).get("id");
  const iv = byId[id] || featured;
  if (!iv) { document.getElementById("app").innerHTML = '<div class="empty">நேர்காணல் எதுவும் இல்லை.</div>'; return; }
  document.title = `${iv.name} — ${iv.title} | ${site.title}`;

  const qa = iv.qa || [];
  const answerHtml = (a, hl) => {
    let paras = String(a || "").split(/\n+/).map(esc);
    if (hl) {
      const h = esc(hl);
      let done = false;
      paras = paras.map((p) => (!done && p.includes(h) ? ((done = true), p.replace(h, `<mark>${h}</mark>`)) : p));
    }
    return paras.map((p) => `<p class="qa-a">${p}</p>`).join("");
  };

  const idx = list.findIndex((x) => x.id === iv.id);
  const prev = list[(idx + 1) % list.length];
  const next = list[(idx - 1 + list.length) % list.length];

  document.getElementById("app").innerHTML = `<div class="progress" id="prog"></div>
    ${Y.topbar(ctx, "interview")}
    <main>
      <section class="iv-head">
        <div class="txt">
          <a class="label" style="color:var(--primary-text)" href="/collection.html?cat=${encodeURIComponent(iv.category || "")}">${esc(iv.category)}</a>
          <span class="rule" style="margin-top:.75rem"></span>
          <h1>${esc(iv.name)}</h1>
          <p class="ttl">${esc(iv.title)}</p>
          <p class="meta"><span>${esc(iv.period || "")}</span><span>${qa.length} கேள்விகள்</span></p>
          <div class="by">
            ${Y.people(iv).length ? `<div><span class="k">நேர்காணல் எடுத்தவர்${Y.people(iv).length > 1 ? "கள்" : ""}</span><span class="v">${Y.people(iv).map(esc).join(" · ")}</span></div>` : ""}
            ${iv.date ? `<div><span class="k">நேர்காணல் நாள்</span><span class="v">${esc(Y.fmtFull(iv.date))}</span></div>` : ""}
          </div>
          <p class="intro">${esc(iv.intro || iv.summary || "")}</p>
        </div>
        <div class="pic"><img src="${esc(iv.photo)}" alt="${esc(iv.name)}" width="1024" height="1024"></div>
      </section>
      <div class="iv-body">
        <nav class="rail" aria-label="கேள்வி எண்கள்"><ol>${qa.map((_, i) => `<li><a href="#q-${i + 1}" data-n="${i + 1}">${pad(i + 1)}</a></li>`).join("")}</ol></nav>
        <div>
          ${qa.map((x, i) => `<article class="qa ${i % 2 ? "flip" : ""}" id="q-${i + 1}" data-n="${i + 1}">
            <div class="qa-main">
              <div class="qa-n">${pad(i + 1)}<i></i></div>
              <h2 class="qa-q">${esc(x.q)}</h2>
              ${answerHtml(x.a, x.hl)}
            </div>
            ${x.hl ? `<aside class="splash" aria-hidden="true"><span class="bar b1"></span><span class="bar b2"></span><span class="blob"></span><span class="dot"></span><blockquote>${esc(x.hl)}</blockquote></aside>` : ""}
          </article>`).join("")}
        </div>
      </div>
      ${list.length > 1 ? `<nav class="iv-next" aria-label="மற்ற நேர்காணல்கள்">
        <a href="${Y.ivUrl(prev.id)}"><span class="label muted">← முந்தைய நேர்காணல்</span><h3>${esc(prev.name)}</h3><p class="muted">${esc(prev.title)}</p></a>
        <a class="r" href="${Y.ivUrl(next.id)}"><span class="label muted">அடுத்த நேர்காணல் →</span><h3>${esc(next.name)}</h3><p class="muted">${esc(next.title)}</p></a>
      </nav>` : ""}
    </main>${Y.footer(ctx)}`;

  /* splash reveal + rail highlight + progress */
  const items = [...document.querySelectorAll(".qa")];
  const links = new Map([...document.querySelectorAll(".rail a")].map((a) => [a.dataset.n, a]));
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("in"); });
  }, { threshold: 0.25 });
  items.forEach((el) => io.observe(el));

  const spy = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        links.forEach((a) => a.classList.remove("on"));
        const a = links.get(e.target.dataset.n);
        if (a) a.classList.add("on");
      }
    });
  }, { rootMargin: "-35% 0px -55% 0px" });
  items.forEach((el) => spy.observe(el));

  const prog = document.getElementById("prog");
  const onScroll = () => {
    const h = document.documentElement;
    prog.style.width = Math.min(100, (h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight)) * 100) + "%";
  };
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if (location.hash.startsWith("#q-")) {
    const t = document.querySelector(location.hash);
    if (t) { t.classList.add("in"); setTimeout(() => t.scrollIntoView(), 50); }
  }
});
