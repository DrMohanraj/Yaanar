/* எங்களைப் பற்றி — ஆசிரியர் குழு: 1 முதன்மை ஆசிரியர், 4 துணை ஆசிரியர்கள் */
Y.boot((ctx) => {
  const { esc, icons } = Y;
  const { site } = ctx;
  const team = site.team || {};
  const chief = team.chief;
  const subs = (team.editors || []).slice(0, 4);
  const paras = String(site.about || "").split(/\n+/).filter(Boolean);
  const s = site.social || {};
  const socials = [["Facebook", s.facebook], ["YouTube", s.youtube], ["Instagram", s.instagram]].filter(([, u]) => u);

  document.getElementById("app").innerHTML = `${Y.topbar(ctx, "about")}
    <main>
      <div class="page-head">
        <p class="label" style="color:var(--primary)">எங்களைப் பற்றி</p><span class="rule" style="margin-top:.75rem"></span>
        <h1>${esc(site.aboutHeading || site.title)}</h1>
      </div>
      <section class="about-body">
        <div><p class="label">இதழின் நோக்கம்</p><span class="rule" style="margin-top:.75rem"></span></div>
        <div class="txt">${paras.map((p) => `<p>${esc(p)}</p>`).join("")}</div>
      </section>
      ${chief ? `<section class="chief person" aria-label="முதன்மை ஆசிரியர்">
        <img src="${esc(chief.photo)}" alt="${esc(chief.name)}" loading="lazy">
        <div class="t"><p class="role label">${esc(chief.role || "முதன்மை ஆசிரியர்")}</p><h3>${esc(chief.name)}</h3><p class="bio">${esc(chief.bio || "")}</p></div>
      </section>` : ""}
      <section class="subs" aria-label="துணை ஆசிரியர்கள்">
        ${subs.map((p) => `<article class="person"><img src="${esc(p.photo)}" alt="${esc(p.name)}" loading="lazy">
          <h3>${esc(p.name)}</h3><p class="role">${esc(p.role || "துணை ஆசிரியர்")}</p><p class="bio">${esc(p.bio || "")}</p></article>`).join("")}
      </section>
      <section class="contact-line">
        <p class="label">தொடர்புக்கு</p>
        ${site.email ? `<a class="btn" href="mailto:${esc(site.email)}">${esc(site.email)}</a>` : ""}
        ${socials.map(([n, u]) => `<a class="label" style="border-bottom:1px solid var(--primary)" href="${esc(u)}" target="_blank" rel="noopener">${n}</a>`).join("")}
      </section>
    </main>${Y.footer(ctx)}`;
});
