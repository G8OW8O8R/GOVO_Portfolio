import { z } from "zod";

/** Text in both languages. */
export const localized = z.object({ pl: z.string().min(1), en: z.string().min(1) });
export type LocalizedText = z.infer<typeof localized>;

const id = z.string().regex(/^[a-z0-9-]+$/);

/** Source: design/content-about.md */
export const aboutSchema = z.object({
  name: z.string().min(1),
  role: localized,
  facts: z.array(localized).min(1),
  lead: localized,
  text: z.array(localized).min(1),
  seeking: z.object({ label: localized, strong: localized, rest: localized }),
  howIWork: z.object({
    label: localized,
    points: z.array(z.object({ title: localized, text: localized })).length(3),
  }),
  closing: localized,
});

const skill = z.object({
  /** Thumbnail: public/skills/<id>.png, square (512 px), neutral placeholder until the file exists. */
  id,
  name: localized,
  note: localized,
  tags: z.array(localized).min(1),
  /** Optional link to a case study section, e.g. "/projekty/obok#rozwiazania". */
  seeInProject: z.string().optional(),
});

/** Source: design/content-skills.md */
export const skillsSchema = z.object({
  title: localized,
  lead: localized,
  categories: z.array(z.object({ id, label: localized, skills: z.array(skill).min(1) })).min(1),
  workflow: z.object({
    label: localized,
    caption: localized,
    /** Graphics: public/skills/<id>.png (square, shown 16:10 – keep the subject in the middle band) */
    steps: z.array(z.object({ id, title: localized })).length(3),
    note: localized,
  }),
});

const pkg = z.object({
  id,
  name: localized,
  from: z.number().int().positive(),
  description: localized,
  features: z.array(localized).min(1),
  time: localized,
  popular: z.boolean().default(false),
});

/** Source: design/content-pricing.md. Prices net, PLN, always "from". */
export const pricingSchema = z.object({
  headline: localized,
  lead: localized,
  perks: z.array(localized).length(3),
  smallBudget: z.object({ text: localized, cta: localized }),
  popularBadge: localized,
  packages: z.array(pkg).min(1),
  experience: z.object({
    id,
    name: localized,
    from: z.number().int().positive(),
    description: localized,
    features: z.array(localized).min(1),
    proofLabel: localized,
    proofProject: id,
    cta: localized,
  }),
  care: z.object({ name: localized, fromMonthly: z.number().int().positive(), description: localized }),
  footnote: localized,
});

/** Services and Process tabs (Offer window). Services say what I do – no prices (those live in pricing.ts). */
export const offerSchema = z.object({
  servicesTitle: localized,
  servicesLead: localized,
  services: z.array(z.object({ id, title: localized, text: localized, fit: localized })).length(4),
  processTitle: localized,
  process: z.array(z.object({ title: localized, text: localized })).min(1),
});

export type About = z.output<typeof aboutSchema>;
export type Skills = z.output<typeof skillsSchema>;
export type Pricing = z.output<typeof pricingSchema>;
export type Offer = z.output<typeof offerSchema>;
