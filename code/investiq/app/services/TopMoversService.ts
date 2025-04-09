// app/services/TopMoversService.ts

import config from '../config';

// Get API key from config
const API_KEY = config.alphaVantageApiKey;
const BASE_URL = 'https://www.alphavantage.co/query';

export interface StockMover {
  ticker: string;
  price: string;
  change_amount: string;
  change_percentage: string;
  volume: string;
}

export interface TopMoversResponse {
  metadata: string;
  last_updated: string;
  top_gainers: StockMover[];
  top_losers: StockMover[];
  most_actively_traded: StockMover[];
}

/**
 * Fetches the top gainers, losers, and most actively traded stocks
 */
export const fetchTopMovers = async (): Promise<TopMoversResponse> => {
  try {
    const response = await fetch(
      `${BASE_URL}?function=TOP_GAINERS_LOSERS&apikey=${API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    
    const data = await response.json();
    
    // Check if we have the expected data structure
    if (!data.top_gainers || !data.top_losers || !data.most_actively_traded) {
      throw new Error('Invalid data structure received from API');
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching top movers:', error);
    throw error;
  }
};

/**
 * Convert string representations of numbers in the StockMover object to actual numbers
 */
export const parseStockMover = (mover: StockMover) => {
  return {
    ticker: mover.ticker,
    price: parseFloat(mover.price),
    change_amount: parseFloat(mover.change_amount),
    change_percentage: parseFloat(mover.change_percentage.replace('%', '')),
    volume: parseInt(mover.volume.replace(/,/g, ''))
  };
};

/**
 * Fetches the top gainers
 */
export const fetchTopGainers = async (): Promise<StockMover[]> => {
  const response = await fetchTopMovers();
  return response.top_gainers;
};

/**
 * Fetches the top losers
 */
export const fetchTopLosers = async (): Promise<StockMover[]> => {
  const response = await fetchTopMovers();
  return response.top_losers;
};

/**
 * Fetches the most actively traded stocks
 */
export const fetchMostActive = async (): Promise<StockMover[]> => {
  const response = await fetchTopMovers();
  return response.most_actively_traded;
};

/**
 * Fetches a mix of top gainers, losers, and active stocks
 * @param count Total number of stocks to return
 */
export const fetchMixedTopMovers = async (count: number = 15): Promise<StockMover[]> => {
  const response = await fetchTopMovers();
  
  // Create a balanced mix of gainers, losers, and active stocks
  const gainers = response.top_gainers.slice(0, Math.ceil(count / 3));
  const losers = response.top_losers.slice(0, Math.floor(count / 3));
  const active = response.most_actively_traded.slice(0, Math.floor(count / 3));
  
  // Combine all three categories
  const combined = [...gainers, ...losers, ...active];
  
  // Shuffle the array for a random order
  const shuffled = combined.sort(() => 0.5 - Math.random());
  
  // Return the requested number of stocks
  return shuffled.slice(0, count);
};