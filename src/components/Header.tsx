'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { User, Database, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export default function Header() {
  const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    // We can ping the health check or the transactions endpoint just to verify
    const checkDb = async () => {
      try {
        const res = await fetch('/api/transactions?limit=1');
        const data = await res.json();
        if (data.success || res.ok) {
          setDbStatus('connected');
        } else {
          setDbStatus('error');
        }
      } catch (error) {
        setDbStatus('error');
      }
    };
    
    checkDb();
  }, []);

  return (
    <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        
        {/* Logo Section */}
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-[5px] overflow-hidden">
            <Image 
              src="/logo.png" 
              alt="FinTrack Logo" 
              fill
              className="object-cover"
              priority
            />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">FinTrack</h1>
            <p className="text-xs text-gray-500 font-medium tracking-wide">Expense Analyzer</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          
          {/* DB Status Badge inside Header */}
          <div 
            className="relative flex items-center"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            onClick={() => setShowTooltip(!showTooltip)}
          >
            <div className={`flex items-center gap-2 cursor-pointer px-3 py-1.5 rounded-full border transition-all ${
              dbStatus === 'connected' ? 'bg-emerald-50 border-emerald-100' : 
              dbStatus === 'error' ? 'bg-rose-50 border-rose-100' : 'bg-amber-50 border-amber-100'
            }`}>
              {dbStatus === 'connected' && (
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse"></div>
              )}
              {dbStatus === 'error' && (
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]"></div>
              )}
              {dbStatus === 'checking' && (
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></div>
              )}
              <Database size={14} className={
                dbStatus === 'connected' ? 'text-emerald-700' : 
                dbStatus === 'error' ? 'text-rose-700' : 'text-amber-700'
              } />
              <span className={`text-[11px] font-bold uppercase tracking-wider hidden sm:block ${
                dbStatus === 'connected' ? 'text-emerald-700' : 
                dbStatus === 'error' ? 'text-rose-700' : 'text-amber-700'
              }`}>
                {dbStatus === 'connected' ? 'Online' : dbStatus === 'error' ? 'Offline' : 'Checking'}
              </span>
            </div>

            {/* Tooltip / Poup */}
            {showTooltip && (
              <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-100 p-4 z-50 animate-in slide-in-from-top-2">
                <div className="flex items-start gap-3">
                  {dbStatus === 'connected' ? (
                    <CheckCircle2 className="text-emerald-500 mt-0.5 shrink-0" size={20} />
                  ) : dbStatus === 'error' ? (
                    <XCircle className="text-rose-500 mt-0.5 shrink-0" size={20} />
                  ) : (
                    <Loader2 className="text-amber-500 mt-0.5 shrink-0 animate-spin" size={20} />
                  )}
                  
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">
                      {dbStatus === 'connected' ? 'Database Connected' : 
                       dbStatus === 'error' ? 'Connection Failed' : 'Connecting to Database...'}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">
                      {dbStatus === 'connected' 
                        ? 'Your database is connected and working properly. All changes will be saved safely in the cloud.' 
                        : dbStatus === 'error'
                        ? 'Could not connect to MongoDB. Check your internet connection and .env configuration.'
                        : 'Establishing secure connection with the cluster...'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
        </div>
      </div>
    </header>
  );
}