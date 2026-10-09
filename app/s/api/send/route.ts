import { UMAMI_ORIGIN, UMAMI_SEND, clientIp } from "@/lib/analytics";

/**
 * Statistics endpoint as a relay, used only when UMAMI_SEND = "relay"
 * (lib/analytics.ts). Until then the rewrite in next.config.ts runs ahead of
 * this route. Forwards the tracker's request to Umami with the visitor's IP
 * in X-Forwarded-For, so the location in the dashboard is the visitor's,
 * not the server's. Nothing is stored or logged here.
 */
const FORWARDED = ["content-type", "user-agent", "accept-language", "x-umami-website-id", "x-umami-hostname", "x-umami-cache"];

export async function POST(request: Request) {
  if (UMAMI_SEND !== "relay") return new Response(null, { status: 404 });

  const headers = new Headers();
  for (const name of FORWARDED) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  const ip = clientIp(request.headers);
  if (ip) headers.set("x-forwarded-for", ip);

  try {
    const res = await fetch(`${UMAMI_ORIGIN}/api/send`, { method: "POST", headers, body: await request.text() });
    return new Response(res.body, {
      status: res.status,
      headers: { "content-type": res.headers.get("content-type") ?? "application/json", "cache-control": "no-store" },
    });
  } catch {
    return new Response(null, { status: 502 });
  }
}
