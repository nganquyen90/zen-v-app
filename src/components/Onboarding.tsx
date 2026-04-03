import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wind, MessageCircleHeart, BookHeart, Sprout, UsersRound, ArrowRight, Check } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';

const TRANSLATIONS = {
  vi: {
    skip: "Bỏ qua",
    next: "Tiếp tục",
    start: "Bắt đầu trải nghiệm",
    steps: [
      {
        title: "Không gian của riêng bạn",
        desc: "Zen-V là nơi bạn có thể chậm lại, hít thở và tìm lại sự cân bằng giữa những bộn bề học tập.",
        icon: Wind,
        color: "text-softblue-500",
        bg: "bg-softblue-100"
      },
      {
        title: "Trợ lý thấu cảm & Nhật ký",
        desc: "Trò chuyện với AI không phán xét, hoặc viết ra những suy nghĩ để giải tỏa căng thẳng.",
        icon: MessageCircleHeart,
        color: "text-sage-600",
        bg: "bg-sage-100"
      },
      {
        title: "Cộng đồng & Thư giãn",
        desc: "Chơi mini-game dọn dẹp tâm trí, hoặc gửi những thông điệp ẩn danh tại Khu Vườn Đom Đóm.",
        icon: UsersRound,
        color: "text-amber-500",
        bg: "bg-amber-100"
      }
    ]
  },
  en: {
    skip: "Skip",
    next: "Next",
    start: "Get Started",
    steps: [
      {
        title: "Your Personal Space",
        desc: "Zen-V is where you can slow down, breathe, and find balance amidst your studies.",
        icon: Wind,
        color: "text-softblue-500",
        bg: "bg-softblue-100"
      },
      {
        title: "Empathetic AI & Journal",
        desc: "Chat with a non-judgmental AI, or write down your thoughts to relieve stress.",
        icon: MessageCircleHeart,
        color: "text-sage-600",
        bg: "bg-sage-100"
      },
      {
        title: "Community & Relaxation",
        desc: "Play a mind-clearing mini-game, or send anonymous messages in the Firefly Garden.",
        icon: UsersRound,
        color: "text-amber-500",
        bg: "bg-amber-100"
      }
    ]
  }
};

export default function Onboarding({ onComplete }: { onComplete: () => void }) {
  const { lang } = useLanguage();
  const t = TRANSLATIONS[lang];
  const [step, setStep] = useState(0);

  const handleNext = () => {
    if (step < t.steps.length - 1) {
      setStep(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const CurrentIcon = t.steps[step].icon;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-sage-50 font-sans w-full max-w-md mx-auto shadow-2xl pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] select-none">
      <div className="flex justify-end p-6">
        <button 
          onClick={onComplete}
          className="text-sm font-medium text-slate-400 hover:text-slate-600 transition-colors"
        >
          {t.skip}
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center"
          >
            <div className={`w-32 h-32 rounded-full flex items-center justify-center mb-8 ${t.steps[step].bg}`}>
              <CurrentIcon size={48} className={t.steps[step].color} />
            </div>
            
            <h2 className="text-2xl font-serif text-sage-800 mb-4">
              {t.steps[step].title}
            </h2>
            
            <p className="text-sage-600 leading-relaxed max-w-[280px]">
              {t.steps[step].desc}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="p-8 pb-12">
        <div className="flex justify-center gap-2 mb-8">
          {t.steps.map((_, idx) => (
            <div 
              key={idx} 
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === step ? 'w-6 bg-sage-600' : 'w-1.5 bg-sage-200'
              }`}
            />
          ))}
        </div>

        <button
          onClick={handleNext}
          className="w-full py-4 bg-sage-600 text-white rounded-2xl font-medium flex items-center justify-center gap-2 hover:bg-sage-700 transition-colors shadow-md active:scale-[0.98]"
        >
          {step === t.steps.length - 1 ? (
            <>
              {t.start}
              <Check size={18} />
            </>
          ) : (
            <>
              {t.next}
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
