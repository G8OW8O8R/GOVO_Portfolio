import { DIAMOND_RECT, EYES, TUNING } from "@/lib/character/config";
import type { CharacterFrame } from "@/lib/character/sim";
import { FRAGMENT, MAX_GLINTS, VERTEX } from "./shaders";
import { glintEnvelope } from "@/lib/character/sparkles";

/**
 * WebGL2 renderer for the character: textures from the original files in
 * /character (sharpness), one full-screen pass (shaders.ts).
 */

const SRC = "/character/";
const [W, H] = EYES.image;

/** Union of both eye masks: the only area where base-no-iris is used. */
const { L: EL, R: ER } = EYES.eyes;
export const NO_IRIS_RECT = (() => {
  const x = Math.min(EL.maskOrigin[0], ER.maskOrigin[0]);
  const y = Math.min(EL.maskOrigin[1], ER.maskOrigin[1]);
  const r = Math.max(EL.maskOrigin[0] + EL.maskSize[0], ER.maskOrigin[0] + ER.maskSize[0]);
  const b = Math.max(EL.maskOrigin[1] + EL.maskSize[1], ER.maskOrigin[1] + ER.maskSize[1]);
  return { x, y, width: r - x, height: b - y };
})();

type Rect = { x: number; y: number; width: number; height: number };

export type CharacterAssets = {
  base: ImageBitmap;
  noIris: ImageBitmap;
  iris: { L: ImageBitmap; R: ImageBitmap };
  highlight: { L: ImageBitmap; R: ImageBitmap };
  mask: { L: ImageBitmap; R: ImageBitmap };
  lids: ImageBitmap;
  diamond: ImageBitmap;
  /** dilated + blurred diamond mask (R8) and where it sits */
  chainWeight: { data: Uint8Array; width: number; height: number; rect: Rect };
  /** candidate glint centres, image px */
  glintPoints: Float32Array;
};

/**
 * Layers with alpha (iris, highlight, lids) are premultiplied here: WebGL
 * ignores UNPACK_PREMULTIPLY_ALPHA for ImageBitmap sources, and the shader
 * composites premultiplied colour (correct bilinear filtering at sprite edges).
 */
async function bitmap(file: string, signal: AbortSignal | undefined, { crop, premultiply = false }: { crop?: Rect; premultiply?: boolean } = {}): Promise<ImageBitmap> {
  const res = await fetch(SRC + file, { signal });
  if (!res.ok) throw new Error(`character asset ${file}: ${res.status}`);
  const blob = await res.blob();
  const opts: ImageBitmapOptions = {
    premultiplyAlpha: premultiply ? "premultiply" : "none",
    colorSpaceConversion: "default",
    imageOrientation: "none",
  };
  return crop ? createImageBitmap(blob, crop.x, crop.y, crop.width, crop.height, opts) : createImageBitmap(blob, opts);
}

function pixels(img: ImageBitmap, crop?: Rect): Uint8ClampedArray {
  const r = crop ?? { x: 0, y: 0, width: img.width, height: img.height };
  const canvas = new OffscreenCanvas(r.width, r.height);
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, r.x, r.y, r.width, r.height, 0, 0, r.width, r.height);
  return ctx.getImageData(0, 0, r.width, r.height).data;
}

/** Chain warp weight: the diamond mask dilated and blurred, at 1/4 resolution. */
function chainWeight(diamond: ImageBitmap) {
  const step = 4;
  const margin = 32;
  const rect = { x: DIAMOND_RECT.x - margin, y: DIAMOND_RECT.y - margin, width: diamond.width + 2 * margin, height: diamond.height + 2 * margin };
  const w = Math.ceil(rect.width / step);
  const h = Math.ceil(rect.height / step);
  const src = pixels(diamond);
  let a = new Float32Array(w * h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let m = 0;
      for (let sy = 0; sy < step && !m; sy++)
        for (let sx = 0; sx < step; sx++) {
          const ix = x * step + sx - margin;
          const iy = y * step + sy - margin;
          if (ix >= 0 && iy >= 0 && ix < diamond.width && iy < diamond.height && src[(iy * diamond.width + ix) * 4] > 127) {
            m = 1;
            break;
          }
        }
      a[y * w + x] = m;
    }
  // dilate (max) then box blur, radius in cells
  const pass = (r: number, op: "max" | "mean") => {
    for (const horizontal of [true, false]) {
      const b = new Float32Array(w * h);
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          let acc = 0;
          for (let k = -r; k <= r; k++) {
            const xx = horizontal ? Math.min(w - 1, Math.max(0, x + k)) : x;
            const yy = horizontal ? y : Math.min(h - 1, Math.max(0, y + k));
            const v = a[yy * w + xx];
            acc = op === "max" ? Math.max(acc, v) : acc + v;
          }
          b[y * w + x] = op === "max" ? acc : acc / (2 * r + 1);
        }
      a = b;
    }
  };
  const r = Math.round(TUNING.chainMaskBlur / step);
  pass(Math.ceil(r * 0.75), "max");
  pass(Math.ceil(r / 2), "mean");
  pass(Math.ceil(r / 2), "mean");
  const data = new Uint8Array(w * h);
  for (let i = 0; i < data.length; i++) data[i] = Math.round(a[i] * 255);
  return { data, width: w, height: h, rect };
}

/** Bright diamond pixels inside the mask: where glints may appear. */
function glintCandidates(base: ImageBitmap, diamond: ImageBitmap): Float32Array {
  const rect = { x: DIAMOND_RECT.x, y: DIAMOND_RECT.y, width: diamond.width, height: diamond.height };
  const img = pixels(base, rect);
  const mask = pixels(diamond);
  const pts: number[] = [];
  for (let y = 2; y < rect.height - 2; y += 2)
    for (let x = 2; x < rect.width - 2; x += 2) {
      const i = (y * rect.width + x) * 4;
      if (mask[i] < 200) continue;
      const lum = 0.299 * img[i] + 0.587 * img[i + 1] + 0.114 * img[i + 2];
      if (lum > 225) pts.push(rect.x + x + 0.5, rect.y + y + 0.5);
    }
  return new Float32Array(pts);
}

export async function loadCharacterAssets(signal?: AbortSignal): Promise<CharacterAssets> {
  const [base, noIris, irisL, irisR, hlL, hlR, maskL, maskR, lids, diamond] = await Promise.all([
    bitmap("base.jpg", signal),
    bitmap("base-no-iris.jpg", signal, { crop: NO_IRIS_RECT }),
    bitmap("iris-L.png", signal, { premultiply: true }),
    bitmap("iris-R.png", signal, { premultiply: true }),
    bitmap("highlight-L.png", signal, { premultiply: true }),
    bitmap("highlight-R.png", signal, { premultiply: true }),
    bitmap("mask-L.png", signal),
    bitmap("mask-R.png", signal),
    bitmap("blink-lids.png", signal, { premultiply: true }),
    bitmap("diamond-mask.png", signal),
  ]);
  return {
    base,
    noIris,
    iris: { L: irisL, R: irisR },
    highlight: { L: hlL, R: hlR },
    mask: { L: maskL, R: maskR },
    lids,
    diamond,
    chainWeight: chainWeight(diamond),
    glintPoints: glintCandidates(base, diamond),
  };
}

const UNIFORMS = [
  "u_map", "u_bias", "u_base", "u_noIris", "u_noIrisRect", "u_irisL", "u_irisR", "u_hlL", "u_hlR",
  "u_maskL", "u_maskR", "u_lids", "u_diamond", "u_diamondRect", "u_chainW", "u_chainRect",
  "u_breath", "u_head", "u_sway", "u_chain", "u_iris", "u_eyeBlend", "u_lid", "u_sweep",
  "u_glintCount", "u_glints", "u_glintsB", "u_debug",
] as const;
type UniformName = (typeof UNIFORMS)[number];

/** Image px of the canvas pixel grid: imageX = fragX * a + b, imageY = fragY * c + d. */
export type PixelMap = readonly [number, number, number, number];

export class CharacterRenderer {
  private readonly gl: WebGL2RenderingContext;
  private readonly program: WebGLProgram;
  private readonly u: Record<UniformName, WebGLUniformLocation | null>;
  private readonly baseTex: WebGLTexture;
  private mipmapped = false;
  private minifying = false;
  private readonly glints = new Float32Array(MAX_GLINTS * 4);
  private readonly glintsB = new Float32Array(MAX_GLINTS * 2);
  debugMode = 0;

  constructor(
    gl: WebGL2RenderingContext,
    private readonly assets: CharacterAssets,
  ) {
    this.gl = gl;
    this.program = link(gl);
    gl.useProgram(this.program);
    this.u = Object.fromEntries(UNIFORMS.map((n) => [n, gl.getUniformLocation(this.program, n)])) as typeof this.u;
    gl.bindVertexArray(gl.createVertexArray());

    let unit = 0;
    const bind = (name: UniformName, tex: WebGLTexture) => {
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.uniform1i(this.u[name], unit++);
    };
    this.baseTex = texture(gl, assets.base);
    bind("u_base", this.baseTex);
    bind("u_noIris", texture(gl, assets.noIris));
    bind("u_irisL", texture(gl, assets.iris.L));
    bind("u_irisR", texture(gl, assets.iris.R));
    bind("u_hlL", texture(gl, assets.highlight.L));
    bind("u_hlR", texture(gl, assets.highlight.R));
    bind("u_maskL", texture(gl, assets.mask.L));
    bind("u_maskR", texture(gl, assets.mask.R));
    bind("u_lids", texture(gl, assets.lids));
    bind("u_diamond", texture(gl, assets.diamond));
    const cw = assets.chainWeight;
    gl.activeTexture(SCRATCH_UNIT(gl));
    const chainTex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, chainTex);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, cw.width, cw.height, 0, gl.RED, gl.UNSIGNED_BYTE, cw.data);
    edgeClampLinear(gl);
    bind("u_chainW", chainTex);

    const rect = (name: UniformName, r: Rect) => gl.uniform4f(this.u[name], r.x, r.y, r.width, r.height);
    rect("u_noIrisRect", NO_IRIS_RECT);
    rect("u_diamondRect", { x: DIAMOND_RECT.x, y: DIAMOND_RECT.y, width: assets.diamond.width, height: assets.diamond.height });
    rect("u_chainRect", cw.rect);
  }

  /**
   * Sharpness: plain LINEAR while the image is shown at > 0.5 device px per
   * image px (trilinear would blur it); trilinear with a −0.5 LOD bias below.
   */
  setMinification(devicePxPerImagePx: number) {
    const gl = this.gl;
    const minify = devicePxPerImagePx <= 0.5;
    if (minify === this.minifying) return;
    this.minifying = minify;
    gl.activeTexture(gl.TEXTURE0); // base is unit 0
    if (minify && !this.mipmapped) {
      gl.generateMipmap(gl.TEXTURE_2D);
      this.mipmapped = true;
    }
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, minify ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
    gl.uniform1f(this.u.u_bias, minify ? -0.5 : 0);
  }

  draw(frame: CharacterFrame, map: PixelMap, width: number, height: number) {
    const { gl, u } = this;
    gl.viewport(0, 0, width, height);
    gl.uniform4f(u.u_map, map[0], map[1], map[2], map[3]);
    gl.uniform1f(u.u_breath, frame.breath);
    gl.uniform2f(u.u_head, frame.head[0], frame.head[1]);
    gl.uniform1f(u.u_sway, frame.sway);
    gl.uniform1f(u.u_chain, frame.chain);
    gl.uniform2f(u.u_iris, frame.iris[0], frame.iris[1]);
    gl.uniform1f(u.u_eyeBlend, frame.eyeBlend);
    gl.uniform1f(u.u_lid, frame.lid);
    gl.uniform1f(u.u_sweep, frame.sweep);
    gl.uniform1i(u.u_debug, this.debugMode);
    let n = 0;
    for (const g of frame.glints) {
      const k = glintEnvelope(frame.t - g.born);
      if (k <= 0 || n >= MAX_GLINTS) continue;
      this.glints.set([g.x, g.y, g.size, k], n * 4);
      this.glintsB.set([g.rot, g.hue], n * 2);
      n++;
    }
    gl.uniform1i(u.u_glintCount, n);
    if (n) {
      gl.uniform4fv(u.u_glints, this.glints);
      gl.uniform2fv(u.u_glintsB, this.glintsB);
    }
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  /**
   * Debug: render the whole image 1:1 (one pixel per image pixel) into an
   * offscreen buffer and read it back, top row first. Used to prove the rest
   * frame equals base.jpg.
   */
  renderNative(frame: CharacterFrame): Uint8Array {
    const gl = this.gl;
    const fb = gl.createFramebuffer();
    const rb = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, rb);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.RGBA8, W, H);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, rb);
    const minifying = this.minifying;
    this.setMinification(1);
    // frag (x, y) bottom-up → image (x, H − y)
    this.draw(frame, [1, 0, -1, H], W, H);
    const out = new Uint8Array(W * H * 4);
    gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, out);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.deleteFramebuffer(fb);
    gl.deleteRenderbuffer(rb);
    if (minifying) this.setMinification(0);
    // flip to top-down rows
    const row = W * 4;
    const flipped = new Uint8Array(out.length);
    for (let y = 0; y < H; y++) flipped.set(out.subarray((H - 1 - y) * row, (H - y) * row), y * row);
    return flipped;
  }

  maskBitmap(side: "L" | "R"): ImageBitmap {
    return this.assets.mask[side];
  }

  /** Base image pixels as the browser decodes them (for renderNative comparisons). */
  basePixels(): Uint8ClampedArray {
    return pixels(this.assets.base);
  }
}

/** Uploads the bitmap as is (alpha handling is decided in bitmap()). */
function texture(gl: WebGL2RenderingContext, img: ImageBitmap): WebGLTexture {
  gl.activeTexture(SCRATCH_UNIT(gl)); // never disturb a unit already bound to a sampler
  const tex = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, img);
  edgeClampLinear(gl);
  return tex;
}

const SCRATCH_UNIT = (gl: WebGL2RenderingContext) => gl.TEXTURE0 + 15;

function edgeClampLinear(gl: WebGL2RenderingContext) {
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
}

function link(gl: WebGL2RenderingContext): WebGLProgram {
  const compile = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? "shader");
    return s;
  };
  const p = gl.createProgram()!;
  gl.attachShader(p, compile(gl.VERTEX_SHADER, VERTEX));
  gl.attachShader(p, compile(gl.FRAGMENT_SHADER, FRAGMENT));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) ?? "link");
  return p;
}
