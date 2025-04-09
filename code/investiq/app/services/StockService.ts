// app/services/StockService.ts

import config from '../config';

// Get API key from config
const API_KEY = config.alphaVantageApiKey;

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

// Fetch historical stock data
export const fetchStockData = async (symbol: string): Promise<StockDataPoint[]> => {
  try {
    const response = await fetch(
      `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&outputsize=compact&apikey=${API_KEY}`
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
  } catch (error) {
    console.error('Error fetching stock data:', error);
    throw error;
  }
};

// Fetch multiple stock quotes
export const fetchMultipleStocks = async (symbols: string[]): Promise<StockQuote[]> => {
  try {
    const promises = symbols.map(symbol => 
      fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`)
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
  } catch (error) {
    console.error('Error fetching multiple stocks:', error);
    throw error;
  }
};

// Search for stocks
export const searchStocks = async (query: string): Promise<SearchResult[]> => {
  try {
    const response = await fetch(
      `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${query}&apikey=${API_KEY}`
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
  } catch (error) {
    console.error('Error searching stocks:', error);
    throw error;
  }
};