/* நேர்கண்டவர் பக்கம்: படம், அறிமுகம், இவர் எடுத்த நேர்காணல்கள் */
Y.boot((ctx) => {
  const { site, list, roster } = ctx;
  const { esc } = Y;
  const id = new URLSearchParams(location.search).get("id");
  const p = roster.find((x) => x.id === id);
  const app = document.getElementById("app");

  if (!p) {
    document.title = `நேர்கண்டவர் கிடைக்கவில்லை — ${site.title}`;
    app.innerHTML = `${Y.topbar(ctx, "interviewer")}
      <main id="main" tabindex="-1" class="person-page">
        <div class="pp-missing"><h1>இந்த நேர்கண்டவர் பற்றிய பக்கம் இல்லை</h1>
          <p class="muted">இணைப்பு மாறியிருக்கலாம். எல்லா நேர்காணல்களையும் தொகுப்பில் பார்க்கலாம்.</p>
          <p><a class="btn" href="/collection.html">தொகுப்புக்குச் செல்</a></p></div>
      </main>${Y.footer(ctx)}`;
    return;
  }

  const mine = list.filter((iv) => Y.people(iv).some((x) => x.id === p.id));
  const others = (iv) => Y.people(iv).filter((x) => x.id !== p.id);
  document.title = `${p.name} — நேர்கண்டவர் | ${site.title}`;

  app.innerHTML = `${Y.topbar(ctx, "interviewer")}
    <main id="main" tabindex="-1" class="person-page">
      <header class="pp-head">
        ${Y.avatar(p, "xl")}
        <div class="pp-txt">
          <h1>${esc(p.name)}</h1>
          <p class="pp-meta">யாணர் நேர்கண்டவர் · ${mine.length} நேர்காணல்${mine.length === 1 ? "" : "கள்"}</p>
          ${p.bio ? `<p class="pp-bio">${esc(p.bio)}</p>` : ""}
          ${/^https?:\/\//i.test(p.link || "") ? `<p class="pp-link"><a href="${esc(p.link)}" target="_blank" rel="noopener">${esc(p.linkLabel || "மேலும் அறிய")}</a></p>` : ""}
        </div>
      </header>
      <section class="pp-list" aria-labelledby="pp-h">
        <h2 id="pp-h">இவர் எடுத்த நேர்காணல்கள்</h2>
        ${mine.length ? `<div class="grid-cards">${mine.map((iv) => Y.card(iv)).join("")}</div>`
          : `<p class="muted pp-empty">இவர் எடுத்த நேர்காணல்கள் விரைவில் வெளியாகும்.</p>`}
        ${mine.some((iv) => others(iv).length) ? `<p class="pp-with muted">உடன் நேர்கண்டவர்கள்: ${[...new Map(mine.flatMap(others).filter((x) => x.id).map((x) => [x.id, x])).values()].map((x) => `<a href="${Y.personUrl(x.id)}">${esc(x.name)}</a>`).join(" · ")}</p>` : ""}
      </section>
    </main>${Y.footer(ctx)}`;
});
