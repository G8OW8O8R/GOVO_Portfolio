import { describe, expect, it } from "vitest";
import {
  POSITIONS_KEY,
  addScreenDelta,
  isTidy,
  loadOffsets,
  moveLimits,
  parseOffsets,
  releaseVelocity,
  saveOffsets,
  serializeOffsets,
} from "./desktop-positions";

const keys = ["about", "offer", "project-obok"];

describe("stored positions", () => {
  it("round-trips moved files only", () => {
    const raw = serializeOffsets({ about: { dx: 12.34, dy: -5 }, offer: { dx: 0, dy: 0 } });
    expect(raw).toBe(JSON.stringify({ about: { dx: 12.3, dy: -5 } }));
    expect(parseOffsets(raw, keys)).toEqual({ about: { dx: 12.3, dy: -5 } });
    expect(serializeOffsets({ offer: { dx: 0.1, dy: 0 } })).toBeNull();
  });

  it("ignores corrupt data, unknown files and absurd values", () => {
    expect(parseOffsets("{nope", keys)).toEqual({});
    expect(parseOffsets("[1,2]", keys)).toEqual({});
    expect(parseOffsets(JSON.stringify({ gone: { dx: 1, dy: 1 } }), keys)).toEqual({});
    expect(parseOffsets(JSON.stringify({ about: { dx: "1", dy: 1 } }), keys)).toEqual({});
    expect(parseOffsets(JSON.stringify({ about: { dx: 1e9, dy: 1 } }), keys)).toEqual({});
  });

  it("survives storage that throws (private mode, blocked site data)", () => {
    const fail = () => {
      throw new Error("denied");
    };
    const broken = { getItem: fail, setItem: fail, removeItem: fail };
    expect(loadOffsets(broken, keys)).toEqual({});
    expect(() => saveOffsets(broken, { about: { dx: 5, dy: 5 } })).not.toThrow();
    expect(loadOffsets(null, keys)).toEqual({});
  });

  it("removes the key when the desktop is tidy again", () => {
    const store = new Map<string, string>();
    const storage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    };
    saveOffsets(storage, { about: { dx: 40, dy: 0 } });
    expect(store.has(POSITIONS_KEY)).toBe(true);
    expect(loadOffsets(storage, keys)).toEqual({ about: { dx: 40, dy: 0 } });
    saveOffsets(storage, {});
    expect(store.has(POSITIONS_KEY)).toBe(false);
    expect(isTidy({ about: { dx: 0.2, dy: 0 } })).toBe(true);
    expect(isTidy({ about: { dx: 3, dy: 0 } })).toBe(false);
  });

  it("stores moves in image px, so they scale with the character", () => {
    expect(addScreenDelta(undefined, 56.25, -28.125, 0.5625)).toEqual({ dx: 100, dy: -50 });
    expect(addScreenDelta({ dx: 100, dy: 0 }, 10, 0, 0.5)).toEqual({ dx: 120, dy: 0 });
  });
});

describe("drag physics helpers", () => {
  it("limits moves to the area", () => {
    const area = { left: 0, top: 60, right: 1536, bottom: 864 };
    expect(moveLimits({ left: 100, top: 100, right: 180, bottom: 200 }, area)).toEqual({
      minX: -100,
      maxX: 1356,
      minY: -40,
      maxY: 664,
    });
    // already outside: never pushes further out, never forces a jump
    expect(moveLimits({ left: -20, top: 100, right: 60, bottom: 200 }, area).minX).toBe(0);
  });

  it("measures release velocity over the last 100 ms", () => {
    const samples = [
      { t: 0, x: 0, y: 0 },
      { t: 200, x: 10, y: 0 },
      { t: 250, x: 40, y: 10 },
      { t: 300, x: 70, y: 20 },
    ];
    expect(releaseVelocity(samples)).toEqual({ vx: 600, vy: 200 });
    expect(releaseVelocity(samples.slice(0, 1))).toEqual({ vx: 0, vy: 0 });
  });
});
