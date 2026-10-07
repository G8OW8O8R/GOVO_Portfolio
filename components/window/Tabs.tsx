"use client";

import {
  Children,
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useSyncExternalStore,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { useAppWindow } from "./AppWindow";
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

const TabsContext = createContext<((id: string) => void) | null>(null);

/** Switch to another tab of the same window (e.g. "See pricing"). */
export function TabButton({ tab, className, children }: { tab: string; className?: string; children: ReactNode }) {
  const select = useContext(TabsContext);
  return (
    <button type="button" className={className} onClick={() => select?.(tab)}>
      {children}
    </button>
  );
}

/**
 * Tabs inside a window. The active tab lives in the URL hash (#cennik), so a
 * reload shows the same tab and the hash never adds history entries (back
 * still closes the window). Every panel is in the server HTML (SEO). Until
 * hydration, CSS (:target on the panel id = tab id) shows the hashed panel,
 * so a reload of /pl/oferta#cennik never flashes the first tab.
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

  const first = ids[0];
  const select = (id: string, focus = false) => {
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
          `${scope}:has(#${id}:target) [data-tab]{background:transparent;color:var(--ink-soft);box-shadow:none}` +
          `${scope}:has(#${id}:target) [data-tab="${id}"]{background:var(--accent);color:#fff}`,
      )
      .join("");

  return (
    <TabsContext.Provider value={select}>
      <div data-tabs={base} data-hydrated={hydrated || undefined} className="contents">
        {!hydrated && <style>{preHydrationCss}</style>}
        <div className="sticky top-0 z-10 flex justify-center border-b border-win-line bg-win/90 px-4 py-2.5 backdrop-blur-md">
          <div
            ref={listRef}
            role="tablist"
            aria-label={label}
            onKeyDown={onKeyDown}
            className="flex gap-1 rounded-full bg-win-card p-1"
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
                  onClick={() => select(t.id)}
                  className="rounded-full px-4 py-1.5 text-[14px] font-medium text-ink-soft transition-colors hover:text-ink aria-selected:bg-accent aria-selected:text-white aria-selected:shadow-sm"
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
        {panels.map((panel, i) => (
          <div
            key={ids[i]}
            role="tabpanel"
            id={ids[i]}
            data-panel={ids[i]}
            data-first={i === 0 || undefined}
            aria-labelledby={`${base}-tab-${ids[i]}`}
            hidden={hydrated ? ids[i] !== active : undefined}
            tabIndex={0}
            className="scroll-mt-16 outline-none"
          >
            {panel}
          </div>
        ))}
      </div>
    </TabsContext.Provider>
  );
}
