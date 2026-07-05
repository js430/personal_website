/* Shared behavior: network canvas, typing effect, reveals, clock, command palette */

/* ---------- Animated node-network background ---------- */
(function netCanvas() {
  const canvas = document.getElementById("net-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  let w, h, nodes;
  const NODE_COUNT = 70;
  const LINK_DIST = 150;

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
    }));
  }

  function tick() {
    ctx.clearRect(0, 0, w, h);
    for (const n of nodes) {
      n.x += n.vx;
      n.y += n.vy;
      if (n.x < 0 || n.x > w) n.vx *= -1;
      if (n.y < 0 || n.y > h) n.vy *= -1;
    }
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const d = Math.hypot(dx, dy);
        if (d < LINK_DIST) {
          ctx.strokeStyle = `rgba(96, 165, 250, ${0.08 * (1 - d / LINK_DIST)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }
    for (const n of nodes) {
      ctx.fillStyle = "rgba(148, 180, 250, 0.45)";
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fill();
    }
    requestAnimationFrame(tick);
  }

  resize();
  init();
  window.addEventListener("resize", () => { resize(); init(); });
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (!media.matches) tick();
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
      input.placeholder = "commands: home | projects | resume | contact | download";
      return;
    }
    if (cmd === "download" || cmd === "pdf") {
      const dl = document.getElementById("dl-resume");
      if (dl) dl.click();
      else window.location.href = "resume.html";
      close();
      return;
    }
    input.value = "";
    input.placeholder = `unknown command: ${cmd} — try "help"`;
  });
})();
