"use client";

import {
  Children,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { useAppWindow } from "./AppWindow";
import { PanelPlayContext, playEnter, prefersReducedMotion } from "./motion/shared";
import { windowStore } from "./store";

type Tab = { id: string; label: string };

const noSubscribe = () => () => {};

/** The URL hash as an external store (replaceState doesn't fire hashchange, so we notify too). */
const hashListeners = new Set<() => void>();
function subscribeHash(listener: () => void) {
  hashListeners.add(listener);
  window.addEventListener("hashchange", listener);
  return () => {
    hashListeners.delete(listener);
    window.removeEventListener("hashchange", listener);
  };
}
const readHash = () => decodeURIComponent(location.hash.slice(1));
function writeHash(id: string | null) {
  history.replaceState(history.state, "", `${location.pathname}${location.search}${id ? `#${id}` : ""}`);
  hashListeners.forEach((l) => l());
}

/** Tabs already opened in this session (the enter crossfade plays only on the first visit). */
const SEEN_KEY = "govo:tabs-seen";
function seenTabs(): string[] {
  try {
    return JSON.parse(sessionStorage.getItem(SEEN_KEY) ?? "[]");
  } catch {
    return [];
  }
}
function markSeen(id: string): boolean {
  const seen = seenTabs();
  if (seen.includes(id)) return false;
  try {
    sessionStorage.setItem(SEEN_KEY, JSON.stringify([...seen, id]));
  } catch {}
  return true;
}

/**
 * Tabs inside a window. The active tab lives in the URL hash (#cennik), so a
 * reload shows the same tab and the hash never adds history entries (back
 * still closes the window). Every panel is in the server HTML (SEO). Until
 * hydration, CSS (:target on the panel id = tab id) shows the hashed panel,
 * so a reload of /pl/oferta#cennik never flashes the first tab.
 *
 * Motion: each panel gets a play token (motion/shared.ts) that changes every
 * time it opens – on a client-side window open and on a tab switch, never on
 * the hydration of a window URL. The first visit of a tab in the session also
 * crossfades from the previous panel (8 px rise, list items 35 ms apart).
 */
export function Tabs({ tabs, label, children }: { tabs: Tab[]; label: string; children: ReactNode }) {
  const panels = Children.toArray(children);
  const ids = tabs.map((t) => t.id);
  const hash = useSyncExternalStore(subscribeHash, readHash, () => "");
  const active = ids.includes(hash) ? hash : ids[0];
  const base = useId();
  const win = useAppWindow();
  const listRef = useRef<HTMLDivElement>(null);
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);

  // Play token per opening: a change of the active tab after hydration plays,
  // the switch to the hashed tab right after hydration does not.
  const [run, setRun] = useState(() => ({ active, epoch: 0, play: hydrated && !prefersReducedMotion(), live: hydrated }));
  if (run.active !== active || run.live !== hydrated) {
    const switched = run.active !== active;
    setRun({
      active,
      epoch: switched ? run.epoch + 1 : run.epoch,
      play: switched ? run.live && !prefersReducedMotion() : run.play,
      live: hydrated,
    });
  }

  // First visit of a tab: the previous panel stays on top for the crossfade.
  const [leaving, setLeaving] = useState<string | null>(null);
  const panelsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (hydrated) markSeen(active);
  }, [hydrated, active]);

  useLayoutEffect(() => {
    const root = panelsRef.current;
    if (!leaving || !root) return;
    const from = root.querySelector<HTMLElement>(`[data-panel="${leaving}"]`);
    const to = root.querySelector<HTMLElement>(`[data-panel="${active}"]`);
    const anims = playEnter(to, from);
    // no fill forwards on the new panel: once finished, nothing is left on it (crisp text)
    Promise.all(anims.map((a) => a.finished))
      .then(() => setLeaving(null))
      .catch(() => {});
    return () => anims.forEach((a) => a.cancel());
  }, [leaving, active]);

  // Inactive panels stay rendered but skipped (globals.css [data-inactive]).
  // A panel is laid out once, as soon as its tab is about to be chosen (hover,
  // touch; keyboard focus in the tab list warms them all), so the click reuses that layout instead of building ~900
  // boxes in the frame where the tab's motion starts.
  const warm = (id: string) => {
    const panel = panelsRef.current?.querySelector<HTMLElement>(`[data-panel="${id}"][data-inactive]:not([data-warm])`);
    if (!panel) return;
    panel.setAttribute("data-warming", "");
    void panel.offsetHeight;
    panel.removeAttribute("data-warming");
    panel.setAttribute("data-warm", "");
  };

  const first = ids[0];
  const select = (id: string, focus = false) => {
    if (id !== active && markSeen(id) && !prefersReducedMotion()) setLeaving(active);
    writeHash(id === first ? null : id);
    win?.scrollerRef.current?.scrollTo({ top: 0 });
    if (focus) listRef.current?.querySelector<HTMLElement>(`[data-tab="${id}"]`)?.focus();
  };

  // A minimised window comes back on the tab it had.
  const windowKey = win?.windowKey;
  useEffect(() => {
    const remembered = windowKey ? windowStore.recall(windowKey)?.tab : undefined;
    if (!readHash() && remembered && remembered !== first) writeHash(remembered);
  }, [windowKey, first]);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = ids.indexOf(active);
    const next =
      e.key === "ArrowRight" ? ids[(i + 1) % ids.length] :
      e.key === "ArrowLeft" ? ids[(i - 1 + ids.length) % ids.length] :
      e.key === "Home" ? ids[0] :
      e.key === "End" ? ids[ids.length - 1] : null;
    if (!next) return;
    e.preventDefault();
    select(next, true);
  };

  // Before hydration only: the panel named by the hash (#id:target) wins.
  const scope = `[data-tabs="${base}"]:not([data-hydrated])`;
  const preHydrationCss =
    `${scope} [data-panel]:not([data-first]):not(:target),${scope}:has([data-panel]:target) [data-first]:not(:target){display:none}` +
    ids
      .slice(1)
      .map(
        (id) =>
          `${scope}:has(#${id}:target) [data-tab]{background:transparent;color:var(--ink-soft)}` +
          `${scope}:has(#${id}:target) [data-tab="${id}"]{background:var(--ink);color:#fff}`,
      )
      .join("");

  return (
    <>
      <div data-tabs={base} data-hydrated={hydrated || undefined} className="contents">
        {!hydrated && <style>{preHydrationCss}</style>}
        {/* frosted on a layer of its own (::before): the tab labels themselves stay unfiltered and crisp */}
        <div className="sticky top-0 z-10 isolate flex justify-center border-b border-win-line px-4 py-2.5 before:absolute before:inset-0 before:-z-10 before:bg-win/85 before:backdrop-blur-md">
          <div
            ref={listRef}
            role="tablist"
            aria-label={label}
            onKeyDown={onKeyDown}
            className="flex gap-1 rounded-full bg-win-fill p-1"
          >
            {tabs.map((t) => {
              const selected = t.id === active;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  id={`${base}-tab-${t.id}`}
                  data-tab={t.id}
                  aria-selected={selected}
                  aria-controls={t.id}
                  tabIndex={selected ? 0 : -1}
                  onPointerEnter={() => warm(t.id)}
                  onPointerDown={() => warm(t.id)}
                  onFocus={(e) => e.currentTarget.matches(":focus-visible") && ids.forEach(warm)}
                  onClick={() => select(t.id)}
                  className="h-8 rounded-full px-4 text-15 font-medium text-ink-soft transition-colors hover:text-ink aria-selected:bg-ink aria-selected:text-white"
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
        <div ref={panelsRef} className="relative">
          {panels.map((panel, i) => {
            const id = ids[i];
            const out = id === leaving && id !== active;
            const inactive = hydrated && id !== active && !out;
            return (
              <div
                key={id}
                role="tabpanel"
                id={id}
                data-panel={id}
                data-first={i === 0 || undefined}
                aria-labelledby={`${base}-tab-${id}`}
                aria-hidden={out || undefined}
                inert={out || inactive || undefined}
                data-inactive={inactive || undefined}
                tabIndex={out || inactive ? -1 : 0}
                className={`scroll-mt-16 outline-none ${out ? "pointer-events-none absolute inset-x-0 top-0" : ""}`}
              >
                <PanelPlayContext.Provider value={id === active && run.play ? run.epoch : null}>
                  {panel}
                </PanelPlayContext.Provider>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
