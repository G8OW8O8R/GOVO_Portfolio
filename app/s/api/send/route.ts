import { UMAMI_ORIGIN, UMAMI_SEND, relayHeaders } from "@/lib/analytics";

/**
 * Statistics endpoint as a relay (UMAMI_SEND in lib/analytics.ts). Forwards
 * the tracker's request to Umami unchanged, with the visitor's IP in the
 * headers Umami reads it from, so the location in the dashboard is the
 * visitor's, not Vercel's. Nothing is stored or logged here.
 */
export async function POST(request: Request) {
  if (UMAMI_SEND !== "relay") return new Response(null, { status: 404 });

  try {
    const res = await fetch(`${UMAMI_ORIGIN}/api/send`, {
      method: "POST",
      headers: relayHeaders(request.headers),
      body: await request.arrayBuffer(),
    });
    return new Response(res.body, {
      status: res.status,
      headers: { "content-type": res.headers.get("content-type") ?? "application/json", "cache-control": "no-store" },
    });
  } catch {
    return new Response(null, { status: 502 });
  }
}
