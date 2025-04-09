// app/services/StockService.ts
// Stock service using Finnhub API with fallback data

import config from '../config';

// API key
const FINNHUB_KEY = config.finnhubApiKey;

// Base URL
const FINNHUB_URL = 'https://finnhub.io/api/v1';

// Types
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

// Helper function to format date
const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// Get today's date and a date from 30 days ago
const today = new Date();
const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(today.getDate() - 30);

// Get Unix timestamps
const toTimestamp = Math.floor(today.getTime() / 1000);
const fromTimestamp = Math.floor(thirtyDaysAgo.getTime() / 1000);

// Generate fallback data for a stock
const generateFallbackStockData = (symbol: string): StockDataPoint[] => {
  const data: StockDataPoint[] = [];
  const baseValue = Math.random() * 500 + 50; // Random base value between 50 and 550
  
  // Generate 30 days of data
  for (let i = 0; i < 30; i++) {
    const date = new Date(thirtyDaysAgo);
    date.setDate(date.getDate() + i);
    
    // Generate a somewhat realistic price with some volatility
    const volatility = 0.02; // 2% daily volatility
    const randomChange = (Math.random() * 2 - 1) * volatility;
    const trendFactor = 0.0005; // Slight upward trend
    const value = baseValue * (1 + randomChange + (i * trendFactor));
    
    data.push({
      date: formatDate(date),
      value: parseFloat(value.toFixed(2))
    });
  }
  
  // Sort by date (newest first)
  return data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

// Fallback data for multiple stocks
const generateFallbackQuotes = (symbols: string[]): StockQuote[] => {
  return symbols.map(symbol => {
    const price = Math.random() * 500 + 50;
    const change = (Math.random() * 10) - 5; // Between -5 and 5
    const percentChange = (change / price) * 100;
    
    return {
      symbol,
      price: parseFloat(price.toFixed(2)),
      change: parseFloat(change.toFixed(2)),
      percentChange: parseFloat(percentChange.toFixed(2))
    };
  });
};

// Default search results as fallback
const defaultSearchResults: SearchResult[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', type: 'Common Stock', region: 'United States' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', type: 'Common Stock', region: 'United States' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', type: 'Common Stock', region: 'United States' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', type: 'Common Stock', region: 'United States' },
  { symbol: 'META', name: 'Meta Platforms, Inc.', type: 'Common Stock', region: 'United States' },
  { symbol: 'TSLA', name: 'Tesla, Inc.', type: 'Common Stock', region: 'United States' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', type: 'Common Stock', region: 'United States' },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', type: 'Common Stock', region: 'United States' },
  { symbol: 'V', name: 'Visa Inc.', type: 'Common Stock', region: 'United States' },
  { symbol: 'WMT', name: 'Walmart Inc.', type: 'Common Stock', region: 'United States' }
];

// Fetch stock data for a single symbol
export const fetchStockData = async (symbol: string): Promise<StockDataPoint[]> => {
  try {
    console.log(`Fetching stock data for ${symbol} from Finnhub...`);
    
    const response = await fetch(
      `${FINNHUB_URL}/stock/candle?symbol=${symbol}&resolution=D&from=${fromTimestamp}&to=${toTimestamp}&token=${FINNHUB_KEY}`
    );
    
    if (!response.ok) {
      console.warn(`Finnhub API returned status ${response.status} for ${symbol}`);
      throw new Error('Network response was not ok');
    }
    
    const data = await response.json();
    
    // Check if we have the expected data structure
    if (data.s === 'no_data' || !data.c || data.c.length === 0) {
      throw new Error('No data available for this symbol');
    }
    
    // Convert Finnhub data format to our app format
    const formattedData = data.t.map((timestamp: number, index: number) => ({
      date: formatDate(new Date(timestamp * 1000)),
      value: data.c[index] // Use closing price
    }));
    
    console.log(`Successfully fetched data for ${symbol}`);
    return formattedData.reverse(); // Newest first
    
  } catch (error) {
    console.error(`Error fetching stock data for ${symbol}:`, error);
    console.log('Using generated fallback data');
    return generateFallbackStockData(symbol);
  }
};

// Fetch data for multiple stocks
export const fetchMultipleStocks = async (symbols: string[]): Promise<StockQuote[]> => {
  try {
    console.log(`Fetching data for ${symbols.length} stocks from Finnhub...`);
    
    // Finnhub requires separate calls for each symbol
    const promises = symbols.map(symbol => 
      fetch(`${FINNHUB_URL}/quote?symbol=${symbol}&token=${FINNHUB_KEY}`)
        .then(response => response.json())
        .then(data => ({ symbol, data }))
        .catch(error => {
          console.warn(`Error fetching data for ${symbol}:`, error);
          return { symbol, error: true };
        })
    );
    
    const results = await Promise.all(promises);
    
    return results.map((result) => {
      const { symbol } = result;
      const data = 'data' in result ? result.data : undefined;
      const error = 'error' in result ? result.error : undefined;
      if (error || !data || data.c === 0) {
        // If there's an error for this specific stock, generate fallback data
        const fallback = generateFallbackQuotes([symbol])[0];
        return fallback;
      }
      
      return {
        symbol,
        price: data.c, // Current price
        change: data.d, // Change
        percentChange: data.dp // Percent change
      };
    });
    
  } catch (error) {
    console.error('Error fetching multiple stocks:', error);
    console.log('Using generated fallback data for all stocks');
    return generateFallbackQuotes(symbols);
  }
};

// Search for stocks
export const searchStocks = async (query: string): Promise<SearchResult[]> => {
  if (!query.trim()) {
    return [];
  }
  
  try {
    console.log(`Searching for "${query}" using Finnhub API...`);
    
    const response = await fetch(
      `${FINNHUB_URL}/search?q=${encodeURIComponent(query)}&token=${FINNHUB_KEY}`
    );
    
    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.result || data.result.length === 0) {
      console.log('No results found, using filtered default results');
      // Filter default results based on query
      const queryLower = query.toLowerCase();
      return defaultSearchResults.filter(result => 
        result.symbol.toLowerCase().includes(queryLower) || 
        result.name.toLowerCase().includes(queryLower)
      );
    }
    
    console.log(`Found ${data.result.length} results for "${query}"`);
    return data.result
      .filter((item: any) => item.type === 'Common Stock') // Only include stocks
      .map((item: any) => ({
        symbol: item.symbol,
        name: item.description,
        type: item.type,
        region: item.displaySymbol.includes('.') ? item.displaySymbol.split('.')[1] : 'US'
      }))
      .slice(0, 10); // Limit to 10 results
    
  } catch (error) {
    console.error('Error searching stocks:', error);
    console.log('Using default search results');
    
    // Filter default results based on query
    const queryLower = query.toLowerCase();
    return defaultSearchResults.filter(result => 
      result.symbol.toLowerCase().includes(queryLower) || 
      result.name.toLowerCase().includes(queryLower)
    );
  }
};