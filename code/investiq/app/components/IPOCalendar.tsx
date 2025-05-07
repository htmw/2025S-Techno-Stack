'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCw, Calendar, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react';
import config from '../config';

interface IPOData {
  date: string;
  exchange: string;
  name: string;
  numberOfShares: number;
  price: string;
  status: string;
  symbol: string;
  totalSharesValue: number;
}

const IPOCalendar: React.FC = () => {
  const [ipoData, setIpoData] = useState<IPOData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchIPOData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Calculate date range (today to 30 days from now)
        const today = new Date();
        const thirtyDaysLater = new Date();
        thirtyDaysLater.setDate(today.getDate() + 30);
        
        // Format dates as YYYY-MM-DD
        const fromDate = today.toISOString().split('T')[0];
        const toDate = thirtyDaysLater.toISOString().split('T')[0];
        
        // Fetch data from Finnhub API
        const response = await fetch(
          `https://finnhub.io/api/v1/calendar/ipo?from=${fromDate}&to=${toDate}&token=${config.finnhubApiKey}`
        );
        
        if (!response.ok) {
          throw new Error(`API request failed: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data && data.ipoCalendar && Array.isArray(data.ipoCalendar)) {
          // Sort by date, with most recent first
          const sortedData = [...data.ipoCalendar].sort((a, b) => 
            new Date(a.date).getTime() - new Date(b.date).getTime()
          );
          
          setIpoData(sortedData);
        } else {
          setIpoData([]);
        }
      } catch (err) {
        console.error('Error fetching IPO data:', err);
        setError('IPO Calendar is down. Sorry for the inconvenience.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchIPOData();
  }, []);

  // Format date to readable string
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Format number with commas
  const formatNumber = (num: number) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Get price display (range or single value)
  const getFormattedPrice = (price: string) => {
    if (price.includes('-')) {
      return `$${price}`;
    }
    return `$${price}`;
  };

  return (
    <div className="bg-black rounded-xl shadow-sm overflow-hidden border border-green-500">
      <div className="p-4 border-b border-green-500 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar size={18} className="text-green-500" />
          <h2 className="text-base font-bold text-white">Upcoming IPOs</h2>
        </div>
        
        <div className="text-xs text-gray-400 flex items-center">
          Next 30 days
        </div>
      </div>
      
      {isLoading ? (
        <div className="p-8 flex justify-center">
          <RefreshCw size={24} className="text-gray-400 animate-spin" />
        </div>
      ) : error ? (
        <div className="p-8 flex flex-col items-center justify-center text-center">
          <AlertTriangle size={24} className="text-yellow-500 mb-2" />
          <p className="text-gray-300">{error}</p>
        </div>
      ) : ipoData.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-gray-400">No upcoming IPOs scheduled in the next 30 days.</p>
        </div>
      ) : (
        <div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-gray-400 border-b border-gray-800">
                  <th className="py-3 px-4 text-left">Date</th>
                  <th className="py-3 px-4 text-left">Company</th>
                  <th className="py-3 px-4 text-center">Symbol</th>
                  <th className="py-3 px-4 text-right">Price</th>
                  <th className="py-3 px-4 text-right">Shares</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {ipoData.map((ipo, index) => (
                  <tr key={index} className="text-white hover:bg-gray-800">
                    <td className="py-3 px-4 text-left">{formatDate(ipo.date)}</td>
                    <td className="py-3 px-4 text-left">
                      <div>
                        <div className="font-medium">{ipo.name}</div>
                        <div className="text-xs text-gray-400">{ipo.exchange}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-block px-2 py-1 bg-gray-800 text-green-500 rounded">
                        {ipo.symbol}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-medium">
                      {getFormattedPrice(ipo.price)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div>
                        <div>{formatNumber(ipo.numberOfShares)}</div>
                        <div className="text-xs text-gray-400">
                          ${(ipo.totalSharesValue / 1000000).toFixed(1)}M
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="p-3 border-t border-green-500 text-center">
            <p className="text-xs text-gray-400">
              Data provided by Finnhub. IPO dates may be subject to change.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default IPOCalendar;