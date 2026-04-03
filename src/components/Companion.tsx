import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User } from 'lucide-react';
import { motion } from 'motion/react';
import { GoogleGenAI } from '@google/genai';
import { useLanguage } from '../lib/LanguageContext';
import { auth } from '../firebase';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const TRANSLATIONS = {
  vi: {
    greeting: "Chào bạn. Mình ở đây để lắng nghe. Hiện tại bạn cảm thấy thế nào?",
    error: "Mình đang gặp chút khó khăn khi kết nối, nhưng hãy nhớ mình vẫn ở đây. Hãy hít một hơi thật sâu nhé.",
    limitReached: "Bạn đã hết 20 lượt trò chuyện hôm nay. Hãy nghỉ ngơi và quay lại vào ngày mai nhé, mình luôn ở đây đợi bạn.",
    placeholder: "Chia sẻ suy nghĩ của bạn...",
    placeholderDisabled: "Đã hết lượt chat hôm nay...",
    systemPrompt: `Bạn là Zen-V, một trợ lý AI đồng cảm, nhẹ nhàng dành cho học sinh/sinh viên.
    Hãy trả lời ngắn gọn (1-3 câu), mang tính hỗ trợ và không phán xét.
    Nếu người dùng có vẻ căng thẳng, hãy đề xuất một bài tập thở nhanh hoặc nghỉ ngơi ngắn.
    Không sử dụng định dạng markdown như in đậm hoặc danh sách, hãy giữ cho cuộc trò chuyện tự nhiên.
    Ngôn ngữ trả lời: Tiếng Việt.`
  },
  en: {
    greeting: "Hi there. I'm here to listen. How are you feeling right now?",
    error: "I'm having a little trouble connecting right now, but please know I'm still here for you. Take a deep breath.",
    limitReached: "You've reached your 20 messages limit for today. Please rest and come back tomorrow, I'll be here waiting for you.",
    placeholder: "Share what's on your mind...",
    placeholderDisabled: "Daily limit reached...",
    systemPrompt: `You are Zen-V, an empathetic, gentle AI companion for students.
    Keep responses short (1-3 sentences), supportive, and non-judgmental.
    If the user seems stressed, suggest a quick breathing exercise or a short break.
    Do not use markdown formatting like bolding or lists, keep it conversational.
    Language: English.`
  }
};

type Message = {
  id: string;
  role: 'user' | 'model';
  text: string;
};

const DAILY_LIMIT = 20;

export default function Companion() {
  const { lang } = useLanguage();
  const t = TRANSLATIONS[lang as 'vi' | 'en'];

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'model',
      text: t.greeting,
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [usageCount, setUsageCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickReplies = {
    vi: ["Mình đang stress", "Kể mình nghe một chuyện vui", "Làm sao để tập trung?"],
    en: ["I'm stressed", "Tell me a happy story", "How to focus?"]
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const fetchUsage = () => {
      const userId = auth.currentUser?.uid || 'anonymous';
      const today = new Date().toISOString().split('T')[0];
      const storageKey = `zenv_chat_usage_${userId}`;
      const usage = JSON.parse(localStorage.getItem(storageKey) || '{}');
      if (usage.date === today) {
        setUsageCount(usage.count || 0);
      } else {
        setUsageCount(0);
      }
    };
    fetchUsage();
  }, []);

  const incrementUsage = () => {
    const userId = auth.currentUser?.uid || 'anonymous';
    const today = new Date().toISOString().split('T')[0];
    const storageKey = `zenv_chat_usage_${userId}`;
    const newCount = usageCount + 1;
    localStorage.setItem(storageKey, JSON.stringify({ date: today, count: newCount }));
    setUsageCount(newCount);
  };

  const handleSend = async (textToSend?: string) => {
    const messageText = textToSend || input;
    if (!messageText.trim() || isLoading) return;

    if (usageCount >= DAILY_LIMIT) {
      setMessages((prev) => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: t.limitReached
      }]);
      return;
    }

    const userMessage: Message = { id: Date.now().toString(), role: 'user', text: messageText };
    setMessages((prev) => [...prev, userMessage]);
    if (!textToSend) setInput('');
    setIsLoading(true);
    incrementUsage();

    try {
      // Build chat history for context
      const history = messages.map(m => `${m.role === 'user' ? 'User' : 'AI'}: ${m.text}`).join('\n');
      const prompt = `
        ${t.systemPrompt}
        
        Conversation history:
        ${history}
        User: ${messageText}
        AI:
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-preview',
        contents: prompt,
      });

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: response.text || "I'm here for you.",
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Failed to generate response:", error);
      setMessages((prev) => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: t.error
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const isLimitReached = usageCount >= DAILY_LIMIT;

  return (
    <div className="flex flex-col h-full bg-sage-50">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex max-w-[80%] gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                msg.role === 'user' ? 'bg-softblue-200 text-softblue-700' : 'bg-sage-200 text-sage-700'
              }`}>
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className={`p-3 rounded-2xl text-sm ${
                msg.role === 'user' 
                  ? 'bg-softblue-500 text-white rounded-tr-sm' 
                  : 'bg-white text-slate-700 shadow-sm border border-sage-100 rounded-tl-sm'
              }`}>
                {msg.text}
              </div>
            </div>
          </motion.div>
        ))}
        {isLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="flex gap-2">
              <div className="w-8 h-8 rounded-full bg-sage-200 text-sage-700 flex items-center justify-center shrink-0">
                <Bot size={16} />
              </div>
              <div className="p-4 rounded-2xl bg-white shadow-sm border border-sage-100 rounded-tl-sm flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-sage-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 bg-sage-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 bg-sage-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-sage-50 shrink-0 border-t border-sage-100/50">
        {/* Quick Replies */}
        {messages.length < 3 && !isLoading && !isLimitReached && (
          <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide snap-x">
            {quickReplies[lang as 'vi' | 'en'].map((reply, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(reply)}
                className="whitespace-nowrap px-4 py-2 bg-white border border-sage-200 text-sage-600 rounded-full text-xs font-medium hover:bg-sage-50 hover:border-sage-300 transition-colors shadow-sm snap-start"
              >
                {reply}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 bg-white p-2 rounded-full shadow-sm border border-sage-200">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={isLimitReached ? t.placeholderDisabled : t.placeholder}
            disabled={isLimitReached || isLoading}
            className="flex-1 bg-transparent outline-none text-sm text-slate-700 placeholder:text-slate-400 px-4 disabled:opacity-50"
          />
          <button 
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading || isLimitReached}
            className="p-3 bg-sage-500 text-white rounded-full hover:bg-sage-600 disabled:opacity-50 disabled:hover:bg-sage-500 transition-colors"
          >
            <Send size={18} />
          </button>
        </div>
        <div className="text-center mt-2 text-[10px] text-sage-400">
          {usageCount}/{DAILY_LIMIT} {lang === 'vi' ? 'tin nhắn hôm nay' : 'messages today'}
        </div>
      </div>
    </div>
  );
}
