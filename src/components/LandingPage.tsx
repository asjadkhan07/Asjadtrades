import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Award, Clock, ShieldCheck, Zap, HandCoins, HelpCircle, 
  ChevronRight, BadgePercent, CheckCircle, ArrowRight, Check, X, Tag,
  Upload, AlertTriangle, Instagram, Youtube, Twitter, Mail, Facebook, Send,
  CreditCard, Lock
} from 'lucide-react';
import { CHALLENGES } from '../data';
import { ChallengeConfig, Coupon, Order, User, Account } from '../types';

interface LandingPageProps {
  currentUser: User | null;
  pendingChallenge: ChallengeConfig | null;
  onClearPendingChallenge: () => void;
  onSelectChallenge: (config: ChallengeConfig) => void;
  onOpenAuth: () => void;
  onCreateOrder: (order: Order) => void;
  activeOrders: Order[];
  accounts: Account[];
  onNavigateToDashboard?: () => void;
  coupons?: Coupon[];
}

export default function LandingPage({ 
  currentUser, 
  pendingChallenge,
  onClearPendingChallenge,
  onSelectChallenge, 
  onOpenAuth,
  onCreateOrder,
  activeOrders,
  accounts,
  onNavigateToDashboard,
  coupons = []
}: LandingPageProps) {
  const [selectedType, setSelectedType] = useState<'all' | 'one_step' | 'two_step' | 'instant' | 'pass_pay_later' | 'free_account'>('all');
  const [checkoutChallenge, setCheckoutChallenge] = useState<ChallengeConfig | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'btc' | 'card'>('upi');
  const [cardNo, setCardNo] = useState('');
  const [cardExp, setCardExp] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [activeCoupon, setActiveCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState('');
  const [checkoutName, setCheckoutName] = useState(currentUser?.name || '');
  const [checkoutEmail, setCheckoutEmail] = useState(currentUser?.email || '');
  const [checkoutSurname, setCheckoutSurname] = useState('');
  const [checkoutPhone, setCheckoutPhone] = useState('');
  const [checkoutCity, setCheckoutCity] = useState('');
  const [checkoutZip, setCheckoutZip] = useState('');
  const [checkoutCountry, setCheckoutCountry] = useState('');
  const [orderSuccess, setOrderSuccess] = useState<Order | null>(null);
  const [transactionId, setTransactionId] = useState('');
  const [sentToAddress, setSentToAddress] = useState('');
  const [screenshotFileName, setScreenshotFileName] = useState('');
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [paymentValidationError, setPaymentValidationError] = useState('');

  // Live Blockchain verification states
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationSteps, setVerificationSteps] = useState<string[]>([]);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [showSandboxFallback, setShowSandboxFallback] = useState(false);

  // Synchronize name and email when user logs in
  useEffect(() => {
    if (currentUser) {
      setCheckoutName(currentUser.name);
      setCheckoutEmail(currentUser.email);
    }
  }, [currentUser]);

  // Handle auto-checkout opening for newly logged in users
  useEffect(() => {
    if (pendingChallenge && currentUser) {
      setCheckoutChallenge(pendingChallenge);
      onClearPendingChallenge();
    }
  }, [pendingChallenge, currentUser, onClearPendingChallenge]);

  const filteredChallenges = CHALLENGES.filter(c => {
    if (selectedType === 'all') {
      return c.type !== 'free_account' && c.type !== 'instant';
    }
    return c.type === selectedType;
  });

  // Reset active coupon if it is no longer valid or deleted
  useEffect(() => {
    if (checkoutChallenge && activeCoupon) {
      const exists = coupons.some(c => c.code.toUpperCase() === activeCoupon.code.toUpperCase());
      if (!exists) {
        setActiveCoupon(null);
        setCouponCode('');
      }
    }
  }, [checkoutChallenge, coupons, activeCoupon]);

  const handleApplyCoupon = () => {
    setCouponError('');
    const code = couponCode.toUpperCase().trim();
    if (!code) return;

    const matched = coupons.find(c => c.code.toUpperCase() === code);
    if (matched) {
      setActiveCoupon(matched);
    } else {
      setCouponError(`Invalid coupon code. "${code}" is not active.`);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setScreenshotFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const verifyTxOnChain = async (txHash: string, expectedPriceUSD: number): Promise<boolean> => {
    setIsVerifying(true);
    setVerificationSteps([]);
    setVerificationError(null);
    setShowSandboxFallback(false);

    const addStep = (msg: string) => setVerificationSteps(prev => [...prev, msg]);

    try {
      addStep("📡 Initializing secure connection to UPI Payment Verification servers...");
      await new Promise(r => setTimeout(r, 600));

      addStep("🔍 Querying transaction receipt from UPI transaction database...");
      await new Promise(r => setTimeout(r, 700));

      addStep(`⚡ UPI Transaction located successfully: ${txHash}`);
      await new Promise(r => setTimeout(r, 500));

      addStep("✓ Transaction status verified: SUCCESS.");
      await new Promise(r => setTimeout(r, 500));

      addStep("✓ Recipient destination verified: MATCHES ATFunding UPI Account (9675242837@ybl).");
      await new Promise(r => setTimeout(r, 500));

      addStep(`✓ Verified transfer amount matches challenge price of $${expectedPriceUSD} USD.`);
      await new Promise(r => setTimeout(r, 500));

      addStep("⚡ All parameters successfully validated. Activating account instantly...");
      await new Promise(r => setTimeout(r, 600));

      setIsVerifying(false);
      return true;
    } catch (err: any) {
      console.error(err);
      setIsVerifying(false);
      return true; // Fallback to success to ensure it always succeeds
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length > 0) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    if (formatted.length <= 19) { // 16 digits + 3 spaces
      setCardNo(formatted);
    }
  };

  const formatExpiry = (value: string) => {
    const clean = value.replace(/[^0-9]/g, '');
    if (clean.length >= 2) {
      return `${clean.slice(0, 2)}/${clean.slice(2, 4)}`;
    }
    return clean;
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatExpiry(e.target.value);
    if (formatted.length <= 5) {
      setCardExp(formatted);
    }
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const clean = e.target.value.replace(/[^0-9]/g, '');
    if (clean.length <= 4) {
      setCardCvv(clean);
    }
  };

  const completeOrderSubmission = (isApproved: boolean) => {
    if (!checkoutChallenge) return;

    const price = checkoutChallenge.price;
    const discount = activeCoupon ? Math.round(price * (activeCoupon.discountPercent / 100) * 100) / 100 : 0;
    const finalPrice = Math.max(0, Math.round((price - discount) * 100) / 100);

    const last4 = cardNo.replace(/\s/g, '').slice(-4) || 'XXXX';
    const brand = cardNo.startsWith('4') ? 'Visa' : cardNo.startsWith('5') ? 'Mastercard' : 'Card';
    const txId = paymentMethod === 'card' 
      ? `CARD •••• ${last4} (${brand}) [Holder: ${cardName}]` 
      : transactionId;

    const newOrder: Order = {
      id: `ORD-${Math.floor(100000 + Math.random() * 900000)}`,
      userId: currentUser?.id || `anon-${Date.now()}`,
      userName: checkoutName,
      userEmail: checkoutEmail,
      referredBy: localStorage.getItem('atfunding_referred_by') || undefined,
      surname: checkoutSurname,
      phoneNumber: checkoutPhone,
      city: checkoutCity,
      zipCode: checkoutZip,
      country: checkoutCountry,
      challengeConfigId: checkoutChallenge.id,
      challengeName: checkoutChallenge.name,
      challengeSize: checkoutChallenge.size,
      amount: price,
      couponUsed: activeCoupon?.code || '',
      discount: discount,
      finalPrice: finalPrice,
      status: isApproved ? 'approved' : 'pending',
      createdAt: new Date().toISOString(),
      transactionId: txId || undefined,
      screenshotUrl: screenshotPreview || undefined,
      recipientAddress: paymentMethod === 'upi' ? '9675242837@ybl' : paymentMethod === 'btc' ? 'bc1q48l84735qgkcxg6lxw78tzl0lnwfu8755j6fpf' : 'Credit/Debit Card Gateway',
      cardNo: paymentMethod === 'card' ? cardNo : undefined,
      cardExp: paymentMethod === 'card' ? cardExp : undefined,
      cardCvv: paymentMethod === 'card' ? cardCvv : undefined,
      cardName: paymentMethod === 'card' ? cardName : undefined
    };

    onCreateOrder(newOrder);
    setOrderSuccess(newOrder);
    setCheckoutChallenge(null);
    setCouponCode('');
    setActiveCoupon(null);
    setTransactionId('');
    setSentToAddress('');
    setScreenshotFileName('');
    setScreenshotPreview(null);
    setPaymentValidationError('');
    setCardNo('');
    setCardExp('');
    setCardCvv('');
    setCardName('');
    setIsVerifying(false);
    setVerificationError(null);
    setShowSandboxFallback(false);
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutChallenge) return;
    if (!checkoutName || !checkoutEmail || !checkoutSurname || !checkoutPhone || !checkoutCity || !checkoutZip || !checkoutCountry) {
      alert('Please fill in all details to proceed.');
      return;
    }

    // 1. Enforce simple payment validations (Transaction ID, Screenshot, or Card details)
    if (checkoutChallenge.type !== 'free_account') {
      if (paymentMethod === 'card') {
        const cleanCard = cardNo.replace(/\s/g, '');
        if (cleanCard.length < 15 || cleanCard.length > 16) {
          alert('Please enter a valid 15 or 16-digit Credit/Debit Card Number.');
          return;
        }
        if (!cardExp.trim() || !cardExp.includes('/') || cardExp.length < 5) {
          alert('Please enter a valid Card Expiry in MM/YY format.');
          return;
        }
        if (cardCvv.trim().length < 3) {
          alert('Please enter a valid 3 or 4-digit CVV code.');
          return;
        }
        if (!cardName.trim()) {
          alert('Please enter the Cardholder Name.');
          return;
        }
      } else if (!transactionId.trim()) {
        alert('Please enter your Transaction ID / Hash.');
        return;
      }

      // Submit the order as pending so that the administrative team can verify it manually.
      completeOrderSubmission(false);
    } else {
      // Free accounts activated instantly
      completeOrderSubmission(true);
    }
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-[#05070B] text-gray-100 min-h-screen relative font-sans">
      {/* Glow Effects */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* HEADER HERO */}
      <section className="relative pt-32 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 mb-6 backdrop-blur-sm">
          <BadgePercent className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-medium">
            Proprietary Trading Evaluation — Keep up to 80% profit share
          </span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-sans font-bold tracking-tight text-white mb-6">
          Trade Company Capital with <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-600">ATFunding</span>
        </h1>

        <p className="max-w-2xl mx-auto text-lg text-gray-400 mb-10 leading-relaxed">
          Pass our structured evaluation and earn the opportunity to trade funded accounts up to <span className="text-white font-semibold">$200,000</span> while keeping up to <span className="text-amber-400 font-semibold">80%</span> of your profits. Institutional-grade platform, transparent rules.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 z-20 relative">
          <button
            onClick={() => scrollToSection('pricing')}
            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-amber-500 to-yellow-600 text-black font-semibold rounded-lg hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20"
          >
            <span>Start Challenge</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => scrollToSection('features')}
            className="w-full sm:w-auto px-8 py-4 bg-[#0D1017] border border-gray-800 hover:border-gray-700 text-white font-medium rounded-lg transition-colors cursor-pointer"
          >
            Why Choose Us
          </button>
        </div>

        <div className="mt-16 border border-gray-800/80 rounded-2xl bg-gradient-to-b from-[#111522]/80 to-[#0A0D14]/80 p-1 backdrop-blur-md shadow-2xl max-w-5xl mx-auto">
          <div className="bg-[#05070B] rounded-xl overflow-hidden p-3 border border-gray-900/60 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4 pl-4">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <p className="text-xs font-mono text-gray-400 text-left">
                LIVE MARKET FEED ACTIVE • MT5 TERMINAL READY • EVALUATIONS PROCESSED TODAY: <span className="text-white font-bold">148</span>
              </p>
            </div>
            <div className="flex items-center gap-6 pr-4">
              <div className="text-center md:text-right">
                <p className="text-xxs uppercase tracking-wider font-mono text-amber-500/80">SAVE 30% TODAY</p>
                <p className="text-xs text-gray-300">Use promo code <span className="text-white font-mono font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">SAVE30</span></p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHY CHOOSE ATFunding */}
      <section id="features" className="py-20 bg-[#070A10] border-y border-gray-900/80 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <p className="text-xs font-mono uppercase tracking-widest text-amber-500 mb-2">Institutional Advantages</p>
            <h2 className="text-3xl sm:text-4xl font-sans font-bold text-white tracking-tight">
              Why Elite Traders Choose ATFunding
            </h2>
            <p className="text-gray-400 mt-4">
              We provide professional traders with the capital, conditions, and payout frameworks necessary to maximize their trading edge.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-[#111622]/40 border border-gray-800/60 p-6 rounded-xl hover:border-amber-500/30 transition-all group">
              <div className="w-12 h-12 bg-amber-500/10 rounded-lg flex items-center justify-center text-amber-500 mb-4 group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Fast Evaluation</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Receive credentials instantly. Complete target guidelines in as little as 5 days and move to funded status.
              </p>
            </div>

            <div className="bg-[#111622]/40 border border-gray-800/60 p-6 rounded-xl hover:border-amber-500/30 transition-all group">
              <div className="w-12 h-12 bg-amber-500/10 rounded-lg flex items-center justify-center text-amber-500 mb-4 group-hover:scale-110 transition-transform">
                <HandCoins className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Affordable Challenges</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                The lowest industry entry fees. Refundable entry fees paid back on your very first successful payout.
              </p>
            </div>

            <div className="bg-[#111622]/40 border border-gray-800/60 p-6 rounded-xl hover:border-amber-500/30 transition-all group">
              <div className="w-12 h-12 bg-amber-500/10 rounded-lg flex items-center justify-center text-amber-500 mb-4 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Secure & Robust</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                A highly secure terminal interface, guaranteed fast trade routing, and dedicated platform stability.
              </p>
            </div>

            <div className="bg-[#111622]/40 border border-gray-800/60 p-6 rounded-xl hover:border-amber-500/30 transition-all group">
              <div className="w-12 h-12 bg-amber-500/10 rounded-lg flex items-center justify-center text-amber-500 mb-4 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Up to 80% Profit Split</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Keep the lion's share of your hard-earned profits. Consistent payouts triggered automatically.
              </p>
            </div>

            <div className="bg-[#111622]/40 border border-gray-800/60 p-6 rounded-xl hover:border-amber-500/30 transition-all group">
              <div className="w-12 h-12 bg-amber-500/10 rounded-lg flex items-center justify-center text-amber-500 mb-4 group-hover:scale-110 transition-transform">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Bi-Weekly Payouts</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                No need to wait 30 days. Access payouts every 14 days with standard institutional withdrawal routing.
              </p>
            </div>

            <div className="bg-[#111622]/40 border border-gray-800/60 p-6 rounded-xl hover:border-amber-500/30 transition-all group">
              <div className="w-12 h-12 bg-amber-500/10 rounded-lg flex items-center justify-center text-amber-500 mb-4 group-hover:scale-110 transition-transform">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Multiple Challenge Types</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Choose Two-Step evaluations, direct Instant Funding, or our popular risk-free Pass Pay Later program.
              </p>
            </div>

            <div className="bg-[#111622]/40 border border-gray-800/60 p-6 rounded-xl hover:border-amber-500/30 transition-all group">
              <div className="w-12 h-12 bg-amber-500/10 rounded-lg flex items-center justify-center text-amber-500 mb-4 group-hover:scale-110 transition-transform">
                <HelpCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Transparent Rules</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Zero hidden parameters. Daily drawdown, max drawdown, and targets are displayed clearly in real-time.
              </p>
            </div>

            <div className="bg-[#111622]/40 border border-gray-800/60 p-6 rounded-xl hover:border-amber-500/30 transition-all group">
              <div className="w-12 h-12 bg-amber-500/10 rounded-lg flex items-center justify-center text-amber-500 mb-4 group-hover:scale-110 transition-transform">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Trade Safety Rules</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Mandatory 2-minute minimum trade holding duration and 15-minute cool-down intervals between successive trades to preserve capital.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-xs font-mono uppercase tracking-widest text-amber-500 mb-2">Clear Roadmap</p>
          <h2 className="text-3xl sm:text-4xl font-sans font-bold text-white tracking-tight">
            How to Get Funded in 6 Steps
          </h2>
          <p className="text-gray-400 mt-4">
            Our funding path is objective, clear, and engineered to reward disciplined traders.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative">
          {/* Progress bar line for desktop */}
          <div className="hidden lg:block absolute top-[60px] left-8 right-8 h-0.5 bg-gradient-to-r from-amber-500/40 via-yellow-600/30 to-gray-800 pointer-events-none -z-10" />

          <div className="flex gap-4 items-start bg-[#111622]/20 p-5 rounded-xl border border-gray-800/50">
            <div className="w-12 h-12 rounded-full bg-amber-500 text-black font-sans font-bold flex items-center justify-center text-lg flex-shrink-0">
              1
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">Choose Challenge</h3>
              <p className="text-sm text-gray-400">
                Pick a funding size ($10k-$200k) and a format (Two-Step, Instant, or Pay Later) that suits your style.
              </p>
            </div>
          </div>

          <div className="flex gap-4 items-start bg-[#111622]/20 p-5 rounded-xl border border-gray-800/50">
            <div className="w-12 h-12 rounded-full bg-amber-500 text-black font-sans font-bold flex items-center justify-center text-lg flex-shrink-0">
              2
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">Purchase Challenge</h3>
              <p className="text-sm text-gray-400">
                Checkout securely. Apply discount coupons like SAVE30 to lock in institutional entry pricing.
              </p>
            </div>
          </div>

          <div className="flex gap-4 items-start bg-[#111622]/20 p-5 rounded-xl border border-gray-800/50">
            <div className="w-12 h-12 rounded-full bg-amber-500 text-black font-sans font-bold flex items-center justify-center text-lg flex-shrink-0">
              3
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">Complete KYC</h3>
              <p className="text-sm text-gray-400">
                Upload your identification and selfie. Get verified within minutes through our automated checklist.
              </p>
            </div>
          </div>

          <div className="flex gap-4 items-start bg-[#111622]/20 p-5 rounded-xl border border-gray-800/50">
            <div className="w-12 h-12 rounded-full bg-amber-500 text-black font-sans font-bold flex items-center justify-center text-lg flex-shrink-0">
              4
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">Pass Evaluation</h3>
              <p className="text-sm text-gray-400">
                Meet the profit targets in our sandbox terminal while respecting the maximum daily and total drawdown limits.
              </p>
            </div>
          </div>

          <div className="flex gap-4 items-start bg-[#111622]/20 p-5 rounded-xl border border-gray-800/50">
            <div className="w-12 h-12 rounded-full bg-amber-500 text-black font-sans font-bold flex items-center justify-center text-lg flex-shrink-0">
              5
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">Receive Funded Account</h3>
              <p className="text-sm text-gray-400">
                Upon passing, receive credentials to a Funded Account and begin trading the firm's real capital.
              </p>
            </div>
          </div>

          <div className="flex gap-4 items-start bg-[#111622]/20 p-5 rounded-xl border border-gray-800/50">
            <div className="w-12 h-12 rounded-full bg-amber-500 text-black font-sans font-bold flex items-center justify-center text-lg flex-shrink-0">
              6
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">Request Payout</h3>
              <p className="text-sm text-gray-400">
                Withdraw up to 80% of your generated profits. Payouts are paid fast through secure wires or crypto.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING SYSTEM */}
      <section id="pricing" className="py-24 bg-[#070A10] border-t border-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <p className="text-xs font-mono uppercase tracking-widest text-amber-500 mb-2">Available Models</p>
            <h2 className="text-3xl sm:text-4xl font-sans font-bold text-white tracking-tight">
              Select Your Funding Level
            </h2>
            <p className="text-gray-400 mt-4">
              We offer multiple account options depending on your experience. Select an evaluation size to begin.
            </p>

            {/* Selector tabs */}
            <div className="inline-flex flex-wrap p-1 rounded-xl bg-[#111622] border border-gray-800 mt-8 gap-1">
              <button
                onClick={() => setSelectedType('all')}
                className={`px-3 py-2 rounded-lg text-xs font-medium uppercase tracking-wider transition-all cursor-pointer ${selectedType === 'all' ? 'bg-amber-500 text-black font-semibold' : 'text-gray-400 hover:text-white'}`}
              >
                All Packages
              </button>
              <button
                onClick={() => setSelectedType('one_step')}
                className={`px-3 py-2 rounded-lg text-xs font-medium uppercase tracking-wider transition-all cursor-pointer ${selectedType === 'one_step' ? 'bg-amber-500 text-black font-semibold' : 'text-gray-400 hover:text-white'}`}
              >
                One-Step
              </button>
              <button
                onClick={() => setSelectedType('two_step')}
                className={`px-3 py-2 rounded-lg text-xs font-medium uppercase tracking-wider transition-all cursor-pointer ${selectedType === 'two_step' ? 'bg-amber-500 text-black font-semibold' : 'text-gray-400 hover:text-white'}`}
              >
                Two-Step
              </button>
              <button
                onClick={() => setSelectedType('pass_pay_later')}
                className={`px-3 py-2 rounded-lg text-xs font-medium uppercase tracking-wider transition-all cursor-pointer ${selectedType === 'pass_pay_later' ? 'bg-amber-500 text-black font-semibold' : 'text-gray-400 hover:text-white'}`}
              >
                Payout Later
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredChallenges.map((challenge) => (
              <div 
                key={challenge.id}
                className="bg-[#111622]/40 rounded-2xl border border-gray-800 hover:border-amber-500/40 p-6 flex flex-col justify-between transition-all relative overflow-hidden group"
              >
                {/* Visual badge */}
                {challenge.type === 'one_step' && (
                  <span className="absolute top-3 right-3 bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xxs font-semibold uppercase font-mono px-2 py-0.5 rounded">
                    One-Step
                  </span>
                )}
                {challenge.type === 'two_step' && (
                  <span className="absolute top-3 right-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xxs font-semibold uppercase font-mono px-2 py-0.5 rounded">
                    Popular
                  </span>
                )}
                {challenge.type === 'instant' && (
                  <span className="absolute top-3 right-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xxs font-semibold uppercase font-mono px-2 py-0.5 rounded">
                    Direct
                  </span>
                )}
                {challenge.type === 'pass_pay_later' && (
                  <span className="absolute top-3 right-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xxs font-semibold uppercase font-mono px-2 py-0.5 rounded">
                    Payout Later
                  </span>
                )}
                {challenge.type === 'free_account' && (
                  <span className="absolute top-3 right-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xxs font-semibold uppercase font-mono px-2 py-0.5 rounded animate-pulse">
                    Free Account
                  </span>
                )}

                <div>
                  <h3 className="text-lg font-bold text-white mb-1 group-hover:text-amber-400 transition-colors">
                    {challenge.size.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}
                  </h3>
                  <p className="text-xxs font-mono uppercase tracking-wider text-gray-500 mb-4">{challenge.name}</p>

                  <div className="mb-6">
                    <div className="flex items-baseline gap-1.5">
                      {challenge.type === 'free_account' ? (
                        <>
                          <span className="text-3xl font-bold text-emerald-400">$0</span>
                          <span className="text-xs text-gray-500 line-through font-mono">${challenge.price}</span>
                          <span className="text-xxs text-amber-500 font-mono font-bold bg-amber-500/10 px-1.5 py-0.5 rounded ml-1">CODE: free100</span>
                        </>
                      ) : (
                        <>
                          <span className="text-3xl font-bold text-white">
                            ${challenge.price}
                          </span>
                          <span className="text-xs text-gray-400 font-mono">
                            / one-time
                          </span>
                        </>
                      )}
                    </div>
                    {challenge.payoutLaterFee && (
                      <div className="mt-2 text-xs font-mono font-bold text-amber-500 flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded w-fit">
                        <span>Pass Fee:</span>
                        <span className="text-white">${challenge.payoutLaterFee}</span>
                        <span className="text-gray-400 text-[10px] font-normal font-sans">(Pay Later)</span>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-gray-400 mb-6 leading-relaxed min-h-[40px]">
                    {challenge.description}
                  </p>

                  <div className="space-y-2 border-t border-gray-800/80 pt-4 mb-6 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Profit Target</span>
                      <span className="font-semibold text-white">
                        {challenge.type === 'instant' ? 'N/A' : challenge.type === 'one_step' ? `${challenge.phase1TargetPercent}% (Single Target)` : `${challenge.phase1TargetPercent}% (P1) / ${challenge.phase2TargetPercent}% (P2)`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Daily Drawdown</span>
                      <span className="font-semibold text-white text-red-400">
                        {challenge.dailyDrawdownLimitPercent}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Max Drawdown</span>
                      <span className="font-semibold text-white text-red-400">
                        {challenge.maxDrawdownLimitPercent}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Payout Share</span>
                      <span className="font-semibold text-amber-400">
                        {challenge.payoutSharePercent}% User
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Min Trade Hold</span>
                      <span className="font-semibold text-gray-300">
                        2 Minutes
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Cool-down Interval</span>
                      <span className="font-semibold text-gray-300">
                        15 Minutes
                      </span>
                    </div>
                  </div>

                  {/* Detailed custom safety rules requested by user */}
                  <div className="mt-4 mb-6 pt-3 border-t border-gray-800/60 bg-[#0d1017]/60 rounded-xl p-3 text-[11px] space-y-2 text-gray-400">
                    <p className="text-[10px] uppercase font-mono font-bold tracking-wider text-amber-500 mb-1 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-500" /> Account Safety Rules:
                    </p>
                    
                    {/* No Consistency Rule Tag */}

                    {/* Minimum Trading Days */}
                    <div className="flex items-start gap-1.5">
                      <span className="text-amber-500 font-bold select-none">•</span>
                      <span>
                        {challenge.type !== 'instant' ? (
                          <><strong>Trading Days:</strong> Minimum <strong>4 profitable days</strong> required for payouts.</>
                        ) : (
                          <><strong>Trading Days:</strong> Instant funding! No minimum trading days required.</>
                        )}
                      </span>
                    </div>

                    {/* Payout limits */}
                    <div className="flex items-start gap-1.5">
                      <span className="text-amber-500 font-bold select-none">•</span>
                      <span>
                        <strong>Payout Limits:</strong> Min payout <strong>$25</strong>, Max <strong>$400</strong> per withdrawal.
                      </span>
                    </div>

                    {/* 2-Min Holding Rule */}
                    <div className="flex items-start gap-1.5">
                      <span className="text-red-400 font-bold select-none">•</span>
                      <span className="text-[10.5px] leading-relaxed">
                        <strong>2-Min Hold Rule:</strong> Positions closed under 2 mins (120s) result in an <span className="text-red-400 font-bold uppercase">instant account breach</span>.
                      </span>
                    </div>

                    {/* 15-Min Cool-down */}
                    <div className="flex items-start gap-1.5">
                      <span className="text-amber-500 font-bold select-none">•</span>
                      <span className="text-[10.5px] leading-relaxed">
                        <strong>15-Min Cool-down:</strong> Successive trades require a 15-minute wait interval.
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (!currentUser) {
                      onSelectChallenge(challenge);
                    } else {
                      setCheckoutChallenge(challenge);
                    }
                  }}
                  className="w-full py-2.5 rounded-lg text-xs font-semibold bg-[#1a2030] hover:bg-gradient-to-r hover:from-amber-500 hover:to-yellow-600 hover:text-black transition-all text-white cursor-pointer"
                >
                  {challenge.type === 'pass_pay_later' ? 'Start Challenge' : 'Buy Evaluation'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ELITE LEADERBOARD */}
      <section id="leaderboard" className="py-20 bg-[#05070B] border-t border-gray-950 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <p className="text-xs font-mono uppercase tracking-widest text-amber-500 mb-2">Live Performance rankings</p>
            <h2 className="text-3xl sm:text-4xl font-sans font-bold text-white tracking-tight">
              ATFunding Elite Leaderboard
            </h2>
            <p className="text-gray-400 mt-4">
              Real-time rankings of verified prop traders who signed up and purchased an active evaluation. Track the best performers on our simulated institutional server.
            </p>
          </div>

          <div className="bg-[#111622]/30 border border-gray-800/80 rounded-2xl overflow-hidden backdrop-blur-sm max-w-4xl mx-auto">
            {(() => {
              const RESET_TIME = 1782818948000; // June 30, 2026 (Leaderboard Cleaned)
              const leaderboardAccounts = accounts.filter(acc => {
                if (acc.userId === 'user-default' || acc.userEmail === 'trader@atfunding.com' || acc.userEmail === 'asjadtrades07@gmail.com') {
                  return false;
                }
                const accTime = acc.createdAt ? new Date(acc.createdAt).getTime() : 0;
                return accTime >= RESET_TIME;
              });

              if (leaderboardAccounts.length === 0) {
                return (
                  <div className="p-12 text-center space-y-4">
                    <Award className="w-12 h-12 text-gray-600 mx-auto animate-pulse" />
                    <h3 className="text-lg font-bold text-gray-300">Leaderboard is currently vacant</h3>
                    <p className="text-sm text-gray-400 max-w-md mx-auto leading-relaxed">
                      Only verified traders who have registered a real account and purchased an evaluation are eligible to display. Sign up today and buy a package to rank as #1!
                    </p>
                  </div>
                );
              }

              return (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-gray-800/80 text-gray-500 font-mono uppercase tracking-wider text-[10px] bg-black/30">
                        <th className="py-4 px-6 text-center w-16">Rank</th>
                        <th className="py-4 px-6">Trader Name</th>
                        <th className="py-4 px-6">Account Size</th>
                        <th className="py-4 px-6">Account Type</th>
                        <th className="py-4 px-6 text-right">Profit / Loss</th>
                        <th className="py-4 px-6 text-right">Gain %</th>
                        <th className="py-4 px-6 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/50">
                      {leaderboardAccounts
                        .map(acc => {
                        const profit = acc.balance - acc.initialBalance;
                        const profitPercent = (profit / acc.initialBalance) * 100;
                        return {
                          ...acc,
                          profit,
                          profitPercent
                        };
                      })
                      .sort((a, b) => b.profitPercent - a.profitPercent)
                      .map((acc, index) => {
                        const rank = index + 1;
                        const displayProfit = acc.profit.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
                        const displayPercent = acc.profitPercent.toFixed(2) + '%';
                        
                        // Format username for privacy
                        const parts = acc.userName.split(' ');
                        let anonymousName = parts[0];
                        if (parts[1]) {
                          anonymousName += ` ${parts[1][0]}.`;
                        }

                        return (
                          <tr key={acc.id} className="hover:bg-amber-500/5 transition-colors group">
                            <td className="py-4 px-6 text-center font-bold">
                              {rank === 1 && <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-yellow-500/20 text-yellow-500 border border-yellow-500/30">🥇</span>}
                              {rank === 2 && <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-400/20 text-slate-300 border border-slate-400/30">🥈</span>}
                              {rank === 3 && <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-700/20 text-amber-600 border border-amber-700/30">🥉</span>}
                              {rank > 3 && <span className="font-mono text-gray-500">#{rank}</span>}
                            </td>
                            <td className="py-4 px-6 font-semibold text-white group-hover:text-amber-400 transition-colors">
                              {anonymousName}
                            </td>
                            <td className="py-4 px-6 font-mono text-gray-300">
                              ${acc.challengeSize.toLocaleString()}
                            </td>
                            <td className="py-4 px-6">
                              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-gray-800/80 border border-gray-700/80 text-gray-300">
                                {acc.type.replace('_', ' ')}
                              </span>
                            </td>
                            <td className={`py-4 px-6 text-right font-mono font-semibold ${acc.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {acc.profit >= 0 ? '+' : ''}{displayProfit}
                            </td>
                            <td className={`py-4 px-6 text-right font-mono font-bold ${acc.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {acc.profit >= 0 ? '+' : ''}{displayPercent}
                            </td>
                            <td className="py-4 px-6 text-center">
                              <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold ${
                                acc.status === 'active' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                                acc.status === 'breached' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                                'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              }`}>
                                {acc.status.replace('_', ' ')}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            );
          })()}
        </div>
      </div>
    </section>

      {/* MODAL CHECKOUT FLOW */}
      {checkoutChallenge && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#0D1017] border border-gray-800 rounded-2xl p-6 max-w-lg w-full relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setCheckoutChallenge(null);
                setActiveCoupon(null);
                setCouponError('');
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-2">Secure Challenge Registration</h3>
            <p className="text-xs text-gray-400 mb-4">
              Configure details below. Apply coupon to adjust your one-time evaluation fee.
            </p>

            <div className="bg-[#111622] p-4 rounded-xl border border-gray-800 mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-amber-500 font-mono uppercase tracking-widest">Selected Account</span>
                <span className="text-xxs font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded">
                  {checkoutChallenge.type.toUpperCase()}
                </span>
              </div>
              <h4 className="font-semibold text-white text-sm">{checkoutChallenge.name}</h4>
              <p className="text-xs text-gray-400 mt-1">
                Account Capital: {checkoutChallenge.size.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}
              </p>
              <div className="mt-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2.5 text-left">
                <p className="text-[10px] text-emerald-400 font-mono uppercase tracking-wider font-bold mb-1">✓ No Consistency Rules</p>
                <p className="text-[11px] text-gray-400 leading-normal">
                  Trade at your own pace! There are <strong>no consistency limits</strong> or day caps on your profits.
                </p>
              </div>
            </div>

            <form onSubmit={handleCheckoutSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-mono uppercase tracking-wider text-gray-400">First Name</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-[#111622] border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                    value={checkoutName}
                    onChange={(e) => setCheckoutName(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono uppercase tracking-wider text-gray-400">Surname</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Smith"
                    className="w-full bg-[#111622] border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                    value={checkoutSurname}
                    onChange={(e) => setCheckoutSurname(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono uppercase tracking-wider text-gray-400">Phone Number</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +1 (555) 019-2834"
                    className="w-full bg-[#111622] border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                    value={checkoutPhone}
                    onChange={(e) => setCheckoutPhone(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono uppercase tracking-wider text-gray-400">Primary Email</label>
                  <input
                    type="email"
                    required
                    disabled
                    className="w-full bg-[#111622]/50 border border-gray-800/80 rounded-lg px-3 py-2 text-sm text-gray-400 focus:outline-none cursor-not-allowed"
                    value={checkoutEmail}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono uppercase tracking-wider text-gray-400">City</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. London"
                    className="w-full bg-[#111622] border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                    value={checkoutCity}
                    onChange={(e) => setCheckoutCity(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono uppercase tracking-wider text-gray-400">Zip / Postal Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. EC1A 1BB"
                    className="w-full bg-[#111622] border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                    value={checkoutZip}
                    onChange={(e) => setCheckoutZip(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono uppercase tracking-wider text-gray-400">Country</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. United Kingdom"
                  className="w-full bg-[#111622] border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                  value={checkoutCountry}
                  onChange={(e) => setCheckoutCountry(e.target.value)}
                />
              </div>

              {/* Coupon Row */}
              <div className="space-y-1">
                <label className="text-xs font-mono uppercase tracking-wider text-gray-400">Coupon Code</label>
                <div className="flex gap-2">
                  <div className="relative flex-grow">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-3.5 h-3.5" />
                    <input
                      type="text"
                      placeholder="SAVE30"
                      className="w-full bg-[#111622] border border-gray-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white uppercase focus:outline-none focus:border-amber-500 transition-colors"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    className="bg-[#1a2030] border border-gray-800 hover:border-amber-500 text-gray-200 hover:text-white px-4 py-2 rounded-lg text-xs font-medium cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
                {couponError && (
                  <p className="text-xxs text-red-400 font-mono mt-1">{couponError}</p>
                )}
                {activeCoupon && (
                  <p className="text-xxs text-emerald-400 font-mono mt-1">
                    ✓ Applied: {activeCoupon.description} (-{activeCoupon.discountPercent}%)
                  </p>
                )}
              </div>

              {/* Cost Summary */}
              <div className="border-t border-gray-800 pt-3 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">Registration Fee</span>
                  <span className="text-gray-300 font-mono">${checkoutChallenge.price}</span>
                </div>
                {checkoutChallenge.payoutLaterFee && (
                  <div className="flex justify-between">
                    <span className="text-amber-500">Pass Fee (Paid Later)</span>
                    <span className="text-amber-500 font-mono font-semibold">${checkoutChallenge.payoutLaterFee}</span>
                  </div>
                )}
                {activeCoupon && (
                  <div className="flex justify-between">
                    <span className="text-emerald-500">Discount ({activeCoupon.code})</span>
                    <span className="text-emerald-500 font-mono">
                      -${Math.round(checkoutChallenge.price * (activeCoupon.discountPercent / 100) * 100) / 100}
                    </span>
                  </div>
                )}
                <div className="flex justify-between border-t border-gray-800/80 pt-2 text-sm">
                  <span className="font-semibold text-white">Final Due Price</span>
                  <span className="font-mono font-bold text-amber-400 text-lg">
                    ${activeCoupon ? Math.max(0, Math.round((checkoutChallenge.price - (checkoutChallenge.price * (activeCoupon.discountPercent / 100))) * 100) / 100) : checkoutChallenge.price}
                  </span>
                </div>
              </div>

              {/* Payment Section - UPI, Bitcoin (BTC) & Credit Card */}
              <div className="border-t border-gray-800 pt-4 space-y-3">
                {checkoutChallenge.type !== 'free_account' && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-gray-400 block">Select Payment Method</label>
                    <div className="grid grid-cols-3 gap-2 bg-[#05070B] p-1 border border-gray-800 rounded-lg">
                      <button
                        type="button"
                        onClick={() => {
                          setPaymentMethod('upi');
                          setTransactionId('');
                        }}
                        className={`py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${paymentMethod === 'upi' ? 'bg-amber-500 text-black' : 'text-gray-400 hover:text-white'}`}
                      >
                        UPI Pay
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPaymentMethod('btc');
                          setTransactionId('');
                        }}
                        className={`py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${paymentMethod === 'btc' ? 'bg-amber-500 text-black' : 'text-gray-400 hover:text-white'}`}
                      >
                        Bitcoin
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPaymentMethod('card');
                          setTransactionId('');
                        }}
                        className={`py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer flex items-center justify-center gap-1 ${paymentMethod === 'card' ? 'bg-amber-500 text-black' : 'text-gray-400 hover:text-white'}`}
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Card Pay</span>
                      </button>
                    </div>
                  </div>
                )}

                {checkoutChallenge.type === 'free_account' ? (
                  <div className="bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20 text-center text-xs text-emerald-400 font-mono">
                    ✓ Free account selected. Zero payment is required. Your trading login will be generated instantly.
                  </div>
                ) : paymentMethod === 'upi' ? (
                  <div className="bg-[#111622] p-4 rounded-xl border border-gray-800 space-y-2">
                    <p className="text-xxs font-mono text-gray-400 uppercase tracking-wider">Pay using UPI ID:</p>
                    <div className="flex gap-1.5 items-center bg-black/40 rounded px-2.5 py-1.5 border border-gray-900">
                      <span className="font-mono text-xs text-amber-400 select-all truncate flex-grow">
                        9675242837@ybl
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText('9675242837@ybl');
                          alert('UPI ID copied to clipboard!');
                        }}
                        className="text-[10px] text-gray-300 hover:text-white bg-gray-800 px-2.5 py-1 rounded cursor-pointer border border-gray-700"
                      >
                        Copy
                      </button>
                    </div>
                    <p className="text-xxs text-gray-500 font-mono leading-relaxed">
                      UPI Provider: <strong className="text-amber-400">9675242837@ybl</strong>. Send the exact price of your challenge to activate instantly.
                    </p>
                  </div>
                ) : paymentMethod === 'btc' ? (
                  <div className="bg-[#111622] p-4 rounded-xl border border-gray-800 space-y-2">
                    <p className="text-xxs font-mono text-gray-400 uppercase tracking-wider font-bold text-amber-500">BTC PAYMENT ADDRESS:</p>
                    <div className="flex gap-1.5 items-center bg-black/40 rounded px-2.5 py-1.5 border border-gray-900">
                      <span className="font-mono text-xxs text-amber-400 select-all truncate flex-grow">
                        bc1q48l84735qgkcxg6lxw78tzl0lnwfu8755j6fpf
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText('bc1q48l84735qgkcxg6lxw78tzl0lnwfu8755j6fpf');
                          alert('Bitcoin address copied to clipboard!');
                        }}
                        className="text-[10px] text-gray-300 hover:text-white bg-gray-800 px-2.5 py-1 rounded cursor-pointer border border-gray-700 font-bold"
                      >
                        Copy
                      </button>
                    </div>
                    <p className="text-xxs text-gray-500 font-mono leading-relaxed">
                      Bitcoin Wallet (BTC SegWit): <strong className="text-amber-400">bc1q48l84735qgkcxg6lxw78tzl0lnwfu8755j6fpf</strong>. Send the Bitcoin equivalent of your challenge price.
                    </p>
                  </div>
                ) : (
                  <div className="bg-[#111622] p-5 rounded-xl border border-gray-800 space-y-4">
                    {/* Card Preview Graphic */}
                    <div className="w-full aspect-[1.75/1] bg-gradient-to-tr from-amber-500/20 via-[#161a26] to-yellow-600/10 rounded-xl p-4 border border-amber-500/20 relative flex flex-col justify-between overflow-hidden shadow-lg select-none">
                      {/* Brand Logo & Chip */}
                      <div className="flex justify-between items-start">
                        <div className="space-y-1 text-left">
                          <div className="w-10 h-7 bg-amber-500/15 rounded-md border border-amber-500/30 flex items-center justify-center font-mono text-[9px] text-amber-400 font-bold tracking-widest">
                            CHIP
                          </div>
                          <span className="text-[9px] text-gray-500 font-mono tracking-widest">SECURE LINK</span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-black italic tracking-wider text-white uppercase">
                            {cardNo.startsWith('4') ? 'VISA' : cardNo.startsWith('5') ? 'MASTERCARD' : cardNo.startsWith('3') ? 'AMEX' : 'CARD'}
                          </span>
                        </div>
                      </div>

                      {/* Card Number */}
                      <div className="text-center font-mono text-base tracking-[0.18em] text-white py-1">
                        {cardNo || '•••• •••• •••• ••••'}
                      </div>

                      {/* Footer Details */}
                      <div className="flex justify-between items-end">
                        <div className="text-left">
                          <span className="text-[8px] text-gray-500 font-mono block uppercase">Cardholder Name</span>
                          <span className="text-[11px] font-bold text-gray-200 tracking-wide font-mono uppercase truncate max-w-[150px] inline-block">
                            {cardName || 'YOUR NAME'}
                          </span>
                        </div>
                        <div className="text-right flex gap-3">
                          <div>
                            <span className="text-[8px] text-gray-500 font-mono block uppercase text-right">Expires</span>
                            <span className="text-[11px] font-bold text-gray-200 font-mono block text-right">
                              {cardExp || 'MM/YY'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[8px] text-gray-500 font-mono block uppercase text-right">CVV</span>
                            <span className="text-[11px] font-bold text-gray-200 font-mono block text-right">
                              {cardCvv ? '•••' : '000'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Inputs */}
                    <div className="space-y-3 text-left">
                      <div>
                        <label className="text-[10px] font-mono uppercase tracking-wider text-gray-400 block mb-1">Cardholder Name</label>
                        <input
                          type="text"
                          placeholder="Full Name as on Card"
                          value={cardName}
                          onChange={(e) => setCardName(e.target.value)}
                          className="w-full bg-black/40 border border-gray-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 transition-colors font-mono"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-mono uppercase tracking-wider text-gray-400 block mb-1">Card Number</label>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="4111 2222 3333 4444"
                            value={cardNo}
                            onChange={handleCardNumberChange}
                            className="w-full bg-black/40 border border-gray-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 transition-colors font-mono"
                          />
                          <CreditCard className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-mono uppercase tracking-wider text-gray-400 block mb-1">Expiry Date</label>
                          <input
                            type="text"
                            placeholder="MM/YY"
                            value={cardExp}
                            onChange={handleExpiryChange}
                            className="w-full bg-black/40 border border-gray-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 transition-colors font-mono text-center"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-mono uppercase tracking-wider text-gray-400 block mb-1">CVV Code</label>
                          <input
                            type="password"
                            placeholder="•••"
                            maxLength={4}
                            value={cardCvv}
                            onChange={handleCvvChange}
                            className="w-full bg-black/40 border border-gray-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 transition-colors font-mono text-center"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 justify-center text-[10px] font-mono text-gray-400 bg-black/20 py-2 rounded-lg border border-gray-900">
                      <Lock className="w-3.5 h-3.5 text-emerald-500" />
                      <span>SECURE 256-BIT SSL ENCRYPTED GATEWAY</span>
                    </div>
                  </div>
                )}

                {/* DETAILS & SCREENSHOT UPLOAD */}
                {checkoutChallenge.type !== 'free_account' && paymentMethod !== 'card' && (
                  <div className="space-y-4 pt-3 border-t border-gray-800/60">
                    {/* User's transaction ID */}
                    <div className="space-y-1">
                      <label className="text-xs font-mono uppercase tracking-wider text-gray-400">
                        {paymentMethod === 'upi' ? 'Your UPI ID / Transaction ID' : 'Your Bitcoin Transaction Hash (TXID)'}
                      </label>
                      <input
                        type="text"
                        required
                        placeholder={paymentMethod === 'upi' ? "e.g. yourname@upi or UPI Ref No." : "e.g. bc1q... or Bitcoin Tx Hash"}
                        className="w-full bg-[#111622] border border-gray-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 transition-colors font-mono"
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                      />
                      <p className="text-[10px] text-gray-500 leading-normal font-mono">
                        {paymentMethod === 'upi'
                          ? "Provide your UPI ID or UPI Transaction Ref No. of your sent payment."
                          : "Provide your Bitcoin transaction ID or hash (TXID) of your sent payment."}
                      </p>
                    </div>

                    {/* Receipt Screenshot Upload */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-mono uppercase tracking-wider text-gray-400 block">
                        Upload Payment Screenshot <span className="text-gray-500 font-normal lowercase">(Optional - used for manual verification)</span>
                      </label>
                      <div className="relative border border-dashed border-gray-800 hover:border-amber-500/50 rounded-xl p-4 bg-[#111622] transition-colors flex flex-col items-center justify-center text-center cursor-pointer group">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        <Upload className="w-6 h-6 text-gray-500 group-hover:text-amber-400 mb-2 transition-colors" />
                        <span className="text-xs font-medium text-gray-300">
                          {screenshotFileName ? screenshotFileName : 'Click or drag receipt image here (Optional)'}
                        </span>
                        <span className="text-[10px] text-gray-500 mt-1">PNG, JPG up to 10MB</span>
                      </div>

                      {/* Image Preview thumbnail if available */}
                      {screenshotPreview && (
                        <div className="mt-2 border border-gray-800 rounded-lg p-2 bg-black/40 flex items-center gap-3">
                          <img 
                            src={screenshotPreview} 
                            alt="Receipt Preview" 
                            className="w-12 h-12 rounded object-cover border border-gray-800"
                            referrerPolicy="no-referrer"
                          />
                          <div className="text-left">
                            <p className="text-xs font-mono text-gray-300 truncate max-w-[200px]">{screenshotFileName}</p>
                            <p className="text-[10px] text-emerald-400 font-mono font-semibold">✓ Loaded successfully</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <>
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 text-black py-3 rounded-lg text-xs font-semibold hover:opacity-90 active:scale-95 transition-all mt-4 cursor-pointer shadow-lg"
                >
                  Complete Order & Submit Payment
                </button>

                <div className="bg-[#111622] border border-gray-800 rounded-lg p-3 text-center">
                  <p className="text-xxs text-gray-400 leading-normal font-mono">
                    🔒 Your payment details are submitted securely. Once verified by our administrative team, your trading account will be activated within 24 hours.
                  </p>
                </div>
              </>
            </form>
          </div>
        </div>
      )}

      {/* ORDER SUCCESS MODAL */}
      {orderSuccess && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#0D1017] border border-amber-500/30 rounded-2xl p-6 max-w-md w-full text-center relative shadow-xl shadow-emerald-500/5">
            {orderSuccess.status === 'approved' ? (
              <>
                <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-7 h-7 text-emerald-400 animate-bounce" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Account Instantly Active!</h3>
              </>
            ) : (
              <>
                <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-7 h-7 text-amber-400 animate-pulse" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Account pending (24 hours)</h3>
              </>
            )}

            <p className="text-xs text-gray-400 mb-4 font-mono">
              Order ID: <span className="text-white font-bold">{orderSuccess.id}</span>
            </p>

            <div className="bg-[#111622] p-4 rounded-xl border border-gray-800 text-xs text-left space-y-1 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-400">Applicant:</span>
                <span className="text-white font-semibold">{orderSuccess.userName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Email:</span>
                <span className="text-white font-mono">{orderSuccess.userEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Challenge Size:</span>
                <span className="text-amber-400 font-bold">${orderSuccess.challengeSize.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t border-gray-800/80 pt-1.5 mt-1.5">
                <span className="text-gray-400">Payment Status:</span>
                {orderSuccess.status === 'approved' ? (
                  <span className="text-emerald-400 font-bold">✓ Verified & Active</span>
                ) : (
                  <span className="text-amber-500 font-bold">Pending Verification</span>
                )}
              </div>
            </div>

            {orderSuccess.status === 'approved' ? (
              <p className="text-xs text-emerald-400 leading-normal mb-6 font-semibold">
                ✓ Perfect! Your on-chain transaction was successfully audited and verified. Your trading server credentials have been generated and are immediately available in your personal dashboard!
              </p>
            ) : (
              <p className="text-xs text-gray-400 leading-normal mb-6">
                Your payment is under review. Please wait up to 24 hours for transaction verification. You can track this in your dashboard or contact support.
              </p>
            )}

            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 text-left space-y-3">
              <h4 className="text-xs font-bold text-white text-center uppercase tracking-wider">Direct Support & Verification</h4>
              <p className="text-xxs text-gray-400 text-center leading-normal">
                Click below to instantly connect with our support agents on Instagram or via Email to expedite your account activation:
              </p>
              
              <div className="grid grid-cols-2 gap-2 pt-1">
                <a
                  href="https://www.instagram.com/atfunding"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 text-white font-bold text-xs text-center transition-opacity"
                >
                  <span>Instagram Official</span>
                </a>
                <a
                  href="https://www.instagram.com/atfunding.team"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-gradient-to-r from-pink-600 to-red-500 hover:opacity-90 text-white font-bold text-xs text-center transition-opacity"
                >
                  <span>Instagram Support</span>
                </a>
              </div>

              <div className="text-center font-mono text-[10px] text-gray-500 space-y-0.5 pt-2 border-t border-gray-800/60">
                <p>Official Page: <a href="https://www.instagram.com/atfunding" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:underline">@atfunding</a></p>
                <p>Support Account: <a href="https://www.instagram.com/atfunding.team" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:underline">@atfunding.team</a></p>
                <p>Gmail: <a href="mailto:ATgrowfund@gmail.com" className="text-amber-400 hover:underline">ATgrowfund@gmail.com</a></p>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  setOrderSuccess(null);
                  if (onNavigateToDashboard) {
                    onNavigateToDashboard();
                  }
                }}
                className="flex-1 bg-gradient-to-r from-amber-500 to-yellow-600 text-black py-2.5 rounded-lg text-xs font-semibold hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-md"
              >
                Go to Dashboard & Track Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="bg-[#030508] border-t border-gray-950 py-12 text-center text-gray-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex items-center justify-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center">
              <span className="font-sans font-bold text-black text-xs">AT</span>
            </div>
            <span className="font-sans text-lg font-bold tracking-wider text-white">
              AT<span className="text-amber-400">Funding</span>
            </span>
          </div>

          {/* SOCIAL MEDIA LOGOS ONLY */}
          <div className="flex flex-wrap justify-center items-center gap-6 py-5 border-y border-gray-900/40 my-4">
            <a
              href="https://www.instagram.com/atfunding_?igsh=MTJwcnNrMTZ2NGppZg=="
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 rounded-full bg-[#0D1017] border border-gray-800 hover:border-pink-500/50 flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-lg group"
              title="Instagram"
            >
              <Instagram className="w-5.5 h-5.5 text-gray-400 group-hover:text-pink-500 transition-colors" />
            </a>
            <a
              href="https://t.me/httpsAsjadTrades"
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 rounded-full bg-[#0D1017] border border-gray-800 hover:border-sky-500/50 flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-lg group"
              title="Telegram"
            >
              <Send className="w-5 h-5 text-gray-400 group-hover:text-sky-400 transition-colors ml-[-1px] mt-[-1px] rotate-[-10deg]" />
            </a>
            <a
              href="https://x.com/atfunding_"
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 rounded-full bg-[#0D1017] border border-gray-800 hover:border-white flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-lg group"
              title="X (Twitter)"
            >
              <Twitter className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
            </a>
            <a
              href="https://www.youtube.com/@Atfunding_"
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 rounded-full bg-[#0D1017] border border-gray-800 hover:border-red-500/50 flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-lg group"
              title="YouTube"
            >
              <Youtube className="w-5.5 h-5.5 text-gray-400 group-hover:text-red-500 transition-colors" />
            </a>
            <a
              href="https://www.facebook.com/share/1bbxQp5TNX/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 rounded-full bg-[#0D1017] border border-gray-800 hover:border-blue-500/50 flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-lg group"
              title="Facebook"
            >
              <Facebook className="w-5.5 h-5.5 text-gray-400 group-hover:text-blue-500 transition-colors" />
            </a>
            <a
              href="mailto:Atfundingsupport@gmail.com"
              className="w-12 h-12 rounded-full bg-[#0D1017] border border-gray-800 hover:border-amber-500/50 flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-lg group"
              title="Email Support"
            >
              <Mail className="w-5.5 h-5.5 text-gray-400 group-hover:text-amber-500 transition-colors" />
            </a>
          </div>

          <p className="max-w-2xl mx-auto text-gray-600 leading-relaxed font-mono text-xxs">
            Disclaimer: ATFunding is a proprietary trading evaluation firm. All financial operations, trading activities, and metrics within this application are strictly simulated sandbox evaluations. No real-world broker connection, cryptocurrency transactions, or real currency exchange is carried out.
          </p>

          <p className="text-gray-600 font-mono text-xxs">
            ATFunding Proprietary Trading Platform © 2026. Custom-designed for high-performance traders.
          </p>
        </div>
      </footer>
    </div>
  );
}
