'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  ArrowUp, 
  ArrowDown, 
  Plus,
  Filter,
  RefreshCw,
  X,
  Save,
  DollarSign,
  Trash2
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { fetchMultipleStocks, searchStocks } from '../../services/StockService';
import config from '../../config';

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
  const [holdings, setHoldings] = useState<Holding[]>([]);
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

  // Load portfolio from localStorage and update with current prices
  useEffect(() => {
    setIsLoading(true);
    try {
      const savedPortfolio = localStorage.getItem('portfolio');
      const initialHoldings = savedPortfolio ? JSON.parse(savedPortfolio) : [];
      
      if (initialHoldings.length > 0) {
        const symbols = initialHoldings.map((holding: Holding) => holding.symbol);
        fetchCurrentPrices(symbols, initialHoldings);
      } else {
        setHoldings([]);
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Error loading portfolio:', err);
      setError('Failed to load portfolio data.');
      setIsLoading(false);
    }
  }, []);

  // Fetch current stock prices
  const fetchCurrentPrices = async (symbols: string[], initialHoldings: any[]) => {
    try {
      // Using fetchMultipleStocks instead of getStockQuotes
      const quotes = await fetchMultipleStocks(symbols);
      
      // Update holdings with current prices
      const updatedHoldings = initialHoldings.map((holding: Holding) => {
        const quote = quotes.find(q => q.symbol === holding.symbol);
        const currentPrice = quote ? quote.price : holding.currentPrice;
        
        const value = currentPrice * holding.shares;
        const gain = (currentPrice - holding.avgCost) * holding.shares;
        const gainPercent = ((currentPrice - holding.avgCost) / holding.avgCost) * 100;
        
        return { ...holding, currentPrice, value, gain, gainPercent };
      });
      
      // Calculate weights
      const totalValue = updatedHoldings.reduce((sum, h) => sum + h.value, 0);
      const holdingsWithWeights = updatedHoldings.map(h => ({
        ...h,
        weight: totalValue > 0 ? (h.value / totalValue) * 100 : 0
      }));
      
      setHoldings(holdingsWithWeights);
    } catch (err) {
      console.error('Error fetching prices:', err);
      setError('Failed to update prices.');
    } finally {
      setIsLoading(false);
    }
  };

  // Search for stocks
  const handleSearchStocks = async (query: string) => {
    if (!query) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    try {
      // Using the searchStocks function from StockService
      const results = await searchStocks(query);
      setSearchResults(results);
    } catch (err) {
      console.error('Error searching stocks:', err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Add new position
  const addPosition = async () => {
    if (!newPosition.symbol || !newPosition.shares || !newPosition.avgCost) return;
    
    const shares = parseFloat(newPosition.shares);
    const avgCost = parseFloat(newPosition.avgCost);
    
    if (isNaN(shares) || isNaN(avgCost) || shares <= 0 || avgCost <= 0) return;
    
    try {
      // Get current price
      const quotes = await fetchMultipleStocks([newPosition.symbol]);
      const quote = quotes[0];
      
      if (!quote || quote.error) throw new Error('Could not fetch current price');
      
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
        weight: 0,
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
    if (confirm(`Remove ${symbol} from your portfolio?`)) {
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
    }
  };

  // Refresh portfolio data
  const refreshPortfolio = async () => {
    if (holdings.length === 0) return;
    
    setIsLoading(true);
    const symbols = holdings.map(h => h.symbol);
    fetchCurrentPrices(symbols, holdings);
  };

  // Calculate total portfolio value
  const totalValue = holdings.reduce((total, stock) => total + stock.value, 0);
  
  // Custom tooltip for chart
  const CustomTooltip = ({ active, payload }: any) => {
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
                  <XAxis dataKey="date" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `$${value.toLocaleString()}`} />
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#374151" />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="value" stroke="#10B981" fill="url(#colorValue)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        
        {/* Holdings section with action buttons */}
        <div className="flex justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Your Holdings</h2>
          <div className="flex gap-2">
            <button 
              onClick={refreshPortfolio}
              className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 flex items-center"
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
        
        {/* Holdings table */}
        <div className="bg-black rounded-xl shadow-sm overflow-hidden border border-green-500">
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
      </div>
      
      {/* Add Position Modal */}
      {showAddPositionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black bg-opacity-70 backdrop-blur-sm" onClick={() => setShowAddPositionModal(false)}></div>
          <div className="relative bg-black border border-green-500 rounded-xl shadow-lg w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-green-500 flex justify-between items-center">
              <h2 className="text-lg font-bold text-white">Add Position</h2>
              <button onClick={() => setShowAddPositionModal(false)} className="p-1 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <form onSubmit={(e) => { e.preventDefault(); addPosition(); }}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Stock Symbol</label>
                  <div className="relative">
                    <input
                      type="text"
                      className="w-full p-3 border border-gray-700 rounded-lg bg-black text-white focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Enter stock symbol (e.g. AAPL)"
                      value={newPosition.symbol}
                      onChange={(e) => {
                        setNewPosition({...newPosition, symbol: e.target.value.toUpperCase()});
                        handleSearchStocks(e.target.value);
                      }}
                      required
                    />
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
                              onClick={() => {
                                setNewPosition({...newPosition, symbol: result.symbol, name: result.name});
                                setSearchResults([]);
                              }}
                            >
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="font-medium text-white">{result.symbol}</div>
                                  <div className="text-sm text-gray-400">{result.name}</div>
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
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Company Name</label>
                  <input
                    type="text"
                    className="w-full p-3 border border-gray-700 rounded-lg bg-black text-white focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Company name"
                    value={newPosition.name}
                    onChange={(e) => setNewPosition({...newPosition, name: e.target.value})}
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Number of Shares</label>
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
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Average Cost per Share</label>
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