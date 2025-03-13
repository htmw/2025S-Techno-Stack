'use client';

import { Inter } from "next/font/google";
import "./globals.css";
import { usePathname } from 'next/navigation';
import { useState } from "react";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  
  // Check if we're on the landing page (root route)
  const isLandingPage = pathname === '/';
  
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased bg-slate-100 text-slate-900 dark:bg-slate-900 dark:text-slate-100`}>
        {children}
      </body>
    </html>
  );
}