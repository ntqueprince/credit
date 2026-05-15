const SUPABASE_URL = "https://pfqondqxyhstbdubblmv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_gulHkmCVaXooXIS907Zu1Q_1nPUy3po";
const AUTH_REDIRECT_URL = "https://ntqueprince.github.io/credit/";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const state = {
  session: null,
  profile: null,
  customers: [],
  entries: [],
  payments: [],
  activeView: "dashboard",
  selectedEntry: null,
  selectedCustomer: null,
  isPasswordRecovery: false,
  isSignup: false,
  sortColumn: "date",
  sortDirection: "desc"
};

const rupee = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0
});

const els = {
  authView: document.querySelector("#authView"),
  workspaceView: document.querySelector("#workspaceView"),
  authForm: document.querySelector("#authForm"),
  signupFields: document.querySelector("#signupFields"),
  authModeLabel: document.querySelector("#authModeLabel"),
  authTitle: document.querySelector("#authTitle"),
  authSubmit: document.querySelector("#authSubmit"),
  toggleAuth: document.querySelector("#toggleAuth"),
  forgotPassword: document.querySelector("#forgotPassword"),
  authMessage: document.querySelector("#authMessage"),
  confirmationView: document.querySelector("#confirmationView"),
  confirmationEmail: document.querySelector("#confirmationEmail"),
  backToSignIn: document.querySelector("#backToSignIn"),
  resetRequestForm: document.querySelector("#resetRequestForm"),
  resetEmail: document.querySelector("#resetEmail"),
  resetRequestMessage: document.querySelector("#resetRequestMessage"),
  backFromReset: document.querySelector("#backFromReset"),
  resetForm: document.querySelector("#resetForm"),
  resetMessage: document.querySelector("#resetMessage"),
  shopLabel: document.querySelector("#shopLabel"),
  mobileShopLabel: document.querySelector("#mobileShopLabel"),
  pageTitle: document.querySelector("#pageTitle"),
  customerForm: document.querySelector("#customerForm"),
  entriesTable: document.querySelector("#entriesTable"),
  emptyState: document.querySelector("#emptyState"),
  dashboardView: document.querySelector("#dashboardView"),
  customersView: document.querySelector("#customersView"),
  customerListView: document.querySelector("#customerListView"),
  customerList: document.querySelector("#customerList"),
  customerEmptyState: document.querySelector("#customerEmptyState"),
  villageSuggestions: document.querySelector("#villageSuggestions"),
  settingsView: document.querySelector("#settingsView"),
  settingsForm: document.querySelector("#settingsForm"),
  settingsMessage: document.querySelector("#settingsMessage"),
  entriesTableWrap: document.querySelector("#entriesTableWrap"),
  paymentDialog: document.querySelector("#paymentDialog"),
  paymentForm: document.querySelector("#paymentForm"),
  paymentFor: document.querySelector("#paymentFor"),
  paymentDate: document.querySelector("#paymentDate"),
  itemRows: document.querySelector("#itemRows"),
  addItemRow: document.querySelector("#addItemRow"),
  editItemRows: document.querySelector("#editItemRows"),
  addEditItemRow: document.querySelector("#addEditItemRow"),
  customerDialog: document.querySelector("#customerDialog"),
  editCustomerForm: document.querySelector("#editCustomerForm"),
  accountDialog: document.querySelector("#accountDialog"),
  accountDialogTitle: document.querySelector("#accountDialogTitle"),
  accountDialogMessage: document.querySelector("#accountDialogMessage"),
  dashboardActions: document.querySelector("#dashboardActions"),
  customerSearchInput: document.querySelector("#customerSearchInput"),
  customerViewDialog: document.querySelector("#customerViewDialog"),
  viewCustomerTitle: document.querySelector("#viewCustomerTitle"),
  viewCustomerInfo: document.querySelector("#viewCustomerInfo"),
  viewCustomerBill: document.querySelector("#viewCustomerBill"),
  viewCustomerJama: document.querySelector("#viewCustomerJama"),
  viewCustomerBaki: document.querySelector("#viewCustomerBaki"),
  viewCustomerEntries: document.querySelector("#viewCustomerEntries")
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

function setMessage(message, isError = false) {
  els.authMessage.textContent = message;
  els.authMessage.style.color = isError ? "#991b1b" : "";
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showAuthPopup(title, message) {
  els.accountDialogTitle.textContent = title;
  els.accountDialogMessage.textContent = message;
  if (typeof els.accountDialog.showModal === "function") {
    els.accountDialog.showModal();
    return;
  }

  alert(`${title}\n${message}`);
}

function withTimeout(promise, message, timeoutMs = 20000) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), timeoutMs);
  });

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function getAuthRedirectUrl() {
  return AUTH_REDIRECT_URL;
}

function showAuthForm() {
  els.authForm.classList.remove("hidden");
  els.resetRequestForm.classList.add("hidden");
  els.confirmationView.classList.add("hidden");
  els.resetForm.classList.add("hidden");
}

function showResetRequestForm() {
  els.authForm.classList.add("hidden");
  els.confirmationView.classList.add("hidden");
  els.resetForm.classList.add("hidden");
  els.resetRequestForm.classList.remove("hidden");
  els.resetRequestMessage.textContent = "";
  els.resetRequestMessage.style.color = "";
  els.resetEmail.value = document.querySelector("#email").value.trim();
  els.resetEmail.focus();
}

function showPasswordRecoveryForm() {
  state.isPasswordRecovery = true;
  els.authForm.classList.add("hidden");
  els.resetRequestForm.classList.add("hidden");
  els.confirmationView.classList.add("hidden");
  els.resetForm.classList.remove("hidden");
  els.authView.classList.remove("hidden");
  els.workspaceView.classList.add("hidden");
  els.resetMessage.textContent = "";
  els.resetMessage.style.color = "";
}

function isPasswordRecoveryUrl() {
  const params = new URLSearchParams((window.location.hash || "").replace(/^#/, ""));
  const type = params.get("type");
  return type === "recovery" || (params.has("access_token") && type !== "signup");
}

function handleAuthHashMessage() {
  const params = new URLSearchParams((window.location.hash || "").replace(/^#/, ""));
  const errorCode = params.get("error_code");
  const errorDescription = params.get("error_description");

  if (errorCode) {
    state.isPasswordRecovery = false;
    const expired = errorCode === "otp_expired";
    const message = expired
      ? "Password reset link expired ho gaya hai. Please Forgot password se naya reset email bhejein aur latest email link open karein."
      : (errorDescription || "Password reset link valid nahi hai. Please naya reset email bhejein.");
    setMessage(message, true);
    showAuthForm();
    return true;
  }

  if (isPasswordRecoveryUrl()) {
    showPasswordRecoveryForm();
    return true;
  }

  return false;
}

function showConfirmation(email) {
  els.authForm.classList.add("hidden");
  els.resetRequestForm.classList.add("hidden");
  els.resetForm.classList.add("hidden");
  els.confirmationView.classList.remove("hidden");
  els.confirmationEmail.textContent = email ? `Confirmation sent to ${email}` : "";
}

function resetSignupFields() {
  document.querySelector("#shopName").value = "";
  document.querySelector("#ownerName").value = "";
  document.querySelector("#ownerPhone").value = "";
}

function showExistingAccountPopup() {
  const message = "This email already has a DigiKhata account. Please sign in or use forgot password.";
  setMessage(message, true);
  showAuthPopup("Account already exists", message);
}

function toggleAuthMode() {
  state.isSignup = !state.isSignup;
  showAuthForm();
  if (state.isSignup) resetSignupFields();
  els.signupFields.classList.toggle("hidden", !state.isSignup);
  els.authModeLabel.textContent = state.isSignup ? "Create account" : "Sign in";
  els.authTitle.textContent = state.isSignup ? "Register your shop" : "Access your account";
  els.authSubmit.textContent = state.isSignup ? "Create account" : "Sign in";
  els.toggleAuth.textContent = state.isSignup ? "Already registered? Sign in" : "New shopkeeper? Create account";
  setMessage("");
}

async function handleAuth(event) {
  event.preventDefault();
  els.authSubmit.disabled = true;
  setMessage("Please wait...");

  try {
    const email = document.querySelector("#email").value.trim();
    const password = document.querySelector("#password").value;

    if (!isValidEmail(email)) {
      const message = "Please enter a valid email address.";
      setMessage(message, true);
      showAuthPopup("Invalid email", message);
      return;
    }

    if (!password || password.length < 6) {
      const message = "Password is invalid. Please enter at least 6 characters.";
      setMessage(message, true);
      showAuthPopup("Invalid password", message);
      return;
    }

    if (state.isSignup) {
      const shopName = document.querySelector("#shopName").value.trim();
      const ownerName = document.querySelector("#ownerName").value.trim();
      const phone = document.querySelector("#ownerPhone").value.trim();

      if (!shopName || !ownerName) {
        setMessage("Shop name and owner name are required.", true);
        return;
      }

      const { data, error } = await withTimeout(supabaseClient.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: getAuthRedirectUrl(),
          data: { shop_name: shopName, owner_name: ownerName, phone }
        }
      }), "Signup is taking too long. Please check your mobile internet and try again.");

      if (error) {
        if (/already|registered|exists/i.test(error.message)) {
          showExistingAccountPopup();
          return;
        }

        setMessage(error.message, true);
        return;
      }

      if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        showExistingAccountPopup();
        return;
      }

      event.target.reset();
      state.isSignup = false;
      els.signupFields.classList.add("hidden");
      showConfirmation(email);
      return;
    }

    const { error } = await withTimeout(
      supabaseClient.auth.signInWithPassword({ email, password }),
      "Login is taking too long. Please check your mobile internet and try again."
    );
    if (error) {
      if (/invalid login credentials/i.test(error.message)) {
        const message = "No account was found for this email, or the password is incorrect. Please check the email and password, or create a new account.";
        setMessage(message, true);
        showAuthPopup("Sign in failed", message);
        return;
      }

      setMessage(error.message, true);
      showAuthPopup("Sign in error", error.message);
      return;
    }

    setMessage("Opening your ledger...");
    await boot();
  } catch (error) {
    const message = error.message || "Login ho gaya, lekin ledger load nahi ho pa raha. Please refresh karke dobara try karein.";
    setMessage(message, true);
    showAuthPopup("Could not open ledger", message);
  } finally {
    els.authSubmit.disabled = false;
  }
}

async function handleForgotPassword() {
  showResetRequestForm();
}

async function sendPasswordReset(event) {
  event.preventDefault();
  els.resetRequestMessage.textContent = "Sending reset link...";
  els.resetRequestMessage.style.color = "";

  const email = els.resetEmail.value.trim();
  if (!isValidEmail(email)) {
    els.resetRequestMessage.textContent = "Please enter a valid email address.";
    els.resetRequestMessage.style.color = "#991b1b";
    showAuthPopup("Invalid email", "Please enter a valid email address.");
    return;
  }

  const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
    redirectTo: getAuthRedirectUrl()
  });

  if (error) {
    els.resetRequestMessage.textContent = error.message;
    els.resetRequestMessage.style.color = "#991b1b";
    return;
  }

  els.resetRequestMessage.textContent = "Password reset link has been sent. Please check your email.";
}

async function ensureProfile() {
  const user = state.session.user;
  const { data, error } = await supabaseClient
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw error;
  if (data) {
    state.profile = data;
    return;
  }

  const meta = user.user_metadata || {};
  const profile = {
    id: user.id,
    shop_name: meta.shop_name || "DigiKhata Shop",
    owner_name: meta.owner_name || user.email,
    phone: meta.phone || ""
  };

  const { data: inserted, error: insertError } = await supabaseClient
    .from("profiles")
    .insert(profile)
    .select()
    .single();

  if (insertError) throw insertError;
  state.profile = inserted;
}

async function loadData() {
  const [
    { data: customers, error: customersError },
    { data: entries, error: entriesError },
    { data: payments, error: paymentsError }
  ] =
    await Promise.all([
      supabaseClient.from("customers").select("*").order("created_at", { ascending: false }),
      supabaseClient.from("credit_entry_summary").select("*").order("credit_date", { ascending: false }),
      supabaseClient.from("payments").select("*").order("payment_date", { ascending: false })
    ]);

  if (customersError) throw customersError;
  if (entriesError) throw entriesError;
  if (paymentsError) throw paymentsError;

  state.customers = customers || [];
  state.entries = entries || [];
  state.payments = payments || [];
  render();
}

async function refreshData() {
  const button = document.querySelector("#refreshData");
  button.disabled = true;
  const originalText = button.textContent;
  button.textContent = "Refreshing...";

  try {
    await loadData();
  } catch (error) {
    const message = error.message || "Data refresh failed. Please check your internet and try again.";
    showAuthPopup("Refresh failed", message);
  } finally {
    button.disabled = false;
    button.textContent = originalText;
  }
}

async function boot() {
  if (state.isPasswordRecovery || isPasswordRecoveryUrl()) {
    showPasswordRecoveryForm();
    return;
  }

  const { data } = await supabaseClient.auth.getSession();
  state.session = data.session;

  if (!state.session) {
    els.authView.classList.remove("hidden");
    els.workspaceView.classList.add("hidden");
    if (els.confirmationView.classList.contains("hidden")) {
      showAuthForm();
    }
    return;
  }

  await ensureProfile();
  els.authView.classList.add("hidden");
  els.workspaceView.classList.remove("hidden");
  els.shopLabel.textContent = state.profile.shop_name;
  els.mobileShopLabel.textContent = state.profile.shop_name;
  await loadData();
  fillSettingsForm();
  setActiveView(state.activeView);
}

function setActiveView(view) {
  state.activeView = view;
  document.querySelectorAll(".nav-btn").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === view);
  });
  document.querySelectorAll(".bottom-nav-btn").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === view);
  });

  const labels = {
    dashboard: "Dashboard",
    customers: "Customers",
    reminders: "Reminders",
    settings: "Settings"
  };

  els.pageTitle.textContent = labels[view];
  els.dashboardView.classList.toggle("hidden", view !== "dashboard");
  els.dashboardActions.classList.toggle("hidden", view !== "dashboard");
  els.customersView.classList.toggle("hidden", view !== "customers");
  els.customerListView.classList.toggle("hidden", view !== "customers");
  els.settingsView.classList.toggle("hidden", view !== "settings");
  els.entriesTableWrap.classList.toggle("hidden", view !== "reminders");
  if (view === "customers") {
    els.customerForm.classList.add("hidden");
    document.querySelector("#toggleCustomerForm").textContent = "\u2795 Add New Customer";
  }
  if (view === "settings") fillSettingsForm();
  renderTable();
}

function render() {
  renderVillageSuggestions();
  renderCustomerList();
  renderStats();
  renderTable();
}

function renderVillageSuggestions() {
  const villages = [...new Set(state.customers
    .map((customer) => String(customer.location || "").trim())
    .filter(Boolean))]
    .sort((a, b) => a.localeCompare(b));

  els.villageSuggestions.innerHTML = villages
    .map((village) => `<option value="${escapeHtml(village)}"></option>`)
    .join("");
}

function renderCustomerList() {
  els.customerList.innerHTML = "";
  
  const query = (els.customerSearchInput?.value || "").toLowerCase().trim();
  const filteredCustomers = state.customers.filter((customer) => {
    if (!query) return true;
    const nameMatch = String(customer.name || "").toLowerCase().includes(query);
    const locationMatch = String(customer.location || "").toLowerCase().includes(query);
    return nameMatch || locationMatch;
  });

  els.customerEmptyState.classList.toggle("hidden", filteredCustomers.length > 0);
  if (filteredCustomers.length === 0 && state.customers.length > 0) {
    els.customerEmptyState.textContent = "No customers match your search.";
  } else {
    els.customerEmptyState.textContent = "No customers yet.";
  }

  filteredCustomers.forEach((customer) => {
    const customerEntries = state.entries.filter((entry) => entry.customer_id === customer.id);
    const card = document.createElement("article");
    card.className = "customer-card";
    card.innerHTML = `
      <button class="customer-toggle" type="button" aria-expanded="false">
        <strong>${escapeHtml(customer.name || "-")}</strong>
        <span>Show details</span>
      </button>
      <div class="customer-details hidden">
        <span>${escapeHtml([
          customer.phone,
          customer.location ? `Gaon: ${customer.location}` : "",
          customer.address ? `Address: ${customer.address}` : ""
        ].filter(Boolean).join(" | ") || "No phone or address")}</span>
        ${customer.notes ? `<small>${escapeHtml(customer.notes)}</small>` : ""}
        <div class="customer-items">
          ${customerEntries.length ? customerEntries.map((entry) => `
            <div class="customer-item-line ${getEntryMaterial(entry) ? `material-line-${getEntryMaterial(entry)}` : ""}">
              ${formatItemName(entry)}
              <b>${rupee.format(Number(entry.amount || 0))}</b>
            </div>
          `).join("") : "<small>No item entries yet.</small>"}
        </div>
        <div class="customer-actions">
          <button class="primary-btn small-btn" type="button" data-view-customer="${customer.id}">View</button>
          <button class="primary-btn small-btn" type="button" data-whatsapp-customer="${customer.id}">WhatsApp</button>
          <button class="ghost-btn small-btn" type="button" data-edit-customer="${customer.id}">Edit</button>
          <button class="danger-btn small-btn" type="button" data-delete-customer="${customer.id}">Delete</button>
        </div>
      </div>
    `;
    els.customerList.appendChild(card);
  });
}

function fillSettingsForm() {
  if (!state.profile || !state.session) return;
  document.querySelector("#settingShopName").value = state.profile.shop_name || "";
  document.querySelector("#settingOwnerName").value = state.profile.owner_name || "";
  document.querySelector("#settingPhone").value = state.profile.phone || "";
  document.querySelector("#settingEmail").value = state.session.user.email || "";
  document.querySelector("#settingPassword").value = "";
  els.settingsMessage.textContent = "";
  els.settingsMessage.style.color = "";
}

function renderStats() {
  const total = state.entries.reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
  const remaining = state.entries.reduce((sum, entry) => sum + Number(entry.remaining_amount || 0), 0);
  const overdue = state.entries.filter((entry) => entry.calculated_status !== "paid" && Number(entry.overdue_days || 0) > 0).length;

  document.querySelector("#statTotal").textContent = rupee.format(total);
  document.querySelector("#statRemaining").textContent = rupee.format(remaining);
  document.querySelector("#statCustomers").textContent = state.customers.length;
  document.querySelector("#statOverdue").textContent = overdue;
}

function getFilteredEntries() {
  let list = [...state.entries];

  if (state.activeView === "reminders") {
    list = list.filter((entry) => entry.calculated_status !== "paid" && entry.due_date);
  }

  const col = state.sortColumn;
  const dir = state.sortDirection === "asc" ? 1 : -1;

  list.sort((a, b) => {
    if (col === "credit") return dir * (Number(a.amount || 0) - Number(b.amount || 0));
    if (col === "remaining") return dir * (Number(a.remaining_amount || 0) - Number(b.remaining_amount || 0));
    if (col === "date") return dir * (new Date(a.credit_date || 0) - new Date(b.credit_date || 0));
    if (col === "due") return dir * (new Date(a.due_date || "9999") - new Date(b.due_date || "9999"));
    if (col === "status") {
      const order = { pending: 0, partial: 1, paid: 2 };
      return dir * ((order[a.calculated_status] ?? 3) - (order[b.calculated_status] ?? 3));
    }
    return dir * (new Date(a.credit_date || 0) - new Date(b.credit_date || 0));
  });

  return list;
}

function renderTable() {
  const list = getFilteredEntries();
  els.entriesTable.innerHTML = "";
  els.emptyState.classList.toggle("hidden", list.length > 0);

  list.forEach((entry) => {
    const row = document.createElement("tr");
    const material = getEntryMaterial(entry);
    if (material) row.classList.add(`material-${material}`);
    const overdueText = entry.overdue_days > 0 && entry.calculated_status !== "paid"
      ? `${entry.due_date || "-"} (${entry.overdue_days} days)`
      : entry.due_date || "-";
    const commitmentAmount = getCommitmentAmount(entry);
    const commitmentText = commitmentAmount
      ? `${overdueText}<small>Committed: ${rupee.format(commitmentAmount)}</small>`
      : overdueText;
    const history = state.payments
      .filter((payment) => payment.credit_entry_id === entry.id)
      .map((payment) => `${payment.payment_date}: ${rupee.format(Number(payment.amount || 0))}`)
      .join("<br>");

    row.innerHTML = `
      <td class="customer-cell" data-label="">
        <button class="entry-toggle" type="button" aria-expanded="false">
          <strong>${escapeHtml(entry.customer_name || "-")}</strong>
          <span>Show details</span>
        </button>
        <span class="customer-meta">${escapeHtml([entry.customer_phone, entry.customer_location ? `Gaon: ${entry.customer_location}` : ""].filter(Boolean).join(" | "))}</span>
      </td>
      <td class="item-cell" data-label="">${formatItemName(entry)}</td>
      <td class="bill-cell" data-label="Bill">${rupee.format(Number(entry.amount || 0))}</td>
      <td class="paid-cell" data-label="Jama">${rupee.format(Number(entry.paid_amount || 0))}<small>${history || ""}</small></td>
      <td class="remaining-cell" data-label="Baki">${rupee.format(Number(entry.remaining_amount || 0))}</td>
      <td class="date-cell" data-label="Tarikh">${entry.credit_date || "-"}</td>
      <td class="due-cell" data-label="Vaada">${commitmentText}</td>
      <td class="status-cell" data-label="Status"><span class="badge ${entry.calculated_status}">${entry.calculated_status}</span></td>
      <td class="payment-cell" data-label=""><button class="ghost-btn" data-payment="${entry.id}">Jama karo</button></td>
    `;

    els.entriesTable.appendChild(row);
  });
}

function getEntryMaterial(entry) {
  const itemName = String(entry.item_name || "").toLowerCase();
  if (itemName.includes("material: gold") || itemName.includes("gold")) return "gold";
  if (itemName.includes("material: silver") || itemName.includes("silver")) return "silver";
  return "";
}

function formatItemName(entry) {
  const parts = String(entry.item_name || "-")
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) return "-";

  const materialPart = parts.find((part) => part.toLowerCase().startsWith("material:"));
  const material = materialPart ? materialPart.replace(/^material:\s*/i, "") : "";
  const name = parts.find((part) => !/^material:/i.test(part) && !/^weight:/i.test(part) && !/^unit:/i.test(part)) || parts[0];
  const materialClass = material.toLowerCase() === "gold" ? "gold" : material.toLowerCase() === "silver" ? "silver" : "other";

  return `
    <strong>${escapeHtml(name)}</strong>
    ${material ? `<span class="material-pill ${materialClass}">${escapeHtml(material)}</span>` : ""}
  `;
}

function getItemParts(entry) {
  const parts = String(entry.item_name || "")
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean);
  const readPart = (label) => (parts.find((part) => part.toLowerCase().startsWith(`${label}:`)) || "").replace(new RegExp(`^${label}:\\s*`, "i"), "");

  return {
    name: parts.find((part) => !/^(material|weight|unit):/i.test(part)) || "-",
    material: readPart("material"),
    unit: readPart("unit"),
    weight: readPart("weight")
  };
}

function getCommitmentAmount(entry) {
  const match = String(entry.notes || "").match(/\[commitment_amount:([0-9.]+)\]/i);
  return match ? Number(match[1]) : 0;
}

function cleanEntryNotes(notes) {
  return String(notes || "").replace(/\s*\[commitment_amount:[0-9.]+\]\s*/gi, "").trim();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function parseEntryItem(entry) {
  const parts = String(entry.item_name || "")
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean);
  const material = (parts.find((part) => /^material:/i.test(part)) || "").replace(/^material:\s*/i, "");
  const unit = (parts.find((part) => /^unit:/i.test(part)) || "").replace(/^unit:\s*/i, "");
  const weightStr = (parts.find((part) => /^weight:/i.test(part)) || "").replace(/^weight:\s*/i, "");
  const weightParts = weightStr.trim().split(/\s+/);
  const weightVal = weightParts[0] || "";
  const weightUnit = weightParts[1] || "gram";
  const name = parts.find((part) => !/^(material|unit|weight):/i.test(part)) || "";
  const normalizedMaterial = material.toLowerCase();
  const materialValue = ["gold", "silver"].includes(normalizedMaterial) ? normalizedMaterial : material ? "other" : "";

  return {
    id: entry.id,
    name,
    weight: weightStr,
    weightVal,
    weightUnit,
    unit,
    material: materialValue,
    otherMaterial: materialValue === "other" ? material : "",
    amount: Number(entry.amount || 0),
    paidAmount: Number(entry.paid_amount || 0),
    remainingAmount: Number(entry.remaining_amount || 0),
    creditDate: entry.credit_date || today(),
    dueDate: entry.due_date || null,
    notes: cleanEntryNotes(entry.notes || ""),
    commitmentAmount: getCommitmentAmount(entry)
  };
}

function createItemRow(item = {}, container = els.itemRows) {
  const row = document.createElement("div");
  row.className = "item-row";
  if (item.id) row.dataset.entryId = item.id;
  if (item.creditDate) row.dataset.creditDate = item.creditDate;
  const hasDues = item.id && (item.paidAmount > 0 || item.remainingAmount > 0);
  const duesHtml = hasDues
    ? `<div class="item-dues">Jama: ${rupee.format(item.paidAmount || 0)} | Baki: ${rupee.format(item.remainingAmount || 0)}</div>`
    : "";
  row.innerHTML = `
    ${duesHtml}
    <input class="item-name" type="text" placeholder="Saman / item name" value="${escapeHtml(item.name || "")}">
    <div style="display:flex; gap: 8px;">
      <input class="item-weight-val" type="number" step="any" placeholder="Weight (e.g. 10)" value="${escapeHtml(item.weightVal || "")}" style="flex: 1;">
      <select class="item-weight-unit" style="flex: 0 0 90px; padding-left: 8px; padding-right: 8px;">
        <option value="gram">gram</option>
        <option value="mg">mg</option>
      </select>
    </div>
    <select class="item-unit">
      <option value="">Piece / Pair / Set</option>
      <option value="Piece">Piece</option>
      <option value="Pair">Pair</option>
      <option value="Set">Set</option>
    </select>
    <select class="item-material">
      <option value="">Gold / Silver / Other</option>
      <option value="gold">Gold</option>
      <option value="silver">Silver</option>
      <option value="other">Other</option>
    </select>
    <input class="item-other-material hidden" type="text" placeholder="Other item type" value="${escapeHtml(item.otherMaterial || "")}">
    <input class="item-amount" type="number" min="1" step="0.01" placeholder="Price" value="${item.amount || ""}">
    <div style="display:flex; gap: 8px;">
      <div style="flex: 1;"><small style="display:block; color:var(--muted); font-size:11px; margin-bottom:2px;">Sell Date (Tarikh)</small><input class="item-credit-date" type="date" value="${item.creditDate || today()}" style="width: 100%;"></div>
      <div style="flex: 1;"><small style="display:block; color:var(--muted); font-size:11px; margin-bottom:2px;">Due Date (Vaada)</small><input class="item-due-date" type="date" value="${item.dueDate || ""}" style="width: 100%;"></div>
    </div>
    <input class="item-commitment" type="number" min="1" step="0.01" placeholder="Committed amount" value="${item.commitmentAmount || ""}">
    <button class="ghost-btn small-btn remove-item" type="button">Remove</button>
  `;

  row.querySelector(".item-weight-unit").value = item.weightUnit || "gram";
  row.querySelector(".item-unit").value = item.unit || "";
  row.querySelector(".item-material").value = item.material || "";
  const syncOtherMaterial = (event) => {
    const otherInput = row.querySelector(".item-other-material");
    const showOther = event.target.value === "other";
    otherInput.classList.toggle("hidden", !showOther);
    otherInput.required = showOther;
  };
  row.querySelector(".item-material").addEventListener("change", syncOtherMaterial);
  syncOtherMaterial({ target: row.querySelector(".item-material") });
  row.querySelector(".remove-item").addEventListener("click", () => {
    if (container.children.length > 1) row.remove();
  });

  return row;
}

function resetItemRows(container = els.itemRows, items = [{}]) {
  container.innerHTML = "";
  items.forEach((item) => container.appendChild(createItemRow(item, container)));
}

function collectItemRows(container = els.itemRows) {
  return [...container.querySelectorAll(".item-row")]
    .map((row) => {
      const material = row.querySelector(".item-material").value;
      const otherMaterial = row.querySelector(".item-other-material").value.trim();
      const materialLabel = material === "other"
        ? otherMaterial
        : material ? material.charAt(0).toUpperCase() + material.slice(1) : "";

        const weightVal = row.querySelector(".item-weight-val").value.trim();
      const weightUnit = row.querySelector(".item-weight-unit").value;
      const weight = weightVal ? `${weightVal} ${weightUnit}` : "";

      return {
        id: row.dataset.entryId || "",
        name: row.querySelector(".item-name").value.trim(),
        weight,
        unit: row.querySelector(".item-unit").value,
        material,
        materialLabel,
        amount: Number(row.querySelector(".item-amount").value),
        creditDate: row.querySelector(".item-credit-date").value || today(),
        dueDate: row.querySelector(".item-due-date").value || null,
        commitmentAmount: Number(row.querySelector(".item-commitment").value || 0)
      };
    })
    .filter((item) => item.name || item.weight || item.unit || item.material || item.amount);
}

function findInvalidItem(items) {
  return items.find((item) => !item.name || !item.unit || !item.material || !item.amount || (item.material === "other" && !item.materialLabel));
}

function itemToEntryPayload(item, customerId, notes = "") {
  const noteParts = [
    cleanEntryNotes(notes),
    item.commitmentAmount ? `[commitment_amount:${item.commitmentAmount}]` : ""
  ].filter(Boolean);

  return {
    user_id: state.session.user.id,
    customer_id: customerId,
    item_name: [
      item.name,
      `Material: ${item.materialLabel}`,
      `Unit: ${item.unit}`,
      item.weight ? `Weight: ${item.weight}` : ""
    ].filter(Boolean).join(" | "),
    amount: item.amount,
    credit_date: item.creditDate || today(),
    due_date: item.dueDate || null,
    notes: noteParts.join(" ")
  };
}

async function addCustomer(event) {
  event.preventDefault();
  const village = document.querySelector("#customerVillage").value.trim();
  const address = document.querySelector("#customerAddress").value.trim();
  const items = collectItemRows();

  if (items.length === 0) {
    showAuthPopup("Item details needed", "Please add at least one item for this customer.");
    return;
  }

  if (findInvalidItem(items)) {
    showAuthPopup("Item details needed", "Please add item name, piece/pair/set, material type, price, and other item type if Other is selected.");
    return;
  }

  for (const item of items) {
    if ((item.dueDate && !item.commitmentAmount) || (!item.dueDate && item.commitmentAmount)) {
      showAuthPopup("Commitment details needed", `Item "${item.name}" mein commitment date aur amount dono daalein, ya dono khaali rakhein.`);
      return;
    }
  }

  const payload = {
    user_id: state.session.user.id,
    name: document.querySelector("#customerName").value.trim(),
    phone: document.querySelector("#customerPhone").value.trim(),
    location: village,
    address,
    notes: document.querySelector("#customerNotes").value.trim()
  };

  const { data: customer, error } = await supabaseClient
    .from("customers")
    .insert(payload)
    .select()
    .single();

  if (error) {
    alert(error.message);
    return;
  }

  const entryPayloads = items.map((item) => itemToEntryPayload(item, customer.id, document.querySelector("#customerNotes").value.trim()));

  const { error: entryError } = await supabaseClient.from("credit_entries").insert(entryPayloads);
  if (entryError) {
    showAuthPopup("Customer saved", `Customer was added, but item entries could not be saved. ${entryError.message}`);
    await loadData();
    return;
  }

  event.target.reset();
  resetItemRows();
  await loadData();
}

function toggleCustomerDetails(button) {
  const details = button.nextElementSibling;
  const isOpen = !details.classList.contains("hidden");
  details.classList.toggle("hidden", isOpen);
  button.setAttribute("aria-expanded", String(!isOpen));
  button.querySelector("span").textContent = isOpen ? "Show details" : "Hide details";
}

function openCustomerEditor(customerId) {
  state.selectedCustomer = state.customers.find((customer) => customer.id === customerId);
  if (!state.selectedCustomer) return;
  const customerEntries = state.entries
    .filter((entry) => entry.customer_id === customerId)
    .map(parseEntryItem);

  document.querySelector("#editCustomerName").value = state.selectedCustomer.name || "";
  document.querySelector("#editCustomerPhone").value = state.selectedCustomer.phone || "";
  document.querySelector("#editCustomerVillage").value = state.selectedCustomer.location || "";
  document.querySelector("#editCustomerAddress").value = state.selectedCustomer.address || "";
  document.querySelector("#editCustomerNotes").value = state.selectedCustomer.notes || "";
  resetItemRows(els.editItemRows, customerEntries.length ? customerEntries : [{}]);
  els.customerDialog.showModal();
}

function openCustomerView(customerId) {
  const customer = state.customers.find((c) => c.id === customerId);
  if (!customer) return;

  const entries = state.entries.filter((entry) => entry.customer_id === customerId);
  const total = entries.reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
  const paid = entries.reduce((sum, entry) => sum + Number(entry.paid_amount || 0), 0);
  const remaining = entries.reduce((sum, entry) => sum + Number(entry.remaining_amount || 0), 0);

  els.viewCustomerTitle.textContent = customer.name || "Customer";
  els.viewCustomerInfo.innerHTML = escapeHtml([
    customer.phone,
    customer.location ? `Gaon: ${customer.location}` : "",
    customer.address ? `Address: ${customer.address}` : ""
  ].filter(Boolean).join(" | ")) + (customer.notes ? `<br><em>${escapeHtml(customer.notes)}</em>` : "");

  els.viewCustomerBill.textContent = rupee.format(total);
  els.viewCustomerJama.textContent = rupee.format(paid);
  els.viewCustomerBaki.textContent = rupee.format(remaining);

  els.viewCustomerEntries.innerHTML = "";
  if (!entries.length) {
    els.viewCustomerEntries.innerHTML = "<p class='empty' style='padding:0;'>No item entries yet.</p>";
  } else {
    entries.forEach((entry, index) => {
      const parsedItem = parseEntryItem(entry);
      const payments = state.payments.filter((payment) => payment.credit_entry_id === entry.id);
      
      const history = payments.map((p) => 
        `<div style="font-size:12px; color:var(--muted); margin-top:4px;">- ${p.payment_date}: ${rupee.format(Number(p.amount || 0))}</div>`
      ).join("");

      const entryDiv = document.createElement("div");
      entryDiv.className = "customer-item-line " + (getEntryMaterial(entry) ? `material-line-${getEntryMaterial(entry)}` : "");
      
      const detailsArray = [];
      if (parsedItem.weight) detailsArray.push(parsedItem.weight);
      if (parsedItem.unit) detailsArray.push(parsedItem.unit);
      const detailsStr = detailsArray.length > 0 ? `<div style="font-size:12px; color:var(--muted); margin-top:2px;">Details: ${detailsArray.join(" | ")}</div>` : "";

      entryDiv.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 15px; font-weight: 600;">${index + 1}. ${formatItemName(entry)}</span>
          <span class="badge ${entry.calculated_status}">${entry.calculated_status}</span>
        </div>
        ${detailsStr}
        <div style="font-size:12px; color:var(--muted); margin-top:4px;">Tarikh (Sell Date): <b>${parsedItem.creditDate}</b></div>
        <div style="display: flex; gap: 10px; margin-top: 8px; font-size: 13px;">
          <div>Bill: <b>${rupee.format(Number(entry.amount || 0))}</b></div>
          <div>Jama: <b>${rupee.format(Number(entry.paid_amount || 0))}</b></div>
          <div>Baki: <b style="color:var(--red-ink);">${rupee.format(Number(entry.remaining_amount || 0))}</b></div>
        </div>
        ${entry.due_date ? `<div style="font-size:12px; color:var(--muted); margin-top:6px;">Vaada: ${entry.due_date}</div>` : ""}
        ${history ? `<div style="margin-top:8px; border-top:1px solid var(--line); padding-top:4px;">${history}</div>` : ""}
      `;
      els.viewCustomerEntries.appendChild(entryDiv);
    });
  }

  els.customerViewDialog.showModal();
}

async function updateCustomer(event) {
  event.preventDefault();
  if (!state.selectedCustomer) return;

  const village = document.querySelector("#editCustomerVillage").value.trim();
  const address = document.querySelector("#editCustomerAddress").value.trim();
  const notes = document.querySelector("#editCustomerNotes").value.trim();
  const items = collectItemRows(els.editItemRows);

  if (items.length === 0) {
    showAuthPopup("Item details needed", "Please keep at least one item for this customer.");
    return;
  }

  if (findInvalidItem(items)) {
    showAuthPopup("Item details needed", "Please add item name, piece/pair/set, material type, price, and other item type if Other is selected.");
    return;
  }

  for (const item of items) {
    if ((item.dueDate && !item.commitmentAmount) || (!item.dueDate && item.commitmentAmount)) {
      showAuthPopup("Commitment details needed", `Item "${item.name}" mein commitment date aur amount dono daalein, ya dono khaali rakhein.`);
      return;
    }
  }

  const payload = {
    name: document.querySelector("#editCustomerName").value.trim(),
    phone: document.querySelector("#editCustomerPhone").value.trim(),
    location: village,
    address,
    notes
  };

  const { error } = await supabaseClient
    .from("customers")
    .update(payload)
    .eq("id", state.selectedCustomer.id);

  if (error) {
    showAuthPopup("Customer update failed", error.message);
    return;
  }

  const previousEntryIds = state.entries
    .filter((entry) => entry.customer_id === state.selectedCustomer.id)
    .map((entry) => String(entry.id));
  const keptEntryIds = items.map((item) => String(item.id)).filter(Boolean);
  const deletedEntryIds = previousEntryIds.filter((id) => !keptEntryIds.includes(id));

  if (deletedEntryIds.length) {
    const { error: paymentDeleteError } = await supabaseClient
      .from("payments")
      .delete()
      .in("credit_entry_id", deletedEntryIds);
    if (paymentDeleteError) {
      showAuthPopup("Item update failed", paymentDeleteError.message);
      return;
    }

    const { error: entryDeleteError } = await supabaseClient
      .from("credit_entries")
      .delete()
      .in("id", deletedEntryIds);
    if (entryDeleteError) {
      showAuthPopup("Item update failed", entryDeleteError.message);
      return;
    }
  }

  for (const item of items) {
    const entryPayload = itemToEntryPayload(item, state.selectedCustomer.id, notes);
    if (item.id) {
      const { error: entryUpdateError } = await supabaseClient
        .from("credit_entries")
        .update(entryPayload)
        .eq("id", item.id);
      if (entryUpdateError) {
        showAuthPopup("Item update failed", entryUpdateError.message);
        return;
      }
    } else {
      const { error: entryInsertError } = await supabaseClient
        .from("credit_entries")
        .insert(entryPayload);
      if (entryInsertError) {
        showAuthPopup("Item update failed", entryInsertError.message);
        return;
      }
    }
  }

  els.customerDialog.close();
  state.selectedCustomer = null;
  await loadData();
}

async function deleteCustomer(customerId) {
  const customer = state.customers.find((item) => item.id === customerId);
  if (!customer) return;
  const confirmed = confirm(`Delete ${customer.name || "this customer"} and all linked item/payment records?`);
  if (!confirmed) return;

  const entryIds = state.entries
    .filter((entry) => entry.customer_id === customerId)
    .map((entry) => entry.id);

  if (entryIds.length) {
    const { error: paymentError } = await supabaseClient
      .from("payments")
      .delete()
      .in("credit_entry_id", entryIds);
    if (paymentError) {
      showAuthPopup("Delete failed", paymentError.message);
      return;
    }

    const { error: entryError } = await supabaseClient
      .from("credit_entries")
      .delete()
      .in("id", entryIds);
    if (entryError) {
      showAuthPopup("Delete failed", entryError.message);
      return;
    }
  }

  const { error } = await supabaseClient
    .from("customers")
    .delete()
    .eq("id", customerId);

  if (error) {
    showAuthPopup("Delete failed", error.message);
    return;
  }

  await loadData();
}

function buildCustomerMessage(customer) {
  const entries = state.entries.filter((entry) => entry.customer_id === customer.id);
  const shopName = state.profile?.shop_name || "Khata";

  const total = entries.reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
  const paid = entries.reduce((sum, entry) => sum + Number(entry.paid_amount || 0), 0);
  const remaining = entries.reduce((sum, entry) => sum + Number(entry.remaining_amount || 0), 0);

  // Center-align shop name with decorative emojis
  const shopLine = `         💎 *${shopName}* 💎`;
  const lines = [
    shopLine
  ];

  if (!entries.length) {
    lines.push("", "Koi entry nahi hai.");
    return lines.join("\n");
  }

  lines.push("");

  entries.forEach((entry, index) => {
    const item = getItemParts(entry);
    const entryTotal = Number(entry.amount || 0);
    const entryPaid = Number(entry.paid_amount || 0);
    const entryRemaining = Number(entry.remaining_amount || 0);
    lines.push(`${index + 1}. *${item.name}*`);
    lines.push(`   Bill: ${rupee.format(entryTotal)}`);
    lines.push(`   Jama: ${rupee.format(entryPaid)}`);
    lines.push(`   *Baki: ${rupee.format(entryRemaining)}*`);

    lines.push("");
  });

  lines.push("━━━━━━━━━━━━━━━━");
  if (entries.length > 1) {
    lines.push(`📋 Total Bill: ${rupee.format(total)}`);
    lines.push(`✅ Total Jama: ${rupee.format(paid)}`);
  }
  lines.push(`💰 *Baki: ${rupee.format(remaining)}*`);

  return lines.join("\n");
}

function shareCustomerOnWhatsApp(customerId) {
  const customer = state.customers.find((item) => item.id === customerId);
  if (!customer) return;
  const message = buildCustomerMessage(customer);
  const phone = String(customer.phone || "").replace(/\D/g, "");
  const url = phone
    ? `https://wa.me/91${phone.slice(-10)}?text=${encodeURIComponent(message)}`
    : `https://wa.me/?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank", "noopener");
}

function openPayment(entryId) {
  state.selectedEntry = state.entries.find((entry) => entry.id === entryId);
  if (!state.selectedEntry) return;
  const currentCommitment = getCommitmentAmount(state.selectedEntry);
  const commitmentText = state.selectedEntry.due_date
    ? ` | Current promise ${state.selectedEntry.due_date}${currentCommitment ? ` for ${rupee.format(currentCommitment)}` : ""}`
    : "";
  els.paymentFor.textContent = `${state.selectedEntry.customer_name} | Remaining ${rupee.format(Number(state.selectedEntry.remaining_amount || 0))}${commitmentText}`;
  document.querySelector("#paymentAmount").max = state.selectedEntry.remaining_amount;
  document.querySelector("#paymentAmount").value = "";
  document.querySelector("#paymentNotes").value = "";
  document.querySelector("#nextCommitmentDate").value = "";
  document.querySelector("#nextCommitmentAmount").value = "";
  els.paymentDate.value = today();
  els.paymentDialog.showModal();
}

async function addPayment(event) {
  event.preventDefault();
  if (!state.selectedEntry) return;

  const nextCommitmentDate = document.querySelector("#nextCommitmentDate").value || null;
  const nextCommitmentAmount = Number(document.querySelector("#nextCommitmentAmount").value || 0);
  if ((nextCommitmentDate && !nextCommitmentAmount) || (!nextCommitmentDate && nextCommitmentAmount)) {
    showAuthPopup("Next commitment needed", "Please add both next commitment date and next committed amount, or leave both blank.");
    return;
  }

  const payload = {
    user_id: state.session.user.id,
    customer_id: state.selectedEntry.customer_id,
    credit_entry_id: state.selectedEntry.id,
    amount: Number(document.querySelector("#paymentAmount").value),
    payment_date: document.querySelector("#paymentDate").value,
    notes: document.querySelector("#paymentNotes").value.trim()
  };

  const { error } = await supabaseClient.from("payments").insert(payload);
  if (error) {
    alert(error.message);
    return;
  }

  const cleanNotes = cleanEntryNotes(state.selectedEntry.notes || "");
  const nextNotes = [
    cleanNotes,
    nextCommitmentAmount ? `[commitment_amount:${nextCommitmentAmount}]` : ""
  ].filter(Boolean).join(" ");
  const { error: entryError } = await supabaseClient
    .from("credit_entries")
    .update({
      due_date: nextCommitmentDate,
      notes: nextNotes
    })
    .eq("id", state.selectedEntry.id);

  if (entryError) {
    showAuthPopup("Payment saved", `Payment saved, but next commitment could not be updated. ${entryError.message}`);
    els.paymentDialog.close();
    await loadData();
    return;
  }

  els.paymentDialog.close();
  await loadData();
}

function exportCsv() {
  const rows = getFilteredEntries();
  const header = ["Customer", "Phone", "Gaon / City", "Item", "Amount", "Paid", "Remaining", "Credit date", "Due date", "Status"];
  const csvRows = rows.map((entry) => [
    entry.customer_name,
    entry.customer_phone,
    entry.customer_location,
    entry.item_name,
    entry.amount,
    entry.paid_amount,
    entry.remaining_amount,
    entry.credit_date,
    entry.due_date,
    entry.calculated_status
  ]);

  const csv = [header, ...csvRows]
    .map((row) => row.map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `digikhata-${today()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

async function signOut() {
  await supabaseClient.auth.signOut();
  state.session = null;
  state.profile = null;
  state.customers = [];
  state.entries = [];
  state.payments = [];
  await boot();
}

async function updatePassword(event) {
  event.preventDefault();
  els.resetMessage.textContent = "Updating...";
  const password = document.querySelector("#newPassword").value;
  const { error } = await supabaseClient.auth.updateUser({ password });

  if (error) {
    els.resetMessage.textContent = error.message;
    els.resetMessage.style.color = "#991b1b";
    return;
  }

  els.resetMessage.textContent = "Password updated. Opening the dashboard now.";
  state.isPasswordRecovery = false;
  history.replaceState(null, "", window.location.pathname + window.location.search);
  await boot();
}

async function updateSettings(event) {
  event.preventDefault();
  els.settingsMessage.textContent = "Saving changes...";
  els.settingsMessage.style.color = "";

  const shopName = document.querySelector("#settingShopName").value.trim();
  const ownerName = document.querySelector("#settingOwnerName").value.trim();
  const phone = document.querySelector("#settingPhone").value.trim();
  const email = document.querySelector("#settingEmail").value.trim();
  const password = document.querySelector("#settingPassword").value;
  const currentEmail = state.session.user.email;

  if (!shopName || !ownerName) {
    els.settingsMessage.textContent = "Shop name and owner name are required.";
    els.settingsMessage.style.color = "#991b1b";
    return;
  }

  if (!isValidEmail(email)) {
    els.settingsMessage.textContent = "Please enter a valid email address.";
    els.settingsMessage.style.color = "#991b1b";
    showAuthPopup("Invalid email", "Please enter a valid email address.");
    return;
  }

  if (password && password.length < 6) {
    els.settingsMessage.textContent = "New password must be at least 6 characters.";
    els.settingsMessage.style.color = "#991b1b";
    showAuthPopup("Invalid password", "New password must be at least 6 characters.");
    return;
  }

  const { data: profile, error: profileError } = await supabaseClient
    .from("profiles")
    .update({ shop_name: shopName, owner_name: ownerName, phone })
    .eq("id", state.session.user.id)
    .select()
    .single();

  if (profileError) {
    els.settingsMessage.textContent = profileError.message;
    els.settingsMessage.style.color = "#991b1b";
    return;
  }

  const authUpdates = {};
  if (email !== currentEmail) authUpdates.email = email;
  if (password) authUpdates.password = password;

  if (Object.keys(authUpdates).length > 0) {
    const { error: authError } = await supabaseClient.auth.updateUser(authUpdates, {
      emailRedirectTo: getAuthRedirectUrl()
    });

    if (authError) {
      els.settingsMessage.textContent = authError.message;
      els.settingsMessage.style.color = "#991b1b";
      return;
    }
  }

  const { data } = await supabaseClient.auth.getSession();
  state.session = data.session || state.session;
  state.profile = profile;
  els.shopLabel.textContent = state.profile.shop_name;
  els.mobileShopLabel.textContent = state.profile.shop_name;
  document.querySelector("#settingPassword").value = "";
  els.settingsMessage.textContent = email !== currentEmail
    ? "Settings saved. Please confirm the new email from your inbox."
    : "Settings saved successfully.";
}

function bindEvents() {
  els.signupFields.classList.add("hidden");
  els.authForm.addEventListener("submit", handleAuth);
  els.resetRequestForm.addEventListener("submit", sendPasswordReset);
  els.resetForm.addEventListener("submit", updatePassword);
  els.toggleAuth.addEventListener("click", toggleAuthMode);
  els.forgotPassword.addEventListener("click", handleForgotPassword);
  els.backFromReset.addEventListener("click", showAuthForm);
  els.backToSignIn.addEventListener("click", () => {
    state.isSignup = false;
    els.signupFields.classList.add("hidden");
    els.authModeLabel.textContent = "Sign in";
    els.authTitle.textContent = "Access your account";
    els.authSubmit.textContent = "Sign in";
    els.toggleAuth.textContent = "New shopkeeper? Create account";
    setMessage("");
    showAuthForm();
  });
  els.customerForm.addEventListener("submit", addCustomer);
  els.editCustomerForm.addEventListener("submit", updateCustomer);
  els.settingsForm.addEventListener("submit", updateSettings);
  els.paymentForm.addEventListener("submit", addPayment);
  document.querySelector("#closePayment").addEventListener("click", () => els.paymentDialog.close());
  document.querySelector("#closeCustomerDialog").addEventListener("click", () => els.customerDialog.close());
  document.querySelector("#closeCustomerViewDialog").addEventListener("click", () => els.customerViewDialog.close());
  document.querySelector("#signOut").addEventListener("click", signOut);
  document.querySelector("#mobileSignOut").addEventListener("click", signOut);
  document.querySelector("#refreshData").addEventListener("click", refreshData);
  document.querySelector("#exportCsv").addEventListener("click", exportCsv);
  els.addItemRow.addEventListener("click", () => els.itemRows.appendChild(createItemRow({}, els.itemRows)));
  els.addEditItemRow.addEventListener("click", () => els.editItemRows.appendChild(createItemRow({}, els.editItemRows)));

  document.querySelector("#toggleCustomerForm").addEventListener("click", () => {
    const isHidden = els.customerForm.classList.toggle("hidden");
    document.querySelector("#toggleCustomerForm").textContent = isHidden ? "\u2795 Add New Customer" : "\u2716 Close Form";
  });

  document.querySelector("#dashboardAddCustomer").addEventListener("click", () => {
    setActiveView("customers");
    els.customerForm.classList.remove("hidden");
    document.querySelector("#toggleCustomerForm").textContent = "\u2716 Close Form";
  });

  els.customerSearchInput.addEventListener("input", () => {
    renderCustomerList();
  });

  document.querySelectorAll(".nav-btn").forEach((button) => {
    button.addEventListener("click", () => setActiveView(button.dataset.view));
  });
  document.querySelectorAll(".bottom-nav-btn").forEach((button) => {
    button.addEventListener("click", () => setActiveView(button.dataset.view));
  });

  document.querySelectorAll("th.sortable").forEach((th) => {
    th.addEventListener("click", () => {
      const col = th.dataset.sort;
      if (state.sortColumn === col) {
        state.sortDirection = state.sortDirection === "desc" ? "asc" : "desc";
      } else {
        state.sortColumn = col;
        state.sortDirection = "desc";
      }
      document.querySelectorAll("th.sortable").forEach((h) => {
        h.classList.remove("active-sort", "sort-asc", "sort-desc");
      });
      th.classList.add("active-sort", state.sortDirection === "asc" ? "sort-asc" : "sort-desc");
      renderTable();
    });
  });

  els.entriesTable.addEventListener("click", (event) => {
    const toggle = event.target.closest(".entry-toggle");
    if (toggle) {
      const row = toggle.closest("tr");
      const isOpen = row.classList.toggle("entry-expanded");
      toggle.setAttribute("aria-expanded", String(isOpen));
      toggle.querySelector("span").textContent = isOpen ? "Hide details" : "Show details";
      return;
    }

    const button = event.target.closest("[data-payment]");
    if (button) openPayment(button.dataset.payment);
  });

  els.customerList.addEventListener("click", (event) => {
    const toggle = event.target.closest(".customer-toggle");
    if (toggle) {
      toggleCustomerDetails(toggle);
      return;
    }

    const editButton = event.target.closest("[data-edit-customer]");
    if (editButton) {
      openCustomerEditor(editButton.dataset.editCustomer);
      return;
    }

    const whatsAppButton = event.target.closest("[data-whatsapp-customer]");
    if (whatsAppButton) {
      shareCustomerOnWhatsApp(whatsAppButton.dataset.whatsappCustomer);
      return;
    }

    const viewButton = event.target.closest("[data-view-customer]");
    if (viewButton) {
      openCustomerView(viewButton.dataset.viewCustomer);
      return;
    }

    const deleteButton = event.target.closest("[data-delete-customer]");
    if (deleteButton) deleteCustomer(deleteButton.dataset.deleteCustomer);
  });

  document.querySelector("#paymentDate").value = today();
  resetItemRows();

  supabaseClient.auth.onAuthStateChange((event) => {
    if (event === "PASSWORD_RECOVERY") {
      showPasswordRecoveryForm();
    }

    if (event === "SIGNED_IN" && !state.isPasswordRecovery && !isPasswordRecoveryUrl()) {
      boot().catch((error) => {
        console.error(error);
        const message = error.message || "DigiKhata could not be loaded.";
        setMessage(message, true);
        showAuthPopup("Could not open ledger", message);
      });
    }
  });
}

bindEvents();
if (!handleAuthHashMessage()) {
  boot().catch((error) => {
    console.error(error);
    alert(error.message || "DigiKhata could not be loaded.");
  });
}
