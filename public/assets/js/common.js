/* யாணர் — பொதுப் பணிகள் (data load, menu overlay, footer) */
const Y = (() => {
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const pad = (n) => String(n).padStart(2, "0");
  const svg = (inner, cls = "") => `<svg class="icon ${cls}" viewBox="0 0 24 24" aria-hidden="true">${inner}</svg>`;
  const icons = {
    arrow: (c) => svg('<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>', c),
    search: (c) => svg('<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>', c),
    menu: (c) => svg('<path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/>', c),
    close: (c) => svg('<path d="M18 6 6 18"/><path d="m6 6 12 12"/>', c),
  };

  async function json(path) {
    const r = await fetch(path, { cache: "no-cache" });
    if (!r.ok) throw new Error(path + " " + r.status);
    return r.json();
  }

  const MONTHS = ["ஜன", "பிப்", "மார்", "ஏப்", "மே", "ஜூன்", "ஜூலை", "ஆக", "செப்", "அக்", "நவ", "டிச"];
  function fmtDate(d) {
    if (!d) return "";
    const [y, m] = d.split("-");
    return `${MONTHS[(+m || 1) - 1]} ${y}`;
  }

  const MONTHS_FULL = ["ஜனவரி", "பிப்ரவரி", "மார்ச்", "ஏப்ரல்", "மே", "ஜூன்", "ஜூலை", "ஆகஸ்ட்", "செப்டம்பர்", "அக்டோபர்", "நவம்பர்", "டிசம்பர்"];
  function fmtFull(d) {
    if (!d) return "";
    const [y, m, day] = d.split("-");
    return `${day ? +day + " " : ""}${MONTHS_FULL[(+m || 1) - 1]} ${y}`;
  }
  const people = (iv) => (iv.interviewers || []).map((x) => String(x).trim()).filter(Boolean).slice(0, 2);

  async function load() {
    const [site, data] = await Promise.all([json("/data/site.json"), json("/data/interviews.json")]);
    const list = (data.interviews || []).slice().sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    const byId = Object.fromEntries(list.map((i) => [i.id, i]));
    const featured = byId[site.featuredId] || list[0];
    const cats = [...new Set(list.map((i) => i.category).filter(Boolean))];
    return { site, list, byId, featured, cats };
  }

  const ivUrl = (id, n) => `/interview.html?id=${encodeURIComponent(id)}${n ? "#q-" + n : ""}`;

  function navItems(ctx) {
    return [
      { href: "/", t: "முகப்பு" },
      { href: ivUrl(ctx.featured?.id), t: "நேர்காணல்", key: "interview" },
      { href: "/collection.html", t: "தொகுப்பு" },
      { href: "/about.html", t: "எங்களைப் பற்றி" },
      { href: "/search.html", t: "ஆய்வுத் தேடல்" },
    ];
  }

  function topbar(ctx, active) {
    const items = navItems(ctx).slice(0, 4);
    return `<header class="topbar">
      <button class="menu-btn" aria-label="மெனு" aria-expanded="false">${icons.menu("lg primary")}</button>
      <a class="brand" href="/">${esc(ctx.site.title)}</a>
      <nav class="nav-inline label" aria-label="முதன்மை மெனு">
        ${items.map((n) => `<a href="${n.href}" ${n.key === active || n.href.replace(".html", "") === "/" + active ? 'aria-current="page"' : ""}>${n.t}</a>`).join("")}
      </nav>
      <div class="topicons"><a href="/search.html" aria-label="ஆய்வுத் தேடல்">${icons.search()}</a></div>
    </header>`;
  }

  function overlay(ctx) {
    const el = document.createElement("div");
    el.className = "menu-overlay";
    el.hidden = true;
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-label", "மெனு");
    el.innerHTML = `<div class="bar"><a class="brand" href="/">${esc(ctx.site.title)}</a>
      <button class="menu-close" aria-label="மூடு">${icons.close("lg primary")}</button></div>
      <nav>${navItems(ctx).map((n) => `<a href="${n.href}">${n.t}</a>`).join("")}</nav>`;
    document.body.appendChild(el);
    const open = () => { el.hidden = false; document.body.style.overflow = "hidden"; el.querySelector(".menu-close").focus(); };
    const close = () => { el.hidden = true; document.body.style.overflow = ""; };
    document.addEventListener("click", (e) => {
      if (e.target.closest(".menu-btn")) open();
      else if (e.target.closest(".menu-close")) close();
      else if (e.target.closest(".menu-overlay a")) close();
    });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !el.hidden) close(); });
  }

  function footer(ctx) {
    const { site, cats } = ctx;
    const s = site.social || {};
    const socials = [["Facebook", s.facebook], ["YouTube", s.youtube], ["Instagram", s.instagram]].filter(([, u]) => u);
    return `<footer class="footer">
      <div class="footer-in">
        <div><a class="brand" href="/">${esc(site.title)}</a><p class="about muted">${esc(site.footerText || "")}</p></div>
        <div><h4><i></i>வகைகள்</h4><ul>${cats.map((c) => `<li><a href="/collection.html?cat=${encodeURIComponent(c)}">${esc(c)}</a></li>`).join("")}</ul></div>
        <div><h4><i></i>இணைப்புகள்</h4><ul>${navItems(ctx).map((n) => `<li><a href="${n.href}">${n.t}</a></li>`).join("")}</ul></div>
        <div><h4><i></i>தொடர்புக்கு</h4><ul>
          ${site.email ? `<li><a href="mailto:${esc(site.email)}">${esc(site.email)}</a></li>` : ""}
          ${socials.map(([n, u]) => `<li><a href="${esc(u)}" target="_blank" rel="noopener">${n}</a></li>`).join("")}
        </ul></div>
      </div>
      <div class="footer-bottom"><span>© ${new Date().getFullYear()} ${esc(site.title)}</span><span>${esc(site.tagline || "")}</span></div>
    </footer>`;
  }

  async function boot(render) {
    try {
      const ctx = await load();
      overlay(ctx);
      await render(ctx);
    } catch (err) {
      console.error(err);
      document.getElementById("app").innerHTML = `<div class="empty">தரவை ஏற்ற முடியவில்லை. பக்கத்தை மீண்டும் ஏற்றவும்.</div>`;
    }
  }

  /* Tamil grapheme-safe split (letters never break apart) */
  function graphemes(s) {
    if (window.Intl && Intl.Segmenter) return [...new Intl.Segmenter("ta", { granularity: "grapheme" }).segment(s)].map((x) => x.segment);
    return [...s];
  }

  function card(iv, cls = "gcard") {
    return `<a class="${cls}" href="${ivUrl(iv.id)}">
      <div class="imgwrap"><img src="${esc(iv.photo)}" alt="${esc(iv.name)}" loading="lazy"></div>
      <div class="meta"><span class="catname">${esc(iv.category)}</span><i></i><span class="muted">${esc(fmtFull(iv.date))}</span></div>
      <div class="story"><div><h3>${esc(iv.title)}</h3><p>${esc(iv.name)}</p></div>${icons.arrow("lg")}</div>
      ${iv.summary ? `<p class="sum">${esc(iv.summary)}</p>` : ""}
      ${people(iv).length ? `<p class="by"><span>நேர்காணல்</span>${people(iv).map(esc).join(" · ")}</p>` : ""}
    </a>`;
  }

  return { esc, pad, icons, json, load, boot, topbar, footer, graphemes, ivUrl, fmtDate, fmtFull, people, card };
})();
