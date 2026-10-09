"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  ANALYTICS_BASE,
  ANALYTICS_HOST,
  ANALYTICS_SCRIPT,
  DISABLED_KEY,
  eventFromAttributes,
  isAutomated,
  pathEvents,
  readOptParam,
} from "@/lib/analytics";
import { SKIP_EVENTS } from "@/lib/intro";
import { afterIntro, afterStart, idle } from "@/components/intro/after-intro";
import { analyticsOff, analyticsReady, trackEvent, trackPageview } from "./track";

/** Pages without the desktop have no intro: the tracker waits at most this long for one. */
const INTRO_WAIT_MS = 6000;
const IDLE_TIMEOUT_MS = 3000;
/** After an interaction: an idle moment, so the tracker never delays what the click or key does. */
const INTERACTION_IDLE_MS = 1000;
const NOTICE_MS = 3000;

type Notice = "out" | "in";

function storage(action?: Notice): boolean {
  try {
    if (action === "out") localStorage.setItem(DISABLED_KEY, "1");
    if (action === "in") localStorage.removeItem(DISABLED_KEY);
    return localStorage.getItem(DISABLED_KEY) === "1";
  } catch {
    return false;
  }
}

/** Umami's tracker, without auto-tracking: page views and events go through ./track. */
function loadTracker(websiteId: string) {
  if (document.querySelector(`script[src="${ANALYTICS_SCRIPT}"]`)) return;
  const script = document.createElement("script");
  script.src = ANALYTICS_SCRIPT;
  script.async = true;
  script.dataset.websiteId = websiteId;
  script.dataset.hostUrl = ANALYTICS_BASE;
  script.dataset.domains = ANALYTICS_HOST;
  script.dataset.autoTrack = "false";
  script.onload = analyticsReady;
  script.onerror = analyticsOff;
  document.head.appendChild(script);
}

/**
 * Visit statistics (production only, rendered by the root layout). The
 * tracker loads at the first interaction, or in an idle moment once the
 * intro is over and the character has its full base, so it never competes
 * with the first paint, the intro or the character. Every address is a page view (windows open without a reload);
 * events come from `data-track` clicks and from ./track.
 *
 * `?nie-licz-mnie` (EN `?dont-count-me`) turns statistics off in this browser
 * for good, `?licz-mnie` (`?count-me`) back on; the parameter leaves the
 * address at once. Automated browsers are never counted.
 */
export function Analytics({ websiteId, labels }: { websiteId: string; labels: Record<Notice, string> }) {
  const pathname = usePathname();
  const previous = useRef<{ path: string; full: string } | null>(null);
  const counting = useRef(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  // Once: the parameter, the decision, the first page view, then the tracker.
  useEffect(() => {
    const opt = readOptParam(location.search);
    const disabled = storage(opt?.action);
    // the notice waits for the end of the intro
    const hideNotice = opt ? afterIntro(() => setNotice(opt.action), INTRO_WAIT_MS) : () => {};
    if (opt) history.replaceState(null, "", location.pathname + opt.search + location.hash);

    if (disabled || isAutomated({ webdriver: navigator.webdriver, userAgent: navigator.userAgent })) {
      analyticsOff();
      return hideNotice;
    }
    counting.current = true;
    trackPageview(document.referrer);
    pathEvents(null, location.pathname).forEach(trackEvent);
    previous.current = { path: location.pathname, full: location.pathname + location.search };

    // whichever comes first (loadTracker runs once)
    const load = () => loadTracker(websiteId);
    let cancelInteraction = () => {};
    const stopListening = () => SKIP_EVENTS.forEach((e) => removeEventListener(e, onInteract, { capture: true }));
    const onInteract = () => {
      stopListening();
      cancelInteraction = idle(load, INTERACTION_IDLE_MS);
    };
    SKIP_EVENTS.forEach((e) => addEventListener(e, onInteract, { capture: true, passive: true }));
    const cancelStart = afterStart(load, { idleTimeoutMs: IDLE_TIMEOUT_MS, maxIntroWaitMs: INTRO_WAIT_MS });

    const onClick = (e: MouseEvent) => {
      const el = e.target instanceof Element ? e.target.closest("[data-track]") : null;
      const event = el && eventFromAttributes([...el.attributes]);
      if (event) trackEvent(event);
    };
    document.addEventListener("click", onClick, true);

    return () => {
      hideNotice();
      document.removeEventListener("click", onClick, true);
      stopListening();
      cancelInteraction();
      cancelStart();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per page life
  }, []);

  // Every later address: a page view (referrer = the previous address) and its events.
  useEffect(() => {
    const before = previous.current;
    if (!counting.current || !before || before.path === location.pathname) return;
    trackPageview(before.full);
    pathEvents(before.path, location.pathname).forEach(trackEvent);
    previous.current = { path: location.pathname, full: location.pathname + location.search };
  }, [pathname]);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), NOTICE_MS);
    return () => clearTimeout(t);
  }, [notice]);

  return (
    <div
      role="status"
      className="pointer-events-none fixed inset-x-0 bottom-[calc(88px+env(safe-area-inset-bottom))] z-[90] flex justify-center px-4 desk:bottom-24"
    >
      {notice && (
        <p className="analytics-notice rounded-[9px] bg-ink/90 px-3.5 py-2 text-13 font-medium text-white shadow-[0_8px_24px_-6px_rgb(0_0_0/0.45)] ring-1 ring-white/15">
          {labels[notice]}
        </p>
      )}
    </div>
  );
}
