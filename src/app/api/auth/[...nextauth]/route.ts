import { handlers } from "@/auth";
import { NextRequest } from "next/server";

export const GET = handlers.GET;

export async function POST(req: NextRequest) {
  const res = await handlers.POST(req);
  
  const rememberMe = req.cookies.get("remember-me")?.value;
  if (rememberMe === "false") {
    const setCookies = res.headers.getSetCookie();
    res.headers.delete("Set-Cookie");
    for (const cookie of setCookies) {
      if (cookie.includes("authjs.session-token") || cookie.includes("next-auth.session-token")) {
        const modifiedCookie = cookie.replace(/Max-Age=\d+;?\s*/gi, '').replace(/Expires=[^;]+;?\s*/gi, '');
        res.headers.append("Set-Cookie", modifiedCookie);
      } else {
        res.headers.append("Set-Cookie", cookie);
      }
    }
  }
  return res;
}
