// relative imports only: next.config.ts reads the paths below
import { SITE_URL } from "../content/profile/contact";
import { windowKeyForPath } from "./routes";

/**
 * Visit statistics: Umami Cloud, no cookies. The tracker and the endpoint
 * are served from our own domain (rewrites in next.config.ts), so ad
 * blockers that drop third-party analytics leave them alone.
 */
export const UMAMI_ORIGIN = "https://cloud.umami.is";
/** Our path in front of Umami: /s/script.js and /s/api/send. */
export const ANALYTICS_BASE = "/s";
export const ANALYTICS_SCRIPT = `${ANALYTICS_BASE}/script.js`;

/**
 * How /s/api/send reaches Umami. "rewrite": a plain proxy rewrite – Umami
 * then sees Vercel's IP and places every visit at the edge's location.
 * "relay": app/s/api/send/route.ts forwards the request with the visitor's IP.
 */
export const UMAMI_SEND: "rewrite" | "relay" = "relay";

/** The only host that sends (data-domains): a local or preview build never counts. */
export const ANALYTICS_HOST = new URL(SITE_URL).hostname;

/** Set by ?nie-licz-mnie; Umami's own tracker honours the same key. */
export const DISABLED_KEY = "umami.disabled";

const OPT_OUT = ["nie-licz-mnie", "dont-count-me"];
const OPT_IN = ["licz-mnie", "count-me"];

/**
 * Production on Vercel only (not dev, not preview). End-to-end tests turn it
 * on with ANALYTICS_E2E=1 and serve their own tracker.
 */
export function analyticsWebsiteId(env: Record<string, string | undefined>): string | null {
  const id = env.NEXT_PUBLIC_UMAMI_WEBSITE_ID?.trim();
  if (!id) return null;
  return env.VERCEL_ENV === "production" || env.ANALYTICS_E2E === "1" ? id : null;
}

/** Automated browsers: Playwright, Lighthouse, headless measurements. */
export function isAutomated({ webdriver, userAgent }: { webdriver?: boolean; userAgent: string }): boolean {
  return webdriver === true || /Chrome-Lighthouse|HeadlessChrome/.test(userAgent);
}

/**
 * `?nie-licz-mnie` / `?licz-mnie` (EN `?dont-count-me` / `?count-me`, both
 * work on either language): what to do and the query string without them.
 */
export function readOptParam(search: string): { action: "out" | "in"; search: string } | null {
  const params = new URLSearchParams(search);
  const keys = [...params.keys()];
  const action = keys.some((k) => OPT_OUT.includes(k)) ? "out" : keys.some((k) => OPT_IN.includes(k)) ? "in" : null;
  if (!action) return null;
  for (const key of [...OPT_OUT, ...OPT_IN]) params.delete(key);
  const rest = params.toString();
  return { action, search: rest ? `?${rest}` : "" };
}

/** Events and their properties (no personal data: ids only, never what a visitor typed). */
export type EventMap = {
  "window-open": { window: string };
  "service-view": { service: string };
  quicklook: { file: string };
  "cta-cooperate": undefined;
  "contact-sent": { topic: string; budget: string };
  "cv-download": { lang: string };
  [live: `${string}-open-live`]: undefined;
};
export type EventName = keyof EventMap;
export type Event = { name: string; data?: Record<string, string> };

/**
 * Events of a path change. `window-open`: a window opened on the desktop
 * (an address entered directly is a page view only). `service-view`: a
 * service page shown, also when entered from a search engine.
 */
export function pathEvents(previous: string | null, next: string): Event[] {
  const before = previous === null ? null : windowKeyForPath(previous);
  const key = windowKeyForPath(next);
  if (!key || key === before) return [];
  const events: Event[] = [];
  if (previous !== null) events.push({ name: "window-open", data: { window: key } });
  if (key.startsWith("service-")) events.push({ name: "service-view", data: { service: key.slice("service-".length) } });
  return events;
}

/** `data-track` attributes of an element whose click is an event (read by one delegated listener). */
export function trackAttrs<N extends EventName>(
  name: N,
  ...[data]: EventMap[N] extends undefined ? [] : [EventMap[N]]
): Record<string, string> {
  const attrs: Record<string, string> = { "data-track": name };
  for (const [k, v] of Object.entries(data ?? {})) attrs[`data-track-${k}`] = v as string;
  return attrs;
}

/** Event of a `data-track` element, from its attributes. */
export function eventFromAttributes(attrs: { name: string; value: string }[]): Event | null {
  const name = attrs.find((a) => a.name === "data-track")?.value;
  if (!name) return null;
  const data: Record<string, string> = {};
  for (const { name: attr, value } of attrs) {
    if (attr.startsWith("data-track-")) data[attr.slice("data-track-".length)] = value;
  }
  return Object.keys(data).length ? { name, data } : { name };
}

/** The visitor's IP for the relay: first X-Forwarded-For entry, then X-Real-IP. */
export function clientIp(headers: Headers): string | null {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip")?.trim() || null;
}

/** Tracker headers passed on as they came (cookies and everything else stay behind). */
const RELAYED = ["content-type", "user-agent", "accept-language", "x-umami-website-id", "x-umami-hostname", "x-umami-cache"];
/** Headers Umami reads the visitor's IP from; each one carries the same address. */
const IP_HEADERS = ["x-forwarded-for", "x-real-ip", "x-client-ip"];

/** Headers of the relayed request to Umami: the tracker's own plus the visitor's IP. */
export function relayHeaders(incoming: Headers): Headers {
  const headers = new Headers();
  for (const name of RELAYED) {
    const value = incoming.get(name);
    if (value) headers.set(name, value);
  }
  const ip = clientIp(incoming);
  if (ip) for (const name of IP_HEADERS) headers.set(name, ip);
  return headers;
}
