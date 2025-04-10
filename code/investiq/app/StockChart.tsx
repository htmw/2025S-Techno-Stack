// app/StockChart.tsx
'use client';

import React, { useMemo } from 'react';
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
import { Calendar, RefreshCw, Info, ArrowUp, ArrowDown } from "lucide-react";
import { StockDataPoint } from './services/StockService';

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    payload: {
      date: string;
      formattedDate?: string;
      [key: string]: any;
    };
  }>;
  label?: string;
}

interface StockChartProps {
  data: StockDataPoint[] | null;
  symbol: string;
  isLoading: boolean;
  error: string | null;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black p-3 border border-green-500 rounded-lg shadow-lg text-white">
        <p className="font-medium">
          ${payload[0].value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        <p className="text-xs text-gray-400">{payload[0].payload.formattedDate}</p>
      </div>
    );
  }
  return null;
};

const StockChart: React.FC<StockChartProps> = ({ data, symbol, isLoading, error }) => {
  const processedData = useMemo< (StockDataPoint & { formattedDate: string })[] | null>(() => {
    if (!data) return null;

    return data.map(item => ({
      ...item,
      formattedDate: new Date(item.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      })
    }));
  }, [data]);

  const metrics = useMemo(() => {
    if (!data || data.length < 2) {
      return {
        currentPrice: 0,
        change: 0,
        percentChange: 0,
        minValue: 0,
        maxValue: 100
      };
    }

    const currentPrice = data[0].value;
    const previousPrice = data[1].value;
    const change = currentPrice - previousPrice;
    const percentChange = (change / previousPrice) * 100;

    const allValues = data.map(item => item.value);
    const minValue = Math.min(...allValues) * 0.995;
    const maxValue = Math.max(...allValues) * 1.005;

    return { currentPrice, change, percentChange, minValue, maxValue };
  }, [data]);

  if (isLoading) {
    return (
      <div className="bg-black rounded-xl border border-green-500 p-4">
        <div className="h-[400px] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <RefreshCw size={32} className="text-green-500 animate-spin" />
            <p className="text-gray-400">Loading {symbol} data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-black rounded-xl border border-red-500 p-4">
        <div className="h-[400px] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Info size={32} className="text-red-500" />
            <p className="text-red-400">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!processedData || processedData.length === 0) {
    return (
      <div className="bg-black rounded-xl border border-green-500 p-4">
        <div className="h-[400px] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Info size={32} className="text-yellow-500" />
            <p className="text-gray-400">No data available for {symbol}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black rounded-xl border border-green-500 p-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white">{symbol}</h2>
            <span className="text-sm text-gray-400">Daily Price</span>
          </div>
          <div className="flex items-center mt-2">
            <span className="text-2xl font-bold text-white">
              ${metrics.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <div className={`ml-3 flex items-center ${metrics.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {metrics.change >= 0 ? <ArrowUp size={16} className="mr-1" /> : <ArrowDown size={16} className="mr-1" />}
              <span className="text-sm font-medium">
                {metrics.change >= 0 ? '+' : ''}
                {metrics.change.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                ({metrics.percentChange >= 0 ? '+' : ''}
                {metrics.percentChange.toFixed(2)}%)
              </span>
            </div>
          </div>
        </div>

        {/* ← use processedData here so TS knows it's non‑null */}
        <div className="flex items-center text-xs text-gray-400">
          <Calendar size={14} className="mr-1" />
          Last updated: {new Date(processedData[0].date).toLocaleDateString()}
        </div>
      </div>

      <div className="h-[300px]">
        <ResponsiveContainer>
          <LineChart data={processedData}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0.1} />
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
              domain={[metrics.minValue, metrics.maxValue]}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#9CA3AF' }}
              dx={-5}
              tickFormatter={(v) =>
                `$${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              }
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={metrics.currentPrice} stroke="#6B7280" strokeDasharray="3 3" />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#10B981"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6, fill: '#10B981' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default StockChart;
