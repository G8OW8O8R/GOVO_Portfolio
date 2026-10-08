/// <reference lib="webworker" />
import { loadCharacterAssets, loadFullBase, loadLayers } from "./assets";

/**
 * Loads and prepares the character's textures off the main thread (fetch,
 * decode, chain weight, glint candidates – ~0.5 s of pixel work on a laptop,
 * 2 s at CPU 4×), so the page and the intro keep their frames. Bitmaps and
 * buffers are transferred, not copied.
 *
 * Jobs: "all" (base + layers + derived), "layers" (the intro's quick start –
 * its base is the poster already on the page) and "fullBase" (the upgrade
 * after the intro: full-resolution base + derived).
 */

export type WorkerJob = { job: "all"; crop: boolean } | { job: "layers" } | { job: "fullBase"; crop: boolean };
export type WorkerReply = { type: "progress"; loaded: number } | { type: "done"; result: unknown } | { type: "error"; message: string };

const scope = self as unknown as DedicatedWorkerGlobalScope;
const reply = (m: WorkerReply, transfer: Transferable[] = []) => scope.postMessage(m, transfer);

/** Every bitmap and typed-array buffer in the result, to transfer instead of copy. */
function transferables(value: unknown, out: Transferable[] = []): Transferable[] {
  if (value instanceof ImageBitmap) out.push(value);
  else if (ArrayBuffer.isView(value)) out.push(value.buffer as ArrayBuffer);
  else if (value && typeof value === "object") for (const v of Object.values(value)) transferables(v, out);
  return out;
}

scope.onmessage = async (e: MessageEvent<WorkerJob>) => {
  const job = e.data;
  let loaded = 0;
  const progress = () => reply({ type: "progress", loaded: ++loaded });
  try {
    const result =
      job.job === "all"
        ? await loadCharacterAssets(undefined, { crop: job.crop, onProgress: (n) => reply({ type: "progress", loaded: n }) })
        : job.job === "layers"
          ? await loadLayers(undefined, progress)
          : await loadFullBase(undefined, job.crop);
    reply({ type: "done", result }, transferables(result));
  } catch (error) {
    reply({ type: "error", message: error instanceof Error ? error.message : String(error) });
  }
};
