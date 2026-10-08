"use client";

import { useEffect, useRef, useState } from "react";
import { LIVE } from "@/lib/motion-tokens";
import { pointer } from "@/lib/pointer";

/**
 * "Real-time graphics": the thumbnail itself, rendered by one WebGL2 shader
 * (no libraries) with water ripples running out from the cursor – a steady
 * wave at its position plus a ring for every move. Same size as the
 * thumbnail, DPR ≤ 2, the picture is the texture (the thumbnail's own <img>),
 * so the colours stay the warm grey of the image. On unmount the loop stops,
 * every GL object is deleted and the context is released.
 */

const MAX_DPR = 2;
const DROPS = 6;
const DROP_MS = 140;

const VERT = `#version 300 es
in vec2 a;
out vec2 uv;
void main() {
  uv = a * 0.5 + 0.5;
  gl_Position = vec4(a, 0.0, 1.0);
}`;

const FRAG = `#version 300 es
precision mediump float;
in vec2 uv;
out vec4 color;
uniform sampler2D tex;
uniform vec2 mouse;
uniform float t;
uniform float strength;
uniform vec4 drops[${DROPS}];
void main() {
  vec2 d = uv - mouse;
  float r = length(d) + 1e-4;
  float wave = sin(r * 38.0 - t * 5.0) * exp(-r * 3.2) * strength;
  vec2 shift = d / r * wave * 0.016;
  float shade = wave;
  for (int i = 0; i < ${DROPS}; i++) {
    vec4 drop = drops[i];
    float age = t - drop.z;
    if (drop.w <= 0.0 || age < 0.0 || age > 1.8) continue;
    vec2 e = uv - drop.xy;
    float re = length(e) + 1e-4;
    float x = re - age * 0.6;
    float ring = exp(-x * x * 180.0) * sin(x * 70.0) * (1.0 - age / 1.8) * drop.w;
    shift += e / re * ring * 0.03;
    shade += ring * 1.4;
  }
  vec3 c = texture(tex, uv + shift).rgb;
  color = vec4(c * (1.0 + shade * 0.16), 1.0);
}`;

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh) ?? "shader");
  return sh;
}

export default function RippleDemo({ active }: { active: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const host = ref.current;
    const img = host?.parentElement?.querySelector("img");
    if (!host || !img) return;
    // a canvas of its own per mount: a released context can never be reused
    const canvas = document.createElement("canvas");
    canvas.className = "block size-full";
    host.appendChild(canvas);
    const gl = canvas.getContext("webgl2", { alpha: false, antialias: false, depth: false, stencil: false });
    if (!gl) {
      canvas.remove();
      return;
    }

    const dpr = Math.min(devicePixelRatio || 1, MAX_DPR);
    canvas.width = Math.round(canvas.offsetWidth * dpr);
    canvas.height = Math.round(canvas.offsetHeight * dpr);

    let raf = 0;
    let disposed = false;
    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.useProgram(program);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(program, "a");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
    gl.viewport(0, 0, canvas.width, canvas.height);
    const u = {
      mouse: gl.getUniformLocation(program, "mouse"),
      t: gl.getUniformLocation(program, "t"),
      strength: gl.getUniformLocation(program, "strength"),
      drops: gl.getUniformLocation(program, "drops"),
    };

    const drops = new Float32Array(DROPS * 4);
    let next = 0;
    let lastDrop = 0;
    const mouse = { x: 0.5, y: 0.5 };
    const t0 = performance.now();
    let strength = 0;

    const off = pointer.subscribe((p) => {
      if (p.kind !== "mouse") return;
      const r = canvas.getBoundingClientRect();
      // the cursor is somewhere on the row: project it onto the picture (kept near it)
      const x = Math.max(-0.6, Math.min(1.6, (p.x - r.left) / r.width));
      const y = Math.max(-0.6, Math.min(1.6, 1 - (p.y - r.top) / r.height));
      const moved = Math.hypot(x - mouse.x, y - mouse.y) * r.width;
      mouse.x = x;
      mouse.y = y;
      const now = performance.now();
      if (moved > 2 && now - lastDrop > DROP_MS) {
        lastDrop = now;
        drops.set([x, y, (now - t0) / 1000, 1], next * 4);
        next = (next + 1) % DROPS;
      }
    });

    const frame = (now: number) => {
      const t = (now - t0) / 1000;
      strength = Math.min(1, strength + 0.05);
      gl.uniform2f(u.mouse, mouse.x, mouse.y);
      gl.uniform1f(u.t, t);
      gl.uniform1f(u.strength, strength);
      gl.uniform4fv(u.drops, drops);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (disposed) return;
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
      frame(performance.now());
      setReady(true);
    };
    if (img.complete && img.naturalWidth) start();
    else img.addEventListener("load", start, { once: true });

    return () => {
      disposed = true;
      off();
      cancelAnimationFrame(raf);
      img.removeEventListener("load", start);
      gl.deleteTexture(texture);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      canvas.remove();
    };
  }, []);

  return (
    <span
      ref={ref}
      aria-hidden="true"
      className="absolute inset-0 overflow-hidden rounded-[12px] transition-opacity ease-out"
      style={{ opacity: ready && active ? 1 : 0, transitionDuration: `${LIVE.crossfadeMs}ms` }}
    />
  );
}
