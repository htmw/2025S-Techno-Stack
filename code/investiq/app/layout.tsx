// app/layout.tsx
'use client';

import { Inter } from "next/font/google";
import "./globals.css";
import { 
  Bell,
  Search,
  Menu
} from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import Sidebar from "./components/Sidebar";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased bg-slate-100 text-slate-900 dark:bg-slate-900 dark:text-slate-100`}>
        <div className="flex h-screen overflow-hidden">
          {/* Sidebar component */}
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          
          {/* Main content area */}
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Top navbar */}
            <header className="z-10 py-4 px-6 bg-black text-white border-b border-green-500 shadow-sm flex items-center justify-between">
              {/* Left side - Mobile menu */}
              <button 
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-lg hover:bg-gray-800 lg:hidden"
              >
                <Menu size={20} />
              </button>
              
              {/* Center - Search */}
              <div className="max-w-xl w-full mx-4 hidden sm:block">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search for assets, markets, news..."
                    className="block w-full pl-10 pr-4 py-2 border border-gray-700 rounded-lg bg-gray-800 text-sm focus:ring-1 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>
              
              {/* Right side - Actions */}
              <div className="flex items-center gap-2">
                <button className="p-2 rounded-lg hover:bg-gray-800 relative">
                  <Bell size={20} />
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-green-500"></span>
                </button>
                
                <button className="ml-2 hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-black bg-green-500 rounded-lg hover:bg-green-600 transition-colors">
                  <span>Deposit</span>
                </button>
              </div>
            </header>
            
            {/* Page content */}
            <main className="flex-1 overflow-auto p-0">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}