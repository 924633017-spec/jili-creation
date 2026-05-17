/* ══════════════════════════════════════════════
   几里造物 JILI CREATION
   Three.js 空间背景
   ══════════════════════════════════════════════ */

import * as THREE from "three";

/* ═══ GLSL Noise ═══ */
const noiseGLSL = /* glsl */ `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
float snoise(vec3 v) {
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
    i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}
`;

/* ═══ Shaders ═══ */
const vertexShader = /* glsl */ `
varying vec2 vUv;
uniform float uTime;
${noiseGLSL}
void main() {
  vUv = uv;
  vec3 pos = position;
  pos.z += snoise(vec3(pos.xy * 0.6, uTime * 0.07)) * 0.35;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

const fragmentShader = /* glsl */ `
varying vec2 vUv;
uniform float uTime;
${noiseGLSL}
vec3 amber  = vec3(0.788, 0.627, 0.314);
vec3 blue   = vec3(0.357, 0.561, 0.871);
vec3 red    = vec3(0.761, 0.227, 0.180);
vec3 dark   = vec3(0.024, 0.024, 0.024);
void main() {
  vec2 uv = vUv;
  float n1 = snoise(vec3(uv * 2.2, uTime * 0.06));
  float n2 = snoise(vec3(uv * 3.5 + 1.5, uTime * 0.05));
  float n3 = snoise(vec3(uv * 4.0 + 3.0, uTime * 0.08));
  vec3 col = dark;
  col = mix(col, amber, smoothstep(0.25, 0.55, n1) * 0.09);
  col = mix(col, blue,  smoothstep(0.10, 0.45, n2) * 0.07);
  col = mix(col, red,   smoothstep(0.35, 0.60, n3) * 0.04);
  float v = 1.0 - smoothstep(0.4, 1.2, length(uv - 0.5) * 2.0) * 0.45;
  col = mix(dark, col, v);
  gl_FragColor = vec4(col, 1.0);
}
`;

function initThreeBackground() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const canvas = document.getElementById("bg-canvas");
  if (!canvas) return;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 60);
  camera.position.set(0, 0.2, 8);
  camera.lookAt(0, 0, -2);

  /* Gradient plane */
  const gradPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(16, 16, 80, 80),
    new THREE.ShaderMaterial({
      vertexShader, fragmentShader,
      uniforms: { uTime: { value: 0 } },
      transparent: true, depthTest: false, depthWrite: false,
    })
  );
  gradPlane.position.z = -6;
  scene.add(gradPlane);

  /* Particles — just 60, lightweight */
  const N = 60;
  const pos = new Float32Array(N * 3);
  const col = new Float32Array(N * 3);
  const pal = [new THREE.Color("#edeae6"), new THREE.Color("#c9a050"), new THREE.Color("#5b8fde")];
  for (let i = 0; i < N; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 16;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 10;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 12 - 2;
    const c = pal[Math.floor(Math.random() * pal.length)];
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  pGeo.setAttribute("color", new THREE.BufferAttribute(col, 3));

  const spr = document.createElement("canvas"); spr.width = 32; spr.height = 32;
  const ctx = spr.getContext("2d");
  const g = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.2, "rgba(255,255,255,0.6)");
  g.addColorStop(0.5, "rgba(255,255,255,0.1)"); g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g; ctx.fillRect(0, 0, 32, 32);

  const particles = new THREE.Points(pGeo, new THREE.PointsMaterial({
    size: 0.06, map: new THREE.CanvasTexture(spr),
    vertexColors: true, blending: THREE.AdditiveBlending,
    depthWrite: false, transparent: true, opacity: 0.4,
  }));
  scene.add(particles);

  /* Geometric shapes */
  const shapes = [];
  const wire = (h, o) => new THREE.MeshBasicMaterial({ color: new THREE.Color(h), transparent: true, opacity: o, wireframe: true, depthWrite: false });

  const sh = [
    { m: new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.02, 16, 100), wire("#c9a050", 0.1)),  p: [1.2, 0.3, -2],  r: [0.5, 0, 0],    a: [0.08,0.12,0.05] },
    { m: new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.012, 8, 80), wire("#5b8fde", 0.07)), p: [-1.5, -0.5, -3], r: [0, 0.8, 0],    a: [-0.06,0.04,0.1] },
    { m: new THREE.Mesh(new THREE.IcosahedronGeometry(0.55, 0), wire("#d4786e", 0.07)),      p: [-0.6, 0.7, -1.5], r: [0, 0, 0],      a: [0.15,0.18,0.08] },
    { m: new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.015, 8, 60), wire("#c23a2e", 0.1)),  p: [1.0, -0.5, -2.5], r: [1.0, 0, 0],    a: [0.04,-0.07,0.06] },
    { m: new THREE.Mesh(new THREE.TorusGeometry(3.2, 0.008, 4, 60), wire("#5b8fde", 0.03)), p: [0, 0, -5],        r: [0.6, 0, 0],    a: [0.02,-0.03,0.04] },
  ];
  sh.forEach((s) => {
    s.m.position.set(...s.p);
    s.m.rotation.set(...s.r);
    scene.add(s.m);
    shapes.push(s);
  });

  /* Mouse */
  let mx = 0, my = 0, tx = 0, ty = 0;
  document.addEventListener("mousemove", (e) => {
    tx = (e.clientX / window.innerWidth) * 2 - 1;
    ty = -(e.clientY / window.innerHeight) * 2 + 1;
  });

  /* Animate */
  const clock = new THREE.Clock();
  (function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.1);
    const t = performance.now() * 0.001;
    mx += (tx - mx) * 0.025;
    my += (ty - my) * 0.025;

    gradPlane.material.uniforms.uTime.value = t;
    camera.position.x += (mx * 0.35 - camera.position.x) * 0.02;
    camera.position.y += (0.2 - my * 0.25 - camera.position.y) * 0.02;
    camera.lookAt(0, 0, -2);

    shapes.forEach((s, i) => {
      s.m.rotation.x += s.a[0] * 0.007;
      s.m.rotation.y += s.a[1] * 0.007;
      s.m.rotation.z += s.a[2] * 0.007;
      s.m.position.x = s.p[0] + mx * (0.12 + i * 0.05);
      s.m.position.y = s.p[1] + my * (0.10 + i * 0.04);
    });

    const pa = particles.geometry.attributes.position.array;
    for (let i = 0; i < N; i++) {
      pa[i * 3 + 1] += dt * 0.06;
      if (pa[i * 3 + 1] > 5) pa[i * 3 + 1] = -5;
    }
    particles.geometry.attributes.position.needsUpdate = true;

    renderer.render(scene, camera);
  })();

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

/* ═══ Hero 3D Tilt ═══ */
function initHeroTilt() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (window.matchMedia("(max-width: 768px)").matches) return;
  const hero = document.querySelector(".hero");
  const chars = document.querySelectorAll(".hero-char");
  if (!hero || chars.length === 0) return;

  hero.addEventListener("pointermove", (e) => {
    const rect = hero.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    chars.forEach((char, i) => {
      const d = 15 + i * 22;
      char.style.transform = `translate(${x * (10 + i * 8)}px, ${y * (8 + i * 6)}px) translateZ(${20 + i * 30}px) rotateX(${y * d * 0.5}deg) rotateY(${x * d * 0.7}deg)`;
    });
  });

  const tz = [0, 40, 80, 50], ty = ["-0.03em", "0.05em", "-0.07em", "0.04em"];
  hero.addEventListener("pointerleave", () => {
    chars.forEach((char, i) => { char.style.transform = `translateY(${ty[i]}) translateZ(${tz[i]}px)`; });
  });
}

/* ═══ Reveal ═══ */
const observer = new IntersectionObserver(
  (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-visible"); observer.unobserve(e.target); } }),
  { threshold: 0.08, rootMargin: "0px 0px -2% 0px" }
);
document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
window.addEventListener("load", () => document.querySelectorAll(".hero .reveal").forEach((el) => el.classList.add("is-visible")));

/* ═══ Boot ═══ */
initThreeBackground();
initHeroTilt();
