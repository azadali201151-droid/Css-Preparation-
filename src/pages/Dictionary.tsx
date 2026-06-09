import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Languages, Volume2, BookOpen, Quote, Sparkles, Loader2, History, Trash2, ChevronRight } from 'lucide-react';
import { dictionarySearch } from '../services/geminiService';
import { collection, query, where, orderBy, limit, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc, getDocs, writeBatch } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

export default function Dictionary() {
  const [word, setWord] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    // Clear search results when entering the page to show history first
    setResult(null);
    setWord('');

    if (!auth.currentUser) return;

    const q = query(
      collection(db, `users/${auth.currentUser.uid}/dictionaryHistory`),
      orderBy('timestamp', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const historyData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setHistory(historyData);
    });

    return () => unsubscribe();
  }, []);

  const handleSearch = async (e?: React.FormEvent, customWord?: string, cachedResult?: any) => {
    if (e) e.preventDefault();
    const searchWord = customWord || word;
    if (!searchWord.trim()) return;
    
    if (cachedResult) {
      setWord(searchWord);
      setResult(cachedResult);
      return;
    }

    setLoading(true);
    try {
      const data = await dictionarySearch(searchWord);
      setResult(data);
      
      // Save to history if user is logged in
      if (auth.currentUser) {
        // Check if word already exists in recent history
        const existing = history.find(h => h.word.toLowerCase() === searchWord.toLowerCase());
        if (!existing) {
          await addDoc(collection(db, `users/${auth.currentUser.uid}/dictionaryHistory`), {
            userId: auth.currentUser.uid,
            word: searchWord,
            result: data, // Save full result
            timestamp: serverTimestamp()
          });
        }
      }
    } catch (error) {
      console.error('Translation error', error);
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = async () => {
    if (!auth.currentUser) return;
    try {
      const q = query(collection(db, `users/${auth.currentUser.uid}/dictionaryHistory`));
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      snapshot.docs.forEach((d) => {
        batch.delete(d.ref);
      });
      await batch.commit();
      setResult(null);
    } catch (error) {
      console.error('Failed to clear history', error);
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto min-h-full">
      <header className="mb-10 text-center">
        <div className="inline-flex p-4 bg-orange-50 text-orange-600 rounded-3xl mb-6 shadow-sm">
          <Languages size={40} />
        </div>
        <h2 className="text-4xl font-serif italic mb-2">English to Urdu Companion</h2>
        <p className="opacity-60 max-w-md mx-auto">
          Academic vocabulary with Urdu translations and script-based pronunciation.
        </p>
      </header>

      <div className="max-w-2xl mx-auto flex items-center gap-3 mb-8">
        <form onSubmit={(e) => handleSearch(e)} className="relative flex-1 group">
          <input 
            type="text" 
            value={word}
            onChange={(e) => setWord(e.target.value)}
            placeholder="Enter a word or phrase (e.g. Sovereignty, Hegemony)" 
            className="w-full px-8 py-5 bg-white border border-[#141414]/10 rounded-3xl outline-none focus:border-[#141414]/40 shadow-sm pr-16 text-lg transition-all duration-300 group-focus-within:shadow-xl"
          />
          <button 
            disabled={loading}
            type="submit"
            className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-[#141414] text-white rounded-2xl hover:bg-opacity-90 transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={24} /> : <Search size={24} />}
          </button>
        </form>

        <button
          onClick={() => setShowHistory(!showHistory)}
          className={`p-5 rounded-3xl border transition-all flex items-center justify-center ${showHistory ? 'bg-[#141414] text-white border-[#141414]' : 'bg-white border-[#141414]/10 text-[#141414] hover:border-[#141414]/40'}`}
          title="Search History"
        >
          <History size={24} />
        </button>
      </div>

      <AnimatePresence>
        {showHistory && history.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-12 max-w-2xl mx-auto"
          >
            <div className="bg-[#141414]/5 rounded-3xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-black uppercase tracking-widest opacity-40 flex items-center gap-2">
                  My Dictionary History
                </h3>
                <button 
                  onClick={clearHistory}
                  className="text-[10px] uppercase font-bold tracking-widest text-red-500 hover:underline flex items-center gap-1"
                >
                  <Trash2 size={10} /> Clear All
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {history.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      handleSearch(undefined, item.word, item.result);
                      setShowHistory(false);
                    }}
                    className="px-4 py-2 bg-white border border-[#141414]/5 rounded-xl text-sm font-medium hover:border-black transition-all flex items-center gap-2"
                  >
                    {item.word}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div 
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <div className="flex gap-1 mb-4">
              {[0, 1, 2].map(i => (
                <motion.div 
                  key={i}
                  animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                  transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                  className="w-2 h-2 bg-[#141414] rounded-full"
                />
              ))}
            </div>
            <p className="text-xs font-bold uppercase tracking-widest opacity-40">Consulting AI Linguist...</p>
          </motion.div>
        ) : result ? (
          <motion.div 
            key="result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="bg-white border border-[#141414]/10 rounded-[3rem] p-8 md:p-12 shadow-sm transition-all hover:shadow-xl group">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-10 pb-8 border-b border-[#141414]/5">
                <div>
                  <h1 className="text-5xl font-serif font-black mb-2 flex items-center gap-3">
                    {word} <Sparkles size={24} className="text-orange-400 group-hover:scale-125 transition-transform" />
                  </h1>
                  <p className="text-sm font-medium opacity-60 flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-full w-fit ml-auto md:ml-0">
                    <Volume2 size={14} className="text-[#141414]" /> 
                    <span className="font-urdu text-base" dir="rtl">{result.pronunciation}</span>
                  </p>
                </div>
                <div className="text-right flex flex-col items-end gap-2">
                  <div className="flex flex-wrap gap-2 justify-end">
                    {result.urduMeanings.map((m: string, i: number) => (
                      <span key={i} className="text-4xl font-urdu text-[#141414] font-bold leading-tight" dir="rtl">
                        {m}{i < result.urduMeanings.length - 1 ? '،' : ''}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
 
               <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                 <section>
                   <h3 className="text-xs font-black uppercase tracking-[0.2em] opacity-40 mb-4 flex items-center gap-2">
                     <BookOpen size={14} /> Comprehensive Meaning
                   </h3>
                   <p className="text-lg leading-relaxed text-[#141414]/80 font-urdu" dir="rtl">
                     {result.explanationUrdu}
                   </p>
                 </section>
 
                 <section>
                   <h3 className="text-xs font-black uppercase tracking-[0.2em] opacity-40 mb-4 flex items-center gap-2">
                     <Quote size={14} /> Academic Usage
                   </h3>
                  <div className="space-y-4">
                    {result.examples.map((ex: any, i: number) => (
                      <div key={i} className="p-6 bg-gray-50 rounded-2xl border border-[#141414]/5">
                        <p className="font-bold text-[#141414] mb-3 leading-relaxed italic text-sm">
                          "{ex.english}"
                        </p>
                        <div className="h-[1px] w-8 bg-[#141414]/10 mb-3" />
                        <p className="text-right text-lg text-[#141414]/70 font-urdu" dir="rtl">
                          {ex.urdu}
                        </p>
                      </div>
                    ))}
                  </div>
                 </section>
               </div>
            </div>

            <div className="flex justify-center gap-4">
              <p className="text-[10px] text-center opacity-30 italic max-w-sm">
                Translations are generated via LLM with advanced linguistic context. Use within academic frameworks.
              </p>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto opacity-30">
            {['Bureaucracy', 'Democracy', 'Governance', 'Sovereignty', 'Hierarchy', 'Ideology'].map(w => (
              <button 
                key={w}
                onClick={() => { setWord(w); handleSearch(undefined, w); }}
                className="p-4 bg-white border border-[#141414]/10 rounded-2xl text-xs font-bold hover:bg-black hover:text-white transition-all text-center"
              >
                {w}
              </button>
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
