import { useState, useEffect } from 'react';
import { useMarketDataContext } from '../context/MarketDataContext';

// High-frequency real-time market data bridge hook
export function useMarketData(symbol: string) {
  const [currentMarketPrice, setCurrentMarketPrice] = useState<number>(0);
  const context = useMarketDataContext();

  useEffect(() => {
    if (!symbol) return;
    const cleanSym = symbol.toUpperCase().replace('/', '');
    let active = true;

    // Immediately resolve current price from context as baseline
    if (context && context.getMarketPrice) {
      const initialPrice = context.getMarketPrice(symbol)?.price || 0;
      if (initialPrice > 0) {
        setCurrentMarketPrice(initialPrice);
      }
    }

    const fetchPrice = async () => {
      try {
        // Query the live Twelve Data API Proxy with nocache=true to bypass standard caches for 100ms live ticks
        const res = await fetch(`/api/price?symbol=${encodeURIComponent(symbol)}&nocache=true`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.price && active) {
            const priceVal = parseFloat(data.price);
            if (!isNaN(priceVal) && priceVal > 0) {
              setCurrentMarketPrice(priceVal);
            }
          }
        }
      } catch (err) {
        // Fail silently
      }
    };

    fetchPrice();
    const interval = setInterval(fetchPrice, 100);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [symbol, context]);

  return currentMarketPrice;
}
