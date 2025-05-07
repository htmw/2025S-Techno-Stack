'use client';

import { 
  Menu,
  DollarSign
} from "lucide-react";
import { useState } from "react";
import Sidebar from "../components/Sidebar";
import DepositModal from "../components/DepositModal";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  
  return (
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
          
          {/* Right side - Deposit button */}
          <div className="flex items-center">
            <button 
              onClick={() => setDepositModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-black bg-green-500 rounded-lg hover:bg-green-600 transition-colors"
            >
              <DollarSign size={16} />
              <span>Deposit</span>
            </button>
          </div>
        </header>
        
        {/* Page content */}
        <main className="flex-1 overflow-auto p-0">
          {children}
        </main>
      </div>

      {/* Deposit Modal */}
      <DepositModal 
        isOpen={depositModalOpen} 
        onClose={() => setDepositModalOpen(false)} 
      />
    </div>
  );
}