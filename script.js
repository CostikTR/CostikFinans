// FinansPro Uygulaması için Tüm JavaScript Kodları

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, addDoc, query, onSnapshot, doc, deleteDoc, updateDoc, serverTimestamp, orderBy, writeBatch, getDoc, setDoc, getDocs } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDx17NJkAZknMvRyDlNuFYaMdlMGFa-QmQ",
    authDomain: "finans-sitem.firebaseapp.com",
    databaseURL: "https://finans-sitem-default-rtdb.firebaseio.com",
    projectId: "finans-sitem",
    storageBucket: "finans-sitem.appspot.com",
    messagingSenderId: "117402758273",
    appId: "1:117402758273:web:93a296f43e393352057180",
    measurementId: "G-WLLK7B3WB5"
};

const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- DOM ELEMENTLERİ ---
const loadingOverlay = document.getElementById('loading-overlay');
const notificationBar = document.getElementById('notification-bar');
const notificationMessage = document.getElementById('notification-message');
const authScreen = document.getElementById('auth-screen');
const mainAppScreen = document.getElementById('main-app-screen');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const logoutButton = document.getElementById('logout-button');
const authError = document.getElementById('auth-error');
const loginTabButton = document.getElementById('login-tab-button');
const registerTabButton = document.getElementById('register-tab-button');
const deleteModal = document.getElementById('delete-modal');
const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
const editModal = document.getElementById('edit-modal');
const editForm = document.getElementById('edit-form');
const cancelEditBtn = document.getElementById('cancel-edit-btn');
const importModal = document.getElementById('import-modal');
const importPreviewList = document.getElementById('import-preview-list');
const cancelImportBtn = document.getElementById('cancel-import-btn');
const confirmImportBtn = document.getElementById('confirm-import-btn');
const settingsModal = document.getElementById('settings-modal');
const settingsForm = document.getElementById('settings-form');
const cancelSettingsBtn = document.getElementById('cancel-settings-btn');
const budgetModal = document.getElementById('budget-modal');
const budgetForm = document.getElementById('budget-form');
const cancelBudgetBtn = document.getElementById('cancel-budget-btn');
const notepadModal = document.getElementById('notepad-modal');
const closeNotepadBtn = document.getElementById('close-notepad-btn');
const newNoteBtn = document.getElementById('new-note-btn');
const notesList = document.getElementById('notes-list');
const activeNoteIdInput = document.getElementById('active-note-id');
const noteTitleInput = document.getElementById('note-title-input');
const notepadStatus = document.getElementById('notepad-status');
const categoryForm = document.getElementById('category-form');
const customCategoryList = document.getElementById('custom-category-list');
const budgetList = document.getElementById('budget-list');
const themeToggleBtn = document.getElementById('theme-toggle-btn');
const chartContainer = document.getElementById('chart-container');
const reminderBanner = document.getElementById('reminder-banner');
const reminderList = document.getElementById('reminder-list');
const closeReminderBtn = document.getElementById('close-reminder-btn');
const searchInput = document.getElementById('search-input');
const exportCsvBtn = document.getElementById('export-csv-btn');
const importCsvBtn = document.getElementById('import-csv-btn');
const csvFileInput = document.getElementById('csv-file-input');
const dashboardView = document.getElementById('dashboard-view');
const historyView = document.getElementById('history-view');
const historyBtn = document.getElementById('history-btn');
const backToDashboardBtn = document.getElementById('back-to-dashboard-btn');
const paymentHistoryList = document.getElementById('payment-history-list');
const settingsBtn = document.getElementById('settings-btn');
const notepadBtn = document.getElementById('notepad-btn');
const toggleBudgetListBtn = document.getElementById('toggle-budget-list-btn');
const addBudgetBtn = document.getElementById('add-budget-btn');
const undoSnackbar = document.getElementById('undo-snackbar');
const undoBtn = document.getElementById('undo-btn');
const incomeList = document.getElementById('income-list');
const fixedExpenseList = document.getElementById('fixed-expense-list');
const irregularExpenseList = document.getElementById('irregular-expense-list');
const creditPaymentList = document.getElementById('credit-payment-list');
const historyStartDate = document.getElementById('history-start-date');
const historyEndDate = document.getElementById('history-end-date');
const historyCategoryFilter = document.getElementById('history-category-filter');
const clearHistoryFilterBtn = document.getElementById('clear-history-filter');
const historyChartContainer = document.getElementById('history-chart-container');
const addTransactionBtn = document.getElementById('add-transaction-btn');
const transactionModal = document.getElementById('transaction-modal');
const transactionForm = document.getElementById('transaction-form');
const cancelTransactionBtn = document.getElementById('cancel-transaction-btn');
const addTransactionIcon = document.getElementById('add-transaction-icon');
const quickActionMenu = document.getElementById('quick-action-menu');
const quickAddIncomeBtn = document.getElementById('quick-add-income');
const quickAddExpenseBtn = document.getElementById('quick-add-expense');
const pageTitle = document.getElementById('page-title');
const aiCategorizeBtn = document.getElementById('ai-categorize-btn');
const aiBudgetSuggestionBtn = document.getElementById('ai-budget-suggestion-btn');
const aiBudgetSuggestionModal = document.getElementById('ai-budget-suggestion-modal');
const aiBudgetSuggestionContent = document.getElementById('ai-budget-suggestion-content');
const closeAiBudgetSuggestionBtn = document.getElementById('close-ai-budget-suggestion-btn');
const addBalanceModal = document.getElementById('add-balance-modal');
const addBalanceForm = document.getElementById('add-balance-form');
const cancelAddBalanceBtn = document.getElementById('cancel-add-balance-btn');
const accountBalanceCard = document.getElementById('account-balance-card');
const addCreditCardBtn = document.getElementById('add-credit-card-btn');
const creditCardModal = document.getElementById('credit-card-modal');
const creditCardForm = document.getElementById('credit-card-form');
const cancelCreditCardBtn = document.getElementById('cancel-credit-card-btn');
const creditCardList = document.getElementById('credit-card-list');
const cardDetailsModal = document.getElementById('card-details-modal');
const closeCardDetailsBtn = document.getElementById('close-card-details-btn');
const cardDebtForm = document.getElementById('card-debt-form');
const cardDebtList = document.getElementById('card-debt-list');
const manualDebtForm = document.getElementById('manual-debt-form');
const manualDebtList = document.getElementById('manual-debt-list');
const payStatementDebtBtn = document.getElementById('pay-statement-debt-btn');
const payMinimumDebtBtn = document.getElementById('pay-minimum-debt-btn');
const totalCardDebtEl = document.getElementById('total-card-debt');
const totalManualDebtEl = document.getElementById('total-manual-debt');
const totalMinimumPaymentEl = document.getElementById('total-minimum-payment');
const cardPaymentHistoryList = document.getElementById('card-payment-history-list');
const cardDebtChartContainer = document.getElementById('card-debt-chart-container');
const cardThemeSelector = document.getElementById('card-theme-selector');
const scanReceiptBtn = document.getElementById('scan-receipt-btn');
const receiptFileInput = document.getElementById('receipt-file-input');
const categoryComparisonSelect = document.getElementById('category-comparison-select');
const categoryComparisonChartContainer = document.getElementById('category-comparison-chart-container');
const addGoalBtn = document.getElementById('add-goal-btn');
const goalModal = document.getElementById('goal-modal');
const goalForm = document.getElementById('goal-form');
const cancelGoalBtn = document.getElementById('cancel-goal-btn');
const goalList = document.getElementById('goal-list');
const addInvestmentBtn = document.getElementById('add-investment-btn');
const investmentModal = document.getElementById('investment-modal');
const investmentForm = document.getElementById('investment-form');
const cancelInvestmentBtn = document.getElementById('cancel-investment-btn');
const investmentList = document.getElementById('investment-list');
const dashboardGrid = document.getElementById('dashboard-grid');

// --- UYGULAMA DURUMU (STATE) ---
let currentUserId = null;
let transactionsUnsubscribe = null;
let categoriesUnsubscribe = null;
let notesUnsubscribe = null;
let budgetsUnsubscribe = null;
let creditCardsUnsubscribe = null;
let manualDebtsUnsubscribe = null;
let cardDebtsUnsubscribe = null;
let goalsUnsubscribe = null;
let investmentsUnsubscribe = null;
let itemToDelete = { id: null, type: null, subId: null };
let allTransactions = [];
let customCategories = [];
let allNotes = [];
let allBudgets = {};
let allCreditCards = [];
let allManualDebts = [];
let currentCardDebts = [];
let allGoals = [];
let allInvestments = [];
let expenseChart = null;
let historyChart = null; 
let cardDebtChart = null; 
let cashFlowChart = null;
let categoryComparisonChart = null;
let parsedCsvData = [];
let userSettings = { paymentDay: 1, accountBalance: 0, dashboardLayout: null };
let noteSaveTimeout;
let quill = null;
let undoTimeoutId = null;

// --- SABİTLER ---
const defaultIncomeCategories = ['Maaş', 'Ek Gelir', 'Diğer Gelir'];
const defaultFixedExpenseCategories = ['Kira', 'Fatura', 'Kredi', 'Abonelik'];
const defaultIrregularExpenseCategories = ['Market', 'Ulaşım', 'Eğlence', 'Sağlık', 'Diğer Gider'];

// --- GEMINI API FONKSİYONU ---
async function callGemini(prompt, isJson = false) {
    let chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
    const payload = { contents: chatHistory };
    if(isJson){
        payload.generationConfig = {
            responseMimeType: "application/json",
        };
    }
    const apiKey = "";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            console.error("API isteği başarısız oldu:", response.status, await response.text());
            return null;
        }

        const result = await response.json();
        
        if (result.candidates && result.candidates.length > 0 &&
            result.candidates[0].content && result.candidates[0].content.parts &&
            result.candidates[0].content.parts.length > 0) {
            return result.candidates[0].content.parts[0].text;
        } else {
            console.error("API yanıtında beklenen içerik bulunamadı:", result);
            return null;
        }
    } catch (error) {
        console.error("Gemini API'ye bağlanırken hata oluştu:", error);
        return null;
    }
}

// --- SAYFA NAVİGASYONU ---
const pages = document.querySelectorAll('.page');
const navLinks = document.querySelectorAll('.sidebar-link');

function navigateTo(pageId) {
    pages.forEach(page => {
        page.classList.toggle('hidden', page.id !== pageId);
    });
    navLinks.forEach(link => {
        const linkPageId = link.dataset.page;
        link.classList.toggle('active', linkPageId === pageId);
        if (linkPageId === pageId) {
            pageTitle.textContent = link.querySelector('span').textContent;
        }
    });
}

navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const pageId = e.currentTarget.dataset.page;
        navigateTo(pageId);
    });
});

// --- YARDIMCI FONKSİYONLAR ---
function showNotification(message, type = 'error') {
    notificationMessage.textContent = message;
    notificationBar.className = 'notification-bar show fixed top-0 left-0 right-0 p-4 text-center text-white z-[100]';
    if (type === 'success') notificationBar.classList.add('bg-green-500');
    else if (type === 'info') notificationBar.classList.add('bg-sky-500');
    else notificationBar.classList.add('bg-red-500');
    setTimeout(() => {
        notificationBar.classList.remove('show');
    }, 3000);
}

function toggleLoading(show) {
    loadingOverlay.classList.toggle('hidden', !show);
}

// --- TEMA YÖNETİMİ ---
const applyTheme = (theme) => {
    const icon = themeToggleBtn.querySelector('i');
    if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        icon.classList.replace('fa-moon', 'fa-sun');
    } else {
        document.documentElement.classList.remove('dark');
        icon.classList.replace('fa-sun', 'fa-moon');
    }
    localStorage.setItem('theme', theme);
    // Re-render all charts with new theme
    renderDashboardCharts();
    if(historyChart) renderHistoryChart(allTransactions);
    if(categoryComparisonChart) renderCategoryComparisonChart();
};
const toggleTheme = () => {
    const newTheme = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
    applyTheme(newTheme);
};
const initializeTheme = () => {
    const savedTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    applyTheme(savedTheme);
};
themeToggleBtn.addEventListener('click', toggleTheme);
initializeTheme();

// --- KİMLİK DOĞRULAMA (AUTHENTICATION) ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUserId = user.uid;
        document.getElementById('user-email-display').textContent = user.email;
        authScreen.classList.add('hidden');
        mainAppScreen.classList.remove('hidden');
        addTransactionBtn.classList.remove('hidden');
        
        toggleLoading(true);
        navigateTo('finans-paneli-page');
        initializeQuillEditor();
        await loadAllData();
        toggleLoading(false);

    } else {
        currentUserId = null;
        authScreen.classList.remove('hidden');
        mainAppScreen.classList.add('hidden');
        addTransactionBtn.classList.add('hidden');
        // Unsubscribe from all listeners
        if (transactionsUnsubscribe) transactionsUnsubscribe();
        if (categoriesUnsubscribe) categoriesUnsubscribe();
        if (notesUnsubscribe) notesUnsubscribe();
        if (budgetsUnsubscribe) budgetsUnsubscribe();
        if (creditCardsUnsubscribe) creditCardsUnsubscribe();
        if (manualDebtsUnsubscribe) manualDebtsUnsubscribe();
        if (cardDebtsUnsubscribe) cardDebtsUnsubscribe();
        if (goalsUnsubscribe) goalsUnsubscribe();
        if (investmentsUnsubscribe) investmentsUnsubscribe();
        clearUI();
    }
});

// --- VERİ YÜKLEME ---
async function loadAllData() {
    await Promise.all([
        loadSettings(),
        loadCategories(),
        loadBudgets(),
        loadNotes(),
        loadCreditCards(),
        loadManualDebts(),
        loadGoals(),
        loadInvestments()
    ]);
    await loadTransactions(); // Transactions depend on other data, so load last
    initializeBudgetToggle();
}

// --- AYARLAR (SETTINGS) ---
async function loadSettings() {
    if (!currentUserId) return;
    const docRef = doc(db, `artifacts/${appId}/users/${currentUserId}/settings/main`);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        const data = docSnap.data();
        userSettings = {
            paymentDay: data.paymentDay || 1,
            accountBalance: data.accountBalance || 0,
            dashboardLayout: data.dashboardLayout || null
        };
    } else {
        userSettings = { paymentDay: 1, accountBalance: 0, dashboardLayout: null };
    }
    updateBalanceDisplay();
    renderDashboardLayout();
}

settingsBtn.addEventListener('click', () => {
    settingsForm.paymentDay.value = userSettings.paymentDay;
    settingsModal.classList.remove('hidden');
});
cancelSettingsBtn.addEventListener('click', () => settingsModal.classList.add('hidden'));
settingsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newPaymentDay = parseInt(settingsForm.paymentDay.value);
    if (newPaymentDay >= 1 && newPaymentDay <= 28) {
        userSettings.paymentDay = newPaymentDay;
        const settingsToSave = { ...userSettings };
        const docRef = doc(db, `artifacts/${appId}/users/${currentUserId}/settings/main`);
        try {
            await setDoc(docRef, settingsToSave);
            settingsModal.classList.add('hidden');
            displayTransactions();
            updateSummary();
            renderDashboardCharts();
            displayBudgets();
            showNotification('Ayarlar kaydedildi.', 'success');
        } catch (error) {
            console.error("Ayarlar kaydedilemedi:", error);
            showNotification('Ayarlar kaydedilemedi.');
        }
    } else {
        showNotification('Lütfen 1-28 arasında bir gün girin.');
    }
});

// --- BAKİYE YÖNETİMİ ---
// ... (Mevcut kod, değişiklik yok)

// --- KATEGORİ YÖNETİMİ ---
// ... (Mevcut kod, değişiklik yok)

// --- İŞLEM YÖNETİMİ (TRANSACTIONS) ---
// ... (Mevcut kod, değişiklik yok)

// --- ÖZET VE GRAFİK GÜNCELLEMELERİ ---
function updateSummary() {
    const { startDate, endDate } = getCurrentFinancialCycle(userSettings.paymentDay);
    const cycleTransactions = allTransactions.filter(tx => { 
        const txDate = tx.createdAt?.toDate(); 
        return txDate && txDate >= startDate && txDate <= endDate; 
    });
    const totalIncome = cycleTransactions.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0);
    const totalExpense = cycleTransactions.filter(tx => tx.type === 'expense' && tx.isPaid).reduce((sum, tx) => sum + tx.amount, 0);
    
    // Update summary cards if they exist
    const totalIncomeEl = document.getElementById('total-income');
    const totalExpenseEl = document.getElementById('total-expense');
    const balanceEl = document.getElementById('balance');

    if(totalIncomeEl) totalIncomeEl.textContent = `${totalIncome.toFixed(2)} ₺`;
    if(totalExpenseEl) totalExpenseEl.textContent = `${totalExpense.toFixed(2)} ₺`;
    if(balanceEl) balanceEl.textContent = `${userSettings.accountBalance.toFixed(2)} ₺`;
}

function renderDashboardCharts() {
    updateExpenseChart();
    renderCashFlowChart();
}

function updateExpenseChart() {
    const container = document.getElementById('chart-container');
    if (!container) return;
    const { startDate, endDate } = getCurrentFinancialCycle(userSettings.paymentDay);
    const cycleTransactions = allTransactions.filter(tx => { const txDate = tx.createdAt?.toDate(); return txDate && txDate >= startDate && txDate <= endDate; });
    const expenses = cycleTransactions.filter(tx => tx.type === 'expense' && tx.isPaid);
    const categoryTotals = expenses.reduce((acc, tx) => { acc[tx.category] = (acc[tx.category] || 0) + tx.amount; return acc; }, {});
    const labels = Object.keys(categoryTotals);
    const data = Object.values(categoryTotals);
    if (expenseChart) expenseChart.destroy();
    if (labels.length === 0) {
         container.innerHTML = '<p class="text-center text-slate-500 mt-20">Bu dönem için gider verisi yok.</p>';
         return;
    } else {
         container.innerHTML = '<canvas id="expenseChart"></canvas>';
    }
    const canvas = document.getElementById('expenseChart');
    if (canvas) {
         expenseChart = new Chart(canvas.getContext('2d'), {
            type: 'doughnut',
            data: { labels, datasets: [{ data, backgroundColor: ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7'], borderColor: document.documentElement.classList.contains('dark') ? '#1e293b' : '#ffffff', borderWidth: 2 }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: document.documentElement.classList.contains('dark') ? '#d1d5db' : '#4b5563', boxWidth: 12, padding: 15 } } } }
        });
    }
}

// --- YENİ ÖZELLİKLER ---

// 1. Nakit Akışı Tahmini
function renderCashFlowChart() {
    const container = document.getElementById('cash-flow-chart-container');
    if (!container) return;

    const recurringIncomes = allTransactions.filter(tx => tx.isRecurring && tx.type === 'income');
    const recurringExpenses = allTransactions.filter(tx => tx.isRecurring && tx.type === 'expense');

    let balance = userSettings.accountBalance;
    const forecastData = [{ x: new Date(), y: balance }];
    
    for (let i = 1; i <= 30; i++) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + i);
        const dayOfMonth = futureDate.getDate();

        recurringIncomes.forEach(tx => {
            if (tx.dueDate && parseInt(tx.dueDate.split('-')[2]) === dayOfMonth) {
                balance += tx.amount;
            }
        });
        recurringExpenses.forEach(tx => {
            if (tx.dueDate && parseInt(tx.dueDate.split('-')[2]) === dayOfMonth) {
                balance -= tx.amount;
            }
        });
        forecastData.push({ x: futureDate, y: balance });
    }

    if (cashFlowChart) cashFlowChart.destroy();
    container.innerHTML = ''; // Clear previous content

    const options = {
        series: [{ name: 'Tahmini Bakiye', data: forecastData.map(d => d.y.toFixed(2)) }],
        chart: { type: 'area', height: '100%', toolbar: { show: false } },
        dataLabels: { enabled: false },
        stroke: { curve: 'smooth', width: 2 },
        xaxis: {
            type: 'datetime',
            categories: forecastData.map(d => d.x.toISOString()),
            labels: { style: { colors: document.documentElement.classList.contains('dark') ? '#9ca3af' : '#4b5563' } }
        },
        yaxis: { labels: { style: { colors: document.documentElement.classList.contains('dark') ? '#9ca3af' : '#4b5563' } } },
        tooltip: { x: { format: 'dd MMM yyyy' }, y: { formatter: val => `${val} ₺` } },
        grid: { borderColor: document.documentElement.classList.contains('dark') ? '#334155' : '#e2e8f0' },
        theme: { mode: document.documentElement.classList.contains('dark') ? 'dark' : 'light' }
    };
    cashFlowChart = new ApexCharts(container, options);
    cashFlowChart.render();
}

// 2. Aylık Kategori Karşılaştırması
function populateCategoryComparisonSelect() {
    const allExpenseCategories = [...new Set([...defaultFixedExpenseCategories, ...defaultIrregularExpenseCategories, ...customCategories.map(c => c.name)])].sort();
    populateSelect(categoryComparisonSelect, allExpenseCategories);
}

function renderCategoryComparisonChart() {
    const selectedCategory = categoryComparisonSelect.value;
    if (!selectedCategory) {
        categoryComparisonChartContainer.innerHTML = '<p class="text-center text-slate-500 py-10">Lütfen bir kategori seçin.</p>';
        return;
    }

    const monthlyTotals = {};
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    allTransactions
        .filter(tx => tx.type === 'expense' && tx.category === selectedCategory && tx.createdAt && tx.createdAt.toDate() > sixMonthsAgo)
        .forEach(tx => {
            const monthKey = tx.createdAt.toDate().toISOString().slice(0, 7); // YYYY-MM
            monthlyTotals[monthKey] = (monthlyTotals[monthKey] || 0) + tx.amount;
        });

    const sortedMonthKeys = Object.keys(monthlyTotals).sort();
    const chartData = sortedMonthKeys.map(key => monthlyTotals[key]);
    const chartLabels = sortedMonthKeys.map(key => new Date(key + '-02').toLocaleString('tr-TR', { month: 'long', year: 'numeric' }));

    if (categoryComparisonChart) categoryComparisonChart.destroy();
    categoryComparisonChartContainer.innerHTML = '';

    const options = {
        series: [{ name: 'Toplam Harcama', data: chartData }],
        chart: { type: 'bar', height: 350 },
        plotOptions: { bar: { horizontal: false, columnWidth: '55%', endingShape: 'rounded' } },
        dataLabels: { enabled: false },
        xaxis: {
            categories: chartLabels,
            labels: { style: { colors: document.documentElement.classList.contains('dark') ? '#9ca3af' : '#4b5563' } }
        },
        yaxis: { title: { text: 'Tutar (₺)', style: { color: document.documentElement.classList.contains('dark') ? '#9ca3af' : '#4b5563' } } },
        tooltip: { y: { formatter: val => `${val.toFixed(2)} ₺` } },
        grid: { borderColor: document.documentElement.classList.contains('dark') ? '#334155' : '#e2e8f0' },
        theme: { mode: document.documentElement.classList.contains('dark') ? 'dark' : 'light' }
    };

    categoryComparisonChart = new ApexCharts(categoryComparisonChartContainer, options);
    categoryComparisonChart.render();
}
categoryComparisonSelect.addEventListener('change', renderCategoryComparisonChart);

// 3. Fiş Okuma
scanReceiptBtn.addEventListener('click', () => receiptFileInput.click());
receiptFileInput.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    toggleLoading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
        const base64Image = e.target.result.split(',')[1];
        const prompt = `Bu fişten toplam tutarı, tarihi (YYYY-MM-DD formatında) ve satıcı adını çıkar. Sadece JSON formatında cevap ver: {"total": number, "date": "YYYY-MM-DD", "vendor": "string"}`;
        
        // This is a placeholder for a function that would call Gemini with image data
        // Since we can't do that here, we'll simulate a response.
        // const responseJson = await callGeminiWithImage(prompt, base64Image);
        
        // --- SİMÜLASYON BAŞLANGICI ---
        // Gerçek bir uygulamada, yukarıdaki satır kullanılmalıdır.
        const simulatedResponse = JSON.stringify({
            total: 175.50,
            date: "2024-07-21",
            vendor: "Migros Market"
        });
        // --- SİMÜLASYON SONU ---
        
        try {
            const data = JSON.parse(simulatedResponse); // responseJson
            openTransactionModalWithType('expense');
            setTimeout(() => { // Modalın açılmasını beklemek için
                document.querySelector('.expense-type-btn[data-type="irregular"]').click();
                transactionForm.description.value = data.vendor || '';
                transactionForm.amount.value = data.total || '';
                transactionForm.dueDate.value = data.date || new Date().toISOString().split('T')[0];
                transactionForm.category.value = 'Market';
            }, 200);
        } catch (error) {
            console.error("Fiş verisi işlenemedi:", error);
            showNotification("Fişten veriler okunamadı.");
        } finally {
            toggleLoading(false);
            receiptFileInput.value = '';
        }
    };
    reader.readAsDataURL(file);
});

// 4. Hedefler
// ... (Hedefler için fonksiyonlar buraya eklenecek)

// 5. Yatırımlar
// ... (Yatırımlar için fonksiyonlar buraya eklenecek)

// 6. Özelleştirilebilir Panel
function renderDashboardLayout() {
    // ... (Panel düzeni için fonksiyonlar buraya eklenecek)
}

// 7. Ortak Bütçe
// ... (Ortak bütçe için fonksiyonlar buraya eklenecek)

// --- MEVCUT FONKSİYONLARIN GÜNCELLENMESİ ---
// ... (Mevcut fonksiyonlarda yapılan küçük değişiklikler)

