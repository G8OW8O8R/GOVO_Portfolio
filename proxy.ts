import { NextResponse, type NextRequest } from "next/server";
import { isLocale } from "@/lib/i18n";
import { unprefixedTarget } from "@/lib/redirects";

/** The project's old address on Vercel; everything on it moves to the site's own domain. */
const OLD_HOST = "govodigital.vercel.app";
const SITE_HOST = "www.govodigital.com";

/**
 * Paths without a language prefix go to the Polish version, and the old
 * Vercel address goes to the site's domain: one permanent redirect, never a chain.
 */
export function proxy(request: NextRequest) {
  const [, first = ""] = request.nextUrl.pathname.split("/");
  const prefixed = isLocale(first);
  const oldHost = request.headers.get("host") === OLD_HOST;
  if (prefixed && !oldHost) return;

  const url = request.nextUrl.clone();
  if (!prefixed) {
    const [pathname, hash = ""] = unprefixedTarget(url.pathname).split("#");
    url.pathname = pathname;
    url.hash = hash;
  }
  if (oldHost) {
    url.protocol = "https:";
    url.host = SITE_HOST;
    url.port = "";
  }
  return NextResponse.redirect(url, 301);
}

export const config = {
  // Skip Next internals, API routes, the statistics proxy (/s/…) and files with an extension (public assets).
  matcher: ["/((?!api|_next|s/|.*\\..*).*)"],
};
