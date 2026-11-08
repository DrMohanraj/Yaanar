/* ஆசிரியர் குழு: முதன்மை ஆசிரியர் (பெரிதாக) → 4 துணை ஆசிரியர்கள் → தொடர்பு */
Y.boot((ctx) => {
  const { esc } = Y;
  const { site } = ctx;
  const team = site.team || {};
  const chief = team.chief ? { ...team.chief, role: team.chief.role || "முதன்மை ஆசிரியர்" } : null;
  const editors = (team.editors || []).slice(0, 4).map((p) => ({ ...p, role: p.role || "துணை ஆசிரியர்" }));
  const s = site.social || {};
  const socials = [["Facebook", s.facebook], ["YouTube", s.youtube], ["Instagram", s.instagram]].filter(([, u]) => u);
  const img = (p, sizes, eager) =>
    `<img src="${esc(p.photo)}" ${Y.srcset(p.photo, sizes)} alt="${esc(p.name)}" ${eager ? "" : 'loading="lazy"'} width="1024" height="1024">`;

  document.getElementById("app").innerHTML = `${Y.topbar(ctx, "about")}
    <main class="team-page">
      <h1 class="sr-only">ஆசிரியர் குழு</h1>

      <section class="bento" aria-label="ஆசிரியர் குழு">
        ${chief ? `<article class="tp-person chief">
          ${img(chief, "(min-width:900px) 28vw, 100vw", true)}
          <div class="txt"><p class="role">${esc(chief.role)}</p><h2>${esc(chief.name)}</h2><p class="bio">${esc(chief.bio || "")}</p></div>
        </article>` : ""}
        ${editors.map((p) => `<article class="tp-person">
          ${img(p, "(min-width:900px) 18vw, 50vw", true)}
          <div class="txt"><p class="role">${esc(p.role)}</p><h3>${esc(p.name)}</h3><p class="bio">${esc(p.bio || "")}</p></div>
        </article>`).join("")}
      </section>

      <section class="tp-contact" aria-labelledby="tp-c-h">
        <h2 id="tp-c-h" class="tp-sec">தொடர்புக்கு</h2>
        <p class="muted">நேர்காணல் பரிந்துரைகள், திருத்தங்கள், கருத்துகள் எதுவாயினும் எழுதுங்கள்.</p>
        <div class="tp-links">
          ${site.email ? `<a class="btn" href="mailto:${esc(site.email)}">${esc(site.email)}</a>` : ""}
          ${socials.map(([n, u]) => `<a class="tp-social" href="${esc(u)}" target="_blank" rel="noopener">${n}</a>`).join("")}
        </div>
      </section>
    </main>${Y.footer(ctx)}`;
});
