"use client";

import { useOpenWindowKey } from "@/components/window/store";
import { isOfferPage } from "@/lib/routes";

/**
 * The desktop's hidden heading. Service, pricing and local pages bring their
 * own h1 in the window, so there it steps back to a paragraph (the URL
 * decides, on the server too).
 */
export function DesktopHeading({ text }: { text: string }) {
  const key = useOpenWindowKey();
  const Tag = key && isOfferPage(key) ? "p" : "h1";
  return <Tag className="sr-only">{text}</Tag>;
}
