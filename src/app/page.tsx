'use client';

import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import type { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';
import { format, parseISO } from 'date-fns';
import { 
  Trash2, Home, Utensils, Car, Zap, Shield, Activity, 
  PiggyBank, ShoppingBag, Film, Wallet, Briefcase, 
  TrendingUp, MoreHorizontal, ArrowUpRight, ArrowDownRight, 
  IndianRupee, Calendar, Filter, ChevronLeft, ChevronRight,
  ArrowRightLeft, PieChart as PieChartIcon, PlusSquare
} from 'lucide-react';

type Transaction = {
  _id: string;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
};

const CATEGORIES = [
  'Housing', 'Food', 'Transportation', 'Utilities', 'Insurance', 
  'Medical', 'Saving & Investing', 'Personal Spending', 'Recreation',
  'Salary', 'Freelance', 'Investments', 'Other'
];

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  'Housing': Home, 'Food': Utensils, 'Transportation': Car, 'Utilities': Zap,
  'Insurance': Shield, 'Medical': Activity, 'Saving & Investing': PiggyBank,
  'Personal Spending': ShoppingBag, 'Recreation': Film, 'Salary': Wallet,
  'Freelance': Briefcase, 'Investments': TrendingUp, 'Other': MoreHorizontal
};

const COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#ef4444', '#f97316', '#f59e0b', '#eab308', '#22c55e', '#10b981', '#14b8a6', '#0ea5e9'];

type TabView = 'home' | 'add' | 'activity' | 'stats';

export default function Dashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Mobile Tab State
  const [activeTab, setActiveTab] = useState<TabView>('home');

  // Form State
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [category, setCategory] = useState('Personal Spending');
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Pagination & Filters
  const [currentPage, setCurrentPage] = useState(1);
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const itemsPerPage = 5;

  const fetchTransactions = async () => {
    try {
      const res = await fetch('/api/transactions');
      const data = await res.json();
      if (data.success) {
        setTransactions(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch transactions', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // The async fetch updates state after the request completes; the lint rule flags the call site here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTransactions();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !category) return;
    
    const numAmount = Number(amount);
    if (numAmount > 1000000) {
      alert(`An amount of ${formatCurrency(numAmount)} seems too high for personal ${category.toLowerCase()}. Please enter a realistic amount under ₹10,00,000.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title || category, 
          amount: Number(amount),
          type,
          category,
          date: new Date(date).toISOString(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setTransactions([data.data, ...transactions]);
        setTitle('');
        setAmount('');
        setDate(new Date().toISOString().substring(0, 10));
        // Redirect to Home after adding on mobile
        setActiveTab('home');
      }
    } catch (error) {
      console.error('Failed to add transaction', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const isConfirmed = window.confirm("Are you sure you want to delete this transaction record?");
    if (!isConfirmed) return;

    try {
      const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setTransactions(transactions.filter(t => t._id !== id));
      }
    } catch (error) {
      console.error('Failed to delete transaction', error);
    }
  };

  // Calculations
  const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const expense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const balance = income - expense;

  const expensesByCategory = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc: { name: string; value: number }[], t) => {
      const existing = acc.find((item) => item.name === t.category);
      if (existing) existing.value += t.amount;
      else acc.push({ name: t.category, value: t.amount });
      return acc;
    }, [])
    .sort((a, b) => b.value - a.value);

  const timeSeriesDataMap = transactions.reduce((acc: Record<string, { date: string; income: number; expense: number }>, t) => {
    const d = t.date.substring(0, 10);
    if (!acc[d]) acc[d] = { date: d, income: 0, expense: 0 };
    acc[d][t.type] += t.amount;
    return acc;
  }, {});
  
  const timeSeriesData = Object.values(timeSeriesDataMap)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((item) => ({
      ...item,
      displayDate: format(parseISO(item.date), 'MMM d')
    }));

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const filteredTransactions = transactions.filter(t => filterType === 'all' || t.type === filterType);
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) return (
    <div className="flex h-[80vh] items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );

  return (
    <div className="space-y-6 pb-24 md:pb-10 relative">
      
      {/* Header Summary Cards - Visible on 'home' mobile tab, or always on desktop */}
      <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 transition-all ${activeTab === 'home' ? 'block' : 'hidden md:grid'}`}>
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-900 to-indigo-700 rounded-[5px] p-6 md:p-8 text-white shadow-[0_4px_10px_rgba(79,70,229,0.3)]">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <IndianRupee size={120} />
          </div>
          <div className="relative z-10 flex flex-col justify-between h-full">
            <h3 className="text-indigo-100 font-medium tracking-wide">Total Balance</h3>
            <p className="text-4xl md:text-5xl font-bold mt-2 mb-1 tracking-tight">
              {formatCurrency(balance)}
            </p>
            <p className="text-indigo-200 text-sm">All Time Summary</p>
          </div>
        </div>

        <div className="bg-white rounded-[5px] p-6 border border-gray-100 shadow-[0_4px_10px_rgba(0,0,0,0.03)] flex flex-col justify-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-[5px] bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-inner">
              <ArrowUpRight size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-gray-500 font-medium tracking-wide text-sm">Total Income</h3>
              <p className="text-2xl font-bold text-gray-900 tracking-tight mt-0.5">{formatCurrency(income)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[5px] p-6 border border-gray-100 shadow-[0_4px_10px_rgba(0,0,0,0.03)] flex flex-col justify-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-[5px] bg-rose-50 flex items-center justify-center text-rose-600 shadow-inner">
              <ArrowDownRight size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-gray-500 font-medium tracking-wide text-sm">Total Expenses</h3>
              <p className="text-2xl font-bold text-gray-900 tracking-tight mt-0.5">{formatCurrency(expense)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Form Section - Visible on 'add' mobile tab, or always on desktop */}
        <div className={`lg:col-span-4 space-y-6 ${activeTab === 'add' || activeTab === 'home' ? 'block' : 'hidden md:block'}`}>
          <div className={`bg-white rounded-[5px] shadow-sm border border-gray-100 p-6 md:p-8 ${activeTab === 'home' ? 'hidden md:block' : 'block'}`}>
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <div className="bg-indigo-100 p-2 rounded-[5px] text-indigo-600">
                <IndianRupee size={20} />
              </div>
              Log Transaction
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Type Toggle */}
              <div className="bg-gray-50 p-1.5 rounded-[5px] flex shadow-inner border border-gray-100">
                <button
                  type="button"
                  onClick={() => setType('expense')}
                  className={`flex-1 py-2.5 px-4 text-sm font-bold rounded-[5px] transition-all ${
                    type === 'expense' 
                      ? 'bg-white text-rose-600 shadow-[0_2px_4px_rgba(0,0,0,0.05)] border-b-2 border-gray-200 active:border-b-0 active:translate-y-[2px]' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Expense
                </button>
                <button
                  type="button"
                  onClick={() => setType('income')}
                  className={`flex-1 py-2.5 px-4 text-sm font-bold rounded-[5px] transition-all ${
                    type === 'income' 
                      ? 'bg-white text-emerald-600 shadow-[0_2px_4px_rgba(0,0,0,0.05)] border-b-2 border-gray-200 active:border-b-0 active:translate-y-[2px]' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Income
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Amount</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-gray-400 font-bold text-xl">₹</span>
                  </div>
                  <input
                    type="number"
                    required
                    min="0"
                    max="1000000"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="block w-full pl-10 pr-4 py-3 bg-white border-2 border-gray-100 rounded-[5px] text-gray-900 font-bold text-2xl focus:ring-0 focus:border-indigo-400 focus:shadow-[0_0_10px_rgba(79,70,229,0.1)] transition-all shadow-inner"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Improved Category Selection */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Category</label>
                <div className="grid grid-cols-3 gap-2">
                  {CATEGORIES.map(cat => {
                    const Icon = CATEGORY_ICONS[cat] || MoreHorizontal;
                    const isActive = category === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat)}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-[5px] transition-all border-b-2 active:border-b-0 active:translate-y-[2px] ${
                          isActive 
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm' 
                            : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-600'
                        }`}
                      >
                        <Icon size={16} strokeWidth={isActive ? 2.5 : 2} className="shrink-0" />
                        <span className="text-[11px] font-bold leading-tight truncate text-left">{cat}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
              
              {/* Optional Advanced Settings Toggle */}
              <div className="pt-2 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex justify-between items-center w-full text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors"
                >
                  <span>Advanced Settings</span>
                  <ChevronRight size={16} className={`transition-transform ${showAdvanced ? 'rotate-90' : ''}`} />
                </button>
              </div>

              {showAdvanced && (
                <div className="space-y-4 animate-in slide-in-from-top-2">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Custom Title (Optional)</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="block w-full px-4 py-3 bg-white border-2 border-gray-100 rounded-[5px] text-gray-900 font-medium focus:ring-0 focus:border-indigo-400 focus:shadow-[0_0_10px_rgba(79,70,229,0.1)] transition-all shadow-inner"
                      placeholder="e.g. Birthday Dinner..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Transaction Date</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Calendar size={18} className="text-gray-400" />
                      </div>
                      <input
                        type="date"
                        required
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="block w-full pl-12 pr-4 py-3 bg-white border-2 border-gray-100 rounded-[5px] text-gray-900 font-medium focus:ring-0 focus:border-indigo-400 focus:shadow-[0_0_10px_rgba(79,70,229,0.1)] transition-all appearance-none shadow-inner"
                      />
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 rounded-[5px] text-sm font-bold text-white bg-indigo-600 border-b-[4px] border-indigo-900 active:border-b-0 active:translate-y-[4px] hover:bg-indigo-500 focus:outline-none transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-4 shadow-[0_0_10px_rgba(79,70,229,0.2)]"
              >
                {isSubmitting ? 'Saving...' : `Save ${type === 'income' ? 'Income' : 'Expense'}`}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Charts & Data - Visible on 'stats' or 'activity' mobile tab, or always on desktop */}
        <div className={`lg:col-span-8 space-y-8 ${activeTab === 'stats' || activeTab === 'activity' || activeTab === 'home' ? 'block' : 'hidden md:block'}`}>
          
          {/* Charts Row - Stats Tab */}
          <div className={`grid grid-cols-1 xl:grid-cols-2 gap-6 ${activeTab === 'stats' || activeTab === 'home' ? 'block md:grid' : 'hidden md:grid'}`}>
            
            {/* Plot/Area Chart for Trends over time */}
            <div className="bg-white rounded-[5px] shadow-[0_4px_10px_rgba(0,0,0,0.03)] border border-gray-100 p-6 md:p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex justify-between items-center">
                Cashflow Trend
              </h2>
              
              {timeSeriesData.length > 0 ? (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={timeSeriesData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                      <XAxis 
                        dataKey="displayDate" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fontSize: 12, fill: '#9ca3af'}} 
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fontSize: 12, fill: '#9ca3af'}}
                        tickFormatter={(value) => `₹${value >= 1000 ? (value/1000).toFixed(0) + 'k' : value}`}
                        dx={-10}
                      />
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: ValueType | undefined, name: NameType | undefined) => {
                          const resolvedValue = Array.isArray(value) ? value[0] ?? 0 : value ?? 0;
                          return [formatCurrency(Number(resolvedValue) || 0), name ?? ''];
                        }}
                      />
                      <Area type="monotone" dataKey="income" name="Income" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
                      <Area type="monotone" dataKey="expense" name="Expense" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-400 bg-gray-50/50 rounded-[5px] border border-dashed border-gray-200">
                  <p className="font-medium">No trend data available yet</p>
                </div>
              )}
            </div>

            {/* Expenses By Category Doughnut */}
            <div className="bg-white rounded-[5px] shadow-[0_4px_10px_rgba(0,0,0,0.03)] border border-gray-100 p-6 md:p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Category Split</h2>
              
              {expensesByCategory.length > 0 ? (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expensesByCategory}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                        cornerRadius={8}
                      >
                        {expensesByCategory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: ValueType | undefined, name: NameType | undefined) => {
                          const resolvedValue = Array.isArray(value) ? value[0] ?? 0 : value ?? 0;
                          return [formatCurrency(Number(resolvedValue) || 0), name ?? ''];
                        }}
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                      <Legend 
                        layout="vertical" 
                        verticalAlign="middle" 
                        align="right"
                        iconType="circle"
                        formatter={(value) => <span className="text-gray-600 font-medium ml-1 text-xs">{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-400 bg-gray-50/50 rounded-[5px] border border-dashed border-gray-200">
                  <PieChartIcon size={48} className="text-gray-300 mb-4" />
                </div>
              )}
            </div>

          </div>

          {/* Transactions List - Activity Tab */}
          <div className={`bg-white rounded-[5px] shadow-[0_4px_10px_rgba(0,0,0,0.03)] border border-gray-100 overflow-hidden ${activeTab === 'activity' || activeTab === 'home' ? 'block' : 'hidden md:block'}`}>
            <div className="px-6 md:px-8 py-5 border-b border-gray-100 flex justify-between items-center gap-4 flex-wrap">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                History
                <span className="text-xs font-bold text-white bg-indigo-600 px-2 py-0.5 rounded-full">{transactions.length}</span>
              </h2>
              
              {/* Filter Pills */}
              <div className="flex bg-gray-50 rounded-[5px] p-1 shrink-0 overflow-x-auto shadow-inner border border-gray-100">
                <button 
                  onClick={() => { setFilterType('all'); setCurrentPage(1); }}
                  className={`px-3 py-1.5 text-xs font-bold rounded-[3px] transition-colors ${filterType === 'all' ? 'bg-white shadow-[0_2px_4px_rgba(0,0,0,0.05)] border-b-2 border-gray-200 text-gray-900 active:border-b-0 active:translate-y-[2px]' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  All
                </button>
                <button 
                  onClick={() => { setFilterType('income'); setCurrentPage(1); }}
                  className={`px-3 py-1.5 text-xs font-bold rounded-[3px] transition-colors ${filterType === 'income' ? 'bg-white shadow-[0_2px_4px_rgba(0,0,0,0.05)] border-b-2 border-gray-200 text-emerald-600 active:border-b-0 active:translate-y-[2px]' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Income
                </button>
                <button 
                  onClick={() => { setFilterType('expense'); setCurrentPage(1); }}
                  className={`px-3 py-1.5 text-xs font-bold rounded-[3px] transition-colors ${filterType === 'expense' ? 'bg-white shadow-[0_2px_4px_rgba(0,0,0,0.05)] border-b-2 border-gray-200 text-rose-600 active:border-b-0 active:translate-y-[2px]' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Expense
                </button>
              </div>
            </div>
            
            <div className="divide-y divide-gray-50">
              {paginatedTransactions.length === 0 ? (
                <div className="p-12 text-center text-gray-500 flex flex-col items-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
                    <Filter size={24} />
                  </div>
                  <p className="text-lg font-medium text-gray-900">No records found</p>
                  <p className="text-sm mt-1">Try changing the filter or add new transactions.</p>
                </div>
              ) : (
                paginatedTransactions.map((t) => {
                  const Icon = CATEGORY_ICONS[t.category] || MoreHorizontal;
                  const isIncome = t.type === 'income';
                  
                  return (
                    <div key={t._id} className="p-4 md:px-8 md:py-5 hover:bg-gray-50/80 transition-colors flex items-center justify-between group border-b border-gray-50 last:border-b-0">
                      <div className="flex items-center gap-4 md:gap-5">
                        <div className={`w-12 h-12 rounded-[5px] flex items-center justify-center shadow-inner shrink-0 ${
                          isIncome ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-600'
                        }`}>
                          <Icon size={20} strokeWidth={2.5} />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-gray-900 text-base truncate pr-2">{t.title}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-white border border-gray-200 px-2 py-0.5 rounded-[3px] truncate shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
                              {t.category}
                            </span>
                            <span className="text-[11px] font-semibold text-gray-400 whitespace-nowrap">
                              • {format(parseISO(t.date), 'MMM d, yyyy')}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 shrink-0 pl-2">
                        <span className={`font-bold text-[15px] md:text-lg tracking-tight whitespace-nowrap ${isIncome ? 'text-emerald-600' : 'text-gray-900'}`}>
                          {isIncome ? '+' : '-'}{formatCurrency(t.amount)}
                        </span>
                        <button 
                          onClick={() => handleDelete(t._id)}
                          className="text-gray-300 hover:text-rose-600 hover:bg-rose-50 w-8 h-8 flex items-center justify-center rounded-[5px] transition-all md:opacity-0 md:group-hover:opacity-100"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
                  Page {currentPage} of {totalPages}
                </span>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 border border-gray-200 rounded-[5px] bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_2px_0_0_rgba(229,231,235,1)] active:shadow-none active:translate-y-[2px]"
                  >
                    <ChevronLeft size={16} strokeWidth={2.5} />
                  </button>
                  <button 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 border border-gray-200 rounded-[5px] bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_2px_0_0_rgba(229,231,235,1)] active:shadow-none active:translate-y-[2px]"
                  >
                    <ChevronRight size={16} strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            )}
          </div>
          
        </div>
      </div>

      {/* Actual Functioning Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 flex justify-between items-center z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] safe-area-bottom pb-6">
        <button 
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center gap-1 transition-colors w-16 ${activeTab === 'home' ? 'text-indigo-600' : 'text-gray-400'}`}
        >
          <Home size={24} strokeWidth={activeTab === 'home' ? 2.5 : 2} />
          <span className="text-[10px] font-bold">Home</span>
        </button>
        <button 
          onClick={() => setActiveTab('activity')}
          className={`flex flex-col items-center gap-1 transition-colors w-16 ${activeTab === 'activity' ? 'text-indigo-600' : 'text-gray-400'}`}
        >
          <ArrowRightLeft size={24} strokeWidth={activeTab === 'activity' ? 2.5 : 2} />
          <span className="text-[10px] font-semibold">Activity</span>
        </button>
        
        {/* Floating Add Action Button */}
        <button 
          onClick={() => setActiveTab('add')}
          className="flex flex-col items-center justify-center -mt-8 bg-indigo-600 text-white w-14 h-14 rounded-full shadow-[0_4px_10px_rgba(79,70,229,0.4)] border border-indigo-700 transition-all border-b-[4px] active:border-b-0 active:translate-y-[4px]"
        >
          <PlusSquare size={24} strokeWidth={2.5} />
        </button>
        
        <button 
          onClick={() => setActiveTab('stats')}
          className={`flex flex-col items-center gap-1 transition-colors w-16 ${activeTab === 'stats' ? 'text-indigo-600' : 'text-gray-400'}`}
        >
          <PieChartIcon size={24} strokeWidth={activeTab === 'stats' ? 2.5 : 2} />
          <span className="text-[10px] font-semibold">Stats</span>
        </button>
      </div>

    </div>
  );
}