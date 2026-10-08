import { MOBILE_CROP, MOBILE_CROP_FILE } from "@/lib/character/mobile-crop";
import { FULL_RECT, loadCharacterAssets, loadFullBase, loadLayers, type Base, type CharacterAssets, type Derived, type Layers } from "./assets";
import type { WorkerJob, WorkerReply } from "./assets.worker";

/**
 * The character's textures, prepared in a worker (assets.worker.ts) so the
 * pixel work never blocks the page. Without module workers or a 2D
 * OffscreenCanvas in workers – or if the worker fails – the same code runs
 * on the main thread.
 */
function inWorker<T>(job: WorkerJob, signal: AbortSignal, onMainThread: () => Promise<T>, onProgress?: (loaded: number) => void): Promise<T> {
  if (typeof Worker === "undefined" || typeof OffscreenCanvas === "undefined") return onMainThread();
  let worker: Worker;
  try {
    worker = new Worker(new URL("./assets.worker.ts", import.meta.url), { type: "module" });
  } catch {
    return onMainThread();
  }
  return new Promise<T>((resolve, reject) => {
    const stop = () => {
      worker.terminate();
      signal.removeEventListener("abort", abort);
    };
    const abort = () => {
      stop();
      reject(signal.reason ?? new DOMException("Aborted", "AbortError"));
    };
    // a failed worker (no OffscreenCanvas 2D in workers, CSP …): start over on the main thread
    const fallback = () => {
      stop();
      if (!signal.aborted) onMainThread().then(resolve, reject);
    };
    signal.addEventListener("abort", abort, { once: true });
    worker.onerror = (e) => {
      e.preventDefault();
      fallback();
    };
    worker.onmessage = (e: MessageEvent<WorkerReply>) => {
      const m = e.data;
      if (m.type === "progress") onProgress?.(m.loaded);
      else if (m.type === "done") {
        stop();
        resolve(m.result as T);
      } else fallback();
    };
    worker.postMessage(job);
  });
}

/** Everything at full resolution (`onProgress` counts files). */
export function loadAssets(signal: AbortSignal, { crop, onProgress }: { crop: boolean; onProgress?: (loaded: number) => void }): Promise<CharacterAssets> {
  return inWorker({ job: "all", crop }, signal, () => loadCharacterAssets(signal, { crop, onProgress }), onProgress);
}

/** The layers only (the intro's quick start); `onLoaded` once per file. */
export function loadAssetLayers(signal: AbortSignal, onLoaded: () => void): Promise<Layers> {
  let seen = 0;
  // progress from the worker counts up; the main-thread fallback calls back per file
  return inWorker({ job: "layers" }, signal, () => loadLayers(signal, onLoaded), (n) => {
    while (seen < n) {
      seen++;
      onLoaded();
    }
  });
}

/**
 * The poster as the base (the intro's quick start): already downloaded and
 * decoded at the size it is shown, so the character can develop in time on a
 * first visit. The full-resolution base follows after the intro.
 */
export async function posterBase(img: HTMLImageElement): Promise<Base> {
  await img.decode().catch(() => {});
  const base = await createImageBitmap(img, { premultiplyAlpha: "none", colorSpaceConversion: "default" });
  // phones in portrait show the crop (base-mobile.jpg) in the poster
  const crop = img.currentSrc.includes(MOBILE_CROP_FILE.split(".")[0]);
  return { base, baseRect: crop ? MOBILE_CROP : FULL_RECT };
}

/** The full-resolution base and its derived data (after the quick start). */
export function loadAssetFullBase(signal: AbortSignal, crop: boolean): Promise<Base & Derived> {
  return inWorker({ job: "fullBase", crop }, signal, () => loadFullBase(signal, crop));
}
