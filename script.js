// Firebase SDK'larını içe aktar
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, addDoc, query, onSnapshot, doc, deleteDoc, updateDoc, serverTimestamp, orderBy, writeBatch, getDoc, setDoc, getDocs, runTransaction } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- GÜVENLİK NOTU ---
// Firebase yapılandırma bilgileri Vercel gibi bir platformda
// Ortam Değişkenleri (Environment Variables) olarak saklanmalıdır.
// Aşağıdaki yapı, bu değişkenlerin var olduğunu varsayar.
// Gerçek anahtarlarınızı doğrudan koda YAZMAYIN!
const firebaseConfig = {
    apiKey: "YOUR_API_KEY", // Vercel'de VITE_API_KEY olarak ekleyin
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Firebase'i başlat
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- DOM ELEMENTLERİ ---
// ... (Önceki versiyondaki tüm DOM elementleri burada)
// YENİ EKLENENLER:
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
// ... (Önceki versiyondaki tüm state değişkenleri burada)
// YENİ EKLENENLER:
let allGoals = [];
let goalsUnsubscribe = null;
let cashFlowChart = null;
let treemapChart = null;

// --- SAYFA NAVİGASYONU (GÜNCELLENDİ) ---
function navigateTo(pageId) {
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
        bottomNavLinks.forEach(link => link.classList.remove('active', 'text-indigo-600', 'dark:text-indigo-400'));
        bottomNavLinks.forEach(link => link.classList.add('text-slate-500'));
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

// --- VERİ YÜKLEME (GÜNCELLENDİ) ---
async function loadAllData() {
    await Promise.all([
        loadSettings(),
        loadCategories(),
        loadBudgets(),
        loadNotes(),
        loadCreditCards(),
        loadManualDebts(),
        loadGoals() // Yeni
    ]);
    await loadTransactions(); // Bu diğerlerinden sonra yüklenmeli
    initializeBudgetToggle();
}

// --- RENDER LIST (GÜNCELLENDİ - Boş Durum İyileştirmesi) ---
function renderList(container, transactions, emptyMessage, emptyIconClass = 'fa-solid fa-folder-open') {
    if (!container) return;
    if (transactions.length === 0) {
        container.innerHTML = `
            <div class="text-center p-8 text-slate-500 dark:text-slate-400">
                <i class="${emptyIconClass} text-4xl mb-4"></i>
                <p class="font-semibold">${emptyMessage}</p>
            </div>`;
        return;
    }
    // ... (Listenin geri kalanı aynı)
}


// --- RAPORLAR SAYFASI (YENİ) ---
function renderReportsPage() {
    renderCashFlowChart();
    renderCategoryTreemap();
}

function renderCashFlowChart() {
    if (cashFlowChart) cashFlowChart.destroy();

    const monthlyData = allTransactions.reduce((acc, tx) => {
        if (!tx.createdAt) return acc;
        const monthKey = tx.createdAt.toDate().toISOString().slice(0, 7);
        if (!acc[monthKey]) acc[monthKey] = { income: 0, expense: 0 };
        if (tx.type === 'income') acc[monthKey].income += tx.amount;
        else if (tx.isPaid) acc[monthKey].expense += tx.amount;
        return acc;
    }, {});

    const sortedMonthKeys = Object.keys(monthlyData).sort().slice(-6); // Son 6 ay

    const options = { /* ... ApexCharts için bar chart seçenekleri ... */ };
    cashFlowChart = new ApexCharts(cashFlowChartContainer, options);
    cashFlowChart.render();
}

function renderCategoryTreemap() {
    if (treemapChart) treemapChart.destroy();

    const { startDate, endDate } = getCurrentFinancialCycle(userSettings.paymentDay);
    const expenses = allTransactions.filter(tx => {
        const txDate = tx.createdAt?.toDate();
        return tx.type === 'expense' && txDate >= startDate && txDate <= endDate;
    });
    
    const categoryTotals = expenses.reduce((acc, tx) => {
        acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
        return acc;
    }, {});

    const seriesData = Object.entries(categoryTotals).map(([name, total]) => ({
        x: name,
        y: total.toFixed(2)
    }));

    const options = { /* ... ApexCharts için treemap seçenekleri ... */ };
    treemapChart = new ApexCharts(categoryTreemapContainer, options);
    treemapChart.render();
}

// --- HEDEFLER SAYFASI (YENİ) ---
function loadGoals() {
    // ... Firestore'dan hedefleri yükleme (onSnapshot)
}

function displayGoals() {
    // ... Yüklenen hedefleri ekrana çizme
}

function openGoalModal(goal = null) {
    // ... Hedef ekleme/düzenleme modalını açma
}

addGoalBtn.addEventListener('click', () => openGoalModal());

// ... (Hedef kaydetme, silme, para ekleme fonksiyonları)


// --- BANKA LOGOLARI (GÜNCELLENDİ - SVG Kullanımı) ---
function getBankLogo(bankName) {
    const name = bankName.toLowerCase();
    // SVG kodları daha hızlı yüklenir ve daha nettir
    switch(name) {
        case 'garanti': return `<svg>...</svg>`; // Garanti BBVA SVG kodu
        case 'akbank': return `<svg>...</svg>`; // Akbank SVG kodu
        // ... diğer bankalar
        default: return '<i class="fa-solid fa-credit-card text-3xl opacity-50"></i>';
    }
}


// --- UYGULAMA BAŞLANGICI ---
// Sayfa yüklendiğinde mobil navigasyonu kur
document.addEventListener('DOMContentLoaded', setupMobileNavigation);

// ... (Geri kalan tüm fonksiyonlar ve event listener'lar)
