import { computeCharacterBox, isDesktopViewport } from "@/lib/character-box";
import { DERIVED, EYES, EYE_MIDPOINT, type Vec2 } from "@/lib/character/config";
import { GazeDirector, pointToGaze } from "@/lib/character/gaze";
import { VIEWER, characterGaze, type ClientPoint } from "@/lib/character/look-at";
import { clamp, seededRng, type Rng } from "@/lib/character/motion";
import { CharacterSim, REST_FRAME, type CharacterFrame } from "@/lib/character/sim";
import { FpsWatchdog } from "@/lib/character/watchdog";
import { pointer as pointerSource, type PointerState } from "@/lib/pointer";
import { CROP_MEDIA, MOBILE_CROP, cropFits, visibleImageRect, type Rect } from "@/lib/character/mobile-crop";
import { CharacterRenderer, loadBase, loadCharacterAssets, type PixelMap } from "./renderer";

/**
 * Runs the living character: input → gaze director → simulation → renderer,
 * on requestAnimationFrame, paused off screen / on a hidden tab, with the FPS
 * watchdog and context-loss fallback. React only mounts and unmounts it.
 */

export const FALLBACK_KEY = "character:fallback";
const MAX_DPR = 2;
const [W, H] = EYES.image;

export type FallbackReason = "slow" | "context-lost" | "error" | "reduced-motion";

type Options = {
  canvas: HTMLCanvasElement;
  poster: HTMLImageElement;
  /** canvas ready to show (false while the base is being swapped) */
  onLive: (live: boolean) => void;
  onFallback: (reason: FallbackReason) => void;
  debug: boolean;
  seed?: number;
  /** debug: force the full image or the phone crop as the base */
  forceBase?: "full" | "crop";
};

export function webgl2Supported(): boolean {
  try {
    return !!document.createElement("canvas").getContext("webgl2");
  } catch {
    return false;
  }
}

export class CharacterEngine {
  private gl: WebGL2RenderingContext | null = null;
  private renderer: CharacterRenderer | null = null;
  private sim: CharacterSim | null = null;
  private director: GazeDirector;
  private rng: Rng;
  private readonly abort = new AbortController();
  private readonly watchdog = new FpsWatchdog();
  private raf = 0;
  private last = -1;
  private visible = !document.hidden;
  private onScreen = true;
  private destroyed = false;
  private pointer: { gaze: Vec2; at: number } | null = null;
  private poster = { left: 0, top: 0, scale: 1 };
  private size = { width: 0, height: 0, map: [1, 0, -1, H] as PixelMap };
  private lastScrollY = 0;
  // debug
  private manual = false;
  private targetOverride: Vec2 | null = null;
  private frameTimes: number[] = [];

  constructor(private readonly o: Options) {
    this.rng = o.seed !== undefined ? seededRng(o.seed) : Math.random;
    this.director = new GazeDirector(this.rng);
  }

  async start() {
    const { canvas } = this.o;
    const gl = canvas.getContext("webgl2", {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: this.o.debug,
    });
    if (!gl) return this.fail("error");
    this.gl = gl;

    try {
      // phones: the full-resolution crop when everything visible (plus the warp reach) is inside it
      const crop = this.o.forceBase ? this.o.forceBase === "crop" : cropFits(this.visibleImage());
      const assets = await loadCharacterAssets(this.abort.signal, { crop });
      if (this.destroyed) return;
      this.renderer = new CharacterRenderer(gl, assets);
      this.sim = new CharacterSim(this.rng, assets.glintPoints);
    } catch (e) {
      if (!this.destroyed) {
        console.error(e);
        this.fail("error");
      }
      return;
    }

    const signal = this.abort.signal;
    canvas.addEventListener("webglcontextlost", (e) => (e.preventDefault(), this.fail("context-lost")), { signal });
    // the same cursor position as the custom cursor and the files (lib/pointer.ts)
    signal.addEventListener("abort", pointerSource.subscribe(this.onPointer));
    window.addEventListener("scroll", this.onScroll, { passive: true, signal });
    window.addEventListener("resize", this.measure, { signal });
    document.addEventListener("visibilitychange", this.onVisibility, { signal });
    matchMedia("(prefers-reduced-motion: reduce)").addEventListener(
      "change",
      (e) => e.matches && this.fail("reduced-motion"),
      { signal },
    );
    const ro = new ResizeObserver(this.measure);
    ro.observe(canvas);
    ro.observe(this.o.poster);
    const io = new IntersectionObserver(([entry]) => {
      this.onScreen = entry.isIntersecting;
      this.schedule();
    });
    io.observe(canvas);
    signal.addEventListener("abort", () => (ro.disconnect(), io.disconnect()));
    const offFlash = characterGaze.onFlash(() => this.sim?.sparkles.flash(this.sim.t));
    signal.addEventListener("abort", offFlash);

    this.lastScrollY = scrollY;
    this.measure();
    this.render(REST_FRAME);
    if (this.o.debug) this.exposeDebug();
    this.o.onLive(true);
    this.schedule();
  }

  destroy() {
    this.destroyed = true;
    cancelAnimationFrame(this.raf);
    this.abort.abort();
    this.gl?.getExtension("WEBGL_lose_context")?.loseContext();
    if (this.o.debug) delete (window as unknown as { __character?: unknown }).__character;
  }

  private fail(reason: FallbackReason) {
    if (this.destroyed) return;
    if (reason === "slow") {
      try {
        sessionStorage.setItem(FALLBACK_KEY, reason);
      } catch {}
    }
    this.o.onFallback(reason);
    this.destroy();
  }

  // ---------- geometry ----------

  /**
   * Canvas buffer and pixel map come from layout sizes (offsetWidth/Height),
   * so a transformed ancestor never reallocates the buffer. The gaze uses the
   * on-screen box (screenImageBox).
   */
  private measure = () => {
    const { canvas } = this.o;
    const l = this.layout();
    if (!l) return;
    const { image: p, width: cssWidth, height: cssHeight } = l;
    const scale = p.scale;
    this.poster = this.screenImageBox();

    const dpr = Math.min(devicePixelRatio || 1, MAX_DPR);
    const width = Math.round(cssWidth * dpr);
    const height = Math.round(cssHeight * dpr);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    const sx = cssWidth / width;
    const sy = cssHeight / height;
    this.size = {
      width,
      height,
      map: [sx / scale, -p.left / scale, -sy / scale, (cssHeight - p.top) / scale],
    };
    this.renderer?.setMinification(scale * dpr);
    this.ensureBaseCovers();

    if (process.env.NODE_ENV !== "production" && isDesktopViewport({ width: innerWidth, height: innerHeight })) {
      const box = computeCharacterBox({ width: document.documentElement.clientWidth, height: innerHeight }, "desktop");
      if (Math.abs(box.x - p.left) > 0.5 || Math.abs(box.scale - scale) > 1e-3) {
        console.warn("[character] poster differs from computeCharacterBox", { box, poster: p });
      }
    }
    if (this.manual || !this.raf) this.renderCurrent();
  };

  /**
   * The full image's box on screen, read from the poster. On portrait phones
   * the poster shows MOBILE_CROP (CSS media query), placed at its spot.
   */
  private screenImageBox(): { left: number; top: number; scale: number } {
    const p = this.o.poster.getBoundingClientRect();
    const crop = matchMedia(CROP_MEDIA).matches ? MOBILE_CROP : null;
    const scale = p.width / (crop ? crop.width : W);
    return crop ? { left: p.left - crop.x * scale, top: p.top - crop.y * scale, scale } : { left: p.left, top: p.top, scale };
  }

  /** Canvas CSS size and the image box relative to the canvas, untransformed (layout px). */
  private layout(): { width: number; height: number; image: { left: number; top: number; scale: number } } | null {
    const { canvas } = this.o;
    const c = canvas.getBoundingClientRect();
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    if (!width || !height || !c.width) return null;
    const k = c.width / width; // current stage transform scale
    const p = this.screenImageBox();
    if (!p.scale) return null;
    return { width, height, image: { left: (p.left - c.left) / k, top: (p.top - c.top) / k, scale: p.scale / k } };
  }

  /** Image px the canvas shows (character box relative to the canvas). */
  private visibleImage(): Rect {
    const l = this.layout();
    if (!l) return { x: 0, y: 0, width: W, height: H };
    const { image: p, width, height } = l;
    const box = { x: p.left, y: p.top, width: W * p.scale, height: H * p.scale, scale: p.scale, areaHeight: height };
    return visibleImageRect(box, { width, height });
  }

  /** After a rotation the phone crop may no longer cover the view: switch to the full image. */
  private swapping = false;
  private ensureBaseCovers() {
    const r = this.renderer;
    if (!r || !r.baseIsCrop || this.swapping || this.o.forceBase === "crop" || cropFits(this.visibleImage())) return;
    this.swapping = true;
    this.o.onLive(false); // the poster (full image by its media query) shows meanwhile
    loadBase(false, this.abort.signal)
      .then((b) => {
        if (this.destroyed) return b.base.close();
        r.replaceBase(b);
        this.renderCurrent();
        this.o.onLive(true);
      })
      .catch(() => this.fail("error"))
      .finally(() => (this.swapping = false));
  }

  private clientToImage({ x, y }: ClientPoint): Vec2 {
    const { left, top, scale } = this.poster;
    return [(x - left) / scale, (y - top) / scale];
  }

  private gazeAt(p: ClientPoint): Vec2 {
    return pointToGaze(this.clientToImage(p), EYE_MIDPOINT);
  }

  // ---------- input ----------

  private onPointer = (p: PointerState) => {
    if (p.phase !== "move" && p.phase !== "down") return;
    this.pointer = { gaze: this.gazeAt({ x: p.x, y: p.y }), at: this.now() };
  };

  /** Phones: the gaze follows the scroll direction, then settles. */
  private onScroll = () => {
    const dy = scrollY - this.lastScrollY;
    this.lastScrollY = scrollY;
    this.poster = this.screenImageBox();
    if (Math.abs(dy) < 1) return;
    // look towards the content that scrolls into view, for ~1.2 s
    this.pointer = { gaze: [this.pointer?.gaze[0] ?? 0, clamp(Math.sign(dy) * 0.7, -1, 1)], at: this.now() - (DERIVED.idleAfterS - 1.2) };
  };

  private onVisibility = () => {
    this.visible = !document.hidden;
    this.schedule();
  };

  private now() {
    return this.sim?.t ?? 0;
  }

  private target(): Vec2 {
    if (this.targetOverride) return this.targetOverride;
    const look = characterGaze.current();
    return this.director.update({
      now: this.now(),
      pointer: this.pointer,
      lookAt: look === VIEWER ? [0, 0] : look ? this.gazeAt(look) : null,
      glance: () => {
        const files = characterGaze.glanceTargets();
        return files.length ? this.gazeAt(files[Math.floor(this.rng() * files.length)]) : null;
      },
    });
  }

  // ---------- loop ----------

  private schedule() {
    const run = this.visible && this.onScreen && !this.manual && !this.destroyed && !!this.sim;
    if (run && !this.raf) {
      this.last = -1;
      this.raf = requestAnimationFrame(this.tick);
    } else if (!run && this.raf) {
      cancelAnimationFrame(this.raf);
      this.raf = 0;
    }
  }

  private tick = (ts: number) => {
    this.raf = requestAnimationFrame(this.tick);
    if (this.last < 0) {
      this.last = ts;
      this.watchdog.reset(ts);
      return;
    }
    const dtMs = ts - this.last;
    this.last = ts;
    if (this.o.debug) {
      this.frameTimes.push(dtMs);
      if (this.frameTimes.length > 600) this.frameTimes.shift();
    }
    if (this.watchdog.push(ts, dtMs)) return this.fail("slow");
    this.advance(Math.min(dtMs / 1000, 1 / 30));
  };

  private advance(dt: number) {
    const sim = this.sim!;
    sim.step(dt, this.target());
    this.render(sim.frame());
  }

  private renderCurrent() {
    if (this.sim) this.render(this.sim.frame());
  }

  private render(frame: CharacterFrame) {
    const { width, height, map } = this.size;
    if (!this.renderer || !width) return;
    this.renderer.draw(frame, map, width, height);
  }

  // ---------- debug (?character=debug) ----------

  private exposeDebug() {
    const sim = this.sim!;
    const renderer = this.renderer!;
    let releaseLook: (() => void) | undefined;
    const api = {
      /** Manual clock: time advances only through step(). */
      manual: (on = true) => {
        this.manual = on;
        this.schedule();
      },
      step: (ms = 1000 / 60, n = 1) => {
        for (let i = 0; i < n; i++) this.advance(ms / 1000);
      },
      /** Reset to the rest state (t = 0, gaze 0, no blink, chain still). */
      reset: () => {
        sim.t = 0;
        sim.gaze.snap(0, 0);
        sim.headSpring.snap(0, 0);
        sim.pendulum.reset();
        sim.sparkles.glints = [];
        this.pointer = null;
        this.renderCurrent();
      },
      setTarget: (g: Vec2 | null) => void (this.targetOverride = g),
      snapGaze: (g: Vec2) => {
        sim.gaze.snap(g[0], g[1]);
        sim.headSpring.snap(g[0], g[1]);
        this.renderCurrent();
      },
      setTime: (t: number) => {
        sim.t = t;
        this.renderCurrent();
      },
      blinks: (on: boolean) => void (sim.blinksEnabled = on),
      blink: () => sim.blinker.trigger(sim.t),
      flash: () => characterGaze.flash(),
      kickChain: (omega: number) => void (sim.pendulum.omega = omega),
      /** Hold the pendulum at a raw angle (the frame shows it soft-limited). */
      setChain: (theta: number) => {
        sim.pendulum.theta = theta;
        sim.pendulum.omega = 0;
        this.renderCurrent();
      },
      baseIsCrop: () => renderer.baseIsCrop,
      frame: () => sim.frame(),
      source: () => this.director.source,
      running: () => this.raf !== 0,
      /** Same call the desktop files use (lib/character/look-at.ts). */
      lookAt: (p: ClientPoint | null) => {
        releaseLook?.();
        releaseLook = p ? characterGaze.lookAt(p) : undefined;
      },
      registerGlance: (p: ClientPoint) => characterGaze.registerGlanceTarget(p),
      fps: () => {
        const t = [...this.frameTimes].sort((a, b) => a - b);
        const avg = t.reduce((a, b) => a + b, 0) / (t.length || 1);
        return { frames: t.length, avgMs: avg, medianMs: t[t.length >> 1] ?? 0, p95Ms: t[Math.floor(t.length * 0.95)] ?? 0 };
      },
      resetFps: () => void (this.frameTimes = []),
      geometry: () => ({ poster: this.screenImageBox(), canvas: { width: this.size.width, height: this.size.height }, map: this.size.map }),
      /** Rest frame rendered 1:1 vs base.jpg as decoded by the browser. */
      restCompare: () => {
        const got = renderer.renderNative(REST_FRAME);
        const ref = renderer.basePixels();
        let max = 0;
        let over1 = 0;
        let sq = 0;
        for (let i = 0; i < got.length; i++) {
          if ((i & 3) === 3) continue;
          const d = Math.abs(got[i] - ref[i]);
          sq += d * d;
          if (d > max) max = d;
          if (d > 1) over1++;
        }
        this.renderCurrent();
        const mse = sq / ((got.length / 4) * 3);
        return { maxDiff: max, valuesOver1: over1, psnr: mse === 0 ? Infinity : 10 * Math.log10(65025 / mse) };
      },
      /**
       * Iris-only render 1:1 at gaze g: every lit pixel must lie inside an
       * eye mask. Returns lit pixel count and how many are outside the masks.
       */
      irisContainment: (g: Vec2) => {
        renderer.debugMode = 1;
        sim.gaze.snap(g[0], g[1]);
        const f = sim.frame();
        const got = renderer.renderNative({ ...f, eyeBlend: 1, lid: 0, glints: [], sweep: -1, breath: 0, head: [0, 0], sway: 0, chain: 0 });
        renderer.debugMode = 0;
        const masks = (["L", "R"] as const).map((s) => {
          const e = EYES.eyes[s];
          return { x: e.maskOrigin[0], y: e.maskOrigin[1], w: e.maskSize[0], h: e.maskSize[1], px: maskPixels(s) };
        });
        let lit = 0;
        let outside = 0;
        for (let y = 0; y < H; y++)
          for (let x = 0; x < W; x++) {
            if (got[(y * W + x) * 4] === 0) continue;
            lit++;
            // 1:1 render samples texel centres, so a lit pixel must sit on a non-zero mask texel
            const inside = masks.some((m) => {
              const mx = x - m.x;
              const my = y - m.y;
              return mx >= 0 && my >= 0 && mx < m.w && my < m.h && m.px[(my * m.w + mx) * 4] > 0;
            });
            if (!inside) outside++;
          }
        this.renderCurrent();
        return { gaze: g, iris: f.iris, lit, outside };
      },
    };
    const maskCache = new Map<string, Uint8ClampedArray>();
    const maskPixels = (side: "L" | "R") => {
      if (!maskCache.has(side)) {
        const img = renderer.maskBitmap(side);
        const c = new OffscreenCanvas(img.width, img.height);
        const ctx = c.getContext("2d")!;
        ctx.drawImage(img, 0, 0);
        maskCache.set(side, ctx.getImageData(0, 0, img.width, img.height).data);
      }
      return maskCache.get(side)!;
    };
    (window as unknown as { __character: typeof api }).__character = api;
  }
}
