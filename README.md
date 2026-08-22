# ScholarFlow — Academic Scholar Research & Outreach Ecosystem

A unified SaaS-style dashboard application designed for academic outreach, faculty targeting, pipeline stage tracking, and scholar intelligence across top global law and interdisciplinary research faculties (QS 1–220).

## 🚀 Features

- **Executive Overview Dashboard**: Real-time KPI metrics, interactive weekly activity chart, and dedicated **Tier-by-Tier Engagement Coverage Meters** (Super Standout, Tier 1, Tier 2, Tier 3, and Total Ecosystem).
- **Comprehensive Scholars Directory (214 Verified Scholars)**:
  - Multi-criteria filtering by 8 research clusters, priority tiers, academic levels (Senior/Junior), and countries (24 countries).
  - Multi-view switching: **Cards**, **Table**, and **List** modes.
  - Full research match points, specific contribution offers, proposal alignment hits, recent publications (2022–2025), and Bangladesh send times.
  - Filtered CSV data export.
- **5-Stage Outreach Pipeline (Kanban Board)**:
  - Drag-and-drop workflow tracking: `Not Contacted` → `Contacted` → `Replied` → `Meeting Scheduled` → `Partnered / Closed`.
  - Follow-up date scheduling and full `localStorage` persistence.
- **Thematic Research Clusters**: Dedicated intelligence overviews for 8 domains (TWAIL, Climate Law / Loss & Damage, AI / Tech Governance, Water Law, Political Ecology, Climate Migration, Investment Law, Climate Litigation).
- **Priority Targets Shortlist**: Focused targeting view for Super Standouts and Tier 1 primary DPhil supervisors.
- **Analytics & Geographic Footprint**: Live visual breakdowns of research clusters, countries, outreach funnels, and priority stratifications.
- **Slide-in Scholar Detail Drawer**: Off-canvas profile inspection with quick copy email, mailto drafts, stage controls, and publication lists.
- **Researcher Profile & Academic CV**: Personal profile section with academic credentials, verified publication pipeline, conference presentations, awards, certifications, skills matrix, photo manager, print styling, and Markdown CV export.

## 🛠️ Tech Stack & Architecture

- **Vanilla HTML5, CSS3, & Modern JavaScript (ES6+)**
- **Zero Build Steps & Zero Dependencies**: Runs directly in any modern browser.
- **Custom Light SaaS Design System**: Modern lavender/violet palette (`#6D5BD0`, `#F6F5FB`), Inter typography, responsive layouts, and SVG visualizers.
- **Local Persistence**: State maintained locally across browser sessions via `localStorage`.

## 📁 File Structure

```
├── index.html                  # Main application shell & view containers
├── styles.css                  # Custom SaaS design system & print styles
├── app.js                      # Client router, filtering engine, Kanban & persistence
├── data.js                     # Master dataset of 214 verified scholars & cluster metadata
├── profile-data.js             # Researcher academic profile seed data
├── Tusher_CV.md                # Source of truth biographical CV
├── tusher-profile-photo.png    # Researcher high-res profile photo
├── tusher-avatar.png           # Top bar & sidebar avatar asset
├── scholars_dataset.xlsx       # Master scholarship dataset spreadsheet
└── scholars_dataset.csv        # Master dataset CSV export
```

## 💻 Quick Start

Simply open `index.html` in any modern web browser or host on GitHub Pages / Vercel / Netlify.
