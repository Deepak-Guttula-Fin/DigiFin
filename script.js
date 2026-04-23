/* ═══════════════════════════════════════════════════════════
   DIGIFIN — script.js
   ═══════════════════════════════════════════════════════════ */

// ── Global State ────────────────────────────────────────────
let userProfile = null;
let transactions = [];
let charts = {};

const categoryMapping = {
  needs: ['Home','Mobile','Travel','Health','Education'],
  wants: ['Food','Entertainment','Others','Lending','Write-off'],
  savings: ['SIP','Shares','Asset Savings'],
  income: ['Salary','Other Income']
};

const subTypes = {
  income: ['Salary','Other Income'],
  expense: ['Home','Mobile','Travel','Health','Education','Food','Entertainment','Others','Lending','Write-off'],
  investment: ['SIP','Shares','Asset Savings']
};

// ── Init ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadData();
  initNav();
  initSidebar();
  initClock();
  initEntryModal();
  initSettings();
  initWelcome();
  initTabNav();
  initTableActions();

  if (!userProfile) {
    document.getElementById('welcome-modal').classList.add('active');
  } else {
    updateAll();
  }
});

// ── Data Persistence ─────────────────────────────────────────
function loadData() {
  try {
    const p = localStorage.getItem('df_profile');
    const t = localStorage.getItem('df_transactions');
    if (p) userProfile = JSON.parse(p);
    if (t) transactions = JSON.parse(t);
  } catch(e) { console.error('Load error', e); }
}

function saveData() {
  try {
    localStorage.setItem('df_profile', JSON.stringify(userProfile));
    localStorage.setItem('df_transactions', JSON.stringify(transactions));
  } catch(e) { console.error('Save error', e); }
}

// ── Clock ────────────────────────────────────────────────────
function initClock() {
  const el = document.getElementById('live-clock');
  if (!el) return;
  const tick = () => {
    const now = new Date();
    const h = String(now.getHours()).padStart(2,'0');
    const m = String(now.getMinutes()).padStart(2,'0');
    const s = String(now.getSeconds()).padStart(2,'0');
    el.textContent = `${h}:${m}:${s}`;
  };
  tick();
  setInterval(tick, 1000);
}

// ── Sidebar / Hamburger ──────────────────────────────────────
function initSidebar() {
  const sidebar = document.getElementById('sidebar');
  const btn = document.getElementById('hamburger-btn');

  // Create overlay
  const overlay = document.createElement('div');
  overlay.className = 'sidebar-overlay';
  overlay.id = 'sidebar-overlay';
  document.body.appendChild(overlay);

  const close = () => {
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
  };

  btn?.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('active');
  });
  overlay.addEventListener('click', close);
}

// ── Navigation ───────────────────────────────────────────────
const viewTitles = {
  dashboard: 'Dashboard',
  analytics: 'Analytics',
  datacenter: 'Data Center',
  settings: 'Settings'
};

function initNav() {
  const allLinks = document.querySelectorAll('[data-view]');
  allLinks.forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const view = link.dataset.view;
      switchView(view);
      // Close sidebar on mobile
      document.getElementById('sidebar')?.classList.remove('open');
      document.getElementById('sidebar-overlay')?.classList.remove('active');
    });
  });
}

function switchView(view) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById(`${view}-view`)?.classList.add('active');

  document.querySelectorAll('[data-view]').forEach(l => {
    l.classList.toggle('active', l.dataset.view === view);
  });

  document.getElementById('page-title').textContent = viewTitles[view] || view;

  if (view === 'dashboard')   updateDashboard();
  if (view === 'analytics')   setTimeout(updateAnalytics, 50);
  if (view === 'datacenter')  updateDataCenter();
  if (view === 'settings')    syncSettingsForm();
}

// ── Welcome Modal ────────────────────────────────────────────
function initWelcome() {
  document.querySelectorAll('.char-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.char-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
    });
  });

  document.getElementById('welcome-avatar-upload')?.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      // Store temporarily
      window._uploadedAvatar = ev.target.result;
      // Show visual feedback
      toast('Image uploaded! Complete setup to apply.', 'success');
    };
    reader.readAsDataURL(file);
  });

  document.getElementById('complete-setup-btn')?.addEventListener('click', completeSetup);
}

window.showWelcomeStep = function(n) {
  document.querySelectorAll('.modal-step').forEach(s => s.classList.remove('active'));
  document.getElementById(`welcome-step-${n}`)?.classList.add('active');
};

function completeSetup() {
  const name   = document.getElementById('welcome-name').value.trim();
  const age    = document.getElementById('welcome-age').value;
  const gender = document.getElementById('welcome-gender').value;
  const email  = document.getElementById('welcome-email').value.trim();
  const budget = document.getElementById('welcome-budget').value;

  if (!name || !age || !gender || !email || !budget) {
    toast('Please fill in all profile fields', 'error');
    showWelcomeStep(1);
    return;
  }

  const selected = document.querySelector('.char-card.selected');
  const label = selected ? selected.dataset.label : 'User';
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2);

  userProfile = {
    name, age: parseInt(age), gender, email,
    budget: parseFloat(budget),
    characterLabel: label,
    characterAvatar: window._uploadedAvatar || null,
    initials
  };

  saveData();
  document.getElementById('welcome-modal').classList.remove('active');
  updateAll();
  toast(`Welcome to DigiFin, ${name}!`, 'success');
}

// ── Update All ───────────────────────────────────────────────
function updateAll() {
  updateUserProfile();
  updateDashboard();
}

function updateUserProfile() {
  if (!userProfile) return;
  const initials = userProfile.initials || userProfile.name.charAt(0).toUpperCase();

  // Profile bar
  document.getElementById('user-name').textContent = `Welcome, ${userProfile.name}`;
  document.getElementById('user-email').textContent = userProfile.email;
  document.getElementById('user-details').textContent = `Age: ${userProfile.age} · Gender: ${userProfile.gender}`;
  document.getElementById('budget-display').textContent = `₹${Number(userProfile.budget).toLocaleString('en-IN')}`;

  // Avatar
  const fallback = document.getElementById('avatar-fallback');
  const img = document.getElementById('user-avatar');
  if (fallback) fallback.textContent = initials;

  if (userProfile.characterAvatar) {
    img.src = userProfile.characterAvatar;
    img.classList.add('loaded');
    if (fallback) fallback.style.display = 'none';
  }

  // Sidebar chip
  const chip = document.getElementById('sidebar-avatar');
  if (chip) {
    if (userProfile.characterAvatar) {
      chip.style.backgroundImage = `url(${userProfile.characterAvatar})`;
      chip.style.backgroundSize = 'cover';
      chip.textContent = '';
    } else {
      chip.textContent = initials;
    }
  }
  document.getElementById('sidebar-name').textContent = userProfile.name;
}

// ── Dashboard ────────────────────────────────────────────────
function updateDashboard() {
  if (!userProfile) return;
  updateUserProfile();
  updateFinancialWidgets();
  updateAlerts();
  updateReminders();
  updateRecentTransactions();
}

function calculateTotals() {
  const income = transactions.filter(t => t.category === 'income').reduce((s,t) => s+t.amount, 0);
  const expenses = transactions.filter(t => t.category === 'expense').reduce((s,t) => s+t.amount, 0);
  const invBuys = transactions.filter(t => t.category === 'investment' && t.transactionType === 'buy').reduce((s,t) => s+t.amount, 0);
  const invSells = transactions.filter(t => t.category === 'investment' && t.transactionType === 'sell').reduce((s,t) => s+t.amount, 0);
  const investments = invBuys - invSells;
  const balance = income + invSells - expenses - invBuys;
  return { income, expenses, investments, balance };
}

function fmtRs(v) {
  return '₹' + Math.abs(v).toLocaleString('en-IN', {minimumFractionDigits:2, maximumFractionDigits:2});
}

function updateFinancialWidgets() {
  const t = calculateTotals();
  document.getElementById('total-balance').textContent = (t.balance < 0 ? '-' : '') + fmtRs(t.balance);
  document.getElementById('total-expenses').textContent = fmtRs(t.expenses);
  document.getElementById('total-investments').textContent = fmtRs(t.investments);
}

function updateAlerts() {
  const container = document.getElementById('alerts-container');
  container.innerHTML = '';

  const t = calculateTotals();
  if (t.balance < 0) {
    container.insertAdjacentHTML('beforeend', `
      <div class="alert alert-warning">
        <i class="fas fa-exclamation-triangle"></i>
        <div><strong>Negative Balance</strong> Your net balance is ${fmtRs(t.balance)} in the red. Review your spending.</div>
      </div>`);
  }

  const now = new Date();
  const monthExp = transactions
    .filter(tx => {
      const d = new Date(tx.date);
      return tx.category === 'expense' && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((s,tx) => s+tx.amount, 0);

  if (userProfile && monthExp > userProfile.budget) {
    container.insertAdjacentHTML('beforeend', `
      <div class="alert alert-warning">
        <i class="fas fa-exclamation-circle"></i>
        <div><strong>Budget Exceeded</strong> This month's expenses (${fmtRs(monthExp)}) exceed your budget (${fmtRs(userProfile.budget)}).</div>
      </div>`);
  }
}

function updateReminders() {
  const el = document.getElementById('reminders-list');
  const reminders = transactions.filter(t => t.setReminder)
    .sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0,6);

  if (!reminders.length) { el.innerHTML = '<p class="empty-state">No reminders set</p>'; return; }

  el.innerHTML = reminders.map(r => `
    <div class="tx-item">
      <div class="tx-icon reminder"><i class="fas fa-bell"></i></div>
      <div class="tx-info">
        <p class="tx-name">${r.note || r.subType}</p>
        <p class="tx-sub">${r.subType} · ${new Date(r.date).toLocaleDateString('en-IN')}</p>
      </div>
      <span class="tx-amount expense">${fmtRs(r.amount)}</span>
      <button class="tx-action-btn" onclick="removeReminder('${r.id}')" title="Remove"><i class="fas fa-times"></i></button>
    </div>`).join('');
}

function updateRecentTransactions() {
  const el = document.getElementById('recent-transactions-list');
  const recent = [...transactions].sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0,7);

  if (!recent.length) { el.innerHTML = '<p class="empty-state">No transactions yet</p>'; return; }

  const icons = { income: 'fas fa-arrow-trend-up', expense: 'fas fa-arrow-trend-down', investment: 'fas fa-seedling' };
  el.innerHTML = recent.map(tx => `
    <div class="tx-item">
      <div class="tx-icon ${tx.category}"><i class="${icons[tx.category] || 'fas fa-circle'}"></i></div>
      <div class="tx-info">
        <p class="tx-name">${tx.subType}${tx.note ? ' — ' + tx.note : ''}</p>
        <p class="tx-sub">${new Date(tx.date).toLocaleDateString('en-IN')} · ${tx.category}</p>
      </div>
      <span class="tx-amount ${tx.category}">${tx.category === 'income' ? '+' : '-'}${fmtRs(tx.amount)}</span>
    </div>`).join('');
}

window.removeReminder = function(id) {
  const tx = transactions.find(t => t.id === id);
  if (tx) { tx.setReminder = false; saveData(); updateDashboard(); toast('Reminder removed', 'success'); }
};

// ── Entry Modal ───────────────────────────────────────────────
function initEntryModal() {
  document.getElementById('add-entry-btn')?.addEventListener('click', openEntryModal);
  document.getElementById('add-entry-btn-sidebar')?.addEventListener('click', openEntryModal);
  document.getElementById('entry-category')?.addEventListener('change', updateSubTypes);
  document.getElementById('entry-subtype')?.addEventListener('change', updateTransactionTypeVisibility);
  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById(btn.dataset.close)?.classList.remove('active');
    });
  });
  document.getElementById('entry-date').valueAsDate = new Date();
}

function openEntryModal() {
  document.getElementById('entry-modal').classList.add('active');
  document.getElementById('entry-date').valueAsDate = new Date();
}

window.closeEntryModal = function() {
  document.getElementById('entry-modal').classList.remove('active');
  clearEntryForm();
};

function updateSubTypes() {
  const cat = document.getElementById('entry-category').value;
  const sel = document.getElementById('entry-subtype');
  sel.innerHTML = '<option value="">Select sub-type</option>';
  (subTypes[cat] || []).forEach(s => {
    const o = document.createElement('option'); o.value = s; o.textContent = s; sel.appendChild(o);
  });
}

function updateTransactionTypeVisibility() {
  const cat = document.getElementById('entry-category').value;
  document.getElementById('transaction-type-group').style.display = cat === 'investment' ? 'flex' : 'none';
}

window.saveTransaction = function() {
  const date     = document.getElementById('entry-date').value;
  const category = document.getElementById('entry-category').value;
  const subType  = document.getElementById('entry-subtype').value;
  const txType   = document.getElementById('entry-transaction-type').value;
  const amount   = parseFloat(document.getElementById('entry-amount').value);
  const note     = document.getElementById('entry-note').value.trim();
  const reminder = document.getElementById('entry-reminder').checked;

  if (!date || !category || !subType || isNaN(amount) || amount <= 0) {
    toast('Please fill in all required fields', 'error');
    return;
  }

  transactions.push({
    id: Date.now().toString(),
    date, category, subType,
    transactionType: category === 'investment' ? txType : null,
    amount, note, setReminder: reminder
  });

  saveData();
  closeEntryModal();
  updateAll();
  if (document.getElementById('analytics-view').classList.contains('active')) updateAnalytics();
  if (document.getElementById('datacenter-view').classList.contains('active')) updateDataCenter();
  toast('Transaction saved!', 'success');
};

function clearEntryForm() {
  document.getElementById('entry-date').valueAsDate = new Date();
  ['entry-category','entry-subtype'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('entry-transaction-type').value = 'buy';
  document.getElementById('entry-amount').value = '';
  document.getElementById('entry-note').value = '';
  document.getElementById('entry-reminder').checked = false;
  document.getElementById('transaction-type-group').style.display = 'none';
}

// ── Analytics ─────────────────────────────────────────────────
const CHART_COLORS = {
  teal:   '#00e5a0',
  coral:  '#ff6b6b',
  purple: '#9b6dff',
  amber:  '#f5a623',
  blue:   '#4d9fff',
};

function chartDefaults() {
  return {
    plugins: { legend: { labels: { color: '#8890a8', font: { family: 'Space Mono', size: 11 } } } },
    scales: {
      x: { ticks: { color: '#555e78', font: { family: 'Space Mono', size: 10 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
      y: { ticks: { color: '#555e78', font: { family: 'Space Mono', size: 10 }, callback: v => '₹'+v }, grid: { color: 'rgba(255,255,255,0.04)' } }
    }
  };
}

function destroyChart(key) {
  if (charts[key]) { charts[key].destroy(); delete charts[key]; }
}

function updateAnalytics() {
  updatePieChart();
  updateExpenseTrendsChart();
  updateSIPChart();
  updateMonthlySpendingChart();
}

function updatePieChart() {
  destroyChart('pie');
  const ctx = document.getElementById('pie-chart').getContext('2d');

  let needs=0, wants=0;
  transactions.filter(t => t.category==='expense').forEach(t => {
    if (categoryMapping.needs.includes(t.subType)) needs += t.amount;
    else if (categoryMapping.wants.includes(t.subType)) wants += t.amount;
  });
  const invBuys  = transactions.filter(t => t.category==='investment' && t.transactionType==='buy').reduce((s,t)=>s+t.amount,0);
  const invSells = transactions.filter(t => t.category==='investment' && t.transactionType==='sell').reduce((s,t)=>s+t.amount,0);
  const savings = invBuys - invSells;

  charts.pie = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Needs','Wants','Savings'],
      datasets: [{ data: [needs, wants, savings], backgroundColor: [CHART_COLORS.blue, CHART_COLORS.coral, CHART_COLORS.teal], borderWidth: 0, hoverOffset: 8 }]
    },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '60%',
      plugins: {
        legend: { position: 'bottom', labels: { color: '#8890a8', font: { family: 'Space Mono', size: 11 }, padding: 16, boxWidth: 12, boxHeight: 12 } },
        tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ₹${ctx.parsed.toFixed(2)}` } }
      }
    }
  });
}

function updateExpenseTrendsChart() {
  destroyChart('expTrends');
  const ctx = document.getElementById('expense-trends-chart').getContext('2d');

  const monthMap = {};
  transactions.filter(t => t.category==='expense').forEach(t => {
    const m = new Date(t.date).toLocaleString('default',{month:'short',year:'2-digit'});
    if (!monthMap[m]) monthMap[m] = {};
    monthMap[m][t.subType] = (monthMap[m][t.subType]||0) + t.amount;
  });

  const months = Object.keys(monthMap).sort();
  const cats = [...new Set(transactions.filter(t=>t.category==='expense').map(t=>t.subType))];
  const colorList = Object.values(CHART_COLORS);

  charts.expTrends = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: months,
      datasets: cats.map((cat,i) => ({
        label: cat,
        data: months.map(m => monthMap[m]?.[cat]||0),
        backgroundColor: colorList[i % colorList.length] + 'cc',
        borderRadius: 3
      }))
    },
    options: { responsive: true, maintainAspectRatio: false, ...chartDefaults(), plugins: { ...chartDefaults().plugins, tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ₹${ctx.parsed.y.toFixed(2)}` } } } }
  });
}

function updateSIPChart() {
  destroyChart('sip');
  const ctx = document.getElementById('sip-chart').getContext('2d');

  const monthMap = {};
  transactions.filter(t => t.category==='investment' && t.subType==='SIP').forEach(t => {
    const m = new Date(t.date).toLocaleString('default',{month:'short',year:'2-digit'});
    if (!monthMap[m]) monthMap[m] = {buys:0,sells:0};
    if (t.transactionType==='buy') monthMap[m].buys += t.amount;
    else if (t.transactionType==='sell') monthMap[m].sells += t.amount;
  });

  const months = Object.keys(monthMap).sort();
  charts.sip = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: months,
      datasets: [{
        label: 'SIP Net', data: months.map(m => monthMap[m].buys - monthMap[m].sells),
        backgroundColor: CHART_COLORS.amber + 'cc', borderRadius: 3
      }]
    },
    options: { responsive: true, maintainAspectRatio: false, ...chartDefaults() }
  });
}

function updateMonthlySpendingChart() {
  destroyChart('monthly');
  const ctx = document.getElementById('monthly-spending-chart').getContext('2d');

  const monthMap = {};
  transactions.filter(t => t.category==='expense').forEach(t => {
    const m = new Date(t.date).toLocaleString('default',{month:'short',year:'2-digit'});
    monthMap[m] = (monthMap[m]||0) + t.amount;
  });

  const months = Object.keys(monthMap).sort();
  charts.monthly = new Chart(ctx, {
    type: 'line',
    data: {
      labels: months,
      datasets: [{
        label: 'Total Spending', data: months.map(m=>monthMap[m]),
        borderColor: CHART_COLORS.coral,
        backgroundColor: 'rgba(255,107,107,0.08)',
        fill: true, tension: 0.4, pointRadius: 4,
        pointBackgroundColor: CHART_COLORS.coral
      }]
    },
    options: { responsive: true, maintainAspectRatio: false, ...chartDefaults() }
  });
}

// ── Data Center ───────────────────────────────────────────────
function updateDataCenter() {
  updateMonthlySummary();
  updateExpenseBreakdown();
  updateLedger();
  updateHistoryTable();
}

function initTabNav() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      document.getElementById(`${tab}-tab`)?.classList.add('active');
      if (tab==='monthly') updateMonthlySummary();
      else if (tab==='expense') updateExpenseBreakdown();
      else if (tab==='ledger') updateLedger();
      else if (tab==='history') updateHistoryTable();
    });
  });
}

function cellClass(v) { if(v===0) return 'zero'; if(v>0) return 'pos'; return 'neg'; }
function cellVal(v)   { if(v===0) return '—'; return (v<0?'-':'')+'₹'+Math.abs(v).toFixed(2); }

function updateMonthlySummary() {
  const tbody = document.querySelector('#monthly-table tbody');
  tbody.innerHTML = '';
  const map = {};

  transactions.forEach(t => {
    const m = new Date(t.date).toLocaleString('default',{month:'short',year:'2-digit'});
    if (!map[m]) map[m] = {income:0,expenses:0,sharesBuy:0,sharesSell:0,sipBuy:0,sipSell:0,assetBuy:0,assetSell:0};
    if (t.category==='income') map[m].income += t.amount;
    else if (t.category==='expense') map[m].expenses += t.amount;
    else if (t.category==='investment') {
      const buy = t.transactionType==='buy', sell = t.transactionType==='sell';
      if (t.subType==='Shares') { if(buy) map[m].sharesBuy+=t.amount; if(sell) map[m].sharesSell+=t.amount; }
      if (t.subType==='SIP')    { if(buy) map[m].sipBuy+=t.amount;    if(sell) map[m].sipSell+=t.amount; }
      if (t.subType==='Asset Savings') { if(buy) map[m].assetBuy+=t.amount; if(sell) map[m].assetSell+=t.amount; }
    }
  });

  // Sort months chronologically and calculate cumulative balance
  const sortedMonths = Object.keys(map).sort((a,b) => {
    const dateA = new Date('01 ' + a);
    const dateB = new Date('01 ' + b);
    return dateA - dateB;
  });
  
  let cumulativeBalance = 0;
  
  sortedMonths.forEach(month => {
    const d = map[month];
    const shares = d.sharesBuy - d.sharesSell;
    const sip    = d.sipBuy    - d.sipSell;
    const asset  = d.assetBuy  - d.assetSell;
    const profit = d.income - d.expenses;
    const monthlyBalance = d.income + d.sharesSell + d.sipSell + d.assetSell - d.expenses - d.sharesBuy - d.sipBuy - d.assetBuy;
    
    // Calculate cumulative balance
    cumulativeBalance += monthlyBalance;
    
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${month}</td>
      <td class="${cellClass(d.income)}">${cellVal(d.income)}</td>
      <td class="${cellClass(d.expenses)}">${cellVal(d.expenses)}</td>
      <td class="${cellClass(shares)}">${cellVal(shares)}</td>
      <td class="${cellClass(sip)}">${cellVal(sip)}</td>
      <td class="${cellClass(asset)}">${cellVal(asset)}</td>
      <td class="${cellClass(profit)}">${cellVal(profit)}</td>
      <td class="${cellClass(cumulativeBalance)}">${cellVal(cumulativeBalance)}</td>`;
    tbody.appendChild(tr);
  });
}

function updateExpenseBreakdown() {
  const tbody = document.querySelector('#expense-table tbody');
  const thead = document.querySelector('#expense-table thead');
  tbody.innerHTML = '';

  const monthMap = {};
  const allCats = new Set();
  transactions.filter(t=>t.category==='expense').forEach(t=>{
    const m = new Date(t.date).toLocaleString('default',{month:'short',year:'numeric'});
    if(!monthMap[m]) monthMap[m]={};
    monthMap[m][t.subType] = (monthMap[m][t.subType]||0) + t.amount;
    allCats.add(t.subType);
  });

  const cats = [...allCats].sort();
  const months = Object.keys(monthMap).sort((a,b) => new Date(b)-new Date(a));

  if (!cats.length) {
    thead.innerHTML = '<tr><th>Month</th><th>Total</th></tr>';
    tbody.innerHTML = '<tr><td colspan="2" style="text-align:center;padding:20px;color:var(--text-3)">No expense data</td></tr>';
    return;
  }

  thead.innerHTML = `<tr><th>Month</th>${cats.map(c=>`<th>${c}</th>`).join('')}<th>Total</th></tr>`;

  months.forEach(m=>{
    let total=0;
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${m}</td>${cats.map(c=>{ const v=monthMap[m][c]||0; total+=v; return `<td class="${cellClass(v)}">${cellVal(v)}</td>`; }).join('')}<td><strong>${cellVal(total)}</strong></td>`;
    tbody.appendChild(tr);
  });

  // Totals row
  const totRow = document.createElement('tr');
  totRow.style.cssText = 'font-weight:700;background:var(--bg-surface);';
  const catTotals = cats.map(c => months.reduce((s,m)=>s+(monthMap[m][c]||0),0));
  const grand = catTotals.reduce((s,v)=>s+v,0);
  totRow.innerHTML = `<td>Total</td>${catTotals.map(v=>`<td class="${cellClass(v)}">${cellVal(v)}</td>`).join('')}<td>${cellVal(grand)}</td>`;
  tbody.appendChild(totRow);
}

function updateLedger() {
  const tbody = document.querySelector('#ledger-table tbody');
  tbody.innerHTML = '';
  const start = document.getElementById('start-date').value;
  const end   = document.getElementById('end-date').value;

  const filtered = transactions.filter(t => {
    if (!start && !end) return true;
    const d = new Date(t.date);
    const s = start ? new Date(start) : new Date('1900-01-01');
    const e = end   ? new Date(end)   : new Date('2100-12-31');
    return d >= s && d <= e;
  });

  const daily = {};
  filtered.forEach(t => {
    const d = t.date.split('T')[0];
    if (!daily[d]) daily[d] = {date:d,income:0,otherIncome:0,redeem:0,home:0,mobile:0,travel:0,health:0,education:0,food:0,entertainment:0,others:0,assetSavings:0,shares:0,sip:0};
    if (t.category==='income') {
      if (t.subType==='Salary') daily[d].income+=t.amount; else daily[d].otherIncome+=t.amount;
    } else if (t.category==='expense') {
      const key = t.subType.toLowerCase().replace(' ','');
      if (key in daily[d]) daily[d][key]+=t.amount;
      else daily[d].others+=t.amount;
    } else if (t.category==='investment') {
      const buy=t.transactionType==='buy', sell=t.transactionType==='sell';
      if (t.subType==='Asset Savings') { if(buy) daily[d].assetSavings+=t.amount; if(sell) daily[d].assetSavings-=t.amount; }
      if (t.subType==='Shares') { if(buy) daily[d].shares+=t.amount; if(sell) daily[d].shares-=t.amount; }
      if (t.subType==='SIP')    { if(buy) daily[d].sip+=t.amount;    if(sell) daily[d].sip-=t.amount; }
      if (t.transactionType==='redeem') daily[d].redeem+=t.amount;
    }
  });

  // Sort dates chronologically and calculate cumulative balance
  const sortedDates = Object.keys(daily).sort((a,b) => new Date(a) - new Date(b));
  
  let cumulativeBalance = 0;
  
  // Display in reverse chronological order (newest first) but calculate cumulative from oldest
  const rows = [];
  
  sortedDates.forEach(date => {
    const r = daily[date];
    const dailyBalance = r.income+r.otherIncome+r.redeem - (r.home+r.mobile+r.travel+r.health+r.education+r.food+r.entertainment+r.others+r.assetSavings+r.shares+r.sip);
    
    // Calculate cumulative balance
    cumulativeBalance += dailyBalance;
    
    const tr = document.createElement('tr');
    const fields = ['income','otherIncome','redeem','home','mobile','travel','health','education','food','entertainment','others','assetSavings','shares','sip'];
    tr.innerHTML = `<td>${new Date(r.date).toLocaleDateString('en-IN')}</td>${fields.map(f=>`<td class="${cellClass(r[f])}">${cellVal(r[f])}</td>`).join('')}<td class="${cellClass(cumulativeBalance)}">${cellVal(cumulativeBalance)}</td>`;
    rows.push(tr);
  });
  
  // Add rows in reverse order (newest first)
  rows.reverse().forEach(tr => tbody.appendChild(tr));
}

function updateHistoryTable() {
  const tbody = document.querySelector('#datacenter-history-table tbody');
  tbody.innerHTML = '';
  const q = (document.getElementById('datacenter-history-search')?.value || '').toLowerCase();

  const filtered = transactions
    .filter(t => !q || [t.category,t.subType,t.note].join(' ').toLowerCase().includes(q))
    .sort((a,b) => new Date(b.date)-new Date(a.date));

  if (!filtered.length) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--text-3)">No transactions found</td></tr>';
    return;
  }

  filtered.forEach(t => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${new Date(t.date).toLocaleDateString('en-IN')}</td>
      <td style="text-transform:capitalize">${t.category}</td>
      <td>${t.subType}</td>
      <td style="font-family:var(--font-mono)">${fmtRs(t.amount)}</td>
      <td style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${t.note || '—'}</td>
      <td>${t.setReminder ? '<span style="color:var(--amber)">Yes</span>' : '<span style="color:var(--text-3)">No</span>'}</td>
      <td><button class="delete-btn" onclick="deleteTransaction('${t.id}')"><i class="fas fa-trash-alt"></i></button></td>`;
    tbody.appendChild(tr);
  });
}

window.deleteTransaction = function(id) {
  if (!confirm('Delete this transaction?')) return;
  transactions = transactions.filter(t => t.id !== id);
  saveData();
  updateHistoryTable();
  updateDashboard();
  if (document.getElementById('analytics-view').classList.contains('active')) updateAnalytics();
  toast('Transaction deleted', 'success');
};

// ── Table Actions Init ────────────────────────────────────────
function initTableActions() {
  document.querySelectorAll('.csv-btn').forEach(btn => {
    btn.addEventListener('click', () => exportCSV(btn.dataset.table));
  });
  document.getElementById('start-date')?.addEventListener('change', updateLedger);
  document.getElementById('end-date')?.addEventListener('change', updateLedger);
  document.getElementById('clear-filter-btn')?.addEventListener('click', () => {
    document.getElementById('start-date').value = '';
    document.getElementById('end-date').value = '';
    updateLedger();
  });
  document.getElementById('datacenter-history-search')?.addEventListener('input', updateHistoryTable);
  document.getElementById('export-pdf-btn')?.addEventListener('click', exportPDF);
}

// ── CSV Export ────────────────────────────────────────────────
function exportCSV(type) {
  let data, name;
  if (type==='monthly') { data = buildMonthlyCSV(); name = 'monthly-summary.csv'; }
  else if (type==='expense') { data = buildExpenseCSV(); name = 'expense-breakdown.csv'; }
  else if (type==='ledger')  { data = buildLedgerCSV();  name = 'daily-ledger.csv'; }

  const blob = new Blob([data], { type:'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  toast(`${name} exported`, 'success');
}

function toCSV(rows) {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  return [headers.join(','), ...rows.map(r => headers.map(h => typeof r[h]==='string'?`"${r[h]}"`:r[h]).join(','))].join('\n');
}

function buildMonthlyCSV() {
  const map = {};
  transactions.forEach(t => {
    const m = new Date(t.date).toLocaleString('default',{month:'short',year:'2-digit'});
    if (!map[m]) map[m] = {Month:m,Income:0,Expenses:0,Shares:0,SIP:0,Asset:0,Profit:0,Balance:0,_sb:0,_ss:0,_pb:0,_ps:0,_ab:0,_as:0};
    if (t.category==='income') map[m].Income+=t.amount;
    else if (t.category==='expense') map[m].Expenses+=t.amount;
    else if (t.category==='investment') {
      const buy=t.transactionType==='buy',sell=t.transactionType==='sell';
      if(t.subType==='Shares')        {if(buy)map[m]._sb+=t.amount;if(sell)map[m]._ss+=t.amount;}
      if(t.subType==='SIP')           {if(buy)map[m]._pb+=t.amount;if(sell)map[m]._ps+=t.amount;}
      if(t.subType==='Asset Savings') {if(buy)map[m]._ab+=t.amount;if(sell)map[m]._as+=t.amount;}
    }
  });
  return toCSV(Object.values(map).map(d => {
    d.Shares=d._sb-d._ss; d.SIP=d._pb-d._ps; d.Asset=d._ab-d._as;
    d.Profit=d.Income-d.Expenses;
    d.Balance=d.Income+d._ss+d._ps+d._as-d.Expenses-d._sb-d._pb-d._ab;
    return {Month:d.Month,Income:d.Income,Expenses:d.Expenses,Shares:d.Shares,SIP:d.SIP,Asset:d.Asset,Profit:d.Profit,Balance:d.Balance};
  }));
}

function buildExpenseCSV() {
  const monthMap={};const allCats=new Set();
  transactions.filter(t=>t.category==='expense').forEach(t=>{
    const m=new Date(t.date).toLocaleString('default',{month:'short',year:'numeric'});
    if(!monthMap[m])monthMap[m]={};
    monthMap[m][t.subType]=(monthMap[m][t.subType]||0)+t.amount;
    allCats.add(t.subType);
  });
  const cats=[...allCats].sort();
  return toCSV(Object.entries(monthMap).map(([m,d])=>{
    const row={Month:m};cats.forEach(c=>row[c]=d[c]||0);
    row.Total=cats.reduce((s,c)=>s+(d[c]||0),0);return row;
  }));
}

function buildLedgerCSV() {
  const daily={};
  transactions.forEach(t=>{
    const d=t.date.split('T')[0];
    if(!daily[d])daily[d]={Date:d,Income:0,OtherIncome:0,Redeem:0,Home:0,Mobile:0,Travel:0,Health:0,Education:0,Food:0,Entertainment:0,Others:0,AssetSavings:0,Shares:0,SIP:0,Balance:0};
    if(t.category==='income'){if(t.subType==='Salary')daily[d].Income+=t.amount;else daily[d].OtherIncome+=t.amount;}
    else if(t.category==='expense'){const k=t.subType.replace(' ','');if(k in daily[d])daily[d][k]+=t.amount;else daily[d].Others+=t.amount;}
    else if(t.category==='investment'){
      const buy=t.transactionType==='buy',sell=t.transactionType==='sell';
      if(t.subType==='Asset Savings'){if(buy)daily[d].AssetSavings+=t.amount;if(sell)daily[d].AssetSavings-=t.amount;}
      if(t.subType==='Shares'){if(buy)daily[d].Shares+=t.amount;if(sell)daily[d].Shares-=t.amount;}
      if(t.subType==='SIP'){if(buy)daily[d].SIP+=t.amount;if(sell)daily[d].SIP-=t.amount;}
      if(t.transactionType==='redeem')daily[d].Redeem+=t.amount;
    }
  });
  Object.values(daily).forEach(r=>{r.Balance=r.Income+r.OtherIncome+r.Redeem-(r.Home+r.Mobile+r.Travel+r.Health+r.Education+r.Food+r.Entertainment+r.Others+r.AssetSavings+r.Shares+r.SIP);});
  return toCSV(Object.values(daily).sort((a,b)=>new Date(a.Date)-new Date(b.Date)));
}

// ── PDF Export ────────────────────────────────────────────────
function exportPDF() {
  try {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();
    const totals = calculateTotals();

    // Background matching web theme
    pdf.setFillColor(10,12,16);
    pdf.rect(0,0,210,297,'F');

    // Enhanced Header with better spacing
    pdf.setTextColor(0,229,160);
    pdf.setFontSize(24); pdf.setFont('helvetica','bold');
    pdf.text('DigiFin', 20, 25);

    pdf.setTextColor(136,144,168);
    pdf.setFontSize(11); pdf.setFont('helvetica','normal');
    pdf.text('Financial Report', 20, 35);
    if (userProfile) {
      pdf.text(`User: ${userProfile.name}`, 20, 42);
      pdf.text(`Generated: ${new Date().toLocaleString('en-IN')}`, 20, 49);
    } else {
      pdf.text(`Generated: ${new Date().toLocaleString('en-IN')}`, 20, 42);
    }

    // Better separator line
    pdf.setDrawColor(30,33,40); pdf.setLineWidth(0.5); pdf.line(20,55,190,55);

    let y=65;

    // 1. Profile Section with card-like styling
    pdf.setFillColor(28,31,40);
    pdf.roundedRect(15, y-5, 180, 35, 3, 3, 'F');
    
    pdf.setTextColor(240,242,248); pdf.setFontSize(14); pdf.setFont('helvetica','bold');
    pdf.text('1. Profile', 20, y+2); y+=10;
    pdf.setFontSize(10); pdf.setFont('helvetica','normal'); pdf.setTextColor(136,144,168);
    if (userProfile) {
      pdf.text(`Name: ${userProfile.name}`, 20, y); y+=7;
      pdf.text(`Email: ${userProfile.email || 'N/A'}`, 20, y); y+=7;
      pdf.text(`Age: ${userProfile.age || 'N/A'} · Gender: ${userProfile.gender || 'N/A'}`, 20, y); y+=7;
      pdf.text(`Budget: ₹${Number(userProfile.budget || 0).toLocaleString('en-IN')}`, 20, y);
    } else {
      pdf.text('No profile data available', 20, y);
    }
    y+=15;

    // 2. Financial Summary with card styling
    pdf.setFillColor(28,31,40);
    pdf.roundedRect(15, y-5, 180, 25, 3, 3, 'F');
    
    pdf.setTextColor(240,242,248); pdf.setFontSize(14); pdf.setFont('helvetica','bold');
    pdf.text('2. Financial Summary', 20, y+2); y+=10;
    pdf.setFontSize(10); pdf.setFont('helvetica','normal');

    const summaryData = [[`Net Balance`, totals.balance],[`Total Expenses`, totals.expenses],[`Investments`, totals.investments]];
    summaryData.forEach(([label,val], i) => {
      pdf.setTextColor(136,144,168); pdf.text(label, 20 + (i * 60), y);
      pdf.setTextColor(val<0?'#ff6b6b':val>0?'#00e5a0':'#8890a8');
      pdf.text(`₹${val.toFixed(2)}`, 20 + (i * 60) + 35, y);
    });
    y+=15;

    // 3. Recent Transactions
    pdf.setDrawColor(30,33,40); pdf.setLineWidth(0.5); pdf.line(20,y,190,y); y+=8;
    pdf.setTextColor(240,242,248); pdf.setFontSize(14); pdf.setFont('helvetica','bold');
    pdf.text('3. Recent Transactions', 20, y); y+=10;
    pdf.setFontSize(9); pdf.setFont('helvetica','normal');

    // Transaction headers
    pdf.setTextColor(136,144,168);
    pdf.text('Date', 20, y);
    pdf.text('Category', 60, y);
    pdf.text('Amount', 150, y); y+=6;

    [...transactions].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,12).forEach(t=>{
      if (y>270) { pdf.addPage(); y=20; }
      pdf.setTextColor(136,144,168);
      pdf.text(`${new Date(t.date).toLocaleDateString('en-IN')}`, 20, y);
      pdf.text(`${t.category} / ${t.subType}`, 60, y);
      pdf.setTextColor(t.category==='income'?'#00e5a0':'#ff6b6b');
      pdf.text(`₹${t.amount.toFixed(2)}`, 150, y);
      y+=6;
    });

    // 4. Analytics Section with visual styling
    y+=8;
    pdf.setDrawColor(30,33,40); pdf.setLineWidth(0.5); pdf.line(20,y,190,y); y+=8;
    pdf.setFillColor(28,31,40);
    pdf.roundedRect(15, y-5, 180, 30, 3, 3, 'F');
    
    pdf.setTextColor(240,242,248); pdf.setFontSize(14); pdf.setFont('helvetica','bold');
    pdf.text('4. Analytics', 20, y+2); y+=10;
    pdf.setFontSize(10); pdf.setFont('helvetica','normal');

    // Calculate analytics data
    let needs=0, wants=0, savings=0;
    transactions.filter(t => t.category==='expense').forEach(t => {
      if (categoryMapping.needs.includes(t.subType)) needs += t.amount;
      else if (categoryMapping.wants.includes(t.subType)) wants += t.amount;
    });
    const invBuys = transactions.filter(t => t.category==='investment' && t.transactionType==='buy').reduce((s,t)=>s+t.amount,0);
    const invSells = transactions.filter(t => t.category==='investment' && t.transactionType==='sell').reduce((s,t)=>s+t.amount,0);
    savings = invBuys - invSells;

    const total = needs + wants + savings;
    const needsPct = total > 0 ? ((needs/total)*100).toFixed(1) : 0;
    const wantsPct = total > 0 ? ((wants/total)*100).toFixed(1) : 0;
    const savingsPct = total > 0 ? ((savings/total)*100).toFixed(1) : 0;

    // Analytics in columns
    pdf.setTextColor(136,144,168);
    pdf.text(`Needs: ₹${needs.toFixed(2)} (${needsPct}%)`, 20, y);
    pdf.text(`Wants: ₹${wants.toFixed(2)} (${wantsPct}%)`, 80, y);
    pdf.text(`Savings: ₹${savings.toFixed(2)} (${savingsPct}%)`, 140, y);
    y+=15;

    // 5. Monthly Summary Table with better formatting
    pdf.setDrawColor(30,33,40); pdf.setLineWidth(0.5); pdf.line(20,y,190,y); y+=8;
    pdf.setTextColor(240,242,248); pdf.setFontSize(14); pdf.setFont('helvetica','bold');
    pdf.text('5. Monthly Summary', 20, y); y+=10;

    // Prepare monthly data
    const monthlyMap = {};
    transactions.forEach(t => {
      const m = new Date(t.date).toLocaleString('default',{month:'short',year:'2-digit'});
      if (!monthlyMap[m]) monthlyMap[m] = {income:0,expenses:0,sharesBuy:0,sharesSell:0,sipBuy:0,sipSell:0,assetBuy:0,assetSell:0};
      if (t.category==='income') monthlyMap[m].income += t.amount;
      else if (t.category==='expense') monthlyMap[m].expenses += t.amount;
      else if (t.category==='investment') {
        const buy = t.transactionType==='buy', sell = t.transactionType==='sell';
        if (t.subType==='Shares') { if(buy) monthlyMap[m].sharesBuy+=t.amount; if(sell) monthlyMap[m].sharesSell+=t.amount; }
        if (t.subType==='SIP')    { if(buy) monthlyMap[m].sipBuy+=t.amount;    if(sell) monthlyMap[m].sipSell+=t.amount; }
        if (t.subType==='Asset Savings') { if(buy) monthlyMap[m].assetBuy+=t.amount; if(sell) monthlyMap[m].assetSell+=t.amount; }
      }
    });

    // Calculate cumulative balance
    const sortedMonths = Object.entries(monthlyMap).sort((a,b) => new Date(a[0]) - new Date(b[0]));
    let cumulativeBalance = 0;
    const monthlyRows = sortedMonths.map(([month,d]) => {
      const shares = d.sharesBuy - d.sharesSell;
      const sip = d.sipBuy - d.sipSell;
      const asset = d.assetBuy - d.assetSell;
      const profit = d.income - d.expenses;
      const monthlyBalance = d.income + d.sharesSell + d.sipSell + d.assetSell - d.expenses - d.sharesBuy - d.sipBuy - d.assetBuy;
      cumulativeBalance += monthlyBalance;
      return {month, income: d.income, expenses: d.expenses, shares, sip, asset, profit, balance: cumulativeBalance};
    });

    // Table headers with better spacing
    pdf.setFillColor(22,25,33);
    pdf.rect(15, y-2, 180, 8, 'F');
    pdf.setFontSize(9); pdf.setFont('helvetica','bold');
    pdf.setTextColor(240,242,248);
    const headers = ['Month', 'Income', 'Expenses', 'Shares', 'SIP', 'Asset', 'Profit', 'Balance'];
    const colWidths = [25, 22, 22, 20, 20, 20, 20, 21];
    let x = 15;
    headers.forEach((header, i) => {
      pdf.text(header, x + 2, y+3);
      x += colWidths[i];
    });
    y+=10;

    // Table data with alternating rows
    pdf.setFontSize(8); pdf.setFont('helvetica','normal');
    monthlyRows.slice(-6).reverse().forEach((row, index) => {
      if (y>270) { pdf.addPage(); y=20; }
      
      // Alternating row background
      if (index % 2 === 0) {
        pdf.setFillColor(18,20,26);
        pdf.rect(15, y-1, 180, 6, 'F');
      }
      
      x = 15;
      pdf.setTextColor(136,144,168); pdf.text(row.month, x + 2, y+3); x += colWidths[0];
      pdf.setTextColor(row.income>0?'#00e5a0':'#8890a8'); pdf.text(`₹${row.income.toFixed(0)}`, x + 2, y+3); x += colWidths[1];
      pdf.setTextColor(row.expenses<0?'#ff6b6b':'#8890a8'); pdf.text(`₹${row.expenses.toFixed(0)}`, x + 2, y+3); x += colWidths[2];
      pdf.setTextColor(row.shares<0?'#ff6b6b':row.shares>0?'#00e5a0':'#8890a8'); pdf.text(`₹${row.shares.toFixed(0)}`, x + 2, y+3); x += colWidths[3];
      pdf.setTextColor(row.sip<0?'#ff6b6b':row.sip>0?'#00e5a0':'#8890a8'); pdf.text(`₹${row.sip.toFixed(0)}`, x + 2, y+3); x += colWidths[4];
      pdf.setTextColor(row.asset<0?'#ff6b6b':row.asset>0?'#00e5a0':'#8890a8'); pdf.text(`₹${row.asset.toFixed(0)}`, x + 2, y+3); x += colWidths[5];
      pdf.setTextColor(row.profit<0?'#ff6b6b':row.profit>0?'#00e5a0':'#8890a8'); pdf.text(`₹${row.profit.toFixed(0)}`, x + 2, y+3); x += colWidths[6];
      pdf.setTextColor(row.balance<0?'#ff6b6b':row.balance>0?'#00e5a0':'#8890a8'); pdf.text(`₹${row.balance.toFixed(0)}`, x + 2, y+3);
      y+=6;
    });

    // 6. Daily Ledger Table with enhanced formatting
    y+=8;
    if (y > 250) { pdf.addPage(); y = 20; }
    pdf.setDrawColor(30,33,40); pdf.setLineWidth(0.5); pdf.line(20,y,190,y); y+=8;
    pdf.setTextColor(240,242,248); pdf.setFontSize(14); pdf.setFont('helvetica','bold');
    pdf.text('6. Daily Ledger', 20, y); y+=10;

    // Prepare daily ledger data
    const daily = {};
    transactions.forEach(t => {
      const d = t.date.split('T')[0];
      if (!daily[d]) daily[d] = {date:d,income:0,expenses:0,investments:0};
      if (t.category==='income') daily[d].income+=t.amount;
      else if (t.category==='expense') daily[d].expenses+=t.amount;
      else if (t.category==='investment') {
        if (t.transactionType==='buy') daily[d].investments+=t.amount;
        else if (t.transactionType==='sell') daily[d].investments-=t.amount;
      }
    });

    // Sort and calculate cumulative
    const sortedDates = Object.keys(daily).sort((a,b) => new Date(a) - new Date(b));
    let cumulativeLedgerBalance = 0;
    const ledgerRows = [];
    
    sortedDates.forEach(date => {
      const r = daily[date];
      const dailyBalance = r.income - r.expenses - r.investments;
      cumulativeLedgerBalance += dailyBalance;
      ledgerRows.push({date, income: r.income, expenses: r.expenses, investments: r.investments, balance: cumulativeLedgerBalance});
    });

    // Table headers for ledger
    pdf.setFillColor(22,25,33);
    pdf.rect(15, y-2, 180, 8, 'F');
    pdf.setFontSize(9); pdf.setFont('helvetica','bold');
    pdf.setTextColor(240,242,248);
    const ledgerHeaders = ['Date', 'Income', 'Expenses', 'Investments', 'Balance'];
    const ledgerColWidths = [35, 35, 35, 35, 30];
    x = 15;
    ledgerHeaders.forEach((header, i) => {
      pdf.text(header, x + 2, y+3);
      x += ledgerColWidths[i];
    });
    y+=10;

    // Table data for ledger with alternating rows
    pdf.setFontSize(8); pdf.setFont('helvetica','normal');
    ledgerRows.slice(-8).forEach((row, index) => {
      if (y>270) { pdf.addPage(); y=20; }
      
      // Alternating row background
      if (index % 2 === 0) {
        pdf.setFillColor(18,20,26);
        pdf.rect(15, y-1, 180, 6, 'F');
      }
      
      x = 15;
      pdf.setTextColor(136,144,168); pdf.text(`${new Date(row.date).toLocaleDateString('en-IN')}`, x + 2, y+3); x += ledgerColWidths[0];
      pdf.setTextColor(row.income>0?'#00e5a0':'#8890a8'); pdf.text(`₹${row.income.toFixed(0)}`, x + 2, y+3); x += ledgerColWidths[1];
      pdf.setTextColor(row.expenses<0?'#ff6b6b':'#8890a8'); pdf.text(`₹${row.expenses.toFixed(0)}`, x + 2, y+3); x += ledgerColWidths[2];
      pdf.setTextColor(row.investments<0?'#ff6b6b':row.investments>0?'#00e5a0':'#8890a8'); pdf.text(`₹${row.investments.toFixed(0)}`, x + 2, y+3); x += ledgerColWidths[3];
      pdf.setTextColor(row.balance<0?'#ff6b6b':row.balance>0?'#00e5a0':'#8890a8'); pdf.text(`₹${row.balance.toFixed(0)}`, x + 2, y+3);
      y+=6;
    });

    pdf.save('digifin-report.pdf');
    toast('PDF exported successfully', 'success');
  } catch(e) {
    console.error(e);
    toast('PDF export failed', 'error');
  }
}

// ── Settings ──────────────────────────────────────────────────
function initSettings() {
  document.getElementById('save-name-btn')?.addEventListener('click', () => {
    const val = document.getElementById('settings-name').value.trim();
    if (!val || !userProfile) { toast('Enter a valid name', 'error'); return; }
    userProfile.name = val;
    userProfile.initials = val.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);
    saveData();
    updateUserProfile();
    toast('Name updated', 'success');
  });

  document.getElementById('change-character-btn')?.addEventListener('click', () => {
    document.getElementById('settings-character').click();
  });

  document.getElementById('settings-character')?.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file?.type.startsWith('image/')) { toast('Please select an image file', 'error'); return; }
    const reader = new FileReader();
    reader.onload = ev => {
      if (userProfile) { userProfile.characterAvatar = ev.target.result; saveData(); updateUserProfile(); }
      document.getElementById('character-display').value = file.name;
      toast('Avatar updated', 'success');
    };
    reader.readAsDataURL(file);
  });

  document.getElementById('dashboard-change-character-btn')?.addEventListener('click', () => {
    document.getElementById('dashboard-character-input').click();
  });

  document.getElementById('dashboard-character-input')?.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file?.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = ev => {
      if (userProfile) { userProfile.characterAvatar = ev.target.result; saveData(); updateUserProfile(); }
      toast('Avatar updated', 'success');
    };
    reader.readAsDataURL(file);
  });

  document.getElementById('sign-out-btn')?.addEventListener('click', () => {
    if (!confirm('Sign out and clear all data?')) return;
    localStorage.removeItem('df_profile');
    localStorage.removeItem('df_transactions');
    userProfile = null;
    transactions = [];
    document.getElementById('user-name').textContent = 'Welcome, User';
    document.getElementById('user-email').textContent = '—';
    document.getElementById('user-details').textContent = 'Age: — · Gender: —';
    document.getElementById('avatar-fallback').textContent = 'U';
    switchView('dashboard');
    document.getElementById('welcome-modal').classList.add('active');
    toast('Signed out successfully', 'success');
  });
}

function syncSettingsForm() {
  if (!userProfile) return;
  document.getElementById('settings-name').value = userProfile.name || '';
  document.getElementById('character-display').value = userProfile.characterAvatar ? 'Custom image loaded' : (userProfile.characterLabel || 'None');
}

// ── Toast Notification ────────────────────────────────────────
function toast(msg, type='success') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<i class="fas fa-${type==='success'?'check-circle':'exclamation-circle'}"></i> ${msg}`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 4200);
}