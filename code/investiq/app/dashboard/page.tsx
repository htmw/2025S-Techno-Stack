// app/dashboard/page.tsx
'use client';

import React from 'react';
import { 
  Target, 
  Newspaper,
  BadgePercent 
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

export default function Dashboard() {
  // Portfolio performance data
  const portfolioData = [
    { month: 'Jan', value: 10000 },
    { month: 'Feb', value: 12500 },
    { month: 'Mar', value: 11800 },
    { month: 'Apr', value: 13200 },
    { month: 'May', value: 14500 },
    { month: 'Jun', value: 14000 },
    { month: 'Jul', value: 15800 },
  ];

  // Mock recommendations (US3)
  const recommendations = [
    { stock: "AAPL", suggestion: "Buy", details: "Strong growth potential" },
    { stock: "MSFT", suggestion: "Hold", details: "Stable performance" },
    { stock: "GOOGL", suggestion: "Buy", details: "Market leader position" }
  ];

  // Mock news feed
  const news = [
    {
      title: "Market Update: Tech Stocks Rally",
      category: "Market News",
      time: "2 hours ago"
    },
    {
      title: "New Investment Opportunities in Green Energy",
      category: "Industry Analysis",
      time: "4 hours ago"
    },
    {
      title: "Global Economic Trends Q3 2024",
      category: "Economic News",
      time: "5 hours ago"
    }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto w-full">
      <div className="grid grid-cols-12 gap-6">
        {/* Left Column - Recommendations and News */}
        <div className="col-span-4 space-y-6">
          {/* Recommendations Section (US3) */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Recommendations</h2>
              <BadgePercent className="text-blue-600" size={24} />
            </div>
            <div className="space-y-4">
              {recommendations.map((rec, index) => (
                <div key={index} className="p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold">{rec.stock}</h3>
                    <span className="text-blue-600">{rec.suggestion}</span>
                  </div>
                  <p className="text-sm text-gray-600">{rec.details}</p>
                  <button className="mt-2 text-sm text-blue-600 hover:text-blue-800">
                    View Details
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* News Section */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Market News</h2>
              <Newspaper className="text-blue-600" size={24} />
            </div>
            <div className="space-y-4">
              {news.map((item, index) => (
                <div key={index} className="p-3 rounded-lg hover:bg-gray-50 border">
                  <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 mb-2 inline-block">
                    {item.category}
                  </span>
                  <h3 className="font-medium text-sm mb-1">{item.title}</h3>
                  <p className="text-xs text-gray-500">{item.time}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Portfolio Performance */}
        <div className="col-span-8 bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-semibold">Portfolio Trends</h2>
              <p className="text-gray-500">Performance Overview</p>
            </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer>
              <AreaChart data={portfolioData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#2563eb"
                  fill="#93c5fd"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}