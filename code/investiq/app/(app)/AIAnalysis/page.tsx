'use client';

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  RefreshCw, 
  ChevronRight, 
  ArrowUp, 
  Calendar, 
  LineChart, 
  Info
} from "lucide-react";

// Sector data structure
interface StockRecommendation {
  rank: number;
  name: string;
  ticker: string;
  performance: number;
  notes: string;
}

interface SectorData {
  name: string;
  stocks: StockRecommendation[];
}

export default function AIAnalysis() {
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('stocks');
  const [activeSector, setActiveSector] = useState<string | null>(null);
  const [sectorData, setSectorData] = useState<SectorData[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  useEffect(() => {
    // Simulate loading data
    setIsLoading(true);
    
    setTimeout(() => {
      // Mock data for AI recommended stocks by sector
      const mockSectorData: SectorData[] = [
        {
          name: "Technology",
          stocks: [
            { rank: 1, name: "VNET Group", ticker: "VNET", performance: 31.60, notes: "Data center demand and tech sector rally." },
            { rank: 2, name: "GDS Services", ticker: "GDS", performance: 21.38, notes: "Up 18.66% over 3 months, driven by cloud computing growth." },
            { rank: 3, name: "Palantir Technologies", ticker: "PLTR", performance: 15.02, notes: "AI and analytics demand; mixed sentiment on valuation." },
            { rank: 4, name: "Microsoft", ticker: "MSFT", performance: 12.48, notes: "Strong AI and cloud spending outlook." },
            { rank: 5, name: "CrowdStrike", ticker: "CRWD", performance: 10.06, notes: "Cybersecurity demand remains robust." }
          ]
        },
        {
          name: "Consumer Discretionary",
          stocks: [
            { rank: 1, name: "Tesla", ticker: "TSLA", performance: 9.75, notes: "EV and AI optimism despite tariff concerns." },
            { rank: 2, name: "Booking Holdings", ticker: "BKNG", performance: 7.75, notes: "Travel demand recovery boosting bookings." },
            { rank: 3, name: "Mattel Inc", ticker: "MAT", performance: 7.50, notes: "Beat Q1 earnings but paused guidance due to macro headwinds." },
            { rank: 4, name: "Peloton Interactive", ticker: "PTON", performance: 6.25, notes: "Potential recovery in fitness equipment sales." },
            { rank: 5, name: "Amazon", ticker: "AMZN", performance: 5.10, notes: "Strong e-commerce base, mixed tariff impact." }
          ]
        },
        {
          name: "Healthcare",
          stocks: [
            { rank: 1, name: "Oscar Health", ticker: "OSCR", performance: 20.50, notes: "Beat Q1 earnings and revenue estimates." },
            { rank: 2, name: "Tenet Healthcare", ticker: "THC", performance: 10.24, notes: "Strong hospital operator performance, up 25.30% over 12 months." },
            { rank: 3, name: "Universal Health Services", ticker: "UHS", performance: 7.10, notes: "Steady demand for healthcare services." },
            { rank: 4, name: "Ontrak Inc", ticker: "OTRK", performance: 6.25, notes: "Gains in telehealth and behavioral health." },
            { rank: 5, name: "Vertex Pharmaceuticals", ticker: "VRTX", performance: 5.50, notes: "FDA approval of non-opioid painkiller Journavx." }
          ]
        },
        {
          name: "Communication Services",
          stocks: [
            { rank: 1, name: "The E.W. Scripps Company", ticker: "SSP", performance: 24.16, notes: "Q4 2024 record political ad revenue and lender agreement." },
            { rank: 2, name: "Spotify Technology", ticker: "SPOT", performance: 9.21, notes: "Strong subscriber growth and profitability outlook." },
            { rank: 3, name: "Netflix", ticker: "NFLX", performance: 5.42, notes: "Hit all-time high, driven by content strength." },
            { rank: 4, name: "Meta Platforms", ticker: "META", performance: 9.18, notes: "Advertising revenue growth and AI investments." }
          ]
        },
        {
          name: "Industrials",
          stocks: [
            { rank: 1, name: "Carrier Global", ticker: "CARR", performance: 19.10, notes: "Up 6.76% over 3 months, strong HVAC demand." },
            { rank: 2, name: "Uber Technologies", ticker: "UBER", performance: 7.27, notes: "Rideshare recovery despite weaker US bookings." }
          ]
        }
      ];
      
      setSectorData(mockSectorData);
      setActiveSector(mockSectorData[0].name);
      
      // Set last updated date to current date
      const now = new Date();
      setLastUpdated(now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }));
      
      setIsLoading(false);
    }, 1500);
  }, []);

  const refreshAnalysis = () => {
    setIsLoading(true);
    
    // Simulate refreshing data
    setTimeout(() => {
      setIsLoading(false);
    }, 1500);
  };
  
  // Get active sector stocks
  const getActiveSectorStocks = () => {
    if (!activeSector) return [];
    
    const sector = sectorData.find(s => s.name === activeSector);
    return sector ? sector.stocks : [];
  };

  return (
    <div className="p-0">
      {/* Page header */}
      <div className="px-6 py-4 bg-black text-white border-b border-green-500">
        <h1 className="text-xl font-bold">AI Analysis</h1>
      </div>
      
      <div className="p-6 bg-gray-900">
        {/* Header with tabs */}
        <div className="bg-black rounded-xl shadow-sm overflow-hidden border border-green-500 mb-6">
          <div className="p-6 border-b border-green-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-gray-800 flex items-center justify-center">
                  <TrendingUp className="text-green-500" size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">InvestIQ Analysis Engine</h2>
                  <p className="text-sm text-gray-400">AI-powered stock recommendations</p>
                </div>
              </div>
              
              <div className="flex items-center text-xs text-gray-400">
                <Calendar size={14} className="mr-1" />
                Last updated: {lastUpdated}
                <button 
                  onClick={refreshAnalysis}
                  className="ml-3 p-1 rounded-lg hover:bg-gray-800 text-green-500"
                  disabled={isLoading}
                >
                  <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex border-b border-green-500">
            <button 
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'stocks' 
                  ? 'text-green-500 border-b-2 border-green-500' 
                  : 'text-gray-400 hover:text-white'
              }`}
              onClick={() => setActiveTab('stocks')}
            >
              Weekly Recommendations
            </button>
            <button 
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'insights' 
                  ? 'text-green-500 border-b-2 border-green-500' 
                  : 'text-gray-400 hover:text-white'
              }`}
              onClick={() => setActiveTab('insights')}
            >
              Market Insights
            </button>
          </div>
        </div>
        
        {isLoading ? (
          <div className="bg-black rounded-xl shadow-sm flex items-center justify-center p-12 border border-green-500">
            <div className="flex flex-col items-center gap-3">
              <RefreshCw size={32} className="text-green-500 animate-spin" />
              <p className="text-gray-400">Analyzing market data...</p>
            </div>
          </div>
        ) : activeTab === 'stocks' ? (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left sidebar - Sectors */}
            <div className="bg-black rounded-xl shadow-sm overflow-hidden border border-green-500 h-fit">
              <div className="p-4 border-b border-green-500">
                <h3 className="text-sm font-medium text-white">Sectors</h3>
              </div>
              <div className="p-2">
                {sectorData.map((sector) => (
                  <button
                    key={sector.name}
                    className={`w-full flex items-center justify-between p-3 rounded-lg mb-1 ${
                      activeSector === sector.name
                        ? 'bg-gray-800 text-green-500'
                        : 'text-gray-300 hover:bg-gray-800'
                    }`}
                    onClick={() => setActiveSector(sector.name)}
                  >
                    <span>{sector.name}</span>
                    <div className="flex items-center">
                      <span className="text-xs mr-2">{sector.stocks.length}</span>
                      <ChevronRight size={16} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Right content - Stocks table */}
            <div className="lg:col-span-3 bg-black rounded-xl shadow-sm overflow-hidden border border-green-500">
              <div className="p-4 border-b border-green-500">
                <h3 className="text-sm font-medium text-white">{activeSector} - Top Performers</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-xs text-gray-400 border-b border-gray-800">
                      <th className="py-3 px-4 text-left">Rank</th>
                      <th className="py-3 px-4 text-left">Stock</th>
                      <th className="py-3 px-4 text-left">Ticker</th>
                      <th className="py-3 px-4 text-right">5-Day Performance</th>
                      <th className="py-3 px-4 text-left">Analysis Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {getActiveSectorStocks().map((stock) => (
                      <tr key={stock.ticker} className="hover:bg-gray-800 text-white">
                        <td className="py-3 px-4 text-left">
                          <span className="bg-gray-800 text-green-500 w-6 h-6 rounded-full inline-flex items-center justify-center text-xs font-medium">
                            {stock.rank}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-left font-medium">{stock.name}</td>
                        <td className="py-3 px-4 text-left">
                          <span className="inline-block px-2 py-1 bg-gray-800 text-green-500 rounded text-xs">
                            {stock.ticker}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end text-green-500">
                            <ArrowUp size={14} className="mr-1" />
                            {stock.performance.toFixed(2)}%
                          </div>
                        </td>
                        <td className="py-3 px-4 text-left text-sm text-gray-300">{stock.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-4 border-t border-green-500">
                <div className="flex items-start text-xs">
                  <Info size={14} className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-400">
                    Recommendations are based on proprietary AI algorithms analyzing price momentum, trading volume, news sentiment, and market trends. Updated weekly every Friday after market close.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-black rounded-xl shadow-sm p-6 border border-green-500">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-gray-800 flex items-center justify-center">
                <LineChart className="text-green-500" size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Market Insights</h2>
                <p className="text-sm text-gray-400">AI-generated market analysis</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-base font-medium text-white mb-2">Weekly Market Summary</h3>
                <p className="text-sm text-gray-300">
                  Markets showed robust performance this week with tech stocks leading gains. The technology sector continues to outperform
                  on strong AI-related demand while healthcare stocks rebounded after recent weakness. Consumer sentiment improved following
                  better-than-expected employment data, giving a boost to consumer discretionary stocks. 
                </p>
              </div>
              
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-base font-medium text-white mb-2">Key Trends</h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <div className="h-6 w-6 rounded-full bg-gray-700 flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-green-500 text-xs">1</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">AI and Cloud Computing</p>
                      <p className="text-sm text-gray-300">
                        Companies involved in AI infrastructure and cloud services continue to see strong demand, with data center providers
                        like VNET and GDS seeing substantial gains.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="h-6 w-6 rounded-full bg-gray-700 flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-green-500 text-xs">2</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">Healthcare Rebound</p>
                      <p className="text-sm text-gray-300">
                        Healthcare companies are showing resilience with improved earnings reports and positive FDA developments for companies like Vertex Pharmaceuticals.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="h-6 w-6 rounded-full bg-gray-700 flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-green-500 text-xs">3</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">Media Streaming Growth</p>
                      <p className="text-sm text-gray-300">
                        Entertainment streaming platforms continue to show strong subscriber growth with Netflix hitting new all-time highs and Spotify showing improved profitability metrics.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
              
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-base font-medium text-white mb-2">Risk Factors</h3>
                <p className="text-sm text-gray-300 mb-3">
                  Despite the positive momentum, investors should be aware of several potential risk factors:
                </p>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex items-start">
                    <span className="text-yellow-500 mr-2">•</span>
                    <span>Ongoing trade tensions and potential tariff impacts on tech supply chains</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-yellow-500 mr-2">•</span>
                    <span>Elevated valuations in AI-related stocks compared to historical averages</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-yellow-500 mr-2">•</span>
                    <span>Potential for interest rate volatility if inflation metrics exceed expectations</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}