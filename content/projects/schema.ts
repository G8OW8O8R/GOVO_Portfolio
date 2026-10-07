import { z } from "zod";

const localized = z.object({ pl: z.string().min(1), en: z.string().min(1) });

/** Project as shown on the desktop. Case study fields are added in task 4. */
export const projectSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  /** Lower first; the first project takes the best desktop slot. */
  order: z.number().int(),
  isNew: z.boolean().default(false),
  title: localized,
  summary: localized,
  /** Square app icon, full-bleed to the edges; shape, shadow and gloss come from CSS. */
  icon: z.string().regex(/^\/projects\/[a-z0-9-]+\/icon\.(png|jpe?g|webp|avif)$/),
});

export type ProjectInput = z.input<typeof projectSchema>;
export type Project = z.output<typeof projectSchema>;
