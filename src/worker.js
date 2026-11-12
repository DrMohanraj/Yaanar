// Cloudflare Worker நுழைவு:
//  /api/*            → functions/ கோப்புகள்
//  / , /interview    → நிலையான பக்கம் + WhatsApp/Facebook பகிர்வுக்கான தலைப்பு, சுருக்கம், படம் (og:*)
//  /sitemap.xml, /robots.txt → interviews.json-லிருந்து உருவாக்கப்படும்
//  மற்றவை public/ நிலையான கோப்புகள் (Worker-ஐத் தொடாமலே)
import * as ask from "../functions/api/ask.js";
import * as content from "../functions/api/content.js";
import * as reindex from "../functions/api/reindex.js";
import * as search from "../functions/api/search.js";
import * as upload from "../functions/api/upload.js";
import * as callback from "../functions/api/auth/callback.js";
import * as login from "../functions/api/auth/login.js";
import * as logout from "../functions/api/auth/logout.js";
import * as me from "../functions/api/auth/me.js";

const ROUTES = {
  "/api/ask": ask,
  "/api/content": content,
  "/api/reindex": reindex,
  "/api/search": search,
  "/api/upload": upload,
  "/api/auth/callback": callback,
  "/api/auth/login": login,
  "/api/auth/logout": logout,
  "/api/auth/me": me,
};

/* public/_headers-ல் உள்ளவையே; Worker தரும் பதில்களுக்கும் */
const SECURITY = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Frame-Options": "DENY",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'",
};
function secure(res) {
  const out = new Response(res.body, res);
  for (const [k, v] of Object.entries(SECURITY)) if (!out.headers.has(k)) out.headers.set(k, v);
  return out;
}

/* ---------- தளத் தரவு (ஒரு isolate-க்கு ஒருமுறை ஏற்றம்; புதிய deploy = புதிய தரவு) ---------- */
let dataCache = null;
async function siteData(env, origin) {
  if (dataCache) return dataCache;
  const get = async (p) => {
    const r = await env.ASSETS.fetch(new Request(origin + p));
    return r.ok ? r.json() : null;
  };
  const [ivs, site] = await Promise.all([get("/data/interviews.json"), get("/data/site.json")]);
  dataCache = { interviews: ivs?.interviews || [], site: site || {} };
  return dataCache;
}

const escXml = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[c]);
const clip = (s, n) => {
  const t = String(s || "").replace(/\s+/g, " ").trim();
  return t.length > n ? t.slice(0, n - 1).trimEnd() + "…" : t;
};
const abs = (origin, p) => (/^https?:\/\//i.test(p || "") ? p : origin + (p || ""));

/* ---------- பகிர்வு முன்னோட்டம் (og:*) ---------- */
class SetText {
  constructor(t) { this.t = t; }
  element(el) { el.setInnerContent(this.t); }
}
class SetContent {
  constructor(v) { this.v = v; }
  element(el) { el.setAttribute("content", this.v); }
}
class AppendHead {
  constructor(html) { this.html = html; }
  element(el) { el.append(this.html, { html: true }); }
}

function withMeta(res, { title, desc, image, url, type = "website" }) {
  const extra = [
    `<link rel="canonical" href="${escXml(url)}">`,
    `<meta property="og:url" content="${escXml(url)}">`,
    `<meta property="og:site_name" content="யாணர்">`,
    `<meta property="og:locale" content="ta_IN">`,
    image ? `<meta property="og:image" content="${escXml(image)}">` : "",
    image ? `<meta property="og:image:alt" content="${escXml(title)}">` : "",
    `<meta name="twitter:card" content="${image ? "summary_large_image" : "summary"}">`,
    `<meta name="twitter:title" content="${escXml(title)}">`,
    `<meta name="twitter:description" content="${escXml(desc)}">`,
    image ? `<meta name="twitter:image" content="${escXml(image)}">` : "",
  ].join("");
  return new HTMLRewriter()
    .on("title", new SetText(title))
    .on('meta[name="description"]', new SetContent(desc))
    .on('meta[property="og:title"]', new SetContent(title))
    .on('meta[property="og:description"]', new SetContent(desc))
    .on('meta[property="og:type"]', new SetContent(type))
    .on("head", new AppendHead(extra))
    .transform(res);
}

async function page(request, env, url) {
  const res = await env.ASSETS.fetch(request);
  if (!res.ok || !(res.headers.get("Content-Type") || "").includes("text/html")) return res;
  try {
    const { interviews, site } = await siteData(env, url.origin);
    const siteTitle = site.title || "யாணர்";
    if (url.pathname === "/interview") {
      const id = url.searchParams.get("id");
      const iv = interviews.find((x) => x.id === id);
      if (!iv) return res;
      return withMeta(res, {
        title: `${iv.name} — ${iv.title} | ${siteTitle}`,
        desc: clip(iv.summary || iv.intro || site.tagline, 200),
        image: iv.photo ? abs(url.origin, iv.photo) : "",
        url: `${url.origin}/interview?id=${encodeURIComponent(iv.id)}`,
        type: "article",
      });
    }
    // முகப்பு: சிறப்பு நேர்காணலின் படம்
    const featured = interviews.find((x) => x.id === site.featuredId) || interviews[0];
    return withMeta(res, {
      title: `${siteTitle} — ${site.tagline || "தமிழ் எழுத்தாளர் நேர்காணல்கள்"}`,
      desc: clip(site.footerText || site.tagline, 200),
      image: featured?.photo ? abs(url.origin, featured.photo) : "",
      url: url.origin + "/",
    });
  } catch (e) {
    console.error("meta", e);
    return res; // தரவுப் பிழையிலும் பக்கம் வழக்கம்போல்
  }
}

async function sitemap(env, url) {
  const { interviews } = await siteData(env, url.origin);
  const o = url.origin;
  const rows = [
    [`${o}/`, ""],
    [`${o}/collection`, ""],
    [`${o}/about`, ""],
    [`${o}/search`, ""],
    ...interviews.map((iv) => [`${o}/interview?id=${encodeURIComponent(iv.id)}`, /^\d{4}-\d{2}-\d{2}/.test(iv.date || "") ? iv.date.slice(0, 10) : ""]),
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows
    .map(([loc, mod]) => `  <url><loc>${escXml(loc)}</loc>${mod ? `<lastmod>${mod}</lastmod>` : ""}</url>`)
    .join("\n")}\n</urlset>\n`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}

const robots = (url) =>
  new Response(`User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\n\nSitemap: ${url.origin}/sitemap.xml\n`, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";

    if (path === "/sitemap.xml") return secure(await sitemap(env, url));
    if (path === "/robots.txt") return secure(robots(url));
    if ((path === "/" || path === "/interview") && (request.method === "GET" || request.method === "HEAD")) {
      return secure(await page(request, env, url));
    }

    const mod = ROUTES[path];
    if (!mod) {
      if (path.startsWith("/api/")) return secure(new Response("Not found", { status: 404 }));
      return env.ASSETS.fetch(request);
    }
    // Pages Functions வடிவம்: onRequestGet / onRequestPost … இல்லையெனில் onRequest
    const m = request.method.charAt(0) + request.method.slice(1).toLowerCase();
    const handler = mod["onRequest" + m] || mod.onRequest;
    if (!handler) return secure(new Response("Method not allowed", { status: 405 }));
    return secure(await handler({ request, env, ctx, waitUntil: (p) => ctx.waitUntil(p), params: {} }));
  },
};
