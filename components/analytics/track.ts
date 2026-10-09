"use client";

import type { Event, EventMap, EventName } from "@/lib/analytics";

/**
 * Page views and events, held until the tracker has loaded (it loads late,
 * after an interaction or in an idle moment), then sent in order. When
 * statistics are off (dev, preview, an automated browser, opted out) nothing
 * is kept.
 */

type Payload = Record<string, unknown>;
type Umami = { track: (build: (props: Payload) => Payload) => void };
/** One hit: what Umami gets on top of its own fields (website, screen, language, hostname). */
type Hit = { url: string; title: string; referrer?: string } & Partial<Event>;

const QUEUE_MAX = 40;
let state: "pending" | "on" | "off" = "pending";
let queue: Hit[] = [];

const umami = () => (window as unknown as { umami?: Umami }).umami;

function send(hit: Hit) {
  const { url, title, referrer, name, data } = hit;
  // explicit url and title: the tracker runs without auto-tracking, so its own stay at the first page
  umami()?.track((props) => ({
    ...props,
    url,
    title,
    ...(referrer !== undefined && { referrer }),
    ...(name && { name, ...(data && { data }) }),
  }));
}

function push(hit: Hit) {
  if (state === "off") return;
  if (state === "on" && umami()) return send(hit);
  if (queue.length < QUEUE_MAX) queue.push(hit);
}

const here = () => ({ url: location.href, title: document.title });

export function trackPageview(referrer: string) {
  push({ ...here(), referrer });
}

export function trackEvent(event: Event) {
  push({ ...here(), ...event });
}

/** An event from code (the clickable ones use `trackAttrs` instead). */
export function track<N extends EventName>(name: N, ...[data]: EventMap[N] extends undefined ? [] : [EventMap[N]]) {
  trackEvent(data ? { name, data: data as Record<string, string> } : { name });
}

/** The tracker is ready: send what waited. */
export function analyticsReady() {
  state = "on";
  const waiting = queue;
  queue = [];
  waiting.forEach(send);
}

/** No statistics in this page's life: drop what waited and keep nothing more. */
export function analyticsOff() {
  state = "off";
  queue = [];
}
