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
  profilePhoto: localStorage.getItem('profilePhoto') || 'tusher-profile-photo.png',
  
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
  
  // Update Nav highlighting
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === viewName);
  });
  
  // Update Topbar View Title
  const titles = {
    overview: { title: 'Overview', breadcrumb: 'Dashboard / Ecosystem Metrics' },
    scholars: { title: 'Scholars Directory', breadcrumb: 'Directory / 214 Verified Researchers' },
    pipeline: { title: 'Outreach Pipeline', breadcrumb: 'Workflow / Kanban Stage Tracking' },
    clusters: { title: 'Research Clusters', breadcrumb: 'Domains / 8 Thematic Focus Areas' },
    priority: { title: 'Priority Targets', breadcrumb: 'Shortlist / Super Standout & Tier 1' },
    analytics: { title: 'Analytics & Insights', breadcrumb: 'Intelligence / Distribution & Funnels' },
    profile: { title: 'Researcher Profile', breadcrumb: 'Academic Curriculum Vitae & Portfolio' }
  };
  
  const vMeta = titles[viewName] || { title: 'Dashboard', breadcrumb: 'Overview' };
  document.getElementById('topbar-view-title').textContent = vMeta.title;
  document.getElementById('topbar-breadcrumb').textContent = vMeta.breadcrumb;
  
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
  if (viewName === 'analytics') renderAnalytics();
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
  
  container.innerHTML = STAGES.map(stg => {
    const stageProfs = P.filter(p => (State.stages[p.id] || 'not_contacted') === stg.id);
    
    return `
      <div class="kanban-column" ondragover="handleDragOver(event)" ondrop="handleDrop(event, '${stg.id}')">
        <div class="kanban-col-header">
          <div class="col-header-left">
            <span class="col-indicator indicator-${stg.id}"></span>
            <span class="col-title">${esc(stg.label)}</span>
          </div>
          <span class="col-count-badge">${stageProfs.length}</span>
        </div>
        
        <div class="kanban-cards-list">
          ${stageProfs.map(p => {
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
                  <select class="custom-select" style="font-size:0.65rem;padding:0.15rem 0.4rem;" onchange="setStage(${p.id}, this.value, event)">
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

// Global Initialization
document.addEventListener('DOMContentLoaded', () => {
  initStages();
  
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

// Mobile sidebar toggle
function toggleMobileSidebar() {
  const sidebar = document.getElementById('app-sidebar');
  if (sidebar) sidebar.classList.toggle('open');
}

// ==========================================================================
// 8. RESEARCHER PROFILE LOGIC & ACTIONS
// ==========================================================================

function renderProfile() {
  const p = State.profile || (typeof DEFAULT_PROFILE_DATA !== 'undefined' ? DEFAULT_PROFILE_DATA : {});
  const photo = State.profilePhoto || 'tusher-profile-photo.png';
  const container = document.getElementById('profile-container');
  if (!container) return;

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
          <button class="btn btn-primary" onclick="openProfileEditModal()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            <span>Edit Profile</span>
          </button>
          
          <button class="btn btn-secondary" onclick="document.getElementById('photo-upload-input').click()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
            <span>Change Photo</span>
          </button>
          
          <button class="btn btn-secondary" onclick="exportProfileMarkdown()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            <span>Download CV (.md)</span>
          </button>
          
          <button class="btn btn-secondary" onclick="window.print()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
            <span>Print CV</span>
          </button>
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
  `;

  document.getElementById('profile-edit-modal-backdrop').classList.add('open');
}

function closeProfileEditModal() {
  document.getElementById('profile-edit-modal-backdrop').classList.remove('open');
}

function saveProfileEdits() {
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
  
  State.profile = p;
  localStorage.setItem('profileData', JSON.stringify(p));
  closeProfileEditModal();
  renderProfile();
  showToast('Academic profile updated');
}

function resetProfileToDefaults() {
  if (confirm('Are you sure you want to reset your profile to the original CV defaults? Any edits will be discarded.')) {
    localStorage.removeItem('profileData');
    State.profile = JSON.parse(JSON.stringify(DEFAULT_PROFILE_DATA));
    closeProfileEditModal();
    renderProfile();
    showToast('Reset to original CV data');
  }
}

// Download Structured Markdown CV
function exportProfileMarkdown() {
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
  showToast('Downloaded Tanvir_Ahmed_Tusher_CV.md');
}

