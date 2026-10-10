// ============================================================
// SALON PORTAL — app.js
// Vanilla JS. No build step. Talks directly to Supabase.
// ============================================================
if (!SUPABASE_URL.startsWith("https://") || SUPABASE_URL.includes("xxxxx") || SUPABASE_ANON_KEY.includes("your-long")) {
  alert("config.js is not set up correctly. Check that SUPABASE_URL starts with https:// and that you pasted your real key, then commit the file on GitHub.");
}
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentProfile = null;
let currentPage = null;
let cache = { businesses: [], customers: [], services: [], categories: [], floors: [], team: [] };

// ---------------------------------------------------------------
// i18n
// ---------------------------------------------------------------
const DICT = {
  en: {
    "app.title": "Salon Portal",
    "auth.login": "Log in", "auth.noAccount": "Don't have an account?", "auth.create": "Create one",
    "auth.signup": "Create account", "auth.backToLogin": "Back to login", "auth.logout": "Log out",
    "pending.title": "Almost there", "pending.pickBusiness": "Select your salon to continue:",
    "pending.continue": "Continue", "pending.waiting": "Your account is waiting for approval from your salon's admin.",
    "pending.checkAgain": "Check again",
    "nav.dashboard": "Dashboard", "nav.businesses": "Businesses", "nav.team": "Team",
    "nav.customers": "Customers", "nav.services": "Services", "nav.queue": "Waiting Board",
    "nav.billing": "Billing", "nav.attendance": "Attendance", "nav.cash": "Cash Reconciliation",
    "common.add": "Add", "common.save": "Save", "common.cancel": "Cancel", "common.search": "Search",
    "common.name": "Name", "common.mobile": "Mobile", "common.notes": "Notes", "common.actions": "Actions",
    "common.status": "Status", "common.role": "Role", "common.approve": "Approve", "common.close": "Close",
    "status.waiting": "Waiting", "status.in_process": "In Process", "status.completed": "Completed",
    "status.pending": "Pending", "status.active": "Active", "status.paid": "Paid", "status.unpaid": "Unpaid",
    "queue.addWalkin": "Add Walk-in / Appointment", "queue.start": "Start Service", "queue.complete": "Complete",
    "billing.generate": "Generate Bill", "billing.takePayment": "Take Payment",
    "attendance.checkIn": "Check In", "attendance.checkOut": "Check Out",
    "dash.totalCustomers": "Total Customers", "dash.waitingNow": "Waiting Now",
    "dash.todayRevenue": "Today's Revenue (Rs.)", "dash.pendingApprovals": "Pending Approvals",
    "dash.totalBusinesses": "Total Businesses",
  },
  ur: {
    "app.title": "سیلون پورٹل",
    "auth.login": "لاگ ان کریں", "auth.noAccount": "اکاؤنٹ نہیں ہے؟", "auth.create": "بنائیں",
    "auth.signup": "اکاؤنٹ بنائیں", "auth.backToLogin": "لاگ ان پر واپس جائیں", "auth.logout": "لاگ آؤٹ",
    "pending.title": "بس تھوڑا سا اور", "pending.pickBusiness": "جاری رکھنے کے لیے اپنا سیلون منتخب کریں:",
    "pending.continue": "جاری رکھیں", "pending.waiting": "آپ کا اکاؤنٹ آپ کے سیلون ایڈمن کی منظوری کا منتظر ہے۔",
    "pending.checkAgain": "دوبارہ چیک کریں",
    "nav.dashboard": "ڈیش بورڈ", "nav.businesses": "سیلونز", "nav.team": "ٹیم",
    "nav.customers": "گاہک", "nav.services": "سروسز", "nav.queue": "انتظار بورڈ",
    "nav.billing": "بلنگ", "nav.attendance": "حاضری", "nav.cash": "کیش ریکنسیلیئشن",
    "common.add": "شامل کریں", "common.save": "محفوظ کریں", "common.cancel": "منسوخ کریں", "common.search": "تلاش کریں",
    "common.name": "نام", "common.mobile": "موبائل", "common.notes": "نوٹس", "common.actions": "اعمال",
    "common.status": "حیثیت", "common.role": "کردار", "common.approve": "منظور کریں", "common.close": "بند کریں",
    "status.waiting": "انتظار میں", "status.in_process": "جاری ہے", "status.completed": "مکمل",
    "status.pending": "زیر التوا", "status.active": "فعال", "status.paid": "ادا شدہ", "status.unpaid": "غیر ادا شدہ",
    "queue.addWalkin": "واک اِن / اپائنٹمنٹ شامل کریں", "queue.start": "سروس شروع کریں", "queue.complete": "مکمل کریں",
    "billing.generate": "بل بنائیں", "billing.takePayment": "ادائیگی وصول کریں",
    "attendance.checkIn": "حاضری لگائیں", "attendance.checkOut": "روانگی لگائیں",
    "dash.totalCustomers": "کل گاہک", "dash.waitingNow": "اس وقت انتظار میں",
    "dash.todayRevenue": "آج کی آمدنی (روپے)", "dash.pendingApprovals": "زیر التوا منظوریاں",
    "dash.totalBusinesses": "کل سیلونز",
  }
};
let locale = localStorage.getItem("locale") || "en";

function t(key) { return (DICT[locale] && DICT[locale][key]) || key; }

function setLocale(l) {
  locale = l;
  localStorage.setItem("locale", l);
  document.documentElement.lang = l;
  document.documentElement.dir = l === "ur" ? "rtl" : "ltr";
  document.querySelectorAll("[data-i18n]").forEach(el => el.textContent = t(el.getAttribute("data-i18n")));
  const sel = document.getElementById("locale-select");
  if (sel) sel.value = l;
  if (currentProfile) renderNav();
  if (currentPage) renderPage(currentPage);
}

// ---------------------------------------------------------------
// AUTH
// ---------------------------------------------------------------
function showLogin() {
  document.getElementById("login-form").classList.remove("hidden");
  document.getElementById("signup-form").classList.add("hidden");
  document.getElementById("back-to-login-line").classList.add("hidden");
  document.querySelector("#auth-view .switch-line").classList.remove("hidden");
}
function showSignup() {
  document.getElementById("login-form").classList.add("hidden");
  document.getElementById("signup-form").classList.remove("hidden");
  document.getElementById("back-to-login-line").classList.remove("hidden");
  document.querySelector("#auth-view .switch-line").classList.add("hidden");
}

document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;
  const { error } = await db.auth.signInWithPassword({ email, password });
  if (error) { document.getElementById("auth-error").textContent = error.message; return; }
  route();
});

document.getElementById("signup-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const full_name = document.getElementById("signup-name").value.trim();
  const email = document.getElementById("signup-email").value.trim();
  const phone = document.getElementById("signup-phone").value.trim();
  const password = document.getElementById("signup-password").value;
  const { error } = await db.auth.signUp({ email, password });
  if (error) { document.getElementById("auth-error").textContent = error.message; return; }
  localStorage.setItem("pending_name", full_name);
  localStorage.setItem("pending_phone", phone);
  route();
});

async function signOut() { await db.auth.signOut(); currentProfile = null; route(); }

// ---------------------------------------------------------------
// ROUTER
// ---------------------------------------------------------------
async function route() {
  const { data: { session } } = await db.auth.getSession();
  if (!session) { show("auth"); return; }

  const { data: profile, error } = await db.from("profiles").select("*").eq("id", session.user.id).single();
  if (error || !profile) {
    show("auth");
    document.getElementById("auth-error").textContent =
      "Logged in, but your profile could not be loaded: " + (error ? error.message : "no profile row found for this user");
    await db.auth.signOut();
    return;
  }
  currentProfile = profile;

  if (!profile.business_id) {
    show("pending");
    document.getElementById("pending-pick-business").classList.remove("hidden");
    document.getElementById("pending-waiting").classList.add("hidden");
    await loadBusinessesForSelect();
    return;
  }
  if (profile.status !== "active") {
    show("pending");
    document.getElementById("pending-pick-business").classList.add("hidden");
    document.getElementById("pending-waiting").classList.remove("hidden");
    return;
  }

  show("app");
  setLocale(profile.preferred_locale || locale);
  renderNav();
  goPage(defaultPageForRole(profile.role));
}

function show(which) {
  document.getElementById("auth-view").classList.toggle("hidden", which !== "auth");
  document.getElementById("pending-view").classList.toggle("hidden", which !== "pending");
  document.getElementById("app-view").classList.toggle("hidden", which !== "app");
}

async function loadBusinessesForSelect() {
  const { data } = await db.from("businesses").select("id,name").eq("status", "active").order("name");
  const sel = document.getElementById("business-select");
  sel.innerHTML = (data || []).map(b => `<option value="${b.id}">${escapeHtml(b.name)}</option>`).join("");
}

async function submitOnboarding() {
  const businessId = document.getElementById("business-select").value;
  if (!businessId) return;
  const full_name = localStorage.getItem("pending_name") || "";
  const phone = localStorage.getItem("pending_phone") || "";
  await db.from("profiles").update({ business_id: businessId, full_name, phone }).eq("id", currentProfile.id);
  localStorage.removeItem("pending_name");
  localStorage.removeItem("pending_phone");
  route();
}

// ---------------------------------------------------------------
// NAV
// ---------------------------------------------------------------
const NAV_BY_ROLE = {
  super_admin: [["dashboard", "nav.dashboard"], ["businesses", "nav.businesses"]],
  admin: [["dashboard", "nav.dashboard"], ["team", "nav.team"], ["customers", "nav.customers"],
          ["services", "nav.services"], ["queue", "nav.queue"], ["billing", "nav.billing"],
          ["attendance", "nav.attendance"], ["cash", "nav.cash"]],
  cashier: [["dashboard", "nav.dashboard"], ["customers", "nav.customers"], ["queue", "nav.queue"],
            ["billing", "nav.billing"], ["cash", "nav.cash"]],
  staff: [["dashboard", "nav.dashboard"], ["queue", "nav.queue"], ["attendance", "nav.attendance"]],
};
function defaultPageForRole(role) { return NAV_BY_ROLE[role][0][0]; }

function renderNav() {
  const items = NAV_BY_ROLE[currentProfile.role] || [];
  document.getElementById("app-nav").innerHTML = items.map(([key, label]) =>
    `<button data-page="${key}" onclick="goPage('${key}')" class="${currentPage === key ? "active" : ""}">${t(label)}</button>`
  ).join("");
}

function goPage(page) {
  currentPage = page;
  document.querySelectorAll("#app-nav button").forEach(b => b.classList.toggle("active", b.dataset.page === page));
  renderPage(page);
}

async function renderPage(page) {
  const main = document.getElementById("app-main");
  main.innerHTML = `<p>Loading…</p>`;
  const renderers = {
    dashboard: renderDashboard, businesses: renderBusinesses, team: renderTeam,
    customers: renderCustomers, services: renderServices, queue: renderQueue,
    billing: renderBilling, attendance: renderAttendance, cash: renderCash,
  };
  if (renderers[page]) await renderers[page](main); else main.innerHTML = "";
}

// ---------------------------------------------------------------
// DASHBOARD
// ---------------------------------------------------------------
async function renderDashboard(main) {
  if (currentProfile.role === "super_admin") {
    const { data: biz } = await db.from("businesses").select("id,status");
    const total = (biz || []).length;
    const active = (biz || []).filter(b => b.status === "active").length;
    main.innerHTML = `
      <div class="page-title">${t("nav.dashboard")}</div>
      <div class="cards-grid">
        <div class="stat-card"><div class="num">${total}</div><div class="label">${t("dash.totalBusinesses")}</div></div>
        <div class="stat-card"><div class="num">${active}</div><div class="label">${t("status.active")}</div></div>
      </div>`;
    return;
  }
  const bId = currentProfile.business_id;
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const [{ count: custCount }, { data: waiting }, { data: paidToday }, { count: pendingCount }] = await Promise.all([
    db.from("customers").select("id", { count: "exact", head: true }).eq("business_id", bId),
    db.from("queue_entries").select("id").eq("business_id", bId).eq("status", "waiting"),
    db.from("invoices").select("total").eq("business_id", bId).eq("status", "paid").gte("paid_at", todayStart.toISOString()),
    db.from("profiles").select("id", { count: "exact", head: true }).eq("business_id", bId).eq("status", "pending"),
  ]);
  const revenue = (paidToday || []).reduce((s, i) => s + Number(i.total), 0);
  let cards = `
    <div class="stat-card"><div class="num">${custCount || 0}</div><div class="label">${t("dash.totalCustomers")}</div></div>
    <div class="stat-card"><div class="num">${(waiting || []).length}</div><div class="label">${t("dash.waitingNow")}</div></div>
    <div class="stat-card"><div class="num">${revenue.toFixed(0)}</div><div class="label">${t("dash.todayRevenue")}</div></div>`;
  if (currentProfile.role === "admin") {
    cards += `<div class="stat-card"><div class="num">${pendingCount || 0}</div><div class="label">${t("dash.pendingApprovals")}</div></div>`;
  }
  main.innerHTML = `<div class="page-title">${t("nav.dashboard")}</div><div class="cards-grid">${cards}</div>`;
}

// ---------------------------------------------------------------
// SUPER ADMIN: BUSINESSES
// ---------------------------------------------------------------
async function renderBusinesses(main) {
  const { data } = await db.from("businesses").select("*").order("created_at", { ascending: false });
  main.innerHTML = `
    <div class="page-title">${t("nav.businesses")}</div>
    <div class="toolbar"><button class="btn" onclick="openBusinessModal()">+ ${t("common.add")}</button></div>
    <table><thead><tr><th>${t("common.name")}</th><th>${t("common.mobile")}</th><th>City</th><th>${t("common.status")}</th></tr></thead>
    <tbody>${(data || []).map(b => `<tr><td>${escapeHtml(b.name)}</td><td>${escapeHtml(b.phone || "")}</td>
      <td>${escapeHtml(b.city || "")}</td><td><span class="badge ${b.status}">${t("status." + b.status) || b.status}</span></td></tr>`).join("")}
    </tbody></table>`;
}
function openBusinessModal() {
  openModal(`
    <h3>${t("nav.businesses")}</h3>
    <input id="biz-name" placeholder="${t('common.name')}" />
    <input id="biz-phone" placeholder="${t('common.mobile')}" />
    <input id="biz-city" placeholder="City" value="Lahore" />
    <div class="actions">
      <button class="btn secondary" onclick="closeModal()">${t('common.cancel')}</button>
      <button class="btn" onclick="createBusiness()">${t('common.save')}</button>
    </div>`);
}
async function createBusiness() {
  const name = document.getElementById("biz-name").value.trim();
  const phone = document.getElementById("biz-phone").value.trim();
  const city = document.getElementById("biz-city").value.trim();
  if (!name) return;
  await db.from("businesses").insert([{ name, phone, city }]);
  closeModal(); renderPage("businesses");
}

// ---------------------------------------------------------------
// ADMIN: TEAM (approve staff, assign roles)
// ---------------------------------------------------------------
async function renderTeam(main) {
  const { data } = await db.from("profiles").select("*").eq("business_id", currentProfile.business_id).order("created_at", { ascending: false });
  const { data: floors } = await db.from("floors").select("*").eq("business_id", currentProfile.business_id);
  cache.floors = floors || [];
  main.innerHTML = `
    <div class="page-title">${t("nav.team")}</div>
    <table><thead><tr><th>${t("common.name")}</th><th>${t("common.mobile")}</th><th>${t("common.role")}</th>
    <th>${t("common.status")}</th><th>${t("common.actions")}</th></tr></thead>
    <tbody>${(data || []).map(p => `<tr>
      <td>${escapeHtml(p.full_name || "—")}</td><td>${escapeHtml(p.phone || "—")}</td>
      <td><span class="badge ${p.role}">${p.role}</span></td>
      <td><span class="badge ${p.status}">${t("status." + p.status) || p.status}</span></td>
      <td>${p.status === "pending" ? `<button class="btn" onclick="approveTeamMember('${p.id}')">${t('common.approve')}</button>` :
        (p.id !== currentProfile.id ? `<button class="btn secondary" onclick="suspendTeamMember('${p.id}','${p.status}')">${p.status === 'suspended' ? t('status.active') : 'Suspend'}</button>` : "")}</td>
    </tr>`).join("")}</tbody></table>`;
}
async function approveTeamMember(id) {
  const role = prompt("Role for this person: admin / cashier / staff", "staff");
  if (!role || !["admin", "cashier", "staff"].includes(role)) return;
  await db.from("profiles").update({ role, status: "active" }).eq("id", id);
  renderPage("team");
}
async function suspendTeamMember(id, currentStatus) {
  const newStatus = currentStatus === "suspended" ? "active" : "suspended";
  await db.from("profiles").update({ status: newStatus }).eq("id", id);
  renderPage("team");
}

// ---------------------------------------------------------------
// CUSTOMERS
// ---------------------------------------------------------------
async function renderCustomers(main, searchTerm = "") {
  let q = db.from("customers").select("*").eq("business_id", currentProfile.business_id).order("created_at", { ascending: false });
  if (searchTerm) q = q.or(`full_name.ilike.%${searchTerm}%,mobile.ilike.%${searchTerm}%`);
  const { data } = await q;
  main.innerHTML = `
    <div class="page-title">${t("nav.customers")}</div>
    <div class="toolbar">
      <input id="cust-search" placeholder="${t('common.search')}..." value="${escapeHtml(searchTerm)}" onkeyup="if(event.key==='Enter') searchCustomers()" />
      <button class="btn secondary" onclick="searchCustomers()">${t('common.search')}</button>
      <button class="btn" onclick="openCustomerModal()">+ ${t("common.add")}</button>
    </div>
    <table><thead><tr><th>${t("common.name")}</th><th>${t("common.mobile")}</th><th>Visits</th><th>Total Spent</th><th>${t("common.notes")}</th></tr></thead>
    <tbody>${(data || []).map(c => `<tr><td>${escapeHtml(c.full_name)}</td><td>${escapeHtml(c.mobile)}</td>
      <td>${c.total_visits}</td><td>Rs. ${Number(c.total_spent).toFixed(0)}</td><td>${escapeHtml(c.notes || "")}</td></tr>`).join("")}
    </tbody></table>`;
}
function searchCustomers() { renderCustomers(document.getElementById("app-main"), document.getElementById("cust-search").value.trim()); }
function openCustomerModal() {
  openModal(`
    <h3>${t("nav.customers")}</h3>
    <input id="c-name" placeholder="${t('common.name')}" />
    <input id="c-mobile" placeholder="03xxxxxxxxx" />
    <textarea id="c-notes" placeholder="${t('common.notes')}"></textarea>
    <div class="actions">
      <button class="btn secondary" onclick="closeModal()">${t('common.cancel')}</button>
      <button class="btn" onclick="createCustomer()">${t('common.save')}</button>
    </div>`);
}
async function createCustomer() {
  const full_name = document.getElementById("c-name").value.trim();
  const mobile = document.getElementById("c-mobile").value.trim();
  const notes = document.getElementById("c-notes").value.trim();
  if (!full_name || !mobile) return;
  const { error } = await db.from("customers").insert([{ business_id: currentProfile.business_id, full_name, mobile, notes }]);
  if (error) { alert(error.message); return; }
  closeModal(); renderPage("customers");
}

// ---------------------------------------------------------------
// SERVICES (admin)
// ---------------------------------------------------------------
async function renderServices(main) {
  const { data } = await db.from("services").select("*").eq("business_id", currentProfile.business_id).order("name_en");
  main.innerHTML = `
    <div class="page-title">${t("nav.services")}</div>
    <div class="toolbar"><button class="btn" onclick="openServiceModal()">+ ${t("common.add")}</button></div>
    <table><thead><tr><th>EN</th><th>UR</th><th>Price (Rs.)</th><th>Duration</th><th>Commission %</th></tr></thead>
    <tbody>${(data || []).map(s => `<tr><td>${escapeHtml(s.name_en)}</td><td>${escapeHtml(s.name_ur || "")}</td>
      <td>${Number(s.price).toFixed(0)}</td><td>${s.duration_minutes} min</td><td>${s.commission_pct}%</td></tr>`).join("")}
    </tbody></table>`;
}
function openServiceModal() {
  openModal(`
    <h3>${t("nav.services")}</h3>
    <input id="s-name-en" placeholder="Service name (English)" />
    <input id="s-name-ur" placeholder="سروس کا نام (اردو)" dir="rtl" />
    <input id="s-price" type="number" placeholder="Price (Rs.)" />
    <input id="s-duration" type="number" placeholder="Duration (minutes)" value="30" />
    <input id="s-commission" type="number" placeholder="Staff commission %" value="0" />
    <div class="actions">
      <button class="btn secondary" onclick="closeModal()">${t('common.cancel')}</button>
      <button class="btn" onclick="createService()">${t('common.save')}</button>
    </div>`);
}
async function createService() {
  const name_en = document.getElementById("s-name-en").value.trim();
  const name_ur = document.getElementById("s-name-ur").value.trim();
  const price = Number(document.getElementById("s-price").value) || 0;
  const duration_minutes = Number(document.getElementById("s-duration").value) || 30;
  const commission_pct = Number(document.getElementById("s-commission").value) || 0;
  if (!name_en) return;
  await db.from("services").insert([{ business_id: currentProfile.business_id, name_en, name_ur, price, duration_minutes, commission_pct }]);
  closeModal(); renderPage("services");
}

// ---------------------------------------------------------------
// QUEUE / WAITING BOARD
// ---------------------------------------------------------------
async function renderQueue(main) {
  const bId = currentProfile.business_id;
  const [{ data: entries }, { data: customers }, { data: services }] = await Promise.all([
    db.from("queue_entries").select("*, customers(full_name), services(name_en, name_ur), profiles!queue_entries_assigned_staff_id_fkey(full_name)")
      .eq("business_id", bId).neq("status", "cancelled").order("created_at"),
    db.from("customers").select("id, full_name, mobile").eq("business_id", bId).order("full_name"),
    db.from("services").select("id, name_en, name_ur, price").eq("business_id", bId).eq("active", true).order("name_en"),
  ]);
  cache.customers = customers || []; cache.services = services || [];
  const cols = ["waiting", "in_process", "completed"];
  const canAddWalkin = ["admin", "cashier"].includes(currentProfile.role);
  main.innerHTML = `
    <div class="page-title">${t("nav.queue")}</div>
    ${canAddWalkin ? `<div class="toolbar"><button class="btn" onclick="openWalkinModal()">+ ${t("queue.addWalkin")}</button></div>` : ""}
    <div class="queue-board">
      ${cols.map(status => `
        <div class="queue-col">
          <h3>${t("status." + status)}</h3>
          ${(entries || []).filter(e => e.status === status).map(e => renderQueueCard(e)).join("") || "<p style='color:#9ca3af;font-size:13px;'>—</p>"}
        </div>`).join("")}
    </div>`;
}
function renderQueueCard(e) {
  const staffName = e.profiles ? e.profiles.full_name : "—";
  let actions = "";
  if (e.status === "waiting" && ["admin", "staff"].includes(currentProfile.role)) {
    actions = `<button onclick="startQueueEntry('${e.id}')">${t("queue.start")}</button>`;
  } else if (e.status === "in_process" && (currentProfile.role === "admin" || e.assigned_staff_id === currentProfile.id)) {
    actions = `<button onclick="completeQueueEntry('${e.id}')">${t("queue.complete")}</button>`;
  }
  return `<div class="queue-card ${e.status}">
    <strong>${escapeHtml(e.customers?.full_name || "—")}</strong>
    <div class="row"><span>${escapeHtml(locale === "ur" && e.services?.name_ur ? e.services.name_ur : e.services?.name_en || "")}</span></div>
    <div class="row"><span>${escapeHtml(staffName)}</span>${actions}</div>
  </div>`;
}
function openWalkinModal() {
  openModal(`
    <h3>${t("queue.addWalkin")}</h3>
    <select id="w-customer">
      <option value="">— ${t('common.search')} ${t('common.name')}/${t('common.mobile')} —</option>
      ${cache.customers.map(c => `<option value="${c.id}">${escapeHtml(c.full_name)} (${escapeHtml(c.mobile)})</option>`).join("")}
    </select>
    <select id="w-service">
      <option value="">— Select Service —</option>
      ${cache.services.map(s => `<option value="${s.id}">${escapeHtml(locale === "ur" && s.name_ur ? s.name_ur : s.name_en)} — Rs.${Number(s.price).toFixed(0)}</option>`).join("")}
    </select>
    <textarea id="w-notes" placeholder="${t('common.notes')}"></textarea>
    <div class="actions">
      <button class="btn secondary" onclick="closeModal()">${t('common.cancel')}</button>
      <button class="btn" onclick="createWalkin()">${t('common.save')}</button>
    </div>`);
}
async function createWalkin() {
  const customer_id = document.getElementById("w-customer").value;
  const service_id = document.getElementById("w-service").value;
  const notes = document.getElementById("w-notes").value.trim();
  if (!customer_id || !service_id) { alert("Pick a customer and a service."); return; }
  await db.from("queue_entries").insert([{
    business_id: currentProfile.business_id, customer_id, service_id, notes,
    status: "waiting", created_by: currentProfile.id,
  }]);
  closeModal(); renderPage("queue");
}
async function startQueueEntry(id) {
  await db.from("queue_entries").update({
    status: "in_process", started_at: new Date().toISOString(),
    assigned_staff_id: currentProfile.role === "staff" ? currentProfile.id : undefined,
  }).eq("id", id);
  renderPage("queue");
}
async function completeQueueEntry(id) {
  await db.from("queue_entries").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", id);
  renderPage("queue");
}

// ---------------------------------------------------------------
// BILLING
// ---------------------------------------------------------------
async function renderBilling(main) {
  const bId = currentProfile.business_id;
  const { data: completed } = await db.from("queue_entries")
    .select("*, customers(full_name), services(name_en, price)")
    .eq("business_id", bId).eq("status", "completed").order("completed_at", { ascending: false });
  const { data: invoiced } = await db.from("invoices").select("queue_entry_id").eq("business_id", bId);
  const invoicedIds = new Set((invoiced || []).map(i => i.queue_entry_id));
  const toBill = (completed || []).filter(e => !invoicedIds.has(e.id));

  const { data: unpaidInvoices } = await db.from("invoices")
    .select("*, customers(full_name)").eq("business_id", bId).eq("status", "unpaid").order("created_at", { ascending: false });

  main.innerHTML = `
    <div class="page-title">${t("nav.billing")}</div>
    <h3>Ready to bill</h3>
    <table><thead><tr><th>${t("common.name")}</th><th>Service</th><th>Price</th><th>${t("common.actions")}</th></tr></thead>
    <tbody>${toBill.map(e => `<tr><td>${escapeHtml(e.customers?.full_name || "")}</td><td>${escapeHtml(e.services?.name_en || "")}</td>
      <td>Rs. ${Number(e.services?.price || 0).toFixed(0)}</td>
      <td><button class="btn" onclick="generateBill('${e.id}','${e.customer_id}',${e.services?.price || 0})">${t('billing.generate')}</button></td></tr>`).join("") || `<tr><td colspan="4">—</td></tr>`}
    </tbody></table>
    <h3 style="margin-top:24px;">Unpaid invoices</h3>
    <table><thead><tr><th>${t("common.name")}</th><th>Total</th><th>${t("common.actions")}</th></tr></thead>
    <tbody>${(unpaidInvoices || []).map(i => `<tr><td>${escapeHtml(i.customers?.full_name || "")}</td>
      <td>Rs. ${Number(i.total).toFixed(0)}</td>
      <td><button class="btn" onclick="openPaymentModal('${i.id}',${i.total})">${t('billing.takePayment')}</button></td></tr>`).join("") || `<tr><td colspan="3">—</td></tr>`}
    </tbody></table>`;
}
function generateBill(queue_entry_id, customer_id, price) {
  openModal(`
    <h3>${t("billing.generate")}</h3>
    <p>Service price: Rs. ${Number(price).toFixed(0)}</p>
    <input id="b-discount" type="number" placeholder="Discount (Rs.)" value="0" />
    <div class="actions">
      <button class="btn secondary" onclick="closeModal()">${t('common.cancel')}</button>
      <button class="btn" onclick="saveInvoice('${queue_entry_id}','${customer_id}',${price})">${t('common.save')}</button>
    </div>`);
}
async function saveInvoice(queue_entry_id, customer_id, price) {
  const discount = Number(document.getElementById("b-discount").value) || 0;
  const total = Math.max(price - discount, 0);
  const { data, error } = await db.from("invoices").insert([{
    business_id: currentProfile.business_id, queue_entry_id, customer_id,
    subtotal: price, discount, total, status: "unpaid", created_by: currentProfile.id,
  }]).select().single();
  if (error) { alert(error.message); return; }
  closeModal();
  openPaymentModal(data.id, total);
}
function openPaymentModal(invoiceId, total) {
  openModal(`
    <h3>${t("billing.takePayment")}</h3>
    <p>Total due: Rs. ${Number(total).toFixed(0)}</p>
    <select id="p-method"><option value="cash">Cash</option><option value="card">Card</option>
      <option value="bank">Bank Transfer</option><option value="other">Other</option></select>
    <input id="p-amount" type="number" value="${total}" />
    <div class="actions">
      <button class="btn secondary" onclick="closeModal()">${t('common.cancel')}</button>
      <button class="btn" onclick="takePayment('${invoiceId}')">${t('common.save')}</button>
    </div>`);
}
async function takePayment(invoiceId) {
  const method = document.getElementById("p-method").value;
  const amount = Number(document.getElementById("p-amount").value) || 0;
  await db.from("payments").insert([{ invoice_id: invoiceId, method, amount, received_by: currentProfile.id }]);
  const { data: inv } = await db.from("invoices").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", invoiceId).select().single();
  if (inv) {
    const { data: cust } = await db.from("customers").select("total_visits,total_spent").eq("id", inv.customer_id).single();
    if (cust) {
      await db.from("customers").update({
        total_visits: (cust.total_visits || 0) + 1,
        total_spent: Number(cust.total_spent || 0) + Number(inv.total),
        last_visit_at: new Date().toISOString(),
      }).eq("id", inv.customer_id);
    }
  }
  closeModal(); renderPage("billing");
}

// ---------------------------------------------------------------
// ATTENDANCE
// ---------------------------------------------------------------
async function renderAttendance(main) {
  const bId = currentProfile.business_id;
  if (currentProfile.role === "staff") {
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const { data: open } = await db.from("attendance").select("*").eq("staff_id", currentProfile.id)
      .gte("check_in_at", todayStart.toISOString()).is("check_out_at", null).maybeSingle();
    main.innerHTML = `
      <div class="page-title">${t("nav.attendance")}</div>
      ${open
        ? `<p>Checked in at ${new Date(open.check_in_at).toLocaleTimeString()}</p><button class="btn" onclick="checkOut('${open.id}')">${t('attendance.checkOut')}</button>`
        : `<button class="btn" onclick="checkIn()">${t('attendance.checkIn')}</button>`}`;
    return;
  }
  const { data } = await db.from("attendance").select("*, profiles(full_name)").eq("business_id", bId).order("check_in_at", { ascending: false }).limit(50);
  main.innerHTML = `
    <div class="page-title">${t("nav.attendance")}</div>
    <table><thead><tr><th>${t("common.name")}</th><th>Check In</th><th>Check Out</th></tr></thead>
    <tbody>${(data || []).map(a => `<tr><td>${escapeHtml(a.profiles?.full_name || "")}</td>
      <td>${new Date(a.check_in_at).toLocaleString()}</td>
      <td>${a.check_out_at ? new Date(a.check_out_at).toLocaleString() : "—"}</td></tr>`).join("")}</tbody></table>`;
}
async function checkIn() {
  await db.from("attendance").insert([{ business_id: currentProfile.business_id, staff_id: currentProfile.id }]);
  renderPage("attendance");
}
async function checkOut(id) {
  await db.from("attendance").update({ check_out_at: new Date().toISOString() }).eq("id", id);
  renderPage("attendance");
}

// ---------------------------------------------------------------
// CASH RECONCILIATION
// ---------------------------------------------------------------
async function renderCash(main) {
  const bId = currentProfile.business_id;
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const { data: cashPayments } = await db.from("payments").select("amount, invoices!inner(business_id)")
    .eq("method", "cash").eq("invoices.business_id", bId).gte("received_at", todayStart.toISOString());
  const expected = (cashPayments || []).reduce((s, p) => s + Number(p.amount), 0);
  const { data: history } = await db.from("cash_reconciliations").select("*, profiles(full_name)").eq("business_id", bId).order("created_at", { ascending: false }).limit(20);
  main.innerHTML = `
    <div class="page-title">${t("nav.cash")}</div>
    <div class="card" style="max-width:420px;margin:0 0 20px;">
      <p>Expected cash today: <strong>Rs. ${expected.toFixed(0)}</strong></p>
      <input id="cr-opening" type="number" placeholder="Opening cash (Rs.)" value="0" />
      <input id="cr-actual" type="number" placeholder="Actual cash counted (Rs.)" />
      <textarea id="cr-notes" placeholder="${t('common.notes')}"></textarea>
      <button class="btn" onclick="submitReconciliation(${expected})">${t('common.save')}</button>
    </div>
    <table><thead><tr><th>${t("common.name")}</th><th>Expected</th><th>Actual</th><th>Diff</th></tr></thead>
    <tbody>${(history || []).map(h => `<tr><td>${escapeHtml(h.profiles?.full_name || "")}</td>
      <td>${Number(h.expected_cash).toFixed(0)}</td><td>${Number(h.actual_cash).toFixed(0)}</td>
      <td>${Number(h.difference).toFixed(0)}</td></tr>`).join("")}</tbody></table>`;
}
async function submitReconciliation(expected) {
  const opening_cash = Number(document.getElementById("cr-opening").value) || 0;
  const actual_cash = Number(document.getElementById("cr-actual").value) || 0;
  const notes = document.getElementById("cr-notes").value.trim();
  const difference = actual_cash - expected;
  await db.from("cash_reconciliations").insert([{
    business_id: currentProfile.business_id, cashier_id: currentProfile.id,
    opening_cash, expected_cash: expected, actual_cash, difference, notes,
  }]);
  renderPage("cash");
}

// ---------------------------------------------------------------
// MODAL + UTIL
// ---------------------------------------------------------------
function openModal(html) {
  closeModal();
  const div = document.createElement("div");
  div.className = "modal-backdrop"; div.id = "active-modal";
  div.innerHTML = `<div class="modal">${html}</div>`;
  div.addEventListener("click", (e) => { if (e.target === div) closeModal(); });
  document.body.appendChild(div);
}
function closeModal() { const m = document.getElementById("active-modal"); if (m) m.remove(); }
function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
}

// ---------------------------------------------------------------
// INIT
// ---------------------------------------------------------------
document.documentElement.lang = locale;
document.documentElement.dir = locale === "ur" ? "rtl" : "ltr";
setLocale(locale);
route();
