// ===== DROŠAIS KATEGORIJU STARTS =====
let categories = JSON.parse(localStorage.getItem("categories"));

if (!categories || !Array.isArray(categories) || categories.length === 0) {
  categories = ["Pārtika", "Degviela", "Izklaide", "Kredīti", "Citi"];
  localStorage.setItem("categories", JSON.stringify(categories));
}

// ===== IERAKSTI =====
let records = JSON.parse(localStorage.getItem("records") || "[]");

// ===== BUDŽETI =====
let budgets = JSON.parse(localStorage.getItem("budgets") || "[]");

// ===== ELEMENTI =====
const amount = document.getElementById("amount");
const desc = document.getElementById("desc");
const type = document.getElementById("type");
const categorySelect = document.getElementById("categorySelect");
const newCategory = document.getElementById("newCategory");
const addCategoryBtn = document.getElementById("addCategoryBtn");
const addBtn = document.getElementById("addBtn");
const list = document.getElementById("list");

const filterType = document.getElementById("filterType");
const filterCategory = document.getElementById("filterCategory");
const searchInput = document.getElementById("searchInput");

const budgetCategorySelect = document.getElementById("budgetCategorySelect");
const budgetLimit = document.getElementById("budgetLimit");
const addBudgetBtn = document.getElementById("addBudgetBtn");
const budgetList = document.getElementById("budgetList");

const totalIncome = document.getElementById("totalIncome");
const totalExpense = document.getElementById("totalExpense");
const balance = document.getElementById("balance");

const exportCsvBtn = document.getElementById("exportCsvBtn");

// ===== KATEGORIJAS =====
function renderCategories() {
  categorySelect.innerHTML = "";
  filterCategory.innerHTML = `<option value="all">Visas kategorijas</option>`;
  budgetCategorySelect.innerHTML = "";

  categories.forEach(cat => {
    categorySelect.innerHTML += `<option>${cat}</option>`;
    filterCategory.innerHTML += `<option>${cat}</option>`;
    budgetCategorySelect.innerHTML += `<option>${cat}</option>`;
  });

  localStorage.setItem("categories", JSON.stringify(categories));
}

addCategoryBtn.onclick = () => {
  if (!newCategory.value.trim()) return;
  categories.push(newCategory.value.trim());
  newCategory.value = "";
  renderCategories();
};

// ===== IERAKSTU PIEVIENOŠANA =====
addBtn.onclick = () => {
  if (!amount.value || !desc.value) return;

  records.push({
    amount: Number(amount.value),
    desc: desc.value,
    type: type.value,
    category: categorySelect.value,
    date: new Date().toISOString().split("T")[0]
  });

  amount.value = "";
  desc.value = "";

  save();
  render();
};

// ===== SAGLABĀŠANA =====
function save() {
  localStorage.setItem("records", JSON.stringify(records));
}

// ===== FILTRI =====
function getFilteredRecords() {
  return records.filter(r => {
    if (filterType.value !== "all" && r.type !== filterType.value) return false;
    if (filterCategory.value !== "all" && r.category !== filterCategory.value) return false;
    if (!r.desc.toLowerCase().includes(searchInput.value.toLowerCase())) return false;
    return true;
  });
}

// ===== IERAKSTU ATTĒLOŠANA =====
function render() {
  const filtered = getFilteredRecords();
  list.innerHTML = "";

  let income = 0;
  let expense = 0;

  filtered.forEach((r, i) => {
    if (r.type === "income") income += r.amount;
    else expense += r.amount;

    list.innerHTML += `
      <li class="record-item">
        <span>${r.date} — <b>${r.amount}€</b> (${r.category}) — ${r.desc}</span>
        <button class="delete-btn" onclick="deleteRecord(${i})">Dzēst</button>
      </li>
    `;
  });

  totalIncome.textContent = income;
  totalExpense.textContent = expense;
  balance.textContent = income - expense;

  renderCharts();
}

function deleteRecord(i) {
  records.splice(i, 1);
  save();
  render();
}

// ===== BUDŽETI =====
addBudgetBtn.onclick = () => {
  if (!budgetLimit.value) return;

  budgets.push({
    category: budgetCategorySelect.value,
    limit: Number(budgetLimit.value)
  });

  budgetLimit.value = "";
  saveBudgets();
  renderBudgets();
};

function saveBudgets() {
  localStorage.setItem("budgets", JSON.stringify(budgets));
}

function renderBudgets() {
  budgetList.innerHTML = "";
  budgets.forEach(b => {
    budgetList.innerHTML += `<li>${b.category}: ${b.limit}€</li>`;
  });
}

// ===== GRAFIKI =====
let incomeExpenseChart, categoryChart;

function renderCharts() {
  const filtered = getFilteredRecords();

  const income = filtered.filter(r => r.type === "income").reduce((a,b)=>a+b.amount,0);
  const expense = filtered.filter(r => r.type === "expense").reduce((a,b)=>a+b.amount,0);

  const categoryTotals = {};
  filtered.forEach(r => {
    if (r.type === "expense") {
      categoryTotals[r.category] = (categoryTotals[r.category] || 0) + r.amount;
    }
  });

  if (incomeExpenseChart) incomeExpenseChart.destroy();
  incomeExpenseChart = new Chart(document.getElementById("incomeExpenseChart"), {
    type: "bar",
    data: {
      labels: ["Ienākumi", "Izdevumi"],
      datasets: [{
        data: [income, expense],
        backgroundColor: ["#4caf50", "#f44336"]
      }]
    }
  });

  if (categoryChart) categoryChart.destroy();
  categoryChart = new Chart(document.getElementById("categoryChart"), {
    type: "doughnut",
    data: {
      labels: Object.keys(categoryTotals),
      datasets: [{
        data: Object.values(categoryTotals),
        backgroundColor: ["#ff6384","#36a2eb","#ffce56","#4caf50","#9c27b0"]
      }]
    }
  });
}

// ===== TUMŠAIS REŽĪMS =====
document.getElementById("darkModeToggle").onclick = () => {
  document.documentElement.classList.toggle("dark");
  localStorage.setItem("theme", document.documentElement.classList.contains("dark") ? "dark" : "light");
};

if (localStorage.getItem("theme") === "dark") {
  document.documentElement.classList.add("dark");
}

// ===== START =====
document.addEventListener("DOMContentLoaded", () => {
  renderCategories();
  renderBudgets();
  render();
});
