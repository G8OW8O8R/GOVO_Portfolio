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

export const servicePageSchema = z.object({
  id: serviceId,
  /** Window title bar and breadcrumb */
  name: localized,
  /** <title> before " – od 990 zł | GOVO DIGITAL" */
  title: localized,
  description,
  h1: localized,
  lead: localized,
  /** Packages this page sells (price and time from pricing.ts) */
  packages: z.array(packageId).min(1),
  /** "Co dostajesz" */
  includes: z.array(row).min(3).max(5),
  /** The block of its own: what matters most for this service */
  focus: row,
  /** "Sprawdzi się np. dla…" – each item completes that sentence */
  fit: z.array(localized).min(2).max(3),
  /** A project shown as proof (its cover turning into preview.mp4) */
  proof: z.object({ project: z.string(), text: localized }).optional(),
  related: z.array(serviceId).min(1).max(2),
  cta: localized,
});

export const localPageSchema = z.object({
  id: localId,
  name: localized,
  /** areaServed (schema.org City) */
  city: localized,
  title: localized,
  description,
  h1: localized,
  lead: localized,
  /** How we meet and work */
  meet: row,
  /** Packages worth a look here, each with its service page */
  packages: z.array(z.object({ id: packageId, service: serviceId })).min(2).max(4),
  focus: row,
  fit: z.array(localized).min(2).max(3),
  cta: localized,
});

export type ServicePage = z.output<typeof servicePageSchema>;
export type LocalPage = z.output<typeof localPageSchema>;
