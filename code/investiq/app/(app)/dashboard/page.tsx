'use client';

import React, { useState, useEffect } from 'react';
import { 
  ArrowUp, 
  ArrowDown,
  TrendingUp,
  DollarSign,
  RefreshCw,
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
import { fetchMultipleStocks } from '../../services/StockService';
import { fetchMarketNews } from '../../services/NewsService';
import { DEFAULT_WATCHLIST } from '../../services/DataService';
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

interface Holding {
  symbol: string;
  name: string;
  shares: number;
  avgCost: number;
  currentPrice: number;
  value: number;
  weight: number;
  gain: number;
  gainPercent: number;
}

export default function Dashboard() {
  const [timeRange, setTimeRange] = useState('1M');
  const [watchlist, setWatchlist] = useState<any[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [portfolioValue, setPortfolioValue] = useState<number>(0);
  const [portfolioGain, setPortfolioGain] = useState<number>(0);
  const [portfolioGainPercent, setPortfolioGainPercent] = useState<number>(0);
  const [portfolioPerformance, setPortfolioPerformance] = useState<any[]>([]);
  const [topMovers, setTopMovers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState({
    portfolio: true,
    watchlist: true,
    news: true
  });
  
  // Load deposits and portfolio from localStorage
  const [totalDeposits, setTotalDeposits] = useState(0);
  const [portfolioHoldings, setPortfolioHoldings] = useState<Holding[]>([]);

  // Time range options
  const timeRanges = ['1D', '1W', '1M', '3M', '1Y', 'All'];

  // Load data from localStorage
  useEffect(() => {
    try {
      // Load deposits
      const deposits = localStorage.getItem('deposits') 
        ? JSON.parse(localStorage.getItem('deposits') || '0') 
        : 0;
      setTotalDeposits(deposits);
      
      // Load portfolio holdings
      const savedPortfolio = localStorage.getItem('portfolio');
      if (savedPortfolio) {
        const holdings = JSON.parse(savedPortfolio);
        setPortfolioHoldings(holdings);
        
        // Calculate total portfolio value and gain
        const totalValue = holdings.reduce((sum: number, h: Holding) => sum + h.value, 0);
        const totalGain = holdings.reduce((sum: number, h: Holding) => sum + h.gain, 0);
        const initialInvestment = totalValue - totalGain;
        const gainPercent = initialInvestment > 0 ? (totalGain / initialInvestment) * 100 : 0;
        
        setPortfolioValue(totalValue);
        setPortfolioGain(totalGain);
        setPortfolioGainPercent(gainPercent);
        
        // Generate portfolio performance data based on holdings and time range
        generatePortfolioPerformance(holdings, timeRange);
      } else {
        // Generate default performance data if no portfolio exists
        generateDefaultPerformance();
      }
    } catch (err) {
      console.error('Error loading data from localStorage:', err);
      generateDefaultPerformance();
    } finally {
      setIsLoading(prev => ({ ...prev, portfolio: false }));
    }
  }, [timeRange]);

  // Generate portfolio performance data based on holdings and selected time range
  const generatePortfolioPerformance = (holdings: Holding[], selectedTimeRange: string) => {
    // Calculate initial investment value
    const initialInvestment = holdings.reduce((sum, h) => sum + (h.avgCost * h.shares), 0);
    const currentValue = holdings.reduce((sum, h) => sum + h.value, 0);
    
    // Generate data points based on time range
    let dataPoints = 30; // Default to 1 month
    
    switch (selectedTimeRange) {
      case '1D':
        dataPoints = 24; // Hourly for 1 day
        break;
      case '1W':
        dataPoints = 7; // Daily for 1 week
        break;
      case '1M':
        dataPoints = 30; // Daily for 1 month
        break;
      case '3M':
        dataPoints = 90; // Daily for 3 months
        break;
      case '1Y':
        dataPoints = 12; // Monthly for 1 year
        break;
      case 'All':
        dataPoints = 24; // Monthly for 2 years
        break;
    }
    
    // Create a realistic performance curve based on current gain
    const result = [];
    // Start value between 80-90% of initial investment
    const startValue = initialInvestment * (0.8 + Math.random() * 0.1);
    
    for (let i = 0; i < dataPoints; i++) {
      // Add some randomness and a trend toward current value
      const progress = i / dataPoints;
      const randomFactor = (Math.random() * 0.04) - 0.02; // Random -2% to +2%
      
      // Calculate value with more weight toward current value as i increases
      const value = startValue + (progress * (currentValue - startValue)) + (initialInvestment * randomFactor);
      
      // Format date label based on time range
      let dateLabel;
      const today = new Date();
      
      if (selectedTimeRange === '1D') {
        dateLabel = `${i}h`;
      } else if (selectedTimeRange === '1W' || selectedTimeRange === '1M') {
        const date = new Date();
        date.setDate(today.getDate() - (dataPoints - i - 1));
        dateLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } else if (selectedTimeRange === '3M') {
        const date = new Date();
        date.setDate(today.getDate() - (dataPoints - i - 1));
        dateLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } else {
        // For longer ranges, use month names
        const date = new Date();
        date.setMonth(today.getMonth() - (dataPoints - i - 1));
        dateLabel = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      }
      
      result.push({
        date: dateLabel,
        value: Math.round(value * 100) / 100
      });
    }
    
    setPortfolioPerformance(result);
  };

  // Generate default performance data if no portfolio exists
  const generateDefaultPerformance = () => {
    const performanceData = [
      { date: 'Jan', value: 10000 },
      { date: 'Feb', value: 10800 },
      { date: 'Mar', value: 11500 },
      { date: 'Apr', value: 12200 },
      { date: 'May', value: 13000 },
      { date: 'Jun', value: 12500 },
      { date: 'Jul', value: 13200 },
      { date: 'Aug', value: 13800 },
      { date: 'Sep', value: 14500 },
      { date: 'Oct', value: 15000 },
      { date: 'Nov', value: 15600 },
      { date: 'Dec', value: 15800 },
    ];
    
    setPortfolioPerformance(performanceData);
  };

  // WATCHLIST & TOP MOVERS
  useEffect(() => {
    const fetchWatchlist = async () => {
      try {
        const data = await fetchMultipleStocks(DEFAULT_WATCHLIST);
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
                <p className="text-xl font-bold text-white">${portfolioValue.toLocaleString(undefined, {maximumFractionDigits: 2})}</p>
                <p className="text-sm text-green-500 flex items-center">
                  <ArrowUp size={14} className="mr-1" />
                  {portfolioGainPercent.toFixed(2)}% overall
                </p>
              </>
            )}
          </div>
          
          <div className="bg-black p-5 rounded-xl shadow-sm border border-green-500">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-lg bg-gray-800 flex items-center justify-center">
                <TrendingUp size={16} className="text-green-500" />
              </div>
              <span className="text-xs text-gray-400">Total Gain</span>
            </div>
            {isLoading.portfolio ? (
              <div className="h-8 flex items-center">
                <RefreshCw size={16} className="text-gray-400 animate-spin mr-2" />
                <span className="text-gray-400">Loading...</span>
              </div>
            ) : (
              <>
                <p className="text-xl font-bold text-white">${portfolioGain.toLocaleString(undefined, {maximumFractionDigits: 2})}</p>
                <p className="text-sm text-green-500 flex items-center">
                  <ArrowUp size={14} className="mr-1" />
                  {portfolioHoldings.length > 0 ? "Since purchase" : "No holdings"}
                </p>
              </>
            )}
          </div>
          
          <div className="bg-black p-5 rounded-xl shadow-sm border border-green-500">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-lg bg-gray-800 flex items-center justify-center">
                <DollarSign size={16} className="text-green-500" />
              </div>
              <span className="text-xs text-gray-400">Positions</span>
            </div>
            <p className="text-xl font-bold text-white">{portfolioHoldings.length}</p>
            <p className="text-sm text-green-500">
              {portfolioHoldings.length > 0 ? 
                `${portfolioHoldings.filter(h => h.gain > 0).length} profitable` : 
                "Add positions in Portfolio"
              }
            </p>
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
                      <AreaChart data={portfolioPerformance} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
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
            
            {/* IPO Calendar */}
            <IPOCalendar />
          </div>
          
          {/* Right section - Watchlist & News */}
          <div className="space-y-6">
            {/* Portfolio Holdings Summary */}
            <div className="bg-black rounded-xl shadow-sm overflow-hidden border border-green-500">
              <div className="p-4 flex items-center justify-between border-b border-green-500">
                <h2 className="text-base font-bold text-white">Top Holdings</h2>
              </div>
              
              {portfolioHoldings.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-gray-400">You don't have any positions yet.</p>
                  <a 
                    href="/portfolio"
                    className="mt-4 inline-block px-4 py-2 bg-green-500 text-black rounded-lg font-medium"
                  >
                    Go to Portfolio
                  </a>
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
                      {portfolioHoldings
                        .sort((a, b) => b.value - a.value)
                        .slice(0, 3)
                        .map((stock) => (
                          <tr key={stock.symbol} className="text-white">
                            <td className="py-3 px-4 text-left font-medium">{stock.symbol}</td>
                            <td className="py-3 px-4 text-right font-medium">${stock.currentPrice.toFixed(2)}</td>
                            <td className="py-3 px-4 text-right">
                              <div className={`flex items-center justify-end ${stock.gain >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {stock.gain >= 0 ? <ArrowUp size={14} className="mr-1" /> : <ArrowDown size={14} className="mr-1" />}
                                {stock.gainPercent.toFixed(2)}%
                              </div>
                            </td>
                          </tr>
                        ))
                      }
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            
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