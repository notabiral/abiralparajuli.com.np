# DESIGN.md — abiralparajuli.com.np

The design system for Abiral Parajuli's personal site, locked 15 November 2026
with the "Review Console" redesign. This file is the source of truth: future
edits change the tokens here first, then the CSS.

## Concept — The Review Console

The site is presented as Abiral's own quality-review workbench. Every section
is an item in a review queue: labelled, ruled, stamped with a verdict. The
concept grows out of the content itself — the original build already spoke in
case IDs (`EXP_001`), statuses (`ACTIVE_DEPLOYMENT`, `ARCHIVED`) and readout
labels (`WEIGHTED_RECALL`, `DATA_THROUGHPUT`). The redesign takes that language
seriously instead of decorating over it.

- Kind: personal site for a person who is hired (service kind), with a
  technical subject (AI trust & safety, data quality) and one interactive
  training simulator. Flat grounds, type-led moments, no shader effects.
- Dials: design variance 6/10 (ruled grid with asymmetric hero offset),
  motion intensity 3/10 (hover/press micro-interactions, accordion, the game;
  no scroll animation), visual density 6/10 (console-dense, with air).
- One moment: the hero verdict panel. The Policy Patrol game is the
  interactive subject. No other effects.

## Tokens

Adapted structural values only (hairline discipline, mono annotation labels,
surface ladder) from the Linear and Vercel systems in the awesome-design-md
library. No brand's colours, typefaces, logos or signature effects are used.

```css
--paper: #f6f5f0;          /* page ground: console sheet */
--sheet: #ffffff;          /* panels, raised rows */
--ink: #17181a;            /* headings, primary text */
--body: #3f4247;           /* body copy */
--muted: #686a6e;          /* secondary labels */
--faint: #9a9ca0;          /* decorative only: dots, ticks — never text */
--hairline: #e2dfd5;       /* rules, dividers */
--hairline-strong: #c8c4b8;
--verdict: #1e6b4a;        /* verdicts, focus rings, active states */
--verdict-soft: #e7f0ea;   /* delta chips */
--amber: #9a5b00;          /* attention, sparingly */
--amber-soft: #faf0dd;
--breach: #b3261e;         /* game breach + SCAM only */
--breach-soft: #fbe9e7;
--dark: #14161a;           /* console bezel, contact panel */
--dark-2: #1d2026;
--dark-line: #2c3038;
--dark-muted: #9aa0aa;
```

- Radius: sharp console — 6px controls, 10px panels. No pill buttons.
- Max content width: 1180px, equal left/right edges at every width.
- Spacing: 4px base; sections separated by 72–96px and hairline rules.
- Borders over shadows: hierarchy comes from hairlines and surface steps,
  not drop shadows. No card-in-card nesting.

## Typography

- Display: **Instrument Serif** (400, italic for accents). Hero 76px/0.95
  with tight tracking; section titles 34px. Continuity with the original
  build, which already used Instrument Serif for display.
- Body: **Inter** 15px/1.65, system-ui fallback.
- Annotation: **IBM Plex Mono** 11–12px, uppercase, 0.08em tracking, for
  labels, IDs, figures' units, nav and footer. Figures use tabular numerals.
- Fonts load via `<link>` with `preconnect` (never CSS `@import`).
- Headings name things; buttons are a verb plus an object; copy is the
  original build's copy, preserved verbatim — nothing invented.

## Components

- **Console bar** (sticky header): dark square `AP` mark, serif name, mono
  meta line, mono nav with scroll-spy (active item is a dark chip), dark
  Copy-email button. On mobile the nav becomes a horizontal scrolling row.
- **Section header**: mono index (`01`), hairline rule, serif title,
  right-aligned mono note.
- **Readout grid** (Impact): ruled grid with hairline dividers, no card
  boxes. Mono label, serif figure, soft delta chip. Hover tints the cell.
- **Tag chips** (Skills): sharp bordered chips; hover darkens the border
  and lifts 1px.
- **Dossier rows** (Experience): full-width accordion rows. ID column with
  the entry's colour swatch, status chip (`ACTIVE_DEPLOYMENT` dark,
  `ARCHIVED` muted), role/company/date, `+`/`−` indicator. Collapsed rows
  show the first finding clamped to two lines. `aria-expanded` + region.
- **Record panels** (Education / Languages / Contact): three-column band.
  Education rows carry a country code at right. Language bars are 4px with
  a tabular percentage. Contact is the dark panel.
- **Verdict panel** (hero): bordered panel with corner ticks, mono label,
  serif benchmark figure, factual caption. Straight edges, never tilted.
- **Game bezel** (Playground): dark console frame around the light canvas
  playfield, mono status bar, sharp-cornered overlays. Mechanics and copy
  identical to the original build.
- **Buttons**: one pair — solid dark rect, outline rect. 44px minimum
  height, step up 1px on hover, press on click, 2px verdict focus ring with
  2px offset. Links draw their underline on hover.

## Motion

- Hero enters once on load (fade + 6px rise). Disabled under
  `prefers-reduced-motion`, as are all transitions.
- No scroll-linked motion, no fade-in on sections, no parallax, no tilt,
  no carousels, no timed tabs.
- The game is user-driven and always pausable (P / Esc / Pause button).

## Accessibility

- Skip link first in the document, targeting `#main`, ring visible at once.
- Zoom never disabled. Visible `:focus-visible` rings on every control.
- Accordion buttons expose `aria-expanded`/`aria-controls`; the canvas has
  an accessible label and full keyboard play; overlays are real buttons.
- Colour is never the only signal: statuses also carry text, the game also
  carries shapes and words.
- Contrast (measured): ink on paper 16.3:1, body on paper 9.2:1, muted
  on paper 5.0:1, verdict on paper 5.9:1, white on verdict 6.5:1, white on
  ink 17.8:1, dark-muted on dark 6.9:1 (all AA or better). `--faint` is
  decorative only and never carries text.

## Waivers (recorded, with reasons)

1. **Taste rule 9 (contact hygiene)** — the real phone number, email and
   district are shown, as on the original build. These are the client's own
   published contact details, preserved verbatim, not invented contacts.
2. **Photographs** — none exist for this site and none were added. No
   photographs of Abiral were used or generated. The canvas game is the
   page's visual subject.
3. **One section per screen** — the game and record sections run longer
   than two screens at narrow widths; sections grow with their content on
   mobile rather than clipping, per the checklist's phone rule.
4. **Hero entrance only** — no other entrance or scroll motion, by design.
5. **Vercel Title Case / second-person copy rules** — the site's copy is
   the client's own, preserved verbatim (sentence-case buttons, "Let's
   build safer AI systems together"). Rewriting it to Title Case would
   change his voice; the tracker's GOV.UK-aligned sentence case follows
   the same principle.

## Content preservation

All copy, figures, dates, statuses, links and the footer line are carried
verbatim from the October 2026 build (single-file React bundle). The
`CNAME` is untouched. Behaviour preserved: scroll-spy nav, copy-email with
clipboard fallback, the experience accordion (first entry open), and the
full Policy Patrol game mechanics. The 175KB generated bundle is replaced
by hand-written HTML/CSS/JS; no framework, no build step.
