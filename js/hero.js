/* Atlas Peak — Three.js hero: low-poly mountain ridge at dusk.
   Loaded as a module only on the landing page. Falls back to the
   CSS gradient + SVG peaks if WebGL is unavailable. */
import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

const canvas = document.getElementById('hero-canvas');
if (canvas) init(canvas);

function init(canvas) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch (e) {
    canvas.remove(); // CSS fallback sky stays visible
    return;
  }

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x0a0c11, 35, 210);

  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 400);
  camera.position.set(0, 9, 30);

  /* ----- Lights: dusk ----- */
  scene.add(new THREE.AmbientLight(0x2a2d45, 1.4));
  const sunLight = new THREE.DirectionalLight(0xff6b35, 2.2);
  sunLight.position.set(0, 30, -90);
  scene.add(sunLight);
  const coolFill = new THREE.DirectionalLight(0x4455aa, 0.5);
  coolFill.position.set(30, 40, 40);
  scene.add(coolFill);

  /* ----- Terrain: ridged value noise, valley down the middle ----- */
  const geo = new THREE.PlaneGeometry(260, 140, 150, 80);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const depth = THREE.MathUtils.clamp((-z + 30) / 130, 0, 1); // 0 near camera, 1 far
    const valley = Math.min(1, Math.pow(Math.abs(x) / 55, 1.4)); // dip near x=0
    const ridged = Math.pow(1 - Math.abs(2 * fbm(x * 0.018, z * 0.018) - 1), 2);
    const h = ridged * 32 * (0.12 + 0.88 * Math.pow(depth, 1.15)) * (0.3 + 0.7 * valley)
      + fbm(x * 0.05, z * 0.05) * 2 * depth;
    pos.setY(i, h - 5);
  }
  geo.computeVertexNormals();
  const terrain = new THREE.Mesh(
    geo,
    new THREE.MeshStandardMaterial({ color: 0x14121e, flatShading: true, roughness: 0.95 })
  );
  scene.add(terrain);

  /* ----- Sun: glowing sprite low in the valley gap ----- */
  const sun = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTexture(),
    color: 0xff7d45,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    transparent: true,
    fog: false,
  }));
  sun.scale.set(95, 95, 1);
  sun.position.set(0, 13, -105);
  scene.add(sun);

  /* ----- Stars ----- */
  const starGeo = new THREE.BufferGeometry();
  const starCount = 500;
  const starPos = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    const r = 180 + Math.random() * 60;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI * 0.45; // upper sky only
    starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    starPos[i * 3 + 1] = 20 + r * Math.cos(phi) * 0.5;
    starPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta) - 40;
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({
    color: 0xbcc4e0, size: 0.7, sizeAttenuation: true, transparent: true, opacity: 0.8,
  }));
  scene.add(stars);

  /* ----- Mouse parallax ----- */
  let tx = 0, ty = 0, cx = 0, cy = 0;
  window.addEventListener('mousemove', (e) => {
    tx = (e.clientX / window.innerWidth - 0.5) * 2;
    ty = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  function resize() {
    const w = canvas.clientWidth || canvas.parentElement.clientWidth;
    const h = canvas.clientHeight || canvas.parentElement.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  const clock = new THREE.Clock();
  function render() {
    const t = clock.getElapsedTime();
    cx += (tx - cx) * 0.04;
    cy += (ty - cy) * 0.04;
    camera.position.x = cx * 3;
    camera.position.y = 9 - cy * 1.2 + Math.sin(t * 0.4) * 0.25;
    camera.lookAt(0, 7, -70);
    stars.rotation.y = t * 0.005;
    sun.material.opacity = 0.85 + Math.sin(t * 0.8) * 0.1;
    renderer.render(scene, camera);
  }

  if (reduceMotion) {
    render(); // single static frame
  } else {
    renderer.setAnimationLoop(render);
    // Pause rendering when the hero is off-screen
    new IntersectionObserver((entries) => {
      renderer.setAnimationLoop(entries[0].isIntersecting ? render : null);
    }).observe(canvas);
  }
}

/* ----- 2D value noise + fbm ----- */
function hash(x, y) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}
function noise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  return hash(xi, yi) * (1 - u) * (1 - v)
    + hash(xi + 1, yi) * u * (1 - v)
    + hash(xi, yi + 1) * (1 - u) * v
    + hash(xi + 1, yi + 1) * u * v;
}
function fbm(x, y) {
  let total = 0, amp = 0.5, freq = 1;
  for (let i = 0; i < 4; i++) {
    total += noise(x * freq, y * freq) * amp;
    freq *= 2.1;
    amp *= 0.5;
  }
  return total;
}

function glowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, 'rgba(255, 200, 150, 1)');
  g.addColorStop(0.18, 'rgba(255, 130, 70, 0.9)');
  g.addColorStop(0.45, 'rgba(255, 100, 50, 0.28)');
  g.addColorStop(1, 'rgba(255, 90, 40, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}
