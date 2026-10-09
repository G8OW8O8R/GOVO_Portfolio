import { NextResponse, type NextRequest } from "next/server";
import { isLocale } from "@/lib/i18n";
import { unprefixedTarget } from "@/lib/redirects";

/** Paths without a language prefix go to the Polish version: one permanent redirect, never a chain. */
export function proxy(request: NextRequest) {
  const [, first = ""] = request.nextUrl.pathname.split("/");
  if (isLocale(first)) return;

  const url = request.nextUrl.clone();
  const [pathname, hash = ""] = unprefixedTarget(url.pathname).split("#");
  url.pathname = pathname;
  url.hash = hash;
  return NextResponse.redirect(url, 301);
}

export const config = {
  // Skip Next internals, API routes, the statistics proxy (/s/…) and files with an extension (public assets).
  matcher: ["/((?!api|_next|s/|.*\\..*).*)"],
};
