'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowUp, 
  ArrowDown,
  TrendingUp,
  Calendar,
  DollarSign,
  Percent,
  Filter,
  RefreshCw,
  AlertCircle,
  Bell,
  ChevronRight,
  Clock,
  Plus,
  X
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

interface NotificationItem {
  id: number;
  type: 'alert' | 'info' | 'success' | 'warning';
  title: string;
  message: string;
  time: string;
  isRead: boolean;
}

interface MarketSummary {
  index: string;
  value: number;
  change: number;
  percentChange: number;
}

interface DepositTransaction {
  id: string;
  amount: number;
  method: string;
  date: string;
}

export default function Dashboard() {
  const [timeRange, setTimeRange] = useState('1M');
  const [watchlist, setWatchlist] = useState<StockQuote[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [portfolioValue, setPortfolioValue] = useState<number>(0);
  const [portfolioHistory, setPortfolioHistory] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [marketData, setMarketData] = useState<MarketSummary[]>([]);
  const [topMovers, setTopMovers] = useState<StockQuote[]>([]);
  const [holdings, setHoldings] = useState<any[]>([]);
  const [dataFetchState, setDataFetchState] = useState<{[key: string]: boolean}>({
    portfolio: true,
    watchlist: true,
    news: true,
    marketData: true,
    holdings: true
  });
  const [activeTab, setActiveTab] = useState('overview');
  const [depositAmount, setDepositAmount] = useState('');
  const [depositMethod, setDepositMethod] = useState('bank');
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [transactions, setTransactions] = useState<DepositTransaction[]>([]);
  const [depositProcessing, setDepositProcessing] = useState(false);
  const [depositSuccess, setDepositSuccess] = useState(false);

  // Load transactions from localStorage on initial render
  useEffect(() => {
    try {
      const savedTransactions = localStorage.getItem('depositTransactions');
      if (savedTransactions) {
        setTransactions(JSON.parse(savedTransactions));
      }
    } catch (err) {
      console.error('Error loading transactions from localStorage:', err);
    }
  }, []);

  // PORTFOLIO DATA
  useEffect(() => {
    const fetchPortfolioData = async () => {
      try {
        // Get portfolio value from API (or localStorage for deposit tracking)
        let value = await getPortfolioValue();
        
        // Add deposits from localStorage to portfolio value
        const depositTotal = transactions.reduce((sum, t) => sum + t.amount, 0);
        value += depositTotal;
        
        setPortfolioValue(value);

        // Get portfolio history
        const history = await getPortfolioHistory(timeRange);
        setPortfolioHistory(history);
        
        // Get portfolio holdings
        const holdingsData = await getPortfolioHoldings();
        setHoldings(holdingsData);
      } catch (err) {
        console.error('Error fetching portfolio data:', err);
      } finally {
        setDataFetchState(prev => ({ ...prev, portfolio: false, holdings: false }));
      }
    };

    fetchPortfolioData();
  }, [timeRange, transactions]);

  // WATCHLIST & TOP MOVERS
  useEffect(() => {
    const fetchWatchlist = async () => {
      try {
        const data = await getStockQuotes(DEFAULT_WATCHLIST);
        setWatchlist(data);
        
        // Set top movers based on absolute percentage change
        const sorted = [...data].sort((a, b) => 
          Math.abs(b.percentChange) - Math.abs(a.percentChange)
        );
        setTopMovers(sorted.slice(0, 3));
      } catch (err) {
        console.error('Error fetching watchlist:', err);
      } finally {
        setDataFetchState(prev => ({ ...prev, watchlist: false }));
      }
    };

    fetchWatchlist();
  }, []);

  // NEWS
  useEffect(() => {
    const fetchNews = async () => {
      try {
        const newsData = await fetchMarketNews('general');
        setNews(newsData.slice(0, 4)); // Take first 4 items
      } catch (err) {
        console.error('Error fetching news:', err);
      } finally {
        setDataFetchState(prev => ({ ...prev, news: false }));
      }
    };
    
    fetchNews();
  }, []);

  // MARKET DATA
  useEffect(() => {
    // Mock market data
    const mockMarketData: MarketSummary[] = [
      { index: 'S&P 500', value: 5276.42, change: 34.8, percentChange: 0.66 },
      { index: 'NASDAQ', value: 16908.23, change: 172.54, percentChange: 1.03 },
      { index: 'DOW', value: 38973.48, change: -4.82, percentChange: -0.01 },
      { index: 'RUSSELL 2000', value: 2063.63, change: 18.91, percentChange: 0.93 }
    ];
    
    setMarketData(mockMarketData);
    setDataFetchState(prev => ({ ...prev, marketData: false }));
  }, []);

  // NOTIFICATIONS
  useEffect(() => {
    // Mock notifications
    const mockNotifications: NotificationItem[] = [
      {
        id: 1,
        type: 'alert',
        title: 'NVDA Earnings',
        message: 'NVIDIA reports earnings after market close today',
        time: '1 hour ago',
        isRead: false
      },
      {
        id: 2,
        type: 'success',
        title: 'Portfolio Milestone',
        message: 'Your portfolio has exceeded $15,000!',
        time: '3 hours ago',
        isRead: true
      },
      {
        id: 3,
        type: 'info',
        title: 'Market Strategy',
        message: 'Check your new personalized investment recommendations',
        time: '1 day ago',
        isRead: true
      }
    ];
    
    setNotifications(mockNotifications);
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

  const unreadNotifications = useMemo(() => 
    notifications.filter(n => !n.isRead).length, 
    [notifications]
  );

  // Tab navigation
  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'performance', label: 'Performance', icon: BarChart },
    { id: 'news', label: 'News', icon: AlertCircle },
  ];

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, isRead: true }))
    );
  };

  // Handle deposit submission
  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!depositAmount || !depositMethod) return;
    
    setDepositProcessing(true);
    
    // Process deposit (simulated delay)
    setTimeout(() => {
      // Create new transaction
      const newTransaction: DepositTransaction = {
        id: Date.now().toString(),
        amount: parseFloat(depositAmount),
        method: depositMethod === 'bank' ? 'Bank Transfer' : 'Credit Card',
        date: new Date().toISOString()
      };
      
      // Update transactions array
      const updatedTransactions = [...transactions, newTransaction];
      setTransactions(updatedTransactions);
      
      // Save to localStorage
      localStorage.setItem('depositTransactions', JSON.stringify(updatedTransactions));
      
      setDepositProcessing(false);
      setDepositSuccess(true);
      
      // Reset and close after showing success
      setTimeout(() => {
        resetDepositForm();
      }, 2000);
    }, 1500);
  };
  
  // Reset deposit form
  const resetDepositForm = () => {
    setDepositAmount('');
    setDepositMethod('bank');
    setDepositSuccess(false);
    setShowDepositModal(false);
  };

  // Payment methods for deposit
  const paymentMethods = [
    { id: 'bank', name: 'Bank Transfer', description: 'Transfer directly from your bank (1-3 business days)' },
    { id: 'card', name: 'Credit Card', description: 'Instant deposit with 1.5% fee' },
  ];

  // Quick deposit amounts
  const quickAmounts = [100, 500, 1000, 5000];

  // Calculate Portfolio Health Score (mock)
  const getPortfolioHealthScore = () => {
    // This would be a complex calculation in a real app
    return 85; // Score out of 100
  };

  return (
    <div className="p-0">
      {/* Page header */}
      <div className="px-6 py-4 bg-black text-white border-b border-green-500">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold">Dashboard</h1>
          <button 
            onClick={() => setShowDepositModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-black bg-green-500 rounded-lg hover:bg-green-600 transition-colors"
          >
            <DollarSign size={16} />
            <span>Deposit</span>
          </button>
        </div>
      </div>
      
      <div className="p-6 bg-gray-900">
        {/* Tab navigation */}
        <div className="flex border-b border-green-500 mb-6">
          {tabs.map((tab) => (
            <button 
              key={tab.id}
              className={`px-4 py-2 flex items-center gap-2 text-sm font-medium ${
                activeTab === tab.id 
                  ? 'text-green-500 border-b-2 border-green-500' 
                  : 'text-gray-400 hover:text-white'
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-black p-5 rounded-xl shadow-sm border border-green-500">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-lg bg-gray-800 flex items-center justify-center">
                <DollarSign size={16} className="text-green-500" />
              </div>
              <span className="text-xs text-gray-400">Portfolio Value</span>
            </div>
            {dataFetchState.portfolio ? (
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
            {dataFetchState.portfolio ? (
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
            <p className="text-xl font-bold text-white">{notifications.length} Total</p>
            <button 
              className="text-sm text-green-500 flex items-center"
              onClick={markAllAsRead}
            >
              Mark all as read
              <ChevronRight size={14} className="ml-1" />
            </button>
          </div>
          
          <div className="bg-black p-5 rounded-xl shadow-sm border border-green-500">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-lg bg-gray-800 flex items-center justify-center">
                <Plus size={16} className="text-green-500" />
              </div>
              <span className="text-xs text-gray-400">Recent Deposits</span>
            </div>
            {transactions.length > 0 ? (
              <>
                <p className="text-xl font-bold text-white">
                  ${transactions.reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
                </p>
                <p className="text-sm text-gray-400">
                  {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
                </p>
              </>
            ) : (
              <>
                <p className="text-xl font-bold text-white">$0</p>
                <button 
                  className="text-sm text-green-500 flex items-center"
                  onClick={() => setShowDepositModal(true)}
                >
                  Make your first deposit
                  <ChevronRight size={14} className="ml-1" />
                </button>
              </>
            )}
          </div>
        </div>
        
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left column - Portfolio performance */}
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
                    {dataFetchState.portfolio ? (
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
                  
                  {/* Portfolio health indicator */}
                  <div className="mt-6 bg-gray-800 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-sm font-medium text-white">Portfolio Health</h3>
                      <span className="text-xs text-gray-400">Updated today</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-full bg-gray-700 rounded-full h-2.5">
                        <div 
                          className="bg-green-500 h-2.5 rounded-full" 
                          style={{ width: `${getPortfolioHealthScore()}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-white">{getPortfolioHealthScore()}/100</span>
                    </div>
                    <p className="mt-2 text-xs text-gray-400">
                      Your portfolio is well-diversified with a healthy balance of growth stocks and stable investments.
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Top Movers */}
              <div className="bg-black rounded-xl shadow-sm overflow-hidden border border-green-500">
                <div className="p-4 border-b border-green-500">
                  <h2 className="text-base font-bold text-white">Top Movers Today</h2>
                </div>
                
                {dataFetchState.watchlist ? (
                  <div className="p-8 flex justify-center">
                    <RefreshCw size={24} className="text-gray-400 animate-spin" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 divide-x divide-green-500">
                    {topMovers.map((stock) => (
                      <div key={stock.symbol} className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-white">{stock.symbol}</span>
                          <div className={`px-2 py-0.5 text-xs font-medium rounded ${
                            stock.percentChange >= 0 ? 'bg-green-900/30 text-green-500' : 'bg-red-900/30 text-red-500'
                          }`}>
                            {stock.percentChange >= 0 ? '+' : ''}{stock.percentChange.toFixed(2)}%
                          </div>
                        </div>
                        <div className="flex items-baseline justify-between">
                          <span className="text-sm text-gray-400">${stock.price.toFixed(2)}</span>
                          <span className={`text-sm ${
                            stock.percentChange >= 0 ? 'text-green-500' : 'text-red-500'
                          }`}>
                            {stock.percentChange >= 0 ? '+' : ''}${stock.change.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Transaction History */}
              <div className="bg-black rounded-xl shadow-sm overflow-hidden border border-green-500">
                <div className="p-4 border-b border-green-500">
                  <h2 className="text-base font-bold text-white">Deposit History</h2>
                </div>
                
                {transactions.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-gray-400">No deposits yet. Add funds to start investing.</p>
                    <button 
                      onClick={() => setShowDepositModal(true)}
                      className="mt-4 px-4 py-2 bg-green-500 text-black rounded-lg hover:bg-green-600 flex items-center justify-center mx-auto font-medium"
                    >
                      <Plus size={16} className="mr-2" />
                      Add Funds
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-xs text-gray-400 border-b border-gray-800">
                          <th className="py-3 px-4 text-left">Date</th>
                          <th className="py-3 px-4 text-left">Method</th>
                          <th className="py-3 px-4 text-right">Amount</th>
                          <th className="py-3 px-4 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800">
                        {transactions.map((transaction) => (
                          <tr key={transaction.id} className="text-white">
                            <td className="py-3 px-4 text-left">
                              {new Date(transaction.date).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4 text-left text-gray-300">{transaction.method}</td>
                            <td className="py-3 px-4 text-right font-medium">${transaction.amount.toLocaleString()}</td>
                            <td className="py-3 px-4 text-right">
                              <span className="px-2 py-0.5 text-xs font-medium bg-green-900/30 text-green-500 rounded">
                                Completed
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              
              {/* Market Indices */}
              <div className="bg-black rounded-xl shadow-sm overflow-hidden border border-green-500">
                <div className="p-4 border-b border-green-500">
                  <h2 className="text-base font-bold text-white">Market Summary</h2>
                </div>
                
                {dataFetchState.marketData ? (
                  <div className="p-8 flex justify-center">
                    <RefreshCw size={24} className="text-gray-400 animate-spin" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-xs text-gray-400 border-b border-gray-800">
                          <th className="py-3 px-4 text-left">Index</th>
                          <th className="py-3 px-4 text-right">Value</th>
                          <th className="py-3 px-4 text-right">Change</th>
                          <th className="py-3 px-4 text-right">% Change</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800">
                        {marketData.map((item) => (
                          <tr key={item.index} className="text-white">
                            <td className="py-3 px-4 text-left font-medium">{item.index}</td>
                            <td className="py-3 px-4 text-right">{item.value.toLocaleString()}</td>
                            <td className={`py-3 px-4 text-right ${
                              item.change >= 0 ? 'text-green-500' : 'text-red-500'
                            }`}>
                              {item.change >= 0 ? '+' : ''}{item.change.toFixed(2)}
                            </td>
                            <td className={`py-3 px-4 text-right ${
                              item.percentChange >= 0 ? 'text-green-500' : 'text-red-500'
                            }`}>
                              <div className="flex items-center justify-end">
                                {item.percentChange >= 0 ? 
                                  <ArrowUp size={14} className="mr-1" /> : 
                                  <ArrowDown size={14} className="mr-1" />
                                }
                                {item.percentChange >= 0 ? '+' : ''}{item.percentChange.toFixed(2)}%
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                
                <div className="p-3 border-t border-green-500 text-center">
                  <div className="text-xs text-gray-400 flex items-center justify-center">
                    <Clock size={12} className="mr-1" />
                    Last Updated: {new Date().toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right column - news & notifications */}
            <div className="space-y-6">
              {/* Recent Notifications */}
              <div className="bg-black rounded-xl shadow-sm overflow-hidden border border-green-500">
                <div className="p-4 border-b border-green-500 flex items-center justify-between">
                  <h2 className="text-base font-bold text-white">Notifications</h2>
                  {unreadNotifications > 0 && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-green-500 text-black rounded-full">
                      {unreadNotifications} new
                    </span>
                  )}
                </div>
                
                <div className="divide-y divide-gray-800">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-gray-400">
                      No notifications at this time
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div 
                        key={notification.id} 
                        className={`p-4 ${notification.isRead ? '' : 'bg-gray-800'}`}
                      >
                        <div className="flex justify-between mb-1">
                          <span className="font-medium text-white">{notification.title}</span>
                          <span className="text-xs text-gray-400">{notification.time}</span>
                        </div>
                        <p className="text-sm text-gray-300 mb-1">{notification.message}</p>
                        <div className="flex justify-end">
                          <button className="text-xs text-green-500">
                            View details
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              
              {/* Market news */}
              <div className="bg-black rounded-xl shadow-sm overflow-hidden border border-green-500">
                <div className="p-4 border-b border-green-500">
                  <h2 className="text-base font-bold text-white">Latest News</h2>
                </div>
                
                {dataFetchState.news ? (
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
        )}
        
        {activeTab === 'performance' && (
          <div className="bg-black rounded-xl shadow-sm overflow-hidden border border-green-500 mb-6">
            <div className="p-6 border-b border-green-500">
              <h2 className="text-lg font-bold text-white">Performance Metrics</h2>
              <p className="text-sm text-gray-400">Track your portfolio performance over time</p>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-gray-800 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-8 w-8 rounded-lg bg-black flex items-center justify-center">
                      <TrendingUp size={16} className="text-green-500" />
                    </div>
                    <span className="text-xs text-gray-400">Annual Return</span>
                  </div>
                  <p className="text-lg font-bold text-white">22.8%</p>
                  <p className="text-xs text-green-500">+4.2% vs S&P 500</p>
                </div>
                
                <div className="bg-gray-800 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-8 w-8 rounded-lg bg-black flex items-center justify-center">
                      <Calendar size={16} className="text-green-500" />
                    </div>
                    <span className="text-xs text-gray-400">Holding Period</span>
                  </div>
                  <p className="text-lg font-bold text-white">1.3 years</p>
                  <p className="text-xs text-gray-400">Avg across positions</p>
                </div>
                
                <div className="bg-gray-800 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-8 w-8 rounded-lg bg-black flex items-center justify-center">
                      <Percent size={16} className="text-green-500" />
                    </div>
                    <span className="text-xs text-gray-400">Total Gain</span>
                  </div>
                  <p className="text-lg font-bold text-white">${totalReturn.toLocaleString()}</p>
                  <p className="text-xs text-green-500">{totalReturnPercent.toFixed(2)}% up</p>
                </div>
              </div>
              
              <div className="border-t border-gray-800 pt-6 mb-6">
                <div className="flex justify-between mb-2">
                  <h3 className="text-sm font-medium text-white">Performance Comparison</h3>
                  <span className="text-xs text-gray-400">Last 12 months</span>
                </div>
                <div className="space-y-4 mt-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-white">Your Portfolio</span>
                      <span className="text-sm text-green-500">+22.8%</span>
                    </div>
                    <div className="bg-gray-800 h-2 rounded-full">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '76%' }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-white">S&P 500</span>
                      <span className="text-sm text-green-500">+18.6%</span>
                    </div>
                    <div className="bg-gray-800 h-2 rounded-full">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '62%' }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-white">Nasdaq</span>
                      <span className="text-sm text-green-500">+24.1%</span>
                    </div>
                    <div className="bg-gray-800 h-2 rounded-full">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '80%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-800 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-white mb-4">Monthly Returns</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { month: 'Jan', return: 2.4 },
                        { month: 'Feb', return: 3.8 },
                        { month: 'Mar', return: 4.2 },
                        { month: 'Apr', return: 1.9 },
                        { month: 'May', return: 2.7 },
                        { month: 'Jun', return: -1.2 },
                        { month: 'Jul', return: 3.1 },
                        { month: 'Aug', return: 2.3 },
                        { month: 'Sep', return: 1.1 },
                        { month: 'Oct', return: 0.8 },
                        { month: 'Nov', return: 1.9 },
                        { month: 'Dec', return: 2.3 }
                      ]}
                      margin={{ top: 10, right: 30, left: 0, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: '#9CA3AF' }}
                        tickFormatter={(value) => `${value}%`}
                      />
                      <Tooltip
                        formatter={(value) => [`${value}%`, 'Return']}
                        contentStyle={{ backgroundColor: '#000', border: '1px solid #10B981' }}
                      />
                      <Bar
                        dataKey="return"
                        radius={[4, 4, 0, 0]}
                        fill={(data) => data.return >= 0 ? '#10B981' : '#EF4444'}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'news' && (
          <div className="bg-black rounded-xl shadow-sm overflow-hidden border border-green-500 mb-6">
            <div className="p-6 border-b border-green-500">
              <h2 className="text-lg font-bold text-white">Market News</h2>
              <p className="text-sm text-gray-400">Latest updates from the financial world</p>
            </div>
            
            {dataFetchState.news ? (
              <div className="p-20 flex justify-center">
                <RefreshCw size={36} className="text-gray-400 animate-spin" />
              </div>
            ) : (
              <div className="p-6">
                <div className="grid grid-cols-1 gap-6">
                  {news.map((item) => (
                    <div 
                      key={item.id} 
                      className="p-4 border border-gray-800 rounded-lg hover:bg-gray-800 cursor-pointer"
                    >
                      <div className="flex justify-between mb-1">
                        <span className="font-medium text-white">{item.headline}</span>
                        <span className="text-xs text-gray-400">{formatDate(item.datetime)}</span>
                      </div>
                      <p className="text-sm text-gray-400 mb-3">{item.summary}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-green-500">{item.source}</span>
                        <a 
                          href={item.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-xs text-green-500 hover:underline"
                        >
                          Read more →
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-70 backdrop-blur-sm" 
            onClick={resetDepositForm}
          ></div>
          
          {/* Modal */}
          <div className="relative bg-black border border-green-500 rounded-xl shadow-lg w-full max-w-md overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-green-500 flex justify-between items-center">
              <h2 className="text-lg font-bold text-white">Deposit Funds</h2>
              <button 
                onClick={resetDepositForm}
                className="p-1 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Content */}
            <div className="p-6">
              {depositSuccess ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="h-16 w-16 rounded-full bg-green-900/30 flex items-center justify-center mb-4">
                    <DollarSign size={32} className="text-green-500" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Deposit Successful</h3>
                  <p className="text-gray-400 text-center mb-6">
                    Your deposit of ${parseFloat(depositAmount).toLocaleString()} is being processed
                  </p>
                  <button
                    onClick={resetDepositForm}
                    className="px-6 py-2 bg-green-500 text-black font-medium rounded-lg hover:bg-green-600"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handleDepositSubmit}>
                  {/* Amount */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Amount to Deposit
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <DollarSign size={16} className="text-gray-400" />
                      </div>
                      <input
                        type="number"
                        className="w-full pl-10 p-3 border border-gray-700 rounded-lg bg-black text-white focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="Enter amount"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        min="1"
                        step="1"
                        required
                      />
                    </div>
                    
                    {/* Quick amounts */}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {quickAmounts.map((quickAmount) => (
                        <button
                          key={quickAmount}
                          type="button"
                          className="px-3 py-1 text-xs font-medium rounded-md bg-gray-800 text-gray-300 hover:bg-gray-700"
                          onClick={() => setDepositAmount(quickAmount.toString())}
                        >
                          ${quickAmount}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Payment Method */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Payment Method
                    </label>
                    <div className="space-y-3">
                      {paymentMethods.map((method) => (
                        <div
                          key={method.id}
                          className={`flex items-start p-4 border rounded-lg cursor-pointer transition-colors ${
                            depositMethod === method.id
                              ? 'bg-gray-800 border-green-500'
                              : 'border-gray-700 hover:bg-gray-800'
                          }`}
                          onClick={() => setDepositMethod(method.id)}
                        >
                          <div>
                            <div className="text-sm font-medium text-white">
                              {method.name}
                              {depositMethod === method.id && (
                                <span className="ml-2 inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                              )}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              {method.description}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={depositProcessing || !depositAmount || !depositMethod}
                    className={`w-full px-4 py-3 font-medium rounded-lg flex items-center justify-center ${
                      depositProcessing || !depositAmount || !depositMethod
                        ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                        : 'bg-green-500 text-black hover:bg-green-600'
                    }`}
                  >
                    {depositProcessing ? (
                      <>
                        <span className="inline-block h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin mr-2"></span>
                        Processing...
                      </>
                    ) : (
                      <>
                        {depositAmount && depositMethod ? `Deposit ${parseFloat(depositAmount).toLocaleString()}` : 'Deposit'}
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );