'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  ArrowDown, 
  ArrowUp, 
  RefreshCw,
  Filter,
  AlertCircle,
  Newspaper,
  Trash2,
  X
} from "lucide-react";
import { 
  searchStocks,
  StockQuote,
  SearchResult
} from '../../services/StockService';
import { 
  DEFAULT_WATCHLIST,
  getStockQuotes 
} from '../../services/DataService';
import { fetchMarketNews } from '../../services/NewsService';

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

export default function StocksPage() {
  const [activeSymbol, setActiveSymbol] = useState('');
  const [watchlist, setWatchlist] = useState<StockQuote[]>([]);
  const [watchlistSymbols, setWatchlistSymbols] = useState<string[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isWatchlistLoading, setIsWatchlistLoading] = useState(true);
  const [isNewsLoading, setIsNewsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Load watchlist from localStorage on initial render
  useEffect(() => {
    try {
      const savedWatchlist = localStorage.getItem('watchlist');
      if (savedWatchlist) {
        const parsedWatchlist = JSON.parse(savedWatchlist);
        setWatchlistSymbols(parsedWatchlist);
      } else {
        // Use default watchlist if nothing is saved
        setWatchlistSymbols(DEFAULT_WATCHLIST);
      }
    } catch (err) {
      console.error('Error loading watchlist from localStorage:', err);
      setWatchlistSymbols(DEFAULT_WATCHLIST);
    }
  }, []);

  // Fetch watchlist data whenever watchlistSymbols changes
  useEffect(() => {
    if (watchlistSymbols.length === 0) {
      setWatchlist([]);
      setIsWatchlistLoading(false);
      return;
    }

    const fetchWatchlist = async () => {
      setIsWatchlistLoading(true);
      try {
        const data = await getStockQuotes(watchlistSymbols);
        setWatchlist(data);
        
        // Save to localStorage whenever watchlistSymbols changes
        localStorage.setItem('watchlist', JSON.stringify(watchlistSymbols));
      } catch (err) {
        console.error('Error fetching watchlist data:', err);
        setError('Failed to load watchlist data.');
      } finally {
        setIsWatchlistLoading(false);
      }
    };
    
    fetchWatchlist();
  }, [watchlistSymbols]);

  // Fetch market news
  useEffect(() => {
    const fetchNews = async () => {
      setIsNewsLoading(true);
      try {
        const newsData = await fetchMarketNews('general');
        setNews(newsData);
      } catch (err) {
        console.error('Error fetching news:', err);
      } finally {
        setIsNewsLoading(false);
      }
    };
    
    fetchNews();
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
    addToWatchlist(symbol);
    setSearchQuery('');
    setShowSearchResults(false);
  };
  
  // Add a stock to watchlist
  const addToWatchlist = (symbol: string) => {
    if (!watchlistSymbols.includes(symbol)) {
      setWatchlistSymbols(prev => [...prev, symbol]);
    }
  };

  // Remove a stock from watchlist
  const removeFromWatchlist = (symbol: string) => {
    setWatchlistSymbols(prev => prev.filter(s => s !== symbol));
  };
  
  // Format timestamp to readable date
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Refresh watchlist data
  const refreshWatchlist = async () => {
    if (watchlistSymbols.length === 0) return;
    
    setIsWatchlistLoading(true);
    try {
      const data = await getStockQuotes(watchlistSymbols);
      setWatchlist(data);
    } catch (err) {
      console.error('Error refreshing watchlist data:', err);
    } finally {
      setIsWatchlistLoading(false);
    }
  };

  // Refresh news data
  const refreshNews = async () => {
    setIsNewsLoading(true);
    try {
      const newsData = await fetchMarketNews('general');
      setNews(newsData);
    } catch (err) {
      console.error('Error refreshing news:', err);
    } finally {
      setIsNewsLoading(false);
    }
  };

  // Toggle edit mode
  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
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
                  placeholder="Search for stocks to add to watchlist..."
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
          {/* Watchlist */}
          <div className="bg-black rounded-xl shadow-sm overflow-hidden border border-green-500 lg:col-span-1">
            <div className="p-4 flex items-center justify-between border-b border-green-500">
              <h2 className="text-base font-bold text-white">
                {isEditMode ? 'Edit Watchlist' : 'Watchlist'}
              </h2>
              <div className="flex gap-2">
                <button 
                  className="p-1 rounded-lg hover:bg-gray-800 text-gray-300"
                  onClick={refreshWatchlist}
                  disabled={isEditMode}
                >
                  <RefreshCw size={16} className={isWatchlistLoading ? "animate-spin" : ""} />
                </button>
                <button className="p-1 rounded-lg hover:bg-gray-800 text-gray-300">
                  <Filter size={16} />
                </button>
              </div>
            </div>
            
            {isWatchlistLoading ? (
              <div className="p-6 text-center">
                <div className="flex justify-center mb-3">
                  <RefreshCw size={24} className="text-gray-400 animate-spin" />
                </div>
                <p className="text-gray-400">Loading watchlist...</p>
              </div>
            ) : watchlist.length > 0 ? (
              <div className="overflow-y-auto max-h-[400px]">
                <table className="w-full">
                  <thead>
                    <tr className="text-xs text-gray-400 border-b border-gray-800">
                      <th className="py-3 px-4 text-left">Symbol</th>
                      <th className="py-3 px-4 text-right">Price</th>
                      <th className="py-3 px-4 text-right">Change</th>
                      {isEditMode && <th className="py-3 px-4 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {watchlist.map((stock) => (
                      <tr 
                        key={stock.symbol} 
                        className={`hover:bg-gray-800 text-white ${
                          activeSymbol === stock.symbol ? 'bg-gray-800' : ''
                        } ${isEditMode ? '' : 'cursor-pointer'}`}
                        onClick={() => !isEditMode && setActiveSymbol(stock.symbol)}
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
                        {isEditMode && (
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => removeFromWatchlist(stock.symbol)}
                              className="p-1 rounded-full hover:bg-red-900/30 text-red-500"
                              title="Remove from watchlist"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-center">
                <div className="flex justify-center mb-3">
                  <AlertCircle size={24} className="text-yellow-500" />
                </div>
                <p className="text-gray-400">
                  {isEditMode 
                    ? "Your watchlist is empty. Search for stocks to add."
                    : "No watchlist data available."
                  }
                </p>
              </div>
            )}
            
            <div className="p-3 border-t border-green-500">
              <button 
                className={`w-full text-center text-sm py-1 rounded-lg ${
                  isEditMode 
                    ? 'text-white bg-gray-700 hover:bg-gray-600'
                    : 'text-green-500 hover:text-green-400'
                }`}
                onClick={toggleEditMode}
              >
                {isEditMode ? 'Done' : 'Edit Watchlist'}
              </button>
            </div>
          </div>
          
          {/* Market News */}
          <div className="bg-black rounded-xl shadow-sm overflow-hidden border border-green-500 lg:col-span-2">
            <div className="p-4 flex items-center justify-between border-b border-green-500">
              <div className="flex items-center">
                <Newspaper size={18} className="text-green-500 mr-2" />
                <h2 className="text-base font-bold text-white">Market News</h2>
              </div>
              <button 
                className="p-1 rounded-lg hover:bg-gray-800 text-gray-300"
                onClick={refreshNews}
              >
                <RefreshCw size={16} className={isNewsLoading ? "animate-spin" : ""} />
              </button>
            </div>
            
            {isNewsLoading ? (
              <div className="p-6 text-center">
                <div className="flex justify-center mb-3">
                  <RefreshCw size={24} className="text-gray-400 animate-spin" />
                </div>
                <p className="text-gray-400">Loading market news...</p>
              </div>
            ) : news.length > 0 ? (
              <div className="overflow-y-auto max-h-[600px]">
                <div className="divide-y divide-gray-800">
                  {news.slice(0, 20).map((newsItem) => (
                    <div key={newsItem.id} className="p-4 hover:bg-gray-800">
                      <a 
                        href={newsItem.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <h3 className="font-medium text-white mb-2">{newsItem.headline}</h3>
                        <p className="text-sm text-gray-400 mb-2 line-clamp-2">{newsItem.summary}</p>
                        <div className="flex items-center text-xs text-gray-500">
                          <span className="font-medium text-green-500">{newsItem.source}</span>
                          <span className="mx-2">•</span>
                          <span>{formatDate(newsItem.datetime)}</span>
                        </div>
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-6 text-center">
                <div className="flex justify-center mb-3">
                  <AlertCircle size={24} className="text-yellow-500" />
                </div>
                <p className="text-gray-400">No news data available</p>
              </div>
            )}
          </div>
        </div>
        
        {/* API credit notice */}
        <div className="mt-6 p-4 bg-black rounded-lg border border-green-500">
          <div className="flex items-start">
            <AlertCircle size={20} className="text-yellow-500 mr-3 mt-0.5" />
            <div>
              <p className="text-sm text-gray-300">
                <span className="font-medium text-white">Note:</span> Stock data is provided by Finnhub API. The free tier has usage limits of 60 API calls per minute. If you experience issues loading data, it may be due to these rate limits.
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Your watchlist is saved in your browser's local storage and will persist between sessions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}