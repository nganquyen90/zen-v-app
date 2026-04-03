/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Home, MessageCircleHeart, BookHeart, Sprout, UsersRound, PhoneCall, LogOut, Globe, ShieldAlert, Settings, X, Trash2, ExternalLink } from 'lucide-react';
import { cn } from './lib/utils';
import { AnimatePresence, motion } from 'motion/react';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { doc, getDoc, updateDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { useLanguage } from './lib/LanguageContext';
import { handleFirestoreError, OperationType } from './lib/firestoreErrors';

// Placeholder components for tabs
import Dashboard from './components/Dashboard';
import Companion from './components/Companion';
import Journal from './components/Journal';
import Game from './components/Game';
import Circles from './components/Circles';
import Auth from './components/Auth';
import Onboarding from './components/Onboarding';
import AdminPanel from './components/AdminPanel';

type Tab = 'home' | 'companion' | 'journal' | 'game' | 'circles' | 'admin';

const TRANSLATIONS = {
  vi: {
    subtitle: "Làm chủ tâm trí. Khơi nhịp tự do",
    crisis: "Nút Khẩn Cấp",
    crisisAlert: "Nút Khẩn Cấp: Đang kết nối với bộ phận hỗ trợ...",
    emergencyNumber: "Số điện thoại khẩn cấp",
    emergencyNumberPlaceholder: "Nhập số điện thoại...",
    emergencyNotSet: "Bạn chưa cài đặt số điện thoại khẩn cấp. Vui lòng cài đặt trong phần Cài đặt.",
    save: "Lưu",
    signOut: "Đăng xuất",
    settings: "Cài đặt",
    deleteAccount: "Xóa tài khoản",
    deleteAccountConfirm: "Bạn có chắc chắn muốn xóa tài khoản? Hành động này không thể hoàn tác.",
    privacyPolicy: "Chính sách bảo mật",
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
    emergencyNumber: "Emergency Contact Number",
    emergencyNumberPlaceholder: "Enter phone number...",
    emergencyNotSet: "You haven't set an emergency contact number. Please set it in Settings.",
    save: "Save",
    signOut: "Sign Out",
    settings: "Settings",
    deleteAccount: "Delete Account",
    deleteAccountConfirm: "Are you sure you want to delete your account? This action cannot be undone.",
    privacyPolicy: "Privacy Policy",
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
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [tempEmergencyNumber, setTempEmergencyNumber] = useState('');
  const [isSavingEmergency, setIsSavingEmergency] = useState(false);
  const [asyncError, setAsyncError] = useState<Error | null>(null);
  const { lang, setLang } = useLanguage();
  const t = TRANSLATIONS[lang];

  if (asyncError) {
    throw asyncError;
  }

  useEffect(() => {
    if (showSettings && userData) {
      setTempEmergencyNumber(userData.emergencyNumber || '');
    }
  }, [showSettings, userData]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          const isAdminEmail = currentUser.email === 'nganquyen90@gmail.com';
          const targetRole = isAdminEmail ? 'admin' : 'client';

          if (userDoc.exists()) {
            const data = userDoc.data();
            if (isAdminEmail && data.role !== 'admin') {
              // Auto-upgrade this specific email to admin
              await setDoc(doc(db, 'users', currentUser.uid), { role: 'admin' }, { merge: true });
              setUserData({ ...data, role: 'admin' });
            } else {
              setUserData(data);
            }
          } else {
            // User document doesn't exist yet (might have failed during registration)
            // Let's create it now
            const newUserData = {
              uid: currentUser.uid,
              email: currentUser.email,
              name: currentUser.displayName || t.tabs.home, // Fallback name
              role: targetRole,
              createdAt: new Date().toISOString(),
              waterLevel: 30,
              growthStage: 1,
              lastActive: Date.now()
            };
            await setDoc(doc(db, 'users', currentUser.uid), newUserData);
            setUserData(newUserData);
          }
        } catch (err) {
          console.error("Error fetching user data:", err);
          try {
            handleFirestoreError(err, OperationType.GET, `users/${currentUser.uid}`);
          } catch (formattedErr) {
            setAsyncError(formattedErr as Error);
          }
        }
        
        const hasSeenOnboarding = localStorage.getItem('zenv_onboarding_completed');
        if (!hasSeenOnboarding) {
          setShowOnboarding(true);
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    
    const updateActivity = async () => {
      try {
        await setDoc(doc(db, 'users', user.uid), {
          lastActive: Date.now()
        }, { merge: true });
      } catch (err) {
        console.error("Error updating activity:", err);
        try {
          handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
        } catch (formattedErr) {
          setAsyncError(formattedErr as Error);
        }
      }
    };

    updateActivity();
    const interval = setInterval(updateActivity, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [user]);

  const handleSignOut = () => {
    signOut(auth);
    setShowSettings(false);
  };

  const handleSaveEmergencyNumber = async () => {
    if (!user) return;
    setIsSavingEmergency(true);
    try {
      await setDoc(doc(db, 'users', user.uid), { emergencyNumber: tempEmergencyNumber }, { merge: true });
      setUserData({ ...userData, emergencyNumber: tempEmergencyNumber });
      // Optional: show a success toast or just close settings
      setShowSettings(false);
    } catch (err) {
      console.error("Error saving emergency number:", err);
      alert(lang === 'vi' ? 'Đã xảy ra lỗi khi lưu số khẩn cấp.' : 'An error occurred while saving the emergency number.');
    } finally {
      setIsSavingEmergency(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm(t.deleteAccountConfirm)) {
      try {
        if (user) {
          try {
            await deleteDoc(doc(db, 'users', user.uid));
          } catch (e) {
            console.error("Error deleting user document:", e);
          }
          await user.delete();
          setShowSettings(false);
        }
      } catch (error: any) {
        if (error.code === 'auth/requires-recent-login') {
          alert(lang === 'vi' ? 'Vui lòng đăng nhập lại để thực hiện hành động này.' : 'Please sign in again to perform this action.');
          handleSignOut();
        } else {
          console.error("Error deleting account:", error);
          alert(lang === 'vi' ? 'Đã xảy ra lỗi khi xóa tài khoản.' : 'An error occurred while deleting the account.');
        }
      }
    }
  };

  const tabs = [
    { id: 'home', label: t.tabs.home, icon: Home },
    { id: 'companion', label: t.tabs.companion, icon: MessageCircleHeart },
    { id: 'journal', label: t.tabs.journal, icon: BookHeart },
    { id: 'game', label: t.tabs.game, icon: Sprout },
    { id: 'circles', label: t.tabs.circles, icon: UsersRound },
    ...(userData?.role === 'admin' ? [{ id: 'admin', label: 'Admin', icon: ShieldAlert }] : []),
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

  if (userData?.isDisabled) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-sage-50 p-6 text-center">
        <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
          <ShieldAlert size={32} />
        </div>
        <h2 className="text-2xl font-semibold text-slate-800 mb-2">Account Disabled</h2>
        <p className="text-slate-600 mb-6">Your account has been disabled by an administrator. Please contact support for more information.</p>
        <button 
          onClick={handleSignOut}
          className="px-6 py-3 bg-slate-800 text-white rounded-xl font-medium hover:bg-slate-700 transition-colors"
        >
          {t.signOut}
        </button>
      </div>
    );
  }

  if (showOnboarding) {
    return (
      <Onboarding 
        onComplete={() => {
          localStorage.setItem('zenv_onboarding_completed', 'true');
          setShowOnboarding(false);
        }} 
      />
    );
  }

  return (
    <div className="flex flex-col h-screen w-full max-w-md mx-auto bg-sage-50 shadow-2xl overflow-hidden relative font-sans select-none">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 pt-[max(env(safe-area-inset-top),1rem)] bg-white/50 backdrop-blur-md z-10 sticky top-0">
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-sage-800 tracking-tight">Zen-V</h1>
        </div>
        <div className="flex-[2] text-center hidden sm:block">
          <p className="text-xs text-sage-600 font-medium italic">{t.subtitle}</p>
        </div>
        <div className="flex gap-2 items-center flex-1 justify-end">
          <button
            onClick={() => setLang(lang === 'vi' ? 'en' : 'vi')}
            className="flex items-center gap-1 px-4 py-2.5 bg-white border border-slate-200 rounded-full text-[10px] font-bold text-slate-500 hover:bg-slate-50 transition-colors mr-1"
          >
            <Globe size={14} />
            {lang === 'vi' ? 'VN' : 'EN'}
          </button>
          <button 
            className="p-3 rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
            title={t.crisis}
            onClick={() => {
              if (userData?.emergencyNumber) {
                window.location.href = `tel:${userData.emergencyNumber}`;
              } else {
                alert(t.emergencyNotSet);
                setShowSettings(true);
              }
            }}
          >
            <PhoneCall size={20} />
          </button>
          <button 
            className="p-3 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
            title={t.settings}
            onClick={() => setShowSettings(true)}
          >
            <Settings size={20} />
          </button>
        </div>
      </header>
      
      {/* Mobile subtitle - visible only on small screens */}
      <div className="sm:hidden text-center py-2 bg-white/30 backdrop-blur-md border-b border-sage-100">
        <p className="text-xs text-sage-600 font-medium italic">{t.subtitle}</p>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden relative no-scrollbar select-text">
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
            {activeTab === 'admin' && userData?.role === 'admin' && <AdminPanel />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-white border-t border-sage-100 px-6 py-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] z-10">
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

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => setShowSettings(false)}
          >
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-sage-800">{t.settings}</h2>
                <button 
                  onClick={() => setShowSettings(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {t.emergencyNumber}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      value={tempEmergencyNumber}
                      onChange={(e) => setTempEmergencyNumber(e.target.value)}
                      placeholder={t.emergencyNumberPlaceholder}
                      className="flex-1 px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sage-400 focus:border-transparent transition-all"
                    />
                    <button
                      onClick={handleSaveEmergencyNumber}
                      disabled={isSavingEmergency}
                      className="px-4 py-2 bg-sage-600 text-white rounded-xl font-medium hover:bg-sage-700 transition-colors disabled:opacity-50"
                    >
                      {isSavingEmergency ? '...' : t.save}
                    </button>
                  </div>
                </div>

                <a 
                  href="https://sites.google.com/view/zen-vpolicy/home-page" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-between w-full p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors text-left"
                >
                  <div className="flex items-center gap-3 text-slate-700 font-medium">
                    <ShieldAlert size={20} className="text-softblue-500" />
                    {t.privacyPolicy}
                  </div>
                  <ExternalLink size={16} className="text-slate-400" />
                </a>

                <button 
                  onClick={handleSignOut}
                  className="flex items-center gap-3 w-full p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors text-left text-slate-700 font-medium"
                >
                  <LogOut size={20} className="text-slate-500" />
                  {t.signOut}
                </button>

                <div className="pt-4 mt-4 border-t border-slate-100">
                  <button 
                    onClick={handleDeleteAccount}
                    className="flex items-center gap-3 w-full p-4 rounded-2xl bg-red-50 hover:bg-red-100 transition-colors text-left text-red-600 font-medium"
                  >
                    <Trash2 size={20} />
                    {t.deleteAccount}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
