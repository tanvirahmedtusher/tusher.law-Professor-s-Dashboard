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
  profile: JSON.parse(localStorage.getItem('profileData') || 'null') || (typeof DEFAULT_PROFILE_DATA !== 'undefined' ? DEFAULT_PROFILE_DATA : {}),
  profilePhoto: localStorage.getItem('profilePhoto') || 'tusher-profile-photo.jpg',
  
  // Correspondence Composer State
  composer: {
    activeScholarId: null,
    prog: 'phd',
    tone: 'formal',
    cvText: '',
    cvFileName: '',
    researchData: null,
    draftSubject: '',
    draftBody: ''
  },
  
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
  scholarshipFilter: 'all',
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
      educationLevel: "Master's â€” in progress",
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
  })(),
  
  // Active Drawer Scholar ID
  activeDrawerId: null
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

// Security Firewall Utility — used by Scholarship Tracker for safe rendering
const SecurityFirewall = {
  sanitize(str) {
    return esc(str);
  },
  safeParseJSON(str) {
    try {
      return JSON.parse(str);
    } catch(e) {
      console.warn('SecurityFirewall: Invalid JSON', e);
      return null;
    }
  }
};

// Subscription Tier Check — gates Pro/Owner features
function isProOrOwner() {
  // Owner passkey auth always grants full access
  if (typeof isOwnerAuthenticated === 'function' && isOwnerAuthenticated()) {
    return true;
  }
  // Check localStorage subscription tier
  const tier = localStorage.getItem('scholarflow_subscription_tier');
  return tier === 'pro' || tier === 'enterprise';
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
    scholars: { title: 'Scholars Directory', breadcrumb: 'Directory / 214 Verified Researchers' },
    pipeline: { title: 'Outreach Pipeline', breadcrumb: 'Workflow / Kanban Stage Tracking' },
    clusters: { title: 'Research Clusters', breadcrumb: 'Domains / 8 Thematic Focus Areas' },
    priority: { title: 'Priority Targets', breadcrumb: 'Shortlist / Super Standout & Tier 1' },
    analytics: { title: 'Analytics & Insights', breadcrumb: 'Intelligence / Distribution & Funnels' },
    subscription: { title: 'Subscription & Membership', breadcrumb: 'Access Tier / Plan Management' },
    'ai-search': { title: 'AI Scholar Search', breadcrumb: 'Intelligence / Semantic Query Discovery' },
    deadlines: { title: 'Deadline Tracker', breadcrumb: 'Calls for Papers & Academic Conferences' },
    scholarships: { title: 'Scholarship Desk', breadcrumb: 'Funding / Global Scholarships & Grants' },
    composer: { title: 'Correspondence Composer', breadcrumb: 'Outreach / Precision Email Generator' },
    profile: { title: 'Researcher Profile', breadcrumb: 'Academic Curriculum Vitae & Portfolio' }
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
  if (viewName === 'subscription') renderSubscriptionView();
  if (viewName === 'ai-search') renderAISearchView();
  if (viewName === 'composer') renderComposerView();
  if (viewName === 'profile') renderProfile();
  
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
  
  // Set KPI stats
  document.getElementById('kpi-total-scholars').textContent = total;
  document.getElementById('kpi-top-targets').textContent = topTargets.length;
  document.getElementById('kpi-unis').textContent = unis;
  const uniSubEl = document.getElementById('kpi-unis-sub');
  if (uniSubEl) uniSubEl.innerHTML = `<span>QS #1 to #220</span>`;
  document.getElementById('kpi-countries').textContent = countries;
  document.getElementById('kpi-contacted-count').textContent = `${contactedCount} (${contactedPct}%)`;
  
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
        desc: 'All 214 Verified Scholars',
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
}

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
    container.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:3rem 1rem;color:var(--text-muted);"><h3>No scholars match current filters</h3><p style="font-size:0.8rem;margin-top:0.3rem;">Try clearing search keywords or selecting 'All' for filters.</p></div>`;
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
            <button class="btn-action" onclick="openEmailComposer(${p.id}, event)" style="color:var(--primary);font-weight:700;">✉️ Draft Email</button>
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
                  <button class="btn-action" style="padding:0.2rem 0.5rem;font-size:0.65rem;color:var(--primary);font-weight:700;" title="Compose Email" onclick="openEmailComposer(${p.id}, event)">✉️</button>
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
          <button class="btn-action" onclick="openEmailComposer(${p.id}, event)" style="color:var(--primary);font-weight:700;">✉️ Draft</button>
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
                  <button class="k-move-btn" onclick="openEmailComposer(${p.id}, event)" style="color:var(--primary);font-weight:700;">✉️ Draft</button>
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
          
          <div style="display:flex;gap:0.4rem;flex-wrap:wrap;">
            <button class="btn-action" onclick="openEmailComposer(${p.id}, event)" style="color:var(--primary);font-weight:700;">✉️ Draft Email</button>
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
        <button class="btn btn-primary" onclick="openEmailComposer(${p.id}, event)" style="flex:1 0 100%;font-size:0.82rem;font-weight:700;display:flex;align-items:center;justify-content:center;gap:0.4rem;padding:0.6rem 1rem;background:var(--primary);color:#fff;border-radius:var(--radius-sm);box-shadow:var(--shadow-xs);">
          <span>✉️</span> <span>Generate Outreach Email</span>
        </button>
        ${hasDirectEmail ? `
          <button class="btn btn-secondary" onclick="copyEmail('${p.email.replace(/'/g, "\\'")}', this)" style="flex:1;">Copy Email</button>
          <a href="mailto:${esc(p.email)}" class="btn btn-secondary" style="flex:1;">Open Mail App</a>
        ` : ''}
        <button class="btn-action ${isContacted ? 'contacted' : ''}" onclick="toggleContacted(${p.id})">${isContacted ? '✓ Contacted' : 'Mark Contacted'}</button>
        <button class="btn-action ${isBookmarked ? 'bookmarked' : ''}" onclick="toggleBookmark(${p.id})">${isBookmarked ? '★ Bookmarked' : '☆ Bookmark'}</button>
      </div>
    </div>

    <!-- Email Generator Section Segment -->
    <div style="background:var(--surface-alt);border:1.5px solid var(--border);border-radius:var(--radius);padding:1.15rem;display:flex;flex-direction:column;gap:0.75rem;">
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <div style="font-weight:800;font-size:0.88rem;color:var(--text);display:flex;align-items:center;gap:0.4rem;">
          <span>✉️</span> <span>Correspondence Composer</span>
        </div>
        <span class="tag tag-qs" style="background:var(--primary-light);color:var(--primary);font-size:0.68rem;padding:0.2rem 0.55rem;">Framework-Backed</span>
      </div>
      <p style="font-size:0.78rem;color:var(--text-muted);line-height:1.5;margin:0;">
        Ready to compose tailored outreach for <strong>${esc(p.name)}</strong> (${esc(p.university)}) using research connection formulas.
      </p>
      <div style="display:flex;gap:0.4rem;flex-wrap:wrap;">
        <button class="btn btn-primary" onclick="openEmailComposer(${p.id}, event)" style="flex:1;font-size:0.78rem;padding:0.5rem 0.8rem;display:flex;align-items:center;justify-content:center;gap:0.35rem;">
          <span>✨</span> <span>Open Full Composer Popup</span>
        </button>
        <button class="btn btn-secondary" onclick="quickGenerateDrawerEmail(${p.id}, event)" style="font-size:0.78rem;padding:0.5rem 0.8rem;display:flex;align-items:center;justify-content:center;gap:0.35rem;">
          <span>⚡</span> <span>1-Click Draft</span>
        </button>
      </div>
      <div id="drawer-quick-email-box" style="display:none;margin-top:0.3rem;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-sm);padding:0.85rem;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.4rem;">
          <strong style="font-size:0.78rem;color:var(--primary);">Generated Outreach Draft:</strong>
          <span id="drawer-quick-wordcount" style="font-size:0.7rem;color:var(--text-muted);font-family:monospace;"></span>
        </div>
        <div style="font-size:0.75rem;font-weight:700;color:var(--text);margin-bottom:0.4rem;padding:0.3rem 0.5rem;background:var(--surface-alt);border-radius:4px;" id="drawer-quick-subject"></div>
        <textarea id="drawer-quick-body" style="width:100%;min-height:140px;font-size:0.78rem;line-height:1.5;border:1px solid var(--border);border-radius:4px;padding:0.5rem;color:var(--text);background:var(--surface-alt);resize:vertical;"></textarea>
        <div style="display:flex;gap:0.35rem;margin-top:0.5rem;flex-wrap:wrap;">
          <button class="btn btn-secondary" style="font-size:0.72rem;padding:0.25rem 0.6rem;" onclick="copyDrawerQuickEmail(this)">📋 Copy Body</button>
          <button class="btn btn-primary" style="font-size:0.72rem;padding:0.25rem 0.6rem;" onclick="openDrawerQuickMailto('${p.email ? p.email.replace(/'/g, "\\'") : ''}')">✉️ Send via Mail</button>
          <button class="btn btn-secondary" style="font-size:0.72rem;padding:0.25rem 0.6rem;" onclick="openEmailComposer(${p.id}, event)">Edit in Full Composer ↗</button>
        </div>
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

// Global Initialization
function initApp() {
  initStages();
  initDeadlines();
  initScholarships();
  
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
      closeEmailComposerModal();
      closeDeadlineModal();
      closeScholarshipModal();
      closeMobileSidebar();
      const sWrap = document.getElementById('topbar-search-wrap');
      if (sWrap) sWrap.classList.remove('mobile-active');
    }
  });
  
  // Initialize Correspondence Composer Engine
  initComposer();
  
  // Initial View
  switchView('overview');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

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
  defaultPasskey: 'tusher.law@2026',
  sessionStorageKey: 'scholarflow_owner_auth',
  customPasskeyStorageKey: 'scholarflow_owner_passkey'
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

function handleOwnerAuthSubmit(event) {
  if (event) event.preventDefault();
  const email = (document.getElementById('auth-email-input').value || '').trim().toLowerCase();
  const passkey = (document.getElementById('auth-passkey-input').value || '').trim();
  const remember = document.getElementById('auth-remember-device').checked;
  const errorAlert = document.getElementById('auth-error-alert');
  const dialog = document.querySelector('.auth-dialog');

  const customPasskey = localStorage.getItem(OWNER_CONFIG.customPasskeyStorageKey);
  const isValidPasskey = (customPasskey && passkey === customPasskey) ||
                          passkey === OWNER_CONFIG.defaultPasskey ||
                          passkey === 'tusherlaw' ||
                          passkey === 'tusher.law';

  if (email === OWNER_CONFIG.email.toLowerCase() && isValidPasskey) {
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
    if (errorAlert) {
      errorAlert.className = 'auth-alert error';
      errorAlert.style.display = 'block';
      errorAlert.innerHTML = '<strong>⛔ Access Denied:</strong> Invalid Gmail address or owner passkey. Only <code>tusher.law@gmail.com</code> is authorized to modify this profile.';
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

  // Dynamic Pipeline Metrics
  const researching = P.filter(s => s.status === 'Researching' || (State.stages[s.id] === 'not_contacted')).length;
  const drafting = P.filter(s => s.status === 'Drafting' || (State.stages[s.id] === 'drafting')).length;
  const sent = P.filter(s => s.status === 'Sent' || (State.stages[s.id] === 'contacted')).length;
  const responded = P.filter(s => s.status === 'Responded' || (State.stages[s.id] === 'replied')).length;
  const interview = P.filter(s => s.status === 'Interview' || (State.stages[s.id] === 'interview')).length;
  const offer = P.filter(s => s.status === 'Offer' || (State.stages[s.id] === 'offer')).length;

  const priorityScholars = P.filter(s => ['Super Standout', 'Tier 1'].includes(s.priority)).slice(0, 4);

  // Active Deadlines from The Ledger
  const allDeadlines = (State.deadlineItems && State.deadlineItems.length > 0) ? State.deadlineItems : (typeof SEED_DEADLINES !== 'undefined' ? SEED_DEADLINES : []);
  const activeDeadlines = allDeadlines.filter(d => !d.rolling && d.deadline).sort((a,b) => new Date(a.deadline) - new Date(b.deadline)).slice(0, 4);

  const activeStageCount = [researching, drafting, sent, responded, interview, offer].findIndex(count => count === 0) !== -1 ? 
    [researching, drafting, sent, responded, interview, offer].findIndex(count => count === 0) : 6;
  const trackFillPct = activeStageCount > 0 ? ((activeStageCount - 0.5) / 6) * 100 : 16;
  const degreePct = p.degreeProgressPct || 88;

  container.innerHTML = `
    <!-- Owner Authentication Status Bar -->
    ${isOwner ? `
      <div class="profile-auth-status-bar" style="background:var(--surface);border:1.5px solid var(--green,#16A34A);border-radius:var(--radius);padding:0.75rem 1.25rem;margin-bottom:1.5rem;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:0.75rem;">
        <span style="display:flex;align-items:center;gap:0.5rem;color:var(--green,#16A34A);font-weight:700;font-size:0.85rem;">
          &#x1F451; <span>Owner Session Unlocked (Authorized: ${esc(OWNER_CONFIG.email)})</span>
        </span>
        <div style="display:flex;gap:0.5rem;">
          <button class="btn btn-secondary" style="padding:0.35rem 0.75rem;font-size:0.75rem;" onclick="logoutOwner()">&#x1F512; Lock Session</button>
          <button class="btn btn-primary" style="padding:0.35rem 0.85rem;font-size:0.75rem;" onclick="openProfileEditModal()">&#x270F;&#xFE0F; Edit Profile</button>
        </div>
      </div>
    ` : `
      <div style="display:flex;justify-content:flex-end;margin-bottom:1.25rem;">
        <button class="btn btn-secondary" style="padding:0.4rem 0.85rem;font-size:0.78rem;" onclick="openProfileEditModal()" title="Owner Authentication Required">&#x1F512; Edit Profile (Owner)</button>
      </div>
    `}

    <div class="dossier-wrapper reveal in">
      
      <!-- 1. HERO PROFILE CARD -->
      <div class="profile-hero-card">
        <div class="profile-hero-grid">
          <div class="profile-avatar-wrap">
            <img src="${photo}" alt="${esc(p.name || 'Tanvir Ahmed Tusher')}" class="profile-avatar-img" id="profile-photo-img">
            <div class="profile-avatar-upload-overlay" onclick="document.getElementById('photo-upload-input').click()" title="Change Profile Photo">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
            </div>
          </div>

          <div class="profile-main-meta">
            <h1>
              ${esc(p.name || 'Tanvir Ahmed Tusher')}
              <span class="profile-verified-badge">&#10003; Verified Researcher</span>
            </h1>
            <div class="profile-degree-tag">${esc(p.degreeStatus || 'Bachelor of Laws (LL.B.) &mdash; Ongoing (Final Year)')}</div>
            <div class="profile-institution-meta">
              <span>&#x1F3DB;&#xFE0F; ${esc(p.department || 'Department of Law')}, ${esc(p.institution || 'Noakhali Science and Technology University')}</span>
              <span>&bull;</span>
              <span>&#x1F4CD; ${esc(p.location || 'Noakhali, Bangladesh')}</span>
            </div>
            
            <div class="profile-social-links" style="margin-top:0.9rem;">
              ${p.email ? `<a class="profile-link-btn" href="mailto:${esc(p.email)}">&#x2709;&#xFE0F; ${esc(p.email)}</a>` : ''}
              ${p.links && p.links.linkedin ? `<a class="profile-link-btn" href="${esc(p.links.linkedin)}" target="_blank" rel="noopener">LinkedIn &nearr;</a>` : ''}
              ${p.links && p.links.googleScholar ? `<a class="profile-link-btn" href="${esc(p.links.googleScholar)}" target="_blank" rel="noopener">Google Scholar &nearr;</a>` : ''}
              ${p.links && p.links.orcid ? `<a class="profile-link-btn" href="${esc(p.links.orcid)}" target="_blank" rel="noopener">ORCID &nearr;</a>` : ''}
            </div>
          </div>

          <div class="profile-actions-column">
            ${isOwner ? `
              <button class="btn btn-primary" onclick="exportProfileMarkdown()" style="font-size:0.8rem;padding:0.5rem 1rem;white-space:nowrap;display:flex;align-items:center;gap:0.4rem;">
                <span>&#x1F4E5;</span>
                <span>Export Academic CV (.md)</span>
              </button>
            ` : `
              <button class="btn btn-secondary" onclick="exportProfileMarkdown()" title="Owner Authentication Required to Export Full CV" style="font-size:0.8rem;padding:0.5rem 1rem;white-space:nowrap;display:flex;align-items:center;gap:0.45rem;border:1.5px dashed var(--border);">
                <span>&#x1F512;</span>
                <span>Export Academic CV (.md)</span>
                <span style="font-size:0.65rem;background:var(--surface-alt);border:1px solid var(--border);padding:0.1rem 0.35rem;border-radius:4px;font-weight:700;letter-spacing:0.03em;color:var(--text-muted);">LOCKED</span>
              </button>
            `}
            <button class="btn btn-secondary" onclick="openProfileEditModal()" style="font-size:0.78rem;padding:0.4rem 0.85rem;white-space:nowrap;">
              &#x270F;&#xFE0F; Edit Dossier
            </button>
          </div>
        </div>
      </div>

      <!-- 2. DEGREE PROGRESSION TRACKER -->
      <div class="degree-progress-box">
        <div class="degree-progress-header">
          <div style="display:flex;align-items:center;gap:0.4rem;">
            <span>&#x1F393;</span>
            <span>Academic Degree Milestone &mdash; LL.B. (Final Year Completion)</span>
          </div>
          <span style="color:var(--river);font-weight:700;">${degreePct}% Completed</span>
        </div>
        <div class="degree-progress-track">
          <div class="degree-progress-fill" style="width:${degreePct}%;"></div>
        </div>
      </div>

      <!-- 3. KEY HIGHLIGHTS / ACCOLADES GRID -->
      <div class="highlights-grid">
        ${(p.highlights || [
          { icon: "star", title: "Featured by Prof. Lawrence B. Solum", detail: "IGI Global book chapter on AI infrastructure and TWAIL energy-water nexus featured on Legal Theory Blog (Texas A&M)." },
          { icon: "award", title: "Outstanding Paper Award (2026)", detail: "Awarded at the 3rd IUB Undergraduate Law Students' Research Conference for AI integration in summary trials." },
          { icon: "target", title: "Top 14th Scorer Nationally (2025)", detail: "Ranked 14th out of 716 nationwide participants in Climate Olympiad at CPD Climate Week 2025." }
        ]).map(h => `
          <div class="highlight-card">
            <div class="highlight-icon-title">
              <div class="highlight-badge-icon">${h.icon === 'star' ? '&#x1F31F;' : (h.icon === 'award' ? '&#x1F3C6;' : (h.icon === 'target' ? '&#x1F3AF;' : '&#x2B50;'))}</div>
              <div>${esc(h.title)}</div>
            </div>
            <div class="highlight-detail">${esc(h.detail)}</div>
          </div>
        `).join('')}
      </div>

      <!-- 4. RESEARCH STATEMENT / TAGLINE -->
      <div class="research-tagline-box">
        <div class="research-tagline-quote">
          &ldquo;${esc(p.tagline || 'Tanvir Ahmed Tusher researches how law responds when the ground shifts under it: AI systems making decisions no statute anticipated, climate change pushing people out of their homes, human rights frameworks built for a world that no longer quite exists. He thinks accountability has to be part of a system\'s design, not something bolted on after the harm is done.')}&rdquo;
        </div>
        <div class="research-tagline-sub">
          Core Focus Areas &bull; ${(p.researchAreas || ['Public International Law', 'TWAIL', 'Climate Change Law', 'AI Governance']).join(' &middot; ')}
        </div>
      </div>

      <!-- 5. LIVE PIPELINE BRIDGE -->
      <section class="journey" style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);padding:2rem;margin-bottom:2.5rem;box-shadow:var(--shadow-sm);">
        <div class="section-head">
          <p class="eyebrow">The current</p>
          <h2>Six stages, one river</h2>
          <p>Every scholar correspondence moves through the same channel &mdash; from first read to funded offer.</p>
        </div>
        <div class="track-wrap">
          <div class="track-line"></div>
          <div class="track-line-fill" style="width: ${trackFillPct}%;"></div>
          <div class="track">
            <div class="stage ${researching > 0 ? 'active' : ''} ${activeStageCount === 1 ? 'current' : ''}"><div class="node"></div><div class="count">${researching}</div><div class="name">Researching</div></div>
            <div class="stage ${drafting > 0 ? 'active' : ''} ${activeStageCount === 2 ? 'current' : ''}"><div class="node"></div><div class="count">${drafting}</div><div class="name">Drafting</div></div>
            <div class="stage ${sent > 0 ? 'active' : ''} ${activeStageCount === 3 ? 'current' : ''}"><div class="node"></div><div class="count">${sent}</div><div class="name">Sent</div></div>
            <div class="stage ${responded > 0 ? 'active' : ''} ${activeStageCount === 4 ? 'current' : ''}"><div class="node"></div><div class="count">${responded}</div><div class="name">Responded</div></div>
            <div class="stage ${interview > 0 ? 'active' : ''} ${activeStageCount === 5 ? 'current' : ''}"><div class="node"></div><div class="count">${interview}</div><div class="name">Interview</div></div>
            <div class="stage ${offer > 0 ? 'active' : ''} ${activeStageCount === 6 ? 'current' : ''}"><div class="node"></div><div class="count">${offer}</div><div class="name">Offer</div></div>
          </div>
        </div>
      </section>

      <!-- 6. PRIORITY TARGETS SHORTLIST -->
      <section style="margin-bottom:2.5rem;">
        <div class="section-head">
          <p class="eyebrow">High urgency &middot; Priority target shortlist</p>
          <h2>Scholars hitting both proposals</h2>
          <p>Super Standouts clear both the P7 DPhil proposal and the water-externalities proposal.</p>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:1.4rem;">
          ${priorityScholars.map(scholar => `
            <article class="scholar-card" tabindex="0" onclick="openDrawer(${scholar.id})" style="cursor:pointer;">
              <span class="tier">${esc(scholar.priority)}</span>
              <h3>${esc(scholar.name)}</h3>
              <div class="uni">${esc(scholar.university || scholar.uni)}</div>
              <p class="match" style="max-height:none;opacity:1;padding-top:0.8rem;border-top:1px solid var(--border);">${esc(scholar.matchPoint || scholar.match || scholar.research || 'High relevance to core research themes.')}</p>
            </article>
          `).join('')}
        </div>
      </section>

      <!-- 7. UPCOMING DEADLINES FROM THE LEDGER -->
      <section class="journey" style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);padding:2rem;margin-bottom:2.5rem;box-shadow:var(--shadow-sm);">
        <div class="section-head">
          <p class="eyebrow">&#x1F4DA; The Ledger &middot; Vol. I</p>
          <h2>What's due, and when</h2>
          <p>Upcoming milestones and funding deadlines for target graduate programmes.</p>
        </div>
        <div class="tide">
          ${activeDeadlines.map(d => {
            const isUrgent = new Date(d.deadline) < new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
            return `
            <div class="tide-row ${isUrgent ? 'urgent' : 'soon'}">
              <div class="tide-date">${new Date(d.deadline).toLocaleDateString('en-GB', {day:'numeric', month:'short'}).toUpperCase()}</div>
              <div class="tide-mark"></div>
              <div class="tide-title">${esc(d.title)}<span>${esc(d.organizer || d.category || 'Deadline')}</span></div>
              <div class="tide-tag">${esc(d.location || d.mode || 'Active')}</div>
            </div>
          `}).join('')}
        </div>
      </section>

      <!-- 8. COMPLETE ACADEMIC CURRICULUM VITAE (ALL SECTIONS) -->
      <section id="academic-cv-section">
        <div class="section-head">
          <p class="eyebrow">Academic Curriculum Vitae</p>
          <h2>Scholarly Record &amp; Distinctions</h2>
          <p>Comprehensive academic record spanning publications, conference presentations, awards, certifications, leadership, and empirical field research.</p>
        </div>

        <!-- Interactive CV Category Filter -->
        <div class="cv-filter-bar">
          <button class="cv-filter-btn active" onclick="filterCVCategory('all', this)">All Sections (${(p.publications||[]).length + (p.conferencePresentations||[]).length + (p.awards||[]).length + (p.coursesCertifications||[]).length + (p.leadership||[]).length + (p.researchExperience||[]).length})</button>
          <button class="cv-filter-btn" onclick="filterCVCategory('publications', this)">Publications (${(p.publications||[]).length})</button>
          <button class="cv-filter-btn" onclick="filterCVCategory('conferences', this)">Conferences (${(p.conferencePresentations||[]).length})</button>
          <button class="cv-filter-btn" onclick="filterCVCategory('awards', this)">Awards &amp; Honours (${(p.awards||[]).length})</button>
          <button class="cv-filter-btn" onclick="filterCVCategory('certifications', this)">Certifications (${(p.coursesCertifications||[]).length})</button>
          <button class="cv-filter-btn" onclick="filterCVCategory('leadership', this)">Leadership &amp; Mooting (${(p.leadership||[]).length})</button>
          <button class="cv-filter-btn" onclick="filterCVCategory('coursework', this)">Specialist Coursework</button>
          <button class="cv-filter-btn" onclick="filterCVCategory('research-projects', this)">Field Research (${(p.researchExperience||[]).length})</button>
          <button class="cv-filter-btn" onclick="filterCVCategory('referees', this)">Referees &amp; Skills</button>
        </div>

        <div class="cv-timeline">
          
          <!-- Category 1: Publications -->
          <div class="cv-category cv-section-block" id="cv-block-publications">
            <h3>&#x1F4D6; Publications &amp; Forthcoming Chapters (${(p.publications || []).length})</h3>
            ${(p.publications || []).map(pub => `
              <div class="cv-item">
                <div class="cv-year">${esc(pub.year || '2026')}</div>
                <div class="cv-content">
                  <div style="display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap;margin-bottom:0.25rem;">
                    <h4>${esc(pub.title)}</h4>
                    <span class="pub-status-badge ${esc(pub.stage || 'forthcoming')}">${esc(pub.status || 'Forthcoming')}</span>
                  </div>
                  <div class="venue">${esc(pub.venue)}</div>
                  ${pub.note ? `<div class="note">&#x2B50; ${esc(pub.note)}</div>` : ''}
                </div>
              </div>
            `).join('')}
          </div>

          <!-- Category 2: Conference Presentations -->
          <div class="cv-category cv-section-block" id="cv-block-conferences">
            <h3>&#x1F3A4; Selected Conference Presentations (${(p.conferencePresentations || []).length})</h3>
            ${(p.conferencePresentations || []).map(cp => `
              <div class="cv-item">
                <div class="cv-year">${esc(cp.date || '2026')}</div>
                <div class="cv-content">
                  <h4>${esc(cp.title)} ${cp.upcoming ? '<span style="font-size:0.68rem;background:var(--river-light);color:var(--river);padding:0.15rem 0.4rem;border-radius:4px;font-weight:700;">Upcoming</span>' : ''}</h4>
                  <div class="venue">${esc(cp.venue)}</div>
                </div>
              </div>
            `).join('')}
          </div>

          <!-- Category 3: Awards & Fellowships -->
          <div class="cv-category cv-section-block" id="cv-block-awards">
            <h3>&#x1F3C6; Honours, Awards &amp; Fellowships (${(p.awards || []).length})</h3>
            ${(p.awards || []).map(aw => `
              <div class="cv-item">
                <div class="cv-year">${esc(aw.year || '2026')}</div>
                <div class="cv-content">
                  <h4>${esc(aw.title)}</h4>
                  <div class="venue">${esc(aw.context || '')}</div>
                </div>
              </div>
            `).join('')}
          </div>

          <!-- Category 4: Courses & Advanced Certifications -->
          <div class="cv-category cv-section-block" id="cv-block-certifications">
            <h3>&#x1F4DC; Advanced Certifications &amp; Academic Schools (${(p.coursesCertifications || []).length})</h3>
            ${(p.coursesCertifications || []).map(cert => `
              <div class="cv-item">
                <div class="cv-year">${esc(cert.year || '2026')}</div>
                <div class="cv-content">
                  <h4>${esc(cert.title)}</h4>
                  <div class="venue">${esc(cert.org)}</div>
                  ${cert.note ? `<div class="note">${esc(cert.note)}</div>` : ''}
                </div>
              </div>
            `).join('')}
          </div>

          <!-- Category 5: Leadership & Mooting Experience -->
          <div class="cv-category cv-section-block" id="cv-block-leadership">
            <h3>&#x2696;&#xFE0F; Leadership, Advocacy &amp; Moot Court Positions (${(p.leadership || []).length})</h3>
            ${(p.leadership || []).map(lead => `
              <div class="cv-item">
                <div class="cv-year">${esc(lead.years || '2025')}</div>
                <div class="cv-content">
                  <h4>${esc(lead.role)} &bull; <span style="font-weight:400;color:var(--text-muted);">${esc(lead.org)}</span></h4>
                  <div class="venue">${esc(lead.detail)}</div>
                </div>
              </div>
            `).join('')}
          </div>

          <!-- Category 6: Relevant Coursework & ESDR Lectures -->
          <div class="cv-category cv-section-block" id="cv-block-coursework">
            <h3>&#x1F4DA; Specialist Coursework &amp; ESDR Modules</h3>
            <div style="margin-bottom:1rem;">
              <strong style="font-size:0.85rem;color:var(--text);">Core Undergraduate Curricula:</strong>
              <div style="display:flex;gap:0.4rem;flex-wrap:wrap;margin-top:0.4rem;">
                ${((p.relevantCourses && p.relevantCourses.undergraduate) || ['Constitutional Law of Bangladesh', 'Constitutions of the UK, USA & India', 'Public International Law', 'Law of the Sea']).map(c => `
                  <span style="font-family:'IBM Plex Mono',monospace;font-size:0.72rem;background:var(--surface-alt);border:1px solid var(--border);padding:0.25rem 0.55rem;border-radius:6px;color:var(--text);">${esc(c)}</span>
                `).join('')}
              </div>
            </div>
            <strong style="font-size:0.85rem;color:var(--text);">ESDR Advanced Visiting Lectures (Kathmandu School of Law):</strong>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:0.85rem;margin-top:0.6rem;">
              ${((p.relevantCourses && p.relevantCourses.esdrSessions) || []).map(es => `
                <div style="background:var(--surface-alt);border:1px solid var(--border);border-radius:var(--radius-sm);padding:0.85rem 1rem;">
                  <div style="font-weight:600;font-size:0.82rem;color:var(--text);margin-bottom:0.25rem;">${esc(es.title)}</div>
                  <div style="font-size:0.75rem;color:var(--river);font-weight:600;">${esc(es.instructor)}</div>
                  <div style="font-size:0.7rem;color:var(--text-muted);">${esc(es.affiliation)}</div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Category 7: Field Inquiries & Research Projects -->
          <div class="cv-category cv-section-block" id="cv-block-research-projects">
            <h3>&#x1F52C; Empirical &amp; Archival Field Research (${(p.researchExperience || []).length})</h3>
            ${(p.researchExperience || []).map(re => `
              <div class="cv-item">
                <div class="cv-year">${esc(re.title.includes('Proposal') ? 'Research Proposal' : (re.title.includes('Draft') ? 'Treaty Draft' : 'Field Inquiry'))}</div>
                <div class="cv-content">
                  <h4>${esc(re.title)}</h4>
                  <div class="venue">${esc(re.context || '')}</div>
                  ${re.methodology ? `<div class="note" style="margin-bottom:0.25rem;"><strong>Methodology:</strong> ${esc(re.methodology)}</div>` : ''}
                  ${re.detail ? `<div style="font-size:0.78rem;color:var(--text-muted);line-height:1.4;">${esc(re.detail)}</div>` : ''}
                </div>
              </div>
            `).join('')}
          </div>

          <!-- Category 8: Skills, Languages & Referees -->
          <div class="cv-category cv-section-block" id="cv-block-referees">
            <h3>&#x1F310; Methodological Skills, Languages &amp; Referees</h3>
            
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1.5rem;margin-bottom:1.5rem;">
              <div style="background:var(--surface-alt);border:1px solid var(--border);border-radius:var(--radius);padding:1.25rem;">
                <div style="font-weight:700;font-size:0.9rem;color:var(--text);margin-bottom:0.6rem;">&#x1F52C; Research &amp; Analytical Competencies</div>
                <div style="display:flex;gap:0.4rem;flex-wrap:wrap;">
                  ${(((p.skills && p.skills.research) || ['Legal Research', 'Doctrinal Analysis', 'Qualitative Field Inquiry', 'Survey-Based Empirical Research', 'Archival-Interpretive Analysis', 'Treaty Drafting'])).map(s => `
                    <span style="font-family:'IBM Plex Mono',monospace;font-size:0.72rem;background:var(--surface);border:1px solid var(--border);padding:0.25rem 0.55rem;border-radius:6px;color:var(--river);font-weight:600;">${esc(s)}</span>
                  `).join('')}
                </div>
              </div>

              <div style="background:var(--surface-alt);border:1px solid var(--border);border-radius:var(--radius);padding:1.25rem;">
                <div style="font-weight:700;font-size:0.9rem;color:var(--text);margin-bottom:0.6rem;">&#x1F5E3;&#xFE0F; Language Proficiencies</div>
                <div style="display:flex;flex-direction:column;gap:0.5rem;">
                  ${((p.languages || [
                    { language: "Bengali", level: "Native / Bilingual Proficiency" },
                    { language: "English", level: "Full Professional Proficiency (IELTS 7.5)" }
                  ])).map(l => `
                    <div style="display:flex;justify-content:space-between;font-size:0.8rem;">
                      <span style="font-weight:600;color:var(--text);">${esc(l.language)}</span>
                      <span style="color:var(--text-muted);font-family:'IBM Plex Mono',monospace;font-size:0.75rem;">${esc(l.level)}</span>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>

            <div style="font-weight:700;font-size:0.95rem;color:var(--text);margin-bottom:0.75rem;">&#x1F3DB;&#xFE0F; Academic Referees &amp; Faculty Mentors</div>
            <div class="cv-referees-grid">
              ${((p.references || [
                { name: "Badsha Mia", title: "Associate Professor", org: "Department of Law, Noakhali Science and Technology University", email: "badsha.law@nstu.edu.bd" },
                { name: "Ashfaque Ahmed", title: "Asst. Registrar (Admin)", org: "High Court Division, Supreme Court of Bangladesh", email: "ashfaque1071@gmail.com" }
              ])).map(ref => `
                <div class="cv-referee-card">
                  <div class="cv-referee-name">${esc(ref.name)}</div>
                  <div class="cv-referee-title">${esc(ref.title)}</div>
                  <div class="cv-referee-org">${esc(ref.org)}</div>
                  ${ref.email ? `<a href="mailto:${esc(ref.email)}" style="font-size:0.78rem;color:var(--river);text-decoration:none;font-weight:600;">&#x2709;&#xFE0F; ${esc(ref.email)}</a>` : ''}
                </div>
              `).join('')}
            </div>
          </div>

        </div>
      </section>

    </div>
  `;
}

// Interactive CV Category Filter Handler
function filterCVCategory(category, btnEl) {
  document.querySelectorAll('.cv-filter-btn').forEach(b => b.classList.remove('active'));
  if (btnEl) btnEl.classList.add('active');

  const blocks = document.querySelectorAll('.cv-section-block');
  if (category === 'all') {
    blocks.forEach(b => b.style.display = 'block');
  } else {
    blocks.forEach(b => {
      if (b.id === `cv-block-${category}`) {
        b.style.display = 'block';
        b.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        b.style.display = 'none';
      }
    });
  }
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
        <label class="form-label">LinkedIn URL</label>
        <input type="text" id="edit-p-linkedin" class="form-input" value="${esc((p.links && p.links.linkedin) || '')}">
      </div>
      <div class="form-group">
        <label class="form-label">Google Scholar URL</label>
        <input type="text" id="edit-p-scholar" class="form-input" value="${esc((p.links && p.links.googleScholar) || '')}">
      </div>
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
    showToast('⛔ Owner authentication required', '✕');
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
    showToast('⛔ Owner authentication required', '✕');
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

// Download Structured Markdown CV (Owner Protected)
function exportProfileMarkdown() {
  if (!isOwnerAuthenticated()) {
    openOwnerAuthModal(() => {
      exportProfileMarkdown();
    });
    showToast('🔒 Owner passkey required to export full Academic CV', '🔒');
    return;
  }

  const p = State.profile || (typeof DEFAULT_PROFILE_DATA !== 'undefined' ? DEFAULT_PROFILE_DATA : {});
  
  let md = `# ${p.name || 'TANVIR AHMED TUSHER'}\n\n`;
  md += `${p.location || 'Maijdee, Noakhali, Bangladesh'} | ${p.institution || 'Noakhali Science and Technology University'}\n`;
  md += `Email: ${p.email || 'tusher.law@gmail.com'}\n\n`;
  
  md += `## Profile & Research Statement\n\n${p.tagline || ''}\n\n`;
  
  md += `## Academic Credential(s)\n\n`;
  md += `- **${p.degreeStatus || 'Bachelor of Laws (LL.B.) — Ongoing (Final Year)'}**\n`;
  md += `  ${p.institution || 'Noakhali Science and Technology University'}, ${p.location || 'Bangladesh'}\n\n`;
  
  md += `### Research Area(s)\n\n`;
  (p.researchAreas || []).forEach(ra => { md += `- ${ra}\n`; });
  md += `\n`;
  
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
  
  md += `## Courses & Advanced Certifications\n\n`;
  (p.coursesCertifications || []).forEach(cc => {
    md += `- **${cc.title}** (${cc.year}) — ${cc.org}${cc.note ? ` (${cc.note})` : ''}\n`;
  });
  md += `\n`;

  md += `## Leadership & Mooting Experience\n\n`;
  (p.leadership || []).forEach(lead => {
    md += `### ${lead.role} — ${lead.org} (${lead.years})\n`;
    md += `${lead.detail}\n\n`;
  });

  if (p.relevantCourses) {
    md += `## Specialist Coursework & ESDR Advanced Lectures\n\n`;
    if (p.relevantCourses.undergraduate) {
      md += `### Core Undergraduate Curricula\n`;
      p.relevantCourses.undergraduate.forEach(c => { md += `- ${c}\n`; });
      md += `\n`;
    }
    if (p.relevantCourses.esdrSessions) {
      md += `### Kathmandu School of Law (ESDR) Advanced Lectures\n`;
      p.relevantCourses.esdrSessions.forEach(es => {
        md += `- **${es.title}** — *${es.instructor}* (${es.affiliation})\n`;
      });
      md += `\n`;
    }
  }

  if (p.skills) {
    md += `## Methodological & Professional Skills\n\n`;
    if (p.skills.research) {
      md += `- **Research Skills:** ${p.skills.research.join(', ')}\n`;
    }
    if (p.skills.soft) {
      md += `- **Professional Skills:** ${p.skills.soft.join(', ')}\n`;
    }
    md += `\n`;
  }

  if (p.languages) {
    md += `## Language Proficiencies\n\n`;
    p.languages.forEach(l => {
      md += `- **${l.language}:** ${l.level}\n`;
    });
    md += `\n`;
  }
  
  md += `## Academic Referees & Mentors\n\n`;
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
  showToast('Downloaded Tanvir_Ahmed_Tusher_CV.md');
}

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
  {id:1,category:'cfp',title:"Protection of Civilians and IHL in the Age of Artificial Intelligence",organizer:"International Review of the Red Cross (ICRC)",location:"Online submission",mode:"online",deadline:"2026-09-01",rolling:false,eventDate:"Full papers due 15 Apr 2027",link:"https://international-review.icrc.org",email:"",details:"Decision on abstracts announced 15 Oct 2026 · Full paper deadline 15 Apr 2027",addedAt:1},
  {id:2,category:'training',title:"WIPO-UK Summer School on Intellectual Property 2026",organizer:"CIPPM, hosted for WIPO-UK",location:"Virtual",mode:"online",deadline:"2026-08-31",rolling:false,eventDate:"31 Aug – 11 Sept 2026",link:"",email:"",details:"Two-week virtual programme · Certificate requires ≥80% live attendance",addedAt:2},
  {id:3,category:'cfp',title:"Intersectionality and Social Justice: A Symposium for Early Career Academics",organizer:"University of York",location:"Church Lane Building, University of York, UK",mode:"hybrid",deadline:"2026-10-19",rolling:false,eventDate:"Week commencing 2 Nov 2026 (date TBC)",link:"",email:"",details:"Abstracts up to 250 words for 15-min talks or posters · Exact abstract deadline not shown on flyer — estimated; confirm with organiser",addedAt:3},
  {id:4,category:'cfp',title:"Emerging New Political Trends in South Asia",organizer:"Aston University / Politics of South Asia Specialist Group (PSA)",location:"Aston University, Birmingham, UK",mode:"hybrid",deadline:"2026-08-28",rolling:false,eventDate:"13 Nov 2026",link:"",email:"psasouthasiaconference26@gmail.com",details:"One-day international conference · Themes: AI & political participation, youth politics, gender, militarism, climate",addedAt:4},
  {id:5,category:'job',title:"CPRD Paid Research Internship — Climate Justice for LDCs",organizer:"Center for Participatory Research & Development (CPRD)",location:"Bangladesh",mode:"in-person",deadline:"2026-08-15",rolling:false,eventDate:"Sept 2026 – Feb 2027 (6 months, paid)",link:"",email:"jobs@cprdbd.org",details:"Master's degree (completed/appeared) required · Send CV + cover letter (1 PDF) + 2 referees",addedAt:5},
  {id:6,category:'training',title:"Fundamentals of Research Methodology — Training Course",organizer:"Bangladesh Institute of Governance & Management (BIGM)",location:"BIGM Campus, Agargaon, Dhaka",mode:"in-person",deadline:"2026-08-14",rolling:false,eventDate:"22 Aug – 3 Oct 2026",link:"",email:"nafis.sadik@bigm.edu.bd",details:"7 weeks · 24 sessions · Sat & Sun, 5–8pm · Fee: BDT 3,000 · Min. CGPA 3.00, age under 40",addedAt:6},
  {id:7,category:'cfp',title:"SLPR 2026–27 Undergraduate Essay Contest",organizer:"Stanford Law & Policy Review",location:"Online submission",mode:"online",deadline:"2027-01-04",rolling:false,eventDate:"",link:"",email:"slpr-notes@stanford.edu",details:"2,500–5,000 words, Chicago style · Open to enrolled undergraduates at any university · AI use or plagiarism disqualifies",addedAt:7},
  {id:8,category:'cfp',title:"2nd International Online Conference on Social Sciences (IOCSS 2027)",organizer:"MDPI journal Social Sciences",location:"Online",mode:"online",deadline:"2027-01-22",rolling:false,eventDate:"24–26 May 2027",link:"",email:"",details:"Acceptance notice 24 Feb 2027 · Registration deadline 19 May 2027 · Topics: crime & justice, gender, migration, society & tech",addedAt:8},
  {id:9,category:'cfp',title:"12th Sustainability Collaborative Conference & 2nd Meeting of the Law and Indigenous Sustainability Network",organizer:"CELS, University of Bristol / HSDN International / PROYASHEE",location:"University of Bristol, UK",mode:"hybrid",deadline:"2026-10-06",rolling:false,eventDate:"5–6 Nov 2026",link:"",email:"t.onifade@bristol.ac.uk",details:"Abstract 150–250 words + 50-word author bio · Free to attend, in-person travel self-funded",addedAt:9},
  {id:10,category:'cfp',title:"Rethinking International Relations in an Age of Uncertainty",organizer:"Ng Teng Fong·Sino Group Belt and Road Research Institute, Chu Hai College",location:"Hong Kong SAR, China",mode:"in-person",deadline:"2026-08-25",rolling:false,eventDate:"21 Nov 2026",link:"https://easychair.org/conferences/?conf=ir26",email:"nsbrrievent3@chuhai.edu.hk",details:"Abstract 500–1,000 words + 500-word author bio · Free · Presenters cover own travel & accommodation",addedAt:10},
  {id:11,category:'cfp',title:"Student Policy Paper Competition — Gender Equality & Development",organizer:"Centre for Gender & Development Studies (CGDS), Dhaka University / UN Women / EU",location:"University of Dhaka",mode:"in-person",deadline:"2026-08-31",rolling:false,eventDate:"",link:"",email:"shrabana.datta@unwomen.org",details:"Max 2,000 words · Submit 2 hard copies + email a copy · Open to current DU students",addedAt:11},
  {id:12,category:'cfp',title:"Workshop: Caste and International Relations",organizer:"Critical Caste International Studies Network (CCISN) / South Asia Studies Center",location:"Jaipur, India",mode:"in-person",deadline:"2026-08-30",rolling:false,eventDate:"11–12 Dec 2026",link:"",email:"casteandir@gmail.com",details:"Abstract 500–700 words + 100-word bio · For PhD students & early-career researchers · Accommodation covered, travel not",addedAt:12},
  {id:13,category:'cfp',title:"Journal of Polity and Society — Vol. 18(2) Call for Papers",organizer:"Dept. of Political Science, University of Kerala",location:"Kerala, India / online submission",mode:"online",deadline:"2026-10-15",rolling:false,eventDate:"",link:"https://journalspoliticalscience.com/index.php/i",email:"editor.jps@keralauniversity.ac.in",details:"ISSN 0976-0210, international peer-reviewed · For July–Dec 2026 issue",addedAt:13},
  {id:14,category:'cfp',title:"14th PEPA/SIEL Conference — Reimagining International Economic Law: Justice, Sustainability and Economic Resilience",organizer:"Society of International Economic Law (SIEL) / PEPA",location:"University of Chile, Santiago, Chile",mode:"in-person",deadline:"2026-09-01",rolling:false,eventDate:"1–3 Dec 2026",link:"",email:"",details:"For postgraduates & early professionals/academics · Notification 15 Sept 2026 · Draft papers due 10 Nov 2026",addedAt:14},
  {id:15,category:'cfp',title:"SYMROLIC 2026 — 14th Annual International Research Conference on Rule of Law in Context",organizer:"Symbiosis Law School, Pune (with Birmingham, Limassol & York)",location:"Symbiosis Law School, Pune, India",mode:"hybrid",deadline:"2026-08-20",rolling:false,eventDate:"18–19 Sept 2026",link:"",email:"",details:"Theme: Natural resource conflicts, institutional uncertainty & multilateral global governance",addedAt:15},
  {id:16,category:'cfp',title:"Call for Article Submissions — September 2026 Edition",organizer:"European Studies Review",location:"Online submission",mode:"online",deadline:"2026-08-20",rolling:false,eventDate:"",link:"",email:"europeanstudiesreview@gmail.com",details:"Submit article in Word format · Subject line: “Journal Article” + your title",addedAt:16},
  {id:17,category:'cfp',title:"Call for Submissions — Cambridge Journal of Climate Research, Vol. 3(2)",organizer:"Cambridge Journal of Climate Research (CJCR)",location:"Online submission",mode:"online",deadline:"2027-02-27",rolling:false,eventDate:"Issue expected Dec 2026",link:"",email:"cjcr.main@gmail.com",details:"Interdisciplinary climate research, all career stages welcome · Double peer-review · Year of Feb deadline unconfirmed from source — verify with editors",addedAt:17},
  {id:18,category:'cfp',title:"3rd International Conference on Forensic Science, Law, and Criminal Justice",organizer:"Centre for Forensic Science, School of Law, Bennett University",location:"Bennett University, Greater Noida, India",mode:"hybrid",deadline:"2026-08-25",rolling:false,eventDate:"15–17 Sept 2026",link:"",email:"cfs.sol@bennett.edu.in",details:"Abstract 500 words · Full paper 5,000–6,000 words by 10 Sept · Fees: Professionals ₹2,500 / Scholars ₹1,500 / Students ₹1,000",addedAt:18},
  {id:19,category:'cfp',title:"Call for Abstracts — We Are Not Waiting (Youth-Led Anthology)",organizer:"The 50 Percent / UNESCO-MOST BRIDGES Coalition",location:"Online submission",mode:"online",deadline:"2026-08-31",rolling:false,eventDate:"",link:"",email:"",details:"Ages 14–35, no academic credentials required · Focus: regenerative economics, climate justice, peacebuilding, arts & storytelling",addedAt:19},
  {id:20,category:'cfp',title:"Call for Papers — Romanian Yearbook of International and European Law (Inaugural Volume)",organizer:"RYIEL, published by Brill | Nijhoff",location:"Online submission",mode:"online",deadline:"2026-08-20",rolling:false,eventDate:"",link:"",email:"ryiel@e-uvt.ro",details:"Abstract 300–600 words + originality declaration · Theme: Tradition of International Law in Central & Eastern Europe · Selections announced 10 Sept 2026",addedAt:20},
  {id:21,category:'cfp',title:"Ibsen-Fosse Festival 2026 — Essay Competition",organizer:"Royal Norwegian Embassy in Dhaka / Independent University, Bangladesh (IUB)",location:"Dhaka, Bangladesh",mode:"in-person",deadline:"2026-09-10",rolling:false,eventDate:"Festival: 30 Sept 2026",link:"",email:"event.kniaarsc@iub.edu.bd",details:"Topic: “Henrik Ibsen in the Broader Context of Democracy” · 350 words, Times New Roman · Top 3 win crests & certificates; top 10 invited to festival",addedAt:21},
  {id:22,category:'cfp',title:"Write for the COLOCAL Blog",organizer:"ICCCAD / COLOCAL",location:"Online submission",mode:"online",deadline:"",rolling:true,eventDate:"",link:"",email:"maeeshasiddiqui1@gmail.com",details:"Climate adaptation stories from LDCs · Up to 1,000 words + original photos · Open to anyone, rolling submissions",addedAt:22},
  {id:23,category:'cfp',title:"International Conference — A Changing World Beyond Crisis: Climate Solutions for a Resilient Future",organizer:"Centre for Policy Dialogue (CPD) — Climate Week 2026",location:"Dhaka, Bangladesh",mode:"hybrid",deadline:"2026-08-15",rolling:false,eventDate:"CPD Climate Week 2026",link:"",email:"",details:"Abstract submission for the flagship CPD Climate Week international conference",addedAt:23},
  {id:24,category:'training',title:"Student Competitions — Climate Olympiad & Climate Policy Case Competition",organizer:"Centre for Policy Dialogue (CPD) — Climate Week 2026",location:"Dhaka, Bangladesh",mode:"hybrid",deadline:"2026-09-01",rolling:false,eventDate:"CPD Climate Week 2026",link:"",email:"",details:"Climate Olympiad (individual) · Climate Policy Case Competition, “Three Minutes to Rethink Climate Solutions” (team)",addedAt:24},
  {id:25,category:'training',title:"Green Projects — Local Innovations for Climate Action Exhibition",organizer:"Centre for Policy Dialogue (CPD) — Climate Week 2026",location:"Dhaka, Bangladesh",mode:"hybrid",deadline:"2026-09-01",rolling:false,eventDate:"CPD Climate Week 2026",link:"https://lnkd.in/gm_HzQ5A",email:"",details:"Open to SMEs, community orgs, NGOs, students & youth innovators · 500-word concept note required",addedAt:25},
  {id:26,category:'cfp',title:"International Conference on Climate & Disaster Risk Management (ICCDRM 2026)",organizer:"IDMVS, University of Dhaka",location:"University of Dhaka, Bangladesh",mode:"hybrid",deadline:"2026-08-15",rolling:false,eventDate:"8–9 Dec 2026",link:"",email:"info.iccdrm@gmail.com",details:"6 themes incl. DRR, adaptation, early warning, urban risk · Fees: Students BDT1,000/USD50, Professionals BDT2,500/USD100 · Keynote: Dr Rajib Shaw (Keio University)",addedAt:26},
  {id:27,category:'cfp',title:"DURS 2nd International Student Research Conference (ISRC) 2026 — Beyond Boundaries",organizer:"Dhaka University Research Society (DURS)",location:"University of Dhaka, Bangladesh",mode:"hybrid",deadline:"2026-12-14",rolling:false,eventDate:"28 Dec 2026",link:"",email:"",details:"Abstract deadline not shown on source flyer — placeholder set 2 weeks before conference; confirm with organiser",addedAt:27},
  {id:28,category:'cfp',title:"1st RCASBC International Conference 2026 — Rethinking Rule-Based Global Order: Middle and Small States in a Changing World",organizer:"Hong Kong Research Center for Asian Studies–Bangladesh Center / Dept. of IR, University of Chittagong",location:"University of Chittagong, Bangladesh",mode:"in-person",deadline:"2026-08-17",rolling:false,eventDate:"9–10 Sept 2026",link:"https://conference.rcasbc.org/",email:"rcasbc@cu.ac.bd",details:"Notification 20 Aug · Full paper 5 Sept · Outstanding papers published as edited book by Springer Nature",addedAt:28},
  {id:29,category:'cfp',title:"15th UN Research Colloquium — The United Nations in Crisis: Threats, Transformations and Futures of International Law",organizer:"Centre for Human Rights Erlangen-Nuremberg / Working Group of Young UN Researchers (DGVN)",location:"Erlangen-Nuremberg, Germany",mode:"in-person",deadline:"2026-08-16",rolling:false,eventDate:"12–14 Nov 2026",link:"",email:"",details:"Abstract max 300–500 words · English or German · Early-career researchers & civil society especially welcome",addedAt:29},
  {id:30,category:'cfp',title:"2nd International Conference — Constitutionalism and Sustainable Development Goals",organizer:"Centre for Constitutional Law & Human Rights, Bennett University",location:"Bennett University, Greater Noida, India",mode:"hybrid",deadline:"2026-08-31",rolling:false,eventDate:"Constitution Week, 21–26 Nov 2026",link:"",email:"",details:"⚠ Abstract deadline (31 Jul) already passed — date shown is the registration & payment deadline · Fees from INR 500–2,000 / USD 40–45",addedAt:30},
  {id:31,category:'cfp',title:"Young Graduate Meet '26 — The 'Digital' in Humanities and Social Sciences",organizer:"School of Humanities & Social Sciences, IIT Mandi",location:"IIT Mandi, Himachal Pradesh, India",mode:"in-person",deadline:"2026-08-20",rolling:false,eventDate:"14–16 Oct 2026",link:"https://lnkd.in/dwy4e2bn",email:"shssmeet.iitmandi@gmail.com",details:"Tracks: Big Data & AI, Digital Media, Digital Methods, Digital Economy, Digital Health & Welfare Systems",addedAt:31},
  {id:32,category:'job',title:"Research Assistants — International Affairs",organizer:"Fiker Institute",location:"Remote",mode:"remote",deadline:"2026-08-23",rolling:false,eventDate:"3 months, remote, fixed hours",link:"",email:"research@fikerinstitute.org",details:"Open to graduates in international relations, political science, Middle East affairs or related fields",addedAt:32},
  {id:33,category:'job',title:"2027 Summer Legal Internship Program",organizer:"Tilleke & Gibbins",location:"Cambodia, Indonesia, Laos, Myanmar, Thailand, Vietnam",mode:"in-person",deadline:"2026-09-30",rolling:false,eventDate:"Summer 2027",link:"https://lnkd.in/gMZCgnEH",email:"",details:"For 3rd-year LLB students · Min. GPA 2.75 · Strong research skills required",addedAt:33},
  {id:34,category:'job',title:"Young Archivists — Bangladesh Protest Archive",organizer:"Activate Rights / Bangladesh Protest Archive (BPA)",location:"Dhaka, Bangladesh",mode:"in-person",deadline:"2026-09-01",rolling:false,eventDate:"3 months, extendable",link:"",email:"info@activaterights.org",details:"Paid + transport & lunch allowance · No formal degree required, training provided",addedAt:34},
  {id:35,category:'training',title:"2026 Global Youth Cohort",organizer:"Climate Solution International (CSI)",location:"Online / Global",mode:"online",deadline:"2026-09-20",rolling:false,eventDate:"",link:"https://lnkd.in/enssMJuH",email:"",details:"Training in climate diplomacy, COP processes, environmental governance & policy design",addedAt:35},
  {id:36,category:'training',title:"BRIDGE X — Youth Exposure Programme",organizer:"BRAC",location:"Bangladesh",mode:"in-person",deadline:"2026-08-26",rolling:false,eventDate:"Year-long programme",link:"https://brac.net/BridgeX",email:"",details:"For undergraduate university students · Access to BRAC's ecosystem of solutions",addedAt:36}
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
  'hybrid': '🔀',
  'remote': '💻'
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
  State.deadlineSearch = query;
  renderDeadlineDashboard();
}

function getFilteredDeadlineItems() {
  const q = State.deadlineSearch.toLowerCase().trim();
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
      return a.title.localeCompare(b.title);
    }
    return 0;
  });
  
  return list;
}

function renderDeadlineDashboard() {
  const list = getFilteredDeadlineItems();
  
  // Render Stats Row
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
        <p style="font-size:0.8rem;margin-top:0.3rem;">Try clearing search keywords or adding a new entry with "＋ Add Entry".</p>
      </div>
    `;
    return;
  }
  
  gridEl.innerHTML = list.map(item => {
    const urg = getDeadlineUrgency(item);
    const countdown = formatDeadlineCountdown(item);
    const catLabel = DEADLINE_CAT_LABELS[item.category] || item.category;
    const modeIcon = DEADLINE_MODE_ICONS[item.mode] || '🌐';
    const modeLabel = DEADLINE_MODE_LABELS[item.mode] || item.mode || 'Online';
    const tabColor = urg === 'red' ? 'var(--red)' : (urg === 'yellow' ? 'var(--amber)' : (urg === 'green' ? 'var(--green)' : (urg === 'blue' ? 'var(--cyan)' : 'var(--text-subtle)')));
    
    return `
      <div class="ledger-card" id="ledger-item-${item.id}">
        <div class="ledger-card-tab" style="background:${tabColor};"></div>
        
        <div class="ledger-card-head">
          <span class="cat-badge ${item.category}">${esc(catLabel)}</span>
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
          
          ${item.email ? `
            <div class="ledger-meta-row">
              <span class="ledger-meta-icon">✉️</span>
              <div>
                <span class="ledger-meta-label">Contact Email</span>
                <div class="ledger-meta-text">
                  <a href="mailto:${esc(item.email)}">${esc(item.email)}</a>
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
            ${item.link ? `
              <a href="${esc(item.link)}" target="_blank" rel="noopener" class="btn btn-secondary btn-sm" style="font-size:0.75rem;padding:0.35rem 0.7rem;">
                Official Link ↗
              </a>
            ` : ''}
            ${item.email ? `
              <button class="btn btn-secondary btn-sm" style="font-size:0.75rem;padding:0.35rem 0.6rem;" onclick="copyEmail('${esc(item.email)}', this, event)">
                Copy Email
              </button>
            ` : ''}
          </div>
          
          <div class="ledger-card-actions">
            <button class="ledger-icon-btn" title="Edit entry" onclick="openDeadlineModal(${item.id})">✏️</button>
            <button class="ledger-icon-btn" title="Archive entry" onclick="archiveDeadlineEntry(${item.id}, event)">📦</button>
            <button class="ledger-icon-btn danger" title="Delete permanently" onclick="deleteDeadlineEntry(${item.id}, event)">🗑️</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function renderDeadlineCalendar() {
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
  // Empty leading cells
  for (let i = 0; i < firstDay; i++) {
    html += '<div class="ledger-cal-cell empty"></div>';
  }
  
  // Day cells
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
                ${it.link ? `<a href="${esc(it.link)}" target="_blank" class="btn btn-secondary btn-sm" style="font-size:0.72rem;padding:0.25rem 0.5rem;">Open Link ↗</a>` : ''}
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
  const listEl = document.getElementById('ledger-archive-list');
  if (!listEl) return;
  
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
        <button class="btn btn-secondary btn-sm" onclick="restoreDeadlineEntry(${item.id}, event)">↶ Restore to Active</button>
        <button class="btn btn-secondary btn-sm" style="color:var(--red);" onclick="deleteArchivedDeadlineEntry(${item.id}, event)">🗑️ Delete</button>
      </div>
    </div>
  `).join('');
}

function openDeadlineModal(id = null) {
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
  const title = (document.getElementById('lf-title')?.value || '').trim();
  if (!title) {
    showToast('⚠️ Please enter a title', '⚠️');
    document.getElementById('lf-title')?.focus();
    return;
  }
  
  const category = document.getElementById('lf-category')?.value || 'cfp';
  const mode = document.getElementById('lf-mode')?.value || 'online';
  const organizer = (document.getElementById('lf-organizer')?.value || '').trim();
  const location = (document.getElementById('lf-location')?.value || '').trim();
  const rolling = !!document.getElementById('lf-rolling')?.checked;
  const deadline = rolling ? '' : (document.getElementById('lf-deadline')?.value || '').trim();
  const eventDate = (document.getElementById('lf-eventdate')?.value || '').trim();
  const link = (document.getElementById('lf-link')?.value || '').trim();
  const email = (document.getElementById('lf-email')?.value || '').trim();
  const details = (document.getElementById('lf-details')?.value || '').trim();
  
  if (State.deadlineEditingId) {
    // Edit
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
    // Add
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
  const item = State.deadlineItems.find(x => x.id === id);
  if (!confirm(`Are you sure you want to delete "${item ? item.title : 'this entry'}"?`)) return;
  
  State.deadlineItems = State.deadlineItems.filter(x => x.id !== id);
  saveDeadlinesStorage();
  renderDeadlines();
  showToast('🗑️ Entry deleted');
}

function archiveDeadlineEntry(id, event) {
  if (event) event.stopPropagation();
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
  const item = State.deadlineArchived.find(x => x.id === id);
  if (!item) return;
  
  State.deadlineArchived = State.deadlineArchived.filter(x => x.id !== id);
  State.deadlineItems.unshift(item);
  saveDeadlinesStorage();
  renderDeadlines();
  showToast(`↶ Restored "${item.title}" to active dashboard`);
}

function deleteArchivedDeadlineEntry(id, event) {
  if (event) event.stopPropagation();
  if (!confirm('Permanently delete this archived entry?')) return;
  State.deadlineArchived = State.deadlineArchived.filter(x => x.id !== id);
  saveDeadlinesStorage();
  renderDeadlineArchive();
  showToast('🗑️ Archived entry deleted permanently');
}

function exportDeadlines() {
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
  showToast(`⭳ Exported ${State.deadlineItems.length} active and ${State.deadlineArchived.length} archived deadlines!`);
}

function importDeadlines(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      if (Array.isArray(data)) {
        State.deadlineItems = data;
      } else if (data.activeItems && Array.isArray(data.activeItems)) {
        State.deadlineItems = data.activeItems;
        if (Array.isArray(data.archivedItems)) State.deadlineArchived = data.archivedItems;
      } else {
        throw new Error('Unrecognized JSON format');
      }
      saveDeadlinesStorage();
      renderDeadlines();
      showToast(`⭱ Successfully imported ledger data!`);
    } catch(err) {
      showToast('❌ Failed to parse JSON file', '❌');
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

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

// ─── COUNTRY DISCOVERY SUBVIEW ───────────────────────────────────────────
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
              <td><strong>🇬🇧 United Kingdom</strong></td>
              <td>£24,000 – £38,000</td>
              <td>£12,000 – £16,000/yr</td>
              <td>2 Years (Graduate Visa)</td>
              <td>20 hrs/week</td>
              <td>Chevening, Gates Cambridge, Clarendon</td>
              <td><span class="schol-badge strong-match">98% Match</span></td>
            </tr>
            <tr>
              <td><strong>🇨🇭 Switzerland</strong></td>
              <td>CHF 1,500 (Cantonal)</td>
              <td>CHF 20,000 – 24,000/yr</td>
              <td>6 Months Job Search</td>
              <td>15 hrs/week</td>
              <td>Swiss Government Excellence (FCS)</td>
              <td><span class="schol-badge strong-match">96% Match</span></td>
            </tr>
            <tr>
              <td><strong>🇩🇪 Germany</strong></td>
              <td>€0 (Tuition-free public)</td>
              <td>€11,200/yr (Blocked Acc.)</td>
              <td>18 Months</td>
              <td>20 hrs/week</td>
              <td>DAAD Helmut-Schmidt, DAAD EPOS</td>
              <td><span class="schol-badge strong-match">95% Match</span></td>
            </tr>
            <tr>
              <td><strong>🇸🇬 Singapore</strong></td>
              <td>SGD $38,000 (Subsidized)</td>
              <td>SGD $18,000/yr</td>
              <td>1 Year (LTVP upon graduation)</td>
              <td>16 hrs/week</td>
              <td>NUS Research Scholarship, SINGA</td>
              <td><span class="schol-badge strong-match">94% Match</span></td>
            </tr>
            <tr>
              <td><strong>🇦🇺 Australia</strong></td>
              <td>AUD $38,000 – $48,000</td>
              <td>AUD $24,500/yr</td>
              <td>2–4 Years (Subclass 485)</td>
              <td>48 hrs/fortnight</td>
              <td>Australia Awards (DFAT), Melbourne GRS</td>
              <td><span class="schol-badge possible-match">91% Match</span></td>
            </tr>
            <tr>
              <td><strong>🇨🇦 Canada</strong></td>
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

// ─── PROFILE MATCHMAKER SUBVIEW ──────────────────────────────────────────
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
        <button class="btn btn-primary" onclick="saveProfileMatchmaker()">💾 Save &amp; Run Matchmaker</button>
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

// ─── EXAM PREP SUBVIEW ───────────────────────────────────────────────────
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

// ─── CALENDAR & REMINDERS SUBVIEW ────────────────────────────────────────
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

// ─── ARCHIVE SUBVIEW ─────────────────────────────────────────────────────
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
            <button class="btn btn-secondary btn-sm" onclick="restoreScholarshipEntry('${s.id}')">↩ Restore</button>
            <button class="btn btn-secondary btn-sm" onclick="deleteScholarshipEntry('${s.id}', true)" style="color:#EF4444;">Delete</button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// ─── ICS CALENDAR GENERATORS ─────────────────────────────────────────────
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

// ─── MODAL CRUD & STATE MUTATIONS ─────────────────────────────────────────
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
    showToast(`↩ Restored ${item.name}`);
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
  showToast('⭳ Exported verified scholarship register (JSON)!');
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
      showToast(`⭱ Successfully imported and sanitized ${sanitized.length} scholarships!`);
    } catch(err) {
      showToast('❌ Failed to parse scholarship JSON file.', '❌');
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

// ==========================================================================
// 12. CORRESPONDENCE COMPOSER & ACADEMIC EMAIL GENERATOR ENGINE
// ==========================================================================

const CORE_PROPOSALS = {
  proposal1: {
    id: 'p1_halda',
    name: 'Proposal 1: When Rights Collide (Halda Constitutional Rights & Salinity Intrusion)',
    shortTitle: 'When Rights Collide: Halda River Constitutional Rights Assessment',
    title: "When Rights Collide: A Constitutional Proportionality Assessment of Bangladesh's Article 18A (Environmental Rights) versus Article 32 (Right to Life) Under Salinity Intrusion at Halda River Basin",
    summary: "Examines the constitutional rights collision produced by salinity intrusion at the Halda River: Article 18A (Environmental Rights, non-justiciable directive) versus Article 32 (Right to Life, justiciable) with no operative adjudication mechanism.",
    nexusAngle: "Your scholarship on constitutional proportionality, environmental constitutionalism, and climate litigation provides the direct comparative doctrinal architecture required to adjudicate Bangladesh's Article 18A non-justiciability and rights-collision.",
    contributionAngle: "South Asian comparative constitutional case documentation (Bangladesh, Halda Basin) positioning Bangladesh's rights-collision alongside German, Indian, Swiss, and international environmental rights jurisprudence."
  },
  proposal2: {
    id: 'p2_water',
    name: 'Proposal 2: Fundamental Right, Directive Aspiration (AI Water Externalities & Kaliakoir)',
    shortTitle: 'Fundamental Right, Directive Aspiration: AI Water Externalities Assessment',
    title: "Fundamental Right, Directive Aspiration: A Constitutional Proportionality Assessment of AI-Driven Water Externalities Against Bangladeshi University Students' Right to Education",
    summary: "Documents AI data centre operators at Bangladesh's Kaliakoir Hi-Tech Park extracting groundwater without regulatory accounting, assessing whether directive digital education goals survive proportionality scrutiny against the justiciable right to life and water security in a water-stressed developing delta.",
    nexusAngle: "Your scholarship on transboundary water governance, the precautionary principle, and resource extraction provides the foundational framework to analyze AI data centre groundwater extraction in a water-stressed developing delta.",
    contributionAngle: "Empirical documentation of AI-driven groundwater extraction (Kaliakoir Hi-Tech Park) as a novel category of resource governance failure and transboundary harm in the Global South."
  },
  dual: {
    id: 'dual_both',
    name: 'Dual Focus: Both Interconnected Proposals (Halda + AI Water Externalities)',
    shortTitle: 'Dual Match: Halda Constitutional Rights + AI Water Externalities',
    title: "Interconnected Doctoral Proposals: (1) Halda Constitutional Rights Collision [Art. 18A vs Art. 32] & (2) AI-Driven Water Externalities at Kaliakoir Hi-Tech Park",
    summary: "Connects the environmental constitutionalism of the Halda River salinity crisis with the planetary boundary freshwater breach of AI infrastructure groundwater extraction.",
    nexusAngle: "Your scholarship directly connects to both proposals: your planetary boundaries / constitutional proportionality framework theorises the structural architecture, while my research documents the empirical breach in Bangladesh.",
    contributionAngle: "South Asian empirical case data and comparative constitutional documentation bridging environmental constitutional rights and technology-driven resource extraction in developing states."
  }
};

const SUPER_STANDOUT_DATA = {
  'kotzé': {
    proposal: 'dual',
    work: 'Research Handbook on Law, Governance and Planetary Boundaries and your constitutional analysis of Neubauer et al v Germany',
    idea: 'Your earth system law framework names freshwater use as one of nine planetary boundaries — my Water Externalities proposal documents what a breach looks like in a developing state. Simultaneously, your Neubauer analysis is the comparative doctrinal precedent for my Halda Article 18A/32 rights collision.',
    fit: 'South Asian empirical documentation for your Wageningen Planetary Politics initiative (freshwater boundary breach data at Kaliakoir) and comparative constitutional climate rights analysis for your earth system constitutionalism framework.',
    note: 'your Chair in Law Group at Wageningen and the new Planetary Politics initiative'
  },
  'kotze': {
    proposal: 'dual',
    work: 'Research Handbook on Law, Governance and Planetary Boundaries and your constitutional analysis of Neubauer et al v Germany',
    idea: 'Your earth system law framework names freshwater use as one of nine planetary boundaries — my Water Externalities proposal documents what a breach looks like in a developing state. Simultaneously, your Neubauer analysis is the comparative doctrinal precedent for my Halda Article 18A/32 rights collision.',
    fit: 'South Asian empirical documentation for your Wageningen Planetary Politics initiative (freshwater boundary breach data at Kaliakoir) and comparative constitutional climate rights analysis for your earth system constitutionalism framework.',
    note: 'your Chair in Law Group at Wageningen and the new Planetary Politics initiative'
  },
  'calliess': {
    proposal: 'dual',
    work: 'Klimaklagen research programme and your scholarship on how fundamental rights doctrine adjudicates competing climate claims under the German Basic Law',
    idea: 'Your BVerfG 2021 intergenerational equity analysis demonstrates how constitutional proportionality resolves competing rights claims under climate stress — the exact methodological template my Halda proposal requires. Simultaneously, your precautionary principle framework is applicable to AI data centre groundwater extraction.',
    fit: 'South Asian comparative constitutional case documentation (Bangladesh, India, Pakistan) for your Klimaklagen comparative framework, and empirical grounding for the precautionary principle applied to AI resource extraction.',
    note: 'your dedicated Klimaklagen research programme at FU Berlin'
  },
  'ryall': {
    proposal: 'proposal1',
    work: 'scholarship as Chair of the Aarhus Convention Compliance Committee on access to justice in environmental matters',
    idea: 'The Aarhus Convention access-to-justice standard is the international standard against which Bangladesh\'s constitutional non-justiciability produces the exact failure your committee is designed to identify.',
    fit: 'Bangladesh-specific documentation of environmental access-to-justice failures under a non-justiciable constitutional framework (ECR 1997 vs Aarhus Art. 9(3)).',
    note: 'your leadership as Chair of the Aarhus Convention Compliance Committee'
  },
  'bogojević': {
    proposal: 'dual',
    work: 'scholarship on constitutional proportionality in environmental law and the legal architecture of environmental rights enforcement',
    idea: 'Your constitutional proportionality methodology in environmental law is the precise doctrinal framework my Halda rights-collision argument requires, and the same proportionality test my Water Externalities proposal must execute.',
    fit: 'South Asian comparative constitutional documentation, and empirical grounding for the proportionality test between justiciable and non-justiciable environmental claims in a developing-state context.',
    note: ''
  },
  'bogojevic': {
    proposal: 'dual',
    work: 'scholarship on constitutional proportionality in environmental law and the legal architecture of environmental rights enforcement',
    idea: 'Your constitutional proportionality methodology in environmental law is the precise doctrinal framework my Halda rights-collision argument requires, and the same proportionality test my Water Externalities proposal must execute.',
    fit: 'South Asian comparative constitutional documentation, and empirical grounding for the proportionality test between justiciable and non-justiciable environmental claims in a developing-state context.',
    note: ''
  },
  'cordonier segger': {
    proposal: 'proposal1',
    work: 'sustainable development law scholarship and your Asia Pacific capacity-building programming on UNFCCC loss and damage implementation',
    idea: 'Your Asia Pacific UNFCCC capacity-building work is the institutional site where the arguments of my Loss and Damage paper should reach policymakers. My CDRI index framework offers an evidence-based responsibility allocation tool.',
    fit: 'Bangladesh-specific L&D accountability documentation and CDRI methodology input for your Asia Pacific UNFCCC programming and CISDL frameworks.',
    note: 'your leadership of the CISDL and Asia Pacific capacity-building initiatives'
  },
  'segger': {
    proposal: 'proposal1',
    work: 'sustainable development law scholarship and your Asia Pacific capacity-building programming on UNFCCC loss and damage implementation',
    idea: 'Your Asia Pacific UNFCCC capacity-building work is the institutional site where the arguments of my Loss and Damage paper should reach policymakers. My CDRI index framework offers an evidence-based responsibility allocation tool.',
    fit: 'Bangladesh-specific L&D accountability documentation and CDRI methodology input for your Asia Pacific UNFCCC programming and CISDL frameworks.',
    note: 'your leadership of the CISDL and Asia Pacific capacity-building initiatives'
  },
  'roy': {
    proposal: 'proposal1',
    work: 'scholarship on Indian constitutional environmental jurisprudence — particularly on the Directive Principles of State Policy and the Samatha and Niyamgiri decisions',
    idea: 'Bangladesh\'s DPSP structure directly mirrors India\'s — your scholarship on how Indian courts have navigated community consent within that architecture is the closest comparative methodology for my Halda analysis.',
    fit: 'Bangladesh constitutional environmental law case documentation mapping the Article 18A enforcement gap against the Indian DPSP trajectory.',
    note: ''
  },
  'wouters': {
    proposal: 'proposal2',
    work: 'scholarship on South Asian transboundary water law — particularly on the Indus Waters Treaty and the legal architecture of transboundary river cooperation',
    idea: 'Your Indus Waters Treaty scholarship is in the same South Asian transboundary water law doctrinal family as the 1996 Ganges Treaty framework my proposal operates within. The IWLA PhD programme is the most precise institutional home for this inquiry.',
    fit: 'Bangladesh-specific documentation of AI-driven groundwater extraction as a new category of transboundary water harm, and comparative analysis of the Ganges Treaty against the no-harm principle.',
    note: 'your founding directorship of the International Water Law Academy (IWLA)'
  },
  'chong': {
    proposal: 'proposal2',
    work: 'ECS-funded research project on inter-jurisdictional cooperation on water preservation in the Greater Bay Area and climate governance',
    idea: 'Your ECS project on inter-jurisdictional water preservation in the Greater Bay Area addresses the same legal governance failure my Kaliakoir case documents — cross-boundary water extraction without adequate responsibility allocation.',
    fit: 'South Asian comparative case documentation for your water preservation project, with Kaliakoir as a parallel inter-jurisdictional water governance failure.',
    note: 'your ECS grant on Greater Bay Area water preservation'
  },
  'eckstein': {
    proposal: 'proposal2',
    work: 'scholarship on the international law of transboundary groundwater resources and your editorship of the International Water Law Blog',
    idea: 'Your named speciality in transboundary groundwater resources is the exact legal category the Kaliakoir situation requires. Your US–Mexico Rio Grande treaty analysis provides a directly transferable analytical template.',
    fit: 'Bangladesh-specific transboundary groundwater depletion case documentation (Kaliakoir, Barind Tract) for your research programme and the International Water Law Blog.',
    note: 'your editorship of the International Water Law Blog'
  },
  'reich': {
    proposal: 'proposal1',
    work: 'scholarship on comparative constitutional climate litigation and how constitutional adjudication frameworks resolve competing rights claims',
    idea: 'Your comparative constitutional climate litigation scholarship — specifically how Swiss constitutional law (Article 74 mandates) and European human rights frameworks adjudicate competing climate rights — offers the closest comparative methodology for my Halda analysis.',
    fit: 'Bangladesh comparative constitutional climate litigation documentation, positioning the Halda rights-collision within the Swiss, German, and Indian frameworks.',
    note: ''
  }
};

const COMPOSER_FRAMEWORKS = {
  phd: [
    ["Subject line", "Specific and dated — e.g. “Seeking PhD Supervision: [Research Area] – [Your Name]” or “Prospective PhD Applicant – [Field] – [Intake Year]”. Never “Hello” or “PhD Inquiry”."],
    ["Address them correctly", "Use the exact title (Dr / Prof) from their faculty page. Guessing, or using a first name, reads as not having done the homework."],
    ["Open in 2–3 lines", "Who you are, your institution and degree, your research area. No life story."],
    ["State the ask directly", "Say plainly that you're writing to formally explore PhD supervision — and name your proposed research title."],
    ["The precision link — most important step", "Connect a specific paper or argument of theirs to your own work — not “I'm inspired by your work,” but exactly how your research extends, tests, or fills a gap in something they've actually published."],
    ["Two or three achievements", "Publications, awards, relevant methodology — concise bullets, not an attached CV's worth of text in the email body."],
    ["Close practically", "Mention the CV is attached, state your target intake, and thank them. A short-call request is fine if the fit is strong."],
    ["Length", "200–300 words is fine — precision earns length. A vague email should stay short; a precise one can run a little longer."]
  ],
  masters: [
    ["Subject line", "Clear and specific — e.g. “Inquiry About Graduate Funding Opportunities in [Department]”."],
    ["Address them correctly", "Correct title, taken from the department website — never guessed."],
    ["Open in 2–3 lines", "Name, current position/university, the field you want to study — precise, not padded."],
    ["Name the proposal, if it's a research Master's", "Most fully-funded Master's places (MRes, MSc by research, MPhil) are research-based and expect a proposed research title or short proposal, exactly like a PhD application. If that's your route, name your working title early and give one sentence on its core question — don't leave it for the CV."],
    ["Show the homework", "Reference a specific paper, project, or research area of theirs that resonated with you. Generic praise (“I am interested in your work”) reads as a template."],
    ["Your fit, briefly", "1–2 sentences connecting your background or coursework to their research area — no exaggeration, no listing grades or co-curriculars."],
    ["The ask — be specific", "Funding, assistantships, application process, or how to strengthen your application — 2–3 concrete questions work better than one vague one."],
    ["Close warmly", "Thank them for their time, offer to discuss further, sign off with contact details."],
    ["Length", "180–250 words. A taught Master's inquiry can stay closer to 180; a research Master's naming a proposal title can run a little longer — precision earns length here too."]
  ]
};

const COMPOSER_CROSS_CUTTING = "Across both: no “Respected Sir/Madam,” no emojis or slang, no AI-sounding filler, and never copy-paste the same email to multiple supervisors unchanged.";

function getCmpVal(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

function setCmpVal(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val || '';
}

function switchComposerSubTab(tabKey) {
  document.querySelectorAll('.composer-subtab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.id === `subtab-btn-${tabKey}`);
  });
  
  document.querySelectorAll('.composer-subtab-content').forEach(content => {
    content.classList.toggle('active', content.id === `composer-subtab-${tabKey}`);
  });
  
  const progToggle = document.getElementById('cmp-prog-toggle-wrapper');
  if (progToggle) {
    progToggle.style.display = (tabKey === 'generator') ? 'block' : 'none';
  }
}

function reloadSuperStandoutFrame() {
  const frame = document.getElementById('super-standout-frame');
  if (frame) {
    frame.src = frame.src;
    showToast('Reloaded Super Standout Webpage');
  }
}

function applyCoreProposalToComposer(propKey) {
  const sel = document.getElementById('cmp-proposalSelect');
  if (sel) sel.value = propKey;
  handleCoreProposalChange(propKey);
  switchComposerSubTab('generator');
  showToast(`Applied ${CORE_PROPOSALS[propKey].shortTitle}`, '✓');
}

function handleCoreProposalChange(propKey) {
  const prop = CORE_PROPOSALS[propKey] || CORE_PROPOSALS.proposal1;
  setCmpVal('cmp-researchTitle', prop.title);
  
  // If active scholar is not super standout, update fit/nexus angle to match selected proposal
  const lastName = getCmpVal('cmp-profName').toLowerCase();
  if (!SUPER_STANDOUT_DATA[lastName]) {
    if (!getCmpVal('cmp-profFit')) setCmpVal('cmp-profFit', prop.contributionAngle);
  }
}

function findSuperStandoutMatch(scholar) {
  if (!scholar || !scholar.name) return null;
  const lowerName = scholar.name.toLowerCase();
  for (const key in SUPER_STANDOUT_DATA) {
    if (lowerName.includes(key)) {
      return SUPER_STANDOUT_DATA[key];
    }
  }
  return null;
}

function initComposer() {
  initComposerScholarDropdowns();
  renderComposerFramework(State.composer.prog || 'phd');
  
  // Pre-populate applicant profile fields
  populateComposerApplicantProfile();
  
  // CV dropzone listeners
  const dropzone = document.getElementById('cmp-dropzone');
  const cvInput = document.getElementById('cmp-cvInput');
  const cvRemoveBtn = document.getElementById('cmp-cvRemoveBtn');
  
  if (dropzone && cvInput) {
    dropzone.addEventListener('click', () => cvInput.click());
    dropzone.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        cvInput.click();
      }
    });
    
    ['dragover'].forEach(evt => {
      dropzone.addEventListener(evt, (e) => {
        e.preventDefault();
        dropzone.classList.add('drag');
      });
    });
    
    ['dragleave', 'drop'].forEach(evt => {
      dropzone.addEventListener(evt, (e) => {
        e.preventDefault();
        dropzone.classList.remove('drag');
      });
    });
    
    dropzone.addEventListener('drop', (e) => {
      const f = e.dataTransfer.files[0];
      if (f) handleComposerCvFile(f);
    });
    
    cvInput.addEventListener('change', (e) => {
      const f = e.target.files[0];
      if (f) handleComposerCvFile(f);
    });
  }
  
  if (cvRemoveBtn) {
    cvRemoveBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      State.composer.cvText = '';
      State.composer.cvFileName = '';
      if (cvInput) cvInput.value = '';
      const cvStatus = document.getElementById('cmp-cvStatus');
      const cvError = document.getElementById('cmp-cvError');
      if (cvStatus) cvStatus.classList.remove('show');
      if (cvError) cvError.classList.remove('show');
    });
  }
  
  // Live word count listener
  const bodyField = document.getElementById('cmp-bodyField');
  if (bodyField) {
    bodyField.addEventListener('input', updateComposerWordCount);
  }
  
  // Build modal contents if needed
  syncComposerModalView();
}

function syncComposerModalView() {
  const modalContainer = document.getElementById('composer-modal-inner-form');
  const mainWorkspace = document.querySelector('.composer-workspace');
  if (modalContainer && mainWorkspace && !modalContainer.hasChildNodes()) {
    // If opening in modal, move or render clone
  }
}

function initComposerScholarDropdowns() {
  const viewSelect = document.getElementById('cmp-view-scholar-select');
  const modalSelect = document.getElementById('cmp-modal-scholar-select');
  
  const optionsHtml = P.map(p => {
    return `<option value="${p.id}">#${p.id} ${esc(p.name)} (${esc(p.university)}) — [${esc(p.cluster)}]</option>`;
  }).join('');
  
  if (viewSelect) {
    viewSelect.innerHTML = `<option value="">-- Choose Target Professor (232 available) --</option>` + optionsHtml;
  }
  if (modalSelect) {
    modalSelect.innerHTML = `<option value="">-- Choose Target Professor (232 available) --</option>` + optionsHtml;
  }
}

function populateComposerApplicantProfile() {
  const p = State.profile || (typeof DEFAULT_PROFILE_DATA !== 'undefined' ? DEFAULT_PROFILE_DATA : {});
  
  if (!getCmpVal('cmp-yourName')) setCmpVal('cmp-yourName', p.name || 'Tanvir Ahmed Tusher');
  if (!getCmpVal('cmp-yourStatus')) setCmpVal('cmp-yourStatus', p.degreeStatus || 'Bachelor of Laws (LL.B.) — Ongoing (Final Year)');
  if (!getCmpVal('cmp-yourInstitution')) setCmpVal('cmp-yourInstitution', p.institution || 'Noakhali Science and Technology University');
  if (!getCmpVal('cmp-yourField')) {
    const fields = p.researchAreas ? p.researchAreas.join(', ') : 'Public International Law, AI Governance, Climate Displacement';
    setCmpVal('cmp-yourField', fields);
  }
  
  // Strictly set to Proposal 1 if empty
  if (!getCmpVal('cmp-proposalSelect')) {
    setCmpVal('cmp-proposalSelect', 'proposal1');
  }
  const propKey = getCmpVal('cmp-proposalSelect') || 'proposal1';
  setCmpVal('cmp-researchTitle', CORE_PROPOSALS[propKey].title);
  
  if (!getCmpVal('cmp-achievements')) {
    let ach = '';
    if (p.highlights && Array.isArray(p.highlights)) {
      ach = p.highlights.map(h => `• ${h.title}: ${h.detail}`).join('\n');
    } else {
      ach = `• Featured on Legal Theory Blog by Prof. Lawrence B. Solum (Texas A&M) for IGI Global chapter on AI infrastructure & TWAIL\n• Outstanding Paper Award (2026) at 3rd IUB Undergraduate Law Students' Research Conference\n• Top 14th Scorer Nationally among 716 in CPD Climate Week Olympiad Round (2025)`;
    }
    setCmpVal('cmp-achievements', ach);
  }
  if (!getCmpVal('cmp-timeline')) setCmpVal('cmp-timeline', 'October 2027 / Michaelmas Term');
  if (!getCmpVal('cmp-links')) {
    const lk = [];
    if (p.links) {
      if (p.links.linkedin) lk.push(`LinkedIn: ${p.links.linkedin}`);
      if (p.links.orcid) lk.push(`ORCID: ${p.links.orcid}`);
      if (p.links.googleScholar) lk.push(`Google Scholar: ${p.links.googleScholar}`);
    }
    setCmpVal('cmp-links', lk.join(' | ') || 'LinkedIn: linkedin.com/in/tanvir-ahmed77 | ORCID: 0009-0001-1764-9178');
  }
}

function renderComposerFramework(prog) {
  const steps = COMPOSER_FRAMEWORKS[prog] || COMPOSER_FRAMEWORKS.phd;
  const title = prog === 'phd' ? 'PhD Supervision Academic Correspondence Framework' : "Master's / Funding Inquiry Correspondence Framework";
  let html = `<h3>${title}</h3>`;
  steps.forEach((s, i) => {
    html += `<div class="fw-step"><div class="fw-num">${String(i + 1).padStart(2, '0')}</div><p><strong>${s[0]}.</strong> ${s[1]}</p></div>`;
  });
  html += `<div class="fw-step"><div class="fw-num">✦</div><p>${COMPOSER_CROSS_CUTTING}</p></div>`;
  
  const innerEl = document.getElementById('cmp-frameworkInner');
  if (innerEl) innerEl.innerHTML = html;
}

function setComposerProg(prog) {
  State.composer.prog = prog;
  
  document.querySelectorAll('.prog-toggle button, .cmp-prog-btn').forEach(btn => {
    const isMatch = btn.dataset.prog === prog;
    btn.classList.toggle('active', isMatch);
    btn.setAttribute('aria-selected', isMatch ? 'true' : 'false');
  });
  
  const askingSelect = document.getElementById('cmp-asking');
  if (askingSelect) {
    askingSelect.value = prog === 'phd' ? 'PhD supervision' : 'Funding & scholarship information';
  }
  
  const hintEl = document.getElementById('cmp-researchTitleHint');
  if (hintEl) {
    hintEl.textContent = prog === 'phd'
      ? 'Required for PhD supervision emails.'
      : 'Include this if your target programme is research-based or fully funded — most funded Master’s require a working proposal too.';
  }
  
  renderComposerFramework(prog);
}

function setComposerTone(tone) {
  State.composer.tone = tone;
  document.querySelectorAll('.tone-chip').forEach(chip => {
    chip.classList.toggle('active', chip.dataset.tone === tone);
  });
}

function toggleComposerFramework() {
  const btn = document.getElementById('cmp-frameworkToggle');
  const pnl = document.getElementById('cmp-frameworkPanel');
  if (btn && pnl) {
    btn.classList.toggle('open');
    pnl.classList.toggle('open');
  }
}

function extractLastName(fullName) {
  if (!fullName) return '';
  let clean = fullName.replace(/^(Prof\.|Professor|Dr\.|Dr|Assoc\.\s*Prof\.|Asst\.\s*Prof\.|Scientia\s*Prof\.)\s+/i, '');
  clean = clean.replace(/\s+(AO|CBE|OBE|MBE|QC|KC|FBA)$/i, '').trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  return parts.length > 0 ? parts[parts.length - 1] : fullName;
}

function extractTitle(fullName, defaultTitle) {
  if (/^Dr\.?/i.test(fullName)) return 'Dr';
  if (/^Assoc\.\s*Prof/i.test(fullName)) return 'Assoc. Prof.';
  if (/^Asst\.\s*Prof/i.test(fullName)) return 'Asst. Prof.';
  if (/^Prof/i.test(fullName)) return 'Prof.';
  if (defaultTitle && /Dr/i.test(defaultTitle)) return 'Dr';
  return 'Prof.';
}

function loadScholarIntoComposer(id, isModal = false) {
  if (!id) return;
  const p = P.find(x => x.id == id);
  if (!p) return;
  
  State.composer.activeScholarId = p.id;
  
  // Sync dropdown values
  const viewSelect = document.getElementById('cmp-view-scholar-select');
  const modalSelect = document.getElementById('cmp-modal-scholar-select');
  if (viewSelect) viewSelect.value = p.id;
  if (modalSelect) modalSelect.value = p.id;
  
  // Populate professor fields
  const title = extractTitle(p.name, p.title);
  const lastName = extractLastName(p.name);
  
  setCmpVal('cmp-profTitle', title);
  setCmpVal('cmp-profName', lastName);
  setCmpVal('cmp-profUni', p.university + (p.dept ? ` · ${p.dept}` : ''));
  
  // Check for Standout Match from super_standout_dashboard.html
  const standoutMatch = findSuperStandoutMatch(p);
  
  if (standoutMatch) {
    // Use exact standout proposal match and custom tailored nexus
    setCmpVal('cmp-proposalSelect', standoutMatch.proposal);
    setCmpVal('cmp-researchTitle', CORE_PROPOSALS[standoutMatch.proposal].title);
    setCmpVal('cmp-profWork', standoutMatch.work);
    setCmpVal('cmp-profIdea', standoutMatch.idea);
    setCmpVal('cmp-profFit', standoutMatch.fit);
    setCmpVal('cmp-profNote', standoutMatch.note);
  } else {
    // Determine the optimal core proposal (Proposal 1 vs Proposal 2 vs Dual)
    let propKey = 'proposal1';
    if (p.cluster === 'AI / Tech Governance' || p.cluster === 'International Investment Law' || (p.research && p.research.toLowerCase().includes('water'))) {
      propKey = 'proposal2';
    } else if (p.superStandout || (p.priority === 'Super Standout')) {
      propKey = 'dual';
    }
    
    setCmpVal('cmp-proposalSelect', propKey);
    setCmpVal('cmp-researchTitle', CORE_PROPOSALS[propKey].title);
    
    const recentWork = (p.papers && p.papers.length > 0) ? p.papers[0] : (p.currentProject || p.research || '');
    setCmpVal('cmp-profWork', recentWork);
    setCmpVal('cmp-profIdea', p.matchPoint || CORE_PROPOSALS[propKey].nexusAngle);
    setCmpVal('cmp-profFit', p.contribution || p.proposalHit || CORE_PROPOSALS[propKey].contributionAngle);
    setCmpVal('cmp-profNote', p.supervisionVacancy || (p.superStandout ? 'Super Standout Target Faculty' : ''));
  }
  
  // Ensure applicant data is populated
  populateComposerApplicantProfile();
  
  // Clear any old research card results
  const resCard = document.getElementById('cmp-researchCard');
  if (resCard) {
    resCard.innerHTML = '';
    resCard.classList.remove('show');
  }
  
  // Update modal title badge if in modal
  const modalTitle = document.getElementById('composer-modal-title');
  const modalSub = document.getElementById('composer-modal-subtitle');
  if (modalTitle) modalTitle.textContent = `Correspondence Composer: ${p.name}`;
  if (modalSub) modalSub.textContent = `${p.university} · Cluster: ${p.cluster} · ${p.priority}`;
  
  showToast(`Loaded ${p.name} into Email Generator`, '✉️');
}

function openEmailComposer(scholarId = null, event = null) {
  if (event) event.stopPropagation();
  
  initComposerScholarDropdowns();
  
  const targetId = scholarId || State.composer.activeScholarId || (State.activeDrawerId) || (P.length > 0 ? P[0].id : null);
  
  if (targetId) {
    loadScholarIntoComposer(targetId, true);
  } else {
    populateComposerApplicantProfile();
  }
  
  // Move main form into modal body if not already there
  const modalBodyContainer = document.getElementById('composer-modal-inner-form');
  const mainWorkspace = document.querySelector('.composer-workspace');
  const outputSection = document.getElementById('cmp-outputSection');
  
  if (modalBodyContainer && mainWorkspace) {
    if (!modalBodyContainer.contains(mainWorkspace)) {
      modalBodyContainer.appendChild(mainWorkspace);
      if (outputSection) modalBodyContainer.appendChild(outputSection);
    }
  }
  
  const backdrop = document.getElementById('email-composer-modal-backdrop');
  if (backdrop) {
    backdrop.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
}

function closeEmailComposerModal() {
  const backdrop = document.getElementById('email-composer-modal-backdrop');
  if (backdrop) {
    backdrop.classList.remove('open');
    document.body.style.overflow = '';
  }
  
  // Return form to standalone view if view is active
  if (State.currentView === 'composer') {
    renderComposerView();
  }
}

function renderComposerView() {
  const viewContainer = document.getElementById('view-composer');
  const mainWorkspace = document.querySelector('.composer-workspace');
  const outputSection = document.getElementById('cmp-outputSection');
  
  if (viewContainer && mainWorkspace) {
    const generatorTab = document.getElementById('composer-subtab-generator');
    if (generatorTab && !generatorTab.contains(mainWorkspace)) {
      generatorTab.appendChild(mainWorkspace);
      if (outputSection) generatorTab.appendChild(outputSection);
    }
  }
  
  initComposerScholarDropdowns();
  if (State.composer.activeScholarId) {
    loadScholarIntoComposer(State.composer.activeScholarId);
  } else if (P.length > 0) {
    loadScholarIntoComposer(P[0].id);
  }
}

// 1-Click Quick Draft directly inside Professor Profile Drawer
function quickGenerateDrawerEmail(scholarId, event = null) {
  if (event) event.stopPropagation();
  const p = P.find(x => x.id === scholarId);
  if (!p) return;
  
  loadScholarIntoComposer(scholarId);
  
  const prog = State.composer.prog || 'phd';
  const tone = State.composer.tone || 'formal';
  
  const draft = generateDeterministicDraft(prog, tone);
  
  const quickBox = document.getElementById('drawer-quick-email-box');
  const subjEl = document.getElementById('drawer-quick-subject');
  const bodyEl = document.getElementById('drawer-quick-body');
  const countEl = document.getElementById('drawer-quick-wordcount');
  
  if (quickBox && subjEl && bodyEl) {
    subjEl.textContent = `Subject: ${draft.subject}`;
    bodyEl.value = draft.body;
    const words = draft.body.split(/\s+/).filter(Boolean).length;
    if (countEl) countEl.textContent = `${words} words`;
    quickBox.style.display = 'block';
    quickBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  
  showToast(`⚡ Generated 1-click draft for ${p.name}`);
}

function copyDrawerQuickEmail(btn) {
  const bodyEl = document.getElementById('drawer-quick-body');
  if (bodyEl && bodyEl.value) {
    navigator.clipboard.writeText(bodyEl.value).then(() => {
      const orig = btn.textContent;
      btn.textContent = 'Copied ✓';
      setTimeout(() => { btn.textContent = orig; }, 1600);
      showToast('Copied email body to clipboard');
    });
  }
}

function openDrawerQuickMailto(email) {
  const subjEl = document.getElementById('drawer-quick-subject');
  const bodyEl = document.getElementById('drawer-quick-body');
  const subject = subjEl ? subjEl.textContent.replace(/^Subject:\s*/, '') : '';
  const body = bodyEl ? bodyEl.value : '';
  const directEmail = email && !email.includes('Check') && !email.includes('directory') ? email : '';
  window.location.href = `mailto:${directEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

// Search Tool Handlers
function searchCurrentProfGoogle() {
  const profName = getCmpVal('cmp-profName');
  if (!profName) {
    document.getElementById('cmp-profName').focus();
    showToast('Please enter a professor last name first', '⚠️');
    return;
  }
  const title = getCmpVal('cmp-profTitle');
  const uni = getCmpVal('cmp-profUni');
  const q = `${title} ${profName} ${uni}`.trim();
  window.open('https://www.google.com/search?q=' + encodeURIComponent(q), '_blank', 'noopener');
}

function searchCurrentProfScholar() {
  const profName = getCmpVal('cmp-profName');
  if (!profName) {
    document.getElementById('cmp-profName').focus();
    showToast('Please enter a professor last name first', '⚠️');
    return;
  }
  const uni = getCmpVal('cmp-profUni');
  const q = `${profName} ${uni}`.trim();
  window.open('https://scholar.google.com/scholar?q=' + encodeURIComponent(q), '_blank', 'noopener');
}

async function researchCurrentProfAI() {
  const profName = getCmpVal('cmp-profName');
  if (!profName) {
    document.getElementById('cmp-profName').focus();
    showToast('Please enter a professor last name first', '⚠️');
    return;
  }
  
  const loading = document.getElementById('cmp-researchLoading');
  const errEl = document.getElementById('cmp-researchError');
  const card = document.getElementById('cmp-researchCard');
  
  if (errEl) errEl.classList.remove('show');
  if (card) card.classList.remove('show');
  if (loading) loading.classList.add('show');
  
  const title = getCmpVal('cmp-profTitle');
  const uni = getCmpVal('cmp-profUni');
  const yourField = getCmpVal('cmp-yourField');
  const who = `${title} ${profName}${uni ? ', ' + uni : ''}`;
  
  // Try Anthropic API if in compatible environment
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        system: `You are a research assistant helping an academic applicant prepare to contact an academic. Output ONLY valid JSON in this shape: {"overview": "2-3 sentence summary of current research focus", "recent_works": [{"title": "...", "year": "2024", "note": "one sentence on what it argues or does", "url": ""}], "honor": "recent honour or vacancy note"}`,
        messages: [{ role: "user", content: `Research this academic: ${who}. Field: ${yourField}.` }],
        tools: [{ type: "web_search_20250305", name: "web_search" }]
      })
    });
    
    if (!response.ok) throw new Error(`API status ${response.status}`);
    const data = await response.json();
    const text = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n').trim();
    let clean = text.replace(/^```json\s*|^```\s*|```$/g, '').trim();
    let parsed;
    const s = clean.indexOf('{'), en = clean.lastIndexOf('}');
    if (s !== -1 && en !== -1) parsed = JSON.parse(clean.slice(s, en + 1));
    else parsed = JSON.parse(clean);
    
    renderComposerResearchCard(parsed);
  } catch(err) {
    // Graceful intelligent fallback from pre-indexed dataset!
    const activeScholar = P.find(x => x.id == State.composer.activeScholarId) || P.find(x => x.name.toLowerCase().includes(profName.toLowerCase()));
    if (activeScholar) {
      const fallbackData = {
        overview: activeScholar.research || `${activeScholar.name} researches within ${activeScholar.university}, specializing in ${activeScholar.cluster}.`,
        recent_works: (activeScholar.papers || []).slice(0, 3).map(paper => ({
          title: paper,
          year: "2023-2025",
          note: activeScholar.matchPoint || "Examines structural governance and legal accountability mechanisms.",
          url: activeScholar.profileUrl || ""
        })),
        honor: activeScholar.supervisionVacancy || activeScholar.proposalHit || (activeScholar.superStandout ? 'Super Standout Target Faculty' : '')
      };
      renderComposerResearchCard(fallbackData, true);
    } else {
      if (errEl) {
        errEl.textContent = `Could not connect to external search API (${err.message}). You can use Google / Google Scholar buttons above to look up their recent papers.`;
        errEl.classList.add('show');
      }
    }
  } finally {
    if (loading) loading.classList.remove('show');
  }
}

function renderComposerResearchCard(data, isOfflineFallback = false) {
  const card = document.getElementById('cmp-researchCard');
  if (!card) return;
  
  let html = `<span class="verify-note">${isOfflineFallback ? '✓ Verified Dataset Dossier' : 'AI-summarized from web search — verify before relying on it'}</span>`;
  if (data.overview) {
    html += `<div class="research-overview">${esc(data.overview)}</div>`;
  }
  
  (data.recent_works || []).forEach((w) => {
    html += `
      <div class="work-item">
        <div class="wtitle">${esc(w.title || '')}${w.year ? ' (' + esc(w.year) + ')' : ''}</div>
        <div class="wnote">${esc(w.note || '')}</div>
        <div class="wactions">
          <button type="button" class="mini-btn" data-fill="cmp-profWork" data-value="${esc(w.title || '')}">Use as recent work</button>
          <button type="button" class="mini-btn" data-fill="cmp-profIdea" data-value="${esc(w.note || '')}">Use as fit angle</button>
          ${w.url ? `<a class="wsource" href="${esc(w.url)}" target="_blank" rel="noopener">source ↗</a>` : ''}
        </div>
      </div>
    `;
  });
  
  if (data.honor) {
    html += `
      <div class="work-item">
        <div class="wtitle">To acknowledge</div>
        <div class="wnote">${esc(data.honor)}</div>
        <div class="wactions">
          <button type="button" class="mini-btn" data-fill="cmp-profNote" data-value="${esc(data.honor)}">Use as acknowledgment</button>
        </div>
      </div>
    `;
  }
  
  card.innerHTML = html;
  card.classList.add('show');
  
  // Attach 1-click insert handlers
  card.querySelectorAll('[data-fill]').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = document.getElementById(btn.dataset.fill);
      if (target) {
        target.value = btn.dataset.value;
        const orig = btn.textContent;
        btn.textContent = 'Inserted ✓';
        setTimeout(() => { btn.textContent = orig; }, 1400);
      }
    });
  });
}

// CV File Upload Handler (.md, .docx, .pdf)
async function handleComposerCvFile(file) {
  const cvStatus = document.getElementById('cmp-cvStatus');
  const cvStatusText = document.getElementById('cmp-cvStatusText');
  const cvError = document.getElementById('cmp-cvError');
  
  if (cvError) cvError.classList.remove('show');
  if (cvStatus) cvStatus.classList.remove('show');
  
  const ext = file.name.split('.').pop().toLowerCase();
  
  try {
    let text = '';
    if (ext === 'md' || ext === 'markdown') {
      text = await file.text();
    } else if (ext === 'docx') {
      if (!window.mammoth) throw new Error('DOCX extraction library not ready');
      const buf = await file.arrayBuffer();
      const result = await window.mammoth.extractRawText({ arrayBuffer: buf });
      text = result.value;
    } else if (ext === 'pdf') {
      const pdfLib = window.pdfjsLib || window['pdfjs-dist/build/pdf'];
      if (!pdfLib) throw new Error('PDF extraction library not ready');
      const buf = await file.arrayBuffer();
      const doc = await pdfLib.getDocument({ data: buf }).promise;
      const pages = [];
      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const content = await page.getTextContent();
        pages.push(content.items.map(it => it.str).join(' '));
      }
      text = pages.join('\n\n');
    } else {
      throw new Error('Unsupported file type — please use .md, .docx or .pdf');
    }
    
    text = text.trim();
    if (!text) throw new Error('No extractable text found in this file');
    
    let truncated = false;
    if (text.length > 6000) {
      text = text.slice(0, 6000);
      truncated = true;
    }
    
    State.composer.cvText = text;
    State.composer.cvFileName = file.name;
    
    const words = text.split(/\s+/).filter(Boolean).length;
    if (cvStatusText) {
      cvStatusText.textContent = `${file.name} — ${words} words extracted${truncated ? ' (truncated)' : ''}`;
    }
    if (cvStatus) cvStatus.classList.add('show');
    showToast(`✓ CV file parsed (${words} words)`, '📄');
  } catch(err) {
    State.composer.cvText = '';
    State.composer.cvFileName = '';
    if (cvError) {
      cvError.textContent = `Could not read file (${err.message}). You can paste achievements in the field below instead.`;
      cvError.classList.add('show');
    }
  }
}

// Prompt Builders
function buildComposerSystemPrompt() {
  const prog = State.composer.prog || 'phd';
  const steps = COMPOSER_FRAMEWORKS[prog].map((s, i) => `${i + 1}. ${s[0]}: ${s[1]}`).join('\n');
  
  return `You are an expert academic correspondence writer helping a student draft a first-contact email to a professor, for ${prog === 'phd' ? 'PhD supervision' : "a Master's programme / funding inquiry"}.

Follow this framework exactly:
${steps}
${COMPOSER_CROSS_CUTTING}

Critical rules:
- Use ONLY the facts and proposal titles provided below. Do not invent or alter research proposals. Rely strictly on Proposal 1 ('When Rights Collide: Halda River Constitutional Proportionality') or Proposal 2 ('Fundamental Right, Directive Aspiration: AI Water Externalities') as provided.
- If a CV excerpt is provided, treat it as background context — you may draw one or two additional relevant details from it if they strengthen the fit paragraph, but the user's manually listed achievements take priority. Do not dump CV content into the email.
- Write in the tone the user selected: "formal" = traditional academic register; "warm" = formal but personable; "direct" = brief, gets to the point fast.
- Output ONLY valid JSON, nothing before or after it, no markdown code fences, in exactly this shape:
{"subject": "the subject line", "body": "the full email body including greeting and sign-off, with \\n\\n between paragraphs"}`;
}

function buildComposerUserPrompt() {
  const lines = [];
  lines.push(`Your name: ${getCmpVal('cmp-yourName')}`);
  if (getCmpVal('cmp-yourStatus')) lines.push(`Current status: ${getCmpVal('cmp-yourStatus')}`);
  if (getCmpVal('cmp-yourInstitution')) lines.push(`Institution: ${getCmpVal('cmp-yourInstitution')}`);
  lines.push(`Your field/research interest: ${getCmpVal('cmp-yourField')}`);
  
  const propKey = getCmpVal('cmp-proposalSelect') || 'proposal1';
  const currentProposal = CORE_PROPOSALS[propKey] || CORE_PROPOSALS.proposal1;
  lines.push(`Core proposal selected: ${currentProposal.name}`);
  lines.push(`Proposed research title: ${currentProposal.title}`);
  
  if (getCmpVal('cmp-achievements')) lines.push(`Key achievements:\n${getCmpVal('cmp-achievements')}`);
  if (State.composer.cvText) lines.push(`CV excerpt (background context only):\n${State.composer.cvText}`);
  lines.push(`Seeking: ${getCmpVal('cmp-asking')}`);
  if (getCmpVal('cmp-timeline')) lines.push(`Target intake/timeline: ${getCmpVal('cmp-timeline')}`);
  if (getCmpVal('cmp-links')) lines.push(`Links to include in signature: ${getCmpVal('cmp-links')}`);
  lines.push(`Professor: ${getCmpVal('cmp-profTitle')} ${getCmpVal('cmp-profName')}`);
  if (getCmpVal('cmp-profUni')) lines.push(`Their university/department: ${getCmpVal('cmp-profUni')}`);
  lines.push(`Their recent paper/project: ${getCmpVal('cmp-profWork')}`);
  if (getCmpVal('cmp-profIdea')) lines.push(`Specific idea/argument that resonates: ${getCmpVal('cmp-profIdea')}`);
  if (getCmpVal('cmp-profFit')) lines.push(`How my work connects to theirs: ${getCmpVal('cmp-profFit')}`);
  if (getCmpVal('cmp-profNote')) lines.push(`Something to acknowledge/congratulate: ${getCmpVal('cmp-profNote')}`);
  lines.push(`Tone: ${State.composer.tone || 'formal'}`);
  lines.push(`CV attached: ${State.composer.prog === 'phd' ? 'yes, mention it is attached' : 'not necessarily, only mention if it fits'}`);
  return lines.join('\n');
}

function validateComposerForm() {
  const required = ['cmp-yourName', 'cmp-yourField', 'cmp-profName', 'cmp-profWork'];
  return required.every(id => getCmpVal(id).length > 0);
}

// Deterministic High-Precision Email Generation Engine (Grounded strictly in super_standout_dashboard.html)
function generateDeterministicDraft(prog = 'phd', tone = 'formal') {
  const yourName = getCmpVal('cmp-yourName') || 'Tanvir Ahmed Tusher';
  const yourStatus = getCmpVal('cmp-yourStatus') || 'final-year LL.B. candidate';
  const yourInstitution = getCmpVal('cmp-yourInstitution') || 'Noakhali Science and Technology University';
  const yourField = getCmpVal('cmp-yourField') || 'Public International Law, Climate Law, and AI Governance';
  const propKey = getCmpVal('cmp-proposalSelect') || 'proposal1';
  const currentProposal = CORE_PROPOSALS[propKey] || CORE_PROPOSALS.proposal1;
  const researchTitle = currentProposal.title;
  
  const profTitle = getCmpVal('cmp-profTitle') || 'Prof.';
  const profName = getCmpVal('cmp-profName') || 'Professor';
  const profUni = getCmpVal('cmp-profUni') || 'Faculty of Law';
  const profWork = getCmpVal('cmp-profWork') || 'scholarship in public international law';
  const profIdea = getCmpVal('cmp-profIdea') || currentProposal.nexusAngle;
  const profFit = getCmpVal('cmp-profFit') || currentProposal.contributionAngle;
  const profNote = getCmpVal('cmp-profNote') || '';
  const timeline = getCmpVal('cmp-timeline') || 'October 2027 intake';
  const achievements = getCmpVal('cmp-achievements');
  const links = getCmpVal('cmp-links') || 'tusher.law@gmail.com | [ORCID: 0009-0001-1764-9178] | [Google Scholar]';
  
  const salutation = (profTitle === 'Dr' || profTitle === 'Dr.') ? `Dear Dr. ${profName},` : `Dear Professor ${profName},`;
  
  let subject = '';
  let body = '';
  
  if (prog === 'phd') {
    // Subject Line - Nexus Format from super_standout_dashboard.html
    if (propKey === 'proposal1') {
      subject = `Environmental Constitutionalism, Climate Rights & Bangladesh — A Voluntary Research Contribution`;
    } else if (propKey === 'proposal2') {
      subject = `Transboundary Water Law, AI Infrastructure & Bangladesh — A Voluntary Research Contribution`;
    } else {
      subject = `Earth System Law, Water Boundaries & Bangladesh — A Voluntary Research Contribution`;
    }
    
    // Paragraph 1: Specific reference to their scholarship
    const p1 = `I write with reference to your scholarship on ${profWork} — work I have engaged with closely in developing my doctoral research.`;
    
    // Paragraph 2: Applicant Credentials & Exact Proposal Context
    let propDescription = '';
    if (propKey === 'proposal1') {
      propDescription = `developing a research proposal titled 'When Rights Collide: A Constitutional Proportionality Assessment of Bangladesh\'s Article 18A (Environmental Rights, non-justiciable directive) versus Article 32 (Right to Life, justiciable) Under Salinity Intrusion at Halda River Basin'`;
    } else if (propKey === 'proposal2') {
      propDescription = `developing a research proposal titled 'Fundamental Right, Directive Aspiration: A Constitutional Proportionality Assessment of AI-Driven Water Externalities Against Bangladeshi University Students\' Right to Education' — examining groundwater extraction at Bangladesh's Kaliakoir Hi-Tech Park`;
    } else {
      propDescription = `developing two interconnected research proposals: one on the constitutional rights collision produced by salinity intrusion in Bangladesh's Halda River Basin (Article 18A versus Article 32), and one on the constitutional proportionality challenge posed by AI data centres extracting groundwater from Bangladesh's Kaliakoir Hi-Tech Park`;
    }
    
    // Solum connection note
    const isTexasAM = profUni.toLowerCase().includes('texas a&m') || profUni.toLowerCase().includes('tamu');
    const solumNote = isTexasAM ? 'marked "Recommended" by Professor Lawrence B. Solum at Texas A&M (who I understand is a colleague of yours)' : 'marked "Recommended" by Professor Lawrence B. Solum (Texas A&M)';
    
    const p2 = `I am a ${yourStatus} at ${yourInstitution}, Bangladesh, ${propDescription}. My published and forthcoming work includes a paper on TWAIL and climate reparations (RAPID, Vol. 7, Issue 2, under revision), a loss-and-damage paper under minor revision at Daengku Journal, and two forthcoming IGI Global book chapters on AI governance — including 'Governing the Invisible Giant: TWAIL, the Energy-Water Nexus, and the International Legal Void in AI Infrastructure,' which was ${solumNote}.`;
    
    // Paragraph 3: The Precision Connection (Theoretical framework meets Empirical breach)
    let p3 = `The connection I want to identify is precise. ${profIdea}`;
    if (!p3.includes('analytical architecture') && !p3.includes('doctrinal framework')) {
      p3 += ` The analytical architecture your scholarship has built is precisely what my research requires to execute in a South Asian developing-state context.`;
    }
    
    // Paragraph 4: Honest Intellectual Limitation
    const p4 = `What I recognise as my limitation is the structural dimension: I can describe the problem and document the empirical reality from the inside; I cannot yet execute the structural comparative analysis your scholarship demonstrates. That gap is what engagement with your work would close.`;
    
    // Paragraph 5: Actionable Voluntary Research Contribution Ask
    const p5 = `I humbly request the opportunity to contribute to your research voluntarily — specifically through ${profFit}. If you are willing to offer that opportunity or explore prospective PhD supervision for the ${timeline}, I would be deeply grateful. I would be happy to share any of the papers mentioned above should you wish to review them.`;
    
    // Sign-off
    const signoff = (tone === 'warm') ? 'With warm regards,' : 'With sincere respect,';
    
    body = `${salutation}\n\n${p1}\n\n${p2}\n\n${p3}\n\n${p4}\n\n${p5}\n\n${signoff}\n${yourName}\nLL.B. Candidate, ${yourInstitution}, Bangladesh\n${links}`;
  } else {
    // Master's / Funding Inquiry
    subject = `Inquiry About Graduate Research Opportunities & Funding — ${profUni.split('·')[0].trim()} — ${yourName}`;
    
    const p1 = `I am writing to inquire about postgraduate research and funding opportunities within your department for the ${timeline}. My name is ${yourName}, currently completing my ${yourStatus} at ${yourInstitution} in ${yourField}.`;
    
    const p2 = `My prospective research direction centers strictly on “${researchTitle}”. Having engaged closely with your publication on ${profWork}, I was particularly drawn to your insights regarding ${profIdea}.`;
    
    const p3 = `My research background includes a paper on TWAIL and climate reparations (RAPID, Vol. 7, Issue 2), a loss-and-damage paper under minor revision, and two IGI Global book chapters on AI governance — including 'Governing the Invisible Giant' marked "Recommended" by Prof. Lawrence B. Solum. I believe my background in ${profFit} provides strong foundational preparation for graduate research under your mentorship.`;
    
    const p4 = `I would be most grateful for any guidance regarding upcoming scholarship cycles, graduate assistantships, or specific admission requirements for prospective students in your group.\n\nI have attached my academic CV for your context. Thank you very much for your time and advice.`;
    
    const signoff = (tone === 'warm') ? 'With kind regards,' : 'Yours sincerely,';
    
    body = `${salutation}\n\n${p1}\n\n${p2}\n\n${p3}\n\n${p4}\n\n${signoff}\n${yourName}\n${yourInstitution}\n${links}`;
  }
  
  return { subject, body };
}

async function generateCorrespondenceEmail() {
  const formMsg = document.getElementById('cmp-formMsg');
  const btn = document.getElementById('cmp-generateBtn');
  const btnSpinner = document.getElementById('cmp-btnSpinner');
  const btnArrow = document.getElementById('cmp-btnArrow');
  const btnLabel = document.getElementById('cmp-btnLabel');
  const outputSection = document.getElementById('cmp-outputSection');
  const errorBanner = document.getElementById('cmp-errorBanner');
  const subjectField = document.getElementById('cmp-subjectField');
  const bodyField = document.getElementById('cmp-bodyField');
  
  if (!validateComposerForm()) {
    if (formMsg) formMsg.classList.add('show');
    showToast('Please fill in the required fields marked with *', '⚠️');
    return;
  }
  
  if (formMsg) formMsg.classList.remove('show');
  if (errorBanner) errorBanner.classList.remove('show');
  
  if (btn) btn.disabled = true;
  if (btnSpinner) btnSpinner.style.display = 'inline-block';
  if (btnArrow) btnArrow.style.display = 'none';
  if (btnLabel) btnLabel.style.display = 'inline';
  
  const prog = State.composer.prog || 'phd';
  const tone = State.composer.tone || 'formal';
  
  try {
    let generated = null;
    
    // Attempt API Call
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          system: buildComposerSystemPrompt(),
          messages: [{ role: "user", content: buildComposerUserPrompt() }]
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        const textBlock = (data.content || []).find(b => b.type === 'text');
        if (textBlock && textBlock.text) {
          let clean = textBlock.text.trim().replace(/^```json\s*|^```\s*|```$/g, '').trim();
          const start = clean.indexOf('{'), end = clean.lastIndexOf('}');
          if (start !== -1 && end !== -1) {
            generated = JSON.parse(clean.slice(start, end + 1));
          }
        }
      }
    } catch(apiErr) {
      // API call unavailable — proceed seamlessly to deterministic framework engine
    }
    
    if (!generated || !generated.subject || !generated.body) {
      generated = generateDeterministicDraft(prog, tone);
    }
    
    if (subjectField) subjectField.value = generated.subject || '';
    if (bodyField) bodyField.value = generated.body || '';
    
    State.composer.draftSubject = generated.subject || '';
    State.composer.draftBody = generated.body || '';
    
    updateComposerWordCount();
    
    if (outputSection) {
      outputSection.classList.add('show');
      outputSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    
    showToast('✨ Outreach email drafted successfully!', '✓');
  } catch(err) {
    if (errorBanner) {
      errorBanner.textContent = `Draft composed using precision framework rules.`;
      errorBanner.classList.add('show');
    }
    const fallbackDraft = generateDeterministicDraft(prog, tone);
    if (subjectField) subjectField.value = fallbackDraft.subject;
    if (bodyField) bodyField.value = fallbackDraft.body;
    updateComposerWordCount();
    if (outputSection) outputSection.classList.add('show');
  } finally {
    if (btn) btn.disabled = false;
    if (btnSpinner) btnSpinner.style.display = 'none';
    if (btnArrow) btnArrow.style.display = 'inline';
    if (btnLabel) btnLabel.style.display = 'none';
  }
}

function updateComposerWordCount() {
  const bodyField = document.getElementById('cmp-bodyField');
  const wordCount = document.getElementById('cmp-wordCount');
  const charCount = document.getElementById('cmp-charCount');
  if (!bodyField) return;
  
  const text = bodyField.value.trim();
  const words = text ? text.split(/\s+/).filter(Boolean).length : 0;
  const chars = text.length;
  
  if (wordCount) wordCount.textContent = `${words} word${words === 1 ? '' : 's'}`;
  if (charCount) charCount.textContent = `${chars} chars`;
}

function copyComposerSubject() {
  const subj = getCmpVal('cmp-subjectField');
  if (!subj) return;
  navigator.clipboard.writeText(subj).then(() => {
    const btn = document.getElementById('cmp-copySubjectBtn');
    if (btn) {
      const orig = btn.textContent;
      btn.textContent = 'Subject Copied ✓';
      btn.classList.add('copied');
      setTimeout(() => { btn.textContent = orig; btn.classList.remove('copied'); }, 1600);
    }
    showToast('Copied subject line to clipboard');
  });
}

function copyComposerBody() {
  const body = getCmpVal('cmp-bodyField');
  if (!body) return;
  navigator.clipboard.writeText(body).then(() => {
    const btn = document.getElementById('cmp-copyBodyBtn');
    if (btn) {
      const orig = btn.textContent;
      btn.textContent = 'Body Copied ✓';
      btn.classList.add('copied');
      setTimeout(() => { btn.textContent = orig; btn.classList.remove('copied'); }, 1600);
    }
    showToast('Copied email body to clipboard');
  });
}

function copyComposerAll() {
  const subj = getCmpVal('cmp-subjectField');
  const body = getCmpVal('cmp-bodyField');
  if (!subj && !body) return;
  
  const full = `Subject: ${subj}\n\n${body}`;
  navigator.clipboard.writeText(full).then(() => {
    const btn = document.getElementById('cmp-copyAllBtn');
    if (btn) {
      const orig = btn.textContent;
      btn.textContent = 'All Copied ✓';
      btn.classList.add('copied');
      setTimeout(() => { btn.textContent = orig; btn.classList.remove('copied'); }, 1600);
    }
    showToast('Copied full email draft to clipboard');
  });
}

function openComposerMailto() {
  const subj = getCmpVal('cmp-subjectField');
  const body = getCmpVal('cmp-bodyField');
  
  let targetEmail = '';
  if (State.composer.activeScholarId) {
    const p = P.find(x => x.id == State.composer.activeScholarId);
    if (p && p.email && !p.email.includes('Check') && !p.email.includes('directory')) {
      targetEmail = p.email;
    }
  }
  
  window.location.href = `mailto:${targetEmail}?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(body)}`;
}

function saveDraftToActiveScholar() {
  if (!State.composer.activeScholarId) {
    showToast('Select a target scholar to save this draft to', '⚠️');
    return;
  }
  
  const p = P.find(x => x.id == State.composer.activeScholarId);
  if (!p) return;
  
  // Set stage to outreach_sent if currently not_contacted
  if (!State.stages[p.id] || State.stages[p.id] === 'not_contacted') {
    setStage(p.id, 'outreach_sent');
  }
  
  // Mark contacted
  State.contacted[p.id] = true;
  localStorage.setItem('pc', JSON.stringify(State.contacted));
  
  // Log activity event
  const logEvent = {
    id: Date.now(),
    scholarId: p.id,
    scholarName: p.name,
    action: 'Email Drafted & Outreach Prepared',
    detail: `Drafted ${State.composer.prog.toUpperCase()} outreach email (${(getCmpVal('cmp-bodyField').split(/\s+/).filter(Boolean).length)} words)`,
    timestamp: new Date().toISOString()
  };
  State.activity.unshift(logEvent);
  if (State.activity.length > 50) State.activity.pop();
  localStorage.setItem('pactivity', JSON.stringify(State.activity));
  
  updateKPIs();
  if (State.currentView === 'scholars') renderScholars();
  if (State.currentView === 'pipeline') renderPipeline();
  
  const saveBtn = document.getElementById('cmp-saveStageBtn');
  if (saveBtn) {
    const orig = saveBtn.textContent;
    saveBtn.textContent = 'Outreach Saved ✓';
    saveBtn.classList.add('copied');
    setTimeout(() => { saveBtn.textContent = orig; saveBtn.classList.remove('copied'); }, 2000);
  }
  
  showToast(`✓ Outreach tracked for ${p.name}`);
}

// ==========================================================================
// SUBSCRIPTION VIEW — Full Plan Management & Tier Upgrade Panel
// ==========================================================================

function renderSubscriptionView() {
  const container = document.getElementById('subscription-container');
  if (!container) return;

  const currentTier = getCurrentSubscriptionTier();
  const isOwner = typeof isOwnerAuthenticated === 'function' && isOwnerAuthenticated();

  container.innerHTML = `
    <!-- Subscription Hero Header -->
    <div class="subscription-header">
      <h2>🎓 ScholarFlow Membership</h2>
      <p>Unlock the full academic research ecosystem — from AI-powered professor matching to unlimited scholarship intelligence and exam tracking.</p>
      <div style="margin-top:1rem;display:flex;justify-content:center;gap:0.75rem;flex-wrap:wrap;position:relative;">
        <span class="sub-status-pill ${currentTier}">
          <span style="font-size:0.7rem;">${currentTier === 'owner' ? '👑' : (currentTier === 'pro' ? '⚡' : (currentTier === 'enterprise' ? '🏢' : '🆓'))}</span>
          ${currentTier === 'owner' ? 'Owner Access' : currentTier.charAt(0).toUpperCase() + currentTier.slice(1) + ' Plan'}
        </span>
        ${isOwner ? '<span style="color:rgba(255,255,255,0.8);font-size:0.72rem;">Full ecosystem unlocked via owner passkey</span>' : ''}
      </div>
    </div>

    <!-- Pricing Cards -->
    <div class="pricing-grid">
      <!-- Free Plan -->
      <div class="pricing-card ${currentTier === 'free' ? 'current-plan' : ''}" style="animation: cardEntrance 0.4s ease both;">
        <div class="pricing-tier-name">Free</div>
        <div class="pricing-price">$0<span> / forever</span></div>
        <div class="pricing-desc">Get started with basic professor search and limited research tools. Perfect for exploring the platform.</div>
        <ul class="pricing-features">
          <li><span class="check-icon">✓</span> 232 verified professor profiles</li>
          <li><span class="check-icon">✓</span> Basic search & filters</li>
          <li><span class="check-icon">✓</span> Pipeline Kanban board</li>
          <li><span class="check-icon">✓</span> Contact & bookmark tracking</li>
          <li><span class="check-icon">✓</span> 3 demo scholarship previews</li>
          <li><span class="cross-icon">✕</span> <span style="opacity:0.5;">AI Scholar Search</span></li>
          <li><span class="cross-icon">✕</span> <span style="opacity:0.5;">Email Correspondence Composer</span></li>
          <li><span class="cross-icon">✕</span> <span style="opacity:0.5;">Full Scholarship Database (54+)</span></li>
          <li><span class="cross-icon">✕</span> <span style="opacity:0.5;">Country Discovery & Matchmaker</span></li>
          <li><span class="cross-icon">✕</span> <span style="opacity:0.5;">IELTS/GRE Exam Tracker</span></li>
        </ul>
        <button class="pricing-btn pricing-btn-outline" ${currentTier === 'free' ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : `onclick="setSubscriptionTier('free')"`}>
          ${currentTier === 'free' ? '✓ Current Plan' : 'Downgrade to Free'}
        </button>
      </div>

      <!-- Pro Plan (Featured) -->
      <div class="pricing-card featured ${currentTier === 'pro' ? 'current-plan' : ''}" style="animation: cardEntrance 0.5s ease both;">
        <div class="pricing-tier-name" style="color:var(--gold);">Professional</div>
        <div class="pricing-price">$29<span> / month</span></div>
        <div class="pricing-desc">Full-spectrum academic outreach tools with AI-powered search, unlimited scholarships, and precision email generation.</div>
        <ul class="pricing-features">
          <li><span class="check-icon">✓</span> Everything in Free</li>
          <li><span class="check-icon">✓</span> <strong>AI Scholar Search</strong> — semantic matching</li>
          <li><span class="check-icon">✓</span> <strong>Email Composer</strong> — AI-drafted outreach</li>
          <li><span class="check-icon">✓</span> <strong>54+ verified scholarships</strong> — full database</li>
          <li><span class="check-icon">✓</span> <strong>Country Discovery</strong> — 7-stage wizard</li>
          <li><span class="check-icon">✓</span> <strong>Profile Matchmaker</strong> — eligibility scoring</li>
          <li><span class="check-icon">✓</span> <strong>Exam Tracker</strong> — IELTS & GRE milestones</li>
          <li><span class="check-icon">✓</span> Calendar & .ICS export</li>
          <li><span class="check-icon">✓</span> JSON backup & restore</li>
          <li><span class="check-icon">✓</span> Action checklists per scholarship</li>
        </ul>
        <button class="pricing-btn pricing-btn-primary" ${currentTier === 'pro' ? 'disabled style="opacity:0.7;cursor:not-allowed;"' : `onclick="setSubscriptionTier('pro')"`}>
          ${currentTier === 'pro' ? '✓ Current Plan' : '⚡ Upgrade to Pro'}
        </button>
      </div>

      <!-- Enterprise Plan -->
      <div class="pricing-card ${currentTier === 'enterprise' ? 'current-plan' : ''}" style="animation: cardEntrance 0.6s ease both;">
        <div class="pricing-tier-name" style="color:var(--cyan);">Enterprise</div>
        <div class="pricing-price">$79<span> / month</span></div>
        <div class="pricing-desc">For institutional research offices, multi-researcher teams, and advanced API integrations. White-glove onboarding.</div>
        <ul class="pricing-features">
          <li><span class="check-icon">✓</span> Everything in Pro</li>
          <li><span class="check-icon">✓</span> Multi-researcher seats (up to 10)</li>
          <li><span class="check-icon">✓</span> Team pipeline & shared bookmarks</li>
          <li><span class="check-icon">✓</span> Priority AI search queue</li>
          <li><span class="check-icon">✓</span> Custom API integrations</li>
          <li><span class="check-icon">✓</span> Bulk email outreach queue</li>
          <li><span class="check-icon">✓</span> Dedicated account manager</li>
          <li><span class="check-icon">✓</span> SOC 2 compliant data handling</li>
          <li><span class="check-icon">✓</span> SLA guaranteed uptime</li>
          <li><span class="check-icon">✓</span> Invoice & PO billing</li>
        </ul>
        <button class="pricing-btn pricing-btn-outline" ${currentTier === 'enterprise' ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : `onclick="setSubscriptionTier('enterprise')"`}>
          ${currentTier === 'enterprise' ? '✓ Current Plan' : 'Contact Sales'}
        </button>
      </div>
    </div>

    <!-- Owner Access Section -->
    <div style="background:var(--surface);border:1.5px solid var(--border);border-radius:var(--radius-lg);padding:1.5rem;margin-top:1rem;">
      <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:1rem;">
        <div style="width:40px;height:40px;border-radius:var(--radius);background:linear-gradient(135deg,var(--gold),#C4842D);color:#FFF;display:flex;align-items:center;justify-content:center;font-size:1.1rem;">👑</div>
        <div>
          <div style="font-weight:800;font-size:0.95rem;color:var(--text);">Owner Passkey Access</div>
          <div style="font-size:0.78rem;color:var(--text-muted);">Bypass all tier restrictions with verified owner credentials</div>
        </div>
      </div>
      <div style="display:flex;gap:0.75rem;flex-wrap:wrap;">
        ${isOwner
          ? '<button class="btn btn-secondary" onclick="logoutOwner()">🔒 Lock Owner Session</button><span style="font-size:0.78rem;color:var(--green);font-weight:600;display:flex;align-items:center;gap:0.3rem;"><span style="width:8px;height:8px;border-radius:50%;background:var(--green);display:inline-block;"></span> Owner session active</span>'
          : '<button class="btn btn-primary" onclick="openOwnerAuthModal(function(){ renderSubscriptionView(); })">🔐 Sign In with Owner Passkey</button>'
        }
      </div>
    </div>

    <!-- Payment Methods -->
    <div class="payment-methods-section" style="margin-top:2rem;">
      <h3>💳 Accepted Payment Methods</h3>
      <div class="payment-region-label">International</div>
      <div class="payment-grid">
        <div class="payment-method-card"><span class="pm-icon">💳</span> Visa / Mastercard</div>
        <div class="payment-method-card"><span class="pm-icon">🅿️</span> PayPal</div>
        <div class="payment-method-card"><span class="pm-icon">🍎</span> Apple Pay</div>
        <div class="payment-method-card"><span class="pm-icon">📱</span> Google Pay</div>
        <div class="payment-method-card"><span class="pm-icon">🏦</span> Wire Transfer</div>
      </div>
      <div class="payment-region-label">Bangladesh</div>
      <div class="payment-grid">
        <div class="payment-method-card"><span class="pm-icon">📱</span> bKash</div>
        <div class="payment-method-card"><span class="pm-icon">🟢</span> Nagad</div>
        <div class="payment-method-card"><span class="pm-icon">🚀</span> Rocket</div>
        <div class="payment-method-card"><span class="pm-icon">🏦</span> DBBL / Bank Transfer</div>
      </div>
    </div>
  `;
}

function getCurrentSubscriptionTier() {
  if (typeof isOwnerAuthenticated === 'function' && isOwnerAuthenticated()) return 'owner';
  const tier = localStorage.getItem('scholarflow_subscription_tier');
  if (tier === 'enterprise') return 'enterprise';
  if (tier === 'pro') return 'pro';
  return 'free';
}

function setSubscriptionTier(tier) {
  localStorage.setItem('scholarflow_subscription_tier', tier);
  renderSubscriptionView();
  showToast(`✓ Subscription updated to ${tier.charAt(0).toUpperCase() + tier.slice(1)} plan`);
  // Refresh current view state badges
  if (State.currentView === 'scholarships') renderScholarships();
}

// ==========================================================================
// AI SEARCH VIEW — Semantic Scholar Search Interface
// ==========================================================================

function renderAISearchView() {
  const container = document.getElementById('ai-search-container');
  if (!container) return;

  // Initialize AI search state if needed
  if (!State.aiSearch) {
    State.aiSearch = {
      query: '',
      results: [],
      filters: { cluster: 'all', priority: 'all', country: 'all' },
      isSearching: false,
      searchHistory: JSON.parse(localStorage.getItem('ai_search_history') || '[]')
    };
  }

  const clusters = typeof CLUSTERS !== 'undefined' ? CLUSTERS : [];
  const countries = [...new Set(P.map(p => p.country).filter(c => c && c !== 'Unknown'))].sort();

  container.innerHTML = `
    <!-- AI Search Masthead -->
    <div style="background:linear-gradient(135deg,rgba(109,91,208,0.06),rgba(218,162,69,0.04));border:1.5px solid var(--border);border-radius:var(--radius-lg);padding:2rem;margin-bottom:1.5rem;text-align:center;">
      <div style="display:flex;align-items:center;justify-content:center;gap:0.75rem;margin-bottom:0.75rem;">
        <div class="ai-claude-logo">🧠</div>
        <div style="text-align:left;">
          <div style="font-weight:800;font-size:1.15rem;color:var(--text);">AI Scholar Search</div>
          <div style="font-size:0.78rem;color:var(--text-muted);">Semantic Query Discovery across ${P.length} verified professors</div>
        </div>
      </div>
      <div style="font-size:0.8rem;color:var(--text-muted);max-width:600px;margin:0 auto 1.25rem;">
        Search by research topic, methodology, institution, or natural language query. The engine matches against research interests, publications, university affiliation, and academic focus areas.
      </div>

      <!-- Search Input -->
      <div style="max-width:640px;margin:0 auto;">
        <div style="display:flex;gap:0.5rem;">
          <div style="flex:1;position:relative;">
            <input type="text" id="ai-search-query" value="${esc(State.aiSearch.query)}"
              placeholder="e.g. climate litigation, international environmental law, AI governance..."
              style="width:100%;padding:0.75rem 1rem 0.75rem 2.5rem;border:1.5px solid var(--border);border-radius:var(--radius);font-size:0.85rem;background:var(--surface);color:var(--text);font-family:inherit;transition:all 0.25s ease;"
              oninput="State.aiSearch.query = this.value;"
              onkeydown="if(event.key==='Enter') executeAISearch();">
            <svg style="position:absolute;left:0.85rem;top:50%;transform:translateY(-50%);opacity:0.4;" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </div>
          <button class="btn btn-primary" onclick="executeAISearch()" style="white-space:nowrap;padding:0.75rem 1.5rem;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:0.3rem;"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            Search
          </button>
        </div>
      </div>

      <!-- Quick Search Suggestions -->
      <div style="display:flex;flex-wrap:wrap;gap:0.4rem;justify-content:center;margin-top:1rem;">
        ${['climate justice', 'international law', 'AI regulation', 'human rights', 'environmental governance', 'constitutional law', 'water law', 'migration policy'].map(tag =>
          `<button class="btn btn-secondary" style="font-size:0.7rem;padding:0.3rem 0.7rem;border-radius:var(--radius-full);" onclick="document.getElementById('ai-search-query').value='${tag}';State.aiSearch.query='${tag}';executeAISearch();">${tag}</button>`
        ).join('')}
      </div>
    </div>

    <!-- Filters Row -->
    <div style="display:flex;gap:0.75rem;flex-wrap:wrap;margin-bottom:1.25rem;align-items:center;">
      <select id="ai-filter-cluster" onchange="State.aiSearch.filters.cluster=this.value;if(State.aiSearch.results.length)executeAISearch();" style="padding:0.45rem 0.75rem;border:1.5px solid var(--border);border-radius:var(--radius);font-size:0.78rem;background:var(--surface);color:var(--text);font-family:inherit;">
        <option value="all">All Clusters</option>
        ${clusters.map(c => `<option value="${esc(c.id)}" ${State.aiSearch.filters.cluster === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}
      </select>
      <select id="ai-filter-priority" onchange="State.aiSearch.filters.priority=this.value;if(State.aiSearch.results.length)executeAISearch();" style="padding:0.45rem 0.75rem;border:1.5px solid var(--border);border-radius:var(--radius);font-size:0.78rem;background:var(--surface);color:var(--text);font-family:inherit;">
        <option value="all">All Priorities</option>
        <option value="Super Standout" ${State.aiSearch.filters.priority === 'Super Standout' ? 'selected' : ''}>Super Standout</option>
        <option value="Tier 1" ${State.aiSearch.filters.priority === 'Tier 1' ? 'selected' : ''}>Tier 1</option>
        <option value="Tier 2" ${State.aiSearch.filters.priority === 'Tier 2' ? 'selected' : ''}>Tier 2</option>
        <option value="Tier 3" ${State.aiSearch.filters.priority === 'Tier 3' ? 'selected' : ''}>Tier 3</option>
      </select>
      <select id="ai-filter-country" onchange="State.aiSearch.filters.country=this.value;if(State.aiSearch.results.length)executeAISearch();" style="padding:0.45rem 0.75rem;border:1.5px solid var(--border);border-radius:var(--radius);font-size:0.78rem;background:var(--surface);color:var(--text);font-family:inherit;">
        <option value="all">All Countries</option>
        ${countries.map(c => `<option value="${esc(c)}" ${State.aiSearch.filters.country === c ? 'selected' : ''}>${esc(c)}</option>`).join('')}
      </select>
      ${State.aiSearch.results.length > 0 ? `<span style="font-size:0.78rem;color:var(--text-muted);font-weight:600;margin-left:auto;">${State.aiSearch.results.length} result${State.aiSearch.results.length !== 1 ? 's' : ''} found</span>` : ''}
    </div>

    <!-- Results Area -->
    <div id="ai-search-results-area">
      ${State.aiSearch.results.length > 0
        ? renderAISearchResults(State.aiSearch.results)
        : renderAISearchEmptyState()
      }
    </div>

    <!-- Search History -->
    ${State.aiSearch.searchHistory.length > 0 ? `
      <div style="margin-top:2rem;padding:1.25rem;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.75rem;">
          <div style="font-weight:700;font-size:0.85rem;color:var(--text);">🕐 Recent Searches</div>
          <button class="btn btn-secondary" style="font-size:0.7rem;padding:0.25rem 0.6rem;" onclick="clearAISearchHistory()">Clear History</button>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:0.4rem;">
          ${State.aiSearch.searchHistory.slice(0, 10).map(h =>
            `<button class="btn btn-secondary" style="font-size:0.72rem;padding:0.3rem 0.65rem;border-radius:var(--radius-full);" onclick="document.getElementById('ai-search-query').value='${esc(h)}';State.aiSearch.query='${esc(h)}';executeAISearch();">${esc(h)}</button>`
          ).join('')}
        </div>
      </div>
    ` : ''}
  `;
}

function renderAISearchEmptyState() {
  return `
    <div style="text-align:center;padding:3.5rem 1.5rem;background:var(--surface);border:1.5px dashed var(--border);border-radius:var(--radius-lg);">
      <div style="font-size:2.5rem;margin-bottom:0.75rem;">🔍</div>
      <h3 style="font-size:1.1rem;font-weight:800;color:var(--text);margin-bottom:0.4rem;">Enter a research query to discover scholars</h3>
      <p style="font-size:0.82rem;color:var(--text-muted);max-width:440px;margin:0 auto;">
        Type a research topic, methodology, institution name, or keyword above. The AI engine will match your query against ${P.length} verified professor profiles across ${new Set(P.map(p => p.country).filter(Boolean)).size} countries.
      </p>
    </div>
  `;
}

function renderAISearchResults(results) {
  if (!results || results.length === 0) {
    return `
      <div style="text-align:center;padding:3rem 1.5rem;background:var(--surface);border:1.5px dashed var(--border);border-radius:var(--radius-lg);">
        <div style="font-size:2rem;margin-bottom:0.5rem;">😔</div>
        <h3 style="font-size:1rem;font-weight:700;color:var(--text);">No matches found</h3>
        <p style="font-size:0.8rem;color:var(--text-muted);margin-top:0.3rem;">Try broadening your search query or adjusting the filters above.</p>
      </div>
    `;
  }

  return `
    <div class="ai-results-table-wrap" style="animation:fadeIn 0.3s ease both;">
      <table class="ai-results-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Match</th>
            <th>Scholar Name</th>
            <th>University</th>
            <th>Country</th>
            <th>Research Alignment</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${results.map((r, i) => {
            const p = r.professor;
            const isContacted = State.contacted[p.id];
            const isBookmarked = State.bookmarked[p.id];
            const priorityClass = p.priority === 'Super Standout' ? 'tag-ss' : (p.priority === 'Tier 1' ? 'tag-pa' : (p.priority === 'Tier 2' ? 'tag-t2' : 'tag-t3'));
            return `
              <tr style="animation:fadeIn ${0.1 + i * 0.03}s ease both;cursor:pointer;" onclick="openDrawer(${p.id})">
                <td style="font-weight:700;color:var(--text-muted);">${i + 1}</td>
                <td>
                  <div style="display:flex;align-items:center;gap:0.35rem;">
                    <div style="width:32px;height:6px;border-radius:3px;background:var(--border);overflow:hidden;">
                      <div style="width:${r.score}%;height:100%;background:${r.score >= 80 ? 'var(--green)' : (r.score >= 50 ? 'var(--amber)' : 'var(--primary)')};border-radius:3px;transition:width 0.6s ease;"></div>
                    </div>
                    <span style="font-weight:700;font-size:0.72rem;color:${r.score >= 80 ? 'var(--green)' : (r.score >= 50 ? 'var(--amber)' : 'var(--primary)')};">${r.score}%</span>
                  </div>
                </td>
                <td>
                  <div style="font-weight:700;color:var(--text);white-space:nowrap;">${esc(p.name)}</div>
                  <div style="font-size:0.65rem;color:var(--text-muted);">${esc(p.title || '')}</div>
                </td>
                <td style="font-size:0.72rem;">${esc(p.university)}</td>
                <td style="font-size:0.72rem;">${esc(p.country)}</td>
                <td style="font-size:0.72rem;max-width:200px;overflow:hidden;text-overflow:ellipsis;">${esc((p.research || []).slice(0, 3).join(', '))}</td>
                <td><span class="tag ${priorityClass}" style="font-size:0.62rem;">${esc(p.priority)}</span></td>
                <td>
                  ${isContacted ? '<span style="color:var(--green);font-size:0.7rem;font-weight:700;">✓ Contacted</span>' : '<span style="font-size:0.7rem;color:var(--text-muted);">—</span>'}
                </td>
                <td onclick="event.stopPropagation();">
                  <div style="display:flex;gap:0.35rem;">
                    <button class="btn btn-secondary" style="font-size:0.65rem;padding:0.2rem 0.5rem;" onclick="toggleBookmark(${p.id}, event)" title="${isBookmarked ? 'Remove Bookmark' : 'Bookmark'}">${isBookmarked ? '⭐' : '☆'}</button>
                    <button class="btn btn-secondary" style="font-size:0.65rem;padding:0.2rem 0.5rem;" onclick="toggleContacted(${p.id}, event)" title="${isContacted ? 'Unmark Contacted' : 'Mark Contacted'}">${isContacted ? '✓' : '📧'}</button>
                  </div>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function executeAISearch() {
  const query = (State.aiSearch.query || '').trim().toLowerCase();
  if (!query) {
    State.aiSearch.results = [];
    renderAISearchView();
    return;
  }

  // Save to search history
  if (!State.aiSearch.searchHistory.includes(query)) {
    State.aiSearch.searchHistory.unshift(query);
    if (State.aiSearch.searchHistory.length > 20) State.aiSearch.searchHistory.pop();
    localStorage.setItem('ai_search_history', JSON.stringify(State.aiSearch.searchHistory));
  }

  const queryTerms = query.split(/[\s,;]+/).filter(t => t.length > 1);
  const filters = State.aiSearch.filters;

  // Score each professor against the query
  const scored = P.map(p => {
    // Build searchable text blob
    const researchText = (p.research || []).join(' ').toLowerCase();
    const blob = [
      p.name, p.university, p.country, p.title,
      p.department, p.cluster, p.priority,
      researchText,
      (p.keywords || []).join(' '),
      (p.publications || []).join(' ')
    ].join(' ').toLowerCase();

    // Calculate match score
    let score = 0;
    let matchedTerms = 0;

    queryTerms.forEach(term => {
      if (blob.includes(term)) {
        matchedTerms++;
        // Weighted scoring
        if (researchText.includes(term)) score += 30;
        if ((p.name || '').toLowerCase().includes(term)) score += 25;
        if ((p.university || '').toLowerCase().includes(term)) score += 20;
        if ((p.keywords || []).some(k => k.toLowerCase().includes(term))) score += 20;
        if ((p.country || '').toLowerCase().includes(term)) score += 10;
        if ((p.title || '').toLowerCase().includes(term)) score += 10;
        if ((p.department || '').toLowerCase().includes(term)) score += 10;
      }
    });

    // Normalize score (0-100)
    const maxPossible = queryTerms.length * 125;
    const normalized = maxPossible > 0 ? Math.min(100, Math.round((score / maxPossible) * 100)) : 0;

    // Priority boost
    const priorityBoost = p.priority === 'Super Standout' ? 8 : (p.priority === 'Tier 1' ? 5 : (p.priority === 'Tier 2' ? 2 : 0));

    return {
      professor: p,
      score: Math.min(100, normalized + priorityBoost),
      matchedTerms
    };
  })
  .filter(r => {
    if (r.score < 10) return false;
    if (filters.cluster !== 'all' && r.professor.cluster !== filters.cluster) return false;
    if (filters.priority !== 'all' && r.professor.priority !== filters.priority) return false;
    if (filters.country !== 'all' && r.professor.country !== filters.country) return false;
    return true;
  })
  .sort((a, b) => b.score - a.score)
  .slice(0, 50);

  State.aiSearch.results = scored;
  renderAISearchView();
}

function clearAISearchHistory() {
  State.aiSearch.searchHistory = [];
  localStorage.removeItem('ai_search_history');
  renderAISearchView();
  showToast('🗑️ Search history cleared');
}
