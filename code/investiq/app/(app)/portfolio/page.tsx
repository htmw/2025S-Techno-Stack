'use client';

import React, { useState, useEffect } from 'react';
import { 
  PieChart, 
  BarChart3, 
  ArrowUp, 
  ArrowDown, 
  Plus,
  Filter,
  LineChart as LineChartIcon,
  TrendingUp,
  Calendar,
  MoreHorizontal,
  X,
  Save,
  RefreshCw
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import HistoricalTrends from '../../components/HistoricalTrends';
import { getStockQuotes } from '../../services/StockService';
import config from '../../config';

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

export default function Portfolio() {
  const [timeRange, setTimeRange] = useState('3M');
  const [viewMode, setViewMode] = useState('holdings');
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [sectorData, setSectorData] = useState<{ name: string; value: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddPositionModal, setShowAddPositionModal] = useState(false);
  const [newPosition, setNewPosition] = useState({ symbol: '', name: '', shares: '', avgCost: '' });
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
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

  // Time range options
  const timeRanges = ['1M', '3M', '6M', 'YTD', '1Y', 'All'];

  // Colors for pie chart
  const COLORS = ['#10B981', '#34D399', '#6EE7B7', '#1E40AF', '#3B82F6', '#93C5FD'];

  // Load portfolio from localStorage
  useEffect(() => {
    setIsLoading(true);
    
    try {
      // Get portfolio from localStorage or use empty array
      const savedPortfolio = localStorage.getItem('portfolio');
      const initialHoldings = savedPortfolio ? JSON.parse(savedPortfolio) : [];
      
      if (initialHoldings.length > 0) {
        // Extract symbols to fetch latest prices
        const symbols = initialHoldings.map((holding: Holding) => holding.symbol);
        
        // Fetch current stock data from API
        fetchCurrentPrices(symbols, initialHoldings);
      } else {
        setHoldings([]);
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Error loading portfolio data:', err);
      setError('Failed to load portfolio data.');
      setIsLoading(false);
    }
  }, []);

  // Fetch current stock prices
  const fetchCurrentPrices = async (symbols: string[], initialHoldings: any[]) => {
    try {
      const quotes = await getStockQuotes(symbols);
      
      // Create updated holdings with current prices
      const updatedHoldings = initialHoldings.map((holding: Holding) => {
        const quote = quotes.find(q => q.symbol === holding.symbol);
        const currentPrice = quote ? quote.price : holding.currentPrice;
        
        // Calculate values based on current price
        const value = currentPrice * holding.shares;
        const gain = (currentPrice - holding.avgCost) * holding.shares;
        const gainPercent = ((currentPrice - holding.avgCost) / holding.avgCost) * 100;
        
        return {
          ...holding,
          currentPrice,
          value,
          gain,
          gainPercent
        };
      });
      
      // Calculate weights based on total portfolio value
      const totalValue = updatedHoldings.reduce((sum, h) => sum + h.value, 0);
      const holdingsWithWeights = updatedHoldings.map(h => ({
        ...h,
        weight: totalValue > 0 ? (h.value / totalValue) * 100 : 0
      }));
      
      setHoldings(holdingsWithWeights);
      calculateSectorAllocation(holdingsWithWeights);
    } catch (err) {
      console.error('Error fetching current prices:', err);
      setError('Failed to update current prices.');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate sector allocation
  const calculateSectorAllocation = (holdings: Holding[]) => {
    const sectorMap: Record<string, number> = {};
    
    // Map companies to sectors (in a real app, this would come from API)
    const sectorsBySymbol: Record<string, string> = {
      AAPL: 'Technology',
      MSFT: 'Technology',
      GOOGL: 'Technology',
      AMZN: 'Consumer',
      NVDA: 'Technology',
      JPM: 'Finance',
      TSLA: 'Automotive',
      META: 'Technology',
      JNJ: 'Healthcare',
      WMT: 'Consumer',
      PG: 'Consumer',
      V: 'Finance',
      BAC: 'Finance',
      MA: 'Finance',
      DIS: 'Entertainment',
      NFLX: 'Entertainment',
      INTC: 'Technology',
      AMD: 'Technology',
      CSCO: 'Technology',
      IBM: 'Technology',
      ORCL: 'Technology',
      CRM: 'Technology',
      ADBE: 'Technology'
    };
    
    // Calculate value by sector
    holdings.forEach(holding => {
      const sector = sectorsBySymbol[holding.symbol] || 'Other';
      sectorMap[sector] = (sectorMap[sector] || 0) + holding.value;
    });
    
    // Convert to array format for chart
    const sectorAllocation = Object.entries(sectorMap).map(([name, value]) => ({
      name,
      value: Number(((value / holdings.reduce((sum, h) => sum + h.value, 0)) * 100).toFixed(1))
    }));
    
    setSectorData(sectorAllocation);
  };

  // Search for stocks
  const searchStocks = async (query: string) => {
    if (!query) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    
    try {
      const response = await fetch(
        `https://finnhub.io/api/v1/search?q=${encodeURIComponent(query)}&token=${config.finnhubApiKey}`
      );
      
      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.result && Array.isArray(data.result)) {
        const stocks = data.result
          .filter((item: any) => item.type === 'Common Stock')
          .slice(0, 5);
          
        setSearchResults(stocks);
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      console.error('Error searching stocks:', err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle selecting stock from search results
  const selectStock = (stock: any) => {
    setNewPosition({
      ...newPosition,
      symbol: stock.symbol,
      name: stock.description
    });
    setSearchResults([]);
  };

  // Add new position
  const addPosition = async () => {
    if (!newPosition.symbol || !newPosition.shares || !newPosition.avgCost) {
      return;
    }
    
    const shares = parseFloat(newPosition.shares);
    const avgCost = parseFloat(newPosition.avgCost);
    
    if (isNaN(shares) || isNaN(avgCost) || shares <= 0 || avgCost <= 0) {
      return;
    }
    
    try {
      // Get current price
      const quotes = await getStockQuotes([newPosition.symbol]);
      const quote = quotes[0];
      
      if (!quote || quote.error) {
        throw new Error('Could not fetch current price');
      }
      
      // Create new holding
      const currentPrice = quote.price;
      const value = currentPrice * shares;
      const gain = (currentPrice - avgCost) * shares;
      const gainPercent = ((currentPrice - avgCost) / avgCost) * 100;
      
      const newHolding: Holding = {
        symbol: newPosition.symbol,
        name: newPosition.name,
        shares,
        avgCost,
        currentPrice,
        value,
        weight: 0, // Will be calculated
        gain,
        gainPercent
      };
      
      // Add to holdings
      const updatedHoldings = [...holdings, newHolding];
      
      // Recalculate weights
      const totalValue = updatedHoldings.reduce((sum, h) => sum + h.value, 0);
      const holdingsWithWeights = updatedHoldings.map(h => ({
        ...h,
        weight: (h.value / totalValue) * 100
      }));
      
      // Update state and localStorage
      setHoldings(holdingsWithWeights);
      localStorage.setItem('portfolio', JSON.stringify(holdingsWithWeights));
      
      // Update sector allocation
      calculateSectorAllocation(holdingsWithWeights);
      
      // Reset form and close modal
      setNewPosition({ symbol: '', name: '', shares: '', avgCost: '' });
      setShowAddPositionModal(false);
    } catch (err) {
      console.error('Error adding position:', err);
      alert('Failed to add position. Please try again.');
    }
  };

  // Remove position
  const removePosition = (symbol: string) => {
    if (confirm(`Are you sure you want to remove ${symbol} from your portfolio?`)) {
      const updatedHoldings = holdings.filter(h => h.symbol !== symbol);
      
      // Recalculate weights
      const totalValue = updatedHoldings.reduce((sum, h) => sum + h.value, 0);
      const holdingsWithWeights = updatedHoldings.map(h => ({
        ...h,
        weight: totalValue > 0 ? (h.value / totalValue) * 100 : 0
      }));
      
      // Update state and localStorage
      setHoldings(holdingsWithWeights);
      localStorage.setItem('portfolio', JSON.stringify(holdingsWithWeights));
      
      // Update sector allocation
      calculateSectorAllocation(holdingsWithWeights);
    }
  };

  // Refresh portfolio data
  const refreshPortfolio = async () => {
    if (holdings.length === 0) return;
    
    setIsLoading(true);
    const symbols = holdings.map(h => h.symbol);
    fetchCurrentPrices(symbols, holdings);
  };

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

  // Calculate total portfolio value
  const totalValue = holdings.reduce((total, stock) => total + stock.value, 0);

  return (
    <div className="p-0">
      {/* Page header */}
      <div className="px-6 py-4 bg-black text-white border-b border-green-500">
        <h1 className="text-xl font-bold">Portfolio</h1>
      </div>
      
      <div className="p-6 bg-gray-900">
        {/* Portfolio overview */}
        <div className="bg-black rounded-xl shadow-sm overflow-hidden border border-green-500 mb-6">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-white">Portfolio Value</h2>
                <div className="flex items-baseline gap-2 mt-1">
                  {isLoading ? (
                    <div className="flex items-center">
                      <RefreshCw size={16} className="text-gray-400 animate-spin mr-2" />
                      <span className="text-gray-400">Updating...</span>
                    </div>
                  ) : (
                    <>
                      <span className="text-2xl font-bold text-white">${totalValue.toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
                      <span className="text-green-500 flex items-center text-sm font-medium">
                        <ArrowUp size={14} className="mr-1" />
                        {holdings.length > 0 ? 
                          `${(holdings.reduce((sum, h) => sum + h.gain, 0) / (totalValue - holdings.reduce((sum, h) => sum + h.gain, 0)) * 100).toFixed(2)}%` : 
                          '0.00%'
                        }
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
              <ResponsiveContainer>
                <LineChart data={performanceData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
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
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#10B981"
                    fillOpacity={1}
                    fill="url(#colorValue)"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Key metrics */}
          <div className="grid grid-cols-4 divide-x divide-green-500 border-t border-green-500">
            <div className="p-4 text-center">
              <p className="text-xs text-gray-400 mb-1">Initial Investment</p>
              <p className="text-lg font-bold text-white">
                ${holdings.reduce((sum, h) => sum + (h.avgCost * h.shares), 0).toLocaleString(undefined, {maximumFractionDigits: 2})}
              </p>
            </div>
            <div className="p-4 text-center">
              <p className="text-xs text-gray-400 mb-1">Total Gain</p>
              <p className="text-lg font-bold text-green-500">
                ${holdings.reduce((sum, h) => sum + h.gain, 0).toLocaleString(undefined, {maximumFractionDigits: 2})}
              </p>
              <p className="text-xs text-green-500">
                {holdings.length > 0 ? 
                  `+${(holdings.reduce((sum, h) => sum + h.gain, 0) / (totalValue - holdings.reduce((sum, h) => sum + h.gain, 0)) * 100).toFixed(2)}%` : 
                  '+0.00%'
                }
              </p>
            </div>
            <div className="p-4 text-center">
              <p className="text-xs text-gray-400 mb-1">Annual Return</p>
              <p className="text-lg font-bold text-green-500">
                {holdings.length > 0 ? '+22.8%' : '+0.00%'}
              </p>
            </div>
            <div className="p-4 text-center">
              <p className="text-xs text-gray-400 mb-1">Dividend Yield</p>
              <p className="text-lg font-bold text-white">
                {holdings.length > 0 ? '1.8%' : '0.00%'}
              </p>
            </div>
          </div>
        </div>
        
        {/* View toggle and actions */}
        <div className="flex justify-between mb-4">
          <div className="flex bg-black rounded-lg border border-green-500 p-1">
            <button
              className={`px-4 py-2 text-sm rounded-md flex items-center ${
                viewMode === 'holdings' 
                  ? 'bg-green-500 text-black font-medium' 
                  : 'text-gray-400 hover:text-white'
              }`}
              onClick={() => setViewMode('holdings')}
            >
              <BarChart3 size={16} className="mr-2" />
              Holdings
            </button>
            <button
              className={`px-4 py-2 text-sm rounded-md flex items-center ${
                viewMode === 'allocation' 
                  ? 'bg-green-500 text-black font-medium' 
                  : 'text-gray-400 hover:text-white'
              }`}
              onClick={() => setViewMode('allocation')}
            >
              <PieChart size={16} className="mr-2" />
              Allocation
            </button>
            <button
              className={`px-4 py-2 text-sm rounded-md flex items-center ${
                viewMode === 'performance' 
                  ? 'bg-green-500 text-black font-medium' 
                  : 'text-gray-400 hover:text-white'
              }`}
              onClick={() => setViewMode('performance')}
            >
              <LineChartIcon size={16} className="mr-2" />
              Performance
            </button>
            <button
              className={`px-4 py-2 text-sm rounded-md flex items-center ${
                viewMode === 'trends' 
                  ? 'bg-green-500 text-black font-medium' 
                  : 'text-gray-400 hover:text-white'
              }`}
              onClick={() => setViewMode('trends')}
            >
              <TrendingUp size={16} className="mr-2" />
              Trends
            </button>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={refreshPortfolio}
              className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 flex items-center font-medium"
              disabled={isLoading || holdings.length === 0}
            >
              <RefreshCw size={16} className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button 
              onClick={() => setShowAddPositionModal(true)}
              className="px-4 py-2 bg-green-500 text-black rounded-lg hover:bg-green-600 flex items-center font-medium"
            >
              <Plus size={16} className="mr-2" />
              Add Position
            </button>
          </div>
        </div>
        
        {/* Main content based on view mode */}
        {viewMode === 'holdings' && (
          <div className="bg-black rounded-xl shadow-sm overflow-hidden border border-green-500">
            <div className="p-4 flex items-center justify-between border-b border-green-500">
              <h2 className="text-base font-bold text-white">Your Holdings</h2>
              <button className="p-1 rounded-lg hover:bg-gray-800 text-gray-300">
                <Filter size={16} />
              </button>
            </div>
            
            {isLoading ? (
              <div className="p-8 flex justify-center">
                <RefreshCw size={24} className="text-gray-400 animate-spin" />
              </div>
            ) : holdings.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-400 mb-4">You don't have any positions yet.</p>
                <button 
                  onClick={() => setShowAddPositionModal(true)}
                  className="px-4 py-2 bg-green-500 text-black rounded-lg hover:bg-green-600 inline-flex items-center font-medium"
                >
                  <Plus size={16} className="mr-2" />
                  Add Your First Position
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-xs text-gray-400 border-b border-gray-800">
                      <th className="py-3 px-4 text-left">Symbol</th>
                      <th className="py-3 px-4 text-left">Name</th>
                      <th className="py-3 px-4 text-right">Shares</th>
                      <th className="py-3 px-4 text-right">Avg. Cost</th>
                      <th className="py-3 px-4 text-right">Price</th>
                      <th className="py-3 px-4 text-right">Value</th>
                      <th className="py-3 px-4 text-right">Weight</th>
                      <th className="py-3 px-4 text-right">Gain/Loss</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {holdings.map((stock) => (
                      <tr key={stock.symbol} className="hover:bg-gray-800 text-white">
                        <td className="py-3 px-4 text-left font-medium">{stock.symbol}</td>
                        <td className="py-3 px-4 text-left text-gray-300">{stock.name}</td>
                        <td className="py-3 px-4 text-right">{stock.shares}</td>
                        <td className="py-3 px-4 text-right">${stock.avgCost.toFixed(2)}</td>
                        <td className="py-3 px-4 text-right">${stock.currentPrice.toFixed(2)}</td>
                        <td className="py-3 px-4 text-right font-medium">${stock.value.toFixed(2)}</td>
                        <td className="py-3 px-4 text-right">{stock.weight.toFixed(1)}%</td>
                        <td className="py-3 px-4 text-right">
                          <div className={`flex items-center justify-end ${stock.gain >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {stock.gain >= 0 ? <ArrowUp size={14} className="mr-1" /> : <ArrowDown size={14} className="mr-1" />}
                            ${Math.abs(stock.gain).toFixed(2)} ({Math.abs(stock.gainPercent).toFixed(2)}%)
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            className="p-1 rounded-full hover:bg-red-900/30 text-red-500"
                            onClick={() => removePosition(stock.symbol)}
                            title="Remove position"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        
        {viewMode === 'allocation' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-black rounded-xl shadow-sm border border-green-500 p-6">
              <h2 className="text-base font-bold mb-6 text-white">Sector Allocation</h2>
              {isLoading ? (
                <div className="h-72 flex items-center justify-center">
                  <RefreshCw size={24} className="text-gray-400 animate-spin" />
                </div>
              ) : holdings.length === 0 ? (
                <div className="h-72 flex items-center justify-center">
                  <p className="text-gray-400">Add positions to see your allocation.</p>
                </div>
              ) : (
                <div className="h-72">
                  <ResponsiveContainer>
                    <RechartsPieChart>
                      <Pie
                        data={sectorData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={110}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {sectorData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Legend formatter={(value) => <span className="text-white">{value}</span>} />
                      <Tooltip 
                        formatter={(value) => [`${value}%`, 'Allocation']}
                        contentStyle={{ backgroundColor: '#000000', border: '1px solid #10B981', color: '#FFFFFF' }}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
            
            <div className="bg-black rounded-xl shadow-sm border border-green-500 p-6">
              <h2 className="text-base font-bold mb-6 text-white">Allocation Summary</h2>
              {isLoading ? (
                <div className="h-72 flex items-center justify-center">
                  <RefreshCw size={24} className="text-gray-400 animate-spin" />
                </div>
              ) : holdings.length === 0 ? (
                <div className="h-72 flex items-center justify-center">
                  <p className="text-gray-400">Add positions to see your allocation.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-400">By Risk Level</span>
                    </div>
                    <div className="bg-gray-800 h-4 rounded-full">
                      <div className="bg-green-500 h-4 rounded-full" style={{ width: '65%' }}></div>
                    </div>
                    <div className="flex justify-between mt-1 text-xs">
                      <span className="text-white">Low 25%</span>
                      <span className="text-white">Medium 40%</span>
                      <span className="text-white">High 35%</span>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-400">By Asset Type</span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-white">Stocks</span>
                        <span className="text-sm text-white">87.2%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-white">Bonds</span>
                        <span className="text-sm text-white">8.5%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-white">Cash</span>
                        <span className="text-sm text-white">4.3%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-800">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-400">Portfolio Diversification</span>
                      <span className="text-sm text-green-500">Medium</span>
                    </div>
                    <p className="text-xs text-gray-400">
                      Your portfolio has a medium diversification level. Consider adding more assets from different sectors to reduce risk.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {viewMode === 'performance' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-black rounded-xl shadow-sm border border-green-500 p-6">
              <h2 className="text-base font-bold mb-6 text-white">Performance Metrics</h2>
              {isLoading ? (
                <div className="h-72 flex items-center justify-center">
                  <RefreshCw size={24} className="text-gray-400 animate-spin" />
                </div>
              ) : holdings.length === 0 ? (
                <div className="h-72 flex items-center justify-center">
                  <p className="text-gray-400">Add positions to see your performance metrics.</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-6 mb-6">
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
                  </div>
                  
                  <div className="border-t border-gray-800 pt-6">
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
                </>
              )}
            </div>
            
            <div className="bg-black rounded-xl shadow-sm border border-green-500 p-6">
              <h2 className="text-base font-bold mb-6 text-white">Top Performers</h2>
              {isLoading ? (
                <div className="h-72 flex items-center justify-center">
                  <RefreshCw size={24} className="text-gray-400 animate-spin" />
                </div>
              ) : holdings.length === 0 ? (
                <div className="h-72 flex items-center justify-center">
                  <p className="text-gray-400">Add positions to see top performers.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {holdings
                    .sort((a, b) => b.gainPercent - a.gainPercent)
                    .slice(0, 3)
                    .map((stock) => (
                      <div key={stock.symbol} className="p-3 bg-gray-800 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white">{stock.symbol}</span>
                              <span className="text-xs text-gray-400">{stock.name}</span>
                            </div>
                            <div className="flex items-center mt-1">
                              <span className="text-sm font-medium text-white">${stock.currentPrice.toFixed(2)}</span>
                            </div>
                          </div>
                          
                          <div className="text-green-500 flex items-center text-sm">
                            <ArrowUp size={14} className="mr-1" />
                            {stock.gainPercent.toFixed(2)}%
                          </div>
                        </div>
                        
                        <div className="mt-2">
                          <div className="text-xs text-gray-400 mb-1">Total Gain</div>
                          <div className="text-sm text-white">+${stock.gain.toFixed(2)}</div>
                        </div>
                      </div>
                    ))}
                  
                  <div className="pt-4 mt-4 border-t border-gray-800">
                    <h3 className="text-sm font-medium text-white mb-3">Unrealized Gains</h3>
                    <div className="flex justify-between">
                      <span className="text-sm text-white">Short Term</span>
                      <span className="text-sm text-green-500">+${(holdings.reduce((sum, h) => sum + h.gain, 0) * 0.25).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between mt-2">
                      <span className="text-sm text-white">Long Term</span>
                      <span className="text-sm text-green-500">+${(holdings.reduce((sum, h) => sum + h.gain, 0) * 0.75).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {viewMode === 'trends' && (
          <HistoricalTrends />
        )}
      </div>
      
      {/* Add Position Modal */}
      {showAddPositionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-70 backdrop-blur-sm" 
            onClick={() => setShowAddPositionModal(false)}
          ></div>
          
          {/* Modal */}
          <div className="relative bg-black border border-green-500 rounded-xl shadow-lg w-full max-w-md overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-green-500 flex justify-between items-center">
              <h2 className="text-lg font-bold text-white">Add Position</h2>
              <button 
                onClick={() => setShowAddPositionModal(false)}
                className="p-1 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Content */}
            <div className="p-6">
              <form onSubmit={(e) => { e.preventDefault(); addPosition(); }}>
                {/* Symbol/Stock */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Stock Symbol
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      className="w-full p-3 border border-gray-700 rounded-lg bg-black text-white focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Enter stock symbol (e.g. AAPL)"
                      value={newPosition.symbol}
                      onChange={(e) => {
                        setNewPosition({...newPosition, symbol: e.target.value.toUpperCase()});
                        searchStocks(e.target.value);
                      }}
                      required
                    />
                    
                    {/* Search results dropdown */}
                    {searchResults.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-black border border-green-500 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {isSearching ? (
                          <div className="p-3 flex justify-center">
                            <RefreshCw size={16} className="text-gray-400 animate-spin" />
                          </div>
                        ) : (
                          searchResults.map((result) => (
                            <div
                              key={result.symbol}
                              className="p-3 hover:bg-gray-800 cursor-pointer border-b border-gray-800 last:border-b-0"
                              onClick={() => selectStock(result)}
                            >
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="font-medium text-white">{result.symbol}</div>
                                  <div className="text-sm text-gray-400">{result.description}</div>
                                </div>
                                <div className="text-xs text-gray-500">{result.type}</div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Company Name */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Company Name
                  </label>
                  <input
                    type="text"
                    className="w-full p-3 border border-gray-700 rounded-lg bg-black text-white focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Company name"
                    value={newPosition.name}
                    onChange={(e) => setNewPosition({...newPosition, name: e.target.value})}
                    required
                  />
                </div>
                
                {/* Shares */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Number of Shares
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    className="w-full p-3 border border-gray-700 rounded-lg bg-black text-white focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Number of shares"
                    value={newPosition.shares}
                    onChange={(e) => setNewPosition({...newPosition, shares: e.target.value})}
                    required
                  />
                </div>
                
                {/* Average Cost */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Average Cost per Share
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <DollarSign size={16} className="text-gray-400" />
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      className="w-full pl-10 p-3 border border-gray-700 rounded-lg bg-black text-white focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Cost per share"
                      value={newPosition.avgCost}
                      onChange={(e) => setNewPosition({...newPosition, avgCost: e.target.value})}
                      required
                    />
                  </div>
                </div>
                
                {/* Submit */}
                <button
                  type="submit"
                  className="w-full px-4 py-3 bg-green-500 text-black font-medium rounded-lg hover:bg-green-600 flex items-center justify-center"
                >
                  <Save size={16} className="mr-2" />
                  Add to Portfolio
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}