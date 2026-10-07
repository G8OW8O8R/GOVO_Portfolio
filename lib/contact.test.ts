import { describe, expect, it } from "vitest";
import { buildContactEmail, clientIp, contactMailto, createRateLimiter, validateContact } from "./contact";

const valid = {
  name: "Anna Nowak",
  email: "anna@example.com",
  subject: "strona",
  budget: "1-3-tys",
  message: "Potrzebuję strony dla gabinetu.",
  lang: "pl",
};

describe("validateContact", () => {
  it("accepts a complete message", () => {
    const r = validateContact(valid);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).toMatchObject({ name: "Anna Nowak", budget: "1-3-tys", lang: "pl" });
  });

  it("returns one code per field", () => {
    const r = validateContact({ ...valid, name: " ", email: "anna@", message: "krótko" });
    expect(r).toEqual({ ok: false, errors: { name: "required", email: "invalid", message: "short" } });
  });

  it("rejects too long messages and unknown subjects", () => {
    const r = validateContact({ ...valid, subject: "spam", message: "x".repeat(4001) });
    expect(r).toEqual({ ok: false, errors: { subject: "invalid", message: "long" } });
  });

  it("drops the budget for a job offer and ignores an unknown budget", () => {
    const job = validateContact({ ...valid, subject: "praca" });
    expect(job.ok && job.data.budget).toBeUndefined();
    const odd = validateContact({ ...valid, budget: "milion" });
    expect(odd.ok && odd.data.budget).toBeUndefined();
  });

  it("keeps the name on one line (no header tricks in the subject)", () => {
    const r = validateContact({ ...valid, name: "Anna\r\nBcc: x@y.z" });
    expect(r.ok && r.data.name).toBe("Anna Bcc: x@y.z");
  });
});

describe("createRateLimiter", () => {
  it("allows 3 messages per 10 minutes per IP", () => {
    const limiter = createRateLimiter({ limit: 3, windowMs: 600_000 });
    const t0 = 1_000_000;
    expect(limiter.hit("a", t0).ok).toBe(true);
    expect(limiter.hit("a", t0 + 1000).ok).toBe(true);
    expect(limiter.hit("a", t0 + 2000).ok).toBe(true);
    expect(limiter.hit("a", t0 + 3000)).toEqual({ ok: false, retryAfterMs: 597_000 });
    expect(limiter.hit("b", t0 + 3000).ok).toBe(true);
    // the oldest attempt leaves the window
    expect(limiter.hit("a", t0 + 600_001).ok).toBe(true);
    expect(limiter.hit("a", t0 + 600_002).ok).toBe(false);
  });

  it("forgets the least recently used IPs past maxKeys", () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 600_000, maxKeys: 2 });
    limiter.hit("a", 0);
    limiter.hit("b", 0);
    limiter.hit("c", 0);
    expect(limiter.hit("a", 1).ok).toBe(true);
    expect(limiter.hit("c", 1).ok).toBe(false);
  });
});

describe("clientIp", () => {
  const h = (o: Record<string, string>) => ({ get: (n: string) => o[n] ?? null });
  it("prefers x-real-ip, then the first x-forwarded-for entry", () => {
    expect(clientIp(h({ "x-real-ip": "1.2.3.4", "x-forwarded-for": "9.9.9.9" }))).toBe("1.2.3.4");
    expect(clientIp(h({ "x-forwarded-for": "5.6.7.8, 10.0.0.1" }))).toBe("5.6.7.8");
    expect(clientIp(h({}))).toBe("local");
  });
});

describe("buildContactEmail", () => {
  const sentAt = new Date("2026-10-07T19:30:00Z");
  it("has the agreed subject and a readable body with budget and site language", () => {
    const r = validateContact({ ...valid, lang: "en" });
    if (!r.ok) throw new Error("invalid");
    const mail = buildContactEmail(r.data, sentAt, "govo.digital");
    expect(mail.subject).toBe("[Portfolio] Strona dla firmy – Anna Nowak");
    expect(mail.text).toContain("Budżet: 1–3 tys.");
    expect(mail.text).toContain("Język strony: angielski (EN)");
    expect(mail.text).toContain("E-mail: anna@example.com");
    expect(mail.text).toContain("Potrzebuję strony dla gabinetu.");
  });

  it("leaves the budget out of a job offer", () => {
    const r = validateContact({ ...valid, subject: "praca" });
    if (!r.ok) throw new Error("invalid");
    const mail = buildContactEmail(r.data, sentAt, "govo.digital");
    expect(mail.subject).toBe("[Portfolio] Oferta pracy – Anna Nowak");
    expect(mail.text).not.toContain("Budżet");
  });
});

describe("contactMailto", () => {
  it("prefills subject and body", () => {
    expect(contactMailto("a@b.c", { subject: "praca", message: "Cześć & witam" }, "pl")).toBe(
      "mailto:a@b.c?subject=%5BPortfolio%5D%20Oferta%20pracy&body=Cze%C5%9B%C4%87%20%26%20witam",
    );
  });
});
