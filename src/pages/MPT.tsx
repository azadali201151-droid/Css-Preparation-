import { useState } from 'react';
import { motion } from 'motion/react';
import { BookOpen, CheckCircle, Clock, Award, FileText, ChevronRight } from 'lucide-react';

const mptSyllabus = [
  {
    subject: "Islamic Studies",
    marks: 20,
    details: "Basic knowledge of Islam, Quranic guidelines, Seerat-un-Nabi, and Islamic history. (Non-Muslims may opt for Civics & Ethics)",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200"
  },
  {
    subject: "Urdu",
    marks: 20,
    details: "Grammar usage, translation from English to Urdu and Urdu to English, sentence structuring, and idioms.",
    color: "bg-indigo-50 text-indigo-700 border-indigo-200"
  },
  {
    subject: "English",
    marks: 50,
    details: "Vocabulary, grammar, sentence correction, comprehension, and synonyms/antonyms.",
    color: "bg-blue-50 text-blue-700 border-blue-200"
  },
  {
    subject: "General Abilities",
    marks: 60,
    details: "Basic Arithmetic, Algebra and Geometry, Logical Problem Solving, Analytical Abilities, and Mental Abilities.",
    color: "bg-amber-50 text-amber-700 border-amber-200"
  },
  {
    subject: "General Knowledge",
    marks: 50,
    details: "Everyday Science, Current Affairs, and Pakistan Affairs.",
    color: "bg-rose-50 text-rose-700 border-rose-200"
  }
];

export default function MPT() {
  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      <header className="mb-8">
        <div className="flex items-center gap-2 text-sm font-bold opacity-50 uppercase tracking-widest mb-4">
          <BookOpen size={16} />
          <span>FPSC Official Guidance</span>
        </div>
        <h1 className="text-4xl lg:text-5xl font-serif font-bold italic mb-4">CSS MPT Preparation</h1>
        <p className="text-lg opacity-70 max-w-3xl leading-relaxed">
          The MCQ Based Preliminary Test (MPT) is a mandatory screening test for CSS candidates. 
          Passing this test is required to appear in the written examination. Based on 20+ years of 
          expert analysis and official FPSC guidelines, here is the complete breakdown and strategic guidance.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-[#141414]/10 flex items-center gap-4">
          <div className="p-3 bg-gray-50 rounded-xl"><CheckCircle className="text-gray-700" size={24} /></div>
          <div>
            <p className="text-xs font-bold opacity-50 uppercase tracking-widest">Total Marks</p>
            <p className="text-2xl font-serif font-bold">200</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-[#141414]/10 flex items-center gap-4">
          <div className="p-3 bg-gray-50 rounded-xl"><Clock className="text-gray-700" size={24} /></div>
          <div>
            <p className="text-xs font-bold opacity-50 uppercase tracking-widest">Duration</p>
            <p className="text-2xl font-serif font-bold">200 Minutes</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-[#141414]/10 flex items-center gap-4">
          <div className="p-3 bg-gray-50 rounded-xl"><Award className="text-gray-700" size={24} /></div>
          <div>
            <p className="text-xs font-bold opacity-50 uppercase tracking-widest">Passing Marks</p>
            <p className="text-2xl font-serif font-bold">66 (33%)</p>
          </div>
        </div>
      </div>

      <section>
        <h2 className="text-2xl font-serif italic mb-6">Official FPSC Syllabus Breakdown</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {mptSyllabus.map((item, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`p-6 rounded-2xl border ${item.color} flex flex-col`}
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold">{item.subject}</h3>
                <span className="text-sm font-bold bg-white/50 px-3 py-1 rounded-lg">
                  {item.marks} Marks
                </span>
              </div>
              <p className="opacity-90 font-medium text-sm leading-relaxed mt-auto">
                {item.details}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="bg-[#141414] text-white p-8 lg:p-12 rounded-3xl mt-12 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-gradient-to-l from-white/5 to-transparent pointer-events-none" />
        <div className="relative z-10">
          <h2 className="text-3xl font-serif italic mb-6">Expert Strategy for MPT</h2>
          <div className="space-y-6 opacity-80 leading-relaxed font-medium">
            <p>
              <strong>1. Focus on High-Yield Areas:</strong> General Abilities (60 marks) and English (50 marks) make up 55% of the total paper. Candidates must rigorously practice basic mathematics, analytical reasoning, and vocabulary. These are highly objective sections where guessing is least effective.
            </p>
            <p>
              <strong>2. No Negative Marking:</strong> FPSC MPT currently has no negative marking. Strategically, this means you should attempt all 200 questions. Never leave an OMR bubble blank. Use the process of elimination for difficult questions.
            </p>
            <p>
              <strong>3. Time Management:</strong> You have exactly 1 minute per question. Do not get stuck on mathematical problems. If a question takes more than 45 seconds to deduce, mark it for review and move forward. The General Knowledge section should be completed swiftly to save time for General Abilities.
            </p>
            <p>
              <strong>4. Past Paper Analysis:</strong> Reviewing the last few years of MPT papers shows a clear trend of testing foundational concepts rather than obscure facts. For Everyday Science, focus on basic biology, physics, and environmental sciences. For Pakistan Affairs, focus on post-1947 constitutional and political developments.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
