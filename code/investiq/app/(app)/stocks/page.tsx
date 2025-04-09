'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  ArrowDown, 
  ArrowUp, 
  RefreshCw,
  Filter,
  AlertCircle
} from "lucide-react";
import StockChart from '../../StockChart';
import { 
  fetchStockData, 
  fetchMultipleStocks, 
  searchStocks,
  StockDataPoint,
  StockQuote,
  SearchResult
} from '../../services/StockService';

export default function StocksPage() {
  const [activeSymbol, setActiveSymbol] = useState('AAPL');
  const [stockData, setStockData] = useState<StockDataPoint[] | null>(null);
  const [watchlist, setWatchlist] = useState<StockQuote[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Default watchlist symbols
  const defaultWatchlist = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA'];

  // Fetch stock data for active symbol
  useEffect(() => {
    const getStockData = async () => {
      if (!activeSymbol) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const data = await fetchStockData(activeSymbol);
        setStockData(data);
      } catch (err) {
        console.error('Error fetching stock data:', err);
        setError('Failed to load stock data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    getStockData();
  }, [activeSymbol]);

  // Fetch watchlist data
  useEffect(() => {
    const getWatchlistData = async () => {
      try {
        const data = await fetchMultipleStocks(defaultWatchlist);
        setWatchlist(data);
      } catch (err) {
        console.error('Error fetching watchlist data:', err);
      }
    };
    
    getWatchlistData();
  }, []);

  // Handle search
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    
    try {
      const results = await searchStocks(searchQuery);
      setSearchResults(results);
      setShowSearchResults(true);
    } catch (err) {
      console.error('Error searching stocks:', err);
    }
  };

  // Handle search input change
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (e.target.value.trim() === '') {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };

  // Handle search form submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch();
  };

  // Select a stock from search results
  const selectStock = (symbol: string) => {
    setActiveSymbol(symbol);
    setSearchQuery('');
    setShowSearchResults(false);
  };

  return (
    <div className="p-0">
      {/* Page header */}
      <div className="px-6 py-4 bg-black text-white border-b border-green-500">
        <h1 className="text-xl font-bold">Stock Market</h1>
      </div>
      
      <div className="p-6 bg-gray-900">
        {/* Search bar */}
        <div className="mb-6">
          <form onSubmit={handleSearchSubmit} className="relative">
            <div className="flex">
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-4 py-3 border border-gray-700 rounded-l-lg bg-black text-white focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Search for stocks by symbol or company name..."
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                  onFocus={() => searchResults.length > 0 && setShowSearchResults(true)}
                  onBlur={() => setTimeout(() => setShowSearchResults(false), 100)}
                />
                {showSearchResults && searchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-black border border-green-500 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {searchResults.map((result) => (
                      <div
                        key={result.symbol}
                        className="p-3 hover:bg-gray-800 cursor-pointer border-b border-gray-800 last:border-b-0"
                        onMouseDown={() => selectStock(result.symbol)}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-medium text-white">{result.symbol}</div>
                            <div className="text-sm text-gray-400">{result.name}</div>
                          </div>
                          <div className="text-xs text-gray-500">{result.region}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button
                type="submit"
                className="px-4 py-3 bg-green-500 text-black font-medium rounded-r-lg hover:bg-green-600"
              >
                Search
              </button>
            </div>
          </form>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main chart */}
          <div className="lg:col-span-2">
            <StockChart 
              data={stockData} 
              symbol={activeSymbol}
              isLoading={isLoading}
              error={error}
            />
          </div>
          
          {/* Watchlist */}
          <div className="bg-black rounded-xl shadow-sm overflow-hidden border border-green-500">
            <div className="p-4 flex items-center justify-between border-b border-green-500">
              <h2 className="text-base font-bold text-white">Watchlist</h2>
              <div className="flex gap-2">
                <button className="p-1 rounded-lg hover:bg-gray-800 text-gray-300">
                  <RefreshCw size={16} />
                </button>
                <button className="p-1 rounded-lg hover:bg-gray-800 text-gray-300">
                  <Filter size={16} />
                </button>
              </div>
            </div>
            
            {watchlist.length > 0 ? (
              <div className="overflow-y-auto max-h-[400px]">
                <table className="w-full">
                  <thead>
                    <tr className="text-xs text-gray-400 border-b border-gray-800">
                      <th className="py-3 px-4 text-left">Symbol</th>
                      <th className="py-3 px-4 text-right">Price</th>
                      <th className="py-3 px-4 text-right">Change</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {watchlist.map((stock) => (
                      <tr 
                        key={stock.symbol} 
                        className={`hover:bg-gray-800 cursor-pointer text-white ${activeSymbol === stock.symbol ? 'bg-gray-800' : ''}`}
                        onClick={() => setActiveSymbol(stock.symbol)}
                      >
                        <td className="py-3 px-4 text-left font-medium">{stock.symbol}</td>
                        <td className="py-3 px-4 text-right font-medium">
                          {stock.error ? 'N/A' : `$${stock.price.toFixed(2)}`}
                        </td>
                        <td className={`py-3 px-4 text-right ${
                          stock.error ? 'text-gray-500' : 
                          stock.percentChange >= 0 ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {stock.error ? (
                            'N/A'
                          ) : (
                            <div className="flex items-center justify-end">
                              {stock.percentChange >= 0 ? <ArrowUp size={14} className="mr-1" /> : <ArrowDown size={14} className="mr-1" />}
                              {stock.percentChange.toFixed(2)}%
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-center">
                <div className="flex justify-center mb-3">
                  <RefreshCw size={24} className="text-gray-400 animate-spin" />
                </div>
                <p className="text-gray-400">Loading watchlist...</p>
              </div>
            )}
            
            <div className="p-3 border-t border-green-500">
              <button className="w-full text-center text-sm text-green-500 hover:text-green-400">
                Edit Watchlist
              </button>
            </div>
          </div>
        </div>
        
        {/* API credit notice */}
        <div className="mt-6 p-4 bg-black rounded-lg border border-green-500">
          <div className="flex items-start">
            <AlertCircle size={20} className="text-yellow-500 mr-3 mt-0.5" />
            <div>
              <p className="text-sm text-gray-300">
                <span className="font-medium text-white">Note:</span> Stock data is provided by Alpha Vantage API. Free API keys have a limit of 5 requests per minute and 500 requests per day. If you experience issues loading data, it may be due to these rate limits.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}