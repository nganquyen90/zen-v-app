import { Wind, Headphones, Leaf, ArrowRight, Pause, Play, Sparkles, RefreshCw, Download } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../lib/LanguageContext';
import { toPng } from 'html-to-image';
import download from 'downloadjs';

const HEALING_QUOTES = [
  {
    category: "Completion",
    vi: "Mọi thứ đã vào đúng vị trí, tâm trí bạn cũng vậy.",
    en: "Everything is in its place, and so is your mind."
  },
  {
    category: "Completion",
    vi: "Một không gian ngăn nắp là khởi đầu cho một ý tưởng mới.",
    en: "A tidy space is the canvas for a new idea."
  },
  {
    category: "Completion",
    vi: "Bạn đã làm rất tốt. Hãy hít một hơi thật sâu nào.",
    en: "You've done great. Take a deep breath."
  },
  {
    category: "DailyLimit",
    vi: "Hôm nay bạn đã chăm sóc tâm trí đủ rồi. Nghỉ ngơi nhé!",
    en: "You've nurtured your mind enough today. Rest well!"
  },
  {
    category: "DailyLimit",
    vi: "Hãy tạm rời màn hình và cảm nhận thế giới thật quanh bạn.",
    en: "Step away from the screen and feel the real world."
  },
  {
    category: "Inspiration",
    vi: "Kết quả của một bài thi không định nghĩa giá trị con người bạn.",
    en: "Your exam results do not define your worth."
  },
  {
    category: "Inspiration",
    vi: "Nghỉ ngơi cũng là một cách để tiến bộ.",
    en: "Resting is also a form of progress."
  },
  {
    category: "Inspiration",
    vi: "Đừng so sánh chương 1 của mình với chương 20 của người khác.",
    en: "Don't compare your Chapter 1 to someone else's Chapter 20."
  },
  {
    category: "Inspiration",
    vi: "Hít vào thật sâu, thở ra thật chậm. Bạn đang ở đây, ngay bây giờ.",
    en: "Inhale deeply, exhale slowly. You are here, right now."
  },
  {
    category: "Inspiration",
    vi: "Bạn đã vất vả rồi, hãy dịu dàng với chính mình một chút nhé.",
    en: "You've worked hard; please be kind to yourself."
  },
  {
    category: "Inspiration",
    vi: "Cho phép bản thân được sai, đó là cách duy nhất để học hỏi.",
    en: "Allow yourself to make mistakes; it’s the only way to learn."
  },
  {
    category: "Inspiration",
    vi: "Hôm nay, hãy chỉ tập trung vào việc làm tốt nhất những gì có thể.",
    en: "Today, just focus on doing your best with what you have."
  },
  {
    category: "Inspiration",
    vi: "Bạn xứng đáng với những điều tốt đẹp nhất, dù bạn có tin hay không.",
    en: "You deserve the best, whether you believe it or not."
  },
  {
    category: "Inspiration",
    vi: "Sự ngăn nắp bên ngoài mang lại sự tĩnh lặng bên trong.",
    en: "Outer order brings inner calm."
  },
  {
    category: "Inspiration",
    vi: "Cứ thong thả, cuộc sống không phải là một cuộc đua.",
    en: "Slow down, life is not a race."
  }
];

const TRANSLATIONS = {
  vi: {
    greetingMorning: "Chào buổi sáng,",
    greetingAfternoon: "Chào buổi chiều,",
    greetingEvening: "Chào buổi tối,",
    subtitle: "Hít một hơi thật sâu. Bạn đang làm rất tốt.",
    resetTitle: "Thiết lập lại 30 giây",
    resetDesc: "Bài tập thở nhanh",
    start: "Bắt đầu",
    inhale: "Hít vào",
    hold: "Giữ",
    exhale: "Thở ra",
    inspiration: "Cảm hứng mỗi ngày",
    soundscapes: "Âm thanh thư giãn",
    audioError: "Không thể phát âm thanh. Trình duyệt của bạn có thể đang chặn hoặc file âm thanh không khả dụng.",
    sounds: {
      rain: "Mưa thư viện",
      ocean: "Sóng biển",
      stream: "Suối chảy",
      forest: "Đi dạo trong rừng"
    }
  },
  en: {
    greetingMorning: "Good morning,",
    greetingAfternoon: "Good afternoon,",
    greetingEvening: "Good evening,",
    subtitle: "Take a deep breath. You're doing great.",
    resetTitle: "30-Second Reset",
    resetDesc: "Quick breathing exercise",
    start: "Start",
    inhale: "Inhale",
    hold: "Hold",
    exhale: "Exhale",
    inspiration: "Daily Inspiration",
    soundscapes: "Ambient Soundscapes",
    audioError: "Unable to play audio. Your browser might be blocking it or the audio file is unavailable.",
    sounds: {
      rain: "Library Rain",
      ocean: "Ocean Waves",
      stream: "Gentle Stream",
      forest: "Forest Walk"
    }
  }
};

const SOUNDSCAPES = [
  { id: 'rain', icon: '🌧️', color: 'bg-slate-100', url: 'https://cdn.freesound.org/previews/709/709287_1661766-lq.mp3' },
  { id: 'ocean', icon: '🌊', color: 'bg-softblue-50', url: 'https://cdn.freesound.org/previews/197/197714_7037-lq.mp3' },
  { id: 'stream', icon: '💧', color: 'bg-gray-100', url: 'https://cdn.freesound.org/previews/744/744133_12768873-lq.mp3' },
  { id: 'forest', icon: '🌲', color: 'bg-sage-50', url: 'https://cdn.freesound.org/previews/269/269570_5126800-lq.mp3' },
];

export default function Dashboard({ onNavigate }: { onNavigate: (tab: any) => void }) {
  const { lang } = useLanguage();
  const t = TRANSLATIONS[lang];
  
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t.greetingMorning;
    if (hour < 18) return t.greetingAfternoon;
    return t.greetingEvening;
  };
  
  const [isBreathing, setIsBreathing] = useState(false);
  const [breathePhase, setBreathePhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuoteIndex(Math.floor(Math.random() * HEALING_QUOTES.length));
  }, []);

  const changeQuote = () => {
    let newIndex;
    do {
      newIndex = Math.floor(Math.random() * HEALING_QUOTES.length);
    } while (newIndex === quoteIndex && HEALING_QUOTES.length > 1);
    setQuoteIndex(newIndex);
  };

  const saveQuoteImage = async () => {
    if (!exportRef.current) return;
    try {
      setIsExporting(true);
      // Small delay to ensure React has rendered the export component if it was hidden
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const dataUrl = await toPng(exportRef.current, { 
        quality: 0.95, 
        pixelRatio: 2,
        cacheBust: true,
      });
      download(dataUrl, 'zen-v-inspiration.png');
    } catch (err) {
      console.error('Failed to save image', err);
      alert(lang === 'vi' ? 'Không thể lưu ảnh. Vui lòng thử lại.' : 'Failed to save image. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const toggleSound = (id: string, url: string) => {
    if (!audioRef.current) return;

    if (playingId === id) {
      audioRef.current.pause();
      setPlayingId(null);
    } else {
      audioRef.current.src = url;
      audioRef.current.play().catch(e => {
        console.error("Audio play failed", e);
        setPlayingId(null);
        alert(t.audioError);
      });
      setPlayingId(id);
    }
  };

  const startBreathing = () => {
    setIsBreathing(true);
    // Simple 4-4-4 breathing cycle simulation
    let cycle = 0;
    const interval = setInterval(() => {
      cycle++;
      if (cycle % 3 === 1) setBreathePhase('hold');
      else if (cycle % 3 === 2) setBreathePhase('exhale');
      else setBreathePhase('inhale');

      if (cycle >= 6) { // 2 full cycles for a quick 30s reset
        clearInterval(interval);
        setIsBreathing(false);
      }
    }, 4000);
  };

  return (
    <div className="p-6 space-y-8 pb-20">
      {/* Hidden Audio Element for better mobile browser support */}
      <audio ref={audioRef} loop preload="none" />

      {/* Welcome Section */}
      <section>
        <h2 className="text-3xl font-serif text-sage-800 mb-1">{getGreeting()}</h2>
        <p className="text-sage-600">{t.subtitle}</p>
      </section>

      {/* 30-Second Reset */}
      <section className="bg-white rounded-3xl p-6 shadow-sm border border-sage-100 relative overflow-hidden">
        <div className="relative z-10 flex justify-between items-center">
          <div>
            <h3 className="font-semibold text-sage-800 flex items-center gap-2">
              <Wind size={18} className="text-softblue-500" />
              {t.resetTitle}
            </h3>
            <p className="text-sm text-slate-500 mt-1">{t.resetDesc}</p>
          </div>
          {!isBreathing ? (
            <button 
              onClick={startBreathing}
              className="bg-softblue-100 text-softblue-700 px-4 py-2 rounded-full text-sm font-medium hover:bg-softblue-200 transition-colors"
            >
              {t.start}
            </button>
          ) : (
            <span className="text-softblue-600 font-medium capitalize animate-pulse">
              {t[breathePhase]}...
            </span>
          )}
        </div>

        {/* Breathing Animation Background */}
        <AnimatePresence>
          {isBreathing && (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ 
                scale: breathePhase === 'inhale' ? 1.5 : breathePhase === 'exhale' ? 0.8 : 1.5,
                opacity: 0.1 
              }}
              transition={{ duration: 4, ease: "easeInOut" }}
              className="absolute inset-0 bg-softblue-400 rounded-full blur-3xl z-0"
              style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '200px', height: '200px' }}
            />
          )}
        </AnimatePresence>
      </section>

      {/* Daily Inspiration */}
      <section className="bg-sage-100/50 rounded-3xl p-6 border border-sage-200/50 relative group">
        <div className="flex items-start gap-4">
          <div className="bg-sage-200 p-3 rounded-2xl text-sage-700 shrink-0">
            <Sparkles size={24} />
          </div>
          <div className="flex-1 min-h-[4rem] flex flex-col justify-center">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold text-sage-800 text-sm uppercase tracking-wider">{t.inspiration}</h3>
              <div className="flex gap-2">
                <button 
                  onClick={changeQuote}
                  className="p-1.5 text-sage-500 hover:text-sage-800 hover:bg-sage-200 rounded-full transition-colors"
                  aria-label="Change quote"
                >
                  <RefreshCw size={16} />
                </button>
                <button 
                  onClick={saveQuoteImage}
                  disabled={isExporting}
                  className="p-1.5 text-sage-500 hover:text-sage-800 hover:bg-sage-200 rounded-full transition-colors disabled:opacity-50"
                  aria-label="Save quote to gallery"
                >
                  <Download size={16} />
                </button>
              </div>
            </div>
            <AnimatePresence mode="wait">
              <motion.p
                key={quoteIndex}
                initial={{ opacity: 0, filter: 'blur(4px)' }}
                animate={{ opacity: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, filter: 'blur(4px)' }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="text-sage-700 font-medium leading-relaxed"
              >
                {HEALING_QUOTES[quoteIndex][lang as 'vi' | 'en']}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Ambient Soundscapes */}
      <section>
        <h3 className="font-semibold text-sage-800 mb-4 flex items-center gap-2">
          <Headphones size={18} />
          {t.soundscapes}
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {SOUNDSCAPES.map((sound) => {
            const isPlaying = playingId === sound.id;
            return (
              <button 
                key={sound.id}
                onClick={() => toggleSound(sound.id, sound.url)}
                className={`relative p-4 rounded-2xl ${sound.color} border flex flex-col items-center justify-center gap-2 transition-all duration-300 ${
                  isPlaying ? 'border-sage-400 shadow-md scale-[1.02]' : 'border-black/5 hover:scale-[1.02]'
                }`}
              >
                <div className="absolute top-3 right-3 text-slate-400">
                  {isPlaying ? <Pause size={16} className="text-sage-600" /> : <Play size={16} />}
                </div>
                <span className="text-3xl">{sound.icon}</span>
                <span className={`text-xs font-medium ${isPlaying ? 'text-sage-700' : 'text-slate-600'}`}>
                  {t.sounds[sound.id as keyof typeof t.sounds]}
                </span>
                {isPlaying && (
                  <div className="absolute bottom-3 flex gap-1 items-end h-3">
                    <motion.div animate={{ height: ['4px', '12px', '4px'] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-1 bg-sage-400 rounded-full" />
                    <motion.div animate={{ height: ['8px', '4px', '8px'] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-1 bg-sage-400 rounded-full" />
                    <motion.div animate={{ height: ['4px', '10px', '4px'] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-1 bg-sage-400 rounded-full" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* Hidden Export Component for Instagram/Story format (1080x1920) */}
      <div className="fixed left-[200vw] top-0 pointer-events-none">
        <div 
          ref={exportRef}
          className="w-[1080px] h-[1920px] flex flex-col items-center justify-center p-24 text-center relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #f4f5f0 0%, #e3e6dc 100%)'
          }}
        >
          {/* Decorative background elements */}
          <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-white/40 blur-3xl"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[800px] h-[800px] rounded-full bg-sage-200/50 blur-3xl"></div>
          
          <div className="absolute top-24 left-24 flex items-center gap-4 z-10">
            <div className="bg-sage-800 p-4 rounded-2xl">
              <Leaf className="text-white w-12 h-12" />
            </div>
            <span className="text-5xl font-serif text-sage-800 font-bold tracking-tight">Zen-V</span>
          </div>
          
          <div className="relative z-10 flex flex-col items-center max-w-[800px]">
            <Sparkles className="text-sage-400 w-32 h-32 mb-16 opacity-60" />
            <p className="text-7xl font-serif text-sage-800 leading-[1.4] mb-16">
              "{HEALING_QUOTES[quoteIndex][lang as 'vi' | 'en']}"
            </p>
            <div className="w-24 h-1 bg-sage-300 rounded-full mb-16"></div>
            <p className="text-4xl text-sage-600 font-medium tracking-wide">
              {lang === 'vi' ? 'Làm chủ tâm trí. Khơi nhịp tự do' : 'Your mind, Your rhythm.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
