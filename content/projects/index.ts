import obok from "./obok";
import { projectSchema, type Project } from "./schema";

/** Register a new project here (one import); the desktop places it on its own. */
const entries = [obok];

export const projects: readonly Project[] = entries
  .map((entry) => projectSchema.parse(entry))
  .sort((a, b) => a.order - b.order);

export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}
