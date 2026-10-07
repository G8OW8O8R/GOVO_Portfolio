import { z } from "zod";

const localized = z.object({ pl: z.string().min(1), en: z.string().min(1) });

/** Project as shown on the desktop. Case study fields are added in task 4. */
export const projectSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  /** Lower first; the first project takes the hero slot on the desktop. */
  order: z.number().int(),
  isNew: z.boolean().default(false),
  title: localized,
  summary: localized,
  thumb: z.object({
    src: z.string().regex(/^\/projects\/[a-z0-9-]+\/[\w.-]+\.(jpe?g|png|webp|avif)$/),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
  }),
});

export type ProjectInput = z.input<typeof projectSchema>;
export type Project = z.output<typeof projectSchema>;
