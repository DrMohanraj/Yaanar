import { setCookie } from "../../_lib/util.js";
export async function onRequest() {
  return new Response(null, { status: 302, headers: { Location: "/admin/", "Set-Cookie": setCookie("yaanar_session", "", 0) } });
}
