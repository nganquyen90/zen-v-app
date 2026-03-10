import { useState, useEffect, useMemo } from 'react';
import { Send, Sparkles, X, Loader2, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../lib/LanguageContext';
import { GoogleGenAI } from '@google/genai';
import { collection, addDoc, getDocs, query, orderBy, limit, doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string;
    email?: string | null;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    tenantId?: string | null;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const TRANSLATIONS = {
  vi: {
    title: "Khu Vườn Đom Đóm",
    subtitle: "Nơi những tâm hồn đồng điệu tỏa sáng",
    placeholder: "Gửi một thông điệp ngắn (< 150 ký tự)...",
    send: "Gửi Đom Đóm",
    sending: "Đang gửi...",
    charLimit: "Tối đa 150 ký tự",
    empty: "Khu vườn đang tĩnh lặng. Hãy là người đầu tiên thắp sáng nhé!",
    aiName: "Đom đóm thông thái",
    moderationError: "Không thể kiểm duyệt tin nhắn lúc này. Vui lòng thử lại sau.",
    fetchError: "Không thể tải thông điệp. Vui lòng thử lại sau."
  },
  en: {
    title: "Firefly Garden",
    subtitle: "Where kindred spirits shine",
    placeholder: "Send a short message (< 150 chars)...",
    send: "Release Firefly",
    sending: "Releasing...",
    charLimit: "Max 150 characters",
    empty: "The garden is quiet. Be the first to light it up!",
    aiName: "Wise Firefly",
    moderationError: "Could not moderate message right now. Please try again later.",
    fetchError: "Could not load messages. Please try again later."
  }
};

interface FireflyData {
  id: string;
  text_vi: string;
  text_en: string;
  authorId: string;
  createdAt: string;
  isSad: boolean;
  aiReply_vi?: string;
  aiReply_en?: string;
  energy?: number;
  dailyEnergy?: Record<string, { date: string, count: number }>;
  x: number;
  y: number;
  delay: number;
  duration: number;
}

export default function Circles() {
  const { lang } = useLanguage();
  const t = TRANSLATIONS[lang];

  const [fireflies, setFireflies] = useState<FireflyData[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFirefly, setSelectedFirefly] = useState<FireflyData | null>(null);
  const [isInputExpanded, setIsInputExpanded] = useState(false);
  const [pulsingFireflyId, setPulsingFireflyId] = useState<string | null>(null);

  useEffect(() => {
    fetchFireflies();
  }, []);

  const playDingSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
      
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
      
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
      console.error("Audio playback failed", e);
    }
  };

  const handleDoubleClick = async (e: React.MouseEvent, firefly: FireflyData) => {
    e.stopPropagation();
    
    const userId = auth.currentUser?.uid || 'anonymous';
    const today = new Date().toISOString().split('T')[0];
    
    const currentDaily = firefly.dailyEnergy?.[userId] || { date: today, count: 0 };
    
    // Reset count if it's a new day
    if (currentDaily.date !== today) {
      currentDaily.date = today;
      currentDaily.count = 0;
    }
    
    if (currentDaily.count >= 5) {
      // Limit reached for today
      return;
    }

    // Trigger pulse effect and sound
    setPulsingFireflyId(firefly.id);
    playDingSound();
    setTimeout(() => {
      setPulsingFireflyId(null);
    }, 500);

    // Optimistic update
    const newEnergy = (firefly.energy || 0) + 1;
    currentDaily.count += 1;
    
    setFireflies(prev => prev.map(f => {
      if (f.id === firefly.id) {
        return {
          ...f,
          energy: newEnergy,
          dailyEnergy: {
            ...f.dailyEnergy,
            [userId]: currentDaily
          }
        };
      }
      return f;
    }));

    // Update Firestore
    try {
      const fireflyRef = doc(db, 'fireflies', firefly.id);
      await updateDoc(fireflyRef, {
        energy: newEnergy,
        [`dailyEnergy.${userId}`]: currentDaily
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `fireflies/${firefly.id}`);
    }
  };

  const fetchFireflies = async () => {
    setIsLoading(true);
    try {
      const q = query(collection(db, 'fireflies'), orderBy('createdAt', 'desc'), limit(20));
      const snapshot = await getDocs(q);
      
      const fetched: any[] = [];
      snapshot.forEach(doc => {
        fetched.push({ id: doc.id, ...doc.data() });
      });

      // Randomly pick 5-7 fireflies
      const shuffled = fetched.sort(() => 0.5 - Math.random());
      const selectedCount = Math.floor(Math.random() * 3) + 5; // 5 to 7
      const selected = shuffled.slice(0, selectedCount).map(f => ({
        ...f,
        x: Math.random() * 80 + 10, // 10% to 90%
        y: Math.random() * 60 + 10, // 10% to 70%
        delay: Math.random() * 5,
        duration: Math.random() * 10 + 15 // 15s to 25s
      }));

      setFireflies(selected);
    } catch (err) {
      console.error("Error fetching fireflies:", err);
      try {
        handleFirestoreError(err, OperationType.LIST, 'fireflies');
      } catch (e) {
        // Error is logged and thrown by handleFirestoreError
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || input.length > 150 || isSending) return;

    setIsSending(true);
    setError('');

    try {
      const prompt = `
        Bạn là "Người gác vườn" và "Đom đóm thông thái" của một cộng đồng học sinh.
        Nhiệm vụ của bạn là kiểm duyệt, dịch và phản hồi thông điệp của người dùng.

        INPUT:
        {
          "message": "${input}",
          "language": "${lang}"
        }

        YÊU CẦU:
        1. Kiểm duyệt (Moderation): Nếu thông điệp chứa từ ngữ nhạy cảm, công kích, bạo lực ngôn từ hoặc tiêu cực nặng, hãy từ chối.
        2. Dịch (Translation): Dịch thông điệp sang ngôn ngữ còn lại (vi -> en, en -> vi).
        3. Phân tích cảm xúc (Emotion): Nếu thông điệp quá buồn, cô đơn, áp lực, hãy đánh dấu isSad = true.
        4. Phản hồi (Supportive AI): Nếu isSad = true, hãy viết một lời động viên an ủi ngắn gọn (1-2 câu) đóng vai "Đom đóm thông thái" bằng cả tiếng Việt và tiếng Anh.

        OUTPUT FORMAT (Chỉ trả về JSON hợp lệ, không có markdown, không có text thừa):
        {
          "isApproved": boolean,
          "rejectionReason": "Lý do từ chối và gợi ý viết lại tích cực hơn (bằng ngôn ngữ của người dùng). Rỗng nếu isApproved = true",
          "text_vi": "Thông điệp bằng tiếng Việt",
          "text_en": "Thông điệp bằng tiếng Anh",
          "isSad": boolean,
          "aiReply_vi": "Lời động viên bằng tiếng Việt (nếu isSad = true)",
          "aiReply_en": "Lời động viên bằng tiếng Anh (nếu isSad = true)"
        }
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });

      const resultText = response.text || "{}";
      const result = JSON.parse(resultText);

      if (!result.isApproved) {
        setError(result.rejectionReason || t.moderationError);
        setIsSending(false);
        return;
      }

      const newFirefly = {
        text_vi: result.text_vi || input,
        text_en: result.text_en || input,
        authorId: auth.currentUser?.uid || 'anonymous',
        createdAt: new Date().toISOString(),
        isSad: result.isSad || false,
        aiReply_vi: result.aiReply_vi || '',
        aiReply_en: result.aiReply_en || '',
        energy: 0,
        dailyEnergy: {}
      };

      try {
        await addDoc(collection(db, 'fireflies'), newFirefly);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, 'fireflies');
      }
      
      setInput('');
      setIsInputExpanded(false);
      // Refresh garden to show the new firefly
      fetchFireflies();

    } catch (err) {
      console.error("Error sending firefly:", err);
      setError(t.moderationError);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 relative overflow-hidden">
      {/* Night Sky Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900 via-slate-900 to-black z-0"></div>
      
      {/* Stars */}
      <div className="absolute inset-0 z-0 opacity-50" style={{ backgroundImage: 'radial-gradient(circle at center, white 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

      {/* Header */}
      <div className="p-6 relative z-10 text-center bg-gradient-to-b from-slate-900/80 to-transparent">
        <h2 className="text-2xl font-serif text-amber-100 flex items-center justify-center gap-2">
          <Sparkles size={20} className="text-amber-300" />
          {t.title}
          <Sparkles size={20} className="text-amber-300" />
        </h2>
        <p className="text-xs text-indigo-200 mt-1 opacity-80">{t.subtitle}</p>
      </div>

      {/* Garden Area */}
      <div className="flex-1 relative z-10 overflow-hidden" onClick={() => setSelectedFirefly(null)}>
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 size={32} className="text-amber-200/50 animate-spin" />
          </div>
        ) : fireflies.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-indigo-200/50 text-sm">
            {t.empty}
          </div>
        ) : (
          fireflies.map((firefly) => (
            <motion.div
              key={firefly.id}
              className="absolute cursor-pointer"
              style={{ left: `${firefly.x}%`, top: `${firefly.y}%` }}
              animate={{
                y: [0, -20, 0, 20, 0],
                x: [0, 15, 0, -15, 0],
              }}
              transition={{
                duration: firefly.duration,
                repeat: Infinity,
                ease: "easeInOut",
                delay: firefly.delay
              }}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedFirefly(firefly);
              }}
              onDoubleClick={(e) => handleDoubleClick(e, firefly)}
            >
              <div className="relative group flex items-center justify-center">
                <motion.div 
                  className="bg-amber-200 rounded-full animate-pulse"
                  animate={pulsingFireflyId === firefly.id ? {
                    scale: [1, 1.5, 1],
                    boxShadow: [
                      "0 0 15px 5px rgba(251,191,36,0.6)",
                      "0 0 30px 15px rgba(251,191,36,0.9)",
                      "0 0 15px 5px rgba(251,191,36,0.6)"
                    ]
                  } : {
                    scale: 1,
                    boxShadow: "0 0 15px 5px rgba(251,191,36,0.6)"
                  }}
                  transition={{ duration: 0.5 }}
                  style={{ 
                    width: `${12 + Math.min(firefly.energy || 0, 50) * 1.5}px`, 
                    height: `${12 + Math.min(firefly.energy || 0, 50) * 1.5}px` 
                  }}
                ></motion.div>
                
                {/* Preview bubble on hover */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[200px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <div className="bg-white/10 backdrop-blur-md border border-white/20 text-white text-[10px] p-2 rounded-xl line-clamp-2 text-center shadow-xl">
                    {lang === 'vi' ? firefly.text_vi : firefly.text_en}
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Selected Firefly Modal */}
      <AnimatePresence>
        {selectedFirefly && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="absolute inset-x-4 bottom-32 z-50"
          >
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-5 rounded-3xl shadow-2xl">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2 text-amber-200">
                  <Sparkles size={16} />
                  <span className="text-xs font-medium uppercase tracking-wider opacity-80">
                    {new Date(selectedFirefly.createdAt).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US')}
                  </span>
                </div>
                <button 
                  onClick={() => setSelectedFirefly(null)}
                  className="text-white/50 hover:text-white bg-white/5 rounded-full p-1"
                >
                  <X size={16} />
                </button>
              </div>
              
              <p className="text-white text-sm leading-relaxed mb-4">
                {lang === 'vi' ? selectedFirefly.text_vi : selectedFirefly.text_en}
              </p>

              {selectedFirefly.isSad && (selectedFirefly.aiReply_vi || selectedFirefly.aiReply_en) && (
                <div className="bg-indigo-900/40 border border-indigo-400/30 p-3 rounded-2xl mt-4">
                  <div className="flex items-center gap-2 mb-1 text-indigo-200">
                    <Info size={14} />
                    <span className="text-[10px] font-medium uppercase tracking-wider">{t.aiName}</span>
                  </div>
                  <p className="text-indigo-100 text-xs leading-relaxed italic">
                    {lang === 'vi' ? selectedFirefly.aiReply_vi : selectedFirefly.aiReply_en}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area / FAB */}
      <div className="absolute bottom-6 right-6 z-50 flex flex-col items-end">
        <AnimatePresence>
          {isInputExpanded && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="mb-4 w-[calc(100vw-3rem)] max-w-md bg-white/10 backdrop-blur-xl border border-white/20 p-4 rounded-3xl shadow-2xl"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-amber-200 text-sm font-medium">{t.send}</span>
                <button 
                  onClick={() => setIsInputExpanded(false)}
                  className="text-white/50 hover:text-white bg-white/5 rounded-full p-1"
                >
                  <X size={16} />
                </button>
              </div>
              
              {error && (
                <div className="mb-2 bg-red-500/10 border border-red-500/20 text-red-200 text-xs p-2 rounded-xl text-center">
                  {error}
                </div>
              )}
              
              <div className="flex items-end gap-2 bg-black/20 p-2 rounded-2xl border border-white/10">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={t.placeholder}
                  maxLength={150}
                  rows={input.length > 50 ? 3 : 2}
                  className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-white/40 px-3 py-2 resize-none"
                  autoFocus
                />
                <div className="flex flex-col items-center justify-between py-1 gap-1 shrink-0">
                  <span className={`text-[10px] font-medium ${input.length >= 150 ? 'text-red-400' : 'text-white/40'}`}>
                    {input.length}/150
                  </span>
                  <button 
                    onClick={handleSend}
                    disabled={!input.trim() || isSending || input.length > 150}
                    className="p-2.5 bg-amber-500 text-slate-900 rounded-full hover:bg-amber-400 disabled:opacity-50 transition-colors shadow-[0_0_10px_rgba(245,158,11,0.3)]"
                  >
                    {isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!isInputExpanded && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsInputExpanded(true)}
            className="w-14 h-14 bg-amber-500 text-slate-900 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:bg-amber-400 transition-colors"
          >
            <Sparkles size={24} />
          </motion.button>
        )}
      </div>
    </div>
  );
}
