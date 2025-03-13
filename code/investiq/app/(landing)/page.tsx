'use client';

import React from 'react';
import Link from 'next/link';
import { 
  TrendingUp, 
  ArrowRight
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-gray-900">
      {/* Navigation */}
      <nav className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-lg bg-green-500 flex items-center justify-center">
            <TrendingUp className="text-black" size={24} />
          </div>
          <span className="text-xl font-bold text-white">InvestIQ</span>
        </div>
        
        <div className="flex items-center gap-4">
          <Link 
            href="/dashboard" 
            className="px-4 py-2 bg-green-500 text-black font-medium rounded-lg hover:bg-green-600"
          >
            Enter App
          </Link>
        </div>
      </nav>
      
      {/* Hero Section */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          <div className="lg:w-1/2 space-y-6">
            <div className="inline-block px-4 py-1 bg-green-900/30 text-green-500 rounded-full text-sm font-medium mb-2">
              AI-Powered Investing
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
              Smart investments with personalized insights
            </h1>
            <p className="text-lg text-gray-300">
              InvestIQ leverages AI to analyze market trends, process real-time financial news, and provide personalized investment recommendations tailored to your financial goals.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link 
                href="/dashboard" 
                className="px-6 py-3 bg-green-500 text-black font-medium rounded-lg hover:bg-green-600 flex items-center justify-center"
              >
                Try InvestIQ Now
                <ArrowRight size={18} className="ml-2" />
              </Link>
            </div>
          </div>
          
          <div className="lg:w-1/2 relative">
            <div className="bg-black rounded-xl shadow-2xl border border-green-500 overflow-hidden">
              <div className="p-4 border-b border-green-500">
                <h2 className="text-lg font-bold text-white">Portfolio Overview</h2>
              </div>
              <div className="p-6">
                <div className="flex justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-white">$15,800</h3>
                    <p className="text-green-500 text-sm flex items-center">
                      <TrendingUp size={16} className="mr-1" />
                      +18.2% this month
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    {['1D', '1W', '1M', '1Y'].map(period => (
                      <button 
                        key={period}
                        className={`px-3 py-1 text-xs rounded-md ${
                          period === '1M' 
                            ? 'bg-green-500 text-black font-medium'
                            : 'text-gray-400 bg-gray-800'
                        }`}
                      >
                        {period}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Placeholder chart */}
                <div className="h-48 bg-gray-800 rounded-lg mb-6 relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <TrendingUp size={48} className="text-green-500 opacity-50" />
                  </div>
                  {/* Chart wave design */}
                  <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-green-500/20 to-transparent"></div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <h4 className="text-gray-400 text-sm mb-1">Total Return</h4>
                    <p className="text-white text-lg font-bold">+58.0%</p>
                  </div>
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <h4 className="text-gray-400 text-sm mb-1">Positions</h4>
                    <p className="text-white text-lg font-bold">6</p>
                  </div>
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <h4 className="text-gray-400 text-sm mb-1">Risk Level</h4>
                    <p className="text-white text-lg font-bold">Moderate</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Description Block */}
      <section className="py-12 px-6 bg-black/50 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-4">About InvestIQ</h2>
          <p className="text-gray-300 mb-6">
            InvestIQ is an AI-powered investment assistant that analyzes stock market trends, processes real-time financial 
            news, and provides personalized investment insights and risk alerts. Unlike traditional investment platforms 
            that only offer raw data and generic analytics, our application leverages AI-driven time series analysis 
            and natural language processing to deliver real-time, context-aware financial recommendations tailored to 
            users' personal financial goals and life events.
          </p>
          <Link 
            href="/dashboard" 
            className="px-6 py-2 bg-green-500 text-black font-medium rounded-lg hover:bg-green-600 inline-block"
          >
            Explore the App
          </Link>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-8 px-6 bg-black border-t border-green-500 text-center">
        <div className="max-w-7xl mx-auto">
          <p className="text-gray-400 mb-2">
            InvestIQ - Capstone Project
          </p>
          <p className="text-gray-500 text-sm">
            Professor Henry Wong - Spring 2025
          </p>
          <p className="text-gray-500 text-sm mt-4">
            © 2025 Techno Stack. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}