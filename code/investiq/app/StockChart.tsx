'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { Calendar, RefreshCw, Info } from "lucide-react";
import { StockDataPoint } from './services/StockService';

interface CustomTooltipProps {
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

// Custom tooltip for chart
const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black p-3 border border-green-500 rounded-lg shadow-lg text-white">
        <p className="font-medium">${payload[0].value.toFixed(2)}</p>
        <p className="text-xs text-gray-400">{label}</p>
      </div>
    );
  }
  return null;
};

interface StockChartProps {
  data: StockDataPoint[] | null;
  symbol: string;
  isLoading: boolean;
  error: string | null;
}

const StockChart: React.FC<StockChartProps> = ({ data, symbol, isLoading, error }) => {
  // Find min and max values for better chart display
  const minValue = data?.length ? Math.min(...data.map(item => item.value)) * 0.995 : 0;
  const maxValue = data?.length ? Math.max(...data.map(item => item.value)) * 1.005 : 100;
  
  // Calculate percentage change
  const calculateChange = () => {
    if (!data || data.length < 2) return { change: 0, percentChange: 0 };
    
    const latestPrice = data[0].value;
    const previousPrice = data[1].value;
    const change = latestPrice - previousPrice;
    const percentChange = (change / previousPrice) * 100;
    
    return { change, percentChange };
  };
  
  const { change, percentChange } = calculateChange();
  
  // Format dates for better display
  const formatData = () => {
    if (!data) return [];
    return data.map(item => ({
      ...item,
      formattedDate: new Date(item.date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric'
      })
    }));
  };
  
  const formattedData = formatData();

  if (isLoading) {
    return (
      <div className="h-64 w-full flex items-center justify-center bg-black rounded-lg border border-green-500">
        <div className="flex items-center text-gray-400">
          <RefreshCw size={20} className="mr-2 animate-spin" />
          Loading stock data...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-64 w-full flex items-center justify-center bg-black rounded-lg border border-red-500">
        <div className="flex items-center text-red-400">
          <Info size={20} className="mr-2" />
          {error}
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-64 w-full flex items-center justify-center bg-black rounded-lg border border-green-500">
        <div className="flex items-center text-gray-400">
          <Info size={20} className="mr-2" />
          No data available for {symbol}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black rounded-lg border border-green-500 p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-lg text-white">{symbol}</h3>
            <span className="text-sm text-gray-400">Daily Close Price</span>
          </div>
          <div className="flex items-center mt-1">
            <span className="text-xl font-medium text-white">
              ${data[0].value.toFixed(2)}
            </span>
            <span className={`ml-3 text-sm flex items-center ${
              change >= 0 ? 'text-green-500' : 'text-red-500'
            }`}>
              {change >= 0 ? '+' : ''}{change.toFixed(2)} ({percentChange.toFixed(2)}%)
            </span>
          </div>
        </div>
        <div className="flex items-center text-xs text-gray-400">
          <Calendar size={14} className="mr-1" />
          Last updated: {new Date(data[0].date).toLocaleDateString()}
        </div>
      </div>
      
      <div className="h-64 w-full">
        <ResponsiveContainer>
          <LineChart data={formattedData}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="formattedDate" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#9CA3AF' }}
              dy={10}
            />
            <YAxis 
              domain={[minValue, maxValue]}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#9CA3AF' }}
              dx={-5}
              tickFormatter={(value) => `$${value.toFixed(2)}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={data[0].value} stroke="#6B7280" strokeDasharray="3 3" />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#10B981"
              dot={false}
              activeDot={{ r: 6, fill: '#10B981' }}
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default StockChart;