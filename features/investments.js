import { db, appId } from '../core/firebase.js';
import { showNotification, formatCurrency, debounce } from '../core/utils.js';
import { fetchCurrentPriceTRY } from './pricing.js';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, serverTimestamp, runTransaction } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

let state = {
  currentUserId: null,
  allInvestments: [],
  unsubscribe: null,
  autoTimer: null,
  didInitialAutoRefresh: false,
};

// Dışarıdan kullanıcı kimliği set edilmeli
export function setInvestmentsUser(userId) {
  state.currentUserId = userId;
}

export function stopInvestments() {
  if (state.unsubscribe) { state.unsubscribe(); state.unsubscribe = null; }
  if (state.autoTimer) { clearInterval(state.autoTimer); state.autoTimer = null; }
}

export function startInvestments() {
  const listEl = document.getElementById('investment-list');
  if (!state.currentUserId || !listEl) return;
  if (state.unsubscribe) state.unsubscribe();
  const q = query(collection(db, `artifacts/${appId}/users/${state.currentUserId}/investments`), orderBy("purchaseDate", "desc"));
  state.unsubscribe = onSnapshot(q, async (snapshot) => {
    state.allInvestments = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    render();
    if (!state.didInitialAutoRefresh) { state.didInitialAutoRefresh = true; try { await refreshOnce(); } catch {} }
  });
  startAutoUpdate();
  wireControls();
}

function render() {
  const investmentList = document.getElementById('investment-list');
  if (!investmentList) return;
  const searchEl = document.getElementById('investment-search');
  const providerFilterEl = document.getElementById('investment-provider-filter');
  const sortEl = document.getElementById('investment-sort-select');

  const search = (searchEl?.value || '').trim().toLowerCase();
  const providerFilter = providerFilterEl?.value || 'all';
  const sortBy = sortEl?.value || 'value_desc';

  const totals = state.allInvestments.reduce((a, inv) => { const q = inv.quantity||0, buy = inv.purchasePrice||0, cur = inv.currentPrice||0; a.value += q*cur; a.cost += q*buy; return a; }, { value:0, cost:0 });

  let list = [...state.allInvestments];
  if (providerFilter !== 'all') list = list.filter(i => (i.priceProvider || 'manual') === providerFilter);
  if (search) list = list.filter(i => `${i.assetName || ''} ${(i.symbol || '')}`.toLowerCase().includes(search));

  const d = (inv) => { const qty=inv.quantity||0, buy=inv.purchasePrice||0, cur=inv.currentPrice||0; const cost=qty*buy, value=qty*cur, pl=value-cost, weight=totals.value>0?(value/totals.value)*100:0, plPct=cost>0?(pl/cost)*100:0; return {qty,buy,cur,cost,value,pl,weight,plPct}; };
  const sorters = { value_desc:(a,b)=>d(b).value-d(a).value, value_asc:(a,b)=>d(a).value-d(b).value, pl_desc:(a,b)=>d(b).pl-d(a).pl, pl_asc:(a,b)=>d(a).pl-d(b).pl, name_asc:(a,b)=>(a.assetName||'').localeCompare(b.assetName||'') };
  list.sort(sorters[sortBy] || sorters.value_desc);

  investmentList.innerHTML = '';
  if (list.length === 0) {
    investmentList.innerHTML = `<tr><td colspan="10" class="text-center py-8 text-slate-500">Kriterlere uygun yatırım bulunamadı.</td></tr>`;
  } else {
    const frag = document.createDocumentFragment();
    for (const inv of list) {
      const x = d(inv);
      const tr = document.createElement('tr');
      tr.className = 'border-b dark:border-slate-700';
      tr.innerHTML = `
        <td class="px-6 py-4 font-medium text-slate-900 dark:text-white">
          ${inv.assetName}
          <span class="block text-xs text-slate-500">${inv.symbol || '-'} · ${inv.assetType || ''}</span>
        </td>
        <td class="px-6 py-4">${(x.qty||0).toLocaleString('tr-TR')}</td>
        <td class="px-6 py-4">${formatCurrency(x.buy)}</td>
        <td class="px-6 py-4">${formatCurrency(x.cur)}</td>
        <td class="px-6 py-4">${formatCurrency(x.cost)}</td>
        <td class="px-6 py-4">${formatCurrency(x.value)}</td>
        <td class="px-6 py-4">${x.weight.toFixed(2)}%</td>
        <td class="px-6 py-4 font-semibold ${x.pl>=0?'text-green-500':'text-red-500'}">
          ${formatCurrency(x.pl)}
          <span class="block text-xs">(${x.plPct.toFixed(2)}%)</span>
        </td>
        <td class="px-6 py-4 text-xs">${inv.priceProvider || 'manual'}</td>
        <td class="px-6 py-4 text-right whitespace-nowrap">
          <button data-action="refresh" data-id="${inv.id}" class="text-slate-400 hover:text-sky-600 mr-3" title="Fiyatı güncelle"><i class="fa-solid fa-rotate"></i></button>
          <button data-action="sell" data-id="${inv.id}" class="text-emerald-600 hover:text-emerald-700 mr-3" title="Sat"><i class="fa-solid fa-cart-shopping"></i></button>
          <button data-action="edit" data-id="${inv.id}" class="text-slate-400 hover:text-indigo-500 mr-2"><i class="fa-solid fa-pencil"></i></button>
          <button data-action="delete" data-id="${inv.id}" class="text-slate-400 hover:text-red-500"><i class="fa-solid fa-trash-can"></i></button>
        </td>`;
      frag.appendChild(tr);
    }
    investmentList.appendChild(frag);
  }

  // Özet kartları
  const totalPL = totals.value - totals.cost;
  const totalPLPercent = totals.cost > 0 ? (totalPL / totals.cost) * 100 : 0;
  const totalValEl = document.getElementById('portfolio-total-value');
  const totalPLEl = document.getElementById('portfolio-total-pl');
  const totalPLPercentEl = document.getElementById('portfolio-total-pl-percent');
  if (totalValEl) totalValEl.textContent = formatCurrency(totals.value);
  if (totalPLEl) { totalPLEl.textContent = formatCurrency(totalPL); totalPLEl.parentElement.className = `text-3xl font-bold ${totalPL>=0?'text-green-500':'text-red-500'}`; }
  if (totalPLPercentEl) { totalPLPercentEl.textContent = `(${totalPLPercent.toFixed(2)}%)`; totalPLPercentEl.className = `text-lg font-semibold ml-2`; }

  renderChart();
}

function wireControls() {
  const listEl = document.getElementById('investment-list');
  if (!listEl || listEl.dataset.wired) return;
  listEl.dataset.wired = '1';
  listEl.addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const id = btn.dataset.id;
    const action = btn.dataset.action;
    const inv = state.allInvestments.find(i => i.id === id);
    if (!inv) return;
    if (action === 'edit') {
      window.openInvestmentModal?.(id);
    } else if (action === 'delete') {
      window.openDeleteModal?.(id, 'investment');
    } else if (action === 'refresh') {
      const price = await fetchCurrentPriceTRY(inv.priceProvider, inv.symbol || '');
      if (typeof price === 'number') {
        try { await updateDoc(doc(db, `artifacts/${appId}/users/${state.currentUserId}/investments`, id), { currentPrice: price, updatedAt: serverTimestamp() }); showNotification('Fiyat güncellendi.', 'success'); render(); } catch {}
      } else {
        showNotification(`Fiyat alınamadı. Sağlayıcı: ${inv.priceProvider}, Sembol: ${inv.symbol || '-'}`);
      }
    } else if (action === 'sell') {
      const qtyStr = prompt(`Satılacak miktarı girin (elde: ${inv.quantity}):`, String(inv.quantity));
      if (qtyStr === null) return;
      const qty = parseFloat(qtyStr);
      if (!(qty > 0) || qty > inv.quantity) { showNotification('Geçersiz miktar.'); return; }
      const proceeds = qty * inv.currentPrice;
      try {
        await runTransaction(db, async (tx) => {
          const invRef = doc(db, `artifacts/${appId}/users/${state.currentUserId}/investments`, inv.id);
          const settingsRef = doc(db, `artifacts/${appId}/users/${state.currentUserId}/settings/main`);
          const snap = await tx.get(invRef);
          const curInv = snap.exists() ? snap.data() : null;
          if (!curInv || (curInv.quantity || 0) < qty) throw new Error('qty');
          const newQty = (curInv.quantity || 0) - qty;
          tx.update(invRef, { quantity: newQty, updatedAt: serverTimestamp() });
          const setSnap = await tx.get(settingsRef);
          const bal = setSnap.exists() ? (setSnap.data().accountBalance || 0) : 0;
          tx.update(settingsRef, { accountBalance: bal + proceeds });
        });
        showNotification('Satış gerçekleştirildi ve bakiyeye eklendi.', 'success');
      } catch (err) { console.error(err); showNotification('Satış işlemi tamamlanamadı.'); }
    }
  });

  const searchEl = document.getElementById('investment-search');
  const providerFilterEl = document.getElementById('investment-provider-filter');
  const sortEl = document.getElementById('investment-sort-select');
  if (searchEl && !searchEl.dataset.wired) { searchEl.dataset.wired = '1'; searchEl.addEventListener('input', debounce(render, 250)); }
  if (providerFilterEl && !providerFilterEl.dataset.wired) { providerFilterEl.dataset.wired = '1'; providerFilterEl.addEventListener('change', render); }
  if (sortEl && !sortEl.dataset.wired) { sortEl.dataset.wired = '1'; sortEl.addEventListener('change', render); }
  const bulkBtn = document.getElementById('bulk-refresh-btn');
  if (bulkBtn && !bulkBtn.dataset.wired) {
    bulkBtn.dataset.wired = '1';
    bulkBtn.addEventListener('click', async () => {
      const autoInv = state.allInvestments.filter(i => i.symbol && i.priceProvider && i.priceProvider !== 'manual');
      if (autoInv.length === 0) { showNotification('Güncellenecek otomatik fiyatlı varlık yok.'); return; }
      let updated = 0, failed = 0;
      for (const inv of autoInv) {
        const price = await fetchCurrentPriceTRY(inv.priceProvider, inv.symbol);
        if (typeof price === 'number') {
          try { await updateDoc(doc(db, `artifacts/${appId}/users/${state.currentUserId}/investments`, inv.id), { currentPrice: price, updatedAt: serverTimestamp() }); updated++; }
          catch { failed++; }
        } else { failed++; }
      }
      render();
      showNotification(`Güncellendi: ${updated}, Hata: ${failed}`);
    });
  }
}

function startAutoUpdate() {
  if (state.autoTimer) clearInterval(state.autoTimer);
  state.autoTimer = setInterval(async () => {
    const autoInv = state.allInvestments.filter(i => i.autoUpdate && i.symbol && i.priceProvider && i.priceProvider !== 'manual');
    if (autoInv.length === 0) return;
    let updated = false;
    for (const inv of autoInv) {
      const price = await fetchCurrentPriceTRY(inv.priceProvider, (inv.symbol || ''));
      if (typeof price === 'number' && price !== inv.currentPrice) {
        try { await updateDoc(doc(db, `artifacts/${appId}/users/${state.currentUserId}/investments`, inv.id), { currentPrice: price }); updated = true; } catch {}
      }
    }
    if (updated) render();
  }, 60000);
}

async function refreshOnce() {
  const autoInv = state.allInvestments.filter(i => i.autoUpdate && i.symbol && i.priceProvider && i.priceProvider !== 'manual');
  for (const inv of autoInv) {
    const price = await fetchCurrentPriceTRY(inv.priceProvider, (inv.symbol || ''));
    if (typeof price === 'number' && price !== inv.currentPrice) { try { await updateDoc(doc(db, `artifacts/${appId}/users/${state.currentUserId}/investments`, inv.id), { currentPrice: price }); } catch {} }
  }
}

function renderChart() {
  // Grafik için veriyi dışarıya geçir
  if (typeof window.renderPortfolioAllocationChartWithData === 'function') {
    window.renderPortfolioAllocationChartWithData(state.allInvestments || []);
  }
}

export function renderInvestmentsNow() { render(); }