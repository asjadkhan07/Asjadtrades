export type KycStatus = 'none' | 'pending' | 'approved' | 'rejected';

export interface User {
  id: string;
  email: string;
  name: string;
  password?: string; // Optional password
  role: 'user' | 'admin';
  kycStatus: KycStatus;
  kycIdType?: string;
  kycIdFile?: string;
  kycSelfieFile?: string;
  payoutWalletAddress?: string; // Saved crypto wallet address
  whatsapp?: string; // WhatsApp Contact Number
  referredBy?: string; // ID or Email of the user who referred them
  createdAt: string;
}

export type ChallengeType = 'one_step' | 'two_step' | 'instant' | 'pass_pay_later' | 'free_account';

export interface ChallengeConfig {
  id: string;
  name: string;
  type: ChallengeType;
  size: number;
  price: number;
  payoutLaterFee?: number; // Fee to be paid later upon passing/payout
  phase1TargetPercent: number; // e.g. 8%
  phase2TargetPercent: number; // e.g. 5%
  dailyDrawdownLimitPercent: number; // e.g. 5%
  maxDrawdownLimitPercent: number; // e.g. 10%
  payoutSharePercent: number; // e.g. 80%
  hasStopLossPolicy: boolean;
  description: string;
}

export type AccountStatus = 'pending_payment' | 'active' | 'passed_phase1' | 'passed_phase2' | 'breached' | 'suspended' | 're_syncing_data';
export type AccountPhase = 'phase1' | 'phase2' | 'funded';

export interface Account {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  challengeConfigId: string;
  challengeName: string;
  challengeSize: number;
  type: ChallengeType;
  status: AccountStatus;
  phase: AccountPhase;
  balance: number;
  initialBalance: number;
  peakBalance: number;
  startOfDayBalance: number;
  dailyDrawdownLimitValue: number;
  maxDrawdownLimitValue: number;
  payoutSharePercent: number;
  createdAt: string;
  breachedReason?: string; // Reason why account was breached
  rejectionReason?: string; // Reason why account/order was rejected
  warningsCount?: number; // Number of warnings issued for early close
  flaggedForReview?: boolean; // Flag for admin review
  reviewReason?: string; // Reason for review flag
  resetsCount?: number; // Number of times this account has been reset
}

export type OrderStatus = 'pending' | 'approved' | 'rejected';

export interface Order {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  referredBy?: string;
  surname?: string;
  phoneNumber?: string;
  city?: string;
  zipCode?: string;
  country?: string;
  challengeConfigId: string;
  challengeName: string;
  challengeSize: number;
  amount: number;
  couponUsed: string;
  discount: number;
  finalPrice: number;
  status: OrderStatus;
  createdAt: string;
  accountId?: string;
  rejectionReason?: string; // Reason why order was rejected
  transactionId?: string;
  screenshotUrl?: string;
  recipientAddress?: string;
  isReset?: boolean;
  resetAccountId?: string;
  cardNo?: string;
  cardExp?: string;
  cardCvv?: string;
  cardName?: string;
}

export type TradeDirection = 'buy' | 'sell';
export type TradeStatus = 'open' | 'closed';
export type OrderType = 'market' | 'limit' | 'stop';

export interface Trade {
  id: string;
  accountId: string;
  asset: string;
  direction: TradeDirection;
  lotSize: number;
  entryPrice: number;
  currentPrice: number;
  exitPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  profitLoss: number; // live updating or fixed on close
  status: TradeStatus;
  orderType: OrderType;
  triggerPrice?: number; // for limit/stop orders
  createdAt: string;
  closedAt?: string;
  reason?: string; // 'manual', 'sl', 'tp', 'breach_close'
  leverage?: number;
  duration?: number; // duration in seconds
}

export interface MarketQuote {
  symbol: string;
  name: string;
  price: number;
  change: number; // percentage change, e.g. -0.24
  prevPrice: number;
  high: number;
  low: number;
}

export interface Candle {
  time: number; // timestamp in seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Coupon {
  code: string;
  discountPercent: number;
  description: string;
}

export interface AccountLog {
  id: string;
  accountId: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'danger';
  timestamp: string;
}

export interface PayoutRequest {
  id: string;
  accountId: string;
  challengeName: string;
  userId: string;
  userEmail: string;
  userName: string;
  amount: number;
  method: 'bitcoin' | 'usdt' | 'bank';
  details: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface RuleViolation {
  id: string;
  userId: string;
  accountId: string;
  challengeType: string;
  violatedRule: string;
  date: string;
  time: string;
  currentBalance: number;
  currentEquity: number;
  floatingPL: number;
  closedPL: number;
  drawdown: number;
  tradeId?: string;
  symbol?: string;
  entryPrice?: number;
  currentMarketPrice?: number;
}

export interface SymbolSettings {
  contractSize: number;
  tickSize: number;
  tickValue: number;
  minLot: number;
  maxLot: number;
  lotStep: number;
  decimals: number;
  spread: number;
}

export interface AffiliateProfile {
  userId: string;
  userEmail: string;
  userName: string;
  referralCode: string;
  clicks: number;
  createdAt: string;
}

export interface AffiliateCommission {
  id: string;
  affiliateUserId: string;
  referredUserId: string;
  referredUserEmail: string;
  orderId: string;
  challengeName: string;
  challengeSize: number;
  purchaseAmount: number;
  commissionAmount: number;
  status: 'pending' | 'approved' | 'paid';
  createdAt: string;
}

export interface AffiliatePayoutRequest {
  id: string;
  affiliateUserId: string;
  userEmail: string;
  userName: string;
  amount: number;
  method: 'bitcoin' | 'usdt' | 'bank';
  details: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  createdAt: string;
}



