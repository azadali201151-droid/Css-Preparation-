import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { generateTest } from '../services/geminiService';
import { Brain, ArrowRight, CheckCircle2, XCircle, RefreshCw, Loader2, Award } from 'lucide-react';
import { COMPULSORY_SUBJECTS, OPTIONAL_SUBJECTS } from '../lib/subjectsData';
import { doc, addDoc, collection } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

interface Question {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export default function AITest() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [answered, setAnswered] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  const subject = [...COMPULSORY_SUBJECTS, ...OPTIONAL_SUBJECTS].find(s => s.id === id);

  const loadTest = async () => {
    if (!subject) return;
    setLoading(true);
    setCurrentIndex(0);
    setScore(0);
    setShowResult(false);
    setErrorStatus(null);
    try {
      const data = await generateTest(subject.name);
      setQuestions(data);
    } catch (error: any) {
      console.error('Failed to generate test', error);
      setErrorStatus(error.message || "Failed to generate test");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTest();
  }, [id]);

  const handleAnswer = (option: string) => {
    if (answered) return;
    setSelectedOption(option);
    setAnswered(true);
    if (option === questions[currentIndex].correctAnswer) {
      setScore(prev => prev + 1);
    }
  };

  const nextQuestion = async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setAnswered(false);
    } else {
      setShowResult(true);
      // Save attempt if user logged in
      if (auth.currentUser && subject) {
        try {
          await addDoc(collection(db, `userProfiles/${auth.currentUser.uid}/testAttempts`), {
            userId: auth.currentUser.uid,
            subjectId: subject.id,
            score: score + (selectedOption === questions[currentIndex].correctAnswer ? 1 : 0),
            totalQuestions: questions.length,
            createdAt: new Date().toISOString(),
          });
        } catch (e) {
          console.error("Error saving attempt", e);
        }
      }
    }
  };

  if (errorStatus) {
    return (
      <div className="h-[calc(100vh-64px)] flex flex-col items-center justify-center p-8 bg-white text-center">
        <XCircle size={48} className="text-red-500 mb-6" />
        <h2 className="text-3xl font-serif italic mb-4">Assessment Unreachable</h2>
        <p className="opacity-50 mb-8 max-w-sm mx-auto">
          {errorStatus.includes('QUOTA') 
            ? "The AI examiner is currently over capacity. This usually happens when multiple students are generating tests simultaneously. Please try again in a few minutes." 
            : errorStatus}
        </p>
        <div className="flex gap-4">
          <button onClick={() => navigate(`/subject/${id}`)} className="px-8 py-4 border border-[#141414]/10 rounded-2xl font-bold hover:bg-gray-50 transition-colors">
            Go Back
          </button>
          <button onClick={loadTest} className="px-8 py-4 bg-[#141414] text-white rounded-2xl font-bold hover:bg-opacity-90 transition-all">
            Retry Generation
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-[calc(100vh-64px)] flex flex-col items-center justify-center p-8 bg-white">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="mb-8 p-6 bg-purple-50 text-purple-600 rounded-full"
        >
          <Brain size={48} />
        </motion.div>
        <h2 className="text-3xl font-serif italic mb-4">Generating Your AI Test...</h2>
        <p className="opacity-50 text-center max-w-sm">
          Simulating FPSC examiner logic for {subject?.name}. This will involve conceptual and analytical questions.
        </p>
      </div>
    );
  }

  if (showResult) {
    const finalScore = score;
    const percentage = (finalScore / questions.length) * 100;

    return (
      <div className="p-8 max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[calc(100vh-100px)] text-center">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="p-8 bg-white border border-[#141414]/10 rounded-[3rem] shadow-2xl w-full"
        >
          <Award size={80} className="mx-auto text-orange-500 mb-6" />
          <h2 className="text-4xl font-serif italic mb-2">Assessment Complete</h2>
          <p className="text-lg opacity-60 mb-8">Subject: {subject?.name}</p>
          
          <div className="text-7xl font-black mb-4">{percentage}%</div>
          <p className="font-bold uppercase tracking-widest text-sm opacity-40 mb-10">
            Current Standing: {percentage >= 80 ? 'Exceptional' : percentage >= 60 ? 'Competent' : 'Needs Improvement'}
          </p>

          <div className="grid grid-cols-2 gap-4 mb-10 text-left">
            <div className="p-4 bg-green-50 rounded-2xl border border-green-100">
              <span className="block text-[10px] uppercase font-black text-green-600 mb-1">Correct</span>
              <span className="text-2xl font-bold">{finalScore}</span>
            </div>
            <div className="p-4 bg-red-50 rounded-2xl border border-red-100">
              <span className="block text-[10px] uppercase font-black text-red-600 mb-1">Incorrect</span>
              <span className="text-2xl font-bold">{questions.length - finalScore}</span>
            </div>
          </div>

          <div className="flex gap-4">
            <button onClick={() => navigate(`/subject/${id}`)} className="flex-1 py-4 border border-[#141414]/10 rounded-2xl font-bold hover:bg-gray-50 transition-colors">
              Finish
            </button>
            <button onClick={loadTest} className="flex-1 py-4 bg-[#141414] text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-opacity-90 transition-all">
              <RefreshCw size={18} /> Retry
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];

  return (
    <div className="p-8 lg:p-12 max-w-4xl mx-auto h-full flex flex-col">
      <div className="flex items-center justify-between mb-12">
        <div>
          <h3 className="text-xl font-serif font-bold italic">{subject?.name} Practice</h3>
          <p className="text-xs opacity-50 uppercase tracking-widest mt-1">AI-Generated Assessment</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-bold opacity-30">Question {currentIndex + 1} of {questions.length}</span>
          <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-purple-600" 
              initial={{ width: 0 }}
              animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <motion.div
        key={currentIndex}
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -20, opacity: 0 }}
        className="flex-1"
      >
        <h4 className="text-2xl font-serif font-bold mb-10 leading-snug">
          {currentQ.question}
        </h4>

        <div className="grid grid-cols-1 gap-4">
          {currentQ.options.map((option, idx) => (
            <button
              key={`q-${currentIndex}-opt-${idx}`}
              onClick={() => handleAnswer(option)}
              className={`
                p-6 rounded-2xl text-left border-2 transition-all duration-200 flex items-center justify-between group
                ${answered && option === currentQ.correctAnswer ? 'border-green-500 bg-green-50' : 
                  answered && option === selectedOption && option !== currentQ.correctAnswer ? 'border-red-500 bg-red-50' :
                  selectedOption === option ? 'border-[#141414] bg-gray-50' : 'border-[#141414]/5 bg-white hover:border-[#141414]/20'}
              `}
            >
              <span className="font-semibold">{option}</span>
              {answered && option === currentQ.correctAnswer && <CheckCircle2 className="text-green-500" />}
              {answered && option === selectedOption && option !== currentQ.correctAnswer && <XCircle className="text-red-500" />}
            </button>
          ))}
        </div>

        <AnimatePresence>
          {answered && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 p-6 bg-blue-50 border border-blue-100 rounded-2xl"
            >
              <h5 className="font-bold text-blue-800 mb-2 flex items-center gap-2 underline text-xs uppercase tracking-widest">
                Explanation
              </h5>
              <p className="text-sm text-blue-700 leading-relaxed italic">
                {currentQ.explanation}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <footer className="mt-12 flex justify-end">
        {answered && (
          <button 
            onClick={nextQuestion}
            className="px-8 py-4 bg-[#141414] text-white rounded-2xl font-bold flex items-center gap-2 hover:bg-opacity-90 transition-all shadow-xl"
          >
            {currentIndex === questions.length - 1 ? 'See Results' : 'Next Question'} <ArrowRight size={20} />
          </button>
        )}
      </footer>
    </div>
  );
}
