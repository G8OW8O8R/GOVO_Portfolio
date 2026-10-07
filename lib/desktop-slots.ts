/**
 * Desktop slot table. Positions are file centres in character-image px
 * (2752×1536), so files keep their place relative to the figure on every
 * screen (see lib/character-box.ts).
 *
 * Projects fill PROJECT_SLOTS in content order: the first one takes the best
 * spot (closest to the figure, level with the pendant), the rest take the next
 * free slots. All project icons share one size; the icon colour and the "New"
 * badge set them apart. Adding a project to content/projects is enough; add a
 * row here only past 6 projects.
 */

export type SlotSize = "project" | "doc";
/** Parallax depth: 1 = far (moves least), 3 = near (moves most). */
export type Depth = 1 | 2 | 3;
export type Slot = { readonly x: number; readonly y: number; readonly size: SlotSize; readonly depth: Depth };

export const PROJECT_SLOTS: readonly Slot[] = [
  { x: 1985, y: 880, size: "project", depth: 3 }, // best spot: right of the pendant
  { x: 2330, y: 640, size: "project", depth: 2 },
  { x: 1960, y: 1190, size: "project", depth: 3 },
  { x: 2400, y: 1010, size: "project", depth: 1 },
  { x: 1930, y: 470, size: "project", depth: 2 },
  { x: 330, y: 1150, size: "project", depth: 1 },
];

export type InfoFile = "about" | "offer" | "cv";

/** Info documents: one loose group left of the figure. */
export const INFO_SLOTS: Readonly<Record<InfoFile, Slot>> = {
  about: { x: 700, y: 560, size: "doc", depth: 2 },
  offer: { x: 470, y: 840, size: "doc", depth: 1 },
  cv: { x: 730, y: 1100, size: "doc", depth: 3 },
};

export function assignSlots<T>(projects: readonly T[]): { item: T; slot: Slot }[] {
  if (projects.length > PROJECT_SLOTS.length) {
    throw new Error(
      `Too many projects for the desktop (${projects.length} > ${PROJECT_SLOTS.length}). Add a slot to PROJECT_SLOTS.`,
    );
  }
  return projects.map((item, i) => ({ item, slot: PROJECT_SLOTS[i] }));
}
