import { useState, FormEvent } from 'react';
import { auth, db } from '../firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { Leaf, Mail, Lock, Loader2, Globe } from 'lucide-react';
import { motion } from 'motion/react';
import { useLanguage } from '../lib/LanguageContext';

const TRANSLATIONS = {
  vi: {
    subtitle: "Làm chủ tâm trí. Khơi nhịp tự do",
    invalidCred: "Email hoặc mật khẩu không hợp lệ.",
    emailInUse: "Tài khoản với email này đã tồn tại.",
    weakPassword: "Mật khẩu phải có ít nhất 6 ký tự.",
    genericError: "Đã xảy ra lỗi. Vui lòng thử lại.",
    nickname: "Biệt danh (Tùy chọn)",
    email: "Địa chỉ email",
    password: "Mật khẩu",
    signIn: "Đăng nhập",
    signUp: "Tạo tài khoản",
    switchSignUp: "Chưa có tài khoản? Đăng ký",
    switchSignIn: "Đã có tài khoản? Đăng nhập",
    anon: "Học sinh ẩn danh"
  },
  en: {
    subtitle: "Your Mind, Your Rhythm.",
    invalidCred: "Invalid email or password.",
    emailInUse: "An account with this email already exists.",
    weakPassword: "Password should be at least 6 characters.",
    genericError: "An error occurred. Please try again.",
    nickname: "Nickname (Optional)",
    email: "Email address",
    password: "Password",
    signIn: "Sign In",
    signUp: "Create Account",
    switchSignUp: "Don't have an account? Sign up",
    switchSignIn: "Already have an account? Sign in",
    anon: "Anonymous Student"
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
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          name: name || t.anon,
          role: 'client',
          createdAt: new Date().toISOString(),
          waterLevel: 30,
          growthStage: 1
        });
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      // Simplify error message
      if (err.code === 'auth/invalid-credential') {
        setError(t.invalidCred);
      } else if (err.code === 'auth/email-already-in-use') {
        setError(t.emailInUse);
      } else if (err.code === 'auth/weak-password') {
        setError(t.weakPassword);
      } else {
        setError(err.message || t.genericError);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-sage-50 shadow-2xl overflow-hidden relative font-sans items-center justify-center p-6">
      <div className="absolute top-4 right-4 z-50">
        <button
          onClick={() => setLang(lang === 'vi' ? 'en' : 'vi')}
          className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors shadow-sm"
        >
          <Globe size={14} />
          {lang === 'vi' ? 'VN' : 'EN'}
        </button>
      </div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm bg-white p-8 rounded-3xl shadow-sm border border-sage-100"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-sage-100 rounded-full flex items-center justify-center text-sage-600 mb-4">
            <Leaf size={32} />
          </div>
          <h1 className="text-2xl font-serif text-sage-800 tracking-tight">Zen-V</h1>
          <p className="text-sm text-sage-600 font-medium">{t.subtitle}</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Leaf size={18} className="text-sage-400" />
              </div>
              <input
                type="text"
                placeholder={t.nickname}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-sage-50/50 border border-sage-200 rounded-2xl text-sm focus:outline-none focus:border-sage-400 focus:ring-1 focus:ring-sage-400 transition-all"
              />
            </div>
          )}
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail size={18} className="text-sage-400" />
            </div>
            <input
              type="email"
              required
              placeholder={t.email}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-sage-50/50 border border-sage-200 rounded-2xl text-sm focus:outline-none focus:border-sage-400 focus:ring-1 focus:ring-sage-400 transition-all"
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock size={18} className="text-sage-400" />
            </div>
            <input
              type="password"
              required
              placeholder={t.password}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-sage-50/50 border border-sage-200 rounded-2xl text-sm focus:outline-none focus:border-sage-400 focus:ring-1 focus:ring-sage-400 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-sage-600 text-white py-3 rounded-2xl font-medium hover:bg-sage-700 transition-colors flex items-center justify-center disabled:opacity-70"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : (isLogin ? t.signIn : t.signUp)}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="text-sm text-sage-600 hover:text-sage-800 font-medium transition-colors"
          >
            {isLogin ? t.switchSignUp : t.switchSignIn}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
