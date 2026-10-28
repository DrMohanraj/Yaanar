// Cloudflare Worker நுழைவு: /api/* கோரிக்கைகளை functions/ கோப்புகளுக்கு அனுப்பும்; மற்றவை public/ நிலையான கோப்புகள்
import * as content from "../functions/api/content.js";
import * as reindex from "../functions/api/reindex.js";
import * as search from "../functions/api/search.js";
import * as upload from "../functions/api/upload.js";
import * as callback from "../functions/api/auth/callback.js";
import * as login from "../functions/api/auth/login.js";
import * as logout from "../functions/api/auth/logout.js";
import * as me from "../functions/api/auth/me.js";

const ROUTES = {
  "/api/content": content,
  "/api/reindex": reindex,
  "/api/search": search,
  "/api/upload": upload,
  "/api/auth/callback": callback,
  "/api/auth/login": login,
  "/api/auth/logout": logout,
  "/api/auth/me": me,
};

export default {
  async fetch(request, env, ctx) {
    const path = new URL(request.url).pathname.replace(/\/+$/, "");
    const mod = ROUTES[path];
    if (!mod) {
      if (path.startsWith("/api/")) return new Response("Not found", { status: 404 });
      return env.ASSETS.fetch(request);
    }
    // Pages Functions வடிவம்: onRequestGet / onRequestPost … இல்லையெனில் onRequest
    const m = request.method.charAt(0) + request.method.slice(1).toLowerCase();
    const handler = mod["onRequest" + m] || mod.onRequest;
    if (!handler) return new Response("Method not allowed", { status: 405 });
    return handler({ request, env, ctx, waitUntil: (p) => ctx.waitUntil(p), params: {} });
  },
};
