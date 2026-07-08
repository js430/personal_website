/* Hero 3D centerpiece — an enhanced "signals globe": a textured, lit
   sphere (procedural surface — no external texture/model files) under
   a schematic wireframe overlay, with glowing collection points,
   animated arcs, a fresnel atmosphere rim glow, a starfield, and real
   bloom post-processing via Three.js's official addons.

   Three.js and its postprocessing addons load from a pinned CDN via
   an import map declared in index.html — still zero build step, and
   the only external network dependency on the whole site.

   Desktop-only, skipped for prefers-reduced-motion, and fails silently
   if the CDN is unreachable — the 2D particle canvas (js/main.js) is
   always the universal fallback, on every page and every device. */
(async function heroGlobe() {
  const container = document.getElementById("hero-3d");
  const canvas = document.getElementById("globe-canvas");
  if (!container || !canvas) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const wideEnough = window.matchMedia("(min-width: 900px)").matches;
  if (reduceMotion || !wideEnough) return;

  let THREE, EffectComposer, RenderPass, UnrealBloomPass, OutputPass;
  try {
    THREE = await import("three");
    ({ EffectComposer } = await import("three/addons/postprocessing/EffectComposer.js"));
    ({ RenderPass }     = await import("three/addons/postprocessing/RenderPass.js"));
    ({ UnrealBloomPass } = await import("three/addons/postprocessing/UnrealBloomPass.js"));
    ({ OutputPass }      = await import("three/addons/postprocessing/OutputPass.js"));
  } catch (e) {
    return; // CDN unreachable — fail silently, the 2D background already covers the page
  }

  const ACCENT  = 0x88c0d0; // Nord8 frost cyan
  const ACCENT2 = 0xb48ead; // Nord15 aurora purple
  const BG      = 0x1c2027;

  const R           = 1.6;
  const POINT_COUNT = 20;
  const ARC_COUNT   = 13;

  // ---------- renderer / scene / camera ----------
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene  = new THREE.Scene();
  // UnrealBloomPass doesn't preserve alpha through its blur composite, so a
  // transparent canvas background renders as an opaque black square once
  // bloom is in the pipeline. Match the page background instead — it reads
  // as seamless since the hero area is already this exact near-black tone.
  scene.background = new THREE.Color(BG);
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(0, 0, 6.4);
  camera.lookAt(0, 0, 0);

  const group = new THREE.Group();
  scene.add(group);

  // ---------- lighting (gives the surface a real day/night gradient) ----------
  const keyLight = new THREE.DirectionalLight(0xffffff, 1.6);
  keyLight.position.set(4, 2.2, 5);
  scene.add(keyLight);
  const ambient = new THREE.AmbientLight(0x2a3a5a, 0.55);
  scene.add(ambient);

  // ---------- procedural glow-sprite texture (points, pulses, core) ----------
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
    map: pointGlowTex, color: ACCENT, transparent: true, opacity: 0.4,
    depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  coreGlow.scale.set(R * 3.4, R * 3.4, 1);
  scene.add(coreGlow);

  // ---------- procedural surface texture: dark ocean + soft landmass blobs + graticule ----------
  function makeSurfaceTexture() {
    const w = 1024, h = 512;
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    const ctx = c.getContext("2d");

    const base = ctx.createLinearGradient(0, 0, 0, h);
    base.addColorStop(0, "#11141a");
    base.addColorStop(0.5, "#1b2330");
    base.addColorStop(1, "#11141a");
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);

    function blob(cx, cy, r, alpha) {
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, `rgba(76, 86, 106, ${alpha})`);
      g.addColorStop(0.7, `rgba(76, 86, 106, ${alpha * 0.5})`);
      g.addColorStop(1, "rgba(76, 86, 106, 0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }

    const clusters = 10;
    for (let i = 0; i < clusters; i++) {
      const cx = Math.random() * w;
      const cy = h * 0.16 + Math.random() * h * 0.68; // avoid poles
      const blobs = 4 + ((Math.random() * 4) | 0);
      for (let j = 0; j < blobs; j++) {
        blob(
          cx + (Math.random() - 0.5) * 130,
          cy + (Math.random() - 0.5) * 90,
          28 + Math.random() * 58,
          0.65 + Math.random() * 0.3
        );
      }
    }

    ctx.strokeStyle = "rgba(136, 192, 208, 0.14)";
    ctx.lineWidth = 1;
    for (let lat = 0; lat <= h; lat += h / 8) {
      ctx.beginPath(); ctx.moveTo(0, lat); ctx.lineTo(w, lat); ctx.stroke();
    }
    for (let lon = 0; lon <= w; lon += w / 16) {
      ctx.beginPath(); ctx.moveTo(lon, 0); ctx.lineTo(lon, h); ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  const surface = new THREE.Mesh(
    new THREE.SphereGeometry(R * 0.985, 64, 40),
    new THREE.MeshStandardMaterial({ map: makeSurfaceTexture(), roughness: 0.9, metalness: 0.05 })
  );
  group.add(surface);

  // ---------- schematic wireframe overlay ----------
  const wire = new THREE.Mesh(
    new THREE.SphereGeometry(R, 48, 32),
    new THREE.MeshBasicMaterial({
      color: ACCENT, wireframe: true, transparent: true,
      opacity: 0.11, depthWrite: false,
    })
  );
  group.add(wire);

  // ---------- fresnel atmosphere rim glow ----------
  const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(R * 1.07, 48, 32),
    new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        uniform vec3 glowColor;
        void main() {
          float intensity = pow(0.6 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 4.0) * 0.55;
          gl_FragColor = vec4(glowColor, 1.0) * intensity;
        }
      `,
      uniforms: { glowColor: { value: new THREE.Color(ACCENT) } },
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
    })
  );
  scene.add(atmosphere);

  // ---------- starfield ----------
  function makeStarfield(count, radius) {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const u = Math.random(), v = Math.random();
      const theta = 2 * Math.PI * u, phi = Math.acos(2 * v - 1);
      const r = radius * (0.6 + Math.random() * 0.4);
      positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xffffff, size: 0.045, transparent: true, opacity: 0.55,
      depthWrite: false, blending: THREE.AdditiveBlending,
    });
    return new THREE.Points(geo, mat);
  }
  scene.add(makeStarfield(800, 40));

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
  const pulseMat = new THREE.SpriteMaterial({
    map: pulseGlowTex, color: 0xffffff, transparent: true,
    depthWrite: false, blending: THREE.AdditiveBlending,
  });

  const pulses = [];
  const usedPairs = new Set();
  let attempts = 0;
  while (pulses.length < ARC_COUNT && attempts < 300) {
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

    const sprite = new THREE.Sprite(pulseMat);
    sprite.scale.set(0.22, 0.22, 0.22);
    group.add(sprite);

    pulses.push({ curve, sprite, t: Math.random(), speed: 0.18 + Math.random() * 0.12 });
  }

  // ---------- post-processing: real bloom ----------
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.4, 0.35, 0.4);
  composer.addPass(bloomPass);
  composer.addPass(new OutputPass());

  // ---------- resize ----------
  function resize() {
    const rect = container.getBoundingClientRect();
    const w = Math.max(1, rect.width), h = Math.max(1, rect.height);
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
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

    composer.render();
  }
  animate();
})();
