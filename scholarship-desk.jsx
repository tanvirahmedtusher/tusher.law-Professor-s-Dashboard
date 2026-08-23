import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Search, ChevronDown, ChevronRight, Check, X, AlertTriangle,
  Download, Plus, ExternalLink, Loader2, GraduationCap,
  ArrowRight, RotateCcw, Flag, BookOpen, Trash2, Compass,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

/* ============================================================
   CONSTANTS
============================================================ */

const EDUCATION_LEVELS = [
  "High school / Grade 12",
  "Bachelor's — in progress",
  "Bachelor's — completed",
  "Master's — in progress",
  "Master's — completed",
  "PhD — in progress",
  "PhD — completed",
  "Other",
];

const COST_ITEMS = ["Tuition", "Living expenses", "Accommodation", "Travel", "Insurance", "Visa support"];

const FUNDING_OPTIONS = [
  { value: "full", label: "Fully funded only" },
  { value: "partial", label: "Partial funding is fine" },
  { value: "either", label: "Either — show me everything" },
];

const VISA_IMPORTANCE = [
  { value: "low", label: "Not a priority" },
  { value: "medium", label: "Somewhat important" },
  { value: "high", label: "A dealbreaker" },
];

const STAGES = [
  { id: "discovery", label: "Discover" },
  { id: "profile", label: "Profile" },
  { id: "search", label: "Search" },
  { id: "dashboard", label: "Track" },
  { id: "examprep", label: "Prepare" },
];

const CHECKLIST_TEMPLATE = [
  { id: "course_eligibility", label: "Check course eligibility", when: () => true },
  { id: "admission_reqs", label: "Check university admission requirements", when: () => true },
  { id: "entrance_test", label: "Complete required entrance test(s)", when: (s) => (s.requiredTests || []).length > 0 },
  { id: "english_test", label: "Complete English-language test", when: (s) => !!s.englishRequirement && !/none/i.test(s.englishRequirement) },
  { id: "transcripts", label: "Prepare academic transcripts", when: () => true },
  { id: "cv", label: "Prepare CV / résumé", when: () => true },
  { id: "sop", label: "Draft personal statement / SOP", when: () => true },
  { id: "essays", label: "Prepare scholarship essays", when: (s) => !!s.separateApplicationRequired },
  { id: "recommendations", label: "Request recommendation letters", when: () => true },
  { id: "financial_docs", label: "Prepare financial documents", when: (s) => /partial/i.test(s.fundingType || "") },
  { id: "uni_fee", label: "Pay university application fee", when: () => true },
  { id: "schol_fee", label: "Pay scholarship application fee", when: (s) => s.applicationFee && !/none|n\/a|not required/i.test(s.applicationFee) },
  { id: "deposit", label: "Pay tuition deposit to hold your seat", when: () => true },
  { id: "visa_fee", label: "Pay visa fee", when: () => true },
  { id: "submit_uni", label: "Submit university application", when: () => true },
  { id: "submit_schol", label: "Submit scholarship application", when: (s) => !!s.separateApplicationRequired },
  { id: "verify", label: "Verify submission was received", when: () => true },
  { id: "track", label: "Track result / next stage", when: () => true },
];

const TEST_DOMAIN_HINTS = [
  { match: "ielts", hint: "britishcouncil.org, idp.com, or ielts.org" },
  { match: "toefl", hint: "ets.org" },
  { match: "gre", hint: "ets.org" },
  { match: "gmat", hint: "mba.com" },
  { match: "sat", hint: "collegeboard.org" },
  { match: "pte", hint: "pearsonpte.com" },
  { match: "neet", hint: "nta.ac.in" },
  { match: "ucat", hint: "ucat.ac.uk" },
];
function testDomainHint(name) {
  const n = (name || "").toLowerCase();
  const found = TEST_DOMAIN_HINTS.find((t) => n.includes(t.match));
  return found ? found.hint : "the official test administrator's website";
}

const STORAGE_KEYS = { intake: "intake", results: "results", checklist: "checklist", examprep: "examprep" };

/* ============================================================
   PURE HELPERS
============================================================ */

const cx = (...a) => a.filter(Boolean).join(" ");

function slugify(str) {
  return (str || "item").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "item";
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((d - today) / 86400000);
}

function formatDate(dateStr) {
  if (!dateStr || /unknown|not conf/i.test(dateStr)) return "Not confirmed";
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function extractJSON(raw) {
  if (!raw) return null;
  let t = raw.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();
  try {
    return JSON.parse(t);
  } catch (e) {
    /* fall through */
  }
  const firstObj = t.indexOf("{");
  const firstArr = t.indexOf("[");
  let start = -1, closeCh;
  if (firstObj === -1 && firstArr === -1) return null;
  if (firstArr === -1 || (firstObj !== -1 && firstObj < firstArr)) { start = firstObj; closeCh = "}"; }
  else { start = firstArr; closeCh = "]"; }
  const end = t.lastIndexOf(closeCh);
  if (end === -1 || end <= start) return null;
  try { return JSON.parse(t.slice(start, end + 1)); } catch (e) { return null; }
}

async function callClaude(system, userText, { search = false } = {}) {
  const body = {
    model: "claude-sonnet-4-6",
    max_tokens: 1000,
    system,
    messages: [{ role: "user", content: userText }],
  };
  if (search) body.tools = [{ type: "web_search_20250305", name: "web_search" }];
  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!resp.ok) throw new Error(`Request failed (${resp.status})`);
  const data = await resp.json();
  const text = (data.content || []).filter((b) => b && b.type === "text").map((b) => b.text).join("\n").trim();
  if (!text) throw new Error("Empty response from search");
  return text;
}

async function loadKey(key) {
  try {
    const r = await window.storage.get(key, false);
    return r ? JSON.parse(r.value) : null;
  } catch (e) {
    return null;
  }
}
async function saveKey(key, obj) {
  try { await window.storage.set(key, JSON.stringify(obj), false); } catch (e) { /* best effort */ }
}
async function deleteKey(key) {
  try { await window.storage.delete(key, false); } catch (e) { /* best effort */ }
}

function matchRank(m) {
  const s = (m || "").toUpperCase();
  if (s.includes("STRONG")) return 0;
  if (s.includes("POSSIBLE")) return 1;
  if (s.includes("NOT")) return 2;
  return 3;
}
function fundingRank(f) {
  const s = (f || "").toLowerCase();
  if (s.includes("full")) return 0;
  if (s.includes("partial")) return 1;
  return 2;
}
function sortScholarships(list) {
  return [...list].sort((a, b) => {
    const da = daysUntil(a.scholarshipDeadline);
    const db = daysUntil(b.scholarshipDeadline);
    const da2 = da === null || da < 0 ? Infinity : da;
    const db2 = db === null || db < 0 ? Infinity : db;
    if (da2 !== db2) return da2 - db2;
    const ma = matchRank(a.eligibilityMatch), mb = matchRank(b.eligibilityMatch);
    if (ma !== mb) return ma - mb;
    return fundingRank(a.fundingType) - fundingRank(b.fundingType);
  });
}

function matchTone(m) {
  const s = (m || "").toUpperCase();
  if (s.includes("STRONG")) return "verdigris";
  if (s.includes("POSSIBLE")) return "brass";
  if (s.includes("NOT")) return "rust";
  return "ink";
}

function buildProfileSummary(p) {
  const lines = [];
  if (p.nationality) lines.push(`Nationality: ${p.nationality}`);
  if (p.residence) lines.push(`Current country of residence: ${p.residence}`);
  if (p.educationLevel) lines.push(`Current education level: ${p.educationLevel}`);
  if (p.grades) lines.push(`Latest grades/GPA/CGPA: ${p.grades}`);
  if (p.course) lines.push(`Target course/degree: ${p.course}`);
  if (p.countries) lines.push(`Target countries: ${p.countries}`);
  if (p.intake) lines.push(`Target intake: ${p.intake}`);
  const fundingLabel = FUNDING_OPTIONS.find((f) => f.value === p.fundingPref)?.label || "Either";
  lines.push(`Funding needed: ${fundingLabel}`);
  if (p.costsCovered?.length) lines.push(`Costs that must be covered: ${p.costsCovered.join(", ")}`);
  if (p.testScores?.length) lines.push(`Existing test scores: ${p.testScores.map((t) => `${t.test} — ${t.score}`).join("; ")}`);
  lines.push(`Willing to take additional required tests: ${p.willingMoreTests ? "Yes" : "No"}`);
  if (p.extracurriculars) lines.push(`Extracurriculars / work / research / awards: ${p.extracurriculars}`);
  if (p.specialFactors) lines.push(`Special eligibility factors mentioned: ${p.specialFactors}`);
  return lines.join("\n");
}

function normalizeScholarship(parsed, candidate) {
  const name = parsed.name || candidate.name || "Untitled scholarship";
  return {
    id: `${slugify(name)}-${Math.random().toString(36).slice(2, 7)}`,
    name,
    org: parsed.org || candidate.org || "",
    country: parsed.country || candidate.country || "",
    eligibleCourse: parsed.eligibleCourse || "",
    studyLevel: parsed.studyLevel || "",
    fundingType: parsed.fundingType || "Unknown",
    covers: Array.isArray(parsed.covers) ? parsed.covers : [],
    fundingAmount: parsed.fundingAmount || "Not officially specified",
    academicRequirements: parsed.academicRequirements || "Not confirmed — verify on official page",
    ageRestriction: parsed.ageRestriction || "None specified",
    nationalityRestriction: parsed.nationalityRestriction || "Not confirmed — verify on official page",
    requiredTests: Array.isArray(parsed.requiredTests) ? parsed.requiredTests : [],
    englishRequirement: parsed.englishRequirement || "Not confirmed — verify on official page",
    requiredDocuments: Array.isArray(parsed.requiredDocuments) ? parsed.requiredDocuments : [],
    openDate: parsed.openDate || "Unknown",
    scholarshipDeadline: parsed.scholarshipDeadline || "Unknown",
    courseDeadline: parsed.courseDeadline || "Unknown",
    separateApplicationRequired: !!parsed.separateApplicationRequired,
    applicationSteps: Array.isArray(parsed.applicationSteps) ? parsed.applicationSteps : [],
    applicationFee: parsed.applicationFee || "Not confirmed",
    feeFlag: !!parsed.feeFlag,
    feeFlagNote: parsed.feeFlagNote || "",
    officialApplicationUrl: parsed.officialApplicationUrl || "",
    officialSourceUrl: parsed.officialSourceUrl || candidate.url || "",
    eligibilityMatch: parsed.eligibilityMatch || "POSSIBLE MATCH",
    eligibilityReason: parsed.eligibilityReason || "",
    priorityTier: [1, 2, 3].includes(parsed.priorityTier) ? parsed.priorityTier : 2,
    tierReason: parsed.tierReason || "",
    needsVerification: Array.isArray(parsed.needsVerification) ? parsed.needsVerification : [],
    lastVerified: new Date().toISOString().slice(0, 10),
  };
}

function buildReminders(s) {
  const items = [];
  const isKnown = (d) => d && !/unknown|not conf/i.test(d) && !isNaN(new Date(d + "T00:00:00").getTime());
  if (isKnown(s.openDate)) items.push({ label: "Application opens", date: s.openDate });
  const deadlines = [];
  if (isKnown(s.scholarshipDeadline)) deadlines.push({ label: "Scholarship deadline", date: s.scholarshipDeadline });
  if (isKnown(s.courseDeadline) && s.courseDeadline !== s.scholarshipDeadline) deadlines.push({ label: "Course/university deadline", date: s.courseDeadline });
  deadlines.forEach((df) => {
    [60, 30, 14, 7, 3].forEach((n) => {
      const d = new Date(df.date + "T00:00:00");
      d.setDate(d.getDate() - n);
      items.push({ label: `${n} days before ${df.label.toLowerCase()}`, date: d.toISOString().slice(0, 10) });
    });
    items.push({ label: `Final — ${df.label}`, date: df.date });
  });
  if (s.applicationFee && !/none|n\/a|not required|not confirmed/i.test(s.applicationFee) && deadlines[0]) {
    items.push({ label: "Fee typically due with application", date: deadlines[0].date });
  }
  const seen = new Set();
  return items
    .filter((it) => { const k = it.label + it.date; if (seen.has(k)) return false; seen.add(k); return true; })
    .sort((a, b) => new Date(a.date) - new Date(b.date));
}

function buildICS(events, calName) {
  const pad = (n) => String(n).padStart(2, "0");
  const now = new Date();
  const stamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Scholarship Desk//EN", `X-WR-CALNAME:${calName}`];
  events.forEach((e) => {
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${Math.random().toString(36).slice(2)}-${e.date.replace(/-/g, "")}@scholarshipdesk`);
    lines.push(`DTSTAMP:${stamp}`);
    lines.push(`DTSTART;VALUE=DATE:${e.date.replace(/-/g, "")}`);
    lines.push(`SUMMARY:${e.label.replace(/\r?\n/g, " ")}`);
    lines.push("END:VEVENT");
  });
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}
function downloadFile(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ============================================================
   PROMPTS
============================================================ */

const DISCOVERY_SYSTEM = `You are a study-abroad country and course matching assistant. Use web search to ground your answer in current tuition, living-cost, visa, and scholarship-availability information. Never invent figures — if you can't find a reliable one, write "not confirmed" for that value instead of guessing. Never guarantee any outcome. Do not narrate your search process. After searching, respond with ONLY a JSON object, no preamble, no markdown fences, matching exactly this shape:
{"countries":[{"country":"","avgTuition":"","avgLiving":"","postStudyWorkVisa":"","partTimeWorkHours":"","scholarshipAvailability":"","careerOutcomes":"","visaDifficulty":"","suggestedCourse":"","reasoning":""}]}
Include 3 to 5 realistic countries given the student's answers, ordered best-fit first. Keep every field to one short sentence.`;

const DISCOVERY_CANDIDATES_SYSTEM = `You are a scholarship discovery assistant for study-abroad students. Use web search across official government scholarship portals (e.g. Chevening, Commonwealth, DAAD, Fulbright, Swiss Government Excellence Scholarships, GKS, Erasmus Mundus) and official university graduate-funding pages — never aggregator or repost sites. Only surface scholarships that plausibly match the student's course, target countries, study level, and funding needs below. Do not narrate your search process. Respond with ONLY this JSON, no preamble, no fences, as compact as possible:
{"candidates":[{"name":"","org":"","country":"","url":"","whyRelevant":""}]}
Return 5 to 8 candidates, best-fit first. If genuinely fewer than 5 plausible matches exist, return fewer rather than padding the list.`;

const DETAIL_SYSTEM = `You are a scholarship verification assistant. Use web search to find CURRENT, OFFICIAL information only — a government portal, the university's own graduate-funding page, or the scholarship body's own site. Do not use aggregator, blog, forum, or repost sites as a source. Never invent a deadline, amount, or eligibility rule: if a field can't be confirmed from an official source, write "Not confirmed — verify on official page" (for text) or use an empty array / false (for structured fields), and list that field's name in needsVerification. Never call something "Fully Funded" unless an official source states it covers tuition and living costs. Do not narrate your search process. After searching, respond with ONLY this JSON object, no preamble, no markdown fences, as compact as possible:
{"name":"","org":"","country":"","eligibleCourse":"","studyLevel":"","fundingType":"Fully Funded | Full Tuition | Partial | Unknown","covers":[],"fundingAmount":"","academicRequirements":"","ageRestriction":"","nationalityRestriction":"","requiredTests":[],"englishRequirement":"","requiredDocuments":[],"openDate":"YYYY-MM-DD or Unknown","scholarshipDeadline":"YYYY-MM-DD or Unknown","courseDeadline":"YYYY-MM-DD or Unknown","separateApplicationRequired":true,"applicationSteps":[],"applicationFee":"","feeFlag":false,"feeFlagNote":"","officialApplicationUrl":"","officialSourceUrl":"","eligibilityMatch":"STRONG MATCH | POSSIBLE MATCH | NOT CURRENTLY ELIGIBLE","eligibilityReason":"","priorityTier":1,"tierReason":"","needsVerification":[]}
Determine eligibilityMatch and eligibilityReason by comparing the scholarship's actual, confirmed requirements to the student profile provided — be honest if something disqualifies them. Determine priorityTier: 1 = full funding and a strong match; 2 = full funding but only a possible match, or open-field; 3 = partial funding, wrong study level, or a weak match. Set feeFlag true only if an application fee is unusual, hard to verify, or inconsistent with how this type of scholarship normally works.`;

const TESTPLAN_SYSTEM = (testName) => `You are an exam-prep assistant. Use web search but link ONLY to official resources for this test: ${testDomainHint(testName)}. Never fabricate practice questions or claim a resource is official when it isn't. Do not narrate your search process. Respond with ONLY this JSON, no preamble, no fences, as compact as possible:
{"syllabus":[{"section":"","description":""}],"studyPlan":[{"week":"","milestone":""}],"officialLinks":[{"label":"","url":""}]}
Keep the syllabus to the real sections of the test. Keep the study plan to 4-8 weekly milestones working backward from the student's test date. Never guarantee a specific score outcome.`;

/* ============================================================
   SMALL UI ATOMS
============================================================ */

function Field({ label, hint, children }) {
  return (
    <div className="sd-field">
      <span className="sd-field-label">{label}</span>
      {children}
      {hint ? <span className="sd-field-hint">{hint}</span> : null}
    </div>
  );
}

function Stamp({ tone = "ink", children }) {
  return <span className={`sd-stamp tone-${tone}`}>{children}</span>;
}

function ProgressList({ items }) {
  if (!items.length) return null;
  return (
    <ul className="sd-progress">
      {items.map((it) => (
        <li key={it.id} className={`status-${it.status}`}>
          <span className="sd-progress-dot">
            {it.status === "done" ? <Check size={12} /> : it.status === "error" ? <X size={12} /> : it.status === "active" ? <Loader2 size={12} className="sd-spin" /> : null}
          </span>
          <span className="sd-progress-text">{it.label}</span>
          {it.note ? <span className="sd-progress-note">{it.note}</span> : null}
        </li>
      ))}
    </ul>
  );
}

function StepRail({ activeId }) {
  const activeIdx = STAGES.findIndex((s) => s.id === activeId);
  return (
    <div className="sd-rail" role="list">
      {STAGES.map((s, i) => (
        <div key={s.id} className={cx("sd-rail-item", i === activeIdx && "is-active", i < activeIdx && "is-done")}>
          <span className="sd-rail-num">{i < activeIdx ? <Check size={11} /> : i + 1}</span>
          <span className="sd-rail-label">{s.label}</span>
        </div>
      ))}
    </div>
  );
}

function ChecklistRow({ label, checked, onToggle }) {
  return (
    <button type="button" className={cx("sd-check-row", checked && "is-checked")} onClick={onToggle}>
      <span className="sd-check-box">{checked ? <Check size={13} /> : null}</span>
      <span className="sd-check-label">{label}</span>
    </button>
  );
}

function EmptyNote({ children }) {
  return <p className="sd-empty-note">{children}</p>;
}

/* ============================================================
   WELCOME STEP
============================================================ */

function WelcomeStep({ onKnowsCountry, onNeedsHelp, hasSavedProgress, onResume }) {
  return (
    <div className="sd-card sd-welcome">
      <div className="sd-seal"><GraduationCap size={22} /></div>
      <h1 className="sd-h1">Scholarship Desk</h1>
      <p className="sd-lede">
        A working desk for the study-abroad search: match a country and course, find scholarships that genuinely
        fit your profile, and track every deadline in one dossier — without needing a paid consultant for the
        basic research and organizing.
      </p>
      <p className="sd-fine">
        This runs live web searches through Anthropic's API each time you search, and labels every result Strong,
        Possible, or Not currently eligible. It never guarantees admission, a scholarship, or a test score — and
        anything it can't confirm officially is marked as such. Always verify a deadline or fee on the official
        page before you pay or submit documents.
      </p>
      {hasSavedProgress && (
        <button className="sd-btn sd-btn-ghost" onClick={onResume} style={{ marginBottom: 14 }}>
          <RotateCcw size={14} /> Resume where I left off
        </button>
      )}
      <div className="sd-welcome-actions">
        <button className="sd-btn" onClick={onKnowsCountry}>
          I know my country &amp; course <ArrowRight size={15} />
        </button>
        <button className="sd-btn sd-btn-ghost" onClick={onNeedsHelp}>
          <Compass size={15} /> Help me decide first
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   DISCOVERY STEP
============================================================ */

function DiscoveryStep({ initial, onSubmit, loading, error }) {
  const [a, setA] = useState(initial);
  const set = (k) => (e) => setA((prev) => ({ ...prev, [k]: e.target ? e.target.value : e }));

  return (
    <div className="sd-card">
      <p className="sd-eyebrow">Stage 1 · Country &amp; course discovery</p>
      <h2 className="sd-h2">Let's narrow the field</h2>
      <p className="sd-sub">Answer honestly — the comparison is only as useful as this is accurate. All fields optional but the more you give, the sharper the match.</p>

      <div className="sd-grid-2">
        <Field label="What subjects, industries, or career paths genuinely interest you?">
          <textarea className="sd-input sd-textarea" rows={2} value={a.interests} onChange={set("interests")} placeholder="e.g. renewable energy policy, UX design, public health" />
        </Field>
        <Field label="Do you have a specific course in mind?">
          <div className="sd-radio-row">
            <label><input type="radio" checked={a.hasCourseInMind === "yes"} onChange={() => setA((p) => ({ ...p, hasCourseInMind: "yes" }))} /> Yes</label>
            <label><input type="radio" checked={a.hasCourseInMind === "no"} onChange={() => setA((p) => ({ ...p, hasCourseInMind: "no" }))} /> Help me find one</label>
          </div>
          {a.hasCourseInMind === "yes" ? (
            <input className="sd-input" value={a.courseInMind} onChange={set("courseInMind")} placeholder="e.g. MSc Data Science" style={{ marginTop: 8 }} />
          ) : (
            <textarea className="sd-input sd-textarea" rows={2} value={a.strengths} onChange={set("strengths")} placeholder="What are you strong at / enjoy studying?" style={{ marginTop: 8 }} />
          )}
        </Field>
      </div>

      <div className="sd-grid-2">
        <Field label="Realistic total budget per year (tuition + living)">
          <div className="sd-input-inline">
            <select className="sd-input sd-input-sm" value={a.budgetCurrency} onChange={set("budgetCurrency")}>
              <option>USD</option><option>GBP</option><option>EUR</option><option>INR</option><option>CAD</option><option>AUD</option>
            </select>
            <input className="sd-input" value={a.budget} onChange={set("budget")} placeholder="e.g. 25,000" />
          </div>
        </Field>
        <Field label="Want or need to work part-time while studying?">
          <div className="sd-radio-row">
            <label><input type="radio" checked={a.workWhileStudy === "yes"} onChange={() => setA((p) => ({ ...p, workWhileStudy: "yes" }))} /> Yes</label>
            <label><input type="radio" checked={a.workWhileStudy === "no"} onChange={() => setA((p) => ({ ...p, workWhileStudy: "no" }))} /> No</label>
          </div>
          {a.workWhileStudy === "yes" && (
            <input className="sd-input" value={a.workHours} onChange={set("workHours")} placeholder="How many hrs/week ideally?" style={{ marginTop: 8 }} />
          )}
        </Field>
      </div>

      <div className="sd-grid-2">
        <Field label="How important is post-study work visa length?">
          <select className="sd-input" value={a.visaImportance} onChange={set("visaImportance")}>
            {VISA_IMPORTANCE.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}
          </select>
        </Field>
        <Field label="Open to less \u201cpopular\u201d destinations if the ROI is better?">
          <div className="sd-radio-row">
            <label><input type="radio" checked={a.openToLessPopular === "yes"} onChange={() => setA((p) => ({ ...p, openToLessPopular: "yes" }))} /> Yes, show me anything</label>
            <label><input type="radio" checked={a.openToLessPopular === "no"} onChange={() => setA((p) => ({ ...p, openToLessPopular: "no" }))} /> UK/US/Canada/Australia only</label>
          </div>
        </Field>
      </div>

      <Field label="Any preference on climate, culture, language of instruction, or an existing community/diaspora?" hint="Optional">
        <textarea className="sd-input sd-textarea" rows={2} value={a.preferences} onChange={set("preferences")} placeholder="e.g. English-taught only, prefer a South Asian community nearby" />
      </Field>

      {error && <p className="sd-error"><AlertTriangle size={14} /> {error}</p>}

      <div className="sd-actions-row">
        <button className="sd-btn" disabled={loading} onClick={() => onSubmit(a)}>
          {loading ? <><Loader2 size={15} className="sd-spin" /> Comparing countries…</> : <>Compare countries <ArrowRight size={15} /></>}
        </button>
      </div>
    </div>
  );
}

function DiscoveryResultsStep({ countries, onPick, onBack }) {
  const [picked, setPicked] = useState(null);
  return (
    <div className="sd-card">
      <p className="sd-eyebrow">Stage 1 · Comparison</p>
      <h2 className="sd-h2">Realistic shortlist</h2>
      <p className="sd-sub">Decision support, not a verdict — pick the one that fits, or go back and adjust your answers.</p>
      <div className="sd-table-wrap">
        <table className="sd-table">
          <thead>
            <tr>
              <th>Country</th><th>Avg tuition</th><th>Avg living</th><th>Work visa</th><th>Part-time work</th><th>Scholarships</th><th>Visa difficulty</th><th></th>
            </tr>
          </thead>
          <tbody>
            {countries.map((c, i) => (
              <tr key={i} className={cx(picked === i && "is-picked")}>
                <td className="sd-td-strong">{c.country}<div className="sd-td-sub">{c.suggestedCourse}</div></td>
                <td>{c.avgTuition}</td>
                <td>{c.avgLiving}</td>
                <td>{c.postStudyWorkVisa}</td>
                <td>{c.partTimeWorkHours}</td>
                <td>{c.scholarshipAvailability}</td>
                <td>{c.visaDifficulty}</td>
                <td><button className="sd-btn sd-btn-tiny" onClick={() => setPicked(i)}>{picked === i ? <Check size={13} /> : "Pick"}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {picked !== null && (
        <div className="sd-callout">
          <strong>{countries[picked].country} — {countries[picked].suggestedCourse}.</strong> {countries[picked].reasoning}
        </div>
      )}
      <div className="sd-actions-row">
        <button className="sd-btn sd-btn-ghost" onClick={onBack}>Back</button>
        <button className="sd-btn" disabled={picked === null} onClick={() => onPick(countries[picked])}>
          Use this pick <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   PROFILE STEP
============================================================ */

function ProfileStep({ initial, loading, onSubmit }) {
  const [p, setP] = useState(initial);
  const set = (k) => (e) => setP((prev) => ({ ...prev, [k]: e.target ? e.target.value : e }));
  const toggleCost = (item) => setP((prev) => ({
    ...prev,
    costsCovered: prev.costsCovered.includes(item) ? prev.costsCovered.filter((c) => c !== item) : [...prev.costsCovered, item],
  }));
  const updateTest = (i, field, val) => setP((prev) => {
    const rows = [...prev.testScores]; rows[i] = { ...rows[i], [field]: val }; return { ...prev, testScores: rows };
  });
  const addTest = () => setP((prev) => ({ ...prev, testScores: [...prev.testScores, { test: "", score: "" }] }));
  const removeTest = (i) => setP((prev) => ({ ...prev, testScores: prev.testScores.filter((_, idx) => idx !== i) }));

  const canSubmit = p.nationality.trim() && p.course.trim() && p.countries.trim();

  return (
    <div className="sd-card">
      <p className="sd-eyebrow">Stage 2 · Profile intake</p>
      <h2 className="sd-h2">Your file</h2>
      <p className="sd-sub">Nothing here is shared beyond finding your matches. Skip anything you're unsure of.</p>

      <p className="sd-section-label">I. Background</p>
      <div className="sd-grid-2">
        <Field label="Nationality *"><input className="sd-input" value={p.nationality} onChange={set("nationality")} placeholder="e.g. Indian" /></Field>
        <Field label="Current country of residence"><input className="sd-input" value={p.residence} onChange={set("residence")} placeholder="e.g. Bangladesh" /></Field>
        <Field label="Current education level">
          <select className="sd-input" value={p.educationLevel} onChange={set("educationLevel")}>
            <option value="">Select…</option>
            {EDUCATION_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </Field>
        <Field label="Latest grades / percentage / GPA / CGPA"><input className="sd-input" value={p.grades} onChange={set("grades")} placeholder="e.g. 8.6 CGPA, or 78%" /></Field>
      </div>

      <p className="sd-section-label">II. Target program</p>
      <div className="sd-grid-2">
        <Field label="Course or degree you want to study *"><input className="sd-input" value={p.course} onChange={set("course")} placeholder="e.g. MSc Data Science" /></Field>
        <Field label="Country/countries of interest *"><input className="sd-input" value={p.countries} onChange={set("countries")} placeholder="e.g. Germany, Netherlands" /></Field>
        <Field label="Target intake and year"><input className="sd-input" value={p.intake} onChange={set("intake")} placeholder="e.g. Fall 2027" /></Field>
      </div>

      <p className="sd-section-label">III. Funding needs</p>
      <Field label="Funding preference">
        <div className="sd-radio-row">
          {FUNDING_OPTIONS.map((f) => (
            <label key={f.value}><input type="radio" checked={p.fundingPref === f.value} onChange={() => setP((prev) => ({ ...prev, fundingPref: f.value }))} /> {f.label}</label>
          ))}
        </div>
      </Field>
      <Field label="What costs must be covered?">
        <div className="sd-checks">
          {COST_ITEMS.map((item) => (
            <button type="button" key={item} className={cx("sd-chip", p.costsCovered.includes(item) && "is-on")} onClick={() => toggleCost(item)}>{item}</button>
          ))}
        </div>
      </Field>

      <p className="sd-section-label">IV. Preparation &amp; profile</p>
      <Field label="Existing test scores">
        <div className="sd-test-rows">
          {p.testScores.map((row, i) => (
            <div className="sd-test-row" key={i}>
              <input className="sd-input" placeholder="Test (e.g. IELTS)" value={row.test} onChange={(e) => updateTest(i, "test", e.target.value)} />
              <input className="sd-input" placeholder="Score" value={row.score} onChange={(e) => updateTest(i, "score", e.target.value)} />
              <button type="button" className="sd-icon-btn" onClick={() => removeTest(i)}><Trash2 size={14} /></button>
            </div>
          ))}
          <button type="button" className="sd-btn sd-btn-ghost sd-btn-tiny" onClick={addTest}><Plus size={13} /> Add a test score</button>
        </div>
      </Field>
      <Field label="Willing to take required tests you haven't taken yet?">
        <div className="sd-radio-row">
          <label><input type="radio" checked={p.willingMoreTests === true} onChange={() => setP((prev) => ({ ...prev, willingMoreTests: true }))} /> Yes</label>
          <label><input type="radio" checked={p.willingMoreTests === false} onChange={() => setP((prev) => ({ ...prev, willingMoreTests: false }))} /> No</label>
        </div>
      </Field>
      <Field label="Extracurriculars, leadership, volunteering, work experience, research, awards" hint="Optional">
        <textarea className="sd-input sd-textarea" rows={3} value={p.extracurriculars} onChange={set("extracurriculars")} placeholder="Whatever you'd put in a CV" />
      </Field>
      <Field label="Any special eligibility factors" hint="Optional — e.g. first-generation student, regional quota, a documented circumstance a scholarship specifically accounts for">
        <textarea className="sd-input sd-textarea" rows={2} value={p.specialFactors} onChange={set("specialFactors")} />
      </Field>

      <div className="sd-actions-row">
        <button className="sd-btn" disabled={!canSubmit || loading} onClick={() => onSubmit(p)}>
          {loading ? <><Loader2 size={15} className="sd-spin" /> Working…</> : <>Find scholarships <Search size={15} /></>}
        </button>
        {!canSubmit && <span className="sd-fine">Nationality, course, and target countries are needed to search.</span>}
      </div>
    </div>
  );
}

/* ============================================================
   SCHOLARSHIP CARD
============================================================ */

function ScholarshipCard({ s, checklist, onToggleCheck }) {
  const [open, setOpen] = useState(false);
  const days = daysUntil(s.scholarshipDeadline);
  const reminders = useMemo(() => buildReminders(s), [s]);
  const items = CHECKLIST_TEMPLATE.filter((c) => c.when(s));
  const doneCount = items.filter((c) => checklist?.[c.id]).length;

  const countdownTone = days === null ? "" : days < 0 ? "muted" : days <= 7 ? "rust" : days <= 30 ? "brass" : "verdigris";

  return (
    <div className={cx("sd-schol-card", open && "is-open")}>
      <button type="button" className="sd-schol-head" onClick={() => setOpen((o) => !o)}>
        <div className="sd-schol-head-left">
          <Stamp tone={matchTone(s.eligibilityMatch)}>{s.eligibilityMatch}</Stamp>
          <div>
            <h3 className="sd-schol-name">{s.name}</h3>
            <p className="sd-schol-sub">{s.org} · {s.country}{s.eligibleCourse ? ` · ${s.eligibleCourse}` : ""}</p>
          </div>
        </div>
        <div className="sd-schol-head-right">
          <span className="sd-funding-badge">{s.fundingType}</span>
          <div className={cx("sd-countdown", countdownTone && `tone-${countdownTone}`)}>
            <span className="sd-countdown-num">{days === null ? "—" : days < 0 ? "past" : days}</span>
            <span className="sd-countdown-label">{days === null ? "no date" : days < 0 ? "deadline" : "days left"}</span>
          </div>
          {open ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </div>
      </button>

      {open && (
        <div className="sd-schol-body">
          {s.feeFlag && (
            <div className="sd-fee-flag"><Flag size={14} /> <span>Unusual or unclear application fee. {s.feeFlagNote || "Verify carefully on the official page before paying anything."}</span></div>
          )}
          {s.eligibilityReason && <p className="sd-callout sd-callout-quiet">{s.eligibilityReason}</p>}

          <div className="sd-def-grid">
            <div><span className="sd-def-label">Study level</span>{s.studyLevel || "Not confirmed"}</div>
            <div><span className="sd-def-label">Priority tier</span>Tier {s.priorityTier}{s.tierReason ? ` — ${s.tierReason}` : ""}</div>
            <div><span className="sd-def-label">Covers</span>{s.covers.length ? s.covers.join(", ") : "Not confirmed"}</div>
            <div><span className="sd-def-label">Funding amount</span>{s.fundingAmount}</div>
            <div><span className="sd-def-label">Academic requirements</span>{s.academicRequirements}</div>
            <div><span className="sd-def-label">Age restriction</span>{s.ageRestriction}</div>
            <div><span className="sd-def-label">Nationality restriction</span>{s.nationalityRestriction}</div>
            <div><span className="sd-def-label">Required tests</span>{s.requiredTests.length ? s.requiredTests.join(", ") : "None listed"}</div>
            <div><span className="sd-def-label">English requirement</span>{s.englishRequirement}</div>
            <div><span className="sd-def-label">Application opens</span>{formatDate(s.openDate)}</div>
            <div><span className="sd-def-label">Scholarship deadline</span>{formatDate(s.scholarshipDeadline)}</div>
            <div><span className="sd-def-label">Course/university deadline</span>{formatDate(s.courseDeadline)}</div>
            <div><span className="sd-def-label">Separate scholarship application?</span>{s.separateApplicationRequired ? "Yes" : "No"}</div>
            <div><span className="sd-def-label">Application fee</span>{s.applicationFee}</div>
            <div><span className="sd-def-label">Last verified</span>{formatDate(s.lastVerified)}</div>
          </div>

          {s.requiredDocuments.length > 0 && (
            <div className="sd-subsection">
              <p className="sd-def-label">Required documents</p>
              <ul className="sd-bullet-list">{s.requiredDocuments.map((d, i) => <li key={i}>{d}</li>)}</ul>
            </div>
          )}

          {s.applicationSteps.length > 0 && (
            <div className="sd-subsection">
              <p className="sd-def-label">Application process</p>
              <ol className="sd-num-list">{s.applicationSteps.map((step, i) => <li key={i}>{step}</li>)}</ol>
            </div>
          )}

          <div className="sd-links-row">
            {s.officialApplicationUrl && <a className="sd-btn sd-btn-ghost sd-btn-tiny" href={s.officialApplicationUrl} target="_blank" rel="noreferrer">Application page <ExternalLink size={12} /></a>}
            {s.officialSourceUrl && <a className="sd-btn sd-btn-ghost sd-btn-tiny" href={s.officialSourceUrl} target="_blank" rel="noreferrer">Official source <ExternalLink size={12} /></a>}
          </div>
          {(s.officialApplicationUrl || s.officialSourceUrl) && (
            <p className="sd-fine">Confirm this is the funding body's own domain before entering any personal or payment details.</p>
          )}

          {s.needsVerification.length > 0 && (
            <p className="sd-verify-note"><AlertTriangle size={13} /> Needs verification: {s.needsVerification.join(", ")}</p>
          )}

          <div className="sd-two-col">
            <div className="sd-subsection">
              <p className="sd-def-label">Action checklist — {doneCount}/{items.length}</p>
              <div className="sd-checklist">
                {items.map((c) => (
                  <ChecklistRow key={c.id} label={c.label} checked={!!checklist?.[c.id]} onToggle={() => onToggleCheck(s.id, c.id)} />
                ))}
              </div>
            </div>
            <div className="sd-subsection">
              <p className="sd-def-label">Reminders</p>
              {reminders.length ? (
                <ul className="sd-reminder-list">
                  {reminders.map((r, i) => {
                    const d = daysUntil(r.date);
                    return (
                      <li key={i} className={cx(d !== null && d < 0 && "is-past")}>
                        <span className="sd-reminder-date">{formatDate(r.date)}</span>
                        <span>{r.label}</span>
                      </li>
                    );
                  })}
                </ul>
              ) : <EmptyNote>No confirmed dates yet — check the official page.</EmptyNote>}
              {reminders.some((r) => daysUntil(r.date) >= 0) && (
                <button className="sd-btn sd-btn-ghost sd-btn-tiny" onClick={() => downloadFile(`${slugify(s.name)}-reminders.ics`, buildICS(reminders.filter((r) => daysUntil(r.date) >= 0).map((r) => ({ ...r, label: `${s.name}: ${r.label}` })), s.name), "text/calendar")}>
                  <Download size={13} /> Add to calendar (.ics)
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   DASHBOARD TAB
============================================================ */

function DashboardTab({ scholarships, isSearching, progress, checklist, onToggleCheck, searchedAt }) {
  const [fundingFilter, setFundingFilter] = useState("all");
  const [matchFilter, setMatchFilter] = useState("all");
  const [q, setQ] = useState("");

  const filtered = scholarships.filter((s) => {
    if (fundingFilter !== "all" && fundingRank(s.fundingType) !== fundingRank(fundingFilter)) return false;
    if (matchFilter !== "all" && matchTone(s.eligibilityMatch) !== matchFilter) return false;
    if (q.trim() && !`${s.name} ${s.country} ${s.eligibleCourse} ${s.org}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  const stats = useMemo(() => {
    const strong = scholarships.filter((s) => matchRank(s.eligibilityMatch) === 0).length;
    const possible = scholarships.filter((s) => matchRank(s.eligibilityMatch) === 1).length;
    const nearest = scholarships.map((s) => daysUntil(s.scholarshipDeadline)).filter((d) => d !== null && d >= 0).sort((a, b) => a - b)[0];
    return { strong, possible, total: scholarships.length, nearest };
  }, [scholarships]);

  return (
    <div>
      {isSearching && (
        <div className="sd-card sd-progress-card">
          <p className="sd-eyebrow">Searching official sources…</p>
          <ProgressList items={progress} />
        </div>
      )}

      {!isSearching && scholarships.length === 0 ? (
        <div className="sd-card">
          <EmptyNote>No matches yet. If a search just ran and came up empty, try widening your countries of interest or funding preference on the profile step.</EmptyNote>
        </div>
      ) : scholarships.length > 0 && (
        <>
          <div className="sd-stats-row">
            <div className="sd-stat"><span className="sd-stat-num">{stats.total}</span><span>tracked</span></div>
            <div className="sd-stat tone-verdigris"><span className="sd-stat-num">{stats.strong}</span><span>strong match</span></div>
            <div className="sd-stat tone-brass"><span className="sd-stat-num">{stats.possible}</span><span>possible</span></div>
            {stats.nearest !== undefined && <div className="sd-stat tone-rust"><span className="sd-stat-num">{stats.nearest}</span><span>days to nearest deadline</span></div>}
            {searchedAt && <span className="sd-fine sd-searched-at">Last searched {new Date(searchedAt).toLocaleString()}</span>}
          </div>

          <div className="sd-filter-row">
            <input className="sd-input" placeholder="Search name, country, course…" value={q} onChange={(e) => setQ(e.target.value)} />
            <select className="sd-input" value={fundingFilter} onChange={(e) => setFundingFilter(e.target.value)}>
              <option value="all">All funding types</option>
              <option value="Full">Fully funded / full tuition</option>
              <option value="Partial">Partial</option>
            </select>
            <select className="sd-input" value={matchFilter} onChange={(e) => setMatchFilter(e.target.value)}>
              <option value="all">All matches</option>
              <option value="verdigris">Strong match</option>
              <option value="brass">Possible match</option>
              <option value="rust">Not currently eligible</option>
            </select>
          </div>

          <div className="sd-schol-list">
            {filtered.map((s) => (
              <ScholarshipCard key={s.id} s={s} checklist={checklist[s.id]} onToggleCheck={onToggleCheck} />
            ))}
            {filtered.length === 0 && <EmptyNote>Nothing matches those filters.</EmptyNote>}
          </div>
        </>
      )}
    </div>
  );
}

/* ============================================================
   EXAM PREP TAB
============================================================ */

function ExamPrepTab({ tests, setTests, scholarships }) {
  const suggested = useMemo(() => {
    const have = new Set(tests.map((t) => t.name.toLowerCase()));
    const found = new Set();
    scholarships.forEach((s) => (s.requiredTests || []).forEach((rt) => {
      const short = rt.split(/[\s\d]/)[0];
      if (short && short.length > 2 && !have.has(short.toLowerCase())) found.add(short);
    }));
    return [...found].slice(0, 6);
  }, [tests, scholarships]);

  const addTest = (name) => setTests((prev) => [...prev, { id: `${slugify(name)}-${Math.random().toString(36).slice(2, 6)}`, name, current: "", target: "", testDate: "", regDeadline: "", plan: null, planLoading: false, planError: null, mockScores: [] }]);
  const updateTest = (id, patch) => setTests((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  const removeTest = (id) => setTests((prev) => prev.filter((t) => t.id !== id));

  const timeline = useMemo(() => {
    const rows = [];
    tests.forEach((t) => {
      if (t.testDate) rows.push({ label: `${t.name} test date`, date: t.testDate, type: "test" });
      if (t.regDeadline) rows.push({ label: `${t.name} registration deadline`, date: t.regDeadline, type: "test" });
    });
    scholarships.forEach((s) => {
      const d = daysUntil(s.scholarshipDeadline);
      if (d !== null && d >= 0) rows.push({ label: `${s.name} deadline`, date: s.scholarshipDeadline, type: "scholarship" });
    });
    return rows.filter((r) => daysUntil(r.date) !== null).sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 12);
  }, [tests, scholarships]);

  return (
    <div>
      <div className="sd-card">
        <p className="sd-eyebrow">Stage 8 · Exam readiness</p>
        <h2 className="sd-h2">Test tracker</h2>
        <p className="sd-sub">One panel per test — target score, study plan from official sources only, and a place to log mock results.</p>

        {tests.length === 0 && <EmptyNote>No tests added yet. Add one below, or from the suggestions found in your scholarship matches.</EmptyNote>}

        {suggested.length > 0 && (
          <div className="sd-subsection">
            <p className="sd-def-label">Mentioned in your scholarship matches</p>
            <div className="sd-checks">
              {suggested.map((name) => (
                <button key={name} type="button" className="sd-chip" onClick={() => addTest(name)}><Plus size={12} /> {name}</button>
              ))}
            </div>
          </div>
        )}

        <AddTestRow onAdd={addTest} />
      </div>

      {tests.map((t) => (
        <TestPanel key={t.id} t={t} onUpdate={(patch) => updateTest(t.id, patch)} onRemove={() => removeTest(t.id)} />
      ))}

      {timeline.length > 0 && (
        <div className="sd-card">
          <p className="sd-eyebrow">Cross-check</p>
          <h2 className="sd-h2">Combined timeline</h2>
          <ul className="sd-timeline">
            {timeline.map((r, i) => {
              const d = daysUntil(r.date);
              return (
                <li key={i} className={cx("sd-timeline-item", `type-${r.type}`)}>
                  <span className="sd-timeline-dot" />
                  <span className="sd-timeline-date">{formatDate(r.date)}</span>
                  <span className="sd-timeline-label">{r.label}</span>
                  <span className="sd-timeline-days">{d}d</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

function AddTestRow({ onAdd }) {
  const [name, setName] = useState("");
  return (
    <div className="sd-test-row" style={{ marginTop: 12 }}>
      <input className="sd-input" placeholder="Add a test (e.g. GRE)" value={name} onChange={(e) => setName(e.target.value)} />
      <button type="button" className="sd-btn sd-btn-ghost sd-btn-tiny" onClick={() => { if (name.trim()) { onAdd(name.trim()); setName(""); } }}>
        <Plus size={13} /> Add
      </button>
    </div>
  );
}

function TestPanel({ t, onUpdate, onRemove }) {
  const [scoreDate, setScoreDate] = useState("");
  const [scoreVal, setScoreVal] = useState("");

  const fetchPlan = async () => {
    onUpdate({ planLoading: true, planError: null });
    try {
      const userText = `Test: ${t.name}\nCurrent score: ${t.current || "not taken yet"}\nTarget score: ${t.target || "not set"}\nTest date: ${t.testDate || "not set"}`;
      const raw = await callClaude(TESTPLAN_SYSTEM(t.name), userText, { search: true });
      const parsed = extractJSON(raw);
      if (!parsed) throw new Error("Could not read the study plan back — try again.");
      onUpdate({ plan: parsed, planLoading: false });
    } catch (e) {
      onUpdate({ planLoading: false, planError: e.message || "Something went wrong fetching the plan." });
    }
  };

  const addScore = () => {
    if (!scoreDate || !scoreVal) return;
    onUpdate({ mockScores: [...t.mockScores, { date: scoreDate, score: Number(scoreVal) }].sort((a, b) => new Date(a.date) - new Date(b.date)) });
    setScoreDate(""); setScoreVal("");
  };
  const removeScore = (i) => onUpdate({ mockScores: t.mockScores.filter((_, idx) => idx !== i) });

  return (
    <div className="sd-card">
      <div className="sd-test-panel-head">
        <h3 className="sd-h3">{t.name}</h3>
        <button className="sd-icon-btn" onClick={onRemove}><Trash2 size={14} /></button>
      </div>
      <div className="sd-grid-2">
        <Field label="Current score"><input className="sd-input" value={t.current} onChange={(e) => onUpdate({ current: e.target.value })} /></Field>
        <Field label="Target score"><input className="sd-input" value={t.target} onChange={(e) => onUpdate({ target: e.target.value })} /></Field>
        <Field label="Test date"><input className="sd-input" type="date" value={t.testDate} onChange={(e) => onUpdate({ testDate: e.target.value })} /></Field>
        <Field label="Registration deadline / booking window"><input className="sd-input" type="date" value={t.regDeadline} onChange={(e) => onUpdate({ regDeadline: e.target.value })} /></Field>
      </div>

      <div className="sd-actions-row">
        <button className="sd-btn sd-btn-ghost sd-btn-tiny" disabled={t.planLoading} onClick={fetchPlan}>
          {t.planLoading ? <><Loader2 size={13} className="sd-spin" /> Fetching…</> : <><BookOpen size={13} /> {t.plan ? "Refresh study plan" : "Get study plan"}</>}
        </button>
      </div>
      {t.planError && <p className="sd-error"><AlertTriangle size={14} /> {t.planError}</p>}

      {t.plan && (
        <div className="sd-two-col" style={{ marginTop: 10 }}>
          <div className="sd-subsection">
            <p className="sd-def-label">Syllabus</p>
            <ul className="sd-bullet-list">
              {(t.plan.syllabus || []).map((s, i) => <li key={i}><strong>{s.section}</strong> — {s.description}</li>)}
            </ul>
          </div>
          <div className="sd-subsection">
            <p className="sd-def-label">Study plan</p>
            <ol className="sd-num-list">
              {(t.plan.studyPlan || []).map((s, i) => <li key={i}><strong>{s.week}:</strong> {s.milestone}</li>)}
            </ol>
          </div>
        </div>
      )}
      {t.plan?.officialLinks?.length > 0 && (
        <div className="sd-links-row">
          {t.plan.officialLinks.map((l, i) => <a key={i} className="sd-btn sd-btn-ghost sd-btn-tiny" href={l.url} target="_blank" rel="noreferrer">{l.label} <ExternalLink size={12} /></a>)}
        </div>
      )}

      <div className="sd-subsection">
        <p className="sd-def-label">Mock score log</p>
        <div className="sd-test-row">
          <input className="sd-input" type="date" value={scoreDate} onChange={(e) => setScoreDate(e.target.value)} />
          <input className="sd-input" type="number" placeholder="Score" value={scoreVal} onChange={(e) => setScoreVal(e.target.value)} />
          <button type="button" className="sd-btn sd-btn-ghost sd-btn-tiny" onClick={addScore}><Plus size={13} /> Log</button>
        </div>
        {t.mockScores.length > 1 && (
          <div className="sd-chart-wrap">
            <ResponsiveContainer width="100%" height={140}>
              <LineChart data={t.mockScores}>
                <CartesianGrid stroke="rgba(20,33,58,0.12)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#5B5240" }} tickFormatter={(d) => formatDate(d)} />
                <YAxis tick={{ fontSize: 11, fill: "#5B5240" }} width={30} />
                <Tooltip labelFormatter={(d) => formatDate(d)} />
                <Line type="monotone" dataKey="score" stroke="#4C7A73" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        {t.mockScores.length > 0 && (
          <ul className="sd-reminder-list">
            {t.mockScores.map((m, i) => (
              <li key={i}><span className="sd-reminder-date">{formatDate(m.date)}</span><span>{m.score}</span>
                <button className="sd-icon-btn" onClick={() => removeScore(i)}><X size={12} /></button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   APP
============================================================ */

const DEFAULT_DISCOVERY = { interests: "", hasCourseInMind: "no", courseInMind: "", strengths: "", budget: "", budgetCurrency: "USD", workWhileStudy: "no", workHours: "", visaImportance: "medium", openToLessPopular: "yes", preferences: "" };
const DEFAULT_PROFILE = { nationality: "", residence: "", educationLevel: "", grades: "", course: "", countries: "", intake: "", fundingPref: "either", costsCovered: [], testScores: [], willingMoreTests: true, extracurriculars: "", specialFactors: "" };

export default function ScholarshipDesk() {
  const [phase, setPhase] = useState("welcome"); // welcome | discovery | discoveryResults | profile | workspace
  const [tab, setTab] = useState("dashboard"); // dashboard | examprep
  const [hydrated, setHydrated] = useState(false);
  const [hasSavedProgress, setHasSavedProgress] = useState(false);

  const [discoveryAnswers, setDiscoveryAnswers] = useState(DEFAULT_DISCOVERY);
  const [discoveryLoading, setDiscoveryLoading] = useState(false);
  const [discoveryError, setDiscoveryError] = useState(null);
  const [countryOptions, setCountryOptions] = useState([]);

  const [profile, setProfile] = useState(DEFAULT_PROFILE);

  const [scholarships, setScholarships] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [progress, setProgress] = useState([]);
  const [searchedAt, setSearchedAt] = useState(null);
  const [checklist, setChecklist] = useState({});
  const [tests, setTests] = useState([]);

  const checklistHydrated = useRef(false);
  const testsHydrated = useRef(false);
  const savedIntakeRef = useRef(null);

  // Hydrate from storage on mount
  useEffect(() => {
    (async () => {
      const [intake, results, cl, ep] = await Promise.all([
        loadKey(STORAGE_KEYS.intake), loadKey(STORAGE_KEYS.results), loadKey(STORAGE_KEYS.checklist), loadKey(STORAGE_KEYS.examprep),
      ]);
      if (intake) {
        savedIntakeRef.current = intake;
        if (intake.discoveryAnswers) setDiscoveryAnswers(intake.discoveryAnswers);
        if (intake.countryOptions) setCountryOptions(intake.countryOptions);
        if (intake.profile) setProfile(intake.profile);
      }
      if (results?.scholarships?.length) {
        setScholarships(results.scholarships);
        setSearchedAt(results.searchedAt || null);
        setHasSavedProgress(true);
      }
      if (cl) setChecklist(cl);
      if (ep?.tests) setTests(ep.tests);
      checklistHydrated.current = true;
      testsHydrated.current = true;
      setHydrated(true);
    })();
  }, []);

  useEffect(() => { if (checklistHydrated.current) saveKey(STORAGE_KEYS.checklist, checklist); }, [checklist]);
  useEffect(() => {
    if (!testsHydrated.current) return;
    const timer = setTimeout(() => saveKey(STORAGE_KEYS.examprep, { tests }), 700);
    return () => clearTimeout(timer);
  }, [tests]);

  const resumeSaved = () => setPhase("workspace");

  const runDiscovery = async (answers) => {
    setDiscoveryAnswers(answers);
    setDiscoveryLoading(true);
    setDiscoveryError(null);
    const summary = [
      answers.interests && `Interests: ${answers.interests}`,
      answers.hasCourseInMind === "yes" ? `Has a course in mind: ${answers.courseInMind}` : `Needs course suggestions. Strengths/interests: ${answers.strengths}`,
      answers.budget && `Budget per year: ${answers.budget} ${answers.budgetCurrency}`,
      `Wants to work part-time while studying: ${answers.workWhileStudy}${answers.workHours ? ` (~${answers.workHours} hrs/week)` : ""}`,
      `Importance of post-study work visa length: ${answers.visaImportance}`,
      answers.preferences && `Preferences: ${answers.preferences}`,
      `Open to less popular destinations: ${answers.openToLessPopular}`,
    ].filter(Boolean).join("\n");
    try {
      const raw = await callClaude(DISCOVERY_SYSTEM, summary, { search: true });
      const parsed = extractJSON(raw);
      const list = parsed && Array.isArray(parsed.countries) ? parsed.countries : [];
      if (!list.length) throw new Error("Couldn't produce a comparison — try adding a bit more detail.");
      setCountryOptions(list);
      saveKey(STORAGE_KEYS.intake, { discoveryAnswers: answers, countryOptions: list, profile });
      setPhase("discoveryResults");
    } catch (e) {
      setDiscoveryError(e.message || "Something went wrong. Try again.");
    } finally {
      setDiscoveryLoading(false);
    }
  };

  const pickCountry = (c) => {
    setProfile((prev) => ({ ...prev, course: c.suggestedCourse || prev.course, countries: c.country }));
    setPhase("profile");
  };

  const runSearch = useCallback(async (p) => {
    setProfile(p);
    saveKey(STORAGE_KEYS.intake, { discoveryAnswers, countryOptions, profile: p });
    setScholarships([]);
    setIsSearching(true);
    setSearchedAt(null);
    setPhase("workspace");
    setTab("dashboard");
    setProgress([{ id: "discover", label: "Searching official portals for candidate scholarships", status: "active" }]);

    let candidates = [];
    try {
      const raw = await callClaude(DISCOVERY_CANDIDATES_SYSTEM, buildProfileSummary(p), { search: true });
      const parsed = extractJSON(raw);
      candidates = parsed && Array.isArray(parsed.candidates) ? parsed.candidates.slice(0, 8) : [];
    } catch (e) {
      setProgress((prev) => prev.map((it) => (it.id === "discover" ? { ...it, status: "error", note: e.message } : it)));
      setIsSearching(false);
      return;
    }

    setProgress((prev) => [
      ...prev.map((it) => (it.id === "discover" ? { ...it, status: "done" } : it)),
      ...candidates.map((c, i) => ({ id: `c${i}`, label: `Verifying ${c.name}`, status: "pending" })),
    ]);

    if (!candidates.length) {
      setIsSearching(false);
      return;
    }

    const results = [];
    for (let i = 0; i < candidates.length; i++) {
      const c = candidates[i];
      setProgress((prev) => prev.map((it) => (it.id === `c${i}` ? { ...it, status: "active" } : it)));
      try {
        const userText = `Scholarship to verify: ${c.name} (${c.org || "org unknown"}), ${c.country || ""}.${c.url ? ` Reference URL: ${c.url}` : ""}\n\nStudent profile:\n${buildProfileSummary(p)}`;
        const raw = await callClaude(DETAIL_SYSTEM, userText, { search: true });
        const parsed = extractJSON(raw);
        if (parsed && parsed.name) {
          const record = normalizeScholarship(parsed, c);
          results.push(record);
          setScholarships((prev) => sortScholarships([...prev, record]));
          setProgress((prev) => prev.map((it) => (it.id === `c${i}` ? { ...it, status: "done" } : it)));
        } else {
          setProgress((prev) => prev.map((it) => (it.id === `c${i}` ? { ...it, status: "error", note: "Couldn't verify details" } : it)));
        }
      } catch (e) {
        setProgress((prev) => prev.map((it) => (it.id === `c${i}` ? { ...it, status: "error", note: e.message } : it)));
      }
    }
    setIsSearching(false);
    const now = new Date().toISOString();
    setSearchedAt(now);
    saveKey(STORAGE_KEYS.results, { scholarships: sortScholarships(results), searchedAt: now });
  }, [discoveryAnswers, countryOptions]);

  const toggleCheck = (scholarshipId, itemId) => {
    setChecklist((prev) => ({ ...prev, [scholarshipId]: { ...prev[scholarshipId], [itemId]: !prev[scholarshipId]?.[itemId] } }));
  };

  const resetAll = async () => {
    setPhase("welcome"); setTab("dashboard");
    setDiscoveryAnswers(DEFAULT_DISCOVERY); setCountryOptions([]); setDiscoveryError(null);
    setProfile(DEFAULT_PROFILE);
    setScholarships([]); setIsSearching(false); setProgress([]); setSearchedAt(null); setChecklist({}); setTests([]);
    setHasSavedProgress(false);
    await Promise.all(Object.values(STORAGE_KEYS).map(deleteKey));
  };

  const activeStageId = phase === "welcome" ? "discovery"
    : phase === "discovery" || phase === "discoveryResults" ? "discovery"
    : phase === "profile" ? "profile"
    : isSearching ? "search"
    : tab === "examprep" ? "examprep" : "dashboard";

  return (
    <div className="sd-app">
      <GlobalStyles />
      <div className="sd-shell">
        <header className="sd-header">
          <div className="sd-header-brand">
            <span className="sd-seal-sm"><GraduationCap size={16} /></span>
            <span className="sd-header-title">Scholarship Desk</span>
          </div>
          {phase !== "welcome" && (
            <button className="sd-btn sd-btn-ghost sd-btn-tiny" onClick={resetAll}><RotateCcw size={13} /> Start over</button>
          )}
        </header>

        {phase !== "welcome" && <StepRail activeId={activeStageId} />}

        {!hydrated ? null : (
          <>
            {phase === "welcome" && (
              <WelcomeStep
                onKnowsCountry={() => setPhase("profile")}
                onNeedsHelp={() => setPhase("discovery")}
                hasSavedProgress={hasSavedProgress}
                onResume={resumeSaved}
              />
            )}

            {phase === "discovery" && (
              <DiscoveryStep initial={discoveryAnswers} onSubmit={runDiscovery} loading={discoveryLoading} error={discoveryError} />
            )}

            {phase === "discoveryResults" && (
              <DiscoveryResultsStep countries={countryOptions} onPick={pickCountry} onBack={() => setPhase("discovery")} />
            )}

            {phase === "profile" && (
              <ProfileStep initial={profile} loading={isSearching} onSubmit={runSearch} />
            )}

            {phase === "workspace" && (
              <>
                <div className="sd-tabs">
                  <button className={cx("sd-tab", tab === "dashboard" && "is-active")} onClick={() => setTab("dashboard")}>Dashboard</button>
                  <button className={cx("sd-tab", tab === "examprep" && "is-active")} onClick={() => setTab("examprep")}>Exam prep</button>
                  <button className="sd-btn sd-btn-ghost sd-btn-tiny" style={{ marginLeft: "auto" }} onClick={() => setPhase("profile")}>
                    <Search size={13} /> Refine &amp; search again
                  </button>
                </div>
                {tab === "dashboard" ? (
                  <DashboardTab scholarships={scholarships} isSearching={isSearching} progress={progress} checklist={checklist} onToggleCheck={toggleCheck} searchedAt={searchedAt} />
                ) : (
                  <ExamPrepTab tests={tests} setTests={setTests} scholarships={scholarships} />
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   STYLES
============================================================ */

function GlobalStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,450;9..144,560;9..144,650&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

      .sd-app {
        --ink: #14213A; --ink-2: #1E2C4D; --ink-3: #2A3655;
        --parchment: #F1E9D8; --parchment-2: #E6DCC3;
        --brass: #B08D57; --verdigris: #4C7A73; --rust: #A6503A;
        --cream: #EDE6D6; --muted: #5B5240;
        background: radial-gradient(ellipse at top, var(--ink-2), var(--ink) 70%);
        color: var(--cream);
        font-family: 'IBM Plex Sans', system-ui, sans-serif;
        min-height: 100%;
        padding: 28px 16px 60px;
        box-sizing: border-box;
      }
      .sd-app *, .sd-app *::before, .sd-app *::after { box-sizing: border-box; }
      .sd-shell { max-width: 900px; margin: 0 auto; }

      .sd-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 22px; }
      .sd-header-brand { display: flex; align-items: center; gap: 10px; }
      .sd-seal-sm { display: inline-flex; align-items: center; justify-content: center; width: 30px; height: 30px; border-radius: 50%; border: 1.5px solid var(--brass); color: var(--brass); }
      .sd-header-title { font-family: 'Fraunces', serif; font-size: 18px; font-weight: 560; letter-spacing: 0.01em; }

      .sd-rail { display: flex; gap: 4px; margin-bottom: 20px; overflow-x: auto; }
      .sd-rail-item { display: flex; align-items: center; gap: 7px; padding: 6px 12px 6px 6px; border-radius: 999px; background: rgba(237,230,214,0.06); white-space: nowrap; }
      .sd-rail-item.is-active { background: rgba(176,141,87,0.18); }
      .sd-rail-num { display: inline-flex; align-items: center; justify-content: center; width: 20px; height: 20px; border-radius: 50%; font-family: 'IBM Plex Mono'; font-size: 11px; background: rgba(237,230,214,0.12); }
      .sd-rail-item.is-active .sd-rail-num { background: var(--brass); color: var(--ink); }
      .sd-rail-item.is-done .sd-rail-num { background: var(--verdigris); color: var(--ink); }
      .sd-rail-label { font-family: 'IBM Plex Mono'; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; opacity: 0.85; }

      .sd-card { background: var(--parchment); color: var(--ink); border-top: 3px solid var(--brass); border-radius: 8px; padding: 26px 26px 24px; margin-bottom: 18px; box-shadow: 0 18px 40px rgba(0,0,0,0.28); }
      .sd-welcome { text-align: left; }
      .sd-seal { display: inline-flex; align-items: center; justify-content: center; width: 46px; height: 46px; border-radius: 50%; border: 2px solid var(--brass); color: var(--brass); margin-bottom: 14px; }
      .sd-h1 { font-family: 'Fraunces', serif; font-size: 30px; font-weight: 650; margin: 0 0 10px; }
      .sd-h2 { font-family: 'Fraunces', serif; font-size: 22px; font-weight: 650; margin: 2px 0 6px; }
      .sd-h3 { font-family: 'Fraunces', serif; font-size: 17px; font-weight: 650; margin: 0; }
      .sd-lede { font-size: 15px; line-height: 1.55; margin: 0 0 12px; }
      .sd-sub { font-size: 13.5px; color: var(--muted); margin: 0 0 18px; }
      .sd-fine { font-size: 12px; color: var(--muted); line-height: 1.5; }
      .sd-eyebrow { font-family: 'IBM Plex Mono'; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--brass); margin: 0 0 6px; font-weight: 600; }
      .sd-section-label { font-family: 'IBM Plex Mono'; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted); border-top: 1px solid rgba(20,33,58,0.14); padding-top: 14px; margin: 18px 0 10px; }

      .sd-welcome-actions { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 4px; }

      .sd-btn { display: inline-flex; align-items: center; gap: 7px; background: var(--ink); color: var(--cream); border: none; border-radius: 5px; padding: 11px 18px; font-family: 'IBM Plex Sans'; font-size: 13.5px; font-weight: 600; letter-spacing: 0.02em; cursor: pointer; transition: background 0.15s ease; }
      .sd-btn:hover:not(:disabled) { background: var(--brass); }
      .sd-btn:disabled { opacity: 0.45; cursor: not-allowed; }
      .sd-btn-ghost { background: transparent; color: var(--ink); border: 1.4px solid rgba(20,33,58,0.3); }
      .sd-btn-ghost:hover:not(:disabled) { background: rgba(20,33,58,0.06); }
      .sd-btn-tiny { padding: 7px 12px; font-size: 12px; }
      .sd-icon-btn { background: transparent; border: none; color: var(--muted); cursor: pointer; padding: 6px; border-radius: 4px; display: inline-flex; }
      .sd-icon-btn:hover { background: rgba(20,33,58,0.08); color: var(--rust); }

      .sd-field { display: block; margin-bottom: 14px; }
      .sd-field-label { display: block; font-size: 12.5px; font-weight: 600; margin-bottom: 6px; color: var(--ink); }
      .sd-field-hint { display: block; font-size: 11.5px; color: var(--muted); margin-top: 4px; }
      .sd-input { width: 100%; border: none; border-bottom: 1.5px solid rgba(20,33,58,0.28); background: transparent; padding: 9px 2px; font-family: 'IBM Plex Sans'; font-size: 13.5px; color: var(--ink); outline: none; }
      .sd-input:focus { border-bottom-color: var(--brass); }
      .sd-textarea { border: 1.4px solid rgba(20,33,58,0.2); border-radius: 5px; padding: 10px; resize: vertical; }
      .sd-input-sm { width: 88px; flex: none; }
      .sd-input-inline { display: flex; gap: 8px; align-items: flex-end; }
      .sd-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 22px; }
      .sd-radio-row { display: flex; gap: 16px; flex-wrap: wrap; font-size: 13px; }
      .sd-radio-row label { display: flex; align-items: center; gap: 6px; cursor: pointer; }
      .sd-checks { display: flex; gap: 8px; flex-wrap: wrap; }
      .sd-chip { display: inline-flex; align-items: center; gap: 5px; border: 1.4px solid rgba(20,33,58,0.28); background: transparent; color: var(--ink); border-radius: 999px; padding: 6px 13px; font-size: 12.5px; cursor: pointer; }
      .sd-chip.is-on { background: var(--ink); color: var(--cream); border-color: var(--ink); }
      .sd-test-rows { display: flex; flex-direction: column; gap: 8px; }
      .sd-test-row { display: flex; gap: 8px; align-items: center; }
      .sd-actions-row { display: flex; align-items: center; gap: 14px; margin-top: 18px; flex-wrap: wrap; }
      .sd-error { color: var(--rust); font-size: 12.5px; display: flex; align-items: center; gap: 6px; margin-top: 10px; }
      .sd-callout { background: rgba(76,122,115,0.12); border-left: 3px solid var(--verdigris); padding: 12px 14px; border-radius: 4px; font-size: 13.5px; margin: 14px 0; }
      .sd-callout-quiet { background: rgba(20,33,58,0.05); border-left-color: var(--ink-3); }

      .sd-table-wrap { overflow-x: auto; margin: 14px 0; }
      .sd-table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
      .sd-table th { text-align: left; font-family: 'IBM Plex Mono'; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--brass); padding: 8px 10px; border-bottom: 1.5px solid rgba(20,33,58,0.2); white-space: nowrap; }
      .sd-table td { padding: 10px; border-bottom: 1px solid rgba(20,33,58,0.1); vertical-align: top; }
      .sd-table tr.is-picked { background: rgba(176,141,87,0.12); }
      .sd-td-strong { font-weight: 600; }
      .sd-td-sub { font-size: 11px; color: var(--muted); font-weight: 400; }

      .sd-tabs { display: flex; gap: 6px; align-items: center; margin-bottom: 14px; }
      .sd-tab { background: transparent; border: none; color: var(--cream); opacity: 0.6; font-family: 'IBM Plex Mono'; font-size: 12px; text-transform: uppercase; letter-spacing: 0.06em; padding: 8px 4px; cursor: pointer; border-bottom: 2px solid transparent; }
      .sd-tab.is-active { opacity: 1; border-bottom-color: var(--brass); color: var(--brass); }

      .sd-progress { list-style: none; margin: 10px 0 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
      .sd-progress li { display: flex; align-items: center; gap: 9px; font-size: 13px; }
      .sd-progress-dot { display: inline-flex; align-items: center; justify-content: center; width: 18px; height: 18px; border-radius: 50%; border: 1.5px solid rgba(20,33,58,0.25); flex: none; }
      .status-done .sd-progress-dot { background: var(--verdigris); border-color: var(--verdigris); color: var(--parchment); }
      .status-error .sd-progress-dot { background: var(--rust); border-color: var(--rust); color: var(--parchment); }
      .status-active .sd-progress-dot { border-color: var(--brass); color: var(--brass); }
      .sd-progress-note { font-size: 11px; color: var(--rust); }
      .sd-progress-card { }
      .sd-spin { animation: sd-spin 1s linear infinite; }
      @keyframes sd-spin { to { transform: rotate(360deg); } }

      .sd-stats-row { display: flex; gap: 22px; align-items: baseline; flex-wrap: wrap; margin: 4px 4px 16px; }
      .sd-stat { display: flex; flex-direction: column; color: var(--cream); }
      .sd-stat-num { font-family: 'IBM Plex Mono'; font-size: 22px; font-weight: 600; }
      .sd-stat span:last-child { font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; opacity: 0.75; }
      .sd-stat.tone-verdigris .sd-stat-num { color: var(--verdigris); }
      .sd-stat.tone-brass .sd-stat-num { color: var(--brass); }
      .sd-stat.tone-rust .sd-stat-num { color: var(--rust); }
      .sd-searched-at { margin-left: auto; align-self: center; }

      .sd-filter-row { display: flex; gap: 10px; margin-bottom: 14px; flex-wrap: wrap; }
      .sd-filter-row .sd-input { background: rgba(237,230,214,0.94); border-radius: 5px; border: none; padding: 9px 12px; max-width: 260px; }

      .sd-schol-list { display: flex; flex-direction: column; gap: 12px; }
      .sd-schol-card { background: var(--parchment); border-top: 3px solid var(--brass); border-radius: 8px; overflow: hidden; box-shadow: 0 10px 26px rgba(0,0,0,0.22); }
      .sd-schol-head { width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 16px 18px; background: transparent; border: none; cursor: pointer; text-align: left; color: var(--ink); }
      .sd-schol-head-left { display: flex; align-items: center; gap: 14px; min-width: 0; }
      .sd-schol-name { font-family: 'Fraunces', serif; font-size: 16px; font-weight: 650; margin: 0; }
      .sd-schol-sub { font-size: 12px; color: var(--muted); margin: 2px 0 0; }
      .sd-schol-head-right { display: flex; align-items: center; gap: 14px; flex: none; }
      .sd-funding-badge { font-family: 'IBM Plex Mono'; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.05em; background: rgba(20,33,58,0.08); padding: 5px 9px; border-radius: 4px; white-space: nowrap; }
      .sd-countdown { display: flex; flex-direction: column; align-items: center; min-width: 46px; }
      .sd-countdown-num { font-family: 'IBM Plex Mono'; font-size: 18px; font-weight: 600; }
      .sd-countdown-label { font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--muted); }
      .sd-countdown.tone-rust .sd-countdown-num { color: var(--rust); }
      .sd-countdown.tone-brass .sd-countdown-num { color: var(--brass); }
      .sd-countdown.tone-verdigris .sd-countdown-num { color: var(--verdigris); }
      .sd-countdown.tone-muted .sd-countdown-num { color: var(--muted); }

      .sd-stamp { display: inline-block; font-family: 'IBM Plex Mono'; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 5px 10px; border-radius: 10px; border: 2px solid currentColor; transform: rotate(-2deg); white-space: nowrap; flex: none; }
      .sd-stamp.tone-verdigris { color: var(--verdigris); }
      .sd-stamp.tone-brass { color: var(--brass); }
      .sd-stamp.tone-rust { color: var(--rust); }
      .sd-stamp.tone-ink { color: var(--ink-3); }

      .sd-schol-body { padding: 0 18px 20px; border-top: 1px solid rgba(20,33,58,0.1); color: var(--ink); }
      .sd-fee-flag { display: flex; align-items: center; gap: 8px; background: rgba(166,80,58,0.12); color: var(--rust); border-radius: 5px; padding: 10px 12px; font-size: 12.5px; margin: 14px 0; }
      .sd-def-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 24px; font-size: 12.5px; margin: 14px 0; }
      .sd-def-label { display: block; font-family: 'IBM Plex Mono'; font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); margin-bottom: 3px; }
      .sd-subsection { margin: 16px 0; }
      .sd-bullet-list, .sd-num-list { margin: 6px 0 0; padding-left: 20px; font-size: 12.5px; line-height: 1.6; }
      .sd-links-row { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px; }
      .sd-verify-note { display: flex; align-items: center; gap: 6px; font-size: 11.5px; color: var(--brass); margin-top: 10px; }

      .sd-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 10px; }
      .sd-checklist { display: flex; flex-direction: column; gap: 3px; }
      .sd-check-row { display: flex; align-items: center; gap: 9px; background: transparent; border: none; padding: 5px 2px; cursor: pointer; text-align: left; font-size: 12.5px; color: var(--ink); }
      .sd-check-box { width: 16px; height: 16px; border: 1.5px solid rgba(20,33,58,0.35); border-radius: 3px; display: inline-flex; align-items: center; justify-content: center; flex: none; color: var(--parchment); }
      .sd-check-row.is-checked .sd-check-box { background: var(--verdigris); border-color: var(--verdigris); }
      .sd-check-row.is-checked .sd-check-label { text-decoration: line-through; opacity: 0.6; }

      .sd-reminder-list { list-style: none; margin: 4px 0 0; padding: 0; display: flex; flex-direction: column; gap: 5px; font-size: 12.5px; }
      .sd-reminder-list li { display: flex; align-items: center; gap: 10px; }
      .sd-reminder-list li.is-past { opacity: 0.4; text-decoration: line-through; }
      .sd-reminder-date { font-family: 'IBM Plex Mono'; font-size: 11px; color: var(--brass); min-width: 78px; }

      .sd-empty-note { color: var(--cream); opacity: 0.75; font-size: 13.5px; padding: 6px 2px; }
      .sd-card .sd-empty-note { color: var(--muted); }

      .sd-test-panel-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
      .sd-chart-wrap { margin: 10px 0; background: rgba(20,33,58,0.03); border-radius: 6px; padding: 6px; }

      .sd-timeline { list-style: none; margin: 10px 0 0; padding: 0; display: flex; flex-direction: column; gap: 9px; }
      .sd-timeline-item { display: flex; align-items: center; gap: 10px; font-size: 12.5px; }
      .sd-timeline-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--ink-3); flex: none; }
      .sd-timeline-item.type-test .sd-timeline-dot { background: var(--brass); }
      .sd-timeline-item.type-scholarship .sd-timeline-dot { background: var(--verdigris); }
      .sd-timeline-date { font-family: 'IBM Plex Mono'; font-size: 11px; color: var(--muted); min-width: 82px; }
      .sd-timeline-label { flex: 1; }
      .sd-timeline-days { font-family: 'IBM Plex Mono'; font-size: 11px; color: var(--muted); }

      @media (max-width: 640px) {
        .sd-grid-2 { grid-template-columns: 1fr; }
        .sd-two-col { grid-template-columns: 1fr; }
        .sd-def-grid { grid-template-columns: 1fr; }
        .sd-card { padding: 20px 16px; }
        .sd-h1 { font-size: 25px; }
        .sd-schol-head { flex-wrap: wrap; }
        .sd-searched-at { margin-left: 0; }
      }
    `}</style>
  );
}
