import { CHALLENGES, COUPONS, INITIAL_QUOTES, ASSET_PROPERTIES, getSymbolContract } from '../data';
import { MarketQuote, User, Account, Order, Trade, AccountLog, PayoutRequest, RuleViolation, AffiliateProfile, AffiliateCommission, AffiliatePayoutRequest, Coupon, KycStatus } from '../types';
import { 
  collection, 
  doc, 
  setDoc as firestoreSetDoc, 
  getDoc as firestoreGetDoc, 
  getDocs as firestoreGetDocs, 
  updateDoc as firestoreUpdateDoc, 
  deleteDoc as firestoreDeleteDoc, 
  query, 
  where, 
  writeBatch,
  getDocFromCache,
  getDocsFromCache
} from 'firebase/firestore';

interface FallbackDb {
  [collectionName: string]: {
    [docId: string]: any;
  };
}

let localFallbackDb: FallbackDb = {};

// Load from localStorage if available
try {
  if (typeof window !== 'undefined') {
    const stored = window.localStorage.getItem('atfunding_fallback_db');
    if (stored) {
      localFallbackDb = JSON.parse(stored);
      console.log('[Firebase Fallback DB] Loaded from localStorage.');
    }
  }
} catch (e) {
  console.warn('[Firebase Fallback DB] Failed to load from localStorage:', e);
}

function saveFallbackDb() {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('atfunding_fallback_db', JSON.stringify(localFallbackDb));
    }
  } catch (e) {
    console.warn('[Firebase Fallback DB] Failed to save to localStorage:', e);
  }
}

// Extract collection name from Query or CollectionReference
function getCollectionName(queryOrCollection: any): string {
  if (!queryOrCollection) return '';
  if (typeof queryOrCollection.path === 'string') {
    return queryOrCollection.path.split('/')[0];
  }
  if (queryOrCollection._query && queryOrCollection._query.path) {
    const p = queryOrCollection._query.path.toString();
    return p.split('/')[0];
  }
  // Fallback search in keys/properties
  for (const key of Object.keys(queryOrCollection)) {
    const val = queryOrCollection[key];
    if (val && typeof val.path === 'string') {
      return val.path.split('/')[0];
    }
    if (val && val._query && val._query.path) {
      return val._query.path.toString().split('/')[0];
    }
  }
  return '';
}

// Extract filter criteria recursively from Query
function extractFilters(obj: any, filters: { field: string; op: string; val: any }[] = []): any[] {
  if (!obj || typeof obj !== 'object') return filters;
  
  if (obj.field && obj.op && 'value' in obj) {
    const fieldName = obj.field.segments?.[0] || obj.field.toString?.();
    if (fieldName) {
      let val = obj.value;
      if (val && typeof val === 'object') {
        if ('stringValue' in val) val = val.stringValue;
        else if ('booleanValue' in val) val = val.booleanValue;
        else if ('integerValue' in val) val = val.integerValue;
      }
      filters.push({ field: fieldName, op: obj.op, val });
    }
  }
  
  for (const key of Object.keys(obj)) {
    if (key === 'converter') continue;
    extractFilters(obj[key], filters);
  }
  return filters;
}

// Evaluates whether a cached document matches Query filters
function matchQueryFilters(queryOrCollection: any, docData: any): boolean {
  try {
    if (queryOrCollection.type === 'collection') return true;
    const filters: any[] = [];
    extractFilters(queryOrCollection, filters);
    
    for (const filter of filters) {
      const field = filter.field;
      const op = filter.op;
      const val = filter.val;
      
      const docVal = docData[field];
      if (op === '==' || op === 'EQUAL') {
        if (docVal !== val) return false;
      } else if (op === '!=' || op === 'NOT_EQUAL') {
        if (docVal === val) return false;
      }
    }
  } catch (e) {
    console.warn('[Query Fallback Warning] Error matching filters:', e);
  }
  return true;
}

// Cache document snapshot retrieved from server
function cacheDocSnapshot(docSnap: any) {
  if (docSnap && docSnap.exists && docSnap.exists()) {
    const path = docSnap.ref?.path || docSnap.path;
    if (path) {
      const parts = path.split('/');
      if (parts.length === 2) {
        const col = parts[0];
        const id = parts[1];
        if (!localFallbackDb[col]) localFallbackDb[col] = {};
        localFallbackDb[col][id] = docSnap.data();
        saveFallbackDb();
      }
    }
  }
}

// Cache collection query snapshots retrieved from server
function cacheQuerySnapshot(querySnap: any, colName: string) {
  if (querySnap && querySnap.docs && colName) {
    if (!localFallbackDb[colName]) localFallbackDb[colName] = {};
    querySnap.docs.forEach((docSnap: any) => {
      localFallbackDb[colName][docSnap.id] = docSnap.data();
    });
    saveFallbackDb();
  }
}

// Cache local write operation
function cacheDocWrite(path: string, data: any, isMerge: boolean = false) {
  if (!path) return;
  const parts = path.split('/');
  if (parts.length === 2) {
    const col = parts[0];
    const id = parts[1];
    if (!localFallbackDb[col]) localFallbackDb[col] = {};
    if (isMerge) {
      localFallbackDb[col][id] = { ...localFallbackDb[col][id], ...data };
    } else {
      localFallbackDb[col][id] = data;
    }
    saveFallbackDb();
  }
}

// Cache local delete operation
function cacheDocDelete(path: string) {
  if (!path) return;
  const parts = path.split('/');
  if (parts.length === 2) {
    const col = parts[0];
    const id = parts[1];
    if (localFallbackDb[col]) {
      delete localFallbackDb[col][id];
      saveFallbackDb();
    }
  }
}

export async function getDoc(reference: any) {
  try {
    const snap = await firestoreGetDoc(reference);
    cacheDocSnapshot(snap);
    return snap;
  } catch (err: any) {
    console.warn('[Firebase Fetch Warning] Server getDoc failed (likely offline):', err);
    try {
      const snap = await getDocFromCache(reference);
      cacheDocSnapshot(snap);
      return snap;
    } catch (cacheErr) {
      console.warn('[Firebase Fetch Warning] getDocFromCache failed, checking localFallbackDb...', cacheErr);
      const path = reference.path;
      if (path) {
        const parts = path.split('/');
        if (parts.length === 2) {
          const col = parts[0];
          const id = parts[1];
          if (localFallbackDb[col] && localFallbackDb[col][id]) {
            const data = localFallbackDb[col][id];
            return {
              exists: () => true,
              data: () => data,
              id: id,
              ref: reference
            } as any;
          }
        }
      }
      return {
        exists: () => false,
        data: () => undefined,
        id: reference.id,
        ref: reference
      } as any;
    }
  }
}

export async function getDocs(queryOrCollection: any) {
  const colName = getCollectionName(queryOrCollection);
  try {
    const snap = await firestoreGetDocs(queryOrCollection);
    if (colName) {
      cacheQuerySnapshot(snap, colName);
    }
    return snap;
  } catch (err: any) {
    console.warn('[Firebase Fetch Warning] Server getDocs failed (likely offline):', err);
    try {
      const snap = await getDocsFromCache(queryOrCollection);
      if (colName) {
        cacheQuerySnapshot(snap, colName);
      }
      return snap;
    } catch (cacheErr) {
      console.warn('[Firebase Fetch Warning] getDocsFromCache failed, checking localFallbackDb...', cacheErr);
      if (colName && localFallbackDb[colName]) {
        const colData = localFallbackDb[colName];
        const matchedDocs: any[] = [];
        
        Object.keys(colData).forEach(id => {
          const docData = colData[id];
          if (matchQueryFilters(queryOrCollection, docData)) {
            matchedDocs.push({
              exists: () => true,
              data: () => docData,
              id: id,
              ref: { path: `${colName}/${id}`, id: id }
            });
          }
        });
        
        return {
          docs: matchedDocs,
          empty: matchedDocs.length === 0,
          size: matchedDocs.length,
          forEach: (callback: any) => matchedDocs.forEach(callback)
        } as any;
      }
      return {
        docs: [],
        empty: true,
        size: 0,
        forEach: () => {}
      } as any;
    }
  }
}

export async function updateDoc(reference: any, data: any) {
  try {
    cacheDocWrite(reference.path, data, true);
    return await firestoreUpdateDoc(reference, data);
  } catch (err: any) {
    console.warn('[Firebase Fetch Warning] updateDoc failed (likely offline):', err);
    if (err.message && (err.message.includes('offline') || err.message.includes('unavailable') || err.message.includes('failed-precondition'))) {
      return;
    }
    throw err;
  }
}

export async function setDoc(reference: any, data: any, options?: any) {
  try {
    cacheDocWrite(reference.path, data, options?.merge);
    return await firestoreSetDoc(reference, data, options);
  } catch (err: any) {
    console.warn('[Firebase Fetch Warning] setDoc failed (likely offline):', err);
    if (err.message && (err.message.includes('offline') || err.message.includes('unavailable') || err.message.includes('failed-precondition'))) {
      return;
    }
    throw err;
  }
}

export async function deleteDoc(reference: any) {
  try {
    cacheDocDelete(reference.path);
    return await firestoreDeleteDoc(reference);
  } catch (err: any) {
    console.warn('[Firebase Fetch Warning] deleteDoc failed (likely offline):', err);
    if (err.message && (err.message.includes('offline') || err.message.includes('unavailable') || err.message.includes('failed-precondition'))) {
      return;
    }
    throw err;
  }
}
import { db } from './firebase';
import { checkDrawdown, validateData } from './riskManager';

let currentQuotes: MarketQuote[] = JSON.parse(JSON.stringify(INITIAL_QUOTES));

// Helper for currency conversions
function getQuoteToUSDExchangeRate(symbol: string): number {
  const symbolClean = symbol.toUpperCase().replace('/', '');
  const defaults: Record<string, number> = {
    USDJPY: 156.45,
    USDCHF: 0.89,
    USDCAD: 1.37,
    GBPUSD: 1.265,
    EURUSD: 1.0845,
    AUDUSD: 0.665,
    NZDUSD: 0.612,
  };

  const getQuotePrice = (sym: string) => {
    const q = currentQuotes.find(c => c.symbol.toUpperCase().replace('/', '') === sym);
    return q ? q.price : (defaults[sym] || 1.0);
  };

  if (symbolClean.endsWith('JPY')) {
    return 1.0 / getQuotePrice('USDJPY');
  }
  if (symbolClean.endsWith('CHF')) {
    return 1.0 / getQuotePrice('USDCHF');
  }
  if (symbolClean.endsWith('CAD')) {
    return 1.0 / getQuotePrice('USDCAD');
  }
  if (symbolClean.endsWith('GBP')) {
    return getQuotePrice('GBPUSD');
  }
  if (symbolClean.endsWith('EUR')) {
    return getQuotePrice('EURUSD');
  }
  if (symbolClean.endsWith('AUD')) {
    return getQuotePrice('AUDUSD');
  }
  if (symbolClean.endsWith('NZD')) {
    return getQuotePrice('NZDUSD');
  }
  return 1.0;
}

function getBaseOrigin(): string {
  if (typeof window === 'undefined') return '';
  
  // 1. Try standard origin first (highly accurate for secure public cloud-run deployments!)
  if (window.location && window.location.origin && window.location.origin !== 'null' && window.location.origin.startsWith('http')) {
    return window.location.origin;
  }
  
  // 2. Try location.href
  if (window.location && window.location.href && window.location.href.startsWith('http')) {
    try {
      const urlObj = new URL(window.location.href);
      if (urlObj.protocol && urlObj.host && urlObj.protocol.startsWith('http')) {
        return `${urlObj.protocol}//${urlObj.host}`;
      }
    } catch (e) {}
  }
  
  // 3. Try import.meta.url (exclude localhost/127.0.0.1 if main page is secure HTTPS)
  try {
    const metaUrl = import.meta.url;
    if (metaUrl && metaUrl.startsWith('http')) {
      const urlObj = new URL(metaUrl);
      if (urlObj.protocol && urlObj.host && urlObj.protocol.startsWith('http')) {
        const isLocalHostMeta = urlObj.host.includes('localhost') || urlObj.host.includes('127.0.0.1');
        const isLocalHostPage = typeof window !== 'undefined' && window.location && (window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1'));
        if (!isLocalHostMeta || isLocalHostPage) {
          return `${urlObj.protocol}//${urlObj.host}`;
        }
      }
    }
  } catch (e) {}
  
  // 4. Try document.referrer
  if (typeof document !== 'undefined' && document.referrer && document.referrer.startsWith('http')) {
    try {
      const urlObj = new URL(document.referrer);
      if (urlObj.protocol && urlObj.host && urlObj.protocol.startsWith('http')) {
        return `${urlObj.protocol}//${urlObj.host}`;
      }
    } catch (e) {}
  }

  // 5. Try scanning script tags for a valid HTTP/HTTPS source
  if (typeof document !== 'undefined' && document.getElementsByTagName) {
    const scripts = document.getElementsByTagName('script');
    for (let i = 0; i < scripts.length; i++) {
      const src = scripts[i].getAttribute('src');
      if (src && src.startsWith('http')) {
        try {
          const urlObj = new URL(src);
          if (urlObj.protocol && urlObj.host && urlObj.protocol.startsWith('http')) {
            return `${urlObj.protocol}//${urlObj.host}`;
          }
        } catch (e) {}
      }
    }
  }

  // 6. Fallback to empty string for relative URLs
  return '';
}

// ----------------------------------------------------
// SEEDING DEFAULT DATABASE DATA
// ----------------------------------------------------
async function seedDefaultData() {
  try {
    const checkDoc = doc(db, 'system', 'config');
    const snap = await getDoc(checkDoc);
    if (snap.exists()) {
      return; // Already seeded
    }

    console.log('[Firebase Seeding] Initializing default collections...');

    await setDoc(checkDoc, { seeded: true, createdAt: new Date().toISOString() });

    // Seed admin credentials
    await setDoc(doc(db, 'system', 'adminCredentials'), {
      email: "atgrowfund@gmail.com",
      password: "asjadx"
    });

    const defaultUsers: User[] = [
      {
        id: "admin-atgrowfund",
        email: "asjadtrades07@gmail.com",
        name: "ATFunding Admin",
        role: "admin",
        kycStatus: "approved",
        createdAt: "2026-06-30T05:31:50.119Z"
      },
      {
        id: "user-default",
        email: "trader@atfunding.com",
        name: "Alpha Trader",
        role: "user",
        kycStatus: "none",
        createdAt: "2026-06-30T05:31:50.119Z"
      }
    ];
    for (const u of defaultUsers) {
      await setDoc(doc(db, 'users', u.id), u);
    }

    const defaultAccounts: Account[] = [
      {
        id: "ACC-149302",
        userId: "user-default",
        userEmail: "trader@atfunding.com",
        userName: "Alpha Trader",
        challengeConfigId: "os-5k",
        challengeName: "ATFunding 5K Challenge (One-Step)",
        challengeSize: 5000,
        type: "one_step",
        status: "active",
        breachedReason: "",
        phase: "phase1",
        balance: 5000,
        initialBalance: 5000,
        peakBalance: 5000,
        startOfDayBalance: 5000,
        dailyDrawdownLimitValue: 200,
        maxDrawdownLimitValue: 400,
        payoutSharePercent: 80,
        createdAt: "2026-07-06T14:32:21.052Z",
        warningsCount: 0
      }
    ];
    for (const a of defaultAccounts) {
      await setDoc(doc(db, 'accounts', a.id), a);
    }

    for (const c of COUPONS) {
      await setDoc(doc(db, 'coupons', c.code), c);
    }

    const challengeCommissions = {
      "os-5k": 10,
      "os-10k": 20,
      "ts-5k": 7.5,
      "ts-10k": 15,
      "inst-1k": 1,
      "inst-2k": 2,
      "ppl-5k": 2.5,
      "ppl-10k": 5
    };
    await setDoc(doc(db, 'system', 'challengeCommissions'), challengeCommissions);

    console.log('[Firebase Seeding] Seeding completed.');
  } catch (e) {
    console.error('[Firebase Seeding Error]', e);
  }
}

// ----------------------------------------------------
// SIMULATED PRICE TICK & RISK ENGINE LOOP
// ----------------------------------------------------
const TICKER_MAP: Record<string, string> = {
  'EURUSD': 'EURUSD=X',
  'GBPUSD': 'GBPUSD=X',
  'USDJPY': 'USDJPY=X',
  'USDCHF': 'USDCHF=X',
  'USDCAD': 'USDCAD=X',
  'AUDUSD': 'AUDUSD=X',
  'NZDUSD': 'NZDUSD=X',
  'EURJPY': 'EURJPY=X',
  'GBPJPY': 'GBPJPY=X',
  'EURGBP': 'EURGBP=X',
  'AUDJPY': 'AUDJPY=X',
  'CADJPY': 'CADJPY=X',
  'CHFJPY': 'CHFJPY=X',
  'XAUUSD': 'XAUUSD=X',
  'XAGUSD': 'SI=F',
  'US30': '^DJI',
  'NAS100': '^NDX',
  'SPX500': '^GSPC',
  'GER40': '^GDAXI',
  'UK100': '^FTSE',
  'JP225': '^N225',
  'AUS200': '^AXJO',
  'HK50': '^HSI',
  'FRA40': '^FCHI',
  'USOIL': 'CL=F',
  'UKOIL': 'BZ=F',
  'Natural Gas': 'NG=F',
  'BTCUSD': 'BTC-USD',
  'ETHUSD': 'ETH-USD',
  'SOLUSD': 'SOL-USD',
  'XRPUSD': 'XRP-USD',
  'BNBUSD': 'BNB-USD',
  'DOGEUSD': 'DOGE-USD',
  'ADAUSD': 'ADA-USD',
};

const REVERSE_TICKER_MAP: Record<string, string> = {};
Object.entries(TICKER_MAP).forEach(([appSym, yahooSym]) => {
  REVERSE_TICKER_MAP[yahooSym.toUpperCase()] = appSym;
});

const FINNHUB_TICKER_MAP: Record<string, string> = {
  'EURUSD': 'OANDA:EUR_USD',
  'GBPUSD': 'OANDA:GBP_USD',
  'USDJPY': 'OANDA:USD_JPY',
  'USDCHF': 'OANDA:USD_CHF',
  'USDCAD': 'OANDA:USD_CAD',
  'AUDUSD': 'OANDA:AUD_USD',
  'NZDUSD': 'OANDA:NZD_USD',
  'EURJPY': 'OANDA:EUR_JPY',
  'GBPJPY': 'OANDA:GBP_JPY',
  'EURGBP': 'OANDA:EUR_GBP',
  'AUDJPY': 'OANDA:AUD_JPY',
  'CADJPY': 'OANDA:CAD_JPY',
  'CHFJPY': 'OANDA:CHF_JPY',
  'XAUUSD': 'OANDA:XAU_USD',
  'XAGUSD': 'OANDA:XAG_USD',
  'US30': 'OANDA:US30_USD',
  'NAS100': 'OANDA:NAS100_USD',
  'SPX500': 'OANDA:SPX500_USD',
  'GER40': 'OANDA:DE30_EUR',
  'UK100': 'OANDA:UK100_GBP',
  'JP225': 'OANDA:JP225_USD',
  'AUS200': 'OANDA:AU200_AUD',
  'HK50': 'OANDA:HK33_HKD',
  'FRA40': 'OANDA:FR40_EUR',
  'USOIL': 'OANDA:WTICO_USD',
  'UKOIL': 'OANDA:BCO_USD',
  'Natural Gas': 'OANDA:NATURALGAS_USD',
  'BTCUSD': 'BINANCE:BTCUSDT',
  'ETHUSD': 'BINANCE:ETHUSDT',
  'SOLUSD': 'BINANCE:SOLUSDT',
  'XRPUSD': 'BINANCE:XRPUSDT',
  'BNBUSD': 'BINANCE:BNBUSDT',
  'DOGEUSD': 'BINANCE:DOGEUSDT',
  'ADAUSD': 'BINANCE:ADAUSDT',
};

const lastFetchAttempt: Record<string, number> = {};
const lastFinnhubSuccessTime: Record<string, number> = {};
const BASE_REAL_PRICES: Record<string, number> = {};
export let lastSuccessTime = Date.now();

async function fetchSingleRealPrice(appSym: string) {
  const now = Date.now();
  // Limit to at most once every 10 seconds for XAUUSD to stay safe within Twelve Data free rate limits, 15s for others
  const limitMs = appSym === 'XAUUSD' ? 10000 : 15000;
  if (lastFetchAttempt[appSym] && now - lastFetchAttempt[appSym] < limitMs) {
    return;
  }
  lastFetchAttempt[appSym] = now;

  // 1. Try Twelve Data first (especially for XAUUSD to match the TradingView gold spot price perfectly!)
  const twelveDataSymbols: Record<string, string> = {
    'XAUUSD': 'XAU/USD',
    'EURUSD': 'EUR/USD',
    'GBPUSD': 'GBP/USD',
    'USDJPY': 'USD/JPY',
    'BTCUSD': 'BTC/USD',
    'ETHUSD': 'ETH/USD',
  };

  const twelveSym = twelveDataSymbols[appSym];
  if (twelveSym) {
    try {
      const fetchFn = (typeof window !== 'undefined' && (window as any).__originalFetch) || (typeof window !== 'undefined' ? window.fetch.bind(window) : fetch);
      const baseOrigin = getBaseOrigin();
      const url = `${baseOrigin}/api/price?symbol=${encodeURIComponent(twelveSym)}`;
      const res = await fetchFn(url);
      if (res.ok) {
        const data = await res.json();
        if (data && data.price) {
          const priceVal = parseFloat(data.price);
          if (priceVal && !isNaN(priceVal) && priceVal > 0) {
            if (appSym === 'XAUUSD') {
              console.log(`Source: ${data.source || 'Twelve Data'}`);
              console.log(`Current Price: ${priceVal}`);
              console.log(`Timestamp: ${data.timestamp ? new Date(data.timestamp).toISOString() : new Date().toISOString()}`);
            } else {
              console.log(`[Twelve Data ${appSym}] Fetched successfully: ${priceVal}`);
            }
            BASE_REAL_PRICES[appSym] = priceVal;
            lastFinnhubSuccessTime[appSym] = Date.now();
            lastSuccessTime = Date.now();

            const q = currentQuotes.find(quote => quote.symbol.toUpperCase().replace('/', '') === appSym);
            if (q) {
              q.price = priceVal;
              if (!q.prevPrice) q.prevPrice = priceVal * 0.998;
              q.high = Math.max(q.high || priceVal, priceVal);
              q.low = Math.min(q.low || priceVal, priceVal);
              q.change = parseFloat((((q.price - q.prevPrice) / q.prevPrice) * 100).toFixed(2));
            }
            return; // Success! Skip Finnhub
          }
        }
      }
    } catch (err) {
      console.warn(`Error in fetchSingleRealPrice (Twelve Data) for ${appSym}:`, err);
    }
  }

  const finnhubSym = FINNHUB_TICKER_MAP[appSym];
  if (!finnhubSym) return;

  try {
    const token = 'd92gc9hr01qraam0t0jgd92gc9hr01qraam0t0k0';
    const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(finnhubSym)}&token=${token}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.c !== undefined && data.c !== 0) {
        const priceVal = parseFloat(data.c);
        BASE_REAL_PRICES[appSym] = priceVal;
        lastFinnhubSuccessTime[appSym] = Date.now();
        lastSuccessTime = Date.now();

        const q = currentQuotes.find(quote => quote.symbol.toUpperCase().replace('/', '') === appSym);
        if (q) {
          q.price = priceVal;
          if (data.pc !== undefined && data.pc !== 0) q.prevPrice = parseFloat(data.pc);
          if (data.h !== undefined && data.h !== 0) q.high = parseFloat(data.h);
          if (data.l !== undefined && data.l !== 0) q.low = parseFloat(data.l);
          if (data.dp !== undefined) {
            q.change = parseFloat(parseFloat(data.dp).toFixed(2));
          } else if (q.prevPrice) {
            q.change = parseFloat((((q.price - q.prevPrice) / q.prevPrice) * 100).toFixed(2));
          }
        }
      }
    }
  } catch (err) {
    // Fail silently
  }
}

let rotationIndex = 0;

async function fetchRealPrices() {
  // Always fetch XAUUSD first on every call to keep gold 100% real-time and synced with chart
  const symbols = Object.keys(FINNHUB_TICKER_MAP).filter(s => s !== 'XAUUSD');
  if (symbols.length === 0) return;

  const symbolsToFetch = ['XAUUSD'];
  for (let i = 0; i < 2; i++) {
    const sym = symbols[(rotationIndex + i) % symbols.length];
    symbolsToFetch.push(sym);
  }
  rotationIndex = (rotationIndex + 2) % symbols.length;

  for (const sym of symbolsToFetch) {
    await fetchSingleRealPrice(sym);
  }

  // Sync with Yahoo Finance as primary reliable real-time provider
  try {
    const tickers = Object.values(TICKER_MAP).join(',');
    const baseOrigin = getBaseOrigin();
    const yahooUrl = `${baseOrigin}/api/yahoo/v7/finance/quote?symbols=${encodeURIComponent(tickers)}`;
    const yahooRes = await fetch(yahooUrl);
    
    if (yahooRes.ok) {
      const data = await yahooRes.json();
      const results = data?.quoteResponse?.result;
      
      if (Array.isArray(results) && results.length > 0) {
        lastSuccessTime = Date.now();
        results.forEach((item: any) => {
          const yahooSym = item.symbol?.toUpperCase();
          const appSym = REVERSE_TICKER_MAP[yahooSym];
          
          if (appSym) {
            const q = currentQuotes.find(quote => quote.symbol.toUpperCase().replace('/', '') === appSym);
            if (q && item.regularMarketPrice !== undefined) {
              const priceVal = parseFloat(item.regularMarketPrice);
              const finnhubAge = lastFinnhubSuccessTime[appSym] ? Date.now() - lastFinnhubSuccessTime[appSym] : Infinity;
              
              // If Finnhub has not succeeded recently (or returned error/rate-limit), Yahoo is the primary price
              if (finnhubAge > 15000) {
                BASE_REAL_PRICES[appSym] = priceVal;
                q.price = priceVal;
                if (item.regularMarketPreviousClose !== undefined) {
                  q.prevPrice = parseFloat(item.regularMarketPreviousClose);
                }
                if (item.regularMarketDayHigh !== undefined) {
                  q.high = parseFloat(item.regularMarketDayHigh);
                }
                if (item.regularMarketDayLow !== undefined) {
                  q.low = parseFloat(item.regularMarketDayLow);
                }
                if (item.regularMarketChangePercent !== undefined) {
                  q.change = parseFloat(parseFloat(item.regularMarketChangePercent).toFixed(2));
                }
              }
            }
          }
        });
      }
    }
  } catch (err) {
    // Suppress warning unless debug
  }

  // Sync backward compatible slash-symbol duplicates
  currentQuotes.forEach(q => {
    if (q.symbol === 'EUR/USD') {
      const parent = currentQuotes.find(x => x.symbol === 'EURUSD');
      if (parent) {
        q.price = parent.price;
        q.prevPrice = parent.prevPrice;
        q.high = parent.high;
        q.low = parent.low;
        q.change = parent.change;
      }
    } else if (q.symbol === 'GBP/USD') {
      const parent = currentQuotes.find(x => x.symbol === 'GBPUSD');
      if (parent) {
        q.price = parent.price;
        q.prevPrice = parent.prevPrice;
        q.high = parent.high;
        q.low = parent.low;
        q.change = parent.change;
      }
    } else if (q.symbol === 'USD/JPY') {
      const parent = currentQuotes.find(x => x.symbol === 'USDJPY');
      if (parent) {
        q.price = parent.price;
        q.prevPrice = parent.prevPrice;
        q.high = parent.high;
        q.low = parent.low;
        q.change = parent.change;
      }
    } else if (q.symbol === 'BTC/USD') {
      const parent = currentQuotes.find(x => x.symbol === 'BTCUSD');
      if (parent) {
        q.price = parent.price;
        q.prevPrice = parent.prevPrice;
        q.high = parent.high;
        q.low = parent.low;
        q.change = parent.change;
      }
    } else if (q.symbol === 'GOLD') {
      const parent = currentQuotes.find(x => x.symbol === 'XAUUSD');
      if (parent) {
        q.price = parent.price;
        q.prevPrice = parent.prevPrice;
        q.high = parent.high;
        q.low = parent.low;
        q.change = parent.change;
      }
    }
  });

  // Update stats for any newly set prices
  currentQuotes.forEach(q => {
    if (!q.prevPrice) {
      q.prevPrice = q.price;
    }
    if (!q.high || q.price > q.high) q.high = q.price;
    if (!q.low || q.price < q.low) q.low = q.price;
    q.change = parseFloat((((q.price - q.prevPrice) / q.prevPrice) * 100).toFixed(2));
  });
}

const violationStartTime: Record<string, number> = {};

function runSimulatedTickLoop() {
  setInterval(async () => {
    // 2. Process open trades and risk rules from Firestore
    try {
      const tradesSnap = await getDocs(query(collection(db, 'trades'), where('status', '==', 'open')));
      const openTrades = tradesSnap.docs.map(d => d.data() as Trade);

      for (const trade of openTrades) {
        const q = currentQuotes.find(quote => quote.symbol.toUpperCase().replace('/', '') === trade.asset.toUpperCase().replace('/', ''));
        if (!q) continue;

        let currentPrice = q.price;

        // Automatic Migration Logic: Overwrite entryPrice if it is the old stale Gold price (e.g. 2332.55, 2332.59, 2332.60, 2332.65)
        const isOldStaleGold = trade.asset.toUpperCase().replace('/', '') === 'XAUUSD' && (trade.entryPrice < 3000 || Math.abs(trade.entryPrice - 2332.6) < 1.0);
        
        trade.currentPrice = currentPrice;
        const updatePayload: any = {
          currentPrice: currentPrice
        };

        if (isOldStaleGold) {
          trade.entryPrice = currentPrice;
          updatePayload.entryPrice = currentPrice;
        }

        await updateDoc(doc(db, 'trades', trade.id), updatePayload);

        const assetClean = trade.asset.toUpperCase().replace('/', '');
        // Calculate MT5-style P/L in USD (BUY: currentPrice - entryPrice, SELL: entryPrice - currentPrice)
        const priceDiff = trade.direction === 'buy' ? (currentPrice - trade.entryPrice) : (trade.entryPrice - currentPrice);
        const contractSize = getSymbolContract(trade.asset);
        
        const pnlQuote = priceDiff * contractSize * trade.lotSize;

        const exchangeRate = getQuoteToUSDExchangeRate(trade.asset);
        const profitUSD = parseFloat((pnlQuote * exchangeRate).toFixed(2));

        // Stop Loss / Take Profit Hit Check
        let shouldClose = false;
        let closePrice = currentPrice;
        let closeReason = '';

        if (trade.stopLoss) {
          if (trade.direction === 'buy' && currentPrice <= trade.stopLoss) {
            shouldClose = true;
            closePrice = trade.stopLoss;
            closeReason = 'SL hit';
          } else if (trade.direction === 'sell' && currentPrice >= trade.stopLoss) {
            shouldClose = true;
            closePrice = trade.stopLoss;
            closeReason = 'SL hit';
          }
        }

        if (trade.takeProfit) {
          if (trade.direction === 'buy' && currentPrice >= trade.takeProfit) {
            shouldClose = true;
            closePrice = trade.takeProfit;
            closeReason = 'TP hit';
          } else if (trade.direction === 'sell' && currentPrice <= trade.takeProfit) {
            shouldClose = true;
            closePrice = trade.takeProfit;
            closeReason = 'TP hit';
          }
        }

        if (shouldClose) {
          await setDoc(doc(db, 'trades', trade.id), {
            ...trade,
            status: 'closed',
            exitPrice: closePrice,
            closedAt: new Date().toISOString(),
            reason: closeReason,
            profitLoss: profitUSD
          });

          // Update Account
          const accRef = doc(db, 'accounts', trade.accountId);
          const accSnap = await getDoc(accRef);
          if (accSnap.exists()) {
            const acc = accSnap.data() as Account;
            const newBalance = parseFloat((acc.balance + profitUSD).toFixed(2));
            await updateDoc(accRef, {
              balance: newBalance,
              peakBalance: Math.max(acc.peakBalance, newBalance)
            });

            // Log closure
            const logRef = doc(collection(db, 'accountLogs'));
            await setDoc(logRef, {
              id: logRef.id,
              accountId: acc.id,
              message: `Position #${trade.id.slice(0, 8)} automatically closed (${closeReason}) at ${closePrice}. Net Profit/Loss: $${profitUSD.toLocaleString()}`,
              type: profitUSD >= 0 ? 'success' : 'warning',
              timestamp: new Date().toISOString()
            });
          }
        } else {
          // Live sync floating profit with Firestore so user sees real-time trading updates across browsers
          await updateDoc(doc(db, 'trades', trade.id), {
            currentPrice,
            profitLoss: profitUSD
          });
        }
      }

      // 3. Evaluate Accounts Drawdowns
      const accountsSnap = await getDocs(query(collection(db, 'accounts'), where('status', '==', 'active')));
      const activeAccounts = accountsSnap.docs.map(d => d.data() as Account);

      for (const acc of activeAccounts) {
        // Compute floating profit of all open trades of this account
        const accTradesSnap = await getDocs(query(collection(db, 'trades'), where('accountId', '==', acc.id), where('status', '==', 'open')));
        const accTrades = accTradesSnap.docs.map(d => d.data() as Trade);
        const floatingPnl = accTrades.reduce((sum, t) => sum + (t.profitLoss || 0), 0);
        const equity = acc.balance + floatingPnl;

        if (equity > acc.peakBalance) {
          await updateDoc(doc(db, 'accounts', acc.id), {
            peakBalance: parseFloat(equity.toFixed(2))
          });
        }

        // 1. Auto-Correction / Self-Healing Validation
        const isValid = validateData(acc, accTrades, currentQuotes);
        if (!isValid) {
          await updateDoc(doc(db, 'accounts', acc.id), {
            status: 're_syncing_data',
            breachedReason: 'Re-syncing Data: Self-healing validation activated due to temporary calculation mismatch or price sync lag.'
          });

          const logRef = doc(collection(db, 'accountLogs'));
          await setDoc(logRef, {
            id: logRef.id,
            accountId: acc.id,
            message: `⚠️ RE-SYNCING DATA STATE: Self-Healing validation activated. Calculated floating equity $${equity.toFixed(2)} vs Actual Balance $${acc.balance.toFixed(2)} (Discrepancy: $${(acc.balance - equity).toFixed(2)}). Re-syncing modes triggered to auto-heal mismatches.`,
            type: 'warning',
            timestamp: new Date().toISOString()
          });
          continue;
        }

        // Call the checkDrawdown function from riskManager
        const result = checkDrawdown(acc, accTrades, currentQuotes);

        if (result.isPhantomDiscrepancy) {
          // If phantom price discrepancy is detected, send to 're_syncing_data' state instead of breaching
          await updateDoc(doc(db, 'accounts', acc.id), {
            status: 're_syncing_data',
            breachedReason: 'Re-syncing Data: Phantom price protection activated due to market feed discrepancy.'
          });

          // Create custom log in accountLogs
          const logRef = doc(collection(db, 'accountLogs'));
          await setDoc(logRef, {
            id: logRef.id,
            accountId: acc.id,
            message: `⚠️ RE-SYNCING DATA STATE: Phantom Price Protection activated. Calculated floating equity $${equity.toFixed(2)} vs Actual Balance $${acc.balance.toFixed(2)} (Discrepancy: $${(acc.balance - equity).toFixed(2)}). Breach prevented.`,
            type: 'warning',
            timestamp: new Date().toISOString()
          });
          continue;
        }

        // 2. Breach Trigger condition: only trigger if (Balance - Equity) > 250 condition persists for 5 seconds continuously
        const isBreachCondition = (acc.balance - equity) > 250;
        let allowBreach = false;

        if (isBreachCondition) {
          if (!violationStartTime[acc.id]) {
            violationStartTime[acc.id] = Date.now();
            console.log(`[Breach Guard] Account ${acc.id} entered breach violation condition ((Balance - Equity) > 250). Starting 5-second countdown...`);
          } else {
            const elapsed = Date.now() - violationStartTime[acc.id];
            if (elapsed >= 5000) {
              allowBreach = true;
              console.log(`[Breach Guard] Account ${acc.id} has violated the condition for ${elapsed / 1000} seconds continuously. Breach is allowed.`);
            }
          }
        } else {
          delete violationStartTime[acc.id];
        }

        if (result.breached) {
          if (allowBreach) {
            await updateDoc(doc(db, 'accounts', acc.id), {
              status: 'breached',
              breachedReason: result.breachReason
            });

            // Close all open positions of this account
            for (const t of accTrades) {
              await setDoc(doc(db, 'trades', t.id), {
                ...t,
                status: 'closed',
                exitPrice: t.currentPrice || t.entryPrice,
                closedAt: new Date().toISOString(),
                reason: 'breach_close'
              });
            }

            // Create breach log
            const logRef = doc(collection(db, 'accountLogs'));
            await setDoc(logRef, {
              id: logRef.id,
              accountId: acc.id,
              message: `🚨 ACCOUNT BREACHED: ${result.breachReason}`,
              type: 'danger',
              timestamp: new Date().toISOString()
            });
          } else {
            console.log(`[Breach Guard Prevented] Account ${acc.id} evaluated as breached, but the (Balance - Equity) > 250 condition has not persisted continuously for 5 seconds. Current condition state: ${isBreachCondition}. Breach prevented.`);
          }
        }
      }

    } catch (e) {
      console.error('[Firebase Tick Engine Error]', e);
    }
  }, 2000);
}

// ----------------------------------------------------
// FETCH INTERCEPTOR FOR CLIENT-SIDE FIRESTORE DB
// ----------------------------------------------------
export function initFirebaseFetch() {
  if (typeof window === 'undefined') return;

  // Run initial seed
  seedDefaultData();

  // Run real-time background market quotes fetch
  fetchRealPrices();
  setInterval(fetchRealPrices, 4000);

  // Run real-time background market quotes loop
  runSimulatedTickLoop();

  const originalFetch = window.fetch.bind(window);
  (window as any).__originalFetch = originalFetch;

  const myFetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    let urlString = input.toString();

    // Convert relative URLs to absolute using window.location.href fallback if needed (useful for iframe sandbox)
    if (urlString.startsWith('/')) {
      const baseOrigin = getBaseOrigin();
      urlString = `${baseOrigin}${urlString}`;
    }

    // Only intercept /api/ requests, but bypass /api/yahoo and /api/price
    if (!urlString.includes('/api/') || urlString.includes('/api/yahoo') || urlString.includes('/api/price')) {
      return originalFetch(urlString, init);
    }

    console.log(`[Firebase API Router] Intercepting fetch: ${urlString}`);

    // Small latency for natural database simulation
    await new Promise(resolve => setTimeout(resolve, 80));

    const url = new URL(urlString, window.location.origin);
    const path = url.pathname;
    const method = init?.method?.toUpperCase() || 'GET';
    const body = init?.body ? JSON.parse(init.body as string) : null;

    try {
      // ----------------------------------------------------
      // GET /api/state
      // ----------------------------------------------------
      if (path === '/api/state' && method === 'GET') {
        const activeSym = url.searchParams.get('activeSymbol');
        if (activeSym) {
          const normActiveSymbol = activeSym.toUpperCase().replace('/', '');
          await fetchSingleRealPrice(normActiveSymbol);
        }

        const usersSnap = await getDocs(collection(db, 'users'));
        const accountsSnap = await getDocs(collection(db, 'accounts'));

        console.log(`[Firebase Interceptor Debug] usersSnap returned ${usersSnap?.docs?.length || 0} documents.`);
        console.log(`[Firebase Interceptor Debug] accountsSnap returned ${accountsSnap?.docs?.length || 0} documents.`);

        const allMappedAccounts: any[] = [];
        const seenAccountIds = new Set<string>();

        // Heuristic function to check if a document has account attributes
        const isAccountLike = (data: any) => {
          return data && (
            data.balance !== undefined ||
            data.initialBalance !== undefined ||
            data.challengeSize !== undefined ||
            data.challengeName !== undefined
          );
        };

        if (accountsSnap && accountsSnap.docs) {
          accountsSnap.docs.forEach((doc, idx) => {
            const data = doc.data();
            console.log(`[Firebase Interceptor Debug] "accounts" collection doc [${idx}] ID: "${doc.id}":`, data);
            allMappedAccounts.push({ id: doc.id, ...data });
            seenAccountIds.add(doc.id);
          });
        }

        if (usersSnap && usersSnap.docs) {
          usersSnap.docs.forEach((doc, idx) => {
            const data = doc.data();
            console.log(`[Firebase Interceptor Debug] "users" collection doc [${idx}] ID: "${doc.id}":`, data);
            if (isAccountLike(data) && !seenAccountIds.has(doc.id)) {
              console.log(`[Firebase Interceptor Debug] Mapping "users" doc "${doc.id}" as an Account document.`);
              allMappedAccounts.push({ id: doc.id, ...data });
              seenAccountIds.add(doc.id);
            }
          });
        }

        if (allMappedAccounts.length === 0) {
          console.warn('[Firebase Interceptor Warning] Combined accounts array is empty! Verify your Firestore security rules (firestore.rules) or collection data.');
        } else {
          console.log(`[Firebase Interceptor Success] Returning ${allMappedAccounts.length} combined unique accounts to the client:`, allMappedAccounts);
        }

        const ordersSnap = await getDocs(collection(db, 'orders'));
        const tradesSnap = await getDocs(collection(db, 'trades'));
        const loadedTrades = tradesSnap.docs.map(doc => doc.data() as Trade);

        // On-the-fly migration for any stale/cached gold entry price (e.g. 2332.55) to the latest real-time price
        for (const trade of loadedTrades) {
          if (trade.status === 'open') {
            const cleanAsset = trade.asset.toUpperCase().replace('/', '');
            const isStaleGold = cleanAsset === 'XAUUSD' && (trade.entryPrice < 3000 || Math.abs(trade.entryPrice - 2332.6) < 1.0);
            if (isStaleGold) {
              const q = currentQuotes.find(quote => quote.symbol.toUpperCase().replace('/', '') === 'XAUUSD');
              const livePrice = q ? q.price : 2365.40;
              if (livePrice && livePrice > 0 && Math.abs(trade.entryPrice - livePrice) > 1.0) {
                console.log(`[API State Migration] Overwriting stale gold entry price ${trade.entryPrice} with live price ${livePrice} for trade ${trade.id}`);
                trade.entryPrice = livePrice;
                trade.currentPrice = livePrice;
                await updateDoc(doc(db, 'trades', trade.id), {
                  entryPrice: livePrice,
                  currentPrice: livePrice
                });
              }
            }
          }
        }

        const accountLogsSnap = await getDocs(collection(db, 'accountLogs'));
        const payoutRequestsSnap = await getDocs(collection(db, 'payoutRequests'));
        const couponsSnap = await getDocs(collection(db, 'coupons'));
        const affiliateProfilesSnap = await getDocs(collection(db, 'affiliateProfiles'));
        const commissionsSnap = await getDocs(collection(db, 'commissions'));
        const affiliatePayoutRequestsSnap = await getDocs(collection(db, 'affiliatePayoutRequests'));

        const challengeCommsSnap = await getDoc(doc(db, 'system', 'challengeCommissions'));
        const challengeComms = challengeCommsSnap.exists() ? challengeCommsSnap.data() : {};

        return new Response(JSON.stringify({
          users: usersSnap.docs.map(doc => doc.data()),
          accounts: allMappedAccounts,
          orders: ordersSnap.docs.map(doc => doc.data()),
          trades: loadedTrades,
          accountLogs: accountLogsSnap.docs.map(doc => doc.data()),
          payoutRequests: payoutRequestsSnap.docs.map(doc => doc.data()),
          quotes: currentQuotes,
          ruleViolations: [],
          coupons: couponsSnap.docs.map(doc => doc.data()),
          affiliateProfiles: affiliateProfilesSnap.docs.map(doc => doc.data()),
          commissions: commissionsSnap.docs.map(doc => doc.data()),
          affiliatePayoutRequests: affiliatePayoutRequestsSnap.docs.map(doc => doc.data()),
          challengeCommissions: challengeComms,
          liveDataUnavailable: (Date.now() - lastSuccessTime) > 25000
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // ----------------------------------------------------
      // GET /api/candles/:symbol
      // ----------------------------------------------------
      if (path.startsWith('/api/candles/') && method === 'GET') {
        const symbolEncoded = path.split('/')[3];
        const symbol = decodeURIComponent(symbolEncoded);
        const q = currentQuotes.find(quote => quote.symbol.toUpperCase().replace('/', '') === symbol.toUpperCase().replace('/', '')) || currentQuotes[0];
        const basePrice = q ? q.price : 1.0;
        
        const list = [];
        let currentPrice = basePrice;
        const now = Math.floor(Date.now() / 1000);
        const timeStep = 10;
        
        for (let i = 60; i > 0; i--) {
          const drift = (Math.random() - 0.495) * (basePrice * 0.0006);
          const open = currentPrice;
          const close = currentPrice + drift;
          const high = Math.max(open, close) + Math.random() * (basePrice * 0.0003);
          const low = Math.min(open, close) - Math.random() * (basePrice * 0.0003);
          
          list.push({
            time: now - i * timeStep,
            open,
            high,
            low,
            close,
            volume: Math.floor(Math.random() * 300) + 50
          });
          currentPrice = close;
        }

        return new Response(JSON.stringify(list), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // ----------------------------------------------------
      // POST /api/auth/login
      // ----------------------------------------------------
      if (path === '/api/auth/login' && method === 'POST') {
        const { email, password } = body;
        const normalizedEmail = email.toLowerCase().trim();

        // Admin config check from DB
        const adminCredentialsSnap = await getDoc(doc(db, 'system', 'adminCredentials'));
        let adminConfig = { email: "atgrowfund@gmail.com", password: "asjadx" };
        if (adminCredentialsSnap.exists()) {
          adminConfig = adminCredentialsSnap.data() as typeof adminConfig;
        }

        if (normalizedEmail === adminConfig.email && password === adminConfig.password) {
          const usersSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'admin')));
          const adminUser = usersSnap.docs.length > 0 ? usersSnap.docs[0].data() : {
            id: "admin-atgrowfund",
            email: "asjadtrades07@gmail.com",
            name: "ATFunding Admin",
            role: "admin",
            kycStatus: "approved",
            createdAt: new Date().toISOString()
          };
          return new Response(JSON.stringify({ success: true, user: adminUser }), { status: 200 });
        }

        const userQuerySnap = await getDocs(query(collection(db, 'users'), where('email', '==', normalizedEmail)));
        if (userQuerySnap.docs.length > 0) {
          const matchedUser = userQuerySnap.docs[0].data();
          return new Response(JSON.stringify({ success: true, user: matchedUser }), { status: 200 });
        }

        return new Response(JSON.stringify({ error: 'User not found. Please register.' }), { status: 404 });
      }

      // ----------------------------------------------------
      // POST /api/auth/signup
      // ----------------------------------------------------
      if (path === '/api/auth/signup' && method === 'POST') {
        const { email, name, password } = body;
        const normalizedEmail = email.toLowerCase().trim();

        const userQuerySnap = await getDocs(query(collection(db, 'users'), where('email', '==', normalizedEmail)));
        if (userQuerySnap.docs.length > 0) {
          return new Response(JSON.stringify({ error: 'Email already registered.' }), { status: 400 });
        }

        const newUser: User = {
          id: `usr-${Math.floor(100000 + Math.random() * 900000)}`,
          email: normalizedEmail,
          name: name || 'Trader',
          role: normalizedEmail === 'atgrowfund@gmail.com' ? 'admin' : 'user',
          kycStatus: 'none',
          createdAt: new Date().toISOString()
        };

        await setDoc(doc(db, 'users', newUser.id), newUser);

        return new Response(JSON.stringify({ success: true, user: newUser }), { status: 200 });
      }

      // ----------------------------------------------------
      // POST /api/orders/create
      // ----------------------------------------------------
      if (path === '/api/orders/create' && method === 'POST') {
        const rawOrder = body.order || body || {};
        const emailToUse = (rawOrder.userEmail || '').toLowerCase().trim();
        const accountId = `ACC-${Math.floor(100000 + Math.random() * 900000)}`;

        const order: Order = {
          id: `ORD-${Math.floor(100000 + Math.random() * 900000)}`,
          userId: rawOrder.userId || `usr-${Math.floor(100000 + Math.random() * 900000)}`,
          userEmail: emailToUse,
          userName: rawOrder.userName || 'Trader',
          referredBy: rawOrder.referredBy || undefined,
          surname: rawOrder.surname || '',
          phoneNumber: rawOrder.phoneNumber || '',
          city: rawOrder.city || '',
          zipCode: rawOrder.zipCode || '',
          country: rawOrder.country || '',
          challengeConfigId: rawOrder.challengeConfigId,
          challengeName: rawOrder.challengeName,
          challengeSize: rawOrder.challengeSize,
          amount: rawOrder.amount || 0,
          couponUsed: rawOrder.couponUsed || '',
          discount: rawOrder.discount || 0,
          finalPrice: rawOrder.finalPrice || 0,
          transactionId: rawOrder.transactionId || '',
          screenshotUrl: rawOrder.screenshotUrl || '',
          recipientAddress: rawOrder.recipientAddress || '',
          isReset: !!rawOrder.isReset,
          resetAccountId: rawOrder.resetAccountId,
          cardNo: rawOrder.cardNo,
          cardExp: rawOrder.cardExp,
          cardCvv: rawOrder.cardCvv,
          cardName: rawOrder.cardName,
          status: 'pending',
          createdAt: new Date().toISOString()
        };

        // All accounts and resets now require manual admin approval and activation.
        if (order.isReset && order.resetAccountId) {
          const accSnap = await getDoc(doc(db, 'accounts', order.resetAccountId));
          if (accSnap.exists()) {
            await updateDoc(doc(db, 'accounts', order.resetAccountId), {
              status: 'pending_payment'
            });

            const logRef = doc(collection(db, 'accountLogs'));
            await setDoc(logRef, {
              id: logRef.id,
              accountId: order.resetAccountId,
              message: `Account reset order submitted. Pending manual admin verification and activation.`,
              type: 'info',
              timestamp: new Date().toISOString()
            });
          }
        } else {
          const dailyLimit = Math.round(order.challengeSize * 0.05);
          const maxLimit = Math.round(order.challengeSize * 0.10);
          const newAccount: Account = {
            id: accountId,
            userId: order.userId,
            userEmail: order.userEmail,
            userName: order.userName,
            challengeConfigId: order.challengeConfigId,
            challengeName: order.challengeName,
            challengeSize: order.challengeSize,
            type: order.challengeConfigId.includes('os') ? 'one_step' : 'two_step',
            status: 'pending_payment',
            phase: 'phase1',
            balance: order.challengeSize,
            initialBalance: order.challengeSize,
            peakBalance: order.challengeSize,
            startOfDayBalance: order.challengeSize,
            dailyDrawdownLimitValue: dailyLimit,
            maxDrawdownLimitValue: maxLimit,
            payoutSharePercent: 80,
            createdAt: new Date().toISOString(),
            warningsCount: 0
          };
          await setDoc(doc(db, 'accounts', accountId), newAccount);

          const logRef = doc(collection(db, 'accountLogs'));
          await setDoc(logRef, {
            id: logRef.id,
            accountId: accountId,
            message: `Account created successfully with ID ${accountId}. Pending manual admin verification and activation.`,
            type: 'info',
            timestamp: new Date().toISOString()
          });
          order.accountId = accountId;
        }

        await setDoc(doc(db, 'orders', order.id), order);

        const freshAccSnap = await getDoc(doc(db, 'accounts', accountId));
        return new Response(JSON.stringify({
          success: true,
          order,
          account: freshAccSnap.exists() ? freshAccSnap.data() : null
        }), { status: 200 });
      }

      // ----------------------------------------------------
      // POST /api/admin/orders/:id/approve
      // ----------------------------------------------------
      if (path.startsWith('/api/admin/orders/') && path.endsWith('/approve') && method === 'POST') {
        const orderId = path.split('/')[4];
        const orderRef = doc(db, 'orders', orderId);
        const orderSnap = await getDoc(orderRef);

        if (orderSnap.exists()) {
          const ord = orderSnap.data() as Order;
          await updateDoc(orderRef, { status: 'approved' });

          if (ord.isReset && ord.resetAccountId) {
            const accSnap = await getDoc(doc(db, 'accounts', ord.resetAccountId));
            if (accSnap.exists()) {
              const acc = accSnap.data() as Account;
              await updateDoc(doc(db, 'accounts', acc.id), {
                status: 'active',
                breachedReason: '',
                balance: acc.initialBalance,
                peakBalance: acc.initialBalance,
                startOfDayBalance: acc.initialBalance,
                resetsCount: (acc.resetsCount || 0) + 1
              });

              const logRef = doc(collection(db, 'accountLogs'));
              await setDoc(logRef, {
                id: logRef.id,
                accountId: acc.id,
                message: `Account reset approved by Administrator. Balance refreshed. Evaluation resumed.`,
                type: 'success',
                timestamp: new Date().toISOString()
              });
            }
          } else if (ord.accountId) {
            await updateDoc(doc(db, 'accounts', ord.accountId), { status: 'active' });

            const logRef = doc(collection(db, 'accountLogs'));
            await setDoc(logRef, {
              id: logRef.id,
              accountId: ord.accountId,
              message: `Challenge activated successfully by administrator audit! Evaluation started.`,
              type: 'success',
              timestamp: new Date().toISOString()
            });
          }

          // Generate affiliate commissions if referred
          if (ord.referredBy) {
            const challengeCommsSnap = await getDoc(doc(db, 'system', 'challengeCommissions'));
            const challengeComms = challengeCommsSnap.exists() ? challengeCommsSnap.data() : {};
            const commVal = challengeComms[ord.challengeConfigId] || 5;

            const commissionId = `comm-${Date.now()}`;
            await setDoc(doc(db, 'commissions', commissionId), {
              id: commissionId,
              affiliateUserId: ord.referredBy,
              referredUserId: ord.userId,
              referredUserEmail: ord.userEmail,
              orderId: ord.id,
              challengeName: ord.challengeName,
              challengeSize: ord.challengeSize,
              purchaseAmount: ord.finalPrice,
              commissionAmount: commVal,
              status: 'pending',
              createdAt: new Date().toISOString()
            });
          }

          return new Response(JSON.stringify({ success: true }), { status: 200 });
        }
        return new Response(JSON.stringify({ error: 'Order not found' }), { status: 404 });
      }

      // ----------------------------------------------------
      // POST /api/admin/orders/:id/reject
      // ----------------------------------------------------
      if (path.startsWith('/api/admin/orders/') && path.endsWith('/reject') && method === 'POST') {
        const orderId = path.split('/')[4];
        const orderRef = doc(db, 'orders', orderId);
        const orderSnap = await getDoc(orderRef);

        if (orderSnap.exists()) {
          const ord = orderSnap.data() as Order;
          const reqReason = body.reason || body.rejectionReason || 'Order rejected / Payment verification failed.';
          await updateDoc(orderRef, { status: 'rejected', rejectionReason: reqReason });

          if (ord.accountId) {
            await updateDoc(doc(db, 'accounts', ord.accountId), {
              status: 'breached',
              breachedReason: reqReason,
              rejectionReason: reqReason
            });

            const logRef = doc(collection(db, 'accountLogs'));
            await setDoc(logRef, {
              id: logRef.id,
              accountId: ord.accountId,
              message: `Payment verification rejected: ${reqReason}`,
              type: 'danger',
              timestamp: new Date().toISOString()
            });
          }
          return new Response(JSON.stringify({ success: true }), { status: 200 });
        }
        return new Response(JSON.stringify({ error: 'Order not found' }), { status: 404 });
      }

      // ----------------------------------------------------
      // POST /api/trades
      // ----------------------------------------------------
      if (path === '/api/trades' && method === 'POST') {
        const { accountId, asset, direction, lotSize, stopLoss, takeProfit, currentMarketPrice } = body;
        const accSnap = await getDoc(doc(db, 'accounts', accountId));

        if (!accSnap.exists() || accSnap.data()?.status !== 'active') {
          return new Response(JSON.stringify({ error: 'Account is not active' }), { status: 400 });
        }

        const q = currentQuotes.find(quote => quote.symbol.toUpperCase().replace('/', '') === asset.toUpperCase().replace('/', ''));
        if (!q) {
          return new Response(JSON.stringify({ error: 'Asset not found' }), { status: 400 });
        }

        const matchedPrice = currentMarketPrice && typeof currentMarketPrice === 'number' && currentMarketPrice > 0 
          ? currentMarketPrice 
          : q.price;

        const newTrade: any = {
          id: `TRD-${Math.floor(100000 + Math.random() * 900000)}`,
          accountId,
          asset,
          direction,
          lotSize,
          entryPrice: matchedPrice,
          currentPrice: matchedPrice,
          createdAt: new Date().toISOString(),
          status: 'open',
          profitLoss: 0,
          stopLoss: stopLoss || null,
          takeProfit: takeProfit || null,
          orderType: 'market'
        };

        await setDoc(doc(db, 'trades', newTrade.id), newTrade);

        const logRef = doc(collection(db, 'accountLogs'));
        await setDoc(logRef, {
          id: logRef.id,
          accountId,
          message: `Position opened: ${direction.toUpperCase()} ${lotSize} Lots of ${asset} at ${matchedPrice}`,
          type: 'info',
          timestamp: new Date().toISOString()
        });

        return new Response(JSON.stringify({ success: true, trade: newTrade }), { status: 200 });
      }

      // ----------------------------------------------------
      // POST /api/trades/:id/close
      // ----------------------------------------------------
      if (path.startsWith('/api/trades/') && path.endsWith('/close') && method === 'POST') {
        const tradeId = path.split('/')[3];
        const tradeRef = doc(db, 'trades', tradeId);
        const tradeSnap = await getDoc(tradeRef);

        if (tradeSnap.exists() && tradeSnap.data()?.status === 'open') {
          const trade = tradeSnap.data() as Trade;
          const exitPrice = trade.currentPrice || trade.entryPrice;

          await updateDoc(tradeRef, {
            status: 'closed',
            closedAt: new Date().toISOString(),
            exitPrice,
            reason: 'manual'
          });

          // Update balance
          const accSnap = await getDoc(doc(db, 'accounts', trade.accountId));
          if (accSnap.exists()) {
            const acc = accSnap.data() as Account;
            const finalProfit = trade.profitLoss || 0;
            const newBalance = parseFloat((acc.balance + finalProfit).toFixed(2));

            await updateDoc(doc(db, 'accounts', acc.id), {
              balance: newBalance,
              peakBalance: Math.max(acc.peakBalance, newBalance)
            });

            // Log
            const logRef = doc(collection(db, 'accountLogs'));
            await setDoc(logRef, {
              id: logRef.id,
              accountId: acc.id,
              message: `Position closed manually: ${trade.direction.toUpperCase()} ${trade.lotSize} Lots of ${trade.asset} at ${exitPrice}. Profit/Loss: $${finalProfit.toLocaleString()}`,
              type: finalProfit >= 0 ? 'success' : 'warning',
              timestamp: new Date().toISOString()
            });
          }

          const freshTradeSnap = await getDoc(tradeRef);
          return new Response(JSON.stringify({ success: true, trade: freshTradeSnap.data() }), { status: 200 });
        }
        return new Response(JSON.stringify({ error: 'Trade not open or not found' }), { status: 400 });
      }

      // ----------------------------------------------------
      // POST /api/trades/:id/modify
      // ----------------------------------------------------
      if (path.startsWith('/api/trades/') && path.endsWith('/modify') && method === 'POST') {
        const tradeId = path.split('/')[3];
        const { stopLoss, takeProfit } = body;
        const tradeRef = doc(db, 'trades', tradeId);
        const tradeSnap = await getDoc(tradeRef);

        if (tradeSnap.exists() && tradeSnap.data()?.status === 'open') {
          await updateDoc(tradeRef, {
            stopLoss: stopLoss || null,
            takeProfit: takeProfit || null
          });

          const trade = tradeSnap.data() as Trade;
          const logRef = doc(collection(db, 'accountLogs'));
          await setDoc(logRef, {
            id: logRef.id,
            accountId: trade.accountId,
            message: `Position Modified: SL set to ${stopLoss || 'None'}, TP set to ${takeProfit || 'None'}`,
            type: 'info',
            timestamp: new Date().toISOString()
          });

          const freshTradeSnap = await getDoc(tradeRef);
          return new Response(JSON.stringify({ success: true, trade: freshTradeSnap.data() }), { status: 200 });
        }
        return new Response(JSON.stringify({ error: 'Trade not found' }), { status: 404 });
      }

      // ----------------------------------------------------
      // POST /api/kyc/submit
      // ----------------------------------------------------
      if (path === '/api/kyc/submit' && method === 'POST') {
        const { userId, idType, idFile, selfieFile } = body;
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const updatedUser = {
            ...userSnap.data(),
            kycStatus: 'pending' as KycStatus,
            kycIdType: idType,
            kycIdFile: idFile,
            kycSelfieFile: selfieFile
          };
          await setDoc(userRef, updatedUser);
          return new Response(JSON.stringify({ success: true, user: updatedUser }), { status: 200 });
        }
        return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
      }

      // ----------------------------------------------------
      // POST /api/kyc/:id/approve
      // ----------------------------------------------------
      if (path.startsWith('/api/kyc/') && path.endsWith('/approve') && method === 'POST') {
        const userId = path.split('/')[3];
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          await updateDoc(userRef, { kycStatus: 'approved' });
          const freshSnap = await getDoc(userRef);
          return new Response(JSON.stringify({ success: true, user: freshSnap.data() }), { status: 200 });
        }
        return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
      }

      // ----------------------------------------------------
      // POST /api/kyc/:id/reject
      // ----------------------------------------------------
      if (path.startsWith('/api/kyc/') && path.endsWith('/reject') && method === 'POST') {
        const userId = path.split('/')[3];
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          await updateDoc(userRef, { kycStatus: 'rejected' });
          const freshSnap = await getDoc(userRef);
          return new Response(JSON.stringify({ success: true, user: freshSnap.data() }), { status: 200 });
        }
        return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
      }

      // ----------------------------------------------------
      // POST /api/payout/request
      // ----------------------------------------------------
      if (path === '/api/payout/request' && method === 'POST') {
        const { accountId, amount, paymentMethod, paymentDetails } = body;
        const accRef = doc(db, 'accounts', accountId);
        const accSnap = await getDoc(accRef);

        if (accSnap.exists()) {
          const acc = accSnap.data() as Account;

          // Deduct from account balance in Firestore
          const newBalance = parseFloat((acc.balance - amount).toFixed(2));
          await updateDoc(accRef, {
            balance: newBalance,
            startOfDayBalance: newBalance // Reset start of day relative to new payout balance
          });

          const payout: PayoutRequest = {
            id: `PAY-${Math.floor(100000 + Math.random() * 900000)}`,
            accountId,
            challengeName: acc.challengeName,
            userId: acc.userId,
            userName: acc.userName,
            userEmail: acc.userEmail,
            amount,
            method: paymentMethod,
            details: paymentDetails,
            status: 'pending',
            createdAt: new Date().toISOString()
          };

          await setDoc(doc(db, 'payoutRequests', payout.id), payout);

          // Log
          const logRef = doc(collection(db, 'accountLogs'));
          await setDoc(logRef, {
            id: logRef.id,
            accountId,
            message: `Payout requested for $${amount.toLocaleString()} via ${paymentMethod.toUpperCase()}. Status: Pending verification.`,
            type: 'info',
            timestamp: new Date().toISOString()
          });

          return new Response(JSON.stringify({ success: true, payout }), { status: 200 });
        }
        return new Response(JSON.stringify({ error: 'Account not found' }), { status: 404 });
      }

      // ----------------------------------------------------
      // POST /api/payout/:id/update
      // ----------------------------------------------------
      if (path.startsWith('/api/payout/') && path.endsWith('/update') && method === 'POST') {
        const payId = path.split('/')[3];
        const { status } = body;
        const payoutRef = doc(db, 'payoutRequests', payId);
        const payoutSnap = await getDoc(payoutRef);

        if (payoutSnap.exists()) {
          const pay = payoutSnap.data() as PayoutRequest;
          await updateDoc(payoutRef, { status });

          if (status === 'approved') {
            const logRef = doc(collection(db, 'accountLogs'));
            await setDoc(logRef, {
              id: logRef.id,
              accountId: pay.accountId,
              message: `Payout Request of $${pay.amount.toLocaleString()} approved and processed successfully by admin.`,
              type: 'success',
              timestamp: new Date().toISOString()
            });
          } else if (status === 'rejected') {
            // Refund funds back to balance
            const accRef = doc(db, 'accounts', pay.accountId);
            const accSnap = await getDoc(accRef);
            if (accSnap.exists()) {
              const acc = accSnap.data() as Account;
              const newBalance = parseFloat((acc.balance + pay.amount).toFixed(2));
              await updateDoc(accRef, {
                balance: newBalance,
                startOfDayBalance: newBalance
              });

              const logRef = doc(collection(db, 'accountLogs'));
              await setDoc(logRef, {
                id: logRef.id,
                accountId: acc.id,
                message: `Payout Request of $${pay.amount.toLocaleString()} rejected by admin. Funds returned to balance.`,
                type: 'warning',
                timestamp: new Date().toISOString()
              });
            }
          }
          return new Response(JSON.stringify({ success: true }), { status: 200 });
        }
        return new Response(JSON.stringify({ error: 'Payout request not found' }), { status: 404 });
      }

      // ----------------------------------------------------
      // POST /api/admin/accounts/:id/update
      // ----------------------------------------------------
      if (path.startsWith('/api/admin/accounts/') && path.endsWith('/update') && method === 'POST') {
        const accId = path.split('/')[4];
        const { balance, status, phase, breachedReason } = body;
        const accRef = doc(db, 'accounts', accId);
        const accSnap = await getDoc(accRef);

        if (accSnap.exists()) {
          const acc = accSnap.data() as Account;
          const oldBal = acc.balance;

          const updateObj: any = {};
          if (balance !== undefined) {
            const newBal = parseFloat(balance);
            updateObj.balance = newBal;
            if (newBal !== oldBal) {
              updateObj.peakBalance = Math.max(acc.peakBalance, newBal);
              updateObj.startOfDayBalance = newBal;
            }
          }
          if (status !== undefined) updateObj.status = status;
          if (phase !== undefined) updateObj.phase = phase;
          if (breachedReason !== undefined) updateObj.breachedReason = breachedReason;

          await updateDoc(accRef, updateObj);

          // Log administrative override
          const logRef = doc(collection(db, 'accountLogs'));
          await setDoc(logRef, {
            id: logRef.id,
            accountId: acc.id,
            message: `Account credentials updated by administrative supervisor.`,
            type: 'info',
            timestamp: new Date().toISOString()
          });

          return new Response(JSON.stringify({ success: true }), { status: 200 });
        }
        return new Response(JSON.stringify({ error: 'Account not found' }), { status: 404 });
      }

      // ----------------------------------------------------
      // POST /api/affiliates/click
      // ----------------------------------------------------
      if (path === '/api/affiliates/click' && method === 'POST') {
        const { referralCode } = body;
        if (referralCode) {
          const qSnap = await getDocs(query(collection(db, 'affiliateProfiles'), where('referralCode', '==', referralCode)));
          if (qSnap.docs.length > 0) {
            const prof = qSnap.docs[0].data() as AffiliateProfile;
            await updateDoc(doc(db, 'affiliateProfiles', prof.userId), {
              clicks: (prof.clicks || 0) + 1
            });
          }
        }
        return new Response(JSON.stringify({ success: true }), { status: 200 });
      }

      // ----------------------------------------------------
      // POST /api/affiliates/join
      // ----------------------------------------------------
      if (path === '/api/affiliates/join' && method === 'POST') {
        const { userId, referralCode } = body;
        const profRef = doc(db, 'affiliateProfiles', userId);
        const profSnap = await getDoc(profRef);

        if (profSnap.exists()) {
          return new Response(JSON.stringify({ success: true, profile: profSnap.data() }), { status: 200 });
        }

        const userSnap = await getDoc(doc(db, 'users', userId));
        const user = userSnap.exists() ? userSnap.data() : null;

        const newProfile: AffiliateProfile = {
          userId,
          userEmail: user?.email || '',
          userName: user?.name || 'Partner',
          referralCode: referralCode || `REF-${Math.floor(1000 + Math.random() * 9000)}`,
          clicks: 0,
          createdAt: new Date().toISOString()
        };

        await setDoc(profRef, newProfile);
        return new Response(JSON.stringify({ success: true, profile: newProfile }), { status: 200 });
      }

      // ----------------------------------------------------
      // POST /api/affiliates/payouts
      // ----------------------------------------------------
      if (path === '/api/affiliates/payouts' && method === 'POST') {
        const { userId, paymentMethod, paymentDetails, amount } = body;
        const profSnap = await getDoc(doc(db, 'affiliateProfiles', userId));

        if (!profSnap.exists()) {
          return new Response(JSON.stringify({ error: 'Partner profile not found' }), { status: 400 });
        }

        const profile = profSnap.data() as AffiliateProfile;

        const newPayout: AffiliatePayoutRequest = {
          id: `APAY-${Math.floor(100000 + Math.random() * 900000)}`,
          affiliateUserId: profile.userId,
          userEmail: profile.userEmail,
          userName: profile.userName,
          amount,
          method: paymentMethod,
          details: paymentDetails,
          status: 'pending',
          createdAt: new Date().toISOString()
        };

        await setDoc(doc(db, 'affiliatePayoutRequests', newPayout.id), newPayout);
        return new Response(JSON.stringify({ success: true, payout: newPayout }), { status: 200 });
      }

      // ----------------------------------------------------
      // POST /api/admin/giveaway
      // ----------------------------------------------------
      if (path === '/api/admin/giveaway' && method === 'POST') {
        const { email, challengeConfigId, name } = body;
        const normalizedEmail = (email || '').toLowerCase().trim();

        if (!normalizedEmail) {
          return new Response(JSON.stringify({ error: 'Recipient email is required' }), { status: 400 });
        }

        // 1. Find or create the User
        const userQuerySnap = await getDocs(query(collection(db, 'users'), where('email', '==', normalizedEmail)));
        let targetUser: User;
        
        if (userQuerySnap.docs.length > 0) {
          const docData = userQuerySnap.docs[0].data();
          targetUser = {
            id: docData.id || userQuerySnap.docs[0].id || `usr-${Math.floor(100000 + Math.random() * 900000)}`,
            email: docData.email || normalizedEmail,
            name: docData.name || name || 'Giveaway Trader',
            role: docData.role || 'user',
            kycStatus: docData.kycStatus || 'none',
            createdAt: docData.createdAt || new Date().toISOString()
          };
        } else {
          // Auto-generate registered user if not exists
          const newUserId = `usr-${Math.floor(100000 + Math.random() * 900000)}`;
          targetUser = {
            id: newUserId,
            email: normalizedEmail,
            name: name || 'Giveaway Trader',
            role: 'user',
            kycStatus: 'none',
            createdAt: new Date().toISOString()
          };
          await setDoc(doc(db, 'users', newUserId), targetUser);
        }

        // 2. Find the plan configuration
        const plan = CHALLENGES.find(c => c.id === challengeConfigId);
        if (!plan) {
          return new Response(JSON.stringify({ error: `Challenge configuration '${challengeConfigId}' not found.` }), { status: 400 });
        }

        // 3. Create the Account (Active)
        const accountId = `ACC-${Math.floor(100000 + Math.random() * 900000)}`;
        const dailyLimit = Math.round(plan.size * (plan.dailyDrawdownLimitPercent / 100));
        const maxLimit = Math.round(plan.size * (plan.maxDrawdownLimitPercent / 100));

        const newAccount: Account = {
          id: accountId,
          userId: targetUser.id || `usr-${Math.floor(100000 + Math.random() * 900000)}`,
          userEmail: targetUser.email || normalizedEmail,
          userName: targetUser.name || name || 'Giveaway Trader',
          challengeConfigId: plan.id,
          challengeName: plan.name,
          challengeSize: plan.size,
          type: plan.type as any, // 'one_step' | 'two_step' | 'instant' | 'pass_pay_later'
          status: 'active',
          phase: plan.type === 'instant' ? 'funded' : 'phase1',
          balance: plan.size,
          initialBalance: plan.size,
          peakBalance: plan.size,
          startOfDayBalance: plan.size,
          dailyDrawdownLimitValue: dailyLimit,
          maxDrawdownLimitValue: maxLimit,
          payoutSharePercent: plan.payoutSharePercent || 80,
          createdAt: new Date().toISOString(),
          warningsCount: 0
        };

        await setDoc(doc(db, 'accounts', accountId), newAccount);

        // 4. Create an audit trail order (GIVEAWAY coupon)
        const orderId = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
        const order: Order = {
          id: orderId,
          userId: newAccount.userId,
          userEmail: newAccount.userEmail,
          userName: newAccount.userName,
          challengeConfigId: plan.id,
          challengeName: plan.name,
          challengeSize: plan.size,
          amount: plan.price,
          couponUsed: 'GIVEAWAY',
          discount: plan.price,
          finalPrice: 0,
          status: 'approved',
          createdAt: new Date().toISOString(),
          accountId: accountId
        };

        await setDoc(doc(db, 'orders', order.id), order);

        // 5. Create an initial account log
        const logRef = doc(collection(db, 'accountLogs'));
        await setDoc(logRef, {
          id: logRef.id,
          accountId: accountId,
          message: `🎉 Giveaway challenge activated by Administrator! Evaluation started.`,
          type: 'success',
          timestamp: new Date().toISOString()
        });

        return new Response(JSON.stringify({ success: true, account: newAccount }), { status: 200 });
      }

      // ----------------------------------------------------
      // POST /api/admin/bulk-email
      // ----------------------------------------------------
      if (path === '/api/admin/bulk-email' && method === 'POST') {
        return new Response(JSON.stringify({ success: true }), { status: 200 });
      }

      // ----------------------------------------------------
      // POST /api/admin/credentials
      // ----------------------------------------------------
      if (path === '/api/admin/credentials' && method === 'POST') {
        const { email, password } = body;
        const credRef = doc(db, 'system', 'adminCredentials');
        const updateObj: any = {};
        if (email) updateObj.email = email;
        if (password) updateObj.password = password;

        await setDoc(credRef, updateObj, { merge: true });
        return new Response(JSON.stringify({ success: true }), { status: 200 });
      }

      // ----------------------------------------------------
      // GET/POST/DELETE Coupons (Admin)
      // ----------------------------------------------------
      if (path === '/api/coupons' && method === 'POST') {
        const coupon = body as Coupon;
        await setDoc(doc(db, 'coupons', coupon.code), coupon);
        return new Response(JSON.stringify({ success: true }), { status: 200 });
      }

      if (path.startsWith('/api/coupons/') && method === 'DELETE') {
        const code = decodeURIComponent(path.split('/')[3]);
        await deleteDoc(doc(db, 'coupons', code));
        return new Response(JSON.stringify({ success: true }), { status: 200 });
      }

      // ----------------------------------------------------
      // Affiliate Commission / Affiliate Payout Status Updates (Admin)
      // ----------------------------------------------------
      if (path.startsWith('/api/admin/affiliates/commissions/') && path.endsWith('/status') && method === 'POST') {
        const commId = path.split('/')[5];
        const { status } = body;
        await updateDoc(doc(db, 'commissions', commId), { status });
        return new Response(JSON.stringify({ success: true }), { status: 200 });
      }

      if (path.startsWith('/api/admin/affiliates/payouts/') && path.endsWith('/status') && method === 'POST') {
        const payId = path.split('/')[5];
        const { status } = body;
        await updateDoc(doc(db, 'affiliatePayoutRequests', payId), { status });
        return new Response(JSON.stringify({ success: true }), { status: 200 });
      }

      // ----------------------------------------------------
      // Save/Update user wallet address
      // ----------------------------------------------------
      if (path.startsWith('/api/users/') && path.endsWith('/wallet') && method === 'POST') {
        const userId = path.split('/')[3];
        const { payoutWalletAddress } = body;
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, { payoutWalletAddress });
        const freshUserSnap = await getDoc(userRef);
        return new Response(JSON.stringify({ success: true, user: freshUserSnap.data() }), { status: 200 });
      }

      // ----------------------------------------------------
      // Toggle User Role (Admin Mode Switch)
      // ----------------------------------------------------
      if (path.startsWith('/api/users/') && path.endsWith('/role') && method === 'POST') {
        const userId = path.split('/')[3];
        const { role } = body;
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, { role });
        const freshUserSnap = await getDoc(userRef);
        return new Response(JSON.stringify({ success: true, user: freshUserSnap.data() }), { status: 200 });
      }

      // ----------------------------------------------------
      // Default Fallback Response
      // ----------------------------------------------------
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (err: any) {
      console.error('[Firebase Router Error]', err);
      return new Response(JSON.stringify({ error: err.message || 'Internal Simulation Server Error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  };

  // Safe window.fetch override for iframe & sandbox compatibility
  try {
    window.fetch = myFetch;
  } catch (e) {
    Object.defineProperty(window, 'fetch', {
      value: myFetch,
      writable: true,
      configurable: true
    });
  }

  console.log('[Firebase API Router] Initialized perfectly. All backend operations redirected to Firestore.');
}

export async function getLatestPriceFromChart(symbol: string): Promise<number | null> {
  try {
    const cleanSym = symbol.toUpperCase().replace('/', '');
    const q = currentQuotes.find(quote => quote.symbol.toUpperCase().replace('/', '') === cleanSym);
    if (q && q.price && q.price > 0) {
      return q.price;
    }
    
    const fetchFn = (typeof window !== 'undefined' && (window as any).__originalFetch) || (typeof window !== 'undefined' ? window.fetch : null);
    if (fetchFn) {
      // Try Twelve Data first
      const twelveDataSymbols: Record<string, string> = {
        'XAUUSD': 'XAU/USD',
        'EURUSD': 'EUR/USD',
        'GBPUSD': 'GBP/USD',
        'USDJPY': 'USD/JPY',
        'BTCUSD': 'BTC/USD',
        'ETHUSD': 'ETH/USD',
      };
      const twelveSym = twelveDataSymbols[cleanSym];
      if (twelveSym) {
        try {
          const url = `/api/price?symbol=${encodeURIComponent(twelveSym)}`;
          const res = await fetchFn(url);
          if (res.ok) {
            const data = await res.json();
            if (data && data.price) {
              const livePrice = parseFloat(data.price);
              if (livePrice > 0) return livePrice;
            }
          }
        } catch (e) {
          // ignore
        }
      }

      // 1. Try Finnhub second
      const finnhubSym = FINNHUB_TICKER_MAP[cleanSym];
      if (finnhubSym) {
        const token = 'd92gc9hr01qraam0t0jgd92gc9hr01qraam0t0k0';
        const finnhubUrl = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(finnhubSym)}&token=${token}`;
        try {
          const finnhubRes = await fetchFn(finnhubUrl);
          if (finnhubRes.ok) {
            const data = await finnhubRes.json();
            if (data && data.c !== undefined && data.c !== 0) {
              const livePrice = parseFloat(data.c);
              if (livePrice > 0) return livePrice;
            }
          }
        } catch (e) {
          // ignore and fallback
        }
      }

      // 2. Fallback to YahooFinance API
      const yahooSym = TICKER_MAP[cleanSym];
      if (yahooSym) {
        const yahooUrl = `/api/yahoo/v7/finance/quote?symbols=${encodeURIComponent(yahooSym)}`;
        const yahooRes = await fetchFn(yahooUrl);
        if (yahooRes.ok) {
          const data = await yahooRes.json();
          const results = data?.quoteResponse?.result;
          if (Array.isArray(results) && results.length > 0 && results[0].regularMarketPrice !== undefined) {
            const livePrice = parseFloat(results[0].regularMarketPrice);
            if (livePrice > 0) {
              return livePrice;
            }
          }
        }
      }
    }
  } catch (err) {
    console.error("Error in getLatestPriceFromChart fallback:", err);
  }
  return null;
}
