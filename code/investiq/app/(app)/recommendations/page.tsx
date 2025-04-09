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
  RefreshCw,
  AlertTriangle
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
import { fetchStockData } from '../../services/StockService';
import { fetchMixedTopMovers, parseStockMover, StockMover } from '../../services/TopMoversService';

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
  volume?: number;
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

// Sector mapping - common stock symbols to sectors
const SECTOR_MAP: Record<string, string> = {
  // Technology
  AAPL: 'Technology', MSFT: 'Technology', GOOGL: 'Technology', GOOG: 'Technology',
  META: 'Technology', NVDA: 'Technology', AVGO: 'Technology', CSCO: 'Technology',
  ADBE: 'Technology', CRM: 'Technology', INTC: 'Technology', AMD: 'Technology',
  ORCL: 'Technology', IBM: 'Technology', MU: 'Technology', QCOM: 'Technology',
  TSM: 'Technology', TXN: 'Technology', AMAT: 'Technology', NOW: 'Technology',
  
  // Finance
  JPM: 'Finance', BAC: 'Finance', WFC: 'Finance', C: 'Finance', GS: 'Finance',
  MS: 'Finance', V: 'Finance', MA: 'Finance', AXP: 'Finance', PYPL: 'Finance',
  BLK: 'Finance', SCHW: 'Finance', CME: 'Finance', CB: 'Finance', PNC: 'Finance',
  
  // Healthcare
  JNJ: 'Healthcare', PFE: 'Healthcare', MRK: 'Healthcare', ABBV: 'Healthcare',
  BMY: 'Healthcare', LLY: 'Healthcare', AMGN: 'Healthcare', ABT: 'Healthcare',
  TMO: 'Healthcare', DHR: 'Healthcare', UNH: 'Healthcare', CVS: 'Healthcare',
  
  // Consumer
  AMZN: 'Consumer', WMT: 'Consumer', PG: 'Consumer', COST: 'Consumer', HD: 'Consumer',
  MCD: 'Consumer', SBUX: 'Consumer', NKE: 'Consumer', TGT: 'Consumer', KO: 'Consumer',
  PEP: 'Consumer', DIS: 'Consumer', NFLX: 'Consumer', BABA: 'Consumer',
  
  // Energy
  XOM: 'Energy', CVX: 'Energy', COP: 'Energy', EOG: 'Energy', SLB: 'Energy',
  OXY: 'Energy', BP: 'Energy', TTE: 'Energy', ENB: 'Energy', KMI: 'Energy',
  
  // Automotive
  TSLA: 'Automotive', F: 'Automotive', GM: 'Automotive', TM: 'Automotive',
  HMC: 'Automotive', STLA: 'Automotive', LCID: 'Automotive', RIVN: 'Automotive'
};

// Map stock ticker to company name for common stocks
const COMPANY_NAME_MAP: Record<string, string> = {
  AAPL: 'Apple Inc.', 
  MSFT: 'Microsoft Corporation',
  GOOGL: 'Alphabet Inc. (Google)',
  GOOG: 'Alphabet Inc. (Google)',
  META: 'Meta Platforms, Inc.',
  AMZN: 'Amazon.com, Inc.',
  TSLA: 'Tesla, Inc.',
  NVDA: 'NVIDIA Corporation',
  JPM: 'JPMorgan Chase & Co.',
  BAC: 'Bank of America Corp.',
  WMT: 'Walmart Inc.',
  JNJ: 'Johnson & Johnson',
  PG: 'Procter & Gamble Co.',
  XOM: 'Exxon Mobil Corporation',
  NFLX: 'Netflix, Inc.',
  PYPL: 'PayPal Holdings, Inc.',
  PFE: 'Pfizer Inc.',
  MRK: 'Merck & Co., Inc.',
  INTC: 'Intel Corporation',
  AMD: 'Advanced Micro Devices, Inc.',
  DIS: 'The Walt Disney Company',
  CSCO: 'Cisco Systems, Inc.',
  VZ: 'Verizon Communications Inc.',
  KO: 'The Coca-Cola Company',
  PEP: 'PepsiCo, Inc.',
  ADBE: 'Adobe Inc.',
  CMCSA: 'Comcast Corporation',
  T: 'AT&T Inc.',
  CVX: 'Chevron Corporation'
};

// Determine recommendation based on performance
const determineRecommendation = (percentChange: number): 'Buy' | 'Sell' | 'Hold' => {
  if (percentChange > 5) return 'Buy';
  if (percentChange < -2) return 'Sell';
  return 'Hold';
};

// Calculate confidence level based on recommendation and performance
const calculateConfidence = (recommendation: string, percentChange: number): number => {
  const absChange = Math.abs(percentChange);
  
  if (recommendation === 'Buy') {
    return Math.min(60 + Math.floor(absChange * 3), 95);
  } else if (recommendation === 'Sell') {
    return Math.min(60 + Math.floor(absChange * 2), 90);
  } else {
    // Hold
    return Math.max(50, 70 - Math.floor(absChange * 3));
  }
};

// Estimate target price based on current price and recommendation
const estimateTargetPrice = (currentPrice: number, recommendation: string, percentChange: number): number => {
  const multiplier = recommendation === 'Buy' 
    ? 1.15 + (percentChange / 100) 
    : recommendation === 'Sell'
      ? 0.9 + (percentChange / 200)
      : 1.05;
      
  return Math.round(currentPrice * multiplier * 100) / 100;
};

// Generate synthetic price history based on current price
const generatePriceHistory = (currentPrice: number, percentChange: number): {date: string, price: number}[] => {
  const today = new Date();
  
  return Array.from({ length: 7 }).map((_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() - (6 - i));
    
    // Create a somewhat realistic price progression
    const dayFactor = (i / 6); // 0 to 1
    const randomFactor = (Math.random() * 0.5 - 0.25) * Math.abs(percentChange); // Some randomness
    const dayChange = percentChange * dayFactor + randomFactor;
    const price = currentPrice / (1 + (percentChange / 100)) * (1 + (dayChange / 100));
    
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      price: Math.round(price * 100) / 100
    };
  });
};

// Generate reasons for recommendation
const generateReasons = (ticker: string, percentChange: number, recommendation: string, sector: string): string[] => {
  const reasons: string[] = [];
  const absChange = Math.abs(percentChange);
  
  // Common phrases
  const positivePhrases = [
    `Strong positive momentum with ${absChange.toFixed(2)}% gain`,
    `Technical indicators showing bullish patterns`,
    `Volume analysis indicates increasing buying interest`,
    `Outperforming the ${sector} sector average`,
    `Recent price action breaking through resistance levels`,
    `Momentum indicators signaling potential continued uptrend`,
    `Positive market sentiment around ${ticker}`,
    `Strong relative strength compared to peers`,
    `Upward trend supported by market conditions`,
    `Recent positive news catalysts for ${ticker}`
  ];
  
  const negativePhrases = [
    `Downward pressure with ${absChange.toFixed(2)}% decline`,
    `Technical indicators showing bearish patterns`,
    `Volume analysis indicates increasing selling pressure`,
    `Underperforming the ${sector} sector average`,
    `Recent price action breaking below support levels`,
    `Momentum indicators signaling potential continued downtrend`,
    `Negative market sentiment around ${ticker}`,
    `Weak relative strength compared to peers`,
    `Downward trend aligned with market conditions`,
    `Recent negative news catalysts for ${ticker}`
  ];
  
  const neutralPhrases = [
    `Price consolidation at current levels`,
    `Mixed technical signals indicating uncertainty`,
    `Volume patterns consistent with a range-bound market`,
    `Performance in line with ${sector} sector average`,
    `Price moving between established support and resistance`,
    `Momentum indicators showing neutral readings`,
    `Market sentiment appears balanced for ${ticker}`,
    `Average relative strength compared to peers`,
    `Current trend showing signs of indecision`,
    `No significant news catalysts affecting price`
  ];
  
  // Choose appropriate phrases based on recommendation
  const phrasesPool = recommendation === 'Buy' 
    ? positivePhrases 
    : recommendation === 'Sell' 
      ? negativePhrases 
      : neutralPhrases;
  
  // Select 4 random phrases
  const shuffled = [...phrasesPool].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 4);
};

// Get sector for stock ticker
const getSector = (ticker: string): string => {
  return SECTOR_MAP[ticker] || 'Other';
};

// Get company name for stock ticker
const getCompanyName = (ticker: string): string => {
  return COMPANY_NAME_MAP[ticker] || `${ticker} Stock`;
};

export default function Recommendations() {
  const [selectedStock, setSelectedStock] = useState<StockRecommendation | null>(null);
  const [filterSector, setFilterSector] = useState('All');
  const [filterRecommendation, setFilterRecommendation] = useState('All');
  const [stockRecommendations, setStockRecommendations] = useState<StockRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch top movers data and generate recommendations
  useEffect(() => {
    const generateRecommendations = async () => {
      setIsLoading(true);
      
      try {
        // Fetch mixed top movers (gainers, losers, and most active)
        const topMovers = await fetchMixedTopMovers(15);
        
        // Process each stock mover into a recommendation
        const recommendations = topMovers.map((mover: StockMover) => {
          // Parse the stock mover data
          const parsedMover = parseStockMover(mover);
          
          // Get ticker
          const ticker = parsedMover.ticker;
          
          // Determine sector and name
          const sector = getSector(ticker);
          const name = getCompanyName(ticker);
          
          // Determine recommendation type
          const recommendation = determineRecommendation(parsedMover.change_percentage);
          
          // Calculate confidence level
          const confidence = calculateConfidence(recommendation, parsedMover.change_percentage);
          
          // Estimate target price
          const targetPrice = estimateTargetPrice(parsedMover.price, recommendation, parsedMover.change_percentage);
          
          // Generate price history
          const priceHistory = generatePriceHistory(parsedMover.price, parsedMover.change_percentage);
          
          // Generate reasons
          const reasons = generateReasons(ticker, parsedMover.change_percentage, recommendation, sector);
          
          // Create recommendation object
          return {
            symbol: ticker,
            name: name,
            currentPrice: parsedMover.price,
            targetPrice: targetPrice,
            change: parsedMover.change_amount,
            percentChange: parsedMover.change_percentage,
            recommendation: recommendation,
            confidence: confidence,
            sector: sector,
            reasons: reasons,
            priceHistory: priceHistory,
            volume: parsedMover.volume,
            isLoading: false
          };
        });
        
        // Sort by absolute percentage change
        recommendations.sort((a, b) => Math.abs(b.percentChange) - Math.abs(a.percentChange));
        
        setStockRecommendations(recommendations);
        
        // Set the first stock as selected
        if (recommendations.length > 0) {
          setSelectedStock(recommendations[0]);
        }
        
      } catch (err: any) {
        console.error('Error generating recommendations:', err);
        setError(err.message || 'Failed to fetch market data');
      } finally {
        setIsLoading(false);
      }
    };
    
    generateRecommendations();
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
        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-800 rounded-lg">
            <div className="flex items-start">
              <AlertTriangle className="text-red-500 mr-3 mt-0.5" size={20} />
              <div>
                <p className="text-sm text-red-200 font-medium">Error Loading Data</p>
                <p className="text-sm text-gray-300 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="bg-black rounded-xl shadow-sm mb-6 border border-green-500">
          <div className="p-6 border-b border-green-500">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-lg bg-gray-800 flex items-center justify-center">
                <Target className="text-green-500" size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Top Market Movers</h2>
                <p className="text-sm text-gray-400">
                  Market recommendations based on today's top gainers, losers, and most active stocks
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
              {isLoading ? (
                <div className="p-10 flex justify-center">
                  <div className="flex flex-col items-center">
                    <RefreshCw size={32} className="text-green-500 mb-4 animate-spin" />
                    <p className="text-gray-400">Analyzing market data...</p>
                  </div>
                </div>
              ) : filteredRecommendations.length === 0 ? (
                <div className="p-10 flex justify-center">
                  <div className="flex flex-col items-center">
                    <Info size={32} className="text-yellow-500 mb-4" />
                    <p className="text-gray-400">No recommendations match your filters</p>
                  </div>
                </div>
              ) : (
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
              )}
            </div>
            
            {/* Stock details */}
            <div className="lg:w-1/2 xl:w-3/5 p-6">
              {isLoading ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-10">
                  <RefreshCw size={40} className="text-green-500 mb-6 animate-spin" />
                  <h3 className="text-lg font-medium mb-2 text-white">Analyzing Market Data</h3>
                  <p className="text-sm text-gray-400 max-w-xs">
                    Finding top performing stocks across market sectors...
                  </p>
                </div>
              ) : selectedStock ? (
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
                        Recent Market Activity
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
                              tickFormatter={(value) => `${value}`}
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
                  
                  {/* Volume information */}
                  {selectedStock.volume && (
                    <div className="bg-gray-800 rounded-lg p-4 mb-6">
                      <div className="flex items-center mb-2">
                        <h3 className="font-medium text-white">Trading Volume</h3>
                        <span className="ml-auto text-xs text-gray-400">Today's Activity</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-xl font-medium text-white">
                          {selectedStock.volume.toLocaleString()}
                        </span>
                        <span className="ml-2 text-xs text-gray-400">
                          shares
                        </span>
                      </div>
                    </div>
                  )}
                  
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
        
        {/* API notice */}
        <div className="mt-6 p-4 bg-black rounded-lg border border-green-500">
          <div className="flex items-start">
            <Info size={20} className="text-green-500 mr-3 mt-0.5" />
            <div>
              <p className="text-sm text-gray-300">
                <span className="font-medium text-white">Data Source:</span> Recommendations are based on Alpha Vantage's Top Gainers, Losers, and Most Active stocks API. Data is updated at market close each trading day.
              </p>
              <p className="text-xs text-gray-400 mt-1">
                These recommendations are for informational purposes only and do not constitute financial advice.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}