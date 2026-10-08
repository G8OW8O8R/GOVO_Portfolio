import { describe, expect, it } from "vitest";
import { lineIndexes } from "./split-lines";

describe("lineIndexes", () => {
  it("puts words with the same top on one line", () => {
    expect(lineIndexes([0, 0, 0])).toEqual([0, 0, 0]);
  });

  it("starts a new line when a word wraps lower", () => {
    expect(lineIndexes([10, 10, 66, 66, 122])).toEqual([0, 0, 1, 1, 2]);
  });

  it("ignores sub-pixel differences and works on scaled layouts", () => {
    expect(lineIndexes([0, 0.6, 1.4, 41.2, 41])).toEqual([0, 0, 0, 1, 1]);
  });

  it("handles no words", () => {
    expect(lineIndexes([])).toEqual([]);
  });
});
