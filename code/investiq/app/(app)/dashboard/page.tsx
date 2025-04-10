'use client';

import React, { useState, useEffect } from 'react';
import { 
  ArrowUp, 
  ArrowDown,
  TrendingUp,
  Calendar,
  DollarSign,
  Percent,
  Filter,
  RefreshCw
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { getStockQuotes, getPortfolioValue, getPortfolioHistory, getPortfolioHoldings, DEFAULT_WATCHLIST } from '../../services/DataService';
import { fetchMarketNews } from '../../services/NewsService';
import { StockQuote } from '../../services/StockService';

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
  const [allocationData, setAllocationData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState({
    portfolio: true,
    watchlist: true,
    news: true
  });

  // Fetch watchlist data
  useEffect(() => {
    const fetchWatchlist = async () => {
      try {
        const data = await getStockQuotes(DEFAULT_WATCHLIST);
        setWatchlist(data);
      } catch (err) {
        console.error('Error fetching watchlist:', err);
      } finally {
        setIsLoading(prev => ({ ...prev, watchlist: false }));
      }
    };

    fetchWatchlist();
  }, []);

  // Fetch portfolio data
  useEffect(() => {
    const fetchPortfolioData = async () => {
      try {
        // Get portfolio value
        const value = await getPortfolioValue();
        setPortfolioValue(value);

        // Get portfolio history
        const history = await getPortfolioHistory(timeRange);
        setPortfolioHistory(history);

        // Get portfolio holdings for allocation data
        const holdings = await getPortfolioHoldings();
        
        // Calculate allocation by sector
        const sectorMap: {[key: string]: number} = {};
        holdings.forEach(holding => {
          // Simple sector mapping based on company name (in a real app, this would come from the API)
          let sector = 'Other';
          
          if (holding.name.includes('Apple') || holding.name.includes('Microsoft') || 
              holding.name.includes('NVIDIA') || holding.name.includes('Alphabet')) {
            sector = 'Technology';
          } else if (holding.name.includes('Amazon')) {
            sector = 'Consumer';
          } else if (holding.name.includes('JPMorgan')) {
            sector = 'Finance';
          }
          
          if (!sectorMap[sector]) {
            sectorMap[sector] = 0;
          }
          sectorMap[sector] += holding.value;
        });

        // Convert to array for chart
        const totalValue = Object.values(sectorMap).reduce((sum, val) => sum + val, 0);
        const allocation = Object.entries(sectorMap).map(([name, value]) => ({
          name,
          value: Math.round((value / totalValue) * 100)
        }));
        
        setAllocationData(allocation);
      } catch (err) {
        console.error('Error fetching portfolio data:', err);
      } finally {
        setIsLoading(prev => ({ ...prev, portfolio: false }));
      }
    };

    fetchPortfolioData();
  }, [timeRange]);

  // Fetch news
  useEffect(() => {
    const fetchNews = async () => {
      try {
        const newsData = await fetchMarketNews('general');
        setNews(newsData.slice(0, 3)); // Only take first 3 items
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Portfolio performance */}
          <div className="lg:col-span-2 space-y-6">
            {/* Portfolio overview */}
            <div className="bg-black rounded-xl shadow-sm overflow-hidden border border-green-500">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-bold text-white">Portfolio Value</h2>
                    <div className="flex items-baseline gap-2 mt-1">
                      {isLoading.portfolio ? (
                        <div className="flex items-center">
                          <RefreshCw size={16} className="text-gray-400 animate-spin mr-2" />
                          <span className="text-gray-400">Loading...</span>
                        </div>
                      ) : (
                        <>
                          <span className="text-2xl font-bold text-white">${portfolioValue.toLocaleString()}</span>
                          <span className="text-green-500 flex items-center text-sm font-medium">
                            <ArrowUp size={14} className="mr-1" />
                            {totalReturnPercent.toFixed(2)}%
                          </span>
                        </>
                      )}
                    </div>
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
              
              {/* Key metrics */}
              <div className="grid grid-cols-3 divide-x divide-green-500 border-t border-green-500">
                <div className="p-4 text-center">
                  <p className="text-xs text-gray-400 mb-1">Total Return</p>
                  {isLoading.portfolio ? (
                    <div className="h-6 flex justify-center items-center">
                      <RefreshCw size={14} className="text-gray-400 animate-spin" />
                    </div>
                  ) : (
                    <>
                      <p className="text-lg font-bold text-green-500">${totalReturn.toLocaleString()}</p>
                      <p className="text-xs text-green-500">+{totalReturnPercent.toFixed(2)}%</p>
                    </>
                  )}
                </div>
                <div className="p-4 text-center">
                  <p className="text-xs text-gray-400 mb-1">Today</p>
                  {isLoading.portfolio ? (
                    <div className="h-6 flex justify-center items-center">
                      <RefreshCw size={14} className="text-gray-400 animate-spin" />
                    </div>
                  ) : (
                    <>
                      <p className="text-lg font-bold text-green-500">+$235.45</p>
                      <p className="text-xs text-green-500">+1.52%</p>
                    </>
                  )}
                </div>
                <div className="p-4 text-center">
                  <p className="text-xs text-gray-400 mb-1">Risk Level</p>
                  <p className="text-lg font-bold text-white">Moderate</p>
                  <p className="text-xs text-gray-400">Medium Volatility</p>
                </div>
              </div>
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
                      {watchlist.map((stock) => (
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
          </div>
          
          {/* Right column - Portfolio allocation, news */}
          <div className="space-y-6">
            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-black p-4 rounded-xl shadow-sm border border-green-500">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-8 w-8 rounded-lg bg-gray-800 flex items-center justify-center">
                    <Calendar size={16} className="text-green-500" />
                  </div>
                  <span className="text-xs text-gray-400">Invested</span>
                </div>
                <p className="text-lg font-bold text-white">$10,000</p>
              </div>
              
              <div className="bg-black p-4 rounded-xl shadow-sm border border-green-500">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-8 w-8 rounded-lg bg-gray-800 flex items-center justify-center">
                    <DollarSign size={16} className="text-green-500" />
                  </div>
                  <span className="text-xs text-gray-400">Profit</span>
                </div>
                {isLoading.portfolio ? (
                  <div className="h-8 flex items-center">
                    <RefreshCw size={14} className="text-gray-400 animate-spin" />
                  </div>
                ) : (
                  <p className="text-lg font-bold text-white">${totalReturn.toLocaleString()}</p>
                )}
              </div>
              
              <div className="bg-black p-4 rounded-xl shadow-sm border border-green-500">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-8 w-8 rounded-lg bg-gray-800 flex items-center justify-center">
                    <Percent size={16} className="text-green-500" />
                  </div>
                  <span className="text-xs text-gray-400">Return</span>
                </div>
                {isLoading.portfolio ? (
                  <div className="h-8 flex items-center">
                    <RefreshCw size={14} className="text-gray-400 animate-spin" />
                  </div>
                ) : (
                  <p className="text-lg font-bold text-white">{totalReturnPercent.toFixed(2)}%</p>
                )}
              </div>
              
              <div className="bg-black p-4 rounded-xl shadow-sm border border-green-500">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-8 w-8 rounded-lg bg-gray-800 flex items-center justify-center">
                    <TrendingUp size={16} className="text-green-500" />
                  </div>
                  <span className="text-xs text-gray-400">Avg. Monthly</span>
                </div>
                <p className="text-lg font-bold text-white">+4.83%</p>
              </div>
            </div>
            
            {/* Portfolio allocation */}
            <div className="bg-black rounded-xl shadow-sm p-4 border border-green-500">
              <h2 className="text-base font-bold mb-4 text-white">Portfolio Allocation</h2>
              {isLoading.portfolio ? (
                <div className="h-56 flex items-center justify-center">
                  <RefreshCw size={24} className="text-gray-400 animate-spin" />
                </div>
              ) : (
                <div className="h-56">
                  <ResponsiveContainer>
                    <BarChart 
                      data={allocationData} 
                      layout="vertical"
                      margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
                    >
                      <XAxis type="number" hide />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: '#9CA3AF' }}
                        width={80}
                      />
                      <Tooltip 
                        formatter={(value) => [`${value}%`, 'Allocation']}
                        labelFormatter={(value) => value}
                        contentStyle={{ backgroundColor: '#000000', border: '1px solid #10B981', color: '#FFFFFF' }}
                      />
                      <Bar 
                        dataKey="value" 
                        fill="#10B981" 
                        radius={[0, 4, 4, 0]}
                        barSize={20}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
            
            {/* Market news */}
            <div className="bg-black rounded-xl shadow-sm overflow-hidden border border-green-500">
              <div className="p-4 border-b border-green-500">
                <h2 className="text-base font-bold text-white">Market News</h2>
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