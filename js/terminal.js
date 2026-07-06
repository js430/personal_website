/* Hidden interactive terminal easter egg.
   Open it by pressing the ` (backtick) key anywhere, or by typing
   "terminal" into the command palette. Everything here is a canned,
   client-side response — no real command execution, no network calls. */
(function hiddenTerminal() {
  if (document.getElementById("hidden-terminal")) return;

  const overlay = document.createElement("div");
  overlay.id = "hidden-terminal";
  overlay.className = "term-overlay";
  overlay.innerHTML = `
    <div class="term-panel" role="dialog" aria-label="Hidden terminal">
      <div class="term-panel-head">
        <span class="term-dot r"></span><span class="term-dot y"></span><span class="term-dot g"></span>
        <span class="term-panel-title">guest@jeffreyshi:~$</span>
      </div>
      <div class="term-output" id="term-output"></div>
      <div class="term-input-row">
        <span class="p">&gt;</span>
        <input id="term-input" type="text" autocomplete="off" spellcheck="false" placeholder="type 'help'" />
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const output = overlay.querySelector("#term-output");
  const input  = overlay.querySelector("#term-input");

  const BANNER = [
    "┌──────────────────────────────────────────────┐",
    "│  hidden terminal — you found it.              │",
    "│  type 'help' to see available commands        │",
    "└──────────────────────────────────────────────┘",
  ];

  const RESPONSES = {
    about: [
      "Jeffrey Shi — intelligence/SIGINT analyst.",
      "Background in ETL/data engineering and cloud infrastructure",
      "at ManTech and GDIT, on U.S. Government / IC programs.",
      "UVA — B.A. Computer Science & B.A. Statistics.",
    ],
    skills: [
      "Python · SQL (Oracle/Postgres) · Kafka · Kubernetes",
      "AWS (Certified Cloud Practitioner) · Docker · CI/CD",
      "Intelligence / SIGINT analysis · cyber assessment tooling",
    ],
    contact: [
      "email:    jeffreyshi430@gmail.com",
      "linkedin: linkedin.com/in/jeffrey-shi-24570150",
      "github:   github.com/js430",
    ],
    whoami: ["guest — access level: public · clearance: none required"],
  };

  const HELP = [
    "available commands:",
    "  help       show this list",
    "  about      who is behind this terminal",
    "  skills     core technical skills",
    "  projects   open the projects page",
    "  personal   open personal projects (Ava bot)",
    "  resume     open the resume page",
    "  home       back to the home page",
    "  contact    show contact info",
    "  download   download the resume PDF",
    "  clear      clear the screen",
    "  exit       close this terminal",
  ];

  const history = [];
  let historyIdx = -1;

  function line(text, cls) {
    const div = document.createElement("div");
    div.className = "term-line" + (cls ? " " + cls : "");
    div.textContent = text;
    output.appendChild(div);
  }
  function printLines(lines, cls) {
    lines.forEach((l) => line(l, cls));
    output.scrollTop = output.scrollHeight;
  }
  function reset() {
    output.innerHTML = "";
    printLines(BANNER, "term-banner");
  }

  function downloadResume() {
    const a = document.createElement("a");
    a.href = "assets/Jeffrey_Shi_Resume.pdf";
    a.download = "";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function run(raw) {
    const cmd = raw.trim();
    if (!cmd) return;
    line("guest@jeffreyshi:~$ " + cmd, "term-prompt-line");
    history.push(cmd);
    historyIdx = history.length;

    const [base, ...rest] = cmd.toLowerCase().split(/\s+/);
    const arg = rest.join(" ");

    switch (base) {
      case "help":
        printLines(HELP);
        break;
      case "about":
      case "skills":
      case "contact":
      case "whoami":
        printLines(RESPONSES[base]);
        break;
      case "ls":
        printLines(["about.txt  skills.txt  projects/  personal/  resume.pdf  contact.txt"]);
        break;
      case "cat":
        if (/resume/.test(arg))      printLines(["run 'download' to get the PDF, or 'resume' to open the page."]);
        else if (/about/.test(arg))  printLines(RESPONSES.about);
        else if (/skill/.test(arg))  printLines(RESPONSES.skills);
        else if (/contact/.test(arg)) printLines(RESPONSES.contact);
        else printLines([`cat: ${arg || "(missing file)"}: no such file`]);
        break;
      case "home":
        printLines(["→ navigating home…"]);
        setTimeout(() => (window.location.href = "index.html"), 300);
        break;
      case "projects":
        printLines(["→ opening case files…"]);
        setTimeout(() => (window.location.href = "projects.html"), 300);
        break;
      case "personal":
        printLines(["→ opening personal projects…"]);
        setTimeout(() => (window.location.href = "personal.html"), 300);
        break;
      case "resume":
        printLines(["→ opening resume…"]);
        setTimeout(() => (window.location.href = "resume.html"), 300);
        break;
      case "download":
        printLines(["→ downloading resume PDF…"]);
        downloadResume();
        break;
      case "sudo":
        if (/hire-me/.test(arg)) {
          printLines(["Permission granted.", "→ opening a message to jeffreyshi430@gmail.com…"]);
          setTimeout(() => (window.location.href = "mailto:jeffreyshi430@gmail.com"), 500);
        } else {
          printLines(["nice try. this isn't that kind of terminal."]);
        }
        break;
      case "nmap":
      case "scan":
        printLines(["scanning… just kidding — this terminal doesn't touch the network."]);
        break;
      case "matrix":
        printLines(["there is no spoon."]);
        break;
      case "clear":
        reset();
        break;
      case "exit":
      case "quit":
        close();
        break;
      default:
        printLines([`command not found: ${base} — type 'help' for a list`]);
    }
    output.scrollTop = output.scrollHeight;
  }

  function open() {
    overlay.classList.add("open");
    if (!output.childElementCount) reset();
    setTimeout(() => input.focus(), 80);
  }
  function close() {
    overlay.classList.remove("open");
    input.blur();
  }

  overlay.addEventListener("mousedown", (e) => { if (e.target === overlay) close(); });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      run(input.value);
      input.value = "";
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (historyIdx > 0) { historyIdx--; input.value = history[historyIdx] || ""; }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIdx < history.length - 1) { historyIdx++; input.value = history[historyIdx] || ""; }
      else { historyIdx = history.length; input.value = ""; }
    } else if (e.key === "Escape") {
      close();
    }
  });

  document.addEventListener("keydown", (e) => {
    const typing = ["INPUT", "TEXTAREA"].includes(document.activeElement.tagName);
    if (e.key === "`" && !typing) {
      e.preventDefault();
      overlay.classList.contains("open") ? close() : open();
    } else if (e.key === "Escape" && overlay.classList.contains("open")) {
      close();
    }
  });

  window.__openHiddenTerminal = open;
})();
