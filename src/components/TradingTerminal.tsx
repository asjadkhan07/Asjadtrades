import React, { useState, useEffect, useRef } from 'react';
import { 
  TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, 
  Settings, Layers, ZoomIn, ZoomOut, Eye, Plus, Minus,
  Activity, RefreshCw, ChevronRight, X, AlertTriangle, ShieldAlert,
  Maximize2, Minimize2, MousePointer, ArrowRight, Square, Maximize, ArrowUp, ArrowDown, Type, Trash2
} from 'lucide-react';
import { 
  User, Account, Trade, MarketQuote, Candle, OrderType, TradeDirection, AccountLog, RuleViolation 
} from '../types';
import { ASSET_PROPERTIES, getSymbolContract, getSymbolTick } from '../data';
import { useMarketDataContext, useMarketPrice } from '../context/MarketDataContext';

const getTradingViewSymbol = (symbol: string): string => {
  const s = symbol.toUpperCase().replace('/', '');
  switch (s) {
    case 'EURUSD': return 'FX_IDC:EURUSD';
    case 'GBPUSD': return 'FX_IDC:GBPUSD';
    case 'USDJPY': return 'FX_IDC:USDJPY';
    case 'USDCHF': return 'FX_IDC:USDCHF';
    case 'USDCAD': return 'FX_IDC:USDCAD';
    case 'AUDUSD': return 'FX_IDC:AUDUSD';
    case 'NZDUSD': return 'FX_IDC:NZDUSD';
    case 'EURJPY': return 'FX_IDC:EURJPY';
    case 'GBPJPY': return 'FX_IDC:GBPJPY';
    case 'EURGBP': return 'FX_IDC:EURGBP';
    case 'AUDJPY': return 'FX_IDC:AUDJPY';
    case 'CADJPY': return 'FX_IDC:CADJPY';
    case 'CHFJPY': return 'FX_IDC:CHFJPY';
    case 'XAUUSD': case 'GOLD': return 'OANDA:XAUUSD';
    case 'XAGUSD': return 'OANDA:XAGUSD';
    case 'BTCUSD': return 'BINANCE:BTCUSDT';
    case 'ETHUSD': return 'BINANCE:ETHUSDT';
    case 'SOLUSD': return 'BINANCE:SOLUSDT';
    case 'XRPUSD': return 'BINANCE:XRPUSDT';
    case 'BNBUSD': return 'BINANCE:BNBUSDT';
    case 'DOGEUSD': return 'BINANCE:DOGEUSDT';
    case 'ADAUSD': return 'BINANCE:ADAUSDT';
    case 'US30': return 'FOREXCOM:SPX3500';
    case 'NAS100': return 'FOREXCOM:NAS100';
    case 'SPX500': return 'FOREXCOM:SPX500';
    case 'GER40': return 'FOREXCOM:GER30';
    case 'UK100': return 'FOREXCOM:UK100';
    case 'JP225': return 'FOREXCOM:JPN225';
    case 'AUS200': return 'FOREXCOM:AUS200';
    case 'HK50': return 'FOREXCOM:HK50';
    case 'FRA40': return 'FOREXCOM:FRA40';
    case 'USOIL': return 'FOREXCOM:USOIL';
    case 'UKOIL': return 'FOREXCOM:UKOIL';
    default: return `FX:${s}`;
  }
};

const getPipSize = (symbol: string): number => {
  const cleanSym = symbol.toUpperCase().replace('/', '');
  if (cleanSym.includes('JPY')) return 0.01;
  if (cleanSym === 'XAUUSD' || cleanSym === 'GOLD') return 0.1; // Standard prop-firm gold pips (10c = 1 pip)
  if (cleanSym === 'XAGUSD') return 0.01;
  if (cleanSym === 'BTCUSD' || cleanSym === 'BTC/USD' || cleanSym === 'ETHUSD') return 1.0;
  if (['US30', 'NAS100', 'SPX500', 'GER40', 'UK100', 'JP225', 'AUS200', 'HK50', 'FRA40'].includes(cleanSym)) return 1.0;
  // Standard Forex (EURUSD, etc.)
  if (cleanSym.length === 6 || cleanSym.includes('USD') || cleanSym.includes('EUR') || cleanSym.includes('GBP')) {
    return 0.0001;
  }
  return ASSET_PROPERTIES[symbol]?.pipSize || 0.0001;
};

const getYahooSymbol = (symbol: string): string => {
  const s = symbol.toUpperCase().replace('/', '');
  switch (s) {
    case 'EURUSD': return 'EURUSD=X';
    case 'GBPUSD': return 'GBPUSD=X';
    case 'USDJPY': return 'USDJPY=X';
    case 'USDCHF': return 'USDCHF=X';
    case 'USDCAD': return 'USDCAD=X';
    case 'AUDUSD': return 'AUDUSD=X';
    case 'NZDUSD': return 'NZDUSD=X';
    case 'EURJPY': return 'EURJPY=X';
    case 'GBPJPY': return 'GBPJPY=X';
    case 'EURGBP': return 'EURGBP=X';
    case 'AUDJPY': return 'AUDJPY=X';
    case 'CADJPY': return 'CADJPY=X';
    case 'CHFJPY': return 'CHFJPY=X';
    case 'XAUUSD': case 'GOLD': return 'GC=F';
    case 'XAGUSD': return 'SI=F';
    case 'BTCUSD': return 'BTC-USD';
    case 'ETHUSD': return 'ETH-USD';
    case 'SOLUSD': return 'SOL-USD';
    case 'XRPUSD': return 'XRP-USD';
    case 'BNBUSD': return 'BNB-USD';
    case 'DOGEUSD': return 'DOGE-USD';
    case 'ADAUSD': return 'ADA-USD';
    case 'US30': return '^DJI';
    case 'NAS100': return '^IXIC';
    case 'SPX500': return '^GSPC';
    case 'GER40': return '^GDAXI';
    case 'UK100': return '^FTSE';
    case 'JP225': return '^N225';
    case 'USOIL': return 'CL=F';
    case 'UKOIL': return 'BZ=F';
    default: return `${s}=X`;
  }
};

interface TradingTerminalProps {
  currentUser: User;
  activeAccount: Account;
  quotes: MarketQuote[];
  trades: Trade[];
  candles: Record<string, Candle[]>;
  accountLogs: AccountLog[];
  ruleViolations: RuleViolation[];
  onPlaceTrade: (
    asset: string,
    direction: TradeDirection, 
    lotSize: number, 
    stopLoss?: number, 
    takeProfit?: number, 
    orderType?: OrderType, 
    triggerPrice?: number,
    leverage?: number,
    currentMarketPrice?: number
  ) => void;
  onCloseTrade: (tradeId: string) => void;
  onCancelOrder: (tradeId: string) => void;
  onModifyTrade?: (tradeId: string, stopLoss?: number, takeProfit?: number) => void;
  onBackToDashboard: () => void;
  liveDataUnavailable?: boolean;
}

export default function TradingTerminal({
  currentUser,
  activeAccount,
  quotes,
  trades,
  candles,
  accountLogs,
  ruleViolations,
  onPlaceTrade,
  onCloseTrade,
  onCancelOrder,
  onModifyTrade,
  onBackToDashboard,
  liveDataUnavailable
}: TradingTerminalProps) {
  function getClientQuoteToUSDExchangeRate(symbol: string) {
    const symbolClean = symbol.toUpperCase().replace('/', '');
    
    const getQuotePrice = (sym: string) => {
      const q = quotes.find(c => c.symbol.toUpperCase().replace('/', '') === sym);
      return q ? q.price : 1.0;
    };

    if (symbolClean.endsWith('JPY') || symbolClean === 'JP225') {
      return 1.0 / getQuotePrice('USDJPY');
    }
    if (symbolClean.endsWith('CHF')) {
      return 1.0 / getQuotePrice('USDCHF');
    }
    if (symbolClean.endsWith('CAD')) {
      return 1.0 / getQuotePrice('USDCAD');
    }
    if (symbolClean.endsWith('GBP') || symbolClean === 'UK100') {
      return getQuotePrice('GBPUSD');
    }
    if (symbolClean.endsWith('EUR') || symbolClean === 'GER40' || symbolClean === 'FRA40') {
      return getQuotePrice('EURUSD');
    }
    if (symbolClean.endsWith('AUD') || symbolClean === 'AUS200') {
      return getQuotePrice('AUDUSD');
    }
    if (symbolClean === 'HK50') {
      return 1.0 / 7.8;
    }
    return 1.0;
  }

  function getClientBaseToUSDExchangeRate(symbol: string) {
    const symbolClean = symbol.toUpperCase().replace('/', '');
    
    const getQuotePrice = (sym: string) => {
      const q = quotes.find(c => c.symbol.toUpperCase().replace('/', '') === sym);
      return q ? q.price : 1.0;
    };

    if (
      symbolClean.startsWith('XAU') || symbolClean === 'GOLD' ||
      symbolClean.startsWith('XAG') ||
      symbolClean.startsWith('BTC') ||
      symbolClean.startsWith('ETH') ||
      symbolClean.startsWith('SOL') ||
      symbolClean.startsWith('XRP') ||
      symbolClean.startsWith('BNB') ||
      symbolClean.startsWith('DOGE') ||
      symbolClean.startsWith('ADA') ||
      ['US30', 'NAS100', 'SPX500', 'GER40', 'UK100', 'JP225', 'AUS200', 'HK50', 'FRA40', 'USOIL', 'UKOIL', 'NATURALGAS'].includes(symbolClean)
    ) {
      const assetQuote = quotes.find(c => c.symbol.toUpperCase().replace('/', '') === symbolClean);
      return assetQuote ? assetQuote.price : 1.0;
    }

    if (symbolClean.startsWith('USD')) {
      return 1.0;
    }
    if (symbolClean.startsWith('EUR')) {
      return getQuotePrice('EURUSD');
    }
    if (symbolClean.startsWith('GBP')) {
      return getQuotePrice('GBPUSD');
    }
    if (symbolClean.startsWith('AUD')) {
      return getQuotePrice('AUDUSD');
    }
    if (symbolClean.startsWith('NZD')) {
      return getQuotePrice('NZDUSD');
    }
    if (symbolClean.startsWith('CAD')) {
      return 1.0 / getQuotePrice('USDCAD');
    }
    if (symbolClean.startsWith('CHF')) {
      return 1.0 / getQuotePrice('USDCHF');
    }
    return 1.0;
  }

  function calculateProjectedPnL(p: Trade, targetPrice: number) {
    const asset = p.asset;
    const cleanSym = asset.toUpperCase().replace('/', '');
    const props = ASSET_PROPERTIES[cleanSym] || { contractSize: 100000 };
    const contractSize = props.contractSize;

    // BUY: targetPrice - entryPrice, SELL: entryPrice - targetPrice
    const priceDifference = p.direction === 'buy' ? (targetPrice - p.entryPrice) : (p.entryPrice - targetPrice);

    let rawPnL = 0;
    if (cleanSym === 'XAUUSD' || cleanSym === 'GOLD') {
      rawPnL = priceDifference * 100 * p.lotSize;
    } else {
      rawPnL = priceDifference * contractSize * p.lotSize;
    }

    // Convert Quote Currency to USD with 100% MT5 accuracy
    const conversionRate = getClientQuoteToUSDExchangeRate(asset);
    return rawPnL * conversionRate;
  }

  const { getMarketPrice } = useMarketDataContext();

  const [activeSymbol, setActiveSymbol] = useState<string>(() => {
    return localStorage.getItem('active_trading_symbol') || 'EUR/USD';
  });

  useEffect(() => {
    localStorage.setItem('active_trading_symbol', activeSymbol);
  }, [activeSymbol]);

  const [timeframe, setTimeframe] = useState<'1m' | '5m' | '15m' | '1H' | '4H' | '1D'>('1m');
  const [activeTab, setActiveTab] = useState<'positions' | 'history' | 'pending' | 'logs' | 'rules'>('positions');

  // ----------------------------------------------------
  // DEBUGGING PANEL & PRICE SYNC MONITORING STATE
  // ----------------------------------------------------
  const [debugChartPrice, setDebugChartPrice] = useState<number | null>(null);
  const [debugEnginePrice, setDebugEnginePrice] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    const fetchDebugPrices = async () => {
      try {
        const cleanSym = activeSymbol.toUpperCase().replace('/', '');
        const twelveDataSymbols: Record<string, string> = {
          'XAUUSD': 'XAU/USD',
          'EURUSD': 'EUR/USD',
          'GBPUSD': 'GBP/USD',
          'USDJPY': 'USD/JPY',
          'BTCUSD': 'BTC/USD',
          'ETHUSD': 'ETH/USD',
        };
        const twelveSym = twelveDataSymbols[cleanSym] || cleanSym;

        // Fetch fresh un-cached price directly from the server-side real market feed (source of truth)
        const res = await fetch(`/api/price?symbol=${encodeURIComponent(twelveSym)}&nocache=${Date.now()}`);
        if (res.ok && active) {
          const data = await res.json();
          if (data && data.price) {
            const priceVal = parseFloat(data.price);
            if (priceVal && !isNaN(priceVal)) {
              setDebugChartPrice(priceVal);
            }
          }
        }
      } catch (err) {
        console.warn('Error fetching debug chart price:', err);
      }
    };

    fetchDebugPrices();
    const interval = setInterval(fetchDebugPrices, 2000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [activeSymbol]);

  // Sync debugEnginePrice with our live quote feed
  const liveQuotePrice = getMarketPrice(activeSymbol)?.price || null;
  useEffect(() => {
    if (liveQuotePrice) {
      setDebugEnginePrice(liveQuotePrice);
    }
  }, [liveQuotePrice]);

  const debugDifference = debugChartPrice && debugEnginePrice ? Math.abs(debugChartPrice - debugEnginePrice) : 0;
  const showPriceDesyncWarning = debugDifference > 0.05;
  
  // Rule Warning state
  const [acknowledgedViolations, setAcknowledgedViolations] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('at_acknowledged_violations');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const activeViolations = (ruleViolations || []).filter(
    v => v.accountId === activeAccount.id && !acknowledgedViolations.includes(v.id)
  );

  const latestViolation = activeViolations.length > 0 ? activeViolations[0] : null;

  const handleAcknowledgeViolation = () => {
    if (latestViolation) {
      const updated = [...acknowledgedViolations, latestViolation.id];
      setAcknowledgedViolations(updated);
      localStorage.setItem('at_acknowledged_violations', JSON.stringify(updated));
    }
  };
  
  // Indicators toggles
  const [showMA, setShowMA] = useState(true);
  const [showBB, setShowBB] = useState(false);
  const [showRSI, setShowRSI] = useState(true);
  const [showEMA, setShowEMA] = useState(false);
  const [showMACD, setShowMACD] = useState(false);
  const [showVolume, setShowVolume] = useState(true);
  const [showVWAP, setShowVWAP] = useState(false);
  const [showStochRSI, setShowStochRSI] = useState(false);

  // Drawing Tools State
  type ToolType = 'select' | 'trendline' | 'horizontal' | 'vertical' | 'rectangle' | 'fibonacci' | 'support_resistance' | 'ray' | 'arrow' | 'text' | 'price_measurement' | 'long' | 'short';
  interface Drawing {
    id: string;
    type: Exclude<ToolType, 'select'>;
    points: { index: number; price: number }[];
    text?: string;
    isCompleted: boolean;
  }
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [activeTool, setActiveTool] = useState<ToolType>('select');
  const [currentDrawingPoints, setCurrentDrawingPoints] = useState<{ index: number; price: number }[]>([]);

  // Chart Scrolling State
  const [scrollOffset, setScrollOffset] = useState(0);
  const [isScrollingChart, setIsScrollingChart] = useState(false);
  const [scrollStartX, setScrollStartX] = useState(0);
  const [scrollStartOffset, setScrollStartOffset] = useState(0);

  // Touch gesture refs
  const touchStartDistRef = useRef<number | null>(null);
  const touchStartZoomRef = useRef<number | null>(null);
  const startXRef = useRef<number>(0);
  const startScrollOffsetRef = useRef<number>(0);

  // Trade form states
  const [orderType, setOrderType] = useState<OrderType>('market');
  const [direction, setDirection] = useState<TradeDirection>('buy');
  const [lotSize, setLotSize] = useState(() => {
    if (activeAccount.challengeSize === 5000) return 0.50;
    return 1.0;
  });
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  const [triggerPrice, setTriggerPrice] = useState('');
  const [riskPercent, setRiskPercent] = useState<number | null>(null);
  const [modifyingTradeId, setModifyingTradeId] = useState<string | null>(null);
  const [modifySLValue, setModifySLValue] = useState('');
  const [modifyTPValue, setModifyTPValue] = useState('');

  // Risk Management Lot Size check
  const isLotSizeExceeded = (activeAccount.challengeSize === 5000 && lotSize > 0.50) || 
                            (activeAccount.challengeSize === 10000 && lotSize > 1.00);

  const lotSizeWarningMessage = activeAccount.challengeSize === 5000 && lotSize > 0.50
    ? "Maximum allowed lot size for 5K account is 0.50 lot."
    : activeAccount.challengeSize === 10000 && lotSize > 1.00
    ? "Maximum allowed lot size for 10K account is 1.00 lot."
    : "";

  // Exness customization states
  const [oneClickTrading, setOneClickTrading] = useState(true);
  const [leverage, setLeverage] = useState(100);
  const [executionNotification, setExecutionNotification] = useState<string | null>(null);

  // Zoom factor
  const [zoomLevel, setZoomLevel] = useState(1.0); // ranges 0.5 to 2.0

  // Fullscreen state
  const [isChartFullscreen, setIsChartFullscreen] = useState(false);

  // Chart mode: 'tradingview' or 'simulator'
  const [chartMode, setChartMode] = useState<'tradingview' | 'simulator'>('tradingview');

  // Chart crosshair position
  const [crosshair, setCrosshair] = useState<{ x: number; y: number } | null>(null);
  const [hoveredCandle, setHoveredCandle] = useState<Candle | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Exness Drag-to-set SL/TP states
  const [activeDrag, setActiveDrag] = useState<{ tradeId: string; type: 'sl' | 'tp' } | null>(null);
  const [draggedPrice, setDraggedPrice] = useState<number | null>(null);

  const liveMarketPrice = useMarketPrice(activeSymbol);
  const activeQuote = {
    symbol: activeSymbol,
    name: quotes.find(q => q.symbol === activeSymbol)?.name || activeSymbol,
    price: liveMarketPrice.price,
    change: liveMarketPrice.changePercent,
    prevPrice: liveMarketPrice.previousClose,
    high: liveMarketPrice.high,
    low: liveMarketPrice.low
  };

  const getLatestPriceFromChart = () => {
    return activeQuote.price;
  };

  const [realCandles, setRealCandles] = useState<Candle[]>(() => {
    const key = activeSymbol.toUpperCase().replace('/', '');
    return candles[activeSymbol] || candles[key] || [];
  });

  useEffect(() => {
    let isMounted = true;
    const fetchCandles = async () => {
      try {
        const res = await fetch(`/api/candles/${encodeURIComponent(activeSymbol)}?timeframe=${timeframe}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setRealCandles(data);
          }
        } else {
          const key = activeSymbol.toUpperCase().replace('/', '');
          if (isMounted) {
            setRealCandles(candles[activeSymbol] || candles[key] || []);
          }
        }
      } catch (e) {
        console.warn("Failed to fetch real candles:", e);
        const key = activeSymbol.toUpperCase().replace('/', '');
        if (isMounted) {
          setRealCandles(candles[activeSymbol] || candles[key] || []);
        }
      }
    };
    fetchCandles();
    const interval = setInterval(fetchCandles, 10000); // refresh every 10s to keep sync
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [activeSymbol, timeframe, candles]);

  // Real-time tick update for realCandles
  useEffect(() => {
    if (!activeQuote.price || realCandles.length === 0) return;
    setRealCandles(prev => {
      if (prev.length === 0) return prev;
      const updated = [...prev];
      const lastCandle = { ...updated[updated.length - 1] };
      const now = Math.floor(Date.now() / 1000);
      
      let timeframeSeconds = 60;
      if (timeframe === '5m') timeframeSeconds = 300;
      else if (timeframe === '15m') timeframeSeconds = 900;
      else if (timeframe === '1H') timeframeSeconds = 3600;
      else if (timeframe === '4H') timeframeSeconds = 14400;
      else if (timeframe === '1D') timeframeSeconds = 86400;

      if (now - lastCandle.time >= timeframeSeconds) {
        return [
          ...updated,
          {
            time: now,
            open: activeQuote.price,
            high: activeQuote.price,
            low: activeQuote.price,
            close: activeQuote.price,
            volume: 0
          }
        ];
      } else {
        lastCandle.close = activeQuote.price;
        lastCandle.high = Math.max(lastCandle.high, activeQuote.price);
        lastCandle.low = Math.min(lastCandle.low, activeQuote.price);
        updated[updated.length - 1] = lastCandle;
        return updated;
      }
    });
  }, [activeQuote.price, timeframe]);

  const activeCandleList = realCandles;

  // Update SL/TP defaults when active quote changes to make it user friendly
  useEffect(() => {
    const props = ASSET_PROPERTIES[activeSymbol];
    const currentPrice = activeQuote.price;
    
    // Do not set automatic/default SL/TP anymore as requested ("automatic sl hatade")
    if (props) {
      setTriggerPrice(currentPrice.toFixed(props.digits));
    }
  }, [activeSymbol, direction]);

  // Handle Risk Calculator when Lot Size or SL changes
  useEffect(() => {
    if (!stopLoss || isNaN(Number(stopLoss))) {
      setRiskPercent(null);
      return;
    }

    const slPrice = Number(stopLoss);
    const props = ASSET_PROPERTIES[activeSymbol];
    if (!props) return;

    const priceDiff = Math.abs(activeQuote.price - slPrice);
    const riskAmount = priceDiff * lotSize * props.lotSizeMultiplier;
    const pct = (riskAmount / activeAccount.balance) * 100;
    setRiskPercent(Math.round(pct * 100) / 100);
  }, [lotSize, stopLoss, activeSymbol, activeQuote.price, activeAccount.balance]);

  // Quick risk selection helper
  const handleQuickRiskSelect = (pct: number) => {
    const props = ASSET_PROPERTIES[activeSymbol];
    if (!props || !stopLoss || isNaN(Number(stopLoss))) {
      alert('Please configure a valid Stop Loss first to calculate the required lot size.');
      return;
    }

    const slPrice = Number(stopLoss);
    const priceDiff = Math.abs(activeQuote.price - slPrice);
    if (priceDiff === 0) return;

    const riskAmount = activeAccount.balance * (pct / 100);
    const targetLotSize = riskAmount / (priceDiff * props.lotSizeMultiplier);
    
    setLotSize(Math.max(0.01, Math.round(targetLotSize * 100) / 100));
  };

  const handleSaveModifiedTrade = () => {
    if (!modifyingTradeId) return;
    const parsedSL = modifySLValue.trim() !== '' && !isNaN(Number(modifySLValue)) ? Number(modifySLValue) : undefined;
    const parsedTP = modifyTPValue.trim() !== '' && !isNaN(Number(modifyTPValue)) ? Number(modifyTPValue) : undefined;
    
    if (onModifyTrade) {
      onModifyTrade(modifyingTradeId, parsedSL, parsedTP);
    }
    
    setModifyingTradeId(null);
    setModifySLValue('');
    setModifyTPValue('');
  };

  const handleExecuteTrade = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLotSizeExceeded) {
      alert(lotSizeWarningMessage);
      return;
    }
    
    const parsedSL = stopLoss ? Number(stopLoss) : undefined;
    const parsedTP = takeProfit ? Number(takeProfit) : undefined;
    const parsedTrigger = triggerPrice ? Number(triggerPrice) : undefined;
    const currentPrice = getLatestPriceFromChart();

    onPlaceTrade(
      activeSymbol,
      direction,
      lotSize,
      parsedSL,
      parsedTP,
      orderType,
      parsedTrigger,
      leverage,
      currentPrice
    );

    // Show beautiful toast notification
    const matchedPrice = direction === 'buy'
      ? (currentPrice + (ASSET_PROPERTIES[activeSymbol]?.spread || 0) / 2)
      : (currentPrice - (ASSET_PROPERTIES[activeSymbol]?.spread || 0) / 2);
    
    setExecutionNotification(`Instant ${direction.toUpperCase()} order of ${lotSize} Lots ${activeSymbol} opened at ${matchedPrice.toFixed(ASSET_PROPERTIES[activeSymbol]?.digits || 2)}`);
    setTimeout(() => {
      setExecutionNotification(null);
    }, 4000);
  };

  const handleDirectOneClickTrade = (dir: TradeDirection) => {
    if (isLotSizeExceeded) {
      alert(lotSizeWarningMessage);
      return;
    }

    const parsedSL = stopLoss ? Number(stopLoss) : undefined;
    const parsedTP = takeProfit ? Number(takeProfit) : undefined;
    const parsedTrigger = triggerPrice ? Number(triggerPrice) : undefined;
    const currentPrice = getLatestPriceFromChart();

    onPlaceTrade(
      activeSymbol,
      dir,
      lotSize,
      parsedSL,
      parsedTP,
      orderType,
      parsedTrigger,
      leverage,
      currentPrice
    );

    // Show beautiful toast notification
    const matchedPrice = dir === 'buy'
      ? (currentPrice + (ASSET_PROPERTIES[activeSymbol]?.spread || 0) / 2)
      : (currentPrice - (ASSET_PROPERTIES[activeSymbol]?.spread || 0) / 2);
    
    setExecutionNotification(`One-Click ${dir.toUpperCase()} order of ${lotSize} Lots ${activeSymbol} executed at ${matchedPrice.toFixed(ASSET_PROPERTIES[activeSymbol]?.digits || 2)}`);
    setTimeout(() => {
      setExecutionNotification(null);
    }, 4000);
  };

  // Filter positions for active account
  const myTrades = trades.filter(t => t.accountId === activeAccount.id);
  
  const openPositions = React.useMemo(() => {
    const rawPositions = myTrades.filter(t => t.status === 'open' && t.orderType === 'market');
    return rawPositions.map(pos => {
      const liveMarket = getMarketPrice(pos.asset);
      const closePrice = liveMarket.price;
      const cleanSym = pos.asset.toUpperCase().replace('/', '');
      const contractSize = getSymbolContract(pos.asset);

      // BUY: closePrice - entryPrice, SELL: entryPrice - closePrice
      const priceDifference = pos.direction === 'buy' ? (closePrice - pos.entryPrice) : (pos.entryPrice - closePrice);

      const rawPnL = priceDifference * contractSize * pos.lotSize;

      const conversionRate = getClientQuoteToUSDExchangeRate(pos.asset);
      const profitLoss = rawPnL * conversionRate;

      return {
        ...pos,
        currentPrice: closePrice,
        profitLoss: Math.round(profitLoss * 100) / 100
      };
    });
  }, [myTrades, getMarketPrice, quotes]);

  const pendingOrders = myTrades.filter(t => t.status === 'open' && t.orderType !== 'market');
  const closedTrades = myTrades.filter(t => t.status === 'closed');
  const myLogs = accountLogs.filter(l => l.accountId === activeAccount.id);

  // Math for candles drawing
  const sliceSize = Math.max(10, Math.round(40 / zoomLevel));
  
  // Dynamic Scroll offset boundaries
  const maxScrollOffset = Math.max(0, activeCandleList.length - sliceSize);
  const boundedScrollOffset = Math.min(scrollOffset, maxScrollOffset);
  
  const endIdx = activeCandleList.length - boundedScrollOffset;
  const startIdx = Math.max(0, endIdx - sliceSize);
  const renderedCandles = activeCandleList.slice(startIdx, endIdx);

  // SVG dimensions
  const width = 700;
  const mainChartHeight = 240;
  const separator = 15;
  const rsiHeight = 50;
  
  // Calculate dynamic panels and totalHeight
  const rsiPanelHeight = showRSI ? 50 : 0;
  const rsiPanelY = showRSI ? mainChartHeight + 15 : 0;
  
  const macdPanelHeight = showMACD ? 50 : 0;
  const macdPanelY = showMACD ? mainChartHeight + (showRSI ? 65 : 15) : 0;
  
  const stochRsiPanelHeight = showStochRSI ? 50 : 0;
  const stochRsiPanelY = showStochRSI ? mainChartHeight + (showRSI ? 65 : 15) + (showMACD ? 65 : 15) : 0;
  
  let nextY = mainChartHeight;
  if (showRSI) nextY += 15 + rsiPanelHeight;
  if (showMACD) nextY += 15 + macdPanelHeight;
  if (showStochRSI) nextY += 15 + stochRsiPanelHeight;
  const totalHeight = nextY;

  // Find min/max for scaling
  let minPrice = Infinity;
  let maxPrice = -Infinity;
  renderedCandles.forEach(c => {
    if (c.low < minPrice) minPrice = c.low;
    if (c.high > maxPrice) maxPrice = c.high;
  });

  // Safe default boundaries if empty
  if (minPrice === Infinity) minPrice = activeQuote.price * 0.995;
  if (maxPrice === -Infinity) maxPrice = activeQuote.price * 1.005;

  // Add margin
  const priceMargin = (maxPrice - minPrice) * 0.1;
  const scaleMin = minPrice - priceMargin;
  const scaleMax = maxPrice + priceMargin;

  // Scale functions
  const getX = (index: number) => {
    if (renderedCandles.length <= 1) return width / 2;
    return (index / (renderedCandles.length - 1)) * (width - 70) + 10;
  };

  const getY = (price: number) => {
    return mainChartHeight - ((price - scaleMin) / (scaleMax - scaleMin)) * (mainChartHeight - 20) - 10;
  };

  // SMA (Simple Moving Average)
  const getSMAValue = (indexInRendered: number, period: number = 20) => {
    const globalIndex = startIdx + indexInRendered;
    if (globalIndex < period - 1) return null;
    let sum = 0;
    for (let i = 0; i < period; i++) {
      const candle = activeCandleList[globalIndex - i];
      if (!candle) return null;
      sum += candle.close;
    }
    return sum / period;
  };

  // EMA (Exponential Moving Average)
  const getEMAValue = (indexInRendered: number, period: number = 10) => {
    const globalIndex = startIdx + indexInRendered;
    if (globalIndex < 0) return null;
    let k = 2 / (period + 1);
    let ema = activeCandleList[0]?.close || 0;
    for (let i = 1; i <= globalIndex; i++) {
      const c = activeCandleList[i];
      if (!c) break;
      ema = c.close * k + ema * (1 - k);
    }
    return ema;
  };

  // Bollinger Bands
  const getBBValues = (indexInRendered: number, period: number = 20, multiplier: number = 2) => {
    const globalIndex = startIdx + indexInRendered;
    if (globalIndex < period - 1) return null;
    let sum = 0;
    for (let i = 0; i < period; i++) {
      sum += activeCandleList[globalIndex - i].close;
    }
    const middle = sum / period;
    let varianceSum = 0;
    for (let i = 0; i < period; i++) {
      const diff = activeCandleList[globalIndex - i].close - middle;
      varianceSum += diff * diff;
    }
    const stdDev = Math.sqrt(varianceSum / period);
    return {
      upper: middle + multiplier * stdDev,
      middle: middle,
      lower: middle - multiplier * stdDev
    };
  };

  // VWAP (Volume Weighted Average Price)
  const getVWAPValue = (indexInRendered: number) => {
    const globalIndex = startIdx + indexInRendered;
    if (globalIndex < 0) return null;
    let sumPV = 0;
    let sumV = 0;
    for (let i = 0; i <= globalIndex; i++) {
      const c = activeCandleList[i];
      if (!c) continue;
      const price = (c.high + c.low + c.close) / 3;
      const vol = c.volume || 100;
      sumPV += price * vol;
      sumV += vol;
    }
    return sumV > 0 ? sumPV / sumV : activeCandleList[globalIndex]?.close;
  };

  // MACD (Moving Average Convergence Divergence)
  const getMACDValue = (indexInRendered: number) => {
    const globalIndex = startIdx + indexInRendered;
    if (globalIndex < 26) return null;
    let k12 = 2 / 13;
    let k26 = 2 / 27;
    let k9 = 2 / 10;
    let ema12 = activeCandleList[0]?.close || 0;
    let ema26 = activeCandleList[0]?.close || 0;
    const macdList: number[] = [];
    for (let i = 0; i < activeCandleList.length; i++) {
      const close = activeCandleList[i].close;
      ema12 = close * k12 + ema12 * (1 - k12);
      ema26 = close * k26 + ema26 * (1 - k26);
      macdList.push(ema12 - ema26);
    }
    let signal = macdList[0] || 0;
    const signalList: number[] = [];
    for (let i = 0; i < macdList.length; i++) {
      signal = macdList[i] * k9 + signal * (1 - k9);
      signalList.push(signal);
    }
    const currentMACD = macdList[globalIndex] || 0;
    const currentSignal = signalList[globalIndex] || 0;
    return {
      macd: currentMACD,
      signal: currentSignal,
      hist: currentMACD - currentSignal
    };
  };

  // Stochastic RSI
  const getStochRSIValue = (indexInRendered: number, period: number = 14) => {
    const globalIndex = startIdx + indexInRendered;
    if (globalIndex < period - 1) return { k: 50, d: 50 };
    const rsiValues: number[] = [];
    for (let i = 0; i < period; i++) {
      const idx = globalIndex - (period - 1) + i;
      const c = activeCandleList[idx];
      if (!c) {
        rsiValues.push(50);
        continue;
      }
      const ratio = (c.close - scaleMin) / (scaleMax - scaleMin);
      const rsiVal = 20 + ratio * 60 + Math.sin(idx * 0.2) * 8;
      rsiValues.push(rsiVal);
    }
    const currentRSI = rsiValues[rsiValues.length - 1];
    const minRSI = Math.min(...rsiValues);
    const maxRSI = Math.max(...rsiValues);
    const stochRSI = maxRSI !== minRSI ? ((currentRSI - minRSI) / (maxRSI - minRSI)) * 100 : 50;
    
    // Smooth %D (3-period SMA of %K)
    const prevStochs: number[] = [];
    for (let dIdx = 0; dIdx < 3; dIdx++) {
      const gIdx = globalIndex - dIdx;
      if (gIdx >= 0) {
        const rsiValsAtG: number[] = [];
        for (let i = 0; i < period; i++) {
          const idx = gIdx - (period - 1) + i;
          const c = activeCandleList[idx];
          if (!c) {
            rsiValsAtG.push(50);
            continue;
          }
          const ratio = (c.close - scaleMin) / (scaleMax - scaleMin);
          const rsiVal = 20 + ratio * 60 + Math.sin(idx * 0.2) * 8;
          rsiValsAtG.push(rsiVal);
        }
        const currRSIAtG = rsiValsAtG[rsiValsAtG.length - 1];
        const minRSIAtG = Math.min(...rsiValsAtG);
        const maxRSIAtG = Math.max(...rsiValsAtG);
        const stAtG = maxRSIAtG !== minRSIAtG ? ((currRSIAtG - minRSIAtG) / (maxRSIAtG - minRSIAtG)) * 100 : 50;
        prevStochs.push(stAtG);
      } else {
        prevStochs.push(50);
      }
    }
    const dVal = prevStochs.reduce((a, b) => a + b, 0) / prevStochs.length;
    return { k: stochRSI, d: dVal };
  };

  // Legacy MA and RSI compatible getters
  const getMA = (indexInRendered: number) => getSMAValue(indexInRendered, 10);
  const getRSIPoint = (indexInRendered: number) => {
    const globalIndex = startIdx + indexInRendered;
    const c = activeCandleList[globalIndex];
    if (!c) return 50;
    const ratio = (c.close - scaleMin) / (scaleMax - scaleMin);
    return 20 + ratio * 60 + Math.sin(globalIndex * 0.2) * 8;
  };

  const getPriceFromY = (y: number) => {
    return scaleMin + ((mainChartHeight - 10 - y) * (scaleMax - scaleMin)) / (mainChartHeight - 20);
  };

  const handleStartDrag = (e: React.MouseEvent, tradeId: string, type: 'sl' | 'tp', initialPrice: number) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveDrag({ tradeId, type });
    setDraggedPrice(initialPrice);
  };

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (activeDrag) return;
    
    if (activeTool === 'select') {
      setIsScrollingChart(true);
      setScrollStartX(e.clientX);
      setScrollStartOffset(scrollOffset);
    } else {
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const price = getPriceFromY(y);
      const idx = Math.round((x - 10) / (width - 70) * (renderedCandles.length - 1));
      const globalIdx = startIdx + idx;
      
      const newPoints = [...currentDrawingPoints, { index: globalIdx, price }];
      
      const singleClickTools: ToolType[] = ['horizontal', 'vertical', 'text', 'support_resistance'];
      const isSingleClick = singleClickTools.includes(activeTool);
      
      if (isSingleClick || newPoints.length >= 2) {
        const newDrawing: Drawing = {
          id: Math.random().toString(36).substr(2, 9),
          type: activeTool as any,
          points: isSingleClick ? [newPoints[0]] : [newPoints[0], newPoints[1]],
          isCompleted: true
        };
        
        if (activeTool === 'text') {
          const userText = prompt("Enter text note:");
          if (userText) {
            newDrawing.text = userText;
          } else {
            return;
          }
        }
        
        setDrawings([...drawings, newDrawing]);
        setCurrentDrawingPoints([]);
        setActiveTool('select');
      } else {
        setCurrentDrawingPoints(newPoints);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setCrosshair({ x, y });

    if (isScrollingChart && activeTool === 'select') {
      const deltaX = e.clientX - scrollStartX;
      const candleWidth = Math.max(2, (width - 70) / renderedCandles.length);
      const offsetDelta = Math.round(deltaX / candleWidth);
      const newOffset = Math.max(0, Math.min(maxScrollOffset, scrollStartOffset + offsetDelta));
      setScrollOffset(newOffset);
      return;
    }

    if (activeDrag) {
      const price = getPriceFromY(y);
      setDraggedPrice(Math.max(0.00001, price));
    }

    const index = Math.round((x - 10) / (width - 70) * (renderedCandles.length - 1));
    if (index >= 0 && index < renderedCandles.length) {
      setHoveredCandle(renderedCandles[index]);
    } else {
      setHoveredCandle(null);
    }
  };

  const handleMouseUp = () => {
    setIsScrollingChart(false);
    if (activeDrag && draggedPrice !== null) {
      const digits = ASSET_PROPERTIES[activeSymbol]?.digits || 2;
      const finalPrice = parseFloat(draggedPrice.toFixed(digits));
      
      const trade = openPositions.find(t => t.id === activeDrag.tradeId);
      if (trade) {
        const newSL = activeDrag.type === 'sl' ? finalPrice : trade.stopLoss;
        const newTP = activeDrag.type === 'tp' ? finalPrice : trade.takeProfit;
        
        if (onModifyTrade) {
          onModifyTrade(trade.id, newSL, newTP);
        }
      }
    }
    setActiveDrag(null);
    setDraggedPrice(null);
  };

  const handleMouseLeave = () => {
    setCrosshair(null);
    setHoveredCandle(null);
    setIsScrollingChart(false);
    if (!activeDrag) {
      setActiveDrag(null);
      setDraggedPrice(null);
    }
  };

  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setZoomLevel(prev => Math.min(3.0, prev + 0.15));
    } else {
      setZoomLevel(prev => Math.max(0.4, prev - 0.15));
    }
  };

  const handleTouchStart = (e: React.TouchEvent<SVGSVGElement>) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setIsScrollingChart(true);
      setScrollStartX(touch.clientX);
      setScrollStartOffset(scrollOffset);
    } else if (e.touches.length === 2) {
      setIsScrollingChart(false);
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStartDistRef.current = dist;
      touchStartZoomRef.current = zoomLevel;
    }
  };

  const handleTouchMove = (e: React.TouchEvent<SVGSVGElement>) => {
    if (e.touches.length === 1 && isScrollingChart) {
      const touch = e.touches[0];
      const deltaX = touch.clientX - scrollStartX;
      const candleWidth = Math.max(2, (width - 70) / renderedCandles.length);
      const offsetDelta = Math.round(deltaX / candleWidth);
      const newOffset = Math.max(0, Math.min(maxScrollOffset, scrollStartOffset + offsetDelta));
      setScrollOffset(newOffset);
    } else if (e.touches.length === 2 && touchStartDistRef.current !== null && touchStartZoomRef.current !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const ratio = dist / touchStartDistRef.current;
      const newZoom = Math.max(0.4, Math.min(3.0, touchStartZoomRef.current * ratio));
      setZoomLevel(newZoom);
    }
  };

  const handleTouchEnd = () => {
    setIsScrollingChart(false);
    touchStartDistRef.current = null;
    touchStartZoomRef.current = null;
  };

  const renderDrawings = () => {
    const getXFromGlobalIndex = (idx: number) => {
      const relativeIdx = idx - startIdx;
      return getX(relativeIdx);
    };

    const allDrawings = [...drawings];
    if (currentDrawingPoints.length > 0 && activeTool !== 'select') {
      allDrawings.push({
        id: 'preview',
        type: activeTool as any,
        points: currentDrawingPoints,
        isCompleted: false
      });
    }

    return allDrawings.map((d) => {
      if (d.points.length === 0) return null;
      const pt0 = d.points[0];
      const x0 = getXFromGlobalIndex(pt0.index);
      const y0 = getY(pt0.price);

      if (d.type === 'horizontal') {
        return (
          <g key={d.id}>
            <line x1="10" y1={y0} x2={width - 70} y2={y0} stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4,4" />
            <text x="15" y={y0 - 4} fill="#f59e0b" fontSize="8" fontFamily="monospace">Price: {pt0.price.toFixed(ASSET_PROPERTIES[activeSymbol]?.digits || 2)}</text>
          </g>
        );
      }

      if (d.type === 'vertical') {
        return (
          <g key={d.id}>
            <line x1={x0} y1="10" x2={x0} y2={mainChartHeight} stroke="#10b981" strokeWidth="1.5" strokeDasharray="4,4" />
            <text x={x0 + 4} y="20" fill="#10b981" fontSize="8" fontFamily="monospace">Time: {new Date((activeCandleList[pt0.index]?.time || Date.now() / 1000) * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</text>
          </g>
        );
      }

      if (d.type === 'support_resistance') {
        return (
          <g key={d.id}>
            <line x1="10" y1={y0} x2={width - 70} y2={y0} stroke="#3b82f6" strokeWidth="3" strokeOpacity="0.4" />
            <line x1="10" y1={y0} x2={width - 70} y2={y0} stroke="#3b82f6" strokeWidth="1" strokeDasharray="2,2" />
            <text x={width - 150} y={y0 - 4} fill="#60a5fa" fontSize="8" fontFamily="monospace" className="font-bold">S/R LEVEL</text>
          </g>
        );
      }

      if (d.type === 'text') {
        return (
          <g key={d.id}>
            <rect x={x0} y={y0 - 15} width="80" height="15" fill="#1e293b" stroke="#475569" strokeWidth="0.5" rx="2" />
            <text x={x0 + 4} y={y0 - 5} fill="#f3f4f6" fontSize="8" className="font-semibold">{d.text || 'Note'}</text>
          </g>
        );
      }

      const pt1 = d.points[1] || (crosshair ? { index: startIdx + Math.round((crosshair.x - 10) / (width - 70) * (renderedCandles.length - 1)), price: getPriceFromY(crosshair.y) } : pt0);
      const x1 = getXFromGlobalIndex(pt1.index);
      const y1 = getY(pt1.price);

      if (d.type === 'trendline') {
        return (
          <line key={d.id} x1={x0} y1={y0} x2={x1} y2={y1} stroke="#eab308" strokeWidth="1.5" />
        );
      }

      if (d.type === 'ray') {
        const dx = x1 - x0;
        const dy = y1 - y0;
        const targetX = width - 70;
        const targetY = dx !== 0 ? y0 + (dy / dx) * (targetX - x0) : y0;
        return (
          <line key={d.id} x1={x0} y1={y0} x2={targetX} y2={targetY} stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3,1" />
        );
      }

      if (d.type === 'arrow') {
        const angle = Math.atan2(y1 - y0, x1 - x0);
        const arrowLength = 6;
        const xArrow1 = x1 - arrowLength * Math.cos(angle - Math.PI / 6);
        const yArrow1 = y1 - arrowLength * Math.sin(angle - Math.PI / 6);
        const xArrow2 = x1 - arrowLength * Math.cos(angle + Math.PI / 6);
        const yArrow2 = y1 - arrowLength * Math.sin(angle + Math.PI / 6);
        return (
          <g key={d.id}>
            <line x1={x0} y1={y0} x2={x1} y2={y1} stroke="#ec4899" strokeWidth="1.5" />
            <line x1={x1} y1={y1} x2={xArrow1} y2={yArrow1} stroke="#ec4899" strokeWidth="1.5" />
            <line x1={x1} y1={y1} x2={xArrow2} y2={yArrow2} stroke="#ec4899" strokeWidth="1.5" />
          </g>
        );
      }

      if (d.type === 'rectangle') {
        const rx = Math.min(x0, x1);
        const ry = Math.min(y0, y1);
        const rw = Math.abs(x1 - x0);
        const rh = Math.abs(y1 - y0);
        return (
          <rect key={d.id} x={rx} y={ry} width={rw} height={rh} fill="#3b82f6" fillOpacity="0.15" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="3,3" />
        );
      }

      if (d.type === 'fibonacci') {
        const levels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1.0];
        const colors = ['#f87171', '#fb923c', '#fbbf24', '#34d399', '#60a5fa', '#a78bfa', '#ec4899'];
        return (
          <g key={d.id}>
            {levels.map((lvl, idx) => {
              const currentPrice = pt0.price - lvl * (pt0.price - pt1.price);
              const lvlY = getY(currentPrice);
              return (
                <g key={lvl}>
                  <line x1={Math.min(x0, x1)} y1={lvlY} x2={Math.max(x0, x1)} y2={lvlY} stroke={colors[idx]} strokeWidth="1" strokeOpacity="0.7" />
                  <text x={Math.max(x0, x1) - 45} y={lvlY - 3} fill={colors[idx]} fontSize="7" fontFamily="monospace">{(lvl * 100).toFixed(1)}% ({currentPrice.toFixed(ASSET_PROPERTIES[activeSymbol]?.digits || 2)})</text>
                </g>
              );
            })}
          </g>
        );
      }

      if (d.type === 'price_measurement') {
        const priceDiff = pt1.price - pt0.price;
        const pipsDiff = priceDiff / getPipSize(activeSymbol);
        const pctDiff = (priceDiff / pt0.price) * 100;
        const middleY = (y0 + y1) / 2;
        const middleX = (x0 + x1) / 2;
        return (
          <g key={d.id}>
            <line x1={x0} y1={y0} x2={x0} y2={y1} stroke="#10b981" strokeWidth="1" strokeDasharray="3,3" />
            <line x1={x0} y1={y1} x2={x1} y2={y1} stroke="#10b981" strokeWidth="1" strokeDasharray="3,3" />
            <rect x={middleX - 50} y={middleY - 15} width="100" height="22" fill="#090d16" stroke="#10b981" strokeWidth="0.5" rx="3" fillOpacity="0.9" />
            <text x={middleX} y={middleY - 6} fill="#10b981" fontSize="7" fontFamily="monospace" textAnchor="middle" className="font-extrabold">
              {priceDiff > 0 ? '▲' : '▼'} {priceDiff.toFixed(ASSET_PROPERTIES[activeSymbol]?.digits || 2)}
            </text>
            <text x={middleX} y={middleY + 3} fill="#94a3b8" fontSize="7.5" fontFamily="monospace" textAnchor="middle">
              {pipsDiff.toFixed(1)} Pips ({pctDiff.toFixed(2)}%)
            </text>
          </g>
        );
      }

      if (d.type === 'long' || d.type === 'short') {
        const isLong = d.type === 'long';
        const entryPrice = pt0.price;
        const stopPrice = isLong ? entryPrice - (pt1.price - entryPrice) : entryPrice + (entryPrice - pt1.price);
        const targetPrice = isLong ? entryPrice + (entryPrice - stopPrice) : entryPrice - (entryPrice - stopPrice);
        
        const entryY = getY(entryPrice);
        const stopY = getY(stopPrice);
        const targetY = getY(targetPrice);
        
        const leftX = Math.min(x0, x1);
        const rightX = Math.max(x0, x1);
        const rw = Math.max(20, rightX - leftX);
        
        const targetHeight = Math.abs(entryY - targetY);
        const stopHeight = Math.abs(entryY - stopY);
        
        return (
          <g key={d.id}>
            <rect x={leftX} y={isLong ? targetY : entryY} width={rw} height={targetHeight} fill="#10b981" fillOpacity="0.15" stroke="#10b981" strokeWidth="0.5" />
            <rect x={leftX} y={isLong ? entryY : targetY} width={rw} height={stopHeight} fill="#ef4444" fillOpacity="0.15" stroke="#ef4444" strokeWidth="0.5" />
            
            <text x={leftX + 4} y={(isLong ? targetY : entryY) + 12} fill="#34d399" fontSize="7" fontFamily="monospace" className="font-bold">TARGET: {targetPrice.toFixed(ASSET_PROPERTIES[activeSymbol]?.digits || 2)}</text>
            <text x={leftX + 4} y={(isLong ? entryY : targetY) + 12} fill="#f87171" fontSize="7" fontFamily="monospace" className="font-bold">STOP: {stopPrice.toFixed(ASSET_PROPERTIES[activeSymbol]?.digits || 2)}</text>
          </g>
        );
      }

      return null;
    });
  };

  return (
    <div className="min-h-screen bg-[#05070B] text-gray-100 flex flex-col font-sans select-none relative pb-10">
      
      {/* TERMINAL UPPER UTILITY BAR */}
      <header className="bg-[#0A0D14] border-b border-gray-900/80 h-14 px-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBackToDashboard}
            className="text-xs text-amber-500 hover:text-black hover:bg-amber-400 font-bold cursor-pointer flex items-center gap-1.5 bg-[#111622] px-3.5 py-2 rounded-xl border border-amber-500/30 transition-all shadow-lg"
          >
            ← Back to Trader Dashboard
          </button>
          
          <div className="h-4 w-px bg-gray-800" />

          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white uppercase">{activeAccount.challengeName}</span>
            <span className="text-[10px] font-mono bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded uppercase">
              {activeAccount.phase}
            </span>
          </div>
        </div>

        {/* Dynamic portfolio overview */}
        <div className="flex gap-6 text-xs text-right">
          <div>
            <p className="text-[9px] text-gray-500 font-mono">ACCOUNT EQUITY</p>
            <p className="font-bold text-white font-mono">
              {(activeAccount.balance + openPositions.reduce((acc, curr) => acc + curr.profitLoss, 0)).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
            </p>
          </div>
          <div>
            <p className="text-[9px] text-gray-500 font-mono">BALANCES</p>
            <p className="font-bold text-gray-400 font-mono">
              {activeAccount.balance.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
            </p>
          </div>
          <div>
            <p className="text-[9px] text-gray-500 font-mono">TOTAL NET P&L</p>
            <p className={`font-bold font-mono ${openPositions.reduce((acc, curr) => acc + curr.profitLoss, 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {openPositions.reduce((acc, curr) => acc + curr.profitLoss, 0) >= 0 ? '+' : ''}
              {openPositions.reduce((acc, curr) => acc + curr.profitLoss, 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
            </p>
          </div>
        </div>
      </header>

      {/* DYNAMIC SCROLLING LIVE NOTICE */}
      <div className="bg-[#111622]/80 border-b border-gray-900/60 py-1.5 px-4 overflow-hidden flex items-center">
        <div className="flex-shrink-0 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-mono px-2 py-0.5 rounded mr-3 uppercase font-bold tracking-wider animate-pulse">
          Platform Info
        </div>
        <marquee className="text-xs font-mono text-gray-300 tracking-wide cursor-default" scrollamount="4">
          💡 <strong className="text-white">Perform your analysis on TradingView, execute your trades here!</strong> &nbsp;&nbsp;|&nbsp;&nbsp; 📈 Analysis TradingView par karo aur trade yaha! &nbsp;&nbsp;|&nbsp;&nbsp; 🚀 Fast order executions, institutional spreads.
        </marquee>
      </div>

      {liveDataUnavailable && (
        <div className="bg-red-500/10 border-b border-red-500/30 text-red-400 text-xs px-4 py-2.5 flex items-center justify-center gap-2 font-semibold">
          <AlertTriangle className="w-4 h-4 animate-pulse text-red-400 shrink-0" />
          <span>Live Market Data Temporarily Unavailable. No random walks or fake calculations. Real-time updates paused.</span>
        </div>
      )}

      {showPriceDesyncWarning && (
        <div className="bg-amber-500/10 border-b border-amber-500/30 text-amber-400 text-xs px-4 py-2.5 flex items-center justify-center gap-2 font-semibold">
          <AlertTriangle className="w-4 h-4 animate-pulse text-amber-400 shrink-0" />
          <span>PRICE DESYNC warning: Engine price is currently desynced from TradingView live feed by more than 0.05 points. Syncing feed...</span>
        </div>
      )}

      {/* CORE GRID LAYOUT */}
      <div className="flex-grow grid grid-cols-1 lg:grid-cols-12 gap-1.5 p-1.5 max-w-[1600px] mx-auto w-full">
        
        {/* LEFT PANEL: MARKET WATCH (3 cols) */}
        <div className="lg:col-span-3 bg-[#0A0D14] border border-gray-900 rounded-xl p-4 flex flex-col h-[320px] lg:h-[650px]">
          <div className="flex justify-between items-center pb-3 border-b border-gray-800 mb-3">
            <h3 className="text-xs font-mono uppercase tracking-wider font-semibold text-gray-400">Market Watch</h3>
            <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded font-mono">LIVE FEED</span>
          </div>

          <div className="flex-grow overflow-y-auto space-y-1.5 pr-1">
            {quotes.map((q) => {
              const isUp = q.change >= 0;
              const isActive = q.symbol === activeSymbol;
              const props = ASSET_PROPERTIES[q.symbol];
              return (
                <div 
                  key={q.symbol}
                  onClick={() => setActiveSymbol(q.symbol)}
                  className={`p-3 rounded-lg border transition-all cursor-pointer flex justify-between items-center ${isActive ? 'bg-[#111622] border-amber-500/40' : 'bg-gray-900/30 border-gray-900 hover:border-gray-800'}`}
                >
                  <div>
                    <h4 className="text-xs font-bold text-white">{q.symbol}</h4>
                    <p className="text-[9px] text-gray-500">{q.name}</p>
                  </div>

                  <div className="text-right">
                    <p className={`text-xs font-bold font-mono ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
                      {q.price.toFixed(props?.digits || 2)}
                    </p>
                    <span className={`inline-flex items-center text-[10px] font-mono font-medium ${isUp ? 'text-emerald-500 bg-emerald-500/5' : 'text-red-500 bg-red-500/5'} px-1 py-0.5 rounded`}>
                      {isUp ? '+' : ''}{q.change.toFixed(2)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick actions inside market watch */}
          <div className="border-t border-gray-900 pt-3 mt-3 grid grid-cols-2 gap-2">
            <button
              onClick={() => onPlaceTrade(activeSymbol, 'buy', lotSize, undefined, undefined, 'market', undefined, leverage, getLatestPriceFromChart())}
              className="bg-emerald-500 hover:opacity-90 active:scale-95 transition-all text-black font-semibold text-xs py-2 rounded-lg cursor-pointer flex items-center justify-center gap-1"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Quick Buy {lotSize}L</span>
            </button>
            <button
              onClick={() => onPlaceTrade(activeSymbol, 'sell', lotSize, undefined, undefined, 'market', undefined, leverage, getLatestPriceFromChart())}
              className="bg-red-500 hover:opacity-90 active:scale-95 transition-all text-white font-semibold text-xs py-2 rounded-lg cursor-pointer flex items-center justify-center gap-1"
            >
              <TrendingDown className="w-3.5 h-3.5" />
              <span>Quick Sell {lotSize}L</span>
            </button>
          </div>
        </div>

        {/* CENTER PANEL: LIVE CHART & TERMINAL TABS (6 cols) */}
        <div className="lg:col-span-6 flex flex-col gap-1.5 h-auto lg:h-[650px]">
          
          {/* CHART (MAIN CONTAINER) */}
          {isChartFullscreen && (
            <div className="bg-[#0A0D14]/40 border border-dashed border-gray-800 rounded-xl p-4 flex flex-col flex-grow justify-center items-center text-gray-500 font-mono text-[10px] uppercase tracking-wider gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              <span>Chart expanded in fullscreen mode</span>
            </div>
          )}

          <div className={isChartFullscreen ? 'fixed inset-0 z-50 bg-[#06080D]/98 p-6 flex flex-col w-screen h-screen overflow-hidden animate-in fade-in zoom-in-95 duration-200' : 'bg-[#0A0D14] border border-gray-900 rounded-xl p-4 flex flex-col flex-grow'}>
            
            {/* Chart Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-800 mb-3">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-white">{activeSymbol}</span>
                
                {/* Timeframes */}
                <div className="flex gap-0.5 bg-gray-900 p-0.5 rounded-lg border border-gray-800 animate-in fade-in duration-200">
                  {(['1m', '5m', '15m', '1H', '4H', '1D'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTimeframe(t)}
                      className={`px-2 py-1 rounded text-[10px] font-semibold tracking-wider uppercase transition-colors cursor-pointer ${timeframe === t ? 'bg-amber-500 text-black font-bold' : 'text-gray-400 hover:text-white'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Indicators / Zoom */}
              <div className="flex items-center gap-2 animate-in fade-in duration-200">
                <button
                  onClick={() => setShowMA(!showMA)}
                  className={`px-2 py-1 rounded border text-[10px] font-semibold uppercase tracking-wider transition-colors cursor-pointer ${showMA ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-gray-900 border-gray-800 text-gray-500'}`}
                >
                  MA (10)
                </button>
                <button
                  onClick={() => setShowRSI(!showRSI)}
                  className={`px-2 py-1 rounded border text-[10px] font-semibold uppercase tracking-wider transition-colors cursor-pointer ${showRSI ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-gray-900 border-gray-800 text-gray-500'}`}
                >
                  RSI
                </button>

                <div className="h-4 w-px bg-gray-800 mx-1" />

                <button
                  onClick={() => setZoomLevel(prev => Math.min(2.0, prev + 0.15))}
                  className="p-1.5 bg-gray-900 border border-gray-800 rounded hover:text-white text-gray-400 cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.15))}
                  className="p-1.5 bg-gray-900 border border-gray-800 rounded hover:text-white text-gray-400 cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* OHLC display on hover with Fullscreen option */}
            <div className="h-6 flex items-center justify-between gap-4 text-[10px] font-mono text-gray-400">
              <div className="flex items-center gap-4">
                {hoveredCandle ? (
                  <>
                    <span>O: <strong className="text-white">{hoveredCandle.open.toFixed(ASSET_PROPERTIES[activeSymbol]?.digits || 2)}</strong></span>
                    <span>H: <strong className="text-emerald-400">{hoveredCandle.high.toFixed(ASSET_PROPERTIES[activeSymbol]?.digits || 2)}</strong></span>
                    <span>L: <strong className="text-red-400">{hoveredCandle.low.toFixed(ASSET_PROPERTIES[activeSymbol]?.digits || 2)}</strong></span>
                    <span>C: <strong className="text-white">{hoveredCandle.close.toFixed(ASSET_PROPERTIES[activeSymbol]?.digits || 2)}</strong></span>
                    <span>V: <strong className="text-gray-300">{hoveredCandle.volume.toFixed(0)}</strong></span>
                  </>
                ) : (
                  renderedCandles.length > 0 && (
                    <>
                      <span>O: <strong className="text-white">{renderedCandles[renderedCandles.length - 1].open.toFixed(ASSET_PROPERTIES[activeSymbol]?.digits || 2)}</strong></span>
                      <span>H: <strong className="text-emerald-400">{renderedCandles[renderedCandles.length - 1].high.toFixed(ASSET_PROPERTIES[activeSymbol]?.digits || 2)}</strong></span>
                      <span>L: <strong className="text-red-400">{renderedCandles[renderedCandles.length - 1].low.toFixed(ASSET_PROPERTIES[activeSymbol]?.digits || 2)}</strong></span>
                      <span>C: <strong className="text-white">{renderedCandles[renderedCandles.length - 1].close.toFixed(ASSET_PROPERTIES[activeSymbol]?.digits || 2)}</strong></span>
                    </>
                  )
                )}
              </div>

              {/* Interactive Analysis Tools & Fullscreen Toggle Buttons */}
              <div className="flex items-center gap-2">
                <a
                  href={`https://www.tradingview.com/chart/?symbol=${getTradingViewSymbol(activeSymbol)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#0b1424] hover:bg-[#11203b] border border-blue-900/50 text-[9px] font-extrabold text-blue-400 hover:text-blue-300 transition-all cursor-pointer shadow-sm tracking-wider uppercase"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>TradingView Chart</span>
                </a>

                <button
                  type="button"
                  onClick={() => setIsChartFullscreen(!isChartFullscreen)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#111622] hover:bg-[#1a2133] border border-gray-800 text-[9px] font-bold text-amber-500 hover:text-amber-400 transition-all cursor-pointer shadow"
                  title={isChartFullscreen ? "Exit Fullscreen" : "Fullscreen Chart"}
                >
                  {isChartFullscreen ? (
                    <>
                      <Minimize2 className="w-3.5 h-3.5" />
                      <span>EXIT FULLSCREEN</span>
                    </>
                  ) : (
                    <>
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>FULLSCREEN</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Debugging Panel / Feed Sync Monitor */}
            <div className="my-1.5 p-2 bg-[#06080D]/60 border border-gray-900 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[10px] font-mono shadow-sm">
              <div className="flex items-center gap-1.5 text-gray-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping mr-1"></span>
                <span className="font-bold text-[9px] uppercase tracking-wider text-gray-500">Feed Sync Monitor ({activeSymbol}):</span>
              </div>
              <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-500">Chart Price:</span>
                  <span className="text-white font-bold">{debugChartPrice ? debugChartPrice.toFixed(ASSET_PROPERTIES[activeSymbol]?.digits || 2) : 'Fetching...'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-500">Engine Price:</span>
                  <span className="text-amber-500 font-bold">{debugEnginePrice ? debugEnginePrice.toFixed(ASSET_PROPERTIES[activeSymbol]?.digits || 2) : 'Fetching...'}</span>
                </div>
                <div className="flex items-center gap-1.5 border-l border-gray-800 pl-4">
                  <span className="text-gray-500">Difference:</span>
                  <span className={`font-bold ${debugDifference > 0.05 ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>
                    {debugDifference.toFixed(4)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
                {showPriceDesyncWarning ? (
                  <span className="bg-red-500/10 border border-red-500/30 text-red-400 text-[8px] font-bold px-1.5 py-0.5 rounded animate-pulse">
                    PRICE DESYNC WARNING
                  </span>
                ) : (
                  <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8px] font-bold px-1.5 py-0.5 rounded">
                    FEEDS SYNCED
                  </span>
                )}
              </div>
            </div>

            {/* THE RENDERED ACTIVE CHART */}
            <div className="flex-grow bg-[#05070B] rounded-xl border border-gray-900 overflow-hidden relative mt-2 flex items-center justify-center min-h-[400px]">
              {chartMode === 'tradingview' ? (
                <iframe
                  title="TradingView Live Chart"
                  src={`https://s.tradingview.com/widgetembed/?symbol=${encodeURIComponent(getTradingViewSymbol(activeSymbol))}&theme=dark&style=1&locale=en&timezone=Etc%2FUTC&hide_side_toolbar=true&allow_symbol_change=false`}
                  className="absolute inset-0 w-full h-full border-0 rounded-xl"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <svg
                  ref={svgRef}
                  width="100%"
                  height="100%"
                  viewBox={`0 0 ${width} ${totalHeight}`}
                  preserveAspectRatio="none"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                  onMouseUp={handleMouseUp}
                onWheel={handleWheel}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className="cursor-crosshair overflow-visible"
              >
                {/* Horizontal Grid lines */}
                {Array.from({ length: 6 }).map((_, i) => {
                  const yVal = 15 + (mainChartHeight / 5) * i;
                  const priceLabel = scaleMax - (i / 5) * (scaleMax - scaleMin);
                  return (
                    <g key={i}>
                      <line
                        x1="10"
                        y1={yVal}
                        x2={width - 70}
                        y2={yVal}
                        stroke="#111622"
                        strokeWidth="1"
                        strokeDasharray="3,3"
                      />
                      <text
                        x={width - 65}
                        y={yVal + 3}
                        fill="#4b5563"
                        fontSize="9"
                        fontFamily="monospace"
                      >
                        {priceLabel.toFixed(ASSET_PROPERTIES[activeSymbol]?.digits || 2)}
                      </text>
                    </g>
                  );
                })}

                {/* RSI Indicator sub-panel separator and limits */}
                {showRSI && (
                  <>
                    <line
                      x1="10"
                      y1={mainChartHeight + separator}
                      x2={width - 70}
                      y2={mainChartHeight + separator}
                      stroke="#1e293b"
                      strokeWidth="1"
                    />
                    {/* RSI lines: 30 and 70 limits */}
                    {[30, 70].map((rsiVal) => {
                      const rsiY = mainChartHeight + separator + rsiHeight - (rsiVal / 100) * rsiHeight;
                      return (
                        <g key={rsiVal}>
                          <line
                            x1="10"
                            y1={rsiY}
                            x2={width - 70}
                            y2={rsiY}
                            stroke="#334155"
                            strokeWidth="1"
                            strokeDasharray="2,2"
                          />
                          <text
                            x={width - 65}
                            y={rsiY + 3}
                            fill="#64748b"
                            fontSize="8"
                            fontFamily="monospace"
                          >
                            {rsiVal}
                          </text>
                        </g>
                      );
                    })}
                  </>
                )}

                {/* Draw Candles and indicators */}
                {renderedCandles.map((c, i) => {
                  const candleX = getX(i);
                  const oY = getY(c.open);
                  const hY = getY(c.high);
                  const lY = getY(c.low);
                  const cY = getY(c.close);

                  const isBull = c.close >= c.open;
                  const strokeColor = isBull ? '#10b981' : '#ef4444';
                  const fillColor = isBull ? '#10b981' : '#ef4444';

                  const candleWidth = Math.max(3, (width - 70) / renderedCandles.length * 0.7);

                  return (
                    <g key={i}>
                      {/* Shadow lines */}
                      <line
                        x1={candleX}
                        y1={hY}
                        x2={candleX}
                        y2={lY}
                        stroke={strokeColor}
                        strokeWidth="1.5"
                      />
                      {/* Body */}
                      <rect
                        x={candleX - candleWidth / 2}
                        y={Math.min(oY, cY)}
                        width={candleWidth}
                        height={Math.max(1.5, Math.abs(cY - oY))}
                        fill={fillColor}
                        stroke={strokeColor}
                        strokeWidth="1"
                      />
                    </g>
                  );
                })}

                {/* Draw Moving Average line */}
                {showMA && (
                  <path
                    d={renderedCandles
                      .map((c, i) => {
                        const ma = getMA(i);
                        if (!ma) return '';
                        return `${i === 10 ? 'M' : 'L'} ${getX(i)} ${getY(ma)}`;
                      })
                      .filter(Boolean)
                      .join(' ')}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="1.5"
                  />
                )}

                {/* Draw RSI graph line */}
                {showRSI && (
                  <path
                    d={renderedCandles
                      .map((c, i) => {
                        const rsi = getRSIPoint(i);
                        const rsiY = mainChartHeight + separator + rsiHeight - (rsi / 100) * rsiHeight;
                        return `${i === 0 ? 'M' : 'L'} ${getX(i)} ${rsiY}`;
                      })
                      .join(' ')}
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="1.5"
                    strokeOpacity="0.8"
                  />
                )}

                {/* Render advanced drawing analysis tools */}
                {renderDrawings()}

                {/* Interactive ACTIVE POSITIONS Lines (Displays Stop Loss / Take Profit visually on chart with Exness dragging!) */}
                {openPositions.filter(p => p.asset === activeSymbol).map((p) => {
                  const entryY = getY(p.entryPrice);
                  const pipSize = getPipSize(p.asset);
                  const digits = ASSET_PROPERTIES[p.asset]?.digits || 2;

                  const isDraggingSL = activeDrag && activeDrag.tradeId === p.id && activeDrag.type === 'sl';
                  const isDraggingTP = activeDrag && activeDrag.tradeId === p.id && activeDrag.type === 'tp';

                  const slPrice = isDraggingSL ? draggedPrice : (p.stopLoss || null);
                  const tpPrice = isDraggingTP ? draggedPrice : (p.takeProfit || null);

                  const hasSL = slPrice !== null;
                  const hasTP = tpPrice !== null;

                  // Ghost prices when not set
                  const ghostSLPrice = p.direction === 'buy' ? p.entryPrice - 25 * pipSize : p.entryPrice + 25 * pipSize;
                  const ghostTPPrice = p.direction === 'buy' ? p.entryPrice + 35 * pipSize : p.entryPrice - 35 * pipSize;

                  const finalSLPrice = hasSL ? slPrice! : ghostSLPrice;
                  const finalTPPrice = hasTP ? tpPrice! : ghostTPPrice;

                  const slY = getY(finalSLPrice);
                  const tpY = getY(finalTPPrice);

                  // Gliding transitions for market movements unless dragging
                  const smoothStyle = { transition: 'y1 0.25s ease-out, y2 0.25s ease-out, y 0.25s ease-out, cy 0.25s ease-out' };
                  const isDraggingThisTrade = activeDrag && activeDrag.tradeId === p.id;
                  const style = isDraggingThisTrade ? undefined : smoothStyle;

                  return (
                    <g key={p.id}>
                      {/* Entry Price dashed line */}
                      <line
                        x1="10"
                        y1={entryY}
                        x2={width - 70}
                        y2={entryY}
                        stroke="#eab308"
                        strokeWidth="1.2"
                        strokeDasharray="4,4"
                        style={style}
                      />
                      
                      {/* Entry Label & P/L Group */}
                      <g style={style}>
                        {/* Entry Badge */}
                        <rect
                          x="15"
                          y={entryY - 14}
                          width="110"
                          height="11"
                          fill="#090d16"
                          stroke="#eab308"
                          strokeWidth="0.5"
                          strokeOpacity="0.6"
                          rx="2"
                        />
                        <text
                          x="18"
                          y={entryY - 5}
                          fill="#eab308"
                          fontSize="7.5"
                          fontFamily="monospace"
                          className="font-bold"
                        >
                          ENTRY: {p.entryPrice.toFixed(digits)}
                        </text>

                        {/* Real-time Smooth P&L badge! */}
                        <rect
                          x="130"
                          y={entryY - 14}
                          width="65"
                          height="11"
                          fill={p.profitLoss >= 0 ? '#064e3b' : '#7f1d1d'}
                          rx="2"
                        />
                        <text
                          x="134"
                          y={entryY - 5}
                          fill={p.profitLoss >= 0 ? '#34d399' : '#f87171'}
                          fontSize="7.5"
                          fontFamily="monospace"
                          className="font-extrabold"
                        >
                          P/L: {p.profitLoss >= 0 ? '+' : ''}${p.profitLoss.toFixed(2)}
                        </text>
                      </g>

                      {/* SL Line Group */}
                      {slY >= 10 && slY <= mainChartHeight && (
                        <g style={isDraggingSL ? undefined : style}>
                          {/* Transparent wide line for great touch/click dragging experience */}
                          <line
                            x1="10"
                            y1={slY}
                            x2={width - 70}
                            y2={slY}
                            stroke="transparent"
                            strokeWidth="10"
                            className="cursor-ns-resize"
                            onMouseDown={(e) => handleStartDrag(e, p.id, 'sl', finalSLPrice)}
                          />
                          
                          {/* Visual line */}
                          <line
                            x1="10"
                            y1={slY}
                            x2={width - 70}
                            y2={slY}
                            stroke="#f87171"
                            strokeWidth={hasSL ? "1.2" : "1"}
                            strokeDasharray={hasSL ? "3,3" : "1,4"}
                            strokeOpacity={hasSL ? "1.0" : "0.4"}
                            className="cursor-ns-resize"
                            onMouseDown={(e) => handleStartDrag(e, p.id, 'sl', finalSLPrice)}
                          />
                          
                          {/* SL Label Badge */}
                          <g className="cursor-ns-resize" onMouseDown={(e) => handleStartDrag(e, p.id, 'sl', finalSLPrice)}>
                            <rect
                              x="15"
                              y={slY - 14}
                              width={hasSL ? "165" : "125"}
                              height="11"
                              fill={isDraggingSL ? "#7f1d1d" : "#090d16"}
                              stroke="#f87171"
                              strokeWidth="0.5"
                              strokeOpacity={hasSL ? "0.8" : "0.3"}
                              rx="2"
                            />
                            <text
                              x="18"
                              y={slY - 5}
                              fill={hasSL ? "#f87171" : "#f8717180"}
                              fontSize="7.5"
                              fontFamily="monospace"
                              className="font-bold"
                            >
                              {hasSL 
                                ? `SL: ${finalSLPrice.toFixed(digits)} (Est. P/L: $${calculateProjectedPnL(p, finalSLPrice).toFixed(2)})`
                                : `↕ DRAG TO SET SL`
                              }
                            </text>
                          </g>

                          {/* Cancel/Remove SL 'x' button */}
                          {hasSL && (
                            <g 
                              className="cursor-pointer" 
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onModifyTrade) onModifyTrade(p.id, undefined, p.takeProfit);
                              }}
                            >
                              <rect
                                x="185"
                                y={slY - 14}
                                width="12"
                                height="11"
                                fill="#1f2937"
                                stroke="#f87171"
                                strokeWidth="0.5"
                                rx="2"
                              />
                              <text
                                x="189"
                                y={slY - 5}
                                fill="#f87171"
                                fontSize="7"
                                fontFamily="monospace"
                                className="font-extrabold"
                              >
                                ✕
                              </text>
                            </g>
                          )}
                        </g>
                      )}

                      {/* TP Line Group */}
                      {tpY >= 10 && tpY <= mainChartHeight && (
                        <g style={isDraggingTP ? undefined : style}>
                          {/* Transparent wide line for great touch/click dragging experience */}
                          <line
                            x1="10"
                            y1={tpY}
                            x2={width - 70}
                            y2={tpY}
                            stroke="transparent"
                            strokeWidth="10"
                            className="cursor-ns-resize"
                            onMouseDown={(e) => handleStartDrag(e, p.id, 'tp', finalTPPrice)}
                          />
                          
                          {/* Visual line */}
                          <line
                            x1="10"
                            y1={tpY}
                            x2={width - 70}
                            y2={tpY}
                            stroke="#34d399"
                            strokeWidth={hasTP ? "1.2" : "1"}
                            strokeDasharray={hasTP ? "3,3" : "1,4"}
                            strokeOpacity={hasTP ? "1.0" : "0.4"}
                            className="cursor-ns-resize"
                            onMouseDown={(e) => handleStartDrag(e, p.id, 'tp', finalTPPrice)}
                          />
                          
                          {/* TP Label Badge */}
                          <g className="cursor-ns-resize" onMouseDown={(e) => handleStartDrag(e, p.id, 'tp', finalTPPrice)}>
                            <rect
                              x="15"
                              y={tpY - 14}
                              width={hasTP ? "165" : "125"}
                              height="11"
                              fill={isDraggingTP ? "#064e3b" : "#090d16"}
                              stroke="#34d399"
                              strokeWidth="0.5"
                              strokeOpacity={hasTP ? "0.8" : "0.3"}
                              rx="2"
                            />
                            <text
                              x="18"
                              y={tpY - 5}
                              fill={hasTP ? "#34d399" : "#34d39980"}
                              fontSize="7.5"
                              fontFamily="monospace"
                              className="font-bold"
                            >
                              {hasTP 
                                ? `TP: ${finalTPPrice.toFixed(digits)} (Est. P/L: +$${calculateProjectedPnL(p, finalTPPrice).toFixed(2)})`
                                : `↕ DRAG TO SET TP`
                              }
                            </text>
                          </g>

                          {/* Cancel/Remove TP 'x' button */}
                          {hasTP && (
                            <g 
                              className="cursor-pointer" 
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onModifyTrade) onModifyTrade(p.id, p.stopLoss, undefined);
                              }}
                            >
                              <rect
                                x="185"
                                y={tpY - 14}
                                width="12"
                                height="11"
                                fill="#1f2937"
                                stroke="#34d399"
                                strokeWidth="0.5"
                                rx="2"
                              />
                              <text
                                x="189"
                                y={tpY - 5}
                                fill="#34d399"
                                fontSize="7"
                                fontFamily="monospace"
                                className="font-extrabold"
                              >
                                ✕
                              </text>
                            </g>
                          )}
                        </g>
                      )}
                    </g>
                  );
                })}

                {/* Hover Crosshair guides */}
                {crosshair && (
                  <g>
                    {/* Vertical line */}
                    {crosshair.x >= 10 && crosshair.x <= width - 70 && (
                      <line
                        x1={crosshair.x}
                        y1="10"
                        x2={crosshair.x}
                        y2={totalHeight}
                        stroke="#4b5563"
                        strokeWidth="1"
                        strokeDasharray="2,2"
                        strokeOpacity="0.7"
                      />
                    )}
                    {/* Horizontal line */}
                    {crosshair.y >= 10 && crosshair.y <= totalHeight && (
                      <line
                        x1="10"
                        y1={crosshair.y}
                        x2={width - 70}
                        y2={crosshair.y}
                        stroke="#4b5563"
                        strokeWidth="1"
                        strokeDasharray="2,2"
                        strokeOpacity="0.7"
                      />
                    )}
                  </g>
                )}
              </svg>
            )}

              {/* Time display indicator inside the chart */}
              <div className="absolute bottom-1 left-2 font-mono text-[9px] text-emerald-500 bg-[#05070B] border border-emerald-950/40 px-1.5 py-0.5 rounded flex items-center gap-1.5 shadow">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                LIVE MARKET FEED • EST: {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>

          {/* LOWER TABS: POSITIONS & AUDITS (Height responsive) */}
          <div className="bg-[#0A0D14] border border-gray-900 rounded-xl p-4 flex flex-col h-[320px] lg:h-[280px]">
            <div className="flex gap-1.5 border-b border-gray-800 pb-2 mb-2 overflow-x-auto scrollbar-none scroll-smooth">
              <button
                onClick={() => setActiveTab('positions')}
                className={`px-3 py-1.5 rounded text-[10px] uppercase font-mono tracking-wider transition-colors cursor-pointer flex-shrink-0 ${activeTab === 'positions' ? 'bg-[#111622] text-white border border-gray-800 font-semibold' : 'text-gray-500 hover:text-white'}`}
              >
                Open Positions ({openPositions.length})
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-3 py-1.5 rounded text-[10px] uppercase font-mono tracking-wider transition-colors cursor-pointer flex-shrink-0 ${activeTab === 'history' ? 'bg-[#111622] text-white border border-gray-800 font-semibold' : 'text-gray-500 hover:text-white'}`}
              >
                Closed Trades ({closedTrades.length})
              </button>
              <button
                onClick={() => setActiveTab('pending')}
                className={`px-3 py-1.5 rounded text-[10px] uppercase font-mono tracking-wider transition-colors cursor-pointer flex-shrink-0 ${activeTab === 'pending' ? 'bg-[#111622] text-white border border-gray-800 font-semibold' : 'text-gray-500 hover:text-white'}`}
              >
                Pending Orders ({pendingOrders.length})
              </button>
              <button
                onClick={() => setActiveTab('logs')}
                className={`px-3 py-1.5 rounded text-[10px] uppercase font-mono tracking-wider transition-colors cursor-pointer flex-shrink-0 ${activeTab === 'logs' ? 'bg-[#111622] text-white border border-gray-800 font-semibold' : 'text-gray-500 hover:text-white'}`}
              >
                Rules Audit Logs
              </button>
              <button
                onClick={() => setActiveTab('rules')}
                className={`px-3 py-1.5 rounded text-[10px] uppercase font-mono tracking-wider transition-colors cursor-pointer flex-shrink-0 ${activeTab === 'rules' ? 'bg-[#111622] text-white border border-gray-800 font-semibold' : 'text-amber-500 hover:text-white border border-amber-500/20 bg-amber-500/5'}`}
              >
                🚨 Terminal Rules
              </button>
            </div>

            {/* List panel */}
            <div className="flex-grow overflow-y-auto text-[11px] font-mono pr-1">
              {activeTab === 'positions' && (() => {
                const floatingPL = openPositions.reduce((sum, pos) => sum + pos.profitLoss, 0);
                const equity = activeAccount.balance + floatingPL;
                const usedMargin = openPositions.reduce((total, pos) => {
                  const contractSize = getSymbolContract(pos.asset);
                  const baseToUsd = getClientBaseToUSDExchangeRate(pos.asset);
                  const posLeverage = pos.leverage || leverage || 100;
                  return total + (pos.lotSize * contractSize * baseToUsd) / posLeverage;
                }, 0);
                const freeMargin = Math.max(0, equity - usedMargin);
                const marginLevel = usedMargin > 0 ? (equity / usedMargin) * 100 : 0;

                return (
                  <div className="space-y-1">
                    {openPositions.length === 0 ? (
                      <p className="text-gray-600 text-center py-6">No open operations on this account.</p>
                    ) : (
                      <>
                        {/* Mobile Card Layout */}
                        <div className="block md:hidden space-y-2">
                          {openPositions.map((p) => {
                            const isUp = p.profitLoss >= 0;
                            const pipSize = getPipSize(p.asset);
                            const diff = p.direction === 'buy' ? p.currentPrice - p.entryPrice : p.entryPrice - p.currentPrice;
                            const pips = diff / pipSize;
                            const isEditing = modifyingTradeId === p.id;

                            return (
                              <div key={p.id} className="bg-gray-900/40 p-3 rounded-lg border border-gray-800/60 space-y-2 text-left">
                                <div className="flex justify-between items-center">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-white text-xs">{p.asset}</span>
                                    <span className={`px-1 rounded text-[9px] font-bold ${p.direction === 'buy' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                      {p.direction.toUpperCase()}
                                    </span>
                                    <span className="text-gray-500 text-[9px]">#{p.id}</span>
                                  </div>
                                  <div className="text-right">
                                    <div className={`font-bold text-xs ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
                                      ${p.profitLoss.toFixed(2)}
                                    </div>
                                    <div className={`text-[9px] font-normal font-sans ${pips >= 0 ? 'text-emerald-400/80' : 'text-red-400/80'}`}>
                                      {pips >= 0 ? '+' : ''}{pips.toFixed(1)} pips
                                    </div>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-y-1 text-[10px] text-gray-400 border-t border-gray-800/40 pt-1.5">
                                  <div>
                                    <span className="text-gray-500">Lots:</span> <span className="text-gray-200">{p.lotSize}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Entry:</span> <span className="text-gray-200">{p.entryPrice.toFixed(ASSET_PROPERTIES[p.asset]?.digits || 2)}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">S/L:</span> <span className="text-red-400 font-bold">{p.stopLoss ? p.stopLoss.toFixed(ASSET_PROPERTIES[p.asset]?.digits || 2) : 'None'}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">T/P:</span> <span className="text-emerald-400 font-bold">{p.takeProfit ? p.takeProfit.toFixed(ASSET_PROPERTIES[p.asset]?.digits || 2) : 'None'}</span>
                                  </div>
                                </div>

                                {isEditing ? (
                                  <div className="bg-black/40 p-2.5 rounded-lg border border-amber-500/20 space-y-2 mt-2">
                                    <div className="grid grid-cols-2 gap-2">
                                      <div className="space-y-1">
                                        <label className="text-[8px] text-gray-500 font-mono block uppercase">Stop Loss (S/L)</label>
                                        <input
                                          type="text"
                                          placeholder="None"
                                          value={modifySLValue}
                                          onChange={(e) => setModifySLValue(e.target.value)}
                                          className="w-full bg-[#111622] border border-gray-800 focus:border-red-500/50 rounded px-2 py-1 text-xs text-red-400 font-bold font-mono text-center"
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <label className="text-[8px] text-gray-500 font-mono block uppercase">Take Profit (T/P)</label>
                                        <input
                                          type="text"
                                          placeholder="None"
                                          value={modifyTPValue}
                                          onChange={(e) => setModifyTPValue(e.target.value)}
                                          className="w-full bg-[#111622] border border-gray-800 focus:border-emerald-500/50 rounded px-2 py-1 text-xs text-emerald-400 font-bold font-mono text-center"
                                        />
                                      </div>
                                    </div>
                                    <div className="flex gap-2 pt-1">
                                      <button
                                        onClick={handleSaveModifiedTrade}
                                        className="flex-1 bg-amber-500 text-black font-bold py-1.5 rounded text-xs transition-colors hover:bg-amber-600"
                                      >
                                        Save S/L T/P
                                      </button>
                                      <button
                                        onClick={() => setModifyingTradeId(null)}
                                        className="flex-1 bg-gray-800 text-gray-300 py-1.5 rounded text-xs transition-colors hover:bg-gray-700"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex gap-2 pt-1">
                                    <button
                                      onClick={() => {
                                        setModifyingTradeId(p.id);
                                        setModifySLValue(p.stopLoss ? p.stopLoss.toString() : '');
                                        setModifyTPValue(p.takeProfit ? p.takeProfit.toString() : '');
                                      }}
                                      className="flex-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500 hover:text-black py-1 rounded text-[10px] font-bold transition-all cursor-pointer text-center"
                                    >
                                      Modify S/L T/P
                                    </button>
                                    <button
                                      onClick={() => onCloseTrade(p.id)}
                                      className="flex-1 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white py-1 rounded text-[10px] font-bold transition-all cursor-pointer text-center"
                                    >
                                      Close Position
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Desktop Table Layout */}
                        <div className="hidden md:block overflow-x-auto">
                          <table className="w-full text-left">
                            <thead>
                              <tr className="text-gray-500 border-b border-gray-900 pb-1 text-[10px]">
                                <th className="pb-1">ID</th>
                                <th className="pb-1">Symbol</th>
                                <th className="pb-1">Direction</th>
                                <th className="pb-1">Lots</th>
                                <th className="pb-1">Entry</th>
                                <th className="pb-1">Current</th>
                                <th className="pb-1 text-center">Stop Loss</th>
                                <th className="pb-1 text-center">Take Profit</th>
                                <th className="pb-1 text-right">Profit/Loss</th>
                                <th className="pb-1 text-right">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-950">
                              {openPositions.map((p) => {
                                const isUp = p.profitLoss >= 0;
                                const pipSize = getPipSize(p.asset);
                                const diff = p.direction === 'buy' ? p.currentPrice - p.entryPrice : p.entryPrice - p.currentPrice;
                                const pips = diff / pipSize;
                                const isEditing = modifyingTradeId === p.id;

                                return (
                                  <tr key={p.id} className="hover:bg-gray-900/40">
                                    <td className="py-2 text-gray-500">{p.id}</td>
                                    <td className="py-2 font-bold text-white">{p.asset}</td>
                                    <td className="py-2">
                                      <span className={`px-1 rounded text-xxs font-bold ${p.direction === 'buy' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                        {p.direction.toUpperCase()}
                                      </span>
                                    </td>
                                    <td className="py-2 text-gray-300">{p.lotSize}</td>
                                    <td className="py-2 text-gray-300">{p.entryPrice.toFixed(ASSET_PROPERTIES[p.asset]?.digits || 2)}</td>
                                    <td className="py-2 text-gray-300">{p.currentPrice.toFixed(ASSET_PROPERTIES[p.asset]?.digits || 2)}</td>
                                    <td className="py-2 text-center">
                                      {isEditing ? (
                                        <input
                                          type="text"
                                          placeholder="None"
                                          value={modifySLValue}
                                          onChange={(e) => setModifySLValue(e.target.value)}
                                          className="w-20 bg-gray-950 border border-red-500/30 rounded px-1.5 py-0.5 text-xs text-red-400 font-bold font-mono text-center outline-none focus:border-red-500"
                                        />
                                      ) : (
                                        <span className="text-red-400 font-bold font-mono">
                                          {p.stopLoss ? p.stopLoss.toFixed(ASSET_PROPERTIES[p.asset]?.digits || 2) : '-'}
                                        </span>
                                      )}
                                    </td>
                                    <td className="py-2 text-center">
                                      {isEditing ? (
                                        <input
                                          type="text"
                                          placeholder="None"
                                          value={modifyTPValue}
                                          onChange={(e) => setModifyTPValue(e.target.value)}
                                          className="w-20 bg-gray-950 border border-emerald-500/30 rounded px-1.5 py-0.5 text-xs text-emerald-400 font-bold font-mono text-center outline-none focus:border-emerald-500"
                                        />
                                      ) : (
                                        <span className="text-emerald-400 font-bold font-mono">
                                          {p.takeProfit ? p.takeProfit.toFixed(ASSET_PROPERTIES[p.asset]?.digits || 2) : '-'}
                                        </span>
                                      )}
                                    </td>
                                    <td className="py-2 text-right">
                                      <div className={`font-bold ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
                                        ${p.profitLoss.toFixed(2)}
                                      </div>
                                      <div className={`text-[10px] font-normal font-sans ${pips >= 0 ? 'text-emerald-400/80' : 'text-red-400/80'}`}>
                                        {pips >= 0 ? '+' : ''}{pips.toFixed(1)} pips
                                      </div>
                                    </td>
                                    <td className="py-2 text-right">
                                      {isEditing ? (
                                        <div className="flex gap-1.5 justify-end">
                                          <button
                                            onClick={handleSaveModifiedTrade}
                                            className="bg-emerald-500 text-black hover:bg-emerald-600 px-2 py-0.5 rounded text-[9px] font-bold transition-colors cursor-pointer"
                                          >
                                            Save
                                          </button>
                                          <button
                                            onClick={() => setModifyingTradeId(null)}
                                            className="bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white px-2 py-0.5 rounded text-[9px] transition-colors cursor-pointer"
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      ) : (
                                        <div className="flex gap-1.5 justify-end">
                                          <button
                                            onClick={() => {
                                              setModifyingTradeId(p.id);
                                              setModifySLValue(p.stopLoss ? p.stopLoss.toString() : '');
                                              setModifyTPValue(p.takeProfit ? p.takeProfit.toString() : '');
                                            }}
                                            className="bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-400 hover:text-black px-2 py-0.5 rounded text-[9px] transition-all cursor-pointer"
                                          >
                                            Modify
                                          </button>
                                          <button
                                            onClick={() => onCloseTrade(p.id)}
                                            className="bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white px-2 py-0.5 rounded text-[9px] transition-colors cursor-pointer"
                                          >
                                            Close
                                          </button>
                                        </div>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        {/* MT5-Style Unified Account Info Summary Bar */}
                        <div className="mt-2 flex flex-wrap gap-4 items-center justify-between bg-[#111622]/40 border border-gray-900 rounded-lg p-2.5 px-4 font-mono text-[10px] text-gray-400">
                          <div className="flex flex-wrap gap-x-5 gap-y-1">
                            <span>Balance: <strong className="text-white">${activeAccount.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></span>
                            <span>Equity: <strong className="text-white">${equity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></span>
                            <span>Margin: <strong className="text-white">${usedMargin.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></span>
                            <span>Free Margin: <strong className="text-amber-400">${freeMargin.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></span>
                            <span>Margin Level: <strong className={`${marginLevel >= 500 ? 'text-emerald-400' : marginLevel >= 150 ? 'text-amber-400' : 'text-red-400'} font-bold`}>{usedMargin > 0 ? `${marginLevel.toFixed(2)}%` : '0.00%'}</strong></span>
                          </div>
                          <div>
                            <span>Total P&L: <strong className={`font-bold ${floatingPL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{floatingPL >= 0 ? '+' : ''}${floatingPL.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                );
              })()}

              {activeTab === 'history' && (
                <div className="space-y-1">
                  {closedTrades.length === 0 ? (
                    <p className="text-gray-600 text-center py-6">No closed operations on this account.</p>
                  ) : (
                    <>
                      {/* Mobile Card Layout */}
                      <div className="block md:hidden space-y-2">
                        {closedTrades.map((p) => {
                          const isUp = p.profitLoss >= 0;
                          const pipSize = getPipSize(p.asset);
                          const diff = p.direction === 'buy' ? (p.exitPrice || p.entryPrice) - p.entryPrice : p.entryPrice - (p.exitPrice || p.entryPrice);
                          const pips = diff / pipSize;
                          return (
                            <div key={p.id} className="bg-gray-900/40 p-3 rounded-lg border border-gray-800/60 space-y-1 text-left">
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-white text-xs">{p.asset}</span>
                                  <span className={`px-1 rounded text-[9px] font-bold ${p.direction === 'buy' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                    {p.direction.toUpperCase()}
                                  </span>
                                  <span className="text-gray-500 text-[9px]">#{p.id}</span>
                                </div>
                                <div className="text-right">
                                  <div className={`font-bold text-xs ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
                                    ${p.profitLoss.toFixed(2)}
                                  </div>
                                  <div className={`text-[9px] font-normal font-sans ${pips >= 0 ? 'text-emerald-400/80' : 'text-red-400/80'}`}>
                                    {pips >= 0 ? '+' : ''}{pips.toFixed(1)} pips
                                  </div>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-y-1 text-[10px] text-gray-400 border-t border-gray-800/40 pt-1.5">
                                <div>
                                  <span className="text-gray-500">Lots:</span> <span className="text-gray-200">{p.lotSize}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500">Reason:</span> <span className="text-gray-200 uppercase">{p.reason || 'manual'}</span>
                                </div>
                                <div className="col-span-2">
                                  <span className="text-gray-500">Entry/Exit:</span> <span className="text-gray-200">{p.entryPrice} / {p.exitPrice}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Desktop Table Layout */}
                      <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="text-gray-500 border-b border-gray-900 pb-1 text-[10px]">
                              <th className="pb-1">ID</th>
                              <th className="pb-1">Symbol</th>
                              <th className="pb-1">Direction</th>
                              <th className="pb-1">Lots</th>
                              <th className="pb-1">Entry / Exit</th>
                              <th className="pb-1">Reason</th>
                              <th className="pb-1 text-right">Profit/Loss</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-950">
                            {closedTrades.map((p) => {
                              const isUp = p.profitLoss >= 0;
                              const pipSize = getPipSize(p.asset);
                              const diff = p.direction === 'buy' ? (p.exitPrice || p.entryPrice) - p.entryPrice : p.entryPrice - (p.exitPrice || p.entryPrice);
                              const pips = diff / pipSize;
                              return (
                                <tr key={p.id}>
                                  <td className="py-1 text-gray-600">{p.id}</td>
                                  <td className="py-1 text-gray-300">{p.asset}</td>
                                  <td className="py-1">
                                    <span className={`px-1 rounded text-xxs font-bold ${p.direction === 'buy' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                      {p.direction.toUpperCase()}
                                    </span>
                                  </td>
                                  <td className="py-1 text-gray-400">{p.lotSize}</td>
                                  <td className="py-1 text-gray-400">
                                    {p.entryPrice} / {p.exitPrice}
                                  </td>
                                  <td className="py-1 text-xxs text-gray-500 uppercase">{p.reason || 'manual'}</td>
                                  <td className="py-1 text-right">
                                    <div className={`font-bold ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
                                      ${p.profitLoss.toFixed(2)}
                                    </div>
                                    <div className={`text-[10px] font-normal font-sans ${pips >= 0 ? 'text-emerald-400/80' : 'text-red-400/80'}`}>
                                      {pips >= 0 ? '+' : ''}{pips.toFixed(1)} pips
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>
              )}

              {activeTab === 'pending' && (
                <div className="space-y-1">
                  {pendingOrders.length === 0 ? (
                    <p className="text-gray-600 text-center py-6">No pending limit/stop orders.</p>
                  ) : (
                    <>
                      {/* Mobile Card Layout */}
                      <div className="block md:hidden space-y-2">
                        {pendingOrders.map((p) => (
                          <div key={p.id} className="bg-gray-900/40 p-3 rounded-lg border border-gray-800/60 space-y-2 text-left">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-white text-xs">{p.asset}</span>
                                <span className={`px-1 rounded text-[9px] font-bold ${p.direction === 'buy' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                  {p.direction.toUpperCase()}
                                </span>
                                <span className="text-amber-500 text-[9px] font-bold uppercase">{p.orderType}</span>
                              </div>
                              <span className="text-gray-500 text-[9px]">#{p.id}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-y-1 text-[10px] text-gray-400 border-t border-gray-800/40 pt-1.5">
                              <div>
                                <span className="text-gray-500">Lots:</span> <span className="text-gray-200">{p.lotSize}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Trigger:</span> <span className="text-white font-bold">{p.triggerPrice}</span>
                              </div>
                            </div>
                            <div className="pt-1">
                              <button
                                onClick={() => onCancelOrder(p.id)}
                                className="w-full bg-gray-800 hover:bg-gray-750 text-gray-300 hover:text-white py-1.5 rounded text-[10px] transition-colors cursor-pointer"
                              >
                                Cancel Order
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Desktop Table Layout */}
                      <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="text-gray-500 border-b border-gray-900 pb-1 text-[10px]">
                              <th className="pb-1">ID</th>
                              <th className="pb-1">Asset</th>
                              <th className="pb-1">Type</th>
                              <th className="pb-1">Direction</th>
                              <th className="pb-1">Lots</th>
                              <th className="pb-1">Trigger</th>
                              <th className="pb-1 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-950">
                            {pendingOrders.map((p) => (
                              <tr key={p.id}>
                                <td className="py-2 text-gray-500">{p.id}</td>
                                <td className="py-2 font-bold text-white">{p.asset}</td>
                                <td className="py-2 text-amber-500 uppercase">{p.orderType}</td>
                                <td className="py-2">
                                  <span className={`px-1 rounded text-xxs font-bold ${p.direction === 'buy' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                    {p.direction.toUpperCase()}
                                  </span>
                                </td>
                                <td className="py-2 text-gray-300">{p.lotSize}</td>
                                <td className="py-2 text-white font-bold">{p.triggerPrice}</td>
                                <td className="py-2 text-right">
                                  <button
                                    onClick={() => onCancelOrder(p.id)}
                                    className="bg-gray-800 text-gray-400 hover:text-white px-2 py-0.5 rounded text-[9px] cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>
              )}

              {activeTab === 'logs' && (
                <div className="space-y-1.5 py-2">
                  {myLogs.length === 0 ? (
                    <p className="text-gray-600 text-center py-6">No audits registered for this account.</p>
                  ) : (
                    myLogs.map((log) => (
                      <div key={log.id} className="bg-gray-950 p-2.5 rounded border border-gray-900 flex justify-between gap-4 items-start">
                        <div>
                          <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                            log.type === 'success' ? 'bg-emerald-500' :
                            log.type === 'warning' ? 'bg-amber-500' :
                            log.type === 'danger' ? 'bg-red-500' : 'bg-blue-400'
                          }`} />
                          <span className="text-gray-300">{log.message}</span>
                        </div>
                        <span className="text-[9px] text-gray-600 flex-shrink-0">{new Date(log.timestamp).toLocaleTimeString()}</span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'rules' && (() => {
                return (
                  <div className="space-y-3 py-2 text-left font-sans text-gray-300">
                    <div className="bg-[#111622] p-3 rounded-lg border border-gray-800 text-[10px] leading-relaxed space-y-1">
                      <p className="font-bold text-white uppercase text-[10px] tracking-wider mb-1.5 font-mono">
                        Trading Mandates:
                      </p>
                      <p>• <strong>Daily Drawdown Limit:</strong> 5% of starting balance per day.</p>
                      <p>• <strong>Max Cumulative Drawdown:</strong> 10% overall limit.</p>
                      <p>• <strong>Minimum Holding Time:</strong> Trades must be held for at least 2 minutes (120s).</p>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: EXNESS-STYLE SIMPLIFIED TRADE EXECUTION (3 cols) */}
        <div className="lg:col-span-3 bg-[#0A0D14] border border-gray-900 rounded-xl p-4 flex flex-col h-auto lg:h-[650px] justify-between relative overflow-hidden">
          
          {/* Header & Server Status */}
          <div className="space-y-3 flex-grow flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center pb-2.5 border-b border-gray-900/60">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider">
                    Exness MT5 Live Server
                  </span>
                </div>
                <div className="flex items-center gap-1 bg-[#111622] px-2 py-0.5 rounded text-[9px] font-mono text-amber-400 border border-amber-500/20 font-bold">
                  PRO ACCOUNT
                </div>
              </div>

              {/* Connected Gmail Identity */}
              <div className="bg-[#05070B] border border-gray-950 rounded-lg p-2 mt-2 flex items-center justify-between">
                <div className="flex items-center gap-1.5 min-w-0">
                  <div className="w-5 h-5 rounded-full bg-amber-500/10 text-amber-400 font-bold text-[9px] flex items-center justify-center border border-amber-500/20 flex-shrink-0">
                    {currentUser.email.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-[10px] font-mono text-gray-400 truncate">
                    {currentUser.email}
                  </span>
                </div>
                <span className="text-[9px] font-mono text-gray-600 bg-gray-950 px-1.5 py-0.5 rounded">
                  ID: {currentUser.id.split('-')[1] || '602931'}
                </span>
              </div>

              {/* Account Balance, Equity & Margin metrics */}
              <div className="grid grid-cols-2 gap-2 mt-3 p-3 bg-gradient-to-br from-[#111622] to-[#0A0D14] rounded-xl border border-gray-900 shadow-lg">
                <div className="space-y-0.5">
                  <p className="text-[8px] text-gray-500 font-mono uppercase tracking-wider">Broker Balance</p>
                  <p className="text-sm font-bold text-white font-mono">
                    {activeAccount.balance.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                  </p>
                </div>
                <div className="space-y-0.5 text-right">
                  <p className="text-[8px] text-gray-500 font-mono uppercase tracking-wider">Free Margin</p>
                  <p className="text-sm font-bold text-amber-400 font-mono">
                    {(() => {
                      const usedMargin = openPositions.reduce((total, pos) => {
                        const contractSize = getSymbolContract(pos.asset);
                        const baseToUsd = getClientBaseToUSDExchangeRate(pos.asset);
                        const posLeverage = pos.leverage || leverage || 100;
                        return total + (pos.lotSize * contractSize * baseToUsd) / posLeverage;
                      }, 0);
                      const equity = activeAccount.balance + openPositions.reduce((acc, curr) => acc + curr.profitLoss, 0);
                      return Math.max(0, equity - usedMargin);
                    })().toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                  </p>
                </div>
                <div className="col-span-2 pt-2 border-t border-gray-950 flex justify-between items-center text-[9px] font-mono">
                  <span className="text-gray-500">Margin Used:</span>
                  <span className="text-gray-300 font-bold">
                    {(() => {
                      const usedMargin = openPositions.reduce((total, pos) => {
                        const contractSize = getSymbolContract(pos.asset);
                        const baseToUsd = getClientBaseToUSDExchangeRate(pos.asset);
                        const posLeverage = pos.leverage || leverage || 100;
                        return total + (pos.lotSize * contractSize * baseToUsd) / posLeverage;
                      }, 0);
                      return usedMargin;
                    })().toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                  </span>
                </div>
                <div className="col-span-2 pt-1 flex justify-between items-center text-[9px] font-mono">
                  <span className="text-gray-500">Margin Level:</span>
                  <span className="text-gray-300 font-bold">
                    {(() => {
                      const usedMargin = openPositions.reduce((total, pos) => {
                        const contractSize = getSymbolContract(pos.asset);
                        const baseToUsd = getClientBaseToUSDExchangeRate(pos.asset);
                        const posLeverage = pos.leverage || leverage || 100;
                        return total + (pos.lotSize * contractSize * baseToUsd) / posLeverage;
                      }, 0);
                      const equity = activeAccount.balance + openPositions.reduce((acc, curr) => acc + curr.profitLoss, 0);
                      const marginLevel = usedMargin > 0 ? (equity / usedMargin) * 100 : 0;
                      return usedMargin > 0 ? `${marginLevel.toFixed(2)}%` : '0.00%';
                    })()}
                  </span>
                </div>
              </div>

              {/* Risk Rules section inside Account Details */}
              <div className="mt-3 bg-gradient-to-br from-[#111622]/40 to-[#0A0D14]/80 p-3 rounded-xl border border-gray-900/60 shadow-md">
                <div className="flex justify-between items-center mb-1.5 pb-1 border-b border-gray-900/60">
                  <span className="text-[9px] font-mono font-bold text-gray-400 uppercase tracking-wider">
                    Risk Management Rules
                  </span>
                  <span className="text-[8px] px-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono font-bold rounded uppercase">Active</span>
                </div>
                <div className="space-y-1 text-[9px] font-mono text-gray-400">
                  <div className={`flex justify-between items-center p-1 rounded ${activeAccount.challengeSize === 5000 ? 'bg-amber-500/10 text-white font-bold border border-amber-500/20' : 'bg-gray-950/40'}`}>
                    <span>5K Account:</span>
                    <span className={activeAccount.challengeSize === 5000 ? 'text-amber-400 font-bold' : 'text-gray-500'}>Max Lot Size: 0.50</span>
                  </div>
                  <div className={`flex justify-between items-center p-1 rounded ${activeAccount.challengeSize === 10000 ? 'bg-amber-500/10 text-white font-bold border border-amber-500/20' : 'bg-gray-950/40'}`}>
                    <span>10K Account:</span>
                    <span className={activeAccount.challengeSize === 10000 ? 'text-amber-400 font-bold' : 'text-gray-500'}>Max Lot Size: 1.00</span>
                  </div>
                </div>
              </div>

              {/* Leverage Selector */}
              <div className="mt-3.5 space-y-1">
                <div className="flex justify-between text-[10px] font-mono text-gray-400">
                  <span>EXNESS LEVERAGE SETTING</span>
                  <span className="text-amber-400 font-bold">1:100</span>
                </div>
                <div className="grid grid-cols-1 gap-1 bg-gray-950 p-0.5 rounded-lg border border-gray-900 text-[9px]">
                  {([100] as const).map((lev) => (
                    <button
                      key={lev}
                      type="button"
                      disabled
                      onClick={() => setLeverage(lev)}
                      className="py-1 rounded font-mono font-semibold transition-colors cursor-default bg-[#111622] text-amber-400 border border-amber-500/20 font-bold text-center"
                    >
                      1:100 (Max Leverage Limit)
                    </button>
                  ))}
                </div>
              </div>

              {/* Order Type Tabs */}
              <div className="grid grid-cols-3 gap-1 bg-gray-950 p-0.5 rounded-lg border border-gray-900 mt-3">
                {(['market', 'limit', 'stop'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setOrderType(t)}
                    className={`py-1 rounded text-[9px] font-mono font-bold tracking-wider uppercase transition-colors cursor-pointer ${orderType === t ? 'bg-[#111622] text-white border border-gray-800' : 'text-gray-500 hover:text-white'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* Lot size input with quick adjustments */}
              <div className="mt-3 space-y-1 bg-[#111622]/20 border border-gray-900 rounded-xl p-3">
                <div className="flex justify-between text-[10px] font-mono text-gray-400">
                  <span className="font-bold">LOT SIZE (VOLUME)</span>
                  <span className="text-[9px] text-gray-500">1 Lot = {(ASSET_PROPERTIES[activeSymbol]?.lotSizeMultiplier || 100000).toLocaleString()} Units</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setLotSize(prev => Math.max(0.01, Math.round((prev - 0.1) * 100) / 100))}
                    className="w-8 h-8 flex items-center justify-center bg-gray-950 hover:bg-gray-900 text-gray-300 rounded-lg cursor-pointer transition-colors border border-gray-900"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max="100"
                    required
                    className={`flex-grow bg-gray-950 border rounded-lg py-1.5 text-center font-mono font-bold text-sm focus:outline-none transition-colors ${isLotSizeExceeded ? 'text-red-400 border-red-500 focus:border-red-500' : 'text-white border-gray-900 focus:border-amber-500'}`}
                    value={lotSize}
                    onChange={(e) => setLotSize(Number(e.target.value))}
                  />
                  <button
                    type="button"
                    onClick={() => setLotSize(prev => Math.min(100, Math.round((prev + 0.1) * 100) / 100))}
                    className="w-8 h-8 flex items-center justify-center bg-gray-950 hover:bg-gray-900 text-gray-300 rounded-lg cursor-pointer transition-colors border border-gray-900"
                  >
                    +
                  </button>
                </div>
                {/* Dynamically calculated margin value */}
                <div className="flex justify-between text-[9px] text-gray-500 font-mono pt-1">
                  <span>Required Margin:</span>
                  <span className="text-gray-400 font-bold">
                    {((lotSize * (ASSET_PROPERTIES[activeSymbol]?.lotSizeMultiplier || 100000) * (activeSymbol === 'USD/JPY' ? 1 : activeQuote.price)) / leverage).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                  </span>
                </div>
                {isLotSizeExceeded && (
                  <div className="mt-2 bg-red-500/10 border border-red-500/30 text-red-400 p-2 rounded-lg text-[10px] leading-normal font-medium flex items-start gap-1.5 animate-pulse">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    <span>{lotSizeWarningMessage}</span>
                  </div>
                )}
              </div>

              {/* Stop Loss & Take Profit with Quick Pips adjustment */}
              <div className="mt-3.5 space-y-3 bg-[#111622]/10 border border-gray-900/50 rounded-xl p-3">
                {/* SL Field */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] font-mono text-gray-400">
                    <span className="text-red-400 font-bold">STOP LOSS (SL)</span>
                    <button 
                      type="button"
                      onClick={() => {
                        const pipVal = getPipSize(activeSymbol);
                        const defaultSL = direction === 'buy' ? activeQuote.price - 30 * pipVal : activeQuote.price + 30 * pipVal;
                        setStopLoss(defaultSL.toFixed(ASSET_PROPERTIES[activeSymbol]?.digits || 5));
                      }}
                      className="text-[8px] text-amber-500 hover:underline"
                    >
                      Default SL
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="None (No Stop Loss)"
                    className="w-full bg-gray-950 border border-gray-900 rounded-lg px-2.5 py-1.5 text-xs text-center font-bold font-mono text-red-400 focus:outline-none focus:border-red-500/50"
                    value={stopLoss}
                    onChange={(e) => setStopLoss(e.target.value)}
                  />
                  {/* SL Quick Pips Config */}
                  <div className="grid grid-cols-4 gap-1 pt-0.5 text-[8px] font-mono">
                    {([10, 20, 30, 50] as const).map((pips) => (
                      <button
                        key={pips}
                        type="button"
                        onClick={() => {
                          const pipVal = getPipSize(activeSymbol);
                          const currentPrice = activeQuote.price;
                          const newSL = direction === 'buy' ? currentPrice - pips * pipVal : currentPrice + pips * pipVal;
                          setStopLoss(newSL.toFixed(ASSET_PROPERTIES[activeSymbol]?.digits || 5));
                        }}
                        className="bg-gray-950 text-gray-400 hover:text-white py-0.5 rounded cursor-pointer border border-gray-900"
                      >
                        -{pips} Pips
                      </button>
                    ))}
                  </div>
                </div>

                {/* TP Field */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] font-mono text-gray-400">
                    <span className="text-emerald-400 font-bold">TAKE PROFIT (TP)</span>
                    <button 
                      type="button"
                      onClick={() => {
                        const pipVal = getPipSize(activeSymbol);
                        const defaultTP = direction === 'buy' ? activeQuote.price + 60 * pipVal : activeQuote.price - 60 * pipVal;
                        setTakeProfit(defaultTP.toFixed(ASSET_PROPERTIES[activeSymbol]?.digits || 5));
                      }}
                      className="text-[8px] text-amber-500 hover:underline"
                    >
                      Default TP
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="None (No Take Profit)"
                    className="w-full bg-gray-950 border border-gray-900 rounded-lg px-2.5 py-1.5 text-xs text-center font-bold font-mono text-emerald-400 focus:outline-none focus:border-emerald-500/50"
                    value={takeProfit}
                    onChange={(e) => setTakeProfit(e.target.value)}
                  />
                  {/* TP Quick Pips Config */}
                  <div className="grid grid-cols-4 gap-1 pt-0.5 text-[8px] font-mono">
                    {([20, 40, 60, 100] as const).map((pips) => (
                      <button
                        key={pips}
                        type="button"
                        onClick={() => {
                          const pipVal = getPipSize(activeSymbol);
                          const currentPrice = activeQuote.price;
                          const newTP = direction === 'buy' ? currentPrice + pips * pipVal : currentPrice - pips * pipVal;
                          setTakeProfit(newTP.toFixed(ASSET_PROPERTIES[activeSymbol]?.digits || 5));
                        }}
                        className="bg-gray-950 text-gray-400 hover:text-white py-0.5 rounded cursor-pointer border border-gray-900"
                      >
                        +{pips} Pips
                      </button>
                    ))}
                  </div>
                </div>

                {/* Limit/Stop Trigger Price Field */}
                {orderType !== 'market' && (
                  <div className="space-y-1 bg-amber-500/5 p-2 rounded-lg border border-amber-500/10">
                    <span className="text-[9px] text-amber-400 font-mono uppercase tracking-wider block font-bold">
                      {orderType.toUpperCase()} TRIGGER PRICE
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 1.08500"
                      className="w-full bg-gray-950 border border-gray-900 rounded-lg px-2.5 py-1.5 text-xs text-center font-bold font-mono text-white focus:outline-none focus:border-amber-500/50"
                      value={triggerPrice}
                      onChange={(e) => setTriggerPrice(e.target.value)}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Actions - Exness-style direct execution or selector */}
            <div className="pt-3 border-t border-gray-900 space-y-3">
              {/* One-Click Trading Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <span className="text-[9px] font-mono text-gray-500 uppercase tracking-wider">
                    One-Click Execution
                  </span>
                  <span className="text-[8px] bg-amber-500/15 text-amber-500 font-mono px-1 rounded font-bold uppercase">
                    Exness mode
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setOneClickTrading(!oneClickTrading)}
                  className={`w-8 h-4 rounded-full p-0.5 transition-colors cursor-pointer ${oneClickTrading ? 'bg-amber-500' : 'bg-gray-800'}`}
                >
                  <div className={`w-3 h-3 rounded-full bg-black transition-transform ${oneClickTrading ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>

              {oneClickTrading ? (
                /* DIRECT ONE-CLICK BUY/SELL EXECUTION BUTTONS (Exness Style!) */
                <div className="grid grid-cols-2 gap-2 pb-1.5">
                  <button
                    type="button"
                    onClick={() => handleDirectOneClickTrade('sell')}
                    className="bg-red-500 hover:bg-red-600 active:scale-[0.97] text-white py-3 px-1.5 rounded-xl flex flex-col items-center justify-center font-mono cursor-pointer transition-all shadow-lg shadow-red-500/10"
                  >
                    <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1">
                      <TrendingDown className="w-3.5 h-3.5" /> SELL
                    </span>
                    <span className="text-[10px] font-bold mt-0.5">
                      {(activeQuote.price - (ASSET_PROPERTIES[activeSymbol]?.spread || 0) / 2).toFixed(ASSET_PROPERTIES[activeSymbol]?.digits || 2)}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDirectOneClickTrade('buy')}
                    className="bg-emerald-500 hover:bg-emerald-600 active:scale-[0.97] text-black py-3 px-1.5 rounded-xl flex flex-col items-center justify-center font-mono cursor-pointer transition-all shadow-lg shadow-emerald-500/10"
                  >
                    <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5" /> BUY
                    </span>
                    <span className="text-[10px] font-bold mt-0.5">
                      {(activeQuote.price + (ASSET_PROPERTIES[activeSymbol]?.spread || 0) / 2).toFixed(ASSET_PROPERTIES[activeSymbol]?.digits || 2)}
                    </span>
                  </button>
                </div>
              ) : (
                /* TWO-STEP FORM SUBMISSION (Confirm Buy/Sell Button) */
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-1.5 p-0.5 bg-gray-950 rounded-lg border border-gray-900 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setDirection('sell')}
                      className={`py-1.5 rounded uppercase font-bold transition-colors ${direction === 'sell' ? 'bg-red-500 text-white' : 'text-gray-500 hover:text-white'}`}
                    >
                      Sell Mode
                    </button>
                    <button
                      type="button"
                      onClick={() => setDirection('buy')}
                      className={`py-1.5 rounded uppercase font-bold transition-colors ${direction === 'buy' ? 'bg-emerald-500 text-black' : 'text-gray-500 hover:text-white'}`}
                    >
                      Buy Mode
                    </button>
                  </div>
                  
                  <button
                    type="button"
                    onClick={handleExecuteTrade}
                    className={`w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider cursor-pointer shadow-lg transition-all active:scale-[0.98] ${
                      direction === 'buy' 
                        ? 'bg-emerald-500 text-black hover:opacity-95 shadow-emerald-500/10' 
                        : 'bg-red-500 text-white hover:opacity-95 shadow-red-500/10'
                    }`}
                  >
                    Confirm {orderType} {direction.toUpperCase()} Order
                  </button>
                </div>
              )}

              {/* Spread and Specification Details footer */}
              <div className="bg-[#05070B] border border-gray-950 p-2.5 rounded-lg text-[9px] font-mono space-y-1">
                <div className="flex justify-between text-gray-500">
                  <span>Market Spread:</span>
                  <span className="text-gray-300 font-bold">
                    {((ASSET_PROPERTIES[activeSymbol]?.spread || 0) / getPipSize(activeSymbol)).toFixed(1)} Pips
                  </span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Est. Pip Value (1L):</span>
                  <span className="text-gray-300 font-bold">
                    {(getPipSize(activeSymbol) * 1.0 * (ASSET_PROPERTIES[activeSymbol]?.lotSizeMultiplier || 100000)).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* INSTANT CONFIRMATION NOTIFICATION SLIDEOVER BAR (EXNESS FEEL!) */}
          {executionNotification && (
            <div className="absolute top-2 left-2 right-2 bg-gradient-to-r from-amber-500 to-yellow-600 text-black rounded-xl p-3 shadow-2xl border border-amber-400 flex gap-2 items-start justify-between z-50 animate-in slide-in-from-top-4 duration-300">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-wider">Trade Success</p>
                <p className="text-[10px] font-bold leading-tight mt-0.5 text-black/95">
                  {executionNotification}
                </p>
              </div>
              <button 
                onClick={() => setExecutionNotification(null)}
                className="p-1 hover:bg-black/10 rounded-lg text-black cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* RULE WARNING POPUP MODAL */}
          {latestViolation && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
              <div className="bg-[#0A0E17] border border-amber-500/30 rounded-2xl max-w-md w-full p-6 text-center space-y-6 shadow-2xl shadow-amber-950/20 relative">
                <div className="mx-auto w-16 h-16 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center text-amber-500 animate-pulse">
                  <AlertTriangle className="w-8 h-8 text-amber-400" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-white uppercase tracking-wider flex items-center justify-center gap-2">
                    ⚠️ Rule Warning
                  </h3>
                  <div className="bg-amber-500/10 text-amber-300 p-4 rounded-xl border border-amber-500/20 text-xs leading-relaxed font-sans text-center">
                    <strong>
                      {latestViolation.violatedRule === 'Daily Drawdown Rule' 
                        ? 'You have violated the Daily Drawdown Rule.' 
                        : latestViolation.violatedRule === 'Maximum Drawdown Limit' 
                        ? 'You have exceeded the Maximum Drawdown Limit.' 
                        : latestViolation.violatedRule.includes('Consistency')
                        ? 'You have exceeded the 30% Consistency Rule.' 
                        : `You have violated the ${latestViolation.violatedRule}.`}
                    </strong>
                    <p className="mt-3 text-gray-300 text-[11px]">
                      Please avoid repeating this violation. The ATFunding Admin Team will review your account. Continued violations may result in manual account breach.
                    </p>
                  </div>
                </div>

                <div className="bg-[#111622] p-4 rounded-xl border border-gray-800 text-xs text-left space-y-2 font-mono">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Account ID:</span>
                    <span className="text-white font-semibold">{latestViolation.accountId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Date & Time:</span>
                    <span className="text-white">{latestViolation.date} {latestViolation.time}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Current Balance:</span>
                    <span className="text-white font-semibold">${latestViolation.currentBalance?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Current Equity:</span>
                    <span className="text-white font-semibold">${latestViolation.currentEquity?.toLocaleString()}</span>
                  </div>
                  {latestViolation.tradeId && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Trade ID:</span>
                      <span className="text-amber-400 font-semibold">{latestViolation.tradeId}</span>
                    </div>
                  )}
                  {latestViolation.symbol && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Symbol:</span>
                      <span className="text-white">{latestViolation.symbol}</span>
                    </div>
                  )}
                  {latestViolation.drawdown > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Violation Value / Profit:</span>
                      <span className="text-red-400 font-bold">
                        {latestViolation.violatedRule === 'Consistency Rule' 
                          ? `${latestViolation.drawdown.toFixed(1)}%` 
                          : `$${latestViolation.drawdown.toLocaleString()}`}
                      </span>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleAcknowledgeViolation}
                  className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 hover:opacity-90 text-black py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all cursor-pointer shadow-lg shadow-amber-500/20"
                >
                  I Understand & Continue Trading
                </button>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
