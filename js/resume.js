/* Resume page: tabs, timeline accordions, skill-bar + stat animations, print */

/* ---------- Tabs ---------- */
(function tabs() {
  const tabBar = document.getElementById("resume-tabs");
  if (!tabBar) return;
  const buttons = tabBar.querySelectorAll("button");
  const panes = document.querySelectorAll(".resume-pane");

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => b.classList.toggle("active", b === btn));
      panes.forEach((p) => (p.hidden = p.id !== "pane-" + btn.dataset.pane));
      if (btn.dataset.pane === "skills") animateSkills();
    });
  });
})();

/* ---------- Timeline accordions ---------- */
(function timeline() {
  const entries = document.querySelectorAll(".tl-entry");

  function setHeight(entry) {
    const body = entry.querySelector(".tl-body");
    body.style.maxHeight = entry.classList.contains("open")
      ? body.scrollHeight + "px"
      : "0";
  }

  entries.forEach((entry) => {
    const head = entry.querySelector(".tl-head");
    setHeight(entry);
    head.addEventListener("click", () => {
      entry.classList.toggle("open");
      setHeight(entry);
    });
  });

  const expandAll = document.getElementById("expand-all");
  if (expandAll) {
    expandAll.addEventListener("click", () => {
      const anyClosed = [...entries].some((e) => !e.classList.contains("open"));
      entries.forEach((e) => {
        e.classList.toggle("open", anyClosed);
        setHeight(e);
      });
      expandAll.innerHTML = anyClosed
        ? "&#8863; COLLAPSE ALL SECTIONS"
        : "&#8862; EXPAND ALL SECTIONS";
    });
  }

  window.addEventListener("resize", () => entries.forEach(setHeight));
})();

/* ---------- Skill bars ---------- */
let skillsAnimated = false;
function animateSkills() {
  if (skillsAnimated) return;
  skillsAnimated = true;
  document.querySelectorAll(".skill-bar .fill").forEach((fill, i) => {
    setTimeout(() => {
      fill.style.width = fill.dataset.width + "%";
    }, 80 * i);
  });
}

/* ---------- Dossier stat count-up ---------- */
(function stats() {
  const nums = document.querySelectorAll(".stat .num[data-count]");
  nums.forEach((el) => {
    const target = parseInt(el.dataset.count, 10);
    const duration = 900;
    const start = performance.now();
    function frame(t) {
      const p = Math.min((t - start) / duration, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  });
})();

/* ---------- Print / save as PDF ---------- */
(function printBtn() {
  const btn = document.getElementById("print-resume");
  if (!btn) return;
  btn.addEventListener("click", () => {
    // reveal all panes and entries so the printed dossier is complete
    document.querySelectorAll(".resume-pane").forEach((p) => (p.hidden = false));
    document.querySelectorAll(".tl-entry").forEach((e) => {
      e.classList.add("open");
      const body = e.querySelector(".tl-body");
      body.style.maxHeight = "none";
    });
    animateSkills();
    setTimeout(() => window.print(), 150);
  });

  window.addEventListener("afterprint", () => {
    // restore tab state: show only the active pane again
    const active = document.querySelector("#resume-tabs button.active");
    if (!active) return;
    document.querySelectorAll(".resume-pane").forEach((p) => {
      p.hidden = p.id !== "pane-" + active.dataset.pane;
    });
  });
})();
