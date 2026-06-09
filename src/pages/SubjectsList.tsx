import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { COMPULSORY_SUBJECTS, OPTIONAL_SUBJECTS } from '../lib/subjectsData';
import { Search, Book, Hash, ArrowLeft, Layers, GraduationCap, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SubjectsList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<'none' | 'compulsory' | 'optional'>('none');
  const [activeGroup, setActiveGroup] = useState('All');

  const allSubjects = [...COMPULSORY_SUBJECTS, ...OPTIONAL_SUBJECTS];
  const optionalGroups = ['All', 'Group I', 'Group II', 'Group III', 'Group IV', 'Group V', 'Group VI', 'Group VII'];

  const filteredSubjects = allSubjects.filter(subject => {
    const matchesSearch = subject.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          subject.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeCategory === 'compulsory') {
      return matchesSearch && subject.isCompulsory;
    }
    
    if (activeCategory === 'optional') {
      const matchesGroup = activeGroup === 'All' || subject.group === activeGroup;
      return matchesSearch && !subject.isCompulsory && matchesGroup;
    }

    return matchesSearch;
  });

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto min-h-full">
      <AnimatePresence mode="wait">
        {activeCategory === 'none' ? (
          <motion.div
            key="selection"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="h-full flex flex-col"
          >
            <header className="mb-12 text-center">
              <h2 className="text-5xl font-serif italic font-black mb-4">The Curriculum</h2>
              <p className="opacity-60 max-w-lg mx-auto">Select your path. Master the 6 compulsory pillars or explore the 28 optional specializations for the CSS examination.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto w-full">
              <Link to="/subjects/compulsory" className="block text-left">
                <CategoryCard 
                  icon={<GraduationCap size={48} />}
                  title="Compulsory Subjects"
                  count="6 Subjects"
                  description="The essential foundation for every civil servant. Covers English, General Science, and Current Affairs."
                  color="bg-blue-50 text-blue-600"
                />
              </Link>
              <Link to="/subjects/optional" className="block text-left">
                <CategoryCard 
                  icon={<Layers size={48} />}
                  title="Optional Subjects"
                  count="28+ Subjects"
                  description="Tailor your preparation to your strengths. Choose from 7 specialized groups including Law, History, and Sciences."
                  color="bg-orange-50 text-orange-600"
                />
              </Link>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="flex items-center gap-4 mb-8">
              <button 
                onClick={() => { setActiveCategory('none'); setActiveGroup('All'); }}
                className="p-3 bg-white border border-[#141414]/10 rounded-2xl hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h2 className="text-3xl font-serif italic font-bold">
                  {activeCategory === 'compulsory' ? 'Compulsory Pillars' : 'Optional Specializations'}
                </h2>
                <p className="text-xs uppercase tracking-widest font-bold opacity-40">
                  {activeCategory === 'compulsory' ? '6 SUBJECTS • 600 MARKS' : 'SELECT FROM 28+ OPTIONS • 600 MARKS'}
                </p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4 mb-8">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30" size={20} />
                <input 
                  type="text" 
                  placeholder={`Search ${activeCategory} subjects...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white border border-[#141414]/10 rounded-2xl outline-none focus:border-[#141414]/30 shadow-sm transition-all"
                />
              </div>
            </div>

            {/* Group Tabs for Optional */}
            {activeCategory === 'optional' && (
              <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
                {optionalGroups.map(group => (
                  <button
                    key={group}
                    onClick={() => setActiveGroup(group)}
                    className={`
                      px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all
                      ${activeGroup === group ? 'bg-[#141414] text-white' : 'bg-white border border-[#141414]/10 opacity-70 hover:opacity-100'}
                    `}
                  >
                    {group}
                  </button>
                ))}
              </div>
            )}

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredSubjects.map((subject, idx) => (
                <motion.div
                  key={subject.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(idx * 0.05, 0.5) }}
                >
                  <Link to={`/subject/${subject.id}`}>
                    <div className="group h-full p-6 bg-white border border-[#141414]/10 rounded-3xl hover:border-[#141414] hover:shadow-xl transition-all duration-300 flex flex-col">
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-gray-50 rounded-2xl group-hover:bg-[#141414] group-hover:text-white transition-colors">
                          {subject.isCompulsory ? <Book size={24} /> : <Hash size={24} />}
                        </div>
                        <span className={`text-[10px] uppercase font-black tracking-widest px-2 py-1 rounded-lg ${subject.isCompulsory ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                          {subject.isCompulsory ? 'Compulsory' : subject.group}
                        </span>
                      </div>
                      
                      <h3 className="text-xl font-bold font-serif mb-2">{subject.name}</h3>
                      <p className="text-sm opacity-50 flex-1 leading-relaxed">
                        {subject.description}
                      </p>
                      
                      <div className="mt-6 pt-6 border-t border-[#141414]/5 flex items-center justify-between">
                        <span className="text-xs font-bold opacity-30 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                          Explore Syllabus <ChevronRight size={14} />
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            {filteredSubjects.length === 0 && (
              <div className="text-center py-20 bg-white border border-[#141414]/10 rounded-3xl">
                <div className="p-6 inline-flex bg-gray-50 rounded-full mb-4">
                  <Search size={40} className="opacity-20" />
                </div>
                <h3 className="text-2xl font-serif italic mb-2">No subjects found</h3>
                <p className="opacity-50">Try adjusting your search or filters.</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CategoryCard({ icon, title, count, description, color, onClick }: any) {
  return (
    <motion.button 
      whileHover={{ y: -10, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-white p-8 rounded-[3rem] border border-[#141414]/10 text-left group transition-all hover:shadow-2xl hover:border-[#141414]/20"
    >
      <div className={`p-6 rounded-[2rem] w-fit mb-8 group-hover:scale-110 transition-transform ${color}`}>
        {icon}
      </div>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] uppercase font-black tracking-[0.2em] opacity-40">{count}</span>
      </div>
      <h3 className="text-3xl font-serif italic font-bold mb-4">{title}</h3>
      <p className="text-sm opacity-60 leading-relaxed mb-8">{description}</p>
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest group-hover:gap-4 transition-all">
        Explore List <ChevronRight size={16} />
      </div>
    </motion.button>
  );
}

