/* ══════════════════════════════════════════════
   几里造物 JILI CREATION
   Three.js 空间场景 · 粒子 · 着色器渐变
   ══════════════════════════════════════════════ */

import * as THREE from "three";

/* ═══ Mobile nav toggle ═══ */
const navToggle = document.querySelector("#nav-toggle");
const siteNav = document.querySelector("#site-nav");

if (navToggle && siteNav) {
  const navParent = siteNav.parentElement;
  navToggle.addEventListener("click", () => {
    const isOpen = siteNav.classList.toggle("is-open");
    navToggle.classList.toggle("is-active", isOpen);
    navToggle.setAttribute("aria-expanded", isOpen);
    if (isOpen) document.body.appendChild(siteNav);
    else navParent.insertBefore(siteNav, navToggle);
  });
  siteNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      siteNav.classList.remove("is-open");
      navToggle.classList.remove("is-active");
      navToggle.setAttribute("aria-expanded", "false");
      navParent.insertBefore(siteNav, navToggle);
    });
  });
}

/* ═══ Three.js — 空间场景 ═══ */
/* ── GLSL 3D Simplex Noise ── */
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

/* ── Gradient shader plane ── */
const gradientVertexShader = /* glsl */ `
varying vec2 vUv;
varying vec3 vPos;
uniform float uTime;
${noiseGLSL}
void main() {
  vUv = uv;
  vec3 pos = position;
  float n = snoise(vec3(pos.xy * 0.6, uTime * 0.07));
  pos.z += n * 0.4;
  vPos = pos;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

const gradientFragmentShader = /* glsl */ `
varying vec2 vUv;
varying vec3 vPos;
uniform float uTime;
uniform vec2 uMouse;
${noiseGLSL}

vec3 amber   = vec3(0.788, 0.627, 0.314);
vec3 electric = vec3(0.357, 0.561, 0.871);
vec3 red     = vec3(0.761, 0.227, 0.180);
vec3 cyan    = vec3(0.369, 0.769, 0.788);
vec3 dark    = vec3(0.024, 0.024, 0.024);

void main() {
  vec2 uv = vUv;
  float n1 = snoise(vec3(uv * 2.2, uTime * 0.06));
  float n2 = snoise(vec3(uv * 3.5 + 1.5, uTime * 0.05));
  float n3 = snoise(vec3(uv * 4.0 + 3.0, uTime * 0.08));
  float n4 = snoise(vec3(uv * 2.8 + 0.5, uTime * 0.04));

  vec3 col = dark;

  /* Warm amber pools */
  float amberMask = smoothstep(0.25, 0.55, n1);
  col = mix(col, amber, amberMask * 0.10);

  /* Cool electric-blue veils */
  float blueMask = smoothstep(0.10, 0.45, n2);
  col = mix(col, electric, blueMask * 0.08);

  /* Subtle red warmth */
  float redMask = smoothstep(0.35, 0.60, n3);
  col = mix(col, red, redMask * 0.05);

  /* Cyan highlights */
  float cyanMask = smoothstep(0.40, 0.58, n4);
  col = mix(col, cyan, cyanMask * 0.04);

  /* Edge darkening */
  float vignette = 1.0 - smoothstep(0.3, 1.2, length(uv - 0.5) * 2.0) * 0.5;
  col = mix(dark, col, vignette);

  gl_FragColor = vec4(col, 1.0);
}
`;

/* ── Grid shader ── */
const gridFragmentShader = /* glsl */ `
varying vec2 vUv;
varying vec3 vWorldPos;
uniform float uTime;

void main() {
  vec2 grid = abs(fract(vWorldPos.xz * 1.0) - 0.5);
  float line = min(grid.x, grid.y);
  float dist = length(vWorldPos.xz) * 0.15;
  float alpha = (1.0 - smoothstep(4.0, 10.0, dist)) * (1.0 - line * 20.0) * 0.04;
  gl_FragColor = vec4(vec3(0.788, 0.627, 0.314), alpha);
}
`;

const gridVertexShader = /* glsl */ `
varying vec2 vUv;
varying vec3 vWorldPos;
void main() {
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPos = worldPos.xyz;
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

function initThreeBackground() {
  if (typeof THREE === "undefined") return;
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

  /* ═══ Layer 1: Shader gradient plane ═══ */
  const gradGeo = new THREE.PlaneGeometry(16, 16, 100, 100);
  const gradMat = new THREE.ShaderMaterial({
    vertexShader: gradientVertexShader,
    fragmentShader: gradientFragmentShader,
    uniforms: {
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
    },
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });
  const gradPlane = new THREE.Mesh(gradGeo, gradMat);
  gradPlane.position.z = -6;
  gradPlane.renderOrder = 0;
  scene.add(gradPlane);

  /* ═══ Layer 2: Architectural grid plane ═══ */
  const gridGeo = new THREE.PlaneGeometry(30, 30, 1, 1);
  gridGeo.rotateX(-Math.PI / 2);
  const gridMat = new THREE.ShaderMaterial({
    vertexShader: gridVertexShader,
    fragmentShader: gridFragmentShader,
    uniforms: { uTime: { value: 0 } },
    transparent: true,
    depthTest: true,
    depthWrite: false,
  });
  const gridPlane = new THREE.Mesh(gridGeo, gridMat);
  gridPlane.position.y = -4.5;
  gridPlane.renderOrder = 1;
  scene.add(gridPlane);

  /* ═══ Layer 3: Particle field ═══ */
  const particleCount = 600;
  const particleGeo = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);
  const sizes = new Float32Array(particleCount);
  const seeds = new Float32Array(particleCount); /* per-particle random seed */

  const amber = new THREE.Color("#c9a050");
  const electric = new THREE.Color("#5b8fde");
  const warmWhite = new THREE.Color("#edeae6");
  const coral = new THREE.Color("#d4786e");

  for (let i = 0; i < particleCount; i++) {
    /* Position in a large box */
    positions[i * 3] = (Math.random() - 0.5) * 16;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 12 - 2;

    /* Color: randomly pick from palette */
    const r = Math.random();
    let color;
    if (r < 0.35) color = warmWhite;
    else if (r < 0.6) color = amber;
    else if (r < 0.8) color = electric;
    else color = coral;

    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;

    sizes[i] = Math.random() * 2.5 + 0.5;
    seeds[i] = Math.random() * Math.PI * 2;
  }

  particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  particleGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  particleGeo.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

  /* Soft circular sprite */
  const spriteCanvas = document.createElement("canvas");
  spriteCanvas.width = 32;
  spriteCanvas.height = 32;
  const ctx = spriteCanvas.getContext("2d");
  const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.15, "rgba(255,255,255,0.7)");
  gradient.addColorStop(0.4, "rgba(255,255,255,0.15)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 32, 32);
  const spriteTexture = new THREE.CanvasTexture(spriteCanvas);

  const particleMat = new THREE.PointsMaterial({
    size: 0.06,
    map: spriteTexture,
    vertexColors: true,
    blending: THREE.AdditiveBlending,
    depthTest: true,
    depthWrite: false,
    transparent: true,
    opacity: 0.5,
  });

  const particles = new THREE.Points(particleGeo, particleMat);
  particles.renderOrder = 2;
  scene.add(particles);

  /* ═══ Layer 4: Geometric wireframe shapes ═══ */
  const shapes = [];

  function wireMat(hex, opacity) {
    return new THREE.MeshBasicMaterial({
      color: new THREE.Color(hex),
      transparent: true,
      opacity,
      wireframe: true,
      depthTest: true,
      depthWrite: false,
    });
  }

  /* Large warm-gold torus */
  const t1 = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.02, 16, 100), wireMat("#c9a050", 0.1));
  t1.position.set(1.2, 0.3, -2);
  t1.rotation.x = 0.5;
  scene.add(t1);
  shapes.push({ mesh: t1, rx: 0.08, ry: 0.12, rz: 0.05, ox: 1.2, oy: 0.3, oz: -2 });

  /* Electric-blue ring */
  const t2 = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.012, 8, 80), wireMat("#5b8fde", 0.07));
  t2.position.set(-1.5, -0.5, -3);
  t2.rotation.y = 0.8;
  scene.add(t2);
  shapes.push({ mesh: t2, rx: -0.06, ry: 0.04, rz: 0.1, ox: -1.5, oy: -0.5, oz: -3 });

  /* Coral icosahedron */
  const ico = new THREE.Mesh(new THREE.IcosahedronGeometry(0.6, 0), wireMat("#d4786e", 0.08));
  ico.position.set(-0.6, 0.7, -1.5);
  scene.add(ico);
  shapes.push({ mesh: ico, rx: 0.15, ry: 0.18, rz: 0.08, ox: -0.6, oy: 0.7, oz: -1.5 });

  /* Red accent torus */
  const t3 = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.015, 8, 60), wireMat("#c23a2e", 0.11));
  t3.position.set(1.0, -0.5, -2.5);
  t3.rotation.x = 1.0;
  scene.add(t3);
  shapes.push({ mesh: t3, rx: 0.04, ry: -0.07, rz: 0.06, ox: 1.0, oy: -0.5, oz: -2.5 });

  /* Small amber cube */
  const cube = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.28, 0.28), wireMat("#c9a050", 0.12));
  cube.position.set(1.5, 0.8, -1.8);
  scene.add(cube);
  shapes.push({ mesh: cube, rx: 0.1, ry: 0.14, rz: 0.2, ox: 1.5, oy: 0.8, oz: -1.8 });

  /* Distant electric ring */
  const t4 = new THREE.Mesh(new THREE.TorusGeometry(3.2, 0.008, 4, 60), wireMat("#5b8fde", 0.04));
  t4.position.set(0, 0, -5);
  t4.rotation.x = 0.6;
  scene.add(t4);
  shapes.push({ mesh: t4, rx: 0.02, ry: -0.03, rz: 0.04, ox: 0, oy: 0, oz: -5 });

  /* Soft-white subtle sphere */
  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.4, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0xedeae6, transparent: true, opacity: 0.03, depthTest: true, depthWrite: false })
  );
  sphere.position.set(-1.2, 0.4, -3);
  scene.add(sphere);
  shapes.push({ mesh: sphere, rx: 0.05, ry: 0.06, rz: 0.03, ox: -1.2, oy: 0.4, oz: -3 });

  /* ═══ Mouse tracking ═══ */
  let mouseX = 0, mouseY = 0, targetX = 0, targetY = 0;

  document.addEventListener("mousemove", (e) => {
    targetX = (e.clientX / window.innerWidth) * 2 - 1;
    targetY = -(e.clientY / window.innerHeight) * 2 + 1;
  });

  /* ═══ Scroll tracking ═══ */
  let scrollOffset = 0;
  window.addEventListener("scroll", () => {
    scrollOffset = window.scrollY / (document.body.scrollHeight - window.innerHeight);
  }, { passive: true });

  /* ═══ Animation loop ═══ */
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);

    const dt = Math.min(clock.getDelta(), 0.1);
    const elapsed = performance.now() * 0.001;

    mouseX += (targetX - mouseX) * 0.025;
    mouseY += (targetY - mouseY) * 0.025;

    /* Update gradient shader */
    gradMat.uniforms.uTime.value = elapsed;
    gradMat.uniforms.uMouse.value.set(mouseX * 0.5 + 0.5, mouseY * 0.5 + 0.5);

    /* Update grid shader */
    gridMat.uniforms.uTime.value = elapsed;

    /* Gentle camera sway */
    camera.position.x += (mouseX * 0.4 - camera.position.x) * 0.02;
    camera.position.y += (0.2 - mouseY * 0.3 - camera.position.y) * 0.02;
    camera.lookAt(0, 0, -2);

    /* Animate geometric shapes */
    shapes.forEach((s, i) => {
      s.mesh.rotation.x += s.rx * 0.007;
      s.mesh.rotation.y += s.ry * 0.007;
      s.mesh.rotation.z += s.rz * 0.007;
      s.mesh.position.x = s.ox + mouseX * (0.12 + i * 0.05);
      s.mesh.position.y = s.oy + mouseY * (0.10 + i * 0.04);
    });

    /* Animate particles */
    const posArr = particles.geometry.attributes.position.array;
    for (let i = 0; i < particleCount; i++) {
      /* Slow upward drift with sinusoidal wobble */
      posArr[i * 3 + 1] += dt * (0.08 + Math.sin(elapsed * 0.5 + i) * 0.04);
      posArr[i * 3] += Math.sin(elapsed * 0.3 + i * 0.7) * dt * 0.05;
      posArr[i * 3 + 2] += Math.cos(elapsed * 0.4 + i * 0.5) * dt * 0.03;

      /* Wrap particles that drift too far up */
      if (posArr[i * 3 + 1] > 5) posArr[i * 3 + 1] = -5;
      if (posArr[i * 3 + 1] < -5) posArr[i * 3 + 1] = 5;
      if (posArr[i * 3] > 8) posArr[i * 3] = -8;
      if (posArr[i * 3] < -8) posArr[i * 3] = 8;
    }
    particles.geometry.attributes.position.needsUpdate = true;

    /* Subtle particle field mouse response */
    particles.rotation.y += (mouseX * 0.02 - particles.rotation.y) * 0.01;
    particles.rotation.x += (-mouseY * 0.015 - particles.rotation.x) * 0.01;

    renderer.render(scene, camera);
  }
  animate();

  /* Resize */
  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    gradMat.uniforms.uResolution = new THREE.Vector2(window.innerWidth, window.innerHeight);
  });
}

/* ═══ Custom Cursor ═══ */
function initCursor() {
  if (window.matchMedia("(pointer: coarse)").matches) return;
  if (window.matchMedia("(max-width: 1024px)").matches) return;

  const cursor = document.getElementById("cursor");
  if (!cursor) return;

  let cx = window.innerWidth / 2, cy = window.innerHeight / 2;
  let tx = cx, ty = cy;
  let isHover = false;

  document.addEventListener("mousemove", (e) => { tx = e.clientX; ty = e.clientY; });

  const hoverTargets = document.querySelectorAll(
    "a, button, .btn, [data-magnetic], .service-card, .method-card, .contact-item, .brand, .nav-toggle"
  );

  hoverTargets.forEach((el) => {
    el.addEventListener("pointerenter", () => { isHover = true; cursor.classList.add("is-hover"); });
    el.addEventListener("pointerleave", () => { isHover = false; cursor.classList.remove("is-hover"); });
  });

  document.addEventListener("pointerdown", () => cursor.classList.add("is-click"));
  document.addEventListener("pointerup", () => cursor.classList.remove("is-click"));

  function animateCursor() {
    cx += (tx - cx) * 0.16;
    cy += (ty - cy) * 0.16;
    cursor.style.left = cx + "px";
    cursor.style.top = cy + "px";
    requestAnimationFrame(animateCursor);
  }
  animateCursor();
}

/* ═══ Magnetic Hover ═══ */
function initMagnetic() {
  if (window.matchMedia("(pointer: coarse)").matches) return;

  document.querySelectorAll("[data-magnetic]").forEach((el) => {
    el.addEventListener("pointermove", (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      el.style.transform = `translate(${x * 0.28}px, ${y * 0.28}px)`;
    });
    el.addEventListener("pointerleave", () => { el.style.transform = ""; });
  });
}

/* ═══ Hero 3D Tilt ═══ */
function initHeroTilt() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (window.matchMedia("(max-width: 1024px)").matches) return;

  const hero = document.querySelector(".hero");
  const chars = document.querySelectorAll(".hero-char");
  if (!hero || chars.length === 0) return;

  hero.addEventListener("pointermove", (e) => {
    const rect = hero.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    chars.forEach((char, i) => {
      const depth = 15 + i * 22;
      char.style.transform =
        `translate(${x * (10 + i * 8)}px, ${y * (8 + i * 6)}px) translateZ(${20 + i * 30}px) rotateX(${y * depth * 0.5}deg) rotateY(${x * depth * 0.7}deg)`;
    });
  });

  hero.addEventListener("pointerleave", () => {
    const offsets = ["-0.03em", "0.05em", "-0.07em", "0.04em"];
    chars.forEach((char, i) => { char.style.transform = `translateY(${offsets[i]})`; });
  });
}

/* ═══ Reveal on scroll ═══ */
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      revealObserver.unobserve(entry.target);
    });
  },
  { threshold: 0.08, rootMargin: "0px 0px -2% 0px" }
);

document.querySelectorAll(".reveal").forEach((item) => revealObserver.observe(item));

window.addEventListener("load", () => {
  document.querySelectorAll(".hero .reveal").forEach((item) => item.classList.add("is-visible"));
});

/* ═══ Lenis smooth scroll ═══ */
let lenis;
if (typeof Lenis !== "undefined") {
  lenis = new Lenis({
    duration: 1.3,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
  });

  function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
  requestAnimationFrame(raf);

  if (typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
  }
}

/* ═══ Horizontal scroll (Services) ═══ */
function initHorizontalScroll() {
  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (window.matchMedia("(max-width: 1024px)").matches) return;

  const wrapper = document.querySelector(".services-wrapper");
  const track = document.querySelector("#services-track");
  if (!wrapper || !track) return;

  const scrollDistance = track.scrollWidth - wrapper.offsetWidth + 48;
  if (scrollDistance <= 0) return;

  ScrollTrigger.getAll().forEach((st) => { if (st.vars.trigger === wrapper) st.kill(); });

  gsap.to(track, {
    x: () => -scrollDistance,
    ease: "none",
    scrollTrigger: {
      trigger: wrapper,
      start: "top top",
      end: `+=${scrollDistance * 3}`,
      scrub: 0.8,
      pin: true,
      anticipatePin: 1,
      invalidateOnRefresh: true,
    },
  });
}

/* ═══ Init All ═══ */
function init() {
  initThreeBackground();
  initCursor();
  initMagnetic();
  initHeroTilt();
  initHorizontalScroll();
}

if (typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
  init();
} else {
  window.addEventListener("load", init);
}

let resizeTimer;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => { if (typeof ScrollTrigger !== "undefined") ScrollTrigger.refresh(); }, 300);
});
