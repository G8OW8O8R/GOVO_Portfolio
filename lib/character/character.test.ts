import { describe, expect, it } from "vitest";
import { BLINK_DURATION, Blinker, blinkCurve } from "./blink";
import raw from "@/public/character/eyes.json";
import { EYES, TUNING, type Vec2 } from "./config";
import { eyesSchema } from "./eyes-schema";
import { GazeDirector, eyeBlend, irisOffset, pointToGaze } from "./gaze";
import { createGazeBus } from "./look-at";
import { seededRng, smoothstep } from "./motion";
import { CharacterSim, REST_FRAME, warpSource, type CharacterFrame } from "./sim";
import { Sparkles } from "./sparkles";
import { FpsWatchdog } from "./watchdog";

const DT = 1 / 60;
const run = (sim: CharacterSim, seconds: number, target: readonly [number, number]) => {
  for (let i = 0; i < Math.round(seconds / DT); i++) sim.step(DT, target);
};

describe("config", () => {
  it("parses eyes.json", () => {
    expect(eyesSchema.safeParse(raw).success).toBe(true);
    expect(EYES.image).toEqual([2752, 1536]);
    expect(EYES.eyes.L.range.x).toEqual([-12, 12]);
  });

  it("rejects a broken eyes.json", () => {
    expect(eyesSchema.safeParse({ ...raw, eyes: { L: raw.eyes.L } }).success).toBe(false);
    expect(eyesSchema.safeParse({ ...raw, blink: { ...raw.blink, interval_s: [2] } }).success).toBe(false);
  });
});

describe("gaze", () => {
  it("maps points to a bounded gaze", () => {
    expect(pointToGaze([100, 100], [100, 100])).toEqual([0, 0]);
    const [gx, gy] = pointToGaze([1e6, -1e6], [0, 0]);
    expect(gx).toBeLessThanOrEqual(1);
    expect(gy).toBeGreaterThanOrEqual(-1);
    expect(pointToGaze([TUNING.gazeReach, 0], [0, 0])[0]).toBeCloseTo(Math.SQRT1_2, 6);
  });

  it("keeps the iris inside the eyes.json range for any gaze", () => {
    for (const g of [[5, 5], [-5, -5], [1, -1], [-1, 1]] as const) {
      const [ox, oy] = irisOffset(g);
      expect(Math.abs(ox)).toBeLessThanOrEqual(12);
      expect(Math.abs(oy)).toBeLessThanOrEqual(5);
    }
    expect(irisOffset([1, 1])).toEqual([12, 5]);
  });

  it("shows the untouched eyes at rest and blends smoothly with the iris offset", () => {
    expect(eyeBlend([0, 0], 0)).toBe(0);
    expect(eyeBlend([0.04, 0], 0)).toBe(0);
    expect(eyeBlend([2, 0], 0)).toBe(1);
    // continuous: no step larger than the smoothstep slope allows
    let prev = 0;
    for (let d = 0; d <= 1.5; d += 0.01) {
      const v = eyeBlend([d, 0], 0);
      expect(v - prev).toBeLessThan(0.02);
      expect(v).toBeGreaterThanOrEqual(prev);
      prev = v;
    }
    // eyelids switch the reconstruction on for the blink only
    expect(eyeBlend([0, 0], 0.5)).toBe(0.5);
  });

  it("looks straight ahead after load until ~4 s without input", () => {
    const d = new GazeDirector(seededRng(1));
    const glance = () => null;
    for (let t = 0; t < 3.9; t += 0.1) expect(d.update({ now: t, pointer: null, lookAt: null, glance })).toEqual([0, 0]);
  });

  it("prefers lookAt, then a recent pointer, then wanders when idle", () => {
    const d = new GazeDirector(seededRng(1));
    const glance = () => [0.3, 0.3] as const;
    expect(d.update({ now: 0, pointer: { gaze: [0.5, 0], at: 0 }, lookAt: [-1, 0], glance })).toEqual([-1, 0]);
    expect(d.update({ now: 1, pointer: { gaze: [0.5, 0], at: 0 }, lookAt: null, glance })).toEqual([0.5, 0]);
    expect(d.source).toBe("pointer");
    // idle after 4 s: holds, then picks new targets every 1–4 s
    const seen = new Set<string>();
    for (let t = 4; t < 60; t += 0.1) seen.add(d.update({ now: t, pointer: { gaze: [0.5, 0], at: 0 }, lookAt: null, glance }).join());
    expect(d.source).toBe("idle");
    expect(seen.size).toBeGreaterThan(8);
    expect(seen.has("0,0")).toBe(true); // sometimes rests straight ahead
    expect(seen.has("0.3,0.3")).toBe(true); // sometimes glances at a file
  });
});

describe("blink", () => {
  it("closes in 60 ms, holds 40 ms, opens in 110 ms", () => {
    expect(BLINK_DURATION).toBeCloseTo(0.21, 6);
    expect(blinkCurve(0)).toBe(0);
    expect(blinkCurve(0.06)).toBe(1);
    expect(blinkCurve(0.09)).toBe(1);
    expect(blinkCurve(0.21)).toBe(0);
  });

  it("plays a triggered blink even with random blinks off", () => {
    const b = new Blinker(seededRng(3));
    expect(b.value(10, false)).toBe(0);
    b.trigger(10);
    expect(b.value(10.07, false)).toBe(1);
  });

  it("blinks every 3–7 s", () => {
    const b = new Blinker(seededRng(3));
    const starts: number[] = [];
    let was = 0;
    for (let t = 0; t < 120; t += 0.005) {
      const v = b.value(t);
      if (v > 0 && was === 0) starts.push(t);
      was = v;
    }
    const gaps = starts.slice(1).map((s, i) => s - starts[i]);
    expect(Math.min(...gaps)).toBeGreaterThanOrEqual(3);
    expect(Math.max(...gaps)).toBeLessThanOrEqual(7 + 0.25);
  });
});

describe("simulation", () => {
  const D = (q: readonly [number, number], f: CharacterFrame, w: (p: Vec2) => number = () => 0): Vec2 => {
    const p = warpSource(q, f, w);
    return [q[0] - p[0], q[1] - p[1]];
  };
  const onChain = () => 1;

  it("starts at rest: identity warp, untouched eyes", () => {
    const sim = new CharacterSim(seededRng(1), new Float32Array());
    const f = sim.frame();
    expect(f.breath).toBe(0);
    expect(f.sway).toBe(0);
    expect(f.eyeBlend).toBe(0);
    expect(f.lid).toBe(0);
    expect(f.sweep).toBe(-1);
    for (const p of [[1372, 330], [1387, 880], [900, 1200], [2000, 100]] as const) {
      expect(warpSource(p, f, onChain)).toEqual(p);
    }
  });

  it("follows the target with a spring and never overshoots the eye range", () => {
    const sim = new CharacterSim(seededRng(1), new Float32Array());
    sim.blinksEnabled = false;
    let maxX = 0;
    for (let i = 0; i < 120; i++) {
      sim.step(DT, [1, 0]);
      maxX = Math.max(maxX, Math.abs(sim.frame().iris[0]));
    }
    expect(maxX).toBeLessThanOrEqual(12);
    expect(sim.frame().iris[0]).toBeCloseTo(12, 1);
    // back to rest: the original eyes return (blend 0)
    run(sim, 3, [0, 0]);
    expect(sim.frame().eyeBlend).toBe(0);
  });

  it("swings the pendant ≈ 9 CSS px at desktop scale on a fast glance, softly limited", () => {
    const sim = new CharacterSim(seededRng(1), new Float32Array());
    run(sim, 2, [-1, 0]);
    let peak = 0;
    for (let i = 0; i < 180; i++) {
      sim.step(DT, [1, 0]);
      const [dx] = D([1387, 880], { ...sim.frame(), breath: 0, head: [0, 0], sway: 0 }, onChain);
      peak = Math.max(peak, Math.abs(dx));
    }
    const scale = 864 / 1536; // 1536×864 desktop
    expect(peak * scale).toBeGreaterThanOrEqual(8);
    expect(peak * scale).toBeLessThanOrEqual(10.5);
    // however hard it is driven, the angle stays under the limit
    sim.pendulum.theta = 10;
    expect(Math.abs(sim.frame().chain)).toBeLessThanOrEqual(TUNING.chainMaxAngle);
  });

  it("turns the pendant as a rigid piece around the pivot (no stretching)", () => {
    const f = { ...REST_FRAME, chain: 0.06 };
    const pts = [[1250, 900], [1530, 950], [1387, 1000], [1300, 820]] as const;
    const src = pts.map((p) => warpSource(p, f, onChain));
    for (let i = 0; i < pts.length; i++)
      for (let j = i + 1; j < pts.length; j++) {
        const before = Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]);
        const after = Math.hypot(src[i][0] - src[j][0], src[i][1] - src[j][1]);
        expect(after).toBeCloseTo(before, 6);
      }
    const [px, py] = EYES.living.chain.pivot;
    expect(Math.hypot(src[2][0] - px, src[2][1] - py)).toBeCloseTo(Math.hypot(1387 - px, 1000 - py), 6);
    expect(D([1387, 1000], f, onChain)[0]).toBeGreaterThan(0); // θ > 0 swings right
  });

  it("moves only the chain and a thin band around it, never the rest of the chest", () => {
    const f = { ...REST_FRAME, chain: 0.06 };
    expect(D([1100, 950], f, () => 0)).toEqual([0, 0]);
    // above the attachment the chain does not turn
    expect(D([1387, 585], f, onChain)).toEqual([0, 0]);
  });

  it("breathes and sways with eyes.json periods", () => {
    const sim = new CharacterSim(seededRng(1), new Float32Array());
    run(sim, EYES.living.breathing.period_s / 2, [0, 0]);
    const f = sim.frame();
    expect(f.breath).toBeCloseTo(1, 2);
    const [, dy] = D([1372, 330], { ...f, sway: 0, head: [0, 0] });
    expect(dy).toBeCloseTo(-EYES.living.breathing.lift_px, 1);
    expect(D([1372, 1536], f)[1]).toBeCloseTo(0, 6);
  });

  it("head weight is rigid at the eyes and gone below the neck", () => {
    const f = { ...REST_FRAME, head: [5, 3] as const };
    expect(D([1300, 330], f)).toEqual([5, 3]);
    expect(D([1372, 700], f)).toEqual([0, 0]);
  });
});

describe("sparkles", () => {
  it("spawns 2.5 glints/s at rest, more when the chain moves", () => {
    const pts = new Float32Array([1300, 900, 1400, 920]);
    const count = (omega: number) => {
      const s = new Sparkles(seededRng(2), pts);
      let spawned = 0;
      let last = 0;
      for (let t = 0; t < 10; t += DT) {
        s.update(t, DT, omega);
        spawned += s.glints.filter((g) => g.born > last).length;
        last = t;
      }
      return spawned / 10;
    };
    expect(count(0)).toBeCloseTo(2.5, 0);
    expect(count(0.1)).toBeGreaterThan(6);
  });

  it("sweeps every 3.5 s for 1.2 s, and on flash", () => {
    const s = new Sparkles(seededRng(2), new Float32Array());
    expect(s.sweep(0)).toBe(-1);
    expect(s.sweep(3.5 + 0.6)).toBeCloseTo(0.5, 6);
    expect(s.sweep(3.5 + 1.3)).toBe(-1);
    s.flash(5);
    expect(s.sweep(5.6)).toBeCloseTo(0.5, 6);
  });
});

describe("watchdog", () => {
  it("falls back only after sustained slow frames", () => {
    const w = new FpsWatchdog();
    w.reset(0);
    let slow = false;
    for (let t = 0; t < 6000; t += 16.7) slow ||= w.push(t, 16.7);
    expect(slow).toBe(false);
    w.reset(6000);
    for (let t = 6000; t < 12000; t += 40) slow ||= w.push(t, 40);
    expect(slow).toBe(true);
  });

  it("ignores single hitches", () => {
    const w = new FpsWatchdog();
    w.reset(0);
    let slow = false;
    for (let t = 0, i = 0; t < 8000; i++) {
      const dt = i % 20 === 0 ? 120 : 16.7;
      t += dt;
      slow ||= w.push(t, dt);
    }
    expect(slow).toBe(false);
  });

  it("a single long gap (print dialog, frozen tab) is a pause, not a slow device", () => {
    const w = new FpsWatchdog();
    w.reset(0);
    let slow = false;
    let t = 0;
    for (; t < 6000; t += 16.7) slow ||= w.push(t, 16.7);
    // the page was blocked for 6 s, then renders normally again
    t += 6000;
    slow ||= w.push(t, 6000);
    for (const end = t + 6000; t < end; t += 16.7) slow ||= w.push(t, 16.7);
    expect(slow).toBe(false);
  });

  it("measures again after a gap: slow frames still count", () => {
    const w = new FpsWatchdog();
    w.reset(0);
    expect(w.push(5000, 5000)).toBe(false);
    let slow = false;
    for (let t = 5000; t < 11000; t += 40) slow ||= w.push(t, 40);
    expect(slow).toBe(true);
  });

  it("gaps in a row are a device that can't render: slow", () => {
    const w = new FpsWatchdog();
    w.reset(0);
    expect(w.push(400, 400)).toBe(false);
    expect(w.push(800, 400)).toBe(false);
    expect(w.push(1200, 400)).toBe(true);
  });
});

describe("look-at bus", () => {
  it("latest target wins, release falls back", () => {
    const bus = createGazeBus();
    expect(bus.current()).toBeNull();
    const a = bus.lookAt({ x: 1, y: 1 });
    const b = bus.lookAt(() => ({ x: 2, y: 2 }));
    expect(bus.current()).toEqual({ x: 2, y: 2 });
    b();
    expect(bus.current()).toEqual({ x: 1, y: 1 });
    a();
    expect(bus.current()).toBeNull();
  });

  it("lists glance targets and broadcasts flash", () => {
    const bus = createGazeBus();
    const off = bus.registerGlanceTarget({ x: 5, y: 6 });
    expect(bus.glanceTargets()).toEqual([{ x: 5, y: 6 }]);
    off();
    expect(bus.glanceTargets()).toEqual([]);
    let n = 0;
    const stop = bus.onFlash(() => n++);
    bus.flash();
    stop();
    bus.flash();
    expect(n).toBe(1);
  });
});

it("smoothstep matches GLSL including reversed edges", () => {
  expect(smoothstep(0, 1, 0.5)).toBe(0.5);
  expect(smoothstep(1536, 700, 1536)).toBe(0);
  expect(smoothstep(1536, 700, 600)).toBe(1);
});
