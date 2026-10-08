/**
 * "Look at this" API for the rest of the desktop (files, windows).
 * Points are in client (viewport) CSS px; the character converts them to
 * gaze with the character box. Works before/without the WebGL character:
 * calls are cheap no-ops when nobody listens.
 *
 *   const release = characterGaze.lookAt(fileElement); // on pointerenter/focus
 *   release();                                         // on pointerleave/blur
 *   const unregister = characterGaze.registerGlanceTarget(fileElement); // idle glances
 *   characterGaze.flash();                             // pendant sweep (hover)
 *   characterGaze.lookAt(VIEWER);                      // straight at the visitor
 */

export type ClientPoint = { x: number; y: number };
/** Look straight ahead, at the person in front of the screen. */
export const VIEWER = "viewer" as const;
export type Look = ClientPoint | typeof VIEWER;
export type GazeTarget = Element | Look | (() => Look | null);

type Resolver = () => Look | null;

function resolver(target: GazeTarget): Resolver {
  if (typeof target === "function") return target;
  if (target === VIEWER) return () => VIEWER;
  if ("getBoundingClientRect" in target) {
    return () => {
      if (!target.isConnected) return null;
      const r = target.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    };
  }
  return () => target;
}

export function createGazeBus() {
  let nextId = 0;
  /** Latest lookAt wins; releasing it falls back to the previous one. */
  const active: { id: number; at: Resolver }[] = [];
  const glances = new Map<number, Resolver>();
  const flashListeners = new Set<() => void>();

  return {
    lookAt(target: GazeTarget): () => void {
      const id = nextId++;
      active.push({ id, at: resolver(target) });
      return () => {
        const i = active.findIndex((a) => a.id === id);
        if (i >= 0) active.splice(i, 1);
      };
    },

    /** Current explicit target, or null. */
    current(): Look | null {
      for (let i = active.length - 1; i >= 0; i--) {
        const p = active[i].at();
        if (p) return p;
      }
      return null;
    },

    registerGlanceTarget(target: GazeTarget): () => void {
      const id = nextId++;
      glances.set(id, resolver(target));
      return () => void glances.delete(id);
    },

    glanceTargets(): ClientPoint[] {
      return [...glances.values()].map((r) => r()).filter((p): p is ClientPoint => p !== null && p !== VIEWER);
    },

    flash() {
      flashListeners.forEach((fn) => fn());
    },

    onFlash(fn: () => void): () => void {
      flashListeners.add(fn);
      return () => void flashListeners.delete(fn);
    },
  };
}

export type GazeBus = ReturnType<typeof createGazeBus>;

/** The page-wide bus used by the character and the desktop files. */
export const characterGaze: GazeBus = createGazeBus();
