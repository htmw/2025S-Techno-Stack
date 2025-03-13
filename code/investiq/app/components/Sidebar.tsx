// components/Sidebar.tsx
'use client';

import { 
  TrendingUp, 
  LayoutDashboard, 
  Target, 
  LineChart, 
  User,
  X
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  // Use effect to add overflow hidden to body when sidebar is open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  return (
    <>
      {/* Mobile sidebar backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 transform bg-black border-r border-green-500 shadow-lg transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Sidebar header */}
        <div className="p-4 border-b border-green-500 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-green-500 flex items-center justify-center">
              <TrendingUp className="text-black" size={18} />
            </div>
            <span className="text-lg font-bold text-white">InvestIQ</span>
          </div>
          
          <button 
            onClick={onClose}
            className="lg:hidden p-1 rounded hover:bg-gray-800 text-white"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Sidebar links */}
        <nav className="p-4 space-y-1">
          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-gray-800 text-gray-300 hover:text-white transition-colors">
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </Link>
          
          <Link href="/portfolio" className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-gray-800 text-gray-300 hover:text-white transition-colors">
            <LineChart size={20} />
            <span>Portfolio</span>
          </Link>
          
          <Link href="/recommendations" className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-gray-800 text-gray-300 hover:text-white transition-colors">
            <Target size={20} />
            <span>Recommendations</span>
          </Link>
        </nav>
        
        {/* User section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-green-500">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-800 cursor-pointer">
            <div className="h-9 w-9 rounded-full bg-gray-700 flex items-center justify-center">
              <User size={18} className="text-green-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Alex Morgan</p>
              <p className="text-xs text-gray-400">View Profile</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}