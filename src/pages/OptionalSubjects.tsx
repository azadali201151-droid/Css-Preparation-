import { useState } from 'react';
import { motion } from 'motion/react';
import { OPTIONAL_SUBJECTS } from '../lib/subjectsData';
import { Search, Hash, ArrowLeft, ChevronRight, Layers, Filter, History } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function OptionalSubjects() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeGroup, setActiveGroup] = useState('All');
  const navigate = useNavigate();

  const groups = ['All', 'Group I', 'Group II', 'Group III', 'Group IV', 'Group V', 'Group VI', 'Group VII'];

  const filteredSubjects = OPTIONAL_SUBJECTS.filter(subject => {
    const matchesSearch = subject.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          subject.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGroup = activeGroup === 'All' || subject.group === activeGroup;
    return matchesSearch && matchesGroup;
  });

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link to="/subjects" className="p-3 bg-white border border-[#141414]/10 rounded-2xl hover:bg-gray-50 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h2 className="text-3xl font-serif italic font-bold">Optional Specializations</h2>
          <p className="text-xs uppercase tracking-widest font-bold opacity-40">28 SUBJECTS • 600 MARKS TO SELECT</p>
        </div>
      </div>

      <div className="bg-orange-600 text-white p-8 rounded-[2.5rem] mb-12 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
        <div className="relative z-10 space-y-4 max-w-2xl">
          <div className="inline-flex p-3 bg-white/20 rounded-xl backdrop-blur-md">
            <Layers size={24} />
          </div>
          <h3 className="text-4xl font-serif italic font-bold">Strategic Selection</h3>
          <p className="text-lg opacity-80 leading-relaxed text-balance">
            Choose your optional subjects wisely based on your academic background and interest. Success in CSS often depends on a high-scoring combination of specializations.
          </p>
        </div>
        <div className="hidden md:block absolute right-0 bottom-0 opacity-10">
          <Hash size={240} />
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6 mb-10">
        <div className="relative flex-1">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 opacity-30" size={24} />
          <input 
            type="text" 
            placeholder="Search optional subjects..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-14 pr-6 py-5 bg-white border border-[#141414]/10 rounded-3xl outline-none focus:border-[#141414]/30 shadow-sm transition-all text-lg"
          />
        </div>
      </div>

      <div className="flex gap-2 mb-10 overflow-x-auto pb-2 scrollbar-hide py-1">
        {groups.map(group => (
          <button
            key={group}
            onClick={() => setActiveGroup(group)}
            className={`
              px-6 py-3 rounded-2xl text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2
              ${activeGroup === group ? 'bg-[#141414] text-white shadow-xl scale-105' : 'bg-white border border-[#141414]/10 opacity-70 hover:opacity-100'}
            `}
          >
            {group === 'All' && <Filter size={14} />}
            {group}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredSubjects.map((subject, idx) => (
          <motion.div
            key={subject.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: Math.min(idx * 0.05, 0.4) }}
          >
            <div 
              onClick={() => navigate(`/subject/${subject.id}`)}
              className="group h-full p-8 bg-white border border-[#141414]/10 rounded-[2.5rem] hover:border-[#141414] hover:shadow-2xl transition-all duration-500 overflow-hidden relative cursor-pointer text-left"
            >
              <div className="relative z-10">
                  <div className="p-4 bg-orange-50 text-orange-600 rounded-2xl w-fit mb-6 group-hover:bg-[#141414] group-hover:text-white transition-colors duration-500">
                    <Hash size={32} />
                  </div>
                  <div className="mb-4">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] bg-gray-100 px-2 py-1 rounded text-gray-500">{subject.group}</span>
                  </div>
                  <h3 className="text-2xl font-bold font-serif mb-4 leading-tight">{subject.name}</h3>
                  <p className="text-sm opacity-50 line-clamp-3 leading-relaxed mb-8">
                    {subject.description}
                  </p>
                  <div className="flex items-center justify-between pt-6 border-t border-[#141414]/5">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-40">100/200 Marks</span>
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
                        View Syllabus <ChevronRight size={16} />
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
