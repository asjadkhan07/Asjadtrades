import { Account, Trade } from '../types';
import { getSymbolContract } from '../data';

export interface DrawdownResult {
  breached: boolean;
  breachReason: string;
  isPhantomDiscrepancy: boolean;
}

export function validateData(
  account: Account,
  openTrades: Trade[],
  currentQuotes: any[]
): boolean {
  if (openTrades.length === 0) return true;

  let calculatedPnl = 0;
  for (const t of openTrades) {
    const q = currentQuotes.find(quote => quote.symbol.toUpperCase().replace('/', '') === t.asset.toUpperCase().replace('/', ''));
    if (!q) continue;

    const livePrice = q.price;
    const priceDiff = t.direction === 'buy' ? (livePrice - t.entryPrice) : (t.entryPrice - livePrice);
    
    // Dynamic contract sizing from config map
    const contract = getSymbolContract(t.asset);
    const tradePnl = priceDiff * contract * t.lotSize;
    calculatedPnl += tradePnl;
  }

  const calculatedEquity = account.balance + calculatedPnl;
  const recordedPnl = openTrades.reduce((sum, t) => sum + (t.profitLoss || 0), 0);
  const recordedEquity = account.balance + recordedPnl;

  // Detect calculation mismatch greater than $15 (due to price sync lag or cached variables)
  if (Math.abs(calculatedEquity - recordedEquity) > 15) {
    console.warn(`[validateData] Mismatch detected: Calculated Equity = $${calculatedEquity.toFixed(2)}, Recorded Equity = $${recordedEquity.toFixed(2)}. Mismatch of $${Math.abs(calculatedEquity - recordedEquity).toFixed(2)}. Triggering Re-sync.`);
    return false;
  }

  return true;
}


export function checkDrawdown(
  account: Account,
  openTrades: Trade[],
  currentQuotes: any[]
): DrawdownResult {
  const floatingPnl = openTrades.reduce((sum, t) => sum + (t.profitLoss || 0), 0);
  const currentEquity = account.balance + floatingPnl;
  const dayStartingBalance = account.startOfDayBalance;

  // 1. Calculation Override: Force daily drawdown calculation between currentEquity and dayStartingBalance
  const dailyDrawdown = dayStartingBalance - currentEquity;
  const maxDrawdown = account.initialBalance - currentEquity;

  const totalLotSize = openTrades.reduce((sum, t) => sum + t.lotSize, 0);

  // 2. Phantom Price Protection (Sanity Check)
  // If the calculated floatingEquity is extremely discrepant compared to actual price/balance
  // e.g. 3306 vs 5015 for 0.01 lot trade, we flag it as phantom price.
  let isPhantomDiscrepancy = false;
  if (openTrades.length > 0) {
    // Check if the calculated equity vs actual balance difference is wildly high compared to lot sizes
    // For 0.01 lot trade, a discrepancy of more than $1,000 is completely impossible in standard markets.
    // Let's set a realistic threshold of $50,000 per 1.00 lot (or $500 per 0.01 lot).
    const maxReasonablePnl = totalLotSize * 50000 + 200; // $200 baseline buffer
    if (Math.abs(floatingPnl) > maxReasonablePnl) {
      isPhantomDiscrepancy = true;
    }
  }

  let breached = false;
  let breachReason = '';

  if (!isPhantomDiscrepancy) {
    if (dailyDrawdown > account.dailyDrawdownLimitValue) {
      breached = true;
      breachReason = `Daily drawdown limit of $${account.dailyDrawdownLimitValue.toLocaleString()} breached. Floating equity hit $${currentEquity.toLocaleString()} starting from day balance of $${dayStartingBalance.toLocaleString()}`;
    } else if (maxDrawdown > account.maxDrawdownLimitValue) {
      breached = true;
      breachReason = `Max drawdown limit of $${account.maxDrawdownLimitValue.toLocaleString()} breached. Floating equity hit $${currentEquity.toLocaleString()} starting from initial balance of $${account.initialBalance.toLocaleString()}`;
    }
  }

  // 4. Logging: Print why breach was evaluated or why sanity check was triggered
  if (isPhantomDiscrepancy) {
    console.warn(`[Phantom Price Protection Log] Sanity Check Triggered for Account ${account.id}:
      - Calculated Floating Equity: $${currentEquity.toFixed(2)}
      - Actual Balance: $${account.balance.toFixed(2)}
      - Discrepancy: $${Math.abs(account.balance - currentEquity).toFixed(2)}
      - Total Lot Size: ${totalLotSize.toFixed(2)}
      - Sanity P/L Threshold: $${(totalLotSize * 50000 + 200).toFixed(2)}
      - Action: Breach prevented, moving to 'Re-syncing Data' state.`);

    // Log individual trades' calculated price vs actual price
    openTrades.forEach(t => {
      const q = currentQuotes.find(quote => quote.symbol.toUpperCase().replace('/', '') === t.asset.toUpperCase().replace('/', ''));
      const actualPrice = q ? q.price : 'Unknown';
      console.warn(`[Phantom Price Protection Log] Trade ${t.id} on ${t.asset}:
        - Calculated Price (Trade currentPrice): ${t.currentPrice}
        - Actual Price (Live Feed): ${actualPrice}
        - Entry Price: ${t.entryPrice}
        - Lot Size: ${t.lotSize}`);
    });
  } else if (breached) {
    console.log(`[Drawdown Breach] Account ${account.id} breached: ${breachReason}`);
  }

  return {
    breached,
    breachReason,
    isPhantomDiscrepancy
  };
}
