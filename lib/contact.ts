import { z } from "zod";
import { budgets, findBudget, findSubject, subjects } from "@/content/profile/contact";
import type { Locale } from "./i18n";

/**
 * Contact form logic shared by the browser (live validation) and the server
 * action (the same schema again, rate limit, e-mail). No secrets here.
 */

export const CONTACT_FIELDS = ["name", "email", "subject", "budget", "message"] as const;
export type ContactField = (typeof CONTACT_FIELDS)[number];
export type ContactErrorCode = "required" | "invalid" | "short" | "long";
export type ContactErrors = Partial<Record<ContactField, ContactErrorCode>>;

export const LIMITS = { name: [2, 80], email: [3, 160], message: [10, 4000] } as const;

/** Honeypot field: hidden from people, bots fill it in. */
export const HONEYPOT = "website";

const oneLine = (s: string) => s.replace(/[\r\n\t]+/g, " ").trim();

export const contactSchema = z
  .object({
    name: z.string().transform(oneLine).pipe(z.string().min(LIMITS.name[0]).max(LIMITS.name[1])),
    email: z.string().trim().max(LIMITS.email[1]).pipe(z.email()),
    subject: z.enum(subjects.map((s) => s.id) as [string, ...string[]]),
    budget: z
      .enum(budgets.map((b) => b.id) as [string, ...string[]])
      .optional()
      .catch(undefined),
    message: z.string().trim().min(LIMITS.message[0]).max(LIMITS.message[1]),
    lang: z.enum(["pl", "en"]).catch("pl"),
  })
  // a job offer has no budget
  .transform((v) => (v.subject === "praca" ? { ...v, budget: undefined } : v));

export type ContactInput = z.input<typeof contactSchema>;
export type ContactData = z.output<typeof contactSchema>;

/** Raw form values (FormData or state) → validated data or one error code per field. */
export function validateContact(
  raw: Record<string, unknown>,
): { ok: true; data: ContactData } | { ok: false; errors: ContactErrors } {
  const input = {
    name: str(raw.name),
    email: str(raw.email),
    subject: str(raw.subject),
    budget: str(raw.budget) || undefined,
    message: str(raw.message),
    lang: str(raw.lang),
  };
  const result = contactSchema.safeParse(input);
  if (result.success) return { ok: true, data: result.data };
  const errors: ContactErrors = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0] as ContactField;
    if (!CONTACT_FIELDS.includes(field) || errors[field]) continue;
    const value = input[field as keyof typeof input];
    errors[field] =
      !value || (typeof value === "string" && !value.trim())
        ? "required"
        : issue.code === "too_small"
          ? "short"
          : issue.code === "too_big"
            ? "long"
            : "invalid";
  }
  return { ok: false, errors };
}

const str = (v: unknown) => (typeof v === "string" ? v : "");

/**
 * Sliding-window rate limit per key (IP), in memory. Enough for one server
 * instance; on Vercel each instance counts on its own (a shared store is a
 * deployment TODO).
 */
export function createRateLimiter({ limit, windowMs, maxKeys = 5000 }: { limit: number; windowMs: number; maxKeys?: number }) {
  const hits = new Map<string, number[]>();
  return {
    /** Records an attempt; `ok: false` when the key is over the limit (the attempt is not recorded). */
    hit(key: string, now = Date.now()): { ok: true } | { ok: false; retryAfterMs: number } {
      const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
      if (recent.length >= limit) {
        hits.set(key, recent);
        return { ok: false, retryAfterMs: windowMs - (now - recent[0]) };
      }
      recent.push(now);
      hits.delete(key); // re-insert: Map order = least recently used first
      hits.set(key, recent);
      if (hits.size > maxKeys) hits.delete(hits.keys().next().value!);
      return { ok: true };
    },
  };
}

export const CONTACT_RATE = { limit: 3, windowMs: 10 * 60_000 } as const;

/** Client IP from the proxy headers (Vercel sets x-real-ip / x-forwarded-for). */
export function clientIp(headers: { get(name: string): string | null }): string {
  return headers.get("x-real-ip")?.trim() || headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

/** The e-mail the owner receives (always in Polish; the site language is part of it). */
export function buildContactEmail(data: ContactData, sentAt: Date, site: string) {
  const subjectLabel = findSubject(data.subject)?.label.pl ?? data.subject;
  const budget = data.budget ? findBudget(data.budget)?.label.pl : null;
  const lines = [
    `Imię: ${data.name}`,
    `E-mail: ${data.email}`,
    `Temat: ${subjectLabel}`,
    ...(data.subject === "praca" ? [] : [`Budżet: ${budget ?? "nie podano"}`]),
    `Język strony: ${data.lang === "pl" ? "polski (PL)" : "angielski (EN)"}`,
    "",
    "Wiadomość:",
    data.message,
    "",
    "—",
    `Formularz kontaktowy ${site} · ${sentAt.toISOString().slice(0, 16).replace("T", " ")} UTC`,
    "Odpowiedz na tę wiadomość, aby napisać bezpośrednio do nadawcy.",
  ];
  return { subject: `[Portfolio] ${subjectLabel} – ${data.name}`, text: lines.join("\n") };
}

/** mailto: fallback with the visitor's message prefilled (form unavailable). */
export function contactMailto(to: string, data: Partial<Record<"subject" | "message", string>>, lang: Locale): string {
  const subjectLabel = (data.subject && findSubject(data.subject)?.label[lang]) || "";
  const params = new URLSearchParams();
  params.set("subject", subjectLabel ? `[Portfolio] ${subjectLabel}` : "[Portfolio]");
  if (data.message) params.set("body", data.message);
  return `mailto:${to}?${params.toString().replace(/\+/g, "%20")}`;
}

/** Result of the server action, shown by the form. */
export type ContactState =
  | { status: "idle" | "sent" | "unavailable" | "error" }
  | { status: "invalid"; errors: ContactErrors }
  | { status: "limited"; retryAfterMin: number };
