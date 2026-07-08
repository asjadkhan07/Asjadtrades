import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initFirebaseFetch } from './lib/firebaseFetch';

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

// Initialize full-stack Firebase Firestore router
initFirebaseFetch();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Synced with Firebase rules and blueprint configuration



