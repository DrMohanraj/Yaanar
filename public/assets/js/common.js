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
  /* நேர்காணல் எடுத்தவர்கள்: site.json-ல் உள்ள பட்டியலிலிருந்து (id அல்லது பழைய பெயர் வழியாக) */
  const people = (iv) => iv._people || [];
  function resolvePeople(iv, roster) {
    return (iv.interviewers || []).map((x) => String(x || "").trim()).filter(Boolean).slice(0, 2)
      .map((x) => roster.find((p) => p.id === x || p.name === x) || (/^[a-z0-9][a-z0-9-]*$/.test(x) ? null : { name: x })) // பட்டியலில் இல்லாத id வாசகருக்குத் தெரியாது
      .filter((p, i, all) => p && all.findIndex((y) => y && y.name === p.name) === i);
  }
  const personUrl = (id) => `/interviewer.html?id=${encodeURIComponent(id)}`;
  /* சிறிய வட்டப் படம்; படம் இல்லையெனில் பெயரின் முதல் எழுத்து */
  function avatar(p, cls = "") {
    if (p.photo) return `<img class="av ${cls}" src="${esc(p.photo)}" alt="" loading="lazy" width="96" height="96">`;
    const first = graphemes(String(p.name || "?").trim())[0] || "?";
    return `<span class="av av-i ${cls}" aria-hidden="true">${esc(first)}</span>`;
  }
  /* நேர்கண்டவர் சிப்: படம் + பெயர்; பக்கம் இருந்தால் இணைப்பு */
  const personChip = (p) => p.id
    ? `<a class="pchip" href="${personUrl(p.id)}">${avatar(p)}<span>${esc(p.name)}</span></a>`
    : `<span class="pchip">${avatar(p)}<span>${esc(p.name)}</span></span>`;

  async function load() {
    const [site, data] = await Promise.all([json("/data/site.json"), json("/data/interviews.json")]);
    const roster = (site.interviewers || []).filter((p) => p && p.id && p.name);
    const list = (data.interviews || []).slice().sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    list.forEach((iv) => { iv._people = resolvePeople(iv, roster); });
    const byId = Object.fromEntries(list.map((i) => [i.id, i]));
    const featured = byId[site.featuredId] || list[0];
    const cats = [...new Set(list.map((i) => i.category).filter(Boolean))];
    return { site, list, byId, featured, cats, roster };
  }

  const ivUrl = (id, n) => `/interview.html?id=${encodeURIComponent(id)}${n ? "#q-" + n : ""}`;

  function navItems(ctx) {
    return [
      { href: "/", t: "முகப்பு" },
      { href: ivUrl(ctx.featured?.id), t: "நேர்காணல்", key: "interview" },
      { href: "/collection.html", t: "தொகுப்பு" },
      { href: "/about.html", t: "ஆசிரியர் குழு" },
      { href: "/search.html", t: "ஆய்வுத் தேடல்" },
    ];
  }

  function topbar(ctx, active) {
    const items = navItems(ctx).slice(0, 4);
    return `<a class="skip" href="#main">உள்ளடக்கத்துக்குச் செல்</a><header class="topbar">
      <button class="menu-btn" aria-label="மெனு" aria-expanded="false" aria-controls="site-menu">${icons.menu("lg primary")}</button>
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
    el.id = "site-menu";
    el.hidden = true;
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-modal", "true");
    el.setAttribute("aria-label", "மெனு");
    el.innerHTML = `<div class="bar"><a class="brand" href="/">${esc(ctx.site.title)}</a>
      <button class="menu-close" aria-label="மூடு">${icons.close("lg primary")}</button></div>
      <nav>${navItems(ctx).map((n) => `<a href="${n.href}">${n.t}</a>`).join("")}</nav>`;
    document.body.appendChild(el);
    let opener = null;
    const btns = () => document.querySelectorAll(".menu-btn");
    const open = (from) => {
      opener = from || null;
      el.hidden = false; document.body.style.overflow = "hidden";
      btns().forEach((b) => b.setAttribute("aria-expanded", "true"));
      el.querySelector(".menu-close").focus();
    };
    const close = () => {
      if (el.hidden) return;
      el.hidden = true; document.body.style.overflow = "";
      btns().forEach((b) => b.setAttribute("aria-expanded", "false"));
      if (opener) opener.focus();
    };
    document.addEventListener("click", (e) => {
      if (e.target.closest(".menu-btn")) open(e.target.closest(".menu-btn"));
      else if (e.target.closest(".menu-close")) close();
      else if (e.target.closest(".menu-overlay a")) close();
    });
    document.addEventListener("keydown", (e) => {
      if (el.hidden) return;
      if (e.key === "Escape") close();
      else if (e.key === "Tab") {
        // மெனு திறந்திருக்கும்போது கவனம் அதற்குள்ளேயே சுற்றும்
        const f = [...el.querySelectorAll("a, button")];
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }

  function footer(ctx) {
    const { site, cats } = ctx;
    const s = site.social || {};
    const socials = [["Facebook", s.facebook], ["YouTube", s.youtube], ["Instagram", s.instagram]].filter(([, u]) => /^https?:\/\//i.test(u || ""));
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

  /* மாதிரிப் படங்களுக்குச் சிறிய பதிப்புகள் உள்ளன; மற்ற படங்கள் அப்படியே */
  function srcset(src, sizes) {
    const m = /^\/assets\/img\/(writer-\d+)\.jpg$/.exec(src || "");
    return m ? `srcset="/assets/img/${m[1]}-320.jpg 320w, /assets/img/${m[1]}-640.jpg 640w, ${src} 1024w" sizes="${sizes}"` : "";
  }

  function card(iv, cls = "gcard") {
    return `<a class="${cls}" href="${ivUrl(iv.id)}">
      <div class="imgwrap"><img src="${esc(iv.photo)}" ${srcset(iv.photo, "(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw")} alt="${esc(iv.name)}" loading="lazy" width="1024" height="1024"></div>
      <div class="meta"><span class="catname">${esc(iv.category)}</span><i></i><span class="muted">${esc(fmtFull(iv.date))}</span></div>
      <div class="story"><div><h3>${esc(iv.title)}</h3><p>${esc(iv.name)}</p></div>${icons.arrow("lg")}</div>
      ${iv.summary ? `<p class="sum">${esc(iv.summary)}</p>` : ""}
      ${people(iv).length ? `<p class="by"><span class="avs">${people(iv).map((p) => avatar(p, "sm")).join("")}</span><span class="by-k">நேர்காணல்</span>${people(iv).map((p) => esc(p.name)).join(" · ")}</p>` : ""}
    </a>`;
  }

  return { esc, pad, icons, json, load, boot, topbar, footer, graphemes, srcset, ivUrl, fmtDate, fmtFull, people, card, avatar, personChip, personUrl };
})();
