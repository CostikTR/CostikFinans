export function showNotification(message, type = 'error') {
  const bar = document.getElementById('notification-bar');
  const msg = document.getElementById('notification-message');
  if (!bar || !msg) return;
  bar.classList.remove('bg-green-500', 'bg-sky-500', 'bg-red-500');
  msg.textContent = message;
  if (type === 'success') bar.classList.add('bg-green-500');
  else if (type === 'info') bar.classList.add('bg-sky-500');
  else bar.classList.add('bg-red-500');
  bar.classList.add('show');
  setTimeout(() => bar.classList.remove('show'), 3000);
}

export function toggleLoading(show) {
  const overlay = document.getElementById('loading-overlay');
  if (!overlay) return;
  overlay.classList.toggle('hidden', !show);
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);
}

export function getCurrentFinancialCycle(paymentDay) {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const currentDay = today.getDate();
  let startYear, startMonth, endYear, endMonth;
  if (currentDay >= paymentDay) {
    startYear = currentYear; startMonth = currentMonth;
  } else {
    startYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    startMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  }
  endYear = startMonth === 11 ? startYear + 1 : startYear;
  endMonth = startMonth === 11 ? 0 : startMonth + 1;
  const startDate = new Date(startYear, startMonth, paymentDay); startDate.setHours(0,0,0,0);
  const endDate = new Date(endYear, endMonth, paymentDay - 1); endDate.setHours(23,59,59,999);
  return { startDate, endDate };
}

export function getPreviousFinancialCycle(paymentDay) {
  const { startDate: currentStart } = getCurrentFinancialCycle(paymentDay);
  const endDate = new Date(currentStart); endDate.setDate(endDate.getDate() - 1); endDate.setHours(23,59,59,999);
  const startDate = new Date(currentStart); startDate.setMonth(startDate.getMonth() - 1); startDate.setHours(0,0,0,0);
  return { startDate, endDate };
}
