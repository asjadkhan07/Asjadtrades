import { initializeApp } from 'firebase/app';
import { initializeFirestore, setLogLevel } from 'firebase/firestore';

// Intercept and suppress Firestore backend connection warning logs
if (typeof window !== 'undefined') {
  const originalError = console.error;
  console.error = function (...args: any[]) {
    const msg = args.map(arg => (arg && arg.stack) ? arg.stack : String(arg)).join(' ');
    if (
      msg.includes('Could not reach Cloud Firestore backend') ||
      msg.includes('unavailable') ||
      msg.includes('@firebase/firestore') ||
      msg.includes('getDocFromCache') ||
      msg.includes('getDocsFromCache') ||
      msg.includes('Failed to get document from cache') ||
      msg.includes('fetchSingleRealPrice') ||
      msg.includes('fetchLivePrice') ||
      msg.includes('Twelve Data') ||
      msg.includes('Failed to fetch') ||
      msg.includes('Self-Initialization') ||
      msg.includes('No Account resolved')
    ) {
      return;
    }
    originalError.apply(console, args);
  };

  const originalWarn = console.warn;
  console.warn = function (...args: any[]) {
    const msg = args.map(arg => (arg && arg.stack) ? arg.stack : String(arg)).join(' ');
    if (
      msg.includes('Could not reach Cloud Firestore backend') ||
      msg.includes('unavailable') ||
      msg.includes('@firebase/firestore') ||
      msg.includes('getDocFromCache') ||
      msg.includes('getDocsFromCache') ||
      msg.includes('Failed to get document from cache')
    ) {
      return;
    }
    originalWarn.apply(console, args);
  };
}

// Configuration from firebase-applet-config.json
const firebaseConfig = {
  apiKey: "AIzaSyAADPW8LOIluHtErmMmdyuRDhiuSlvnhGA",
  authDomain: "gen-lang-client-0674008062.firebaseapp.com",
  projectId: "gen-lang-client-0674008062",
  storageBucket: "gen-lang-client-0674008062.firebasestorage.app",
  messagingSenderId: "956506567280",
  appId: "1:956506567280:web:d9472988e16bc4745cfab5"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Set log level to prevent connection warning noise from cluttering logs/causing errors
setLogLevel('error');

// Initialize Firestore with the specific custom database ID and force long polling
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, "ai-studio-atfunding-fc82b33e-08de-4a91-8a7f-2c61f8431ca5");

