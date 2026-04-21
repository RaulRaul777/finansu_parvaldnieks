 HEAD
const categoryIcons = {
  "Pārtika": "🍔",
  "Transports": "🚗",
  "Izklaide": "🎮",
  "Kredīti": "💳",
  "Robertiņa": "👶",
};

// ====== Dati ======
let records = loadRecords();
let categories = loadCategories();
let budgets = loadBudgets();

// ====== Elementi ======
const amountInput = document.getElementById("amount");
const descInput = document.getElementById("desc");
const typeSelect = document.getElementById("type");
const categorySelect = document.getElementById("categorySelect");

const newCategoryInput = document.getElementById("newCategory");
const addCategoryBtn = document.getElementById("addCategoryBtn");

const addBtn = document.getElementById("addBtn");

const listEl = document.getElementById("list");
const totalIncomeEl = document.getElementById("totalIncome");
const totalExpenseEl = document.getElementById("totalExpense");
const balanceEl = document.getElementById("balance");

const filterTypeSelect = document.getElementById("filterType");
const filterCategorySelect = document.getElementById("filterCategory");
const searchInput = document.getElementById("searchInput");

const budgetCategorySelect = document.getElementById("budgetCategorySelect");
const budgetLimitInput = document.getElementById("budgetLimit");
const addBudgetBtn = document.getElementById("addBudgetBtn");
const budgetListEl = document.getElementById("budgetList");

const exportCsvBtn = document.getElementById("exportCsvBtn");
const darkModeToggle = document.getElementById("darkModeToggle");

// ====== Chart.js ======
let incomeExpenseChart = null;
let categoryChart = null;

// ====== Notikumi ======
addBtn.addEventListener("click", addRecord);
addCategoryBtn.addEventListener("click", addCategory);
filterTypeSelect.addEventListener("change", render);
filterCategorySelect.addEventListener("change", render);
searchInput.addEventListener("input", render);
addBudgetBtn.addEventListener("click", addBudget);
exportCsvBtn.addEventListener("click", exportCsv);
darkModeToggle.addEventListener("click", toggleDarkMode);

// ====== Starta ielāde ======
initTheme();
renderCategories();
renderFilterCategories();
renderBudgetCategories();
render();
renderBudgets();

// ====== Funkcijas ======

function addCategory() {
  const name = newCategoryInput.value.trim();
  if (!name) {
    alert("Ievadi kategorijas nosaukumu");
    return;
  }

  if (categories.includes(name)) {
    alert("Šāda kategorija jau eksistē!");
    return;
  }

  categories.push(name);
  saveCategories();
  renderCategories();
  renderFilterCategories();
  renderBudgetCategories();

  newCategoryInput.value = "";
}

function renderCategories() {
  categorySelect.innerHTML = "";
  categories.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    categorySelect.appendChild(option);
  });
}

function renderFilterCategories() {
  filterCategorySelect.innerHTML = "";
  const allOpt = document.createElement("option");
  allOpt.value = "all";
  allOpt.textContent = "Visas kategorijas";
  filterCategorySelect.appendChild(allOpt);

  categories.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    filterCategorySelect.appendChild(option);
  });
}

function renderBudgetCategories() {
  budgetCategorySelect.innerHTML = "";
  categories.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    budgetCategorySelect.appendChild(option);
  });
}

function addRecord() {
  const amount = Number(amountInput.value);
  const desc = descInput.value.trim();
  const type = typeSelect.value;
  const category = categorySelect.value;

  if (amount <= 0 || !desc) {
    alert("Lūdzu ievadi derīgu summu un aprakstu.");
    return;
  }

  records.push({
    amount,
    desc,
    type,
    category,
    date: new Date().toISOString().split("T")[0], // automātisks datums YYYY-MM-DD
    id: Date.now()
});


  saveRecords();
  render();

  amountInput.value = "";
  descInput.value = "";
}

function render() {
  listEl.innerHTML = "";
  let totalIncome = 0;
  let totalExpense = 0;

  // Kārtojam jaunākos augšā
  const sorted = [...records].sort((a, b) => b.id - a.id);

  // Filtri
  const typeFilter = filterTypeSelect.value;
  const categoryFilter = filterCategorySelect.value;
  const searchTerm = searchInput.value.trim().toLowerCase();

  const filtered = sorted.filter(r => {
    if (typeFilter !== "all" && r.type !== typeFilter) return false;
    if (categoryFilter !== "all" && r.category !== categoryFilter) return false;
    if (searchTerm && !r.desc.toLowerCase().includes(searchTerm)) return false;
    return true;
  });

  filtered.forEach(r => {
    const li = document.createElement("li");
    li.classList.add(r.type === "income" ? "income" : "expense");

    const text = document.createElement("span");
    const icon = categoryIcons[r.category] || "📁";
text.textContent = `${icon} ${r.date} • ${r.desc} (${r.category}) — ${r.amount} €`;

    const delBtn = document.createElement("button");
    delBtn.textContent = "Dzēst";
    delBtn.onclick = () => deleteRecord(r.id);

    li.appendChild(text);
    li.appendChild(delBtn);
    listEl.appendChild(li);
  });

  // Kopsavilkums no visiem ierakstiem (ne tikai filtrētajiem)
  records.forEach(r => {
    if (r.type === "income") totalIncome += r.amount;
    else totalExpense += r.amount;
  });

  totalIncomeEl.textContent = totalIncome;
  totalExpenseEl.textContent = totalExpense;
  balanceEl.textContent = totalIncome - totalExpense;

  updateCharts();
  renderBudgets();
}

function deleteRecord(id) {
  records = records.filter(r => r.id !== id);
  saveRecords();
  render();
}

// ====== Budžeti ======

function addBudget() {
  const category = budgetCategorySelect.value;
  const limit = Number(budgetLimitInput.value);

  if (!category || limit <= 0) {
    alert("Ievadi derīgu budžeta limitu.");
    return;
  }

  const existing = budgets.find(b => b.category === category);
  if (existing) {
    existing.limit = limit;
  } else {
    budgets.push({ category, limit });
  }

  saveBudgets();
  renderBudgets();
  budgetLimitInput.value = "";
}

function renderBudgets() {
  budgetListEl.innerHTML = "";

  const spentByCategory = {};
  records
    .filter(r => r.type === "expense")
    .forEach(r => {
      spentByCategory[r.category] = (spentByCategory[r.category] || 0) + r.amount;
    });

  budgets.forEach(b => {
    const li = document.createElement("li");
    const spent = spentByCategory[b.category] || 0;
    const remaining = b.limit - spent;

    li.textContent = `${b.category}: limits ${b.limit} €, iztērēts ${spent} €, atlikums ${remaining} €`;

    if (remaining < 0) {
      li.style.color = "red";
    } else {
      li.style.color = "green";
    }

    budgetListEl.appendChild(li);
  });
}

// ====== CSV eksports ======

function exportCsv() {
  if (records.length === 0) {
    alert("Nav datu eksportam.");
    return;
  }

  const header = "ID;Tips;Kategorija;Apraksts;Summa\n";
  const rows = records.map(r =>
    `${r.id};${r.type};${r.category};${r.desc};${r.amount}`
  );
  const csvContent = header + rows.join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "finansu_dati.csv";
  a.click();

  URL.revokeObjectURL(url);
}

// ====== Chart.js ======

function updateCharts() {
  const totalIncome = records
    .filter(r => r.type === "income")
    .reduce((sum, r) => sum + r.amount, 0);

  const totalExpense = records
    .filter(r => r.type === "expense")
    .reduce((sum, r) => sum + r.amount, 0);

  const expenseByCategory = {};
  records
    .filter(r => r.type === "expense")
    .forEach(r => {
      expenseByCategory[r.category] = (expenseByCategory[r.category] || 0) + r.amount;
    });

  const ctx1 = document.getElementById("incomeExpenseChart").getContext("2d");
  const ctx2 = document.getElementById("categoryChart").getContext("2d");

  if (incomeExpenseChart) incomeExpenseChart.destroy();
  if (categoryChart) categoryChart.destroy();

  incomeExpenseChart = new Chart(ctx1, {
    type: "doughnut",
    data: {
      labels: ["Ienākumi", "Izdevumi"],
      datasets: [{
        data: [totalIncome, totalExpense],
        backgroundColor: ["#2ecc71", "#e74c3c"]
      }]
    }
  });

  categoryChart = new Chart(ctx2, {
    type: "bar",
    data: {
      labels: Object.keys(expenseByCategory),
      datasets: [{
        label: "Izdevumi (€)",
        data: Object.values(expenseByCategory),
        backgroundColor: "#e67e22"
      }]
    },
    options: {
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

// ====== Tumšais režīms ======

function initTheme() {
  const saved = localStorage.getItem("finansuTheme");
  if (saved === "dark") {
    document.body.classList.add("dark");
  }
}

function toggleDarkMode() {
  document.body.classList.toggle("dark");
  const mode = document.body.classList.contains("dark") ? "dark" : "light";
  localStorage.setItem("finansuTheme", mode);
}

// ====== Saglabāšana ======

function saveRecords() {
  localStorage.setItem("finansuRecords", JSON.stringify(records));
}

function loadRecords() {
  const data = localStorage.getItem("finansuRecords");
  return data ? JSON.parse(data) : [];
}

function saveCategories() {
  localStorage.setItem("finansuCategories", JSON.stringify(categories));
}

function loadCategories() {
  const data = localStorage.getItem("finansuCategories");
  return data ? JSON.parse(data) : ["Pārtika", "Transports", "Izklaide", "Kredīts", "Cits", "Alga"];
}

function saveBudgets() {
  localStorage.setItem("finansuBudgets", JSON.stringify(budgets));
}

function loadBudgets() {
  const data = localStorage.getItem("finansuBudgets");
  return data ? JSON.parse(data) : [];
}
function scrollToSection(id) {
  document.getElementById(id).scrollIntoView({ behavior: "smooth" });
}

const categoryIcons = {
  "Pārtika": "🍔",
  "Transports": "🚗",
  "Izklaide": "🎮",
  "Kredīti": "💳",
  "Robertiņa": "👶",
};

// ====== Dati ======
let records = loadRecords();
let categories = loadCategories();
let budgets = loadBudgets();

// ====== Elementi ======
const amountInput = document.getElementById("amount");
const descInput = document.getElementById("desc");
const typeSelect = document.getElementById("type");
const categorySelect = document.getElementById("categorySelect");

const newCategoryInput = document.getElementById("newCategory");
const addCategoryBtn = document.getElementById("addCategoryBtn");

const addBtn = document.getElementById("addBtn");

const listEl = document.getElementById("list");
const totalIncomeEl = document.getElementById("totalIncome");
const totalExpenseEl = document.getElementById("totalExpense");
const balanceEl = document.getElementById("balance");

const filterTypeSelect = document.getElementById("filterType");
const filterCategorySelect = document.getElementById("filterCategory");
const searchInput = document.getElementById("searchInput");

const budgetCategorySelect = document.getElementById("budgetCategorySelect");
const budgetLimitInput = document.getElementById("budgetLimit");
const addBudgetBtn = document.getElementById("addBudgetBtn");
const budgetListEl = document.getElementById("budgetList");

const exportCsvBtn = document.getElementById("exportCsvBtn");
const darkModeToggle = document.getElementById("darkModeToggle");

// ====== Chart.js ======
let incomeExpenseChart = null;
let categoryChart = null;

// ====== Notikumi ======
addBtn.addEventListener("click", addRecord);
addCategoryBtn.addEventListener("click", addCategory);
filterTypeSelect.addEventListener("change", render);
filterCategorySelect.addEventListener("change", render);
searchInput.addEventListener("input", render);
addBudgetBtn.addEventListener("click", addBudget);
exportCsvBtn.addEventListener("click", exportCsv);
darkModeToggle.addEventListener("click", toggleDarkMode);

// ====== Starta ielāde ======
initTheme();
renderCategories();
renderFilterCategories();
renderBudgetCategories();
render();
renderBudgets();

// ====== Funkcijas ======

function addCategory() {
  const name = newCategoryInput.value.trim();
  if (!name) {
    alert("Ievadi kategorijas nosaukumu");
    return;
  }

  if (categories.includes(name)) {
    alert("Šāda kategorija jau eksistē!");
    return;
  }

  categories.push(name);
  saveCategories();
  renderCategories();
  renderFilterCategories();
  renderBudgetCategories();

  newCategoryInput.value = "";
}

function renderCategories() {
  categorySelect.innerHTML = "";
  categories.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    categorySelect.appendChild(option);
  });
}

function renderFilterCategories() {
  filterCategorySelect.innerHTML = "";
  const allOpt = document.createElement("option");
  allOpt.value = "all";
  allOpt.textContent = "Visas kategorijas";
  filterCategorySelect.appendChild(allOpt);

  categories.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    filterCategorySelect.appendChild(option);
  });
}

function renderBudgetCategories() {
  budgetCategorySelect.innerHTML = "";
  categories.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    budgetCategorySelect.appendChild(option);
  });
}

function addRecord() {
  const amount = Number(amountInput.value);
  const desc = descInput.value.trim();
  const type = typeSelect.value;
  const category = categorySelect.value;

  if (amount <= 0 || !desc) {
    alert("Lūdzu ievadi derīgu summu un aprakstu.");
    return;
  }

  records.push({
    amount,
    desc,
    type,
    category,
    date: new Date().toISOString().split("T")[0], // automātisks datums YYYY-MM-DD
    id: Date.now()
});


  saveRecords();
  render();

  amountInput.value = "";
  descInput.value = "";
}

function render() {
  listEl.innerHTML = "";
  let totalIncome = 0;
  let totalExpense = 0;

  // Kārtojam jaunākos augšā
  const sorted = [...records].sort((a, b) => b.id - a.id);

  // Filtri
  const typeFilter = filterTypeSelect.value;
  const categoryFilter = filterCategorySelect.value;
  const searchTerm = searchInput.value.trim().toLowerCase();

  const filtered = sorted.filter(r => {
    if (typeFilter !== "all" && r.type !== typeFilter) return false;
    if (categoryFilter !== "all" && r.category !== categoryFilter) return false;
    if (searchTerm && !r.desc.toLowerCase().includes(searchTerm)) return false;
    return true;
  });

  filtered.forEach(r => {
    const li = document.createElement("li");
    li.classList.add(r.type === "income" ? "income" : "expense");

    const text = document.createElement("span");
    const icon = categoryIcons[r.category] || "📁";
text.textContent = `${icon} ${r.date} • ${r.desc} (${r.category}) — ${r.amount} €`;

    const delBtn = document.createElement("button");
    delBtn.textContent = "Dzēst";
    delBtn.onclick = () => deleteRecord(r.id);

    li.appendChild(text);
    li.appendChild(delBtn);
    listEl.appendChild(li);
  });

  // Kopsavilkums no visiem ierakstiem (ne tikai filtrētajiem)
  records.forEach(r => {
    if (r.type === "income") totalIncome += r.amount;
    else totalExpense += r.amount;
  });

  totalIncomeEl.textContent = totalIncome;
  totalExpenseEl.textContent = totalExpense;
  balanceEl.textContent = totalIncome - totalExpense;

  updateCharts();
  renderBudgets();
}

function deleteRecord(id) {
  records = records.filter(r => r.id !== id);
  saveRecords();
  render();
}

// ====== Budžeti ======

function addBudget() {
  const category = budgetCategorySelect.value;
  const limit = Number(budgetLimitInput.value);

  if (!category || limit <= 0) {
    alert("Ievadi derīgu budžeta limitu.");
    return;
  }

  const existing = budgets.find(b => b.category === category);
  if (existing) {
    existing.limit = limit;
  } else {
    budgets.push({ category, limit });
  }

  saveBudgets();
  renderBudgets();
  budgetLimitInput.value = "";
}

function renderBudgets() {
  budgetListEl.innerHTML = "";

  const spentByCategory = {};
  records
    .filter(r => r.type === "expense")
    .forEach(r => {
      spentByCategory[r.category] = (spentByCategory[r.category] || 0) + r.amount;
    });

  budgets.forEach(b => {
    const li = document.createElement("li");
    const spent = spentByCategory[b.category] || 0;
    const remaining = b.limit - spent;

    li.textContent = `${b.category}: limits ${b.limit} €, iztērēts ${spent} €, atlikums ${remaining} €`;

    if (remaining < 0) {
      li.style.color = "red";
    } else {
      li.style.color = "green";
    }

    budgetListEl.appendChild(li);
  });
}

// ====== CSV eksports ======

function exportCsv() {
  if (records.length === 0) {
    alert("Nav datu eksportam.");
    return;
  }

  const header = "ID;Tips;Kategorija;Apraksts;Summa\n";
  const rows = records.map(r =>
    `${r.id};${r.type};${r.category};${r.desc};${r.amount}`
  );
  const csvContent = header + rows.join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "finansu_dati.csv";
  a.click();

  URL.revokeObjectURL(url);
}

// ====== Chart.js ======

function updateCharts() {
  const totalIncome = records
    .filter(r => r.type === "income")
    .reduce((sum, r) => sum + r.amount, 0);

  const totalExpense = records
    .filter(r => r.type === "expense")
    .reduce((sum, r) => sum + r.amount, 0);

  const expenseByCategory = {};
  records
    .filter(r => r.type === "expense")
    .forEach(r => {
      expenseByCategory[r.category] = (expenseByCategory[r.category] || 0) + r.amount;
    });

  const ctx1 = document.getElementById("incomeExpenseChart").getContext("2d");
  const ctx2 = document.getElementById("categoryChart").getContext("2d");

  if (incomeExpenseChart) incomeExpenseChart.destroy();
  if (categoryChart) categoryChart.destroy();

  incomeExpenseChart = new Chart(ctx1, {
    type: "doughnut",
    data: {
      labels: ["Ienākumi", "Izdevumi"],
      datasets: [{
        data: [totalIncome, totalExpense],
        backgroundColor: ["#2ecc71", "#e74c3c"]
      }]
    }
  });

  categoryChart = new Chart(ctx2, {
    type: "bar",
    data: {
      labels: Object.keys(expenseByCategory),
      datasets: [{
        label: "Izdevumi (€)",
        data: Object.values(expenseByCategory),
        backgroundColor: "#e67e22"
      }]
    },
    options: {
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

// ====== Tumšais režīms ======

function initTheme() {
  const saved = localStorage.getItem("finansuTheme");
  if (saved === "dark") {
    document.body.classList.add("dark");
  }
}

function toggleDarkMode() {
  document.body.classList.toggle("dark");
  const mode = document.body.classList.contains("dark") ? "dark" : "light";
  localStorage.setItem("finansuTheme", mode);
}

// ====== Saglabāšana ======

function saveRecords() {
  localStorage.setItem("finansuRecords", JSON.stringify(records));
}

function loadRecords() {
  const data = localStorage.getItem("finansuRecords");
  return data ? JSON.parse(data) : [];
}

function saveCategories() {
  localStorage.setItem("finansuCategories", JSON.stringify(categories));
}

function loadCategories() {
  const data = localStorage.getItem("finansuCategories");
  return data ? JSON.parse(data) : ["Pārtika", "Transports", "Izklaide", "Kredīts", "Cits", "Alga"];
}

function saveBudgets() {
  localStorage.setItem("finansuBudgets", JSON.stringify(budgets));
}

function loadBudgets() {
  const data = localStorage.getItem("finansuBudgets");
  return data ? JSON.parse(data) : [];
}

