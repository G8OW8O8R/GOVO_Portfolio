import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, isLocale } from "@/lib/i18n";

/** Paths without a language prefix go to the Polish version. */
export function proxy(request: NextRequest) {
  const [, first = ""] = request.nextUrl.pathname.split("/");
  if (isLocale(first)) return;

  const url = request.nextUrl.clone();
  url.pathname = `/${defaultLocale}${url.pathname === "/" ? "" : url.pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Skip Next internals, API routes and files with an extension (public assets).
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
