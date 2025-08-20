// Firebase SDK'larını içe aktar
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, addDoc, query, onSnapshot, doc, deleteDoc, updateDoc, serverTimestamp, orderBy, writeBatch, getDoc, setDoc, getDocs, runTransaction } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Firebase yapılandırması (Orijinal anahtarlarınızla güncellendi)
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

// Firebase'i başlat
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
const toggleChartBtn = document.getElementById('toggle-chart-btn');
const chartContainer = document.getElementById('chart-container');
const chartCard = document.getElementById('chart-card');
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
const mobileHeader = document.getElementById('mobile-header');
const mobilePageTitle = document.getElementById('mobile-page-title');
const hamburgerBtn = document.getElementById('hamburger-btn');
const sidebarOverlay = document.getElementById('sidebar-overlay');
const sidebar = document.getElementById('sidebar');
const bottomNav = document.getElementById('bottom-nav');
const bottomNavLinks = document.querySelectorAll('.bottom-nav-link');
const cashFlowChartContainer = document.getElementById('cash-flow-chart-container');
const categoryTreemapContainer = document.getElementById('category-treemap-container');
const goalList = document.getElementById('goal-list');
const addGoalBtn = document.getElementById('add-goal-btn');
const goalModal = document.getElementById('goal-modal');
const addFundsModal = document.getElementById('add-funds-modal');


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
let itemToDelete = { id: null, type: null, subId: null };
let allTransactions = [];
let customCategories = [];
let allNotes = [];
let allBudgets = {};
let allCreditCards = [];
let allManualDebts = [];
let currentCardDebts = [];
let allGoals = [];
let expenseChart = null;
let historyChart = null;
let cardDebtChart = null;
let cashFlowChart = null;
let treemapChart = null;
let parsedCsvData = [];
let userSettings = { paymentDay: 1, accountBalance: 0 };
let noteSaveTimeout;
let quill = null;
let undoTimeoutId = null;

// --- SABİTLER ---
const defaultIncomeCategories = ['Maaş', 'Ek Gelir', 'Diğer Gelir'];
const defaultFixedExpenseCategories = ['Kira', 'Fatura', 'Kredi', 'Abonelik'];
const defaultIrregularExpenseCategories = ['Market', 'Ulaşım', 'Eğlence', 'Sağlık', 'Diğer Gider'];

// --- GEMINI API FONKSİYONU ---
async function callGemini(prompt) {
    let chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
    const payload = { contents: chatHistory };
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


// --- SAYFA NAVİGASYONU (GÜNCELLENDİ) ---
function navigateTo(pageId) {
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => {
        page.classList.toggle('hidden', page.id !== pageId);
    });
    
    const activeLink = document.querySelector(`.sidebar-link[data-page="${pageId}"]`) || document.querySelector(`.bottom-nav-link[data-page="${pageId}"]`);
    
    if (activeLink) {
        const pageName = activeLink.querySelector('span').textContent;
        pageTitle.textContent = pageName;
        mobilePageTitle.textContent = pageName;

        // Sidebar linklerini güncelle
        document.querySelectorAll('.sidebar-link').forEach(link => link.classList.remove('active'));
        document.querySelector(`.sidebar-link[data-page="${pageId}"]`)?.classList.add('active');

        // Alt navigasyon linklerini güncelle
        bottomNavLinks.forEach(link => {
            link.classList.remove('active', 'text-indigo-600', 'dark:text-indigo-400');
            link.classList.add('text-slate-500');
        });
        const activeBottomLink = document.querySelector(`.bottom-nav-link[data-page="${pageId}"]`);
        if (activeBottomLink) {
            activeBottomLink.classList.add('active', 'text-indigo-600', 'dark:text-indigo-400');
            activeBottomLink.classList.remove('text-slate-500');
        }
    }

    // Sayfaya özel render fonksiyonlarını çağır
    if (pageId === 'raporlar-page') {
        renderReportsPage();
    }
}

// --- MOBİL NAVİGASYON MANTIĞI (YENİ) ---
function setupMobileNavigation() {
    hamburgerBtn.addEventListener('click', () => {
        sidebar.classList.add('open');
        sidebarOverlay.classList.remove('hidden');
    });

    sidebarOverlay.addEventListener('click', () => {
        sidebar.classList.remove('open');
        sidebarOverlay.classList.add('hidden');
    });

    document.querySelectorAll('.sidebar-link, .bottom-nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const pageId = e.currentTarget.dataset.page;
            navigateTo(pageId);
            sidebar.classList.remove('open');
            sidebarOverlay.classList.add('hidden');
        });
    });
}

// ... (Geri kalan tüm JS kodu, önceki versiyonla aynı şekilde devam ediyor)
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
    if (expenseChart) updateExpenseChart(allTransactions);
    if (historyChart) renderHistoryChart(allTransactions);
    if (cashFlowChart) renderCashFlowChart();
    if (treemapChart) renderCategoryTreemap();
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
        if (transactionsUnsubscribe) transactionsUnsubscribe();
        if (categoriesUnsubscribe) categoriesUnsubscribe();
        if (notesUnsubscribe) notesUnsubscribe();
        if (budgetsUnsubscribe) budgetsUnsubscribe();
        if (creditCardsUnsubscribe) creditCardsUnsubscribe();
        if (manualDebtsUnsubscribe) manualDebtsUnsubscribe();
        if (cardDebtsUnsubscribe) cardDebtsUnsubscribe();
        if (goalsUnsubscribe) goalsUnsubscribe();
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
        loadGoals()
    ]);
    await loadTransactions();
    initializeBudgetToggle();
}

// ... (Geri kalan tüm fonksiyonlar buraya eklenecek)
// ... (Tüm fonksiyonlarınızı (renderList, loadGoals, getBankLogo vb.) buraya yapıştırın)

// --- UYGULAMA BAŞLANGICI ---
document.addEventListener('DOMContentLoaded', () => {
    initializeTheme();
    setupMobileNavigation();
});
