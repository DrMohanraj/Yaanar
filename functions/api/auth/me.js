import { getSession, json } from "../../_lib/util.js";
export async function onRequestGet({ request, env }) {
  const s = await getSession(request, env);
  return s ? json({ login: s.login }) : json({ error: "unauthorized" }, 401);
}
