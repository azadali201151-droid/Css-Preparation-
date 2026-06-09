import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, User, Brain, ExternalLink, Sparkles, AlertCircle, LogIn, Loader2 } from 'lucide-react';
import { cssMentorChat } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'model';
  content: string;
}

export default function AIAssistant({ user, login }: { user: any, login: () => void }) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', content: "Hello Aspirant. I am your CSS AI Mentor. How can I assist with your preparation today? I can help with syllabus breakdown, paper-solving techniques, or resources for any of the 34 compulsory and optional subjects." }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || loading) return;

    if (!user) {
      login();
      return;
    }

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const response = await cssMentorChat(messages.slice(-10), userMsg);
      setMessages(prev => [...prev, { role: 'model', content: response }]);
    } catch (error: any) {
      console.error('Chat error', error);
      let errorMsg = "I encountered an issue connecting to my knowledge base. Please try asking again in a moment.";
      if (error.message?.includes("AI_LIMIT")) {
        errorMsg = error.message.replace("AI_LIMIT: ", "");
      } else if (error.message?.includes("QUOTA_EXCEEDED")) {
        errorMsg = error.message.replace("QUOTA_EXCEEDED: ", "");
      }
      setMessages(prev => [...prev, { role: 'model', content: errorMsg }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-white max-w-4xl mx-auto border-x border-[#141414]/5 shadow-2xl relative">
      <header className="p-6 border-b border-[#141414]/5 bg-white z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#141414] text-white rounded-2xl flex items-center justify-center shadow-lg">
            <Brain size={20} />
          </div>
          <div>
            <h2 className="font-serif italic font-bold">AI Mentor Bot</h2>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <p className="text-[10px] uppercase font-bold tracking-widest opacity-40">Trained on FPSC Modules</p>
            </div>
          </div>
        </div>
        {!user && (
          <button onClick={login} className="text-xs font-bold px-3 py-1 bg-orange-50 text-orange-600 rounded-lg flex items-center gap-1 hover:bg-orange-100 transition-colors">
            <LogIn size={14} /> Login to Save Chat
          </button>
        )}
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
        {messages.map((msg, idx) => (
          <motion.div
            key={`chat-msg-${idx}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`
              max-w-[85%] p-4 rounded-2xl shadow-sm
              ${msg.role === 'user' ? 'bg-[#141414] text-white rounded-tr-none' : 'bg-gray-50 border border-[#141414]/5 rounded-tl-none text-[#141414]'}
            `}>
              <div className="markdown-body prose prose-sm max-w-none prose-headings:font-serif prose-p:leading-relaxed">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
              <div className={`mt-2 text-[10px] uppercase font-bold tracking-widest opacity-30 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                {msg.role === 'user' ? 'Candidate' : 'AI Mentor'}
              </div>
            </div>
          </motion.div>
        ))}
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="bg-gray-50 p-4 rounded-2xl shadow-sm rounded-tl-none">
              <div className="flex gap-1">
                <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="w-2 h-2 bg-[#141414] rounded-full" />
                <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-2 h-2 bg-[#141414] rounded-full" />
                <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-2 h-2 bg-[#141414] rounded-full" />
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <div className="p-6 bg-white border-t border-[#141414]/5">
        <form onSubmit={handleSend} className="relative group">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={user ? "Ask about syllabus, paper tips, or resources..." : "Please login to chat with Mentor"}
            disabled={!user || loading}
            className={`
              w-full pl-6 pr-14 py-5 rounded-2xl outline-none border transition-all duration-300
              ${user ? 'bg-gray-50 border-[#141414]/5 focus:bg-white focus:border-[#141414]/20 focus:shadow-xl' : 'bg-gray-100 border-gray-200 cursor-not-allowed opacity-50'}
            `}
          />
          <button
            type="submit"
            disabled={!user || !input.trim() || loading}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-[#141414] text-white rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-30"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
          </button>
        </form>
        <p className="text-[10px] text-center mt-4 opacity-30 italic">
          Tip: Try asking "Break down the IR Paper 1 Syllabus" or "How to write a perfect Precis?"
        </p>
      </div>
    </div>
  );
}
