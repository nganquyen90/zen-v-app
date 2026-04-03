import { useState, FormEvent, useEffect, useMemo } from 'react';
import { auth, db } from '../firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { Leaf, Mail, Lock, Loader2, Globe } from 'lucide-react';
import { motion } from 'motion/react';
import { useLanguage } from '../lib/LanguageContext';

const TRANSLATIONS = {
  vi: {
    subtitle: "Làm chủ tâm trí, Khơi nhịp tự do.",
    greeting: "Hít vào thật sâu... Chào mừng bạn trở về nhà.",
    actionBtn: "Vào Khu Vườn Bình Yên",
    invalidCred: "Email hoặc mật khẩu không hợp lệ.",
    emailInUse: "Tài khoản với email này đã tồn tại.",
    weakPassword: "Mật khẩu phải có ít nhất 6 ký tự.",
    genericError: "Đã xảy ra lỗi. Vui lòng thử lại.",
    nickname: "Biệt danh (Tùy chọn)",
    email: "Địa chỉ email",
    password: "Mật khẩu",
    switchSignUp: "Chưa có tài khoản? Đăng ký",
    switchSignIn: "Đã có tài khoản? Đăng nhập",
    anon: "Học sinh ẩn danh",
    quotes: [
      "Mọi chuyện rồi sẽ ổn thôi.",
      "Bạn đã làm rất tốt ngày hôm nay.",
      "Hãy cho phép bản thân được nghỉ ngơi.",
      "Từng bước một, không cần vội vã.",
      "Bạn xứng đáng được yêu thương."
    ]
  },
  en: {
    subtitle: "Your Mind, Your Rhythm.",
    greeting: "Take a deep breath... Welcome home.",
    actionBtn: "Enter the Peaceful Garden",
    invalidCred: "Invalid email or password.",
    emailInUse: "An account with this email already exists.",
    weakPassword: "Password should be at least 6 characters.",
    genericError: "An error occurred. Please try again.",
    nickname: "Nickname (Optional)",
    email: "Email address",
    password: "Password",
    switchSignUp: "Don't have an account? Sign up",
    switchSignIn: "Already have an account? Sign in",
    anon: "Anonymous Student",
    quotes: [
      "Everything will be okay.",
      "You did great today.",
      "Give yourself permission to rest.",
      "One step at a time, no rush.",
      "You are worthy of love."
    ]
  }
};

export default function Auth() {
  const { lang, setLang } = useLanguage();
  const t = TRANSLATIONS[lang];

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(0);

  useEffect(() => {
    // Pick a random quote on mount
    setQuoteIndex(Math.floor(Math.random() * t.quotes.length));
  }, [lang, t.quotes.length]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Create user document in Firestore
        const targetRole = user.email === 'nganquyen90@gmail.com' ? 'admin' : 'client';
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          name: name || t.anon,
          role: targetRole,
          createdAt: new Date().toISOString(),
          waterLevel: 30,
          growthStage: 1
        });
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      if (err.code === 'auth/invalid-credential') {
        setError(t.invalidCred);
      } else if (err.code === 'auth/email-already-in-use') {
        setError(t.emailInUse);
      } else if (err.code === 'auth/weak-password') {
        setError(t.weakPassword);
      } else {
        setError(err.message || t.genericError);
      }
      setLoading(false);
    }
  };

  return (
    <div 
      className="flex flex-col h-screen max-w-md mx-auto shadow-2xl overflow-hidden relative font-sans items-center justify-center p-6 pt-[max(env(safe-area-inset-top),1.5rem)] pb-[max(env(safe-area-inset-bottom),1.5rem)] transition-colors duration-1000 select-none"
      style={{ background: 'linear-gradient(135deg, #e0f7fa 0%, #f3e5f5 100%)' }}
    >
      <div className="absolute top-4 right-4 z-50 mt-[env(safe-area-inset-top)]">
        <button
          onClick={() => setLang(lang === 'vi' ? 'en' : 'vi')}
          className="flex items-center gap-1 px-3 py-1.5 bg-white/50 backdrop-blur-sm border border-white/40 rounded-full text-xs font-bold text-slate-600 hover:bg-white/70 transition-colors shadow-sm"
        >
          <Globe size={14} />
          {lang === 'vi' ? 'VN' : 'EN'}
        </button>
      </div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-sm bg-white/60 backdrop-blur-xl p-8 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.04)] border border-white/50"
      >
        <div className="flex flex-col items-center mb-8 text-center">
          <motion.div 
            animate={{ 
              scale: isFocused ? 1.1 : 1,
              boxShadow: isFocused 
                ? "0 0 30px rgba(74, 222, 128, 0.6)" 
                : "0 0 15px rgba(74, 222, 128, 0.2)"
            }}
            transition={{ duration: 0.5 }}
            className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-teal-50 rounded-full flex items-center justify-center text-emerald-600 mb-6 animate-pulse"
          >
            <Leaf size={36} strokeWidth={1.5} />
          </motion.div>
          
          <h1 className="text-2xl font-light text-slate-800 tracking-wide mb-2">
            {t.greeting}
          </h1>
          <p className="text-sm text-slate-500 font-light tracking-wide">
            {t.subtitle}
          </p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-6 p-3 bg-red-50/80 backdrop-blur-sm border border-red-100 text-red-600 text-sm rounded-xl text-center font-light"
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Leaf size={18} className="text-slate-400" />
              </div>
              <input
                type="text"
                placeholder={t.nickname}
                value={name}
                onChange={(e) => setName(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                className="w-full pl-11 pr-4 py-3.5 bg-white/70 border border-white/60 rounded-2xl text-sm focus:outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 transition-all font-light placeholder:text-slate-400"
              />
            </div>
          )}
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Mail size={18} className="text-slate-400" />
            </div>
            <input
              type="email"
              required
              placeholder={t.email}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className="w-full pl-11 pr-4 py-3.5 bg-white/70 border border-white/60 rounded-2xl text-sm focus:outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 transition-all font-light placeholder:text-slate-400"
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock size={18} className="text-slate-400" />
            </div>
            <input
              type="password"
              required
              placeholder={t.password}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className="w-full pl-11 pr-4 py-3.5 bg-white/70 border border-white/60 rounded-2xl text-sm focus:outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 transition-all font-light placeholder:text-slate-400"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-gradient-to-r from-emerald-400 to-teal-400 text-white py-4 rounded-2xl font-medium hover:from-emerald-500 hover:to-teal-500 transition-all flex items-center justify-center disabled:opacity-70 shadow-lg shadow-emerald-200/50"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : t.actionBtn}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="text-sm text-slate-500 hover:text-emerald-600 font-light transition-colors"
          >
            {isLogin ? t.switchSignUp : t.switchSignIn}
          </button>
        </div>
      </motion.div>

      {/* Micro-Healing Quote */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.7 }}
        transition={{ delay: 1, duration: 1.5 }}
        className="absolute bottom-8 left-0 right-0 text-center px-6 pointer-events-none"
      >
        <p className="text-sm text-slate-600 font-light italic">
          "{t.quotes[quoteIndex]}"
        </p>
      </motion.div>
    </div>
  );
}
