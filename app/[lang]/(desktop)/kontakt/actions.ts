"use server";

import { headers } from "next/headers";
import { assembleEmail } from "@/content/profile/contact";
import {
  CONTACT_RATE,
  HONEYPOT,
  buildContactEmail,
  clientIp,
  createRateLimiter,
  type ContactState,
} from "@/lib/contact";
import { validateContact } from "@/lib/contact-schema";
import { SITE_URL } from "@/lib/site";

const limiter = createRateLimiter(CONTACT_RATE);

/** Resend's shared test sender: delivers to the account owner's address (the one in contact.ts). */
const FROM = "GOVO Portfolio <onboarding@resend.dev>";

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
  if (!key && !dryRun) return { status: "unavailable" };

  const limit = limiter.hit(clientIp(await headers()));
  if (!limit.ok) return { status: "limited", retryAfterMin: Math.ceil(limit.retryAfterMs / 60_000) };

  if (dryRun) return { status: "sent" };

  const mail = buildContactEmail(result.data, new Date(), new URL(SITE_URL).host);
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: FROM,
        to: [assembleEmail()],
        reply_to: result.data.email,
        subject: mail.subject,
        text: mail.text,
      }),
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
