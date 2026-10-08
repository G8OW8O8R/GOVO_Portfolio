import { z } from "zod";
import { serviceIds, type ServiceId } from "@/lib/routes";

/** Text in both languages. */
export const localized = z.object({ pl: z.string().min(1), en: z.string().min(1) });
export type LocalizedText = z.infer<typeof localized>;

const id = z.string().regex(/^[a-z0-9-]+$/);

export const aboutSchema = z.object({
  name: z.string().min(1),
  role: localized,
  facts: z.array(localized).min(1),
  lead: localized,
  text: z.array(localized).min(1),
  seeking: z.object({ label: localized, status: localized, strong: localized, rest: localized }),
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

/** At most this many tags per skill group on the CV (one A4 page). */
export const CV_TAGS_MAX = 7;

export const skillsSchema = z.object({
  title: localized,
  lead: localized,
  categories: z
    .array(
      z.object({
        id,
        label: localized,
        skills: z.array(skill).min(1),
        /** The CV's short list for the group (most important only); the website shows every skill. */
        cvTags: z.array(localized).min(1).max(CV_TAGS_MAX),
      }),
    )
    .min(1),
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
  /** Optional link inside the expanded row (e.g. "Zobacz Obok →" for the special project). */
  link: z.object({ label: localized, project: id }).optional(),
});

/** Prices net, PLN, always "from". */
export const pricingSchema = z.object({
  /** Two lines on purpose: large black, then smaller grey and struck through. */
  headline: z.object({ strong: localized, struck: localized }),
  lead: localized,
  perks: z.array(localized).length(3),
  /** Dark block at the top of Pricing, before the packages, with the Obok cover/preview. */
  soul: z.object({
    title: localized,
    text: localized,
    points: z.array(localized).length(3),
    caption: localized,
    project: id,
  }),
  smallBudget: z.object({ strong: localized, text: localized, cta: localized }),
  popularBadge: localized,
  packages: z.array(pkg).min(1),
  care: z.object({ name: localized, fromMonthly: z.number().int().positive(), description: localized }),
  footnote: localized,
});

/** Services and Process tabs (Offer window). Services say what I do – no prices (those live in pricing.ts). */
export const offerSchema = z.object({
  servicesTitle: localized,
  servicesLead: localized,
  // thumb: a picture from public/services/<thumb>.png, a different one per service; page: its service page
  services: z
    .array(
      z.object({
        id,
        title: localized,
        text: localized,
        fit: localized,
        thumb: id,
        page: z.enum(serviceIds as [ServiceId, ...ServiceId[]]),
      }),
    )
    .length(4),
  processTitle: localized,
  process: z.array(z.object({ title: localized, text: localized })).min(1),
});

/**
 * Only what lives nowhere else: name, e-mail,
 * links, skills and the site address are imported from the other profile
 * files, so the CV and the website never drift apart.
 */
export const cvSchema = z.object({
  available: localized,
  location: localized,
  /** Colour photo, 4:5 – never desaturated. */
  photo: z.string().regex(/^\/cv\/[a-z0-9-]+\.(jpe?g|png|webp)$/),
  profile: localized,
  headings: z.object({
    projects: localized,
    other: localized,
    skills: localized,
    certificates: localized,
    education: localized,
    languages: localized,
    extra: localized,
  }),
  /** Context of the project timeline, after its heading. */
  projectsContext: localized,
  other: z.array(z.object({ role: localized, place: z.string().min(1), period: localized, note: localized })).min(1),
  /** CV only, plain text (no links); the website doesn't show them. */
  certificates: z.array(z.object({ name: localized, issuer: z.string().min(1), year: z.number().int() })),
  education: z.array(z.object({ school: localized, years: z.string().min(1) })).min(1),
  languages: z.array(localized).min(1),
  extra: z.array(localized),
  footer: z.object({
    interactive: localized,
    /** GDPR consent: Polish CV only. */
    consentPl: z.string().min(1),
  }),
});

export type About = z.output<typeof aboutSchema>;
export type Skills = z.output<typeof skillsSchema>;
export type Pricing = z.output<typeof pricingSchema>;
export type Offer = z.output<typeof offerSchema>;
export type Cv = z.output<typeof cvSchema>;
