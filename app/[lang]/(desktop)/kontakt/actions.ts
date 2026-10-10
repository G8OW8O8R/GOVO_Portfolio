"use server";

import { appendFile } from "node:fs/promises";
import { headers } from "next/headers";
import {
  CONTACT_RATE,
  HONEYPOT,
  clientIp,
  contactRequest,
  contactSender,
  createRateLimiter,
  type ContactState,
} from "@/lib/contact";
import { validateContact } from "@/lib/contact-schema";
import { SITE_URL } from "@/lib/site";

const limiter = createRateLimiter(CONTACT_RATE);

/** The owner's inbox (CONTACT_TO overrides it). Server only: the site shows the public address from contact.ts. */
const OWNER_INBOX = "piotrgoworek05@gmail.com";

/**
 * Contact form → e-mail via the Resend REST API (no SDK). The full Zod schema
 * (the browser checks the same rules with Zod Mini), a honeypot, 3 messages / 10 min per IP. The API key is
 * read on the server only and never logged or returned.
 */
export async function sendContact(_prev: ContactState, formData: FormData): Promise<ContactState> {
  // Bots fill the hidden field: pretend it worked, send nothing.
  if (String(formData.get(HONEYPOT) ?? "").trim()) return { status: "sent" };

  const result = validateContact(Object.fromEntries(formData));
  if (!result.ok) return { status: "invalid", errors: result.errors };

  const key = process.env.RESEND_API_KEY;
  // Test runs (E2E) skip the provider; never on a Vercel production deployment.
  const dryRun = process.env.CONTACT_DRY_RUN === "1" && process.env.VERCEL_ENV !== "production";
  const from = contactSender(process.env);
  if (!from) console.error("[contact] CONTACT_FROM is not set");
  if (!from || (!key && !dryRun)) return { status: "unavailable" };

  const limit = limiter.hit(clientIp(await headers()));
  if (!limit.ok) return { status: "limited", retryAfterMin: Math.ceil(limit.retryAfterMs / 60_000) };

  const request = contactRequest(result.data, new Date(), new URL(SITE_URL).host, {
    from,
    to: process.env.CONTACT_TO?.trim() || OWNER_INBOX,
  });

  if (dryRun) {
    // the request that would have been sent, one JSON line per message (the E2E test reads it)
    const out = process.env.CONTACT_DRY_RUN_FILE;
    if (out) await appendFile(out, JSON.stringify(request) + "\n");
    return { status: "sent" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(request),
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });
    if (!res.ok) {
      // status and error name only – no request data, no key
      const body = (await res.json().catch(() => null)) as { name?: string } | null;
      console.error(`[contact] provider error ${res.status}${body?.name ? ` ${body.name}` : ""}`);
      return { status: "error" };
    }
    return { status: "sent" };
  } catch (e) {
    console.error(`[contact] provider unreachable: ${e instanceof Error ? e.name : "unknown"}`);
    return { status: "error" };
  }
}
