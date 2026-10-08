import { describe, expect, it, vi } from "vitest";
import { createPointerSource, type PointerState } from "./pointer";

const event = (type: string, props: Record<string, unknown>) => {
  const e = new Event(type);
  for (const [k, v] of Object.entries(props)) Object.defineProperty(e, k, { value: v });
  return e;
};
const move = (x: number, y: number, pointerType = "mouse", timeStamp = 1) =>
  event("pointermove", { clientX: x, clientY: y, pointerType, timeStamp });

describe("pointer source", () => {
  it("listens only while someone subscribes", () => {
    const target = new EventTarget();
    const add = vi.spyOn(target, "addEventListener");
    const remove = vi.spyOn(target, "removeEventListener");
    const source = createPointerSource(target);
    expect(add).not.toHaveBeenCalled();
    const a = source.subscribe(() => {});
    const b = source.subscribe(() => {});
    expect(add).toHaveBeenCalledTimes(4);
    a();
    a(); // twice is harmless
    expect(remove).not.toHaveBeenCalled();
    b();
    expect(remove).toHaveBeenCalledTimes(4);
  });

  it("shares one position with every subscriber", () => {
    const target = new EventTarget();
    const source = createPointerSource(target);
    const seen: PointerState[][] = [[], []];
    source.subscribe((p) => seen[0].push(p));
    source.subscribe((p) => seen[1].push(p));
    target.dispatchEvent(move(10, 20, "touch", 5));
    expect(seen[0]).toEqual(seen[1]);
    expect(source.get()).toMatchObject({ x: 10, y: 20, kind: "touch", at: 5, inside: true, phase: "move" });
  });

  it("marks leaving the page, keeping the last position", () => {
    const target = new EventTarget();
    const source = createPointerSource(target);
    source.subscribe(() => {});
    target.dispatchEvent(move(3, 4));
    target.dispatchEvent(event("pointerout", { relatedTarget: {} }));
    expect(source.get()?.inside).toBe(true); // moved onto another element
    target.dispatchEvent(event("pointerout", { relatedTarget: null }));
    expect(source.get()).toMatchObject({ x: 3, y: 4, inside: false, phase: "leave" });
  });
});
