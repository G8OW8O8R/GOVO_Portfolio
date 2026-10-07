import { describe, expect, it } from "vitest";
import { computeCharacterBox, imageToScreen } from "./character-box";
import { INFO_SLOTS, PROJECT_SLOTS, assignSlots, type Slot } from "./desktop-slots";

/** Approximate footprint (icon + label) in image px. */
const footprint = { project: [170, 220], doc: [150, 210] } as const;

/** OVO pendant centre in image px. */
const PENDANT = { x: 1383, y: 895 };

const rect = (s: Slot) => {
  const [w, h] = footprint[s.size];
  return { l: s.x - w / 2, r: s.x + w / 2, t: s.y - h / 2, b: s.y + h / 2 };
};
const overlaps = (a: Slot, b: Slot) => {
  const p = rect(a);
  const q = rect(b);
  return p.l < q.r && q.l < p.r && p.t < q.b && q.t < p.b;
};

const allSlots = [...PROJECT_SLOTS, ...Object.values(INFO_SLOTS)];

describe("assignSlots", () => {
  it("gives the first project the first slot", () => {
    expect(assignSlots(["obok"])).toEqual([{ item: "obok", slot: PROJECT_SLOTS[0] }]);
  });

  it("places new projects in the next free slots", () => {
    const placed = assignSlots(["a", "b", "c"]);
    expect(placed.map((p) => p.slot)).toEqual(PROJECT_SLOTS.slice(0, 3));
    expect(new Set(placed.map((p) => p.slot)).size).toBe(3);
  });

  it("fails loudly when the table runs out", () => {
    const many = Array.from({ length: PROJECT_SLOTS.length + 1 }, (_, i) => i);
    expect(() => assignSlots(many)).toThrow(/Add a slot/);
  });
});

describe("slot table", () => {
  it("puts the best slot first: closest to the figure, level with the pendant", () => {
    const dist = (s: Slot) => Math.hypot(s.x - PENDANT.x, s.y - PENDANT.y);
    for (const slot of PROJECT_SLOTS.slice(1)) expect(dist(PROJECT_SLOTS[0])).toBeLessThan(dist(slot));
    expect(Math.abs(PROJECT_SLOTS[0].y - PENDANT.y)).toBeLessThan(60);
  });

  it("gives every project the same size", () => {
    expect(new Set(PROJECT_SLOTS.map((s) => s.size))).toEqual(new Set(["project"]));
  });

  it("has no overlapping files", () => {
    for (let i = 0; i < allSlots.length; i++)
      for (let j = i + 1; j < allSlots.length; j++)
        expect(overlaps(allSlots[i], allSlots[j]), `slots ${i} and ${j}`).toBe(false);
  });

  it("keeps files off the figure", () => {
    const head = { l: 1120, r: 1630, t: 150, b: 600 };
    const torso = { l: 850, r: 1830, t: 600, b: 1536 };
    for (const slot of allSlots) {
      const s = rect(slot);
      for (const body of [head, torso])
        expect(s.l < body.r && body.l < s.r && s.t < body.b && body.t < s.b).toBe(false);
    }
  });

  it.each([
    { width: 1536, height: 864 },
    { width: 1920, height: 1080 },
    { width: 1280, height: 800 },
    { width: 1024, height: 768 },
  ])("keeps every slot on screen and clear of the top bar and dock at %o", (vp) => {
    const box = computeCharacterBox(vp, "desktop");
    for (const slot of allSlots) {
      const s = rect(slot);
      const [l, t] = imageToScreen(box, [s.l, s.t]);
      const [r, b] = imageToScreen(box, [s.r, s.b]);
      expect(l).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThanOrEqual(vp.width);
      expect(t).toBeGreaterThanOrEqual(80);
      expect(b).toBeLessThanOrEqual(vp.height - 90);
    }
  });
});
