
// app/components/HistoricalTrends.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { Calendar, RefreshCw, Info } from "lucide-react";
import { getPortfolioHistory } from '../services/DataService';

interface HistoricalTrendsProps {
  symbol?: string; // Optional symbol for individual stock trends
}

interface TrendData {
  date: string;
  value: number;
  benchmark?: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    dataKey: string;
    color: string;
    payload: {
      date: string;
      [key: string]: any;
    };
  }>;
  label?: string;
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black p-3 border border-green-500 rounded-lg shadow-lg text-white">
        <p className="font-medium mb-1">{payload[0].payload.date}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }} className="text-sm flex justify-between">
            <span>{entry.name}: </span>
            <span className="ml-4 font-medium">${entry.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const HistoricalTrends: React.FC<HistoricalTrendsProps> = ({ symbol }) => {
  const [timeRange, setTimeRange] = useState('1Y');
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Time range options
  const timeRanges = ['1M', '3M', '6M', '1Y', 'All'];

  useEffect(() => {
    const fetchHistoricalData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Get portfolio history data
        const history = await getPortfolioHistory(timeRange);
        
        // Create benchmark comparison (simulated S&P 500)
        // In a real app, this would come from an actual market data API
        const dataWithBenchmark = history.map(item => {
          // Generate S&P 500 data that slightly underperforms portfolio for demo
          const benchmarkValue = item.value * (0.85 + (Math.random() * 0.15));
          
          return {
            ...item,
            date: typeof item.date === 'string' ? item.date : `Day ${item.index}`,
            benchmark: Math.round(benchmarkValue * 100) / 100
          };
        });
        
        setTrendData(dataWithBenchmark);
      } catch (err) {
        console.error('Error fetching historical trends:', err);
        setError('Failed to load historical data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchHistoricalData();
  }, [timeRange, symbol]);

  return (
    <div className="bg-black rounded-xl shadow-sm overflow-hidden border border-green-500">
      <div className="p-4 flex items-center justify-between border-b border-green-500">
        <div className="flex items-center gap-2">
          <Calendar size={18} className="text-green-500" />
          <h2 className="text-base font-bold text-white">Historical Performance Trends</h2>
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
      
      <div className="p-5">
        {isLoading ? (
          <div className="h-80 flex items-center justify-center">
            <RefreshCw size={24} className="text-green-500 animate-spin" />
          </div>
        ) : error ? (
          <div className="h-80 flex items-center justify-center">
            <div className="text-center">
              <Info size={24} className="text-yellow-500 mx-auto mb-2" />
              <p className="text-gray-400">{error}</p>
            </div>
          </div>
        ) : (
          <>
            <div className="h-80">
              <ResponsiveContainer>
                <LineChart data={trendData} margin={{ top: 10, right: 10, left: 5, bottom: 10 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#374151" />
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
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    formatter={(value) => <span className="text-gray-300">{value}</span>}
                    align="right"
                    verticalAlign="top"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    name="Portfolio" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6, fill: '#10B981' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="benchmark" 
                    name="S&P 500" 
                    stroke="#6B7280" 
                    strokeWidth={2}
                    dot={false}
                    strokeDasharray="3 3"
                    activeDot={{ r: 6, fill: '#6B7280' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-4 bg-gray-800 rounded-lg p-4">
              <h3 className="text-sm font-medium text-white mb-2">Historical Performance Analysis</h3>
              <p className="text-xs text-gray-400">
                Your portfolio has outperformed the S&P 500 index by approximately 15% over this time period. 
                Market trends indicate continued growth in the technology sector, which comprises the majority of your portfolio.
              </p>
              <div className="mt-3 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400">Best Performing Month</p>
                  <p className="text-sm font-medium text-white">Mar (+8.2%)</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Worst Performing Month</p>
                  <p className="text-sm font-medium text-white">Jun (-3.8%)</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default HistoricalTrends;