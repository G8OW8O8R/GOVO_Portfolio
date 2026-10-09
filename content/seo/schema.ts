import { z } from "zod";
import { localized } from "@/content/profile/schema";
import { pricing } from "@/content/profile/pricing";
import { localIds, serviceIds, type LocalId, type ServiceId } from "@/lib/routes";

const serviceId = z.enum(serviceIds as [ServiceId, ...ServiceId[]]);
const localId = z.enum(localIds as [LocalId, ...LocalId[]]);

/** A package of pricing.ts – the pages never carry a price of their own. */
const packageId = z.string().refine((id) => pricing.packages.some((p) => p.id === id), "not a package of pricing.ts");

/** Meta description; `{price}` = the lowest "from" price of the page's packages, `{time}` = the first package's time. */
const description = localized.refine((d) => d.pl.includes("{price}") && d.en.includes("{price}"), "needs {price}");

const row = z.object({ title: localized, text: localized });

/** Visible questions, also the FAQPage structured data (never one without the other). */
const faq = z.array(z.object({ q: localized, a: localized })).min(3).max(4);

/** A picture of public/ with generated variants (pnpm images): a service thumbnail or a project icon. */
const thumb = z.string().regex(/^\/(services|projects\/[a-z0-9-]+)\/[a-z0-9-]+\.png$/);

/** Prices only from pricing.ts: no amount in the copy itself ("990 zł", "PLN 990"). */
function noPrices(page: unknown, ctx: z.RefinementCtx) {
  const copy = JSON.stringify(page);
  if (/\d[\d\s]*(zł|PLN)|PLN\s?\d/.test(copy)) ctx.addIssue({ code: "custom", message: "a price in the copy; use {price}" });
}

export const servicePageSchema = z
  .object({
    id: serviceId,
    /** Window title bar and breadcrumb */
    name: localized,
    /** <title> before " – od 990 zł | GOVO DIGITAL" */
    title: localized,
    description,
    h1: localized,
    lead: localized,
    thumb,
    /** "Dla kogo": kinds of clients, not past clients; each a sentence of its own */
    forWhom: z.array(localized).min(2).max(3),
    /** "Co dostajesz" */
    includes: z.array(row).min(3).max(5),
    /** A project shown as proof (its cover turning into preview.mp4) */
    proof: z.object({ project: z.string(), text: localized }).optional(),
    /** Packages this page sells (price and time from pricing.ts) */
    packages: z.array(packageId).min(1),
    faq,
    cta: localized,
  })
  .superRefine(noPrices);

export const localPageSchema = z
  .object({
    id: localId,
    name: localized,
    /** areaServed (schema.org City) */
    city: localized,
    title: localized,
    description,
    h1: localized,
    lead: localized,
    thumb,
    /** "Dla kogo w Warszawie": the heading names the city in its own grammar */
    audiencesTitle: localized,
    /** Kinds of businesses in the city and what their site has to do */
    audiences: z.array(row).length(3),
    /** Packages worth a look here, each with its service page */
    packages: z.array(z.object({ id: packageId, service: serviceId })).min(2).max(4),
    /** One sentence before the link to the Obok case study */
    proof: localized,
    faq,
    cta: localized,
  })
  .superRefine(noPrices);

export type ServicePage = z.output<typeof servicePageSchema>;
export type LocalPage = z.output<typeof localPageSchema>;
