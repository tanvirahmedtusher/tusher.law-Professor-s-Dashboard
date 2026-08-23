This is a follow-up build on the same project as before (the sidebar-based scholar-outreach dashboard with `index.html` / `styles.css` / `app.js` / `data.js`). Don't restructure or regress anything that already works there.

**Your job now: add a new, dedicated "Profile" section to the app.** This is a personal profile page for me (the app's owner/researcher), where I can view my academic profile, edit it, swap my photo, and export my CV. It is separate from the "Scholars" directory — that's the people I'm reaching out to; this is me.

---

## 1. Source of truth for the content — do not invent anything

The real content lives in `Tusher_CV.md`, which is available in this project. **Read it directly and use it as the only source of biographical fact.** Do not paraphrase creatively, invent numbers, guess at dates, or add achievements/skills that aren't in that file. This is a real person's real CV — accuracy matters more than making the numbers look impressive.

Two image assets are provided for you to use directly (already sized and background-transparent, drop them into your assets folder):
- `tusher-profile-photo.png` (800×800) — for the profile header card
- `tusher-avatar.png` (128×128) — for the sidebar/top-bar mini avatar

Parse `Tusher_CV.md` into a structured data object (e.g. `profile-data.js`) with roughly this shape — adjust field names as needed, but keep it structured, not one big blob of text:

```js
{
  name: "...",
  tagline: "...",           // the short bio paragraph at the top of the CV
  degree: "...",            // e.g. "LL.B. — Final Year"
  institution: "...",
  location: "...",
  email: "...",
  links: { linkedin, orcid, googleScholar },
  researchAreas: [...],
  courses: [...],            // "Relevant Courses/Sessions Taken"
  leadership: [{ role, org, detail, years }],
  researchExperience: [{ title, context, methodology, detail }],
  publications: [{ title, venue, status, year }],       // status = e.g. "Under revision", "Minor revision", "Forthcoming", "Conference proceedings"
  conferencePresentations: [{ title, venue, date, upcoming: true/false }],
  awards: [{ title, context, year }],
  coursesCertifications: [{ title, org, year, note }],
  skills: { soft: [...], research: [...] },
  languages: [{ language, level }],
  references: [{ name, title, org, email }]
}
```

This object is the **default seed data**. Editing in the UI (§4) overrides it in `localStorage`, never mutates this file.

---

## 2. Where this lives in the app

- Add a new sidebar nav item: **Profile** (person/ID-card icon), placed either at the top or bottom of the nav list, visually a little separated from the outreach-tool items (Overview/Scholars/Pipeline/Clusters/Priority Targets/Analytics) since it's a different kind of thing — e.g. a subtle divider above it.
- Replace the generic initials-avatar in the top bar with `tusher-avatar.png`, and clicking it should also jump to the Profile view (standard pattern).

---

## 3. Layout, adapted from the reference screenshots — but with real content, not fake scores

The inspiration screenshots are from a recruiting/candidate-review tool. Reuse the **layout patterns** (header card, stat tiles, gauge, highlight panel, pipeline-style stage cards, list-with-icons) but **do not reuse their content type** — this isn't a hiring scorecard, it's an academic profile, so no invented percentages like "91% Ability Test." Every number shown must trace back to something real in the CV. Here's how the patterns map:

### Header card (left/top)
- Soft lavender/purple gradient panel behind the photo (consistent with the app's accent color), `tusher-profile-photo.png` displayed in a rounded card (not necessarily a hard circle — a rounded-rect crop works well here, matching the reference)
- Name + a small pill tag for degree status (e.g. "LL.B. — Final Year")
- The one-line bio/tagline from the top of the CV
- Institution + location, and a row of small icon-buttons for email / LinkedIn / ORCID / Google Scholar (link out; if a URL isn't in the CV, render the label but disable/hide the link rather than inventing a URL)
- Action buttons: **Edit Profile**, **Change Photo**, **Download CV**

### Stat tiles row (replaces the percentage cards)
Use real counts pulled from the parsed data, e.g.:
- Publications
- Conference Presentations
- Awards & Honors
- Research Areas
Pick 4–6 that are genuinely meaningful; don't pad with a stat that's always going to read "1."

### One gauge/progress ring (replaces "Aspect Score")
Use exactly **one** authentic metric here — pick whichever fits best from the real data, for example:
- Degree progress (e.g. Final Year of LL.B. → a visually "almost complete" ring), or
- Publication pipeline progress (e.g. "X of Y manuscripts past initial review")
Don't fabricate a score to fill this slot — if nothing fits cleanly, replace the gauge with a simple "Currently:" status line instead (e.g. "Final-year LL.B. candidate").

### Highlights panel (replaces "Overall Score")
3 short icon + label + one-line rows pulling the most distinctive **real** facts from Awards/Publications, for example (use whatever's actually in the CV, don't force exactly these):
- A notable feature/mention (e.g. being flagged "Recommended" by an external academic)
- A named award (e.g. an Outstanding Paper Award)
- A notable ranking (e.g. a strong placement out of a large competitive field)

### Publication pipeline (replaces "Hiring History" / the funnel-stage cards)
This is the best real analog to the reference's funnel cards, and nicely echoes the outreach Pipeline view's visual language. Build a small stage board or stacked progress list:
**Draft/Under Revision → In Review → Minor Revision → Forthcoming/Accepted → Published**
and place each real publication (and conference proceeding, if listed) into the correct stage based on the status text in the CV. Reuse the pipeline card/column styling you already built for the outreach Kanban board so the app feels consistent, just don't literally merge the two boards.

### Two content lists (replace "Job Applications" / "Experience")
- **Conference Presentations** — icon + title + venue + date, with an "Upcoming" badge for future-dated ones and a neutral badge for past ones
- **Leadership & Research Roles** — icon + role + organization + year(s), covering the leadership bullet points and research-experience entries

### Full detail sections below the fold
Clean card/list sections (not dense CV paragraphs) for everything else so nothing from the CV is lost even if it didn't fit a widget above:
- Academic Credential(s) & Research Area(s)
- Relevant Courses/Sessions Taken
- Awards & Fellowships (full list)
- Courses & Certifications (full list)
- Skills (soft + research, as tags)
- Language Proficiency
- References (name, title, org, email — as a quiet, simple list; this is sensitive-ish info, no need to make it flashy)

---

## 4. Editing, photo upload, and export

- **Edit Profile** toggles an edit mode: either inline-editable fields per section or a clean modal/drawer form — your call, whichever you can build most reliably. Editing should cover every field in the data shape from §1 (add list items, edit text, remove entries).
- **Save** writes the edited object to `localStorage` (key e.g. `profileData`); **Cancel** discards in-progress edits; a small **Reset to CV defaults** action reloads the original seeded data (with a confirmation, since it's destructive to any edits).
- **Change Photo**: a file input (`accept="image/*"`), preview before confirming, resize/compress client-side via a `<canvas>` (cap at ~500px on the long edge) before storing as a base64 data URL in `localStorage` (key e.g. `profilePhoto`) — this keeps it well under localStorage quota. If no custom photo has been set, fall back to `tusher-profile-photo.png`.
- **Download CV**: generate a clean, print-friendly view of the current profile data (either a dedicated print stylesheet triggered by `window.print()`, or a downloadable `.md`/`.txt` snapshot built from the live data object) so the CV can be updated in the app and exported without a backend or a PDF library. A PDF export via a CDN library is a nice-to-have, not required.

---

## 5. Technical & visual consistency

- Keep using the same design system from the main build: light lavender/purple palette, Inter typeface, rounded cards, soft shadows, pill tags — the Profile view should feel like part of the same product, not a bolted-on page.
- No frameworks, no build step — vanilla HTML/CSS/JS, consistent with the rest of the project. Extend `styles.css`/`app.js`, add `profile-data.js`, and organize any new assets under an `assets/` folder.
- Fully responsive: header card stacks above the content on narrow screens, stat tiles wrap to 2-across then 1-across, pipeline board scrolls horizontally.
- Accessible: proper labels on the file input and all icon buttons, sufficient contrast, keyboard-operable edit controls.
- Everything client-side/local — no accounts, no backend. Must work correctly on first load (seeded from the CV) and continue to work correctly once I've edited it.

---

## 6. Acceptance checklist

- [ ] Every section of `Tusher_CV.md` is represented somewhere in the Profile view — nothing quietly dropped
- [ ] No fabricated scores, percentages, or facts anywhere on the page
- [ ] Photo upload works, resizes/compresses, persists across reloads, and falls back correctly to the provided default photo
- [ ] Edit → Save persists correctly to `localStorage`; Cancel discards; Reset restores the original CV-seeded data
- [ ] Download CV produces something genuinely usable (print view or exported file), reflecting the *current* (possibly edited) data
- [ ] Publication pipeline correctly buckets each real publication/proceeding by its actual stated status
- [ ] Sidebar "Profile" nav item and top-bar avatar both work and match the rest of the app's visual language
- [ ] Responsive and accessible at desktop, tablet, and mobile widths
- [ ] Nothing from the previous build (Overview/Scholars/Pipeline/Clusters/Priority Targets/Analytics) is broken by this addition

Use good judgment on layout details not spelled out above — be decisive rather than asking. Only flag something to me if the CV content itself is ambiguous (e.g. a status you can't confidently classify).
