import { z } from "zod";

const localized = z.object({ pl: z.string().min(1), en: z.string().min(1) });
const slug = z.string().regex(/^[a-z0-9-]+$/);

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

/** A CV-only entry: no file on the desktop, no window, no route (e.g. this portfolio). */
export const cvEntrySchema = z.object({
  slug,
  year: z.number().int().min(2000),
  title: localized,
  cv,
});

/** Project as shown on the desktop and in the CV. Case study fields are added in task 4. */
export const projectSchema = cvEntrySchema.extend({
  /** Lower first; the first project takes the best desktop slot. */
  order: z.number().int(),
  isNew: z.boolean().default(false),
  summary: localized,
  /** Square app icon, full-bleed to the edges; shape, shadow and gloss come from CSS. */
  icon: z.string().regex(/^\/projects\/[a-z0-9-]+\/icon\.(png|jpe?g|webp|avif)$/),
});

export type ProjectInput = z.input<typeof projectSchema>;
export type Project = z.output<typeof projectSchema>;
export type CvEntryInput = z.input<typeof cvEntrySchema>;
export type CvEntry = z.output<typeof cvEntrySchema>;
