import { useState } from 'react';
import { motion } from 'motion/react';
import { COMPULSORY_SUBJECTS } from '../lib/subjectsData';
import { Search, Book, ArrowLeft, ChevronRight, GraduationCap, History } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function CompulsorySubjects() {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const filteredSubjects = COMPULSORY_SUBJECTS.filter(subject =>
    subject.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    subject.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link to="/subjects" className="p-3 bg-white border border-[#141414]/10 rounded-2xl hover:bg-gray-50 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h2 className="text-3xl font-serif italic font-bold">Compulsory Foundations</h2>
          <p className="text-xs uppercase tracking-widest font-bold opacity-40">6 SUBJECTS • 600 MARKS TOTAL</p>
        </div>
      </div>

      <div className="bg-blue-600 text-white p-8 rounded-[2.5rem] mb-12 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
        <div className="relative z-10 space-y-4 max-w-2xl">
          <div className="inline-flex p-3 bg-white/20 rounded-xl backdrop-blur-md">
            <GraduationCap size={24} />
          </div>
          <h3 className="text-4xl font-serif italic font-bold">The Pillars of CSS</h3>
          <p className="text-lg opacity-80 leading-relaxed text-balance">
            These subjects are mandatory for all candidates. They form the analytical and communicative core required for the highest-ranking civil service positions.
          </p>
        </div>
        <div className="hidden md:block absolute right-0 bottom-0 opacity-10">
          <Book size={240} />
        </div>
      </div>

      <div className="relative mb-10">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 opacity-30" size={24} />
        <input 
          type="text" 
          placeholder="Filter compulsory subjects..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-14 pr-6 py-5 bg-white border border-[#141414]/10 rounded-3xl outline-none focus:border-[#141414]/30 shadow-sm transition-all text-lg"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredSubjects.map((subject, idx) => (
          <motion.div
            key={subject.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <div 
              onClick={() => navigate(`/subject/${subject.id}`)}
              className="group h-full p-8 bg-white border border-[#141414]/10 rounded-[2.5rem] hover:border-[#141414] hover:shadow-2xl transition-all duration-500 overflow-hidden relative cursor-pointer text-left"
            >
              <div className="relative z-10">
                  <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl w-fit mb-6 group-hover:bg-[#141414] group-hover:text-white transition-colors duration-500">
                    <Book size={32} />
                  </div>
                  <h3 className="text-2xl font-bold font-serif mb-4 leading-tight">{subject.name}</h3>
                  <p className="text-sm opacity-50 line-clamp-3 leading-relaxed mb-8">
                    {subject.description}
                  </p>
                  <div className="flex items-center justify-between pt-6 border-t border-[#141414]/5">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-40">100 Marks</span>
                    <div className="flex items-center gap-4">
                      
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/subject/${subject.id}?action=history`);
                        }}
                        className="p-2 -m-2 opacity-50 hover:opacity-100 hover:text-purple-600 transition-colors"
                        title="View tests, materials, and dates"
                      >
                        <History size={18} />
                      </button>
                      
                      <div className="text-sm font-bold flex items-center gap-2 group-hover:gap-4 transition-all hover:text-blue-600">
                        Master Syllabus <ChevronRight size={16} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
