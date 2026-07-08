import { ChallengeConfig, Coupon, MarketQuote } from './types';

export const CHALLENGES: ChallengeConfig[] = [
  // One-Step Challenges
  {
    id: 'os-5k',
    name: 'ATFunding 5K Challenge (One-Step)',
    type: 'one_step',
    size: 5000,
    price: 55,
    phase1TargetPercent: 8,
    phase2TargetPercent: 0,
    dailyDrawdownLimitPercent: 4,
    maxDrawdownLimitPercent: 8,
    payoutSharePercent: 80,
    hasStopLossPolicy: true,
    description: 'One-step evaluation challenge. Fast-track your access to funded capital.'
  },
  {
    id: 'os-10k',
    name: 'ATFunding 10K Challenge (One-Step)',
    type: 'one_step',
    size: 10000,
    price: 95,
    phase1TargetPercent: 8,
    phase2TargetPercent: 0,
    dailyDrawdownLimitPercent: 4,
    maxDrawdownLimitPercent: 8,
    payoutSharePercent: 80,
    hasStopLossPolicy: true,
    description: 'One-step evaluation challenge. Hit the single profit target and get funded.'
  },
  {
    id: 'os-25k',
    name: 'ATFunding 25K Challenge (One-Step)',
    type: 'one_step',
    size: 25000,
    price: 164,
    phase1TargetPercent: 8,
    phase2TargetPercent: 0,
    dailyDrawdownLimitPercent: 4,
    maxDrawdownLimitPercent: 8,
    payoutSharePercent: 80,
    hasStopLossPolicy: true,
    description: 'One-step evaluation challenge. Fast-track your access to funded capital.'
  },
  {
    id: 'os-50k',
    name: 'ATFunding 50K Challenge (One-Step)',
    type: 'one_step',
    size: 50000,
    price: 247,
    phase1TargetPercent: 8,
    phase2TargetPercent: 0,
    dailyDrawdownLimitPercent: 4,
    maxDrawdownLimitPercent: 8,
    payoutSharePercent: 80,
    hasStopLossPolicy: true,
    description: 'One-step evaluation challenge. Standard single profit target access.'
  },
  {
    id: 'os-100k',
    name: 'ATFunding 100K Challenge (One-Step)',
    type: 'one_step',
    size: 100000,
    price: 569,
    phase1TargetPercent: 8,
    phase2TargetPercent: 0,
    dailyDrawdownLimitPercent: 4,
    maxDrawdownLimitPercent: 8,
    payoutSharePercent: 80,
    hasStopLossPolicy: true,
    description: 'One-step evaluation challenge. Trade with maximum funded scale.'
  },

  // Two-Step Challenges
  {
    id: 'ts-5k',
    name: 'ATFunding 5K Challenge (Two-Step)',
    type: 'two_step',
    size: 5000,
    price: 35,
    phase1TargetPercent: 8,
    phase2TargetPercent: 5,
    dailyDrawdownLimitPercent: 5,
    maxDrawdownLimitPercent: 10,
    payoutSharePercent: 80,
    hasStopLossPolicy: true,
    description: 'Standard two-step evaluation. Build your track record with high leverage.'
  },
  {
    id: 'ts-10k',
    name: 'ATFunding 10K Challenge (Two-Step)',
    type: 'two_step',
    size: 10000,
    price: 60,
    phase1TargetPercent: 8,
    phase2TargetPercent: 5,
    dailyDrawdownLimitPercent: 5,
    maxDrawdownLimitPercent: 10,
    payoutSharePercent: 80,
    hasStopLossPolicy: true,
    description: 'Standard two-step evaluation. Balance risk and targets with institutional rules.'
  },
  {
    id: 'ts-25k',
    name: 'ATFunding 25K Challenge (Two-Step)',
    type: 'two_step',
    size: 25000,
    price: 149,
    phase1TargetPercent: 8,
    phase2TargetPercent: 5,
    dailyDrawdownLimitPercent: 5,
    maxDrawdownLimitPercent: 10,
    payoutSharePercent: 80,
    hasStopLossPolicy: true,
    description: 'Standard two-step evaluation. Highly optimized risk ratio.'
  },
  {
    id: 'ts-50k',
    name: 'ATFunding 50K Challenge (Two-Step)',
    type: 'two_step',
    size: 50000,
    price: 224,
    phase1TargetPercent: 8,
    phase2TargetPercent: 5,
    dailyDrawdownLimitPercent: 5,
    maxDrawdownLimitPercent: 10,
    payoutSharePercent: 80,
    hasStopLossPolicy: true,
    description: 'Standard two-step evaluation. Preferred choice for professional builders.'
  },
  {
    id: 'ts-100k',
    name: 'ATFunding 100K Challenge (Two-Step)',
    type: 'two_step',
    size: 100000,
    price: 549,
    phase1TargetPercent: 8,
    phase2TargetPercent: 5,
    dailyDrawdownLimitPercent: 5,
    maxDrawdownLimitPercent: 10,
    payoutSharePercent: 80,
    hasStopLossPolicy: true,
    description: 'Standard two-step evaluation. Trade with large-scale corporate backing.'
  },

  // Instant Funding Accounts
  {
    id: 'inst-1k',
    name: 'ATFunding 1K Instant Account',
    type: 'instant',
    size: 1000,
    price: 3,
    phase1TargetPercent: 0,
    phase2TargetPercent: 0,
    dailyDrawdownLimitPercent: 5,
    maxDrawdownLimitPercent: 8,
    payoutSharePercent: 70,
    hasStopLossPolicy: true,
    description: 'No evaluation needed. Start trading real company capital instantly.'
  },
  {
    id: 'inst-2k',
    name: 'ATFunding 2K Instant Account',
    type: 'instant',
    size: 2000,
    price: 6,
    phase1TargetPercent: 0,
    phase2TargetPercent: 0,
    dailyDrawdownLimitPercent: 5,
    maxDrawdownLimitPercent: 8,
    payoutSharePercent: 70,
    hasStopLossPolicy: true,
    description: 'Direct funded account. Get direct access to company capital and earn payouts.'
  },

  // Pass Pay Later (Free entry / lower upfront, pay fee once evaluation is completed)
  {
    id: 'ppl-5k',
    name: 'ATFunding 5K (Payout Later)',
    type: 'pass_pay_later',
    size: 5000,
    price: 9,
    payoutLaterFee: 75,
    phase1TargetPercent: 8,
    phase2TargetPercent: 5,
    dailyDrawdownLimitPercent: 5,
    maxDrawdownLimitPercent: 10,
    payoutSharePercent: 80,
    hasStopLossPolicy: true,
    description: 'Start challenge. Pass the evaluation phases and pay the fee upon success.'
  },
  {
    id: 'ppl-10k',
    name: 'ATFunding 10K (Payout Later)',
    type: 'pass_pay_later',
    size: 10000,
    price: 19,
    payoutLaterFee: 150,
    phase1TargetPercent: 8,
    phase2TargetPercent: 5,
    dailyDrawdownLimitPercent: 5,
    maxDrawdownLimitPercent: 10,
    payoutSharePercent: 80,
    hasStopLossPolicy: true,
    description: 'Start challenge. Pass the evaluation phases and pay the fee upon success.'
  },
  {
    id: 'ppl-25k',
    name: 'ATFunding 25K (Payout Later)',
    type: 'pass_pay_later',
    size: 25000,
    price: 27,
    payoutLaterFee: 200,
    phase1TargetPercent: 8,
    phase2TargetPercent: 5,
    dailyDrawdownLimitPercent: 5,
    maxDrawdownLimitPercent: 10,
    payoutSharePercent: 80,
    hasStopLossPolicy: true,
    description: 'Start challenge. Pass the evaluation phases and pay the fee upon success.'
  },
  {
    id: 'ppl-50k',
    name: 'ATFunding 50K (Payout Later)',
    type: 'pass_pay_later',
    size: 50000,
    price: 36,
    payoutLaterFee: 300,
    phase1TargetPercent: 8,
    phase2TargetPercent: 5,
    dailyDrawdownLimitPercent: 5,
    maxDrawdownLimitPercent: 10,
    payoutSharePercent: 80,
    hasStopLossPolicy: true,
    description: 'Start challenge. Pass the evaluation phases and pay the fee upon success.'
  },
  {
    id: 'ppl-100k',
    name: 'ATFunding 100K (Payout Later)',
    type: 'pass_pay_later',
    size: 100000,
    price: 125,
    payoutLaterFee: 432,
    phase1TargetPercent: 8,
    phase2TargetPercent: 5,
    dailyDrawdownLimitPercent: 5,
    maxDrawdownLimitPercent: 10,
    payoutSharePercent: 80,
    hasStopLossPolicy: true,
    description: 'Start challenge. Pass the evaluation phases and pay the fee upon success.'
  }
];

export const COUPONS: Coupon[] = [
  { code: 'SAVE30', discountPercent: 30, description: '30% Off on all challenges' }
];

export const INITIAL_QUOTES: MarketQuote[] = [
  // Forex
  { symbol: 'EURUSD', name: 'Euro / US Dollar', price: 1.08450, change: 0.12, prevPrice: 1.08320, high: 1.08620, low: 1.08210 },
  { symbol: 'GBPUSD', name: 'Pound Sterling / US Dollar', price: 1.26520, change: -0.05, prevPrice: 1.26580, high: 1.26910, low: 1.26250 },
  { symbol: 'USDJPY', name: 'US Dollar / Japanese Yen', price: 156.450, change: 0.35, prevPrice: 155.900, high: 156.800, low: 155.650 },
  { symbol: 'USDCHF', name: 'US Dollar / Swiss Franc', price: 0.89500, change: 0.08, prevPrice: 0.89420, high: 0.89680, low: 0.89310 },
  { symbol: 'USDCAD', name: 'US Dollar / Canadian Dollar', price: 1.36500, change: -0.15, prevPrice: 1.36700, high: 1.36950, low: 1.36220 },
  { symbol: 'AUDUSD', name: 'Australian Dollar / US Dollar', price: 0.66500, change: 0.22, prevPrice: 0.66350, high: 0.66720, low: 0.66180 },
  { symbol: 'NZDUSD', name: 'New Zealand Dollar / US Dollar', price: 0.61200, change: 0.18, prevPrice: 0.61090, high: 0.61450, low: 0.60950 },
  { symbol: 'EURJPY', name: 'Euro / Japanese Yen', price: 169.500, change: 0.42, prevPrice: 168.800, high: 170.100, low: 168.500 },
  { symbol: 'GBPJPY', name: 'Pound Sterling / Japanese Yen', price: 197.800, change: 0.28, prevPrice: 197.250, high: 198.400, low: 196.900 },
  { symbol: 'EURGBP', name: 'Euro / Pound Sterling', price: 0.85700, change: -0.11, prevPrice: 0.85800, high: 0.85950, low: 0.85520 },
  { symbol: 'AUDJPY', name: 'Australian Dollar / Japanese Yen', price: 104.100, change: 0.35, prevPrice: 103.740, high: 104.500, low: 103.400 },
  { symbol: 'CADJPY', name: 'Canadian Dollar / Japanese Yen', price: 114.500, change: 0.44, prevPrice: 114.000, high: 114.900, low: 113.800 },
  { symbol: 'CHFJPY', name: 'Swiss Franc / Japanese Yen', price: 174.600, change: 0.15, prevPrice: 174.340, high: 175.200, low: 173.900 },

  // Metals
  { symbol: 'XAUUSD', name: 'Gold / US Dollar', price: 2365.40, change: -0.30, prevPrice: 2372.50, high: 2385.00, low: 2355.20 },
  { symbol: 'XAGUSD', name: 'Silver / US Dollar', price: 29.50, change: -0.85, prevPrice: 29.75, high: 30.10, low: 29.20 },

  // Indices
  { symbol: 'US30', name: 'Dow Jones Industrial Average', price: 39120.0, change: 0.15, prevPrice: 39061.4, high: 39250.0, low: 38950.0 },
  { symbol: 'NAS100', name: 'Nasdaq 100 Index', price: 19580.0, change: 0.65, prevPrice: 19453.6, high: 19650.0, low: 19380.0 },
  { symbol: 'SPX500', name: 'S&P 500 Index', price: 5460.0, change: 0.35, prevPrice: 5441.0, high: 5485.0, low: 5425.0 },
  { symbol: 'GER40', name: 'DAX 40 Index (Germany)', price: 18210.0, change: -0.25, prevPrice: 18255.6, high: 18320.0, low: 18120.0 },
  { symbol: 'UK100', name: 'FTSE 100 Index (United Kingdom)', price: 8150.0, change: -0.12, prevPrice: 8159.8, high: 8210.0, low: 8110.0 },
  { symbol: 'JP225', name: 'Nikkei 225 Index (Japan)', price: 38650.0, change: 0.85, prevPrice: 38324.2, high: 38900.0, low: 38200.0 },
  { symbol: 'AUS200', name: 'S&P/ASX 200 Index (Australia)', price: 7720.0, change: 0.05, prevPrice: 7716.1, high: 7760.0, low: 7690.0 },
  { symbol: 'HK50', name: 'Hang Seng Index (Hong Kong)', price: 18050.0, change: -0.45, prevPrice: 18131.6, high: 18250.0, low: 17920.0 },
  { symbol: 'FRA40', name: 'CAC 40 Index (France)', price: 7610.0, change: -0.38, prevPrice: 7639.0, high: 7680.0, low: 7550.0 },

  // Commodities
  { symbol: 'USOIL', name: 'Crude Oil (WTI)', price: 81.50, change: 0.45, prevPrice: 81.14, high: 82.20, low: 80.80 },
  { symbol: 'UKOIL', name: 'Crude Oil (Brent)', price: 85.20, change: 0.41, prevPrice: 84.85, high: 85.90, low: 84.50 },
  { symbol: 'Natural Gas', name: 'Natural Gas Futures', price: 2.750, change: -1.25, prevPrice: 2.785, high: 2.840, low: 2.710 },

  // Crypto
  { symbol: 'BTCUSD', name: 'Bitcoin / US Dollar', price: 61250.00, change: 1.84, prevPrice: 60143.36, high: 62150.00, low: 59850.00 },
  { symbol: 'ETHUSD', name: 'Ethereum / US Dollar', price: 3380.00, change: 2.15, prevPrice: 3308.86, high: 3440.00, low: 3270.00 },
  { symbol: 'SOLUSD', name: 'Solana / US Dollar', price: 138.50, change: 3.45, prevPrice: 133.88, high: 142.20, low: 132.10 },
  { symbol: 'XRPUSD', name: 'Ripple / US Dollar', price: 0.4750, change: -0.15, prevPrice: 0.4757, high: 0.4850, low: 0.4680 },
  { symbol: 'BNBUSD', name: 'Binance Coin / US Dollar', price: 572.00, change: 1.10, prevPrice: 565.78, high: 581.50, low: 561.00 },
  { symbol: 'DOGEUSD', name: 'Dogecoin / US Dollar', price: 0.12200, change: 4.80, prevPrice: 0.11641, high: 0.12800, low: 0.11500 },
  { symbol: 'ADAUSD', name: 'Cardano / US Dollar', price: 0.3850, change: -0.45, prevPrice: 0.3867, high: 0.3950, low: 0.3810 },

  // BACKWARD COMPATIBLE FALLBACKS (so legacy code doesn't crash)
  { symbol: 'EUR/USD', name: 'Euro / US Dollar', price: 1.08450, change: 0.12, prevPrice: 1.08320, high: 1.08620, low: 1.08210 },
  { symbol: 'GBP/USD', name: 'Pound Sterling / US Dollar', price: 1.26520, change: -0.05, prevPrice: 1.26580, high: 1.26910, low: 1.26250 },
  { symbol: 'USD/JPY', name: 'US Dollar / Japanese Yen', price: 156.450, change: 0.35, prevPrice: 155.900, high: 156.800, low: 155.650 },
  { symbol: 'BTC/USD', name: 'Bitcoin / US Dollar', price: 61250.00, change: 1.84, prevPrice: 60143.36, high: 62150.00, low: 59850.00 },
  { symbol: 'GOLD', name: 'Gold Spot (troy ounce)', price: 2365.40, change: -0.30, prevPrice: 2372.50, high: 2385.00, low: 2355.20 }
];

// Helper values to calculate lot values and pip sizes for each asset
export const ASSET_PROPERTIES: Record<string, {
  pipSize: number;
  lotSizeMultiplier: number;
  digits: number;
  spread: number; // simulated bid-ask spread
  contractSize: number;
  tickSize: number;
  tickValue: number;
  minLot: number;
  maxLot: number;
  lotStep: number;
  decimals: number;
}> = {
  // Forex
  'EURUSD': { pipSize: 0.0001, lotSizeMultiplier: 100000, digits: 5, spread: 0.00012, contractSize: 100000, tickSize: 0.00001, tickValue: 1.0, minLot: 0.01, maxLot: 100, lotStep: 0.01, decimals: 5 },
  'GBPUSD': { pipSize: 0.0001, lotSizeMultiplier: 100000, digits: 5, spread: 0.00016, contractSize: 100000, tickSize: 0.00001, tickValue: 1.0, minLot: 0.01, maxLot: 100, lotStep: 0.01, decimals: 5 },
  'USDJPY': { pipSize: 0.01, lotSizeMultiplier: 100000, digits: 3, spread: 0.015, contractSize: 100000, tickSize: 0.001, tickValue: 0.64, minLot: 0.01, maxLot: 100, lotStep: 0.01, decimals: 3 },
  'USDCHF': { pipSize: 0.0001, lotSizeMultiplier: 100000, digits: 5, spread: 0.00015, contractSize: 100000, tickSize: 0.00001, tickValue: 1.0, minLot: 0.01, maxLot: 100, lotStep: 0.01, decimals: 5 },
  'USDCAD': { pipSize: 0.0001, lotSizeMultiplier: 100000, digits: 5, spread: 0.00014, contractSize: 100000, tickSize: 0.00001, tickValue: 1.0, minLot: 0.01, maxLot: 100, lotStep: 0.01, decimals: 5 },
  'AUDUSD': { pipSize: 0.0001, lotSizeMultiplier: 100000, digits: 5, spread: 0.00013, contractSize: 100000, tickSize: 0.00001, tickValue: 1.0, minLot: 0.01, maxLot: 100, lotStep: 0.01, decimals: 5 },
  'NZDUSD': { pipSize: 0.0001, lotSizeMultiplier: 100000, digits: 5, spread: 0.00015, contractSize: 100000, tickSize: 0.00001, tickValue: 1.0, minLot: 0.01, maxLot: 100, lotStep: 0.01, decimals: 5 },
  'EURJPY': { pipSize: 0.01, lotSizeMultiplier: 100000, digits: 3, spread: 0.018, contractSize: 100000, tickSize: 0.001, tickValue: 0.64, minLot: 0.01, maxLot: 100, lotStep: 0.01, decimals: 3 },
  'GBPJPY': { pipSize: 0.01, lotSizeMultiplier: 100000, digits: 3, spread: 0.022, contractSize: 100000, tickSize: 0.001, tickValue: 0.64, minLot: 0.01, maxLot: 100, lotStep: 0.01, decimals: 3 },
  'EURGBP': { pipSize: 0.0001, lotSizeMultiplier: 100000, digits: 5, spread: 0.00015, contractSize: 100000, tickSize: 0.00001, tickValue: 1.25, minLot: 0.01, maxLot: 100, lotStep: 0.01, decimals: 5 },
  'AUDJPY': { pipSize: 0.01, lotSizeMultiplier: 100000, digits: 3, spread: 0.020, contractSize: 100000, tickSize: 0.001, tickValue: 0.64, minLot: 0.01, maxLot: 100, lotStep: 0.01, decimals: 3 },
  'CADJPY': { pipSize: 0.01, lotSizeMultiplier: 100000, digits: 3, spread: 0.019, contractSize: 100000, tickSize: 0.001, tickValue: 0.64, minLot: 0.01, maxLot: 100, lotStep: 0.01, decimals: 3 },
  'CHFJPY': { pipSize: 0.01, lotSizeMultiplier: 100000, digits: 3, spread: 0.021, contractSize: 100000, tickSize: 0.001, tickValue: 0.64, minLot: 0.01, maxLot: 100, lotStep: 0.01, decimals: 3 },

  // Metals
  'XAUUSD': { pipSize: 0.1, lotSizeMultiplier: 100, digits: 2, spread: 0.25, contractSize: 100, tickSize: 0.01, tickValue: 1.0, minLot: 0.01, maxLot: 50, lotStep: 0.01, decimals: 2 },
  'XAGUSD': { pipSize: 0.01, lotSizeMultiplier: 5000, digits: 3, spread: 0.015, contractSize: 5000, tickSize: 0.01, tickValue: 50.0, minLot: 0.01, maxLot: 50, lotStep: 0.01, decimals: 3 },

  // Indices
  'US30': { pipSize: 1.0, lotSizeMultiplier: 10, digits: 1, spread: 2.0, contractSize: 10, tickSize: 1.0, tickValue: 10.0, minLot: 0.1, maxLot: 500, lotStep: 0.1, decimals: 1 },
  'NAS100': { pipSize: 1.0, lotSizeMultiplier: 10, digits: 1, spread: 1.5, contractSize: 10, tickSize: 1.0, tickValue: 10.0, minLot: 0.1, maxLot: 500, lotStep: 0.1, decimals: 1 },
  'SPX500': { pipSize: 0.1, lotSizeMultiplier: 10, digits: 1, spread: 0.5, contractSize: 10, tickSize: 0.1, tickValue: 1.0, minLot: 0.1, maxLot: 500, lotStep: 0.1, decimals: 1 },
  'GER40': { pipSize: 1.0, lotSizeMultiplier: 10, digits: 1, spread: 1.5, contractSize: 10, tickSize: 1.0, tickValue: 10.0, minLot: 0.1, maxLot: 500, lotStep: 0.1, decimals: 1 },
  'UK100': { pipSize: 1.0, lotSizeMultiplier: 10, digits: 1, spread: 1.2, contractSize: 10, tickSize: 1.0, tickValue: 10.0, minLot: 0.1, maxLot: 500, lotStep: 0.1, decimals: 1 },
  'JP225': { pipSize: 1.0, lotSizeMultiplier: 100, digits: 0, spread: 15.0, contractSize: 100, tickSize: 1.0, tickValue: 1.0, minLot: 0.1, maxLot: 500, lotStep: 0.1, decimals: 0 },
  'AUS200': { pipSize: 1.0, lotSizeMultiplier: 10, digits: 1, spread: 2.0, contractSize: 10, tickSize: 1.0, tickValue: 10.0, minLot: 0.1, maxLot: 500, lotStep: 0.1, decimals: 1 },
  'HK50': { pipSize: 1.0, lotSizeMultiplier: 10, digits: 1, spread: 4.0, contractSize: 10, tickSize: 1.0, tickValue: 10.0, minLot: 0.1, maxLot: 500, lotStep: 0.1, decimals: 1 },
  'FRA40': { pipSize: 1.0, lotSizeMultiplier: 10, digits: 1, spread: 1.5, contractSize: 10, tickSize: 1.0, tickValue: 10.0, minLot: 0.1, maxLot: 500, lotStep: 0.1, decimals: 1 },

  // Commodities
  'USOIL': { pipSize: 0.01, lotSizeMultiplier: 100, digits: 2, spread: 0.04, contractSize: 100, tickSize: 0.01, tickValue: 1.0, minLot: 0.1, maxLot: 200, lotStep: 0.1, decimals: 2 },
  'UKOIL': { pipSize: 0.01, lotSizeMultiplier: 100, digits: 2, spread: 0.04, contractSize: 100, tickSize: 0.01, tickValue: 1.0, minLot: 0.1, maxLot: 200, lotStep: 0.1, decimals: 2 },
  'Natural Gas': { pipSize: 0.001, lotSizeMultiplier: 10000, digits: 3, spread: 0.005, contractSize: 10000, tickSize: 0.001, tickValue: 10.0, minLot: 0.1, maxLot: 100, lotStep: 0.1, decimals: 3 },

  // Crypto
  'BTCUSD': { pipSize: 1.0, lotSizeMultiplier: 1, digits: 2, spread: 15.0, contractSize: 1, tickSize: 0.01, tickValue: 0.01, minLot: 0.01, maxLot: 50, lotStep: 0.01, decimals: 2 },
  'ETHUSD': { pipSize: 0.1, lotSizeMultiplier: 1, digits: 2, spread: 1.5, contractSize: 1, tickSize: 0.1, tickValue: 0.1, minLot: 0.1, maxLot: 100, lotStep: 0.1, decimals: 2 },
  'SOLUSD': { pipSize: 0.01, lotSizeMultiplier: 1, digits: 2, spread: 0.12, contractSize: 10, tickSize: 0.01, tickValue: 0.1, minLot: 0.1, maxLot: 500, lotStep: 0.1, decimals: 2 },
  'XRPUSD': { pipSize: 0.0001, lotSizeMultiplier: 1, digits: 4, spread: 0.0005, contractSize: 1000, tickSize: 0.0001, tickValue: 0.1, minLot: 1.0, maxLot: 10000, lotStep: 1.0, decimals: 4 },
  'BNBUSD': { pipSize: 0.1, lotSizeMultiplier: 1, digits: 2, spread: 0.50, contractSize: 1, tickSize: 0.1, tickValue: 0.1, minLot: 0.1, maxLot: 100, lotStep: 0.1, decimals: 2 },
  'DOGEUSD': { pipSize: 0.00001, lotSizeMultiplier: 1, digits: 5, spread: 0.00015, contractSize: 10000, tickSize: 0.00001, tickValue: 0.1, minLot: 1.0, maxLot: 50000, lotStep: 1.0, decimals: 5 },
  'ADAUSD': { pipSize: 0.0001, lotSizeMultiplier: 1, digits: 4, spread: 0.0005, contractSize: 1000, tickSize: 0.0001, tickValue: 0.1, minLot: 1.0, maxLot: 10000, lotStep: 1.0, decimals: 4 },

  // Backwards compatible fallbacks
  'EUR/USD': { pipSize: 0.0001, lotSizeMultiplier: 100000, digits: 5, spread: 0.00012, contractSize: 100000, tickSize: 0.00001, tickValue: 1.0, minLot: 0.01, maxLot: 100, lotStep: 0.01, decimals: 5 },
  'GBP/USD': { pipSize: 0.0001, lotSizeMultiplier: 100000, digits: 5, spread: 0.00016, contractSize: 100000, tickSize: 0.00001, tickValue: 1.0, minLot: 0.01, maxLot: 100, lotStep: 0.01, decimals: 5 },
  'USD/JPY': { pipSize: 0.01, lotSizeMultiplier: 100000, digits: 3, spread: 0.015, contractSize: 100000, tickSize: 0.001, tickValue: 0.64, minLot: 0.01, maxLot: 100, lotStep: 0.01, decimals: 3 },
  'BTC/USD': { pipSize: 1.0, lotSizeMultiplier: 1, digits: 2, spread: 8.0, contractSize: 1, tickSize: 0.01, tickValue: 0.01, minLot: 0.01, maxLot: 50, lotStep: 0.01, decimals: 2 },
  'GOLD': { pipSize: 0.1, lotSizeMultiplier: 100, digits: 2, spread: 0.25, contractSize: 100, tickSize: 0.01, tickValue: 1.0, minLot: 0.01, maxLot: 50, lotStep: 0.01, decimals: 2 }
};

export const DYNAMIC_CONFIG_MAP: Record<string, { contract: number; tick: number }> = {
  'XAUUSD': { contract: 100, tick: 0.1 },
  'GOLD': { contract: 100, tick: 0.1 },
  'EURUSD': { contract: 100000, tick: 0.0001 },
  'EUR/USD': { contract: 100000, tick: 0.0001 }
};

export function getSymbolContract(symbol: string): number {
  const key = symbol.toUpperCase().replace('/', '');
  if (DYNAMIC_CONFIG_MAP[key]) {
    return DYNAMIC_CONFIG_MAP[key].contract;
  }
  return ASSET_PROPERTIES[key]?.contractSize || ASSET_PROPERTIES[symbol]?.contractSize || 100000;
}

export function getSymbolTick(symbol: string): number {
  const key = symbol.toUpperCase().replace('/', '');
  if (DYNAMIC_CONFIG_MAP[key]) {
    return DYNAMIC_CONFIG_MAP[key].tick;
  }
  return ASSET_PROPERTIES[key]?.pipSize || ASSET_PROPERTIES[symbol]?.pipSize || 0.0001;
}

