# Jeffrey Shi — Personal Website

**Live at https://js430.github.io/personal_website/** (GitHub Pages, `main` branch).

Static personal site with a SIGINT-terminal / declassified-dossier theme.
No build step, no dependencies — plain HTML/CSS/JS. Host it anywhere
(GitHub Pages, Netlify, Cloudflare Pages, S3…).

## Pages

| Page | File | Notes |
|------|------|-------|
| Home | `index.html` | Terminal hero, mission brief, capability domains, contact |
| Projects | `projects.html` | Projects styled as intel "case files" |
| Resume | `resume.html` | Interactive dossier: tabs, expandable timeline, animated skills matrix |

## Content status

Resume, projects, and home-page content are populated from the Nov 2025 resume;
`assets/Jeffrey_Shi_Resume.pdf` is the real downloadable resume.

Still to customize:

- **Current role** — the timeline's latest entry is ManTech (per the resume);
  add the current intelligence/SIGINT analyst position when shareable.
- **Skill percentages** — the bars in `resume.html` are a visual device;
  tune `data-width` values to taste.
- **Website repo link** — the "This Website" case file in `projects.html`
  points at the GitHub profile; swap in the repo URL once pushed.

## Features

- Animated node-network canvas background (respects `prefers-reduced-motion`)
- Typing-rotation hero, scroll reveals, click-to-declassify redacted text
- Command palette: press `/` anywhere, type `help`, `projects`, `resume`,
  `skills`, `download`, etc.
- Resume: tabbed sections, expandable timeline entries, animated skill bars,
  stat count-ups
- **PRINT / SAVE AS PDF** button uses a clean white print stylesheet, so the
  browser's print-to-PDF produces a readable paper resume
- Live UTC clock in the status bar, because of course

## Local preview

Any static server works, e.g.:

```
python -m http.server 4173
```

then open http://localhost:4173.
