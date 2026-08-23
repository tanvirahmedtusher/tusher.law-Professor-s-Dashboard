# Scholarship & Study-Abroad Search Framework

A reference for how the Scholarship Desk dashboard finds, verifies, and tracks scholarships. Use this alongside the dashboard — it documents the rules the tool follows and the schema it fills in, so you can sanity-check any result yourself.

---

## 1. The seven-stage process

| Stage | What happens | Skip if... |
|---|---|---|
| **1. Country & course discovery** | Answer 7 questions on interests, budget, work rights, and destination openness. The tool returns a comparison table across 3–5 realistic countries and a reasoned top pick. | You already know your country and course. |
| **2. Profile intake** | 12 questions covering nationality, education, grades, target course/country/intake, funding needs, test scores, and extracurriculars. | Never — needed for accurate matching. |
| **3. Search** | The tool queries official government portals, university funding pages, and recognized scholarship bodies — never aggregator or repost sites. | — |
| **4. Verification & detail** | Every match is filled into the full data schema below and labeled **Strong / Possible / Not currently eligible**, with a note on what's confirmed vs. still needs checking. | — |
| **5. Dashboard** | Matches are sorted by (1) closest deadline, (2) eligibility strength, (3) funding coverage. | — |
| **6. Action plan** | A per-scholarship checklist, filtered to what actually applies (e.g. no "pay scholarship fee" step if there isn't one). | — |
| **7. Deadline tracking** | Calendar-ready reminder dates at 60/30/14/7/3 days out, plus fee due dates. Downloadable as `.ics` — the tool can't push live notifications. | — |
| **8. Exam readiness** | For each required test: official syllabus, a study plan working backward from your test date, and a place to log mock scores over time. | No tests required. |

---

## 2. Scholarship data schema

Every match is recorded with these fields. "Unknown" or "not officially specified" is a valid, expected value — the tool is instructed to say so rather than guess.

| Field | Captures |
|---|---|
| Name, Funding Body / Host | Official name only |
| Country, Eligible Course, Study Level | Masters / PhD / Both / etc. |
| Funding Type | Fully Funded / Full Tuition / Partial |
| What It Covers | Tuition, stipend, travel, insurance, accommodation |
| Funding Amount | Only if an official source states a figure |
| Academic Requirements, Age Restriction, Nationality Restriction | Eligibility gates |
| Required Tests, English-Language Requirement | e.g. IELTS 7.0+ |
| Required Documents | Checklist source |
| Open Date, Scholarship Deadline, Course/University Deadline | Kept separate — these are often different dates |
| Separate Scholarship Application? | Yes/No |
| Application Steps | Step-by-step |
| Application Fee | Flagged if unusual or hard to verify |
| Official Application URL, Official Source URL | Government/university domains only |
| Eligibility Match | Strong / Possible / Not currently eligible + reason |
| Priority Tier | See below |
| Needs Verification | Any field the tool wasn't fully confident in |
| Last Verified | Date the search ran |

## 3. Priority tiers

- **Tier 1** — Full funding, matches your study level, and eligibility is a strong match on nationality/academics/tests.
- **Tier 2** — Full funding and eligible, but open-field or with one or two requirements still to confirm.
- **Tier 3** — Partial funding, a level mismatch (e.g. Masters-only when you want a PhD), or a field restriction that narrows the fit.

*(The original brief also proposed tying tiers to a pre-existing list of confirmed supervisor contacts at specific universities — that only applies if you're separately tracking your own professor/supervisor list; the dashboard doesn't assume you have one.)*

## 4. Search methodology

1. **Government/national scholarships** (Chevening, Commonwealth, DAAD, Swiss Government Excellence, GKS, etc.) — searched on the funding body's own `.gov` or ministry domain, not aggregator posts.
2. **University-specific** (Clarendon, Gates Cambridge, Rhodes, Knight-Hennessy, etc.) — searched on the university's own graduate funding page.
3. **Cross-referencing** — if you're tracking your own list of contacts, professors, or target labs elsewhere, cross-check tied-university scholarships against it yourself; the dashboard surfaces the "tied to a specific university" flag so you can do that.
4. **Cycle verification** — deadlines are re-checked against the *current* application cycle each search, since many pages linger with a closed prior-year date.

## 5. Core rules the tool follows

1. Never guarantees selection, admission, or a test score.
2. Never invents a deadline, eligibility rule, funding figure, or test question.
3. Never labels something "fully funded" unless an official source confirms it.
4. Prioritizes primary/official sources and states when something was last checked.
5. Separates university admission from the scholarship application — they're often different processes with different deadlines.
6. Flags unusual or hard-to-verify application fees.
7. Never asks for passwords, PINs, OTPs, or documents it doesn't need.
8. Frames country/course guidance as decision support — you make the final call.
9. Links only to official exam-prep resources (British Council/IDP/IELTS.org, ETS, College Board, Pearson, MBA.com) — never fabricates practice questions.

## 6. Limits worth knowing

- Web search reduces but doesn't eliminate the chance of stale or misread information — **treat every "Official Application URL" as a starting point to verify yourself**, especially before paying any fee.
- The tool searches live each time you run it; it does not remember scholarships it hasn't re-verified in the current session.
- "Needs Verification" flags are the tool's own uncertainty markers — worth checking first.
- Reminders are calendar dates you download and keep, not push notifications.
