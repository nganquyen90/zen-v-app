import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Mic } from 'lucide-react';
import { motion } from 'motion/react';
import { GoogleGenAI } from '@google/genai';
import { useLanguage } from '../lib/LanguageContext';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const TRANSLATIONS = {
  vi: {
    greeting: "Chào bạn. Mình ở đây để lắng nghe. Hiện tại bạn cảm thấy thế nào?",
    error: "Mình đang gặp chút khó khăn khi kết nối, nhưng hãy nhớ mình vẫn ở đây. Hãy hít một hơi thật sâu nhé.",
    placeholder: "Chia sẻ suy nghĩ của bạn...",
    systemPrompt: `Bạn là Zen-V, một trợ lý AI đồng cảm, nhẹ nhàng dành cho học sinh/sinh viên.
    Hãy trả lời ngắn gọn (1-3 câu), mang tính hỗ trợ và không phán xét.
    Nếu người dùng có vẻ căng thẳng, hãy đề xuất một bài tập thở nhanh hoặc nghỉ ngơi ngắn.
    Không sử dụng định dạng markdown như in đậm hoặc danh sách, hãy giữ cho cuộc trò chuyện tự nhiên.
    Ngôn ngữ trả lời: Tiếng Việt.`
  },
  en: {
    greeting: "Hi there. I'm here to listen. How are you feeling right now?",
    error: "I'm having a little trouble connecting right now, but please know I'm still here for you. Take a deep breath.",
    placeholder: "Share what's on your mind...",
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

export default function Companion() {
  const { lang } = useLanguage();
  const t = TRANSLATIONS[lang];

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'model',
      text: t.greeting,
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Build chat history for context
      const history = messages.map(m => `${m.role === 'user' ? 'User' : 'AI'}: ${m.text}`).join('\n');
      const prompt = `
        ${t.systemPrompt}
        
        Conversation history:
        ${history}
        User: ${input}
        AI:
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
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

  return (
    <div className="flex flex-col h-full bg-sage-50">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
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

      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-sage-50 via-sage-50 to-transparent pb-24">
        <div className="flex items-center gap-2 bg-white p-2 rounded-full shadow-sm border border-sage-200">
          <button className="p-2 text-sage-400 hover:text-sage-600 transition-colors">
            <Mic size={20} />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={t.placeholder}
            className="flex-1 bg-transparent outline-none text-sm text-slate-700 placeholder:text-slate-400"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="p-2 bg-sage-500 text-white rounded-full hover:bg-sage-600 disabled:opacity-50 disabled:hover:bg-sage-500 transition-colors"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
