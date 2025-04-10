// app/services/StockService.ts

import config from '../config';

// ——————————————————————————————————————————————————————————
// API keys & endpoints (from your config.ts)
// ——————————————————————————————————————————————————————————
const FINNHUB_KEY = config.finnhubApiKey;
const FINNHUB_URL = 'https://finnhub.io/api/v1';

const AV_KEY = config.alphaVantageApiKey;
const AV_URL = 'https://www.alphavantage.co/query';

// ——————————————————————————————————————————————————————————
// Types
// ——————————————————————————————————————————————————————————
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

// ——————————————————————————————————————————————————————————
// Helpers
// ——————————————————————————————————————————————————————————
const formatDate = (d: Date) => d.toISOString().split('T')[0];
const nowTs = Math.floor(Date.now() / 1000);
const thirtyDaysAgoTs = nowTs - 30 * 24 * 60 * 60;

// ——————————————————————————————————————————————————————————
// 1) fetchStockData: try Finnhub, fall back to AlphaVantage
// ——————————————————————————————————————————————————————————
export const fetchStockData = async (
  symbol: string
): Promise<StockDataPoint[]> => {
  // Finnhub candle URL
  const fhUrl =
    `${FINNHUB_URL}/stock/candle?symbol=${symbol}` +
    `&resolution=D&from=${thirtyDaysAgoTs}&to=${nowTs}` +
    `&token=${FINNHUB_KEY}`;

  try {
    const res = await fetch(fhUrl);
    if (!res.ok) {
      console.warn(`Finnhub /candle ${symbol} failed (${res.status}), falling back…`);
      throw new Error(`FH ${res.status}`);
    }
    const data = await res.json();
    if (data.s !== 'ok' || !Array.isArray(data.c) || data.c.length === 0) {
      console.warn(`Finnhub returned no data for ${symbol}, falling back…`);
      throw new Error('FH no_data');
    }
    // Map to StockDataPoint[]
    const fhPoints: StockDataPoint[] = data.t.map(
      (ts: number, idx: number) => ({
        date: formatDate(new Date(ts * 1000)),
        value: data.c[idx],
      })
    );
    return fhPoints.reverse();
  } catch (fhErr) {
    // AlphaVantage fallback
    console.warn(`Using AlphaVantage fallback for ${symbol}:`, fhErr);

    const avUrl =
      `${AV_URL}?function=TIME_SERIES_DAILY` +
      `&symbol=${symbol}` +
      `&outputsize=compact` +
      `&apikey=${AV_KEY}`;

    const avRes = await fetch(avUrl);
    if (!avRes.ok) {
      throw new Error(
        `AlphaVantage fetch failed: ${avRes.status} ${avRes.statusText}`
      );
    }
    const avJson = await avRes.json();
    const series = avJson['Time Series (Daily)'];
    if (!series) {
      throw new Error('AlphaVantage returned no time series');
    }
    // Grab newest 30 days
    const dates = Object.keys(series)
      .sort((a, b) => (a < b ? 1 : -1)) // descending
      .slice(0, 30);

    return dates.map(dateStr => ({
      date: dateStr,
      value: parseFloat(series[dateStr]['4. close']),
    }));
  }
};

// ——————————————————————————————————————————————————————————
// 2) fetchMultipleStocks: real‑time quotes from Finnhub
// ——————————————————————————————————————————————————————————
export const fetchMultipleStocks = async (
  symbols: string[]
): Promise<StockQuote[]> => {
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
      } catch (err: any) {
        console.warn(`Error fetching quote for ${symbol}:`, err);
        return {
          symbol,
          price: 0,
          change: 0,
          percentChange: 0,
          error: err.message || 'Fetch error',
        };
      }
    })
  );
  return results;
};

// ——————————————————————————————————————————————————————————
// 3) searchStocks (unchanged)
// ——————————————————————————————————————————————————————————
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
