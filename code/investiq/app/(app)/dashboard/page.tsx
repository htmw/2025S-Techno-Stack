'use client';

import React, { useState, useEffect } from 'react';
import { 
  ArrowUp, 
  ArrowDown,
  TrendingUp,
  DollarSign,
  RefreshCw,
  Bell,
  Filter
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { getStockQuotes, getPortfolioValue, getPortfolioHistory, DEFAULT_WATCHLIST } from '../../services/DataService';
import { fetchMarketNews } from '../../services/NewsService';
import { StockQuote } from '../../services/StockService';
import IPOCalendar from '../../components/IPOCalendar';

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    payload: {
      date: string;
      [key: string]: any;
    };
  }>;
  label?: string;
}

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

export default function Dashboard() {
  const [timeRange, setTimeRange] = useState('1M');
  const [watchlist, setWatchlist] = useState<StockQuote[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [portfolioValue, setPortfolioValue] = useState<number>(0);
  const [portfolioHistory, setPortfolioHistory] = useState<any[]>([]);
  const [topMovers, setTopMovers] = useState<StockQuote[]>([]);
  const [isLoading, setIsLoading] = useState({
    portfolio: true,
    watchlist: true,
    news: true
  });
  const [unreadNotifications] = useState(3);
  
  // Load deposits from localStorage
  const [totalDeposits, setTotalDeposits] = useState(0);
  
  useEffect(() => {
    try {
      const deposits = localStorage.getItem('deposits') 
        ? JSON.parse(localStorage.getItem('deposits') || '0') 
        : 0;
      setTotalDeposits(deposits);
    } catch (err) {
      console.error('Error loading deposits:', err);
    }
  }, []);

  // PORTFOLIO DATA
  useEffect(() => {
    const fetchPortfolioData = async () => {
      try {
        // Get portfolio value and add deposits
        const value = await getPortfolioValue();
        setPortfolioValue(value + totalDeposits);

        // Get portfolio history
        const history = await getPortfolioHistory(timeRange);
        setPortfolioHistory(history);
      } catch (err) {
        console.error('Error fetching portfolio data:', err);
      } finally {
        setIsLoading(prev => ({ ...prev, portfolio: false }));
      }
    };

    fetchPortfolioData();
  }, [timeRange, totalDeposits]);

  // WATCHLIST & TOP MOVERS
  useEffect(() => {
    const fetchWatchlist = async () => {
      try {
        const data = await getStockQuotes(DEFAULT_WATCHLIST);
        setWatchlist(data);
        
        // Set top movers based on absolute percentage change
        const sorted = [...data].sort((a, b) => Math.abs(b.percentChange) - Math.abs(a.percentChange));
        setTopMovers(sorted.slice(0, 3));
      } catch (err) {
        console.error('Error fetching watchlist:', err);
      } finally {
        setIsLoading(prev => ({ ...prev, watchlist: false }));
      }
    };

    fetchWatchlist();
  }, []);

  // NEWS
  useEffect(() => {
    const fetchNews = async () => {
      try {
        const newsData = await fetchMarketNews('general');
        setNews(newsData.slice(0, 3));
      } catch (err) {
        console.error('Error fetching news:', err);
      } finally {
        setIsLoading(prev => ({ ...prev, news: false }));
      }
    };
    
    fetchNews();
  }, []);

  // Time range options
  const timeRanges = ['1D', '1W', '1M', '3M', '1Y', 'All'];

  // Custom tooltip for chart
  const CustomTooltip = ({ active, payload }: TooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black p-3 border border-green-500 rounded-lg shadow-lg text-white">
          <p className="font-medium">${payload[0].value.toLocaleString()}</p>
          <p className="text-xs text-gray-400">{payload[0].payload.date}</p>
        </div>
      );
    }
    return null;
  };

  // Format timestamp to readable date
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate total return
  const totalReturn = portfolioValue - 10000; // Assuming $10,000 initial investment
  const totalReturnPercent = totalReturn / 10000 * 100;

  return (
    <div className="p-0">
      {/* Page header */}
      <div className="px-6 py-4 bg-black text-white border-b border-green-500">
        <h1 className="text-xl font-bold">Dashboard</h1>
      </div>
      
      <div className="p-6 bg-gray-900">
        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-black p-5 rounded-xl shadow-sm border border-green-500">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-lg bg-gray-800 flex items-center justify-center">
                <DollarSign size={16} className="text-green-500" />
              </div>
              <span className="text-xs text-gray-400">Portfolio Value</span>
            </div>
            {isLoading.portfolio ? (
              <div className="h-8 flex items-center">
                <RefreshCw size={16} className="text-gray-400 animate-spin mr-2" />
                <span className="text-gray-400">Loading...</span>
              </div>
            ) : (
              <>
                <p className="text-xl font-bold text-white">${portfolioValue.toLocaleString()}</p>
                <p className="text-sm text-green-500 flex items-center">
                  <ArrowUp size={14} className="mr-1" />
                  {totalReturnPercent.toFixed(2)}% overall
                </p>
              </>
            )}
          </div>
          
          <div className="bg-black p-5 rounded-xl shadow-sm border border-green-500">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-lg bg-gray-800 flex items-center justify-center">
                <TrendingUp size={16} className="text-green-500" />
              </div>
              <span className="text-xs text-gray-400">Today's Change</span>
            </div>
            {isLoading.portfolio ? (
              <div className="h-8 flex items-center">
                <RefreshCw size={16} className="text-gray-400 animate-spin mr-2" />
                <span className="text-gray-400">Loading...</span>
              </div>
            ) : (
              <>
                <p className="text-xl font-bold text-white">+$235.45</p>
                <p className="text-sm text-green-500 flex items-center">
                  <ArrowUp size={14} className="mr-1" />
                  1.52% today
                </p>
              </>
            )}
          </div>
          
          <div className="bg-black p-5 rounded-xl shadow-sm border border-green-500">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-lg bg-gray-800 flex items-center justify-center">
                <Bell size={16} className="text-green-500" />
              </div>
              <span className="text-xs text-gray-400">Notifications</span>
              {unreadNotifications > 0 && (
                <span className="px-1.5 py-0.5 text-xs font-medium bg-green-500 text-black rounded-full">
                  {unreadNotifications}
                </span>
              )}
            </div>
            <p className="text-xl font-bold text-white">{unreadNotifications} New</p>
            <p className="text-sm text-green-500">View all</p>
          </div>
          
          <div className="bg-black p-5 rounded-xl shadow-sm border border-green-500">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-lg bg-gray-800 flex items-center justify-center">
                <DollarSign size={16} className="text-green-500" />
              </div>
              <span className="text-xs text-gray-400">Total Deposits</span>
            </div>
            <p className="text-xl font-bold text-white">${totalDeposits.toLocaleString()}</p>
            <p className="text-sm text-green-500">Manage deposits</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left section - Portfolio performance */}
          <div className="lg:col-span-2 space-y-6">
            {/* Portfolio overview */}
            <div className="bg-black rounded-xl shadow-sm overflow-hidden border border-green-500">
              <div className="p-5">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-bold text-white">Portfolio Performance</h2>
                    <p className="text-sm text-gray-400">Track your investment growth over time</p>
                  </div>
                  
                  <div className="flex bg-gray-800 rounded-lg p-1">
                    {timeRanges.map(range => (
                      <button 
                        key={range}
                        className={`px-3 py-1 text-xs font-medium rounded-md ${
                          timeRange === range 
                            ? 'bg-green-500 text-black' 
                            : 'text-gray-300 hover:bg-gray-700'
                        }`}
                        onClick={() => setTimeRange(range)}
                      >
                        {range}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="h-64 w-full">
                  {isLoading.portfolio ? (
                    <div className="h-full flex items-center justify-center">
                      <RefreshCw size={24} className="text-gray-400 animate-spin" />
                    </div>
                  ) : (
                    <ResponsiveContainer>
                      <AreaChart data={portfolioHistory} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                        <defs>
                          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                        <XAxis 
                          dataKey="date" 
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 12, fill: '#9CA3AF' }}
                          dy={10}
                        />
                        <YAxis 
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 12, fill: '#9CA3AF' }}
                          dx={-5}
                          tickFormatter={(value) => `$${value.toLocaleString()}`}
                        />
                        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#374151" />
                        <Tooltip content={<CustomTooltip />} />
                        <Area 
                          type="monotone" 
                          dataKey="value" 
                          stroke="#10B981"
                          fillOpacity={1}
                          fill="url(#colorValue)"
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>
            
            {/* IPO Calendar (Replacing Market Summary) */}
            <IPOCalendar />
          </div>
          
          {/* Right section - Watchlist & News */}
          <div className="space-y-6">
            {/* Watchlist */}
            <div className="bg-black rounded-xl shadow-sm overflow-hidden border border-green-500">
              <div className="p-4 flex items-center justify-between border-b border-green-500">
                <h2 className="text-base font-bold text-white">Watchlist</h2>
                <button className="p-1 rounded-lg hover:bg-gray-800 text-gray-300">
                  <Filter size={16} />
                </button>
              </div>
              
              {isLoading.watchlist ? (
                <div className="p-8 flex justify-center">
                  <RefreshCw size={24} className="text-gray-400 animate-spin" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-xs text-gray-400 border-b border-gray-800">
                        <th className="py-3 px-4 text-left">Symbol</th>
                        <th className="py-3 px-4 text-right">Price</th>
                        <th className="py-3 px-4 text-right">Change</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {watchlist.slice(0, 5).map((stock) => (
                        <tr key={stock.symbol} className="hover:bg-gray-800 cursor-pointer text-white">
                          <td className="py-3 px-4 text-left font-medium">{stock.symbol}</td>
                          <td className="py-3 px-4 text-right font-medium">${stock.price.toFixed(2)}</td>
                          <td className={`py-3 px-4 text-right ${stock.percentChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            <div className="flex items-center justify-end">
                              {stock.percentChange >= 0 ? <ArrowUp size={14} className="mr-1" /> : <ArrowDown size={14} className="mr-1" />}
                              {stock.percentChange.toFixed(2)}%
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            
            {/* Market news */}
            <div className="bg-black rounded-xl shadow-sm overflow-hidden border border-green-500">
              <div className="p-4 border-b border-green-500">
                <h2 className="text-base font-bold text-white">Latest News</h2>
              </div>
              
              {isLoading.news ? (
                <div className="p-8 flex justify-center">
                  <RefreshCw size={24} className="text-gray-400 animate-spin" />
                </div>
              ) : (
                <>
                  <div className="divide-y divide-gray-800">
                    {news.map((item) => (
                      <div key={item.id} className="p-4 hover:bg-gray-800 cursor-pointer">
                        <h3 className="font-medium text-sm line-clamp-2 mb-1 text-white">{item.headline}</h3>
                        <div className="flex items-center text-xs text-gray-400">
                          <span className="font-medium text-green-500">{item.source}</span>
                          <span className="mx-2">•</span>
                          <span>{formatDate(item.datetime)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 border-t border-green-500">
                    <button className="w-full text-center text-sm text-green-500 hover:text-green-400">
                      View All News
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}