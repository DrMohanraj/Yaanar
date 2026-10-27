/* யாணர் நிர்வாகம் — GitHub மூலம் உள்நுழைவு; ஒவ்வொரு சேமிப்பும் GitHub commit */
(() => {
  const root = document.getElementById("root");
  const e = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const S = { user: null, tab: "iv", cur: null, site: null, siteSha: null, ivs: null, ivSha: null, siteDirty: false, ivDirty: false, busy: false };
  const today = () => new Date().toISOString().slice(0, 10);

  async function api(url, opts = {}) {
    const r = await fetch(url, { headers: { "Content-Type": "application/json" }, ...opts });
    let j = {}; try { j = await r.json(); } catch { /* ignore */ }
    if (!r.ok) { const err = new Error(j.error || "பிழை " + r.status); err.status = r.status; throw err; }
    return j;
  }
  function toast(msg, isErr) {
    const t = document.createElement("div");
    t.className = "toast" + (isErr ? " err" : ""); t.textContent = msg; document.body.appendChild(t);
    setTimeout(() => t.remove(), isErr ? 6000 : 3000);
  }
  function setPath(obj, path, val) {
    const k = path.split("."); let o = obj;
    for (let i = 0; i < k.length - 1; i++) o = o[k[i]];
    o[k[k.length - 1]] = val;
  }
  const ivList = () => S.ivs.interviews;
  const cur = () => ivList().find((i) => i.id === S.cur);
  const sorted = () => ivList().slice().sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  const cats = () => [...new Set(ivList().map((i) => i.category).filter(Boolean))];

  /* ---------- தொடக்கம் ---------- */
  async function start() {
    try { S.user = (await api("/api/auth/me")).login; } catch { return loginView(); }
    try {
      const [s, i] = await Promise.all([api("/api/content?path=data/site.json"), api("/api/content?path=data/interviews.json")]);
      S.site = s.data; S.siteSha = s.sha; S.ivs = i.data; S.ivSha = i.sha;
      S.cur = S.site.featuredId || (ivList()[0] && ivList()[0].id);
      S.savedIds = new Set(ivList().map((i) => i.id));
      render();
    } catch (err) {
      root.innerHTML = `<div class="login"><h1>தரவை ஏற்ற முடியவில்லை</h1><p>${e(err.message)}</p><p><a class="btn" href="/admin/">மீண்டும் முயல்க</a></p></div>`;
    }
  }

  function loginView() {
    const err = new URLSearchParams(location.search).get("error");
    const msg = { denied: "இந்த GitHub கணக்குக்கு அனுமதி இல்லை (ALLOWED_USERS-ல் சேர்க்கவும்).", state: "உள்நுழைவு சரிபார்ப்பு தோல்வி. மீண்டும் முயலவும்.", token: "GitHub உடன் இணைக்க முடியவில்லை. மீண்டும் முயலவும்." }[err];
    root.innerHTML = `<div class="login"><h1>யாணர் நிர்வாகம்</h1>
      <p>அனுமதிக்கப்பட்ட GitHub கணக்கால் மட்டுமே உள்நுழைய முடியும்.</p>
      ${msg ? `<p class="warn" style="font-size:15px">${e(msg)}</p>` : ""}
      <p><a class="btn solid" href="/api/auth/login">GitHub மூலம் உள்நுழை</a></p>
      <p style="font-size:13px">உள்நுழைவு Cloudflare-ல் வெளியிட்ட பிறகே இயங்கும்.</p></div>`;
  }

  /* ---------- காட்சி ---------- */
  function render() {
    const f = S.ivs.interviews.find((i) => i.id === S.site.featuredId);
    root.innerHTML = `<header class="top">
        <a class="brand" href="/">யாணர்</a><span class="muted">நிர்வாகம்</span>
        <nav class="tabs" role="tablist">
          <button class="tab" role="tab" data-act="tab" data-t="iv" aria-selected="${S.tab === "iv"}">நேர்காணல்கள்</button>
          <button class="tab" role="tab" data-act="tab" data-t="site" aria-selected="${S.tab === "site"}">தளம் அமைப்பு</button>
        </nav><span class="sp"></span>
        <a class="btn sm" href="/admin/reindex.html">தேடல் குறியீடு</a>
        <span class="muted">${e(S.user)}</span><a class="btn sm" href="/api/auth/logout">வெளியேறு</a>
      </header>
      <main class="wrap">
        ${S.tab === "iv" ? `<div class="banner">முகப்பில் சிறப்பு: <b>${e(f ? f.name : "—")}</b>
          ${f ? `<button class="btn sm" data-act="open" data-id="${e(f.id)}">சிறப்பு எழுத்தாளரைத் திருத்து</button>` : ""}
          <span class="muted">வேறு ஒருவரைச் சிறப்பாக்க, அவரது படிவத்தில் “முகப்பில் சிறப்பாகக் காட்டு” என்பதைத் தேர்ந்து சேமிக்கவும்.</span></div>${ivView()}` : siteView()}
      </main>`;
  }

  function ivView() {
    const iv = cur();
    return `<div class="layout">
      <aside class="list"><button class="item" data-act="new" style="font-weight:500">＋ புதிய நேர்காணல்</button>
        ${sorted().map((i) => `<button class="item" data-act="open" data-id="${e(i.id)}" aria-current="${i.id === S.cur}">
          <img src="${e(i.photo)}" alt=""><span><b>${i.id === S.site.featuredId ? '<span class="star">★ </span>' : ""}${e(i.name)}</b><small>${e(i.category)} · ${e(i.date)}</small></span></button>`).join("")}
      </aside>
      <section>${iv ? editor(iv) : '<p class="muted">இடப்புறம் ஒரு நேர்காணலைத் தேர்ந்தெடுங்கள்.</p>'}</section></div>`;
  }

  function editor(iv) {
    const hl = [0, 1, 2].map((k) => (iv.heroLines || [])[k] || "");
    const isF = S.site.featuredId === iv.id;
    return `<datalist id="cats">${cats().map((c) => `<option value="${e(c)}">`).join("")}</datalist>
    <fieldset><legend>எழுத்தாளர்</legend>
      <div class="row2"><div><label>பெயர்</label><input type="text" data-p="name" value="${e(iv.name)}"></div>
        <div><label>காலம் (பிறப்பு / வாழ்ந்த காலம்)</label><input type="text" data-p="period" value="${e(iv.period)}"></div></div>
      <div class="row3"><div><label>வகை</label><input type="text" list="cats" data-p="category" value="${e(iv.category)}"></div>
        <div><label>நேர்காணல் தேதி</label><input type="date" data-p="date" value="${e(iv.date)}"></div>
        <div><label>அடையாளம் (ID — ஆங்கில எழுத்துகள்)</label><input type="text" data-p="id" value="${e(iv.id)}" ${S.savedIds?.has(iv.id) ? "readonly" : ""}></div></div>
      <label>நேர்காணல் தலைப்பு</label><input type="text" data-p="title" value="${e(iv.title)}">
      <label>புகைப்படம்</label>
      <div class="photo"><img id="ph" src="${e(iv.photo)}" alt=""><div style="flex:1">
        <input type="text" data-p="photo" value="${e(iv.photo)}"><p style="margin:.4rem 0"><button class="btn sm" data-act="upload" data-target="iv">படத்தைப் பதிவேற்று</button> <span class="muted">சதுரப் படம் சிறந்தது (தானாகச் சுருக்கப்படும்)</span></p></div></div>
      <label>சுருக்கம் (அட்டைகளில் வரும், 1–2 வரிகள்)</label><textarea data-p="summary" style="min-height:4rem">${e(iv.summary)}</textarea>
      <label>எழுத்தாளர் அறிமுகம் (சிறு பத்தி)</label><textarea data-p="intro">${e(iv.intro)}</textarea></fieldset>
    <fieldset><legend>முகப்புப் பக்கம்</legend>
      <label><input type="checkbox" data-act="feature" ${isF ? "checked" : ""}> முகப்பில் சிறப்பாகக் காட்டு (hero படம் + பெரிய எழுத்துகள் இந்த நேர்காணலுக்கு மாறும்)</label>
      <p class="muted" style="margin:.6rem 0 0">hero-வில் குதிக்கும் பெரிய எழுத்துகள் (3 குறுகிய வரிகள், நேர்காணலின் முக்கிய வரி). வெறுமையாக விட்டால் முதல் கேள்வியின் முக்கிய வரியிலிருந்து தானாக அமையும்.</p>
      <div class="row3">${hl.map((v, k) => `<div><label>வரி ${k + 1}</label><input type="text" data-hero="${k}" value="${e(v)}"></div>`).join("")}</div></fieldset>
    <fieldset><legend>கேள்வி–பதில்கள் (<span id="qcount">${(iv.qa || []).length}</span>)</legend>
      <div id="qalist">${(iv.qa || []).map(qaRow).join("")}</div>
      <button class="btn sm" data-act="qa-add">＋ கேள்வி சேர்</button></fieldset>
    <div class="bar"><button class="btn solid" data-act="save-iv" ${S.busy ? "disabled" : ""}>சேமி (GitHub-ல் பதிவு)</button>
      <button class="btn danger" data-act="del">இந்த நேர்காணலை நீக்கு</button>
      <a class="btn" href="/interview.html?id=${encodeURIComponent(iv.id)}" target="_blank" rel="noopener">பக்கத்தைப் பார்</a>
      <span class="muted" id="dirty">${S.ivDirty || S.siteDirty ? "சேமிக்கப்படாத மாற்றங்கள் உள்ளன" : ""}</span></div>
    <p class="muted">சேமித்த பிறகு <a href="/admin/reindex.html">தேடல் குறியீட்டைப் புதுப்பிக்கவும்</a>; 1–2 நிமிடத்தில் தளம் புதுப்பிக்கப்படும்.</p>`;
  }

  function qaRow(x, i, arr) {
    const last = i === (cur().qa.length - 1);
    return `<div class="qa-row" data-row="${i}"><header><b>${String(i + 1).padStart(2, "0")}</b><span class="sp"></span>
      <button class="btn sm" data-act="qa-up" data-i="${i}" ${i === 0 ? "disabled" : ""} aria-label="மேலே">↑</button>
      <button class="btn sm" data-act="qa-down" data-i="${i}" ${last ? "disabled" : ""} aria-label="கீழே">↓</button>
      <button class="btn sm danger" data-act="qa-del" data-i="${i}">நீக்கு</button></header>
      <label>கேள்வி</label><input type="text" data-qa="${i}.q" value="${e(x.q)}">
      <label>பதில் (பத்திகளைப் பிரிக்க ஒரு வெற்று வரி விடுங்கள்)</label><textarea data-qa="${i}.a">${e(x.a)}</textarea>
      <label>Splash மேற்கோள் — பதிலிலிருந்து முக்கிய வரி / சொற்றொடரை அப்படியே நகலெடுத்து இடுங்கள்</label>
      <input type="text" data-qa="${i}.hl" value="${e(x.hl)}"><div class="warn" data-warn="${i}">${warnText(x)}</div></div>`;
  }
  const warnText = (x) => (x.hl && !String(x.a).includes(x.hl) ? "⚠ இந்த வரி பதிலில் அப்படியே இல்லை; பதிலில் முன்னிலைப்படுத்தப்படாது (splash-ல் வரும்)." : "");

  function personFields(prefix, p, label) {
    return `<fieldset><legend>${label}</legend><div class="row2">
      <div><label>பெயர்</label><input type="text" data-s="${prefix}.name" value="${e(p.name)}"></div>
      <div><label>பொறுப்பு</label><input type="text" data-s="${prefix}.role" value="${e(p.role)}"></div></div>
      <label>சிறு அறிமுகம்</label><textarea data-s="${prefix}.bio" style="min-height:4rem">${e(p.bio)}</textarea>
      <label>புகைப்படம்</label><div class="photo"><img src="${e(p.photo)}" alt="" data-img="${prefix}"><div style="flex:1">
        <input type="text" data-s="${prefix}.photo" value="${e(p.photo)}"><p style="margin:.4rem 0"><button class="btn sm" data-act="upload" data-target="${prefix}">பதிவேற்று</button></p></div></div></fieldset>`;
  }

  function siteView() {
    const s = S.site; const so = s.social || {};
    return `<fieldset><legend>தளம்</legend>
        <div class="row2"><div><label>தளத்தின் தலைப்பு</label><input type="text" data-s="title" value="${e(s.title)}"></div>
          <div><label>முகப்பு வாசகம் (tagline)</label><input type="text" data-s="tagline" value="${e(s.tagline)}"></div></div>
        <label>முகப்பின் மேல் சிறு வரி</label><input type="text" data-s="heroKicker" value="${e(s.heroKicker)}"></fieldset>
      <fieldset><legend>எங்களைப் பற்றி</legend>
        <label>தலைப்பு</label><input type="text" data-s="aboutHeading" value="${e(s.aboutHeading)}">
        <label>உள்ளடக்கம் (பத்திகளுக்கு இடையே வெற்று வரி)</label><textarea data-s="about" style="min-height:10rem">${e(s.about)}</textarea></fieldset>
      <fieldset><legend>அடிக்குறிப்பு, தொடர்பு</legend>
        <label>அடிக்குறிப்பு உரை</label><textarea data-s="footerText" style="min-height:4rem">${e(s.footerText)}</textarea>
        <div class="row2"><div><label>மின்னஞ்சல்</label><input type="email" data-s="email" value="${e(s.email)}"></div>
          <div><label>Facebook முகவரி</label><input type="url" data-s="social.facebook" value="${e(so.facebook)}"></div>
          <div><label>YouTube முகவரி</label><input type="url" data-s="social.youtube" value="${e(so.youtube)}"></div>
          <div><label>Instagram முகவரி</label><input type="url" data-s="social.instagram" value="${e(so.instagram)}"></div></div></fieldset>
      ${personFields("team.chief", s.team.chief, "முதன்மை ஆசிரியர்")}
      ${s.team.editors.map((p, i) => personFields(`team.editors.${i}`, p, `துணை ஆசிரியர் ${i + 1}`)).join("")}
      <div class="bar"><button class="btn solid" data-act="save-site" ${S.busy ? "disabled" : ""}>சேமி (GitHub-ல் பதிவு)</button><span class="muted" id="dirty">${S.siteDirty ? "சேமிக்கப்படாத மாற்றங்கள் உள்ளன" : ""}</span></div>`;
  }

  /* ---------- சேமித்தல் ---------- */
  async function put(path, data, sha, label) {
    try {
      const r = await api("/api/content", { method: "PUT", body: JSON.stringify({ path, data, sha, message: `admin: ${label}` }) });
      return r.sha;
    } catch (err) {
      if (err.status === 409) toast("வேறு இடத்தில் இந்தக் கோப்பு மாற்றப்பட்டுள்ளது. பக்கத்தை மீண்டும் ஏற்றி மறுபடி முயலவும்.", true);
      else toast(err.message, true);
      throw err;
    }
  }
  async function saveIv() {
    const iv = cur(); if (!iv) return;
    if (!iv.name.trim()) return toast("பெயர் அவசியம்.", true);
    if (!/^[a-z0-9][a-z0-9-]*$/i.test(iv.id)) return toast("ID-ல் ஆங்கில எழுத்து, எண், '-' மட்டும் இருக்க வேண்டும்.", true);
    if (ivList().filter((i) => i.id === iv.id).length > 1) return toast("இந்த ID ஏற்கெனவே உள்ளது.", true);
    iv.heroLines = (iv.heroLines || []).map((x) => x.trim()).filter(Boolean);
    iv.qa = iv.qa.filter((x) => x.q.trim() || x.a.trim());
    S.busy = true;
    try {
      S.ivSha = await put("data/interviews.json", S.ivs, S.ivSha, `update ${iv.id}`);
      S.ivDirty = false;
      if (S.siteDirty) { S.siteSha = await put("data/site.json", S.site, S.siteSha, "featured interview"); S.siteDirty = false; }
      S.savedIds = new Set(ivList().map((i) => i.id));
      toast("சேமிக்கப்பட்டது ✓ — இப்போது தேடல் குறியீட்டைப் புதுப்பிக்கவும்");
    } catch { /* toast காட்டப்பட்டுள்ளது */ }
    S.busy = false; render();
  }
  async function saveSite() {
    S.busy = true;
    try { S.siteSha = await put("data/site.json", S.site, S.siteSha, "site settings"); S.siteDirty = false; toast("சேமிக்கப்பட்டது ✓"); } catch { /* */ }
    S.busy = false; render();
  }

  /* ---------- படம் பதிவேற்றம் (உலாவியிலேயே சுருக்கி) ---------- */
  function pickImage(maxSide = 1400) {
    return new Promise((resolve, reject) => {
      const inp = document.createElement("input"); inp.type = "file"; inp.accept = "image/*";
      inp.onchange = () => {
        const file = inp.files[0]; if (!file) return reject(new Error("no file"));
        const img = new Image();
        img.onload = () => {
          const k = Math.min(1, maxSide / Math.max(img.width, img.height));
          const c = document.createElement("canvas"); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
          c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
          resolve({ name: file.name.replace(/\.[^.]+$/, "") + ".jpg", data: c.toDataURL("image/jpeg", 0.86).split(",")[1] });
        };
        img.onerror = () => reject(new Error("படத்தைப் படிக்க முடியவில்லை"));
        img.src = URL.createObjectURL(file);
      };
      inp.click();
    });
  }
  async function upload(target) {
    try {
      const f = await pickImage(); toast("பதிவேற்றுகிறது…");
      const { url } = await api("/api/upload", { method: "POST", body: JSON.stringify(f) });
      if (target === "iv") { cur().photo = url; S.ivDirty = true; }
      else { setPath(S.site, target + ".photo", url); S.siteDirty = true; }
      toast("படம் பதிவேற்றப்பட்டது ✓ (சேமிக்க மறக்காதீர்கள்)"); render();
    } catch (err) { if (err.message !== "no file") toast(err.message, true); }
  }

  /* ---------- நிகழ்வுகள் ---------- */
  const markDirty = (kind) => { S[kind] = true; const d = document.getElementById("dirty"); if (d) d.textContent = "சேமிக்கப்படாத மாற்றங்கள் உள்ளன"; };

  root.addEventListener("input", (ev) => {
    const t = ev.target, iv = S.ivs && cur();
    if (t.dataset.p !== undefined && iv) {
      iv[t.dataset.p] = t.value; markDirty("ivDirty");
      if (t.dataset.p === "photo") document.getElementById("ph").src = t.value;
    } else if (t.dataset.hero !== undefined && iv) {
      iv.heroLines = iv.heroLines || []; iv.heroLines[+t.dataset.hero] = t.value; markDirty("ivDirty");
    } else if (t.dataset.qa !== undefined && iv) {
      const [i, f] = t.dataset.qa.split("."); iv.qa[+i][f] = t.value; markDirty("ivDirty");
      const w = root.querySelector(`[data-warn="${i}"]`); if (w) w.textContent = warnText(iv.qa[+i]);
    } else if (t.dataset.s !== undefined) {
      setPath(S.site, t.dataset.s, t.value); markDirty("siteDirty");
      if (t.dataset.s.endsWith(".photo")) { const im = root.querySelector(`[data-img="${t.dataset.s.replace(/\.photo$/, "")}"]`); if (im) im.src = t.value; }
    }
  });

  root.addEventListener("click", async (ev) => {
    const b = ev.target.closest("[data-act]"); if (!b) return;
    const act = b.dataset.act, iv = S.ivs && cur(), i = +b.dataset.i;
    if (b.tagName === "BUTTON" || b.tagName === "A") { if (b.tagName === "BUTTON") ev.preventDefault(); }
    if (act === "tab") { S.tab = b.dataset.t; render(); }
    else if (act === "open") { S.tab = "iv"; S.cur = b.dataset.id; render(); window.scrollTo(0, 0); }
    else if (act === "new") {
      const n = { id: "iv-" + Date.now().toString(36), name: "புதிய எழுத்தாளர்", period: "", date: today(), category: cats()[0] || "", photo: "/assets/img/writer-1.jpg", title: "", summary: "", intro: "", heroLines: [], qa: Array.from({ length: 20 }, () => ({ q: "", a: "", hl: "" })) };
      ivList().unshift(n); S.cur = n.id; S.ivDirty = true; render(); window.scrollTo(0, 0);
    }
    else if (act === "qa-add") { iv.qa.push({ q: "", a: "", hl: "" }); S.ivDirty = true; render(); }
    else if (act === "qa-del") { if (confirm("இந்தக் கேள்வி–பதிலை நீக்கவா?")) { iv.qa.splice(i, 1); S.ivDirty = true; render(); } }
    else if (act === "qa-up" && i > 0) { [iv.qa[i - 1], iv.qa[i]] = [iv.qa[i], iv.qa[i - 1]]; S.ivDirty = true; render(); }
    else if (act === "qa-down" && i < iv.qa.length - 1) { [iv.qa[i + 1], iv.qa[i]] = [iv.qa[i], iv.qa[i + 1]]; S.ivDirty = true; render(); }
    else if (act === "upload") upload(b.dataset.target);
    else if (act === "save-iv") saveIv();
    else if (act === "save-site") saveSite();
    else if (act === "del") {
      if (!confirm(`“${iv.name}” நேர்காணலை நிரந்தரமாக நீக்கவா?`)) return;
      S.ivs.interviews = ivList().filter((x) => x.id !== iv.id);
      if (S.site.featuredId === iv.id) { S.site.featuredId = (sorted()[0] || {}).id || ""; S.siteDirty = true; }
      S.cur = (sorted()[0] || {}).id || null;
      S.busy = true;
      try {
        S.ivSha = await put("data/interviews.json", S.ivs, S.ivSha, `delete ${iv.id}`);
        if (S.siteDirty) { S.siteSha = await put("data/site.json", S.site, S.siteSha, "featured interview"); S.siteDirty = false; }
        S.ivDirty = false; toast("நீக்கப்பட்டது");
      } catch { /* */ }
      S.busy = false; render();
    }
  });
  root.addEventListener("change", (ev) => {
    const t = ev.target;
    if (t.dataset.act === "feature") {
      S.site.featuredId = t.checked ? S.cur : S.site.featuredId; S.siteDirty = true;
      if (!t.checked) t.checked = true; // எப்போதும் ஒரு சிறப்பு நேர்காணல் வேண்டும்
      markDirty("siteDirty"); render();
    }
  });
  addEventListener("beforeunload", (ev) => { if (S.ivDirty || S.siteDirty) { ev.preventDefault(); ev.returnValue = ""; } });

  start();
})();
