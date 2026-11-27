/*
 * The Hollow · Study 3 · Ink, as a fragment shader (raw WebGL2, no library).
 * Every drop is four numbers (where, when, how much). The shader grows each drop, merges drops that touch into one
 * stain, frays the edge with fractal noise like paper fibres, and as it dries a darker tide-line gathers at the rim.
 * Up to 24 drops; the oldest is overwritten. Rendering stops once the newest drop has dried.
 */
const MAX = 24;

export const FRAG = `#version 300 es
precision highp float;
uniform vec2 uRes;            // canvas size in px
uniform float uTime;          // seconds
uniform int uCount;
uniform vec4 uDrops[${MAX}];  // x, y (0–1, y up), birth time, size
out vec4 outColor;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = .5;
  for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.03 + 17.1; a *= .5; }
  return v;
}

void main() {
  float asp = uRes.x / uRes.y;
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 p = vec2(uv.x * asp, uv.y);

  // the paper: shared by every drop, so it is computed once per pixel
  vec2 warp = vec2(fbm(p * 4.0), fbm(p * 4.0 + 5.2)) - .5;   // where wet paper lets ink run
  float fray = fbm(p * 15.0 + warp * 2.0);                     // fibre-scale roughness of the edge
  float grain = noise(p * vec2(220.0, 60.0));                  // laid lines of the sheet

  // drops that touch run together: their edges are merged with a smooth minimum, so a wet stroke is one stain
  float em = 9.0, dm = 0.0;
  const float K = .35;
  for (int i = 0; i < ${MAX}; i++) {
    if (i >= uCount) break;
    vec4 d = uDrops[i];
    float age = uTime - d.z;
    if (age < 0.0) continue;
    vec2 c = vec2(d.x * asp, d.y);
    float r = d.w * (1.0 - exp(-age * 1.1)) * (1.0 + .08 * log(1.0 + age)); // fast bloom, slow creep
    vec2 q = p - c + warp * d.w * .9;
    float dist = length(q);
    if (dist > r * 2.2 + .03) continue;
    float e = dist / max(r, 1e-4);
    float h = clamp(.5 + .5 * (em - e) / K, 0.0, 1.0);
    em = mix(em, e, h) - K * h * (1.0 - h);
    dm = mix(dm, smoothstep(.5, 3.5, age), h);
  }
  em += (fray - .5) * .7 + (noise(p * 160.0) - .5) * .08;       // the frayed edge, down to fibre scale
  float body = smoothstep(1.0, .9, em);
  float pool = .5 + .5 * fbm(p * 11.0 + warp * 3.0);            // pigment settling unevenly
  float thin = mix(1.0, .55, dm * smoothstep(.85, .2, em));     // as it dries, the middle pales
  float ink = body * pool * thin;
  float tide = (1.0 - smoothstep(0.0, .07, abs(em - .93))) * dm * 1.2; // and the rim darkens

  vec3 paper = vec3(.847, .824, .776) - grain * .035 - (fbm(p * 2.0) - .5) * .06;   // bone
  vec3 wet = vec3(.21, .17, .27);         // blue-black ink, thinned
  vec3 deep = vec3(.09, .07, .13);        // where it pools
  vec3 rim = vec3(.30, .08, .11);         // the tide-line dries dark rust
  vec3 col = mix(paper, mix(wet, deep, smoothstep(.45, 1.0, ink)), smoothstep(.02, .6, ink));
  col = mix(col, rim, clamp(tide, 0.0, 1.0) * .85);
  float vig = smoothstep(1.15, .35, length((uv - .5) * vec2(asp, 1.0) * 1.1));   // the sheet sits in the dark
  col = mix(vec3(.035, .039, .07), col, vig);
  outColor = vec4(col, 1.0);
}`;

const VERT = `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`;

export function init(stage, { reduce }) {
  const cvs = stage.querySelector('canvas');
  const gl = cvs.getContext('webgl2', { antialias: false, premultipliedAlpha: false });
  if (!gl) return null;
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, 'aPos');
  gl.enableVertexAttribArray(aPos); gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
  const U = (n) => gl.getUniformLocation(prog, n);
  const uRes = U('uRes'), uTime = U('uTime'), uCount = U('uCount'), uDrops = U('uDrops');

  const drops = new Float32Array(MAX * 4);
  let count = 0, next = 0, last = -99, raf = 0, visible = false;
  const start = performance.now();
  const now = () => (performance.now() - start) / 1000;

  const resize = () => {
    const r = cvs.getBoundingClientRect(), k = Math.min(devicePixelRatio || 1, 1.5);
    cvs.width = Math.max(1, Math.round(r.width * k)); cvs.height = Math.max(1, Math.round(r.height * k));
    gl.viewport(0, 0, cvs.width, cvs.height); draw();
  };
  const frame = () => {
    raf = 0;
    const t = now();
    gl.uniform2f(uRes, cvs.width, cvs.height); gl.uniform1f(uTime, t);
    gl.uniform1i(uCount, count); gl.uniform4fv(uDrops, drops);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (!reduce && visible && !document.hidden && t - last < 7) raf = requestAnimationFrame(frame);
  };
  const draw = () => { if (!raf) raf = requestAnimationFrame(frame); };

  const drop = (x, y, size) => {
    const t = reduce ? now() - 30 : now();           // reduced motion: the drop appears already spread and dry
    drops.set([x, y, t, size], next * 4);
    next = (next + 1) % MAX; count = Math.min(MAX, count + 1); last = now();
    draw();
  };
  const clear = () => { drops.fill(0); count = 0; next = 0; draw(); };

  // pointer: press for one drop, drag to trail smaller ones (slower strokes leave more ink)
  let down = false, lx = 0, ly = 0, lt = 0;
  const pos = (e) => { const r = cvs.getBoundingClientRect(); return [(e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height]; };
  cvs.addEventListener('pointerdown', (e) => {
    down = true; cvs.setPointerCapture?.(e.pointerId);
    const [x, y] = pos(e); lx = x; ly = y; lt = performance.now();
    drop(x, y, .1 + Math.random() * .05);
  });
  cvs.addEventListener('pointermove', (e) => {
    if (!down) return;
    const [x, y] = pos(e), dt = performance.now() - lt, dist = Math.hypot(x - lx, y - ly);
    if (dist < .035 && dt < 120) return;
    const speed = dist / Math.max(dt, 1) * 1000;
    drop(x, y, Math.max(.03, .085 - speed * .025));
    lx = x; ly = y; lt = performance.now();
  });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach((ev) => cvs.addEventListener(ev, () => { down = false; }));

  // keyboard: Enter or Space drops ink near the middle of the sheet
  stage.addEventListener('keydown', (e) => {
    if (e.target !== stage) return;
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); drop(.3 + Math.random() * .4, .3 + Math.random() * .4, .08 + Math.random() * .06); }
  });
  stage.closest('.hst')?.querySelector('[data-ink-clear]')?.addEventListener('click', clear);

  // the first time the sheet comes into view, three drops fall so it is never blank
  let seeded = false;
  new IntersectionObserver((es) => {
    visible = es[0].isIntersecting;
    if (!visible) return;
    if (!seeded) {
      seeded = true;
      [[.34, .58, .14, 0], [.62, .4, .1, 500], [.5, .72, .06, 1100]].forEach(([x, y, s, ms]) => setTimeout(() => drop(x, y, s), reduce ? 0 : ms));
    }
    draw();
  }, { threshold: .35 }).observe(cvs);
  document.addEventListener('visibilitychange', draw);
  new ResizeObserver(resize).observe(cvs);
  resize();
  return { clear };
}
