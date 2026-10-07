/**
 * Desktop slot table. Positions are file centres in character-image px
 * (2752×1536), so files keep their place relative to the figure on every
 * screen (see lib/character-box.ts).
 *
 * Projects fill PROJECT_SLOTS in content order: the first one takes the hero
 * slot (largest file, best spot), the rest take the next free slots. Adding a
 * project to content/projects is enough; add a row here only past 6 projects.
 */

export type SlotSize = "hero" | "project" | "doc";
export type Slot = { readonly x: number; readonly y: number; readonly size: SlotSize };

export const PROJECT_SLOTS: readonly Slot[] = [
  { x: 2110, y: 820, size: "hero" }, // right of the pendant
  { x: 2400, y: 500, size: "project" },
  { x: 1960, y: 1190, size: "project" },
  { x: 2430, y: 1080, size: "project" },
  { x: 1900, y: 420, size: "project" },
  { x: 330, y: 1150, size: "project" },
];

export type InfoFile = "about" | "offer" | "cv";

/** Info documents: one loose group left of the figure. */
export const INFO_SLOTS: Readonly<Record<InfoFile, Slot>> = {
  about: { x: 700, y: 560, size: "doc" },
  offer: { x: 470, y: 840, size: "doc" },
  cv: { x: 730, y: 1100, size: "doc" },
};

export function assignSlots<T>(projects: readonly T[]): { item: T; slot: Slot }[] {
  if (projects.length > PROJECT_SLOTS.length) {
    throw new Error(
      `Too many projects for the desktop (${projects.length} > ${PROJECT_SLOTS.length}). Add a slot to PROJECT_SLOTS.`,
    );
  }
  return projects.map((item, i) => ({ item, slot: PROJECT_SLOTS[i] }));
}
