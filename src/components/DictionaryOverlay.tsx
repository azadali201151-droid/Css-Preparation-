import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Languages, X, Search, History, Loader2, Volume2, ArrowRight } from 'lucide-react';
import { dictionarySearch } from '../services/geminiService';

interface DictionaryResult {
  word: string;
  urduMeanings: string[];
  pronunciation: string;
  explanationUrdu: string;
  examples: { english: string; urdu: string; }[];
}

export default function DictionaryOverlay() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DictionaryResult | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('dictionary_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setHistory(parsed);
      }
    } catch (e) {
      console.error("Failed to load history", e);
    }
  }, []);

  const handleSearch = async (wordToSearch?: string) => {
    const word = wordToSearch || query;
    if (!word.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const data = await dictionarySearch(word);
      setResult(data);
      
      const newHistory = [word, ...history.filter(h => h !== word)].slice(0, 10);
      setHistory(newHistory);
      localStorage.setItem('dictionary_history', JSON.stringify(newHistory));
      setQuery('');
    } catch (err) {
      setError('Could not find translation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button 
        onClick={() => { setIsOpen(true); setTimeout(() => inputRef.current?.focus(), 100); }}
        className="fixed bottom-6 right-6 z-[60] w-14 h-14 bg-[#141414] text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all group"
        title="AI Dictionary"
      >
        <Languages size={24} className="group-hover:rotate-12 transition-transform" />
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-[#F5F5F0] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              <header className="p-6 bg-white border-b border-[#141414]/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <Languages size={20} />
                  </div>
                  <h3 className="font-serif italic font-bold text-xl">AI CSS Dictionary</h3>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </header>

              <div className="p-6">
                <div className="relative group">
                  <input 
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Type English word or phrase..."
                    className="w-full h-14 px-12 bg-white border border-[#141414]/10 rounded-2xl outline-none focus:border-blue-500 transition-all font-medium"
                  />
                  <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30 group-focus-within:opacity-100 group-focus-within:text-blue-500 transition-all" />
                  {loading ? (
                    <Loader2 size={20} className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-blue-500" />
                  ) : (
                    <button 
                      onClick={() => handleSearch()}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-[#141414] text-white rounded-xl hover:scale-105 active:scale-95 transition-all"
                    >
                      <ArrowRight size={18} />
                    </button>
                  )}
                </div>

                {error && (
                  <p className="mt-3 text-xs text-red-500 font-medium px-2">{error}</p>
                )}

                <AnimatePresence mode="wait">
                  {result && !loading ? (
                    <motion.div 
                      key="result"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-8 space-y-6 overflow-y-auto max-h-[50vh] pr-2 custom-scrollbar"
                    >
                      <div className="flex items-end justify-between border-b pb-4 border-[#141414]/5">
                        <div>
                          <h4 className="text-3xl font-serif italic font-bold text-[#141414]">{result.word}</h4>
                          <div className="flex items-center gap-2 mt-2 opacity-50">
                            <Volume2 size={14} />
                            <span className="text-xs font-medium tracking-wide">/{result.pronunciation}/</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex flex-wrap gap-2 justify-end">
                            {result.urduMeanings.map((m, i) => (
                              <span key={i} className="text-2xl font-urdu leading-relaxed bg-blue-50 text-blue-800 px-3 py-1 rounded-lg" dir="rtl">
                                {m}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="bg-white/50 p-5 rounded-2xl border border-[#141414]/5" dir="rtl">
                        <p className="text-sm font-urdu leading-loose text-[#141414] text-right">
                          {result.explanationUrdu}
                        </p>
                      </div>

                      <div className="space-y-4">
                        <h5 className="text-[10px] font-black uppercase tracking-widest opacity-30">Examples</h5>
                        {result.examples.map((ex, i) => (
                          <div key={i} className="space-y-2 border-l-2 border-blue-500/20 pl-4 py-1">
                            <p className="text-sm font-medium italic">"{ex.english}"</p>
                            <p className="text-sm font-urdu text-right opacity-70" dir="rtl">"{ex.urdu}"</p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="history"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mt-8"
                    >
                      <div className="flex items-center gap-2 mb-4 opacity-30 px-2">
                        <History size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Recent Searches</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {history.length > 0 ? history.map((h, i) => (
                          <button 
                            key={i}
                            onClick={() => handleSearch(h)}
                            className="px-4 py-2 bg-white border border-[#141414]/5 rounded-xl text-sm hover:border-blue-500 hover:text-blue-600 transition-all font-medium"
                          >
                            {h}
                          </button>
                        )) : (
                          <p className="text-xs italic opacity-40 px-2">No history yet. Start searching to save words.</p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="mt-auto p-4 flex justify-center border-t border-[#141414]/5">
                <p className="text-[9px] font-black uppercase tracking-widest opacity-20">AI-Powered CSS Dictionary</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
