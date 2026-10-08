/**
 * One source of the cursor position for the whole page: the character's gaze,
 * the custom cursor, the files' parallax and the scene objects in windows all
 * read it, so they never disagree about where the pointer is. One passive
 * listener pair on `window`, attached with the first subscriber and removed
 * with the last.
 *
 *   const off = pointer.subscribe((p) => …); // p.x/p.y in client px
 *   pointer.get();                            // last known state or null
 */

export type PointerKind = "mouse" | "pen" | "touch";

export type PointerState = {
  /** client (viewport) CSS px */
  x: number;
  y: number;
  kind: PointerKind;
  /** event time, ms (performance.now() clock) */
  at: number;
  /** false once the pointer has left the page */
  inside: boolean;
  /** the event: "move", "down", "up" or "leave" */
  phase: "move" | "down" | "up" | "leave";
};

type Listener = (state: PointerState) => void;

type PointerLike = { clientX: number; clientY: number; pointerType: string; timeStamp: number };
type OutLike = { relatedTarget: unknown };

const kindOf = (t: string): PointerKind => (t === "touch" || t === "pen" ? t : "mouse");

export function createPointerSource(target: Pick<EventTarget, "addEventListener" | "removeEventListener">) {
  const listeners = new Set<Listener>();
  let state: PointerState | null = null;

  const emit = (next: PointerState) => {
    state = next;
    listeners.forEach((fn) => fn(next));
  };
  const handler = (phase: PointerState["phase"]) => (e: Event) => {
    const p = e as unknown as PointerLike;
    emit({ x: p.clientX, y: p.clientY, kind: kindOf(p.pointerType), at: p.timeStamp, inside: true, phase });
  };
  const onMove = handler("move");
  const onDown = handler("down");
  const onUp = handler("up");
  // leaving the page: pointerout with nothing related (the window itself)
  const onOut = (e: Event) => {
    if ((e as unknown as OutLike).relatedTarget || !state) return;
    emit({ ...state, inside: false, phase: "leave", at: (e as Event).timeStamp });
  };

  const options = { passive: true, capture: true } as const;
  const attach = () => {
    target.addEventListener("pointermove", onMove, options);
    target.addEventListener("pointerdown", onDown, options);
    target.addEventListener("pointerup", onUp, options);
    target.addEventListener("pointerout", onOut, options);
  };
  const detach = () => {
    target.removeEventListener("pointermove", onMove, options);
    target.removeEventListener("pointerdown", onDown, options);
    target.removeEventListener("pointerup", onUp, options);
    target.removeEventListener("pointerout", onOut, options);
  };

  return {
    subscribe(fn: Listener): () => void {
      if (listeners.size === 0) attach();
      listeners.add(fn);
      return () => {
        if (!listeners.delete(fn)) return;
        if (listeners.size === 0) detach();
      };
    },
    get: (): PointerState | null => state,
  };
}

export type PointerSource = ReturnType<typeof createPointerSource>;

const noop: PointerSource = { subscribe: () => () => {}, get: () => null };

/** The page-wide source (a no-op on the server). */
export const pointer: PointerSource = typeof window === "undefined" ? noop : createPointerSource(window);
