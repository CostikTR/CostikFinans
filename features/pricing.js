import { db } from '../core/firebase.js';
import { showNotification } from '../core/utils.js';

// Basit bellek + localStorage cache
const memCache = new Map();
const getCache = (k) => {
  if (memCache.has(k)) return memCache.get(k);
  try { const j = JSON.parse(localStorage.getItem(k) || ''); if (j && Date.now() - j.t < 5 * 60 * 1000) { memCache.set(k, j.v); return j.v; } } catch {}
  return null;
};
const setCache = (k, v) => { memCache.set(k, v); try { localStorage.setItem(k, JSON.stringify({ v, t: Date.now() })); } catch {} };

const OZ_TO_GRAM = 31.1034768;

export async function fetchCurrentPriceTRY(provider = 'manual', symbol = '') {
  if (!symbol || provider === 'manual') return null;
  const key = `price:${provider}:${symbol}`;
  const cached = getCache(key);
  if (typeof cached === 'number') return cached;

  const withTimeout = (p, ms = 8000) => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), ms);
    return fetch(p, { signal: ctrl.signal }).finally(() => clearTimeout(t));
  };

  try {
    if (provider === 'coingecko') {
      const map = { BTC:'bitcoin', ETH:'ethereum', BNB:'binancecoin', XRP:'ripple', SOL:'solana', ADA:'cardano', DOGE:'dogecoin', AVAX:'avalanche-2', TRX:'tron', DOT:'polkadot', MATIC:'matic-network', LINK:'chainlink', ATOM:'cosmos', XLM:'stellar', XMR:'monero', ETC:'ethereum-classic', USDT:'tether', USDC:'usd-coin', TON:'the-open-network', BCH:'bitcoin-cash', SHIB:'shiba-inu', PEPE:'pepe' };
      const id = map[symbol.toUpperCase()] || symbol.toLowerCase();
      const res = await withTimeout(`https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(id)}&vs_currencies=try`);
      if (!res.ok) throw new Error('coingecko');
      const data = await res.json();
      const price = data?.[id]?.try;
      if (typeof price === 'number') { setCache(key, price); return price; }
      return null;
    }
    if (provider === 'forex') {
      const base = symbol.toUpperCase();
      if (base === 'TRY') return 1;
      // 1) convert
      try {
        const conv = await withTimeout(`https://api.exchangerate.host/convert?from=${encodeURIComponent(base)}&to=TRY`);
        if (conv.ok) { const j = await conv.json(); const v = j?.result; if (typeof v === 'number' && v > 0) { setCache(key, v); return v; } }
      } catch {}
      // 2) latest base=SYMBOL -> TRY
      try {
        const r = await withTimeout(`https://api.exchangerate.host/latest?base=${encodeURIComponent(base)}&symbols=TRY`);
        if (r.ok) { const j = await r.json(); const v = j?.rates?.TRY; if (typeof v === 'number' && v > 0) { setCache(key, v); return v; } }
      } catch {}
      // 3) invert TRY -> SYMBOL
      try {
        const r = await withTimeout(`https://api.exchangerate.host/latest?base=TRY&symbols=${encodeURIComponent(base)}`);
        if (r.ok) { const j = await r.json(); const rate = j?.rates?.[base]; if (typeof rate === 'number' && rate > 0) { const v = 1 / rate; setCache(key, v); return v; } }
      } catch {}
      return null;
    }
    if (provider === 'metals') {
      const usdTry = await fetchCurrentPriceTRY('forex', 'USD');
      const getUsdPerOunce = async (base) => {
        try {
          const r1 = await withTimeout(`https://api.exchangerate.host/latest?base=${base}&symbols=USD`);
          if (r1.ok) { const d1 = await r1.json(); const v1 = d1?.rates?.USD; if (typeof v1 === 'number' && v1 > 0) return v1; }
        } catch {}
        try {
          const r2 = await withTimeout(`https://api.exchangerate.host/latest?base=USD&symbols=${base}`);
          if (r2.ok) { const d2 = await r2.json(); const v2 = d2?.rates?.[base]; if (typeof v2 === 'number' && v2 > 0) return 1 / v2; }
        } catch {}
        return null;
      };
      const getTryPerOunceDirect = async (base) => {
        try { const r = await withTimeout(`https://api.exchangerate.host/latest?base=${base}&symbols=TRY`); if (r.ok) { const j = await r.json(); const v = j?.rates?.TRY; if (typeof v === 'number' && v > 0) return v; } } catch {}
        try { const r2 = await withTimeout(`https://api.exchangerate.host/latest?base=TRY&symbols=${base}`); if (r2.ok) { const j2 = await r2.json(); const v2 = j2?.rates?.[base]; if (typeof v2 === 'number' && v2 > 0) return 1 / v2; } } catch {}
        return null;
      };

      let tryPerXauOunce = null, tryPerXagOunce = null;
      if (usdTry > 0) {
        const xauUsd = await getUsdPerOunce('XAU');
        const xagUsd = await getUsdPerOunce('XAG');
        if (xauUsd > 0) tryPerXauOunce = usdTry * xauUsd;
        if (xagUsd > 0) tryPerXagOunce = usdTry * xagUsd;
      }
      if (!(tryPerXauOunce > 0)) tryPerXauOunce = await getTryPerOunceDirect('XAU');
      if (!(tryPerXagOunce > 0)) tryPerXagOunce = await getTryPerOunceDirect('XAG');

      if (symbol === 'ons_altin') { if (tryPerXauOunce > 0) { setCache(key, tryPerXauOunce); return tryPerXauOunce; } return getCache(key); }
      if (symbol === 'gram_altin' || symbol === 'ceyrek_altin' || symbol === 'yarim_altin' || symbol === 'tam_altin') {
        if (!(tryPerXauOunce > 0)) return getCache(key);
        const gram24k = tryPerXauOunce / OZ_TO_GRAM;
        if (symbol === 'gram_altin') { setCache(key, gram24k); return gram24k; }
        const purity22k = 0.916; const premium = 1.02; const gram22k = gram24k * purity22k * premium;
        let weight = 1.75; if (symbol === 'yarim_altin') weight = 3.5; if (symbol === 'tam_altin') weight = 7;
        const val = gram22k * weight; setCache(key, val); return val;
      }
      if (symbol === 'gram_gumus') {
        if (!(tryPerXagOunce > 0)) return getCache(key);
        const gramSilver = tryPerXagOunce / OZ_TO_GRAM; setCache(key, gramSilver); return gramSilver;
      }
      return null;
    }
    return null;
  } catch (e) {
    console.warn('Fiyat alınamadı:', { provider, symbol, e });
    return null;
  }
}
