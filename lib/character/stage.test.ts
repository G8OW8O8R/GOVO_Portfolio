import { describe, expect, it } from "vitest";
import { EYES } from "./config";
import { seededRng } from "./motion";
import { createPulse } from "./pulse";
import { CharacterSim } from "./sim";
import { createStage, developAt } from "./stage";

const { hold, close, open } = EYES.blink.timing_ms;

describe("held eyes (intro)", () => {
  it("stay closed, then open with a blink's opening part", () => {
    const sim = new CharacterSim(seededRng(3), new Float32Array());
    sim.lidsHeld = true;
    sim.step(2, [0, 0]);
    expect(sim.frame().blink).toBe(1);
    expect(sim.frame().lid).toBe(1);
    sim.wake();
    expect(sim.frame().blink).toBeCloseTo(1, 5);
    sim.step(open / 2000, [0, 0]);
    const half = sim.frame().blink;
    expect(half).toBeGreaterThan(0);
    expect(half).toBeLessThan(1);
    sim.step(open / 2000 + 0.001, [0, 0]);
    expect(sim.frame().blink).toBe(0);
    // no random blink right after waking
    sim.step((close + hold) / 1000, [0, 0]);
    expect(sim.frame().blink).toBe(0);
  });
});

describe("stage", () => {
  it("resolves a development over time", () => {
    expect(developAt(0, 100)).toBe(0);
    expect(developAt({ at: 1000, ms: 800 }, 900)).toBe(0);
    expect(developAt({ at: 1000, ms: 800 }, 1400)).toBe(0.5);
    expect(developAt({ at: 1000, ms: 800 }, 5000)).toBe(1);
  });

  it("keeps a fallback final", () => {
    const stage = createStage();
    stage.report({ status: "loading", total: 10 });
    stage.report({ status: "poster" });
    stage.report({ loaded: 5 });
    expect(stage.load().status).toBe("poster");
    expect(stage.load().loaded).toBe(0);
  });

  it("lets the engine wait while the intro defers it", async () => {
    const stage = createStage();
    await stage.undeferred();
    stage.direct({ defer: true });
    let done = false;
    const wait = stage.undeferred().then(() => (done = true));
    await Promise.resolve();
    expect(done).toBe(false);
    stage.direct({ defer: false });
    await wait;
    expect(done).toBe(true);
  });

  it("tells listeners about direction changes", () => {
    const stage = createStage();
    const seen: boolean[] = [];
    const off = stage.onDirection((d) => seen.push(d.lidsHeld));
    stage.direct({ lidsHeld: true });
    stage.direct({ lidsHeld: false });
    off();
    stage.direct({ lidsHeld: true });
    expect(seen).toEqual([true, false]);
  });
});

describe("pulse", () => {
  it("reaches subscribers until they leave", () => {
    const pulse = createPulse();
    let n = 0;
    const off = pulse.subscribe(() => n++);
    const p = { t: 0, dt: 1 / 60, target: { kind: "gaze", gaze: [0, 0] }, blink: 0, sweep: -1 } as const;
    pulse.emit(p);
    off();
    pulse.emit(p);
    expect(n).toBe(1);
    expect(pulse.size).toBe(0);
  });
});
