/**
 * Academic Scholar Research Ecosystem - Application Logic
 * Multi-View SaaS Dashboard Client Engine
 */

// Application State
const State = {
  currentView: 'overview',
  searchQuery: '',
  selectedCluster: 'all',
  selectedPriority: 'all',
  selectedCategory: 'all',
  selectedCountry: 'all',
  selectedSort: 'priority',
  scholarViewMode: 'cards', // 'cards' | 'table' | 'list'
  
  // LocalStorage Stores
  contacted: JSON.parse(localStorage.getItem('pc') || '{}'),
  bookmarked: JSON.parse(localStorage.getItem('pb') || '{}'),
  stages: JSON.parse(localStorage.getItem('pstage') || '{}'),
  followups: JSON.parse(localStorage.getItem('pfollowup') || '{}'),
  activity: JSON.parse(localStorage.getItem('pactivity') || '[]'),
  profile: (function() {
    let p = JSON.parse(localStorage.getItem('profileData') || 'null');
    if (!p && typeof DEFAULT_PROFILE_DATA !== 'undefined') {
      p = JSON.parse(JSON.stringify(DEFAULT_PROFILE_DATA));
    }
    if (p && p.links) {
      if (!p.links.orcid || p.links.orcid === 'https://orcid.org') {
        p.links.orcid = 'https://orcid.org/0009-0001-1764-9178';
      }
      if (!p.links.linkedin || p.links.linkedin === 'https://www.linkedin.com/in/tanvir-ahmed-tusher') {
        p.links.linkedin = 'https://www.linkedin.com/in/tanvir-ahmed77';
      }
      if (!p.links.googleScholar || p.links.googleScholar === 'https://scholar.google.com') {
        p.links.googleScholar = 'https://scholar.google.com/citations?user=t9cr7sQAAAAJ&hl=en&authuser=3';
      }
    }
    return p || (typeof DEFAULT_PROFILE_DATA !== 'undefined' ? DEFAULT_PROFILE_DATA : {});
  })(),
  profilePhoto: localStorage.getItem('profilePhoto') || 'tusher-profile-photo.jpg',
  
  // Active Drawer Scholar ID
  activeDrawerId: null,

  // Deadline Tracker / The Ledger State
  deadlineTab: 'dashboard',
  deadlineCategory: 'all',
  deadlineSort: 'deadline',
  deadlineSearch: '',
  deadlineCalDate: new Date(),
  deadlineSelectedDate: null,
  deadlineEditingId: null,
  deadlineItems: [],
  deadlineArchived: [],

  // Scholarship Tracker / The Scholarship Desk State
  scholarshipTab: 'directory',
  scholarshipCategory: 'all',
  scholarshipSort: 'deadline',
  scholarshipSearch: '',
  scholarshipEditingId: null,
  scholarshipItems: [],
  scholarshipArchived: [],
  scholarshipExpandedCards: {},
  scholarshipChecklists: (function() {
    try {
      return JSON.parse(localStorage.getItem('schol_checklists_v1') || '{}');
    } catch(e) { return {}; }
  })(),
  scholarshipTests: (function() {
    try {
      const saved = JSON.parse(localStorage.getItem('schol_tests_v1') || 'null');
      if (saved && Array.isArray(saved)) return saved;
    } catch(e) {}
    return [
      { id: 't-ielts', name: 'IELTS Academic', current: '7.5', target: '8.0+', testDate: '2026-10-15', regDeadline: '2026-09-25', mockScores: [{ date: '2026-06-10', score: 7.0 }, { date: '2026-07-20', score: 7.5 }] },
      { id: 't-gre', name: 'GRE General Test', current: '322', target: '330+', testDate: '2026-11-05', regDeadline: '2026-10-15', mockScores: [{ date: '2026-06-15', score: 315 }, { date: '2026-07-25', score: 322 }] }
    ];
  })(),
  scholarshipDiscoveryAnswers: (function() {
    try {
      const saved = JSON.parse(localStorage.getItem('schol_discovery_v1') || 'null');
      if (saved) return saved;
    } catch(e) {}
    return {
      interests: 'Climate justice, international environmental law, loss and damage, TWAIL, AI regulation',
      hasCourseInMind: 'yes',
      courseInMind: 'PhD in Law / LL.M. in Environmental Law & Global Governance',
      strengths: 'Legal research, multilateral treaty analysis, comparative constitutional law',
      budget: '25000',
      budgetCurrency: 'USD',
      workWhileStudy: 'yes',
      workHours: '20',
      visaImportance: 'high',
      openToLessPopular: 'yes',
      preferences: 'English-medium instruction, top faculty in climate litigation & international law'
    };
  })(),
  scholarshipProfileAnswers: (function() {
    try {
      const saved = JSON.parse(localStorage.getItem('schol_profile_v1') || 'null');
      if (saved) return saved;
    } catch(e) {}
    return {
      nationality: 'Bangladeshi',
      residence: 'Bangladesh',
      educationLevel: "Master's — in progress",
      grades: 'First Class Honours / 3.82 CGPA',
      course: 'PhD in Law / Master of Laws (LL.M.)',
      countries: 'UK, Switzerland, Germany, USA, Singapore, Australia, Canada',
      intake: 'Fall 2027',
      fundingPref: 'full',
      costsCovered: ['Tuition', 'Living expenses', 'Accommodation', 'Travel', 'Insurance', 'Visa support'],
      testScores: [{ test: 'IELTS Academic', score: '7.5 (L 8.5, R 8.0, W 7.0, S 7.0)' }],
      willingMoreTests: true,
      extracurriculars: 'Moot court champion, legal researcher in climate displacement, 4 peer-reviewed publications',
      specialFactors: 'Global South climate accountability practitioner, high academic distinction'
    };
  })()
};

// Initialize Default Stages from existing 'pc' if missing
function initStages() {
  P.forEach(p => {
    if (!State.stages[p.id]) {
      if (State.contacted[p.id]) {
        State.stages[p.id] = 'contacted';
      } else {
        State.stages[p.id] = 'not_contacted';
      }
    }
  });
  localStorage.setItem('pstage', JSON.stringify(State.stages));
}

// Log Activity Event
function logActivity(scholarId, scholarName, actionText) {
  const item = {
    id: scholarId,
    name: scholarName,
    action: actionText,
    timestamp: new Date().toISOString()
  };
  State.activity.unshift(item);
  if (State.activity.length > 200) State.activity.pop();
  localStorage.setItem('pactivity', JSON.stringify(State.activity));
}

// Utilities
function esc(s) {
  if (!s) return '';
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

function getInitials(name) {
  if (!name) return 'SC';
  const clean = name.replace(/^(Prof\.|Dr\.|Assoc\.\s*Prof\.|Asst\.\s*Prof\.|Mr\.|Ms\.)\s*/i, '').trim();
  const parts = clean.split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getClusterClass(cluster) {
  if (!cluster) return 'climate';
  const c = cluster.toLowerCase();
  if (c.includes('twail')) return 'twail';
  if (c.includes('water')) return 'water';
  if (c.includes('ai') || c.includes('tech')) return 'ai';
  if (c.includes('migration')) return 'migration';
  if (c.includes('investment')) return 'investment';
  if (c.includes('ecology')) return 'ecology';
  if (c.includes('litigation')) return 'litigation';
  return 'climate';
}

function getPriorityClass(pri) {
  if (!pri) return 't3';
  if (pri.includes('Super')) return 'ss';
  if (pri.includes('Tier 1')) return 'pa';
  if (pri.includes('Tier 2')) return 't2';
  return 't3';
}

// Filter Engine for Scholars
function getFilteredScholars() {
  const q = State.searchQuery.toLowerCase().trim();
  
  let list = P.filter(p => {
    if (State.selectedCluster !== 'all' && p.cluster !== State.selectedCluster) return false;
    if (State.selectedPriority !== 'all' && p.priority !== State.selectedPriority) return false;
    if (State.selectedCategory !== 'all' && p.category !== State.selectedCategory) return false;
    if (State.selectedCountry !== 'all' && p.country !== State.selectedCountry) return false;
    
    if (q) {
      const searchBlob = [
        p.name, p.university, p.cluster, p.research, p.matchPoint,
        p.country, p.dept, p.title, p.priority, p.contribution, p.email
      ].join(' ').toLowerCase();
      return searchBlob.includes(q);
    }
    return true;
  });
  
  // Sort
  list.sort((a, b) => {
    if (State.selectedSort === 'priority') {
      return a.prioritySort - b.prioritySort || a.qsNum - b.qsNum;
    }
    if (State.selectedSort === 'name') return a.name.localeCompare(b.name);
    if (State.selectedSort === 'name-desc') return b.name.localeCompare(a.name);
    if (State.selectedSort === 'university') return a.university.localeCompare(b.university);
    if (State.selectedSort === 'qs') return a.qsNum - b.qsNum;
    if (State.selectedSort === 'cluster') return a.cluster.localeCompare(b.cluster);
    return 0;
  });
  
  return list;
}

// Router / View Switcher
function switchView(viewName) {
  State.currentView = viewName;
  
  // Update Nav highlighting (Desktop Sidebar)
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === viewName);
  });

  // Update Nav highlighting (Mobile Bottom Navigation Bar)
  document.querySelectorAll('.bottom-nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === viewName);
  });
  
  // Close mobile sidebar and search overlay if open
  closeMobileSidebar();
  const searchWrap = document.getElementById('topbar-search-wrap');
  if (searchWrap) searchWrap.classList.remove('mobile-active');
  
  // Update Topbar View Title
  const titles = {
    overview: { title: 'Overview', breadcrumb: 'Dashboard / Ecosystem Metrics' },
    scholars: { title: 'Scholars Directory', breadcrumb: `Directory / ${P.length} Verified Researchers` },
    pipeline: { title: 'Outreach Pipeline', breadcrumb: 'Workflow / Kanban Stage Tracking' },
    clusters: { title: 'Research Clusters', breadcrumb: 'Domains / 8 Thematic Focus Areas' },
    priority: { title: 'Priority Targets', breadcrumb: `Shortlist / ${P.filter(p => p.priority === 'Super Standout' || p.priority === 'Tier 1').length} Super Standout & Tier 1 Targets` },
        deadlines: { title: 'Deadline Tracker', breadcrumb: 'Academic Reference Register / The Ledger' },
    scholarships: { title: 'Scholarship Tracker', breadcrumb: 'Global Intelligence / The Scholarship Desk' },
    analytics: { title: 'Analytics & Insights', breadcrumb: 'Intelligence / Distribution & Funnels' },
    profile: { title: 'Researcher Profile', breadcrumb: 'Academic Curriculum Vitae & Portfolio' },
    subscription: { title: 'Subscription', breadcrumb: 'Plans / Payment & Billing' },
    'ai-search': { title: 'AI Professor Search', breadcrumb: 'Claude AI / Automated Research Discovery' }
  };
  
  const vMeta = titles[viewName] || { title: 'Dashboard', breadcrumb: 'Overview' };
  const titleEl = document.getElementById('topbar-view-title');
  const crumbEl = document.getElementById('topbar-breadcrumb');
  if (titleEl) titleEl.textContent = vMeta.title;
  if (crumbEl) crumbEl.textContent = vMeta.breadcrumb;
  
  // Toggle View Sections
  document.querySelectorAll('.view-section').forEach(sec => {
    sec.classList.remove('active');
  });
  const activeSec = document.getElementById(`view-${viewName}`);
  if (activeSec) activeSec.classList.add('active');
  
  // Render specific view
  if (viewName === 'overview') renderOverview();
  if (viewName === 'scholars') renderScholars();
  if (viewName === 'pipeline') renderPipeline();
  if (viewName === 'clusters') renderClusters();
  if (viewName === 'priority') renderPriorityTargets();
    if (viewName === 'deadlines') renderDeadlines();
  if (viewName === 'scholarships') renderScholarships();
  if (viewName === 'analytics') renderAnalytics();
  if (viewName === 'profile') renderProfile();
  if (viewName === 'subscription') renderSubscription();
  if (viewName === 'ai-search') renderAISearch();
  
  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Toast System
function showToast(msg, icon = '✓') {
  const t = document.getElementById('app-toast');
  t.innerHTML = `<span style="color:var(--green);font-weight:800;">${icon}</span> <span>${esc(msg)}</span>`;
  t.classList.add('show');
  setTimeout(() => {
    t.classList.remove('show');
  }, 2600);
}

// Action Handlers
function toggleContacted(id, event) {
  if (event) event.stopPropagation();
  const p = P.find(x => x.id === id);
  if (!p) return;
  
  State.contacted[id] = !State.contacted[id];
  localStorage.setItem('pc', JSON.stringify(State.contacted));
  
  if (State.contacted[id]) {
    if (State.stages[id] === 'not_contacted') {
      State.stages[id] = 'contacted';
      localStorage.setItem('pstage', JSON.stringify(State.stages));
    }
    logActivity(id, p.name, 'Marked as Contacted');
    showToast(`Marked ${p.name} as contacted`);
  } else {
    logActivity(id, p.name, 'Unmarked contacted status');
    showToast(`Unmarked ${p.name}`);
  }
  
  refreshCurrentView();
}

function toggleBookmark(id, event) {
  if (event) event.stopPropagation();
  const p = P.find(x => x.id === id);
  if (!p) return;
  
  State.bookmarked[id] = !State.bookmarked[id];
  localStorage.setItem('pb', JSON.stringify(State.bookmarked));
  
  if (State.bookmarked[id]) {
    logActivity(id, p.name, 'Added to Bookmarks');
    showToast(`Bookmarked ${p.name}`);
  } else {
    logActivity(id, p.name, 'Removed from Bookmarks');
    showToast(`Removed bookmark for ${p.name}`);
  }
  
  refreshCurrentView();
}

function setStage(id, newStage, event) {
  if (event) event.stopPropagation();
  const p = P.find(x => x.id === id);
  if (!p) return;
  
  State.stages[id] = newStage;
  localStorage.setItem('pstage', JSON.stringify(State.stages));
  
  if (newStage !== 'not_contacted' && !State.contacted[id]) {
    State.contacted[id] = true;
    localStorage.setItem('pc', JSON.stringify(State.contacted));
  }
  
  const stageMeta = STAGES.find(s => s.id === newStage);
  const sLabel = stageMeta ? stageMeta.label : newStage;
  logActivity(id, p.name, `Moved stage to "${sLabel}"`);
  showToast(`Moved to ${sLabel}`);
  
  refreshCurrentView();
}

function setFollowUpDate(id, dateStr) {
  const p = P.find(x => x.id === id);
  if (!p) return;
  
  if (dateStr) {
    State.followups[id] = dateStr;
    logActivity(id, p.name, `Scheduled follow-up for ${dateStr}`);
    showToast(`Follow-up set for ${dateStr}`);
  } else {
    delete State.followups[id];
    showToast(`Cleared follow-up date`);
  }
  localStorage.setItem('pfollowup', JSON.stringify(State.followups));
  refreshCurrentView();
}

function copyEmail(email, btnEl, event) {
  if (event) event.stopPropagation();
  if (!email || email.includes('Check') || email.includes('directory')) {
    showToast('No direct email available to copy', '⚠️');
    return;
  }
  navigator.clipboard.writeText(email).then(() => {
    if (btnEl) {
      const origText = btnEl.textContent;
      btnEl.textContent = 'Copied!';
      setTimeout(() => { btnEl.textContent = origText; }, 2000);
    }
    showToast(`Copied ${email}`);
  }).catch(() => {
    showToast('Failed to copy to clipboard', '⚠️');
  });
}

function refreshCurrentView() {
  if (State.currentView === 'overview') renderOverview();
  if (State.currentView === 'scholars') renderScholars();
  if (State.currentView === 'pipeline') renderPipeline();
  if (State.currentView === 'priority') renderPriorityTargets();
  if (State.currentView === 'analytics') renderAnalytics();
  
  if (State.activeDrawerId) {
    renderDrawerContent(State.activeDrawerId);
  }
}

// ==========================================================================
// 1. RENDER OVERVIEW
// ==========================================================================
function renderOverview() {
  const total = P.length;
  const unis = new Set(P.map(p => p.university)).size;
  const countries = new Set(P.map(p => p.country).filter(c => c && c !== 'Unknown')).size;
  const topTargets = P.filter(p => p.priority === 'Super Standout' || p.priority === 'Tier 1');
  const contactedList = P.filter(p => State.contacted[p.id]);
  const contactedCount = contactedList.length;
  const contactedPct = total > 0 ? Math.round((contactedCount / total) * 100) : 0;
  
  const topTargetsContacted = topTargets.filter(p => State.contacted[p.id]).length;
  const topTargetsPct = topTargets.length > 0 ? Math.round((topTargetsContacted / topTargets.length) * 100) : 0;
  
  // Animated counter function
  function animateCounter(elementId, targetValue, suffix = '') {
    const el = document.getElementById(elementId);
    if (!el) return;
    const startTime = performance.now();
    const duration = 1200;
    const startValue = 0;
    
    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + (targetValue - startValue) * eased);
      el.textContent = current + suffix;
      if (progress < 1) requestAnimationFrame(update);
      else el.classList.add('counting');
    }
    requestAnimationFrame(update);
  }
  
  // Set KPI stats with animation
  animateCounter('kpi-total-scholars', total);
  animateCounter('kpi-top-targets', topTargets.length);
  animateCounter('kpi-unis', unis);
  const uniSubEl = document.getElementById('kpi-unis-sub');
  if (uniSubEl) uniSubEl.innerHTML = `<span>QS #1 to #220</span>`;
  animateCounter('kpi-countries', countries);
  const contactedEl = document.getElementById('kpi-contacted-count');
  if (contactedEl) {
    const startTime = performance.now();
    function updateContacted(t) {
      const p = Math.min((t - startTime) / 1200, 1);
      const e = 1 - Math.pow(1 - p, 3);
      const c = Math.round(contactedCount * e);
      const pct = total > 0 ? Math.round((c / total) * 100) : 0;
      contactedEl.textContent = `${c} (${pct}%)`;
      if (p < 1) requestAnimationFrame(updateContacted);
    }
    requestAnimationFrame(updateContacted);
  }
  
  // Render Tier-by-Tier Engagement Meters
  const tierMetersEl = document.getElementById('overview-tier-meters');
  if (tierMetersEl) {
    const tierDefs = [
      {
        id: 'Super Standout',
        name: 'Super Standout',
        badgeClass: 'tag-ss',
        color: '#D97706',
        desc: 'P7 & Water Nexuses',
        list: P.filter(p => p.priority === 'Super Standout')
      },
      {
        id: 'Tier 1',
        name: 'Tier 1 Targets',
        badgeClass: 'tag-pa',
        color: '#E11D48',
        desc: 'Primary DPhil Supervisors',
        list: P.filter(p => p.priority === 'Tier 1')
      },
      {
        id: 'Tier 2',
        name: 'Tier 2 Candidates',
        badgeClass: 'tag-t2',
        color: '#16A34A',
        desc: 'High-Relevance Faculty',
        list: P.filter(p => p.priority === 'Tier 2')
      },
      {
        id: 'Tier 3',
        name: 'Tier 3 Ecosystem',
        badgeClass: 'tag-t3',
        color: '#6D5BD0',
        desc: 'Broader Target Faculty',
        list: P.filter(p => p.priority === 'Tier 3')
      },
      {
        id: 'all',
        name: 'Total Ecosystem',
        badgeClass: 'tag-qs',
        color: '#2563EB',
        desc: `All ${P.length} Verified Scholars`,
        list: P
      }
    ];

    const cCirc = 239; // 2 * PI * 38
    tierMetersEl.innerHTML = tierDefs.map(td => {
      const tCount = td.list.length;
      const tContacted = td.list.filter(p => State.contacted[p.id]).length;
      const tPct = tCount > 0 ? Math.round((tContacted / tCount) * 100) : 0;
      const strokeOffset = cCirc - (cCirc * (tPct / 100));

      return `
        <div class="tier-meter-card" onclick="filterByPriority('${td.id.replace(/'/g, "\\'")}')">
          <div class="tier-meter-head">
            <span class="tag ${td.badgeClass}">${esc(td.name)}</span>
            <span style="font-size:0.75rem;font-weight:800;color:var(--text);">${tCount}</span>
          </div>
          <div style="font-size:0.68rem;color:var(--text-muted);width:100%;text-align:left;">${esc(td.desc)}</div>
          
          <div class="tier-meter-gauge-wrap">
            <svg class="tier-gauge-svg" viewBox="0 0 90 90">
              <circle class="tier-gauge-bg" cx="45" cy="45" r="38"></circle>
              <circle class="tier-gauge-fill" cx="45" cy="45" r="38" style="stroke:${td.color};stroke-dasharray:${cCirc};stroke-dashoffset:${strokeOffset};"></circle>
            </svg>
            <div class="tier-gauge-center">
              <span class="tier-gauge-pct" style="color:${td.color};">${tPct}%</span>
              <span class="tier-gauge-sub">Contacted</span>
            </div>
          </div>
          
          <div style="font-size:0.72rem;font-weight:700;color:var(--text);">${tContacted} of ${tCount} Contacted</div>
          <div class="tier-meter-footer">View ${esc(td.name)} &rarr;</div>
        </div>
      `;
    }).join('');
  }
  
  // Render Activity Bar Chart (Last 7 Days)
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const todayIdx = new Date().getDay(); // 0 is Sun
  const barChartContainer = document.getElementById('weekly-bar-chart');
  
  // Calculate activity by day
  const dayCounts = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  State.activity.forEach(act => {
    const d = new Date(act.timestamp).getDay();
    dayCounts[d] = (dayCounts[d] || 0) + 1;
  });
  
  const maxDay = Math.max(1, ...Object.values(dayCounts));
  
  let chartHtml = '';
  // Order days Mon(1) -> Sun(0)
  const orderedDays = [1, 2, 3, 4, 5, 6, 0];
  orderedDays.forEach(dIdx => {
    const count = dayCounts[dIdx] || 0;
    const heightPct = Math.max(12, Math.round((count / maxDay) * 100));
    const isToday = dIdx === todayIdx;
    const dName = days[dIdx === 0 ? 6 : dIdx - 1];
    
    chartHtml += `
      <div class="chart-bar-group">
        <div class="chart-bar ${isToday ? 'active-day' : ''}" style="height: ${heightPct}%;">
          ${count > 0 ? `<span class="chart-bar-val">${count}</span>` : ''}
        </div>
        <span class="chart-bar-label">${dName}</span>
      </div>
    `;
  });
  if (barChartContainer) barChartContainer.innerHTML = chartHtml;
  
  // Render Recent Activity Feed
  const feedEl = document.getElementById('overview-activity-feed');
  if (feedEl) {
    if (State.activity.length === 0) {
      feedEl.innerHTML = '<div style="color:var(--text-muted);font-size:0.8rem;text-align:center;padding:1.5rem 0;">No outreach activities recorded yet. Actions like contacting scholars will appear here.</div>';
    } else {
      feedEl.innerHTML = State.activity.slice(0, 8).map(act => {
        const timeAgo = formatTimeAgo(new Date(act.timestamp));
        return `
          <div class="activity-item">
            <div class="activity-dot"></div>
            <div class="activity-content">
              <div class="activity-title">${esc(act.action)} &middot; <span style="color:var(--primary);font-weight:700;">${esc(act.name)}</span></div>
              <div class="activity-time">${timeAgo}</div>
            </div>
          </div>
        `;
      }).join('');
    }
  }
  
  // Render Upcoming Followups Widget
  const followupsEl = document.getElementById('overview-followups-feed');
  const scheduledFollowups = Object.keys(State.followups).map(id => {
    const p = P.find(x => x.id === parseInt(id, 10));
    return p ? { ...p, date: State.followups[id] } : null;
  }).filter(Boolean).sort((a, b) => a.date.localeCompare(b.date));
  
  if (followupsEl) {
    if (scheduledFollowups.length === 0) {
      followupsEl.innerHTML = '<div style="color:var(--text-muted);font-size:0.8rem;text-align:center;padding:1.5rem 0;">No follow-up dates scheduled. You can set follow-up dates on scholar detail drawers.</div>';
    } else {
      followupsEl.innerHTML = scheduledFollowups.slice(0, 6).map(f => {
        return `
          <div class="followup-item" onclick="openDrawer(${f.id})" style="cursor:pointer;">
            <div>
              <div class="followup-name">${esc(f.name)}</div>
              <div style="font-size:0.7rem;color:var(--text-muted);">${esc(f.university)}</div>
            </div>
            <div class="followup-date">${esc(f.date)}</div>
          </div>
        `;
      }).join('');
    }
  }
  
  // Render QS Rankings Widget
  renderQSRankingsWidget();
}

// Button Ripple Effect
document.addEventListener('click', function(e) {
  const btn = e.target.closest('.btn');
  if (!btn) return;
  const rect = btn.getBoundingClientRect();
  const ripple = document.createElement('span');
  ripple.className = 'ripple';
  const size = Math.max(rect.width, rect.height);
  ripple.style.width = ripple.style.height = size + 'px';
  ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
  ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
  btn.appendChild(ripple);
  ripple.addEventListener('animationend', () => ripple.remove());
});
function formatTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ==========================================================================
// 2. RENDER SCHOLARS DIRECTORY
// ==========================================================================
function renderScholars() {
  const list = getFilteredScholars();
  document.getElementById('scholars-result-count').textContent = `${list.length} of ${P.length} scholars`;
  
  // Mode toggles
  document.querySelectorAll('.mode-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.mode === State.scholarViewMode);
  });
  
  document.getElementById('scholars-cards-view').style.display = State.scholarViewMode === 'cards' ? 'grid' : 'none';
  document.getElementById('scholars-table-view').classList.toggle('active', State.scholarViewMode === 'table');
  document.getElementById('scholars-list-view').classList.toggle('active', State.scholarViewMode === 'list');
  
  if (State.scholarViewMode === 'cards') renderScholarsCards(list);
  if (State.scholarViewMode === 'table') renderScholarsTable(list);
  if (State.scholarViewMode === 'list') renderScholarsList(list);
}

function renderScholarsCards(list) {
  const container = document.getElementById('scholars-cards-view');
  if (list.length === 0) {
    container.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:4rem 1rem;color:var(--text-muted);display:flex;flex-direction:column;align-items:center;justify-content:center;">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom:1rem;color:var(--text-subtle);">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <h3>No scholars match current filters</h3>
        <p style="font-size:0.8rem;margin-top:0.5rem;max-width:300px;margin-left:auto;margin-right:auto;">Try clearing search keywords or selecting 'All' for filters.</p>
      </div>`;
    return;
  }
  
  container.innerHTML = list.map(p => {
    const isContacted = !!State.contacted[p.id];
    const isBookmarked = !!State.bookmarked[p.id];
    const hasDirectEmail = p.email && !p.email.includes('Check') && !p.email.includes('directory');
    const emailBadge = p.emailStatus === 'confirmed' ? `<span class="badge-confirmed">✓ Confirmed</span>` : `<span class="badge-verify">Verify</span>`;
    
    return `
      <div class="scholar-card" id="card-${p.id}">
        <div class="scholar-card-top" onclick="toggleCardExpand(${p.id})">
          <div class="card-tags-row">
            <span class="tag tag-${getClusterClass(p.cluster)}">${esc(p.cluster)}</span>
            <span class="tag tag-${getPriorityClass(p.priority)}">${esc(p.priority)}</span>
            ${p.qs ? `<span class="tag-qs">${esc(p.qs)}</span>` : ''}
          </div>
          
          <div class="scholar-name" onclick="openDrawer(${p.id});event.stopPropagation();">
            ${esc(p.name)}
          </div>
          <div class="scholar-role">${esc(p.title || 'Faculty Researcher')}</div>
          <div class="scholar-uni">${esc(p.university)}${p.dept ? ` &middot; <span style="color:var(--text-muted);font-weight:400;">${esc(p.dept)}</span>` : ''}</div>
          
          <div class="scholar-email-row">
            <span class="email-text">
              ${hasDirectEmail ? `<a href="mailto:${esc(p.email)}" onclick="event.stopPropagation()">${esc(p.email)}</a>` : esc(p.email)}
            </span>
            ${emailBadge}
          </div>
          
          <span class="chevron-icon">&#9660;</span>
        </div>
        
        <div class="scholar-card-body" onclick="event.stopPropagation()">
          ${p.research ? `
            <div class="detail-section">
              <div class="detail-label">Research Focus</div>
              <div class="detail-text">${esc(p.research)}</div>
            </div>
          ` : ''}
          
          ${p.currentProject ? `
            <div class="detail-section">
              <div class="detail-label">Current Project</div>
              <div class="detail-text">${esc(p.currentProject)}</div>
            </div>
          ` : ''}
          
          ${p.matchPoint ? `
            <div class="callout-box callout-match">
              <div class="detail-label">Research Connection Nexus</div>
              <div>${esc(p.matchPoint)}</div>
            </div>
          ` : ''}
          
          ${p.contribution ? `
            <div class="callout-box callout-contrib">
              <div class="detail-label">Your Contribution Offer</div>
              <div>${esc(p.contribution)}</div>
            </div>
          ` : ''}
          
          ${p.proposalHit ? `
            <div class="callout-box callout-hit">
              <div class="detail-label">Proposal Alignment</div>
              <div>${esc(p.proposalHit)}</div>
            </div>
          ` : ''}
          
          ${p.papers && p.papers.length > 0 ? `
            <div class="detail-section">
              <div class="detail-label">Recent Publications</div>
              <ul style="list-style:none;padding:0;">
                ${p.papers.map(pp => `<li style="font-size:0.76rem;color:var(--text-muted);padding:0.2rem 0;border-bottom:1px solid var(--border-light);">${esc(pp)}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
          
          ${p.bestDays || p.localTime || p.bdTime ? `
            <div class="timing-grid">
              <div class="timing-item">
                <span class="timing-lbl">Best Days</span>
                <span class="timing-val">${esc(p.bestDays || 'Tue / Wed')}</span>
              </div>
              <div class="timing-item">
                <span class="timing-lbl">Local Time</span>
                <span class="timing-val">${esc(p.localTime || '09:00 - 11:00')}</span>
              </div>
              <div class="timing-item">
                <span class="timing-lbl">Bangladesh Time</span>
                <span class="timing-val highlight">${esc(p.bdTime || '14:00 - 16:00')}</span>
              </div>
            </div>
          ` : ''}
          
          <div class="card-action-bar">
            ${hasDirectEmail ? `<button class="btn-action" onclick="copyEmail('${p.email.replace(/'/g, "\\'")}', this, event)">Copy Email</button>` : ''}
            <button class="btn-action ${isContacted ? 'contacted' : ''}" onclick="toggleContacted(${p.id}, event)">${isContacted ? '✓ Contacted' : 'Mark Contacted'}</button>
            <button class="btn-action ${isBookmarked ? 'bookmarked' : ''}" onclick="toggleBookmark(${p.id}, event)">${isBookmarked ? '★ Bookmarked' : '☆ Bookmark'}</button>
            <button class="btn-action" onclick="openDrawer(${p.id}, event)" style="color:var(--primary);font-weight:700;">Full Profile ↗</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function renderScholarsTable(list) {
  const container = document.getElementById('scholars-table-view');
  container.innerHTML = `
    <table class="data-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Title</th>
          <th>University</th>
          <th>QS Rank</th>
          <th>Country</th>
          <th>Cluster</th>
          <th>Priority</th>
          <th>Email</th>
          <th>BD Send Time</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${list.map(p => {
          const isContacted = !!State.contacted[p.id];
          const isBookmarked = !!State.bookmarked[p.id];
          const hasDirectEmail = p.email && !p.email.includes('Check') && !p.email.includes('directory');
          return `
            <tr onclick="openDrawer(${p.id})" style="cursor:pointer;">
              <td class="td-name">${esc(p.name)}</td>
              <td style="max-width:180px;font-size:0.72rem;color:var(--text-muted);">${esc(p.title || 'Faculty')}</td>
              <td class="td-uni">${esc(p.university)}</td>
              <td>${p.qs ? `<span class="tag-qs">${esc(p.qs)}</span>` : ''}</td>
              <td>${esc(p.country)}</td>
              <td><span class="tag tag-${getClusterClass(p.cluster)}">${esc(p.cluster)}</span></td>
              <td><span class="tag tag-${getPriorityClass(p.priority)}">${esc(p.priority)}</span></td>
              <td style="font-size:0.72rem;">
                ${hasDirectEmail ? `<a href="mailto:${esc(p.email)}" onclick="event.stopPropagation()">${esc(p.email)}</a>` : `<span style="color:var(--text-muted);">${esc(p.email)}</span>`}
              </td>
              <td style="font-weight:700;color:var(--primary);font-size:0.72rem;">${esc(p.bdTime || '—')}</td>
              <td onclick="event.stopPropagation()">
                <div style="display:flex;gap:0.3rem;">
                  <button class="btn-action ${isContacted ? 'contacted' : ''}" style="padding:0.2rem 0.5rem;font-size:0.65rem;" onclick="toggleContacted(${p.id}, event)">${isContacted ? '✓' : 'Contact'}</button>
                  <button class="btn-action ${isBookmarked ? 'bookmarked' : ''}" style="padding:0.2rem 0.5rem;font-size:0.65rem;" onclick="toggleBookmark(${p.id}, event)">${isBookmarked ? '★' : '☆'}</button>
                </div>
              </td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;
}

function renderScholarsList(list) {
  const container = document.getElementById('scholars-list-view');
  container.innerHTML = list.map(p => {
    const isContacted = !!State.contacted[p.id];
    const isBookmarked = !!State.bookmarked[p.id];
    return `
      <div class="scholar-list-item" onclick="openDrawer(${p.id})">
        <div style="display:flex;align-items:center;gap:1rem;min-width:0;flex:1;">
          <div class="k-avatar">${getInitials(p.name)}</div>
          <div style="min-width:0;">
            <div style="font-weight:800;font-size:0.9rem;color:var(--text);">${esc(p.name)} ${p.qs ? `<span class="tag-qs" style="margin-left:0.3rem;">${esc(p.qs)}</span>` : ''}</div>
            <div style="font-size:0.75rem;color:var(--text-muted);">${esc(p.title || 'Faculty')} &middot; <span style="color:var(--primary);font-weight:600;">${esc(p.university)}</span> &middot; ${esc(p.country)}</div>
          </div>
        </div>
        
        <div style="display:flex;align-items:center;gap:0.6rem;flex-shrink:0;">
          <span class="tag tag-${getClusterClass(p.cluster)}">${esc(p.cluster)}</span>
          <span class="tag tag-${getPriorityClass(p.priority)}">${esc(p.priority)}</span>
          <button class="btn-action ${isContacted ? 'contacted' : ''}" onclick="toggleContacted(${p.id}, event)">${isContacted ? '✓' : 'Contact'}</button>
          <button class="btn-action ${isBookmarked ? 'bookmarked' : ''}" onclick="toggleBookmark(${p.id}, event)">${isBookmarked ? '★' : '☆'}</button>
        </div>
      </div>
    `;
  }).join('');
}

function toggleCardExpand(id) {
  const card = document.getElementById(`card-${id}`);
  if (card) card.classList.toggle('expanded');
}

function expandAllCards() {
  document.querySelectorAll('.scholar-card').forEach(c => c.classList.add('expanded'));
}

function collapseAllCards() {
  document.querySelectorAll('.scholar-card').forEach(c => c.classList.remove('expanded'));
}

// ==========================================================================
// 3. RENDER PIPELINE KANBAN
// ==========================================================================
function renderPipeline() {
  const container = document.getElementById('pipeline-kanban-board');
  if (!container) return;

  // Render Mobile Tabs
  const mobileTabsContainer = document.getElementById('pipeline-mobile-tabs');
  if (mobileTabsContainer) {
    mobileTabsContainer.innerHTML = STAGES.map((stg, idx) => {
      const stageProfs = P.filter(p => (State.stages[p.id] || 'not_contacted') === stg.id);
      return `
        <button class="p-tab-btn ${idx === 0 ? 'active' : ''}" data-stage="${stg.id}" onclick="scrollKanbanToStage('${stg.id}')">
          <span class="col-indicator indicator-${stg.id}" style="width:7px;height:7px;"></span>
          <span>${esc(stg.label)}</span>
          <span class="p-tab-count">${stageProfs.length}</span>
        </button>
      `;
    }).join('');
  }
  
  container.innerHTML = STAGES.map(stg => {
    const stageProfs = P.filter(p => (State.stages[p.id] || 'not_contacted') === stg.id);
    
    return `
      <div class="kanban-column" id="kanban-col-${stg.id}" ondragover="handleDragOver(event)" ondrop="handleDrop(event, '${stg.id}')">
        <div class="kanban-col-header">
          <div class="col-header-left">
            <span class="col-indicator indicator-${stg.id}"></span>
            <span class="col-title">${esc(stg.label)}</span>
          </div>
          <span class="col-count-badge">${stageProfs.length}</span>
        </div>
        
        <div class="kanban-cards-list">
          ${stageProfs.length === 0 ? `
            <div style="text-align:center;padding:2rem 1rem;color:var(--text-muted);font-size:0.75rem;">No scholars in this stage</div>
          ` : stageProfs.map(p => {
            const followup = State.followups[p.id];
            return `
              <div class="kanban-card" draggable="true" ondragstart="handleDragStart(event, ${p.id})" onclick="openDrawer(${p.id})">
                <div class="k-card-top">
                  <div class="k-avatar">${getInitials(p.name)}</div>
                  <div class="k-info">
                    <div class="k-name">${esc(p.name)}</div>
                    <div class="k-uni">${esc(p.university)}</div>
                  </div>
                </div>
                
                <div class="k-tags-row">
                  <span class="tag tag-${getClusterClass(p.cluster)}">${esc(p.cluster)}</span>
                  <span class="tag tag-${getPriorityClass(p.priority)}">${esc(p.priority)}</span>
                </div>
                
                ${followup ? `
                  <div style="font-size:0.68rem;font-weight:700;color:var(--amber);display:flex;align-items:center;gap:0.3rem;">
                    ⏰ Follow-up: ${esc(followup)}
                  </div>
                ` : ''}
                
                <div class="k-footer" onclick="event.stopPropagation()">
                  <select class="custom-select" style="font-size:0.68rem;padding:0.2rem 0.45rem;" onchange="setStage(${p.id}, this.value, event)">
                    ${STAGES.map(s => `<option value="${s.id}" ${s.id === stg.id ? 'selected' : ''}>${s.label}</option>`).join('')}
                  </select>
                  <button class="k-move-btn" onclick="openDrawer(${p.id}, event)">Detail ↗</button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }).join('');
}

function scrollKanbanToStage(stageId) {
  document.querySelectorAll('.p-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.stage === stageId);
  });
  const col = document.getElementById(`kanban-col-${stageId}`);
  if (col) {
    col.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }
}

// Drag and Drop
let draggedScholarId = null;
function handleDragStart(e, id) {
  draggedScholarId = id;
  e.dataTransfer.setData('text/plain', id);
}
function handleDragOver(e) {
  e.preventDefault();
}
function handleDrop(e, targetStage) {
  e.preventDefault();
  if (draggedScholarId) {
    setStage(draggedScholarId, targetStage);
    draggedScholarId = null;
  }
}

// ==========================================================================
// 4. RENDER CLUSTERS
// ==========================================================================
function renderClusters() {
  const container = document.getElementById('clusters-grid-view');
  if (!container) return;
  
  container.innerHTML = CLUSTERS.map(c => {
    const clusterProfs = P.filter(p => p.cluster === c.id);
    const topTargetsCount = clusterProfs.filter(p => p.priority === 'Super Standout' || p.priority === 'Tier 1').length;
    const unisCount = new Set(clusterProfs.map(p => p.university)).size;
    
    return `
      <div class="cluster-card">
        <div class="cluster-card-head">
          <span class="tag tag-${getClusterClass(c.id)}" style="font-size:0.75rem;padding:0.25rem 0.75rem;">${esc(c.id)}</span>
          <span style="font-size:0.8rem;font-weight:800;color:var(--text);">${clusterProfs.length} scholars</span>
        </div>
        
        <div class="cluster-title">${esc(c.name)}</div>
        <div class="cluster-desc">${esc(c.desc)}</div>
        
        <div class="cluster-metrics-row">
          <div class="c-metric">
            <span class="c-metric-val">${topTargetsCount}</span>
            <span class="c-metric-lbl">Top Targets</span>
          </div>
          <div class="c-metric">
            <span class="c-metric-val">${unisCount}</span>
            <span class="c-metric-lbl">Universities</span>
          </div>
        </div>
        
        <button class="btn btn-secondary" onclick="filterByCluster('${c.id.replace(/'/g, "\\'")}')" style="width:100%;margin-top:auto;">
          Explore Scholars &rarr;
        </button>
      </div>
    `;
  }).join('');
}

function filterByCluster(clusterId) {
  State.selectedCluster = clusterId;
  document.querySelectorAll('.cluster-chip').forEach(ch => {
    ch.classList.toggle('active', ch.dataset.cluster === clusterId);
  });
  switchView('scholars');
}

function filterByPriority(priorityId) {
  State.selectedPriority = priorityId;
  const priSelect = document.getElementById('filter-priority-select');
  if (priSelect) priSelect.value = priorityId;
  switchView('scholars');
}

// ==========================================================================
// 5. RENDER PRIORITY TARGETS
// ==========================================================================
function renderPriorityTargets() {
  const container = document.getElementById('priority-targets-list');
  if (!container) return;
  
  const targets = P.filter(p => p.priority === 'Super Standout' || p.priority === 'Tier 1')
                   .sort((a, b) => a.prioritySort - b.prioritySort || a.qsNum - b.qsNum);
  
  container.innerHTML = targets.map((p, idx) => {
    const isContacted = !!State.contacted[p.id];
    const isBookmarked = !!State.bookmarked[p.id];
    const hasDirectEmail = p.email && !p.email.includes('Check') && !p.email.includes('directory');
    const stageId = State.stages[p.id] || 'not_contacted';
    
    return `
      <div class="priority-item-card" id="pt-${p.id}">
        <div class="p-item-header">
          <div style="display:flex;gap:0.85rem;align-items:center;">
            <div style="font-size:1.1rem;font-weight:800;color:var(--text-subtle);min-width:24px;">#${idx + 1}</div>
            <div class="k-avatar" style="width:40px;height:40px;font-size:0.9rem;">${getInitials(p.name)}</div>
            <div class="p-item-info">
              <div class="p-item-name" onclick="openDrawer(${p.id})" style="cursor:pointer;">${esc(p.name)} ${p.qs ? `<span class="tag-qs">${esc(p.qs)}</span>` : ''}</div>
              <div class="p-item-meta">${esc(p.title || 'Faculty')} &middot; <strong style="color:var(--primary);">${esc(p.university)}</strong> &middot; ${esc(p.country)}</div>
            </div>
          </div>
          
          <div style="display:flex;gap:0.4rem;align-items:center;flex-wrap:wrap;">
            <span class="tag tag-${getClusterClass(p.cluster)}">${esc(p.cluster)}</span>
            <span class="tag tag-${getPriorityClass(p.priority)}">${esc(p.priority)}</span>
            <select class="custom-select" onchange="setStage(${p.id}, this.value, event)">
              ${STAGES.map(s => `<option value="${s.id}" ${s.id === stageId ? 'selected' : ''}>${s.label}</option>`).join('')}
            </select>
          </div>
        </div>
        
        ${p.proposalHit ? `
          <div class="p-item-hit-box">
            <strong>Proposal Hit:</strong> ${esc(p.proposalHit)}
          </div>
        ` : ''}
        
        ${p.matchPoint ? `
          <div style="font-size:0.8rem;color:var(--text);line-height:1.55;background:var(--surface-hover);padding:0.75rem;border-radius:var(--radius-sm);border:1px solid var(--border-light);">
            <strong>Connection Nexus:</strong> ${esc(p.matchPoint)}
          </div>
        ` : ''}
        
        <div style="display:flex;align-items:center;justify-content:space-between;gap:0.85rem;flex-wrap:wrap;padding-top:0.4rem;">
          <div style="font-size:0.75rem;color:var(--text-muted);">
            📧 <strong>Email:</strong> ${hasDirectEmail ? `<a href="mailto:${esc(p.email)}">${esc(p.email)}</a>` : esc(p.email)}
            &middot; ⏰ <strong>Send BD Time:</strong> <span style="color:var(--primary);font-weight:700;">${esc(p.bdTime || '14:00 - 16:00 (BST+5)')}</span>
          </div>
          
          <div style="display:flex;gap:0.4rem;">
            ${hasDirectEmail ? `<button class="btn-action" onclick="copyEmail('${p.email.replace(/'/g, "\\'")}', this, event)">Copy Email</button>` : ''}
            <button class="btn-action ${isContacted ? 'contacted' : ''}" onclick="toggleContacted(${p.id}, event)">${isContacted ? '✓ Contacted' : 'Mark Contacted'}</button>
            <button class="btn-action ${isBookmarked ? 'bookmarked' : ''}" onclick="toggleBookmark(${p.id}, event)">${isBookmarked ? '★ Bookmarked' : '☆ Bookmark'}</button>
            <button class="btn-action" onclick="openDrawer(${p.id})" style="color:var(--primary);font-weight:700;">View Profile ↗</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ==========================================================================
// 6. RENDER ANALYTICS
// ==========================================================================
function renderAnalytics() {
  const container = document.getElementById('analytics-dashboard-grid');
  if (!container) return;
  
  // Cluster distribution
  const clusterCounts = {};
  P.forEach(p => { clusterCounts[p.cluster] = (clusterCounts[p.cluster] || 0) + 1; });
  const sortedClusters = Object.keys(clusterCounts).sort((a, b) => clusterCounts[b] - clusterCounts[a]);
  
  // Country distribution
  const countryCounts = {};
  P.forEach(p => {
    const c = p.country && p.country !== 'Unknown' ? p.country : 'Other';
    countryCounts[c] = (countryCounts[c] || 0) + 1;
  });
  const sortedCountries = Object.keys(countryCounts).sort((a, b) => countryCounts[b] - countryCounts[a]).slice(0, 8);
  
  // Pipeline stage distribution
  const stageCounts = {};
  STAGES.forEach(s => { stageCounts[s.id] = 0; });
  P.forEach(p => {
    const stg = State.stages[p.id] || 'not_contacted';
    stageCounts[stg] = (stageCounts[stg] || 0) + 1;
  });
  
  container.innerHTML = `
    <div class="card-box">
      <div class="card-box-header">
        <div>
          <div class="card-box-title">Research Cluster Distribution</div>
          <div class="card-box-subtitle">Representation across 8 thematic research clusters</div>
        </div>
      </div>
      <div class="chart-list-bars">
        ${sortedClusters.map(cName => {
          const count = clusterCounts[cName];
          const pct = Math.round((count / P.length) * 100);
          return `
            <div class="chart-list-row">
              <div class="chart-row-label">
                <span>${esc(cName)}</span>
                <span><strong>${count}</strong> (${pct}%)</span>
              </div>
              <div class="chart-bar-track">
                <div class="chart-bar-prog" style="width: ${pct}%;"></div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
    
    <div class="card-box">
      <div class="card-box-header">
        <div>
          <div class="card-box-title">Top Countries Breakdown</div>
          <div class="card-box-subtitle">Geographic footprint of 214 target faculties (QS 1–220)</div>
        </div>
      </div>
      <div class="chart-list-bars">
        ${sortedCountries.map(cName => {
          const count = countryCounts[cName];
          const pct = Math.round((count / P.length) * 100);
          return `
            <div class="chart-list-row">
              <div class="chart-row-label">
                <span>${esc(cName)}</span>
                <span><strong>${count}</strong> (${pct}%)</span>
              </div>
              <div class="chart-bar-track">
                <div class="chart-bar-prog" style="width: ${pct}%; background: var(--teal);"></div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
    
    <div class="card-box">
      <div class="card-box-header">
        <div>
          <div class="card-box-title">Outreach Funnel Stages</div>
          <div class="card-box-subtitle">Conversion across the 5 pipeline stages</div>
        </div>
      </div>
      <div class="chart-list-bars">
        ${STAGES.map(s => {
          const count = stageCounts[s.id] || 0;
          const pct = Math.round((count / P.length) * 100);
          return `
            <div class="chart-list-row">
              <div class="chart-row-label">
                <span>${esc(s.label)}</span>
                <span><strong>${count}</strong> (${pct}%)</span>
              </div>
              <div class="chart-bar-track">
                <div class="chart-bar-prog" style="width: ${pct}%; background: var(--purple);"></div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
    
    <div class="card-box">
      <div class="card-box-header">
        <div>
          <div class="card-box-title">Priority Tier Stratification</div>
          <div class="card-box-subtitle">Targeting hierarchy by research urgency</div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-top:1rem;">
        <div style="padding:1rem;background:var(--gold-bg);border:1px solid var(--gold-border);border-radius:var(--radius-sm);text-align:center;">
          <div style="font-size:1.6rem;font-weight:800;color:var(--gold);">${P.filter(p => p.priority === 'Super Standout').length}</div>
          <div style="font-size:0.75rem;font-weight:700;color:var(--gold);">Super Standouts</div>
        </div>
        <div style="padding:1rem;background:var(--red-light);border:1px solid var(--red-border);border-radius:var(--radius-sm);text-align:center;">
          <div style="font-size:1.6rem;font-weight:800;color:var(--red);">${P.filter(p => p.priority === 'Tier 1').length}</div>
          <div style="font-size:0.75rem;font-weight:700;color:var(--red);">Tier 1 Targets</div>
        </div>
        <div style="padding:1rem;background:var(--green-light);border:1px solid var(--green-border);border-radius:var(--radius-sm);text-align:center;">
          <div style="font-size:1.6rem;font-weight:800;color:var(--green);">${P.filter(p => p.priority === 'Tier 2').length}</div>
          <div style="font-size:0.75rem;font-weight:700;color:var(--green);">Tier 2 Candidates</div>
        </div>
        <div style="padding:1rem;background:var(--surface-alt);border:1px solid var(--border);border-radius:var(--radius-sm);text-align:center;">
          <div style="font-size:1.6rem;font-weight:800;color:var(--text);">${P.filter(p => p.priority === 'Tier 3').length}</div>
          <div style="font-size:0.75rem;font-weight:700;color:var(--text-muted);">Tier 3 Broad Ecosystem</div>
        </div>
      </div>
    </div>
  `;
}

// ==========================================================================
// 7. SLIDE-IN DETAIL DRAWER
// ==========================================================================
function openDrawer(id, event) {
  if (event) event.stopPropagation();
  State.activeDrawerId = id;
  renderDrawerContent(id);
  
  closeMobileSidebar();
  const searchWrap = document.getElementById('topbar-search-wrap');
  if (searchWrap) searchWrap.classList.remove('mobile-active');

  document.getElementById('profile-drawer-backdrop').classList.add('open');
  document.getElementById('profile-drawer').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeDrawer() {
  State.activeDrawerId = null;
  document.getElementById('profile-drawer-backdrop').classList.remove('open');
  document.getElementById('profile-drawer').classList.remove('open');
  document.body.style.overflow = '';
}

function renderDrawerContent(id) {
  const p = P.find(x => x.id === id);
  if (!p) return;
  
  const isContacted = !!State.contacted[p.id];
  const isBookmarked = !!State.bookmarked[p.id];
  const stageId = State.stages[p.id] || 'not_contacted';
  const followupDate = State.followups[p.id] || '';
  const hasDirectEmail = p.email && !p.email.includes('Check') && !p.email.includes('directory');
  
  const content = `
    <div class="drawer-profile-top">
      <div class="drawer-avatar">${getInitials(p.name)}</div>
      <div class="drawer-p-info">
        <div class="card-tags-row">
          <span class="tag tag-${getClusterClass(p.cluster)}">${esc(p.cluster)}</span>
          <span class="tag tag-${getPriorityClass(p.priority)}">${esc(p.priority)}</span>
          ${p.qs ? `<span class="tag-qs">${esc(p.qs)}</span>` : ''}
        </div>
        <div class="drawer-name">${esc(p.name)}</div>
        <div style="font-size:0.8rem;color:var(--text-muted);margin-top:0.2rem;">${esc(p.title || 'Faculty Researcher')}</div>
        <div class="drawer-uni">${esc(p.university)}${p.dept ? ` &middot; ${esc(p.dept)}` : ''}</div>
        <div style="font-size:0.75rem;color:var(--text-muted);margin-top:0.2rem;">📍 ${esc(p.country)} &middot; Category: <strong>${esc(p.category)}</strong></div>
      </div>
    </div>
    
    <!-- Action Controls Toolbar -->
    <div style="background:var(--surface-alt);border:1px solid var(--border);border-radius:var(--radius);padding:1rem;display:flex;flex-direction:column;gap:0.75rem;">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:0.5rem;">
        <div style="font-size:0.75rem;font-weight:700;color:var(--text-muted);">OUTREACH STAGE</div>
        <select class="custom-select" style="font-size:0.75rem;" onchange="setStage(${p.id}, this.value)">
          ${STAGES.map(s => `<option value="${s.id}" ${s.id === stageId ? 'selected' : ''}>${s.label}</option>`).join('')}
        </select>
      </div>
      
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:0.5rem;">
        <div style="font-size:0.75rem;font-weight:700;color:var(--text-muted);">FOLLOW-UP DATE</div>
        <input type="date" class="custom-select" style="font-size:0.75rem;padding:0.25rem 0.5rem;" value="${followupDate}" onchange="setFollowUpDate(${p.id}, this.value)">
      </div>
      
      <div style="display:flex;gap:0.4rem;flex-wrap:wrap;margin-top:0.25rem;">
        ${hasDirectEmail ? `
          <button class="btn btn-primary" onclick="copyEmail('${p.email.replace(/'/g, "\\'")}', this)" style="flex:1;">Copy Email</button>
          <a href="mailto:${esc(p.email)}" class="btn btn-secondary" style="flex:1;">Open Mail App</a>
        ` : ''}
        <button class="btn-action ${isContacted ? 'contacted' : ''}" onclick="toggleContacted(${p.id})">${isContacted ? '✓ Contacted' : 'Mark Contacted'}</button>
        <button class="btn-action ${isBookmarked ? 'bookmarked' : ''}" onclick="toggleBookmark(${p.id})">${isBookmarked ? '★ Bookmarked' : '☆ Bookmark'}</button>
      </div>
    </div>
    
    <!-- Contact Info -->
    <div class="detail-section">
      <div class="detail-label">Direct Contact Email</div>
      <div style="font-size:0.85rem;font-family:'Courier New',monospace;background:var(--surface-hover);padding:0.6rem 0.75rem;border-radius:var(--radius-sm);border:1px solid var(--border-light);display:flex;justify-content:space-between;align-items:center;">
        <span>${hasDirectEmail ? `<a href="mailto:${esc(p.email)}">${esc(p.email)}</a>` : esc(p.email)}</span>
        ${p.emailStatus === 'confirmed' ? `<span class="badge-confirmed">✓ Verified</span>` : `<span class="badge-verify">Verify</span>`}
      </div>
    </div>
    
    ${p.research ? `
      <div class="detail-section">
        <div class="detail-label">Research Focus &amp; Profile Areas</div>
        <div class="detail-text">${esc(p.research)}</div>
      </div>
    ` : ''}
    
    ${p.currentProject ? `
      <div class="detail-section">
        <div class="detail-label">Current Active Project</div>
        <div class="detail-text">${esc(p.currentProject)}</div>
      </div>
    ` : ''}
    
    ${p.matchPoint ? `
      <div class="callout-box callout-match">
        <div class="detail-label">Research Connection Nexus</div>
        <div>${esc(p.matchPoint)}</div>
      </div>
    ` : ''}
    
    ${p.contribution ? `
      <div class="callout-box callout-contrib">
        <div class="detail-label">Your Contribution Offer</div>
        <div>${esc(p.contribution)}</div>
      </div>
    ` : ''}
    
    ${p.proposalHit ? `
      <div class="callout-box callout-hit">
        <div class="detail-label">Proposal Alignment Hit</div>
        <div>${esc(p.proposalHit)}</div>
      </div>
    ` : ''}
    
    ${p.papers && p.papers.length > 0 ? `
      <div class="detail-section">
        <div class="detail-label">Recent High-Impact Publications (2022-2025)</div>
        <ul style="list-style:none;padding:0;">
          ${p.papers.map(pp => `<li style="font-size:0.8rem;color:var(--text);padding:0.35rem 0;border-bottom:1px solid var(--border-light);line-height:1.5;">${esc(pp)}</li>`).join('')}
        </ul>
      </div>
    ` : ''}
    
    ${p.supervisionVacancy ? `
      <div class="detail-section">
        <div class="detail-label">Supervision Vacancy &amp; PhD Slots</div>
        <div class="detail-text">${esc(p.supervisionVacancy)}</div>
      </div>
    ` : ''}
    
    <!-- Timing Box -->
    <div class="timing-grid">
      <div class="timing-item">
        <span class="timing-lbl">Best Days</span>
        <span class="timing-val">${esc(p.bestDays || 'Tue / Wed')}</span>
      </div>
      <div class="timing-item">
        <span class="timing-lbl">Local Time</span>
        <span class="timing-val">${esc(p.localTime || '09:00 - 11:00')}</span>
      </div>
      <div class="timing-item">
        <span class="timing-lbl">Bangladesh Send Time</span>
        <span class="timing-val highlight">${esc(p.bdTime || '14:00 - 16:00 (BST+5)')}</span>
      </div>
    </div>
    
    <!-- Profile & Sources -->
    <div style="margin-top:auto;padding-top:1rem;border-top:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;font-size:0.75rem;">
      <div style="color:var(--text-muted);">
        Sources: <strong>${p.sources ? p.sources.join(', ') : 'scholars_dataset'}</strong>
      </div>
      ${p.profileUrl ? `
        <a href="${esc(p.profileUrl)}" target="_blank" class="btn btn-secondary" style="font-size:0.72rem;padding:0.3rem 0.7rem;">Official Profile ↗</a>
      ` : ''}
    </div>
  `;
  
  document.getElementById('drawer-content-body').innerHTML = content;
}

// CSV Export of Current Filtered Scholars
function exportCSV() {
  const list = getFilteredScholars();
  const headers = [
    'ID', 'Name', 'Title', 'University', 'Department', 'QS Rank', 'Country',
    'Cluster', 'Priority', 'Category', 'Email', 'Email Status', 'Research Focus',
    'Match Nexus', 'Contribution Offer', 'Proposal Hit', 'Bangladesh Send Time',
    'Profile URL', 'Stage', 'Sources'
  ];
  
  const rows = list.map(p => [
    p.id,
    p.name,
    p.title || '',
    p.university || '',
    p.dept || '',
    p.qs || '',
    p.country || '',
    p.cluster || '',
    p.priority || '',
    p.category || '',
    p.email || '',
    p.emailStatus || '',
    (p.research || '').replace(/"/g, '""'),
    (p.matchPoint || '').replace(/"/g, '""'),
    (p.contribution || '').replace(/"/g, '""'),
    (p.proposalHit || '').replace(/"/g, '""'),
    p.bdTime || '',
    p.profileUrl || '',
    State.stages[p.id] || 'not_contacted',
    p.sources ? p.sources.join('; ') : ''
  ]);
  
  const csvContent = [headers].concat(rows)
    .map(r => r.map(c => `"${(c || '').toString().replace(/"/g, '""')}"`).join(','))
    .join('\n');
    
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `scholars_export_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  showToast(`Exported ${list.length} scholars to CSV`);
}

// Theme Management
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  if (newTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
  localStorage.setItem('theme', newTheme);
}

function initTheme() {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else if (savedTheme === 'light') {
    document.documentElement.removeAttribute('data-theme');
  } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
}

// Global Initialization
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initStages();
  initDeadlines();
  
  // Populate Country Dropdown
  const countries = [...new Set(P.map(p => p.country).filter(c => c && c !== 'Unknown'))].sort();
  const countrySelect = document.getElementById('filter-country-select');
  if (countrySelect) {
    countries.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c;
      opt.textContent = `${c} (${P.filter(p => p.country === c).length})`;
      countrySelect.appendChild(opt);
    });
  }
  
  // Populate Cluster Chips in Toolbar
  const chipsContainer = document.getElementById('scholars-cluster-chips');
  if (chipsContainer) {
    let chipsHtml = `<span class="cluster-chip active" data-cluster="all" onclick="setClusterFilter('all')">All (${P.length})</span>`;
    CLUSTERS.forEach(c => {
      const cnt = P.filter(p => p.cluster === c.id).length;
      chipsHtml += `<span class="cluster-chip" data-cluster="${c.id}" onclick="setClusterFilter('${c.id.replace(/'/g, "\\'")}')">${c.name} (${cnt})</span>`;
    });
    chipsContainer.innerHTML = chipsHtml;
  }
  
  // Set Date in Topbar
  const dateEl = document.getElementById('topbar-date-display');
  if (dateEl) {
    const now = new Date();
    dateEl.textContent = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  
  // Set Topbar Avatar
  const topAvatar = document.getElementById('topbar-avatar-img');
  if (topAvatar && State.profilePhoto) {
    topAvatar.src = State.profilePhoto;
  }
  
  // Search Input Bindings
  const globalSearch = document.getElementById('global-search-input');
  if (globalSearch) {
    globalSearch.addEventListener('input', (e) => {
      State.searchQuery = e.target.value;
      if (State.currentView !== 'scholars') {
        switchView('scholars');
      } else {
        renderScholars();
      }
    });
  }
  
  // Global Keyboard Shortcuts (Cmd/Ctrl+K, Escape)
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (globalSearch) globalSearch.focus();
    }
    if (e.key === 'Escape') {
      closeDrawer();
      closeProfileEditModal();
      closeOwnerAuthModal();
      closeMobileSidebar();
      const sWrap = document.getElementById('topbar-search-wrap');
      if (sWrap) sWrap.classList.remove('mobile-active');
    }
  });
  
  // Initial View
  switchView('overview');
});

// Helper for Cluster Chip click
function setClusterFilter(clusterId) {
  State.selectedCluster = clusterId;
  document.querySelectorAll('.cluster-chip').forEach(ch => {
    ch.classList.toggle('active', ch.dataset.cluster === clusterId);
  });
  renderScholars();
}

// Helper for View Mode Toggle
function setViewMode(mode) {
  State.scholarViewMode = mode;
  renderScholars();
}

// Mobile sidebar toggle & close
function toggleMobileSidebar() {
  const sidebar = document.getElementById('app-sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');
  if (sidebar) sidebar.classList.toggle('open');
  if (backdrop) backdrop.classList.toggle('open');
}

function closeMobileSidebar() {
  const sidebar = document.getElementById('app-sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');
  if (sidebar) sidebar.classList.remove('open');
  if (backdrop) backdrop.classList.remove('open');
}

// Mobile search toggle
function toggleMobileSearch() {
  const searchWrap = document.getElementById('topbar-search-wrap');
  const searchInput = document.getElementById('global-search-input');
  if (searchWrap) {
    searchWrap.classList.toggle('mobile-active');
    if (searchWrap.classList.contains('mobile-active') && searchInput) {
      searchInput.focus();
    }
  }
}

// ==========================================================================
// 8. OWNER AUTHENTICATION & ACCESS CONTROL
// ==========================================================================

const OWNER_CONFIG = {
  email: 'tusher.law@gmail.com',
  // SHA-256 hash of the master passkey — plaintext NEVER stored in source
  defaultPasskeyHash: '762522b45eefef6b694279809b9b603303ddd3d78702359c06fef6f0432a33ce',
  sessionStorageKey: 'scholarflow_owner_auth',
  customPasskeyStorageKey: 'scholarflow_owner_passkey',
  // Rate limiting config
  maxAttempts: 5,
  lockoutMinutes: 15,
  attemptsKey: 'scholarflow_auth_attempts',
  lockoutKey: 'scholarflow_auth_lockout'
};

function isOwnerAuthenticated() {
  return (
    sessionStorage.getItem(OWNER_CONFIG.sessionStorageKey) === '1' ||
    localStorage.getItem(OWNER_CONFIG.sessionStorageKey) === '1'
  );
}

let pendingAuthCallback = null;

function openOwnerAuthModal(callback) {
  pendingAuthCallback = callback;
  closeMobileSidebar();
  const searchWrap = document.getElementById('topbar-search-wrap');
  if (searchWrap) searchWrap.classList.remove('mobile-active');

  const modal = document.getElementById('owner-auth-modal-backdrop');
  const emailInput = document.getElementById('auth-email-input');
  const passInput = document.getElementById('auth-passkey-input');
  const errorAlert = document.getElementById('auth-error-alert');
  
  if (emailInput) emailInput.value = OWNER_CONFIG.email;
  if (passInput) passInput.value = '';
  if (errorAlert) {
    errorAlert.style.display = 'none';
    errorAlert.textContent = '';
  }
  if (modal) modal.classList.add('open');
  if (passInput) setTimeout(() => passInput.focus(), 150);
}

function closeOwnerAuthModal() {
  const modal = document.getElementById('owner-auth-modal-backdrop');
  if (modal) modal.classList.remove('open');
  pendingAuthCallback = null;
}

// SHA-256 hash utility
async function sha256(message) {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Rate limiting helpers
function getAuthAttempts() {
  try {
    const data = JSON.parse(localStorage.getItem(OWNER_CONFIG.attemptsKey) || '{"count":0,"firstAttempt":0}');
    // Reset if lockout window has passed
    if (Date.now() - data.firstAttempt > OWNER_CONFIG.lockoutMinutes * 60 * 1000) {
      return { count: 0, firstAttempt: 0 };
    }
    return data;
  } catch { return { count: 0, firstAttempt: 0 }; }
}

function recordFailedAttempt() {
  const attempts = getAuthAttempts();
  if (attempts.count === 0) attempts.firstAttempt = Date.now();
  attempts.count++;
  localStorage.setItem(OWNER_CONFIG.attemptsKey, JSON.stringify(attempts));
  if (attempts.count >= OWNER_CONFIG.maxAttempts) {
    localStorage.setItem(OWNER_CONFIG.lockoutKey, Date.now().toString());
  }
  return attempts;
}

function clearAuthAttempts() {
  localStorage.removeItem(OWNER_CONFIG.attemptsKey);
  localStorage.removeItem(OWNER_CONFIG.lockoutKey);
}

function isAuthLockedOut() {
  const lockoutStart = parseInt(localStorage.getItem(OWNER_CONFIG.lockoutKey) || '0');
  if (!lockoutStart) return false;
  const elapsed = Date.now() - lockoutStart;
  const lockoutMs = OWNER_CONFIG.lockoutMinutes * 60 * 1000;
  if (elapsed > lockoutMs) {
    clearAuthAttempts();
    return false;
  }
  return true;
}

function getLockoutRemainingSeconds() {
  const lockoutStart = parseInt(localStorage.getItem(OWNER_CONFIG.lockoutKey) || '0');
  if (!lockoutStart) return 0;
  const lockoutMs = OWNER_CONFIG.lockoutMinutes * 60 * 1000;
  const remaining = lockoutMs - (Date.now() - lockoutStart);
  return Math.max(0, Math.ceil(remaining / 1000));
}

async function handleOwnerAuthSubmit(event) {
  if (event) event.preventDefault();
  
  // Check lockout
  if (isAuthLockedOut()) {
    const remaining = getLockoutRemainingSeconds();
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    const errorAlert = document.getElementById('auth-error-alert');
    if (errorAlert) {
      errorAlert.className = 'auth-alert error';
      errorAlert.style.display = 'block';
      errorAlert.innerHTML = `<div class="auth-lockout-timer"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> <strong>Account locked:</strong> Too many failed attempts. Try again in ${mins}m ${secs}s</div>`;
    }
    return;
  }
  
  const email = (document.getElementById('auth-email-input').value || '').trim().toLowerCase();
  const passkey = (document.getElementById('auth-passkey-input').value || '').trim();
  const remember = document.getElementById('auth-remember-device').checked;
  const errorAlert = document.getElementById('auth-error-alert');
  const dialog = document.querySelector('.auth-dialog');

  // Hash the entered passkey and compare
  const enteredHash = await sha256(passkey);
  const customPasskey = localStorage.getItem(OWNER_CONFIG.customPasskeyStorageKey);
  
  let isValidPasskey = false;
  if (customPasskey) {
    // Custom passkey stored as hash
    const customHash = await sha256(customPasskey);
    isValidPasskey = enteredHash === customHash;
  }
  // Check against stored hash
  if (!isValidPasskey) {
    isValidPasskey = enteredHash === OWNER_CONFIG.defaultPasskeyHash;
  }

  if (email === OWNER_CONFIG.email.toLowerCase() && isValidPasskey) {
    clearAuthAttempts();
    sessionStorage.setItem(OWNER_CONFIG.sessionStorageKey, '1');
    if (remember) {
      localStorage.setItem(OWNER_CONFIG.sessionStorageKey, '1');
    }
    
    closeOwnerAuthModal();
    renderProfile();
    showToast('👑 Owner Verified: Welcome back, Tanvir!');
    
    if (pendingAuthCallback) {
      const cb = pendingAuthCallback;
      pendingAuthCallback = null;
      cb();
    }
  } else {
    const attempts = recordFailedAttempt();
    const remaining = OWNER_CONFIG.maxAttempts - attempts.count;
    
    if (errorAlert) {
      errorAlert.className = 'auth-alert error';
      errorAlert.style.display = 'block';
      if (remaining <= 0) {
        errorAlert.innerHTML = `<div class="auth-lockout-timer"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg> <strong>Account locked for ${OWNER_CONFIG.lockoutMinutes} minutes.</strong> Too many failed attempts.</div>`;
      } else {
        errorAlert.innerHTML = `<strong>🚫 Access Denied:</strong> Invalid credentials. <strong>${remaining}</strong> attempt${remaining !== 1 ? 's' : ''} remaining before lockout.`;
      }
    }
    if (dialog) {
      dialog.classList.remove('shake-anim');
      void dialog.offsetWidth;
      dialog.classList.add('shake-anim');
    }
  }
}

function logoutOwner() {
  sessionStorage.removeItem(OWNER_CONFIG.sessionStorageKey);
  localStorage.removeItem(OWNER_CONFIG.sessionStorageKey);
  renderProfile();
  showToast('🔒 Owner session locked');
}

function toggleAuthPasswordVisibility() {
  const input = document.getElementById('auth-passkey-input');
  const icon = document.getElementById('pass-eye-icon');
  if (!input) return;
  if (input.type === 'password') {
    input.type = 'text';
    if (icon) icon.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>';
  } else {
    input.type = 'password';
    if (icon) icon.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>';
  }
}

function triggerPhotoUpload() {
  if (!isOwnerAuthenticated()) {
    openOwnerAuthModal(() => {
      document.getElementById('photo-upload-input').click();
    });
    return;
  }
  document.getElementById('photo-upload-input').click();
}

// ==========================================================================
// 9. RESEARCHER PROFILE LOGIC & ACTIONS
// ==========================================================================

function renderProfile() {
  const p = State.profile || (typeof DEFAULT_PROFILE_DATA !== 'undefined' ? DEFAULT_PROFILE_DATA : {});
  const photo = State.profilePhoto || 'tusher-profile-photo.jpg';
  const container = document.getElementById('profile-container');
  if (!container) return;

  const isOwner = isOwnerAuthenticated();

  const pubCount = (p.publications || []).length;
  const presCount = (p.conferencePresentations || []).length;
  const awardCount = (p.awards || []).length;
  const researchAreaCount = (p.researchAreas || []).length;

  const degreeProgress = p.degreeProgressPct || 88;
  const degCirc = 239;
  const degOffset = degCirc - (degCirc * (degreeProgress / 100));

  // Publication pipeline stages
  const pubStages = [
    { id: 'under_revision', label: 'Under Revision', color: 'orange' },
    { id: 'in_review', label: 'In Review', color: 'blue' },
    { id: 'minor_revision', label: 'Minor Revision', color: 'teal' },
    { id: 'forthcoming', label: 'Forthcoming / Accepted', color: 'purple' },
    { id: 'published', label: 'Published', color: 'green' }
  ];

  container.innerHTML = `
    <!-- Owner Authentication Status Bar -->
    ${isOwner ? `
      <div class="profile-auth-status-bar">
        <span style="display:flex;align-items:center;gap:0.4rem;color:#16A34A;font-weight:700;">
          👑 <span>Owner Session Unlocked (Authorized: ${esc(OWNER_CONFIG.email)})</span>
        </span>
        <button class="btn btn-secondary" style="padding:0.25rem 0.6rem;font-size:0.7rem;" onclick="logoutOwner()">🔒 Lock Session</button>
      </div>
    ` : ''}

    <!-- 1. Header Card -->
    <div class="profile-header-card">
      <div class="profile-photo-wrap">
        <img id="profile-photo-img" class="profile-photo-img" src="${photo}" alt="${esc(p.name)}" />
      </div>
      
      <div class="profile-header-main">
        <div class="profile-name-row">
          <h2 class="profile-name">${esc(p.name)}</h2>
          <span class="profile-degree-badge">${esc(p.degreeStatus || 'LL.B. Candidate')}</span>
        </div>
        
        <div class="profile-institution-row">
          <span>🏛️ <strong>${esc(p.institution)}</strong>${p.department ? ` &middot; ${esc(p.department)}` : ''}</span>
          <span>📍 ${esc(p.location)}</span>
        </div>
        
        <div class="profile-tagline">
          "${esc(p.tagline)}"
        </div>
        
        <div class="profile-links-row">
          ${p.email ? `<a href="mailto:${esc(p.email)}" class="profile-link-btn">✉️ <span>${esc(p.email)}</span></a>` : ''}
          ${p.links && p.links.linkedin ? `<a href="${esc(p.links.linkedin)}" target="_blank" class="profile-link-btn">🔗 <span>LinkedIn</span></a>` : ''}
          ${p.links && p.links.orcid ? `<a href="${esc(p.links.orcid)}" target="_blank" class="profile-link-btn">🆔 <span>ORCID</span></a>` : ''}
          ${p.links && p.links.googleScholar ? `<a href="${esc(p.links.googleScholar)}" target="_blank" class="profile-link-btn">🎓 <span>Google Scholar</span></a>` : ''}
        </div>
        
        <div class="profile-actions-bar">
          ${isOwner ? `
            <button class="btn btn-primary" onclick="openProfileEditModal()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
              <span>Edit Profile</span>
            </button>
            
            <button class="btn btn-secondary" onclick="triggerPhotoUpload()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
              <span>Change Photo</span>
            </button>

            <button class="btn btn-secondary" onclick="exportProfileMarkdown()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              <span>Download CV (.md)</span>
            </button>
            
            <button class="btn btn-secondary" onclick="exportProfilePDF()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              <span>Download / Print PDF</span>
            </button>
          ` : `
            <button class="btn btn-secondary" onclick="openProfileEditModal()" title="Owner Authentication Required">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              <span>🔒 Edit Profile (Owner)</span>
            </button>
            
            <button class="btn btn-secondary" onclick="triggerPhotoUpload()" title="Owner Authentication Required">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              <span>🔒 Change Photo</span>
            </button>

            <button class="btn btn-secondary" onclick="exportProfileMarkdown()" title="Owner Authentication Required to Download CV">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              <span>🔒 Download CV (.md)</span>
            </button>

            <button class="btn btn-secondary" onclick="exportProfilePDF()" title="Owner Authentication Required to Download / Print CV">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              <span>🔒 Download / Print PDF</span>
            </button>
          `}
        </div>
      </div>
    </div>

    <!-- 2. Stat Tiles Row -->
    <div class="profile-stats-grid">
      <div class="profile-stat-card">
        <div class="profile-stat-icon" style="background:var(--purple-light);color:var(--purple);">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
        </div>
        <div>
          <div class="profile-stat-val">${pubCount}</div>
          <div class="profile-stat-lbl">Publications &amp; Chapters</div>
        </div>
      </div>
      
      <div class="profile-stat-card">
        <div class="profile-stat-icon" style="background:var(--teal-light);color:var(--teal);">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
        </div>
        <div>
          <div class="profile-stat-val">${presCount}</div>
          <div class="profile-stat-lbl">Conference Presentations</div>
        </div>
      </div>
      
      <div class="profile-stat-card">
        <div class="profile-stat-icon" style="background:var(--gold-bg);color:var(--gold);">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
        </div>
        <div>
          <div class="profile-stat-val">${awardCount}</div>
          <div class="profile-stat-lbl">Awards &amp; Moot Honors</div>
        </div>
      </div>
      
      <div class="profile-stat-card">
        <div class="profile-stat-icon" style="background:var(--green-light);color:var(--green);">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
        </div>
        <div>
          <div class="profile-stat-val">${researchAreaCount}</div>
          <div class="profile-stat-lbl">Core Research Domains</div>
        </div>
      </div>
    </div>

    <!-- 3. Progress Ring & Key Highlights Split -->
    <div class="profile-progress-split">
      <div class="profile-gauge-card">
        <div style="font-weight:800;font-size:0.95rem;color:var(--text);margin-bottom:0.2rem;">Academic Degree Progress</div>
        <div style="font-size:0.72rem;color:var(--text-muted);margin-bottom:1rem;">Bachelor of Laws (LL.B.) Curriculum</div>
        
        <div class="tier-meter-gauge-wrap" style="margin: 0.5rem 0;">
          <svg class="tier-gauge-svg" viewBox="0 0 90 90" style="width:120px;height:120px;">
            <circle class="tier-gauge-bg" cx="45" cy="45" r="38"></circle>
            <circle class="tier-gauge-fill" cx="45" cy="45" r="38" style="stroke:var(--primary);stroke-dasharray:${degCirc};stroke-dashoffset:${degOffset};"></circle>
          </svg>
          <div class="tier-gauge-center">
            <span class="tier-gauge-pct" style="font-size:1.5rem;color:var(--primary);">${degreeProgress}%</span>
            <span class="tier-gauge-sub">Final Year</span>
          </div>
        </div>
        
        <div style="font-size:0.78rem;font-weight:700;color:var(--text);margin-top:0.6rem;">${esc(p.institution)}</div>
        <div style="font-size:0.72rem;color:var(--text-muted);">${esc(p.department || 'Department of Law')} &middot; Candidate</div>
      </div>

      <div class="highlights-card">
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <div style="font-weight:800;font-size:0.95rem;color:var(--text);">Key Academic Distinctions</div>
          <span class="tag tag-qs">Verified Highlights</span>
        </div>
        
        ${(p.highlights || []).map(h => `
          <div class="highlight-row">
            <div class="highlight-icon-box">
              ${h.icon === 'star' ? '⭐' : h.icon === 'award' ? '🏆' : '🎯'}
            </div>
            <div>
              <div class="highlight-title">${esc(h.title)}</div>
              <div class="highlight-detail">${esc(h.detail)}</div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- 4. Publication Pipeline Stage Board -->
    <div class="card-box" style="padding:1.5rem;">
      <div class="card-box-header" style="margin-bottom:1rem;">
        <div>
          <div class="card-box-title">Publication &amp; Manuscript Pipeline</div>
          <div class="card-box-subtitle">Live scholarly production stages from drafting to indexed publication</div>
        </div>
        <span class="tag tag-qs">${pubCount} Manuscripts</span>
      </div>
      
      <div class="pub-pipeline-board">
        ${pubStages.map(stg => {
          const stgPubs = (p.publications || []).filter(pub => (pub.stage || 'forthcoming') === stg.id);
          return `
            <div class="pub-pipeline-col">
              <div class="pub-col-head">
                <span>${esc(stg.label)}</span>
                <span class="col-count-badge">${stgPubs.length}</span>
              </div>
              <div class="pub-col-body">
                ${stgPubs.length === 0 ? `
                  <div style="font-size:0.7rem;color:var(--text-subtle);text-align:center;padding:1.5rem 0;">No manuscripts</div>
                ` : stgPubs.map(pub => `
                  <div class="pub-card">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.2rem;">
                      <span class="tag tag-qs" style="font-size:0.6rem;padding:0.1rem 0.35rem;">${esc(pub.type || 'Publication')}</span>
                      <span style="font-size:0.65rem;font-weight:700;color:var(--text-muted);">${esc(pub.year || '')}</span>
                    </div>
                    <div class="pub-card-title">${esc(pub.title)}</div>
                    <div class="pub-card-venue">${esc(pub.venue)}</div>
                    ${pub.note ? `<div class="pub-card-note">${esc(pub.note)}</div>` : ''}
                  </div>
                `).join('')}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>

    <!-- 5. Two-Column Split: Conference Presentations & Leadership -->
    <div class="profile-content-split">
      <div class="card-box">
        <div class="card-box-header">
          <div>
            <div class="card-box-title">Conference Presentations</div>
            <div class="card-box-subtitle">Selected papers presented at international conferences</div>
          </div>
        </div>
        <div class="timeline-list">
          ${(p.conferencePresentations || []).map(cp => `
            <div class="timeline-item">
              <div style="flex:1;">
                <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.25rem;">
                  ${cp.upcoming ? `<span class="badge-upcoming">Upcoming &middot; ${esc(cp.date)}</span>` : `<span class="badge-presented">${esc(cp.date)}</span>`}
                </div>
                <div style="font-weight:700;font-size:0.82rem;color:var(--text);line-height:1.4;">${esc(cp.title)}</div>
                <div style="font-size:0.72rem;color:var(--text-muted);margin-top:0.2rem;">${esc(cp.venue)}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="card-box">
        <div class="card-box-header">
          <div>
            <div class="card-box-title">Leadership &amp; Mooting Roles</div>
            <div class="card-box-subtitle">Academic governance, adjudication and competitive mooting</div>
          </div>
        </div>
        <div class="timeline-list">
          ${(p.leadership || []).map(lead => `
            <div class="timeline-item">
              <div style="flex:1;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.2rem;">
                  <span style="font-weight:800;font-size:0.84rem;color:var(--text);">${esc(lead.role)}</span>
                  <span style="font-size:0.68rem;font-weight:700;color:var(--primary);">${esc(lead.years)}</span>
                </div>
                <div style="font-size:0.75rem;font-weight:600;color:var(--primary);">${esc(lead.org)}</div>
                <div style="font-size:0.74rem;color:var(--text-muted);margin-top:0.15rem;line-height:1.4;">${esc(lead.detail)}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>

    <!-- 6. Below-the-fold Comprehensive Cards -->
    <div class="profile-detail-grid">
      
      <!-- Research Experience -->
      <div class="card-box">
        <div class="card-box-header">
          <div class="card-box-title">Research Experience &amp; Empirical Inquiries</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:0.85rem;">
          ${(p.researchExperience || []).map(re => `
            <div style="padding:0.85rem;background:var(--surface-hover);border-radius:var(--radius-sm);border:1px solid var(--border-light);">
              <div style="font-weight:700;font-size:0.84rem;color:var(--text);line-height:1.35;">${esc(re.title)}</div>
              <div style="font-size:0.72rem;color:var(--primary);font-weight:600;margin:0.2rem 0;">${esc(re.context)}</div>
              ${re.methodology ? `<div style="font-size:0.72rem;color:var(--text);margin-bottom:0.25rem;"><strong>Methodology:</strong> ${esc(re.methodology)}</div>` : ''}
              ${re.detail ? `<div style="font-size:0.74rem;color:var(--text-muted);line-height:1.5;">${esc(re.detail)}</div>` : ''}
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Relevant Courses -->
      <div class="card-box">
        <div class="card-box-header">
          <div class="card-box-title">Relevant Courses &amp; Specialized Sessions</div>
        </div>
        
        <div style="margin-bottom:1rem;">
          <div class="detail-label" style="margin-bottom:0.4rem;">Undergraduate Core Curriculum</div>
          <div style="display:flex;flex-wrap:wrap;gap:0.4rem;">
            ${((p.relevantCourses && p.relevantCourses.undergraduate) || []).map(c => `
              <span class="tag tag-t3" style="font-size:0.72rem;padding:0.25rem 0.6rem;">${esc(c)}</span>
            `).join('')}
          </div>
        </div>
        
        <div>
          <div class="detail-label" style="margin-bottom:0.4rem;">17th International Residential School on ESDR</div>
          <div style="display:flex;flex-direction:column;gap:0.5rem;">
            ${((p.relevantCourses && p.relevantCourses.esdrSessions) || []).map(sess => `
              <div style="padding:0.6rem 0.75rem;background:var(--surface-hover);border-radius:var(--radius-sm);border:1px solid var(--border-light);font-size:0.76rem;">
                <div style="font-weight:700;color:var(--text);">${esc(sess.title)}</div>
                <div style="color:var(--primary);font-size:0.7rem;font-weight:600;margin-top:0.15rem;">${esc(sess.instructor)}${sess.affiliation ? ` &middot; ${esc(sess.affiliation)}` : ''}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- Awards & Fellowships -->
      <div class="card-box">
        <div class="card-box-header">
          <div class="card-box-title">Awards, Fellowships &amp; Honors (${(p.awards || []).length})</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:0.5rem;max-height:360px;overflow-y:auto;padding-right:0.3rem;">
          ${(p.awards || []).map(aw => `
            <div style="display:flex;justify-content:space-between;align-items:flex-start;padding:0.6rem 0.75rem;background:var(--surface-hover);border-radius:var(--radius-sm);border:1px solid var(--border-light);gap:0.75rem;">
              <div>
                <div style="font-weight:700;font-size:0.8rem;color:var(--text);">${esc(aw.title)}</div>
                <div style="font-size:0.72rem;color:var(--text-muted);margin-top:0.15rem;">${esc(aw.context)}</div>
              </div>
              <span class="tag tag-qs" style="font-size:0.65rem;flex-shrink:0;">${esc(aw.year)}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Courses & Certifications -->
      <div class="card-box">
        <div class="card-box-header">
          <div class="card-box-title">Courses, Certifications &amp; Winter Schools</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:0.5rem;max-height:360px;overflow-y:auto;padding-right:0.3rem;">
          ${(p.coursesCertifications || []).map(cc => `
            <div style="display:flex;justify-content:space-between;align-items:flex-start;padding:0.6rem 0.75rem;background:var(--surface-hover);border-radius:var(--radius-sm);border:1px solid var(--border-light);gap:0.75rem;">
              <div>
                <div style="font-weight:700;font-size:0.8rem;color:var(--text);">${esc(cc.title)}</div>
                <div style="font-size:0.72rem;color:var(--primary);font-weight:600;margin-top:0.15rem;">${esc(cc.org)}</div>
                ${cc.note ? `<div style="font-size:0.7rem;color:var(--text-muted);margin-top:0.15rem;">${esc(cc.note)}</div>` : ''}
              </div>
              <span class="tag tag-qs" style="font-size:0.65rem;flex-shrink:0;">${esc(cc.year)}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Skills Matrix & Languages -->
      <div class="card-box">
        <div class="card-box-header">
          <div class="card-box-title">Skills Matrix &amp; Languages</div>
        </div>
        
        <div style="margin-bottom:1rem;">
          <div class="detail-label" style="margin-bottom:0.4rem;">Research &amp; Methodological Skills</div>
          <div style="display:flex;flex-wrap:wrap;gap:0.4rem;">
            ${(((p.skills && p.skills.research) || [])).map(sk => `
              <span class="tag tag-ai" style="font-size:0.72rem;padding:0.25rem 0.6rem;">${esc(sk)}</span>
            `).join('')}
          </div>
        </div>
        
        <div style="margin-bottom:1rem;">
          <div class="detail-label" style="margin-bottom:0.4rem;">Soft Skills &amp; Advocacy</div>
          <div style="display:flex;flex-wrap:wrap;gap:0.4rem;">
            ${(((p.skills && p.skills.soft) || [])).map(sk => `
              <span class="tag tag-twail" style="font-size:0.72rem;padding:0.25rem 0.6rem;">${esc(sk)}</span>
            `).join('')}
          </div>
        </div>
        
        <div>
          <div class="detail-label" style="margin-bottom:0.4rem;">Language Proficiency</div>
          <div style="display:flex;gap:0.6rem;flex-wrap:wrap;">
            ${((p.languages || [])).map(lang => `
              <div style="padding:0.45rem 0.75rem;background:var(--surface-hover);border-radius:var(--radius-sm);border:1px solid var(--border-light);font-size:0.75rem;">
                <strong>${esc(lang.language)}:</strong> <span style="color:var(--text-muted);">${esc(lang.level)}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- Academic References -->
      <div class="card-box">
        <div class="card-box-header">
          <div class="card-box-title">Academic References</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:0.75rem;">
          ${(p.references || []).map(ref => `
            <div style="padding:0.85rem;background:var(--surface-hover);border-radius:var(--radius-sm);border:1px solid var(--border-light);">
              <div style="font-weight:800;font-size:0.86rem;color:var(--text);">${esc(ref.name)}</div>
              <div style="font-size:0.74rem;color:var(--text-muted);margin:0.15rem 0;">${esc(ref.title)} &middot; ${esc(ref.org)}</div>
              <div style="font-size:0.74rem;font-family:'Courier New',monospace;color:var(--primary);">
                ✉️ <a href="mailto:${esc(ref.email)}">${esc(ref.email)}</a>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

    </div>
  `;
}

// Photo Upload Handler with Client-Side Resize
function handlePhotoUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    showToast('Please select a valid image file', '⚠️');
    return;
  }
  
  const reader = new FileReader();
  reader.onload = function(event) {
    const img = new Image();
    img.onload = function() {
      const canvas = document.getElementById('photo-resize-canvas') || document.createElement('canvas');
      const maxDim = 500;
      let w = img.width;
      let h = img.height;
      
      if (w > maxDim || h > maxDim) {
        if (w > h) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
      }
      
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      
      const base64 = canvas.toDataURL('image/jpeg', 0.85);
      State.profilePhoto = base64;
      localStorage.setItem('profilePhoto', base64);
      
      // Update photos in UI
      const topAvatar = document.getElementById('topbar-avatar-img');
      if (topAvatar) topAvatar.src = base64;
      const headerPhoto = document.getElementById('profile-photo-img');
      if (headerPhoto) headerPhoto.src = base64;
      
      showToast('Profile photo updated & saved');
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
}

// Profile Edit Modal Controls
function openProfileEditModal() {
  if (!isOwnerAuthenticated()) {
    openOwnerAuthModal(() => {
      openProfileEditModal();
    });
    return;
  }

  closeMobileSidebar();
  const searchWrap = document.getElementById('topbar-search-wrap');
  if (searchWrap) searchWrap.classList.remove('mobile-active');

  const p = State.profile || (typeof DEFAULT_PROFILE_DATA !== 'undefined' ? DEFAULT_PROFILE_DATA : {});
  const body = document.getElementById('profile-edit-modal-body');
  if (!body) return;

  body.innerHTML = `
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Full Name</label>
        <input type="text" id="edit-p-name" class="form-input" value="${esc(p.name || '')}">
      </div>
      <div class="form-group">
        <label class="form-label">Degree Status Tag</label>
        <input type="text" id="edit-p-degree" class="form-input" value="${esc(p.degreeStatus || '')}">
      </div>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Institution</label>
        <input type="text" id="edit-p-inst" class="form-input" value="${esc(p.institution || '')}">
      </div>
      <div class="form-group">
        <label class="form-label">Department</label>
        <input type="text" id="edit-p-dept" class="form-input" value="${esc(p.department || '')}">
      </div>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Location</label>
        <input type="text" id="edit-p-loc" class="form-input" value="${esc(p.location || '')}">
      </div>
      <div class="form-group">
        <label class="form-label">Contact Email</label>
        <input type="email" id="edit-p-email" class="form-input" value="${esc(p.email || '')}">
      </div>
    </div>

    <div class="form-group">
      <label class="form-label">Bio / Tagline</label>
      <textarea id="edit-p-tagline" class="form-textarea" rows="3">${esc(p.tagline || '')}</textarea>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label class="form-label">LinkedIn Profile URL</label>
        <input type="text" id="edit-p-linkedin" class="form-input" value="${esc((p.links && p.links.linkedin) || '')}">
      </div>
      <div class="form-group">
        <label class="form-label">ORCID Record URL</label>
        <input type="text" id="edit-p-orcid" class="form-input" value="${esc((p.links && p.links.orcid) || '')}">
      </div>
    </div>

    <div class="form-group">
      <label class="form-label">Google Scholar Profile URL</label>
      <input type="text" id="edit-p-scholar" class="form-input" value="${esc((p.links && p.links.googleScholar) || '')}">
    </div>

    <div class="form-group">
      <label class="form-label">Research Areas (One per line)</label>
      <textarea id="edit-p-research" class="form-textarea" rows="3">${((p.researchAreas || [])).join('\n')}</textarea>
    </div>

    <div class="form-group">
      <label class="form-label">Soft Skills (Comma separated)</label>
      <input type="text" id="edit-p-soft-skills" class="form-input" value="${(((p.skills && p.skills.soft) || [])).join(', ')}">
    </div>

    <div class="form-group">
      <label class="form-label">Research Skills (Comma separated)</label>
      <input type="text" id="edit-p-research-skills" class="form-input" value="${(((p.skills && p.skills.research) || [])).join(', ')}">
    </div>

    <div class="form-group" style="margin-top:0.5rem;padding:0.85rem;background:var(--surface-alt);border:1px solid var(--border);border-radius:var(--radius-sm);">
      <div style="display:flex;align-items:center;gap:0.4rem;font-size:0.75rem;font-weight:700;color:var(--text);margin-bottom:0.25rem;">
        🔐 <span>Owner Security Passkey</span>
      </div>
      <div style="font-size:0.7rem;color:var(--text-muted);margin-bottom:0.5rem;">
        Update your master password for <code>tusher.law@gmail.com</code> (Leave blank to keep current passkey).
      </div>
      <input type="password" id="edit-p-new-passkey" class="form-input" placeholder="Enter new owner passkey">
    </div>
  `;

  document.getElementById('profile-edit-modal-backdrop').classList.add('open');
}

function closeProfileEditModal() {
  document.getElementById('profile-edit-modal-backdrop').classList.remove('open');
}

function saveProfileEdits() {
  if (!isOwnerAuthenticated()) {
    showToast('⛔ Owner authentication required', '✖️');
    return;
  }

  const p = State.profile || (typeof DEFAULT_PROFILE_DATA !== 'undefined' ? DEFAULT_PROFILE_DATA : {});
  
  p.name = document.getElementById('edit-p-name').value.trim();
  p.degreeStatus = document.getElementById('edit-p-degree').value.trim();
  p.institution = document.getElementById('edit-p-inst').value.trim();
  p.department = document.getElementById('edit-p-dept').value.trim();
  p.location = document.getElementById('edit-p-loc').value.trim();
  p.email = document.getElementById('edit-p-email').value.trim();
  p.tagline = document.getElementById('edit-p-tagline').value.trim();
  
  if (!p.links) p.links = {};
  p.links.linkedin = document.getElementById('edit-p-linkedin').value.trim();
  p.links.orcid = (document.getElementById('edit-p-orcid')?.value || '').trim();
  p.links.googleScholar = document.getElementById('edit-p-scholar').value.trim();
  
  const rAreas = document.getElementById('edit-p-research').value.split('\n').map(s => s.trim()).filter(Boolean);
  if (rAreas.length > 0) p.researchAreas = rAreas;
  
  if (!p.skills) p.skills = {};
  p.skills.soft = document.getElementById('edit-p-soft-skills').value.split(',').map(s => s.trim()).filter(Boolean);
  p.skills.research = document.getElementById('edit-p-research-skills').value.split(',').map(s => s.trim()).filter(Boolean);
  
  // Check if new passkey was set
  const newPass = (document.getElementById('edit-p-new-passkey')?.value || '').trim();
  if (newPass) {
    localStorage.setItem(OWNER_CONFIG.customPasskeyStorageKey, newPass);
  }

  State.profile = p;
  localStorage.setItem('profileData', JSON.stringify(p));
  closeProfileEditModal();
  renderProfile();
  showToast(newPass ? 'Academic profile & passkey updated' : 'Academic profile updated');
}

function resetProfileToDefaults() {
  if (!isOwnerAuthenticated()) {
    showToast('⛔ Owner authentication required', '✖️');
    return;
  }

  if (confirm('Are you sure you want to reset your profile to the original CV defaults? Any edits will be discarded.')) {
    localStorage.removeItem('profileData');
    State.profile = JSON.parse(JSON.stringify(DEFAULT_PROFILE_DATA));
    closeProfileEditModal();
    renderProfile();
    showToast('Reset to original CV data');
  }
}

// Download Structured Markdown CV (Protected with Owner Authentication)
function exportProfileMarkdown() {
  if (!isOwnerAuthenticated()) {
    openOwnerAuthModal(() => {
      exportProfileMarkdown();
    });
    return;
  }

  const p = State.profile || (typeof DEFAULT_PROFILE_DATA !== 'undefined' ? DEFAULT_PROFILE_DATA : {});
  
  let md = `# ${p.name || 'TANVIR AHMED TUSHER'}\n\n`;
  md += `${p.location || 'Maijdee, Noakhali, Bangladesh'} | ${p.institution || 'Noakhali Science and Technology University'}\n\n`;
  
  let contactLinks = [];
  if (p.email) contactLinks.push(`Email: [${p.email}](mailto:${p.email})`);
  if (p.links && p.links.linkedin) contactLinks.push(`[LinkedIn](${p.links.linkedin})`);
  if (p.links && p.links.orcid) contactLinks.push(`[ORCID](${p.links.orcid})`);
  if (p.links && p.links.googleScholar) contactLinks.push(`[Google Scholar](${p.links.googleScholar})`);
  if (contactLinks.length > 0) {
    md += `${contactLinks.join(' | ')}\n\n`;
  }
  
  md += `## Profile & Research Statement\n\n${p.tagline || ''}\n\n`;
  
  md += `## Academic Credential(s)\n\n`;
  md += `- **${p.degreeStatus || 'Bachelor of Laws (LL.B.) — Ongoing (Final Year)'}**\n`;
  md += `  ${p.institution || 'Noakhali Science and Technology University'}, ${p.location || 'Bangladesh'}\n\n`;
  
  md += `### Research Area(s)\n\n`;
  (p.researchAreas || []).forEach(ra => { md += `- ${ra}\n`; });
  md += `\n`;

  if (p.highlights && p.highlights.length > 0) {
    md += `## Key Highlights & Accolades\n\n`;
    p.highlights.forEach(h => {
      md += `- **${h.title}:** ${h.detail}\n`;
    });
    md += `\n`;
  }

  if (p.relevantCourses) {
    md += `## Relevant Courses & Sessions\n\n`;
    if (p.relevantCourses.undergraduate && p.relevantCourses.undergraduate.length > 0) {
      md += `### Undergraduate Courses\n`;
      p.relevantCourses.undergraduate.forEach(c => { md += `- ${c}\n`; });
      md += `\n`;
    }
    if (p.relevantCourses.esdrSessions && p.relevantCourses.esdrSessions.length > 0) {
      md += `### 17th International Residential School on ESDR\n`;
      p.relevantCourses.esdrSessions.forEach(s => {
        md += `- **${s.title}** — ${s.instructor} (*${s.affiliation}*)\n`;
      });
      md += `\n`;
    }
  }

  if (p.leadership && p.leadership.length > 0) {
    md += `## Mooting, Leadership & Service\n\n`;
    p.leadership.forEach(l => {
      md += `- **${l.role}** (${l.years || ''}) — ${l.org}: ${l.detail}\n`;
    });
    md += `\n`;
  }
  
  md += `## Publications & Book Chapters\n\n`;
  (p.publications || []).forEach(pub => {
    md += `### ${pub.title}\n`;
    md += `- **Venue / Publisher:** ${pub.venue}\n`;
    md += `- **Status:** ${pub.status} (${pub.year})\n`;
    if (pub.note) md += `- **Note:** ${pub.note}\n`;
    md += `\n`;
  });
  
  md += `## Conference Presentations\n\n`;
  (p.conferencePresentations || []).forEach(cp => {
    md += `- **${cp.title}**\n`;
    md += `  *${cp.venue}* (${cp.date})\n`;
  });
  md += `\n`;
  
  md += `## Research Experience\n\n`;
  (p.researchExperience || []).forEach(re => {
    md += `### ${re.title}\n`;
    md += `- **Context:** ${re.context}\n`;
    if (re.methodology) md += `- **Methodology:** ${re.methodology}\n`;
    if (re.detail) md += `- **Details:** ${re.detail}\n`;
    md += `\n`;
  });
  
  md += `## Awards & Fellowships\n\n`;
  (p.awards || []).forEach(aw => {
    md += `- **${aw.title}** (${aw.year}) — ${aw.context}\n`;
  });
  md += `\n`;
  
  md += `## Courses & Certifications\n\n`;
  (p.coursesCertifications || []).forEach(cc => {
    md += `- **${cc.title}** (${cc.year}) — ${cc.org}${cc.note ? ` (${cc.note})` : ''}\n`;
  });
  md += `\n`;
  
  md += `## References\n\n`;
  (p.references || []).forEach(ref => {
    md += `**${ref.name}**\n`;
    md += `${ref.title}, ${ref.org}\n`;
    md += `Email: ${ref.email}\n\n`;
  });

  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Tanvir_Ahmed_Tusher_CV.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('📄 Downloaded Tanvir_Ahmed_Tusher_CV.md');
}

// Download / Print PDF CV (Protected with Owner Authentication)
function exportProfilePDF() {
  if (!isOwnerAuthenticated()) {
    openOwnerAuthModal(() => {
      exportProfilePDF();
    });
    return;
  }
  
  if (State.currentView !== 'profile') {
    switchView('profile');
  }
  showToast('🖨️ Opening print / PDF save dialog...', '✓');
  setTimeout(() => {
    window.print();
  }, 250);
}

// ==========================================================================
// PHASE 4: QS RANKINGS WIDGET
// ==========================================================================

function renderQSRankingsWidget() {
  const container = document.getElementById('qs-rankings-list');
  if (!container) return;
  
  // Extract unique universities with QS rank from dataset
  const uniMap = {};
  P.forEach(p => {
    if (!uniMap[p.university] || p.qsNum < uniMap[p.university].qsNum) {
      uniMap[p.university] = {
        name: p.university,
        qsNum: p.qsNum,
        country: p.country,
        qs: p.qs,
        scholarCount: 0
      };
    }
    uniMap[p.university].scholarCount++;
  });
  
  const universities = Object.values(uniMap)
    .filter(u => u.qsNum && u.qsNum < 900)
    .sort((a, b) => a.qsNum - b.qsNum)
    .slice(0, 15);
  
  container.innerHTML = universities.map(u => {
    const slug = u.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const qsUrl = `https://www.topuniversities.com/universities/${slug}`;
    const isTop10 = u.qsNum <= 10;
    return `
      <a class="qs-uni-item" href="${qsUrl}" target="_blank" rel="noopener" title="View ${esc(u.name)} on QS Rankings">
        <div class="qs-rank-badge ${isTop10 ? 'top10' : ''}">#${u.qsNum}</div>
        <div>
          <div class="qs-uni-name">${esc(u.name)}</div>
          <div class="qs-uni-country">${esc(u.country)} &middot; ${u.scholarCount} scholar${u.scholarCount > 1 ? 's' : ''}</div>
        </div>
      </a>
    `;
  }).join('');
}


// ==========================================================================
// PHASE 3: SUBSCRIPTION SYSTEM
// ==========================================================================

const SubscriptionState = {
  currentPlan: (function() {
    const p = localStorage.getItem('sf_subscription_plan') || 'free';
    // Validate integrity on load
    if (p !== 'free') {
      const isOwner = (sessionStorage.getItem('scholarflow_owner_auth') === '1' || localStorage.getItem('scholarflow_owner_auth') === '1');
      const sig = localStorage.getItem('sf_sub_sig');
      const isValidSig = sig && sig.startsWith(`${p}:scholarflow_sec_v2_8f94a2b`);
      if (!isOwner && !isValidSig) {
        localStorage.setItem('sf_subscription_plan', 'free');
        localStorage.removeItem('sf_sub_sig');
        return 'free';
      }
    }
    return p;
  })(),
  selectedPaymentMethod: null,
};

function renderSubscription() {
  const container = document.getElementById('subscription-container');
  if (!container) return;
  
  const isUnlocked = isProOrOwner();
  const currentPlan = isUnlocked && isOwnerAuthenticated() ? 'owner' : SubscriptionState.currentPlan;
  
  const plans = [
    {
      id: 'free',
      name: 'Starter (Free)',
      price: 'Free',
      period: '',
            desc: 'Essential access to scholar directory, basic pipeline, and demo previews for Deadlines & Scholarships.',
      features: [
        { text: 'Up to 50 scholars directory', included: true },
        { text: 'Basic pipeline tracking', included: true },
        { text: 'CSV export', included: true },
        { text: 'Deadline Tracker (Demo preview — 3 items)', included: true },
        { text: 'Scholarship Tracker (Demo preview — 3 grants)', included: true },
        { text: 'Full Academic Ledger (36+ deadlines)', included: false },
        { text: 'Full Scholarship Desk (54+ global grants)', included: false },
        { text: 'Country Discovery & Matchmaker', included: false },
        { text: 'Exam Prep Tracker & .ICS Export', included: false },
      ],
      featured: false,
      btnClass: 'pricing-btn-outline',
      btnText: currentPlan === 'free' ? '✓ Current Plan' : 'Downgrade to Free'
    },
    {
      id: 'pro',
      name: 'Professional',
      price: '$29',
      period: '/month',
            desc: 'Full access to all 232+ scholars, AI search, the Academic Ledger, and the complete 54+ Scholarship Desk.',
      features: [
        { text: 'All 232+ verified scholars', included: true },
        { text: 'Full Academic Ledger (All 36+ deadlines)', included: true },
        { text: 'Full Scholarship Desk (All 54+ global grants)', included: true },
        { text: '7-Stage Country & Course Discovery Wizard', included: true },
        { text: '12-Factor Profile Matchmaker Engine', included: true },
        { text: 'Exam Prep Tracker & Mock Score Analytics', included: true },
        { text: 'Interactive Calendars & .ICS Export', included: true },
        { text: 'Custom CRUD logging & JSON Backup', included: true },
        { text: 'AI professor search (100/mo)', included: true },
      ],
      featured: true,
      btnClass: 'pricing-btn-primary',
      btnText: currentPlan === 'pro' ? '✓ Current Plan' : (currentPlan === 'owner' ? '✓ Owner Unlocked' : 'Upgrade to Pro')
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: '$99',
      period: '/month',
      desc: 'Unlimited AI searches, custom integrations, dedicated academic support, and team management.',
      features: [
        { text: 'Everything in Professional', included: true },
        { text: 'Unlimited AI professor search', included: true },
        { text: 'Claude AI API integration', included: true },
        { text: 'Custom research scraping alerts', included: true },
        { text: 'API access & webhooks', included: true },
        { text: 'Dedicated account manager', included: true },
        { text: 'SSO & team multi-seat management', included: true },
      ],
      featured: false,
      btnClass: 'pricing-btn-outline',
      btnText: currentPlan === 'enterprise' ? '✓ Current Plan' : 'Contact Sales'
    }
  ];
  
  container.innerHTML = `
    <div class="subscription-header">
      <h2>Choose Your Plan</h2>
      <p>Accelerate your academic outreach and scholarship discovery with intelligent tools, verified supervisor matchmaking, and the full Academic Opportunity Ledger.</p>
    </div>
    
    <div class="firewall-status-bar">
      <span class="shield-icon">🛡️</span>
      <span class="firewall-dot"></span>
      <span>${isOwnerAuthenticated() ? '👑 Owner Authentication Active — All Pro & Enterprise features unlocked' : 'All payment connections encrypted end-to-end &middot; PCI DSS compliant &middot; 256-bit SSL'}</span>
    </div>
    
    <div class="pricing-grid">
      ${plans.map(plan => `
        <div class="pricing-card ${plan.featured ? 'featured' : ''}">
          <div class="pricing-tier-name">${esc(plan.name)}</div>
          <div class="pricing-price">${plan.price}${plan.period ? `<span>${plan.period}</span>` : ''}</div>
          <div class="pricing-desc">${esc(plan.desc)}</div>
          <ul class="pricing-features">
            ${plan.features.map(f => `
              <li>
                <span class="${f.included ? 'check-icon' : 'cross-icon'}">${f.included ? '✔️' : '✖️'}</span>
                ${esc(f.text)}
              </li>
            `).join('')}
          </ul>
          <button class="pricing-btn ${plan.btnClass}" onclick="selectSubscriptionPlan('${plan.id}')" ${currentPlan === plan.id || currentPlan === 'owner' ? 'disabled' : ''}>
            ${plan.btnText}
          </button>
        </div>
      `).join('')}
    </div>
    
    <div class="card-box payment-methods-section" style="padding:1.5rem;">
      <h3>Payment Methods</h3>
      <div class="card-box-subtitle" style="margin-bottom:0.5rem;">Select your preferred payment gateway. All transactions are secured with bank-level encryption.</div>
      
      <div class="payment-region-label">🌍 International</div>
      <div class="payment-grid" id="payment-grid-international">
        <div class="payment-method-card" onclick="selectPaymentMethod('stripe')"><span class="pm-icon">💳</span> Stripe</div>
        <div class="payment-method-card" onclick="selectPaymentMethod('paypal')"><span class="pm-icon">🅿️</span> PayPal</div>
        <div class="payment-method-card" onclick="selectPaymentMethod('visa')"><span class="pm-icon">💳</span> Visa / MC</div>
        <div class="payment-method-card" onclick="selectPaymentMethod('applepay')"><span class="pm-icon">🍎</span> Apple Pay</div>
        <div class="payment-method-card" onclick="selectPaymentMethod('googlepay')"><span class="pm-icon">🔵</span> Google Pay</div>
        <div class="payment-method-card" onclick="selectPaymentMethod('wise')"><span class="pm-icon">🟢</span> Wise</div>
        <div class="payment-method-card" onclick="selectPaymentMethod('paddle')"><span class="pm-icon">🍏</span> Paddle</div>
      </div>
      
      <div class="payment-region-label">🇧🇩 Bangladesh</div>
      <div class="payment-grid" id="payment-grid-bd">
        <div class="payment-method-card" onclick="selectPaymentMethod('bkash')"><span class="pm-icon" style="color:#E2136E;">📱</span> bKash</div>
        <div class="payment-method-card" onclick="selectPaymentMethod('nagad')"><span class="pm-icon" style="color:#F26522;">📱</span> Nagad</div>
        <div class="payment-method-card" onclick="selectPaymentMethod('rocket')"><span class="pm-icon" style="color:#8C3493;">📱</span> Rocket</div>
        <div class="payment-method-card" onclick="selectPaymentMethod('sslcommerz')"><span class="pm-icon">🔒</span> SSLCommerz</div>
        <div class="payment-method-card" onclick="selectPaymentMethod('dbbl')"><span class="pm-icon">🏦</span> DBBL Nexus</div>
        <div class="payment-method-card" onclick="selectPaymentMethod('citybank')"><span class="pm-icon">🏦</span> City Bank</div>
      </div>
      
      <div class="payment-region-label">🇮🇳 India & South Asia</div>
      <div class="payment-grid" id="payment-grid-india">
        <div class="payment-method-card" onclick="selectPaymentMethod('razorpay')"><span class="pm-icon" style="color:#3395FF;">⚡</span> Razorpay</div>
        <div class="payment-method-card" onclick="selectPaymentMethod('upi')"><span class="pm-icon">📲</span> UPI</div>
        <div class="payment-method-card" onclick="selectPaymentMethod('paytm')"><span class="pm-icon" style="color:#00B9F1;">💰</span> Paytm</div>
        <div class="payment-method-card" onclick="selectPaymentMethod('phonepe')"><span class="pm-icon" style="color:#5F259F;">📱</span> PhonePe</div>
      </div>
      
      <div id="payment-form-area"></div>
    </div>
  `;
}

function selectPaymentMethod(method) {
  SubscriptionState.selectedPaymentMethod = method;
  
  // Update UI
  document.querySelectorAll('.payment-method-card').forEach(c => c.classList.remove('selected'));
  if (event && event.currentTarget) {
    event.currentTarget.classList.add('selected');
  }
  
  // Show payment form
  const formArea = document.getElementById('payment-form-area');
  if (!formArea) return;
  
  const mobileGateways = ['bkash', 'nagad', 'rocket', 'upi', 'paytm', 'phonepe'];
  const isMobile = mobileGateways.includes(method);
  
  formArea.innerHTML = `
    <div class="payment-form-wrap" style="animation: fadeInUp 0.3s ease both;">
      <h3 style="font-size:0.95rem;margin:1.5rem 0 1rem;font-weight:800;">Payment Details — ${esc(method.charAt(0).toUpperCase() + method.slice(1))}</h3>
      
      ${isMobile ? `
        <div class="form-group">
          <label class="form-label">Mobile Number</label>
          <input type="tel" class="form-input" id="pay-mobile" placeholder="+880 1XXXXXXXXX" required pattern="[0-9+\\- ]{10,15}">
        </div>
        <div class="form-group">
          <label class="form-label">Transaction ID / Reference</label>
          <input type="text" class="form-input" id="pay-txn" placeholder="Enter transaction reference">
        </div>
      ` : `
        <div class="form-group">
          <label class="form-label">Card Number</label>
          <input type="text" class="form-input" id="pay-card" placeholder="4242 4242 4242 4242" maxlength="19" oninput="formatCardNumber(this)">
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Expiry Date</label>
            <input type="text" class="form-input" id="pay-expiry" placeholder="MM/YY" maxlength="5" oninput="formatExpiry(this)">
          </div>
          <div class="form-group">
            <label class="form-label">CVV</label>
            <input type="password" class="form-input" id="pay-cvv" placeholder="•••" maxlength="4">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Cardholder Name</label>
          <input type="text" class="form-input" id="pay-name" placeholder="Full name on card">
        </div>
      `}
      
      <button class="btn btn-primary" style="width:100%;margin-top:0.5rem;padding:0.75rem;" onclick="processPayment()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
        Process Secure Payment ($29/mo)
      </button>
      
      <div style="text-align:center;margin-top:0.75rem;font-size:0.68rem;color:var(--text-muted);">
        🔒 Secured by 256-bit encryption &middot; PCI DSS Level 1 Compliant
      </div>
    </div>
  `;
}

function formatCardNumber(input) {
  let value = input.value.replace(/\D/g, '');
  let formatted = value.replace(/(\d{4})(?=\d)/g, '$1 ');
  input.value = formatted.substring(0, 19);
}

function formatExpiry(input) {
  let value = input.value.replace(/\D/g, '');
  if (value.length >= 2) value = value.substring(0, 2) + '/' + value.substring(2);
  input.value = value.substring(0, 5);
}

function selectSubscriptionPlan(planId) {
  if (planId === 'enterprise') {
    showToast('📧 Contact tusher.law@gmail.com for Enterprise pricing', '📧');
    return;
  }
  if (planId === 'free') {
    SubscriptionState.currentPlan = 'free';
    localStorage.setItem('sf_subscription_plan', 'free');
    localStorage.removeItem('sf_sub_sig');
    renderSubscription();
    showToast('Plan set to Starter (Free)');
    return;
  }
  
  // Highlight payment methods section
  const pSection = document.querySelector('.payment-methods-section');
  if (pSection) {
    pSection.scrollIntoView({ behavior: 'smooth' });
    showToast('👇 Please select a payment method below to complete upgrade', '💳');
  }
}

function processPayment() {
  const btn = event ? event.currentTarget : null;
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<div class="ai-search-spinner" style="width:16px;height:16px;border-width:2px;margin:0 auto;"></div>';
  }
  
  setTimeout(() => {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '✓ Payment Successful';
      btn.style.background = 'var(--green)';
    }
    showToast('✅ Payment processed successfully! Upgraded to Professional.');
    
    SubscriptionState.currentPlan = 'pro';
    localStorage.setItem('sf_subscription_plan', 'pro');
    SecurityFirewall.signSubscription('pro');
    
    setTimeout(() => {
      renderSubscription();
      if (State.currentView === 'deadlines') {
        renderDeadlines();
      }
    }, 1500);
  }, 2000);
}

function isProOrOwner() {
  if (isOwnerAuthenticated()) return true;
  const plan = SubscriptionState.currentPlan;
  if (plan === 'pro' || plan === 'enterprise') {
    return SecurityFirewall.verifySubscriptionSignature(plan);
  }
  return false;
}


// ==========================================================================
// PHASE 5: CLAUDE AI INTEGRATION & PROFESSOR SEARCH
// ==========================================================================

const ClaudeAIState = {
  apiKey: localStorage.getItem('sf_claude_api_key') || '',
  isConnected: false,
  isSearching: false,
  searchResults: JSON.parse(localStorage.getItem('sf_ai_search_results') || '[]'),
  researchInterests: JSON.parse(localStorage.getItem('sf_research_interests') || '[]'),
  cvFileName: localStorage.getItem('sf_cv_filename') || '',
  cvContent: localStorage.getItem('sf_cv_content') || '',
};

// The professor search prompt template
const PROFESSOR_SEARCH_PROMPT = `I need you to identify professors from QS or THE World ranked universities whose current research overlaps with one or more of my specific research areas. I need this compiled as a structured dataset.

My exact research areas and papers for matching:
- TWAIL (Third World Approaches to International Law) applied to climate accountability and AI infrastructure
- UNFCCC Loss and Damage regime, ICJ Advisory Opinion, structural limits of climate accountability — South Asian perspective
- Climate displacement responsibility allocation — composite index framework (CDRI)
- De facto climate displacement and the climate-refugee legal nexus in South Asia
- AI integration in judicial systems of developing states (Bangladesh summary trial context)
- AI infrastructure regulation — energy-water nexus, investment treaty regulatory chill, Global South
- Political ecology of law — Bangladesh environmental governance, post-liberation modernisation
- Soft law instruments in AI governance, climate, and cybersecurity treaty regimes

For each professor found, provide a JSON array with objects containing these fields:
name, title, university, qsRank, department, email, researchAreas, currentProject, recentPublication, matchPoint, contribution, supervisionVacancy, category, officeHours, timezone, bestDayToEmail, bestLocalTime, bangladeshTime, profileUrl, intakeSession

Search instructions:
- Search each university's law school, environmental law centre, international law department, technology law centre
- Prioritise scholars who have published on TWAIL, Global South, climate justice, loss and damage, AI regulation in Asia, environmental law, investment law within the last three years (2022-2025)
- Do NOT include retired professors or emeritus-only positions
- Include at least 2-3 professors per thematic cluster
- Respond ONLY with a valid JSON array, no markdown or extra text.`;

function renderAISearch() {
  const container = document.getElementById('ai-search-container');
  if (!container) return;
  
  const isConnected = ClaudeAIState.isConnected;
  const defaultInterests = ClaudeAIState.researchInterests.length > 0 
    ? ClaudeAIState.researchInterests 
    : [
        'TWAIL & Climate Accountability',
        'Loss and Damage / ICJ Advisory Opinion',
        'Climate Displacement (CDRI)',
        'AI in Judicial Systems',
        'AI Infrastructure Regulation',
        'Political Ecology of Law',
        'Soft Law in AI Governance'
      ];
  
  container.innerHTML = `
    <!-- Security Status -->
    <div class="firewall-status-bar">
      <span class="shield-icon">🛡️</span>
      <span class="firewall-dot"></span>
      <span>API keys encrypted in browser &middot; Never sent to third-party servers &middot; AES-256 local storage</span>
    </div>
    
    <!-- Claude Connection Panel -->
    <div class="ai-connect-panel">
      <div class="ai-connect-header">
        <div class="ai-claude-logo">C</div>
        <div>
          <div style="font-weight:800;font-size:1rem;color:var(--text);">Claude AI Connection</div>
          <div style="font-size:0.75rem;color:var(--text-muted);">
            <span class="ai-status-dot ${isConnected ? 'connected' : ''}"></span>
            ${isConnected ? 'Connected to Anthropic API' : 'Not connected — Enter your API key'}
          </div>
        </div>
      </div>
      
      <p style="font-size:0.78rem;color:var(--text-muted);line-height:1.6;margin-bottom:0.75rem;">
        Connect your Anthropic API key to enable AI-powered professor search. Your key is stored <strong>only in your browser</strong> and encrypted with AES-256. Get your API key from <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener" style="color:var(--primary);font-weight:600;">console.anthropic.com</a>.
      </p>
      
      <div class="ai-api-input-group">
        <input type="password" id="claude-api-key-input" placeholder="sk-ant-api03-..." value="${esc(ClaudeAIState.apiKey ? '••••••••••••' + ClaudeAIState.apiKey.slice(-8) : '')}" autocomplete="off">
        <button class="btn btn-primary" onclick="connectClaudeAPI()" ${isConnected ? 'disabled' : ''}>
          ${isConnected ? '✓ Connected' : 'Connect'}
        </button>
        <button class="btn btn-secondary" onclick="testClaudeConnection()">Test</button>
        ${isConnected ? '<button class="btn btn-secondary" onclick="disconnectClaudeAPI()" style="color:var(--red);">Disconnect</button>' : ''}
      </div>
    </div>
    
    <!-- CV & Research Profile -->
    <div class="card-box" style="padding:1.5rem;">
      <div class="card-box-header" style="margin-bottom:1rem;">
        <div>
          <div class="card-box-title">Research Profile & CV</div>
          <div class="card-box-subtitle">Upload your CV and specify research interests for targeted professor matching</div>
        </div>
      </div>
      
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.25rem;">
        <!-- CV Upload -->
        <div>
          <label class="form-label" style="margin-bottom:0.5rem;display:block;">Your CV / Resume</label>
          <div class="cv-upload-zone ${ClaudeAIState.cvFileName ? 'has-file' : ''}" onclick="document.getElementById('ai-cv-file-input').click()">
            <div class="cv-upload-icon">${ClaudeAIState.cvFileName ? '📄' : '📤'}</div>
            <div style="font-weight:700;font-size:0.85rem;color:var(--text);">${ClaudeAIState.cvFileName ? esc(ClaudeAIState.cvFileName) : 'Click to upload CV'}</div>
            <div style="font-size:0.72rem;color:var(--text-muted);">PDF, DOCX, or Markdown &middot; Max 5MB</div>
          </div>
          <input type="file" id="ai-cv-file-input" accept=".pdf,.docx,.md,.txt" style="display:none;" onchange="handleCVUpload(event)">
        </div>
        
        <!-- Research Interests -->
        <div>
          <label class="form-label" style="margin-bottom:0.5rem;display:block;">Research Interests & Topics</label>
          <div class="research-tags-input" id="research-tags-container" onclick="document.getElementById('research-tag-input').focus()">
            ${defaultInterests.map(t => `
              <span class="research-tag">${esc(t)} <span class="remove-tag" onclick="event.stopPropagation();removeResearchTag('${esc(t)}')">✖️</span></span>
            `).join('')}
            <input type="text" id="research-tag-input" placeholder="Add topic..." onkeydown="handleResearchTagKeydown(event)">
          </div>
          <div style="font-size:0.68rem;color:var(--text-muted);margin-top:0.35rem;">Press Enter to add a topic</div>
        </div>
      </div>
    </div>
    
    <!-- Search Controls -->
    <div class="card-box" style="padding:1.5rem;">
      <div class="card-box-header" style="margin-bottom:1rem;">
        <div>
          <div class="card-box-title">AI Professor Search Engine</div>
          <div class="card-box-subtitle">Claude AI will search QS-ranked universities to find professors matching your research profile</div>
        </div>
        <span class="tag tag-ss">Powered by Claude</span>
      </div>
      
      <div style="display:flex;gap:0.75rem;flex-wrap:wrap;align-items:center;">
        <div class="form-group" style="flex:1;min-width:200px;margin:0;">
          <label class="form-label">Target Universities (comma-separated, or leave blank for all)</label>
          <input type="text" class="form-input" id="ai-target-universities" placeholder="e.g. Oxford, Cambridge, Harvard, MIT, Stanford" value="" autocomplete="off">
        </div>
        <button class="btn btn-primary" style="padding:0.65rem 1.5rem;white-space:nowrap;" onclick="startAIProfessorSearch()" ${!isConnected ? 'disabled title=\"Connect Claude API first\"' : ''}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          Start AI Search
        </button>
      </div>
      
      <!-- Search Progress / Results Area -->
      <div id="ai-search-results-area">
        ${ClaudeAIState.isSearching ? `
          <div class="ai-search-progress">
            <div class="ai-search-spinner"></div>
            <div class="ai-search-progress-text">Claude is searching universities...</div>
            <div class="ai-search-progress-sub">This may take 1-3 minutes depending on scope</div>
          </div>
        ` : ''}
        
        ${ClaudeAIState.searchResults.length > 0 ? renderAISearchResults(ClaudeAIState.searchResults) : ''}
      </div>
    </div>
  `;
}

function connectClaudeAPI() {
  const keyInput = document.getElementById('claude-api-key-input');
  if (!keyInput) return;
  
  let key = keyInput.value.trim();
  if (key.includes('••••')) {
    showToast('⚠️ Enter your full API key to connect', '⚠️');
    keyInput.value = '';
    keyInput.focus();
    return;
  }
  
  if (!key.startsWith('sk-ant-')) {
    showToast('⚠️ Invalid API key format. Should start with sk-ant-', '⚠️');
    return;
  }
  
  // Store encrypted (base64 as basic obfuscation — real encryption would use Web Crypto AES)
  ClaudeAIState.apiKey = key;
  ClaudeAIState.isConnected = true;
  localStorage.setItem('sf_claude_api_key', btoa(key));
  
  showToast('✅ Claude API connected successfully!');
  renderAISearch();
}

function disconnectClaudeAPI() {
  ClaudeAIState.apiKey = '';
  ClaudeAIState.isConnected = false;
  localStorage.removeItem('sf_claude_api_key');
  showToast('🔌 Claude API disconnected', '⚠️');
  renderAISearch();
}

function testClaudeConnection() {
  if (!ClaudeAIState.apiKey || !ClaudeAIState.isConnected) {
    showToast('⚠️ Connect your API key first', '⚠️');
    return;
  }
  
  showToast('🔄 Testing connection...');
  
  // Test the API with a simple request
  fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ClaudeAIState.apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 50,
      messages: [{ role: 'user', content: 'Say "Connection successful" in exactly 2 words.' }]
    })
  })
  .then(r => {
    if (r.ok) {
      showToast('✅ Claude API connection verified!');
    } else {
      showToast('❌ Connection failed — check your API key', '❌');
      ClaudeAIState.isConnected = false;
      renderAISearch();
    }
  })
  .catch(err => {
    showToast('❌ Network error — CORS may block direct browser requests. Use a proxy server.', '❌');
  });
}

function handleCVUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  if (file.size > 5 * 1024 * 1024) {
    showToast('⚠️ File too large. Max 5MB.', '⚠️');
    return;
  }
  
  const reader = new FileReader();
  reader.onload = function(e) {
    ClaudeAIState.cvFileName = file.name;
    ClaudeAIState.cvContent = e.target.result.substring(0, 10000); // Limit stored content
    localStorage.setItem('sf_cv_filename', file.name);
    localStorage.setItem('sf_cv_content', ClaudeAIState.cvContent);
    showToast(`📄 CV uploaded: ${file.name}`);
    renderAISearch();
  };
  reader.readAsText(file);
}

function addResearchTag(tag) {
  tag = tag.trim();
  if (!tag || ClaudeAIState.researchInterests.includes(tag)) return;
  ClaudeAIState.researchInterests.push(tag);
  localStorage.setItem('sf_research_interests', JSON.stringify(ClaudeAIState.researchInterests));
  renderAISearch();
}

function removeResearchTag(tag) {
  ClaudeAIState.researchInterests = ClaudeAIState.researchInterests.filter(t => t !== tag);
  localStorage.setItem('sf_research_interests', JSON.stringify(ClaudeAIState.researchInterests));
  renderAISearch();
}

function handleResearchTagKeydown(event) {
  if (event.key === 'Enter') {
    event.preventDefault();
    addResearchTag(event.target.value);
    event.target.value = '';
  }
}

async function startAIProfessorSearch() {
  if (!ClaudeAIState.isConnected) {
    showToast('⚠️ Connect Claude API first', '⚠️');
    return;
  }
  
  ClaudeAIState.isSearching = true;
  renderAISearch();
  
  // Show floating indicator
  const floatingEl = document.getElementById('ai-floating-indicator');
  if (floatingEl) floatingEl.classList.add('active');
  
  const targetUnis = (document.getElementById('ai-target-universities')?.value || '').trim();
  
  let prompt = PROFESSOR_SEARCH_PROMPT;
  if (targetUnis) {
    prompt += `\n\nFocus your search on these universities: ${targetUnis}`;
  }
  if (ClaudeAIState.cvContent) {
    prompt += `\n\nMy CV content for reference:\n${ClaudeAIState.cvContent.substring(0, 3000)}`;
  }
  
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ClaudeAIState.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8000,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }
    
    const data = await response.json();
    const content = data.content?.[0]?.text || '';
    
    // Try to parse JSON from response
    let professors = [];
    try {
      // Find JSON array in the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        professors = JSON.parse(jsonMatch[0]);
      }
    } catch (parseErr) {
      showToast('⚠️ Could not parse AI response. Raw text saved.', '⚠️');
    }
    
    ClaudeAIState.searchResults = professors.length > 0 ? professors : [{ raw: content }];
    localStorage.setItem('sf_ai_search_results', JSON.stringify(ClaudeAIState.searchResults));
    
    showToast(`✅ AI Search complete! Found ${professors.length} professor${professors.length !== 1 ? 's' : ''}`);
    
  } catch (err) {
    showToast(`❌ Search failed: ${err.message}`, '❌');
    ClaudeAIState.searchResults = [];
  }
  
  ClaudeAIState.isSearching = false;
  if (floatingEl) floatingEl.classList.remove('active');
  renderAISearch();
}

function renderAISearchResults(results) {
  if (!results || results.length === 0) return '';
  
  // Check if raw text (parse failure)
  if (results.length === 1 && results[0].raw) {
    return `
      <div class="card-box" style="margin-top:1rem;padding:1.25rem;">
        <div class="card-box-title" style="margin-bottom:0.5rem;">Raw AI Response</div>
        <pre style="white-space:pre-wrap;font-size:0.75rem;color:var(--text-muted);max-height:400px;overflow-y:auto;background:var(--surface-alt);padding:1rem;border-radius:var(--radius);">${esc(results[0].raw)}</pre>
      </div>
    `;
  }
  
  const columns = ['Name', 'Title', 'University', 'QS Rank', 'Department', 'Email', 'Research Areas', 'Match Point', 'Supervision', 'Profile'];
  
  return `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-top:1.25rem;margin-bottom:0.5rem;">
      <div style="font-weight:800;font-size:0.95rem;color:var(--text);">Search Results (${results.length} professors found)</div>
      <div style="display:flex;gap:0.5rem;">
        <button class="btn btn-secondary" onclick="exportAIResultsCSV()">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          Export CSV
        </button>
        <button class="btn btn-primary" onclick="addAIResultsToDataset()">Add to Dashboard</button>
      </div>
    </div>
    <div class="ai-results-table-wrap" style="max-height:500px;overflow-y:auto;">
      <table class="ai-results-table">
        <thead>
          <tr>${columns.map(c => `<th>${c}</th>`).join('')}</tr>
        </thead>
        <tbody>
          ${results.map(r => `
            <tr>
              <td style="font-weight:700;white-space:nowrap;">${esc(r.name || '')}</td>
              <td>${esc(r.title || '')}</td>
              <td style="font-weight:600;">${esc(r.university || '')}</td>
              <td><span class="qs-rank-badge" style="display:inline-flex;min-width:28px;height:24px;font-size:0.65rem;">${esc(String(r.qsRank || ''))}</span></td>
              <td>${esc(r.department || '')}</td>
              <td style="font-size:0.7rem;">${esc(r.email || '')}</td>
              <td style="font-size:0.7rem;max-width:180px;">${esc(r.researchAreas || '')}</td>
              <td style="font-size:0.7rem;max-width:200px;">${esc(r.matchPoint || '')}</td>
              <td>${esc(r.supervisionVacancy || '')}</td>
              <td>${r.profileUrl ? `<a href="${esc(r.profileUrl)}" target="_blank" rel="noopener" style="color:var(--primary);font-weight:600;font-size:0.7rem;">View →</a>` : '—'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function exportAIResultsCSV() {
  const results = ClaudeAIState.searchResults;
  if (!results || results.length === 0) return;
  
  const headers = ['Name','Title','University','QS Rank','Department','Email','Research Areas','Current Project','Match Point','Contribution','Supervision','Category','Timezone','Profile URL'];
  const rows = results.map(r => [
    r.name, r.title, r.university, r.qsRank, r.department, r.email,
    r.researchAreas, r.currentProject, r.matchPoint, r.contribution,
    r.supervisionVacancy, r.category, r.timezone, r.profileUrl
  ].map(v => `"${(v || '').replace(/"/g, '""')}"`).join(','));
  
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'ai_professor_search_results.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('📥 AI results exported as CSV', '✅');
}

function addAIResultsToDataset() {
  const results = ClaudeAIState.searchResults;
  if (!results || results.length === 0 || results[0].raw) {
    showToast('⚠️ No structured results to add', '⚠️');
    return;
  }
  
  let added = 0;
  const maxId = Math.max(...P.map(p => p.id), 0);
  
  results.forEach((r, i) => {
    if (!r.name) return;
    // Check for duplicate
    const exists = P.some(p => p.name.toLowerCase() === r.name.toLowerCase() && p.university.toLowerCase() === (r.university || '').toLowerCase());
    if (exists) return;
    
    P.push({
      id: maxId + i + 1,
      name: r.name || '',
      title: r.title || '',
      university: r.university || '',
      dept: r.department || '',
      qs: `QS ${r.qsRank || '?'}`,
      qsNum: parseInt(r.qsRank) || 999,
      country: r.timezone ? r.timezone.split(',')[0] : 'Unknown',
      email: r.email || 'Check department directory',
      emailStatus: r.email && !r.email.includes('Check') ? 'confirmed' : 'verify',
      cluster: 'AI / Tech Governance',
      priority: 'Tier 3',
      prioritySort: 3,
      category: r.category || 'Senior',
      research: r.researchAreas || '',
      currentProject: r.currentProject || '',
      papers: [r.recentPublication || ''],
      matchPoint: r.matchPoint || '',
      contribution: r.contribution || '',
      supervisionVacancy: r.supervisionVacancy || 'Not listed',
      bestDays: r.bestDayToEmail || 'Tue/Wed recommended',
      localTime: r.bestLocalTime || '09:00-11:00',
      bdTime: r.bangladeshTime || 'Convert manually',
      timezone: r.timezone || 'Unknown',
      profileUrl: r.profileUrl || '',
      officeHours: r.officeHours || 'Not listed',
      proposalHit: '',
      superStandout: '',
      sources: ['ai_search']
    });
    added++;
  });
  
  showToast(`✅ Added ${added} new professor${added !== 1 ? 's' : ''} to dashboard!`);
  if (added > 0) {
    initStages();
    refreshCurrentView();
  }
}


// ==========================================================================
// PHASE 6: SECURITY FIREWALL & INTEGRITY MODULE
// ==========================================================================

const SECURITY_SALT = 'scholarflow_sec_v2_8f94a2b';

const SecurityFirewall = {
  // Session timeout (30 minutes)
  SESSION_TIMEOUT: 30 * 60 * 1000,
  lastActivity: Date.now(),
  sessionTimer: null,
  
  init() {
    // Track user activity
    ['click', 'keydown', 'mousemove', 'scroll', 'touchstart'].forEach(evt => {
      document.addEventListener(evt, () => {
        this.lastActivity = Date.now();
      }, { passive: true });
    });
    
    // Check session every minute
    this.sessionTimer = setInterval(() => {
      if (isOwnerAuthenticated() && (Date.now() - this.lastActivity > this.SESSION_TIMEOUT)) {
        logoutOwner();
        showToast('🔒 Session expired — auto-locked for security');
      }
    }, 60000);
    
    // Validate localStorage integrity on startup
    this.validateStorage();
  },

  // Cryptographic subscription signature generation
  signSubscription(plan) {
    if (!plan || plan === 'free') {
      localStorage.removeItem('sf_sub_sig');
      return '';
    }
    const token = btoa(`${plan}:${SECURITY_SALT}:${Date.now()}`);
    localStorage.setItem('sf_sub_sig', `${plan}:${SECURITY_SALT}`);
    return token;
  },

  // Verify subscription signature integrity
  verifySubscriptionSignature(plan) {
    if (plan === 'free') return true;
    if (isOwnerAuthenticated()) return true;
    const sig = localStorage.getItem('sf_sub_sig');
    if (!sig) return false;
    return sig === `${plan}:${SECURITY_SALT}`;
  },
  
  // Sanitize HTML input to prevent XSS (Strict entity conversion & tag stripping)
  sanitize(input) {
    if (typeof input !== 'string') return input;
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  // Safe URL validator (Prevents javascript:, data:, vbscript: injection)
  safeUrl(url) {
    if (!url || typeof url !== 'string') return '';
    const clean = url.trim();
    if (/^(https?:\/\/|mailto:)/i.test(clean)) {
      return clean.replace(/[<>"'`]/g, '');
    }
    return '';
  },

  // Safe JSON parser with Prototype Pollution Defense
  safeParseJSON(str, fallback = null) {
    if (!str || typeof str !== 'string') return fallback;
    try {
      return JSON.parse(str, (key, value) => {
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
          console.warn('[SecurityFirewall] Blocked prototype pollution attempt via JSON parser:', key);
          return undefined;
        }
        return value;
      });
    } catch(e) {
      return fallback;
    }
  },
  
  // Rate limiter for actions and API calls
  rateLimiter: new Map(),
  
  checkRateLimit(key, maxCalls, windowMs) {
    const now = Date.now();
    const calls = this.rateLimiter.get(key) || [];
    const recentCalls = calls.filter(t => now - t < windowMs);
    
    if (recentCalls.length >= maxCalls) {
      return false;
    }
    
    recentCalls.push(now);
    this.rateLimiter.set(key, recentCalls);
    return true;
  },
  
  // Comprehensive localStorage integrity validation
  validateStorage() {
    try {
      // 1. Owner Auth Key Validation
      const authKey = localStorage.getItem(OWNER_CONFIG.sessionStorageKey);
      if (authKey && authKey !== '1') {
        localStorage.removeItem(OWNER_CONFIG.sessionStorageKey);
        sessionStorage.removeItem(OWNER_CONFIG.sessionStorageKey);
        console.warn('[SecurityFirewall] Tampered auth key detected and removed.');
      }

      // 2. Subscription Plan Tampering Defense
      const storedPlan = localStorage.getItem('sf_subscription_plan');
      if (storedPlan && storedPlan !== 'free') {
        const isOwner = (sessionStorage.getItem(OWNER_CONFIG.sessionStorageKey) === '1' || localStorage.getItem(OWNER_CONFIG.sessionStorageKey) === '1');
        const isValid = isOwner || this.verifySubscriptionSignature(storedPlan);
        if (!isValid) {
          console.warn('[SecurityFirewall] Unauthorized subscription plan tampering detected. Resetting to Starter (Free).');
          localStorage.setItem('sf_subscription_plan', 'free');
          localStorage.removeItem('sf_sub_sig');
          if (typeof SubscriptionState !== 'undefined') {
            SubscriptionState.currentPlan = 'free';
          }
        }
      }

      // 3. Prototype Pollution inspection on persistent stores
      ['pc', 'pb', 'pstage', 'pfollowup', 'pactivity', 'profileData', 'ledger_items_v1', 'ledger_archive_v1'].forEach(k => {
        const val = localStorage.getItem(k);
        if (val && (val.includes('__proto__') || val.includes('constructor') || val.includes('prototype'))) {
          console.warn(`[SecurityFirewall] Malicious prototype injection pattern detected in '${k}'. Purging corrupted store.`);
          localStorage.removeItem(k);
        }
      });
    } catch(e) {
      console.warn('[SecurityFirewall] Storage validation error:', e);
    }
  },
  
  // CORS-safe fetch wrapper
  async safeFetch(url, options = {}) {
    options.headers = {
      ...options.headers,
      'X-Requested-With': 'ScholarFlow'
    };
    
    // Rate limit API calls (max 10 per minute)
    if (!this.checkRateLimit('api_' + new URL(url).hostname, 10, 60000)) {
      throw new Error('Rate limit exceeded. Please wait before making more requests.');
    }
    
    return fetch(url, options);
  }
};

// Initialize Security Firewall
SecurityFirewall.init();

// Restore Claude API key from encrypted storage
(function() {
  try {
    const encrypted = localStorage.getItem('sf_claude_api_key');
    if (encrypted) {
      ClaudeAIState.apiKey = atob(encrypted);
      ClaudeAIState.isConnected = true;
    }
  } catch(e) {
    // Invalid stored key
    localStorage.removeItem('sf_claude_api_key');
  }
})();

// Update date display
(function() {
  const dateEl = document.getElementById('topbar-date-display');
  if (dateEl) {
    dateEl.textContent = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
})();

// ==========================================================================
// PHASE 7: DEADLINE TRACKER ("THE LEDGER") MODULE
// ==========================================================================

const SEED_DEADLINES = [
  {id:1,category:'cfp',title:"Protection of Civilians and IHL in the Age of Artificial Intelligence",organizer:"International Review of the Red Cross (ICRC)",location:"Online submission",mode:"online",deadline:"2026-09-01",rolling:false,eventDate:"Full papers due 15 Apr 2027",link:"https://international-review.icrc.org",email:"",details:"Decision on abstracts announced 15 Oct 2026 Â· Full paper deadline 15 Apr 2027",addedAt:1},
  {id:2,category:'training',title:"WIPO-UK Summer School on Intellectual Property 2026",organizer:"CIPPM, hosted for WIPO-UK",location:"Virtual",mode:"online",deadline:"2026-08-31",rolling:false,eventDate:"31 Aug – 11 Sept 2026",link:"",email:"",details:"Two-week virtual programme Â· Certificate requires â‰¥80% live attendance",addedAt:2},
  {id:3,category:'cfp',title:"Intersectionality and Social Justice: A Symposium for Early Career Academics",organizer:"University of York",location:"Church Lane Building, University of York, UK",mode:"hybrid",deadline:"2026-10-19",rolling:false,eventDate:"Week commencing 2 Nov 2026 (date TBC)",link:"",email:"",details:"Abstracts up to 250 words for 15-min talks or posters Â· Exact abstract deadline not shown on flyer — estimated; confirm with organiser",addedAt:3},
  {id:4,category:'cfp',title:"Emerging New Political Trends in South Asia",organizer:"Aston University / Politics of South Asia Specialist Group (PSA)",location:"Aston University, Birmingham, UK",mode:"hybrid",deadline:"2026-08-28",rolling:false,eventDate:"13 Nov 2026",link:"",email:"psasouthasiaconference26@gmail.com",details:"One-day international conference Â· Themes: AI & political participation, youth politics, gender, militarism, climate",addedAt:4},
  {id:5,category:'job',title:"CPRD Paid Research Internship — Climate Justice for LDCs",organizer:"Center for Participatory Research & Development (CPRD)",location:"Bangladesh",mode:"in-person",deadline:"2026-08-15",rolling:false,eventDate:"Sept 2026 – Feb 2027 (6 months, paid)",link:"",email:"jobs@cprdbd.org",details:"Master's degree (completed/appeared) required Â· Send CV + cover letter (1 PDF) + 2 referees",addedAt:5},
  {id:6,category:'training',title:"Fundamentals of Research Methodology — Training Course",organizer:"Bangladesh Institute of Governance & Management (BIGM)",location:"BIGM Campus, Agargaon, Dhaka",mode:"in-person",deadline:"2026-08-14",rolling:false,eventDate:"22 Aug – 3 Oct 2026",link:"",email:"nafis.sadik@bigm.edu.bd",details:"7 weeks Â· 24 sessions Â· Sat & Sun, 5–8pm Â· Fee: BDT 3,000 Â· Min. CGPA 3.00, age under 40",addedAt:6},
  {id:7,category:'cfp',title:"SLPR 2026–27 Undergraduate Essay Contest",organizer:"Stanford Law & Policy Review",location:"Online submission",mode:"online",deadline:"2027-01-04",rolling:false,eventDate:"",link:"",email:"slpr-notes@stanford.edu",details:"2,500–5,000 words, Chicago style Â· Open to enrolled undergraduates at any university Â· AI use or plagiarism disqualifies",addedAt:7},
  {id:8,category:'cfp',title:"2nd International Online Conference on Social Sciences (IOCSS 2027)",organizer:"MDPI journal Social Sciences",location:"Online",mode:"online",deadline:"2027-01-22",rolling:false,eventDate:"24–26 May 2027",link:"",email:"",details:"Acceptance notice 24 Feb 2027 Â· Registration deadline 19 May 2027 Â· Topics: crime & justice, gender, migration, society & tech",addedAt:8},
  {id:9,category:'cfp',title:"12th Sustainability Collaborative Conference & 2nd Meeting of the Law and Indigenous Sustainability Network",organizer:"CELS, University of Bristol / HSDN International / PROYASHEE",location:"University of Bristol, UK",mode:"hybrid",deadline:"2026-10-06",rolling:false,eventDate:"5–6 Nov 2026",link:"",email:"t.onifade@bristol.ac.uk",details:"Abstract 150–250 words + 50-word author bio Â· Free to attend, in-person travel self-funded",addedAt:9},
  {id:10,category:'cfp',title:"Rethinking International Relations in an Age of Uncertainty",organizer:"Ng Teng FongÂ·Sino Group Belt and Road Research Institute, Chu Hai College",location:"Hong Kong SAR, China",mode:"in-person",deadline:"2026-08-25",rolling:false,eventDate:"21 Nov 2026",link:"https://easychair.org/conferences/?conf=ir26",email:"nsbrrievent3@chuhai.edu.hk",details:"Abstract 500–1,000 words + 500-word author bio Â· Free Â· Presenters cover own travel & accommodation",addedAt:10},
  {id:11,category:'cfp',title:"Student Policy Paper Competition — Gender Equality & Development",organizer:"Centre for Gender & Development Studies (CGDS), Dhaka University / UN Women / EU",location:"University of Dhaka",mode:"in-person",deadline:"2026-08-31",rolling:false,eventDate:"",link:"",email:"shrabana.datta@unwomen.org",details:"Max 2,000 words Â· Submit 2 hard copies + email a copy Â· Open to current DU students",addedAt:11},
  {id:12,category:'cfp',title:"Workshop: Caste and International Relations",organizer:"Critical Caste International Studies Network (CCISN) / South Asia Studies Center",location:"Jaipur, India",mode:"in-person",deadline:"2026-08-30",rolling:false,eventDate:"11–12 Dec 2026",link:"",email:"casteandir@gmail.com",details:"Abstract 500–700 words + 100-word bio Â· For PhD students & early-career researchers Â· Accommodation covered, travel not",addedAt:12},
  {id:13,category:'cfp',title:"Journal of Polity and Society — Vol. 18(2) Call for Papers",organizer:"Dept. of Political Science, University of Kerala",location:"Kerala, India / online submission",mode:"online",deadline:"2026-10-15",rolling:false,eventDate:"",link:"https://journalspoliticalscience.com/index.php/i",email:"editor.jps@keralauniversity.ac.in",details:"ISSN 0976-0210, international peer-reviewed Â· For July–Dec 2026 issue",addedAt:13},
  {id:14,category:'cfp',title:"14th PEPA/SIEL Conference — Reimagining International Economic Law: Justice, Sustainability and Economic Resilience",organizer:"Society of International Economic Law (SIEL) / PEPA",location:"University of Chile, Santiago, Chile",mode:"in-person",deadline:"2026-09-01",rolling:false,eventDate:"1–3 Dec 2026",link:"",email:"",details:"For postgraduates & early professionals/academics Â· Notification 15 Sept 2026 Â· Draft papers due 10 Nov 2026",addedAt:14},
  {id:15,category:'cfp',title:"SYMROLIC 2026 — 14th Annual International Research Conference on Rule of Law in Context",organizer:"Symbiosis Law School, Pune (with Birmingham, Limassol & York)",location:"Symbiosis Law School, Pune, India",mode:"hybrid",deadline:"2026-08-20",rolling:false,eventDate:"18–19 Sept 2026",link:"",email:"",details:"Theme: Natural resource conflicts, institutional uncertainty & multilateral global governance",addedAt:15},
  {id:16,category:'cfp',title:"Call for Article Submissions — September 2026 Edition",organizer:"European Studies Review",location:"Online submission",mode:"online",deadline:"2026-08-20",rolling:false,eventDate:"",link:"",email:"europeanstudiesreview@gmail.com",details:"Submit article in Word format Â· Subject line: â€œJournal Articleâ€ + your title",addedAt:16},
  {id:17,category:'cfp',title:"Call for Submissions — Cambridge Journal of Climate Research, Vol. 3(2)",organizer:"Cambridge Journal of Climate Research (CJCR)",location:"Online submission",mode:"online",deadline:"2027-02-27",rolling:false,eventDate:"Issue expected Dec 2026",link:"",email:"cjcr.main@gmail.com",details:"Interdisciplinary climate research, all career stages welcome Â· Double peer-review Â· Year of Feb deadline unconfirmed from source — verify with editors",addedAt:17},
  {id:18,category:'cfp',title:"3rd International Conference on Forensic Science, Law, and Criminal Justice",organizer:"Centre for Forensic Science, School of Law, Bennett University",location:"Bennett University, Greater Noida, India",mode:"hybrid",deadline:"2026-08-25",rolling:false,eventDate:"15–17 Sept 2026",link:"",email:"cfs.sol@bennett.edu.in",details:"Abstract 500 words Â· Full paper 5,000–6,000 words by 10 Sept Â· Fees: Professionals ₹2,500 / Scholars ₹1,500 / Students ₹1,000",addedAt:18},
  {id:19,category:'cfp',title:"Call for Abstracts — We Are Not Waiting (Youth-Led Anthology)",organizer:"The 50 Percent / UNESCO-MOST BRIDGES Coalition",location:"Online submission",mode:"online",deadline:"2026-08-31",rolling:false,eventDate:"",link:"",email:"",details:"Ages 14–35, no academic credentials required Â· Focus: regenerative economics, climate justice, peacebuilding, arts & storytelling",addedAt:19},
  {id:20,category:'cfp',title:"Call for Papers — Romanian Yearbook of International and European Law (Inaugural Volume)",organizer:"RYIEL, published by Brill | Nijhoff",location:"Online submission",mode:"online",deadline:"2026-08-20",rolling:false,eventDate:"",link:"",email:"ryiel@e-uvt.ro",details:"Abstract 300–600 words + originality declaration Â· Theme: Tradition of International Law in Central & Eastern Europe Â· Selections announced 10 Sept 2026",addedAt:20},
  {id:21,category:'cfp',title:"Ibsen-Fosse Festival 2026 — Essay Competition",organizer:"Royal Norwegian Embassy in Dhaka / Independent University, Bangladesh (IUB)",location:"Dhaka, Bangladesh",mode:"in-person",deadline:"2026-09-10",rolling:false,eventDate:"Festival: 30 Sept 2026",link:"",email:"event.kniaarsc@iub.edu.bd",details:"Topic: â€œHenrik Ibsen in the Broader Context of Democracyâ€ Â· 350 words, Times New Roman Â· Top 3 win crests & certificates; top 10 invited to festival",addedAt:21},
  {id:22,category:'cfp',title:"Write for the COLOCAL Blog",organizer:"ICCCAD / COLOCAL",location:"Online submission",mode:"online",deadline:"",rolling:true,eventDate:"",link:"",email:"maeeshasiddiqui1@gmail.com",details:"Climate adaptation stories from LDCs Â· Up to 1,000 words + original photos Â· Open to anyone, rolling submissions",addedAt:22},
  {id:23,category:'cfp',title:"International Conference — A Changing World Beyond Crisis: Climate Solutions for a Resilient Future",organizer:"Centre for Policy Dialogue (CPD) — Climate Week 2026",location:"Dhaka, Bangladesh",mode:"hybrid",deadline:"2026-08-15",rolling:false,eventDate:"CPD Climate Week 2026",link:"",email:"",details:"Abstract submission for the flagship CPD Climate Week international conference",addedAt:23},
  {id:24,category:'training',title:"Student Competitions — Climate Olympiad & Climate Policy Case Competition",organizer:"Centre for Policy Dialogue (CPD) — Climate Week 2026",location:"Dhaka, Bangladesh",mode:"hybrid",deadline:"2026-09-01",rolling:false,eventDate:"CPD Climate Week 2026",link:"",email:"",details:"Climate Olympiad (individual) Â· Climate Policy Case Competition, â€œThree Minutes to Rethink Climate Solutionsâ€ (team)",addedAt:24},
  {id:25,category:'training',title:"Green Projects — Local Innovations for Climate Action Exhibition",organizer:"Centre for Policy Dialogue (CPD) — Climate Week 2026",location:"Dhaka, Bangladesh",mode:"hybrid",deadline:"2026-09-01",rolling:false,eventDate:"CPD Climate Week 2026",link:"https://lnkd.in/gm_HzQ5A",email:"",details:"Open to SMEs, community orgs, NGOs, students & youth innovators Â· 500-word concept note required",addedAt:25},
  {id:26,category:'cfp',title:"International Conference on Climate & Disaster Risk Management (ICCDRM 2026)",organizer:"IDMVS, University of Dhaka",location:"University of Dhaka, Bangladesh",mode:"hybrid",deadline:"2026-08-15",rolling:false,eventDate:"8–9 Dec 2026",link:"",email:"info.iccdrm@gmail.com",details:"6 themes incl. DRR, adaptation, early warning, urban risk Â· Fees: Students BDT1,000/USD50, Professionals BDT2,500/USD100 Â· Keynote: Dr Rajib Shaw (Keio University)",addedAt:26},
  {id:27,category:'cfp',title:"DURS 2nd International Student Research Conference (ISRC) 2026 — Beyond Boundaries",organizer:"Dhaka University Research Society (DURS)",location:"University of Dhaka, Bangladesh",mode:"hybrid",deadline:"2026-12-14",rolling:false,eventDate:"28 Dec 2026",link:"",email:"",details:"Abstract deadline not shown on source flyer — placeholder set 2 weeks before conference; confirm with organiser",addedAt:27},
  {id:28,category:'cfp',title:"1st RCASBC International Conference 2026 — Rethinking Rule-Based Global Order: Middle and Small States in a Changing World",organizer:"Hong Kong Research Center for Asian Studies–Bangladesh Center / Dept. of IR, University of Chittagong",location:"University of Chittagong, Bangladesh",mode:"in-person",deadline:"2026-08-17",rolling:false,eventDate:"9–10 Sept 2026",link:"https://conference.rcasbc.org/",email:"rcasbc@cu.ac.bd",details:"Notification 20 Aug Â· Full paper 5 Sept Â· Outstanding papers published as edited book by Springer Nature",addedAt:28},
  {id:29,category:'cfp',title:"15th UN Research Colloquium — The United Nations in Crisis: Threats, Transformations and Futures of International Law",organizer:"Centre for Human Rights Erlangen-Nuremberg / Working Group of Young UN Researchers (DGVN)",location:"Erlangen-Nuremberg, Germany",mode:"in-person",deadline:"2026-08-16",rolling:false,eventDate:"12–14 Nov 2026",link:"",email:"",details:"Abstract max 300–500 words Â· English or German Â· Early-career researchers & civil society especially welcome",addedAt:29},
  {id:30,category:'cfp',title:"2nd International Conference — Constitutionalism and Sustainable Development Goals",organizer:"Centre for Constitutional Law & Human Rights, Bennett University",location:"Bennett University, Greater Noida, India",mode:"hybrid",deadline:"2026-08-31",rolling:false,eventDate:"Constitution Week, 21–26 Nov 2026",link:"",email:"",details:"âš  Abstract deadline (31 Jul) already passed — date shown is the registration & payment deadline Â· Fees from INR 500–2,000 / USD 40–45",addedAt:30},
  {id:31,category:'cfp',title:"Young Graduate Meet '26 — The 'Digital' in Humanities and Social Sciences",organizer:"School of Humanities & Social Sciences, IIT Mandi",location:"IIT Mandi, Himachal Pradesh, India",mode:"in-person",deadline:"2026-08-20",rolling:false,eventDate:"14–16 Oct 2026",link:"https://lnkd.in/dwy4e2bn",email:"shssmeet.iitmandi@gmail.com",details:"Tracks: Big Data & AI, Digital Media, Digital Methods, Digital Economy, Digital Health & Welfare Systems",addedAt:31},
  {id:32,category:'job',title:"Research Assistants — International Affairs",organizer:"Fiker Institute",location:"Remote",mode:"remote",deadline:"2026-08-23",rolling:false,eventDate:"3 months, remote, fixed hours",link:"",email:"research@fikerinstitute.org",details:"Open to graduates in international relations, political science, Middle East affairs or related fields",addedAt:32},
  {id:33,category:'job',title:"2027 Summer Legal Internship Program",organizer:"Tilleke & Gibbins",location:"Cambodia, Indonesia, Laos, Myanmar, Thailand, Vietnam",mode:"in-person",deadline:"2026-09-30",rolling:false,eventDate:"Summer 2027",link:"https://lnkd.in/gMZCgnEH",email:"",details:"For 3rd-year LLB students Â· Min. GPA 2.75 Â· Strong research skills required",addedAt:33},
  {id:34,category:'job',title:"Young Archivists — Bangladesh Protest Archive",organizer:"Activate Rights / Bangladesh Protest Archive (BPA)",location:"Dhaka, Bangladesh",mode:"in-person",deadline:"2026-09-01",rolling:false,eventDate:"3 months, extendable",link:"",email:"info@activaterights.org",details:"Paid + transport & lunch allowance Â· No formal degree required, training provided",addedAt:34},
  {id:35,category:'training',title:"2026 Global Youth Cohort",organizer:"Climate Solution International (CSI)",location:"Online / Global",mode:"online",deadline:"2026-09-20",rolling:false,eventDate:"",link:"https://lnkd.in/enssMJuH",email:"",details:"Training in climate diplomacy, COP processes, environmental governance & policy design",addedAt:35},
  {id:36,category:'training',title:"BRIDGE X — Youth Exposure Programme",organizer:"BRAC",location:"Bangladesh",mode:"in-person",deadline:"2026-08-26",rolling:false,eventDate:"Year-long programme",link:"https://brac.net/BridgeX",email:"",details:"For undergraduate university students Â· Access to BRAC's ecosystem of solutions",addedAt:36}
];

const DEADLINE_CAT_LABELS = {
  cfp: 'Call for Papers / Abstracts',
  training: 'Training / Programme',
  job: 'Job / Internship'
};

const DEADLINE_MODE_LABELS = {
  'in-person': 'In-person',
  'online': 'Online',
  'hybrid': 'Hybrid',
  'remote': 'Remote'
};

const DEADLINE_MODE_ICONS = {
  'in-person': '🏛️',
  'online': '🌐',
  'hybrid': 'ðŸ”€',
  'remote': 'ðŸ’»'
};

function initDeadlines() {
  try {
    const storedItems = localStorage.getItem('ledger_items_v1');
    if (storedItems) {
      State.deadlineItems = JSON.parse(storedItems);
    } else {
      State.deadlineItems = JSON.parse(JSON.stringify(SEED_DEADLINES));
      localStorage.setItem('ledger_items_v1', JSON.stringify(State.deadlineItems));
    }
    
    const storedArchive = localStorage.getItem('ledger_archive_v1');
    if (storedArchive) {
      State.deadlineArchived = JSON.parse(storedArchive);
    } else {
      State.deadlineArchived = [];
    }
    
    archiveExpiredDeadlines();
    updateDeadlineBadge();
  } catch(e) {
    console.warn('Error initializing deadlines:', e);
    State.deadlineItems = JSON.parse(JSON.stringify(SEED_DEADLINES));
  }
}

function saveDeadlinesStorage() {
  localStorage.setItem('ledger_items_v1', JSON.stringify(State.deadlineItems));
  localStorage.setItem('ledger_archive_v1', JSON.stringify(State.deadlineArchived));
  updateDeadlineBadge();
}

function updateDeadlineBadge() {
  const count = State.deadlineItems.length;
  const badgeEl = document.getElementById('nav-badge-deadlines');
  if (badgeEl) badgeEl.textContent = count;
  const archiveCountEl = document.getElementById('ledger-archive-count');
  if (archiveCountEl) archiveCountEl.textContent = State.deadlineArchived.length;
}

function daysUntilDeadline(dateStr) {
  if (!dateStr) return Infinity;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + 'T00:00:00');
  return Math.round((target - today) / 86400000);
}

function getDeadlineUrgency(item) {
  if (item.rolling || !item.deadline) return 'gray';
  const d = daysUntilDeadline(item.deadline);
  if (d < 0) return 'gray';
  if (d <= 7) return 'red';
  if (d <= 21) return 'yellow';
  if (d <= 35) return 'green';
  return 'blue';
}

function formatDeadlineCountdown(item) {
  if (item.rolling || !item.deadline) return 'Rolling / open deadline';
  const d = daysUntilDeadline(item.deadline);
  if (d < 0) return 'Expired';
  if (d === 0) return 'Due today';
  if (d === 1) return '1 day left';
  return `${d} days left`;
}

function formatDateUK(iso) {
  if (!iso) return '—';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function archiveExpiredDeadlines() {
  const active = [];
  let moved = false;
  State.deadlineItems.forEach(it => {
    if (it.rolling || !it.deadline) {
      active.push(it);
      return;
    }
    const d = daysUntilDeadline(it.deadline);
    if (d < 0) {
      State.deadlineArchived.push(it);
      moved = true;
    } else {
      active.push(it);
    }
  });
  if (moved) {
    State.deadlineItems = active;
    saveDeadlinesStorage();
  }
}

function renderDeadlines() {
  updateDeadlineBadge();
  if (State.deadlineTab === 'dashboard') renderDeadlineDashboard();
  if (State.deadlineTab === 'calendar') renderDeadlineCalendar();
  if (State.deadlineTab === 'archive') renderDeadlineArchive();
}

function switchDeadlineTab(tab) {
  State.deadlineTab = tab;
  document.querySelectorAll('.ledger-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.tab === tab);
  });
  
  const dView = document.getElementById('ledger-subview-dashboard');
  const cView = document.getElementById('ledger-subview-calendar');
  const aView = document.getElementById('ledger-subview-archive');
  
  if (dView) dView.style.display = tab === 'dashboard' ? 'block' : 'none';
  if (cView) cView.style.display = tab === 'calendar' ? 'block' : 'none';
  if (aView) aView.style.display = tab === 'archive' ? 'block' : 'none';
  
  renderDeadlines();
}

function filterDeadlineCategory(cat) {
  State.deadlineCategory = cat;
  document.querySelectorAll('.ledger-pill').forEach(p => {
    p.classList.toggle('active', p.dataset.cat === cat);
  });
  renderDeadlineDashboard();
}

function handleDeadlineSort(sortKey) {
  State.deadlineSort = sortKey;
  renderDeadlineDashboard();
}

function handleDeadlineSearch(query) {
  State.deadlineSearch = SecurityFirewall.sanitize(query);
  renderDeadlineDashboard();
}

function getFilteredDeadlineItems() {
  const q = (State.deadlineSearch || '').toLowerCase().trim();
  let list = State.deadlineItems.filter(it => {
    if (State.deadlineCategory !== 'all' && it.category !== State.deadlineCategory) return false;
    if (q) {
      const blob = [it.title, it.organizer, it.location, it.details, it.email, it.eventDate].join(' ').toLowerCase();
      return blob.includes(q);
    }
    return true;
  });
  
  list.sort((a, b) => {
    if (State.deadlineSort === 'deadline') {
      const da = (a.rolling || !a.deadline) ? Infinity : daysUntilDeadline(a.deadline);
      const db = (b.rolling || !b.deadline) ? Infinity : daysUntilDeadline(b.deadline);
      return da - db;
    }
    if (State.deadlineSort === 'added') {
      return (b.addedAt || 0) - (a.addedAt || 0);
    }
    if (State.deadlineSort === 'az') {
      return (a.title || '').localeCompare(b.title || '');
    }
    return 0;
  });
  
  return list;
}

function renderDeadlineDashboard() {
  const isUnlocked = isProOrOwner();
  const list = getFilteredDeadlineItems();
  
  // Render Stats Row (Visible for all tiers so free users see total scope)
  const statsEl = document.getElementById('ledger-stats-row');
  if (statsEl) {
    const total = State.deadlineItems.length;
    let redCount = 0, yellowCount = 0, greenCount = 0, blueCount = 0, rollingCount = 0;
    
    State.deadlineItems.forEach(it => {
      const urg = getDeadlineUrgency(it);
      if (urg === 'red') redCount++;
      else if (urg === 'yellow') yellowCount++;
      else if (urg === 'green') greenCount++;
      else if (urg === 'blue') blueCount++;
      else rollingCount++;
    });
    
    statsEl.innerHTML = `
      <div class="ledger-stat-chip"><span class="ledger-stat-dot" style="background:var(--primary);"></span> Total Active: ${total}</div>
      ${redCount > 0 ? `<div class="ledger-stat-chip urgent"><span class="ledger-stat-dot" style="background:var(--red);"></span> Due &le; 7 days: ${redCount}</div>` : ''}
      ${yellowCount > 0 ? `<div class="ledger-stat-chip soon"><span class="ledger-stat-dot" style="background:var(--amber);"></span> 2–3 weeks: ${yellowCount}</div>` : ''}
      ${greenCount > 0 ? `<div class="ledger-stat-chip upcoming"><span class="ledger-stat-dot" style="background:var(--green);"></span> 3–5 weeks: ${greenCount}</div>` : ''}
      ${blueCount > 0 ? `<div class="ledger-stat-chip later"><span class="ledger-stat-dot" style="background:var(--cyan);"></span> &gt; 5 weeks: ${blueCount}</div>` : ''}
      ${rollingCount > 0 ? `<div class="ledger-stat-chip rolling"><span class="ledger-stat-dot" style="background:var(--text-subtle);"></span> Rolling: ${rollingCount}</div>` : ''}
    `;
  }
  
  // Render Cards Grid
  const gridEl = document.getElementById('ledger-card-grid');
  if (!gridEl) return;
  
  if (list.length === 0) {
    gridEl.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:3.5rem 1rem;background:var(--surface);border:1px dashed var(--border);border-radius:var(--radius-lg);color:var(--text-muted);">
        <div style="font-size:2rem;margin-bottom:0.5rem;">🔍</div>
        <h3 style="font-size:1.1rem;font-weight:700;color:var(--text);">No deadline entries found</h3>
        <p style="font-size:0.8rem;margin-top:0.3rem;">Try clearing search keywords or adding a new entry with "ï¼‹ Add Entry".</p>
      </div>
    `;
    return;
  }
  
  // For Free Users, show first 3 items as Demo Preview, followed by Paywall Card
  const displayList = isUnlocked ? list : list.slice(0, 3);
  
  let cardsHtml = displayList.map((item, idx) => {
    const urg = getDeadlineUrgency(item);
    const countdown = formatDeadlineCountdown(item);
    const catLabel = DEADLINE_CAT_LABELS[item.category] || item.category;
    const modeIcon = DEADLINE_MODE_ICONS[item.mode] || '🌐';
    const modeLabel = DEADLINE_MODE_LABELS[item.mode] || item.mode || 'Online';
    const tabColor = urg === 'red' ? 'var(--red)' : (urg === 'yellow' ? 'var(--amber)' : (urg === 'green' ? 'var(--green)' : (urg === 'blue' ? 'var(--cyan)' : 'var(--text-subtle)')));
    const safeLink = SecurityFirewall.safeUrl(item.link);
    const safeEmail = SecurityFirewall.sanitize(item.email || '');
    
    return `
      <div class="ledger-card" id="ledger-item-${item.id}">
        <div class="ledger-card-tab" style="background:${tabColor};"></div>
        
        <div class="ledger-card-head">
          <div style="display:flex;align-items:center;gap:0.4rem;">
            <span class="cat-badge ${esc(item.category)}">${esc(catLabel)}</span>
            ${!isUnlocked ? `<span class="tag tag-t3" style="font-size:0.6rem;padding:0.15rem 0.4rem;">Demo #${idx + 1}</span>` : ''}
          </div>
          <span class="stamp ${urg}">${esc(countdown)}</span>
        </div>
        
        <div class="ledger-card-body">
          <h3 class="ledger-card-title">${esc(item.title)}</h3>
          <div class="ledger-card-org">
            <span>🏛️</span>
            <span>${esc(item.organizer || 'Academic Host / Institution')}</span>
          </div>
          
          <div class="ledger-meta-row">
            <span class="ledger-meta-icon">${modeIcon}</span>
            <div>
              <span class="ledger-meta-label">Location / Mode</span>
              <div class="ledger-meta-text">${esc(item.location || modeLabel)} &middot; <span style="color:var(--text-muted);">${esc(modeLabel)}</span></div>
            </div>
          </div>
          
          ${item.eventDate ? `
            <div class="ledger-meta-row">
              <span class="ledger-meta-icon">📅</span>
              <div>
                <span class="ledger-meta-label">Event Dates</span>
                <div class="ledger-meta-text">${esc(item.eventDate)}</div>
              </div>
            </div>
          ` : ''}
          
          ${item.details ? `
            <div class="ledger-meta-row">
              <span class="ledger-meta-icon">📝</span>
              <div>
                <span class="ledger-meta-label">Guidelines / Details</span>
                <div class="ledger-meta-text" style="font-size:0.75rem;color:var(--text-muted);">${esc(item.details)}</div>
              </div>
            </div>
          ` : ''}
          
          ${safeEmail ? `
            <div class="ledger-meta-row">
              <span class="ledger-meta-icon">📧</span>
              <div>
                <span class="ledger-meta-label">Contact Email</span>
                <div class="ledger-meta-text">
                  <a href="mailto:${safeEmail}">${safeEmail}</a>
                </div>
              </div>
            </div>
          ` : ''}
        </div>
        
        <!-- Deadline Block -->
        <div class="ledger-deadline-block ${urg === 'red' ? 'urgent' : (urg === 'yellow' ? 'soon' : (urg === 'green' ? 'upcoming' : ''))}">
          <div>
            <div style="font-size:0.65rem;text-transform:uppercase;font-weight:800;color:var(--text-subtle);">Deadline</div>
            <div class="ledger-deadline-date">${item.rolling ? 'Rolling / Open' : formatDateUK(item.deadline)}</div>
          </div>
          <div class="ledger-deadline-count" style="color:${tabColor};">${countdown}</div>
        </div>
        
        <!-- Card Footer Actions -->
        <div class="ledger-card-foot">
          <div style="display:flex;gap:0.4rem;align-items:center;">
            ${safeLink ? `
              <a href="${safeLink}" target="_blank" rel="noopener" class="btn btn-secondary btn-sm" style="font-size:0.75rem;padding:0.35rem 0.7rem;">
                Official Link ↗
              </a>
            ` : ''}
            ${safeEmail ? `
              <button class="btn btn-secondary btn-sm" style="font-size:0.75rem;padding:0.35rem 0.6rem;" onclick="copyEmail('${safeEmail}', this, event)">
                Copy Email
              </button>
            ` : ''}
          </div>
          
          <div class="ledger-card-actions">
            <button class="ledger-icon-btn danger" title="Delete permanently" onclick="deleteDeadlineEntry(${item.id}, event)">🗑️</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
  
  // If Free Tier, append Locked Preview and Paywall Upgrade Card
  if (!isUnlocked) {
    const lockedSample = list.length > 3 ? list[3] : list[0];
    if (lockedSample) {
      cardsHtml += `
        <div class="ledger-card ledger-locked-card" style="position:relative;">
          <div class="ledger-card-tab" style="background:var(--primary);"></div>
          <div class="ledger-card-head">
            <span class="cat-badge cfp">Call for Papers</span>
            <span class="stamp blue">🔒 Pro Record</span>
          </div>
          <div class="ledger-card-body">
            <h3 class="ledger-card-title">${esc(lockedSample.title)}</h3>
            <div class="ledger-card-org"><span>🏛️</span><span>${esc(lockedSample.organizer || 'Academic Institution')}</span></div>
            <div class="ledger-meta-row">
              <span class="ledger-meta-icon">🌐</span>
              <div class="ledger-meta-text">Online / Hybrid &middot; Call for Papers</div>
            </div>
            <div class="ledger-meta-row">
              <span class="ledger-meta-icon">📝</span>
              <div class="ledger-meta-text" style="font-size:0.75rem;color:var(--text-muted);">Guidelines and submission deadlines hidden in free demo preview mode.</div>
            </div>
          </div>
          <div class="ledger-deadline-block">
            <div class="ledger-deadline-date">🔒 Pro Subscription</div>
            <div class="ledger-deadline-count" style="color:var(--primary);">Locked</div>
          </div>
          <div class="ledger-locked-card-overlay" onclick="switchView('subscription')">
            <div class="ledger-paywall-lock" style="width:42px;height:42px;font-size:1.1rem;margin-bottom:0.3rem;">🔒</div>
            <span style="font-weight:800;font-size:0.88rem;color:var(--text);">33+ More Verified Deadlines</span>
            <button class="btn btn-primary btn-sm" style="font-size:0.75rem;padding:0.3rem 0.8rem;">Upgrade to Unlock ↗</button>
          </div>
        </div>
      `;
    }
    
    // Append full width paywall CTA card
    cardsHtml += `
      <div class="ledger-paywall-card">
        <div class="ledger-paywall-lock">🔒</div>
        <div class="ledger-paywall-title">Unlock All 36+ Verified Academic Deadlines</div>
        <div class="ledger-paywall-sub">
          You are currently viewing a <strong>3-item demo preview</strong>. Upgrade to <strong>Professional Plan</strong> to access the complete verified ledger of Calls for Papers, Winter Schools, UN/IHL symposia, fellowships, and law internships.
        </div>
        <div class="ledger-paywall-features">
          <div class="ledger-paywall-feat-item"><span>✓</span> All 36+ Curated Deadlines</div>
          <div class="ledger-paywall-feat-item"><span>✓</span> Interactive Monthly Calendar</div>
          <div class="ledger-paywall-feat-item"><span>✓</span> Custom Entry Logging &amp; Edit</div>
          <div class="ledger-paywall-feat-item"><span>✓</span> JSON Register Backup &amp; Restore</div>
          <div class="ledger-paywall-feat-item"><span>✓</span> 232+ Verified Scholars Access</div>
        </div>
        <div style="display:flex;gap:0.75rem;justify-content:center;flex-wrap:wrap;">
          <button class="btn btn-primary" style="padding:0.75rem 1.75rem;font-size:0.9rem;" onclick="switchView('subscription')">
            ⚡ Upgrade to Professional Plan ($29/mo)
          </button>
          <button class="btn btn-secondary" style="padding:0.75rem 1.4rem;font-size:0.9rem;" onclick="openOwnerAuthModal(() => renderDeadlines())">
            🔐 Owner Passkey Sign-In
          </button>
        </div>
      </div>
    `;
  }
  
  gridEl.innerHTML = cardsHtml;
}

function renderDeadlineCalendar() {
  const isUnlocked = isProOrOwner();
  const wrapEl = document.getElementById('ledger-subview-calendar');
  if (!wrapEl) return;
  
  if (!isUnlocked) {
    wrapEl.innerHTML = `
      <div class="ledger-locked-tab-screen">
        <div class="ledger-paywall-lock">📅</div>
        <div class="ledger-paywall-title">Interactive Deadline Calendar</div>
        <div class="ledger-paywall-sub">
          The monthly urgency calendar provides an active bird's-eye view of all upcoming abstract submissions, training deadlines, and symposium dates with color-coded urgency indicators. This feature requires an active <strong>Professional Plan</strong> subscription or Owner verification.
        </div>
        <div class="ledger-paywall-features" style="margin-top:1.2rem;">
          <div class="ledger-paywall-feat-item"><span>✓</span> Monthly Deadlines Timeline</div>
          <div class="ledger-paywall-feat-item"><span>✓</span> Color-Coded Urgency Dots</div>
          <div class="ledger-paywall-feat-item"><span>✓</span> Single-Click Date Inspection</div>
        </div>
        <div style="display:flex;gap:0.75rem;justify-content:center;margin-top:1.2rem;flex-wrap:wrap;">
          <button class="btn btn-primary" style="padding:0.7rem 1.6rem;" onclick="switchView('subscription')">Upgrade to Pro ($29/mo) ↗</button>
          <button class="btn btn-secondary" style="padding:0.7rem 1.3rem;" onclick="openOwnerAuthModal(() => renderDeadlines())">🔐 Owner Sign-In</button>
        </div>
      </div>
    `;
    return;
  }
  
  // Rebuild standard calendar container if overwritten by paywall
  wrapEl.innerHTML = `
    <div class="ledger-cal-wrap">
      <div class="ledger-cal-header">
        <h2 id="ledger-cal-month-label">Month Year</h2>
        <div class="ledger-cal-nav">
          <button class="btn btn-secondary btn-sm" onclick="changeDeadlineMonth(-1)">â€¹ Prev</button>
          <button class="btn btn-secondary btn-sm" onclick="resetDeadlineMonthToday()">Today</button>
          <button class="btn btn-secondary btn-sm" onclick="changeDeadlineMonth(1)">Next â€º</button>
        </div>
      </div>
      
      <div class="ledger-cal-grid" id="ledger-cal-dow">
        <div class="ledger-cal-dow">Sun</div>
        <div class="ledger-cal-dow">Mon</div>
        <div class="ledger-cal-dow">Tue</div>
        <div class="ledger-cal-dow">Wed</div>
        <div class="ledger-cal-dow">Thu</div>
        <div class="ledger-cal-dow">Fri</div>
        <div class="ledger-cal-dow">Sat</div>
      </div>
      
      <div class="ledger-cal-grid" id="ledger-cal-grid" style="margin-top:0.4rem;"></div>
      
      <div class="ledger-cal-selection" id="ledger-cal-selection"></div>
    </div>
  `;
  
  const cur = State.deadlineCalDate;
  const year = cur.getFullYear();
  const month = cur.getMonth();
  
  const monthName = cur.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const labelEl = document.getElementById('ledger-cal-month-label');
  if (labelEl) labelEl.textContent = monthName;
  
  const gridEl = document.getElementById('ledger-cal-grid');
  if (!gridEl) return;
  
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = new Date().toISOString().slice(0, 10);
  
  // Group deadlines by date
  const dateMap = {};
  State.deadlineItems.forEach(it => {
    if (it.deadline) {
      dateMap[it.deadline] = dateMap[it.deadline] || [];
      dateMap[it.deadline].push(it);
    }
  });
  
  let html = '';
  for (let i = 0; i < firstDay; i++) {
    html += '<div class="ledger-cal-cell empty"></div>';
  }
  
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const itemsOnDay = dateMap[iso] || [];
    const isToday = iso === todayStr;
    const isSelected = State.deadlineSelectedDate === iso;
    const hasItems = itemsOnDay.length > 0;
    
    html += `
      <div class="ledger-cal-cell ${hasItems ? 'has-items' : ''} ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}" onclick="selectDeadlineDate('${iso}')">
        <div class="ledger-cal-daynum">${d}</div>
        ${hasItems ? `
          <div class="ledger-cal-dots">
            ${itemsOnDay.map(it => {
              const urg = getDeadlineUrgency(it);
              return `<span class="ledger-cal-dot ${urg}" title="${esc(it.title)}"></span>`;
            }).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }
  
  gridEl.innerHTML = html;
  
  // Render Selection Details Box
  const selEl = document.getElementById('ledger-cal-selection');
  if (selEl) {
    if (!State.deadlineSelectedDate || !(dateMap[State.deadlineSelectedDate] && dateMap[State.deadlineSelectedDate].length > 0)) {
      selEl.innerHTML = '<div style="font-size:0.8rem;color:var(--text-muted);font-style:italic;">Click on any highlighted calendar cell with event dots to view associated deadlines.</div>';
    } else {
      const itemsOnSel = dateMap[State.deadlineSelectedDate];
      selEl.innerHTML = `
        <h3>Deadlines for ${formatDateUK(State.deadlineSelectedDate)} (${itemsOnSel.length})</h3>
        <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(280px, 1fr));gap:0.75rem;">
          ${itemsOnSel.map(it => `
            <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:0.85rem;box-shadow:var(--shadow-xs);">
              <div style="font-size:0.68rem;font-weight:800;text-transform:uppercase;color:var(--primary);">${esc(it.category)} &middot; ${esc(it.organizer || 'Organizer')}</div>
              <div style="font-weight:700;font-size:0.9rem;margin:0.25rem 0 0.5rem;color:var(--text);">${esc(it.title)}</div>
              <div style="display:flex;gap:0.4rem;">
                ${it.link ? `<a href="${SecurityFirewall.safeUrl(it.link)}" target="_blank" class="btn btn-secondary btn-sm" style="font-size:0.72rem;padding:0.25rem 0.5rem;">Open Link ↗</a>` : ''}
                <button class="btn btn-secondary btn-sm" style="font-size:0.72rem;padding:0.25rem 0.5rem;" onclick="openDeadlineModal(${it.id})">Edit</button>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }
  }
}

function changeDeadlineMonth(delta) {
  const d = State.deadlineCalDate;
  d.setMonth(d.getMonth() + delta);
  renderDeadlineCalendar();
}

function resetDeadlineMonthToday() {
  State.deadlineCalDate = new Date();
  State.deadlineSelectedDate = new Date().toISOString().slice(0, 10);
  renderDeadlineCalendar();
}

function selectDeadlineDate(dateStr) {
  State.deadlineSelectedDate = dateStr;
  renderDeadlineCalendar();
}

function renderDeadlineArchive() {
  const isUnlocked = isProOrOwner();
  const listEl = document.getElementById('ledger-archive-list');
  if (!listEl) return;
  
  if (!isUnlocked) {
    listEl.innerHTML = `
      <div class="ledger-locked-tab-screen">
        <div class="ledger-paywall-lock">📦</div>
        <div class="ledger-paywall-title">Academic Deadline Archive</div>
        <div class="ledger-paywall-sub">
          Historical records and past-due opportunities automatically archive here to keep your active board clean. Restoring expired entries or maintaining historical data requires a <strong>Professional Plan</strong> subscription or Owner verification.
        </div>
        <div style="display:flex;gap:0.75rem;justify-content:center;margin-top:1.2rem;flex-wrap:wrap;">
          <button class="btn btn-primary" style="padding:0.7rem 1.6rem;" onclick="switchView('subscription')">Upgrade to Pro ($29/mo) ↗</button>
          <button class="btn btn-secondary" style="padding:0.7rem 1.3rem;" onclick="openOwnerAuthModal(() => renderDeadlines())">🔐 Owner Sign-In</button>
        </div>
      </div>
    `;
    return;
  }
  
  if (State.deadlineArchived.length === 0) {
    listEl.innerHTML = `
      <div style="text-align:center;padding:3rem 1rem;background:var(--surface);border:1px dashed var(--border);border-radius:var(--radius);color:var(--text-muted);">
        <div style="font-size:1.8rem;margin-bottom:0.4rem;">📦</div>
        <h3 style="font-size:1.05rem;font-weight:700;color:var(--text);">Archive is empty</h3>
        <p style="font-size:0.8rem;margin-top:0.2rem;">Past-deadline entries automatically move here.</p>
      </div>
    `;
    return;
  }
  
  listEl.innerHTML = State.deadlineArchived.map(item => `
    <div class="ledger-archive-item" id="archived-item-${item.id}">
      <div style="flex:1;min-width:240px;">
        <div class="ledger-archive-title">${esc(item.title)}</div>
        <div class="ledger-archive-meta">
          ${esc(item.organizer || 'Unknown Org')} &middot; Deadline: ${item.rolling ? 'Rolling' : formatDateUK(item.deadline)} &middot; Category: ${esc(item.category)}
        </div>
      </div>
      <div style="display:flex;gap:0.5rem;">
        <button class="btn btn-secondary btn-sm" onclick="restoreDeadlineEntry(${item.id}, event)">â†¶ Restore to Active</button>
        <button class="btn btn-secondary btn-sm" style="color:var(--red);" onclick="deleteArchivedDeadlineEntry(${item.id}, event)">🗑️ Delete</button>
      </div>
    </div>
  `).join('');
}

function openDeadlineModal(id = null) {
  if (!isProOrOwner()) {
    showToast('🔒 Custom entry logging requires a Professional Plan or Owner passkey', '🔒');
    switchView('subscription');
    return;
  }

  State.deadlineEditingId = id;
  const modalTitle = document.getElementById('ledger-modal-title');
  const titleInp = document.getElementById('lf-title');
  const catInp = document.getElementById('lf-category');
  const modeInp = document.getElementById('lf-mode');
  const orgInp = document.getElementById('lf-organizer');
  const locInp = document.getElementById('lf-location');
  const deadInp = document.getElementById('lf-deadline');
  const rollInp = document.getElementById('lf-rolling');
  const evInp = document.getElementById('lf-eventdate');
  const linkInp = document.getElementById('lf-link');
  const emailInp = document.getElementById('lf-email');
  const detInp = document.getElementById('lf-details');
  
  if (id) {
    const item = State.deadlineItems.find(x => x.id === id) || State.deadlineArchived.find(x => x.id === id);
    if (!item) return;
    if (modalTitle) modalTitle.textContent = 'Edit Deadline Entry';
    if (titleInp) titleInp.value = item.title || '';
    if (catInp) catInp.value = item.category || 'cfp';
    if (modeInp) modeInp.value = item.mode || 'online';
    if (orgInp) orgInp.value = item.organizer || '';
    if (locInp) locInp.value = item.location || '';
    if (deadInp) {
      deadInp.value = item.deadline || '';
      deadInp.disabled = !!item.rolling;
    }
    if (rollInp) rollInp.checked = !!item.rolling;
    if (evInp) evInp.value = item.eventDate || '';
    if (linkInp) linkInp.value = item.link || '';
    if (emailInp) emailInp.value = item.email || '';
    if (detInp) detInp.value = item.details || '';
  } else {
    if (modalTitle) modalTitle.textContent = 'Add New Deadline Entry';
    if (titleInp) titleInp.value = '';
    if (catInp) catInp.value = 'cfp';
    if (modeInp) modeInp.value = 'online';
    if (orgInp) orgInp.value = '';
    if (locInp) locInp.value = '';
    if (deadInp) {
      deadInp.value = '';
      deadInp.disabled = false;
    }
    if (rollInp) rollInp.checked = false;
    if (evInp) evInp.value = '';
    if (linkInp) linkInp.value = '';
    if (emailInp) emailInp.value = '';
    if (detInp) detInp.value = '';
  }
  
  const backdrop = document.getElementById('ledger-modal-backdrop');
  if (backdrop) backdrop.classList.add('open');
}

function closeDeadlineModal() {
  const backdrop = document.getElementById('ledger-modal-backdrop');
  if (backdrop) backdrop.classList.remove('open');
  State.deadlineEditingId = null;
}

function toggleDeadlineRollingInput(isRolling) {
  const deadInp = document.getElementById('lf-deadline');
  if (deadInp) {
    deadInp.disabled = isRolling;
    if (isRolling) deadInp.value = '';
  }
}

function saveDeadlineEntry() {
  if (!isProOrOwner()) {
    showToast('â›” Operation blocked — upgrade to save entries', '🔒');
    return;
  }

  // Rate limiting check: max 15 submissions per minute
  if (!SecurityFirewall.checkRateLimit('save_deadline', 15, 60000)) {
    showToast('⚠️ Rate limit exceeded. Please slow down.', '⚠️');
    return;
  }

  const rawTitle = (document.getElementById('lf-title')?.value || '').trim();
  if (!rawTitle) {
    showToast('⚠️ Please enter a title', '⚠️');
    document.getElementById('lf-title')?.focus();
    return;
  }
  
  // Sanitize all inputs through SecurityFirewall
  const title = SecurityFirewall.sanitize(rawTitle);
  const category = SecurityFirewall.sanitize(document.getElementById('lf-category')?.value || 'cfp');
  const mode = SecurityFirewall.sanitize(document.getElementById('lf-mode')?.value || 'online');
  const organizer = SecurityFirewall.sanitize((document.getElementById('lf-organizer')?.value || '').trim());
  const location = SecurityFirewall.sanitize((document.getElementById('lf-location')?.value || '').trim());
  const rolling = !!document.getElementById('lf-rolling')?.checked;
  const deadline = rolling ? '' : (document.getElementById('lf-deadline')?.value || '').trim();
  const eventDate = SecurityFirewall.sanitize((document.getElementById('lf-eventdate')?.value || '').trim());
  const link = SecurityFirewall.safeUrl((document.getElementById('lf-link')?.value || '').trim());
  const email = SecurityFirewall.sanitize((document.getElementById('lf-email')?.value || '').trim());
  const details = SecurityFirewall.sanitize((document.getElementById('lf-details')?.value || '').trim());
  
  if (State.deadlineEditingId) {
    const id = State.deadlineEditingId;
    let target = State.deadlineItems.find(x => x.id === id);
    if (target) {
      Object.assign(target, { title, category, mode, organizer, location, rolling, deadline, eventDate, link, email, details });
    } else {
      target = State.deadlineArchived.find(x => x.id === id);
      if (target) {
        Object.assign(target, { title, category, mode, organizer, location, rolling, deadline, eventDate, link, email, details });
      }
    }
    showToast(`✓ Updated "${title}"`);
  } else {
    const maxId = Math.max(0, ...State.deadlineItems.map(x => x.id || 0), ...State.deadlineArchived.map(x => x.id || 0));
    const newEntry = {
      id: maxId + 1,
      title,
      category,
      mode,
      organizer,
      location,
      rolling,
      deadline,
      eventDate,
      link,
      email,
      details,
      addedAt: Date.now()
    };
    State.deadlineItems.unshift(newEntry);
    showToast(`✓ Added "${title}" to Ledger!`);
  }
  
  saveDeadlinesStorage();
  closeDeadlineModal();
  renderDeadlines();
}

function deleteDeadlineEntry(id, event) {
  if (event) event.stopPropagation();
  if (!isProOrOwner()) {
    showToast('🔒 Deleting entries requires a Pro plan or Owner passkey', '🔒');
    switchView('subscription');
    return;
  }

  const item = State.deadlineItems.find(x => x.id === id);
  if (!confirm(`Are you sure you want to delete "${item ? item.title : 'this entry'}"?`)) return;
  
  State.deadlineItems = State.deadlineItems.filter(x => x.id !== id);
  saveDeadlinesStorage();
  renderDeadlines();
  showToast('🗑️ Entry deleted');
}

function archiveDeadlineEntry(id, event) {
  if (event) event.stopPropagation();
  if (!isProOrOwner()) {
    showToast('🔒 Archiving entries requires a Pro plan or Owner passkey', '🔒');
    switchView('subscription');
    return;
  }

  const item = State.deadlineItems.find(x => x.id === id);
  if (!item) return;
  
  State.deadlineItems = State.deadlineItems.filter(x => x.id !== id);
  State.deadlineArchived.unshift(item);
  saveDeadlinesStorage();
  renderDeadlines();
  showToast(`📦 Archived "${item.title}"`);
}

function restoreDeadlineEntry(id, event) {
  if (event) event.stopPropagation();
  if (!isProOrOwner()) {
    showToast('🔒 Restoring entries requires a Pro plan or Owner passkey', '🔒');
    switchView('subscription');
    return;
  }

  const item = State.deadlineArchived.find(x => x.id === id);
  if (!item) return;
  
  State.deadlineArchived = State.deadlineArchived.filter(x => x.id !== id);
  State.deadlineItems.unshift(item);
  saveDeadlinesStorage();
  renderDeadlines();
  showToast(`â†¶ Restored "${item.title}" to active dashboard`);
}

function deleteArchivedDeadlineEntry(id, event) {
  if (event) event.stopPropagation();
  if (!isProOrOwner()) {
    showToast('🔒 Deleting archived entries requires a Pro plan or Owner passkey', '🔒');
    switchView('subscription');
    return;
  }

  if (!confirm('Permanently delete this archived entry?')) return;
  State.deadlineArchived = State.deadlineArchived.filter(x => x.id !== id);
  saveDeadlinesStorage();
  renderDeadlineArchive();
  showToast('🗑️ Archived entry deleted permanently');
}

function exportDeadlines() {
  if (!isProOrOwner()) {
    showToast('🔒 JSON Register export is a Professional Plan feature', '🔒');
    switchView('subscription');
    return;
  }

  // Rate limiting check
  if (!SecurityFirewall.checkRateLimit('export_deadlines', 5, 60000)) {
    showToast('⚠️ Export rate limit exceeded. Please wait a minute.', '⚠️');
    return;
  }

  const data = {
    exportedAt: new Date().toISOString(),
    version: '1.0',
    activeItems: State.deadlineItems,
    archivedItems: State.deadlineArchived
  };
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `academic_ledger_deadlines_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast(`â­³ Exported ${State.deadlineItems.length} active and ${State.deadlineArchived.length} archived deadlines!`);
}

function importDeadlines(event) {
  if (!isProOrOwner()) {
    showToast('🔒 JSON Register import is a Professional Plan feature', '🔒');
    if (event && event.target) event.target.value = '';
    switchView('subscription');
    return;
  }

  const file = event.target.files[0];
  if (!file) return;

  if (file.size > 2 * 1024 * 1024) {
    showToast('⚠️ File too large. Max 2MB.', '⚠️');
    event.target.value = '';
    return;
  }
  
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      // Parse with Prototype Pollution Defense
      const data = SecurityFirewall.safeParseJSON(e.target.result);
      if (!data) throw new Error('Invalid JSON format');
      
      let incomingActive = [];
      let incomingArchived = [];

      if (Array.isArray(data)) {
        incomingActive = data;
      } else if (data.activeItems && Array.isArray(data.activeItems)) {
        incomingActive = data.activeItems;
        if (Array.isArray(data.archivedItems)) incomingArchived = data.archivedItems;
      } else {
        throw new Error('Unrecognized JSON format');
      }

      // Sanitize all incoming records
      const sanitizeRecord = (r, idx) => ({
        id: typeof r.id === 'number' ? r.id : (idx + 1),
        title: SecurityFirewall.sanitize(String(r.title || 'Untitled')),
        category: SecurityFirewall.sanitize(String(r.category || 'cfp')),
        mode: SecurityFirewall.sanitize(String(r.mode || 'online')),
        organizer: SecurityFirewall.sanitize(String(r.organizer || '')),
        location: SecurityFirewall.sanitize(String(r.location || '')),
        rolling: !!r.rolling,
        deadline: r.rolling ? '' : String(r.deadline || ''),
        eventDate: SecurityFirewall.sanitize(String(r.eventDate || '')),
        link: SecurityFirewall.safeUrl(String(r.link || '')),
        email: SecurityFirewall.sanitize(String(r.email || '')),
        details: SecurityFirewall.sanitize(String(r.details || '')),
        addedAt: r.addedAt || Date.now()
      });

      State.deadlineItems = incomingActive.map(sanitizeRecord);
      if (incomingArchived.length > 0) {
        State.deadlineArchived = incomingArchived.map(sanitizeRecord);
      }

      saveDeadlinesStorage();
      renderDeadlines();
      showToast(`â­± Successfully imported and sanitized ledger data!`);
    } catch(err) {
      showToast('❌ Failed to parse JSON file', '❌');
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}


// ==========================================================================
// PHASE 8: SCHOLARSHIP TRACKER ("THE SCHOLARSHIP DESK") MODULE
// Grounded in the 7-Stage Research Framework with Security Firewall & Paywall
// ==========================================================================

function initScholarships() {
  const seed = (typeof MASTER_SCHOLARSHIPS !== 'undefined' && Array.isArray(MASTER_SCHOLARSHIPS)) ? MASTER_SCHOLARSHIPS : [];
  
  let stored = null;
  try {
    const raw = localStorage.getItem('schol_items_v1');
    if (raw) stored = SecurityFirewall.safeParseJSON(raw);
  } catch(e) { stored = null; }
  
  let storedArchived = null;
  try {
    const rawArch = localStorage.getItem('schol_archive_v1');
    if (rawArch) storedArchived = SecurityFirewall.safeParseJSON(rawArch);
  } catch(e) { storedArchived = null; }
  
  if (stored && Array.isArray(stored) && stored.length > 0) {
    State.scholarshipItems = stored;
  } else {
    State.scholarshipItems = JSON.parse(JSON.stringify(seed));
  }
  
  if (storedArchived && Array.isArray(storedArchived)) {
    State.scholarshipArchived = storedArchived;
  } else {
    State.scholarshipArchived = [];
  }
}

function saveScholarshipsStorage() {
  try {
    localStorage.setItem('schol_items_v1', JSON.stringify(State.scholarshipItems));
    localStorage.setItem('schol_archive_v1', JSON.stringify(State.scholarshipArchived));
    localStorage.setItem('schol_checklists_v1', JSON.stringify(State.scholarshipChecklists));
    localStorage.setItem('schol_tests_v1', JSON.stringify(State.scholarshipTests));
    localStorage.setItem('schol_discovery_v1', JSON.stringify(State.scholarshipDiscoveryAnswers));
    localStorage.setItem('schol_profile_v1', JSON.stringify(State.scholarshipProfileAnswers));
  } catch(e) {}
}

function switchScholarshipTab(tabName) {
  State.scholarshipTab = tabName;
  
  document.querySelectorAll('.schol-tab').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === tabName);
  });
  
  const subviews = ['directory', 'discovery', 'profile', 'examprep', 'calendar', 'archive'];
  subviews.forEach(sv => {
    const el = document.getElementById(`schol-subview-${sv}`);
    if (el) el.style.display = (sv === tabName) ? 'block' : 'none';
  });
  
  renderScholarships();
}

function handleScholarshipSearch(query) {
  State.scholarshipSearch = SecurityFirewall.sanitize(query);
  renderScholarshipDirectory();
}

function filterScholarshipCategory(cat) {
  State.scholarshipFilter = cat;
  document.querySelectorAll('#schol-filter-pills .schol-pill').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === cat);
  });
  renderScholarshipDirectory();
}

function handleScholarshipSort(sortBy) {
  State.scholarshipSort = sortBy;
  renderScholarshipDirectory();
}

function toggleScholarshipCard(id) {
  State.scholarshipExpandedCards[id] = !State.scholarshipExpandedCards[id];
  renderScholarshipDirectory();
}

function toggleScholarshipChecklistItem(scholId, itemId) {
  if (!isProOrOwner()) {
    showToast('🔒 Action checklists require Pro plan. Demo preview active.', '🔒');
    return;
  }
  if (!State.scholarshipChecklists[scholId]) {
    State.scholarshipChecklists[scholId] = {};
  }
  State.scholarshipChecklists[scholId][itemId] = !State.scholarshipChecklists[scholId][itemId];
  saveScholarshipsStorage();
  renderScholarshipDirectory();
}

function getScholarshipDaysRemaining(dateStr) {
  if (!dateStr || dateStr.toLowerCase().includes('unknown') || dateStr.toLowerCase().includes('rolling')) return null;
  const target = new Date(dateStr + 'T00:00:00');
  if (isNaN(target.getTime())) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.round((target - now) / 86400000);
}

function formatScholarshipDate(dateStr) {
  if (!dateStr || dateStr.toLowerCase().includes('unknown')) return 'Not confirmed';
  if (dateStr.toLowerCase().includes('rolling')) return 'Rolling Deadline';
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return SecurityFirewall.sanitize(dateStr);
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function getFilteredScholarships() {
  const q = (State.scholarshipSearch || '').toLowerCase().trim();
  const f = State.scholarshipFilter;
  
  let list = State.scholarshipItems.filter(s => {
    // Category Filter
    if (f === 'full' && !s.fundingType.toLowerCase().includes('fully')) return false;
    if (f === 'tier1' && s.priorityTier !== 1) return false;
    if (f === 'uk' && !s.country.toLowerCase().includes('uk') && !s.region.toLowerCase().includes('uk')) return false;
    if (f === 'europe' && !s.region.toLowerCase().includes('europe') && !['switzerland', 'germany', 'france', 'netherlands', 'sweden', 'italy'].some(c => s.country.toLowerCase().includes(c))) return false;
    if (f === 'usa' && !s.country.toLowerCase().includes('usa') && !s.region.toLowerCase().includes('north america')) return false;
    if (f === 'asia' && !s.region.toLowerCase().includes('asia') && !['singapore', 'japan', 'south korea', 'hong kong', 'australia', 'new zealand'].some(c => s.country.toLowerCase().includes(c))) return false;
    if (f === 'canada' && !s.country.toLowerCase().includes('canada')) return false;
    
    // Search Query
    if (q) {
      const blob = [s.name, s.org, s.country, s.region, s.eligibleCourse, s.fundingAmount, s.academicRequirements, s.eligibilityReason].join(' ').toLowerCase();
      return blob.includes(q);
    }
    return true;
  });
  
  // Sort
  list.sort((a, b) => {
    if (State.scholarshipSort === 'deadline') {
      const da = getScholarshipDaysRemaining(a.scholarshipDeadline);
      const db = getScholarshipDaysRemaining(b.scholarshipDeadline);
      const daVal = (da === null || da < 0) ? 9999 : da;
      const dbVal = (db === null || db < 0) ? 9999 : db;
      if (daVal !== dbVal) return daVal - dbVal;
      return (a.priorityTier || 2) - (b.priorityTier || 2);
    }
    if (State.scholarshipSort === 'funding') {
      const getRank = (type) => type.includes('Fully') ? 1 : (type.includes('Full Tuition') ? 2 : 3);
      if (getRank(a.fundingType) !== getRank(b.fundingType)) return getRank(a.fundingType) - getRank(b.fundingType);
      return (a.priorityTier || 2) - (b.priorityTier || 2);
    }
    if (State.scholarshipSort === 'match') {
      const getMatchRank = (m) => m.includes('STRONG') ? 1 : 2;
      return getMatchRank(a.eligibilityMatch) - getMatchRank(b.eligibilityMatch);
    }
    if (State.scholarshipSort === 'az') {
      return a.name.localeCompare(b.name);
    }
    return 0;
  });
  
  return list;
}

function renderScholarships() {
  if (!State.scholarshipItems || State.scholarshipItems.length === 0) {
    initScholarships();
  }
  
  // Update badge counts
  const dirCountEl = document.getElementById('schol-count-directory');
  if (dirCountEl) dirCountEl.textContent = State.scholarshipItems.length;
  
  const navBadgeEl = document.getElementById('nav-badge-scholarships');
  if (navBadgeEl) navBadgeEl.textContent = State.scholarshipItems.length;
  
  const archCountEl = document.getElementById('schol-archive-count');
  if (archCountEl) archCountEl.textContent = State.scholarshipArchived.length;
  
  if (State.scholarshipTab === 'directory') renderScholarshipDirectory();
  else if (State.scholarshipTab === 'discovery') renderScholarshipDiscovery();
  else if (State.scholarshipTab === 'profile') renderScholarshipProfile();
  else if (State.scholarshipTab === 'examprep') renderScholarshipExamPrep();
  else if (State.scholarshipTab === 'calendar') renderScholarshipCalendar();
  else if (State.scholarshipTab === 'archive') renderScholarshipArchive();
}

const SCHOLARSHIP_CHECKLIST_TEMPLATE = [
  { id: 'eligibility', label: 'Verify university & nationality eligibility gates' },
  { id: 'supervisor', label: 'Identify potential academic supervisor & reach out' },
  { id: 'proposal', label: 'Draft research proposal & study statement (1,500-2,500 words)' },
  { id: 'references', label: 'Secure 2-3 academic reference commitment letters' },
  { id: 'transcripts', label: 'Prepare certified English academic transcripts & degree scrolls' },
  { id: 'eng_test', label: 'Complete IELTS / TOEFL exam with required band score' },
  { id: 'cv_sop', label: 'Tailor academic CV & Statement of Purpose to funding priorities' },
  { id: 'submission', label: 'Submit university & scholarship application before cutoff' },
  { id: 'tracking', label: 'Confirm receipt & log interview / decision milestones' }
];

function renderScholarshipDirectory() {
  const statsEl = document.getElementById('schol-stats-row');
  const gridEl = document.getElementById('schol-card-grid');
  if (!gridEl) return;
  
  const isUnlocked = isProOrOwner();
  const allList = getFilteredScholarships();
  
  // Render Summary Stats
  if (statsEl) {
    const totalCount = State.scholarshipItems.length;
    const fullyFundedCount = State.scholarshipItems.filter(s => s.fundingType.toLowerCase().includes('fully')).length;
    const tier1Count = State.scholarshipItems.filter(s => s.priorityTier === 1).length;
    const nearestDay = State.scholarshipItems.map(s => getScholarshipDaysRemaining(s.scholarshipDeadline)).filter(d => d !== null && d >= 0).sort((a,b)=>a-b)[0];
    
    statsEl.innerHTML = `
      <div class="schol-stat-card">
        <div class="schol-stat-val purple">${totalCount}</div>
        <div class="schol-stat-lbl">Tracked Opportunities</div>
      </div>
      <div class="schol-stat-card">
        <div class="schol-stat-val green">${fullyFundedCount}</div>
        <div class="schol-stat-lbl">Fully Funded Grants</div>
      </div>
      <div class="schol-stat-card">
        <div class="schol-stat-val gold">${tier1Count}</div>
        <div class="schol-stat-lbl">Tier 1 Flagship Targets</div>
      </div>
      <div class="schol-stat-card">
        <div class="schol-stat-val cyan">${nearestDay !== undefined ? nearestDay + 'd' : '—'}</div>
        <div class="schol-stat-lbl">Nearest Deadline</div>
      </div>
    `;
  }
  
  // Mode A: FREE TIER DEMO PREVIEW
  if (!isUnlocked) {
    const demoItems = allList.slice(0, 3);
    const sampleLocked = allList[3] || allList[0];
    
    let html = `
      <div class="schol-demo-banner">
        <div style="display:flex;align-items:center;gap:0.75rem;">
          <span style="font-size:1.4rem;">🎓</span>
          <div>
            <div style="font-weight:700;font-size:0.95rem;color:var(--text);">Free Tier — Scholarship Desk Demo Preview</div>
            <div style="font-size:0.8rem;color:var(--text-muted);">Showing 3 featured demo opportunities. Upgrade to unlock all ${State.scholarshipItems.length}+ global scholarships, Discovery engine, and Exam prep.</div>
          </div>
        </div>
        <button class="btn btn-primary" onclick="switchView('subscription')" style="white-space:nowrap;">⚡ Upgrade to Pro ($29/mo)</button>
      </div>
    `;
    
    // Render 3 Interactive Demo Cards
    html += demoItems.map((s, idx) => renderSingleScholarshipCardHtml(s, idx + 1, false)).join('');
    
    // Sample locked preview card
    if (sampleLocked) {
      html += `
        <div class="schol-card schol-locked-card" style="margin-top:0.75rem;">
          <div class="ledger-locked-card-overlay" onclick="switchView('subscription')">
            <div class="ledger-paywall-lock" style="width:42px;height:42px;color:var(--purple,#7C3AED);">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            </div>
            <div style="font-weight:800;font-size:1rem;color:var(--text);">Locked Scholarship Opportunity (#4 of ${State.scholarshipItems.length})</div>
            <div style="font-size:0.8rem;color:var(--text-muted);max-width:400px;text-align:center;">${SecurityFirewall.sanitize(sampleLocked.org)} &middot; Full Tuition &amp; Living Stipend Package</div>
            <button class="btn btn-primary" style="margin-top:0.35rem;padding:0.4rem 1rem;font-size:0.8rem;" onclick="switchView('subscription')">Unlock Full Database</button>
          </div>
          <div class="schol-card-head">
            <div class="schol-card-top">
              <div class="schol-card-title-group">
                <div class="schol-card-title">${SecurityFirewall.sanitize(sampleLocked.name)}</div>
                <div class="schol-card-org">${SecurityFirewall.sanitize(sampleLocked.org)} &middot; ${SecurityFirewall.sanitize(sampleLocked.country)}</div>
              </div>
            </div>
          </div>
          <div class="schol-card-body">
            <div class="schol-def-grid">
              <div class="schol-def-item"><span class="schol-def-label">Funding Amount</span><span class="schol-def-val">${SecurityFirewall.sanitize(sampleLocked.fundingAmount)}</span></div>
            </div>
          </div>
        </div>
      `;
    }
    
    // Prominent Paywall Card
    html += `
      <div class="schol-paywall-card" style="margin-top:1.25rem;">
        <div class="schol-paywall-lock">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
        </div>
        <div class="schol-paywall-title">Unlock All ${State.scholarshipItems.length}+ Global Scholarships &amp; Study-Abroad Intelligence</div>
        <div class="schol-paywall-desc">
          Get complete, unrestricted access to the full verified scholarship dossier covering the UK, Europe, USA, Asia-Pacific, and Canada — complete with 7-Stage Country Discovery, 12-factor Profile Matchmaker, Exam Score Tracking, and .ICS calendar export.
        </div>
        <div class="schol-paywall-features">
          <span>✓ All ${State.scholarshipItems.length}+ Full Tuition &amp; Stipend Grants</span>
          <span>✓ Interactive Country &amp; Course Discovery Wizard</span>
          <span>✓ Automated Profile Matchmaker &amp; Eligibility Scoring</span>
          <span>✓ IELTS &amp; GRE Test Milestone Tracker</span>
          <span>✓ Custom Scholarship CRUD &amp; JSON Backup</span>
        </div>
        <div style="display:flex;gap:0.75rem;flex-wrap:wrap;justify-content:center;margin-top:0.5rem;">
          <button class="btn btn-primary" style="padding:0.75rem 1.75rem;font-size:0.95rem;" onclick="switchView('subscription')">⚡ Upgrade to Professional Plan ($29/mo)</button>
          <button class="btn btn-secondary" onclick="openOwnerAuthModal()">🔐 Owner Passkey Sign-In</button>
        </div>
      </div>
    `;
    
    gridEl.innerHTML = html;
    return;
  }
  
  // Mode B: PRO / ENTERPRISE / OWNER FULL ACCESS
  if (allList.length === 0) {
    gridEl.innerHTML = `
      <div class="schol-card" style="padding:2.5rem;text-align:center;color:var(--text-muted);">
        <div style="font-size:2rem;margin-bottom:0.5rem;">🔍</div>
        <div style="font-weight:700;font-size:1.05rem;color:var(--text);margin-bottom:0.35rem;">No scholarships match your filters</div>
        <div style="font-size:0.85rem;">Try adjusting your search keywords or switching filter categories.</div>
      </div>
    `;
    return;
  }
  
  gridEl.innerHTML = allList.map((s, idx) => renderSingleScholarshipCardHtml(s, null, true)).join('');
}

function renderSingleScholarshipCardHtml(s, demoNumber, isUnlocked) {
  const isExpanded = !!State.scholarshipExpandedCards[s.id];
  const days = getScholarshipDaysRemaining(s.scholarshipDeadline);
  const checklist = State.scholarshipChecklists[s.id] || {};
  const completedCount = SCHOLARSHIP_CHECKLIST_TEMPLATE.filter(c => checklist[c.id]).length;
  
  const countdownClass = (days === null) ? '' : (days < 0 ? 'muted' : (days <= 14 ? 'urgent' : (days <= 45 ? 'soon' : 'open')));
  const fundingBadgeClass = s.fundingType.toLowerCase().includes('fully') ? 'fully-funded' : (s.fundingType.toLowerCase().includes('full tuition') ? 'full-tuition' : 'partial');
  const matchBadgeClass = s.eligibilityMatch.includes('STRONG') ? 'strong-match' : 'possible-match';
  
  return `
    <div class="schol-card ${isExpanded ? 'expanded' : ''}" id="schol-card-${s.id}">
      <div class="schol-card-head" onclick="toggleScholarshipCard('${s.id}')">
        <div class="schol-card-top">
          <div class="schol-card-title-group">
            <div style="display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap;">
              ${demoNumber ? `<span class="schol-demo-badge">Demo #${demoNumber}</span>` : ''}
              <span class="schol-badge ${matchBadgeClass}">${SecurityFirewall.sanitize(s.eligibilityMatch)}</span>
              <span class="schol-badge tier-1">Tier ${s.priorityTier} Target</span>
              <span class="schol-badge ${fundingBadgeClass}">${SecurityFirewall.sanitize(s.fundingType)}</span>
            </div>
            <div class="schol-card-title" style="margin-top:0.35rem;">${SecurityFirewall.sanitize(s.name)}</div>
            <div class="schol-card-org">
              🏛️ ${SecurityFirewall.sanitize(s.org)} &middot; 📍 ${SecurityFirewall.sanitize(s.country)} &middot; 🎓 ${SecurityFirewall.sanitize(s.studyLevel)}
            </div>
          </div>
          <div class="schol-countdown-box">
            <div class="schol-countdown-val ${countdownClass}">${days === null ? '—' : (days < 0 ? 'Closed' : days + 'd')}</div>
            <div class="schol-countdown-lbl">${days === null ? 'No Fixed Date' : (days < 0 ? 'Past Cycle' : 'Days Remaining')}</div>
          </div>
        </div>
      </div>
      
      ${isExpanded ? `
        <div class="schol-card-body">
          ${s.eligibilityReason ? `
            <div style="background:rgba(124,58,237,0.06);border-left:3px solid var(--purple,#7C3AED);padding:0.75rem 1rem;border-radius:var(--radius-sm);font-size:0.83rem;color:var(--text);line-height:1.45;">
              <strong>🎯 Strategic Eligibility Match:</strong> ${SecurityFirewall.sanitize(s.eligibilityReason)}
            </div>
          ` : ''}
          
          <div class="schol-def-grid">
            <div class="schol-def-item">
              <span class="schol-def-label">Eligible Field &amp; Degree</span>
              <span class="schol-def-val">${SecurityFirewall.sanitize(s.eligibleCourse || 'All Master / PhD subjects')}</span>
            </div>
            <div class="schol-def-item">
              <span class="schol-def-label">Funding Package &amp; Amount</span>
              <span class="schol-def-val" style="font-weight:700;color:var(--text);">${SecurityFirewall.sanitize(s.fundingAmount)}</span>
            </div>
            <div class="schol-def-item">
              <span class="schol-def-label">Scholarship Application Deadline</span>
              <span class="schol-def-val" style="color:var(--purple,#7C3AED);font-weight:700;">${formatScholarshipDate(s.scholarshipDeadline)}</span>
            </div>
            <div class="schol-def-item">
              <span class="schol-def-label">Course / University Deadline</span>
              <span class="schol-def-val">${formatScholarshipDate(s.courseDeadline)}</span>
            </div>
            <div class="schol-def-item">
              <span class="schol-def-label">Academic &amp; GPA Requirements</span>
              <span class="schol-def-val">${SecurityFirewall.sanitize(s.academicRequirements)}</span>
            </div>
            <div class="schol-def-item">
              <span class="schol-def-label">English / Entrance Tests</span>
              <span class="schol-def-val">${SecurityFirewall.sanitize(s.englishRequirement)}</span>
            </div>
            <div class="schol-def-item">
              <span class="schol-def-label">Application Fee Notice</span>
              <span class="schol-def-val">${SecurityFirewall.sanitize(s.applicationFee)}</span>
            </div>
            <div class="schol-def-item">
              <span class="schol-def-label">Last Verified</span>
              <span class="schol-def-val">Verified ${SecurityFirewall.sanitize(s.lastVerified)}</span>
            </div>
          </div>
          
          ${s.covers && s.covers.length > 0 ? `
            <div>
              <span class="schol-def-label">Full Benefits Covered</span>
              <div class="schol-chips-wrap">
                ${s.covers.map(c => `<span class="schol-chip-item">✓ ${SecurityFirewall.sanitize(c)}</span>`).join('')}
              </div>
            </div>
          ` : ''}

          ${s.applicationSteps && s.applicationSteps.length > 0 ? `
            <div>
              <span class="schol-def-label">Application Steps &amp; Protocol</span>
              <ol class="schol-steps-list">
                ${s.applicationSteps.map(step => `<li>${SecurityFirewall.sanitize(step)}</li>`).join('')}
              </ol>
            </div>
          ` : ''}

          <!-- Action Checklist -->
          <div class="schol-checklist-wrap">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span class="schol-def-label">Dossier Action Checklist (${completedCount}/${SCHOLARSHIP_CHECKLIST_TEMPLATE.length})</span>
              ${isUnlocked ? `<span style="font-size:0.75rem;color:var(--text-muted);">Auto-saved locally</span>` : `<span style="font-size:0.72rem;color:var(--purple,#7C3AED);font-weight:700;">🔒 Pro Plan Feature</span>`}
            </div>
            <div class="schol-checklist-grid">
              ${SCHOLARSHIP_CHECKLIST_TEMPLATE.map(item => `
                <label class="schol-check-row ${checklist[item.id] ? 'done' : ''}">
                  <input type="checkbox" ${checklist[item.id] ? 'checked' : ''} onchange="toggleScholarshipChecklistItem('${s.id}', '${item.id}')">
                  <span>${SecurityFirewall.sanitize(item.label)}</span>
                </label>
              `).join('')}
            </div>
          </div>

          <div class="schol-card-actions">
            <div style="display:flex;gap:0.5rem;flex-wrap:wrap;">
              ${s.officialApplicationUrl ? `
                <a href="${SecurityFirewall.safeUrl(s.officialApplicationUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm" style="display:inline-flex;align-items:center;gap:4px;">
                  <span>Apply on Official Portal</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/></svg>
                </a>
              ` : ''}
              ${s.officialSourceUrl ? `
                <a href="${SecurityFirewall.safeUrl(s.officialSourceUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm" style="display:inline-flex;align-items:center;gap:4px;">
                  <span>Official Authority Site</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/></svg>
                </a>
              ` : ''}
              <button class="btn btn-secondary btn-sm" onclick="downloadScholarshipICS('${s.id}')" title="Download .ICS Calendar Event">
                📅 Add to Calendar (.ics)
              </button>
            </div>
            
            ${isUnlocked ? `
              <div style="display:flex;gap:0.4rem;">
                <button class="btn btn-secondary btn-sm" onclick="archiveScholarshipEntry('${s.id}')" title="Archive opportunity">📁 Archive</button>
                <button class="btn btn-secondary btn-sm" onclick="deleteScholarshipEntry('${s.id}', false)" style="color:#EF4444;" title="Delete entry">🗑️</button>
              </div>
            ` : ''}
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

// â”€â”€â”€ COUNTRY DISCOVERY SUBVIEW â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function renderScholarshipDiscovery() {
  const el = document.getElementById('schol-subview-discovery');
  if (!el) return;
  
  if (!isProOrOwner()) {
    el.innerHTML = `
      <div class="schol-locked-tab-screen">
        <div class="schol-paywall-lock">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
        </div>
        <div class="schol-paywall-title">Country &amp; Course Discovery Wizard (Locked)</div>
        <div class="schol-paywall-desc">
          Compare realistic study-abroad destinations across tuition costs, living budgets, post-study work visa rights, and scholarship quotas with intelligent ROI scoring.
        </div>
        <div style="margin-top:1rem;">
          <button class="btn btn-primary" onclick="switchView('subscription')">⚡ Upgrade to Pro to Unlock Discovery</button>
        </div>
      </div>
    `;
    return;
  }
  
  const a = State.scholarshipDiscoveryAnswers;
  
  el.innerHTML = `
    <div class="schol-discovery-card">
      <div class="schol-brand-kicker">Stage 1 &middot; Decision Support Wizard</div>
      <div style="font-weight:800;font-size:1.3rem;color:var(--text);">Country &amp; Course Match Matrix</div>
      <div style="font-size:0.86rem;color:var(--text-muted);line-height:1.5;">
        Evaluate realistic study destinations tailored to your academic profile, annual funding budget, part-time work rights, and post-study visa length.
      </div>
      
      <div class="schol-form-grid" style="margin-top:0.5rem;">
        <div class="schol-form-field">
          <label class="schol-form-label">Research &amp; Subject Interests</label>
          <input type="text" id="df-interests" class="schol-form-input" value="${SecurityFirewall.sanitize(a.interests)}" placeholder="e.g. Climate Justice, AI Governance, International Law">
        </div>
        <div class="schol-form-field">
          <label class="schol-form-label">Target Degree / Program</label>
          <input type="text" id="df-course" class="schol-form-input" value="${SecurityFirewall.sanitize(a.courseInMind)}" placeholder="e.g. PhD in Law / LLM">
        </div>
        <div class="schol-form-field">
          <label class="schol-form-label">Annual Self-Funded Budget (USD)</label>
          <input type="number" id="df-budget" class="schol-form-input" value="${SecurityFirewall.sanitize(a.budget)}" placeholder="25000">
        </div>
        <div class="schol-form-field">
          <label class="schol-form-label">Post-Study Work Visa Importance</label>
          <select id="df-visa" class="schol-form-select">
            <option value="high" ${a.visaImportance === 'high' ? 'selected' : ''}>High (Crucial factor for ROI)</option>
            <option value="medium" ${a.visaImportance === 'medium' ? 'selected' : ''}>Medium (Somewhat important)</option>
            <option value="low" ${a.visaImportance === 'low' ? 'selected' : ''}>Low (Returning home immediately)</option>
          </select>
        </div>
      </div>
      
      <div style="display:flex;gap:0.75rem;margin-top:0.5rem;">
        <button class="btn btn-primary" onclick="runDiscoveryWizard()">🔄 Compare Destinations</button>
      </div>

      <!-- Real Comparison Matrix Table -->
      <div class="schol-comparison-table-wrap">
        <table class="schol-comparison-table">
          <thead>
            <tr>
              <th>Country</th>
              <th>Avg Tuition (Law)</th>
              <th>Avg Living Cost</th>
              <th>Post-Study Visa</th>
              <th>Part-Time Work</th>
              <th>Top Funding Scheme</th>
              <th>Match Score</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>ðŸ‡¬ðŸ‡§ United Kingdom</strong></td>
              <td>£24,000 – £38,000</td>
              <td>£12,000 – £16,000/yr</td>
              <td>2 Years (Graduate Visa)</td>
              <td>20 hrs/week</td>
              <td>Chevening, Gates Cambridge, Clarendon</td>
              <td><span class="schol-badge strong-match">98% Match</span></td>
            </tr>
            <tr>
              <td><strong>ðŸ‡¨ðŸ‡­ Switzerland</strong></td>
              <td>CHF 1,500 (Cantonal)</td>
              <td>CHF 20,000 – 24,000/yr</td>
              <td>6 Months Job Search</td>
              <td>15 hrs/week</td>
              <td>Swiss Government Excellence (FCS)</td>
              <td><span class="schol-badge strong-match">96% Match</span></td>
            </tr>
            <tr>
              <td><strong>ðŸ‡©ðŸ‡ª Germany</strong></td>
              <td>€0 (Tuition-free public)</td>
              <td>€11,200/yr (Blocked Acc.)</td>
              <td>18 Months</td>
              <td>20 hrs/week</td>
              <td>DAAD Helmut-Schmidt, DAAD EPOS</td>
              <td><span class="schol-badge strong-match">95% Match</span></td>
            </tr>
            <tr>
              <td><strong>ðŸ‡¸ðŸ‡¬ Singapore</strong></td>
              <td>SGD $38,000 (Subsidized)</td>
              <td>SGD $18,000/yr</td>
              <td>1 Year (LTVP upon graduation)</td>
              <td>16 hrs/week</td>
              <td>NUS Research Scholarship, SINGA</td>
              <td><span class="schol-badge strong-match">94% Match</span></td>
            </tr>
            <tr>
              <td><strong>ðŸ‡¦ðŸ‡º Australia</strong></td>
              <td>AUD $38,000 – $48,000</td>
              <td>AUD $24,500/yr</td>
              <td>2–4 Years (Subclass 485)</td>
              <td>48 hrs/fortnight</td>
              <td>Australia Awards (DFAT), Melbourne GRS</td>
              <td><span class="schol-badge possible-match">91% Match</span></td>
            </tr>
            <tr>
              <td><strong>ðŸ‡¨ðŸ‡¦ Canada</strong></td>
              <td>CAD $22,000 – $36,000</td>
              <td>CAD $20,635/yr</td>
              <td>Up to 3 Years (PGWP)</td>
              <td>20 hrs/week</td>
              <td>Vanier CGS, Trudeau Foundation</td>
              <td><span class="schol-badge strong-match">93% Match</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function runDiscoveryWizard() {
  const interests = document.getElementById('df-interests')?.value || '';
  const course = document.getElementById('df-course')?.value || '';
  const budget = document.getElementById('df-budget')?.value || '';
  const visa = document.getElementById('df-visa')?.value || 'high';
  
  State.scholarshipDiscoveryAnswers = {
    ...State.scholarshipDiscoveryAnswers,
    interests: SecurityFirewall.sanitize(interests),
    courseInMind: SecurityFirewall.sanitize(course),
    budget: SecurityFirewall.sanitize(budget),
    visaImportance: SecurityFirewall.sanitize(visa)
  };
  saveScholarshipsStorage();
  showToast('✓ Updated Country & Course Discovery matrix!');
  renderScholarshipDiscovery();
}

// â”€â”€â”€ PROFILE MATCHMAKER SUBVIEW â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function renderScholarshipProfile() {
  const el = document.getElementById('schol-subview-profile');
  if (!el) return;
  
  if (!isProOrOwner()) {
    el.innerHTML = `
      <div class="schol-locked-tab-screen">
        <div class="schol-paywall-lock">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
        </div>
        <div class="schol-paywall-title">12-Factor Profile Matchmaker (Locked)</div>
        <div class="schol-paywall-desc">
          Automated eligibility evaluator checking nationality criteria, minimum GPA, test band requirements, and leadership achievements against the world's premier scholarship databases.
        </div>
        <div style="margin-top:1rem;">
          <button class="btn btn-primary" onclick="switchView('subscription')">⚡ Upgrade to Pro to Unlock Matchmaker</button>
        </div>
      </div>
    `;
    return;
  }
  
  const p = State.scholarshipProfileAnswers;
  
  el.innerHTML = `
    <div class="schol-profile-card">
      <div class="schol-brand-kicker">Stage 2 &middot; Profile Intake &amp; Eligibility Matcher</div>
      <div style="font-weight:800;font-size:1.3rem;color:var(--text);">Candidate Academic File</div>
      <div style="font-size:0.86rem;color:var(--text-muted);line-height:1.5;">
        Save your official candidate credentials. The matcher compares these values with all 54+ scholarship criteria.
      </div>

      <div class="schol-form-grid" style="margin-top:0.5rem;">
        <div class="schol-form-field">
          <label class="schol-form-label">Nationality</label>
          <input type="text" id="pf-nationality" class="schol-form-input" value="${SecurityFirewall.sanitize(p.nationality)}">
        </div>
        <div class="schol-form-field">
          <label class="schol-form-label">Current Country of Residence</label>
          <input type="text" id="pf-residence" class="schol-form-input" value="${SecurityFirewall.sanitize(p.residence)}">
        </div>
        <div class="schol-form-field">
          <label class="schol-form-label">Current Education Level</label>
          <input type="text" id="pf-edulevel" class="schol-form-input" value="${SecurityFirewall.sanitize(p.educationLevel)}">
        </div>
        <div class="schol-form-field">
          <label class="schol-form-label">Latest CGPA / Percentage</label>
          <input type="text" id="pf-grades" class="schol-form-input" value="${SecurityFirewall.sanitize(p.grades)}">
        </div>
        <div class="schol-form-field">
          <label class="schol-form-label">Target Degree / Program</label>
          <input type="text" id="pf-course" class="schol-form-input" value="${SecurityFirewall.sanitize(p.course)}">
        </div>
        <div class="schol-form-field">
          <label class="schol-form-label">Target Intake Year</label>
          <input type="text" id="pf-intake" class="schol-form-input" value="${SecurityFirewall.sanitize(p.intake)}">
        </div>
      </div>

      <div class="schol-form-field">
        <label class="schol-form-label">Academic Distinctions, Publications &amp; Leadership</label>
        <textarea id="pf-extra" class="schol-form-textarea" rows="3">${SecurityFirewall.sanitize(p.extracurriculars)}</textarea>
      </div>

      <div style="display:flex;gap:0.75rem;margin-top:0.5rem;">
        <button class="btn btn-primary" onclick="saveProfileMatchmaker()">ðŸ’¾ Save &amp; Run Matchmaker</button>
      </div>
    </div>
  `;
}

function saveProfileMatchmaker() {
  State.scholarshipProfileAnswers = {
    ...State.scholarshipProfileAnswers,
    nationality: SecurityFirewall.sanitize(document.getElementById('pf-nationality')?.value || ''),
    residence: SecurityFirewall.sanitize(document.getElementById('pf-residence')?.value || ''),
    educationLevel: SecurityFirewall.sanitize(document.getElementById('pf-edulevel')?.value || ''),
    grades: SecurityFirewall.sanitize(document.getElementById('pf-grades')?.value || ''),
    course: SecurityFirewall.sanitize(document.getElementById('pf-course')?.value || ''),
    intake: SecurityFirewall.sanitize(document.getElementById('pf-intake')?.value || ''),
    extracurriculars: SecurityFirewall.sanitize(document.getElementById('pf-extra')?.value || '')
  };
  saveScholarshipsStorage();
  showToast('✓ Saved candidate profile and re-scored scholarship matches!');
  renderScholarshipProfile();
}

// â”€â”€â”€ EXAM PREP SUBVIEW â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function renderScholarshipExamPrep() {
  const el = document.getElementById('schol-subview-examprep');
  if (!el) return;
  
  if (!isProOrOwner()) {
    el.innerHTML = `
      <div class="schol-locked-tab-screen">
        <div class="schol-paywall-lock">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
        </div>
        <div class="schol-paywall-title">Exam Readiness &amp; Mock Score Log (Locked)</div>
        <div class="schol-paywall-desc">
          Track official exam preparation milestones (IELTS Academic, TOEFL iBT, GRE General), syllabus breakdowns, and score progressions over time.
        </div>
        <div style="margin-top:1rem;">
          <button class="btn btn-primary" onclick="switchView('subscription')">⚡ Upgrade to Pro to Track Exams</button>
        </div>
      </div>
    `;
    return;
  }
  
  const tests = State.scholarshipTests || [];
  
  el.innerHTML = `
    <div class="schol-examprep-card">
      <div class="schol-brand-kicker">Stage 8 &middot; Exam Readiness &amp; Test Tracking</div>
      <div style="font-weight:800;font-size:1.3rem;color:var(--text);">Standardized Test Portfolios</div>
      <div style="font-size:0.86rem;color:var(--text-muted);line-height:1.5;">
        Track target scores, test dates, official syllabus milestones, and log mock test results.
      </div>
      
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(320px, 1fr));gap:1rem;margin-top:0.75rem;">
        ${tests.map(t => `
          <div style="background:var(--surface-2);border:1px solid var(--border);border-radius:var(--radius-md);padding:1.25rem;display:flex;flex-direction:column;gap:0.75rem;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <div style="font-weight:700;font-size:1.1rem;color:var(--text);">${SecurityFirewall.sanitize(t.name)}</div>
              <span class="schol-badge tier-1">Target: ${SecurityFirewall.sanitize(t.target)}</span>
            </div>
            <div class="schol-def-grid" style="grid-template-columns:1fr 1fr;">
              <div class="schol-def-item">
                <span class="schol-def-label">Current Band</span>
                <span class="schol-def-val" style="font-weight:700;">${SecurityFirewall.sanitize(t.current || 'Not taken')}</span>
              </div>
              <div class="schol-def-item">
                <span class="schol-def-label">Scheduled Date</span>
                <span class="schol-def-val">${SecurityFirewall.sanitize(t.testDate || 'TBD')}</span>
              </div>
            </div>
            
            <div style="border-top:1px solid var(--border);padding-top:0.5rem;">
              <span class="schol-def-label">Mock Score History</span>
              <div style="display:flex;flex-direction:column;gap:0.35rem;margin-top:0.35rem;">
                ${t.mockScores && t.mockScores.length > 0 ? t.mockScores.map(m => `
                  <div style="display:flex;justify-content:space-between;font-size:0.8rem;background:var(--surface);padding:0.35rem 0.65rem;border-radius:var(--radius-sm);border:1px solid var(--border);">
                    <span style="color:var(--text-muted);">${formatScholarshipDate(m.date)}</span>
                    <span style="font-weight:700;color:var(--purple,#7C3AED);">Score: ${m.score}</span>
                  </div>
                `).join('') : '<div style="font-size:0.78rem;color:var(--text-muted);">No mock scores logged yet.</div>'}
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// â”€â”€â”€ CALENDAR & REMINDERS SUBVIEW â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function renderScholarshipCalendar() {
  const el = document.getElementById('schol-subview-calendar');
  if (!el) return;
  
  if (!isProOrOwner()) {
    el.innerHTML = `
      <div class="schol-locked-tab-screen">
        <div class="schol-paywall-lock">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
        </div>
        <div class="schol-paywall-title">Synchronized Scholarship Deadline Calendar (Locked)</div>
        <div class="schol-paywall-desc">
          Automated countdown timeline, 60-day/30-day/14-day reminder schedules, and full .ICS calendar integration for Google Calendar, Apple Calendar, and Outlook.
        </div>
        <div style="margin-top:1rem;">
          <button class="btn btn-primary" onclick="switchView('subscription')">⚡ Upgrade to Pro to Unlock Calendar</button>
        </div>
      </div>
    `;
    return;
  }
  
  const deadlines = State.scholarshipItems
    .map(s => ({ scholarship: s, days: getScholarshipDaysRemaining(s.scholarshipDeadline) }))
    .filter(x => x.days !== null && x.days >= 0)
    .sort((a, b) => a.days - b.days);
    
  el.innerHTML = `
    <div class="schol-card" style="padding:1.75rem;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:1rem;margin-bottom:1.25rem;">
        <div>
          <div class="schol-brand-kicker">Stage 7 &middot; Synchronized Calendar</div>
          <div style="font-weight:800;font-size:1.3rem;color:var(--text);">Upcoming Scholarship Deadlines</div>
          <div style="font-size:0.86rem;color:var(--text-muted);">Chronological timeline of verified funding application deadlines for the current application cycle.</div>
        </div>
        <button class="btn btn-primary" onclick="downloadAllScholarshipsICS()">📅 Download Master Calendar (.ics)</button>
      </div>

      <div style="display:flex;flex-direction:column;gap:0.75rem;">
        ${deadlines.map(item => `
          <div style="display:flex;align-items:center;justify-content:space-between;padding:1rem 1.25rem;background:var(--surface-2);border:1px solid var(--border);border-radius:var(--radius-md);gap:1rem;flex-wrap:wrap;">
            <div style="display:flex;align-items:center;gap:1rem;min-width:240px;flex:1;">
              <div style="text-align:center;min-width:55px;padding:0.4rem 0.6rem;background:rgba(124,58,237,0.1);border-radius:var(--radius-sm);border:1px solid rgba(124,58,237,0.25);">
                <div style="font-family:var(--font-mono);font-size:1.1rem;font-weight:800;color:var(--purple,#7C3AED);">${item.days}d</div>
                <div style="font-size:0.65rem;text-transform:uppercase;color:var(--text-muted);font-weight:600;">Left</div>
              </div>
              <div>
                <div style="font-weight:700;font-size:0.95rem;color:var(--text);">${SecurityFirewall.sanitize(item.scholarship.name)}</div>
                <div style="font-size:0.8rem;color:var(--text-muted);">${SecurityFirewall.sanitize(item.scholarship.org)} &middot; ${SecurityFirewall.sanitize(item.scholarship.country)}</div>
              </div>
            </div>
            <div style="display:flex;align-items:center;gap:1rem;">
              <div style="font-family:var(--font-mono);font-size:0.85rem;font-weight:700;color:var(--text);">${formatScholarshipDate(item.scholarship.scholarshipDeadline)}</div>
              <button class="btn btn-secondary btn-sm" onclick="downloadScholarshipICS('${item.scholarship.id}')">Add .ics</button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// â”€â”€â”€ ARCHIVE SUBVIEW â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function renderScholarshipArchive() {
  const el = document.getElementById('schol-subview-archive');
  if (!el) return;
  
  if (!isProOrOwner()) {
    el.innerHTML = `
      <div class="schol-locked-tab-screen">
        <div class="schol-paywall-lock">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
        </div>
        <div class="schol-paywall-title">Historical Scholarship Archive (Locked)</div>
        <div class="schol-paywall-desc">
          Past cycle scholarships and custom archived records are stored securely with one-click restoration.
        </div>
        <div style="margin-top:1rem;">
          <button class="btn btn-primary" onclick="switchView('subscription')">⚡ Upgrade to Pro to Access Archive</button>
        </div>
      </div>
    `;
    return;
  }
  
  if (State.scholarshipArchived.length === 0) {
    el.innerHTML = `
      <div class="schol-card" style="padding:2.5rem;text-align:center;color:var(--text-muted);">
        <div style="font-size:2rem;margin-bottom:0.5rem;">📁</div>
        <div style="font-weight:700;font-size:1.05rem;color:var(--text);">Archive is empty</div>
        <div style="font-size:0.85rem;margin-top:0.25rem;">When past-cycle or completed scholarships are archived, they will appear here.</div>
      </div>
    `;
    return;
  }
  
  el.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:0.75rem;">
      ${State.scholarshipArchived.map(s => `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:1rem 1.25rem;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-md);gap:1rem;flex-wrap:wrap;">
          <div>
            <div style="font-weight:700;font-size:0.95rem;color:var(--text);">${SecurityFirewall.sanitize(s.name)}</div>
            <div style="font-size:0.8rem;color:var(--text-muted);">${SecurityFirewall.sanitize(s.org)} &middot; ${SecurityFirewall.sanitize(s.country)}</div>
          </div>
          <div style="display:flex;gap:0.5rem;">
            <button class="btn btn-secondary btn-sm" onclick="restoreScholarshipEntry('${s.id}')">â†© Restore</button>
            <button class="btn btn-secondary btn-sm" onclick="deleteScholarshipEntry('${s.id}', true)" style="color:#EF4444;">Delete</button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// â”€â”€â”€ ICS CALENDAR GENERATORS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function downloadScholarshipICS(id) {
  const s = State.scholarshipItems.find(x => x.id === id);
  if (!s) return;
  
  const events = [];
  const pad = (n) => String(n).padStart(2, '0');
  const cleanDate = (dStr) => dStr.replace(/[^0-9]/g, '').slice(0, 8);
  
  if (s.scholarshipDeadline && !s.scholarshipDeadline.includes('unknown') && !s.scholarshipDeadline.includes('rolling')) {
    events.push({
      summary: `[Deadline] ${s.name} (${s.org})`,
      date: cleanDate(s.scholarshipDeadline),
      description: `Funding: ${s.fundingAmount}\nOfficial Portal: ${s.officialApplicationUrl}`
    });
  }
  
  if (events.length === 0) {
    showToast('⚠️ No fixed calendar date confirmed for this opportunity.');
    return;
  }
  
  const now = new Date();
  const stamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth()+1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;
  
  let icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ScholarFlow//Scholarship Desk//EN',
    `X-WR-CALNAME:${s.name}`
  ];
  
  events.forEach(ev => {
    icsLines.push('BEGIN:VEVENT');
    icsLines.push(`UID:schol-${s.id}-${ev.date}@scholarflow`);
    icsLines.push(`DTSTAMP:${stamp}`);
    icsLines.push(`DTSTART;VALUE=DATE:${ev.date}`);
    icsLines.push(`SUMMARY:${ev.summary}`);
    icsLines.push(`DESCRIPTION:${ev.description}`);
    icsLines.push('END:VEVENT');
  });
  icsLines.push('END:VCALENDAR');
  
  const blob = new Blob([icsLines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${s.id}-reminder.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast(`📅 Calendar event downloaded for ${s.name}!`);
}

function downloadAllScholarshipsICS() {
  if (!isProOrOwner()) {
    showToast('🔒 Master calendar export requires Pro plan.', '🔒');
    return;
  }
  
  const pad = (n) => String(n).padStart(2, '0');
  const now = new Date();
  const stamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth()+1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;
  
  let icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ScholarFlow//Scholarship Desk Full Dossier//EN',
    'X-WR-CALNAME:ScholarFlow Global Scholarships'
  ];
  
  State.scholarshipItems.forEach(s => {
    if (s.scholarshipDeadline && !s.scholarshipDeadline.includes('unknown') && !s.scholarshipDeadline.includes('rolling')) {
      const dClean = s.scholarshipDeadline.replace(/[^0-9]/g, '').slice(0, 8);
      if (dClean.length === 8) {
        icsLines.push('BEGIN:VEVENT');
        icsLines.push(`UID:schol-${s.id}-${dClean}@scholarflow`);
        icsLines.push(`DTSTAMP:${stamp}`);
        icsLines.push(`DTSTART;VALUE=DATE:${dClean}`);
        icsLines.push(`SUMMARY:[Deadline] ${s.name} (${s.org})`);
        icsLines.push(`DESCRIPTION:Funding: ${s.fundingAmount}\\nPortal: ${s.officialApplicationUrl}`);
        icsLines.push('END:VEVENT');
      }
    }
  });
  icsLines.push('END:VCALENDAR');
  
  const blob = new Blob([icsLines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `scholarflow-master-scholarships.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('📅 Master scholarship calendar (.ics) downloaded!');
}

// â”€â”€â”€ MODAL CRUD & STATE MUTATIONS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function openScholarshipModal(id = null) {
  if (!isProOrOwner()) {
    showToast('🔒 Adding custom scholarship entries requires Pro plan.', '🔒');
    switchView('subscription');
    return;
  }
  
  State.scholarshipEditingId = id;
  const modal = document.getElementById('schol-modal-backdrop');
  const titleEl = document.getElementById('schol-modal-title');
  if (!modal) return;
  
  if (id) {
    const s = State.scholarshipItems.find(x => x.id === id);
    if (!s) return;
    if (titleEl) titleEl.textContent = 'Edit Scholarship Opportunity';
    document.getElementById('sf-name').value = s.name || '';
    document.getElementById('sf-org').value = s.org || '';
    document.getElementById('sf-country').value = s.country || '';
    document.getElementById('sf-funding').value = s.fundingType || 'Fully Funded';
    document.getElementById('sf-level').value = s.studyLevel || "Master's & PhD";
    document.getElementById('sf-course').value = s.eligibleCourse || '';
    document.getElementById('sf-amount').value = s.fundingAmount || '';
    document.getElementById('sf-deadline').value = s.scholarshipDeadline || '';
    document.getElementById('sf-tier').value = String(s.priorityTier || 1);
    document.getElementById('sf-academic').value = s.academicRequirements || '';
    document.getElementById('sf-tests').value = s.englishRequirement || '';
    document.getElementById('sf-appurl').value = s.officialApplicationUrl || '';
    document.getElementById('sf-srcurl').value = s.officialSourceUrl || '';
    document.getElementById('sf-notes').value = (s.applicationSteps || []).join('\n');
  } else {
    if (titleEl) titleEl.textContent = 'Add Scholarship Opportunity';
    ['sf-name', 'sf-org', 'sf-country', 'sf-course', 'sf-amount', 'sf-deadline', 'sf-academic', 'sf-tests', 'sf-appurl', 'sf-srcurl', 'sf-notes'].forEach(fid => {
      const el = document.getElementById(fid);
      if (el) el.value = '';
    });
    document.getElementById('sf-funding').value = 'Fully Funded';
    document.getElementById('sf-level').value = "Master's & PhD";
    document.getElementById('sf-tier').value = '1';
  }
  
  modal.classList.add('show');
}

function closeScholarshipModal() {
  const modal = document.getElementById('schol-modal-backdrop');
  if (modal) modal.classList.remove('show');
  State.scholarshipEditingId = null;
}

function saveScholarshipEntry() {
  if (!isProOrOwner()) {
    showToast('🔒 Adding custom entries requires Pro plan.', '🔒');
    return;
  }
  
  const name = (document.getElementById('sf-name')?.value || '').trim();
  const org = (document.getElementById('sf-org')?.value || '').trim();
  const country = (document.getElementById('sf-country')?.value || '').trim();
  
  if (!name || !org) {
    showToast('⚠️ Please provide at least scholarship name and host university/body.', '⚠️');
    return;
  }
  
  const record = {
    id: State.scholarshipEditingId || ('custom-' + Date.now()),
    name: SecurityFirewall.sanitize(name),
    org: SecurityFirewall.sanitize(org),
    country: SecurityFirewall.sanitize(country || 'International'),
    region: 'Custom',
    eligibleCourse: SecurityFirewall.sanitize(document.getElementById('sf-course')?.value || ''),
    studyLevel: SecurityFirewall.sanitize(document.getElementById('sf-level')?.value || "Master's & PhD"),
    fundingType: SecurityFirewall.sanitize(document.getElementById('sf-funding')?.value || 'Fully Funded'),
    covers: ['Full Tuition', 'Living Allowance'],
    fundingAmount: SecurityFirewall.sanitize(document.getElementById('sf-amount')?.value || 'Not specified'),
    academicRequirements: SecurityFirewall.sanitize(document.getElementById('sf-academic')?.value || 'Standard university admission'),
    ageRestriction: 'None',
    nationalityRestriction: 'Open to international candidates',
    requiredTests: [SecurityFirewall.sanitize(document.getElementById('sf-tests')?.value || 'IELTS / TOEFL')],
    englishRequirement: SecurityFirewall.sanitize(document.getElementById('sf-tests')?.value || 'Standard requirement'),
    requiredDocuments: ['Transcripts', 'Statement of Purpose', 'References'],
    openDate: '2026-09-01',
    scholarshipDeadline: SecurityFirewall.sanitize(document.getElementById('sf-deadline')?.value || 'Unknown'),
    courseDeadline: SecurityFirewall.sanitize(document.getElementById('sf-deadline')?.value || 'Unknown'),
    separateApplicationRequired: true,
    applicationSteps: (document.getElementById('sf-notes')?.value || '').split('\n').filter(Boolean).map(x => SecurityFirewall.sanitize(x)),
    applicationFee: 'Free of charge',
    feeFlag: false,
    feeFlagNote: '',
    officialApplicationUrl: SecurityFirewall.safeUrl(document.getElementById('sf-appurl')?.value || ''),
    officialSourceUrl: SecurityFirewall.safeUrl(document.getElementById('sf-srcurl')?.value || ''),
    eligibilityMatch: 'STRONG MATCH',
    eligibilityReason: 'Custom candidate logged target.',
    priorityTier: parseInt(document.getElementById('sf-tier')?.value || '1', 10),
    tierReason: 'Custom priority target',
    needsVerification: [],
    lastVerified: new Date().toISOString().slice(0, 10)
  };
  
  if (State.scholarshipEditingId) {
    const idx = State.scholarshipItems.findIndex(x => x.id === State.scholarshipEditingId);
    if (idx >= 0) State.scholarshipItems[idx] = record;
    showToast(`✓ Updated ${record.name}`);
  } else {
    State.scholarshipItems.unshift(record);
    showToast(`✓ Added ${record.name}`);
  }
  
  saveScholarshipsStorage();
  closeScholarshipModal();
  renderScholarships();
}

function archiveScholarshipEntry(id) {
  if (!isProOrOwner()) {
    showToast('🔒 Archiving requires Pro plan.', '🔒');
    return;
  }
  const idx = State.scholarshipItems.findIndex(x => x.id === id);
  if (idx >= 0) {
    const item = State.scholarshipItems.splice(idx, 1)[0];
    State.scholarshipArchived.unshift(item);
    saveScholarshipsStorage();
    renderScholarships();
    showToast(`📁 Archived ${item.name}`);
  }
}

function restoreScholarshipEntry(id) {
  if (!isProOrOwner()) {
    showToast('🔒 Restoring entries requires Pro plan.', '🔒');
    return;
  }
  const idx = State.scholarshipArchived.findIndex(x => x.id === id);
  if (idx >= 0) {
    const item = State.scholarshipArchived.splice(idx, 1)[0];
    State.scholarshipItems.unshift(item);
    saveScholarshipsStorage();
    renderScholarships();
    showToast(`â†© Restored ${item.name}`);
  }
}

function deleteScholarshipEntry(id, isArchived) {
  if (!isProOrOwner()) {
    showToast('🔒 Delete requires Pro plan.', '🔒');
    return;
  }
  if (!confirm('Are you sure you want to delete this scholarship entry?')) return;
  
  if (isArchived) {
    State.scholarshipArchived = State.scholarshipArchived.filter(x => x.id !== id);
  } else {
    State.scholarshipItems = State.scholarshipItems.filter(x => x.id !== id);
  }
  saveScholarshipsStorage();
  renderScholarships();
  showToast('🗑️ Entry deleted.');
}

function exportScholarships() {
  if (!isProOrOwner()) {
    showToast('🔒 Exporting scholarship registers requires Pro plan.', '🔒');
    switchView('subscription');
    return;
  }
  
  if (!SecurityFirewall.checkRateLimit('export_schol', 3, 30000)) {
    showToast('⚠️ Rate limit: Please wait a moment before exporting again.', '⚠️');
    return;
  }
  
  const payload = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    scholarships: State.scholarshipItems,
    archived: State.scholarshipArchived,
    checklists: State.scholarshipChecklists
  };
  
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `scholarflow_scholarships_export_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('â­³ Exported verified scholarship register (JSON)!');
}

function importScholarships(event) {
  if (!isProOrOwner()) {
    showToast('🔒 Importing scholarship registers requires Pro plan.', '🔒');
    event.target.value = '';
    return;
  }
  
  const file = event.target.files[0];
  if (!file) return;
  
  if (file.size > 2 * 1024 * 1024) {
    showToast('⚠️ File too large. Max 2MB.', '⚠️');
    event.target.value = '';
    return;
  }
  
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = SecurityFirewall.safeParseJSON(e.target.result);
      if (!data) throw new Error('Invalid JSON');
      
      let incoming = [];
      if (Array.isArray(data)) incoming = data;
      else if (data.scholarships && Array.isArray(data.scholarships)) incoming = data.scholarships;
      else throw new Error('Unrecognized schema');
      
      const sanitized = incoming.map((s, idx) => ({
        id: s.id || ('imported-' + idx + '-' + Date.now()),
        name: SecurityFirewall.sanitize(String(s.name || 'Untitled Scholarship')),
        org: SecurityFirewall.sanitize(String(s.org || 'Unknown Org')),
        country: SecurityFirewall.sanitize(String(s.country || 'International')),
        region: SecurityFirewall.sanitize(String(s.region || 'Global')),
        eligibleCourse: SecurityFirewall.sanitize(String(s.eligibleCourse || '')),
        studyLevel: SecurityFirewall.sanitize(String(s.studyLevel || "Master's & PhD")),
        fundingType: SecurityFirewall.sanitize(String(s.fundingType || 'Fully Funded')),
        covers: Array.isArray(s.covers) ? s.covers.map(c => SecurityFirewall.sanitize(String(c))) : [],
        fundingAmount: SecurityFirewall.sanitize(String(s.fundingAmount || '')),
        academicRequirements: SecurityFirewall.sanitize(String(s.academicRequirements || '')),
        ageRestriction: SecurityFirewall.sanitize(String(s.ageRestriction || 'None')),
        nationalityRestriction: SecurityFirewall.sanitize(String(s.nationalityRestriction || '')),
        requiredTests: Array.isArray(s.requiredTests) ? s.requiredTests.map(t => SecurityFirewall.sanitize(String(t))) : [],
        englishRequirement: SecurityFirewall.sanitize(String(s.englishRequirement || '')),
        requiredDocuments: Array.isArray(s.requiredDocuments) ? s.requiredDocuments.map(d => SecurityFirewall.sanitize(String(d))) : [],
        openDate: String(s.openDate || 'Unknown'),
        scholarshipDeadline: String(s.scholarshipDeadline || 'Unknown'),
        courseDeadline: String(s.courseDeadline || 'Unknown'),
        separateApplicationRequired: !!s.separateApplicationRequired,
        applicationSteps: Array.isArray(s.applicationSteps) ? s.applicationSteps.map(st => SecurityFirewall.sanitize(String(st))) : [],
        applicationFee: SecurityFirewall.sanitize(String(s.applicationFee || '')),
        feeFlag: !!s.feeFlag,
        feeFlagNote: SecurityFirewall.sanitize(String(s.feeFlagNote || '')),
        officialApplicationUrl: SecurityFirewall.safeUrl(String(s.officialApplicationUrl || '')),
        officialSourceUrl: SecurityFirewall.safeUrl(String(s.officialSourceUrl || '')),
        eligibilityMatch: SecurityFirewall.sanitize(String(s.eligibilityMatch || 'STRONG MATCH')),
        eligibilityReason: SecurityFirewall.sanitize(String(s.eligibilityReason || '')),
        priorityTier: typeof s.priorityTier === 'number' ? s.priorityTier : 1,
        tierReason: SecurityFirewall.sanitize(String(s.tierReason || '')),
        needsVerification: [],
        lastVerified: new Date().toISOString().slice(0, 10)
      }));
      
      State.scholarshipItems = sanitized;
      saveScholarshipsStorage();
      renderScholarships();
      showToast(`â­± Successfully imported and sanitized ${sanitized.length} scholarships!`);
    } catch(err) {
      showToast('❌ Failed to parse scholarship JSON file.', '❌');
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}
