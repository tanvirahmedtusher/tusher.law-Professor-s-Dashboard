You are working inside my existing project. There is a single file, `index.html`, that already contains a working tool: a filterable directory of 225 professors I'm researching for academic outreach (research alignment, email status, priority tier, timing, sources, etc). It currently renders as one long page with a header, a sticky filter/search bar, and a Cards/Table/List switcher. All the data lives in a JS array (`P`) embedded in the file, along with helper functions for filtering, rendering, CSV export, and localStorage-based "contacted"/"bookmarked" tracking.

**Your job: rebuild this into a polished, multi-view SaaS-style dashboard app** — same data, same core interactions, dramatically better structure and visual design. Treat this like a real product, not a prototype.

\---

## 1\. Non-negotiables — do not lose or break these

* **Every entry in the `P` array must survive intact.** Don't drop, rename, or reformat fields — treat the dataset as read-only content you're re-presenting, not re-authoring.
* Keep all existing behaviors working somewhere in the new UI:

  * Search by name/university/research (with the `Ctrl/Cmd+K` focus shortcut)
  * Filter by cluster (chip pills), priority, category, and country
  * Cards / Table / List view switch
  * Expand a card to see full detail (research areas, current project, match point, contribution, supervision vacancy, timing/timezone, sources)
  * Copy email to clipboard
  * "Mark Contacted" and "Bookmark" toggles, persisted in `localStorage`
  * CSV export of the currently filtered list
* Keep the existing `localStorage` keys for contacted/bookmarked state (`pc`, `pb`) so nothing resets for me.
* No frameworks, no build step, no npm install. This must still run by just opening `index.html` in a browser (or a static server). Vanilla HTML/CSS/JS. You may use Google Fonts and, only if it meaningfully improves the charts, a single CDN script (e.g. Chart.js) — but hand-rolled SVG/CSS charts are preferred to keep it dependency-free.
* Reasonable file organization instead of one giant file: split into `index.html`, `styles.css`, `app.js`, and `data.js` (the `P` array and constants live in `data.js`). Use relative paths, no bundler.

\---

## 2\. New structure: sidebar app with multiple views

Replace the single scrolling page with a persistent **left sidebar** + **top bar** + **main content area that swaps views**, client-side (no page reloads, no router library needed — just show/hide view containers or swap innerHTML).

**Sidebar (collapsible to icon-only on smaller screens):**

* Product mark/logo at top (small wordmark + icon; keep it understated, not a stock logo)
* Nav items, each with an icon + label, active item gets a filled pill highlight:

  1. **Overview** — dashboard/home
  2. **Scholars** — the full searchable/filterable directory (today's Cards/Table/List view lives here)
  3. **Pipeline** — new Kanban board (see §4)
  4. **Clusters** — research-area breakdown
  5. **Priority Targets** — shortlist of Tier 1 / Priority A / Super Standout scholars
  6. **Analytics** — charts/stats
* Bottom of sidebar: small footer area — e.g. "214 scholars tracked" or a subtle credit line. No fake "upgrade your plan" upsell — this is a personal tool, not a SaaS product being sold to the user.

**Top bar (present on every view):**

* Left: current view title (e.g. "Overview", "Scholars")
* Center/left-of-center: the existing search input with the search icon and the `⌘K` badge — keep this, it's good
* Right: a date/last-updated label, a small notifications/activity bell (can just open the recent-activity list), and a profile avatar (initials-based, no fake photo)
* On the Scholars view specifically, the filter chips / dropdowns / view-toggle sit just below the top bar, not globally

\---

## 3\. Visual design system — light, modern SaaS, purple/lavender accent

Move away from the current navy-and-gold "institutional" palette toward a **light, airy, modern SaaS look**: white/near-white surfaces, soft lavender backgrounds, a confident violet/purple as the single strong accent color, and generous whitespace. Think clean B2B dashboard, not academic letterhead.

Suggested palette (adjust for contrast/accessibility, but keep this family):

* Primary accent: violet/purple, roughly `#6D5BD0` to `#7C5CFF` range
* Primary hover/active: a slightly deeper shade of the same hue
* Page background: very light lavender-grey, e.g. `#F6F5FB`
* Card/surface background: `#FFFFFF`
* Soft accent surface (for highlighted stat tiles, active nav pill): pale lavender, e.g. `#EFECFF` / `#F1EEFB`
* Text: dark slate (`#1A1B25`) for primary, muted grey-purple (`#6B6B80`) for secondary
* Borders: very light (`#E7E5F3`)
* Keep semantic colors for status: green (positive/replied/delivered-equivalent), amber (pending/verify), red (declined/cancelled-equivalent), blue (scheduled)
* Keep the existing cluster tag colors (TWAIL purple, Climate green, AI teal, Ecology orange, Investment rose, Migration blue, Water cyan, Litigation emerald) — just soften their backgrounds so they sit well against the new lavender surfaces instead of the old white

Other styling notes:

* Keep Inter as the typeface (already loaded via Google Fonts)
* Rounded corners throughout (12–16px on cards, 8px on inputs/buttons/pills)
* Soft, subtle shadows on cards (nothing heavy) — cards should lift slightly on hover
* Status/priority/cluster tags stay as small rounded pill labels
* Icons: use a lightweight inline SVG icon set (or a single icon font/CDN like Lucide/Feather via CDN) for sidebar nav, top bar, and stat-card trend arrows — no emoji as functional icons

\---

## 4\. View-by-view spec

### Overview (default landing view)

* Row of KPI stat cards, each with a big bold number, a label, and a small up/down trend indicator where meaningful:

  * Total Scholars (214)
  * Universities covered
  * Countries covered
  * Tier 1 / Priority A / Super Standout targets
  * Contacted so far (count + % of total)
  * Response rate, if you're tracking replies (otherwise omit rather than fake it)
* A simple weekly activity bar chart: how many scholars were marked "Contacted" per day over the last 7–14 days (derive this from a lightweight activity log you add to localStorage, see §5 — don't fabricate data)
* A circular/gauge indicator for "% of Tier 1 targets contacted" or similar, mirroring the gauge pattern from the inspiration screenshot
* A "Recent activity" feed: last \~10 actions (contacted, bookmarked, stage changes), newest first, pulled from the activity log
* A small "Upcoming/overdue follow-ups" widget if a follow-up date has been set on any scholar (see §5) — otherwise omit this widget entirely rather than showing an empty state

### Scholars (the existing directory)

* This is where today's search bar, cluster chips, priority/category/country dropdowns, and Cards/Table/List toggle live — restyled to the new visual system, functionally unchanged
* Card view: restyle the existing expandable cards (cluster/priority tags, name, title, university, quorum badge, expandable body with research/project/match-point/contribution/timing/sources, action row with Copy Email / Mark Contacted / Bookmark / View Profile)
* Add an optional "detail drawer" pattern: clicking a scholar's name (not just the expand chevron) can open a slide-in right-hand panel with the full profile in a larger, more scannable layout (contact block, stat mini-grid, tabs or stacked sections) — this is the closest analog to the "client detail" pattern in the inspiration screenshot. If a full drawer is too much scope, expanding the existing card is an acceptable fallback — don't skip the filtering/search functionality to build this.

### Pipeline (new — Kanban board)

* Columns, left to right: **Not Contacted → Contacted → Replied → Meeting Scheduled → Partnered/Closed**
* Add a `stage` field per scholar, persisted in `localStorage` (new key, e.g. `pstage`), defaulting to `"Not Contacted"`; if a scholar's existing `pc` (contacted) flag is already true, default their stage to `"Contacted"` on first load so nothing regresses
* Each column header shows the stage name and a live count
* Each card in the board shows: name, university, cluster tag, priority tag, a small initials avatar, and a follow-up date if one is set
* Let me move a card to the next/previous stage via either native HTML5 drag-and-drop between columns, or (simpler and more reliable) a small stage-select control / forward-arrow button on each card — pick whichever you can implement most robustly, drag-and-drop is a nice-to-have, not a requirement
* Moving a card should append an entry to the activity log

### Clusters

* Group scholars by `cluster`, show each cluster as a summary tile: name, count, count of Tier 1/Priority A within it, and a "View scholars" link that jumps to the Scholars view pre-filtered to that cluster (reuse the existing chip-filter logic)

### Priority Targets

* A focused, sorted shortlist: Tier 1 / Priority A / Super Standout scholars only, sorted by `prioritySort`, presented as a tighter list (denser than the main card grid — this is the "act on this first" view) with quick Mark Contacted / Bookmark actions inline

### Analytics

* Distribution by cluster (bar or donut)
* Distribution by country
* Distribution by priority tier
* Contacted vs. not-contacted progress bar
* Build these with simple SVG or CSS, no need for a heavy charting dependency unless you're already using one

\---

## 5\. New data \& persistence to add

* `stage` per scholar — outreach pipeline stage (see §4), localStorage key `pstage`, keyed by scholar id
* `followUpDate` per scholar — optional, settable from the detail card/drawer, shown on Pipeline cards and the Overview follow-ups widget, localStorage key `pfollowup`
* Activity log — an array of `{ id, name, action, timestamp }` appended whenever a scholar is marked contacted/bookmarked or moved to a new stage, localStorage key `pactivity`, capped at a reasonable length (e.g. last 200 entries) so it doesn't grow unbounded
* Everything stays client-side/local — no backend, no accounts. Must work correctly for me on first load with empty localStorage (no errors, sensible zero-states) and continue working correctly as state accumulates.

\---

## 6\. Technical requirements

* File structure: `index.html`, `styles.css`, `app.js`, `data.js` (dataset + constants). If you have a strong reason to keep it as a single file instead, that's acceptable — prioritize a working, coherent result over rigid adherence to this structure.
* Fully responsive: sidebar collapses to an icon rail or off-canvas drawer on narrow viewports; KPI cards stack; Kanban columns become horizontally scrollable; tables become horizontally scrollable or convert to stacked cards on mobile
* Accessible: sufficient color contrast, visible keyboard focus states, `aria-label`s on icon-only buttons, semantic headings per view
* No console errors, no broken links, no dead nav items
* Performance: this is \~200 records rendered client-side — keep rendering logic efficient (reuse the existing filter/render approach where it already works well) but no special virtualization is needed at this scale

\---

## 7\. Acceptance checklist (verify before you consider this done)

* \[ ] All 225 scholar records still present with all original fields intact
* \[ ] Search, cluster chips, priority/category/country filters all still work and combine correctly
* \[ ] Cards/Table/List toggle still works inside the Scholars view
* \[ ] Copy Email, Mark Contacted, Bookmark, and CSV export all still work
* \[ ] `Ctrl/Cmd+K` still focuses the search input
* \[ ] New Pipeline board renders all scholars into the correct default stage and lets me move them between stages
* \[ ] Overview KPIs and charts reflect real data/state, not placeholders
* \[ ] Sidebar navigation switches views without a page reload and highlights the active view
* \[ ] Layout looks correct and usable at desktop, tablet, and mobile widths
* \[ ] No build step required — opening `index.html` (or serving the folder statically) just works

Ask me if anything about the data model is ambiguous, but don't ask about visual/design choices below the level of what's specified above — use good product-design judgment and be decisive.

