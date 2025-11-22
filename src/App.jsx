import React, { useState, useMemo, useEffect } from 'react';
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
  Filter,
  X
} from 'lucide-react';

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

// --- CONSTANTS & DEFAULTS ---
const DEFAULT_FIELD_MAPPING = {
  date: 'Date', 
  firstName: 'First Name (Dialer)',
  lastName: 'Last Name (Dialer)',
  dials: '# of Outbound Dials',
  pickups: '# of Pick Ups',
  conversations: 'How many conversations did you have today? (Over 2 mins)',
  hours: 'How many hours did you work?', 
  sets: '# of Calls Booked',
  setsShowed: '# of Calls Showed',
  setCloses: '', 
  cashCollected: 'How much cash did you collect today?',
  revenue: ''    
};

const INITIAL_OFFER_TEMPLATE = {
  id: '',
  name: '',
  apiKey: '',
  baseId: '',
  tableName: 'Daily Stats',
  mapping: { ...DEFAULT_FIELD_MAPPING }
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

const cleanBaseId = (input) => {
  const str = cleanInput(input);
  if (str.includes('airtable.com')) {
    const match = str.match(/(app[a-zA-Z0-9]+)/);
    return match ? match[0] : str;
  }
  return str;
};

const parseSmartNumber = (input) => {
  if (input === null || input === undefined || input === '') return 0;
  if (typeof input === 'number') return input;
  const str = input.toString();
  const match = str.match(/-?[\d,]+(\.\d+)?/);
  if (match) {
    const cleanNum = match[0].replace(/,/g, '');
    const num = parseFloat(cleanNum);
    return isNaN(num) ? 0 : num;
  }
  return 0;
};

const normalizeDate = (dateStr) => {
    if (!dateStr) return null;
    
    // FIX: Handle ISO string manually to prevent timezone shifts
    // If input is "2025-11-20", standard Date() parsing might make it Nov 19th in US timezones.
    // We force it to be Local Midnight for Nov 20th.
    if (typeof dateStr === 'string') {
        // Match YYYY-MM-DD
        const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (isoMatch) {
            const [_, y, m, d] = isoMatch.map(Number);
            return new Date(y, m - 1, d); // Month is 0-indexed
        }
        // Match MM/DD/YYYY (US CSV format)
        const usMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
        if (usMatch) {
            const [_, m, d, y] = usMatch.map(Number);
            return new Date(y, m - 1, d);
        }
    }

    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    // Normalize to midnight to ignore time
    d.setHours(0, 0, 0, 0);
    return d;
};

const toTitleCase = (str) => {
  if (!str) return '';
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
};

const normalizeName = (name) => {
  if (!name) return 'Unknown';
  return name.toString().replace(/\s+/g, ' ').trim().toLowerCase();
};

// LEVENSHTEIN DISTANCE (Fuzzy Matcher)
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
    if (err.code === 'auth/operation-not-allowed') return "Login method disabled. Enable 'Email/Password' or 'Anonymous' in Firebase Console.";
    if (err.code === 'auth/invalid-email') return "Invalid email address.";
    if (err.code === 'auth/user-disabled') return "This user account has been disabled.";
    if (err.code === 'auth/user-not-found') return "No account found with this email.";
    if (err.code === 'auth/wrong-password') return "Incorrect password.";
    return err.message ? err.message.replace("Firebase: ", "").replace(" (auth/", "").replace(").", "") : "An unknown error occurred.";
};

// --- GRAPH COMPONENT (SPARKLINE) ---
const SimpleSparkline = ({ data, color = "#6366f1", height = 40 }) => {
    if (!data || data.length === 0) {
        return <div style={{height}} className="w-full flex items-end pb-1 opacity-20"><div className="w-full h-[1px] bg-slate-500"></div></div>;
    }

    const min = Math.min(...data);
    const max = Math.max(...data);
    let range = max - min;
    if (range === 0) range = 1; 

    const points = data.map((val, i) => {
        const x = (i / (data.length - 1 || 1)) * 100; 
        const y = 100 - ((val - min) / range) * 100;
        const safeY = isNaN(y) ? 50 : Math.max(0, Math.min(100, y)); 
        return `${x},${safeY}`;
    }).join(' ');

    const fillPoints = `0,100 ${points} 100,100`;

    return (
        <div className="w-full mt-3 relative overflow-hidden" style={{ height }}>
             <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                <defs>
                    <linearGradient id={`grad-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor={color} stopOpacity="0.2" />
                        <stop offset="100%" stopColor={color} stopOpacity="0" />
                    </linearGradient>
                </defs>
                <polygon points={fillPoints} fill={`url(#grad-${color})`} stroke="none" />
                <polyline 
                    points={points} 
                    fill="none" 
                    stroke={color} 
                    strokeWidth="2" 
                    vectorEffect="non-scaling-stroke"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        </div>
    );
};

// --- UTILITY COMPONENTS ---

const StatCard = ({ title, value, subtext, icon: Icon, color, trendData }) => (
  <div className="rounded-xl bg-slate-900/50 border border-slate-800 p-5 hover:border-slate-700 transition-all duration-300 relative overflow-hidden group">
    <div className="flex items-start justify-between mb-2 relative z-10">
      <div>
        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-white tracking-tight tabular-nums">{value}</h3>
      </div>
      <div className={`p-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-${color}-400`}>
        <Icon size={18} />
      </div>
    </div>
    
    <div className="relative z-0">
        <SimpleSparkline data={trendData} color={color === 'blue' ? '#60a5fa' : color === 'emerald' ? '#34d399' : color === 'orange' ? '#fb923c' : '#a78bfa'} />
    </div>
    
    <div className="flex items-center gap-2 mt-2 relative z-10">
       {trendData && trendData.length > 1 && trendData[trendData.length -1] >= trendData[0] ? (
           <span className="flex items-center text-xs font-bold text-emerald-400"><TrendingUp size={12} className="mr-1"/> Trend</span>
       ) : (
           <span className="flex items-center text-xs font-bold text-slate-500"><Activity size={12} className="mr-1"/> Trend</span>
       )}
       <span className="text-xs text-slate-500 font-medium">{subtext}</span>
    </div>
  </div>
);

const AuthScreen = ({ onLogin, onRegister, onGuest, isLoading, error }) => {
    const [isRegistering, setIsRegistering] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isRegistering) onRegister(email, password, name);
        else onLogin(email, password);
    };

    return (
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6 font-sans">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
                <div className="text-center mb-8">
                    <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/20">
                        <Trophy size={24} className="text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Setter<span className="text-slate-400">OS</span></h1>
                    <p className="text-slate-400 text-sm">Sign in to manage your agency data securely.</p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm mb-6 flex items-start gap-2">
                        <div className="pt-0.5"><AlertCircle size={16} /></div>
                        <span className="flex-1">{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {isRegistering && (
                         <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Full Name</label>
                            <div className="relative"><User className="absolute left-3 top-3 text-slate-500" size={18} /><input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-3 text-white focus:border-indigo-500 outline-none transition-all" placeholder="John Doe" required /></div>
                        </div>
                    )}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Email Address</label>
                        <div className="relative"><Mail className="absolute left-3 top-3 text-slate-500" size={18} /><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-3 text-white focus:border-indigo-500 outline-none transition-all" placeholder="name@agency.com" required /></div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Password</label>
                        <div className="relative"><Lock className="absolute left-3 top-3 text-slate-500" size={18} /><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-3 text-white focus:border-indigo-500 outline-none transition-all" placeholder="••••••••" required /></div>
                    </div>
                    <button type="submit" disabled={isLoading} className="w-full py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-500/20 transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">{isLoading ? <Loader2 className="animate-spin" size={20} /> : (isRegistering ? 'Create Account' : 'Sign In')}</button>
                </form>
                <div className="mt-6 flex items-center justify-between text-sm"><button onClick={() => setIsRegistering(!isRegistering)} className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">{isRegistering ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}</button></div>
                <div className="mt-8 pt-6 border-t border-slate-800 text-center"><button onClick={onGuest} className="text-slate-500 hover:text-slate-300 text-xs font-medium transition-colors flex items-center justify-center gap-1 w-full">Continue as Guest (Data saved locally to browser only)</button></div>
            </div>
        </div>
    );
}

// --- MAIN COMPONENT ---

// RENAMED TO 'App' FOR VITE COMPATIBILITY
export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true); 
  const [offers, setOffers] = useState([]);
  const [activeOfferId, setActiveOfferId] = useState(null);
  const [view, setView] = useState('dashboard'); 
  const [setterData, setSetterData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingOffer, setEditingOffer] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);
  const [authError, setAuthError] = useState(null);

  // --- DATE FILTER STATE ---
  const [dateRange, setDateRange] = useState(DATE_RANGES.THIS_MONTH);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [showDateMenu, setShowDateMenu] = useState(false);

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
        if (err.code !== 'permission-denied') setError("Failed to sync data with cloud.");
    });
    return () => unsubscribe();
  }, [user, activeOfferId]);

  const handleLogin = async (email, password) => {
      setIsLoading(true); setAuthError(null);
      try { await signInWithEmailAndPassword(auth, email, password); } catch (err) { setAuthError(getFriendlyError(err)); } finally { setIsLoading(false); }
  };

  const handleRegister = async (email, password, name) => {
      setIsLoading(true); setAuthError(null);
      try { const credential = await createUserWithEmailAndPassword(auth, email, password); if (name) await updateProfile(credential.user, { displayName: name }); } catch (err) { setAuthError(getFriendlyError(err)); } finally { setIsLoading(false); }
  };

  const handleGuest = async () => {
      setIsLoading(true); try { await signInAnonymously(auth); } catch (err) { setAuthError(getFriendlyError(err)); } finally { setIsLoading(false); }
  };

  const handleLogout = async () => {
      try { await signOut(auth); setSetterData([]); setOffers([]); setActiveOfferId(null); setView('dashboard'); } catch (err) { console.error(err); }
  };

  const activeOffer = useMemo(() => offers.find(o => o.id === activeOfferId), [offers, activeOfferId]);

  const loadDemoData = async () => {
    if (!user) return;
    setError(null);
    const demoOffer = {
      id: 'demo-offer',
      name: 'Solar-X Demo (Cloud)',
      tableName: 'Demo Table',
      baseId: 'appDemo123',
      apiKey: 'demo-key',
      mapping: { ...DEFAULT_FIELD_MAPPING }
    };
    try {
        await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'offers', demoOffer.id), demoOffer);
        setActiveOfferId('demo-offer');
        setIsLoading(true);
        setTimeout(() => {
          const names = ['Alex Rivera', 'Sarah Chen', 'Mike Ross', 'Jessica Pearson', 'Harvey Specter', 'Louis Litt', 'Donna Paulsen', 'Rachel Zane'];
          const generateStat = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);
          const today = new Date();
          const demoData = [];
          for (let i = 0; i < 30; i++) {
              const date = new Date(today);
              date.setDate(today.getDate() - i);
              const dateStr = date.toISOString().split('T')[0];
              names.forEach(name => {
                   const dials = generateStat(20, 80); 
                   const pickups = Math.floor(dials * (generateStat(15, 25) / 100));
                   const conversations = Math.floor(pickups * 0.8);
                   const sets = Math.floor(conversations * (generateStat(5, 25) / 100));
                   const setsShowed = Math.floor(sets * (generateStat(60, 90) / 100));
                   const setCloses = Math.floor(setsShowed * (generateStat(20, 40) / 100));
                   const cash = setCloses * generateStat(1000, 3000);
                   demoData.push({
                        id: Math.random().toString(),
                        date: dateStr,
                        name: name,
                        dials, pickups, conversations,
                        hours: generateStat(4, 8) + Math.random(),
                        sets, setsShowed, setCloses,
                        cashCollected: cash, revenue: cash * 2
                   });
              });
          }
          setSetterData(demoData);
          setIsLoading(false);
          setView('dashboard');
        }, 800);
    } catch (e) { console.error("Error saving demo offer:", e); setError("Could not save demo config to cloud."); }
  };

  const fetchAirtableData = async () => {
    if (!activeOffer) return;
    if (activeOffer.id === 'demo-offer') { loadDemoData(); return; }

    setIsLoading(true); setError(null); setDebugInfo(null);

    const apiKey = cleanInput(activeOffer.apiKey);
    const baseId = cleanBaseId(activeOffer.baseId);
    const tableName = cleanInput(activeOffer.tableName);
    const baseUrl = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`;
    
    let allRecords = []; let offset = null; let pageCount = 0;

    try {
      do {
        const urlWithParams = new URL(baseUrl);
        if (offset) urlWithParams.searchParams.append('offset', offset);
        const response = await fetch(urlWithParams.toString(), { headers: { Authorization: `Bearer ${apiKey}` } });
        if (!response.ok) throw new Error(`Failed to fetch (${response.status})`);
        const data = await response.json();
        if (data.records) allRecords = [...allRecords, ...data.records];
        offset = data.offset; pageCount++;
        if (pageCount > 50) break; 
      } while (offset);

      const mapping = activeOffer.mapping || DEFAULT_FIELD_MAPPING;
      const formattedData = allRecords.map(record => {
        const fields = record.fields;
        const getNum = (key) => (key && fields[key] !== undefined) ? parseSmartNumber(fields[key]) : 0;
        return {
          id: record.id,
          date: fields[mapping.date] || null, 
          name: (() => {
             const f = mapping.firstName ? fields[mapping.firstName] : '';
             const l = mapping.lastName ? fields[mapping.lastName] : '';
             return (f || l) ? `${f || ''} ${l || ''}`.trim() : (fields[mapping.name] || 'Unknown');
          })(),
          dials: getNum(mapping.dials),
          pickups: getNum(mapping.pickups),
          conversations: getNum(mapping.conversations),
          hours: getNum(mapping.hours), 
          sets: getNum(mapping.sets),
          setsShowed: getNum(mapping.setsShowed),
          setCloses: getNum(mapping.setCloses), 
          cashCollected: getNum(mapping.cashCollected),
          revenue: getNum(mapping.revenue),
        };
      });
      setSetterData(formattedData);
    } catch (err) { console.error(err); setError(err.message); setSetterData([]); } finally { setIsLoading(false); }
  };

  useEffect(() => { if (view === 'dashboard' && activeOffer) fetchAirtableData(); }, [activeOfferId, view]);

  const handleSaveOffer = async (e) => {
    e.preventDefault();
    if (!user || !editingOffer.name || !editingOffer.apiKey || !editingOffer.baseId) return;
    const cleanOffer = {
        ...editingOffer,
        apiKey: cleanInput(editingOffer.apiKey),
        baseId: cleanBaseId(editingOffer.baseId),
        tableName: cleanInput(editingOffer.tableName),
        mapping: editingOffer.mapping || DEFAULT_FIELD_MAPPING,
        id: editingOffer.id || Date.now().toString()
    };
    try { await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'offers', cleanOffer.id), cleanOffer); setActiveOfferId(cleanOffer.id); setEditingOffer(null); setView('settings'); } catch (err) { console.error(err); setError("Failed to save offer."); }
  };

  const handleDeleteOffer = async (id) => {
    if (!user) return;
    if (window.confirm("Delete?")) {
      try { await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'offers', id)); if (activeOfferId === id) setActiveOfferId(null); } catch (err) { console.error(err); }
    }
  };

  const startEditOffer = (offer) => { setEditingOffer({ ...offer, mapping: { ...DEFAULT_FIELD_MAPPING, ...(offer.mapping || {}) } }); setView('edit-offer'); };
  const startNewOffer = () => { setEditingOffer({ ...INITIAL_OFFER_TEMPLATE }); setView('edit-offer'); };

  // --- DATE FILTERING LOGIC ---
  const filteredData = useMemo(() => {
    if (!setterData.length) return [];
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return setterData.filter(item => {
        if (!item.date) return dateRange === DATE_RANGES.ALL_TIME; 
        
        const itemDate = normalizeDate(item.date);
        if (!itemDate) return dateRange === DATE_RANGES.ALL_TIME;

        switch (dateRange) {
            case DATE_RANGES.TODAY:
                return itemDate.getTime() === todayStart.getTime();
            case DATE_RANGES.YESTERDAY: {
                const yest = new Date(todayStart);
                yest.setDate(yest.getDate() - 1);
                return itemDate.getTime() === yest.getTime();
            }
            case DATE_RANGES.THIS_WEEK: {
                // FIXED: Sunday Start Logic (matching 16th-22nd expectation)
                const day = todayStart.getDay(); // 0-6
                const diff = todayStart.getDate() - day; // Get back to Sunday
                const sunday = new Date(todayStart);
                sunday.setDate(diff);
                sunday.setHours(0,0,0,0); // Strict midnight
                return itemDate >= sunday;
            }
            case DATE_RANGES.THIS_MONTH:
                return itemDate.getMonth() === todayStart.getMonth() && itemDate.getFullYear() === todayStart.getFullYear();
            case DATE_RANGES.LAST_30_DAYS: {
                const thirtyAgo = new Date(todayStart);
                thirtyAgo.setDate(thirtyAgo.getDate() - 30);
                return itemDate >= thirtyAgo;
            }
            case DATE_RANGES.CUSTOM: {
                if (!customStart || !customEnd) return true;
                const s = normalizeDate(customStart);
                const e = normalizeDate(customEnd);
                return itemDate >= s && itemDate <= e;
            }
            case DATE_RANGES.ALL_TIME:
            default:
                return true;
        }
    });
  }, [setterData, dateRange, customStart, customEnd]);

  // --- SPARKLINE DATA GENERATION ---
  const generateTrendData = (field) => {
      const groups = {};
      let hasValidDates = false;

      filteredData.forEach(item => {
          if (item.date) {
              const d = normalizeDate(item.date);
              if (d) {
                  const key = d.getTime();
                  if (!groups[key]) groups[key] = 0;
                  groups[key] += (item[field] || 0);
                  hasValidDates = true;
              }
          }
      });
      
      if (!hasValidDates) return [];
      const sortedKeys = Object.keys(groups).sort((a, b) => a - b);
      return sortedKeys.map(k => groups[k]);
  };

  // --- AGGREGATION ---
  const aggregatedData = useMemo(() => {
    const map = new Map();
    filteredData.forEach(item => {
      const normalizedKey = normalizeName(item.name);
      if (!normalizedKey) return;
      let targetKey = null;
      if (map.has(normalizedKey)) targetKey = normalizedKey;
      else {
        for (const [existingKey] of map) {
          const dist = getLevenshteinDistance(existingKey, normalizedKey);
          if ((existingKey[0] === normalizedKey[0]) && dist <= (normalizedKey.length > 4 ? 2 : 0)) { targetKey = existingKey; break; }
        }
      }
      if (!targetKey) { targetKey = normalizedKey; map.set(targetKey, { ...item, displayName: toTitleCase(normalizedKey) }); }
      else {
        const existing = map.get(targetKey);
        existing.dials += item.dials; existing.pickups += item.pickups; existing.conversations += item.conversations;
        existing.hours += item.hours; existing.sets += item.sets; existing.setsShowed += item.setsShowed;
        existing.setCloses += item.setCloses; existing.cashCollected += item.cashCollected; existing.revenue += item.revenue;
      }
    });
    return Array.from(map.values());
  }, [filteredData]);

  const processedData = useMemo(() => {
    return aggregatedData.map(setter => {
      const showRate = setter.sets > 0 ? ((setter.setsShowed / setter.sets) * 100).toFixed(1) : 0;
      const closeRate = setter.sets > 0 ? ((setter.setCloses / setter.sets) * 100).toFixed(1) : 0; 
      return { ...setter, showRate: parseFloat(showRate), closeRate: parseFloat(closeRate) };
    }).sort((a, b) => b.cashCollected - a.cashCollected);
  }, [aggregatedData]);

  const totalDials = processedData.reduce((acc, curr) => acc + curr.dials, 0);
  const totalCash = processedData.reduce((acc, curr) => acc + curr.cashCollected, 0);
  const totalSets = processedData.reduce((acc, curr) => acc + curr.sets, 0);
  const totalSetsShowed = processedData.reduce((acc, curr) => acc + curr.setsShowed, 0);
  const avgShowRate = totalSets > 0 ? ((totalSetsShowed / totalSets) * 100).toFixed(1) : 0;

  const maxValues = {
    dials: Math.max(...processedData.map(d => d.dials), 1),
    pickups: Math.max(...processedData.map(d => d.pickups), 1),
    sets: Math.max(...processedData.map(d => d.sets), 1),
    cash: Math.max(...processedData.map(d => d.cashCollected), 1),
  };

  const getHeatmapStyle = (value, maxValue, type = 'default') => {
    const intensity = (value / maxValue);
    let bg = '', text = intensity > 0.6 ? 'text-white' : 'text-slate-300';
    if (type === 'activity') bg = `linear-gradient(90deg, rgba(59, 130, 246, ${intensity * 0.1}) 0%, rgba(59, 130, 246, ${intensity * 0.4}) 100%)`;
    else if (type === 'pipeline') { bg = `linear-gradient(90deg, rgba(249, 115, 22, ${intensity * 0.1}) 0%, rgba(249, 115, 22, ${intensity * 0.5}) 100%)`; text = intensity > 0.5 ? 'text-white font-bold' : 'text-orange-200'; }
    else if (type === 'cash') { bg = `linear-gradient(90deg, rgba(16, 185, 129, ${intensity * 0.1}) 0%, rgba(16, 185, 129, ${intensity * 0.5}) 100%)`; text = intensity > 0.5 ? 'text-white font-bold' : 'text-emerald-200'; }
    else bg = `rgba(255, 255, 255, ${intensity * 0.05})`;
    return { background: bg, className: text };
  };

  const hasDataButNoDates = useMemo(() => {
      if (setterData.length === 0) return false;
      const recordsWithDate = setterData.filter(item => item.date).length;
      return recordsWithDate === 0; 
  }, [setterData]);

  if (authLoading) return <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-slate-400"><Loader2 className="animate-spin text-indigo-500" size={32} /></div>;
  if (!user) return <AuthScreen onLogin={handleLogin} onRegister={handleRegister} onGuest={handleGuest} isLoading={isLoading} error={authError} />;

  if (view === 'settings') {
    return (
      <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans p-6 flex justify-center">
        <div className="w-full max-w-3xl space-y-8 animate-in fade-in zoom-in-95 duration-300">
          <div className="flex items-center justify-between">
            <div><h1 className="text-3xl font-bold text-white">Agency Configuration</h1><p className="text-slate-400 mt-1 flex items-center gap-2"><Cloud size={14} className="text-indigo-400" /> Settings synced to cloud</p></div>
            {offers.length > 0 && (<button onClick={() => setView('dashboard')} className="text-sm text-slate-400 hover:text-white transition-colors">Back to Dashboard</button>)}
          </div>
          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-5 flex items-center justify-between">
             <div className="flex items-center gap-4">
                 <div className="bg-indigo-500 p-2 rounded-lg"><PlayCircle size={20} className="text-white" /></div>
                 <div><h3 className="font-bold text-indigo-100">Preview Demo Mode</h3><p className="text-xs text-indigo-300/70">Loads sample data and saves a demo config to your cloud account.</p></div>
             </div>
             <button onClick={loadDemoData} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-lg transition-all shadow-lg shadow-indigo-600/20">Load Demo Data</button>
          </div>
          <div className="grid gap-4">{offers.map(offer => (<div key={offer.id} className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 flex items-center justify-between group hover:border-slate-700 transition-colors"><div className="flex items-center gap-4"><div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400"><Database size={20} /></div><div><h3 className="font-bold text-white">{offer.name}</h3><p className="text-xs text-slate-500 font-mono mt-0.5">{cleanBaseId(offer.baseId).slice(0, 8)}... • {offer.tableName}</p></div></div><div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => startEditOffer(offer)} className="px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-medium text-slate-300 transition-colors">Edit Config</button><button onClick={() => handleDeleteOffer(offer.id)} className="p-2 hover:bg-red-900/20 hover:text-red-400 rounded-lg text-slate-500 transition-colors"><Trash2 size={16} /></button></div></div>))}<button onClick={startNewOffer} className="border border-dashed border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center text-slate-500 hover:text-indigo-400 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all group"><Plus size={24} className="mb-2 group-hover:scale-110 transition-transform" /><span className="font-medium">Add New Offer</span></button></div>
          <div className="pt-8 border-t border-slate-800/50 flex items-center justify-between text-xs text-slate-600 font-mono"><span className="flex items-center gap-2"><User size={12} /> {user.email || 'Guest'} (ID: {user.uid.slice(0,6)}...)</span><button onClick={handleLogout} className="flex items-center gap-1 hover:text-white transition-colors"><LogOut size={12} /> Log Out</button></div>
        </div>
      </div>
    );
  }

  if (view === 'edit-offer' && editingOffer) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans p-6 flex justify-center items-center">
        <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><Settings className="text-indigo-500" size={20} /> {editingOffer.id ? 'Edit Offer Configuration' : 'Connect New Offer'}</h2>
          <form onSubmit={handleSaveOffer} className="space-y-6">
            <div className="space-y-4">
              <div><label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Offer Name</label><input type="text" value={editingOffer.name} onChange={e => setEditingOffer({...editingOffer, name: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all" placeholder="e.g. Solar Client A" required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 md:col-span-1"><label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Base ID</label><input type="text" value={editingOffer.baseId} onChange={e => setEditingOffer({...editingOffer, baseId: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:border-indigo-500 outline-none font-mono text-sm" placeholder="app..." required /></div>
                <div className="col-span-2 md:col-span-1"><label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 text-indigo-400">Table Name OR ID</label><input type="text" value={editingOffer.tableName} onChange={e => setEditingOffer({...editingOffer, tableName: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:border-indigo-500 outline-none" placeholder="tbl..." required /></div>
              </div>
              <div><label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Personal Access Token (PAT)</label><input type="password" value={editingOffer.apiKey} onChange={e => setEditingOffer({...editingOffer, apiKey: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:border-indigo-500 outline-none font-mono text-sm" placeholder="pat..." required /></div>
              <div className="pt-4 border-t border-slate-800">
                  <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><Database size={14} className="text-slate-500"/> Airtable Field Mapping</h3>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="col-span-2"><label className="block text-[10px] font-bold text-emerald-500 uppercase mb-1">Date Column (Exact Name Required)</label><input type="text" value={editingOffer.mapping.date} onChange={e => setEditingOffer({...editingOffer, mapping: {...editingOffer.mapping, date: e.target.value}})} className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-sm text-slate-300 focus:border-emerald-500 outline-none" placeholder="Date" /></div>
                     <div className="col-span-2 grid grid-cols-2 gap-4">
                        <div><label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">First Name Column</label><input type="text" value={editingOffer.mapping.firstName} onChange={e => setEditingOffer({...editingOffer, mapping: {...editingOffer.mapping, firstName: e.target.value}})} className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-sm text-slate-300 focus:border-indigo-500 outline-none" /></div>
                        <div><label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Last Name Column</label><input type="text" value={editingOffer.mapping.lastName} onChange={e => setEditingOffer({...editingOffer, mapping: {...editingOffer.mapping, lastName: e.target.value}})} className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-sm text-slate-300 focus:border-indigo-500 outline-none" /></div>
                     </div>
                     {Object.keys(DEFAULT_FIELD_MAPPING).filter(k => k !== 'firstName' && k !== 'lastName' && k !== 'name' && k !== 'date').map(key => (
                        <div key={key}>
                           <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{key.replace(/([A-Z])/g, ' $1').trim()}</label>
                           <input type="text" value={editingOffer.mapping[key]} onChange={e => setEditingOffer({...editingOffer, mapping: { ...editingOffer.mapping, [key]: e.target.value }})} className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-sm text-slate-300 focus:border-indigo-500 outline-none" placeholder={DEFAULT_FIELD_MAPPING[key] || "(Optional)"} />
                        </div>
                     ))}
                  </div>
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2"><button type="button" onClick={() => setView('settings')} className="flex-1 py-3 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors font-medium">Cancel</button><button type="submit" className="flex-1 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-500/20 transition-all flex justify-center items-center gap-2"><Save size={18} /> Save to Cloud</button></div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans selection:bg-indigo-500/30 pb-12">
      <nav className="sticky top-0 z-50 w-full bg-[#0f172a]/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center"><Trophy size={16} className="text-white" /></div>
              <span className="font-bold text-lg text-white tracking-tight hidden md:block">Setter<span className="text-slate-400">OS</span></span>
              <div className="ml-4 relative group">
                 <button className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-sm font-medium text-slate-300 hover:border-slate-700 transition-colors">{activeOffer ? activeOffer.name : 'Select Offer'} <ChevronDown size={14} className="text-slate-500" /></button>
                 <div className="absolute top-full left-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-xl shadow-xl overflow-hidden hidden group-hover:block">
                    {offers.map(offer => (<button key={offer.id} onClick={() => setActiveOfferId(offer.id)} className={`w-full text-left px-4 py-3 text-sm hover:bg-slate-800 transition-colors flex items-center justify-between ${activeOfferId === offer.id ? 'text-indigo-400 bg-indigo-500/5' : 'text-slate-300'}`}>{offer.name} {activeOfferId === offer.id && <Check size={14} />}</button>))}
                    <div className="border-t border-slate-800 p-1"><button onClick={() => setView('settings')} className="w-full text-left px-3 py-2 text-xs text-slate-500 hover:text-white hover:bg-slate-800 rounded transition-colors flex items-center gap-2"><Settings size={12} /> Manage Offers</button></div>
                 </div>
              </div>
            </div>
            
            {/* --- DATE FILTER BAR --- */}
            <div className="flex items-center gap-2">
               <div className="relative">
                  <button onClick={() => setShowDateMenu(!showDateMenu)} className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-sm font-medium text-slate-300 hover:border-slate-700 transition-colors">
                     <Calendar size={14} className="text-indigo-400" />
                     {dateRange === DATE_RANGES.CUSTOM ? (customStart && customEnd ? `${customStart} - ${customEnd}` : 'Select Dates') : dateRange}
                     <ChevronDown size={14} className="text-slate-500" />
                  </button>
                  {showDateMenu && (
                      <div className="absolute top-full right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                          <div className="p-2 grid gap-1">
                              {Object.values(DATE_RANGES).map(range => (
                                  <button key={range} onClick={() => { setDateRange(range); if(range !== DATE_RANGES.CUSTOM) setShowDateMenu(false); }} className={`text-left px-3 py-2 text-xs rounded-lg transition-colors ${dateRange === range ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}>
                                      {range}
                                  </button>
                              ))}
                          </div>
                          {dateRange === DATE_RANGES.CUSTOM && (
                              <div className="p-3 border-t border-slate-800 grid gap-2">
                                  <div className="grid grid-cols-2 gap-2">
                                     <div><label className="text-[10px] uppercase text-slate-500 font-bold">From</label><input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white outline-none focus:border-indigo-500" /></div>
                                     <div><label className="text-[10px] uppercase text-slate-500 font-bold">To</label><input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white outline-none focus:border-indigo-500" /></div>
                                  </div>
                                  <button onClick={() => setShowDateMenu(false)} className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded transition-colors">Apply Filter</button>
                              </div>
                          )}
                      </div>
                  )}
               </div>
               <div className="h-6 w-[1px] bg-slate-800 mx-2"></div>
               <button onClick={fetchAirtableData} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors" title="Refresh Data"><RefreshCw size={18} className={isLoading ? "animate-spin" : ""} /></button>
               <button onClick={() => setView('settings')} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors" title="Settings"><Settings size={18} /></button>
               <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors" title="Log Out"><LogOut size={18} /></button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-[1400px] mx-auto px-6 pt-8">
        {!activeOffer ? (
           <div className="flex flex-col items-center justify-center h-[60vh] text-slate-500"><Database size={48} className="mb-4 opacity-20" /><p>No offer selected.</p><button onClick={() => setView('settings')} className="text-indigo-400 hover:underline mt-2">Configure an offer</button></div>
        ) : (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800/50">
                <div><h1 className="text-2xl font-bold text-white tracking-tight">{activeOffer.name} Dashboard</h1><p className="text-slate-500 text-xs mt-1 font-medium">{isLoading ? 'Syncing with Airtable...' : `Connected to ${activeOffer.tableName}`}</p></div>
                
                {/* --- DATE MAPPING WARNING --- */}
                {hasDataButNoDates && (
                    <div className="text-red-400 text-xs font-bold flex items-center gap-2 bg-red-500/10 px-3 py-1.5 rounded-full border border-red-500/20">
                        <AlertCircle size={12}/> Date Column Missing! Check Settings.
                    </div>
                )}
                
                {setterData.length > 0 && filteredData.length === 0 && !hasDataButNoDates && (
                    <div className="text-orange-400 text-xs font-bold flex items-center gap-2 bg-orange-500/10 px-3 py-1.5 rounded-full border border-orange-500/20"><AlertCircle size={12}/> No data found for this date range.</div>
                )}
            </div>
            {error && (<div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg text-sm flex flex-col gap-2"><div className="flex items-center gap-2 font-bold"><AlertCircle size={18} /> Error Loading Data</div><div className="whitespace-pre-line opacity-90 ml-6">{error}</div>{debugInfo && <div className="ml-6 mt-2 text-xs font-mono opacity-50 border-t border-red-500/30 pt-2 break-all">{debugInfo}</div>}</div>)}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="Total Dials" value={totalDials.toLocaleString()} trendData={generateTrendData('dials')} subtext="Volume" icon={Phone} color="blue" />
              <StatCard title="Cash Collected" value={`$${totalCash.toLocaleString()}`} trendData={generateTrendData('cashCollected')} subtext="Revenue" icon={Wallet} color="emerald" />
              <StatCard title="Sets Booked" value={totalSets} trendData={generateTrendData('sets')} subtext="Pipeline" icon={Calendar} color="orange" />
              <StatCard title="Avg Show Rate" value={`${avgShowRate}%`} trendData={generateTrendData('setsShowed')} subtext="Efficiency" icon={Activity} color="purple" />
            </div>

            <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-900/30">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                      <tr className="text-[10px] uppercase tracking-widest font-bold text-slate-500 border-b border-slate-800/50">
                        <th colSpan="2" className="bg-slate-900 sticky left-0 z-30"></th>
                        <th colSpan="4" className="text-center py-2 border-r border-slate-800/50 bg-blue-500/5 text-blue-400/80">Activity</th>
                        <th colSpan="2" className="text-center py-2 border-r border-slate-800/50 bg-orange-500/5 text-orange-400/80">Pipeline</th>
                        <th colSpan="2" className="text-center py-2 border-r border-slate-800/50 bg-purple-500/5 text-purple-400/80">Efficiency</th>
                        <th colSpan="2" className="text-center py-2 bg-emerald-500/5 text-emerald-400/80">Financials</th>
                      </tr>
                    <tr className="text-xs text-slate-400 font-semibold border-b border-slate-800 bg-slate-800/20">
                      <th className="p-4 pl-6 w-16 text-slate-500">#</th>
                      <th className="p-4 sticky left-0 bg-[#0f172a] z-20 border-r border-slate-800">Setter</th>
                      <th className="p-4 text-center">Dials</th>
                      <th className="p-4 text-center">Pickups</th>
                      <th className="p-4 text-center">Hours</th>
                      <th className="p-4 text-center border-r border-slate-800">Convos</th>
                      <th className="p-4 text-center">Sets</th>
                      <th className="p-4 text-center border-r border-slate-800">Shows</th>
                      <th className="p-4 text-center">Show %</th>
                      <th className="p-4 text-center border-r border-slate-800">Close %</th>
                      <th className="p-4 text-right">Cash</th>
                      <th className="p-4 text-right pr-6">Rev</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm divide-y divide-slate-800/50">
                    {processedData.length === 0 && !isLoading && (<tr><td colSpan="12" className="p-12 text-center text-slate-500">{error ? 'Error loading data.' : 'No data found. Check filters or configuration.'}</td></tr>)}
                    {processedData.map((setter, index) => (
                      <tr key={setter.id || index} className="group hover:bg-slate-800/30 transition-colors">
                        <td className="p-4 pl-6 text-slate-600 font-mono text-xs">{String(index + 1).padStart(2, '0')}</td>
                        <td className="p-4 font-medium text-slate-200 sticky left-0 bg-[#0f172a] group-hover:bg-[#162032] transition-colors z-20 border-r border-slate-800"><div className="flex items-center gap-3"><div className={`w-1.5 h-1.5 rounded-full ${index === 0 ? 'bg-orange-500' : 'bg-slate-700'}`}></div><span className="truncate max-w-[140px]">{setter.displayName}</span></div></td>
                        <td className="p-1 text-center">{(() => { const style = getHeatmapStyle(setter.dials, maxValues.dials, 'activity'); return <div className={`py-1.5 px-2 rounded text-xs font-mono ${style.className}`} style={{background: style.background}}>{setter.dials.toLocaleString()}</div> })()}</td>
                        <td className="p-1 text-center">{(() => { const style = getHeatmapStyle(setter.pickups, maxValues.pickups, 'activity'); return <div className={`py-1.5 px-2 rounded text-xs font-mono ${style.className}`} style={{background: style.background}}>{setter.pickups}</div> })()}</td>
                        <td className="p-4 text-center text-slate-500 tabular-nums text-xs">{setter.hours.toFixed(1)}h</td>
                        <td className="p-4 text-center text-slate-500 tabular-nums border-r border-slate-800 text-xs">{setter.conversations}</td>
                        <td className="p-1 text-center">{(() => { const style = getHeatmapStyle(setter.sets, maxValues.sets, 'pipeline'); return <div className={`py-1.5 px-2 rounded font-bold text-xs ${style.className}`} style={{background: style.background}}>{setter.sets}</div> })()}</td>
                        <td className="p-4 text-center text-orange-200/60 font-mono text-xs border-r border-slate-800">{setter.setsShowed}</td>
                        <td className="p-4 text-center"><span className={`text-xs ${setter.showRate >= 80 ? 'text-emerald-400' : 'text-slate-500'}`}>{setter.showRate}%</span></td>
                        <td className="p-4 text-center border-r border-slate-800"><span className={`text-xs ${setter.closeRate >= 20 ? 'text-purple-400' : 'text-slate-500'}`}>{setter.closeRate}%</span></td>
                        <td className="p-1 text-right">{(() => { const style = getHeatmapStyle(setter.cashCollected, maxValues.cash, 'cash'); return <div className={`py-1.5 px-2 rounded font-mono text-xs ${style.className}`} style={{background: style.background}}>${setter.cashCollected.toLocaleString()}</div> })()}</td>
                        <td className="p-4 text-right font-mono text-slate-500 pr-6 text-xs">${setter.revenue.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}