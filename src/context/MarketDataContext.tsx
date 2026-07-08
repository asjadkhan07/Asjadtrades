import React, { createContext, useContext, useMemo } from 'react';
import { MarketQuote } from '../types';
import { ASSET_PROPERTIES } from '../data';

export interface MarketPriceInfo {
  price: number;
  bid: number;
  ask: number;
  high: number;
  low: number;
  change: number;
  prevPrice: number;
  digits: number;
  spread: number;
  contractSize: number;
}

interface MarketDataContextType {
  quotes: MarketQuote[];
  getMarketPrice: (symbol: string) => MarketPriceInfo;
}

const MarketDataContext = createContext<MarketDataContextType | null>(null);

export const MarketDataProvider: React.FC<{
  quotes: MarketQuote[];
  children: React.ReactNode;
}> = ({ quotes, children }) => {
  const priceMap = useMemo(() => {
    const map: Record<string, MarketPriceInfo> = {};
    quotes.forEach((q) => {
      const normalizedSymbol = q.symbol.toUpperCase().replace('/', '');
      const props = ASSET_PROPERTIES[q.symbol] || ASSET_PROPERTIES[normalizedSymbol] || {
        spread: 0,
        digits: 5,
        contractSize: 100000,
        decimals: 5
      };
      
      const spread = props.spread || 0;
      const digits = props.digits !== undefined ? props.digits : (props.decimals !== undefined ? props.decimals : 5);
      const contractSize = props.contractSize || 100000;

      const bid = q.price - spread / 2;
      const ask = q.price + spread / 2;

      map[q.symbol.toUpperCase()] = {
        price: q.price,
        bid,
        ask,
        high: q.high || q.price,
        low: q.low || q.price,
        change: q.change || 0,
        prevPrice: q.prevPrice || q.price,
        digits,
        spread,
        contractSize,
      };
      
      // Also index by normalized key without slashes
      map[normalizedSymbol] = map[q.symbol.toUpperCase()];
    });
    return map;
  }, [quotes]);

  const getMarketPrice = (symbol: string): MarketPriceInfo => {
    const key = symbol.toUpperCase().replace('/', '');
    const found = priceMap[symbol.toUpperCase()] || priceMap[key];
    if (found) return found;

    // Fallback defaults for safety
    return {
      price: 1.0,
      bid: 1.0,
      ask: 1.0,
      high: 1.0,
      low: 1.0,
      change: 0,
      prevPrice: 1.0,
      digits: 5,
      spread: 0,
      contractSize: 100000,
    };
  };

  return (
    <MarketDataContext.Provider value={{ quotes, getMarketPrice }}>
      {children}
    </MarketDataContext.Provider>
  );
};

export const useMarketDataContext = () => {
  const context = useContext(MarketDataContext);
  if (!context) {
    throw new Error('useMarketDataContext must be used within a MarketDataProvider');
  }
  return context;
};

export const useMarketPrice = (symbol: string) => {
  const { getMarketPrice } = useMarketDataContext();
  return getMarketPrice(symbol);
};
