# Jeffrey Shi — Personal Website

**Live at https://js430.github.io/** (GitHub Pages user site, `main` branch —
push to deploy; `.nojekyll` keeps the build a plain file copy).

Static personal site in the "Nord Ops" design — the [Nord](https://www.nordtheme.com/)
editor/terminal palette with editorial serif headlines (Newsreader), Public Sans body,
and JetBrains Mono for data/labels. No build step; the only third-party requests are
Google Fonts (styles only). Three.js is vendored into `js/vendor/three/` — no CDN
script execution.

## Pages

| Page | File | Notes |
|------|------|-------|
| Home | `index.html` | Hero with 3D signals globe, about, capability domains, contact |
| Projects | `projects.html` | Professional work as "case files" (IC/government programs) |
| Personal | `personal.html` | Ava Discord bot — callouts, forecasting, card vision, alerts |
| Resume | `resume.html` | Interactive resume: tabs, expandable timeline, skills, PDF download |

## Features

- 3D wireframe "signals globe" hero (Three.js r160, vendored; bloom, atmosphere
  shader, starfield) — desktop only, skipped for `prefers-reduced-motion`
- Interactive particle-network background (cursor repulsion, traveling packets)
- Orchestrated staggered hero load-in; cipher-scramble headings on scroll reveal
- Command palette: press `/` anywhere (`help`, `projects`, `personal`, `resume`,
  `download`, `terminal`…)
- Hidden terminal easter egg: press `` ` `` — canned client-side shell with
  navigation, resume download, and a few jokes
- Resume: tabbed sections, expandable timeline, animated skill bars, stat count-ups,
  and a clean white print stylesheet so print-to-PDF produces a readable paper resume
- Ambient ops-feed ticker and live UTC clock

## Content status

Populated from the Nov 2025 resume; `assets/Jeffrey_Shi_Resume.pdf` is the real,
downloadable resume (phone number deliberately scrubbed for the public copy).

Still open:

- **Current role** — the timeline's latest entry is ManTech (per the resume); add
  the current intelligence/SIGINT analyst position when shareable.
- **Skill percentages** — the bars in `resume.html` are a visual device; tune
  `data-width` values to taste.

## Local preview

Any static server works, e.g.:

```
python -m http.server 4173
```

then open http://localhost:4173.
