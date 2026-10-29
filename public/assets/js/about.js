/* ஆசிரியர் குழு: 1 முதன்மை ஆசிரியர், 4 துணை ஆசிரியர்கள் — அனைவரும் சம அளவு அட்டைகளில் */
Y.boot((ctx) => {
  const { esc } = Y;
  const { site } = ctx;
  const team = site.team || {};
  const people = [
    ...(team.chief ? [{ ...team.chief, role: team.chief.role || "முதன்மை ஆசிரியர்" }] : []),
    ...(team.editors || []).slice(0, 4).map((p) => ({ ...p, role: p.role || "துணை ஆசிரியர்" })),
  ];
  const s = site.social || {};
  const socials = [["Facebook", s.facebook], ["YouTube", s.youtube], ["Instagram", s.instagram]].filter(([, u]) => u);

  document.getElementById("app").innerHTML = `${Y.topbar(ctx, "about")}
    <main>
      <h1 class="sr-only">ஆசிரியர் குழு</h1>
      <section class="subs team" aria-label="ஆசிரியர் குழு">
        ${people.map((p) => `<article class="person"><img src="${esc(p.photo)}" alt="${esc(p.name)}" loading="lazy">
          <h3>${esc(p.name)}</h3><p class="role">${esc(p.role)}</p><p class="bio">${esc(p.bio || "")}</p></article>`).join("")}
      </section>
      <section class="contact-line">
        <p class="label">தொடர்புக்கு</p>
        ${site.email ? `<a class="btn" href="mailto:${esc(site.email)}">${esc(site.email)}</a>` : ""}
        ${socials.map(([n, u]) => `<a class="label" style="border-bottom:1px solid var(--primary)" href="${esc(u)}" target="_blank" rel="noopener">${n}</a>`).join("")}
      </section>
    </main>${Y.footer(ctx)}`;
});
