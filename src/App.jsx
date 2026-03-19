import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Phone, 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  Trophy,
  ArrowUpRight,
  ArrowDownRight,
  LayoutDashboard,
  RefreshCw,
  Loader2,
  AlertCircle,
  Activity,
  Wallet,
  Settings,
  Plus,
  Trash2,
  Check,
  ChevronDown,
  ChevronUp,
  Database,
  Save,
  Clock,
  PlayCircle,
  Cloud,
  User,
  LogOut,
  Lock,
  Mail,
  FileJson,
  X,
  FileSpreadsheet,
  MessageCircle,
  Briefcase,
  Target,
  Percent,
  BarChart3,
  Award,
  Medal,
  LayoutList,
  PieChart,
} from 'lucide-react';

import AnalyticsDashboard from './AnalyticsDashboard';

// --- FIREBASE IMPORTS ---
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithCustomToken, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged, 
  signOut,
  updateProfile
} from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot, query } from 'firebase/firestore';

// --- FIREBASE CONFIGURATION ---
const userFirebaseConfig = {
  apiKey: "AIzaSyBAqgOveEUucFyIyjCUyZwlu9Eeeka_T-Q",
  authDomain: "setterdashboard.firebaseapp.com",
  projectId: "setterdashboard",
  storageBucket: "setterdashboard.firebasestorage.app",
  messagingSenderId: "409904637658",
  appId: "1:409904637658:web:19fd95571f04d7b90667e3",
  measurementId: "G-EQBGQ5371G"
};

const getFirebaseApp = () => {
    try {
        const app = initializeApp(userFirebaseConfig);
        return { 
            app, 
            auth: getAuth(app), 
            db: getFirestore(app), 
            configValid: true,
            appId: 'setter-dashboard-production' 
        };
    } catch (e) {
        console.error("Firebase Init Error:", e);
        return { app: null, auth: null, db: null, configValid: false };
    }
};

const { app, auth, db, configValid, appId } = getFirebaseApp();

// --- THEME & COLOR CONSTANTS ---
const THEME_COLORS = {
  blue: '#3b82f6',
  indigo: '#6366f1',
  emerald: '#10b981',
  purple: '#8b5cf6',
  orange: '#f97316',
  slate: '#64748b'
};

const THEME_RGB = {
  blue: '59, 130, 246',
  indigo: '99, 102, 241',
  emerald: '16, 185, 129',
  purple: '139, 92, 246',
  orange: '249, 115, 22',
  slate: '100, 116, 139'
};

const ROLE_TYPES = {
  PHONE: 'phone',
  DM: 'dm',
  CLOSER: 'closer'
};

const ROLE_CONFIG = {
  [ROLE_TYPES.PHONE]: {
    label: 'Phone Setter (Setter EOD)',
    icon: Phone,
    color: 'blue',
    fields: {
      dials: { label: 'Dials', type: 'number', defaultCol: 'Dials' },
      connections: { label: 'Connections', type: 'number', defaultCol: 'Connections' },
      qualifiedConvos: { label: 'Qualified Convos', type: 'number', defaultCol: 'Qualified Convos' },
      sets: { label: 'Sets', type: 'number', defaultCol: 'Sets' },
      callsOnCalendar: { label: 'Calls On Calendar', type: 'number', defaultCol: 'Calls On Calendar' },
      liveCalls: { label: 'Live Calls', type: 'number', defaultCol: 'Live Calls' },
      closes: { label: 'Closes', type: 'number', defaultCol: 'Closes' },
      downsells: { label: 'Downsells', type: 'number', defaultCol: 'Downsells' },
      cashCollected: { label: 'Cash Collected', type: 'currency', defaultCol: 'Cash Collected' },
      revenue: { label: 'Total Revenue', type: 'currency', defaultCol: 'Total Revenue' }
    },
    stats: [
      { key: 'dials', label: 'Total Dials', icon: Phone, color: 'blue' },
      { key: 'cashCollected', label: 'Cash Collected', icon: Wallet, color: 'emerald' },
      { key: 'sets', label: 'Sets Booked', icon: Calendar, color: 'orange' },
      { key: 'showRate', label: 'Show Rate', icon: Activity, color: 'purple', isCalculated: true, calc: (r) => r.sets > 0 ? (r.liveCalls / r.sets) * 100 : 0 }
    ],
    funnel: [
      { key: 'dials', label: 'Dials' },
      { key: 'connections', label: 'Connections' },
      { key: 'sets', label: 'Sets Booked' },
      { key: 'liveCalls', label: 'Shows' },
      { key: 'closes', label: 'Closes' }
    ]
  },
  [ROLE_TYPES.DM]: {
    label: 'DM Setter (DM Setter EOD)',
    icon: MessageCircle,
    color: 'indigo',
    fields: {
      dmsSent: { label: 'DMs Sent', type: 'number', defaultCol: 'DMs Sent' },
      replies: { label: 'Replies', type: 'number', defaultCol: 'Replies' },
      sets: { label: 'Sets', type: 'number', defaultCol: 'Sets' },
      callsOnCalendar: { label: 'Calls On Calendar', type: 'number', defaultCol: 'Calls On Calendar' },
      liveCalls: { label: 'Live Calls', type: 'number', defaultCol: 'Live Calls' },
      closes: { label: 'Closes', type: 'number', defaultCol: 'Closes' },
      cashCollected: { label: 'Cash Collected', type: 'currency', defaultCol: 'Cash Collected' },
      revenue: { label: 'Total Revenue', type: 'currency', defaultCol: 'Total Revenue' }
    },
    stats: [
      { key: 'dmsSent', label: 'DMs Sent', icon: MessageCircle, color: 'indigo' },
      { key: 'cashCollected', label: 'Cash Collected', icon: Wallet, color: 'emerald' },
      { key: 'sets', label: 'Sets Booked', icon: Calendar, color: 'orange' },
      { key: 'replyRate', label: 'Reply Rate', icon: TrendingUp, color: 'blue', isCalculated: true, calc: (r) => r.dmsSent > 0 ? (r.replies / r.dmsSent) * 100 : 0 }
    ],
    funnel: [
      { key: 'dmsSent', label: 'DMs Sent' },
      { key: 'replies', label: 'Replies' },
      { key: 'sets', label: 'Sets Booked' },
      { key: 'liveCalls', label: 'Shows' },
      { key: 'closes', label: 'Closes' }
    ]
  },
  [ROLE_TYPES.CLOSER]: {
    label: 'Closer (Closer EOD)',
    icon: Target,
    color: 'emerald',
    fields: {
      callsOnCalendar: { label: 'Calls On Calendar', type: 'number', defaultCol: 'Calls On Calendar' },
      liveCalls: { label: 'Live Calls', type: 'number', defaultCol: 'Live Calls' },
      noShows: { label: 'No Shows', type: 'number', defaultCol: 'No Shows' },
      rescheduling: { label: 'Rescheduling', type: 'number', defaultCol: 'Rescheduling' },
      qualifiedCalls: { label: 'Qualified Calls', type: 'number', defaultCol: 'Qualified Calls' },
      offersMade: { label: 'Offers Made', type: 'number', defaultCol: 'Offers Made' },
      deposits: { label: 'Deposits', type: 'number', defaultCol: 'Deposits' },
      closes: { label: 'Closed', type: 'number', defaultCol: 'Closed' },
      cashCollected: { label: 'Cash Collected', type: 'currency', defaultCol: 'Cash Collected' },
      revenue: { label: 'Total Revenue', type: 'currency', defaultCol: 'Total Revenue' }
    },
    stats: [
      { key: 'cashCollected', label: 'Cash Collected', icon: Wallet, color: 'emerald' },
      { key: 'revenue', label: 'Total Revenue', icon: DollarSign, color: 'blue' },
      { key: 'closeRate', label: 'Close Rate', icon: Trophy, color: 'orange', isCalculated: true, calc: (r) => r.liveCalls > 0 ? (r.closes / r.liveCalls) * 100 : 0 },
      { key: 'showRate', label: 'Show Rate', icon: Activity, color: 'purple', isCalculated: true, calc: (r) => r.callsOnCalendar > 0 ? (r.liveCalls / r.callsOnCalendar) * 100 : 0 }
    ],
    funnel: [
      { key: 'callsOnCalendar', label: 'Booked Calls' },
      { key: 'liveCalls', label: 'Live Calls' },
      { key: 'offersMade', label: 'Offers Made' },
      { key: 'closes', label: 'Closed Deals' }
    ]
  }
};

const INITIAL_OFFER_TEMPLATE = {
  id: '',
  name: '',
  role: ROLE_TYPES.PHONE,
  apiKey: '',
  spreadsheetId: '',
  sheetName: 'Setter EOD',
  mapping: {},
  monthlyGoal: ''
};

const DATE_RANGES = {
  ALL_TIME: 'All Time',
  TODAY: 'Today',
  YESTERDAY: 'Yesterday',
  THIS_WEEK: 'This Week',
  THIS_MONTH: 'This Month',
  LAST_30_DAYS: 'Last 30 Days',
  CUSTOM: 'Custom Range'
};

// --- UTILITY FUNCTIONS ---

const cleanInput = (str) => {
  if (!str) return '';
  return str.toString().trim().replace(/[\r\n]+/g, ''); 
};

const cleanSpreadsheetId = (input) => {
  const str = cleanInput(input);
  const urlMatch = str.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (urlMatch && urlMatch[1]) {
    return urlMatch[1];
  }
  return str;
};

const parseSmartNumber = (input) => {
  if (input === null || input === undefined || input === '') return 0;
  if (typeof input === 'number') return input;
  const str = input.toString();
  const cleanStr = str.replace(/[$,\s%]/g, ''); 
  const num = parseFloat(cleanStr);
  return isNaN(num) ? 0 : num;
};

const parseCSVLine = (text) => {
    const result = [];
    let cell = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(cell.trim());
            cell = '';
        } else {
            cell += char;
        }
    }
    result.push(cell.trim());
    return result;
};

const normalizeDate = (dateStr) => {
    if (!dateStr) return null;
    if (typeof dateStr === 'number' || (typeof dateStr === 'string' && /^\d+$/.test(dateStr))) {
        const num = Number(dateStr);
        if (num > 20000 && num < 60000) { 
            return new Date(Math.round((num - 25569) * 86400 * 1000));
        }
    }
    if (typeof dateStr === 'string') {
        const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (isoMatch) {
            const [_, y, m, d] = isoMatch.map(Number);
            return new Date(y, m - 1, d); 
        }
        const usMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
        if (usMatch) {
            const [_, m, d, y] = usMatch.map(Number);
            return new Date(y, m - 1, d);
        }
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    d.setHours(0, 0, 0, 0);
    return d;
};

const toTitleCase = (str) => {
  if (!str) return '';
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
};

const normalizeName = (name) => {
  if (!name) return 'Unknown';
  return name.toString().replace(/['"]+/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
};

const getLevenshteinDistance = (a, b) => {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, 
          Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
        );
      }
    }
  }
  return matrix[b.length][a.length];
};

const getFriendlyError = (err) => {
    if (err.code === 'auth/operation-not-allowed') return "Login method disabled.";
    if (err.code === 'auth/invalid-email') return "Invalid email address.";
    return err.message || "An unknown error occurred.";
};

const ROLE_SUFFIXES = ['Dialers', 'Closers', 'DMs', 'Phone Setters', 'DM Setters', 'Setters', 'Phone', 'Closer'];
const ROLE_ICONS = {
  'Dialers': '📞', 'Phone Setters': '📞', 'Phone': '📞', 'Setters': '📞',
  'DMs': '💬', 'DM Setters': '💬',
  'Closers': '🎯', 'Closer': '🎯'
};

const groupOffersByBaseName = (offers) => {
  const groups = new Map();
  offers.forEach(offer => {
    let baseName = offer.name.trim();
    let matchedSuffix = '';
    // Sort suffixes longest-first so "Phone Setters" matches before "Phone"
    const sorted = [...ROLE_SUFFIXES].sort((a, b) => b.length - a.length);
    for (const suffix of sorted) {
      if (baseName.toLowerCase().endsWith(suffix.toLowerCase())) {
        matchedSuffix = suffix;
        baseName = baseName.slice(0, -suffix.length).trim();
        break;
      }
    }
    if (!groups.has(baseName)) {
      groups.set(baseName, []);
    }
    groups.get(baseName).push({ ...offer, _suffix: matchedSuffix });
  });
  return Array.from(groups.entries()).map(([groupName, items]) => ({
    groupName,
    offers: items
  }));
};

// --- COMPONENTS ---

const SimpleSparkline = ({ data, color = "#9CA3AF", height = 36 }) => {
    const validData = data && data.length > 0 ? data : [0, 0];
    const plotData = validData.length === 1 ? [validData[0], validData[0]] : validData;
    const min = Math.min(...plotData);
    const max = Math.max(...plotData);
    let range = max - min;
    if (range === 0) range = 1;
    const points = plotData.map((val, i) => {
        const x = (i / (plotData.length - 1)) * 100;
        const y = 100 - ((val - min) / range) * 100;
        const safeY = isNaN(y) ? 50 : Math.max(0, Math.min(100, y));
        return `${x},${safeY}`;
    }).join(' ');
    return (
        <div className="w-full mt-2" style={{ height }}>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
                <defs><linearGradient id={`sg-${color.replace('#','')}`} x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor={color} stopOpacity="0.08" /><stop offset="100%" stopColor={color} stopOpacity="0" /></linearGradient></defs>
                <polygon points={`0,100 ${points} 100,100`} fill={`url(#sg-${color.replace('#','')})`} />
                <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        </div>
    );
};

const StatCard = ({ title, value, subtext, icon: Icon, trendData, isLoading }) => {
  const trend = trendData && trendData.length > 1 ? trendData[trendData.length - 1] >= trendData[0] : null;
  return (
    <div className="bg-white border border-[#E4E7EC] rounded-lg p-5 hover:shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-shadow duration-150">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1">{title}</p>
          {isLoading ? (
              <div className="h-8 w-20 bg-gray-100 rounded animate-pulse" />
          ) : (
              <h3 className="text-[28px] font-semibold text-[#111827] tabular-nums leading-tight">{value}</h3>
          )}
        </div>
        <div className="p-2 rounded-md bg-gray-50 border border-[#E4E7EC] text-gray-400">
          <Icon size={16} strokeWidth={1.5} />
        </div>
      </div>
      {isLoading ? (
          <div className="h-9 w-full bg-gray-50 rounded mt-2 animate-pulse" />
      ) : (
          <SimpleSparkline data={trendData} color={trend ? '#16a34a' : '#9CA3AF'} />
      )}
      <div className="flex items-center gap-2 mt-2">
         {trend !== null && trend ? (
             <span className="text-[11px] font-medium text-green-600">Trending up</span>
         ) : (
             <span className="text-[11px] font-medium text-gray-400">Flat</span>
         )}
         <span className="text-[11px] text-gray-300">|</span>
         <span className="text-[11px] text-gray-400">{subtext}</span>
      </div>
    </div>
  );
};

const AuthScreen = ({ onLogin, onRegister, onGuest, isLoading, error }) => {
    const [isRegistering, setIsRegistering] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    return (
        <div className="min-h-screen bg-[#F6F7F9] flex items-center justify-center p-6 font-sans">
            <div className="w-full max-w-md bg-white border border-[#E4E7EC] rounded-lg p-8 shadow-sm">
                <div className="text-center mb-8">
                    <div className="w-10 h-10 bg-[#111827] rounded-lg flex items-center justify-center mx-auto mb-4"><BarChart3 size={20} className="text-white" /></div>
                    <h1 className="text-2xl font-semibold text-[#111827] mb-1">SetterOS</h1>
                    <p className="text-gray-400 text-sm">Sign in to your dashboard</p>
                </div>
                {error && <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-md text-sm mb-6 flex items-start gap-2"><AlertCircle size={16} /><span className="flex-1">{error}</span></div>}
                <form onSubmit={(e) => { e.preventDefault(); isRegistering ? onRegister(email, password, name) : onLogin(email, password); }} className="space-y-4">
                    {isRegistering && <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Full Name</label><div className="relative"><User className="absolute left-3 top-3 text-gray-400" size={16} /><input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-white border border-[#E4E7EC] rounded-md pl-9 pr-4 py-2.5 text-[#111827] text-sm focus:border-gray-400 focus:ring-1 focus:ring-gray-300 outline-none transition-all placeholder:text-gray-300" placeholder="John Doe" required /></div></div>}
                    <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Email Address</label><div className="relative"><Mail className="absolute left-3 top-3 text-gray-400" size={16} /><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-white border border-[#E4E7EC] rounded-md pl-9 pr-4 py-2.5 text-[#111827] text-sm focus:border-gray-400 focus:ring-1 focus:ring-gray-300 outline-none transition-all placeholder:text-gray-300" placeholder="name@agency.com" required /></div></div>
                    <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Password</label><div className="relative"><Lock className="absolute left-3 top-3 text-gray-400" size={16} /><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-white border border-[#E4E7EC] rounded-md pl-9 pr-4 py-2.5 text-[#111827] text-sm focus:border-gray-400 focus:ring-1 focus:ring-gray-300 outline-none transition-all placeholder:text-gray-300" placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢" required /></div></div>
                    <button type="submit" disabled={isLoading} className="w-full py-2.5 rounded-md bg-[#111827] hover:bg-[#1f2937] text-white text-sm font-medium transition-colors flex justify-center items-center gap-2 disabled:opacity-50">{isLoading ? <Loader2 className="animate-spin" size={18} /> : (isRegistering ? 'Create Account' : 'Sign In')}</button>
                </form>
                <div className="mt-5 flex items-center justify-between text-sm"><button onClick={() => setIsRegistering(!isRegistering)} className="text-gray-500 hover:text-[#111827] font-medium transition-colors text-xs">{isRegistering ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}</button></div>
                <div className="mt-6 pt-5 border-t border-[#E4E7EC] text-center"><button onClick={onGuest} className="text-gray-400 hover:text-gray-600 text-xs font-medium transition-colors">Continue as Guest (Local Mode)</button></div>
            </div>
        </div>
    );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true); 
  const [offers, setOffers] = useState([]);
  const [activeOfferId, setActiveOfferId] = useState(null);
  const [view, setView] = useState('dashboard');
  const [dashboardMode, setDashboardMode] = useState('tracker'); 
  
  const [setterData, setSetterData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingOffer, setEditingOffer] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);
  const [authError, setAuthError] = useState(null);
  
  const [isSheetMenuOpen, setIsSheetMenuOpen] = useState(false);
  const [showDateMenu, setShowDateMenu] = useState(false);
  const [dateRange, setDateRange] = useState(DATE_RANGES.THIS_MONTH);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const [sortConfig, setSortConfig] = useState({ key: 'cashCollected', direction: 'desc' });

  if (!configValid) {
      return <div className="min-h-screen flex items-center justify-center text-red-400">Config Error. Check console.</div>;
  }

  useEffect(() => {
    const initAuth = async () => { setAuthLoading(false); };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => {
        setUser(u);
        if (u) setAuthError(null);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) { setOffers([]); return; }
    const q = query(collection(db, 'artifacts', appId, 'users', user.uid, 'offers'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const loadedOffers = snapshot.docs.map(doc => doc.data());
        setOffers(loadedOffers);
        if (loadedOffers.length > 0 && !activeOfferId) setActiveOfferId(loadedOffers[0].id);
    }, (err) => {
        console.error("Firestore Error:", err);
        if (err.code !== 'permission-denied') setError("Failed to sync data.");
    });
    return () => unsubscribe();
  }, [user, activeOfferId]);

  const handleLogin = async (email, password) => { setIsLoading(true); try { await signInWithEmailAndPassword(auth, email, password); } catch (err) { setAuthError(getFriendlyError(err)); } finally { setIsLoading(false); } };
  const handleRegister = async (email, password, name) => { setIsLoading(true); try { const credential = await createUserWithEmailAndPassword(auth, email, password); if (name) await updateProfile(credential.user, { displayName: name }); } catch (err) { setAuthError(getFriendlyError(err)); } finally { setIsLoading(false); } };
  const handleGuest = async () => { setIsLoading(true); try { await signInAnonymously(auth); } catch (err) { setAuthError(getFriendlyError(err)); } finally { setIsLoading(false); } };
  const handleLogout = async () => { try { await signOut(auth); setSetterData([]); setOffers([]); setActiveOfferId(null); setView('dashboard'); } catch (err) { console.error(err); } };

  const activeOffer = useMemo(() => offers.find(o => o.id === activeOfferId), [offers, activeOfferId]);

  const requestSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const loadDemoData = async () => {
    if (!user) return;
    setError(null);
    const demoOffer = {
      id: 'demo-offer',
      name: 'Solar-X Demo',
      role: ROLE_TYPES.PHONE,
      sheetName: 'Demo Sheet',
      spreadsheetId: 'demo-sheet-id',
      apiKey: 'demo-key',
      mapping: { date: 'Date', name: 'Name', ...Object.keys(ROLE_CONFIG[ROLE_TYPES.PHONE].fields).reduce((acc, k) => ({...acc, [k]: ROLE_CONFIG[ROLE_TYPES.PHONE].fields[k].defaultCol}), {}) }
    };
    try {
        await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'offers', demoOffer.id), demoOffer);
        setActiveOfferId('demo-offer');
        setIsLoading(true);
        setTimeout(() => {
          const names = ['Alex Rivera', 'Sarah Chen', 'Mike Ross', 'Jessica Pearson'];
          const today = new Date();
          const demoData = [];
          for (let i = 0; i < 30; i++) {
              const date = new Date(today);
              date.setDate(today.getDate() - i);
              const dateStr = date.toISOString().split('T')[0];
              names.forEach(name => {
                   const dials = Math.floor(Math.random() * 60) + 20;
                   const sets = Math.floor(dials * 0.1);
                   demoData.push({
                        id: Math.random().toString(),
                        date: dateStr,
                        name: name,
                        dials, 
                        connections: Math.floor(dials * 0.2), 
                        qualifiedConvos: Math.floor(dials * 0.15),
                        sets,
                        callsOnCalendar: sets,
                        liveCalls: Math.floor(sets * 0.8), 
                        closes: Math.floor(sets * 0.2),
                        cashCollected: Math.floor(sets * 0.2) * 1500, 
                        revenue: Math.floor(sets * 0.2) * 3000,
                        hours: 6
                   });
              });
          }
          setSetterData(demoData);
          setIsLoading(false);
          setView('dashboard');
        }, 1200); 
    } catch (e) { console.error(e); setError("Error saving demo config."); }
  };

  const fetchGoogleSheetsData = async () => {
    if (!activeOffer) return;
    if (activeOffer.id === 'demo-offer') { loadDemoData(); return; }

    setIsLoading(true); setError(null); setDebugInfo(null);

    const apiKey = cleanInput(activeOffer.apiKey);
    const spreadsheetId = cleanSpreadsheetId(activeOffer.spreadsheetId);
    const sheetName = cleanInput(activeOffer.sheetName);
    
    try {
        let headers = [];
        let rows = [];

        if (apiKey) {
            const baseUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}?key=${apiKey}`;
            const response = await fetch(baseUrl);
            if (!response.ok) throw new Error(`API Error (${response.status}). Check access/key.`);
            const data = await response.json();
            if (!data.values || data.values.length < 2) throw new Error("Sheet empty or no headers.");
            headers = data.values[0].map(h => h.trim());
            rows = data.values.slice(1);
        } else {
             const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
             const response = await fetch(csvUrl);
             if (!response.ok) throw new Error("Failed to fetch public sheet. Make sure it is 'Published to Web' or provide an API Key.");
             const text = await response.text();
             const lines = text.split('\n').map(l => l.trim()).filter(l => l);
             if (lines.length < 2) throw new Error("CSV empty.");
             
             headers = parseCSVLine(lines[0]);
             rows = lines.slice(1).map(line => parseCSVLine(line));
        }
      
        const mapping = activeOffer.mapping || {};
        const roleConfig = ROLE_CONFIG[activeOffer.role || ROLE_TYPES.PHONE].fields;
        
        const getValue = (row, mappingKey) => {
            const colName = mapping[mappingKey]; 
            if (!colName) return null;
            const index = headers.findIndex(h => h.toLowerCase() === colName.toLowerCase());
            return index !== -1 ? (row[index] || '') : null;
        };

        const formattedData = rows.map((row, idx) => {
            const item = {
                id: `row-${idx}`,
                name: (() => {
                    const f = getValue(row, 'firstName');
                    const l = getValue(row, 'lastName');
                    const full = getValue(row, 'name'); 
                    return (f || l) ? `${f || ''} ${l || ''}`.trim() : (full || 'Unknown');
                })(),
                date: getValue(row, 'date')
            };

            Object.keys(roleConfig).forEach(fieldKey => {
                const val = getValue(row, fieldKey);
                item[fieldKey] = parseSmartNumber(val);
            });

            return item;
        });

        setSetterData(formattedData);

    } catch (err) { 
        console.error(err); 
        setError(err.message); 
        setDebugInfo(`ID: ${spreadsheetId}, Sheet: ${sheetName}, Role: ${activeOffer.role}`);
        setSetterData([]); 
    } finally { 
        setIsLoading(false); 
    }
  };

  useEffect(() => { if (view === 'dashboard' && activeOffer) fetchGoogleSheetsData(); }, [activeOfferId, view]);

  const handleSaveOffer = async (e) => {
    e.preventDefault();
    if (!user || !editingOffer.name) return;
    const cleanOffer = {
        ...editingOffer,
        apiKey: cleanInput(editingOffer.apiKey),
        spreadsheetId: cleanSpreadsheetId(editingOffer.spreadsheetId),
        sheetName: cleanInput(editingOffer.sheetName),
        mapping: editingOffer.mapping,
        role: editingOffer.role || ROLE_TYPES.PHONE,
        id: editingOffer.id || Date.now().toString()
    };
    try { await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'offers', cleanOffer.id), cleanOffer); setActiveOfferId(cleanOffer.id); setEditingOffer(null); setView('settings'); } catch (err) { console.error(err); setError("Failed to save."); }
  };

  const handleDeleteOffer = async (id) => { if (!user) return; if (window.confirm("Delete?")) { try { await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'offers', id)); if (activeOfferId === id) setActiveOfferId(null); } catch (err) { console.error(err); } } };
  
  const startEditOffer = (offer) => { 
      const defaults = {};
      const fields = ROLE_CONFIG[offer.role || ROLE_TYPES.PHONE].fields;
      Object.keys(fields).forEach(key => defaults[key] = fields[key].defaultCol);
      setEditingOffer({ 
          ...offer, 
          mapping: { date: 'Date', name: 'Name', firstName: 'Name', ...defaults, ...(offer.mapping || {}) } 
      }); 
      setView('edit-offer'); 
  };
  
  const startNewOffer = () => { 
      const defaults = {};
      const fields = ROLE_CONFIG[ROLE_TYPES.PHONE].fields;
      Object.keys(fields).forEach(key => defaults[key] = fields[key].defaultCol);
      setEditingOffer({ ...INITIAL_OFFER_TEMPLATE, mapping: { date: 'Date', name: 'Name', ...defaults } }); 
      setView('edit-offer'); 
  };
  
  const handleRoleChange = (newRole) => {
      const defaults = {};
      const fields = ROLE_CONFIG[newRole].fields;
      Object.keys(fields).forEach(key => defaults[key] = fields[key].defaultCol);
      setEditingOffer({
          ...editingOffer,
          role: newRole,
          sheetName: newRole === ROLE_TYPES.PHONE ? 'Setter EOD' : (newRole === ROLE_TYPES.CLOSER ? 'Closer EOD' : 'DM Setter EOD'),
          mapping: { date: 'Date', name: 'Name', firstName: 'Name', ...defaults }
      });
  };

  const filteredData = useMemo(() => {
    if (!setterData.length) return [];
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return setterData.filter(item => {
        if (!item.date) return dateRange === DATE_RANGES.ALL_TIME; 
        const itemDate = normalizeDate(item.date);
        if (!itemDate) return dateRange === DATE_RANGES.ALL_TIME;
        if (dateRange === DATE_RANGES.TODAY) return itemDate.getTime() === todayStart.getTime();
        if (dateRange === DATE_RANGES.YESTERDAY) { const y = new Date(todayStart); y.setDate(y.getDate()-1); return itemDate.getTime() === y.getTime(); }
        if (dateRange === DATE_RANGES.THIS_WEEK) { const d = todayStart.getDay(); const s = new Date(todayStart); s.setDate(todayStart.getDate() - d); s.setHours(0,0,0,0); return itemDate >= s; }
        if (dateRange === DATE_RANGES.THIS_MONTH) return itemDate.getMonth() === todayStart.getMonth() && itemDate.getFullYear() === todayStart.getFullYear();
        if (dateRange === DATE_RANGES.LAST_30_DAYS) { const t = new Date(todayStart); t.setDate(t.getDate() - 30); return itemDate >= t; }
        if (dateRange === DATE_RANGES.CUSTOM && customStart && customEnd) { return itemDate >= normalizeDate(customStart) && itemDate <= normalizeDate(customEnd); }
        return true;
    });
  }, [setterData, dateRange, customStart, customEnd]);

  const aggregatedData = useMemo(() => {
      const map = new Map();
      const currentRoleFields = ROLE_CONFIG[activeOffer?.role || ROLE_TYPES.PHONE].fields;
      
      filteredData.forEach(item => {
          const normalizedKey = normalizeName(item.name);
          if (!normalizedKey) return;
          
          let targetKey = normalizedKey;
          if (!map.has(targetKey)) {
             for (const [existingKey] of map) {
                if (existingKey[0] === normalizedKey[0] && getLevenshteinDistance(existingKey, normalizedKey) <= 2) { targetKey = existingKey; break; }
             }
          }

          if (!map.has(targetKey)) {
              map.set(targetKey, { ...item, displayName: toTitleCase(normalizedKey), count: 1 });
          } else {
              const existing = map.get(targetKey);
              existing.count += 1;
              Object.keys(currentRoleFields).forEach(field => {
                  existing[field] = (existing[field] || 0) + (item[field] || 0);
              });
          }
      });
      return Array.from(map.values());
  }, [filteredData, activeOffer]);

  const processedData = useMemo(() => {
      let data = aggregatedData.map(row => {
          const newRow = { ...row };
          const roleConfig = ROLE_CONFIG[activeOffer?.role || ROLE_TYPES.PHONE];
          roleConfig.stats.forEach(stat => {
              if (stat.isCalculated && stat.calc) {
                  newRow[stat.key] = parseFloat(stat.calc(row).toFixed(1));
              }
          });
          return newRow;
      });

      const primaryMetric = activeOffer?.role === ROLE_TYPES.PHONE ? 'cashCollected' : 'revenue';
      const rankedList = [...data].sort((a,b) => (b[primaryMetric] || 0) - (a[primaryMetric] || 0));
      const top3Ids = rankedList.slice(0, 3).map(r => r.displayName); 

      data = data.map(d => ({
          ...d,
          rank: top3Ids.indexOf(d.displayName) + 1 
      }));

      if (sortConfig.key) {
          data.sort((a, b) => {
              const aVal = a[sortConfig.key] || 0;
              const bVal = b[sortConfig.key] || 0;
              if (typeof aVal === 'string') {
                  return sortConfig.direction === 'asc' 
                      ? aVal.localeCompare(bVal)
                      : bVal.localeCompare(aVal);
              }
              return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
          });
      }

      return data;
  }, [aggregatedData, activeOffer, sortConfig]);

  const generateTrendData = (statKey) => {
      // For calculated stats (like showRate), we need the stat config to compute daily ratios
      const roleConfig = ROLE_CONFIG[activeOffer?.role || ROLE_TYPES.PHONE];
      const stat = roleConfig.stats.find(s => s.key === statKey);
      
      if (stat?.isCalculated && stat?.calc) {
          // Group all field values by date, then compute the ratio per day
          const dateGroups = {};
          filteredData.forEach(item => {
              if (!item.date) return;
              const d = normalizeDate(item.date);
              if (!d) return;
              const dk = d.getTime();
              if (!dateGroups[dk]) dateGroups[dk] = {};
              Object.keys(roleConfig.fields).forEach(field => {
                  dateGroups[dk][field] = (dateGroups[dk][field] || 0) + (item[field] || 0);
              });
          });
          return Object.keys(dateGroups).sort((a,b) => a - b).map(k => {
              const val = stat.calc(dateGroups[k]);
              return isNaN(val) ? 0 : val;
          });
      }
      
      // For simple sum fields (dials, cashCollected, etc.)
      const groups = {};
      filteredData.forEach(item => {
         if(!item.date) return;
         const d = normalizeDate(item.date);
         if(d) groups[d.getTime()] = (groups[d.getTime()] || 0) + (item[statKey] || 0);
      });
      return Object.keys(groups).sort((a,b)=>a-b).map(k=>groups[k]);
  };

  const currentRole = activeOffer ? (ROLE_CONFIG[activeOffer.role || ROLE_TYPES.PHONE]) : ROLE_CONFIG[ROLE_TYPES.PHONE];

  const maxValues = useMemo(() => {
      const maxes = {};
      if (processedData.length) {
          Object.keys(currentRole.fields).forEach(key => {
              maxes[key] = Math.max(...processedData.map(d => d[key] || 0));
          });
      }
      return maxes;
  }, [processedData, currentRole]);

  const getHeatmapStyle_disabled = (value, fieldKey) => {
      const max = maxValues[fieldKey];
      if (!max || value === 0) return {};
      
      const intensity = value / max;
      const opacity = Math.max(0.05, intensity * 0.25); 
      const roleColor = currentRole.color;
      
      const rgb = THEME_RGB[roleColor] || THEME_RGB.blue;
      return { backgroundColor: `rgba(${rgb}, ${opacity})` };
  };

  if (authLoading) return <div className="min-h-screen bg-[#F6F7F9] flex items-center justify-center text-gray-400"><Loader2 className="animate-spin" size={24} /></div>;
  if (!user) return <AuthScreen onLogin={handleLogin} onRegister={handleRegister} onGuest={handleGuest} isLoading={isLoading} error={authError} />;

  if (view === 'settings') {
    return (
      <div className="min-h-screen bg-[#F6F7F9] text-[#111827] font-sans p-8 flex justify-center">
        <div className="w-full max-w-3xl space-y-6">
          <div className="flex items-center justify-between">
            <div><h1 className="text-xl font-semibold text-[#111827]">Configuration</h1><p className="text-gray-400 mt-0.5 text-sm">Manage your connected sheets</p></div>
            {offers.length > 0 && <button onClick={() => setView('dashboard')} className="text-sm text-gray-500 hover:text-[#111827] transition-colors font-medium">â† Back</button>}
          </div>
          <div className="bg-white border border-[#E4E7EC] rounded-lg p-5 flex items-center justify-between">
             <div className="flex items-center gap-3"><div className="p-2 bg-gray-50 rounded-md border border-[#E4E7EC] text-gray-400"><PlayCircle size={20} strokeWidth={1.5} /></div><div><h3 className="font-medium text-[#111827] text-sm">Preview Demo</h3><p className="text-xs text-gray-400">Load sample data to test the layout</p></div></div>
             <button onClick={loadDemoData} className="px-4 py-2 bg-[#111827] hover:bg-[#1f2937] text-white text-sm font-medium rounded-md transition-colors">Load Demo</button>
          </div>
          <div className="grid gap-3">
             {offers.map(offer => {
                 const RoleIcon = ROLE_CONFIG[offer.role]?.icon || Phone;
                 return (
                     <div key={offer.id} className="bg-white border border-[#E4E7EC] rounded-lg p-4 flex items-center justify-between group hover:border-gray-300 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-md bg-gray-50 border border-[#E4E7EC] flex items-center justify-center text-gray-400"><RoleIcon size={18} strokeWidth={1.5} /></div>
                            <div>
                                <h3 className="font-medium text-[#111827] text-sm flex items-center gap-2">{offer.name} <span className="text-[10px] uppercase text-gray-400 px-1.5 py-0.5 rounded border border-[#E4E7EC] bg-gray-50 font-medium tracking-wide">{ROLE_CONFIG[offer.role]?.label.split('(')[0]}</span></h3>
                                <p className="text-xs text-gray-400 font-mono mt-0.5">{cleanSpreadsheetId(offer.spreadsheetId || '').slice(0, 8)}â€¦ Â· {offer.sheetName}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => startEditOffer(offer)} className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-[#E4E7EC] rounded-md text-xs font-medium text-gray-600 transition-colors">Edit</button><button onClick={() => handleDeleteOffer(offer.id)} className="p-1.5 hover:bg-red-50 hover:text-red-500 rounded-md text-gray-400 transition-colors"><Trash2 size={16} /></button></div>
                     </div>
                 );
             })}
             <button onClick={startNewOffer} className="border border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center text-gray-400 hover:text-[#111827] hover:border-gray-400 transition-all"><Plus size={24} className="mb-2" /><span className="font-medium text-sm">Connect New Sheet</span></button>
          </div>
          <div className="pt-6 border-t border-[#E4E7EC] flex items-center justify-between text-xs text-gray-400"><span className="flex items-center gap-1.5"><User size={12} /> {user.email || 'Guest'}</span><button onClick={handleLogout} className="flex items-center gap-1 hover:text-[#111827] transition-colors"><LogOut size={12} /> Log Out</button></div>
        </div>
      </div>
    );
  }

  if (view === 'edit-offer' && editingOffer) {
    const currentRoleConfig = ROLE_CONFIG[editingOffer.role || ROLE_TYPES.PHONE];
    return (
      <div className="min-h-screen bg-[#F6F7F9] text-[#111827] font-sans p-8 flex justify-center items-start pt-16">
        <div className="w-full max-w-2xl bg-white border border-[#E4E7EC] rounded-lg p-8 shadow-sm">
          <h2 className="text-lg font-semibold text-[#111827] mb-6">{editingOffer.id ? 'Edit Configuration' : 'Connect Sheet'}</h2>
          <form onSubmit={handleSaveOffer} className="space-y-5">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                 <div className="col-span-2 md:col-span-1"><label className="block text-xs font-medium text-gray-500 mb-1.5">Project / Team Name</label><input type="text" value={editingOffer.name} onChange={e => setEditingOffer({...editingOffer, name: e.target.value})} className="w-full bg-white border border-[#E4E7EC] rounded-md px-3 py-2.5 text-sm text-[#111827] focus:border-gray-400 focus:ring-1 focus:ring-gray-300 outline-none transition-all placeholder:text-gray-300" placeholder="e.g. Solar Team A" required /></div>
                 <div className="col-span-2 md:col-span-1">
                     <label className="block text-xs font-medium text-gray-500 mb-1.5">Role Type</label>
                     <div className="flex rounded-md bg-gray-50 border border-[#E4E7EC] p-0.5">
                         {Object.values(ROLE_TYPES).map(type => (
                             <button type="button" key={type} onClick={() => handleRoleChange(type)} className={`flex-1 py-2 text-xs font-medium rounded transition-all ${editingOffer.role === type ? 'bg-[#111827] text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>{ROLE_CONFIG[type].label.split('(')[0].trim()}</button>
                         ))}
                     </div>
                 </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 md:col-span-1"><label className="block text-xs font-medium text-gray-500 mb-1.5">Spreadsheet ID</label><input type="text" value={editingOffer.spreadsheetId} onChange={e => setEditingOffer({...editingOffer, spreadsheetId: e.target.value})} className="w-full bg-white border border-[#E4E7EC] rounded-md px-3 py-2.5 text-sm text-[#111827] font-mono focus:border-gray-400 focus:ring-1 focus:ring-gray-300 outline-none placeholder:text-gray-300" placeholder="Paste full URL or ID..." required /></div>
                <div className="col-span-2 md:col-span-1"><label className="block text-xs font-medium text-gray-500 mb-1.5">Sheet Name (Tab)</label><input type="text" value={editingOffer.sheetName} onChange={e => setEditingOffer({...editingOffer, sheetName: e.target.value})} className="w-full bg-white border border-[#E4E7EC] rounded-md px-3 py-2.5 text-sm text-[#111827] focus:border-gray-400 focus:ring-1 focus:ring-gray-300 outline-none placeholder:text-gray-300" placeholder="Sheet1" required /></div>
              </div>
              <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Google API Key <span className="text-gray-300 font-normal ml-1">(Optional)</span></label><input type="password" value={editingOffer.apiKey} onChange={e => setEditingOffer({...editingOffer, apiKey: e.target.value})} className="w-full bg-white border border-[#E4E7EC] rounded-md px-3 py-2.5 text-sm text-[#111827] font-mono focus:border-gray-400 focus:ring-1 focus:ring-gray-300 outline-none placeholder:text-gray-300" placeholder="Leave empty if sheet is 'Published to Web'" /></div>
              <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Monthly Revenue Goal ($)</label><input type="text" inputMode="numeric" value={editingOffer.monthlyGoal ?? ''} onChange={e => setEditingOffer({...editingOffer, monthlyGoal: e.target.value})} className="w-full bg-white border border-[#E4E7EC] rounded-md px-3 py-2.5 text-sm text-[#111827] font-mono focus:border-gray-400 focus:ring-1 focus:ring-gray-300 outline-none placeholder:text-gray-300" placeholder="e.g. 100000" /></div>
              <div className="pt-4 border-t border-[#E4E7EC]">
                  <h3 className="text-sm font-medium text-[#111827] mb-4">{currentRoleConfig.label} â€” Column Mapping</h3>
                  <div className="grid grid-cols-2 gap-3">
                     <div className="col-span-2"><label className="block text-[11px] font-medium text-gray-500 mb-1">Date Column (Required)</label><input type="text" value={editingOffer.mapping?.date || ''} onChange={e => setEditingOffer({...editingOffer, mapping: {...editingOffer.mapping, date: e.target.value}})} className="w-full bg-white border border-[#E4E7EC] rounded-md px-3 py-2 text-sm text-[#111827] focus:border-gray-400 outline-none" placeholder="Date" /></div>
                     <div className="col-span-2"><label className="block text-[11px] font-medium text-gray-500 mb-1">Name Column (Required)</label><input type="text" value={editingOffer.mapping?.name || ''} onChange={e => setEditingOffer({...editingOffer, mapping: {...editingOffer.mapping, name: e.target.value}})} className="w-full bg-white border border-[#E4E7EC] rounded-md px-3 py-2 text-sm text-[#111827] focus:border-gray-400 outline-none" placeholder="Name" /></div>
                     {Object.entries(currentRoleConfig.fields).map(([key, field]) => (
                        <div key={key}>
                           <label className="block text-[11px] font-medium text-gray-500 mb-1">{field.label}</label>
                           <input type="text" value={editingOffer.mapping?.[key] || ''} onChange={e => setEditingOffer({...editingOffer, mapping: { ...editingOffer.mapping, [key]: e.target.value }})} className="w-full bg-white border border-[#E4E7EC] rounded-md px-3 py-2 text-sm text-[#111827] focus:border-gray-400 outline-none" placeholder={`Column for ${field.label}`} />
                        </div>
                     ))}
                  </div>
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2"><button type="button" onClick={() => setView('settings')} className="flex-1 py-2.5 rounded-md border border-[#E4E7EC] text-gray-600 hover:bg-gray-50 transition-colors font-medium text-sm">Cancel</button><button type="submit" className="flex-1 py-2.5 rounded-md bg-[#111827] hover:bg-[#1f2937] text-white font-medium text-sm transition-colors flex justify-center items-center gap-2"><Save size={16} /> Save</button></div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F7F9] text-[#111827] font-sans pb-12" onClick={() => { if(isSheetMenuOpen) setIsSheetMenuOpen(false); }}>
      <nav className="sticky top-0 z-50 w-full bg-white border-b border-[#E4E7EC]">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-[#111827] rounded-md flex items-center justify-center"><BarChart3 size={16} className="text-white" /></div>
              <span className="font-semibold text-sm text-[#111827] hidden md:block">SetterOS</span>
              
              <div className="ml-4 flex items-center bg-gray-50 rounded-md p-0.5 border border-[#E4E7EC]">
                  <button 
                      onClick={() => setDashboardMode('tracker')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all ${dashboardMode === 'tracker' ? 'bg-white text-[#111827] shadow-sm border border-[#E4E7EC]' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                      <LayoutList size={13} /> Tracker
                  </button>
                  <button 
                      onClick={() => setDashboardMode('analytics')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all ${dashboardMode === 'analytics' ? 'bg-white text-[#111827] shadow-sm border border-[#E4E7EC]' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                      <PieChart size={13} /> Analytics
                  </button>
              </div>

              <div className="ml-3 relative" onClick={(e) => e.stopPropagation()}>
                 <button 
                    onClick={() => setIsSheetMenuOpen(!isSheetMenuOpen)} 
                    className={`flex items-center gap-2 px-3 py-1.5 border rounded-md text-sm font-medium transition-all ${isSheetMenuOpen ? 'bg-gray-50 border-gray-300 text-[#111827]' : 'border-[#E4E7EC] text-gray-600 hover:border-gray-300'}`}
                 >
                    {activeOffer ? activeOffer.name : 'Select Sheet'} <ChevronDown size={14} className="text-gray-400" />
                 </button>
                 {isSheetMenuOpen && (
                     <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-[#E4E7EC] rounded-md shadow-lg overflow-hidden z-50 max-h-[70vh] overflow-y-auto">
                        {groupOffersByBaseName(offers).map(group => (
                          group.offers.length === 1 ? (
                            <button 
                                key={group.offers[0].id} 
                                onClick={() => { setActiveOfferId(group.offers[0].id); setIsSheetMenuOpen(false); }} 
                                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors flex items-center justify-between ${activeOfferId === group.offers[0].id ? 'text-[#111827] font-medium bg-gray-50' : 'text-gray-600'}`}
                            >
                                {group.offers[0].name} {activeOfferId === group.offers[0].id && <Check size={14} className="text-gray-400" />}
                            </button>
                          ) : (
                            <div key={group.groupName}>
                              <div className="px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400 bg-[#FAFAFA] border-b border-t border-[#E4E7EC] first:border-t-0">
                                {group.groupName}
                              </div>
                              {group.offers.map(offer => (
                                <button 
                                    key={offer.id} 
                                    onClick={() => { setActiveOfferId(offer.id); setIsSheetMenuOpen(false); }} 
                                    className={`w-full text-left pl-6 pr-4 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center justify-between ${activeOfferId === offer.id ? 'text-[#111827] font-medium bg-gray-50' : 'text-gray-600'}`}
                                >
                                    <span className="flex items-center gap-1.5">
                                      <span className="text-xs">{ROLE_ICONS[offer._suffix] || '📄'}</span>
                                      {offer._suffix || offer.name}
                                    </span>
                                    {activeOfferId === offer.id && <Check size={14} className="text-gray-400" />}
                                </button>
                              ))}
                            </div>
                          )
                        ))}
                        <div className="border-t border-[#E4E7EC]">
                            <button onClick={() => { setView('settings'); setIsSheetMenuOpen(false); }} className="w-full text-left px-4 py-2.5 text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-2">
                                <Settings size={13} /> Manage Sheets
                            </button>
                        </div>
                     </div>
                 )}
              </div>
            </div>
            
            <div className="flex items-center gap-1">
               <div className="relative" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => setShowDateMenu(!showDateMenu)} className="flex items-center gap-1.5 px-3 py-1.5 border border-[#E4E7EC] rounded-md text-sm font-medium text-gray-600 hover:border-gray-300 transition-all"><Calendar size={14} className="text-gray-400" />{dateRange === DATE_RANGES.CUSTOM ? 'Custom' : dateRange}<ChevronDown size={14} className="text-gray-400" /></button>
                  {showDateMenu && (<div className="absolute top-full right-0 mt-1 w-56 bg-white border border-[#E4E7EC] rounded-md shadow-lg overflow-hidden z-50"><div className="p-1">{Object.values(DATE_RANGES).map(range => (<button key={range} onClick={() => { setDateRange(range); if(range !== DATE_RANGES.CUSTOM) setShowDateMenu(false); }} className={`w-full text-left px-3 py-2 text-sm rounded transition-colors ${dateRange === range ? 'bg-gray-900 text-white font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>{range}</button>))}</div>{dateRange === DATE_RANGES.CUSTOM && (<div className="p-3 border-t border-[#E4E7EC] space-y-2"><div className="grid grid-cols-2 gap-2"><div><label className="text-[10px] text-gray-400 font-medium mb-0.5 block">From</label><input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="w-full bg-white border border-[#E4E7EC] rounded-md px-2 py-1.5 text-xs text-[#111827] outline-none focus:border-gray-400" /></div><div><label className="text-[10px] text-gray-400 font-medium mb-0.5 block">To</label><input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="w-full bg-white border border-[#E4E7EC] rounded-md px-2 py-1.5 text-xs text-[#111827] outline-none focus:border-gray-400" /></div></div><button onClick={() => setShowDateMenu(false)} className="w-full py-1.5 bg-[#111827] text-white text-xs font-medium rounded-md">Apply</button></div>)}</div>)}
               </div>
               <div className="h-6 w-px bg-[#E4E7EC] mx-1"></div>
               <button onClick={fetchGoogleSheetsData} className="p-2 text-gray-400 hover:text-[#111827] rounded-md hover:bg-gray-50 transition-colors"><RefreshCw size={16} className={isLoading ? "animate-spin" : ""} strokeWidth={1.5} /></button>
               <button onClick={() => setView('settings')} className="p-2 text-gray-400 hover:text-[#111827] rounded-md hover:bg-gray-50 transition-colors"><Settings size={16} strokeWidth={1.5} /></button>
               <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-[#111827] rounded-md hover:bg-gray-50 transition-colors"><LogOut size={16} strokeWidth={1.5} /></button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-[1400px] mx-auto px-6 pt-8">
        {!activeOffer ? (
           <div className="flex flex-col items-center justify-center h-[60vh] text-gray-400"><div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-4 border border-[#E4E7EC]"><FileSpreadsheet size={24} className="text-gray-300" /></div><p className="text-sm font-medium text-gray-500">No sheet selected</p><button onClick={() => setView('settings')} className="text-sm text-gray-500 hover:text-[#111827] hover:underline mt-1 font-medium">Connect a Google Sheet →</button></div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#E4E7EC]">
                <div>
                    <div className="flex items-center gap-2">
                         <h1 className="text-lg font-semibold text-[#111827]">{activeOffer.name}</h1>
                         <span className="text-[10px] uppercase font-medium px-1.5 py-0.5 rounded border border-[#E4E7EC] bg-gray-50 text-gray-400 tracking-wide">{currentRole.label.split('(')[0]}</span>
                    </div>
                    <div className="text-gray-400 text-xs mt-1 flex items-center gap-1.5"><div className={`w-1.5 h-1.5 rounded-full ${isLoading ? 'bg-amber-500 animate-pulse' : 'bg-green-500'}`}></div> {isLoading ? 'Syncing...' : `Live | ${activeOffer.sheetName}`}</div>
                </div>
                
                <div className="flex items-center gap-2">
                    {setterData.length > 0 && filteredData.length === 0 && <div className="text-amber-600 text-xs font-medium flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-md border border-amber-200"><AlertCircle size={13}/> No data for this period</div>}
                </div>
            </div>
            
            {error && (<div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-md text-sm flex flex-col gap-1"><div className="flex items-center gap-2 font-medium"><AlertCircle size={16} /> Error Loading Data</div><div className="text-red-500 text-xs ml-6">{error}</div>{debugInfo && <div className="ml-6 mt-1 text-xs font-mono text-red-300 border-t border-red-100 pt-1">{debugInfo}</div>}</div>)}

            {/* STAT CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {currentRole.stats.map(stat => {
                    const total = processedData.reduce((acc, curr) => acc + (curr[stat.key] || 0), 0);
                    let displayValue = total.toLocaleString();
                    if (stat.key === 'cashCollected' || stat.key === 'revenue') displayValue = `$${total.toLocaleString()}`;
                    
                    if (stat.isCalculated && stat.calc) {
                         const globalTotals = {};
                         Object.keys(currentRole.fields).forEach(key => {
                             globalTotals[key] = processedData.reduce((acc, curr) => acc + (curr[key] || 0), 0);
                         });
                         displayValue = `${stat.calc(globalTotals).toFixed(1)}%`;
                    }

                    return <StatCard key={stat.key} title={stat.label} value={displayValue} trendData={generateTrendData(stat.key)} subtext="Total" icon={stat.icon} isLoading={isLoading} />;
                })}
            </div>

            {/* CONDITIONAL: ANALYTICS OR TRACKER */}
            {dashboardMode === 'analytics' ? (
                <AnalyticsDashboard data={filteredData ?? []} aggregatedData={processedData ?? []} roleConfig={currentRole} dateRange={dateRange} monthlyGoal={activeOffer?.monthlyGoal} />
            ) : (
                <div className="bg-white border border-[#E4E7EC] rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="text-[11px] text-gray-400 font-medium border-b border-[#E4E7EC] bg-[#FAFAFA]">
                          <th className="py-3 px-4 w-12 text-gray-300">#</th>
                          <th className="py-3 px-4 sticky left-0 bg-[#FAFAFA] z-20 border-r border-[#E4E7EC] w-48">
                              <button onClick={() => requestSort('displayName')} className="flex items-center gap-1 hover:text-gray-600 transition-colors uppercase tracking-wider font-semibold">
                                  SETTER
                                  {sortConfig.key === 'displayName' && (sortConfig.direction === 'asc' ? <ChevronUp size={12}/> : <ChevronDown size={12}/>)}
                              </button>
                          </th>
                          {Object.entries(currentRole.fields).map(([key, field]) => (
                              <th key={key} className="py-3 px-4 text-right">
                                  <button onClick={() => requestSort(key)} className="flex items-center gap-1 hover:text-gray-600 transition-colors w-full justify-end uppercase tracking-wider font-semibold">
                                      {field.label}
                                      {sortConfig.key === key && (sortConfig.direction === 'asc' ? <ChevronUp size={12}/> : <ChevronDown size={12}/>)}
                                  </button>
                              </th>
                          ))}
                          {currentRole.stats.filter(s => s.isCalculated).map(stat => (
                              <th key={stat.key} className="py-3 px-4 text-right">
                                  <button onClick={() => requestSort(stat.key)} className="flex items-center gap-1 hover:text-gray-600 transition-colors w-full justify-end uppercase tracking-wider font-semibold">
                                      {stat.label}
                                      {sortConfig.key === stat.key && (sortConfig.direction === 'asc' ? <ChevronUp size={12}/> : <ChevronDown size={12}/>)}
                                  </button>
                              </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="text-sm divide-y divide-[#E4E7EC]">
                        {isLoading ? (
                           [...Array(5)].map((_, i) => (
                             <tr key={i} className="animate-pulse">
                                <td className="py-3.5 px-4"><div className="h-4 w-6 bg-gray-100 rounded"/></td>
                                <td className="py-3.5 px-4 sticky left-0 bg-white z-20 border-r border-[#E4E7EC]">
                                    <div className="h-4 w-24 bg-gray-100 rounded"/>
                                </td>
                                {Object.keys(currentRole.fields).map(k => <td key={k} className="py-3.5 px-4"><div className="h-4 w-full bg-gray-50 rounded"/></td>)}
                                {currentRole.stats.filter(s => s.isCalculated).map(s => <td key={s.key} className="py-3.5 px-4"><div className="h-4 w-full bg-gray-50 rounded"/></td>)}
                             </tr>
                           ))
                        ) : (
                            <>
                                {processedData.length === 0 && !isLoading && (<tr><td colSpan="20" className="py-12 text-center text-gray-400 text-sm">No data found for this period.</td></tr>)}
                                {processedData.map((setter, index) => (
                                  <tr key={setter.id || index} className="group hover:bg-[#FAFAFA] transition-colors">
                                    <td className="py-3 px-4 text-gray-300 font-mono text-xs">{String(index + 1).padStart(2, '0')}</td>
                                    <td className="py-3 px-4 font-medium text-[#111827] sticky left-0 bg-white group-hover:bg-[#FAFAFA] transition-colors z-20 border-r border-[#E4E7EC]">
                                        <div className="flex items-center gap-2">
                                            {setter.rank <= 3 ? (
                                                <span className={`text-[10px] font-semibold tabular-nums w-4 text-center ${setter.rank === 1 ? 'text-[#111827]' : 'text-gray-400'}`}>#{setter.rank}</span>
                                            ) : (
                                                <span className="w-4" />
                                            )} 
                                            <span className="truncate max-w-[140px] text-sm">{setter.displayName}</span>
                                        </div>
                                    </td>
                                    {Object.entries(currentRole.fields).map(([key, field]) => {
                                         const val = setter[key] || 0;
                                         return (
                                             <td key={key} className="py-3 px-4 text-right text-sm tabular-nums text-gray-600">
                                                {field.type === 'currency' ? <span className="font-medium text-[#111827]">${val.toLocaleString()}</span> : val.toLocaleString()}
                                             </td>
                                         );
                                    })}
                                    {currentRole.stats.filter(s => s.isCalculated).map(stat => (
                                         <td key={stat.key} className="py-3 px-4 text-right text-sm tabular-nums text-gray-500">
                                             {setter[stat.key]}%
                                         </td>
                                    ))}
                                  </tr>
                                ))}
                            </>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
