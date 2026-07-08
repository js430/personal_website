# CLAUDE.md

Personal site for Jeffrey Shi — static HTML/CSS/JS, no build step, deployed on GitHub Pages
from the `main` branch. See [README.md](README.md) for the page map and feature list.

## Frontend aesthetics

<frontend_aesthetics>
You tend to converge toward generic, "on distribution" outputs. In frontend design, this creates what users call the "AI slop" aesthetic. Avoid this: make creative, distinctive frontends that surprise and delight. Focus on:

Typography: Choose fonts that are beautiful, unique, and interesting. Avoid generic fonts like Arial and Inter; opt instead for distinctive choices that elevate the frontend's aesthetics.

Color & Theme: Commit to a cohesive aesthetic. Use CSS variables for consistency. Dominant colors with sharp accents outperform timid, evenly-distributed palettes. Draw from IDE themes and cultural aesthetics for inspiration.

Motion: Use animations for effects and micro-interactions. Prioritize CSS-only solutions for HTML. Use Motion library for React when available. Focus on high-impact moments: one well-orchestrated page load with staggered reveals (animation-delay) creates more delight than scattered micro-interactions.

Backgrounds: Create atmosphere and depth rather than defaulting to solid colors. Layer CSS gradients, use geometric patterns, or add contextual effects that match the overall aesthetic.

Avoid generic AI-generated aesthetics:
- Overused font families (Inter, Roboto, Arial, system fonts)
- Clichéd color schemes (particularly purple gradients on white backgrounds)
- Predictable layouts and component patterns
- Cookie-cutter design that lacks context-specific character

Interpret creatively and make unexpected choices that feel genuinely designed for the context. Vary between light and dark themes, different fonts, different aesthetics. You still tend to converge on common choices (Space Grotesk, for example) across generations. Avoid this: it is critical that you think outside the box!
</frontend_aesthetics>

### Current design system (as of the Nord Ops redesign)

- **Palette**: [Nord](https://www.nordtheme.com/) — a real, specific, well-loved editor/terminal
  theme, not an invented gradient. Frost cyan (`#88c0d0`) is the dominant accent; aurora purple
  (`#b48ead`) is used sparingly as a sharp secondary accent. All colors are CSS custom properties
  in `css/style.css` (`--bg`, `--accent`, `--accent-2`, etc.) — change the palette by editing the
  `:root` block, not by hunting for hex codes.
- **Type system**: three tiers, each with a distinct job. Newsreader (serif) for headlines/display
  — editorial, briefing-report gravitas. Public Sans (the U.S. government's own web typeface —
  a deliberate nod to Jeffrey's IC/government work) for body copy and UI. JetBrains Mono for
  data, labels, and code. Don't blend these roles.
- **Motion**: the hero gets one orchestrated load-in (staggered `animation-delay` on
  `.hero-load` elements in `index.html`); everything below the fold uses scroll-triggered
  `.reveal` — don't add more page-load animation than the hero needs.
- Before changing the palette or fonts again, reread the aesthetics block above — the goal is a
  cohesive, specific, referenceable aesthetic, not another generic dark-mode SaaS gradient.
