# Unified Professor Information Ecosystem — Interactive Dashboard

## Goal
Build a **single-page, light-themed, professional web application** that consolidates **all professor data** from 16 HTML files and 1 XLSX file into one interactive, filterable, searchable dashboard. Every professor will have a comprehensive profile card with all available information merged from multiple source files.

## Data Sources Analyzed (17 files)

| File | Professors Found | Key Data |
|------|-----------------|----------|
| `scholar_outreach.html` | 8 (Rajamani, Pahuja, Tzouvala, Peel, Wewerinke-Singh, Mayer, Setzer, Schneiderman) | Full profiles, emails, draft emails, timing, cluster tags, nexus, contributions |
| `professor_priority_list.html` | 22 (Tier 1–3) | Priority tiers, proposal hits, standout ratings, email chronology |
| `professor_match_matrix.html` | 12 (Anghie, Ranganathan, Rajamani, McAdam, Wewerinke-Singh, Yeung, Taylor, Viñuales, Affolder, Miles, Schill + more) | Structured JSON data, cluster, research, email, match, contribution |
| `american_universities_priority.html` | ~18 (Cons, Best, Farber, Mulligan, Peluso, Riley Case, Jodoin, Raso, Vaccaro, Spain Bradley, Horowitz, Karanicolas, Klass, Prescott, Adelman, Frazier, Rowell, Gerke) | Priority list, proposal hits, match descriptions |
| `american_uni_batch2_dashboard.html` | 4 (Atapattu, Wiseman, Tai, Knudsen) | Full card data with all fields |
| `east_asian_universities_dashboard.html` | ~6+ (Minas + others) | Full card data, East Asian universities |
| `mixed_universities_batch3_dashboard.html` | ~5+ (Osofsky, Tigre, Le Cheng + others) | Full card data |
| Batches 4–12 | ~40+ additional professors | Full card data across mixed universities |

**Estimated total: 80–100+ unique professors** across all files.

## Proposed Architecture

### [NEW] `index.html` — Single-File Web Application
A **self-contained HTML file** (no build tools, no dependencies, no server needed) containing:

### Design System — Light Theme, Professional Mode
- **Font**: Inter (Google Fonts) for UI + Georgia for body text
- **Colors**: Light neutral palette with teal/navy accents, gold highlights
- **Layout**: Responsive grid with sidebar filters + main content area
- **Cards**: Glassmorphism-style professor cards with subtle shadows and hover animations
- **Animations**: Smooth CSS transitions on hover, filter changes, and card expansion

### Core Features

#### 1. **Header & Dashboard Stats**
- Total professors count, universities count, countries count
- Cluster distribution mini-chart (colored dots/bars)
- Quick stats: Tier 1/2/3 distribution

#### 2. **Search Bar** (Instant Search)
- Real-time filtering as user types
- Searches across: name, university, research areas, match points, cluster
- Keyboard shortcut: `Ctrl+K` to focus

#### 3. **Filter Sidebar**
- **By Priority Tier**: Tier 1, Tier 2, Tier 3, Priority A, Priority B
- **By Research Cluster**: TWAIL, Climate Law/L&D, AI/Tech, Political Ecology, Investment/Chill, Climate Migration, Climate Litigation
- **By University**: Grouped alphabetically, with count badges
- **By Country/Region**: UK, Australia, Netherlands, USA, Canada, Germany, Hong Kong, Singapore, etc.
- **By Category**: Senior / Junior
- **By Email Status**: Confirmed ✓ / Needs Verification ⚠

#### 4. **Sort Options**
- By Name (A→Z, Z→A)
- By University QS Ranking
- By Priority Tier
- By Cluster

#### 5. **View Modes**
- **Card View** (default): Rich profile cards in responsive grid
- **Table View**: Compact spreadsheet-like view with all columns
- **List View**: Condensed list with key info

#### 6. **Professor Profile Cards** (Each card contains)
- Name, Title/Rank, University, QS Ranking
- Department/School
- Email (with status badge: ✓ Confirmed / ⚠ Verify)
- Research Areas
- Current Project
- **Recent Publications (3-4 key papers)** — extracted from all files
- Exact Match Point (why this professor matters)
- Contribution You Can Offer
- Supervision Vacancy status
- Priority Tier badge + Cluster tag
- Email Timing (Best Days, Local Time, BD Time)
- Profile URL (clickable)
- Expandable draft email section (where available)
- Time Zone info

#### 7. **University-Wise Category View**
- Group professors by university
- Show university metadata (QS rank, country, law school info)
- Structural gap warnings where applicable

#### 8. **Priority Dashboard**
- Super Standouts section (⭐⭐⭐)
- Email chronology / send order timeline
- Week-by-week send schedule

#### 9. **Interactive Features**
- Click to expand/collapse card details
- Copy email button for each professor
- "Mark as Contacted" toggle (localStorage persistence)
- Dark/Light mode toggle
- Export to CSV button
- Print-friendly mode

## Data Merging Strategy

Professors appearing in multiple files will be **merged** by name matching. The most detailed version of each field is kept. For example:
- `scholar_outreach.html` has draft emails → preserved
- `professor_match_matrix.html` has structured JSON → used as base
- `professor_priority_list.html` has tier ratings → merged in
- Batch dashboards have detailed card data → merged in

> [!IMPORTANT]
> The XLSX file cannot be parsed in a static HTML app without a library. All HTML file data will be extracted and hardcoded into a comprehensive JavaScript data array.

## Verification Plan

### Manual Verification
- Open the generated `index.html` in a browser
- Verify all professors are present with complete data
- Test all filters, search, sort, and view modes
- Test responsive layout on different screen sizes
- Verify all external links work

## Open Questions

> [!IMPORTANT]
> 1. **Professors from batches 4-12**: These files contain many more professors. Should I include ALL professors from every batch file (potentially 80-100+), or focus on a curated subset?
> 2. **Draft emails**: Should the draft email text be included in each professor's card (expandable section), or omitted for privacy?
> 3. **XLSX file**: The `scholars_dataset.xlsx` likely contains additional structured data. Since we can't parse it in a static HTML, should I skip it or try to install Node.js to extract data from it first?
