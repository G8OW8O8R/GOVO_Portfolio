import { describe, expect, it } from "vitest";
import { nextPreviousIsDesktop } from "./window-history";

const desktop = { isDesktop: true };
const win = { isDesktop: false };

describe("nextPreviousIsDesktop", () => {
  it("desktop → window (push): close goes back", () => {
    expect(nextPreviousIsDesktop(false, "push", desktop, win)).toBe(true);
  });

  it("window → window (replace) keeps it; a foreign push from a window clears it", () => {
    expect(nextPreviousIsDesktop(true, "replace", win, win)).toBe(true);
    expect(nextPreviousIsDesktop(true, "push", win, win)).toBe(false);
  });

  it("forward onto a window: back returns to the desktop", () => {
    expect(nextPreviousIsDesktop(false, "pop", desktop, win)).toBe(true);
  });

  it("reaching the desktop always resets", () => {
    expect(nextPreviousIsDesktop(true, "pop", win, desktop)).toBe(false);
    expect(nextPreviousIsDesktop(true, "replace", win, desktop)).toBe(false);
  });
});
