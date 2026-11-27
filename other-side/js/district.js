/*
 * Neon District · the building, in Three.js.
 * Pixel Pull's four homepage sections as floors of one building, seen in an orthographic, plan-like view.
 * Each floor is a GLSL material: at rest it reads as a blueprint of its screen (luminance mapped to the district's
 * blues, a fine grid, a hairline edge); the active floor lifts, shows the real screen, takes the lime edge and a
 * cyan scan line. The floors are laid out so each one lines up with its tag on the right.
 *
 * Talks to app.js through events on the building element:
 *   listens: data-on changes (which floor is lit; app.js sets it on hover, focus, tap, scroll or tab change)
 *   sends:   'floor' CustomEvent { type: 'hover' | 'leave' | 'open', s }
 * Loaded only when Neon District opens and WebGL2 is available; otherwise the CSS floors stay.
 */
import * as THREE from '/other-side/vendor/three.module.min.js';
import { load as loadTheatre } from '/other-side/js/district.theatre.js';

const FLOORS = [
  { s: 'hero', src: '/other-side/assets/pixel-s-hero.webp', h: 917 },
  { s: 'cats', src: '/other-side/assets/pixel-s-cats.webp', h: 908 },
  { s: 'prod', src: '/other-side/assets/pixel-s-prod.webp', h: 1042 },
  { s: 'camp', src: '/other-side/assets/pixel-s-camp.webp', h: 833 },
];

const VERT = /* glsl */`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const FRAG = /* glsl */`
uniform sampler2D uMap;
uniform float uOn;      // 0 at rest, 1 when this floor is lit
uniform float uTime;
uniform float uAsp;     // depth / width of the floor
uniform float uIn;      // entrance, 0 → 1
uniform float uAbove;   // 1 when a lower floor is lit: this one thins so you can see down to it
uniform vec3 uNight, uBlue, uCyan, uLime;
varying vec2 vUv;

void main() {
  vec4 tex = texture2D(uMap, vUv);
  float lum = dot(tex.rgb, vec3(.299, .587, .114));

  // at rest: the screen as a plan, its light parts drawn in the district's blue, over a fine grid
  vec2 gu = vUv * vec2(12.0, 12.0 * uAsp);
  vec2 gl = abs(fract(gu - .5) - .5) / fwidth(gu);
  float grid = 1.0 - min(min(gl.x, gl.y), 1.0);
  vec3 plan = mix(uNight, uBlue * .62, smoothstep(.18, .95, lum) * .55) + grid * uBlue * .16;

  vec3 col = mix(plan, tex.rgb, uOn);

  // the lit floor is read by a scan line travelling from the front edge to the back
  float y = fract(uTime * .2);
  float scan = (1.0 - smoothstep(0.0, .006, abs(vUv.y - y))) * uOn;
  col = mix(col, uCyan, scan * .7);

  // hairline edge in screen pixels, thicker and lime when lit
  vec2 e = min(vUv, 1.0 - vUv) / fwidth(vUv);
  float w = mix(1.0, 2.0, uOn);
  float edge = 1.0 - smoothstep(w - .5, w + .5, min(e.x, e.y));
  col = mix(col, mix(uBlue, uLime, uOn), edge);

  float a = mix(.58, 1.0, uOn);
  a = max(a, edge * mix(1.0, .5, uAbove)) * mix(1.0, .22, uAbove) * uIn;
  gl_FragColor = vec4(col, a);
}`;

export function init({ bldg, reduce, hover }) {
  const holder = document.createElement('div');
  holder.className = 'px-gl';
  holder.setAttribute('aria-hidden', 'true');
  bldg.querySelector('.px').after(holder);

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  } catch (e) { holder.remove(); return null; }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  holder.append(renderer.domElement);

  const scene = new THREE.Scene();
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, .1, 100);
  // a high, rotated plan view: the floors read as parallelograms, like the CSS version
  cam.position.set(-6, 9.2, 8.6);
  cam.lookAt(0, 0, 0);
  cam.updateMatrixWorld();

  const group = new THREE.Group();
  group.rotation.y = -.18;
  scene.add(group);

  const col = (h) => new THREE.Color(h);
  const loader = new THREE.TextureLoader();
  let loaded = 0;
  const floors = FLOORS.map((f, k) => {
    const asp = f.h / 1200;
    const tex = loader.load(f.src, () => { loaded++; draw(); });
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    const mat = new THREE.ShaderMaterial({
      vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide,
      uniforms: {
        uMap: { value: tex }, uOn: { value: 0 }, uTime: { value: 0 }, uAsp: { value: asp }, uIn: { value: reduce ? 1 : 0 }, uAbove: { value: 0 },
        uNight: { value: col('#0B1026') }, uBlue: { value: col('#2859FF') }, uCyan: { value: col('#12C9D9') }, uLime: { value: col('#B6F34A') },
      },
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, asp), mat);
    mesh.rotation.x = -Math.PI / 2;           // lie flat; the screen's top edge faces the back
    mesh.renderOrder = FLOORS.length - k;      // lower floors draw first
    mesh.userData = { s: f.s, k, asp, on: 0, target: 0, base: 0, above: 0, aboveT: 0 };
    group.add(mesh);
    return mesh;
  });

  // two lift shafts at the back corners join the floors into one building
  const shaftMat = new THREE.LineBasicMaterial({ color: 0x2859FF, transparent: true, opacity: .45 });
  const shaftGeo = new THREE.BufferGeometry();
  const shafts = new THREE.LineSegments(shaftGeo, shaftMat);
  group.add(shafts);

  // ---------- layout: fit the width, then space the floors so each sits beside its tag ----------
  let W = 1, H = 1, spacing = .3;
  const v = new THREE.Vector3();
  const camSpace = (p) => v.copy(p).applyMatrix4(cam.matrixWorldInverse);
  function layout() {
    const r = holder.getBoundingClientRect();
    W = Math.max(1, r.width); H = Math.max(1, r.height);
    renderer.setSize(W, H, false);

    // camera-space extent of one floor at height 0 (the deepest floor decides the width)
    group.updateMatrixWorld(true);
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    floors.forEach((m) => {
      const a = m.userData.asp;
      [[-.5, -a / 2], [.5, -a / 2], [-.5, a / 2], [.5, a / 2]].forEach(([x, z]) => {
        const p = camSpace(new THREE.Vector3(x, 0, z).applyEuler(group.rotation));
        minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x); minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
      });
    });
    const up = camSpace(new THREE.Vector3(0, 1, 0)).y - camSpace(new THREE.Vector3(0, 0, 0)).y; // screen rise per unit of height
    const cy = (minY + maxY) / 2, above = maxY - cy, below = cy - minY;
    // Fill the box: fit the width, then spread the floors down the height (the lit floor lifts by a third of a
    // step). If the box is too short for the tags, shrink the building until every tag has room.
    const tags = [...bldg.querySelectorAll('.nbldg__tags li')];
    const tagH = tags[0] ? tags[0].offsetHeight : 48, pad = 12, minStep = tagH + 10, maxStep = H * .26;
    let s = (maxX - minX) / (W * (W > 560 ? .8 : .9));
    let step = (H - 2 * pad - (above + below) / s) / 3.32;
    if (step < minStep) { step = minStep; s = (above + below) / Math.max(40, H - 2 * pad - 3.32 * step); }
    step = Math.min(step, maxStep);
    const used = (above + below) / s + 3.32 * step, off = (H - used) / 2;
    const centre = (k) => off + above / s + .32 * step + k * step;     // floor k's centre, px from the top
    spacing = (step * s) / up;
    const cx = (minX + maxX) / 2, top = cy + centre(0) * s;
    cam.left = cx - (W / 2) * s; cam.right = cx + (W / 2) * s;
    cam.top = top; cam.bottom = top - H * s;
    cam.updateProjectionMatrix();
    // each tag moves level with its floor
    tags.forEach((li, k) => { li.style.top = `${Math.round(centre(k) - tagH / 2)}px`; });
    floors.forEach((m) => { m.userData.base = -m.userData.k * spacing; });
    // shafts from the top floor to the bottom one, at the two back corners
    const d = Math.min(...floors.map((m) => m.userData.asp)) / 2;
    const y0 = 0, y1 = -(floors.length - 1) * spacing;
    shaftGeo.setAttribute('position', new THREE.Float32BufferAttribute([-.5, y0, -d, -.5, y1, -d, .5, y0, -d, .5, y1, -d], 3));
    draw();
  }

  // ---------- state ----------
  const lift = () => spacing * .32;
  const setOn = (s) => {
    const k = FLOORS.findIndex((f) => f.s === s);
    floors.forEach((m) => { m.userData.target = m.userData.s === s ? 1 : 0; m.userData.aboveT = m.userData.k < k ? 1 : 0; });
  };
  setOn(bldg.dataset.on || 'hero');
  new MutationObserver(() => { setOn(bldg.dataset.on); wake(); }).observe(bldg, { attributes: true, attributeFilter: ['data-on'] });

  // ---------- picking ----------
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  let hot = null;
  const pickAt = (cx, cy) => {
    const r = renderer.domElement.getBoundingClientRect();
    ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, cam);
    const hit = ray.intersectObjects(floors, false)[0];
    return hit ? hit.object.userData.s : null;
  };
  const send = (type, s) => bldg.dispatchEvent(new CustomEvent('floor', { detail: { type, s } }));
  const cvs = renderer.domElement;
  let px = 0, py = 0;
  cvs.addEventListener('pointermove', (e) => {
    const r = cvs.getBoundingClientRect();
    px = ((e.clientX - r.left) / r.width) * 2 - 1; py = ((e.clientY - r.top) / r.height) * 2 - 1;
    if (e.pointerType !== 'mouse' || !hover.matches) return;
    const s = pickAt(e.clientX, e.clientY);
    cvs.style.cursor = s ? 'pointer' : '';
    if (s !== hot) { hot = s; if (s) send('hover', s); }
    wake();
  });
  cvs.addEventListener('pointerleave', () => { hot = null; px = py = 0; cvs.style.cursor = ''; wake(); });
  cvs.addEventListener('click', (e) => { const s = pickAt(e.clientX, e.clientY); if (s) send('open', s); });

  // ---------- render loop: runs only while on screen and something is moving ----------
  const clock = new THREE.Clock();
  let raf = 0, visible = false, t0 = performance.now(), entered = reduce, tilt = 0, tiltX = 0;
  // Theatre.js: the entrance sequence. Loaded alongside; if it fails, the code curve above runs instead.
  let th = null, thPlaying = false;
  const playEntrance = () => {
    if (!th || reduce) return;
    th.seq.position = 0; thPlaying = true;
    th.seq.play().then(() => { thPlaying = false; wake(); });
    wake();
  };
  if (!reduce) loadTheatre().then((t) => { th = t; if (!entered) { t0 = performance.now(); playEntrance(); } }).catch(() => {});
  function frame() {
    raf = 0;
    const dt = Math.min(clock.getDelta(), .05), t = clock.elapsedTime;
    let moving = false;
    const since = (performance.now() - t0) / 1000;
    floors.forEach((m) => {
      const u = m.userData, U = m.material.uniforms;
      const ease = reduce ? 1 : 1 - Math.exp(-dt * 9);
      u.on += (u.target - u.on) * ease; u.above += (u.aboveT - u.above) * ease;
      if (Math.abs(u.target - u.on) > .002 || Math.abs(u.aboveT - u.above) > .002) moving = true;
      // entrance: floors settle from above, bottom floor first. Timed by the Theatre.js sequence
      // (district.theatre.js) once it has loaded; the same curve in code until then.
      let drop = 0;
      if (!entered) {
        let e;
        if (th) e = th.obj.value['f' + u.k];
        else { const p = Math.min(1, Math.max(0, (since - (3 - u.k) * .09) / .7)); e = 1 - Math.pow(1 - p, 3); }
        drop = (1 - e) * spacing * 2.2; U.uIn.value = e; if (e < 1) moving = true;
      }
      m.position.y = u.base + u.on * lift() + drop;
      U.uOn.value = u.on; U.uAbove.value = u.above; U.uTime.value = t;
    });
    if (th && thPlaying) moving = true;
    if (!entered && !moving) entered = true;
    const swing = !entered && th ? th.obj.value.swing : 0;
    if (!reduce) {
      tilt += (px * .07 - tilt) * (1 - Math.exp(-dt * 4)); tiltX += (py * .04 - tiltX) * (1 - Math.exp(-dt * 4));
      group.rotation.y = -.18 + tilt + swing; group.rotation.x = tiltX;
      if (Math.abs(px * .07 - tilt) > .0005 || Math.abs(py * .04 - tiltX) > .0005) moving = true;
      if (floors.some((m) => m.userData.on > .01)) moving = true; // the scan line keeps the lit floor alive
    }
    renderer.render(scene, cam);
    if (moving && visible && !document.hidden) raf = requestAnimationFrame(frame);
  }
  function wake() { if (!raf && visible) { clock.getDelta(); raf = requestAnimationFrame(frame); } }
  function draw() { if (visible) wake(); }

  new IntersectionObserver((es) => { visible = es[0].isIntersecting; if (visible) wake(); }).observe(holder);
  document.addEventListener('visibilitychange', wake);
  new ResizeObserver(layout).observe(holder);
  layout();
  bldg.classList.add('is-gl');
  return {
    replay() { if (reduce) return; entered = false; t0 = performance.now(); floors.forEach((m) => { m.material.uniforms.uIn.value = 0; }); playEntrance(); wake(); },
  };
}
