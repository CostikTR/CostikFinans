// Genel yardımcı fonksiyonlar
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
  try {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount || 0);
  } catch {
    return `${(amount || 0).toFixed?.(2) ?? amount} ₺`;
  }
}

export function debounce(fn, wait = 250) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };
}

export function throttle(fn, limit = 250) {
  let inThrottle = false; let lastArgs = null;
  return (...args) => {
    if (!inThrottle) {
      fn(...args); inThrottle = true;
      setTimeout(() => { inThrottle = false; if (lastArgs) { fn(...lastArgs); lastArgs = null; } }, limit);
    } else { lastArgs = args; }
  };
}
