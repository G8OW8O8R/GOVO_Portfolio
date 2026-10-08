"use client";

import Link from "next/link";
import { useEffect, useRef, type ReactNode } from "react";
import { computeCharacterBox, isDesktopViewport } from "@/lib/character-box";
import { TUNING, type Vec2 } from "@/lib/character/config";
import { Spring2 } from "@/lib/character/motion";
import { characterPulse } from "@/lib/character/pulse";
import { LOGO, eyeTransform, logoGaze, sweepBand, viewBoxToClient } from "@/lib/logo-eyes";
import { pointer } from "@/lib/pointer";
import { useOpenWindowKey } from "@/components/window/store";
import { useWindowNav } from "@/components/window/useWindowNav";

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

/**
 * The header logo: link back to the desktop (closes an open window) and the
 * owl eyes that live with the character. Everything is driven by the
 * character's pulse – no own loop; without a living character (reduced
 * motion, no WebGL, slow device) the logo stays still, eyes straight ahead.
 */
export function LogoLink({ href, label, className, children }: { href: string; label: string; className?: string; children: ReactNode }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const hover = useRef<{ at: number; flashAt: number | null } | null>(null);
  const windowOpen = useOpenWindowKey() !== null;
  const { close } = useWindowNav();

  useEffect(() => {
    const root = ref.current;
    const svg = root?.querySelector("svg");
    if (!root || !svg || matchMedia(REDUCED_MOTION).matches) return;
    const eyes = (["L", "R"] as const).map((side) => {
      const el = svg.querySelector<SVGPathElement>(`#govo-eye-${side}`)!;
      return { el, c: [Number(el.dataset.cx), Number(el.dataset.cy)] as Vec2, last: "" };
    });
    const band = svg.querySelector<SVGGElement>("#govo-sweep");
    const bandFill = svg.querySelector<SVGLinearGradientElement>("#govo-sweep-g");
    if (eyes.some((e) => !e.el)) return;
    const mid: Vec2 = [(eyes[0].c[0] + eyes[1].c[0]) / 2, (eyes[0].c[1] + eyes[1].c[1]) / 2];

    // where the logo's eyes are on screen; measured only after layout changes
    let box: DOMRect | null = null;
    const invalidate = () => (box = null);
    const ro = new ResizeObserver(invalidate);
    ro.observe(svg);
    addEventListener("scroll", invalidate, { passive: true, capture: true });
    addEventListener("resize", invalidate);

    const spring = new Spring2(TUNING.gazeSpring.stiffness, TUNING.gazeSpring.damping);
    let reach: number = LOGO.reach;
    // the character's gaze reach in CSS px (sent with every point target)
    const viewport = { width: innerWidth, height: innerHeight };
    let gazeReach = TUNING.gazeReach * computeCharacterBox(viewport, isDesktopViewport(viewport) ? "desktop" : "mobile").scale;
    let bandLast = "";

    const off = characterPulse.subscribe((p) => {
      box ??= svg.getBoundingClientRect();
      const h = hover.current;
      const now = performance.now();
      const near = !!h && now - h.at < LOGO.near.ms;
      const cursor = near ? pointer.get() : null;
      if (p.target.kind === "point") gazeReach = p.target.reach;
      const target = cursor ? ({ kind: "point", x: cursor.x, y: cursor.y, reach: gazeReach } as const) : p.target;
      const [gx, gy] = logoGaze(target, viewBoxToClient(mid, box), near);
      spring.step(gx, gy, p.dt);
      // up close the eyes may move a little further; ease back to ±4 afterwards
      reach += ((near ? LOGO.near.reach : LOGO.reach) - reach) * Math.min(1, p.dt * 8);
      const g: Vec2 = [Math.max(-1, Math.min(1, spring.x)), Math.max(-1, Math.min(1, spring.y))];
      for (const e of eyes) {
        const t = eyeTransform(e.c, g, p.blink, reach);
        if (t !== e.last) e.el.setAttribute("transform", (e.last = t));
      }

      // the diamonds' sweep, or a short local flash on hover
      if (h && h.flashAt === null) h.flashAt = p.t;
      const local = h?.flashAt != null ? (p.t - h.flashAt) / LOGO.hoverSweepS : -1;
      const s = sweepBand(local >= 0 && local <= 1 ? local : p.sweep);
      const next = s ? `${Math.round(s.x)}|${s.opacity.toFixed(2)}` : "off";
      if (band && bandFill && next !== bandLast) {
        bandLast = next;
        band.setAttribute("opacity", s ? s.opacity.toFixed(2) : "0");
        band.setAttribute("visibility", s ? "visible" : "hidden");
        if (s) bandFill.setAttribute("gradientTransform", `translate(${Math.round(s.x)} 0) skewX(${LOGO.sweep.skew})`);
      }
    });

    return () => {
      off();
      ro.disconnect();
      removeEventListener("scroll", invalidate, { capture: true });
      removeEventListener("resize", invalidate);
      for (const e of eyes) e.el.removeAttribute("transform");
      band?.setAttribute("opacity", "0");
      band?.setAttribute("visibility", "hidden");
    };
  }, []);

  return (
    <Link
      ref={ref}
      href={href}
      data-dim=""
      className={className}
      aria-label={label}
      onPointerEnter={(e) => {
        if (e.pointerType === "mouse") hover.current = { at: performance.now(), flashAt: null };
      }}
      onPointerLeave={() => {
        // the flash plays to its end; the close-up look ends with the hover
        if (hover.current) hover.current.at = -Infinity;
      }}
      onClick={(e) => {
        if (!windowOpen || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        close();
      }}
    >
      {children}
    </Link>
  );
}
