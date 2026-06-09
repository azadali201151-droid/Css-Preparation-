import { motion } from 'motion/react';
import { BookOpen, Brain, Users, TrendingUp, Award, Clock, Search, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      <header>
        <motion.h2 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-serif italic mb-2"
        >
          Welcome, Aspirant.
        </motion.h2>
        <p className="text-lg opacity-60">Your journey to the Civil Service Commission starts here.</p>
      </header>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={<BookOpen className="text-blue-500" />} label="Subjects Covered" value="6/34" sub="Curriculum progress" />
        <StatCard icon={<Brain className="text-purple-500" />} label="Tests Completed" value="12" sub="Across all subjects" />
        <StatCard icon={<Award className="text-orange-500" />} label="Average Score" value="84%" sub="Rank percentile: top 5%" />
        <StatCard icon={<Clock className="text-gray-500" />} label="Study Hours" value="142h" sub="Total focus time" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Areas */}
        <div className="lg:col-span-2 space-y-8">
          <section className="p-8 bg-[#141414] text-white rounded-3xl overflow-hidden relative">
            <div className="relative z-10 max-w-md">
              <h3 className="text-3xl font-serif italic mb-4">Empower your preparation with AI.</h3>
              <p className="opacity-70 mb-6 text-sm">Generate real-time conceptual tests and chat with our expert AI mentor trained on years of CSS papers and reports.</p>
              <Link to="/ai-assistant" className="px-6 py-3 bg-white text-[#141414] rounded-xl font-bold text-sm inline-flex items-center gap-2 hover:bg-opacity-90 transition-all">
                Access AI Mentor <Brain size={18} />
              </Link>
            </div>
            <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-gradient-to-l from-purple-500/20 to-transparent pointer-events-none" />
          </section>

          <section className="bg-white p-8 border border-[#141414]/10 rounded-3xl">
            <h3 className="text-2xl font-serif italic mb-4">About this platform</h3>
            <p className="opacity-70 leading-relaxed font-medium">
              We are an AI powered web app designed specifically for CSS and FPSC aspirants. Our platform provides comprehensive syllabus coverage, AI-driven evaluation for essay and subjective practice, comprehensive topic guidance, and an integrated system to track your progress and logs seamlessly. Prepare effectively, guided by precise standards and instant feedback.
            </p>
          </section>

          <section className="bg-white p-8 border border-[#141414]/10 rounded-3xl">
            <h3 className="text-2xl font-serif italic mb-6">Frequently Asked Questions</h3>
            <div className="space-y-4">
              <details className="group [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer items-center justify-between gap-1.5 rounded-lg bg-gray-50 p-4 text-gray-900 border border-gray-100">
                  <h2 className="font-bold font-serif text-lg">How does the AI Examiner work?</h2>
                  <svg className="h-5 w-5 shrink-0 transition duration-300 group-open:-rotate-180" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="mt-4 px-4 leading-relaxed text-gray-700 opacity-80 text-sm">
                  Our AI examiner is fine-tuned on FPSC examiner reports and syllabus instructions. When you upload a handwritten answer, the AI parses the text and evaluates it systematically on structure, argument coherence, vocabulary, and relevance. It provides constructive feedback mimicking the rigorous standards of actual commission examiners.
                </div>
              </details>

              <details className="group [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer items-center justify-between gap-1.5 rounded-lg bg-gray-50 p-4 text-gray-900 border border-gray-100">
                  <h2 className="font-bold font-serif text-lg">Are the MCQs based on past papers?</h2>
                  <svg className="h-5 w-5 shrink-0 transition duration-300 group-open:-rotate-180" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="mt-4 px-4 leading-relaxed text-gray-700 opacity-80 text-sm">
                  Yes, the generated MCQs are strictly curated based on the official FPSC syllabus parameters and historically tested topics. The system generates high-yield questions accompanied by detailed explanations so you learn not just the correct option, but the underlying concept as well.
                </div>
              </details>

              <details className="group [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer items-center justify-between gap-1.5 rounded-lg bg-gray-50 p-4 text-gray-900 border border-gray-100">
                  <h2 className="font-bold font-serif text-lg">Can I review my past mistakes?</h2>
                  <svg className="h-5 w-5 shrink-0 transition duration-300 group-open:-rotate-180" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="mt-4 px-4 leading-relaxed text-gray-700 opacity-80 text-sm">
                  Absolutely. Every section retains your attempted tests and logs, enabling you to revisit past evaluations, trace your progress over time, and focus on your weaker spots intelligently.
                </div>
              </details>
            </div>
          </section>
        </div>

        {/* Sidebar / Feed */}
        <div className="space-y-8">
          <section>
            <h3 className="text-xl font-bold font-serif italic mb-6">Aspirant Community</h3>
            <div className="space-y-4">
              <CommunitySnippet name="Ahmed Khan" topic="International Relations Group I Strategy" time="2h ago" replies={12} />
              <CommunitySnippet name="Sara Ali" topic="How to handle GSA Mathematics section?" time="5h ago" replies={45} />
              <CommunitySnippet name="Bilal Shah" topic="Notes sharing: Gender Studies basics" time="1d ago" replies={8} />
            </div>
            <Link to="/forum" className="block text-center mt-6 py-3 border border-[#141414]/10 rounded-xl text-sm font-bold hover:bg-white transition-colors">
              Enter Community Forum
            </Link>
          </section>

          <section className="p-6 bg-white border border-[#141414]/10 rounded-2xl">
            <h3 className="text-sm font-bold uppercase tracking-widest opacity-50 mb-4">English to Urdu Helper</h3>
            <div className="relative">
              <input 
                type="text" 
                placeholder="Lookup CSS vocabulary..." 
                className="w-full pl-4 pr-10 py-3 bg-[#F5F5F0] rounded-xl text-sm outline-none border border-transparent focus:border-[#141414]/20 transition-all"
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 opacity-30" size={18} />
            </div>
            <p className="text-[10px] mt-3 opacity-40 italic">Try searching: "Bureaucracy", "Sovereignty", "Diplomacy"</p>
          </section>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode, label: string, value: string, sub: string }) {
  return (
    <div className="bg-white p-6 border border-[#141414]/10 rounded-3xl relative overflow-hidden group">
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 bg-gray-50 rounded-2xl group-hover:scale-110 transition-transform">{icon}</div>
        <TrendingUp size={16} className="opacity-20" />
      </div>
      <div>
        <p className="text-sm font-bold opacity-40 uppercase tracking-widest mb-1">{label}</p>
        <h4 className="text-3xl font-serif font-bold italic">{value}</h4>
        <p className="text-[11px] opacity-60 mt-2 font-medium">{sub}</p>
      </div>
    </div>
  );
}

function CommunitySnippet({ name, topic, time, replies }: { name: string, topic: string, time: string, replies: number }) {
  return (
    <div className="p-4 bg-white border border-[#141414]/5 rounded-xl hover:shadow-md transition-shadow">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-6 h-6 rounded-full bg-gray-200" />
        <span className="text-xs font-bold">{name}</span>
        <span className="text-[10px] opacity-40 ml-auto">{time}</span>
      </div>
      <p className="text-sm font-medium line-clamp-2 leading-snug mb-2">{topic}</p>
      <div className="flex items-center gap-1 opacity-40 text-[10px] font-bold">
        <MessageSquare size={10} /> {replies} replies
      </div>
    </div>
  );
}
