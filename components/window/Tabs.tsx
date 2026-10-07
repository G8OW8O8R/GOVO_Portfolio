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

/** Switch to another tab of the same window, optionally to a section in it (`target` id). */
export function TabButton({
  tab,
  target,
  className,
  children,
}: {
  tab: string;
  target?: string;
  className?: string;
  children: ReactNode;
}) {
  const select = useContext(TabsContext);
  const onClick = () => {
    select?.(tab);
    // the panel is shown on the next render
    if (target) requestAnimationFrame(() => requestAnimationFrame(() => document.getElementById(target)?.scrollIntoView({ block: "start" })));
  };
  return (
    <button type="button" className={className} onClick={onClick}>
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
          `${scope}:has(#${id}:target) [data-tab]{background:transparent;color:var(--ink-soft)}` +
          `${scope}:has(#${id}:target) [data-tab="${id}"]{background:var(--ink);color:#fff}`,
      )
      .join("");

  return (
    <TabsContext.Provider value={select}>
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
                  onClick={() => select(t.id)}
                  className="h-8 rounded-full px-4 text-15 font-medium text-ink-soft transition-colors hover:text-ink aria-selected:bg-ink aria-selected:text-white"
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
