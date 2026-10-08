import obok from "./obok";
import portfolio from "./portfolio";
import { cvEntrySchema, projectSchema, type CvEntry, type Project } from "./schema";

/** Register a new project here (one import); the desktop places it on its own and the CV lists it. */
const entries = [obok];

/** CV-only entries: no desktop file, no window. */
const cvOnly = [portfolio];

export const projects: readonly Project[] = entries
  .map((entry) => projectSchema.parse(entry))
  .sort((a, b) => a.order - b.order);

export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}

/** Everything the CV may list; `listed` = has a window (its link is the case study). */
export const cvEntries: readonly (CvEntry & { order?: number; listed: boolean })[] = [
  ...projects.map((p) => ({ ...p, listed: true })),
  ...cvOnly.map((entry) => ({ ...cvEntrySchema.parse(entry), listed: false })),
];
