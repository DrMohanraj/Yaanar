/* ஆசிரியர் குழு: இதழ் அறிமுகம் → முதன்மை ஆசிரியர் (பெரிதாக) → 4 துணை ஆசிரியர்கள் → தொடர்பு */
Y.boot((ctx) => {
  const { esc } = Y;
  const { site } = ctx;
  const team = site.team || {};
  const chief = team.chief ? { ...team.chief, role: team.chief.role || "முதன்மை ஆசிரியர்" } : null;
  const editors = (team.editors || []).slice(0, 4).map((p) => ({ ...p, role: p.role || "துணை ஆசிரியர்" }));
  const paras = String(site.about || "").split(/\n+/).filter(Boolean);
  const s = site.social || {};
  const socials = [["Facebook", s.facebook], ["YouTube", s.youtube], ["Instagram", s.instagram]].filter(([, u]) => u);
  const img = (p, sizes, eager) =>
    `<img src="${esc(p.photo)}" ${Y.srcset(p.photo, sizes)} alt="${esc(p.name)}" ${eager ? "" : 'loading="lazy"'} width="1024" height="1024">`;

  document.getElementById("app").innerHTML = `${Y.topbar(ctx, "about")}
    <main class="team-page">
      <header class="tp-head">
        <p class="label">ஆசிரியர் குழு</p>
        <h1>${esc(site.aboutHeading || "ஆசிரியர் குழு")}</h1>
        <div class="tp-about">${paras.map((p) => `<p>${esc(p)}</p>`).join("")}</div>
      </header>

      ${chief ? `<section class="tp-chief" aria-label="முதன்மை ஆசிரியர்">
        <figure>${img(chief, "(min-width:900px) 32vw, 100vw", true)}</figure>
        <div class="tp-chief-txt">
          <p class="label">${esc(chief.role)}</p>
          <h2>${esc(chief.name)}</h2>
          <span class="rule"></span>
          <p class="bio">${esc(chief.bio || "")}</p>
        </div>
      </section>` : ""}

      ${editors.length ? `<section class="tp-editors" aria-labelledby="tp-ed-h">
        <h2 id="tp-ed-h" class="tp-sec">துணை ஆசிரியர்கள்</h2>
        <div class="tp-grid">
          ${editors.map((p) => `<article class="tp-person">
            ${img(p, "(min-width:1024px) 22vw, (min-width:560px) 45vw, 100vw")}
            <h3>${esc(p.name)}</h3><p class="role">${esc(p.role)}</p><p class="bio">${esc(p.bio || "")}</p>
          </article>`).join("")}
        </div>
      </section>` : ""}

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
