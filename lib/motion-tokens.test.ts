import { describe, expect, it } from "vitest";
import { SPRING, springEasing } from "./motion-tokens";

describe("springEasing", () => {
  it("runs from 0 to 1 as a CSS linear() easing", () => {
    const { easing } = springEasing(SPRING.visualDuration, SPRING.bounce);
    const values = easing.slice("linear(".length, -1).split(", ").map(Number);
    expect(values[0]).toBe(0);
    expect(values.at(-1)).toBe(1);
    expect(values.length).toBe(41);
  });

  it("barely overshoots with the UI bounce and never with bounce 0", () => {
    const peak = (b: number) => Math.max(...springEasing(0.38, b).easing.slice(7, -1).split(", ").map(Number));
    expect(peak(SPRING.bounce)).toBeLessThan(1.02);
    expect(peak(0)).toBeLessThanOrEqual(1);
  });

  it("is visually done near visualDuration and settles within a second", () => {
    const { easing, ms } = springEasing(0.38, 0.06);
    expect(ms).toBeGreaterThan(380);
    expect(ms).toBeLessThan(1000);
    const values = easing.slice(7, -1).split(", ").map(Number);
    // at visualDuration the motion is ~95% done
    const at = Math.round((380 / ms) * 40);
    expect(values[at]).toBeGreaterThan(0.9);
  });
});
