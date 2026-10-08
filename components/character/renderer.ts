import { EYES } from "@/lib/character/config";
import type { CharacterFrame } from "@/lib/character/sim";
import { glintEnvelope } from "@/lib/character/sparkles";
import { DIAMOND_RECT } from "@/lib/character/config";
import { FULL_RECT, NO_IRIS_RECT, basePixels, type CharacterAssets, type Derived, type Rect } from "./assets";
import { FRAGMENT, MAX_GLINTS, VERTEX } from "./shaders";

/**
 * WebGL2 renderer for the character: textures from assets.ts, one
 * full-screen pass (shaders.ts).
 */

const [W, H] = EYES.image;

const UNIFORMS = [
  "u_map", "u_bias", "u_base", "u_baseRect", "u_noIris", "u_noIrisRect", "u_irisL", "u_irisR", "u_hlL", "u_hlR",
  "u_maskL", "u_maskR", "u_lids", "u_diamond", "u_diamondRect", "u_chainW", "u_chainRect",
  "u_breath", "u_head", "u_sway", "u_chain", "u_iris", "u_eyeBlend", "u_lid", "u_sweep",
  "u_glintCount", "u_glints", "u_glintsB", "u_debug", "u_develop",
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
  private chainUnit = 0;
  /** Intro: 0 = black … 1 = normal (darkroom development with grain). */
  develop = 1;

  /** Starts compiling the shader (in parallel with loading the textures). */
  static compile(gl: WebGL2RenderingContext): Promise<WebGLProgram> {
    return link(gl);
  }

  /** Waits for the shader without blocking the page, then uploads the textures. */
  static async create(gl: WebGL2RenderingContext, assets: CharacterAssets, program: Promise<WebGLProgram> = link(gl)): Promise<CharacterRenderer> {
    return new CharacterRenderer(gl, assets, await program);
  }

  private constructor(
    gl: WebGL2RenderingContext,
    private readonly assets: CharacterAssets,
    program: WebGLProgram,
  ) {
    this.gl = gl;
    this.program = program;
    gl.useProgram(this.program);
    this.u = Object.fromEntries(UNIFORMS.map((n) => [n, gl.getUniformLocation(this.program, n)])) as typeof this.u;
    gl.bindVertexArray(gl.createVertexArray());

    let unit = 0;
    const bind = (name: UniformName, tex: WebGLTexture) => {
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.uniform1i(this.u[name], unit++);
      return unit - 1;
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
    this.chainUnit = bind("u_chainW", chainTex);

    const rect = (name: UniformName, r: Rect) => gl.uniform4f(this.u[name], r.x, r.y, r.width, r.height);
    rect("u_baseRect", assets.baseRect);
    rect("u_noIrisRect", NO_IRIS_RECT);
    rect("u_diamondRect", { x: DIAMOND_RECT.x, y: DIAMOND_RECT.y, width: assets.diamond.width, height: assets.diamond.height });
    rect("u_chainRect", cw.rect);
  }

  /**
   * Sharpness: plain LINEAR while the image is shown at > 0.5 device px per
   * image px (trilinear would blur it); trilinear with a −0.5 LOD bias below.
   */
  /**
   * The chain warp weight computed from the full-resolution base (after the
   * intro's quick start, which runs with none: the chain hangs still).
   */
  setDerived({ chainWeight: cw }: Pick<Derived, "chainWeight">) {
    const gl = this.gl;
    this.assets.chainWeight = cw;
    gl.activeTexture(gl.TEXTURE0 + this.chainUnit);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, cw.width, cw.height, 0, gl.RED, gl.UNSIGNED_BYTE, cw.data);
    gl.uniform4f(this.u.u_chainRect, cw.rect.x, cw.rect.y, cw.rect.width, cw.rect.height);
  }

  /** Swap the base (phone crop → full image after a rotation, poster → full resolution), same texture unit. */
  replaceBase({ base, baseRect }: { base: ImageBitmap; baseRect: Rect }) {
    const gl = this.gl;
    this.assets.base.close();
    this.assets.base = base;
    this.assets.baseRect = baseRect;
    gl.activeTexture(gl.TEXTURE0); // base is unit 0
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, base);
    this.mipmapped = this.minifying;
    if (this.minifying) gl.generateMipmap(gl.TEXTURE_2D);
    gl.uniform4f(this.u.u_baseRect, baseRect.x, baseRect.y, baseRect.width, baseRect.height);
  }

  get baseIsCrop(): boolean {
    return this.assets.baseRect !== FULL_RECT;
  }

  setMinification(devicePxPerImagePx: number) {
    const gl = this.gl;
    const minify = devicePxPerImagePx * (this.assets.baseRect.width / this.assets.base.width) <= 0.5;
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
    gl.uniform1f(u.u_develop, this.develop);
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
    return basePixels(this.assets.base, this.assets.baseRect, FULL_RECT);
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

/**
 * Compile and link without blocking the main thread: with
 * KHR_parallel_shader_compile the status is polled once per frame instead of
 * waiting for the GPU process (≈ 200 ms with a software GPU).
 */
function link(gl: WebGL2RenderingContext): Promise<WebGLProgram> {
  const shader = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  };
  const p = gl.createProgram()!;
  const shaders = [shader(gl.VERTEX_SHADER, VERTEX), shader(gl.FRAGMENT_SHADER, FRAGMENT)];
  shaders.forEach((s) => gl.attachShader(p, s));
  gl.linkProgram(p);
  const parallel = gl.getExtension("KHR_parallel_shader_compile");
  return new Promise((resolve, reject) => {
    const check = () => {
      if (gl.isContextLost()) return reject(new Error("shader: WebGL context lost"));
      if (parallel && !gl.getProgramParameter(p, parallel.COMPLETION_STATUS_KHR)) return void setTimeout(check, 16);
      if (gl.getProgramParameter(p, gl.LINK_STATUS)) return resolve(p);
      const log = shaders.map((s) => gl.getShaderInfoLog(s)).find(Boolean) || gl.getProgramInfoLog(p) || "shader link";
      reject(new Error(log));
    };
    check();
  });
}
