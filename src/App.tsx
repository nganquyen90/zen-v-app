/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Home, MessageCircleHeart, BookHeart, Sprout, UsersRound, PhoneCall, LogOut, Globe } from 'lucide-react';
import { cn } from './lib/utils';
import { AnimatePresence, motion } from 'motion/react';
import { auth } from './firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { useLanguage } from './lib/LanguageContext';

// Placeholder components for tabs
import Dashboard from './components/Dashboard';
import Companion from './components/Companion';
import Journal from './components/Journal';
import Game from './components/Game';
import Circles from './components/Circles';
import Auth from './components/Auth';

type Tab = 'home' | 'companion' | 'journal' | 'game' | 'circles';

const TRANSLATIONS = {
  vi: {
    subtitle: "Làm chủ tâm trí. Khơi nhịp tự do",
    crisis: "Nút Khẩn Cấp",
    crisisAlert: "Nút Khẩn Cấp: Đang kết nối với bộ phận hỗ trợ...",
    signOut: "Đăng xuất",
    tabs: {
      home: "Trang chủ",
      companion: "Trợ lý",
      journal: "Nhật ký",
      game: "Trò chơi",
      circles: "Cộng đồng"
    }
  },
  en: {
    subtitle: "Your Mind, Your Rhythm.",
    crisis: "Crisis Button",
    crisisAlert: "Crisis Button: Connecting to emergency support...",
    signOut: "Sign Out",
    tabs: {
      home: "Home",
      companion: "Companion",
      journal: "Journal",
      game: "Game",
      circles: "Circles"
    }
  }
};

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { lang, setLang } = useLanguage();
  const t = TRANSLATIONS[lang];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSignOut = () => {
    signOut(auth);
  };

  const tabs = [
    { id: 'home', label: t.tabs.home, icon: Home },
    { id: 'companion', label: t.tabs.companion, icon: MessageCircleHeart },
    { id: 'journal', label: t.tabs.journal, icon: BookHeart },
    { id: 'game', label: t.tabs.game, icon: Sprout },
    { id: 'circles', label: t.tabs.circles, icon: UsersRound },
  ] as const;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-sage-50">
        <div className="w-8 h-8 border-4 border-sage-300 border-t-sage-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-sage-50 shadow-2xl overflow-hidden relative font-sans">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-white/50 backdrop-blur-md z-10 sticky top-0">
        <div>
          <h1 className="text-2xl font-semibold text-sage-800 tracking-tight">Zen-V</h1>
          <p className="text-xs text-sage-600 font-medium">{t.subtitle}</p>
        </div>
        <div className="flex gap-2 items-center">
          <button
            onClick={() => setLang(lang === 'vi' ? 'en' : 'vi')}
            className="flex items-center gap-1 px-2 py-1.5 bg-white border border-slate-200 rounded-full text-[10px] font-bold text-slate-500 hover:bg-slate-50 transition-colors mr-1"
          >
            <Globe size={14} />
            {lang === 'vi' ? 'VN' : 'EN'}
          </button>
          <button 
            className="p-2 rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
            title={t.crisis}
            onClick={() => alert(t.crisisAlert)}
          >
            <PhoneCall size={20} />
          </button>
          <button 
            className="p-2 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
            title={t.signOut}
            onClick={handleSignOut}
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {activeTab === 'home' && <Dashboard onNavigate={setActiveTab} />}
            {activeTab === 'companion' && <Companion />}
            {activeTab === 'journal' && <Journal />}
            {activeTab === 'game' && <Game />}
            {activeTab === 'circles' && <Circles />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-white border-t border-sage-100 px-6 py-3 pb-safe z-10">
        <ul className="flex justify-between items-center">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <li key={tab.id}>
                <button
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all duration-300",
                    isActive 
                      ? "bg-sage-100 text-sage-800 shadow-sm" 
                      : "text-slate-400 hover:text-sage-600 hover:bg-sage-50/50"
                  )}
                >
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                  <span className={cn(
                    "text-[10px] mt-1 font-medium transition-all duration-300",
                    isActive ? "opacity-100" : "opacity-0 h-0 mt-0"
                  )}>
                    {tab.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
