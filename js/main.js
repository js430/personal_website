/* Shared behavior: network canvas, typing effect, reveals, clock, command palette */

/* ---------- Interactive signal-graph background ---------- */
/* Particle network that reacts to the cursor (nodes/links bend away)
   and periodically sends a "packet" traveling along a live edge. */
(function netCanvas() {
  const canvas = document.getElementById("net-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  let w, h, nodes, packets;
  const NODE_COUNT     = 70;
  const LINK_DIST      = 150;
  const REPEL_RADIUS   = 130;
  const REPEL_STRENGTH = 34;
  const MAX_PACKETS    = 5;
  const mouse = { x: -9999, y: -9999, active: false };

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }

  function init() {
    nodes = Array.from({ length: NODE_COUNT }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 1.6 + 0.6,
      rx: 0, ry: 0, // mouse-repulsion displacement, recomputed each frame
    }));
    packets = [];
  }

  function maybeSpawnPacket() {
    if (packets.length >= MAX_PACKETS || Math.random() > 0.02) return;
    const a = nodes[(Math.random() * nodes.length) | 0];
    let best = null, bestD = Infinity;
    for (const b of nodes) {
      if (b === a) continue;
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (d < LINK_DIST && d < bestD) { bestD = d; best = b; }
    }
    if (best) packets.push({ a, b: best, t: 0, speed: 0.012 + Math.random() * 0.01 });
  }

  function tick() {
    ctx.clearRect(0, 0, w, h);

    for (const n of nodes) {
      n.x += n.vx;
      n.y += n.vy;
      if (n.x < 0 || n.x > w) n.vx *= -1;
      if (n.y < 0 || n.y > h) n.vy *= -1;

      if (mouse.active) {
        const dx = n.x - mouse.x, dy = n.y - mouse.y;
        const d = Math.hypot(dx, dy);
        if (d < REPEL_RADIUS && d > 0.001) {
          const force = (1 - d / REPEL_RADIUS) * REPEL_STRENGTH;
          n.rx = (dx / d) * force;
          n.ry = (dy / d) * force;
        } else {
          n.rx = 0; n.ry = 0;
        }
      } else {
        n.rx = 0; n.ry = 0;
      }
    }

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        const ax = a.x + a.rx, ay = a.y + a.ry;
        const bx = b.x + b.rx, by = b.y + b.ry;
        const d = Math.hypot(ax - bx, ay - by);
        if (d < LINK_DIST) {
          ctx.strokeStyle = `rgba(136, 192, 208, ${0.08 * (1 - d / LINK_DIST)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.lineTo(bx, by);
          ctx.stroke();
        }
      }
    }

    for (const n of nodes) {
      ctx.fillStyle = "rgba(180, 210, 220, 0.45)";
      ctx.beginPath();
      ctx.arc(n.x + n.rx, n.y + n.ry, n.r, 0, Math.PI * 2);
      ctx.fill();
    }

    maybeSpawnPacket();
    for (let i = packets.length - 1; i >= 0; i--) {
      const p = packets[i];
      p.t += p.speed;
      if (p.t >= 1) { packets.splice(i, 1); continue; }
      const px = p.a.x + (p.b.x - p.a.x) * p.t;
      const py = p.a.y + (p.b.y - p.a.y) * p.t;
      const alpha = Math.sin(p.t * Math.PI); // fades in, peaks mid-flight, fades out
      ctx.fillStyle = `rgba(180, 142, 173, ${0.9 * alpha})`;
      ctx.beginPath();
      ctx.arc(px, py, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(180, 142, 173, ${0.25 * alpha})`;
      ctx.beginPath();
      ctx.arc(px, py, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    requestAnimationFrame(tick);
  }

  function onPointerMove(e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.active = true;
  }
  function onPointerLeave() {
    mouse.active = false;
  }

  resize();
  init();
  window.addEventListener("resize", () => { resize(); init(); });
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (!media.matches) {
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("mouseleave", onPointerLeave);
    tick();
  }
})();

/* ---------- Cipher-scramble text reveal ---------- */
/* Headings tagged [data-scramble] decrypt from random glyphs into their
   real text right as their .reveal ancestor finishes fading in. */
(function scrambleOnReveal() {
  const revealEls = document.querySelectorAll(".reveal");
  if (!revealEls.length) return;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) return; // leave final text untouched, no animation needed

  const SCRAMBLE_CHARS = "!<>-_\\/[]{}—=+*^?#$%01";
  const MS_PER_CHAR = 34;
  const LOCK_WINDOW = 240;

  function scrambleReveal(el) {
    if (el.dataset.scrambled) return;
    el.dataset.scrambled = "1";
    const final = el.textContent;
    const len = final.length;
    const total = len * MS_PER_CHAR + LOCK_WINDOW + 80;
    el.classList.add("scrambling");
    const start = performance.now();

    function frame(now) {
      const t = now - start;
      let out = "";
      for (let i = 0; i < len; i++) {
        const ch = final[i];
        if (ch === " ") { out += " "; continue; }
        out += (t >= i * MS_PER_CHAR + LOCK_WINDOW)
          ? ch
          : SCRAMBLE_CHARS[(Math.random() * SCRAMBLE_CHARS.length) | 0];
      }
      el.textContent = out;
      if (t < total) {
        requestAnimationFrame(frame);
      } else {
        el.textContent = final;
        el.classList.remove("scrambling");
      }
    }
    requestAnimationFrame(frame);
  }

  revealEls.forEach((el) => {
    el.addEventListener("transitionend", function handler(e) {
      if (e.propertyName !== "opacity") return;
      el.removeEventListener("transitionend", handler);
      const targets = el.matches("[data-scramble]")
        ? [el]
        : [...el.querySelectorAll("[data-scramble]")];
      targets.forEach(scrambleReveal);
    });
  });
})();

/* ---------- Typing rotation (hero role line) ---------- */
(function typeRotate() {
  const el = document.getElementById("type-target");
  if (!el) return;
  const phrases = JSON.parse(el.dataset.phrases || "[]");
  if (!phrases.length) return;
  let pi = 0, ci = 0, deleting = false;

  function step() {
    const phrase = phrases[pi];
    if (!deleting) {
      ci++;
      el.textContent = phrase.slice(0, ci);
      if (ci === phrase.length) {
        deleting = true;
        return setTimeout(step, 2100);
      }
      return setTimeout(step, 55 + Math.random() * 45);
    }
    ci--;
    el.textContent = phrase.slice(0, ci);
    if (ci === 0) {
      deleting = false;
      pi = (pi + 1) % phrases.length;
      return setTimeout(step, 400);
    }
    setTimeout(step, 28);
  }
  setTimeout(step, 600);
})();

/* ---------- Scroll reveal ---------- */
(function reveals() {
  const els = document.querySelectorAll(".reveal");
  if (!els.length) return;
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add("visible");
          io.unobserve(e.target);
        }
      }
    },
    { threshold: 0.12 }
  );
  els.forEach((el) => io.observe(el));
})();

/* ---------- UTC clock in status bar ---------- */
(function clock() {
  const el = document.getElementById("utc-clock");
  if (!el) return;
  function update() {
    const now = new Date();
    el.textContent = now.toISOString().replace("T", " ").slice(0, 19) + "Z";
  }
  update();
  setInterval(update, 1000);
})();

/* ---------- Command palette (press / to open) ---------- */
(function cmdPalette() {
  const palette = document.getElementById("cmd-palette");
  const input = document.getElementById("cmd-input");
  const fab = document.getElementById("cmd-fab");
  if (!palette || !input) return;

  const routes = {
    home: "index.html",
    main: "index.html",
    projects: "projects.html",
    personal: "personal.html",
    resume: "resume.html",
    dossier: "resume.html",
    contact: "index.html#contact",
    about: "index.html#about",
  };

  function open() {
    palette.classList.add("open");
    input.value = "";
    setTimeout(() => input.focus(), 120);
  }
  function close() {
    palette.classList.remove("open");
    input.blur();
  }

  document.addEventListener("keydown", (e) => {
    const typing = ["INPUT", "TEXTAREA"].includes(document.activeElement.tagName);
    if (e.key === "/" && !typing) {
      e.preventDefault();
      open();
    } else if (e.key === "Escape") {
      close();
    }
  });

  if (fab) fab.addEventListener("click", open);

  input.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    const cmd = input.value.trim().toLowerCase();
    if (!cmd) return close();

    // page-local section jumps first (resume tabs etc.)
    const local = document.querySelector(`[data-cmd-target="${cmd}"]`);
    if (local) {
      local.click();
      close();
      return;
    }
    if (routes[cmd]) {
      window.location.href = routes[cmd];
      return;
    }
    if (cmd === "help") {
      input.value = "";
      input.placeholder = "commands: home | projects | personal | resume | contact | download | terminal";
      return;
    }
    if (cmd === "download" || cmd === "pdf") {
      const dl = document.getElementById("dl-resume");
      if (dl) dl.click();
      else window.location.href = "resume.html";
      close();
      return;
    }
    if (cmd === "terminal" || cmd === "shell") {
      close();
      if (window.__openHiddenTerminal) window.__openHiddenTerminal();
      return;
    }
    input.value = "";
    input.placeholder = `unknown command: ${cmd} — try "help"`;
  });
})();
