'use client';

import { useState, useEffect, useCallback } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import type { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';
import { format, parseISO } from 'date-fns';
import { 
  Trash2, Home, Utensils, Car, Zap, Shield, Activity, 
  PiggyBank, ShoppingBag, Film, Wallet, Briefcase, 
  TrendingUp, MoreHorizontal, ArrowUpRight, ArrowDownRight, 
  IndianRupee, Calendar, Filter, ChevronLeft, ChevronRight,
  ArrowRightLeft, PieChart as PieChartIcon, PlusSquare,
  Mail, User, KeyRound, LogOut, Sparkles, CheckCircle2
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
type AuthMode = 'login' | 'register';

type AuthUser = {
  id: string;
  name: string;
  email: string;
  avatarColor: string;
};

const GUIDE_SLIDES = [
  {
    icon: Wallet,
    title: 'Track money without mixing lives',
    body: 'FinTrack keeps income, spending, and balance in one private workspace.',
    pills: ['Income', 'Expenses', 'INR ready'],
  },
  {
    icon: PieChartIcon,
    title: 'See what changed at a glance',
    body: 'Charts turn daily entries into trends, category splits, and quick decisions.',
    pills: ['Cashflow', 'Categories', 'History'],
  },
  {
    icon: Shield,
    title: 'Your records belong to your account',
    body: 'Every transaction is attached to the signed-in user before it reaches MongoDB.',
    pills: ['Private vault', 'Signed session', 'User scoped'],
  },
  {
    icon: Activity,
    title: 'Use it like a pocket finance app',
    body: 'Add from mobile, review history, and keep cloud data separated from other users.',
    pills: ['Mobile tabs', 'Cloud sync', 'Quick add'],
  },
];

const VAULT_WORDS = [
  'mint', 'ledger', 'river', 'lotus', 'orbit', 'rupee', 'summit', 'pixel',
  'harbor', 'copper', 'velvet', 'budget', 'monsoon', 'spark', 'anchor', 'citrus',
];

const AVATAR_COLORS = ['#4f46e5', '#0f766e', '#db2777', '#ea580c', '#2563eb', '#16a34a'];

export default function Dashboard() {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [guideComplete, setGuideComplete] = useState(false);
  const [guideIndex, setGuideIndex] = useState(0);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [vaultKey, setVaultKey] = useState('');
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);
  const [authError, setAuthError] = useState('');
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  
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

  const fetchTransactions = useCallback(async () => {
    try {
      const res = await fetch('/api/transactions');
      const data = await res.json();
      if (data.success) {
        setTransactions(data.data);
      } else if (res.status === 401) {
        setAuthUser(null);
        setTransactions([]);
      }
    } catch (error) {
      console.error('Failed to fetch transactions', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      setGuideComplete(window.localStorage.getItem('fintrack_guide_complete') === 'true');

      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (res.ok && data.success) {
          setLoading(true);
          setAuthUser(data.user);
        }
      } catch (error) {
        console.error('Failed to restore session', error);
      } finally {
        setCheckingSession(false);
      }
    };

    bootstrap();
  }, []);

  useEffect(() => {
    if (authUser) {
      // The request resolves asynchronously before transaction state is updated.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchTransactions();
      return;
    }

    setTransactions([]);
    setLoading(false);
  }, [authUser, fetchTransactions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !category) return;
    
    const numAmount = Number(amount);
    if (!Number.isFinite(numAmount) || numAmount <= 0) {
      alert('Please enter an amount greater than zero.');
      return;
    }

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
          amount: numAmount,
          type,
          category,
          date: new Date(date).toISOString(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setTransactions((current) => [data.data, ...current]);
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
        setTransactions((current) => current.filter(t => t._id !== id));
      }
    } catch (error) {
      console.error('Failed to delete transaction', error);
    }
  };

  const generateVaultKey = () => {
    const values = new Uint32Array(4);
    window.crypto.getRandomValues(values);
    const words = Array.from(values, (value) => VAULT_WORDS[value % VAULT_WORDS.length]);
    setVaultKey(words.join('-'));
    setAuthError('');
  };

  const completeGuide = () => {
    window.localStorage.setItem('fintrack_guide_complete', 'true');
    setGuideComplete(true);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSubmitting(true);

    try {
      const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const payload = authMode === 'login'
        ? { email: authEmail, vaultKey }
        : { name: authName, email: authEmail, vaultKey, avatarColor };
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setAuthError(data.error || 'Could not open your vault');
        return;
      }

      setLoading(true);
      setAuthUser(data.user);
      setAuthName('');
      setVaultKey('');
      setActiveTab('home');
    } catch (error) {
      console.error('Failed to authenticate', error);
      setAuthError('Could not reach the server. Please try again.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      setAuthUser(null);
      setTransactions([]);
      setActiveTab('home');
      setLoading(false);
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
  const visiblePage = totalPages > 0 ? Math.min(currentPage, totalPages) : 1;
  const paginatedTransactions = filteredTransactions.slice(
    (visiblePage - 1) * itemsPerPage,
    visiblePage * itemsPerPage
  );

  const currentGuide = GUIDE_SLIDES[guideIndex];
  const GuideIcon = currentGuide.icon;
  const isLastGuide = guideIndex === GUIDE_SLIDES.length - 1;

  if (checkingSession) return (
    <div className="flex h-[80vh] items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );

  if (!guideComplete) return (
    <div className="min-h-[78vh] grid place-items-center py-8">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-8 items-center">
        <section className="space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-4 py-2 text-sm font-bold text-indigo-700">
            <Sparkles size={16} />
            FinTrack private guide
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-extrabold text-gray-950 leading-tight">
              {currentGuide.title}
            </h1>
            <p className="text-base md:text-lg text-gray-600 max-w-2xl leading-8">
              {currentGuide.body}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {currentGuide.pills.map((pill) => (
              <span key={pill} className="rounded-full bg-white border border-gray-200 px-4 py-2 text-sm font-bold text-gray-700 shadow-sm">
                {pill}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => isLastGuide ? completeGuide() : setGuideIndex((index) => index + 1)}
              className="inline-flex items-center gap-2 rounded-[5px] bg-indigo-600 px-5 py-3 text-sm font-bold text-white border-b-[4px] border-indigo-900 hover:bg-indigo-500 active:border-b-0 active:translate-y-[4px] transition-all"
            >
              {isLastGuide ? 'Open Login' : 'Next'}
              <ChevronRight size={18} />
            </button>
            {guideIndex > 0 && (
              <button
                type="button"
                onClick={() => setGuideIndex((index) => Math.max(0, index - 1))}
                className="inline-flex items-center gap-2 rounded-[5px] border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all"
              >
                <ChevronLeft size={18} />
                Back
              </button>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            {GUIDE_SLIDES.map((slide, index) => (
              <button
                key={slide.title}
                type="button"
                aria-label={`Go to guide slide ${index + 1}`}
                onClick={() => setGuideIndex(index)}
                className={`h-2.5 rounded-full transition-all ${index === guideIndex ? 'w-10 bg-indigo-600' : 'w-2.5 bg-gray-300 hover:bg-gray-400'}`}
              />
            ))}
          </div>
        </section>

        <section className="relative overflow-hidden rounded-[5px] border border-gray-100 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <div className="absolute right-0 top-0 h-32 w-32 bg-emerald-50"></div>
          <div className="relative space-y-8">
            <div className="h-20 w-20 rounded-[5px] bg-gray-950 text-white flex items-center justify-center shadow-[0_10px_30px_rgba(17,24,39,0.18)]">
              <GuideIcon size={38} strokeWidth={2.4} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-[5px] border border-gray-100 bg-gray-50 p-4">
                <p className="text-xs font-bold uppercase text-gray-500">Balance</p>
                <p className="text-2xl font-extrabold text-gray-950 mt-2">₹48k</p>
              </div>
              <div className="rounded-[5px] border border-gray-100 bg-gray-50 p-4">
                <p className="text-xs font-bold uppercase text-gray-500">Private</p>
                <p className="text-2xl font-extrabold text-emerald-600 mt-2">On</p>
              </div>
              <div className="col-span-2 rounded-[5px] border border-indigo-100 bg-indigo-50 p-4">
                <div className="flex items-center gap-3">
                  <Shield size={22} className="text-indigo-700" />
                  <p className="text-sm font-bold text-indigo-900">Records are filtered by the signed-in user before MongoDB returns them.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );

  if (!authUser) return (
    <div className="min-h-[78vh] grid place-items-center py-8">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-8 items-stretch">
        <section className="bg-gray-950 text-white rounded-[5px] p-8 md:p-10 flex flex-col justify-between overflow-hidden relative">
          <div className="absolute right-0 top-0 h-40 w-40 bg-indigo-600/25"></div>
          <div className="relative space-y-8">
            <div className="h-14 w-14 rounded-[5px] bg-white text-gray-950 flex items-center justify-center">
              <KeyRound size={28} />
            </div>
            <div>
              <h1 className="text-3xl md:text-5xl font-extrabold leading-tight">Open your private finance vault</h1>
              <p className="mt-4 text-gray-300 leading-7">
                Use an email plus a memorable Vault Key phrase. The phrase is hashed on the server, and your browser receives a signed httpOnly session.
              </p>
            </div>
          </div>

          <div className="relative mt-10 grid gap-3">
            {['No shared transaction feed', 'MongoDB queries are user-scoped', 'Logout clears the signed session'].map((item) => (
              <div key={item} className="flex items-center gap-3 text-sm font-semibold text-gray-200">
                <CheckCircle2 size={18} className="text-emerald-400" />
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-[5px] border border-gray-100 shadow-[0_20px_60px_rgba(15,23,42,0.08)] p-6 md:p-8">
          <div className="bg-gray-50 p-1.5 rounded-[5px] flex shadow-inner border border-gray-100 mb-8">
            <button
              type="button"
              onClick={() => { setAuthMode('login'); setAuthError(''); }}
              className={`flex-1 py-2.5 px-4 text-sm font-bold rounded-[5px] transition-all ${authMode === 'login' ? 'bg-white text-indigo-700 shadow-sm border-b-2 border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('register'); setAuthError(''); }}
              className={`flex-1 py-2.5 px-4 text-sm font-bold rounded-[5px] transition-all ${authMode === 'register' ? 'bg-white text-indigo-700 shadow-sm border-b-2 border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Create Vault
            </button>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-5">
            {authMode === 'register' && (
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Your Name</label>
                <div className="relative">
                  <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    className="block w-full pl-12 pr-4 py-3 bg-white border-2 border-gray-100 rounded-[5px] text-gray-900 font-semibold focus:ring-0 focus:border-indigo-400 transition-all shadow-inner"
                    placeholder="Dhanush"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Email</label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="block w-full pl-12 pr-4 py-3 bg-white border-2 border-gray-100 rounded-[5px] text-gray-900 font-semibold focus:ring-0 focus:border-indigo-400 transition-all shadow-inner"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between gap-3 items-center mb-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Vault Key</label>
                {authMode === 'register' && (
                  <button type="button" onClick={generateVaultKey} className="text-xs font-bold text-indigo-600 hover:text-indigo-500">
                    Generate phrase
                  </button>
                )}
              </div>
              <div className="relative">
                <KeyRound size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  required
                  minLength={12}
                  value={vaultKey}
                  onChange={(e) => setVaultKey(e.target.value)}
                  className="block w-full pl-12 pr-4 py-3 bg-white border-2 border-gray-100 rounded-[5px] text-gray-900 font-semibold focus:ring-0 focus:border-indigo-400 transition-all shadow-inner"
                  placeholder="mint-ledger-river-lotus"
                />
              </div>
            </div>

            {authMode === 'register' && (
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Vault Color</label>
                <div className="flex gap-2">
                  {AVATAR_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setAvatarColor(color)}
                      className={`h-10 w-10 rounded-full border-2 transition-all ${avatarColor === color ? 'border-gray-950 scale-105' : 'border-white shadow-[0_0_0_1px_rgba(229,231,235,1)]'}`}
                      style={{ backgroundColor: color }}
                      aria-label={`Choose ${color} as vault color`}
                    />
                  ))}
                </div>
              </div>
            )}

            {authError && (
              <div className="rounded-[5px] border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                {authError}
              </div>
            )}

            <button
              type="submit"
              disabled={authSubmitting}
              className="w-full py-3.5 px-4 rounded-[5px] text-sm font-bold text-white bg-indigo-600 border-b-[4px] border-indigo-900 active:border-b-0 active:translate-y-[4px] hover:bg-indigo-500 focus:outline-none transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_0_10px_rgba(79,70,229,0.2)]"
            >
              {authSubmitting ? 'Opening...' : authMode === 'login' ? 'Open Vault' : 'Create Private Vault'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );

  if (loading) return (
    <div className="flex h-[80vh] items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );

  return (
    <div className="space-y-6 pb-24 md:pb-10 relative">
      <div className="bg-white rounded-[5px] border border-gray-100 shadow-[0_4px_10px_rgba(0,0,0,0.03)] px-4 py-3 md:px-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="h-11 w-11 rounded-[5px] flex items-center justify-center text-white font-extrabold shrink-0"
            style={{ backgroundColor: authUser.avatarColor }}
          >
            {authUser.name.substring(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-extrabold text-gray-950 truncate">{authUser.name}&apos;s Vault</p>
            <p className="text-xs font-semibold text-gray-500 truncate">{authUser.email}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center gap-2 rounded-[5px] border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-all shrink-0"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
      
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
                <div className="h-64 w-full min-w-0">
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                    minWidth={0}
                    minHeight={256}
                    initialDimension={{ width: 400, height: 256 }}
                  >
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
                <div className="h-64 w-full min-w-0">
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                    minWidth={0}
                    minHeight={256}
                    initialDimension={{ width: 400, height: 256 }}
                  >
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
                  Page {visiblePage} of {totalPages}
                </span>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={visiblePage === 1}
                    className="p-2 border border-gray-200 rounded-[5px] bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_2px_0_0_rgba(229,231,235,1)] active:shadow-none active:translate-y-[2px]"
                  >
                    <ChevronLeft size={16} strokeWidth={2.5} />
                  </button>
                  <button 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={visiblePage === totalPages}
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
