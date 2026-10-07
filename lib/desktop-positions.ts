/**
 * Remembered file positions on the desktop. A moved file stores its offset
 * from its slot in character-image px, so it keeps its place relative to the
 * figure on every screen size (the slot table is in the same units, see
 * lib/desktop-slots.ts). Storage is best effort: private mode, blocked or
 * corrupt storage simply means default positions.
 */

export type Offset = { dx: number; dy: number };
export type Offsets = Record<string, Offset>;

export const POSITIONS_KEY = "govo:desktop-positions:v1";

const isFiniteNumber = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

/** Parses stored offsets, keeping only known files and sane values. */
export function parseOffsets(raw: string | null, knownKeys: readonly string[]): Offsets {
  if (!raw) return {};
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return {};
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) return {};
  const out: Offsets = {};
  for (const key of knownKeys) {
    const v = (data as Record<string, unknown>)[key];
    if (!v || typeof v !== "object") continue;
    const { dx, dy } = v as Record<string, unknown>;
    if (isFiniteNumber(dx) && isFiniteNumber(dy) && Math.abs(dx) < 4000 && Math.abs(dy) < 4000) {
      out[key] = { dx: round(dx), dy: round(dy) };
    }
  }
  return out;
}

const round = (v: number) => Math.round(v * 10) / 10;

/** Serialises only offsets that actually move a file (a tidy desktop stores nothing). */
export function serializeOffsets(offsets: Offsets): string | null {
  const moved = Object.fromEntries(
    Object.entries(offsets)
      .filter(([, o]) => hasOffset(o))
      .map(([k, o]) => [k, { dx: round(o.dx), dy: round(o.dy) }]),
  );
  return Object.keys(moved).length ? JSON.stringify(moved) : null;
}

export function hasOffset(o: Offset | undefined): boolean {
  return !!o && (Math.abs(o.dx) >= 0.5 || Math.abs(o.dy) >= 0.5);
}

export function isTidy(offsets: Offsets): boolean {
  return !Object.values(offsets).some(hasOffset);
}

export function loadOffsets(storage: Pick<Storage, "getItem"> | null, knownKeys: readonly string[]): Offsets {
  try {
    return parseOffsets(storage?.getItem(POSITIONS_KEY) ?? null, knownKeys);
  } catch {
    return {};
  }
}

export function saveOffsets(storage: Pick<Storage, "setItem" | "removeItem"> | null, offsets: Offsets): void {
  try {
    const value = serializeOffsets(offsets);
    if (value) storage?.setItem(POSITIONS_KEY, value);
    else storage?.removeItem(POSITIONS_KEY);
  } catch {
    // quota, private mode or blocked storage: positions just aren't remembered
  }
}

/** Adds a screen-px move to an offset (image px at the given scale). */
export function addScreenDelta(offset: Offset | undefined, dx: number, dy: number, scale: number): Offset {
  return { dx: (offset?.dx ?? 0) + dx / scale, dy: (offset?.dy ?? 0) + dy / scale };
}

export type Bounds = { left: number; top: number; right: number; bottom: number };

/**
 * How far (screen px) an element with `rect` may still move and stay inside
 * `area`. Used as inertia limits and for keyboard moves.
 */
export function moveLimits(rect: Bounds, area: Bounds) {
  return {
    minX: Math.min(0, area.left - rect.left),
    maxX: Math.max(0, area.right - rect.right),
    minY: Math.min(0, area.top - rect.top),
    maxY: Math.max(0, area.bottom - rect.bottom),
  };
}

export type Sample = { t: number; x: number; y: number };

/** Release velocity (px/s) from the pointer samples of the last ~100 ms. */
export function releaseVelocity(samples: readonly Sample[], windowMs = 100): { vx: number; vy: number } {
  if (samples.length < 2) return { vx: 0, vy: 0 };
  const last = samples[samples.length - 1];
  let first = samples[samples.length - 2];
  for (let i = samples.length - 2; i >= 0; i--) {
    if (last.t - samples[i].t > windowMs) break;
    first = samples[i];
  }
  const dt = (last.t - first.t) / 1000;
  if (dt <= 0) return { vx: 0, vy: 0 };
  const cap = (v: number) => Math.max(-4000, Math.min(4000, v));
  return { vx: cap((last.x - first.x) / dt), vy: cap((last.y - first.y) / dt) };
}
