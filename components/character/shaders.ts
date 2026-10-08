import { DERIVED, EYES, TUNING } from "@/lib/character/config";

/**
 * One full-screen pass. For every output pixel the shader finds the image
 * point p (character box mapping), undoes the warp (p − D(p), mirrors
 * warpSource in lib/character/sim.ts) and composites all layers at that
 * pre-warp point: base → eyes (iris, highlight) → eyelids → sparkles.
 * Eye layers, lids and sparkles therefore move with the head and the chain.
 */

const f = (n: number) => (Number.isInteger(n) ? `${n}.0` : `${n}`);
const v2 = ([x, y]: readonly [number, number]) => `vec2(${f(x)}, ${f(y)})`;

const L = EYES.living;
const { L: EL, R: ER } = EYES.eyes;

export const MAX_GLINTS = TUNING.maxGlints;

export const VERTEX = /* glsl */ `#version 300 es
void main() {
  // one triangle covering the viewport
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

export const FRAGMENT = /* glsl */ `#version 300 es
precision highp float;

uniform vec4 u_map;          // image px = (frag.x * x + y, frag.y * z + w)
uniform float u_bias;        // LOD bias (mipmapped minification only)

uniform sampler2D u_base;    // base.jpg or the phone crop (base-mobile.jpg)
uniform vec4 u_baseRect;     // the base texture's rect in image px (crop origin, size)
uniform sampler2D u_noIris;  // base-no-iris.jpg, eye area crop
uniform vec4 u_noIrisRect;   // origin, size (image px)
uniform sampler2D u_irisL, u_irisR, u_hlL, u_hlR; // premultiplied
uniform sampler2D u_maskL, u_maskR;
uniform sampler2D u_lids;    // premultiplied
uniform sampler2D u_diamond; // diamond-mask.png
uniform vec4 u_diamondRect;
uniform sampler2D u_chainW;  // dilated + blurred diamond mask
uniform vec4 u_chainRect;

uniform float u_breath;
uniform vec2 u_head;
uniform float u_sway;
uniform float u_chain;
uniform vec2 u_iris;
uniform float u_eyeBlend;
uniform float u_lid;
uniform float u_sweep;       // −1 none, else 0..1
uniform int u_glintCount;
uniform vec4 u_glints[${MAX_GLINTS}];  // x, y, size, intensity
uniform vec2 u_glintsB[${MAX_GLINTS}]; // rotation, hue
uniform int u_debug;         // 1 = iris-only (mask containment check)
uniform float u_develop;     // intro: 0 = black … 1 = normal

out vec4 outColor;

const vec2 IMAGE = ${v2(EYES.image as [number, number])};

bool inRect(vec2 p, vec4 r) {
  return p.x >= r.x && p.y >= r.y && p.x < r.x + r.z && p.y < r.y + r.w;
}

vec4 sampleRect(sampler2D t, vec2 p, vec4 r) {
  return inRect(p, r) ? texture(t, (p - r.xy) / r.zw) : vec4(0.0);
}

float chainWeight(vec2 p) {
  return sampleRect(u_chainW, p, u_chainRect).r;
}

// Inverse warp: the pre-warp image point shown at destination q.
vec2 warpSource(vec2 q) {
  vec2 p = q;
  vec2 d = vec2(0.0);
  // breathing
  d.y -= ${f(L.breathing.lift_px)} * u_breath * smoothstep(${f(EYES.image[1])}, ${f(DERIVED.liftFullY)}, p.y);
  float chest = exp(-pow(p.y - ${f(L.breathing.chest_center_y)}, 2.0) / ${f(2 * L.breathing.chest_sigma ** 2)});
  d.x += (p.x - ${f(L.head.center[0])}) * ${f(L.breathing.chest_expand)} * u_breath * chest;
  // head
  vec2 e = (p - ${v2(L.head.center as [number, number])}) / ${v2(L.head.radius as [number, number])};
  float wHead = (1.0 - smoothstep(0.55, 1.0, dot(e, e)))
              * (1.0 - smoothstep(${f(L.head.fade_to_neck_y[0])}, ${f(L.head.fade_to_neck_y[1])}, p.y));
  d.x += wHead * (u_head.x - u_sway * (p.y - ${f(TUNING.swayPivotY)}));
  d.y += wHead * (u_head.y + u_sway * (p.x - ${f(L.head.center[0])}));
  p -= d;
  // chain: rigid rotation around the pivot, weighted by the soft chain mask at
  // the point and at its rotated source (the chain moves as one piece, only a
  // thin band of shirt follows); the upper chain bends in the attachment fade
  if (u_chain != 0.0) {
    const vec2 PIVOT = ${v2(L.chain.pivot as [number, number])};
    vec2 r = p - PIVOT;
    float c = cos(u_chain), s = sin(u_chain);
    vec2 src = PIVOT + vec2(c * r.x - s * r.y, s * r.x + c * r.y);
    float w = max(chainWeight(p), chainWeight(src))
            * smoothstep(${f(L.chain.attach_fade_y[0])}, ${f(L.chain.attach_fade_y[1])}, p.y);
    p = mix(p, src, w);
  }
  return p;
}

// Iris + highlight for one eye at p. Returns the reconstructed colour and
// writes the mask value; bg is the untouched base colour at p.
vec3 eye(vec2 p, vec3 bg, sampler2D iris, sampler2D hl, sampler2D mask,
         vec2 spriteOrigin, vec4 maskRect, out float m, out float irisA) {
  m = sampleRect(mask, p, maskRect).r;
  irisA = 0.0;
  if (m <= 0.0) return bg;
  vec3 noIris = sampleRect(u_noIris, p, u_noIrisRect).rgb;
  vec3 c = mix(bg, noIris, m);
  vec4 sprite = vec4(0.0, 0.0, ${f(EL.spriteSize)}, ${f(EL.spriteSize)});
  vec4 ir = sampleRect(iris, p - spriteOrigin - u_iris, sprite);
  c = c * (1.0 - ir.a * m) + ir.rgb * m;
  vec4 h = sampleRect(hl, p - spriteOrigin - 0.85 * u_iris, sprite);
  float k = ir.a * m;
  c = c * (1.0 - h.a * k) + h.rgb * k;
  irisA = ir.a * m;
  return c;
}

vec3 hue(float h) {
  return clamp(abs(mod(h * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
}

void main() {
  vec2 q = vec2(gl_FragCoord.x * u_map.x + u_map.y, gl_FragCoord.y * u_map.z + u_map.w);
  if (q.x < 0.0 || q.y < 0.0 || q.x >= IMAGE.x || q.y >= IMAGE.y) {
    outColor = vec4(0.0);
    return;
  }
  vec2 p = warpSource(q);
  vec3 c = texture(u_base, (p - u_baseRect.xy) / u_baseRect.zw, u_bias).rgb;

  // eyes
  const vec4 EYES_BOX = vec4(${f(EL.maskOrigin[0])}, ${f(Math.min(EL.maskOrigin[1], ER.maskOrigin[1]))},
    ${f(ER.maskOrigin[0] + ER.maskSize[0] - EL.maskOrigin[0])}, ${f(Math.max(EL.maskOrigin[1] + EL.maskSize[1], ER.maskOrigin[1] + ER.maskSize[1]) - Math.min(EL.maskOrigin[1], ER.maskOrigin[1]))});
  if ((u_eyeBlend > 0.0 || u_debug == 1) && inRect(p, EYES_BOX)) {
    float mL, mR, aL, aR;
    vec3 rec = eye(p, c, u_irisL, u_hlL, u_maskL, ${v2(EL.spriteOrigin as [number, number])},
                   vec4(${v2(EL.maskOrigin as [number, number])}, ${v2(EL.maskSize as [number, number])}), mL, aL);
    rec = eye(p, rec, u_irisR, u_hlR, u_maskR, ${v2(ER.spriteOrigin as [number, number])},
              vec4(${v2(ER.maskOrigin as [number, number])}, ${v2(ER.maskSize as [number, number])}), mR, aR);
    if (u_debug == 1) { outColor = vec4(vec3(aL + aR), 1.0); return; }
    c = mix(c, rec, u_eyeBlend);
  } else if (u_debug == 1) {
    outColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }

  // eyelids (blink, droop when looking down)
  if (u_lid > 0.0) {
    vec4 lid = sampleRect(u_lids, p, vec4(${v2(EYES.blink.origin as [number, number])}, ${v2(EYES.blink.size as [number, number])}));
    c = c * (1.0 - lid.a * u_lid) + lid.rgb * u_lid;
  }

  // sparkles on the diamonds
  vec4 sparkRect = u_diamondRect + vec4(-24.0, -24.0, 48.0, 48.0);
  if ((u_sweep >= 0.0 || u_glintCount > 0) && inRect(p, sparkRect)) {
    float dm = sampleRect(u_diamond, p, u_diamondRect).r;
    if (u_sweep >= 0.0 && dm > 0.0) {
      const vec2 dir = vec2(${f(Math.cos((L.pendant_sparkles.sweep.angle_deg * Math.PI) / 180))}, ${f(Math.sin((L.pendant_sparkles.sweep.angle_deg * Math.PI) / 180))});
      float span = dot(u_diamondRect.zw, abs(dir));
      float w = ${f(L.pendant_sparkles.sweep.width_px)};
      float centre = mix(-w, span + w, u_sweep);
      float u = dot(p - u_diamondRect.xy, dir);
      float band = exp(-pow((u - centre) / (0.5 * w), 2.0)) * sin(3.14159265 * u_sweep);
      float lum = dot(c, vec3(0.299, 0.587, 0.114));
      c += ${f(L.pendant_sparkles.sweep.strength)} * band * dm * (0.35 + 0.65 * lum);
    }
    for (int i = 0; i < ${MAX_GLINTS}; i++) {
      if (i >= u_glintCount) break;
      vec4 g = u_glints[i];
      vec2 d = p - g.xy;
      float r = 0.5 * g.z;
      if (dot(d, d) > r * r) continue;
      float cs = cos(u_glintsB[i].x), sn = sin(u_glintsB[i].x);
      d = vec2(cs * d.x - sn * d.y, sn * d.x + cs * d.y);
      vec2 a = abs(d);
      // long thin cross rays (visible over the darker gaps), short diagonals, soft core
      float rays = pow(max(0.0, 1.0 - a.x / r), 1.6) * exp(-a.y * 0.8)
                 + pow(max(0.0, 1.0 - a.y / r), 1.6) * exp(-a.x * 0.8);
      vec2 dd = vec2(d.x + d.y, d.x - d.y) * 0.70710678;
      vec2 ad = abs(dd);
      float r2 = 0.45 * r;
      rays += 0.45 * (pow(max(0.0, 1.0 - ad.x / r2), 2.0) * exp(-ad.y * 1.1)
                    + pow(max(0.0, 1.0 - ad.y / r2), 2.0) * exp(-ad.x * 1.1));
      float core = 1.2 * exp(-dot(d, d) / 10.0);
      vec3 tint = mix(vec3(1.0), hue(u_glintsB[i].y), 0.35);
      c += 1.4 * g.w * (rays + core) * tint;
    }
  }

  // intro: the print develops from black – highlights first, shadows last – with fading grain
  if (u_develop < 1.0) {
    float lum = dot(c, vec3(0.299, 0.587, 0.114));
    c *= smoothstep(0.0, 1.0, clamp(u_develop * 1.7 - (1.0 - lum) * 0.7, 0.0, 1.0));
    float grain = fract(sin(dot(gl_FragCoord.xy + u_develop * 517.0, vec2(12.9898, 78.233))) * 43758.5453);
    c = max(c + (grain - 0.5) * 0.09 * (1.0 - u_develop), 0.0);
  }

  outColor = vec4(min(c, 1.0), 1.0);
}`;
