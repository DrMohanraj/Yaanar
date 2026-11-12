/* தேடல் குறியீட்டைப் புதுப்பிக்கும் பக்கம் */
const log = document.getElementById("log"), go = document.getElementById("go");
fetch("/api/auth/me").then(r => { if (!r.ok) throw 0; }).catch(() => {
  document.getElementById("main").innerHTML = '<p>முதலில் <a href="/admin/">உள்நுழைக</a>.</p>';
});
go.onclick = async () => {
  go.disabled = true; log.textContent = "புதுப்பிக்கிறது… (நேர்காணல்கள் அதிகமாக இருந்தால் சில நிமிடங்கள் ஆகலாம்)";
  try {
    const r = await fetch("/api/reindex", { method: "POST" });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error || r.status);
    log.textContent = `முடிந்தது ✓\nபகுதிகள்: ${j.chunks}\nAI வெக்டர்கள்: ${j.embedded}\nஆய்வாளர் உதவிக் கோப்புகள் (R2): ${j.r2 ?? 0}\n${j.note || ""}`;
  } catch (e) { log.textContent = "பிழை: " + e.message; }
  go.disabled = false;
};
