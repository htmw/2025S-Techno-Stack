// app/portfolio/page.tsx
'use client';

import React, { useState } from 'react';
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
  MoreHorizontal
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

export default function Portfolio() {
  const [timeRange, setTimeRange] = useState('3M');
  const [viewMode, setViewMode] = useState('holdings');
  
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

  // Portfolio holdings
  const holdings = [
    { symbol: "AAPL", name: "Apple Inc.", shares: 15, avgCost: 160.75, currentPrice: 187.68, value: 2815.20, weight: 17.5, gain: 404.25, gainPercent: 16.75 },
    { symbol: "MSFT", name: "Microsoft Corp.", shares: 10, avgCost: 380.25, currentPrice: 419.65, value: 4196.50, weight: 26.1, gain: 394.00, gainPercent: 10.35 },
    { symbol: "GOOGL", name: "Alphabet Inc.", shares: 8, avgCost: 125.50, currentPrice: 148.90, value: 1191.20, weight: 7.4, gain: 187.20, gainPercent: 18.65 },
    { symbol: "AMZN", name: "Amazon.com Inc.", shares: 12, avgCost: 150.80, currentPrice: 182.41, value: 2188.92, weight: 13.6, gain: 379.32, gainPercent: 20.96 },
    { symbol: "NVDA", name: "NVIDIA Corp.", shares: 5, avgCost: 780.40, currentPrice: 950.02, value: 4750.10, weight: 29.5, gain: 848.10, gainPercent: 21.73 },
    { symbol: "JPM", name: "JPMorgan Chase & Co.", shares: 6, avgCost: 160.25, currentPrice: 182.41, value: 1094.46, weight: 6.8, gain: 133.00, gainPercent: 13.83 }
  ];

  // Sector allocation data
  const sectorData = [
    { name: 'Technology', value: 80.5 },
    { name: 'Finance', value: 6.8 },
    { name: 'Consumer', value: 6.3 },
    { name: 'Healthcare', value: 4.1 },
    { name: 'Energy', value: 2.3 }
  ];

  // Time range options
  const timeRanges = ['1M', '3M', '6M', 'YTD', '1Y', 'All'];

  // Colors for pie chart
  const COLORS = ['#10B981', '#34D399', '#6EE7B7', '#1E40AF', '#3B82F6', '#93C5FD'];

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
                  <span className="text-2xl font-bold text-white">${totalValue.toLocaleString()}</span>
                  <span className="text-green-500 flex items-center text-sm font-medium">
                    <ArrowUp size={14} className="mr-1" />
                    18.2%
                  </span>
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
              <p className="text-lg font-bold text-white">$12,500</p>
            </div>
            <div className="p-4 text-center">
              <p className="text-xs text-gray-400 mb-1">Total Gain</p>
              <p className="text-lg font-bold text-green-500">+$3,300</p>
              <p className="text-xs text-green-500">+26.4%</p>
            </div>
            <div className="p-4 text-center">
              <p className="text-xs text-gray-400 mb-1">Annual Return</p>
              <p className="text-lg font-bold text-green-500">+22.8%</p>
            </div>
            <div className="p-4 text-center">
              <p className="text-xs text-gray-400 mb-1">Dividend Yield</p>
              <p className="text-lg font-bold text-white">1.8%</p>
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
          </div>
          
          <button className="px-4 py-2 bg-green-500 text-black rounded-lg hover:bg-green-600 flex items-center font-medium">
            <Plus size={16} className="mr-2" />
            Add Position
          </button>
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
                    <tr key={stock.symbol} className="hover:bg-gray-800 cursor-pointer text-white">
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
                        <button className="p-1 rounded-full hover:bg-gray-700">
                          <MoreHorizontal size={16} className="text-gray-400" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {viewMode === 'allocation' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-black rounded-xl shadow-sm border border-green-500 p-6">
              <h2 className="text-base font-bold mb-6 text-white">Sector Allocation</h2>
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
            </div>
            
            <div className="bg-black rounded-xl shadow-sm border border-green-500 p-6">
              <h2 className="text-base font-bold mb-6 text-white">Allocation Summary</h2>
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
            </div>
          </div>
        )}
        
        {viewMode === 'performance' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-black rounded-xl shadow-sm border border-green-500 p-6">
              <h2 className="text-base font-bold mb-6 text-white">Performance Metrics</h2>
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
            </div>
            
            <div className="bg-black rounded-xl shadow-sm border border-green-500 p-6">
              <h2 className="text-base font-bold mb-6 text-white">Top Performers</h2>
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
                    <span className="text-sm text-green-500">+$835.50</span>
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className="text-sm text-white">Long Term</span>
                    <span className="text-sm text-green-500">+$2,464.50</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}