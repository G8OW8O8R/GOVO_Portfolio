"use client";

import { useEffect, useRef } from "react";
import { m, useSpring } from "motion/react";
import { LIVE } from "@/lib/motion-tokens";
import { pointer } from "@/lib/pointer";

/** Ball size and the cursor's reach, as fractions of the thumbnail. */
const BALL = 0.3;
const REACH = 0.6;
/** Springy on purpose: this demo is about springs (Motion). */
const SPRING = { stiffness: 340, damping: 11, mass: 0.7 };

/**
 * "UI animation": the thumbnail clears to its warm clay ground and a ball
 * drawn in CSS (a sphere from radial gradients in the colours of
 * animacje-ui.png, a soft contact shadow under it) hops away from the cursor
 * on a Motion spring, never leaving the thumbnail. Transform only.
 */
export default function BallDemo({ active }: { active: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  const x = useSpring(0, SPRING);
  const y = useSpring(0, SPRING);

  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    const off = pointer.subscribe((p) => {
      if (p.kind !== "mouse") return;
      const r = host.getBoundingClientRect();
      const size = r.width;
      const radius = (BALL * size) / 2;
      const rest = { x: size / 2, y: size * 0.54 };
      const dx = rest.x - (p.x - r.left);
      const dy = rest.y - (p.y - r.top);
      const d = Math.hypot(dx, dy) || 1;
      const reach = REACH * size;
      const push = d < reach ? (reach - d) * 1.1 : 0;
      const tx = Math.max(radius, Math.min(size - radius, rest.x + (dx / d) * push));
      const ty = Math.max(radius, Math.min(size - radius, rest.y + (dy / d) * push));
      x.set(tx - rest.x);
      y.set(ty - rest.y);
    });
    return () => {
      off();
      x.stop();
      y.stop();
    };
  }, [x, y]);

  return (
    <span
      ref={ref}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden rounded-[12px] bg-[radial-gradient(120%_100%_at_30%_20%,#efe9e6,#ddd4d0)] transition-opacity ease-out starting:opacity-0 ${active ? "opacity-100" : "opacity-0"}`}
      style={{ transitionDuration: `${LIVE.crossfadeMs}ms` }}
    >
      <m.span
        className="absolute left-1/2 top-[54%] -ml-[15%] -mt-[15%] block size-[30%]"
        style={{ x, y }}
      >
        <span className="absolute -bottom-[22%] left-[8%] h-[24%] w-[84%] rounded-[50%] bg-[radial-gradient(closest-side,rgb(92_80_76/0.38),transparent)]" />
        <span className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_34%_30%,#f1ece9_0%,#d9d0cc_32%,#bdb2ae_66%,#978b87_100%)] shadow-[inset_-1px_-2px_3px_rgb(80_68_64/0.25)]" />
      </m.span>
    </span>
  );
}
