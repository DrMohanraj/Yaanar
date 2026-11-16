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

  /* குமிழ் (splash): ஆசிரியர் "star" எனக் குறித்த 3–5 வரிகளுக்கு மட்டும்.
     எதுவும் குறிக்கப்படவில்லையெனில் முக்கிய வரியுள்ள கேள்விகளில் சீராக இடைவெளி விட்டு 4 */
  const withHl = qa.map((x, i) => (x.hl ? i : -1)).filter((i) => i >= 0);
  const starred = qa.some((x) => x.star);
  const autoPick = new Set(withHl.length <= 4 ? withHl : [0, 1, 2, 3].map((k) => withHl[Math.round((k * (withHl.length - 1)) / 3)]));
  const hasSplash = (x, i) => !!x.hl && (starred ? !!x.star : autoPick.has(i));

  const idx = list.findIndex((x) => x.id === iv.id);
  const prev = list[(idx + 1) % list.length];
  const next = list[(idx - 1 + list.length) % list.length];

  document.getElementById("app").innerHTML = `<div class="progress" id="prog"></div>
    ${Y.topbar(ctx, "interview")}
    <main id="main" tabindex="-1">
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
        <div class="pic"><img src="${esc(iv.photo)}" ${Y.srcset(iv.photo, "(min-width:900px) 45vw, 100vw")} alt="${esc(iv.name)}" width="1024" height="1024"></div>
      </section>
      <div class="iv-body">
        <nav class="rail" aria-label="கேள்விகள்"><ol>${qa.map((x, i) => `<li><a href="#q-${i + 1}" data-n="${i + 1}" data-q="${esc(x.q)}" aria-label="கேள்வி ${i + 1}: ${esc(x.q)}">${pad(i + 1)}</a></li>`).join("")}</ol></nav>
        <div>
          ${qa.map((x, i) => `<article class="qa${hasSplash(x, i) ? "" : " plain"}" id="q-${i + 1}" data-n="${i + 1}">
            <div class="qa-main">
              <div class="qa-n">${pad(i + 1)}<i></i></div>
              <h2 class="qa-q">${esc(x.q)}</h2>
              ${answerHtml(x.a, x.hl)}
            </div>
            ${hasSplash(x, i) ? `<aside class="splash" aria-hidden="true"><span class="bar b1"></span><span class="bar b2"></span><span class="blob"></span><span class="dot"></span><blockquote>${esc(x.hl)}</blockquote></aside>` : ""}
          </article>`).join("")}
        </div>
      </div>
      ${list.length > 1 ? `<nav class="iv-next" aria-label="மற்ற நேர்காணல்கள்">
        <a href="${Y.ivUrl(prev.id)}"><span class="label muted">← முந்தைய நேர்காணல்</span><h3>${esc(prev.name)}</h3><p class="muted">${esc(prev.title)}</p></a>
        <a class="r" href="${Y.ivUrl(next.id)}"><span class="label muted">அடுத்த நேர்காணல் →</span><h3>${esc(next.name)}</h3><p class="muted">${esc(next.title)}</p></a>
      </nav>` : ""}
    </main>
    ${qa.length > 1 ? `<button class="qnav" id="qnav" type="button" aria-haspopup="dialog" aria-controls="qsheet" hidden>
      <span class="sr-only">கேள்விப் பட்டியல், இப்போது </span>கே. <b id="qnav-n">1</b><span aria-hidden="true"> / </span><span class="sr-only"> மொத்தம் </span>${qa.length}</button>
    <dialog class="qsheet" id="qsheet" aria-labelledby="qsheet-h">
      <div class="qsheet-head"><h2 id="qsheet-h">கேள்விகள்</h2><button type="button" class="qsheet-x" aria-label="மூடு">${icons.close("lg")}</button></div>
      <ol>${qa.map((x, i) => `<li><a href="#q-${i + 1}" data-n="${i + 1}"><span class="n">${pad(i + 1)}</span><span class="t">${esc(x.q)}</span></a></li>`).join("")}</ol>
    </dialog>` : ""}${Y.footer(ctx)}`;

  /* splash reveal + rail highlight + progress */
  const items = [...document.querySelectorAll(".qa")];
  const links = new Map([...document.querySelectorAll(".rail a")].map((a) => [a.dataset.n, a]));
  /* முக்கிய வரிக் குமிழ் திரையில் தெரியும்போது அசைவு; நீண்ட பதில்களிலும் (கைபேசி) தவறாது */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.closest(".qa").classList.add("in"); io.unobserve(e.target); } });
  }, { threshold: 0.3 });
  items.forEach((el) => { const s = el.querySelector(".splash"); s ? io.observe(s) : el.classList.add("in"); });

  /* கைபேசி: "கே. 7 / 20" பொத்தான் → கேள்விப் பட்டியல் (கீழிருந்து எழும்) */
  const qnav = document.getElementById("qnav");
  const qnavN = document.getElementById("qnav-n");
  const sheet = document.getElementById("qsheet");
  const sheetLinks = sheet ? [...sheet.querySelectorAll("a")] : [];
  let current = "1";
  const setCurrent = (n) => {
    current = n;
    links.forEach((a) => a.classList.toggle("on", a.dataset.n === n));
    if (qnavN) qnavN.textContent = n;
    sheetLinks.forEach((a) => (a.dataset.n === n ? a.setAttribute("aria-current", "true") : a.removeAttribute("aria-current")));
  };

  const spy = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) setCurrent(e.target.dataset.n); });
  }, { rootMargin: "-35% 0px -55% 0px" });
  items.forEach((el) => spy.observe(el));

  if (qnav && sheet) {
    // முதல் கேள்வியை அடைந்த பின் மட்டும் பொத்தான்; footer வந்ததும் மறையும்
    const body = document.querySelector(".iv-body");
    const show = new IntersectionObserver(([e]) => { qnav.hidden = !e.isIntersecting; }, { rootMargin: "0px 0px -40% 0px" });
    show.observe(body);
    qnav.addEventListener("click", () => {
      sheet.showModal();
      const a = sheet.querySelector(`a[data-n="${current}"]`);
      if (a) { a.scrollIntoView({ block: "center" }); a.focus(); }
    });
    sheet.addEventListener("click", (e) => {
      if (e.target === sheet || e.target.closest(".qsheet-x")) sheet.close();
      else if (e.target.closest("a")) sheet.close();
    });
    sheet.addEventListener("close", () => qnav.focus({ preventScroll: true }));
  }

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
