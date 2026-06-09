import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  BookOpen, 
  MessageSquare, 
  Search, 
  User, 
  Home, 
  Gamepad2, 
  Brain, 
  BookMarked, 
  Languages,
  Menu,
  X,
  ChevronRight,
  LogOut,
  LogIn
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db } from './lib/firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// Pages
import Dashboard from './pages/Dashboard';
import SubjectsList from './pages/SubjectsList';
import CompulsorySubjects from './pages/CompulsorySubjects';
import OptionalSubjects from './pages/OptionalSubjects';
import SubjectDetail from './pages/SubjectDetail';
import AITest from './pages/AITest';
import Forum from './pages/Forum';
import Dictionary from './pages/Dictionary';
import AIAssistant from './pages/AIAssistant';
import DictionaryOverlay from './components/DictionaryOverlay';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        // Sync with Firestore
        const userRef = doc(db, 'userProfiles', user.uid);
        const userDoc = await getDoc(userRef);
        if (!userDoc.exists()) {
          await setDoc(userRef, {
            uid: user.uid,
            displayName: user.displayName,
            email: user.email,
            joinedAt: new Date().toISOString(),
          });
        }
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const login = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        // User closed the popup, no need to show an error
        console.log('Login popup was closed by the user.');
      } else {
        console.error('Login failed', error);
      }
    }
  };

  const logout = () => signOut(auth);

  return (
    <Router>
      <div className="flex h-screen bg-[#F5F5F0] text-[#141414] font-sans overflow-hidden">
        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            />
          )}
        </AnimatePresence>

        {/* Sidebar */}
        <aside className={`
          fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-[#141414]/10 transform transition-transform duration-300 lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="flex flex-col h-full">
            <div className="p-6 border-bottom border-[#141414]/10">
              <h1 className="text-2xl font-serif italic font-bold tracking-tight">CSS Prep Pro</h1>
              <p className="text-[10px] uppercase tracking-widest opacity-50 mt-1">Excellence in Civil Service</p>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
              <SidebarLink to="/" icon={<Home size={20} />} label="Dashboard" onClick={() => setSidebarOpen(false)} />
              <SidebarLink to="/subjects" icon={<BookOpen size={20} />} label="Subjects" onClick={() => setSidebarOpen(false)} />
              <SidebarLink to="/ai-assistant" icon={<Brain size={20} />} label="AI Mentor" onClick={() => setSidebarOpen(false)} />
              <SidebarLink to="/forum" icon={<MessageSquare size={20} />} label="Community" onClick={() => setSidebarOpen(false)} />
              <SidebarLink to="/dictionary" icon={<Languages size={20} />} label="Translator" onClick={() => setSidebarOpen(false)} />
            </nav>

            <div className="p-4 border-t border-[#141414]/10">
              {user ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#141414] text-white flex items-center justify-center overflow-hidden">
                    {user.photoURL ? <img src={user.photoURL} alt="User" /> : <User size={20} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user.displayName}</p>
                    <button onClick={logout} className="text-xs opacity-50 hover:opacity-100 flex items-center gap-1">
                      <LogOut size={12} /> Sign Out
                    </button>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={login}
                  className="w-full py-2 bg-[#141414] text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 hover:bg-[#141414]/90 transition-colors"
                >
                  <LogIn size={18} /> Sign In to Track Progress
                </button>
              )}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          <header className="h-16 bg-white border-b border-[#141414]/10 flex items-center justify-between px-6 lg:px-8">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 -ml-2">
              <Menu size={24} />
            </button>
            <div className="flex-1" />
            <div className="flex items-center gap-4">
              <span className="text-[11px] uppercase tracking-wider font-semibold opacity-50 hidden sm:block">Spring 2026 Batch</span>
              <div className="w-[1px] h-4 bg-[#141414]/10 hidden sm:block" />
              <div className="flex items-center gap-2 text-sm font-medium">
                <span className="text-green-600">● Live Prep</span>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/subjects" element={<SubjectsList />} />
                <Route path="/subjects/compulsory" element={<CompulsorySubjects />} />
                <Route path="/subjects/optional" element={<OptionalSubjects />} />
                <Route path="/subject/:id" element={<SubjectDetail />} />
                <Route path="/subject/:id/test" element={<AITest />} />
                <Route path="/forum" element={<Forum user={user} login={login} />} />
                <Route path="/dictionary" element={<Dictionary />} />
                <Route path="/ai-assistant" element={<AIAssistant user={user} login={login} />} />
              </Routes>
            </AnimatePresence>
          </main>
        </div>
      </div>
      <DictionaryOverlay />
    </Router>
  );
}

function SidebarLink({ to, icon, label, onClick }: { to: string, icon: React.ReactNode, label: string, onClick?: () => void }) {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link 
      to={to} 
      onClick={onClick}
      className={`
        flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
        ${isActive ? 'bg-[#141414] text-white shadow-lg' : 'hover:bg-[#141414]/5 opacity-70 hover:opacity-100'}
      `}
    >
      {icon}
      <span className="text-sm font-semibold tracking-tight">{label}</span>
      {isActive && (
        <motion.div layoutId="active" className="ml-auto">
          <ChevronRight size={14} />
        </motion.div>
      )}
    </Link>
  );
}
