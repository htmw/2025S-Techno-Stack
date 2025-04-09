// app/api/stocks/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getHistoricalData, fetchAndUpdateStockData, TRACKED_STOCKS } from '../../../services/stockApiService';

// Helper function to initialize the stock data
async function initializeStockData() {
  try {
    await fetchAndUpdateStockData(TRACKED_STOCKS);
    return true;
  } catch (error) {
    console.error('Failed to initialize stock data:', error);
    return false;
  }
}

// This will run when deployed to update the database
let initPromise: Promise<boolean> | null = null;

export async function GET(req: NextRequest) {
  // Parse query parameters
  const searchParams = req.nextUrl.searchParams;
  const symbol = searchParams.get('symbol');
  const days = parseInt(searchParams.get('days') || '30', 10);
  
  // Ensure stock data is initialized (only once)
  if (!initPromise) {
    initPromise = initializeStockData();
  }
  
  try {
    // Wait for initialization if it's in progress
    await initPromise;
    
    // If a specific symbol is requested
    if (symbol) {
      if (!TRACKED_STOCKS.includes(symbol)) {
        return NextResponse.json(
          { error: 'Symbol not supported' },
          { status: 400 }
        );
      }
      
      const data = await getHistoricalData(symbol, days);
      
      return NextResponse.json({ symbol, data });
    }
    
    // If no symbol is specified, return data for all tracked stocks
    const allData = {};
    
    for (const stock of TRACKED_STOCKS) {
      try {
        const data = await getHistoricalData(stock, days);
        allData[stock] = data;
      } catch (error) {
        console.error(`Error fetching data for ${stock}:`, error);
        allData[stock] = { error: 'Failed to fetch data' };
      }
    }
    
    return NextResponse.json(allData);
  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

// Admin route to force update stock data
export async function POST(req: NextRequest) {
  try {
    const { symbol } = await req.json();
    
    if (symbol && typeof symbol === 'string') {
      if (!TRACKED_STOCKS.includes(symbol)) {
        return NextResponse.json(
          { error: 'Symbol not supported' },
          { status: 400 }
        );
      }
      
      await fetchAndUpdateStockData([symbol]);
      return NextResponse.json({ success: true, message: `Updated data for ${symbol}` });
    }
    
    // Update all tracked stocks
    await fetchAndUpdateStockData(TRACKED_STOCKS);
    return NextResponse.json({ success: true, message: 'Updated data for all stocks' });
  } catch (error) {
    console.error('Error updating stock data:', error);
    return NextResponse.json(
      { error: 'Failed to update stock data' },
      { status: 500 }
    );
  }
}