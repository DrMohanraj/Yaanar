Y.boot((ctx) => {
  document.getElementById("app").innerHTML = `${Y.topbar(ctx, "")}
    <main class="notfound"><h1>404</h1><p class="muted">இந்தப் பக்கம் இல்லை அல்லது இடம் மாற்றப்பட்டுள்ளது.</p>
    <p><a class="btn" href="/">முகப்புக்குச் செல்</a></p></main>${Y.footer(ctx)}`;
});
