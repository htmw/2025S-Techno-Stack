// app/services/NewsService.ts

import config from '../config';

// Finnhub API key from your config
const FINNHUB_KEY = config.finnhubApiKey;
const FINNHUB_URL = 'https://finnhub.io/api/v1';

// News categories available in Finnhub:
// general, forex, crypto, merger
type NewsCategory = 'general' | 'forex' | 'crypto' | 'merger';

interface NewsItem {
  category: string;
  datetime: number;
  headline: string;
  id: number;
  image: string;
  related: string;
  source: string;
  summary: string;
  url: string;
}

// Cache for news data
const newsCache: {
  [category: string]: {
    data: NewsItem[];
    timestamp: number;
  }
} = {};

// Time in milliseconds (5 minutes) before data is considered stale
const CACHE_TTL = 5 * 60 * 1000;

/**
 * Fetches market news from Finnhub API
 * @param category News category
 * @returns Array of news items
 */
export const fetchMarketNews = async (category: NewsCategory = 'general'): Promise<NewsItem[]> => {
  const now = Date.now();
  
  // Check if we have cached data that's still fresh
  if (newsCache[category] && now - newsCache[category].timestamp < CACHE_TTL) {
    return newsCache[category].data;
  }
  
  // Otherwise fetch new data
  try {
    const response = await fetch(
      `${FINNHUB_URL}/news?category=${category}&token=${FINNHUB_KEY}`
    );
    
    if (!response.ok) {
      throw new Error(`News API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!Array.isArray(data)) {
      console.warn('Unexpected news data format:', data);
      return [];
    }
    
    // Cache the result
    newsCache[category] = {
      data,
      timestamp: now
    };
    
    return data;
  } catch (error) {
    console.error('Error fetching market news:', error);
    
    // If we have any cached data, return it even if it's stale
    if (newsCache[category]) {
      return newsCache[category].data;
    }
    
    return [];
  }
};

/**
 * Fetches company-specific news from Finnhub API
 * @param symbol Stock symbol
 * @param from Start date in format YYYY-MM-DD
 * @param to End date in format YYYY-MM-DD
 * @returns Array of news items
 */
export const fetchCompanyNews = async (
  symbol: string,
  from: string = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
  to: string = new Date().toISOString().split('T')[0] // today
): Promise<NewsItem[]> => {
  const cacheKey = `${symbol}-${from}-${to}`;
  const now = Date.now();
  
  // Check if we have cached data that's still fresh
  if (newsCache[cacheKey] && now - newsCache[cacheKey].timestamp < CACHE_TTL) {
    return newsCache[cacheKey].data;
  }
  
  // Otherwise fetch new data
  try {
    const response = await fetch(
      `${FINNHUB_URL}/company-news?symbol=${symbol}&from=${from}&to=${to}&token=${FINNHUB_KEY}`
    );
    
    if (!response.ok) {
      throw new Error(`Company news API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!Array.isArray(data)) {
      console.warn('Unexpected company news data format:', data);
      return [];
    }
    
    // Cache the result
    newsCache[cacheKey] = {
      data,
      timestamp: now
    };
    
    return data;
  } catch (error) {
    console.error(`Error fetching news for ${symbol}:`, error);
    
    // If we have any cached data, return it even if it's stale
    if (newsCache[cacheKey]) {
      return newsCache[cacheKey].data;
    }
    
    return [];
  }
};