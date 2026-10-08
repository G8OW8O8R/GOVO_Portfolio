import { z } from "zod";

const localized = z.object({ pl: z.string().min(1), en: z.string().min(1) });
const slug = z.string().regex(/^[a-z0-9-]+$/);
/** A file of the project in public/projects/<slug>/ */
const projectFile = (ext: string) => z.string().regex(new RegExp(`^/projects/[a-z0-9-]+/[a-z0-9/-]+\.(${ext})$`));
const image = projectFile("jpe?g|png|webp|avif");

/**
 * How a project appears in the CV (window "CV.pdf", /cv and the PDFs):
 * one or two sentences and a row of mono tags. The CV lists the newest
 * projects first (`year`, then `order`), at most three.
 */
const cv = z.object({
  summary: localized,
  tags: z.array(z.string().min(1)).min(1),
  /** Always the last entry of the CV timeline (the portfolio itself). */
  last: z.boolean().default(false),
});

/** A still with its description (alt) and an optional visible caption. */
const still = z.object({ src: image, alt: localized, caption: localized.optional() });

/**
 * The case study, in the order of the window. Section headings
 * are the same for every project (dictionary `project.sections`); everything
 * here is the project's own copy. Numbers are measured, never guessed: an
 * unmeasured one is left out, not shown as a placeholder.
 */
const caseStudy = z.object({
  /** Meta description and OG text (longer than the visible subtitle). */
  description: localized,
  /** Mono line under the subtitle: year · kind · role. */
  meta: localized,
  live: z.object({ url: z.url(), label: localized }),
  /** Only for a public repository. */
  code: z.object({ url: z.url(), label: localized }).optional(),
  /** Hero video: muted, plays in view; the frame takes its exact aspect ratio (no bars). */
  showreel: z.object({
    src: projectFile("mp4|webm"),
    poster: image,
    width: z.number().int().positive(),
    height: z.number().int().positive(),
  }),
  /** "In short": three short columns (problem, solution, role). */
  brief: z.array(z.object({ title: localized, text: localized })).length(3),
  challenge: localized,
  /** "Most interesting solutions": title, 2–3 sentences and a still of the showreel each. */
  solutions: z.array(z.object({ title: localized, text: localized, shot: still })).min(1),
  assets: z.object({ text: localized, gallery: z.array(still).min(1) }),
  stack: z.array(z.string().min(1)).min(1),
  /** `value` is the large figure; without it the line is a plain sentence. */
  numbers: z.array(z.object({ value: z.string().min(1).optional(), label: localized })),
  learned: localized,
  cta: z.object({ title: localized, button: localized, pricing: localized }),
});

/** A CV-only entry: no file on the desktop, no window, no route (e.g. this portfolio). */
export const cvEntrySchema = z.object({
  slug,
  year: z.number().int().min(2000),
  title: localized,
  cv,
});

/** Project as shown on the desktop, in its window (case study) and in the CV. */
export const projectSchema = cvEntrySchema.extend({
  /** Lower first; the first project takes the best desktop slot. */
  order: z.number().int(),
  isNew: z.boolean().default(false),
  /** One sentence: the subtitle of the case study and the quick look on the desktop. */
  summary: localized,
  /** Square app icon, full-bleed to the edges; shape, shadow and gloss come from CSS. */
  icon: z.string().regex(/^\/projects\/[a-z0-9-]+\/icon\.(png|jpe?g|webp|avif)$/),
  /** 1200×630 share image. */
  og: image,
  caseStudy,
});

export type ProjectInput = z.input<typeof projectSchema>;
export type Project = z.output<typeof projectSchema>;
export type CaseStudy = Project["caseStudy"];
export type CvEntryInput = z.input<typeof cvEntrySchema>;
export type CvEntry = z.output<typeof cvEntrySchema>;
