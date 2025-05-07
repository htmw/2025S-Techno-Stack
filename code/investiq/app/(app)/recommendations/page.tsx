'use client';

import React, { useState, useEffect } from 'react';
import { 
  Target, 
  RefreshCw,
  AlertTriangle,
  Info,
  BarChart3
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import config from '../../config';

// Simple type definitions
interface Recommendation {
  period: string;
  strongBuy: number;
  buy: number;
  hold: number;
  sell: number;
  strongSell: number;
}

interface StockData {
  symbol: string;
  name: string;
  sector: string;
  recommendations: Recommendation[];
  isLoading: boolean;
  error?: string;
}

// List of popular stocks
const STOCKS = [
  { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', sector: 'Technology' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', sector: 'Technology' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', sector: 'Consumer' },
  { symbol: 'TSLA', name: 'Tesla, Inc.', sector: 'Automotive' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', sector: 'Technology' },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', sector: 'Finance' },
  { symbol: 'JNJ', name: 'Johnson & Johnson', sector: 'Healthcare' },
  { symbol: 'META', name: 'Meta Platforms Inc.', sector: 'Technology' },
  { symbol: 'V', name: 'Visa Inc.', sector: 'Finance' }
];

export default function Recommendations() {
  const [selectedStock, setSelectedStock] = useState<StockData | null>(null);
  const [stockList, setStockList] = useState<StockData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Mock recommendation data for initial rendering
  const getMockRecommendation = (): Recommendation => ({
    period: new Date().toISOString().split('T')[0],
    strongBuy: Math.floor(Math.random() * 10) + 1,
    buy: Math.floor(Math.random() * 15) + 5,
    hold: Math.floor(Math.random() * 20) + 10,
    sell: Math.floor(Math.random() * 8),
    strongSell: Math.floor(Math.random() * 5)
  });
  
  // Fetch recommendations data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      // Initialize stock list with mock data to prevent loading state
      const initialStocks = STOCKS.map(stock => {
        // Create an array of 3 mock recommendations
        const mockRecommendations = Array(3).fill(null).map(() => getMockRecommendation());
        
        return {
          ...stock,
          recommendations: mockRecommendations,
          isLoading: false
        };
      });
      
      setStockList(initialStocks);
      setSelectedStock(initialStocks[0]);
      setIsLoading(false);
      
      // No need to actually fetch from API for demo purposes
      // The mock data will be displayed immediately
      
      // If you want to enable real API calls, uncomment the code below
      /*
      try {
        for (const stock of initialStocks) {
          try {
            // Fetch data from Finnhub
            const response = await fetch(
              `https://finnhub.io/api/v1/stock/recommendation?symbol=${stock.symbol}&token=${config.finnhubApiKey}`
            );
            
            if (!response.ok) {
              throw new Error(`API request failed: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Update this stock's data
            setStockList(prevList => 
              prevList.map(item => 
                item.symbol === stock.symbol 
                  ? { ...item, recommendations: data, isLoading: false }
                  : item
              )
            );
            
            // Update selected stock if needed
            if (selectedStock && selectedStock.symbol === stock.symbol) {
              setSelectedStock({ ...stock, recommendations: data, isLoading: false });
            }
            
            // Small delay to avoid rate limits
            await new Promise(resolve => setTimeout(resolve, 300));
            
          } catch (stockError) {
            console.error(`Error fetching data for ${stock.symbol}:`, stockError);
            setStockList(prevList => 
              prevList.map(item => 
                item.symbol === stock.symbol 
                  ? { ...item, isLoading: false, error: 'Failed to load' }
                  : item
              )
            );
          }
        }
      } catch (err: any) {
        console.error('Error loading recommendations:', err);
        setError(err.message || 'Failed to fetch data');
      } finally {
        setIsLoading(false);
      }
      */
    };
    
    fetchData();
  }, []);

  // Prepare data for the chart
  const getChartData = (stock: StockData) => {
    if (!stock.recommendations || stock.recommendations.length === 0) {
      return [];
    }
    
    // Get latest recommendation
    const latest = stock.recommendations[0];
    
    return [
      { name: 'Strong Buy', value: latest.strongBuy, color: '#10B981' },
      { name: 'Buy', value: latest.buy, color: '#6EE7B7' },
      { name: 'Hold', value: latest.hold, color: '#FBBF24' },
      { name: 'Sell', value: latest.sell, color: '#F87171' },
      { name: 'Strong Sell', value: latest.strongSell, color: '#EF4444' }
    ];
  };

  // Calculate consensus rating
  const getConsensus = (stock: StockData) => {
    if (!stock.recommendations || stock.recommendations.length === 0) {
      return "N/A";
    }
    
    const latest = stock.recommendations[0];
    const total = latest.strongBuy + latest.buy + latest.hold + latest.sell + latest.strongSell;
    
    if (total === 0) return "N/A";
    
    // Simple weighted average
    const score = (
      (latest.strongBuy * 5) + 
      (latest.buy * 4) + 
      (latest.hold * 3) + 
      (latest.sell * 2) + 
      (latest.strongSell * 1)
    ) / total;
    
    if (score >= 4.5) return "Strong Buy";
    if (score >= 3.5) return "Buy";
    if (score >= 2.5) return "Hold";
    if (score >= 1.5) return "Sell";
    return "Strong Sell";
  };
  
  // Get color for consensus
  const getConsensusColor = (consensus: string) => {
    switch (consensus) {
      case "Strong Buy": return "bg-green-900/30 text-green-400";
      case "Buy": return "bg-green-900/20 text-green-400";
      case "Hold": return "bg-yellow-900/30 text-yellow-400";
      case "Sell": return "bg-red-900/20 text-red-400";
      case "Strong Sell": return "bg-red-900/30 text-red-400";
      default: return "bg-gray-800 text-gray-400";
    }
  };

  return (
    <div className="p-0">
      {/* Page header */}
      <div className="px-6 py-4 bg-black text-white border-b border-green-500">
        <h1 className="text-xl font-bold">Analyst Recommendations</h1>
      </div>
      
      <div className="p-6 bg-gray-900">
        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-800 rounded-lg">
            <div className="flex items-start">
              <AlertTriangle className="text-red-500 mr-3 mt-0.5" size={20} />
              <p className="text-sm text-red-200">Error: {error}</p>
            </div>
          </div>
        )}
        
        <div className="bg-black rounded-xl shadow-sm mb-6 border border-green-500">
          <div className="p-6 border-b border-green-500">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gray-800 flex items-center justify-center">
                <Target className="text-green-500" size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Analyst Recommendations</h2>
                <p className="text-sm text-gray-400">Latest ratings for popular stocks</p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col lg:flex-row">
            {/* Stock List */}
            <div className="lg:w-1/3 border-r border-green-500">
              <div className="overflow-y-auto max-h-[600px]">
                {stockList.map((stock) => (
                  <div 
                    key={stock.symbol}
                    className={`p-4 border-b border-gray-800 cursor-pointer hover:bg-gray-800 ${
                      selectedStock?.symbol === stock.symbol ? 'bg-gray-800' : ''
                    }`}
                    onClick={() => setSelectedStock(stock)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{stock.symbol}</span>
                          <span className="text-xs text-gray-400">{stock.sector}</span>
                        </div>
                        <div className="text-sm text-gray-300">{stock.name}</div>
                      </div>
                      
                      {!stock.isLoading && !stock.error && stock.recommendations.length > 0 && (
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          getConsensusColor(getConsensus(stock))
                        }`}>
                          {getConsensus(stock)}
                        </span>
                      )}
                      
                      {stock.isLoading && (
                        <RefreshCw size={16} className="text-gray-400 animate-spin" />
                      )}
                      
                      {stock.error && (
                        <AlertTriangle size={16} className="text-yellow-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Stock Details */}
            <div className="lg:w-2/3 p-6">
              {!selectedStock ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-10">
                  <div className="h-16 w-16 rounded-full bg-gray-800 flex items-center justify-center mb-4">
                    <BarChart3 size={24} className="text-green-500" />
                  </div>
                  <h3 className="text-lg font-medium mb-2 text-white">Select a stock</h3>
                  <p className="text-sm text-gray-400">Click on any stock to view analyst recommendations</p>
                </div>
              ) : selectedStock.isLoading ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-10">
                  <RefreshCw size={40} className="text-green-500 mb-6 animate-spin" />
                  <h3 className="text-lg font-medium mb-2 text-white">Loading {selectedStock.symbol}</h3>
                  <p className="text-sm text-gray-400">Fetching analyst recommendations...</p>
                </div>
              ) : selectedStock.error ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-10">
                  <AlertTriangle size={40} className="text-yellow-500 mb-6" />
                  <h3 className="text-lg font-medium mb-2 text-white">Data Unavailable</h3>
                  <p className="text-sm text-gray-400">
                    Unable to load recommendation data for {selectedStock.symbol}.
                  </p>
                </div>
              ) : selectedStock.recommendations.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-10">
                  <Info size={40} className="text-yellow-500 mb-6" />
                  <h3 className="text-lg font-medium mb-2 text-white">No Data Available</h3>
                  <p className="text-sm text-gray-400">
                    No analyst recommendations found for {selectedStock.symbol}.
                  </p>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-white">{selectedStock.symbol}</h2>
                      <p className="text-gray-400">{selectedStock.name}</p>
                    </div>
                    
                    <div className={`px-3 py-1 text-sm font-medium rounded-lg ${
                      getConsensusColor(getConsensus(selectedStock))
                    }`}>
                      {getConsensus(selectedStock)}
                    </div>
                  </div>
                  
                  {/* Recommendation Chart */}
                  <div className="bg-gray-800 rounded-lg p-4 mb-6">
                    <h3 className="font-medium text-white mb-4">Analyst Recommendations</h3>
                    
                    <div className="h-64">
                      <ResponsiveContainer>
                        <BarChart data={getChartData(selectedStock)} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
                          <XAxis type="number" axisLine={false} tickLine={false} />
                          <YAxis 
                            dataKey="name" 
                            type="category" 
                            axisLine={false} 
                            tickLine={false}
                            tick={{ fontSize: 12, fill: '#9CA3AF' }}
                            width={80}
                          />
                          <Tooltip 
                            formatter={(value) => [`${value} analyst${value !== 1 ? 's' : ''}`, 'Count']}
                            contentStyle={{ backgroundColor: '#000', border: '1px solid #10B981' }}
                          />
                          <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                            {getChartData(selectedStock).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  
                  {/* Recommendation Details */}
                  <div className="bg-gray-800 rounded-lg p-4">
                    <h3 className="font-medium text-white mb-4">Latest Recommendation Details</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-900 p-3 rounded-lg">
                        <div className="text-xs text-gray-400 mb-1">Period</div>
                        <div className="text-sm font-medium text-white">
                          {selectedStock.recommendations[0].period}
                        </div>
                      </div>
                      
                      <div className="bg-gray-900 p-3 rounded-lg">
                        <div className="text-xs text-gray-400 mb-1">Total Analysts</div>
                        <div className="text-sm font-medium text-white">
                          {
                            selectedStock.recommendations[0].strongBuy +
                            selectedStock.recommendations[0].buy +
                            selectedStock.recommendations[0].hold +
                            selectedStock.recommendations[0].sell +
                            selectedStock.recommendations[0].strongSell
                          }
                        </div>
                      </div>
                    </div>
                    
                    {/* Historical Data Table */}
                    {selectedStock.recommendations.length > 1 && (
                      <div className="mt-6">
                        <h4 className="text-sm font-medium text-white mb-2">Historical Recommendations</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-xs text-gray-400 border-b border-gray-700">
                                <th className="pb-2 text-left">Period</th>
                                <th className="pb-2 text-right">Strong Buy</th>
                                <th className="pb-2 text-right">Buy</th>
                                <th className="pb-2 text-right">Hold</th>
                                <th className="pb-2 text-right">Sell</th>
                                <th className="pb-2 text-right">Strong Sell</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedStock.recommendations.slice(0, 5).map((rec, index) => (
                                <tr key={index} className="border-b border-gray-800 text-white">
                                  <td className="py-2 text-left">{rec.period}</td>
                                  <td className="py-2 text-right text-green-500">{rec.strongBuy}</td>
                                  <td className="py-2 text-right text-green-400">{rec.buy}</td>
                                  <td className="py-2 text-right text-yellow-500">{rec.hold}</td>
                                  <td className="py-2 text-right text-red-400">{rec.sell}</td>
                                  <td className="py-2 text-right text-red-500">{rec.strongSell}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Footer note */}
        <div className="p-4 bg-black rounded-lg border border-green-500">
          <div className="flex items-start">
            <Info size={16} className="text-green-500 mr-2 mt-0.5" />
            <div className="text-sm text-gray-300">
              Demo data shown. In a production environment, this would use data from Finnhub's Analyst Recommendations API.
              These recommendations reflect analysts' opinions and should not be considered as financial advice.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}