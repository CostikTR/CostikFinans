import { formatCurrency, showNotification } from '../core/utils.js';

let getTransactions = () => [];
export function setTransactionsGetter(fn) { getTransactions = fn; }

// DOM
const reportStartDateInput = document.getElementById('report-start-date');
const reportEndDateInput = document.getElementById('report-end-date');
const applyDateFilterBtn = document.getElementById('apply-date-filter-btn');
const exportPdfBtn = document.getElementById('export-report-pdf-btn');

const reportTotalIncomeEl = document.getElementById('report-total-income');
const reportTotalExpenseEl = document.getElementById('report-total-expense');
const reportNetBalanceEl = document.getElementById('report-net-balance');
const reportTransactionCountEl = document.getElementById('report-transaction-count');

const incomeExpenseTrendCtx = document.getElementById('incomeExpenseTrendChart')?.getContext('2d');
const expenseCategoryCtx = document.getElementById('expenseCategoryChart')?.getContext('2d');
const reportTableBody = document.getElementById('report-table-body');

let incomeExpenseTrendChart;
let expenseCategoryChart;

export function initializeAndRenderReports() {
  if (!reportStartDateInput || !reportEndDateInput) return;
  const endDate = new Date();
  const startDate = new Date(); startDate.setDate(endDate.getDate() - 30);
  reportStartDateInput.valueAsDate = startDate;
  reportEndDateInput.valueAsDate = endDate;
  applyDateFilter();
}

function applyDateFilter() {
  const startDate = reportStartDateInput.valueAsDate;
  const endDate = reportEndDateInput.valueAsDate;
  if (!startDate || !endDate) {
    showNotification('Lütfen başlangıç ve bitiş tarihi seçin.', 'error');
    return;
  }
  endDate.setHours(23,59,59,999);
  const all = getTransactions();
  const filtered = all.filter(t => {
    const d = t.createdAt?.toDate?.() || (t.dueDate ? new Date(t.dueDate) : null);
    return d && d >= startDate && d <= endDate;
  });
  renderReports(filtered);
}

applyDateFilterBtn?.addEventListener('click', applyDateFilter);

exportPdfBtn?.addEventListener('click', () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const startDate = reportStartDateInput.value;
  const endDate = reportEndDateInput.value;
  doc.setFont('helvetica', 'bold');
  doc.text(`Finans Raporu (${startDate} - ${endDate})`, 14, 20);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Toplam Gelir: ${reportTotalIncomeEl.textContent}`, 14, 30);
  doc.text(`Toplam Gider: ${reportTotalExpenseEl.textContent}`, 14, 35);
  doc.text(`Net Bakiye: ${reportNetBalanceEl.textContent}`, 14, 40);
  doc.autoTable({ html: '#report-table', startY: 50, theme: 'grid' });
  doc.save(`FinansPro-Rapor-${startDate}_${endDate}.pdf`);
});

function renderReports(transactionsToReport) {
  const totalIncome = transactionsToReport.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactionsToReport.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const netBalance = totalIncome - totalExpense;

  reportTotalIncomeEl.textContent = formatCurrency(totalIncome);
  reportTotalExpenseEl.textContent = formatCurrency(totalExpense);
  reportNetBalanceEl.textContent = formatCurrency(netBalance);
  reportTransactionCountEl.textContent = transactionsToReport.length;

  renderIncomeExpenseTrendChart(transactionsToReport);
  renderExpenseCategoryChart(transactionsToReport.filter(t => t.type === 'expense'));
  renderReportTable(transactionsToReport);
}

function renderIncomeExpenseTrendChart(transactions) {
  if (incomeExpenseTrendChart) incomeExpenseTrendChart.destroy();
  const monthly = transactions.reduce((acc, t) => {
    const date = t.createdAt?.toDate?.() || (t.dueDate ? new Date(t.dueDate) : null);
    if (!date) return acc;
    const key = date.toISOString().slice(0, 7);
    if (!acc[key]) acc[key] = { income: 0, expense: 0 };
    if (t.type === 'income') acc[key].income += t.amount;
    else acc[key].expense += t.amount;
    return acc;
  }, {});
  const months = Object.keys(monthly).sort();
  const labels = months.map(m => new Date(m + '-02').toLocaleString('tr-TR', { month: 'long', year: 'numeric' }));
  const incomeData = months.map(m => monthly[m].income);
  const expenseData = months.map(m => monthly[m].expense);

  incomeExpenseTrendChart = new Chart(incomeExpenseTrendCtx, {
    type: 'line',
    data: { labels, datasets: [
      { label: 'Gelir', data: incomeData, borderColor: 'rgba(34,197,94,1)', backgroundColor: 'rgba(34,197,94,0.1)', fill: true, tension: 0.4 },
      { label: 'Gider', data: expenseData, borderColor: 'rgba(239,68,68,1)', backgroundColor: 'rgba(239,68,68,0.1)', fill: true, tension: 0.4 }
    ]},
    options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { callback: v => formatCurrency(v) } } } }
  });
}

function renderExpenseCategoryChart(expenseTransactions) {
  if (expenseCategoryChart) expenseCategoryChart.destroy();
  const byCat = expenseTransactions.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount; return acc;
  }, {});
  const labels = Object.keys(byCat);
  const data = Object.values(byCat);

  expenseCategoryChart = new Chart(expenseCategoryCtx, {
    type: 'doughnut',
    data: { labels, datasets: [{ label: 'Gider Dağılımı', data,
      backgroundColor: ['#ef4444','#f97316','#eab308','#84cc16','#22c55e','#10b981','#14b8a6','#06b6d4','#0ea5e9','#3b82f6','#6366f1','#8b5cf6','#a855f7'],
      hoverOffset: 4 }]},
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
  });
}

function renderReportTable(transactions) {
  reportTableBody.innerHTML = '';
  if (transactions.length === 0) {
    reportTableBody.innerHTML = `<tr><td colspan="5" class="text-center py-8 text-slate-500">Bu kriterlere uygun işlem bulunamadı.</td></tr>`;
    return;
  }
  const sorted = transactions.slice().sort((a, b) => (b.createdAt?.toDate?.() || 0) - (a.createdAt?.toDate?.() || 0));
  sorted.forEach(t => {
    const row = document.createElement('tr');
    row.className = 'hover:bg-slate-50 dark:hover:bg-slate-700/50';
    const typeClass = t.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
    const sign = t.type === 'income' ? '+' : '-';
    const date = t.createdAt?.toDate?.() || (t.dueDate ? new Date(t.dueDate) : new Date());
    row.innerHTML = `
      <td class="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">${date.toLocaleDateString('tr-TR')}</td>
      <td class="px-4 py-3 text-sm font-semibold ${typeClass}">${t.type === 'income' ? 'Gelir' : 'Gider'}</td>
      <td class="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">${t.description}</td>
      <td class="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">${t.category}</td>
      <td class="px-4 py-3 text-right font-semibold ${typeClass}">${sign} ${formatCurrency(t.amount)}</td>
    `;
    reportTableBody.appendChild(row);
  });
}
