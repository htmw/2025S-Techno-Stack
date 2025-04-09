// app/services/StockService.ts

import config from '../config';

// --- Constants & Types ---
const FINNHUB_KEY = config.finnhubApiKey;
const FINNHUB_URL = 'https://finnhub.io/api/v1';

export interface StockDataPoint {
  date: string;
  value: number;
}

export interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  percentChange: number;
  error?: string;
}

export interface SearchResult {
  symbol: string;
  name: string;
  type: string;
  region: string;
}

// --- Helpers ---
const formatDate = (date: Date): string =>
  date.toISOString().split('T')[0];

// Timestamps for the last 30 days
const nowTs = Math.floor(Date.now() / 1000);
const thirtyDaysAgoTs = nowTs - 30 * 24 * 60 * 60;

// --- fetchStockData (no more random fallback) ---
export const fetchStockData = async (
  symbol: string
): Promise<StockDataPoint[]> => {
  const url = `${FINNHUB_URL}/stock/candle`
    + `?symbol=${symbol}`
    + `&resolution=D&from=${thirtyDaysAgoTs}&to=${nowTs}`
    + `&token=${FINNHUB_KEY}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(
      `Failed to fetch ${symbol} historical data: ${res.status} ${res.statusText}`
    );
  }

  const data = await res.json();
  if (data.s !== 'ok' || !Array.isArray(data.c) || data.c.length === 0) {
    throw new Error(`No historical data available for ${symbol}`);
  }

  // Map timestamps → StockDataPoint[]
  const points: StockDataPoint[] = data.t.map(
    (ts: number, idx: number) => ({
      date: formatDate(new Date(ts * 1000)),
      value: data.c[idx],
    })
  );

  // Return newest‑first
  return points.reverse();
};

// --- fetchMultipleStocks (real‑time quotes) ---
export const fetchMultipleStocks = async (
  symbols: string[]
): Promise<StockQuote[]> => {
  // One request per symbol
  const results = await Promise.all(
    symbols.map(async (symbol) => {
      try {
        const res = await fetch(
          `${FINNHUB_URL}/quote?symbol=${symbol}&token=${FINNHUB_KEY}`
        );
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const d = await res.json();
        return {
          symbol,
          price: d.c,
          change: d.d,
          percentChange: d.dp,
        } as StockQuote;
      } catch {
        // propagate error flag so DataService can fallback if desired
        return { symbol, price: 0, change: 0, percentChange: 0, error: 'Fetch error' };
      }
    })
  );
  return results;
};

// --- searchStocks (unchanged) ---
export const searchStocks = async (
  query: string
): Promise<SearchResult[]> => {
  if (!query.trim()) return [];
  const url = `${FINNHUB_URL}/search?q=${encodeURIComponent(
    query
  )}&token=${FINNHUB_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Search failed: ${res.status}`);
  const data = await res.json();
  if (!data.result || data.result.length === 0) return [];

  return data.result
    .filter((item: any) => item.type === 'Common Stock')
    .map((item: any) => ({
      symbol: item.symbol,
      name: item.description,
      type: item.type,
      region: item.displaySymbol.includes('.')
        ? item.displaySymbol.split('.')[1]
        : 'US',
    }))
    .slice(0, 10);
};
