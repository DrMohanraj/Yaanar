/* தொகுப்பு — வகை வாரியாக வடிகட்டல், பெயர்/தலைப்பு தேடல் */
Y.boot((ctx) => {
  const { esc, icons } = Y;
  const { list, cats } = ctx;
  const params = new URLSearchParams(location.search);
  let cat = cats.includes(params.get("cat")) ? params.get("cat") : "";
  let q = params.get("q") || "";

  document.getElementById("app").innerHTML = `${Y.topbar(ctx, "collection")}
    <main>
      <div class="page-head">
        <p class="label" style="color:var(--primary)">தொகுப்பு</p><span class="rule" style="margin-top:.75rem"></span>
        <h1>எல்லா நேர்காணல்களும்</h1>
        <p class="lead">எழுத்தாளர் பெயர் அல்லது தலைப்பால் தேடுங்கள்; வகையைத் தேர்ந்து வடிகட்டுங்கள். அட்டையைத் தொட்டால் அந்த எழுத்தாளரின் பக்கம் திறக்கும்.</p>
      </div>
      <div class="tools">
        <label class="field">${icons.search()}<span class="sr-only">தேடல்</span>
          <input id="q" type="search" placeholder="எழுத்தாளர் பெயர் அல்லது தலைப்பு" value="${esc(q)}" autocomplete="off"></label>
        <div class="chips" id="chips" role="group" aria-label="வகை வடிகட்டி"></div>
      </div>
      <p class="count" id="count" style="padding:1rem 2rem" aria-live="polite"></p>
      <div class="grid-cards" id="grid"></div>
    </main>${Y.footer(ctx)}`;

  const chips = document.getElementById("chips");
  const grid = document.getElementById("grid");
  const count = document.getElementById("count");
  const norm = (s) => String(s || "").toLowerCase().normalize("NFC");

  function draw() {
    chips.innerHTML = ["", ...cats].map((c) => `<button class="chip" data-c="${esc(c)}" aria-pressed="${c === cat}">${c ? esc(c) : "அனைத்தும்"}</button>`).join("");
    const nq = norm(q.trim());
    const out = list.filter((i) => (!cat || i.category === cat) && (!nq || norm(i.name).includes(nq) || norm(i.title).includes(nq)));
    count.textContent = `${out.length} நேர்காணல்கள்`;
    grid.innerHTML = out.length ? out.map((i) => Y.card(i)).join("") : `<div class="empty" style="grid-column:1/-1">பொருத்தமான நேர்காணல் இல்லை. வகையை மாற்றுங்கள் அல்லது வேறு சொல்லில் தேடுங்கள்.</div>`;
    const u = new URL(location.href);
    cat ? u.searchParams.set("cat", cat) : u.searchParams.delete("cat");
    q.trim() ? u.searchParams.set("q", q.trim()) : u.searchParams.delete("q");
    history.replaceState(null, "", u);
  }
  chips.addEventListener("click", (e) => { const b = e.target.closest(".chip"); if (b) { cat = b.dataset.c; draw(); } });
  document.getElementById("q").addEventListener("input", (e) => { q = e.target.value; draw(); });
  draw();
});
