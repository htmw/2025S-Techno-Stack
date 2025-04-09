import config from '../config';

// API keys
const ALPHA_VANTAGE_KEY = config.alphaVantageApiKey;
const POLYGON_KEY = config.polygonApiKey;

// Base URLs
const ALPHA_VANTAGE_URL = 'https://www.alphavantage.co/query';
const POLYGON_URL = 'https://api.polygon.io';

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

// Alpha Vantage implementations
const alphaVantage = {
  fetchStockData: async (symbol: string): Promise<StockDataPoint[]> => {
    const response = await fetch(
      `${ALPHA_VANTAGE_URL}?function=TIME_SERIES_DAILY&symbol=${symbol}&outputsize=compact&apikey=${ALPHA_VANTAGE_KEY}`
    );
    
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    
    const data = await response.json();
    
    // Check if we have the expected data structure
    if (data['Error Message']) {
      throw new Error(data['Error Message']);
    }

    if (!data['Time Series (Daily)']) {
      throw new Error('Invalid data structure received from API');
    }
    
    // Convert Alpha Vantage data format to our app format
    const timeSeriesData = data['Time Series (Daily)'];
    const formattedData = Object.keys(timeSeriesData).map(date => {
      return {
        date: date,
        value: parseFloat(timeSeriesData[date]['4. close'])
      };
    });
    
    // Sort data by date (newest first)
    formattedData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    return formattedData;
  },
  
  fetchMultipleStocks: async (symbols: string[]): Promise<StockQuote[]> => {
    const promises = symbols.map(symbol => 
      fetch(`${ALPHA_VANTAGE_URL}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_KEY}`)
        .then(response => response.json())
    );
    
    const results = await Promise.all(promises);
    
    return results.map((result, index) => {
      const quote = result['Global Quote'];
      if (!quote || !quote['05. price']) {
        return {
          symbol: symbols[index],
          price: 0,
          change: 0,
          percentChange: 0,
          error: 'Data not available'
        };
      }
      
      return {
        symbol: symbols[index],
        price: parseFloat(quote['05. price']),
        change: parseFloat(quote['09. change']),
        percentChange: parseFloat(quote['10. change percent'].replace('%', ''))
      };
    });
  },
  
  searchStocks: async (query: string): Promise<SearchResult[]> => {
    const response = await fetch(
      `${ALPHA_VANTAGE_URL}?function=SYMBOL_SEARCH&keywords=${query}&apikey=${ALPHA_VANTAGE_KEY}`
    );
    
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    
    const data = await response.json();
    
    if (!data.bestMatches) {
      return [];
    }
    
    return data.bestMatches.map((match: any) => ({
      symbol: match['1. symbol'],
      name: match['2. name'],
      type: match['3. type'],
      region: match['4. region']
    }));
  }
};

// Polygon.io implementations
const polygon = {
  fetchStockData: async (symbol: string): Promise<StockDataPoint[]> => {
    // Format dates for API call
    const toDate = formatDate(today);
    const fromDate = formatDate(thirtyDaysAgo);
    
    const response = await fetch(
      `${POLYGON_URL}/v2/aggs/ticker/${symbol}/range/1/day/${fromDate}/${toDate}?apiKey=${POLYGON_KEY}&sort=desc`
    );
    
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    
    const data = await response.json();
    
    // Check if we have the expected data structure
    if (data.status !== 'OK' || !data.results) {
      if (data.error) {
        throw new Error(data.error);
      }
      throw new Error('Invalid data structure received from API');
    }
    
    // Convert Polygon data format to our app format
    const formattedData = data.results.map((item: any) => ({
      date: new Date(item.t).toISOString().split('T')[0], // Convert timestamp to YYYY-MM-DD
      value: item.c // Use closing price
    }));
    
    return formattedData;
  },
  
  fetchMultipleStocks: async (symbols: string[]): Promise<StockQuote[]> => {
    // Polygon requires separate calls for each symbol in the free tier
    const promises = symbols.map(symbol => 
      fetch(`${POLYGON_URL}/v2/snapshot/locale/us/markets/stocks/tickers/${symbol}?apiKey=${POLYGON_KEY}`)
        .then(response => response.json())
    );
    
    const results = await Promise.all(promises);
    
    return results.map((result, index) => {
      if (result.status !== 'OK' || !result.ticker) {
        return {
          symbol: symbols[index],
          price: 0,
          change: 0,
          percentChange: 0,
          error: 'Data not available'
        };
      }
      
      const ticker = result.ticker;
      const dailyBar = ticker.day;
      const prevClose = ticker.prevDay?.c || 0;
      const currentPrice = dailyBar?.c || 0;
      const change = currentPrice - prevClose;
      const percentChange = prevClose !== 0 ? (change / prevClose) * 100 : 0;
      
      return {
        symbol: symbols[index],
        price: currentPrice,
        change: change,
        percentChange: percentChange
      };
    });
  },
  
  searchStocks: async (query: string): Promise<SearchResult[]> => {
    const response = await fetch(
      `${POLYGON_URL}/v3/reference/tickers?search=${encodeURIComponent(query)}&active=true&apiKey=${POLYGON_KEY}`
    );
    
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    
    const data = await response.json();
    
    if (data.status !== 'OK' || !data.results) {
      return [];
    }
    
    return data.results.map((result: any) => ({
      symbol: result.ticker,
      name: result.name,
      type: result.type || '',
      region: result.locale || ''
    })).slice(0, 10); // Limit to 10 results
  }
};

// Exported functions that try Alpha Vantage first, then fall back to Polygon
export const fetchStockData = async (symbol: string): Promise<StockDataPoint[]> => {
  try {
    console.log('Trying to fetch stock data from Alpha Vantage...');
    const data = await alphaVantage.fetchStockData(symbol);
    console.log('Successfully fetched data from Alpha Vantage');
    return data;
  } catch (error) {
    console.warn('Alpha Vantage fetch failed, falling back to Polygon:', error);
    try {
      const data = await polygon.fetchStockData(symbol);
      console.log('Successfully fetched data from Polygon');
      return data;
    } catch (fallbackError) {
      console.error('Both Alpha Vantage and Polygon failed:', fallbackError);
      throw new Error('Failed to fetch stock data from both providers');
    }
  }
};

export const fetchMultipleStocks = async (symbols: string[]): Promise<StockQuote[]> => {
  try {
    console.log('Trying to fetch multiple stocks from Alpha Vantage...');
    const data = await alphaVantage.fetchMultipleStocks(symbols);
    console.log('Successfully fetched multiple stocks from Alpha Vantage');
    return data;
  } catch (error) {
    console.warn('Alpha Vantage fetch failed, falling back to Polygon:', error);
    try {
      const data = await polygon.fetchMultipleStocks(symbols);
      console.log('Successfully fetched multiple stocks from Polygon');
      return data;
    } catch (fallbackError) {
      console.error('Both Alpha Vantage and Polygon failed:', fallbackError);
      throw new Error('Failed to fetch multiple stocks from both providers');
    }
  }
};

export const searchStocks = async (query: string): Promise<SearchResult[]> => {
  try {
    console.log('Trying to search stocks with Alpha Vantage...');
    const data = await alphaVantage.searchStocks(query);
    console.log('Successfully searched stocks with Alpha Vantage');
    return data;
  } catch (error) {
    console.warn('Alpha Vantage search failed, falling back to Polygon:', error);
    try {
      const data = await polygon.searchStocks(query);
      console.log('Successfully searched stocks with Polygon');
      return data;
    } catch (fallbackError) {
      console.error('Both Alpha Vantage and Polygon failed:', fallbackError);
      throw new Error('Failed to search stocks with both providers');
    }
  }
};