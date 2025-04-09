// services/stockApiService.ts
import axios from 'axios';
import * as https from 'https';
import { query } from '../lib/db';

interface StockData {
  symbol: string;
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface StockMeta {
  symbol: string;
  name: string;
  sector?: string;
}

// Create a new instance of Axios with longer timeout
const yahooFinanceApi = axios.create({
  timeout: 10000, // 10 seconds
  httpsAgent: new https.Agent({ keepAlive: true }),
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  }
});

// Using Yahoo Finance API to fetch historical data
export async function fetchHistoricalData(symbol: string, days: number = 30): Promise<StockData[]> {
  try {
    // Get the current date and the date from 'days' ago
    const end = Math.floor(Date.now() / 1000);
    const start = end - (days * 24 * 60 * 60);
    
    // Yahoo Finance URL for historical data
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${start}&period2=${end}&interval=1d`;
    
    const response = await yahooFinanceApi.get(url);
    
    if (!response.data.chart.result || response.data.chart.result.length === 0) {
      throw new Error(`No data returned for symbol ${symbol}`);
    }
    
    const result = response.data.chart.result[0];
    const timestamps = result.timestamp;
    const quotes = result.indicators.quote[0];
    
    const stockData: StockData[] = [];
    
    for (let i = 0; i < timestamps.length; i++) {
      const timestamp = timestamps[i] * 1000; // Convert to milliseconds
      
      // Some days might have null values, skip those
      if (quotes.open[i] !== null && quotes.close[i] !== null) {
        stockData.push({
          symbol,
          date: new Date(timestamp),
          open: quotes.open[i],
          high: quotes.high[i],
          low: quotes.low[i],
          close: quotes.close[i],
          volume: quotes.volume[i]
        });
      }
    }
    
    return stockData;
  } catch (error) {
    console.error(`Error fetching data for ${symbol}:`, error);
    throw new Error(`Failed to fetch historical data for ${symbol}`);
  }
}

// Fetch company info
export async function fetchStockInfo(symbol: string): Promise<StockMeta> {
  try {
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbol}`;
    
    const response = await yahooFinanceApi.get(url);
    
    if (!response.data.quoteResponse.result || response.data.quoteResponse.result.length === 0) {
      throw new Error(`No data returned for symbol ${symbol}`);
    }
    
    const stockInfo = response.data.quoteResponse.result[0];
    
    return {
      symbol,
      name: stockInfo.longName || stockInfo.shortName,
      sector: stockInfo.sector
    };
  } catch (error) {
    console.error(`Error fetching info for ${symbol}:`, error);
    throw new Error(`Failed to fetch stock info for ${symbol}`);
  }
}

// Save historical data to the database
export async function saveHistoricalData(stockData: StockData[]): Promise<void> {
  try {
    // Use a transaction to ensure all or none of the data is saved
    const insertQuery = `
      INSERT INTO historical_data (symbol, date, open, high, low, close, volume)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (symbol, date) DO UPDATE SET
        open = EXCLUDED.open,
        high = EXCLUDED.high,
        low = EXCLUDED.low,
        close = EXCLUDED.close,
        volume = EXCLUDED.volume,
        updated_at = CURRENT_TIMESTAMP
    `;
    
    for (const data of stockData) {
      await query(insertQuery, [
        data.symbol,
        data.date,
        data.open,
        data.high,
        data.low,
        data.close,
        data.volume
      ]);
    }
    
    // Update last_fetch in stock_meta
    await query(
      'UPDATE stock_meta SET last_fetch = CURRENT_TIMESTAMP WHERE symbol = $1',
      [stockData[0]?.symbol]
    );
  } catch (error) {
    console.error('Error saving historical data:', error);
    throw error;
  }
}

// Save stock metadata
export async function saveStockMeta(stockMeta: StockMeta): Promise<void> {
  try {
    const insertQuery = `
      INSERT INTO stock_meta (symbol, name, sector)
      VALUES ($1, $2, $3)
      ON CONFLICT (symbol) DO UPDATE SET
        name = EXCLUDED.name,
        sector = EXCLUDED.sector,
        updated_at = CURRENT_TIMESTAMP
    `;
    
    await query(insertQuery, [
      stockMeta.symbol,
      stockMeta.name,
      stockMeta.sector
    ]);
  } catch (error) {
    console.error('Error saving stock metadata:', error);
    throw error;
  }
}

// Fetch and update data for multiple stocks
export async function fetchAndUpdateStockData(symbols: string[]): Promise<void> {
  for (const symbol of symbols) {
    try {
      // Check if we've already fetched data for this symbol recently
      const metaResult = await query(
        'SELECT last_fetch FROM stock_meta WHERE symbol = $1',
        [symbol]
      );
      
      const lastFetch = metaResult.rows[0]?.last_fetch;
      const now = new Date();
      
      // If we have fetched within the last day, skip
      if (lastFetch && (now.getTime() - new Date(lastFetch).getTime()) < 24 * 60 * 60 * 1000) {
        console.log(`Skipping ${symbol}, data is recent`);
        continue;
      }
      
      // 1. Fetch stock information
      const stockInfo = await fetchStockInfo(symbol);
      await saveStockMeta(stockInfo);
      
      // 2. Fetch historical data
      const historicalData = await fetchHistoricalData(symbol, 30);
      await saveHistoricalData(historicalData);
      
      console.log(`Successfully updated data for ${symbol}`);
    } catch (error) {
      console.error(`Failed to update data for ${symbol}:`, error);
      // Continue with the next symbol
    }
  }
}

// Retrieve historical data from the database
export async function getHistoricalData(symbol: string, days: number = 30): Promise<StockData[]> {
  try {
    const result = await query(
      `SELECT * FROM historical_data
       WHERE symbol = $1
       AND date >= CURRENT_DATE - INTERVAL '${days} days'
       ORDER BY date ASC`,
      [symbol]
    );
    
    return result.rows.map(row => ({
      symbol: row.symbol,
      date: new Date(row.date),
      open: parseFloat(row.open),
      high: parseFloat(row.high),
      low: parseFloat(row.low),
      close: parseFloat(row.close),
      volume: parseInt(row.volume)
    }));
  } catch (error) {
    console.error(`Error retrieving historical data for ${symbol}:`, error);
    throw error;
  }
}

// The list of stocks to track based on the user story requirements
export const TRACKED_STOCKS = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'NVDA'];