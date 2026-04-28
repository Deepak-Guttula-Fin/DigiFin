const firebaseConfig = {
  apiKey: "AIzaSyA0jHlmQC1T-F2snigSar1-t-GflwQpJ-8",
  authDomain: "wisdomwalker-40e63.firebaseapp.com",
  databaseURL: "https://wisdomwalker-40e63-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "wisdomwalker-40e63",
  storageBucket: "wisdomwalker-40e63.firebasestorage.app",
  messagingSenderId: "568917271621",
  appId: "1:568917271621:web:08967643d624f2779daf2c",
  measurementId: "G-ZH58DK07WK"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

try {
  firebase.analytics();
} catch {
  // Analytics is optional here, especially on file-based previews.
}

const avatarPalette = [
  { id: "aurora", label: "Aurora" },
  { id: "atlas", label: "Atlas" },
  { id: "nova", label: "Nova" },
  { id: "zen", label: "Zen" }
];

const typeMap = {
  income: ["Salary", "Other Income"],
  expense: ["Home", "Mobile", "Travel", "Health", "Education", "Food", "Entertainment", "Others"],
  investment: ["SIP", "Shares", "Asset Savings"]
};

const needsSet = new Set(["Home", "Mobile", "Travel", "Health", "Education"]);
const wantsSet = new Set(["Food", "Entertainment", "Others", "Borrowing", "Write-off"]);
const savingsSet = new Set(["SIP", "Shares", "Asset Savings"]);
const expenseCategories = typeMap.expense;

const state = {
  currentUserId: null,
  currentUser: null,
  authMode: "signup",
  selectedSignupAvatar: "",
  selectedSettingsAvatar: ""
};

const $ = (id) => document.getElementById(id);

document.addEventListener("DOMContentLoaded", async () => {
  renderAvatarChoices("signupAvatarChoices", "signup");
  renderAvatarChoices("settingsAvatarChoices", "settings");
  bindEvents();
  updateEntryFields();
  showDefaultDate();
  setAuthMode("signup");
  state.selectedSignupAvatar = defaultAvatarDataUrl(avatarPalette[0].id);
  highlightAvatarChoice("signupAvatarChoices", state.selectedSignupAvatar);
  showToast("Data is now connected to Firebase.");
  registerServiceWorker();
});

function bindEvents() {
  document.querySelectorAll("[data-auth-mode]").forEach((button) => {
    button.addEventListener("click", () => setAuthMode(button.dataset.authMode));
  });

  $("signupForm").addEventListener("submit", onSignup);
  $("loginForm").addEventListener("submit", onLogin);
  $("clearSignupAvatar").addEventListener("click", () => {
    state.selectedSignupAvatar = defaultAvatarDataUrl(avatarPalette[0].id);
    $("signupAvatarUpload").value = "";
    highlightAvatarChoice("signupAvatarChoices", state.selectedSignupAvatar);
  });

  $("signupAvatarUpload").addEventListener("change", async (event) => {
    state.selectedSignupAvatar = await fileToDataUrl(event.target.files[0]);
    highlightAvatarChoice("signupAvatarChoices", state.selectedSignupAvatar);
  });

  $("settingsAvatarUpload").addEventListener("change", async (event) => {
    state.selectedSettingsAvatar = await fileToDataUrl(event.target.files[0]);
    highlightAvatarChoice("settingsAvatarChoices", state.selectedSettingsAvatar);
  });

  $("entryType").addEventListener("change", updateEntryFields);
  $("entrySubType").addEventListener("change", updateEntryPreview);
  $("entryAction").addEventListener("change", updateEntryPreview);
  $("entryAmount").addEventListener("input", updateEntryPreview);
  $("entryDate").addEventListener("change", updateEntryPreview);
  $("entryReminder").addEventListener("change", updateEntryPreview);
  $("entryForm").addEventListener("submit", onSaveEntry);
  $("settingsForm").addEventListener("submit", onSaveSettings);
  $("addFirstEntryBtn").addEventListener("click", () => openOverlay("entryView"));
  $("openMenuBtn").addEventListener("click", () => openOverlay("menuView"));

  $("openEntriesBtn").addEventListener("click", openEntryFromMenu);
  $("openHistoryBtn").addEventListener("click", openHistoryFromMenu);
  $("openSettingsBtn").addEventListener("click", openSettingsFromMenu);
  $("downloadPdfBtn").addEventListener("click", downloadPdfFromMenu);

  document.querySelectorAll(".close-overlay").forEach((button) => {
    button.addEventListener("click", () => closeOverlay(button.dataset.closeOverlay));
  });

  document.querySelectorAll(".nav-btn").forEach((button) => {
    button.addEventListener("click", () => switchView(button.dataset.view));
  });

  document.querySelectorAll("[data-export-table]").forEach((button) => {
    button.addEventListener("click", () => exportTableCsv(button.dataset.exportTable));
  });

  $("ledgerMonthFilter").addEventListener("change", renderLedgerTable);
  $("ledgerSort").addEventListener("change", renderLedgerTable);
  $("expenseMonthFilter").addEventListener("change", renderFilteredExpenseChart);
}

function setAuthMode(mode) {
  state.authMode = mode;
  document.querySelectorAll("[data-auth-mode]").forEach((button) => {
    button.classList.toggle("active", button.dataset.authMode === mode);
  });
  $("signupForm").classList.toggle("active", mode === "signup");
  $("loginForm").classList.toggle("active", mode === "login");
  $("authMessage").textContent = "";
}

async function onSignup(event) {
  event.preventDefault();
  setBusy(true);
  try {
    const email = $("signupEmail").value.trim().toLowerCase();
    const existing = await findUserByEmail(email);
    if (existing) {
      $("authMessage").textContent = "An account with this email already exists.";
      return;
    }

    const user = {
      id: crypto.randomUUID(),
      name: $("signupName").value.trim(),
      email,
      password: $("signupPassword").value,
      age: $("signupAge").value.trim(),
      gender: $("signupGender").value,
      budget: Number($("signupBudget").value || 0),
      avatar: state.selectedSignupAvatar || defaultAvatarDataUrl(avatarPalette[0].id),
      entries: {},
      createdAt: new Date().toISOString()
    };

    await db.ref(`users/${user.id}`).set(user);
    await loginAs(user.id);
  } catch {
    $("authMessage").textContent = "Could not create account. Please try again.";
  } finally {
    setBusy(false);
  }
}

async function onLogin(event) {
  event.preventDefault();
  setBusy(true);
  try {
    const email = $("loginEmail").value.trim().toLowerCase();
    const password = $("loginPassword").value;
    const user = await findUserByEmail(email);
    if (!user || user.password !== password) {
      $("authMessage").textContent = "Invalid email or password.";
      return;
    }
    await loginAs(user.id);
  } catch {
    $("authMessage").textContent = "Could not login. Please try again.";
  } finally {
    setBusy(false);
  }
}

async function loginAs(userId) {
  state.currentUserId = userId;
  state.currentUser = await fetchUser(userId);
  $("signupForm").reset();
  $("loginForm").reset();
  $("authMessage").textContent = "";
  showApp();
  showToast("Welcome. Data is loading from Firebase.");
}

function getCurrentUser() {
  return state.currentUser;
}

function showApp() {
  $("authScreen").classList.remove("active");
  $("appScreen").classList.add("active");
  switchView("dashboardView");
  refreshApp();
}

function switchView(viewId) {
  document.querySelectorAll(".view").forEach((view) => view.classList.toggle("active", view.id === viewId));
  document.querySelectorAll(".nav-btn").forEach((button) => button.classList.toggle("active", button.dataset.view === viewId));
  $("headerTitle").textContent = viewId === "chartsView" ? "Charts" : viewId === "tablesView" ? "Tables" : "Dashboard";
  if (viewId === "chartsView") renderCharts();
  if (viewId === "tablesView") renderTables();
}

function openOverlay(id) {
  $(id).classList.add("active");
  if (id === "entryView") updateEntryPreview();
}

function closeOverlay(id) {
  $(id).classList.remove("active");
}

function closeAllOverlays() {
  document.querySelectorAll(".overlay-panel").forEach((panel) => panel.classList.remove("active"));
}

function openEntryFromMenu() {
  closeOverlay("menuView");
  openOverlay("entryView");
}

function openHistoryFromMenu() {
  closeOverlay("menuView");
  renderHistoryTable();
  openOverlay("historyView");
}

function openSettingsFromMenu() {
  closeOverlay("menuView");
  openSettings();
}

function downloadPdfFromMenu() {
  closeOverlay("menuView");
  downloadPdfReport();
}

function openSettings() {
  const user = getCurrentUser();
  $("settingsName").value = user.name;
  $("settingsBudget").value = user.budget;
  state.selectedSettingsAvatar = user.avatar;
  highlightAvatarChoice("settingsAvatarChoices", user.avatar);
  openOverlay("settingsView");
}

function updateEntryFields() {
  const entryType = $("entryType");
  if (!entryType.options.length) {
    Object.keys(typeMap).forEach((type) => {
      entryType.add(new Option(capitalize(type), type));
    });
  }

  const type = entryType.value || "income";
  const subType = $("entrySubType");
  subType.innerHTML = "";
  typeMap[type].forEach((item) => subType.add(new Option(item, item)));

  const actionWrap = $("entryActionWrap");
  const action = $("entryAction");

  if (type === "income") {
    actionWrap.style.display = "grid";
    action.innerHTML = "";
    action.add(new Option("Credit", "credit"));
  } else if (type === "expense") {
    actionWrap.style.display = "grid";
    action.innerHTML = "";
    action.add(new Option("Debit", "debit"));
  } else {
    actionWrap.style.display = "grid";
    action.innerHTML = "";
    action.add(new Option("Buy", "buy"));
    action.add(new Option("Sell", "sell"));
  }

  document.querySelectorAll("[data-entry-hint]").forEach((hint) => {
    hint.classList.toggle("active", hint.dataset.entryHint === type);
  });
  updateEntryPreview();
}

async function onSaveEntry(event) {
  event.preventDefault();
  const user = getCurrentUser();
  if (!user) return;

  setBusy(true);
  try {
    const entry = {
      id: crypto.randomUUID(),
      date: $("entryDate").value,
      type: $("entryType").value,
      subType: $("entrySubType").value,
      action: $("entryAction").value,
      amount: Number($("entryAmount").value || 0),
      note: $("entryNote").value.trim(),
      reminder: $("entryReminder").value === "yes",
      entryLog: new Date().toLocaleString("en-IN")
    };

    user.entries = user.entries || {};
    user.entries[entry.id] = entry;
    await db.ref(`users/${user.id}`).update({ entries: user.entries });

    $("entryForm").reset();
    showDefaultDate();
    updateEntryFields();
    closeOverlay("entryView");
    refreshApp();
    showToast("Entry saved to Firebase.");
  } catch {
    showToast("Could not save entry.");
  } finally {
    setBusy(false);
  }
}

async function onSaveSettings(event) {
  event.preventDefault();
  const user = getCurrentUser();
  if (!user) return;

  setBusy(true);
  try {
    user.name = $("settingsName").value.trim();
    user.budget = Number($("settingsBudget").value || 0);
    if (state.selectedSettingsAvatar) user.avatar = state.selectedSettingsAvatar;

    await db.ref(`users/${user.id}`).update({
      name: user.name,
      budget: user.budget,
      avatar: user.avatar
    });

    closeOverlay("settingsView");
    refreshApp();
    showToast("Settings updated.");
  } catch {
    showToast("Could not update settings.");
  } finally {
    setBusy(false);
  }
}

function refreshApp() {
  renderDashboard();
  renderCharts();
  renderTables();
  renderHistoryTable();
}

function renderDashboard() {
  const user = getCurrentUser();
  if (!user) return;

  const entries = getEntriesArray(user);
  const summary = buildSummary(entries);
  const thisMonth = getCurrentMonthKey();
  const monthSnapshot = summary.months[thisMonth] || createMonthlyBucket(thisMonth);
  const latestEntry = [...entries].sort((a, b) => b.date.localeCompare(a.date))[0];
  const stats = [
    { label: "Balance", value: summary.overall.balance },
    { label: "Income", value: summary.overall.income },
    { label: "Expenses", value: summary.overall.expenses },
    { label: "Investments", value: summary.overall.investments },
    { label: "Asset Value", value: summary.overall.assets },
    { label: "Other Income", value: summary.overall.otherIncome },
    { label: "Monthly Spend", value: monthSnapshot.expenses }
  ];

  $("dashboardAvatar").src = user.avatar;
  $("dashboardName").textContent = user.name;
  $("dashboardEmail").textContent = user.email;
  $("dashboardMeta").textContent = `${user.age} yrs | ${user.gender} | Limit ${formatMoney(user.budget)}`;
  $("netWorthTrend").textContent = formatMoney(summary.overall.balance + summary.overall.assets);

  $("monthlyHeadline").textContent = monthSnapshot.expenses || monthSnapshot.income || monthSnapshot.investments
    ? `${formatMoney(monthSnapshot.balance)} closing balance`
    : "No activity yet";
  $("monthlySubline").textContent = monthSnapshot.expenses || monthSnapshot.income || monthSnapshot.investments
    ? `${formatMonthKey(thisMonth)}: ${formatMoney(monthSnapshot.income)} in, ${formatMoney(monthSnapshot.expenses)} out, ${formatMoney(monthSnapshot.savings)} saved.`
    : "Add your first entry to see a live monthly snapshot.";
  $("recentActivityText").textContent = `${entries.length} ${entries.length === 1 ? "entry" : "entries"}`;
  $("recentActivitySubtext").textContent = latestEntry
    ? `Last update: ${latestEntry.subType} on ${formatDisplayDate(latestEntry.date)}`
    : "No entries recorded yet.";

  const savingsRatio = monthSnapshot.income > 0 ? Math.round((monthSnapshot.savings / monthSnapshot.income) * 100) : 0;
  $("savingsRatioText").textContent = `${savingsRatio}%`;
  $("savingsRatioSubtext").textContent = monthSnapshot.income > 0
    ? `${formatMoney(monthSnapshot.savings)} routed to SIP, shares, and asset savings this month.`
    : "Based on this month's income.";

  const warningExceeded = user.budget > 0 && monthSnapshot.expenses > user.budget;
  $("budgetWarningBox").classList.toggle("alert", warningExceeded);
  $("budgetWarningText").textContent = warningExceeded
    ? `Exceeded by ${formatMoney(monthSnapshot.expenses - user.budget)}`
    : user.budget > 0
      ? `Within ${formatMoney(user.budget - monthSnapshot.expenses)}`
      : "Set a monthly limit in Settings";

  $("dashboardCards").innerHTML = stats.map((item) => `
    <article class="stat-card">
      <span>${item.label}</span>
      <strong class="${item.value < 0 ? "negative" : item.label === "Balance" ? "positive" : ""}">${formatMoney(item.value)}</strong>
    </article>
  `).join("");

  renderReminderList(entries);
  renderAllocationHighlights(summary.overall, user.budget);
}

function renderReminderList(entries) {
  const reminders = entries
    .filter((entry) => entry.reminder)
    .sort((a, b) => b.date.localeCompare(a.date));

  $("reminderList").innerHTML = reminders.length
    ? reminders.map((entry) => `
      <div class="list-item">
        <div>
          <strong>${entry.subType}</strong>
          <div class="muted">${entry.note || "Reminder from entry"} | ${formatDisplayDate(entry.date)}</div>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span>${formatMoney(entry.amount)}</span>
          <button class="icon-text-btn danger-btn" data-remove-reminder="${entry.id}" type="button" title="Remove reminder">Remove</button>
        </div>
      </div>
    `).join("")
    : `<div class="empty-state">No reminders yet. Mark an entry with "Add Reminder = Yes".</div>`;
}

function renderAllocationHighlights(overall, budget) {
  const list = [
    { label: "Needs", value: overall.needs, cls: "needs" },
    { label: "Wants", value: overall.wants, cls: "wants" },
    { label: "Savings", value: overall.savings, cls: "savings" },
    { label: "Budget Remaining", value: Math.max((budget || 0) - overall.expenses, 0), cls: "needs" }
  ];

  $("allocationHighlights").innerHTML = list.map((item) => `
    <div class="list-item compact">
      <div>
        <strong>${item.label}</strong>
        <div class="muted">${allocationDescription(item.label)}</div>
      </div>
      <div>
        <span class="tag ${item.cls}">${formatMoney(item.value)}</span>
      </div>
    </div>
  `).join("");
}

function renderCharts() {
  const user = getCurrentUser();
  if (!user) return;
  const summary = buildSummary(getEntriesArray(user));
  const currentMonth = summary.months[getCurrentMonthKey()] || createMonthlyBucket(getCurrentMonthKey());
  renderPieChart(summary.overall);
  renderBarChart("expenseCategoryChart", expenseCategories.map((name) => ({
    label: name,
    value: summary.overall.expenseBreakdown[name] || 0
  })), ["#56d6ff", "#4ec7f1"]);

  renderBarChart("sipMonthChart", Object.values(summary.months)
    .sort((a, b) => a.key.localeCompare(b.key))
    .map((month) => ({
    label: month.label,
    value: month.sipBuy
  })), ["#7ef29a", "#4abf7a"]);

  renderBarChart("totalExpenseMonthChart", Object.values(summary.months)
    .sort((a, b) => a.key.localeCompare(b.key))
    .map((month) => ({
    label: month.label,
    value: month.expenses
  })), ["#ffcf67", "#c79b38"]);

  populateMonthFilters(summary.months);
  renderFilteredExpenseChart();
}

function renderPieChart(overall) {
  const values = [
    { label: "Needs", value: overall.needs, color: "#dc2626" },
    { label: "Wants", value: overall.wants, color: "#eab308" },
    { label: "Savings", value: overall.savings, color: "#16a34a" }
  ].filter((item) => item.value > 0);

  if (!values.length) {
    $("pieChart3d").style.background = "#e5e7eb";
    $("pieLabels").innerHTML = "";
    $("pieLegend").innerHTML = '<div class="empty-state">No life till date data</div>';
    return;
  }

  const total = values.reduce((sum, item) => sum + item.value, 0);
  let currentAngle = 0;
  const labelPoints = [];

  values.forEach((item) => {
    const percentage = (item.value / total) * 100;
    const angle = (percentage / 100) * 360;
    const start = currentAngle;
    const end = currentAngle + angle;
    const midAngle = start + angle / 2;

    labelPoints.push({
      label: item.label,
      value: item.value,
      angle: midAngle
    });

    currentAngle = end;
  });

  const gradient = values.map((item, index) => {
    const start = values.slice(0, index).reduce((sum, prev) => {
      return sum + (prev.value / total) * 360;
    }, 0);
    const end = start + (item.value / total) * 360;
    return `${item.color} ${start}deg ${end}deg`;
  }).join(", ");

  $("pieChart3d").style.background = `conic-gradient(${gradient})`;
  $("pieLabels").innerHTML = labelPoints.map((item) => {
    const radians = (item.angle - 90) * (Math.PI / 180);
    const radius = 38;
    const x = 50 + Math.cos(radians) * radius;
    const y = 50 + Math.sin(radians) * radius;
    return `
      <div class="pie-label" style="left:${x}%; top:${y}%;">
        <strong>${item.label}</strong>
        <span>${formatMoney(item.value)}</span>
      </div>
    `;
  }).join("");
  $("pieLegend").innerHTML = values.map((item) => `
    <div class="legend-item" title="${item.label}: ${formatMoney(item.value)}">
      <em><span class="swatch" style="background:${item.color}"></span>${item.label}</em>
      <strong>${formatMoney(item.value)}</strong>
    </div>
  `).join("");
}

function populateMonthFilters(months) {
  const labels = Object.keys(months).sort();
  const options = ['<option value="all">All months</option>'].concat(
    labels.map((key) => `<option value="${key}">${months[key].label}</option>`)
  ).join("");
  $("ledgerMonthFilter").innerHTML = options;
  $("expenseMonthFilter").innerHTML = labels.length
    ? labels.map((key) => `<option value="${key}">${months[key].label}</option>`).join("")
    : `<option value="${getCurrentMonthKey()}">${formatMonthKey(getCurrentMonthKey())}</option>`;
}

function renderFilteredExpenseChart() {
  const user = getCurrentUser();
  if (!user) return;
  const summary = buildSummary(getEntriesArray(user));
  const selected = $("expenseMonthFilter").value || getCurrentMonthKey();
  const month = summary.months[selected] || createMonthlyBucket(selected);
  renderBarChart("filteredExpenseChart", expenseCategories.map((name) => ({
    label: name,
    value: month.expenseBreakdown[name] || 0
  })), ["#ff7e79", "#c7524d"]);
}

function renderBarChart(targetId, data, palette) {
  const target = $(targetId);
  const meaningfulData = data.filter((item) => item.value > 0);
  if (!meaningfulData.length) {
    target.innerHTML = `<div class="empty-state">No data yet.</div>`;
    return;
  }

  const max = Math.max(...meaningfulData.map((item) => item.value), 1);
  target.innerHTML = meaningfulData.map((item) => {
    const height = Math.max((item.value / max) * 190, 16);
    return `
      <div class="bar-wrap" title="${item.label}: ${formatMoney(item.value)}">
        <div class="bar-value">${formatMoney(item.value)}</div>
        <div class="bar-3d" style="height:${height}px;background:linear-gradient(180deg, ${palette[0]}, ${palette[1]});"></div>
        <strong>${item.label}</strong>
      </div>
    `;
  }).join("");
}

function renderTables() {
  const user = getCurrentUser();
  if (!user) return;
  const summary = buildSummary(getEntriesArray(user));
  renderSummaryTable(summary);
  renderBreakdownTable(summary);
  renderLedgerTable();
}

function renderSummaryTable(summary) {
  const headers = ["Month", "Income", "Expenses", "Shares", "SIP", "Asset", "Balance"];
  const rows = Object.values(summary.months)
    .sort((a, b) => a.key.localeCompare(b.key))
    .map((month) => [
      month.label,
      month.income,
      month.expenses,
      month.shareBuy - month.shareSell,
      month.sipBuy - month.sipSell,
      month.assetBuy - month.assetSell,
      month.balance
    ]);
  $("summaryTable").innerHTML = buildTableMarkup(headers, rows);
}

function renderBreakdownTable(summary) {
  const headers = ["Month"].concat(expenseCategories, ["Total"]);
  const rows = Object.values(summary.months)
    .sort((a, b) => a.key.localeCompare(b.key))
    .map((month) => [month.label].concat(expenseCategories.map((name) => month.expenseBreakdown[name] || 0), [month.expenses]));
  $("breakdownTable").innerHTML = buildTableMarkup(headers, rows);
}

function renderLedgerTable() {
  const user = getCurrentUser();
  if (!user) return;
  const summary = buildSummary(getEntriesArray(user));
  const headers = [
    "Date", "Income", "Other Income", "Redeem", "Home", "Mobile", "Travel",
    "Health", "Education", "Food", "Entertainment", "Others", "Write-off", "Asset Savings", "Shares", "SIP", "Balance"
  ];

  const filter = $("ledgerMonthFilter").value || "all";
  const sort = $("ledgerSort").value || "desc";
  const ledgerRows = Object.values(summary.ledger)
    .filter((row) => filter === "all" || row.monthKey === filter)
    .sort((a, b) => sort === "asc" ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date))
    .map((row) => [
      formatDisplayDate(row.date),
      row.income,
      row.otherIncome,
      row.redeem,
      row.home,
      row.mobile,
      row.travel,
      row.health,
      row.education,
      row.food,
      row.entertainment,
      row.others,
      row.writeOff,
      row.assetSavings,
      row.shares,
      row.sip,
      row.balance
    ]);

  $("ledgerTable").innerHTML = buildTableMarkup(headers, ledgerRows);
}

function renderHistoryTable() {
  const user = getCurrentUser();
  if (!user) return;
  const headers = ["Date", "Type", "Sub Type", "Action", "Amount", "Note", "Entry Log", "Delete"];
  const rows = [...getEntriesArray(user)]
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((entry) => [
      formatDisplayDate(entry.date),
      capitalize(entry.type),
      entry.subType,
      capitalize(entry.action),
      formatMoney(entry.amount),
      entry.note || "-",
      entry.entryLog,
      `<button class="icon-text-btn danger-btn" data-delete-entry="${entry.id}" type="button">Delete</button>`
    ]);
  $("historyTable").innerHTML = buildTableMarkup(headers, rows, true);
  document.querySelectorAll("[data-delete-entry]").forEach((button) => {
    button.addEventListener("click", () => deleteEntry(button.dataset.deleteEntry));
  });
  document.querySelectorAll("[data-remove-reminder]").forEach((button) => {
    button.addEventListener("click", () => removeReminder(button.dataset.removeReminder));
  });
}

async function deleteEntry(id) {
  const user = getCurrentUser();
  if (!user) return;

  setBusy(true);
  try {
    delete user.entries[id];
    await db.ref(`users/${user.id}/entries/${id}`).remove();
    refreshApp();
    showToast("Entry deleted.");
  } catch {
    showToast("Could not delete entry.");
  } finally {
    setBusy(false);
  }
}

async function removeReminder(id) {
  const user = getCurrentUser();
  if (!user) return;
  if (!user.entries[id]) return;

  setBusy(true);
  try {
    user.entries[id].reminder = false;
    await db.ref(`users/${user.id}/entries/${id}`).update({ reminder: false });
    refreshApp();
    showToast("Reminder removed.");
  } catch {
    showToast("Could not remove reminder.");
  } finally {
    setBusy(false);
  }
}

function buildTableMarkup(headers, rows, allowHtml = false) {
  const head = `<thead><tr>${headers.map((header) => `<th>${header}</th>`).join("")}</tr></thead>`;
  const bodyRows = rows.length ? rows.map((row) => `
    <tr>${row.map((value, index) => {
      const label = headers[index];
      if (allowHtml && index === row.length - 1) return `<td data-label="${label}">${value}</td>`;
      const display = formatCell(value);
      const isNonZero = typeof value === "number" && value !== 0;
      return `<td class="${isNonZero ? "nonzero" : ""}" data-label="${label}">${display}</td>`;
    }).join("")}</tr>
  `).join("") : `<tr><td colspan="${headers.length}"><div class="empty-state">No data available.</div></td></tr>`;
  return `${head}<tbody>${bodyRows}</tbody>`;
}

function buildSummary(entries) {
  const months = {};
  const ledger = {};
  const overall = {
    income: 0,
    otherIncome: 0,
    expenses: 0,
    investments: 0,
    assets: 0,
    profit: 0,
    balance: 0,
    needs: 0,
    wants: 0,
    savings: 0,
    expenseBreakdown: {}
  };

  entries.forEach((entry) => {
    const monthKey = entry.date.slice(0, 7);
    if (!months[monthKey]) months[monthKey] = createMonthlyBucket(monthKey);
    const month = months[monthKey];

    if (!ledger[entry.date]) ledger[entry.date] = createLedgerRow(entry.date);
    const day = ledger[entry.date];

    if (entry.type === "income") {
      month.income += entry.amount;
      overall.income += entry.amount;
      day.received += entry.amount;
      if (entry.subType === "Salary") {
        day.income += entry.amount;
      } else {
        day.otherIncome += entry.amount;
        overall.otherIncome += entry.amount;
      }
    }

    if (entry.type === "expense") {
      month.expenses += entry.amount;
      month.expenseBreakdown[entry.subType] = (month.expenseBreakdown[entry.subType] || 0) + entry.amount;
      overall.expenseBreakdown[entry.subType] = (overall.expenseBreakdown[entry.subType] || 0) + entry.amount;
      overall.expenses += entry.amount;
      assignBucket(entry.subType, month, entry.amount);
      assignLedgerExpense(day, entry.subType, entry.amount);
      if (entry.subType === "Others") {
        const lowerNote = entry.note.toLowerCase();
        day.writeOff += lowerNote.includes("write") ? entry.amount : 0;
        day.borrowing += lowerNote.includes("borrow") ? entry.amount : 0;
      }
    }

    if (entry.type === "investment") {
      const isBuy = entry.action === "buy";
      const signed = isBuy ? entry.amount : -entry.amount;
      month.investments += isBuy ? entry.amount : 0;
      overall.investments += isBuy ? entry.amount : 0;
      assignBucket(entry.subType, month, entry.amount);
      if (entry.subType === "SIP") {
        month.sipBuy += isBuy ? entry.amount : 0;
        month.sipSell += !isBuy ? entry.amount : 0;
        day.sip += signed;
      } else if (entry.subType === "Shares") {
        month.shareBuy += isBuy ? entry.amount : 0;
        month.shareSell += !isBuy ? entry.amount : 0;
        day.shares += signed;
      } else {
        month.assetBuy += isBuy ? entry.amount : 0;
        month.assetSell += !isBuy ? entry.amount : 0;
        day.assetSavings += signed;
      }
      if (!isBuy) day.redeem += entry.amount;
    }
  });

  Object.values(months).forEach((month) => {
    month.assets = (month.sipBuy - month.sipSell) + (month.shareBuy - month.shareSell) + (month.assetBuy - month.assetSell);
    month.savings = (month.sipBuy - month.sipSell) + (month.shareBuy - month.shareSell) + (month.assetBuy - month.assetSell);
    month.profit = month.income - month.expenses;
    month.balance = month.income - month.expenses - month.investments + month.sipSell + month.shareSell + month.assetSell;
    overall.assets += month.assets;
    overall.profit += month.profit;
    overall.balance += month.balance;
    overall.needs += month.needs;
    overall.wants += month.wants;
    overall.savings += month.savings;
  });

  const orderedDates = Object.keys(ledger).sort();
  let runningBalance = 0;
  orderedDates.forEach((date) => {
    const row = ledger[date];
    runningBalance += row.received - (
      row.home + row.mobile + row.travel + row.health + row.education + row.food + row.entertainment + row.others
    ) - Math.max(row.assetSavings, 0) - Math.max(row.shares, 0) - Math.max(row.sip, 0) + row.redeem;
    row.balance = runningBalance;
  });

  return { months, overall, ledger };
}

function createMonthlyBucket(monthKey) {
  return {
    key: monthKey,
    label: formatMonthKey(monthKey),
    income: 0,
    expenses: 0,
    investments: 0,
    assets: 0,
    profit: 0,
    balance: 0,
    sipBuy: 0,
    sipSell: 0,
    shareBuy: 0,
    shareSell: 0,
    assetBuy: 0,
    assetSell: 0,
    needs: 0,
    wants: 0,
    savings: 0,
    expenseBreakdown: {}
  };
}

function createLedgerRow(date) {
  return {
    date,
    monthKey: date.slice(0, 7),
    income: 0,
    otherIncome: 0,
    received: 0,
    borrowing: 0,
    redeem: 0,
    home: 0,
    mobile: 0,
    travel: 0,
    health: 0,
    education: 0,
    food: 0,
    entertainment: 0,
    others: 0,
    writeOff: 0,
    assetSavings: 0,
    shares: 0,
    sip: 0,
    balance: 0
  };
}

function assignBucket(subType, month, amount) {
  if (needsSet.has(subType)) month.needs += amount;
  if (wantsSet.has(subType)) month.wants += amount;
  // Savings calculation will be done after all entries are processed
}

function assignLedgerExpense(day, subType, amount) {
  const keyMap = {
    Home: "home",
    Mobile: "mobile",
    Travel: "travel",
    Health: "health",
    Education: "education",
    Food: "food",
    Entertainment: "entertainment",
    Others: "others"
  };
  day[keyMap[subType]] += amount;
}

function exportTableCsv(type) {
  const tableMap = {
    summary: "summaryTable",
    breakdown: "breakdownTable",
    ledger: "ledgerTable"
  };
  const table = $(tableMap[type]);
  const rows = Array.from(table.querySelectorAll("tr")).map((tr) =>
    Array.from(tr.children).map((cell) => `"${cell.textContent.trim().replace(/"/g, '""')}"`).join(",")
  );
  downloadBlob(rows.join("\n"), `${type}-report.csv`, "text/csv");
  showToast("CSV exported.");
}

function downloadPdfReport() {
  const user = getCurrentUser();
  if (!user) return;
  const summary = buildSummary(getEntriesArray(user));
  if (window.jspdf?.jsPDF) {
    const pdf = new window.jspdf.jsPDF();
    const lines = [
      "Finance Orbit Report",
      `User: ${user.name}`,
      `Email: ${user.email}`,
      `Income: ${formatMoney(summary.overall.income)}`,
      `Expenses: ${formatMoney(summary.overall.expenses)}`,
      `Investments: ${formatMoney(summary.overall.investments)}`,
      `Balance: ${formatMoney(summary.overall.balance)}`,
      `Assets: ${formatMoney(summary.overall.assets)}`
    ];
    pdf.setFontSize(18);
    pdf.text("Finance Orbit Report", 14, 18);
    pdf.setFontSize(11);
    lines.slice(1).forEach((line, index) => pdf.text(line, 14, 32 + (index * 10)));
    pdf.save(`${user.name.replace(/\s+/g, "-").toLowerCase()}-finance-report.pdf`);
    showToast("PDF report downloaded.");
    return;
  }

  const reportWindow = window.open("", "_blank");
  reportWindow.document.write(`<pre>${JSON.stringify(summary, null, 2)}</pre>`);
  reportWindow.print();
}

function defaultAvatarDataUrl(id) {
  const paletteMap = {
    aurora: ["#56d6ff", "#11263b", "#7ef29a"],
    atlas: ["#ffcf67", "#2b1b0b", "#ff7e79"],
    nova: ["#c788ff", "#201433", "#56d6ff"],
    zen: ["#7ef29a", "#10281b", "#ffcf67"]
  };
  const [primary, dark, accent] = paletteMap[id];
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="220" height="220" viewBox="0 0 220 220">
      <rect width="220" height="220" rx="24" fill="${dark}"/>
      <circle cx="110" cy="76" r="42" fill="${primary}"/>
      <path d="M44 204c10-44 42-68 66-68s56 24 66 68" fill="${accent}"/>
      <circle cx="94" cy="74" r="5" fill="#0f141b"/>
      <circle cx="126" cy="74" r="5" fill="#0f141b"/>
      <path d="M95 95c8 6 22 6 30 0" stroke="#0f141b" stroke-width="5" fill="none" stroke-linecap="round"/>
    </svg>
  `;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function renderAvatarChoices(targetId, context) {
  const container = $(targetId);
  container.innerHTML = avatarPalette.map((avatar) => {
    const source = defaultAvatarDataUrl(avatar.id);
    return `
      <button class="avatar-option" data-avatar-source="${source}" type="button" title="${avatar.label}">
        <img src="${source}" alt="${avatar.label}">
      </button>
    `;
  }).join("");

  container.querySelectorAll(".avatar-option").forEach((button) => {
    button.addEventListener("click", () => {
      if (context === "signup") {
        state.selectedSignupAvatar = button.dataset.avatarSource;
        highlightAvatarChoice("signupAvatarChoices", state.selectedSignupAvatar);
      } else {
        state.selectedSettingsAvatar = button.dataset.avatarSource;
        highlightAvatarChoice("settingsAvatarChoices", state.selectedSettingsAvatar);
      }
    });
  });
}

function highlightAvatarChoice(targetId, selectedSource) {
  $(targetId).querySelectorAll(".avatar-option").forEach((button) => {
    button.classList.toggle("active", button.dataset.avatarSource === selectedSource);
  });
}

function fileToDataUrl(file) {
  return new Promise((resolve) => {
    if (!file) {
      resolve("");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
}

function downloadBlob(content, filename, type) {
  const blob = new Blob([content], { type });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

function showDefaultDate() {
  $("entryDate").value = new Date().toISOString().slice(0, 10);
  updateEntryPreview();
}

function updateEntryPreview() {
  const type = $("entryType").value || "income";
  const subType = $("entrySubType").value || "-";
  const action = $("entryAction").value || "credit";
  const amount = Number($("entryAmount").value || 0);
  const date = $("entryDate").value || new Date().toISOString().slice(0, 10);
  const reminder = $("entryReminder").value === "yes" ? "with a dashboard reminder" : "without a reminder";
  const verb = type === "income" ? "adds to" : type === "expense" ? "reduces" : action === "sell" ? "adds back to" : "moves funds into";
  $("entryPreview").innerHTML = `
    <strong>Preview</strong>
    <div>${capitalize(type)} | ${subType} | ${capitalize(action)}</div>
    <div class="muted">${formatDisplayDate(date)} | ${formatMoney(amount)} ${verb} your balance, ${reminder}.</div>
  `;
}

function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2200);
}

function formatCell(value) {
  if (typeof value === "number") return value === 0 ? "-" : formatMoney(value);
  return value || "-";
}

function formatMoney(value) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value || 0);
}

function formatMonthKey(key) {
  if (!key || !key.includes("-")) return "-";
  const [year, month] = key.split("-");
  return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
}

function formatDisplayDate(value) {
  return new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function getCurrentMonthKey() {
  return new Date().toISOString().slice(0, 7);
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function allocationDescription(label) {
  const map = {
    "Needs": "Essentials like home, mobile, travel, health, and education.",
    "Wants": "Lifestyle and optional spending categories.",
    "Savings": "SIP, shares, and asset savings tracked as investments.",
    "Budget Remaining": "How much room is left before crossing the monthly limit."
  };
  return map[label] || "";
}

async function findUserByEmail(email) {
  const snapshot = await db.ref("users").orderByChild("email").equalTo(email).once("value");
  if (!snapshot.exists()) return null;
  const users = snapshot.val();
  const first = Object.values(users)[0];
  return normalizeUser(first);
}

async function fetchUser(userId) {
  const snapshot = await db.ref(`users/${userId}`).once("value");
  return normalizeUser(snapshot.val());
}

function normalizeUser(user) {
  if (!user) return null;
  return {
    ...user,
    entries: user.entries || {}
  };
}

function getEntriesArray(user) {
  return Object.values(user.entries || {});
}

function setBusy(isBusy) {
  document.body.style.cursor = isBusy ? "progress" : "";
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register("./sw.js").catch(() => {
    // Best-effort offline support.
  });
}
