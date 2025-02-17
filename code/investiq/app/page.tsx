'use client';

import React from 'react';
import { 
  BarChart3, 
  Newspaper, 
  Target, 
  User, 
  TrendingUp, 
  Briefcase, 
  Clock, 
  DollarSign,
  BadgePercent
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

export default function Home() {
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

  // Financial goals
  const goals = [
    { name: "Emergency Fund", target: 25000, current: 20000, progress: 80, color: "bg-blue-600" },
    { name: "Retirement", target: 1000000, current: 150000, progress: 15, color: "bg-purple-600" },
    { name: "House Down Payment", target: 100000, current: 45000, progress: 45, color: "bg-green-600" },
    { name: "Vacation Fund", target: 5000, current: 3000, progress: 60, color: "bg-orange-500" },
    { name: "New Car", target: 35000, current: 15000, progress: 43, color: "bg-pink-500" },
  ];

  // Investment holdings
  const investments = [
    { 
      company: "Apple Inc.",
      symbol: "AAPL",
      shares: 15,
      avgPrice: 150,
      currentPrice: 175,
      totalValue: 2625,
      gain: 375,
      gainPercent: 14.3,
      color: "bg-gray-100"
    },
    { 
      company: "Microsoft",
      symbol: "MSFT",
      shares: 10,
      avgPrice: 280,
      currentPrice: 310,
      totalValue: 3100,
      gain: 300,
      gainPercent: 9.7,
      color: "bg-blue-100"
    },
    { 
      company: "Google",
      symbol: "GOOGL",
      shares: 8,
      avgPrice: 2800,
      currentPrice: 2950,
      totalValue: 23600,
      gain: 1200,
      gainPercent: 5.1,
      color: "bg-green-100"
    },
    { 
      company: "Amazon",
      symbol: "AMZN",
      shares: 12,
      avgPrice: 130,
      currentPrice: 145,
      totalValue: 1740,
      gain: 180,
      gainPercent: 11.5,
      color: "bg-yellow-100"
    }
  ];

  // Recommended news
  const recommendedNews = [
    { 
      title: "Apple's New AI Strategy Could Boost Stock",
      category: "Stock News",
      relevance: "Related to your AAPL investment",
      time: "2 hours ago",
      impact: "Positive",
      symbol: "AAPL"
    },
    { 
      title: "Housing Market Shows Signs of Cooling",
      category: "Real Estate",
      relevance: "Related to your House Down Payment goal",
      time: "3 hours ago",
      impact: "Neutral",
      symbol: "GOAL"
    },
    { 
      title: "Microsoft Cloud Revenue Exceeds Expectations",
      category: "Stock News",
      relevance: "Related to your MSFT investment",
      time: "4 hours ago",
      impact: "Positive",
      symbol: "MSFT"
    },
    { 
      title: "New Retirement Saving Strategies for 2025",
      category: "Financial Planning",
      relevance: "Related to your Retirement goal",
      time: "5 hours ago",
      impact: "Neutral",
      symbol: "GOAL"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Navigation Bar */}
      <nav className="flex items-center justify-between px-6 py-4 bg-white shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <TrendingUp className="text-blue-600" />
          <div className="text-xl font-bold">InvestIQ</div>
        </div>
        <div className="flex items-center gap-6">
          <a href="#" className="flex items-center gap-2 hover:text-blue-600 transition-colors">
            <Briefcase size={20} />
            <span>Portfolio</span>
          </a>
          <a href="#" className="flex items-center gap-2 hover:text-blue-600 transition-colors">
            <Target size={20} />
            <span>Goals</span>
          </a>
          <a href="#" className="flex items-center gap-2 hover:text-blue-600 transition-colors">
            <Newspaper size={20} />
            <span>News</span>
          </a>
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <User size={24} />
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 p-6 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Column - Goals and News */}
          <div className="col-span-4 space-y-6">
            {/* Financial Goals */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Financial Goals</h2>
                <Target className="text-blue-600" size={24} />
              </div>
              <div className="space-y-6">
                {goals.map((goal, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <p className="font-medium">{goal.name}</p>
                      <p className="text-sm text-gray-500">{goal.progress}%</p>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full">
                      <div 
                        className={`h-full ${goal.color} rounded-full transition-all duration-500`}
                        style={{ width: `${goal.progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>${goal.current.toLocaleString()}</span>
                      <span>Goal: ${goal.target.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommended News */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Recommended News</h2>
                <Newspaper className="text-blue-600" size={24} />
              </div>
              <div className="space-y-4">
                {recommendedNews.map((news, index) => (
                  <div key={index} className="p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100">
                    <div className="flex items-start gap-3">
                      <div className="w-full">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                            {news.category}
                          </span>
                          {news.impact === "Positive" && (
                            <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                              Positive Impact
                            </span>
                          )}
                        </div>
                        <h3 className="font-medium text-sm mb-1">{news.title}</h3>
                        <p className="text-xs text-blue-600 mb-1">{news.relevance}</p>
                        <p className="text-xs text-gray-500">{news.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Portfolio Graph - Right Side */}
          <div className="col-span-8 bg-white rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-semibold">Portfolio Performance</h2>
                <p className="text-gray-500">Total Value: $31,065</p>
              </div>
              <div className="text-right">
                <div className="text-green-500 text-lg">+$2,055 (7.1%)</div>
                <p className="text-sm text-gray-500">This Year</p>
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

          {/* Investments Overview */}
          <div className="col-span-12 bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold">Investment Holdings</h2>
                <p className="text-gray-500">Your invested companies</p>
              </div>
              <BadgePercent className="text-blue-600" size={24} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {investments.map((investment, index) => (
                <div 
                  key={index} 
                  className={`${investment.color} rounded-xl p-4 transition-transform hover:scale-105`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold">{investment.company}</h3>
                      <p className="text-sm text-gray-600">{investment.symbol}</p>
                    </div>
                    <span className="text-green-500 text-sm">+{investment.gainPercent}%</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Shares</span>
                      <span className="font-medium">{investment.shares}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Avg Price</span>
                      <span className="font-medium">${investment.avgPrice}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Current</span>
                      <span className="font-medium">${investment.currentPrice}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t">
                      <span className="text-sm text-gray-600">Total Value</span>
                      <span className="font-semibold">${investment.totalValue}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}