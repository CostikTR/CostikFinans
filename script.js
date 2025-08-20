// Firebase SDK'larını içe aktar
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, addDoc, query, onSnapshot, doc, deleteDoc, updateDoc, serverTimestamp, orderBy, writeBatch, getDoc, setDoc, getDocs } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Firebase yapılandırması
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


// --- UYGULAMA DURUMU (STATE) ---
let currentUserId = null;
let transactionsUnsubscribe = null;
let categoriesUnsubscribe = null;
let notesUnsubscribe = null;
let budgetsUnsubscribe = null;
let creditCardsUnsubscribe = null;
let manualDebtsUnsubscribe = null;
let cardDebtsUnsubscribe = null;
let itemToDelete = { id: null, type: null, subId: null };
let allTransactions = [];
let customCategories = [];
let allNotes = [];
let allBudgets = {};
let allCreditCards = [];
let allManualDebts = [];
let currentCardDebts = [];
let expenseChart = null;
let historyChart = null;
let cardDebtChart = null;
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
    if (expenseChart) updateExpenseChart(allTransactions);
    if (historyChart) renderHistoryChart(allTransactions);
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
        if (transactionsUnsubscribe) transactionsUnsubscribe();
        if (categoriesUnsubscribe) categoriesUnsubscribe();
        if (notesUnsubscribe) notesUnsubscribe();
        if (budgetsUnsubscribe) budgetsUnsubscribe();
        if (creditCardsUnsubscribe) creditCardsUnsubscribe();
        if (manualDebtsUnsubscribe) manualDebtsUnsubscribe();
        if (cardDebtsUnsubscribe) cardDebtsUnsubscribe();
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
        loadManualDebts()
    ]);
    await loadTransactions();
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
            accountBalance: data.accountBalance || 0
        };
    } else {
        userSettings = { paymentDay: 1, accountBalance: 0 };
    }
    updateBalanceDisplay();
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
        const settingsToSave = { paymentDay: userSettings.paymentDay, accountBalance: userSettings.accountBalance };
        const docRef = doc(db, `artifacts/${appId}/users/${currentUserId}/settings/main`);
        try {
            await setDoc(docRef, settingsToSave);
            settingsModal.classList.add('hidden');
            displayTransactions();
            updateSummary();
            updateExpenseChart(allTransactions);
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
function updateBalanceDisplay() {
    const balanceElement = document.getElementById('account-balance-card');
    if (balanceElement) {
         balanceElement.textContent = `${userSettings.accountBalance.toFixed(2)} ₺`;
    }
    updateSummary();
}

async function updateBalanceInFirestore(newBalance) {
    if (!currentUserId) return;
    userSettings.accountBalance = newBalance;
    const docRef = doc(db, `artifacts/${appId}/users/${currentUserId}/settings/main`);
    try {
        await setDoc(docRef, userSettings, { merge: true });
    } catch (error) {
        console.error("Bakiye güncellenemedi:", error);
        showNotification('Bakiye güncellenirken bir hata oluştu.');
    }
}

document.getElementById('add-balance-btn').addEventListener('click', () => {
    addBalanceForm.reset();
    addBalanceModal.classList.remove('hidden');
});

cancelAddBalanceBtn.addEventListener('click', () => {
    addBalanceModal.classList.add('hidden');
});

addBalanceForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const amountToAdd = parseFloat(e.target.amount.value);
    if (isNaN(amountToAdd) || amountToAdd <= 0) {
        showNotification('Lütfen geçerli bir tutar girin.');
        return;
    }
    const newBalance = userSettings.accountBalance + amountToAdd;
    await updateBalanceInFirestore(newBalance);
    updateBalanceDisplay();
    addBalanceModal.classList.add('hidden');
    showNotification(`${amountToAdd.toFixed(2)} ₺ bakiye eklendi.`, 'success');
});

// --- KATEGORİ YÖNETİMİ ---
function loadCategories() {
    if (!currentUserId) return;
    if (categoriesUnsubscribe) categoriesUnsubscribe();
    const q = query(collection(db, `artifacts/${appId}/users/${currentUserId}/categories`), orderBy("name"));
    return new Promise((resolve) => {
        categoriesUnsubscribe = onSnapshot(q, (snapshot) => {
            customCategories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            updateCategoryDropdowns();
            displayCustomCategories();
            displayBudgets();
            populateHistoryCategoryFilter();
            resolve();
        }, (error) => {
            console.error("Kategoriler yüklenemedi:", error);
            resolve();
        });
    });
}
function updateCategoryDropdowns() {
    populateSelect(transactionForm.querySelector('select[name="category"]'), []);
}
function populateSelect(selectElement, options) {
    selectElement.innerHTML = options.map(opt => `<option value="${opt}">${opt}</option>`).join('');
}
function displayCustomCategories() {
    if (customCategories.length === 0) {
        customCategoryList.innerHTML = `<p class="text-slate-500 text-sm">Özel kategori yok.</p>`;
        return;
    }
    customCategoryList.innerHTML = customCategories.map(cat => `<div class="flex justify-between items-center text-sm p-2 rounded-md bg-slate-100 dark:bg-slate-700"><span class="font-medium">${cat.name}</span><button data-id="${cat.id}" class="delete-category-btn text-slate-400 hover:text-red-500 text-xs"><i class="fa-solid fa-trash-can"></i></button></div>`).join('');
    customCategoryList.querySelectorAll('.delete-category-btn').forEach(button => {
        button.addEventListener('click', (e) => deleteCategory(e.currentTarget.dataset.id));
    });
}
categoryForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const categoryName = categoryForm.categoryName.value.trim();
    if (!categoryName) return;
    try {
        await addDoc(collection(db, `artifacts/${appId}/users/${currentUserId}/categories`), { name: categoryName });
        categoryForm.reset();
    } catch (error) { 
        console.error("Kategori eklenemedi:", error);
        showNotification('Kategori eklenemedi.');
    }
});
async function deleteCategory(id) {
    if (!currentUserId) return;
    try {
        await deleteDoc(doc(db, `artifacts/${appId}/users/${currentUserId}/categories/${id}`));
    } catch (error) { 
        console.error("Kategori silinemedi:", error);
        showNotification('Kategori silinemedi.');
    }
}

// --- İŞLEM YÖNETİMİ (TRANSACTIONS) ---
addTransactionBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    quickActionMenu.classList.toggle('scale-0');
    quickActionMenu.classList.toggle('opacity-0');
    addTransactionIcon.classList.toggle('rotate-45');
});
function closeQuickActionMenu() {
    quickActionMenu.classList.add('scale-0', 'opacity-0');
    addTransactionIcon.classList.remove('rotate-45');
}
document.addEventListener('click', (e) => {
    if (!addTransactionBtn.parentElement.contains(e.target)) {
        closeQuickActionMenu();
    }
});
quickAddIncomeBtn.addEventListener('click', () => {
    openTransactionModalWithType('income');
    closeQuickActionMenu();
});
quickAddExpenseBtn.addEventListener('click', () => {
    openTransactionModalWithType('expense');
    closeQuickActionMenu();
});
function openTransactionModalWithType(type) {
    transactionForm.reset();
    document.getElementById('transaction-type-selector').classList.add('hidden');
    document.getElementById('expense-type-selector').classList.add('hidden');
    document.querySelector('.form-fields').classList.add('hidden');
    document.querySelectorAll('.transaction-type-btn, .expense-type-btn').forEach(btn => btn.classList.remove('active'));
    transactionModal.classList.remove('hidden');
    if (type === 'income') {
        document.querySelector('.transaction-type-btn[data-type="income"]').classList.add('active');
        setupTransactionForm('income');
    } else if (type === 'expense') {
        document.querySelector('.transaction-type-btn[data-type="expense"]').classList.add('active');
        document.getElementById('expense-type-selector').classList.remove('hidden');
    }
}
function closeTransactionModal() {
    transactionModal.classList.add('hidden');
    transactionForm.reset();
    document.getElementById('transaction-type-selector').classList.remove('hidden');
    document.getElementById('expense-type-selector').classList.add('hidden');
    document.querySelector('.form-fields').classList.add('hidden');
    document.querySelectorAll('.transaction-type-btn, .expense-type-btn').forEach(btn => btn.classList.remove('active'));
}
cancelTransactionBtn.addEventListener('click', closeTransactionModal);
document.querySelectorAll('.transaction-type-btn').forEach(btn => {
    btn.addEventListener('click', e => {
        const type = e.currentTarget.dataset.type;
        document.querySelectorAll('.transaction-type-btn').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        if(type === 'income') {
            document.getElementById('expense-type-selector').classList.add('hidden');
            setupTransactionForm('income');
        } else {
            document.getElementById('expense-type-selector').classList.remove('hidden');
            document.querySelector('.form-fields').classList.add('hidden');
        }
    });
});
document.querySelectorAll('.expense-type-btn').forEach(btn => {
    btn.addEventListener('click', e => {
        const type = e.currentTarget.dataset.type;
        document.querySelectorAll('.expense-type-btn').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        setupTransactionForm(type);
    });
});
function setupTransactionForm(type) {
    const formFields = document.querySelector('.form-fields');
    const categorySelect = transactionForm.querySelector('select[name="category"]');
    const dueDateContainer = document.getElementById('form-due-date-container');
    const installmentContainer = document.getElementById('form-installment-container');
    const isInstallmentContainer = document.getElementById('form-is-installment-container');
    const recurringContainer = document.getElementById('form-recurring-container');
    const dueDateInput = transactionForm.querySelector('input[name="dueDate"]');
    [dueDateContainer, installmentContainer, isInstallmentContainer, recurringContainer].forEach(el => el.classList.add('hidden'));
    dueDateInput.required = false;
    if (type === 'income') {
        populateSelect(categorySelect, defaultIncomeCategories);
        dueDateContainer.classList.remove('hidden');
        recurringContainer.classList.remove('hidden');
    } else if (type === 'fixed') {
        populateSelect(categorySelect, defaultFixedExpenseCategories);
        dueDateContainer.classList.remove('hidden');
        isInstallmentContainer.classList.remove('hidden');
        recurringContainer.classList.remove('hidden');
        dueDateInput.required = true;
    } else if (type === 'irregular') {
        const allIrregular = [...defaultIrregularExpenseCategories, ...customCategories.map(c => c.name)];
        populateSelect(categorySelect, allIrregular);
        dueDateContainer.classList.remove('hidden');
        isInstallmentContainer.classList.remove('hidden');
    }
    formFields.classList.remove('hidden');
}
transactionForm.querySelector('input[name="isInstallment"]').addEventListener('change', e => {
    document.getElementById('form-installment-container').classList.toggle('hidden', !e.target.checked);
    if(e.target.checked) {
        transactionForm.querySelector('input[name="isRecurring"]').checked = false;
    }
});
transactionForm.querySelector('input[name="isRecurring"]').addEventListener('change', e => {
    const dueDateInput = transactionForm.querySelector('input[name="dueDate"]');
    const isChecked = e.target.checked;
    dueDateInput.required = isChecked;
    if(isChecked) {
        transactionForm.querySelector('input[name="isInstallment"]').checked = false;
        document.getElementById('form-installment-container').classList.add('hidden');
    }
});
transactionForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitButton = transactionForm.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.innerHTML;
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
    const formData = new FormData(transactionForm);
    const description = formData.get('description');
    const amount = parseFloat(formData.get('amount'));
    const category = formData.get('category');
    const type = defaultIncomeCategories.includes(category) ? 'income' : 'expense';
    const isRecurring = formData.get('isRecurring') === 'on';
    const isInstallment = formData.get('isInstallment') === 'on';
    const installmentCount = isInstallment ? parseInt(formData.get('installmentCount')) : 0;
    let dueDate = formData.get('dueDate');
    if (type === 'expense' && !isRecurring && !isInstallment && !dueDate) {
        dueDate = new Date().toISOString().split('T')[0];
    }
    if (!description.trim() || !category || isNaN(amount) || amount <= 0) {
        showNotification("Lütfen tüm alanları doğru bir şekilde doldurun.");
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonText;
        return;
    }
    try {
        const collectionRef = collection(db, `artifacts/${appId}/users/${currentUserId}/transactions`);
        if (isInstallment) {
            const batch = writeBatch(db);
            const installmentAmount = amount / installmentCount;
            const installmentGroupId = crypto.randomUUID();
            const [startYear, startMonth, startDay] = dueDate.split('-').map(Number);
            for (let i = 0; i < installmentCount; i++) {
                const installmentDate = new Date(Date.UTC(startYear, startMonth - 1, startDay));
                installmentDate.setUTCMonth(installmentDate.getUTCMonth() + i);
                const newDocRef = doc(collectionRef);
                batch.set(newDocRef, {
                    description: `${description} (${i + 1}/${installmentCount})`,
                    amount: installmentAmount, category, type,
                    dueDate: installmentDate.toISOString().split('T')[0],
                    isPaid: false, isInstallment: true, installmentGroupId,
                    createdAt: serverTimestamp()
                });
            }
            await batch.commit();
        } else {
            const data = { description, amount, category, type, createdAt: serverTimestamp() };
            const activeExpenseTypeBtn = transactionForm.querySelector('.expense-type-btn.active');
            const expenseSubtype = activeExpenseTypeBtn ? activeExpenseTypeBtn.dataset.type : null;

            if (type === 'income') {
                const newBalance = userSettings.accountBalance + amount;
                await updateBalanceInFirestore(newBalance);
                updateBalanceDisplay();
            } else if (type === 'expense' && expenseSubtype === 'irregular') {
                data.isPaid = true;
                const newBalance = userSettings.accountBalance - amount;
                await updateBalanceInFirestore(newBalance);
                updateBalanceDisplay();
            } else {
                data.isPaid = false;
            }
            
            if (dueDate) data.dueDate = dueDate;
            if (isRecurring) data.isRecurring = true;
            await addDoc(collectionRef, data);
        }
        closeTransactionModal();
        showNotification('İşlem eklendi.', 'success');
    } catch (error) {
        console.error("İşlem eklenirken hata oluştu: ", error);
        showNotification('İşlem eklenirken bir hata oluştu.');
    } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonText;
    }
});
function loadTransactions() {
    if (!currentUserId) return;
    if (transactionsUnsubscribe) transactionsUnsubscribe();
    const q = query(collection(db, `artifacts/${appId}/users/${currentUserId}/transactions`), orderBy("createdAt", "desc"));
    return new Promise((resolve) => {
        transactionsUnsubscribe = onSnapshot(q, (snapshot) => {
            allTransactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            checkAndCreateRecurringTransactions(allTransactions);
            displayTransactions();
            updateSummary();
            updateExpenseChart(allTransactions);
            checkReminders();
            displayPaymentHistory();
            displayBudgets();
            resolve();
        }, (error) => {
            console.error("İşlemler yüklenemedi:", error);
            resolve();
        });
    });
}
function displayTransactions() {
    const searchTerm = searchInput.value.toLowerCase();
    const { startDate, endDate } = getCurrentFinancialCycle(userSettings.paymentDay);
    const filtered = allTransactions.filter(tx => tx.description.toLowerCase().includes(searchTerm) || tx.category.toLowerCase().includes(searchTerm));
    const incomes = filtered.filter(tx => { const txDate = tx.createdAt?.toDate(); return tx.type === 'income' && txDate >= startDate && txDate <= endDate; });
    
    const fixedExpenses = filtered.filter(tx => 
        tx.type === 'expense' && !tx.isPaid && (defaultFixedExpenseCategories.includes(tx.category) || tx.isInstallment)
    );
    fixedExpenses.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    const irregularExpenses = filtered.filter(tx => { const txDate = tx.createdAt?.toDate(); return tx.type === 'expense' && tx.isPaid && !tx.isInstallment && !defaultFixedExpenseCategories.includes(tx.category) && txDate >= startDate && txDate <= endDate; });
    const creditPayments = filtered.filter(tx => { const txDate = tx.createdAt?.toDate(); return tx.category === 'Kredi' && tx.isPaid && txDate && txDate >= startDate && txDate <= endDate; });

    renderList(incomeList, incomes, 'Bu dönemde gelir yok.');
    renderList(fixedExpenseList, fixedExpenses, 'Ödenecek sabit gider/taksit yok.');
    renderList(irregularExpenseList, irregularExpenses, 'Bu dönemde düzensiz gider yok.');
    renderList(creditPaymentList, creditPayments, 'Bu dönemde kredi ödemesi yok.');
}
function renderList(container, transactions, emptyMessage) {
    if (!container) return;
    if (transactions.length === 0) {
        container.innerHTML = `<p class="text-slate-500 text-sm">${emptyMessage}</p>`;
        return;
    }
    container.innerHTML = transactions.map(tx => {
        const isIncome = tx.type === 'income';
        const dueDateHTML = tx.dueDate ? `<p class="text-xs text-slate-500">Tarih: ${new Date(tx.dueDate + 'T00:00:00Z').toLocaleDateString('tr-TR')}</p>` : '';
        const paidCheckboxHTML = container.id === 'fixed-expense-list' ? `<input type="checkbox" data-id="${tx.id}" class="paid-checkbox h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 mr-3" ${tx.isPaid ? 'checked' : ''}>` : '';
        const editButtonHTML = !tx.isInstallment ? `<button data-id="${tx.id}" data-type="transaction" class="edit-btn text-slate-400 hover:text-indigo-500 text-xs"><i class="fa-solid fa-pencil"></i></button>` : '';
        return `<div class="transaction-item flex justify-between items-center text-sm p-2 rounded-md transition-colors hover:bg-slate-100 dark:hover:bg-slate-700/50" data-id="${tx.id}"><div class="flex items-center flex-grow truncate">${paidCheckboxHTML}<div class="truncate ${tx.isPaid && container.id !== 'credit-payment-list' ? 'paid-transaction' : ''}"><p class="font-semibold truncate">${tx.description}</p><div class="flex items-center space-x-2"><p class="text-xs text-slate-500">${tx.category}</p>${dueDateHTML}</div></div></div><div class="text-right ml-2 flex-shrink-0"><p class="font-bold ${isIncome ? 'text-green-500' : 'text-red-500'} ${tx.isPaid && container.id !== 'credit-payment-list' ? 'paid-transaction' : ''}">${isIncome ? '+' : '-'} ${tx.amount.toFixed(2)}₺</p><div class="actions flex items-center justify-end space-x-2 mt-1">${editButtonHTML}<button data-id="${tx.id}" data-type="transaction" class="delete-btn text-slate-400 hover:text-red-500 text-xs"><i class="fa-solid fa-trash-can"></i></button></div></div></div>`;
    }).join('');
    container.querySelectorAll('.paid-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                const listItem = e.target.closest('.transaction-item');
                e.target.disabled = true;
                listItem.classList.add('paid-transaction');
                showUndoSnackbar(e.target.dataset.id);
            }
        });
    });
    container.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', (e) => openDeleteModal(e.currentTarget.dataset.id, 'transaction'));
    });
    container.querySelectorAll('.edit-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const transaction = allTransactions.find(t => t.id === e.currentTarget.dataset.id);
            if(transaction) openEditModal(transaction);
        });
    });
}
function showUndoSnackbar(transactionId) {
    clearTimeout(undoTimeoutId);
    const paidTransaction = allTransactions.find(tx => tx.id === transactionId);
    if (!paidTransaction) return;
    undoSnackbar.classList.add('show');
    const undoHandler = () => {
        clearTimeout(undoTimeoutId);
        const listItem = document.querySelector(`.transaction-item[data-id="${transactionId}"]`);
        if (listItem) {
            const checkbox = listItem.querySelector('.paid-checkbox');
            checkbox.checked = false;
            checkbox.disabled = false;
            listItem.classList.remove('paid-transaction');
        }
        hideUndoSnackbar();
    };
    undoBtn.addEventListener('click', undoHandler, { once: true });
    undoTimeoutId = setTimeout(() => {
        handlePayment(paidTransaction);
        hideUndoSnackbar();
        undoBtn.removeEventListener('click', undoHandler);
    }, 5000);
}
function hideUndoSnackbar() {
    undoSnackbar.classList.remove('show');
}
async function handlePayment(transactionToPay) {
    const docRef = doc(db, `artifacts/${appId}/users/${currentUserId}/transactions/${transactionToPay.id}`);
    try {
        const newBalance = userSettings.accountBalance - transactionToPay.amount;
        await updateBalanceInFirestore(newBalance);
        updateBalanceDisplay();
        await updateDoc(docRef, { isPaid: true });
    } catch (error) {
        console.error("Ödendi durumu güncellenemedi:", error);
        showNotification('Ödeme durumu güncellenemedi.');
        const listItem = document.querySelector(`.transaction-item[data-id="${transactionToPay.id}"]`);
        if (listItem) {
            const checkbox = listItem.querySelector('.paid-checkbox');
            checkbox.checked = false;
            checkbox.disabled = false;
            listItem.classList.remove('paid-transaction');
        }
        const revertedBalance = userSettings.accountBalance + transactionToPay.amount;
        await updateBalanceInFirestore(revertedBalance);
        updateBalanceDisplay();
    }
}
async function checkAndCreateRecurringTransactions(transactions) {
    const recurringTemplates = transactions.filter(tx => tx.isRecurring && !tx.isPaid);
    if (recurringTemplates.length === 0) return;
    const batch = writeBatch(db);
    let hasNewTransactions = false;
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    for (const template of recurringTemplates) {
        if (!template.dueDate) continue;
        const [year, month, day] = template.dueDate.split('-').map(Number);
        let nextDueDate = new Date(Date.UTC(year, month - 1, day));
        const templateCreationDate = template.createdAt?.toDate() || new Date(0);
        while (nextDueDate <= templateCreationDate) {
            nextDueDate.setUTCMonth(nextDueDate.getUTCMonth() + 1);
        }
        while (nextDueDate <= today) {
            const nextDueDateString = nextDueDate.toISOString().split('T')[0];
            const alreadyExists = transactions.some(tx => tx.description === template.description && tx.category === template.category && tx.dueDate === nextDueDateString);
            if (!alreadyExists) {
                const newTransactionData = { ...template };
                delete newTransactionData.id;
                delete newTransactionData.isRecurring;
                newTransactionData.dueDate = nextDueDateString;
                newTransactionData.createdAt = serverTimestamp();
                newTransactionData.isPaid = false;
                const newDocRef = doc(collection(db, `artifacts/${appId}/users/${currentUserId}/transactions`));
                batch.set(newDocRef, newTransactionData);
                hasNewTransactions = true;
            }
            nextDueDate.setUTCMonth(nextDueDate.getUTCMonth() + 1);
        }
    }
    if (hasNewTransactions) {
        try {
            await batch.commit();
        } catch (error) {
            console.error("Tekrarlanan işlemler oluşturulurken hata:", error);
        }
    }
}

function checkReminders() {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    
    const expenseReminders = allTransactions
        .filter(tx => tx.type === 'expense' && tx.dueDate && !tx.isPaid)
        .map(tx => {
            const dueDate = new Date(tx.dueDate + 'T00:00:00Z');
            const diffDays = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
            return { ...tx, diffDays };
        })
        .filter(tx => tx.diffDays <= 7)
        .sort((a, b) => a.diffDays - b.diffDays)
        .map(tx => {
            if (tx.diffDays < 0) return `<div><i class="fa-solid fa-receipt text-red-500 mr-2"></i><strong>${tx.description}</strong> ödemesinin günü geçti!</div>`;
            if (tx.diffDays === 0) return `<div><i class="fa-solid fa-receipt text-red-500 mr-2"></i><strong>${tx.description}</strong> ödemesinin bugün son günü!</div>`;
            return `<div><i class="fa-solid fa-receipt text-yellow-600 mr-2"></i><strong>${tx.description}</strong> ödemesine ${tx.diffDays} gün kaldı.</div>`;
        });

    const cardReminders = allCreditCards.map(card => {
        const nextDueDate = new Date(today.getFullYear(), today.getMonth(), card.paymentDueDay);
        if (nextDueDate < today) {
            nextDueDate.setMonth(nextDueDate.getMonth() + 1);
        }
        const diffDays = Math.ceil((nextDueDate - today) / (1000 * 60 * 60 * 24));
        if (diffDays <= 7) {
             if (diffDays === 0) return `<div><i class="fa-solid fa-credit-card text-red-500 mr-2"></i><strong>${card.cardName}</strong> son ödeme günü bugün!</div>`;
            return `<div><i class="fa-solid fa-credit-card text-yellow-600 mr-2"></i><strong>${card.cardName}</strong> son ödeme gününe ${diffDays} gün kaldı.</div>`;
        }
        return null;
    }).filter(Boolean);


    const allReminders = [...expenseReminders, ...cardReminders];

    if (allReminders.length > 0) {
        reminderList.innerHTML = allReminders.join('');
        reminderBanner.classList.remove('hidden');
    } else {
        reminderBanner.classList.add('hidden');
    }
}
closeReminderBtn.addEventListener('click', () => reminderBanner.classList.add('hidden'));
toggleChartBtn.addEventListener('click', () => {
    chartCard.classList.toggle('hidden');
});
function updateExpenseChart(transactions) {
    const { startDate, endDate } = getCurrentFinancialCycle(userSettings.paymentDay);
    const cycleTransactions = transactions.filter(tx => { const txDate = tx.createdAt?.toDate(); return txDate && txDate >= startDate && txDate <= endDate; });
    const expenses = cycleTransactions.filter(tx => tx.type === 'expense');
    const categoryTotals = expenses.reduce((acc, tx) => { acc[tx.category] = (acc[tx.category] || 0) + tx.amount; return acc; }, {});
    const labels = Object.keys(categoryTotals);
    const data = Object.values(categoryTotals);
    if (expenseChart) expenseChart.destroy();
    if (labels.length === 0) {
         chartContainer.innerHTML = '<p class="text-center text-slate-500 mt-20">Bu dönem için gider verisi yok.</p>';
         return;
    } else {
         chartContainer.innerHTML = '<canvas id="expenseChart"></canvas>';
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
function getCurrentFinancialCycle(paymentDay) {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const currentDay = today.getDate();
    let startYear, startMonth, endYear, endMonth;
    if (currentDay >= paymentDay) {
        startYear = currentYear;
        startMonth = currentMonth;
    } else {
        startYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        startMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    }
    endYear = startMonth === 11 ? startYear + 1 : startYear;
    endMonth = startMonth === 11 ? 0 : startMonth + 1;
    const startDate = new Date(startYear, startMonth, paymentDay);
    startDate.setHours(0,0,0,0);
    const endDate = new Date(endYear, endMonth, paymentDay - 1);
    endDate.setHours(23, 59, 59, 999);
    return { startDate, endDate };
}
function getPreviousFinancialCycle(paymentDay) {
    const { startDate: currentCycleStartDate } = getCurrentFinancialCycle(paymentDay);
    
    const endDate = new Date(currentCycleStartDate);
    endDate.setDate(endDate.getDate() - 1);
    endDate.setHours(23, 59, 59, 999);

    const startDate = new Date(currentCycleStartDate);
    startDate.setMonth(startDate.getMonth() - 1);
    startDate.setHours(0, 0, 0, 0);

    return { startDate, endDate };
}
function updateSummary() {
    const { startDate, endDate } = getCurrentFinancialCycle(userSettings.paymentDay);
    const cycleTransactions = allTransactions.filter(tx => { const txDate = tx.createdAt?.toDate(); return txDate && txDate >= startDate && txDate <= endDate; });
    const totalIncome = cycleTransactions.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0);
    const totalExpense = cycleTransactions.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0);
    
    document.getElementById('total-income').textContent = `${totalIncome.toFixed(2)} ₺`;
    document.getElementById('total-expense').textContent = `${totalExpense.toFixed(2)} ₺`;
    document.getElementById('balance').textContent = `${userSettings.accountBalance.toFixed(2)} ₺`;
}
function clearUI() {
    [customCategoryList, incomeList, fixedExpenseList, irregularExpenseList, creditPaymentList, budgetList, creditCardList, manualDebtList].forEach(list => { if (list) list.innerHTML = ''; });
    updateSummary();
    if (expenseChart) {
        expenseChart.destroy();
        chartContainer.innerHTML = '<canvas id="expenseChart"></canvas>';
    }
}
historyBtn.addEventListener('click', () => {
    dashboardView.classList.add('hidden');
    historyView.classList.remove('hidden');
    populateHistoryCategoryFilter(); 
    displayPaymentHistory(); 
});
backToDashboardBtn.addEventListener('click', () => {
    historyView.classList.add('hidden');
    dashboardView.classList.remove('hidden');
});
function populateHistoryCategoryFilter() {
    const allExpenseCategories = [...defaultFixedExpenseCategories, ...defaultIrregularExpenseCategories, ...customCategories.map(c => c.name)];
    const uniqueCategories = [...new Set(allExpenseCategories)].sort(); 
    historyCategoryFilter.innerHTML = '<option value="">Tüm Kategoriler</option>';
    uniqueCategories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        historyCategoryFilter.appendChild(option);
    });
}
function displayPaymentHistory() {
    const startDate = historyStartDate.value;
    const endDate = historyEndDate.value;
    const category = historyCategoryFilter.value;
    let filteredTransactions = allTransactions.filter(tx => tx.isPaid || tx.type === 'income');
    if (startDate) { const start = new Date(startDate); start.setHours(0,0,0,0); filteredTransactions = filteredTransactions.filter(tx => tx.createdAt?.toDate() >= start); }
    if (endDate) { const end = new Date(endDate); end.setHours(23,59,59,999); filteredTransactions = filteredTransactions.filter(tx => tx.createdAt?.toDate() <= end); }
    if (category) { filteredTransactions = filteredTransactions.filter(tx => tx.category === category); }
    filteredTransactions.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
    if (filteredTransactions.length === 0) {
        paymentHistoryList.innerHTML = '<p class="text-slate-500">Filtreyle eşleşen bir işlem bulunmuyor.</p>';
    } else {
         paymentHistoryList.innerHTML = filteredTransactions.map(tx => { 
            const isIncome = tx.type === 'income'; 
            const transactionDate = tx.createdAt ? tx.createdAt.toDate().toLocaleDateString('tr-TR') : 'Tarih yok';
            return `<div class="flex justify-between items-center p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50"><div><p class="font-semibold">${tx.description} <span class="text-sm font-normal text-slate-500">(${tx.category})</span></p><p class="text-sm text-slate-500">İşlem Tarihi: ${transactionDate}</p></div><p class="font-bold ${isIncome ? 'text-green-500' : 'text-red-500'}">${isIncome ? '+' : '-'} ${tx.amount.toFixed(2)} ₺</p></div>` 
        }).join('');
    }
    renderHistoryChart(filteredTransactions);
}
[historyStartDate, historyEndDate, historyCategoryFilter].forEach(el => { el.addEventListener('change', displayPaymentHistory); });
clearHistoryFilterBtn.addEventListener('click', () => {
    historyStartDate.value = '';
    historyEndDate.value = '';
    historyCategoryFilter.value = '';
    document.querySelectorAll('.date-filter-btn').forEach(btn => btn.classList.remove('active'));
    displayPaymentHistory();
});
document.querySelectorAll('.date-filter-btn').forEach(button => {
    button.addEventListener('click', (e) => {
        document.querySelectorAll('.date-filter-btn').forEach(btn => btn.classList.remove('active'));
        e.currentTarget.classList.add('active');
        const period = parseInt(e.currentTarget.dataset.period);
        const endDate = new Date();
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - period);
        historyStartDate.value = startDate.toISOString().split('T')[0];
        historyEndDate.value = endDate.toISOString().split('T')[0];
        displayPaymentHistory();
    });
});
function renderHistoryChart(transactions) {
    if (historyChart) {
        historyChart.destroy();
    }

    const monthlyData = transactions.reduce((acc, tx) => {
        if (!tx.createdAt) { return acc; }
        const monthKey = tx.createdAt.toDate().toISOString().slice(0, 7);
        if (!acc[monthKey]) { acc[monthKey] = { income: 0, expense: 0 }; }
        if (tx.type === 'income') { acc[monthKey].income += tx.amount; } 
        else if (tx.isPaid) { acc[monthKey].expense += tx.amount; }
        return acc;
    }, {});

    const sortedMonthKeys = Object.keys(monthlyData).sort();

    if (sortedMonthKeys.length === 0) {
        historyChartContainer.innerHTML = '<p class="text-center text-slate-500 py-10">Grafik için veri bulunmuyor.</p>';
        return;
    } else {
        historyChartContainer.innerHTML = '';
    }

    const incomeData = sortedMonthKeys.map(key => monthlyData[key].income);
    const expenseData = sortedMonthKeys.map(key => monthlyData[key].expense);
    const categories = sortedMonthKeys.map(key => new Date(key + '-02').toLocaleString('tr-TR', { month: 'long', year: 'numeric' }));

    const options = {
        series: [{
            name: 'Gelir',
            data: incomeData
        }, {
            name: 'Gider',
            data: expenseData
        }],
        chart: {
            type: 'bar',
            height: 350,
            toolbar: { show: true, tools: { download: '<i class="fa-solid fa-download text-slate-500"></i>' } }
        },
        plotOptions: { bar: { horizontal: false, columnWidth: '60%', endingShape: 'rounded' }, },
        dataLabels: { enabled: false },
        stroke: { show: true, width: 2, colors: ['transparent'] },
        xaxis: {
            categories: categories,
            labels: { style: { colors: document.documentElement.classList.contains('dark') ? '#9ca3af' : '#4b5563' } }
        },
        yaxis: {
            title: { text: 'Tutar (₺)', style: { color: document.documentElement.classList.contains('dark') ? '#9ca3af' : '#4b5563' } },
            labels: { style: { colors: document.documentElement.classList.contains('dark') ? '#9ca3af' : '#4b5563' }, formatter: (val) => { return val.toFixed(0) + " ₺" } }
        },
        fill: { opacity: 1 },
        tooltip: {
            theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
            y: { formatter: function (val) { return val.toFixed(2) + " ₺" } }
        },
        colors: ['#22c55e', '#ef4444'],
        legend: {
            position: 'top',
            horizontalAlign: 'right',
            labels: { colors: document.documentElement.classList.contains('dark') ? '#9ca3af' : '#4b5563' }
        },
        grid: { borderColor: document.documentElement.classList.contains('dark') ? '#334155' : '#e2e8f0' }
    };

    historyChart = new ApexCharts(historyChartContainer, options);
    historyChart.render();
}
function openDeleteModal(id, type, subId = null) {
    itemToDelete = { id, type, subId };
    const title = document.getElementById('delete-modal-title');
    const text = document.getElementById('delete-modal-text');
    if (type === 'note') { title.textContent = 'Notu Sil'; text.textContent = 'Bu notu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.'; } 
    else if (type === 'budget') { title.textContent = 'Bütçeyi Kaldır'; text.textContent = `Bu kategori için belirlenen bütçeyi kaldırmak istediğinizden emin misiniz? (İşlemleriniz silinmeyecektir.)`; } 
    else if (type === 'creditCard') { title.textContent = 'Kredi Kartını Sil'; text.textContent = 'Bu kartı ve ilişkili tüm harcamaları silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.'; }
    else if (type === 'cardDebt') { title.textContent = 'Kart Harcamasını Sil'; text.textContent = 'Bu harcamayı silmek istediğinizden emin misiniz?'; }
    else if (type === 'manualDebt') { title.textContent = 'Borcu Sil'; text.textContent = 'Bu borcu silmek istediğinizden emin misiniz?'; }
    else { title.textContent = 'İşlemi Sil'; text.textContent = 'Bu işlemi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.'; }
    deleteModal.classList.remove('hidden');
}
function closeDeleteModal() {
    deleteModal.classList.add('hidden');
    itemToDelete = { id: null, type: null, subId: null };
}
cancelDeleteBtn.addEventListener('click', closeDeleteModal);

confirmDeleteBtn.addEventListener('click', async () => {
    if (!currentUserId || !itemToDelete.id) return;
    
    let collectionName;
    let docId = itemToDelete.id;
    let docPath;

    switch(itemToDelete.type) {
        case 'note': collectionName = 'notes'; break;
        case 'transaction': collectionName = 'transactions'; break;
        case 'budget': collectionName = 'budgets'; break;
        case 'creditCard': collectionName = 'creditCards'; break;
        case 'manualDebt': collectionName = 'manualDebts'; break;
        case 'cardDebt': 
            docPath = `artifacts/${appId}/users/${currentUserId}/creditCards/${itemToDelete.id}/debts/${itemToDelete.subId}`;
            break;
        default: return;
    }
    
    if (!docPath) {
        docPath = `artifacts/${appId}/users/${currentUserId}/${collectionName}/${docId}`;
    }

    try {
        if (itemToDelete.type === 'transaction') {
            const transactionToDelete = allTransactions.find(tx => tx.id === itemToDelete.id);
            if (transactionToDelete && transactionToDelete.type === 'expense' && transactionToDelete.isPaid) {
                const newBalance = userSettings.accountBalance + transactionToDelete.amount;
                await updateBalanceInFirestore(newBalance);
                updateBalanceDisplay();
            }
        }

        if (itemToDelete.type === 'creditCard') {
            const debtsQuery = query(collection(db, `artifacts/${appId}/users/${currentUserId}/creditCards/${itemToDelete.id}/debts`));
            const debtSnapshot = await getDocs(debtsQuery);
            const batch = writeBatch(db);
            debtSnapshot.forEach(doc => {
                batch.delete(doc.ref);
            });
            await batch.commit();
        }

        await deleteDoc(doc(db, docPath));

        if (itemToDelete.type === 'note' && activeNoteIdInput.value === itemToDelete.id) {
             activeNoteIdInput.value = '';
             noteTitleInput.value = '';
             if (quill) quill.setText('');
        }
        
        if (itemToDelete.type === 'cardDebt' || itemToDelete.type === 'creditCard') {
            displayCreditCards();
        }

        closeDeleteModal();
    } catch (error) {
        console.error("Silme hatası: ", error);
        showNotification('Öğe silinirken bir hata oluştu.');
        closeDeleteModal();
    }
});

function openEditModal(tx) {
    editForm.reset();
    editForm.id.value = tx.id;
    editForm.type.value = tx.type;
    editForm.description.value = tx.description;
    editForm.amount.value = tx.amount;
    
    const dueDateContainer = document.getElementById('edit-dueDate-container');
    const recurringContainer = document.getElementById('edit-recurring-container');
    const categorySelect = editForm.querySelector('select[name="category"]');

    dueDateContainer.classList.add('hidden');
    recurringContainer.classList.add('hidden');

    const isFixedExpense = defaultFixedExpenseCategories.includes(tx.category);

    if (tx.type === 'income') {
        populateSelect(categorySelect, defaultIncomeCategories);
        dueDateContainer.classList.remove('hidden');
        recurringContainer.classList.remove('hidden');
    } else if (isFixedExpense) {
        populateSelect(categorySelect, defaultFixedExpenseCategories);
        dueDateContainer.classList.remove('hidden');
        recurringContainer.classList.remove('hidden');
    } else { // Irregular expense
        const allIrregular = [...defaultIrregularExpenseCategories, ...customCategories.map(c => c.name)];
        populateSelect(categorySelect, allIrregular);
        dueDateContainer.classList.remove('hidden');
    }
    
    editForm.dueDate.value = tx.dueDate || '';
    editForm.isRecurring.checked = tx.isRecurring || false;
    categorySelect.value = tx.category;
    editModal.classList.remove('hidden');
}
function closeEditModal() { editModal.classList.add('hidden'); }
cancelEditBtn.addEventListener('click', closeEditModal);
editForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitButton = e.target.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    const id = editForm.id.value;
    const category = editForm.category.value;
    const isFixedExpense = defaultFixedExpenseCategories.includes(category);
    
    const updatedData = {
        description: editForm.description.value,
        amount: parseFloat(editForm.amount.value),
        category: category,
        type: defaultIncomeCategories.includes(category) ? 'income' : 'expense',
    };

    if (updatedData.type === 'income' || isFixedExpense) {
        updatedData.dueDate = editForm.dueDate.value;
        updatedData.isRecurring = editForm.isRecurring.checked;
    } else {
        updatedData.dueDate = editForm.dueDate.value;
        updatedData.isRecurring = false;
    }

    try {
        const docPath = `artifacts/${appId}/users/${currentUserId}/transactions/${id}`;
        await updateDoc(doc(db, docPath), updatedData);
        closeEditModal();
    } catch (error) {
        console.error("İşlem güncellenirken hata oluştu:", error);
    } finally {
        submitButton.disabled = false;
    }
});
searchInput.addEventListener('input', displayTransactions);
exportCsvBtn.addEventListener('click', () => {
    const headers = ["Tarih", "Açıklama", "Kategori", "Tip", "Tutar", "Son Odeme", "Ödendi"];
    const rows = allTransactions.map(tx => [ tx.createdAt ? tx.createdAt.toDate().toLocaleDateString('tr-TR') : 'N/A', `"${tx.description.replace(/"/g, '""')}"`, tx.category, tx.type === 'income' ? 'Gelir' : 'Gider', tx.amount, tx.dueDate || '', tx.isPaid ? 'Evet' : 'Hayır' ]);
    let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "finans_raporu.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});
importCsvBtn.addEventListener('click', () => csvFileInput.click());
csvFileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => { processCSV(e.target.result); };
    reader.readAsText(file);
    csvFileInput.value = '';
});
function autoCategorize(description) {
    const desc = description.toLowerCase();
    if (desc.includes('market') || desc.includes('migros') || desc.includes('carrefour') || desc.includes('a101') || desc.includes('bim')) return 'Market';
    if (desc.includes('fatura') || desc.includes('vodafone') || desc.includes('turkcell') || desc.includes('telekom') || desc.includes('elektrik') || desc.includes('enerjisa')) return 'Fatura';
    if (desc.includes('kira')) return 'Kira';
    if (desc.includes('netflix') || desc.includes('spotify') || desc.includes('youtube')) return 'Abonelik';
    if (desc.includes('ulaşım') || desc.includes('akbil') || desc.includes('otobüs')) return 'Ulaşım';
    return 'Diğer Gider';
}
function processCSV(csvText) {
    const lines = csvText.split(/\r\n|\n/).slice(1);
    const allExpenseCategories = [...defaultFixedExpenseCategories, ...defaultIrregularExpenseCategories, ...customCategories.map(c => c.name)];
    parsedCsvData = [];
    lines.forEach(line => {
        const values = line.split(',');
        if (values.length < 3) return;
        const date = values[0];
        const description = values[1].replace(/"/g, '');
        const amount = parseFloat(values[2].replace(',', '.'));
        if (description && !isNaN(amount) && amount < 0) {
            parsedCsvData.push({ date, description, amount: Math.abs(amount), category: autoCategorize(description) });
        }
    });
    renderImportPreview(parsedCsvData, allExpenseCategories);
    importModal.classList.remove('hidden');
}
function renderImportPreview(data, categories) {
    importPreviewList.innerHTML = '';
    data.forEach((item, index) => {
        const row = document.createElement('tr');
        row.className = "text-sm";
        const categoryOptions = categories.map(c => `<option value="${c}" ${c === item.category ? 'selected' : ''}>${c}</option>`).join('');
        row.innerHTML = `<td class="px-4 py-2">${item.date}</td><td class="px-4 py-2">${item.description}</td><td class="px-4 py-2">${item.amount.toFixed(2)} ₺</td><td class="px-4 py-2"><select data-index="${index}" class="import-category-select block w-full px-2 py-1 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm text-sm">${categoryOptions}</select></td>`;
        importPreviewList.appendChild(row);
    });
}
cancelImportBtn.addEventListener('click', () => importModal.classList.add('hidden'));
confirmImportBtn.addEventListener('click', async () => {
    const batch = writeBatch(db);
    const collectionPath = `artifacts/${appId}/users/${currentUserId}/transactions`;
    document.querySelectorAll('.import-category-select').forEach(select => {
        const index = select.dataset.index;
        parsedCsvData[index].category = select.value;
    });
    parsedCsvData.forEach(item => {
        const docRef = doc(collection(db, collectionPath));
        const data = { description: item.description, amount: item.amount, category: item.category, type: 'expense', createdAt: serverTimestamp() };
        batch.set(docRef, data);
    });
    try {
        await batch.commit();
        importModal.classList.add('hidden');
    } catch (error) {
        console.error("Toplu işlem hatası:", error);
    }
});
function loadBudgets() {
    if (!currentUserId) return;
    if (budgetsUnsubscribe) budgetsUnsubscribe();
    const q = query(collection(db, `artifacts/${appId}/users/${currentUserId}/budgets`));
    return new Promise((resolve) => {
        budgetsUnsubscribe = onSnapshot(q, (snapshot) => {
            allBudgets = {};
            snapshot.forEach(doc => { allBudgets[doc.id] = doc.data(); });
            displayBudgets();
            resolve();
        }, error => {
            console.error("Bütçeler yüklenemedi:", error);
            resolve();
        });
    });
}
function displayBudgets() {
    const budgetedCategories = Object.keys(allBudgets).sort();
    const { startDate, endDate } = getCurrentFinancialCycle(userSettings.paymentDay);
    const cycleTransactions = allTransactions.filter(tx => { const txDate = tx.createdAt?.toDate(); return txDate && txDate >= startDate && txDate <= endDate; });
    budgetList.innerHTML = '';
    if (budgetedCategories.length === 0) {
        budgetList.innerHTML = `<p class="text-slate-500 text-sm text-center p-4">Takip edilecek bütçe eklenmedi. Başlamak için '+ Ekle' butonunu kullanın.</p>`;
        return;
    }
    budgetedCategories.forEach(category => {
        const budgetAmount = allBudgets[category]?.amount || 0;
        const spentAmount = cycleTransactions.filter(tx => tx.type === 'expense' && tx.category === category).reduce((sum, tx) => sum + tx.amount, 0);
        let progressBarHTML;
        if (budgetAmount > 0) {
            const percentage = (spentAmount / budgetAmount) * 100;
            let progressBarColor = 'bg-green-500';
            if (percentage > 90) progressBarColor = 'bg-red-500';
            else if (percentage > 70) progressBarColor = 'bg-yellow-500';
            progressBarHTML = `<div class="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5"><div class="${progressBarColor} h-2.5 rounded-full" style="width: ${Math.min(percentage, 100)}%"></div></div>`;
        } else {
            progressBarHTML = `<div class="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 border border-dashed border-slate-300 dark:border-slate-600"></div>`;
        }
        const item = document.createElement('div');
        item.innerHTML = `<div class="flex justify-between items-center mb-1 text-sm"><span class="font-semibold">${category}</span><div class="flex items-center"><span class="text-slate-500 dark:text-slate-400">${spentAmount.toFixed(2)}₺ / ${budgetAmount > 0 ? budgetAmount.toFixed(2) + '₺' : 'Bütçe Yok'}</span><button data-category="${category}" class="edit-budget-btn ml-2 text-slate-400 hover:text-indigo-500"><i class="fa-solid fa-pencil"></i></button><button data-category="${category}" class="delete-budget-btn ml-2 text-slate-400 hover:text-red-500"><i class="fa-solid fa-trash-can"></i></button></div></div>${progressBarHTML}`;
        budgetList.appendChild(item);
    });
    budgetList.querySelectorAll('.edit-budget-btn').forEach(button => {
        button.addEventListener('click', (e) => openBudgetModal(e.currentTarget.dataset.category, 'edit'));
    });
    budgetList.querySelectorAll('.delete-budget-btn').forEach(button => {
        button.addEventListener('click', (e) => openDeleteModal(e.currentTarget.dataset.category, 'budget'));
    });
}
function openBudgetModal(category, mode = 'edit') {
    const title = document.getElementById('budget-modal-title');
    const selectContainer = document.getElementById('budget-category-select-container');
    const labelContainer = document.getElementById('budget-category-label-container');
    const categorySelect = document.getElementById('budget-category-select');
    const hiddenCategoryInput = budgetForm.querySelector('input[name="category"]');
    if (mode === 'add') {
        title.textContent = 'Yeni Bütçe Ekle';
        selectContainer.classList.remove('hidden');
        labelContainer.classList.add('hidden');
        const allExpenseCategories = [...defaultFixedExpenseCategories, ...defaultIrregularExpenseCategories, ...customCategories.map(c => c.name)];
        const unbudgetedCategories = allExpenseCategories.filter(c => !allBudgets[c]);
        populateSelect(categorySelect, unbudgetedCategories);
        budgetForm.amount.value = '';
        hiddenCategoryInput.value = categorySelect.value;
        categorySelect.onchange = () => { hiddenCategoryInput.value = categorySelect.value; };
    } else {
        title.textContent = 'Bütçeyi Düzenle';
        selectContainer.classList.add('hidden');
        labelContainer.classList.remove('hidden');
        hiddenCategoryInput.value = category;
        document.getElementById('budget-category-label').textContent = `${category} için Bütçe`;
        budgetForm.amount.value = allBudgets[category]?.amount || '';
    }
    budgetModal.classList.remove('hidden');
}
addBudgetBtn.addEventListener('click', () => openBudgetModal(null, 'add'));
cancelBudgetBtn.addEventListener('click', () => budgetModal.classList.add('hidden'));
budgetForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const category = budgetForm.querySelector('input[name="category"]').value;
    const amount = parseFloat(budgetForm.amount.value);
    if (!category || isNaN(amount) || amount < 0) {
        showNotification("Lütfen geçerli bir kategori ve tutar girin.");
        return;
    }
    const docPath = `artifacts/${appId}/users/${currentUserId}/budgets/${category}`;
    try {
        await setDoc(doc(db, docPath), { amount });
        budgetModal.classList.add('hidden');
    } catch (error) {
        console.error("Bütçe kaydedilemedi:", error);
        showNotification('Bütçe kaydedilemedi.');
    }
});
function initializeBudgetToggle() {
    const icon = toggleBudgetListBtn.querySelector('i');
    let isHidden = localStorage.getItem('isBudgetHidden') === 'true';
    const setState = (hidden) => {
        isHidden = hidden;
        budgetList.classList.toggle('hidden', isHidden);
        icon.classList.toggle('fa-chevron-up', !isHidden);
        icon.classList.toggle('fa-chevron-down', isHidden);
        localStorage.setItem('isBudgetHidden', isHidden);
    };
    toggleBudgetListBtn.addEventListener('click', () => { setState(!isHidden); });
    setState(isHidden);
}
function initializeQuillEditor() {
    if (quill) return;
    const toolbarOptions = [ [{ 'header': [1, 2, 3, false] }], ['bold', 'italic', 'underline'], [{ 'list': 'ordered'}, { 'list': 'bullet' }], ['clean'] ];
    quill = new Quill('#note-editor', { modules: { toolbar: toolbarOptions }, theme: 'snow', placeholder: 'Notlarınızı buraya yazın...' });
    quill.on('text-change', (delta, oldDelta, source) => { if (source === 'user') { saveActiveNote(); } });
}
notepadBtn.addEventListener('click', () => notepadModal.classList.remove('hidden'));
closeNotepadBtn.addEventListener('click', () => notepadModal.classList.add('hidden'));
function loadNotes() {
    if (!currentUserId) return;
    if (notesUnsubscribe) notesUnsubscribe();
    const q = query(collection(db, `artifacts/${appId}/users/${currentUserId}/notes`), orderBy("updatedAt", "desc"));
    return new Promise((resolve) => {
        notesUnsubscribe = onSnapshot(q, (snapshot) => {
            allNotes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            displayNotesList();
            const currentActiveId = activeNoteIdInput.value;
            const activeNoteExists = allNotes.some(note => note.id === currentActiveId);
            if (!activeNoteExists && allNotes.length > 0) {
                selectNote(allNotes[0].id);
            } else if (allNotes.length === 0) {
                activeNoteIdInput.value = '';
                noteTitleInput.value = '';
                if(quill) quill.setContents([]);
            }
            resolve();
        }, (error) => {
            console.error("Notlar yüklenemedi:", error);
            resolve();
        });
    });
}
function getTextFromDelta(deltaString) {
    if (!deltaString) return 'İçerik yok';
    try {
        const delta = JSON.parse(deltaString);
        const text = delta.ops.map(op => op.insert).join('').trim();
        if (!text) return 'İçerik yok';
        return text.substring(0, 30) + (text.length > 30 ? '...' : '');
    } catch (e) {
        return deltaString.substring(0, 30) + (deltaString.length > 30 ? '...' : '');
    }
}
function displayNotesList() {
    notesList.innerHTML = '';
    if (allNotes.length === 0) {
        notesList.innerHTML = '<p class="text-center text-sm text-slate-500 p-4">Henüz not oluşturulmadı.</p>';
        return;
    }
    allNotes.forEach(note => {
        const item = document.createElement('div');
        item.className = `note-list-item p-3 rounded-md cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 flex justify-between items-start`;
        item.dataset.id = note.id;
        const isActive = note.id === activeNoteIdInput.value;
        if (isActive) item.classList.add('active');
        item.innerHTML = `<div class="truncate flex-grow"><p class="font-semibold truncate">${note.title || 'Başlıksız Not'}</p><p class="text-xs text-slate-500 dark:text-slate-400 truncate">${getTextFromDelta(note.content)}</p></div><button data-id="${note.id}" class="delete-note-btn text-slate-400 hover:text-red-500 text-xs flex-shrink-0 ml-2 p-1"><i class="fa-solid fa-trash-can"></i></button>`;
        notesList.appendChild(item);
    });
    notesList.querySelectorAll('.note-list-item').forEach(item => {
        item.addEventListener('click', (e) => {
            if (e.target.closest('.delete-note-btn')) return;
            selectNote(item.dataset.id);
        });
    });
    notesList.querySelectorAll('.delete-note-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            openDeleteModal(e.currentTarget.dataset.id, 'note');
        });
    });
}
function selectNote(noteId) {
    if (!quill) return;
    const note = allNotes.find(n => n.id === noteId);
    if (!note) return;
    activeNoteIdInput.value = note.id;
    noteTitleInput.value = note.title || '';
    try {
        const delta = JSON.parse(note.content);
        quill.setContents(delta);
    } catch(e) {
        quill.setText(note.content || '');
    }
    document.querySelectorAll('.note-list-item').forEach(item => {
        item.classList.toggle('active', item.dataset.id === noteId);
    });
}
newNoteBtn.addEventListener('click', async () => {
    if (!currentUserId) return;
    try {
        const newNoteRef = await addDoc(collection(db, `artifacts/${appId}/users/${currentUserId}/notes`), {
            title: 'Yeni Not',
            content: JSON.stringify({ ops: [] }),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        selectNote(newNoteRef.id);
    } catch (error) {
        console.error("Yeni not oluşturulamadı:", error);
    }
});
const saveActiveNote = () => {
    clearTimeout(noteSaveTimeout);
    notepadStatus.textContent = 'Değişiklikler algılandı...';
    noteSaveTimeout = setTimeout(async () => {
        const noteId = activeNoteIdInput.value;
        if (!noteId || !currentUserId || !quill) return;
        notepadStatus.textContent = 'Kaydediliyor...';
        const data = {
            title: noteTitleInput.value,
            content: JSON.stringify(quill.getContents()),
            updatedAt: serverTimestamp()
        };
        try {
            const docRef = doc(db, `artifacts/${appId}/users/${currentUserId}/notes/${noteId}`);
            await updateDoc(docRef, data);
            notepadStatus.textContent = 'Kaydedildi.';
        } catch (error) {
            notepadStatus.textContent = 'Kaydedilemedi.';
            console.error("Not kaydedilemedi:", error);
        }
    }, 1500);
};
noteTitleInput.addEventListener('keyup', saveActiveNote);
function getFriendlyAuthError(c) { 
    switch(c){
        case 'auth/invalid-email': return 'Geçersiz e-posta adresi.';
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential': return 'E-posta veya şifre hatalı.';
        case 'auth/email-already-in-use': return 'Bu e-posta adresi zaten kullanılıyor.';
        case 'auth/weak-password': return 'Şifre en az 6 karakter olmalıdır.';
        default: return 'Bilinmeyen bir hata oluştu. Lütfen tekrar deneyin.';
    }
}
loginTabButton.addEventListener('click', () => {
    loginForm.classList.remove('hidden'); registerForm.classList.add('hidden');
    loginTabButton.classList.add('text-indigo-600', 'dark:text-indigo-400', 'border-indigo-600', 'dark:border-indigo-400'); loginTabButton.classList.remove('text-slate-500');
    registerTabButton.classList.add('text-slate-500'); registerTabButton.classList.remove('text-indigo-600', 'dark:text-indigo-400', 'border-indigo-600', 'dark:border-indigo-400');
});
registerTabButton.addEventListener('click', () => {
    registerForm.classList.remove('hidden'); loginForm.classList.add('hidden');
    registerTabButton.classList.add('text-indigo-600', 'dark:text-indigo-400', 'border-indigo-600', 'dark:border-indigo-400'); registerTabButton.classList.remove('text-slate-500');
    loginTabButton.classList.add('text-slate-500'); loginTabButton.classList.remove('text-indigo-600', 'dark:text-indigo-400', 'border-indigo-600', 'dark:border-indigo-400');
});
const handleAuthSubmit = async (e, authFunction) => {
    e.preventDefault();
    const form = e.target;
    const button = form.querySelector('button[type="submit"]');
    const email = form.querySelector('input[type="email"]').value;
    const password = form.querySelector('input[type="password"]').value;
    button.disabled = true;
    authError.textContent = '';
    try {
        await authFunction(auth, email, password);
        form.reset();
    } catch (error) {
        authError.textContent = getFriendlyAuthError(error.code);
    } finally {
        button.disabled = false;
    }
};
registerForm.addEventListener('submit', (e) => handleAuthSubmit(e, createUserWithEmailAndPassword));
loginForm.addEventListener('submit', (e) => handleAuthSubmit(e, signInWithEmailAndPassword));
logoutButton.addEventListener('click', () => signOut(auth));

// --- GEMINI DESTEKLİ ÖZELLİKLER ---
aiCategorizeBtn.addEventListener('click', async () => {
    if (parsedCsvData.length === 0) {
        showNotification('Önce bir CSV dosyası seçin.');
        return;
    }

    toggleLoading(true);
    const allExpenseCategories = [...defaultFixedExpenseCategories, ...defaultIrregularExpenseCategories, ...customCategories.map(c => c.name)];
    const categoryListString = allExpenseCategories.join(', ');

    const promises = parsedCsvData.map(async (item, index) => {
        const prompt = `Bir harcama açıklaması için şu kategorilerden en uygun olanı seç: ${categoryListString}. Sadece tek bir kategori adı döndür. Açıklama: "${item.description}"`;
        const suggestedCategory = await callGemini(prompt);
        
        if (suggestedCategory && allExpenseCategories.includes(suggestedCategory.trim())) {
            const selectElement = document.querySelector(`.import-category-select[data-index="${index}"]`);
            if (selectElement) {
                selectElement.value = suggestedCategory.trim();
            }
        }
    });

    await Promise.all(promises);
    toggleLoading(false);
    showNotification('Kategorizasyon tamamlandı.', 'success');
});

aiBudgetSuggestionBtn.addEventListener('click', async () => {
    toggleLoading(true);
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const recentExpenses = allTransactions.filter(tx => 
        tx.type === 'expense' && 
        tx.createdAt && 
        tx.createdAt.toDate() > threeMonthsAgo
    );

    if (recentExpenses.length < 10) {
        toggleLoading(false);
        showNotification('Yeterli harcama verisi bulunamadı. Öneri için en az 10 harcama gereklidir.');
        return;
    }

    const spendingSummary = recentExpenses.reduce((acc, tx) => {
        acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
        return acc;
    }, {});

    const summaryText = Object.entries(spendingSummary)
        .map(([category, total]) => `${category}: Aylık ortalama ${(total / 3).toFixed(2)} ₺`)
        .join('\n');

    const prompt = `Sen bir kişisel finans danışmanısın. Bir kullanıcının son 3 aylık harcama verilerinin özeti aşağıdadır:\n\n${summaryText}\n\nBu bilgilere dayanarak, her kategori için mantıklı ve ulaşılabilir aylık bütçe hedefleri öner. Önerilerini madde madde ve kısa, teşvik edici açıklamalarla sun. Cevabını HTML formatında, her madde için bir <p> etiketi kullanarak oluştur.`;

    const suggestion = await callGemini(prompt);
    toggleLoading(false);

    if (suggestion) {
        aiBudgetSuggestionContent.innerHTML = suggestion;
        aiBudgetSuggestionModal.classList.remove('hidden');
    } else {
        showNotification('Bütçe önerileri alınamadı. Lütfen tekrar deneyin.');
    }
});

closeAiBudgetSuggestionBtn.addEventListener('click', () => {
    aiBudgetSuggestionModal.classList.add('hidden');
});

// --- ÖDEMELER SAYFASI FONKSİYONLARI ---
function loadCreditCards() {
    if (!currentUserId) return;
    if (creditCardsUnsubscribe) creditCardsUnsubscribe();
    const q = query(collection(db, `artifacts/${appId}/users/${currentUserId}/creditCards`), orderBy("cardName"));
    return new Promise((resolve) => {
        creditCardsUnsubscribe = onSnapshot(q, async (snapshot) => {
            allCreditCards = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            await displayCreditCards();
            checkReminders();
            resolve();
        }, error => {
            console.error("Kredi kartları yüklenemedi:", error);
            resolve();
        });
    });
}

async function displayCreditCards() {
    creditCardList.innerHTML = '';
    if (allCreditCards.length === 0) {
        creditCardList.innerHTML = '<p class="text-slate-500 text-sm text-center p-4">Henüz kredi kartı eklenmedi.</p>';
        totalCardDebtEl.textContent = `0.00 ₺`;
        totalMinimumPaymentEl.textContent = `0.00 ₺`;
        return;
    }

    let totalDebt = 0;
    let totalMinimum = 0;

    for (const card of allCreditCards) {
        const debtsQuery = query(collection(db, `artifacts/${appId}/users/${currentUserId}/creditCards/${card.id}/debts`));
        const debtSnapshot = await getDocs(debtsQuery);
        const currentDebt = debtSnapshot.docs.reduce((sum, doc) => sum + doc.data().amount, 0);
        totalDebt += currentDebt;
        totalMinimum += currentDebt * 0.20;
        
        const availableLimit = card.limit - currentDebt;
        const cardThemeClasses = getCardThemeClasses(card.cardTheme);

        const cardEl = document.createElement('div');
        cardEl.className = `p-5 rounded-xl shadow-lg text-white font-mono flex flex-col justify-between h-52 relative overflow-hidden transition-transform transform hover:scale-105`;
        cardEl.innerHTML = `
            <div class="absolute inset-0 ${cardThemeClasses} opacity-80"></div>
            <div class="relative z-10 flex justify-between items-start">
                <span class="font-bold text-xl">${card.cardName}</span>
                <div class="h-8 flex items-center">${getBankLogo(card.bankName)}</div>
            </div>
            <div class="relative z-10">
                <div class="mb-2">
                    <p class="text-sm text-slate-300">Güncel Borç</p>
                    <p class="text-2xl font-bold tracking-wider">${currentDebt.toFixed(2)} ₺</p>
                </div>
                <div class="flex justify-between items-end text-sm">
                    <div>
                        <p class="text-slate-400">Kullanılabilir Limit</p>
                        <p class="font-semibold">${availableLimit.toFixed(2)} ₺</p>
                    </div>
                    <div class="text-right">
                        <p class="text-slate-400">Ekstre: ${card.statementDay}'i | Son Ödeme: ${card.paymentDueDay}'i</p>
                    </div>
                </div>
            </div>
             <div class="absolute top-3 right-3 z-20 flex gap-2">
                <button data-id="${card.id}" class="edit-card-btn text-slate-300 hover:text-white text-xs"><i class="fa-solid fa-pencil"></i></button>
                <button data-id="${card.id}" class="delete-card-btn text-slate-300 hover:text-white text-xs"><i class="fa-solid fa-trash-can"></i></button>
            </div>
        `;
        cardEl.addEventListener('click', (e) => {
            if (e.target.closest('.delete-card-btn') || e.target.closest('.edit-card-btn')) {
                return;
            }
            openCardDetailsModal(card.id)
        });
        creditCardList.appendChild(cardEl);
    }
    totalCardDebtEl.textContent = `${totalDebt.toFixed(2)} ₺`;
    totalMinimumPaymentEl.textContent = `${totalMinimum.toFixed(2)} ₺`;

    creditCardList.querySelectorAll('.delete-card-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            openDeleteModal(e.currentTarget.dataset.id, 'creditCard');
        });
    });
    creditCardList.querySelectorAll('.edit-card-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const card = allCreditCards.find(c => c.id === e.currentTarget.dataset.id);
            if (card) openEditCardModal(card);
        });
    });
}

function openEditCardModal(card) {
    creditCardForm.reset();
    document.getElementById('credit-card-modal-title').textContent = 'Kredi Kartını Düzenle';
    creditCardForm.cardId.value = card.id;
    creditCardForm.cardName.value = card.cardName;
    creditCardForm.bankName.value = card.bankName;
    creditCardForm.limit.value = card.limit;
    creditCardForm.statementDay.value = card.statementDay;
    creditCardForm.paymentDueDay.value = card.paymentDueDay;
    
    const themeRadio = creditCardForm.querySelector(`input[name="cardTheme"][value="${card.cardTheme}"]`);
    if(themeRadio) themeRadio.checked = true;
    
    cardThemeSelector.dispatchEvent(new Event('change', {bubbles:true}));
    creditCardModal.classList.remove('hidden');
}

addCreditCardBtn.addEventListener('click', () => {
    creditCardForm.reset();
    creditCardForm.cardId.value = '';
    document.getElementById('credit-card-modal-title').textContent = 'Yeni Kredi Kartı Ekle';
    creditCardModal.classList.remove('hidden');
});

cancelCreditCardBtn.addEventListener('click', () => {
    creditCardModal.classList.add('hidden');
});

cardThemeSelector.addEventListener('change', (e) => {
    if (e.target.name === 'cardTheme') {
        cardThemeSelector.querySelectorAll('span').forEach(span => {
            span.classList.remove('ring-2', 'ring-offset-2', 'ring-indigo-500', 'dark:ring-offset-slate-800');
        });
        e.target.nextElementSibling.classList.add('ring-2', 'ring-offset-2', 'ring-indigo-500', 'dark:ring-offset-slate-800');
    }
});

creditCardForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const cardId = e.target.cardId.value;
    const cardData = {
        cardName: e.target.cardName.value,
        bankName: e.target.bankName.value,
        cardTheme: e.target.cardTheme.value,
        limit: parseFloat(e.target.limit.value),
        statementDay: parseInt(e.target.statementDay.value),
        paymentDueDay: parseInt(e.target.paymentDueDay.value),
    };

    if (!cardData.cardName || isNaN(cardData.limit) || isNaN(cardData.statementDay) || isNaN(cardData.paymentDueDay)) {
        showNotification('Lütfen tüm alanları doğru doldurun.');
        return;
    }

    try {
        if (cardId) {
            const docRef = doc(db, `artifacts/${appId}/users/${currentUserId}/creditCards`, cardId);
            await updateDoc(docRef, cardData);
        } else {
            await addDoc(collection(db, `artifacts/${appId}/users/${currentUserId}/creditCards`), cardData);
        }
        creditCardModal.classList.add('hidden');
    } catch (error) {
        console.error("Kredi kartı kaydedilemedi:", error);
        showNotification('Kredi kartı kaydedilemedi.');
    }
});

async function openCardDetailsModal(cardId) {
    const card = allCreditCards.find(c => c.id === cardId);
    if (!card) return;

    document.getElementById('card-details-title').textContent = `${card.cardName} Detayları`;
    cardDebtForm.cardId.value = cardId;

    const allExpenseCategories = [...defaultIrregularExpenseCategories, ...customCategories.map(c => c.name)];
    populateSelect(cardDebtForm.debtCategory, allExpenseCategories);

    if (cardDebtsUnsubscribe) cardDebtsUnsubscribe();
    
    const q = query(collection(db, `artifacts/${appId}/users/${currentUserId}/creditCards/${cardId}/debts`), orderBy("createdAt", "desc"));
    cardDebtsUnsubscribe = onSnapshot(q, (snapshot) => {
        currentCardDebts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        displayCardDebts(card);
    });

    displayCardPaymentHistory(cardId);
    cardDetailsModal.classList.remove('hidden');
}

function displayCardDebts(card) {
    cardDebtList.innerHTML = '';
    let statementDebt = 0;
    
    if (currentCardDebts.length > 0) {
        currentCardDebts.forEach(debt => {
            statementDebt += debt.amount;
            const debtEl = document.createElement('div');
            debtEl.className = 'flex justify-between items-center text-sm p-2 rounded-md bg-slate-100 dark:bg-slate-700/50';
            const debtDate = debt.createdAt ? debt.createdAt.toDate().toLocaleDateString('tr-TR') : 'Tarih bekleniyor...';
            debtEl.innerHTML = `
                <div>
                    <p>${debt.description} <span class="text-xs text-slate-500">(${debt.category})</span></p>
                    <p class="text-xs text-slate-500">${debtDate}</p>
                </div>
                <div class="flex items-center">
                    <p class="font-semibold mr-4">${debt.amount.toFixed(2)} ₺</p>
                    <button data-card-id="${card.id}" data-debt-id="${debt.id}" class="delete-card-debt-btn text-slate-400 hover:text-red-500 text-xs"><i class="fa-solid fa-trash-can"></i></button>
                </div>
            `;
            cardDebtList.appendChild(debtEl);
        });
    } else {
         cardDebtList.innerHTML = '<p class="text-slate-500 text-sm text-center p-2">Bu dönem için harcama yok.</p>';
    }

    renderCardDebtChart(currentCardDebts);

    const minimumPayment = statementDebt * 0.20;
    document.getElementById('card-statement-debt').textContent = `${statementDebt.toFixed(2)} ₺`;
    document.getElementById('card-minimum-payment').textContent = `${minimumPayment.toFixed(2)} ₺`;
    
    payStatementDebtBtn.dataset.amount = statementDebt;
    payStatementDebtBtn.dataset.cardName = card.cardName;
    payStatementDebtBtn.disabled = statementDebt <= 0;

    payMinimumDebtBtn.dataset.amount = minimumPayment;
    payMinimumDebtBtn.dataset.cardName = card.cardName;
    payMinimumDebtBtn.disabled = minimumPayment <= 0;

    cardDebtList.querySelectorAll('.delete-card-debt-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const cardId = e.currentTarget.dataset.cardId;
            const debtId = e.currentTarget.dataset.debtId;
            openDeleteModal(cardId, 'cardDebt', debtId);
        });
    });
}

async function displayCardPaymentHistory(cardId) {
    cardPaymentHistoryList.innerHTML = '';
    const historyRef = collection(db, `artifacts/${appId}/users/${currentUserId}/creditCards/${cardId}/paymentHistory`);
    const historyQuery = query(historyRef, orderBy("paidAt", "desc"));
    const historySnapshot = await getDocs(historyQuery);

    if (historySnapshot.empty) {
        cardPaymentHistoryList.innerHTML = '<p class="text-slate-500 text-sm text-center p-2">Ödeme geçmişi bulunmuyor.</p>';
        return;
    }

    historySnapshot.forEach(doc => {
        const historyData = doc.data();
        const paidDate = historyData.paidAt ? historyData.paidAt.toDate().toLocaleDateString('tr-TR') : 'Bilinmiyor';
        const historyEl = document.createElement('div');
        historyEl.className = 'flex justify-between items-center p-2 rounded-md bg-slate-50 dark:bg-slate-700/30 opacity-70';
        historyEl.innerHTML = `
            <div>
                <p>${historyData.description} ${historyData.isPartial ? `<span class="text-xs text-orange-500">(Kısmi)</span>` : ''}</p>
                <p class="text-xs text-slate-500">Ödenme Tarihi: ${paidDate}</p>
            </div>
            <p class="font-semibold text-green-500">+${historyData.amount.toFixed(2)} ₺</p>
        `;
        cardPaymentHistoryList.appendChild(historyEl);
    });
}

closeCardDetailsBtn.addEventListener('click', () => {
    cardDetailsModal.classList.add('hidden');
    if (cardDebtsUnsubscribe) cardDebtsUnsubscribe();
    currentCardDebts = [];
    if (cardDebtChart) {
        cardDebtChart.destroy();
        cardDebtChart = null;
    }
});

cardDebtForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const cardId = e.target.cardId.value;
    const debtData = {
        description: e.target.debtDescription.value,
        amount: parseFloat(e.target.debtAmount.value),
        category: e.target.debtCategory.value,
        createdAt: serverTimestamp()
    };

    if (!debtData.description || isNaN(debtData.amount) || debtData.amount <= 0 || !debtData.category) {
        showNotification('Lütfen tüm alanları doğru doldurun.');
        return;
    }

    try {
        await addDoc(collection(db, `artifacts/${appId}/users/${currentUserId}/creditCards/${cardId}/debts`), debtData);
        cardDebtForm.reset();
        cardDebtForm.cardId.value = cardId;
        displayCreditCards();
    } catch (error) {
        console.error("Kart harcaması eklenemedi:", error);
        showNotification('Harcama eklenemedi.');
    }
});

async function payCardDebt(cardName, paymentAmount, cardId) {
    if (isNaN(paymentAmount) || paymentAmount <= 0) return;
    toggleLoading(true);
    try {
        const newTransaction = {
            description: `${cardName} Kredi Kartı Ödemesi`,
            amount: paymentAmount,
            category: 'Kredi',
            type: 'expense',
            isPaid: true,
            createdAt: serverTimestamp()
        };
        await addDoc(collection(db, `artifacts/${appId}/users/${currentUserId}/transactions`), newTransaction);
        const newBalance = userSettings.accountBalance - paymentAmount;
        await updateBalanceInFirestore(newBalance);
        updateBalanceDisplay();

        const debtsRef = collection(db, `artifacts/${appId}/users/${currentUserId}/creditCards/${cardId}/debts`);
        const debtsQuery = query(debtsRef, orderBy("createdAt", "asc"));
        const debtSnapshot = await getDocs(debtsQuery);
        let remainingPayment = paymentAmount;
        const batch = writeBatch(db);
        const historyRef = collection(db, `artifacts/${appId}/users/${currentUserId}/creditCards/${cardId}/paymentHistory`);

        for (const debtDoc of debtSnapshot.docs) {
            if (remainingPayment <= 0) break;
            const debtData = debtDoc.data();
            const debtAmount = debtData.amount;
            if (remainingPayment >= debtAmount) {
                batch.delete(debtDoc.ref);
                const newHistoryDocRef = doc(historyRef);
                batch.set(newHistoryDocRef, { ...debtData, paidAt: serverTimestamp() });
                remainingPayment -= debtAmount;
            } else {
                const newDebtAmount = debtAmount - remainingPayment;
                batch.update(debtDoc.ref, { amount: newDebtAmount });
                const newHistoryDocRef = doc(historyRef);
                batch.set(newHistoryDocRef, { ...debtData, amount: remainingPayment, paidAt: serverTimestamp(), isPartial: true });
                remainingPayment = 0;
            }
        }
        await batch.commit();
        showNotification(`${paymentAmount.toFixed(2)} ₺ ödeme yapıldı, borçlar güncellendi.`, 'success');
        cardDetailsModal.classList.add('hidden');
        displayCreditCards();
    } catch (error) {
        console.error("Kart ödemesi oluşturulamadı:", error);
        showNotification("Ödeme işlemi oluşturulurken bir hata oluştu.");
    } finally {
        toggleLoading(false);
    }
}

payStatementDebtBtn.addEventListener('click', (e) => {
    const amount = parseFloat(e.currentTarget.dataset.amount);
    const cardName = e.currentTarget.dataset.cardName;
    const cardId = cardDebtForm.cardId.value;
    payCardDebt(cardName, amount, cardId);
});

payMinimumDebtBtn.addEventListener('click', (e) => {
    const amount = parseFloat(e.currentTarget.dataset.amount);
    const cardName = e.currentTarget.dataset.cardName;
    const cardId = cardDebtForm.cardId.value;
    payCardDebt(cardName, amount, cardId);
});


// Elden Borç Yönetimi
function loadManualDebts() {
    if (!currentUserId) return;
    if (manualDebtsUnsubscribe) manualDebtsUnsubscribe();
    const q = query(collection(db, `artifacts/${appId}/users/${currentUserId}/manualDebts`), orderBy("createdAt", "desc"));
    return new Promise((resolve) => {
        manualDebtsUnsubscribe = onSnapshot(q, (snapshot) => {
            allManualDebts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            displayManualDebts();
            resolve();
        }, error => {
            console.error("Diğer borçlar yüklenemedi:", error);
            resolve();
        });
    });
}

function displayManualDebts() {
    manualDebtList.innerHTML = '';
    let totalDebt = 0;
    if (allManualDebts.length === 0) {
        manualDebtList.innerHTML = '<p class="text-slate-500 text-sm text-center p-2">Takip edilen borç yok.</p>';
    } else {
        allManualDebts.forEach(debt => {
            totalDebt += debt.amount;
            const debtEl = document.createElement('div');
            debtEl.className = 'flex justify-between items-center text-sm p-2 rounded-md bg-slate-100 dark:bg-slate-700/50';
            debtEl.innerHTML = `
                <p>${debt.description}</p>
                <div class="flex items-center gap-4">
                    <p class="font-semibold">${debt.amount.toFixed(2)} ₺</p>
                    <button data-id="${debt.id}" class="close-manual-debt-btn text-green-500 hover:text-green-600" title="Borcu Kapat"><i class="fa-solid fa-check-circle"></i></button>
                    <button data-id="${debt.id}" class="delete-manual-debt-btn text-slate-400 hover:text-red-500"><i class="fa-solid fa-trash-can"></i></button>
                </div>
            `;
            manualDebtList.appendChild(debtEl);
        });
    }
    totalManualDebtEl.textContent = `${totalDebt.toFixed(2)} ₺`;

    manualDebtList.querySelectorAll('.delete-manual-debt-btn').forEach(btn => {
        btn.addEventListener('click', e => {
            openDeleteModal(e.currentTarget.dataset.id, 'manualDebt');
        });
    });
    manualDebtList.querySelectorAll('.close-manual-debt-btn').forEach(btn => {
        btn.addEventListener('click', e => {
            payManualDebt(e.currentTarget.dataset.id);
        });
    });
}

async function payManualDebt(debtId) {
    const debt = allManualDebts.find(d => d.id === debtId);
    if (!debt) return;

    toggleLoading(true);
    try {
        const newTransaction = {
            description: `${debt.description} borcu kapatıldı`,
            amount: debt.amount,
            category: 'Diğer Gider',
            type: 'expense',
            isPaid: true,
            createdAt: serverTimestamp()
        };
        await addDoc(collection(db, `artifacts/${appId}/users/${currentUserId}/transactions`), newTransaction);
        
        const newBalance = userSettings.accountBalance - debt.amount;
        await updateBalanceInFirestore(newBalance);
        updateBalanceDisplay();

        await deleteDoc(doc(db, `artifacts/${appId}/users/${currentUserId}/manualDebts`, debtId));

        showNotification('Borç kapatıldı ve gider olarak eklendi.', 'success');
    } catch(error) {
        console.error("Borç kapatılamadı:", error);
        showNotification("Borç kapatılırken bir hata oluştu.");
    } finally {
        toggleLoading(false);
    }
}

manualDebtForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const debtData = {
        description: e.target.debtDescription.value,
        amount: parseFloat(e.target.debtAmount.value),
        createdAt: serverTimestamp()
    };
    if (!debtData.description || isNaN(debtData.amount) || debtData.amount <= 0) {
        showNotification('Lütfen geçerli bir açıklama ve tutar girin.');
        return;
    }
    try {
        await addDoc(collection(db, `artifacts/${appId}/users/${currentUserId}/manualDebts`), debtData);
        manualDebtForm.reset();
    } catch (error) {
        console.error("Borç eklenemedi:", error);
        showNotification('Borç eklenemedi.');
    }
});

// Kart Görseli Yardımcı Fonksiyonları
function getCardThemeClasses(theme) {
    switch (theme) {
        case 'blue': return 'bg-gradient-to-br from-blue-500 to-blue-800';
        case 'green': return 'bg-gradient-to-br from-green-500 to-green-800';
        case 'purple': return 'bg-gradient-to-br from-purple-500 to-purple-800';
        default: return 'bg-gradient-to-br from-slate-700 to-slate-900';
    }
}
function getBankLogo(bankName) {
    const name = bankName.toLowerCase();
    const logoClass = "h-8 opacity-90";
    // Not: Bu yolların projenizde geçerli olduğundan emin olun.
    // Vercel'e deploy ederken bu resim dosyalarını da yüklemeniz gerekir.
    switch(name) {
        case 'garanti': return `<img src="https://placehold.co/100x40/ffffff/000000?text=Garanti" class="${logoClass}" alt="Garanti Logo">`;
        case 'akbank': return `<img src="https://placehold.co/100x40/ffffff/000000?text=Akbank" class="${logoClass}" alt="Akbank Logo">`;
        case 'iş bankası': return `<img src="https://placehold.co/100x40/ffffff/000000?text=İş+Bankası" class="${logoClass}" alt="İş Bankası Logo">`;
        case 'yapı kredi': return `<img src="https://placehold.co/100x40/ffffff/000000?text=Yapı+Kredi" class="${logoClass}" alt="Yapı Kredi Logo">`;
        case 'qnb finansbank': return `<img src="https://placehold.co/100x40/ffffff/000000?text=QNB" class="${logoClass}" alt="QNB Finansbank Logo">`;
        case 'halkbank': return `<img src="https://placehold.co/100x40/ffffff/000000?text=Halkbank" class="${logoClass}" alt="Halkbank Logo">`;
        case 'vakıfbank': return `<img src="https://placehold.co/100x40/ffffff/000000?text=Vakıfbank" class="${logoClass}" alt="Vakıfbank Logo">`;
        case 'ziraat bankası': return `<img src="https://placehold.co/100x40/ffffff/000000?text=Ziraat" class="${logoClass}" alt="Ziraat Bankası Logo">`;
        case 'denizbank': return `<img src="https://placehold.co/100x40/ffffff/000000?text=Denizbank" class="${logoClass}" alt="Denizbank Logo">`;
        case 'ing': return `<img src="https://placehold.co/100x40/ffffff/000000?text=ING" class="${logoClass}" alt="ING Logo">`;
        default: return '<i class="fa-solid fa-credit-card text-3xl opacity-50"></i>';
    }
}

// Kart Harcama Grafiği
function renderCardDebtChart(debts) {
    if (cardDebtChart) {
        cardDebtChart.destroy();
    }

    const categoryTotals = debts.reduce((acc, debt) => {
        acc[debt.category] = (acc[debt.category] || 0) + debt.amount;
        return acc;
    }, {});

    const labels = Object.keys(categoryTotals);
    const data = Object.values(categoryTotals);

    if (labels.length === 0) {
        cardDebtChartContainer.innerHTML = '<p class="text-center text-slate-500 mt-16">Grafik için harcama verisi yok.</p>';
        return;
    } else {
        cardDebtChartContainer.innerHTML = '<canvas id="cardDebtChart"></canvas>';
    }
    
    const canvas = document.getElementById('cardDebtChart');
    if (canvas) {
        cardDebtChart = new Chart(canvas.getContext('2d'), {
            type: 'doughnut',
            data: { 
                labels, 
                datasets: [{ 
                    data, 
                    backgroundColor: ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7'], 
                    borderColor: document.documentElement.classList.contains('dark') ? '#1e293b' : '#ffffff', 
                    borderWidth: 2 
                }] 
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false, 
                plugins: { 
                    legend: { 
                        display: false 
                    } 
                } 
            }
        });
    }
}
