// app/services/DataService.ts
// A unified data service to ensure consistent data across the application

import { StockDataPoint, StockQuote, fetchStockData, fetchMultipleStocks } from './StockService';

// Cache to store fetched data
const dataCache: {
  stockData: Record<string, StockDataPoint[]>;
  quotes: Record<string, StockQuote>;
  lastUpdated: Record<string, number>;
  portfolioValue: number | null;
} = {
  stockData: {},
  quotes: {},
  lastUpdated: {},
  portfolioValue: null
};

// Default watchlist symbols used across the application
export const DEFAULT_WATCHLIST = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA'];

// Default portfolio holdings
export const DEFAULT_PORTFOLIO = [
  { symbol: "AAPL", name: "Apple Inc.", shares: 15, avgCost: 160.75 },
  { symbol: "MSFT", name: "Microsoft Corp.", shares: 10, avgCost: 380.25 },
  { symbol: "GOOGL", name: "Alphabet Inc.", shares: 8, avgCost: 125.50 },
  { symbol: "AMZN", name: "Amazon.com Inc.", shares: 12, avgCost: 150.80 },
  { symbol: "NVDA", name: "NVIDIA Corp.", shares: 5, avgCost: 780.40 },
  { symbol: "JPM", name: "JPMorgan Chase & Co.", shares: 6, avgCost: 160.25 }
];

// Time in milliseconds (5 minutes) before data is considered stale
const CACHE_TTL = 5 * 60 * 1000;

/**
 * Fetch stock data with caching
 */
export const getStockData = async (symbol: string): Promise<StockDataPoint[]> => {
  const now = Date.now();
  const lastUpdate = dataCache.lastUpdated[symbol] || 0;
  
  // Check if we have cached data that's still fresh
  if (dataCache.stockData[symbol] && now - lastUpdate < CACHE_TTL) {
    return dataCache.stockData[symbol];
  }
  
  // Otherwise fetch new data
  const data = await fetchStockData(symbol);
  
  // Cache the result
  dataCache.stockData[symbol] = data;
  dataCache.lastUpdated[symbol] = now;
  
  return data;
};

/**
 * Fetch multiple stock quotes with caching
 */
export const getStockQuotes = async (symbols: string[]): Promise<StockQuote[]> => {
  const now = Date.now();
  let needsFetch = false;
  
  // Check if any symbols are missing from cache or stale
  for (const symbol of symbols) {
    if (!dataCache.quotes[symbol] || now - (dataCache.lastUpdated[symbol] || 0) >= CACHE_TTL) {
      needsFetch = true;
      break;
    }
  }
  
  // Fetch all data if any symbol needs updating
  if (needsFetch) {
    const quotes = await fetchMultipleStocks(symbols);
    
    // Update cache
    quotes.forEach(quote => {
      dataCache.quotes[quote.symbol] = quote;
      dataCache.lastUpdated[quote.symbol] = now;
    });
  }
  
  // Return quotes from cache
  return symbols.map(symbol => dataCache.quotes[symbol]);
};

/**
 * Calculate and get the current portfolio value
 */
export const getPortfolioValue = async (): Promise<number> => {
  // If we have a cached value, return it
  if (dataCache.portfolioValue !== null) {
    return dataCache.portfolioValue;
  }
  
  // Get quotes for portfolio stocks
  const symbols = DEFAULT_PORTFOLIO.map(holding => holding.symbol);
  const quotes = await getStockQuotes(symbols);
  
  // Create a map for easier lookup
  const quoteMap: Record<string, StockQuote> = {};
  quotes.forEach(quote => {
    quoteMap[quote.symbol] = quote;
  });
  
  // Calculate total value
  let totalValue = 0;
  DEFAULT_PORTFOLIO.forEach(holding => {
    const quote = quoteMap[holding.symbol];
    if (quote) {
      totalValue += quote.price * holding.shares;
    }
  });
  
  // Cache the result
  dataCache.portfolioValue = totalValue;
  
  return totalValue;
};

/**
 * Get the current portfolio holdings with latest prices
 */
export const getPortfolioHoldings = async () => {
  // Get quotes for portfolio stocks
  const symbols = DEFAULT_PORTFOLIO.map(holding => holding.symbol);
  const quotes = await getStockQuotes(symbols);
  
  // Create a map for easier lookup
  const quoteMap: Record<string, StockQuote> = {};
  quotes.forEach(quote => {
    quoteMap[quote.symbol] = quote;
  });
  
  // Calculate portfolio details
  return DEFAULT_PORTFOLIO.map(holding => {
    const quote = quoteMap[holding.symbol];
    const currentPrice = quote ? quote.price : 0;
    const value = currentPrice * holding.shares;
    const gain = currentPrice - holding.avgCost;
    const gainTotal = gain * holding.shares;
    const gainPercent = (gain / holding.avgCost) * 100;
    
    return {
      ...holding,
      currentPrice,
      value,
      gain: gainTotal,
      gainPercent
    };
  });
};

/**
 * Get the portfolio value over time (simulated for now)
 */
export const getPortfolioHistory = async (timeRange: string = '1M') => {
  // In a real application, this would fetch historical data
  // For now, we'll generate synthetic data based on current portfolio value
  const currentValue = await getPortfolioValue();
  const baseValue = currentValue * 0.8; // Start at 80% of current value
  
  let dataPoints = 30; // Default to 1 month
  
  switch (timeRange) {
    case '1D':
      dataPoints = 24; // Hourly for 1 day
      break;
    case '1W':
      dataPoints = 7; // Daily for 1 week
      break;
    case '1M':
      dataPoints = 30; // Daily for 1 month
      break;
    case '3M':
      dataPoints = 90; // Daily for 3 months
      break;
    case '1Y':
      dataPoints = 12; // Monthly for 1 year
      break;
    case 'All':
      dataPoints = 24; // Monthly for 2 years
      break;
  }
  
  // Generate data points with a slight upward trend and some volatility
  const result = [];
  for (let i = 0; i < dataPoints; i++) {
    // Add some randomness and a general upward trend
    const progress = i / dataPoints;
    const randomFactor = (Math.random() * 0.04) - 0.02; // Random -2% to +2%
    const trendFactor = progress * 0.2; // Up to 20% increase over the period
    const value = baseValue * (1 + trendFactor + randomFactor);
    
    result.push({
      index: i,
      date: timeRange === '1D' ? `${i}h` : `${i}`,
      value: Math.round(value * 100) / 100
    });
  }
  
  return result;
};

/**
 * Clear the cache when needed (e.g., for testing or forced refresh)
 */
export const clearCache = () => {
  dataCache.stockData = {};
  dataCache.quotes = {};
  dataCache.lastUpdated = {};
  dataCache.portfolioValue = null;
};