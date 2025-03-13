'use client';

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { 
  TrendingUp, 
  Briefcase, 
  Target, 
  Newspaper, 
  User 
} from "lucide-react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "InvestIQ - Smart Investment Dashboard",
  description: "Personal investment dashboard with intelligent recommendations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col bg-gray-50`}>
        {/* Navigation Bar */}
        <nav className="flex items-center justify-between px-6 py-4 bg-white shadow-sm sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <TrendingUp className="text-blue-600" />
            <div className="text-xl font-bold font-sans">InvestIQ</div>
          </div>
          <div className="flex items-center gap-6">
            <a href="/dashboard" className="flex items-center gap-2 hover:text-blue-600 transition-colors">
              <Briefcase size={20} />
              <span>Dashboard</span>
            </a>
            <a href="/profile" className="flex items-center gap-2 hover:text-blue-600 transition-colors">
              <Target size={20} />
              <span>Profile</span>
            </a>
            <a href="/recommendations" className="flex items-center gap-2 hover:text-blue-600 transition-colors">
              <Newspaper size={20} />
              <span>Recommendations</span>
            </a>
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <User size={24} />
            </button>
          </div>
        </nav>
        <main className="flex-1">
          {children}
        </main>
      </body>
    </html>
  );
}