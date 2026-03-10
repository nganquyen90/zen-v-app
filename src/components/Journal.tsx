import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../lib/LanguageContext';
import { GoogleGenAI } from '@google/genai';
import { Loader2, Download, History, Edit3, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import html2canvas from 'html2canvas';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const TRANSLATIONS = {
  vi: {
    title: "Bạn đang cảm thấy thế nào?",
    affecting: "Điều gì đang ảnh hưởng đến tâm trạng của bạn?",
    notePlaceholder: "Hãy viết ra những suy nghĩ của bạn...",
    save: "Lưu nhật ký",
    saving: "Đang phân tích...",
    history: "Lịch sử",
    newEntry: "Viết nhật ký",
    download: "Tải về",
    emptyHistory: "Chưa có bản ghi nào. Hãy viết nhật ký đầu tiên của bạn nhé!",
    moods: {
      overwhelmed: "Quá tải",
      stressed: "Căng thẳng",
      okay: "Bình thường",
      good: "Tốt",
      great: "Tuyệt vời"
    },
    tags: ['Học tập', 'Gia đình', 'Bạn bè', 'Thiếu ngủ', 'Tập thể dục', 'Tình cảm', 'Áp lực', 'Sức khỏe']
  },
  en: {
    title: "How are you feeling?",
    affecting: "What's affecting your mood?",
    notePlaceholder: "Write down your thoughts...",
    save: "Save Entry",
    saving: "Analyzing...",
    history: "History",
    newEntry: "New Entry",
    download: "Download",
    emptyHistory: "No entries yet. Write your first journal entry!",
    moods: {
      overwhelmed: "Overwhelmed",
      stressed: "Stressed",
      okay: "Okay",
      good: "Good",
      great: "Great"
    },
    tags: ['Study', 'Family', 'Friends', 'Sleep Deprived', 'Exercise', 'Relationships', 'Pressure', 'Health']
  }
};

const MOODS = [
  { icon: '😭', id: 'overwhelmed', value: 1, color: 'bg-red-100 border-red-200 text-red-700' },
  { icon: '😔', id: 'stressed', value: 2, color: 'bg-orange-100 border-orange-200 text-orange-700' },
  { icon: '😐', id: 'okay', value: 3, color: 'bg-yellow-100 border-yellow-200 text-yellow-700' },
  { icon: '🙂', id: 'good', value: 4, color: 'bg-sage-100 border-sage-200 text-sage-700' },
  { icon: '✨', id: 'great', value: 5, color: 'bg-softblue-100 border-softblue-200 text-softblue-700' },
];

interface JournalEntry {
  id: string;
  date: string;
  mood: number;
  tags: string[];
  note: string;
  reflection: string;
}

export default function Journal() {
  const { lang } = useLanguage();
  const t = TRANSLATIONS[lang];

  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [entries, setEntries] = useState<JournalEntry[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('zenv_journal_entries');
    if (saved) {
      try {
        setEntries(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse journal entries", e);
      }
    }
  }, []);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSave = async () => {
    if (!selectedMood || !note.trim() || isSaving) return;

    setIsSaving(true);
    try {
      const prompt = `
        Bạn là một chuyên gia tâm lý học đường thấu cảm tích hợp trong ứng dụng Zen-V. Nhiệm vụ của bạn là lắng nghe, phân tích và phản hồi các bản ghi nhật ký của học sinh, sinh viên.
        
        INPUT DATA:
        {
          "mood": "${selectedMood}",
          "tags": ${JSON.stringify(selectedTags)},
          "note": "${note}",
          "language": "${lang}"
        }
        
        PHẢN HỒI (AI REFLECTION) RULES:
        1. Ngôn ngữ: Luôn phản hồi bằng ngôn ngữ người dùng đã chọn (${lang}).
        2. Độ dài: Tối đa 2-3 câu ngắn gọn. Tránh dài dòng gây mệt mỏi.
        3. Cấu trúc phản hồi:
           - Câu 1: Công nhận cảm xúc (Validation).
           - Câu 2: Đưa ra một góc nhìn tích cực hoặc một gợi ý nhỏ (Reframing/Small Action).
        4. Tone of Voice: Nhẹ nhàng, không phán xét, không dùng từ ngữ quá chuyên môn y khoa. Sử dụng các đại từ thân thiện (Mình - Bạn / I - You).
        
        BIỆN PHÁP AN TOÀN (SAFETY):
        Nếu nội dung ghi chú có dấu hiệu tự hại hoặc trầm cảm nặng, hãy ưu tiên phản hồi: "Mình luôn ở đây lắng nghe, nhưng bạn hãy cân nhắc chia sẻ thêm với người thân hoặc chuyên gia tư vấn để được hỗ trợ tốt nhất nhé. Bạn không cô đơn đâu." (hoặc tiếng Anh tương đương).
        
        OUTPUT FORMAT:
        Trả về một đoạn text thuần túy (Plain text). Không dùng markdown.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      const reflection = response.text || (lang === 'vi' ? 'Mình luôn ở đây lắng nghe bạn.' : 'I am always here to listen to you.');

      const newEntry: JournalEntry = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        mood: selectedMood,
        tags: selectedTags,
        note: note.trim(),
        reflection: reflection.trim()
      };

      const updatedEntries = [newEntry, ...entries];
      setEntries(updatedEntries);
      localStorage.setItem('zenv_journal_entries', JSON.stringify(updatedEntries));
      
      // Reset form
      setSelectedMood(null);
      setSelectedTags([]);
      setNote('');
      setActiveTab('history');

    } catch (error) {
      console.error("Error generating reflection:", error);
      alert(lang === 'vi' ? 'Đã có lỗi xảy ra. Vui lòng thử lại.' : 'An error occurred. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = async (id: string) => {
    const element = document.getElementById(`journal-card-${id}`);
    if (!element) return;
    
    try {
      // Hide download button temporarily
      const btn = element.querySelector('.download-btn') as HTMLElement;
      if (btn) btn.style.display = 'none';
      
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#f8fafc', // slate-50
        logging: false,
        useCORS: true
      });
      
      if (btn) btn.style.display = 'flex';
      
      const image = canvas.toDataURL("image/png");
      const link = document.createElement('a');
      link.href = image;
      link.download = `zen-v-journal-${id}.png`;
      link.click();
    } catch (err) {
      console.error("Failed to download image", err);
    }
  };

  return (
    <div className="flex flex-col h-full bg-sage-50">
      {/* Header Tabs */}
      <div className="flex p-4 gap-2 bg-white/50 backdrop-blur-md sticky top-0 z-10 border-b border-sage-100">
        <button
          onClick={() => setActiveTab('new')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'new' 
              ? 'bg-sage-600 text-white shadow-sm' 
              : 'bg-white text-sage-600 border border-sage-200 hover:bg-sage-50'
          }`}
        >
          <Edit3 size={16} />
          {t.newEntry}
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'history' 
              ? 'bg-sage-600 text-white shadow-sm' 
              : 'bg-white text-sage-600 border border-sage-200 hover:bg-sage-50'
          }`}
        >
          <History size={16} />
          {t.history}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 pb-24">
        <AnimatePresence mode="wait">
          {activeTab === 'new' ? (
            <motion.div
              key="new"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              <section>
                <h2 className="text-xl font-serif text-sage-800 mb-4">{t.title}</h2>
                <div className="flex justify-between gap-2">
                  {MOODS.map((mood) => (
                    <button
                      key={mood.value}
                      onClick={() => setSelectedMood(mood.value)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all ${
                        selectedMood === mood.value 
                          ? `${mood.color} scale-110 shadow-sm` 
                          : 'bg-white border-slate-200 grayscale-[0.5] opacity-70 hover:grayscale-0 hover:opacity-100'
                      }`}
                    >
                      <span className="text-2xl">{mood.icon}</span>
                      <span className="text-[10px] font-medium text-slate-600">
                        {t.moods[mood.id as keyof typeof t.moods]}
                      </span>
                    </button>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="text-sm font-semibold text-sage-800 mb-3 uppercase tracking-wider">{t.affecting}</h3>
                <div className="flex flex-wrap gap-2">
                  {t.tags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-4 py-2 rounded-full text-xs font-medium transition-colors border ${
                        selectedTags.includes(tag)
                          ? 'bg-sage-600 text-white border-sage-600'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-sage-300'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </section>

              <section>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t.notePlaceholder}
                  className="w-full h-40 p-4 rounded-2xl border border-sage-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-sage-400 focus:border-transparent resize-none"
                />
              </section>

              <button
                onClick={handleSave}
                disabled={!selectedMood || !note.trim() || isSaving}
                className="w-full py-4 rounded-2xl bg-sage-600 text-white font-medium flex items-center justify-center gap-2 hover:bg-sage-700 transition-colors disabled:opacity-50 disabled:hover:bg-sage-600"
              >
                {isSaving ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    {t.saving}
                  </>
                ) : (
                  t.save
                )}
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {entries.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <p>{t.emptyHistory}</p>
                </div>
              ) : (
                entries.map(entry => {
                  const moodObj = MOODS.find(m => m.value === entry.mood) || MOODS[2];
                  const date = new Date(entry.date);
                  const formattedDate = new Intl.DateTimeFormat(lang === 'vi' ? 'vi-VN' : 'en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }).format(date);

                  return (
                    <div 
                      key={entry.id} 
                      id={`journal-card-${entry.id}`}
                      className="bg-white rounded-3xl p-6 shadow-sm border border-sage-100 relative overflow-hidden"
                    >
                      {/* Decorative background */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-sage-50 rounded-bl-full -z-0 opacity-50"></div>
                      
                      <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <p className="text-xs text-slate-400 font-medium mb-1 uppercase tracking-wider">{formattedDate}</p>
                            <div className="flex items-center gap-2">
                              <span className="text-3xl">{moodObj.icon}</span>
                              <span className={`text-sm font-semibold ${moodObj.color.split(' ')[2]}`}>
                                {t.moods[moodObj.id as keyof typeof t.moods]}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDownload(entry.id)}
                            className="download-btn p-2 text-slate-400 hover:text-sage-600 hover:bg-sage-50 rounded-full transition-colors"
                            title={t.download}
                          >
                            <Download size={18} />
                          </button>
                        </div>

                        {entry.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-4">
                            {entry.tags.map(tag => (
                              <span key={tag} className="px-2.5 py-1 bg-slate-50 text-slate-600 rounded-md text-[10px] font-medium border border-slate-100">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 mb-4">
                          <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
                            {entry.note}
                          </p>
                        </div>

                        <div className="bg-sage-50 p-4 rounded-2xl border border-sage-100 flex gap-3">
                          <div className="shrink-0 mt-0.5">
                            <Sparkles size={16} className="text-sage-500" />
                          </div>
                          <p className="text-sage-800 text-sm leading-relaxed font-medium">
                            {entry.reflection}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

