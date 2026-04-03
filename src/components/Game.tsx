import { useState, useEffect } from 'react';
import { Sparkles, Clock, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../lib/LanguageContext';

const TRANSLATIONS = {
  vi: {
    subtitle: "Sắp xếp & Chữa lành",
    session: "Lượt",
    title: "Góc Nhỏ Ngăn Nắp",
    description: "Dành 7 phút để sắp xếp lại hộp bút màu, tìm lại sự bình yên trong tâm trí.",
    limitReached: "Hôm nay bạn đã thư giãn đủ rồi. Hãy dành năng lượng cho việc khác nhé! Hẹn gặp lại ngày mai.",
    startBtn: "Bắt đầu dọn dẹp",
    perfect: "Hoàn hảo!",
    winDesc: "Mọi thứ đã vào đúng vị trí. Hy vọng bạn cảm thấy nhẹ nhõm hơn.",
    backBtn: "Quay lại",
    tray: "Hộp Bút Màu",
    desk: "Bàn Học",
  },
  en: {
    subtitle: "Satisfying Cleanup",
    session: "Session",
    title: "Tidy Corner",
    description: "Take 7 minutes to organize the color pencils and find peace of mind.",
    limitReached: "You've relaxed enough for today. Save your energy for other things! See you tomorrow.",
    startBtn: "Start cleaning",
    perfect: "Perfect!",
    winDesc: "Everything is in its right place. Hope you feel more relieved.",
    backBtn: "Go back",
    tray: "Pencil Box",
    desk: "Desk",
  }
};

const COLORS = [
  { id: 'red', hex: '#fca5a5', name: 'Red' },
  { id: 'orange', hex: '#fdba74', name: 'Orange' },
  { id: 'yellow', hex: '#fde047', name: 'Yellow' },
  { id: 'green', hex: '#86efac', name: 'Green' },
  { id: 'blue', hex: '#93c5fd', name: 'Blue' },
  { id: 'indigo', hex: '#a5b4fc', name: 'Indigo' },
  { id: 'violet', hex: '#d8b4fe', name: 'Violet' },
];

const shuffle = (array: any[]) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

export default function Game() {
  const [sessionCount, setSessionCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number>(7 * 60);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [hasWon, setHasWon] = useState(false);
  
  const [shuffledColors, setShuffledColors] = useState(COLORS);
  const [placedColors, setPlacedColors] = useState<string[]>([]);
  const { lang } = useLanguage();
  const t = TRANSLATIONS[lang];

  // Load session count
  useEffect(() => {
    const today = new Date().toDateString();
    const storedDate = localStorage.getItem('tidyMind_date');
    const storedCount = localStorage.getItem('tidyMind_count');

    if (storedDate === today && storedCount) {
      setSessionCount(parseInt(storedCount, 10));
    } else {
      localStorage.setItem('tidyMind_date', today);
      localStorage.setItem('tidyMind_count', '0');
      setSessionCount(0);
    }
  }, []);

  // Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSessionActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsSessionActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isSessionActive, timeLeft]);

  const startNewSession = () => {
    if (sessionCount >= 3) return;

    const newCount = sessionCount + 1;
    setSessionCount(newCount);
    localStorage.setItem('tidyMind_count', newCount.toString());
    
    setShuffledColors(shuffle(COLORS));
    setPlacedColors([]);
    setTimeLeft(7 * 60);
    setIsSessionActive(true);
    setHasWon(false);
  };

  const playClickSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(1200, audioCtx.currentTime); // High pitch click
      oscillator.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.05);
      
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
      
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.1);
    } catch (e) {
      console.error("Audio playback failed", e);
    }
  };

  const handleDragEnd = (e: any, info: any, color: any) => {
    const target = e.target;
    const originalVisibility = target.style.visibility;
    target.style.visibility = 'hidden';
    
    const elementBelow = document.elementFromPoint(info.point.x, info.point.y);
    
    target.style.visibility = originalVisibility;

    const dropZone = elementBelow?.closest('[data-drop-zone]');
    if (dropZone) {
      const expectedId = dropZone.getAttribute('data-expected-id');
      if (expectedId === color.id) {
        setPlacedColors(prev => [...prev, color.id]);
        playClickSound();
      }
    }
  };

  // Check win condition
  useEffect(() => {
    if (placedColors.length === COLORS.length && isSessionActive) {
      setTimeout(() => {
        setIsSessionActive(false);
        setHasWon(true);
      }, 800);
    }
  }, [placedColors, isSessionActive]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full bg-[#faf9f7] font-sans">
      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between bg-white/50 backdrop-blur-sm border-b border-slate-100/50 sticky top-0 z-20">
        <div>
          <h2 className="text-lg font-medium text-slate-800 flex items-center gap-2">
            <Sparkles size={18} className="text-amber-400" />
            Tidy Mind
          </h2>
          <p className="text-[11px] text-slate-500 uppercase tracking-wider font-medium mt-0.5">{t.subtitle}</p>
        </div>
        
        <div className="flex flex-col items-end gap-1.5">
          {isSessionActive && (
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${timeLeft <= 60 ? 'bg-red-50 text-red-500' : 'bg-slate-100 text-slate-600'}`}>
              <Clock size={14} />
              {formatTime(timeLeft)}
            </div>
          )}
          <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
            {t.session} {sessionCount}/3
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto relative">
        <AnimatePresence mode="wait">
          {!isSessionActive && !hasWon && (
            <motion.div 
              key="start"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center"
            >
              <div className="w-20 h-20 bg-white shadow-sm rounded-full flex items-center justify-center text-slate-300 mb-6 border border-slate-100">
                <Sparkles size={32} />
              </div>
              <h3 className="text-2xl font-medium text-slate-800 mb-3">{t.title}</h3>
              <p className="text-slate-500 mb-8 max-w-[260px] leading-relaxed text-sm">
                {t.description}
              </p>
              
              {sessionCount >= 3 ? (
                <div className="bg-amber-50/80 text-amber-700 px-6 py-4 rounded-2xl text-sm max-w-[280px] border border-amber-100/50">
                  {t.limitReached}
                </div>
              ) : (
                <button
                  onClick={startNewSession}
                  className="px-8 py-4 bg-slate-800 text-white rounded-full font-medium hover:bg-slate-700 transition-all active:scale-95 shadow-sm text-sm"
                >
                  {t.startBtn}
                </button>
              )}
            </motion.div>
          )}

          {!isSessionActive && hasWon && (
            <motion.div 
              key="win"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center"
            >
              <motion.div 
                initial={{ rotate: -10, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
                className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center text-green-500 mb-6"
              >
                <CheckCircle2 size={40} />
              </motion.div>
              <h3 className="text-2xl font-medium text-slate-800 mb-3">{t.perfect}</h3>
              <p className="text-slate-500 mb-8 max-w-[260px] leading-relaxed text-sm">
                {t.winDesc}
              </p>
              <button
                onClick={() => setHasWon(false)}
                className="px-8 py-4 bg-white border border-slate-200 text-slate-700 rounded-full font-medium hover:bg-slate-50 transition-all active:scale-95 text-sm shadow-sm"
              >
                {t.backBtn}
              </button>
            </motion.div>
          )}

          {isSessionActive && (
            <motion.div 
              key="game"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col p-6 pb-24"
            >
              {/* Tray (Drop Zones) */}
              <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 mb-8">
                <h4 className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-6 text-center">{t.tray}</h4>
                <div className="flex justify-between gap-2">
                  {COLORS.map(color => (
                    <div 
                      key={`slot-${color.id}`}
                      data-drop-zone 
                      data-expected-id={color.id}
                      className="w-10 h-32 rounded-full border-2 border-dashed border-slate-200 flex items-center justify-center relative bg-slate-50/50"
                    >
                      {placedColors.includes(color.id) && (
                        <motion.div 
                          layoutId={`item-${color.id}`}
                          className="absolute inset-0 rounded-full shadow-[0_0_15px_rgba(255,255,255,0.8)]"
                          style={{ backgroundColor: color.hex }}
                          initial={{ scale: 1.2, filter: 'brightness(1.5)' }}
                          animate={{ scale: 1, filter: 'brightness(1)' }}
                          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Desk (Draggable Items) */}
              <div className="flex-1 bg-white/50 rounded-[2rem] border border-slate-100 p-6 relative">
                <h4 className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-6 text-center">{t.desk}</h4>
                <div className="flex flex-wrap justify-center gap-4">
                  {shuffledColors.map(color => {
                    if (placedColors.includes(color.id)) {
                      return <div key={`empty-${color.id}`} className="w-10 h-32" />;
                    }
                    return (
                      <motion.div
                        key={`drag-${color.id}`}
                        layoutId={`item-${color.id}`}
                        drag
                        dragSnapToOrigin
                        onDragEnd={(e, info) => handleDragEnd(e, info, color)}
                        whileDrag={{ scale: 1.05, zIndex: 50, cursor: 'grabbing', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)' }}
                        className="w-10 h-32 rounded-full cursor-grab shadow-md border border-black/5 relative z-10 touch-none"
                        style={{ backgroundColor: color.hex }}
                      />
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
