'use client';

import React, { useState, useEffect } from 'react';
import { 
  Target, 
  ChevronUp,
  ChevronDown,
  BarChart3,
  ArrowRight,
  Filter,
  Info,
  RefreshCw
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
import { fetchStockData, fetchMultipleStocks } from '../../services/StockService';

// Type for stock recommendation
interface StockRecommendation {
  symbol: string;
  name: string;
  currentPrice: number;
  targetPrice: number;
  change: number;
  percentChange: number;
  recommendation: 'Buy' | 'Sell' | 'Hold';
  confidence: number;
  sector: string;
  reasons: string[];
  priceHistory: Array<{date: string, price: number}>;
  isLoading?: boolean;
  error?: string;
}

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

export default function Recommendations() {
  const [selectedStock, setSelectedStock] = useState<StockRecommendation | null>(null);
  const [filterSector, setFilterSector] = useState('All');
  const [filterRecommendation, setFilterRecommendation] = useState('All');
  const [stockRecommendations, setStockRecommendations] = useState<StockRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Initial stock recommendations data
  const initialRecommendations: StockRecommendation[] = [
    {
      symbol: "AAPL",
      name: "Apple Inc.",
      currentPrice: 0,
      targetPrice: 215.00,
      change: 0,
      percentChange: 0,
      recommendation: "Buy",
      confidence: 85,
      sector: "Technology",
      reasons: [
        "Strong product ecosystem with high customer loyalty",
        "Consistent revenue growth and profitability",
        "Expanding services segment with recurring revenue",
        "Potential growth from AI integration in products"
      ],
      priceHistory: [],
      isLoading: true
    },
    {
      symbol: "MSFT",
      name: "Microsoft Corporation",
      currentPrice: 0,
      targetPrice: 450.00,
      change: 0,
      percentChange: 0,
      recommendation: "Buy",
      confidence: 90,
      sector: "Technology",
      reasons: [
        "Cloud services (Azure) showing strong growth",
        "Successful AI integration across product suite",
        "Dominant position in enterprise software",
        "Strategic acquisitions strengthening market position"
      ],
      priceHistory: [],
      isLoading: true
    },
    {
      symbol: "TSLA",
      name: "Tesla, Inc.",
      currentPrice: 0,
      targetPrice: 200.00,
      change: 0,
      percentChange: 0,
      recommendation: "Hold",
      confidence: 65,
      sector: "Automotive",
      reasons: [
        "EV market competition intensifying",
        "Production capacity expansion underway",
        "Potential growth from energy storage solutions",
        "Regulatory challenges in key markets"
      ],
      priceHistory: [],
      isLoading: true
    },
    {
      symbol: "NVDA",
      name: "NVIDIA Corporation",
      currentPrice: 0,
      targetPrice: 1050.00,
      change: 0,
      percentChange: 0,
      recommendation: "Buy",
      confidence: 95,
      sector: "Technology",
      reasons: [
        "Dominant position in AI chip market",
        "Strong data center growth trajectory",
        "Expanding into new verticals and enterprise solutions",
        "Technology leadership in GPUs and specialized computing"
      ],
      priceHistory: [],
      isLoading: true
    },
    {
      symbol: "JPM",
      name: "JPMorgan Chase & Co.",
      currentPrice: 0,
      targetPrice: 200.00,
      change: 0,
      percentChange: 0,
      recommendation: "Buy",
      confidence: 80,
      sector: "Finance",
      reasons: [
        "Strong performance across all business segments",
        "Well-positioned for higher interest rate environment",
        "Expanding digital banking capabilities",
        "Strategic investments in fintech innovations"
      ],
      priceHistory: [],
      isLoading: true
    },
    {
      symbol: "CVX",
      name: "Chevron Corporation",
      currentPrice: 0,
      targetPrice: 150.00,
      change: 0,
      percentChange: 0,
      recommendation: "Sell",
      confidence: 70,
      sector: "Energy",
      reasons: [
        "Weakening global demand outlook",
        "Transition to renewable energy accelerating",
        "Regulatory pressures increasing globally",
        "High capital expenditure requirements"
      ],
      priceHistory: [],
      isLoading: true
    }
  ];

  // Fetch real-time stock data and update recommendations
  useEffect(() => {
    const fetchRealTimeData = async () => {
      setIsLoading(true);
      
      try {
        // Get all symbols
        const symbols = initialRecommendations.map(stock => stock.symbol);
        
        // Fetch current prices for all stocks
        const quotesData = await fetchMultipleStocks(symbols);
        
        // Create a map for quick lookups
        const quotesMap = new Map();
        quotesData.forEach(quote => {
          quotesMap.set(quote.symbol, quote);
        });
        
        // Create updated recommendations with real-time data
        const updatedRecommendations = await Promise.all(
          initialRecommendations.map(async (rec) => {
            try {
              // Get quote data
              const quote = quotesMap.get(rec.symbol);
              
              // Fetch historical data
              const histData = await fetchStockData(rec.symbol);
              
              // Format historical data for chart
              const formattedHistory = histData.slice(0, 7).map(item => ({
                date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                price: item.value
              })).reverse();
              
              // Return updated recommendation
              return {
                ...rec,
                currentPrice: quote.price,
                change: quote.change,
                percentChange: quote.percentChange,
                priceHistory: formattedHistory,
                isLoading: false,
                error: quote.error
              };
            } catch (err) {
              console.error(`Error fetching data for ${rec.symbol}:`, err);
              return {
                ...rec,
                isLoading: false,
                error: 'Failed to load data'
              };
            }
          })
        );
        
        setStockRecommendations(updatedRecommendations);
        
        // If no stock is selected yet, select the first one
        if (!selectedStock && updatedRecommendations.length > 0) {
          setSelectedStock(updatedRecommendations[0]);
        } else if (selectedStock) {
          // Update the selected stock with real-time data
          const updatedSelected = updatedRecommendations.find(s => s.symbol === selectedStock.symbol);
          if (updatedSelected) {
            setSelectedStock(updatedSelected);
          }
        }
      } catch (error) {
        console.error('Error fetching real-time data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Initialize with our predefined recommendations
    setStockRecommendations(initialRecommendations);
    
    // Then fetch real-time data
    fetchRealTimeData();
  }, []);

  // Filter recommendations based on current filters
  const filteredRecommendations = stockRecommendations.filter(stock => {
    const matchesSector = filterSector === 'All' || stock.sector === filterSector;
    const matchesRecommendation = filterRecommendation === 'All' || stock.recommendation === filterRecommendation;
    return matchesSector && matchesRecommendation;
  });

  // Get unique sectors for filter
  const sectors = ['All', ...new Set(stockRecommendations.map(stock => stock.sector))];
  
  // Custom tooltip for price chart
  const CustomTooltip = ({ active, payload }: TooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black p-3 border border-green-500 rounded-lg shadow-lg text-white">
          <p className="font-medium">${payload[0].value.toFixed(2)}</p>
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
        <h1 className="text-xl font-bold">Recommendations</h1>
      </div>
      
      <div className="p-6 bg-gray-900">
        <div className="bg-black rounded-xl shadow-sm mb-6 border border-green-500">
          <div className="p-6 border-b border-green-500">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-lg bg-gray-800 flex items-center justify-center">
                <Target className="text-green-500" size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Smart Recommendations</h2>
                <p className="text-sm text-gray-400">
                  Personalized stock picks based on your profile and market conditions
                </p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <button className="p-2 rounded-lg border border-gray-700 hover:bg-gray-800 text-gray-400">
                  <Info size={16} />
                </button>
                <button className="p-2 rounded-lg border border-gray-700 hover:bg-gray-800 text-gray-400">
                  <Filter size={16} />
                </button>
              </div>
            </div>
          </div>
          
          {/* Filters */}
          <div className="p-4 border-b border-green-500 flex items-center gap-4 flex-wrap">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Sector</label>
              <select 
                className="text-sm py-1.5 px-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
                value={filterSector}
                onChange={(e) => setFilterSector(e.target.value)}
              >
                {sectors.map(sector => (
                  <option key={sector} value={sector}>{sector}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="text-xs text-gray-400 block mb-1">Recommendation</label>
              <select 
                className="text-sm py-1.5 px-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
                value={filterRecommendation}
                onChange={(e) => setFilterRecommendation(e.target.value)}
              >
                <option value="All">All</option>
                <option value="Buy">Buy</option>
                <option value="Sell">Sell</option>
                <option value="Hold">Hold</option>
              </select>
            </div>
          </div>
          
          <div className="flex flex-col lg:flex-row">
            {/* List of recommendations */}
            <div className="lg:w-1/2 xl:w-2/5 border-r border-green-500">
              <div className="overflow-y-auto max-h-[600px]">
                {filteredRecommendations.map((stock) => (
                  <div 
                    key={stock.symbol}
                    className={`p-4 border-b border-gray-800 cursor-pointer hover:bg-gray-800 ${
                      selectedStock?.symbol === stock.symbol ? 'bg-gray-800' : ''
                    }`}
                    onClick={() => setSelectedStock(stock)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{stock.symbol}</span>
                          <span className="text-sm text-gray-400">{stock.name}</span>
                        </div>
                        <div className="flex items-center mt-1">
                          {stock.isLoading ? (
                            <span className="text-sm font-medium text-gray-400 flex items-center">
                              <RefreshCw size={12} className="mr-1 animate-spin" />
                              Loading...
                            </span>
                          ) : stock.error ? (
                            <span className="text-sm font-medium text-red-400">Data unavailable</span>
                          ) : (
                            <>
                              <span className="text-sm font-medium text-white">${stock.currentPrice.toFixed(2)}</span>
                              <span className={`ml-2 text-xs flex items-center ${
                                stock.percentChange >= 0 ? 'text-green-500' : 'text-red-500'
                              }`}>
                                {stock.percentChange >= 0 ? (
                                  <ChevronUp size={14} className="mr-0.5" />
                                ) : (
                                  <ChevronDown size={14} className="mr-0.5" />
                                )}
                                {Math.abs(stock.percentChange).toFixed(2)}%
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          stock.recommendation === 'Buy' 
                            ? 'bg-green-900/30 text-green-400' 
                            : stock.recommendation === 'Sell'
                              ? 'bg-red-900/30 text-red-400'
                              : 'bg-orange-900/30 text-orange-400'
                        }`}>
                          {stock.recommendation}
                        </span>
                        <span className="text-xs text-gray-400 mt-1">
                          {stock.sector}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <div className="w-full bg-gray-700 rounded-full h-1.5">
                        <div 
                          className="bg-green-500 h-1.5 rounded-full" 
                          style={{ width: `${stock.confidence}%` }}
                        ></div>
                      </div>
                      <span className="ml-2 text-xs text-gray-400">
                        {stock.confidence}% confidence
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Stock details */}
            <div className="lg:w-1/2 xl:w-3/5 p-6">
              {selectedStock ? (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-bold text-white">{selectedStock.symbol}</h2>
                        <span className="text-gray-400">
                          {selectedStock.name}
                        </span>
                      </div>
                      <div className="flex items-center mt-1">
                        {selectedStock.isLoading ? (
                          <span className="text-xl font-medium text-gray-400 flex items-center">
                            <RefreshCw size={16} className="mr-2 animate-spin" />
                            Loading...
                          </span>
                        ) : selectedStock.error ? (
                          <span className="text-xl font-medium text-red-400">Data unavailable</span>
                        ) : (
                          <>
                            <span className="text-xl font-medium text-white">
                              ${selectedStock.currentPrice.toFixed(2)}
                            </span>
                            <span className={`ml-3 text-sm flex items-center ${
                              selectedStock.percentChange >= 0 ? 'text-green-500' : 'text-red-500'
                            }`}>
                              {selectedStock.percentChange >= 0 ? (
                                <ChevronUp size={16} className="mr-0.5" />
                              ) : (
                                <ChevronDown size={16} className="mr-0.5" />
                              )}
                              {Math.abs(selectedStock.percentChange).toFixed(2)}%
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={`inline-block px-3 py-1 text-sm font-medium rounded-lg ${
                        selectedStock.recommendation === 'Buy' 
                          ? 'bg-green-900/30 text-green-400' 
                          : selectedStock.recommendation === 'Sell'
                            ? 'bg-red-900/30 text-red-400'
                            : 'bg-orange-900/30 text-orange-400'
                      }`}>
                        {selectedStock.recommendation}
                      </div>
                      <div className="mt-1 text-sm text-gray-400">
                        Target: ${selectedStock.targetPrice.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  
                  {/* Price chart */}
                  <div className="bg-black rounded-lg border border-green-500 p-4 mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium text-white">Price History</h3>
                      <div className="text-xs text-gray-400">
                        Last 7 Days
                      </div>
                    </div>
                    
                    {selectedStock.isLoading ? (
                      <div className="h-48 flex items-center justify-center">
                        <div className="flex items-center text-gray-400">
                          <RefreshCw size={20} className="mr-2 animate-spin" />
                          Loading price history...
                        </div>
                      </div>
                    ) : selectedStock.error || selectedStock.priceHistory.length === 0 ? (
                      <div className="h-48 flex items-center justify-center">
                        <div className="flex items-center text-gray-400">
                          <Info size={20} className="mr-2" />
                          Price history unavailable
                        </div>
                      </div>
                    ) : (
                      <div className="h-48">
                        <ResponsiveContainer>
                          <LineChart data={selectedStock.priceHistory}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis 
                              dataKey="date" 
                              axisLine={false}
                              tickLine={false}
                              tick={{ fontSize: 12, fill: '#9CA3AF' }}
                            />
                            <YAxis 
                              axisLine={false}
                              tickLine={false}
                              tick={{ fontSize: 12, fill: '#9CA3AF' }}
                              domain={['dataMin - 5', 'dataMax + 5']}
                              tickFormatter={(value) => `$${value}`}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Line 
                              type="monotone" 
                              dataKey="price" 
                              stroke="#10B981" 
                              strokeWidth={2}
                              dot={false}
                              activeDot={{ r: 6, fill: '#10B981' }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                  
                  {/* Analysis & Reasoning */}
                  <div className="mb-6">
                    <h3 className="font-medium mb-3 text-white">Why We Recommend</h3>
                    <ul className="space-y-2">
                      {selectedStock.reasons.map((reason, index) => (
                        <li key={index} className="flex items-start">
                          <div className="min-w-5 h-5 w-5 rounded-full bg-gray-800 flex items-center justify-center text-xs text-green-500 mr-3 mt-0.5">
                            {index + 1}
                          </div>
                          <span className="text-sm text-gray-300">{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* Action buttons */}
                  <div className="flex gap-3">
                    <button className="px-4 py-2 bg-green-500 text-black font-medium rounded-lg hover:bg-green-600 flex items-center">
                      View Details
                      <ArrowRight size={16} className="ml-2" />
                    </button>
                    <button className="px-4 py-2 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800">
                      Add to Watchlist
                    </button>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-10">
                  <div className="h-16 w-16 rounded-full bg-gray-800 flex items-center justify-center mb-4">
                    <BarChart3 size={24} className="text-green-500" />
                  </div>
                  <h3 className="text-lg font-medium mb-2 text-white">Select a recommendation</h3>
                  <p className="text-sm text-gray-400 max-w-xs">
                    Click on any stock from the list to view detailed analysis and performance data
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}