/* Hero 3D centerpiece — a rotating wireframe "signals globe" with glowing
   collection points and animated arcs pulsing between them, evoking a
   global SIGINT-collection visualization. Entirely procedural (no
   external model or texture files) so the site stays dependency-free
   apart from a single pinned Three.js CDN import.

   Desktop-only, and skipped entirely for prefers-reduced-motion — the
   ambient 2D particle canvas (js/main.js) is always the universal
   fallback, on every page and every device. */
(async function heroGlobe() {
  const container = document.getElementById("hero-3d");
  const canvas = document.getElementById("globe-canvas");
  if (!container || !canvas) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const wideEnough = window.matchMedia("(min-width: 900px)").matches;
  if (reduceMotion || !wideEnough) return;

  let THREE;
  try {
    THREE = await import("https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js");
  } catch (e) {
    return; // CDN unreachable — fail silently, the 2D background already covers the page
  }

  const ACCENT  = 0x60a5fa; // blue
  const ACCENT2 = 0xa78bfa; // violet
  const BG      = 0x08090c;

  const R           = 1.6;
  const POINT_COUNT = 16;
  const ARC_COUNT   = 9;

  // ---------- renderer / scene / camera ----------
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(0, 0, 6.4);
  camera.lookAt(0, 0, 0);

  const group = new THREE.Group();
  scene.add(group);

  // ---------- ambient core glow (fixed, doesn't rotate) ----------
  function glowTexture(hex) {
    const size = 128;
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const ctx = c.getContext("2d");
    const r = size / 2;
    const col = new THREE.Color(hex);
    const rgb = `${Math.round(col.r * 255)}, ${Math.round(col.g * 255)}, ${Math.round(col.b * 255)}`;
    const grad = ctx.createRadialGradient(r, r, 0, r, r, r);
    grad.addColorStop(0, `rgba(${rgb}, 1)`);
    grad.addColorStop(0.4, `rgba(${rgb}, 0.55)`);
    grad.addColorStop(1, `rgba(${rgb}, 0)`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    return new THREE.CanvasTexture(c);
  }
  const pointGlowTex = glowTexture(ACCENT);
  const pulseGlowTex = glowTexture(ACCENT2);

  const coreGlow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: pointGlowTex, color: ACCENT, transparent: true, opacity: 0.45,
    depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  coreGlow.scale.set(R * 3.4, R * 3.4, 1);
  scene.add(coreGlow);

  // ---------- occluder (hides back-hemisphere wireframe/points/arcs) ----------
  const occluder = new THREE.Mesh(
    new THREE.SphereGeometry(R * 0.985, 28, 20),
    new THREE.MeshBasicMaterial({ color: BG })
  );
  group.add(occluder);

  // ---------- wireframe globe ----------
  const wire = new THREE.Mesh(
    new THREE.SphereGeometry(R, 28, 20),
    new THREE.MeshBasicMaterial({
      color: ACCENT, wireframe: true, transparent: true,
      opacity: 0.16, depthWrite: false,
    })
  );
  group.add(wire);

  // ---------- collection points (Fibonacci sphere distribution) ----------
  function fibonacciSphere(n) {
    const pts = [];
    const phi = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < n; i++) {
      const y = 1 - (i / (n - 1)) * 2;
      const rad = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = phi * i;
      pts.push(new THREE.Vector3(Math.cos(theta) * rad, y, Math.sin(theta) * rad).multiplyScalar(R));
    }
    return pts;
  }
  const nodePositions = fibonacciSphere(POINT_COUNT);

  const pointMat = new THREE.SpriteMaterial({
    map: pointGlowTex, color: 0xffffff, transparent: true,
    depthWrite: false, blending: THREE.AdditiveBlending,
  });
  nodePositions.forEach((p) => {
    const s = new THREE.Sprite(pointMat);
    s.position.copy(p);
    s.scale.set(0.16, 0.16, 0.16);
    group.add(s);
  });

  // ---------- arcs between a handful of point pairs, each with a traveling pulse ----------
  const pulses = [];
  const usedPairs = new Set();
  let attempts = 0;
  while (pulses.length < ARC_COUNT && attempts < 200) {
    attempts++;
    const i = (Math.random() * POINT_COUNT) | 0;
    const j = (Math.random() * POINT_COUNT) | 0;
    if (i === j) continue;
    const key = i < j ? `${i}-${j}` : `${j}-${i}`;
    if (usedPairs.has(key)) continue;
    usedPairs.add(key);

    const p1 = nodePositions[i], p2 = nodePositions[j];
    const mid = p1.clone().add(p2).multiplyScalar(0.5);
    const height = R * (0.45 + Math.random() * 0.35);
    mid.normalize().multiplyScalar(R + height);

    const curve = new THREE.QuadraticBezierCurve3(p1, mid, p2);
    const geom = new THREE.BufferGeometry().setFromPoints(curve.getPoints(40));
    const line = new THREE.Line(
      geom,
      new THREE.LineBasicMaterial({
        color: ACCENT2, transparent: true, opacity: 0.3,
        depthWrite: false, blending: THREE.AdditiveBlending,
      })
    );
    group.add(line);

    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: pulseGlowTex, color: 0xffffff, transparent: true,
      depthWrite: false, blending: THREE.AdditiveBlending,
    }));
    sprite.scale.set(0.22, 0.22, 0.22);
    group.add(sprite);

    pulses.push({ curve, sprite, t: Math.random(), speed: 0.18 + Math.random() * 0.12 });
  }

  // ---------- resize ----------
  function resize() {
    const rect = container.getBoundingClientRect();
    const w = Math.max(1, rect.width), h = Math.max(1, rect.height);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener("resize", resize);

  // ---------- mouse parallax ----------
  const mouse = { x: 0, y: 0 };
  const tilt  = { x: 0, y: 0 };
  window.addEventListener("pointermove", (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  // ---------- animate ----------
  const clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.05);

    group.rotation.y += dt * 0.12;
    tilt.x += (mouse.y * 0.18 - tilt.x) * 0.04;
    tilt.y += (mouse.x * 0.18 - tilt.y) * 0.04;
    group.rotation.x = tilt.x;
    group.rotation.z = tilt.y * 0.3;

    for (const p of pulses) {
      p.t += dt * p.speed;
      if (p.t > 1) p.t -= 1;
      p.sprite.position.copy(p.curve.getPointAt(p.t));
    }

    renderer.render(scene, camera);
  }
  animate();
})();
