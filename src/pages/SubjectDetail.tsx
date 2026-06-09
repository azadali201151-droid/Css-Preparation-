import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { COMPULSORY_SUBJECTS, OPTIONAL_SUBJECTS } from '../lib/subjectsData';
import { BookOpen, Brain, FileText, ArrowLeft, Loader2, X, Sparkles, Camera, Upload, CheckSquare, ListTodo, TrendingUp, Download, FileDown, LogOut, Minimize2, Shield, GraduationCap, Cpu, Zap, Users, Globe, History, ClipboardList, AlertCircle } from 'lucide-react';
import { collection, addDoc, query, where, getDocs, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { getSyllabusBreakdown, getTopicGuidance, getPastPaperStyleTest, evaluateHandwriting, getEssayTopicsForDomain, getTopicMCQs, getFullTopicNotes } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';
import { PREDEFINED_ESSAY_TOPICS } from '../lib/essayTopics';
import { jsPDF } from 'jspdf';

const isErrorMessage = (text: string | null | undefined): boolean => {
  if (!text) return false;
  const t = text.toLowerCase();
  return (
    t.includes("api key") ||
    t.includes("gear icon") ||
    t.includes("service is busy") ||
    t.includes("service error") ||
    t.includes("temporarily busy") ||
    t.includes("error context:") ||
    t.includes("quota exceeded") ||
    t.includes("leaked") ||
    t.includes("permission_denied") ||
    t.includes("invalid") ||
    t.includes("api_key") ||
    t.includes("capacity reached")
  );
};

export default function SubjectDetail() {
  const { id } = useParams();
  const location = useLocation();
  const allSubjects = [...COMPULSORY_SUBJECTS, ...OPTIONAL_SUBJECTS];
  const subject = allSubjects.find(s => s.id === id);

  const [syllabusTopics, setSyllabusTopics] = useState<string[]>([]);
  const [loadingSyllabus, setLoadingSyllabus] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [topicGuidance, setTopicGuidance] = useState<string | null>(null);
  const [topicTest, setTopicTest] = useState<string | null>(null);
  const [topicNotes, setTopicNotes] = useState<string | null>(null);
  const [loadingTopicData, setLoadingTopicData] = useState(false);
  const [activeTab, setActiveTab] = useState<'guidance' | 'test' | 'evaluation' | 'notes'>('guidance');
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  // Essay Specific State
  const [selectedEssayDomain, setSelectedEssayDomain] = useState<string | null>(null);
  const [essayDomainTopics, setEssayDomainTopics] = useState<string[]>([]);
  const [loadingDomainTopics, setLoadingDomainTopics] = useState(false);
  const [expandedTechnique, setExpandedTechnique] = useState<string | null>(null);
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);
  const [expandedTopicTab, setExpandedTopicTab] = useState<'guidance' | 'test' | 'mcqs' | 'notes'>('guidance');
  const [topicMCQs, setTopicMCQs] = useState<any[]>([]);
  const [currentMCQIndex, setCurrentMCQIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [mcqCount, setMcqCount] = useState<number>(10);
  const [loadingMCQs, setLoadingMCQs] = useState(false);
  const [showTopicMCQs, setShowTopicMCQs] = useState(false);
  const [subjectMcqs, setSubjectMcqs] = useState<any[]>([]);
  const [currentSubjectMcqIdx, setCurrentSubjectMcqIdx] = useState(0);
  const [subjectMcqAnswers, setSubjectMcqAnswers] = useState<Record<number, string>>({});
  const [loadingNewTest, setLoadingNewTest] = useState(false);
  const [loadingNewMcqs, setLoadingNewMcqs] = useState(false);
  const [showPracticeSelector, setShowPracticeSelector] = useState(false);
  const [testSelectionType, setTestSelectionType] = useState<'subjective' | 'objective' | 'history'>('subjective');
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showGlobalHistory, setShowGlobalHistory] = useState(false);
  const [openedFromHistory, setOpenedFromHistory] = useState(false);

  // Handwriting Evaluation State
  const [uploadingImage, setUploadingImage] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<string | null>(null);
  const [customEssayTopic, setCustomEssayTopic] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // English Essay Detailed Syllabus
  const ESSAY_SYLLABUS = [
    "Selection of the topic & Technical Requirements",
    "Brainstorming and Outline Construction",
    "The Introduction & Thesis Statement",
    "Paragraph Body: Unity, Coherence & Flow",
    "Evidence, Data & Analytical Reasoning",
    "Conclusion and Synthesis of Arguments"
  ];

  const PRECIS_SYLLABUS = [
    "Précis Writing (20 Marks)",
    "Reading Comprehension (20 Marks)",
    "Grammar and Vocabulary (Synonyms, Antonyms, Idioms)",
    "Sentence Correction (10 Marks)",
    "Grouping of Words & Analogies (10 Marks)",
    "Punctuation & Direct/Indirect Speech (10 Marks)",
    "Translation (Urdu to English) (10 Marks)"
  ];

  const GSA_SYLLABUS = [
    "Physical Sciences (Astronomy, Geology, Hydrology)",
    "Biological Sciences (Basis of Life, Diseases)",
    "Environmental Science (Pollution, Climate Change)",
    "Food Science (Nutrition, Balance Diet)",
    "Information Technology & Computer Hardware",
    "Quantitative Ability (Arithmetic, Algebra, Geometry)",
    "Logical Reasoning & Analytical Ability",
    "Mental Abilities & Problem Solving"
  ];

  const PAK_AFFAIRS_SYLLABUS = [
    "Ideology of Pakistan & Evolution of Society",
    "Pakistan Movement (1857 - 1947)",
    "Constitutional Developments since 1947",
    "Political History & Administrative Structure",
    "Geo-Political Importance of Pakistan",
    "Economic Challenges & Reforms",
    "Social Issues (Education, Health, Population)",
    "Foreign Policy of Pakistan"
  ];

  const CURRENT_AFFAIRS_SYLLABUS = [
    "Pakistan's Domestic Affairs (Political & Economic)",
    "Pakistan's External Affairs (Relations with Neighbors)",
    "Global Issues & International Organizations",
    "Security Issues & Counter-Terrorism",
    "Climate Change & Environmental Diplomacy",
    "Human Rights & International Law"
  ];

  const ISLAMIC_STUDIES_SYLLABUS = [
    "Fundamental Beliefs & Practices of Islam",
    "Study of Seerah of Prophet Muhammad (PBUH)",
    "Islamic Civilization & Culture",
    "Islam & Science: Historical Perspective",
    "Islamic Economic & Political System",
    "Public Administration & Governance in Islam",
    "Islamic Judicial System & Human Rights",
    "Distinctive Features of Islam as a Religion"
  ];

  const ESSAY_TECHNIQUE_DETAILS: Record<string, string> = {
    "Selection of the topic & Technical Requirements": `
# Selection of Topic & Technical Requirements
The selection of the topic is the absolute pivot point. A high-scoring candidate doesn't just pick a topic they "like"—they pick a topic they can **defend**.

### 💡 Experienced Guidance
*   **The 500-Word Test:** Before finalizing, spend 2 minutes mentally listing 5 main arguments. If you can't, move to the next topic.
*   **Prompt Analysis:** Circle the keywords. If the topic is "Global Warming: Myth or Reality?", you must address both sides before taking a stance.
*   **Safe vs. Adventurous:** Literary topics (e.g., "Life is a trial") are risky. Socio-economic topics (e.g., "Energy Crisis") are safer but require fresh data to stand out.

### ✅ DOs
*   Choose a topic where you have specific data/reports (WB, IMF, Economic Survey).
*   Ensure the topic is multi-dimensional (Political, Economic, Social).
*   Stick to one stance Throughout the essay.

### ❌ DON'Ts
*   Don't choose a topic just because it looks "easy" (it's often a trap for shallow writing).
*   Don't use informal language or abbreviations.
*   Don't switch your stance halfway through.
    `,
    "Brainstorming and Outline Construction": `
# Brainstorming & Outline Construction
Your outline is the skeletal system. If it's weak, the rest of the body (the essay) will not hold together.

### 💡 Experienced Guidance
*   **The T-Table Method:** Draw a T-table. List "Causes" on one side and "Effects" on the other. This ensures you cover the "Problem" aspect fully.
*   **Sub-heading Hierarchy:** Sub-headings should not be independent; they should be branches of the main heading.
*   **Outline Length:** A good outline for a 2,500-word essay should span 1.5 to 2 pages of the answer sheet.

### ✅ DOs
*   Mention your **Thesis Statement** clearly in the outline under the Introduction.
*   Use phrase form (e.g., "Institutional decay of bureaucracy").
*   Ensure a logical flow from past context to future remedies.

### ❌ DON'Ts
*   Don't write full sentences in the outline.
*   Don't use sub-points that repeat the main heading.
*   Don't forget to include a "Way Forward" section.
    `,
    "The Introduction & Thesis Statement": `
# The Introduction & Thesis Statement
Think of your introduction as the "Vantage Point." It sets the tone for the next 2 hours of reading.

### 💡 Experienced Guidance
*   **The Funnel Approach:** Start broad (Global context), narrow down to the regional context (Pakistan/South Asia), and then land on the specific topic.
*   **The Power Thesis:** Your thesis statement should be the most intellectually dense 3 lines of your essay. It's your compact argument.
*   **Length:** Keep the intro between 250-350 words.

### ✅ DOs
*   End your introduction with a clear roadmap of what's coming next.
*   Use a "Hook" (a startling fact or profound philosophical observation).
*   Define the scope of your essay.

### ❌ DON'Ts
*   Don't define simple terms like "Democracy is..." (it's too basic).
*   Don't make vague claims without a stance.
*   Don't make the introduction too short.
    `,
    "Paragraph Body: Unity, Coherence & Flow": `
# Paragraph Body: Unity & Coherence
paragraphs are the "Organic Cells" of your essay. Each must be healthy for the essay to survive.

### 💡 Experienced Guidance
*   **The PEEL Method:** Point (Topic Sentence), Explanation, Evidence (Stats/Facts), Link (connect to the next paragraph).
*   **Signposting:** Use effective transition words at the start of paragraphs to "tell" the examiner you are moving from a cause to an effect.

### ✅ DOs
*   Stick to **One Idea per Paragraph**.
*   Use transition signals like "Notwithstanding," "In a similar vein," or "Conversely."
*   Link the topic sentence back to your Thesis Statement.

### ❌ DON'Ts
*   Don't write paragraphs that span 2 pages (keep them to 150-200 words).
*   Don't use repetitive connectors (like "Also," "And," "Very").
*   Don't leave a paragraph without evidence.
    `,
    "Evidence, Data & Analytical Reasoning": `
# Evidence, Data & Analytical Reasoning
This is where you prove you are ready to be a CSP officer. You need to show you know your files.

### 💡 Experienced Guidance
*   **Source Authority:** Instead of "Studies show," say "According to the World Bank's 2023 Human Capital Index..."
*   **Analytical depth:** Don't just list facts. Explain *why* a salt-water intrusion in the Indus delta impacts the national GDP.

### ✅ DOs
*   Refer to the Constitution of Pakistan (e.g., Article 25-A, Article 37).
*   Quote international bodies (UNICEF, IMF, FAO).
*   Use "Analytical verbs" (Explains, Indicates, Underscores, Validates).

### ❌ DON'Ts
*   Don't use fake statistics; examiners often know the real ranges.
*   Don't use "I think" or "In my opinion" (Subjectivity is the enemy of academic writing).
*   Don't use single-source evidence.
    `,
    "Conclusion and Synthesis of Arguments": `
# Conclusion & Synthesis
The conclusion is your "Final Handshake." Make it firm, memorable, and visionary.

### 💡 Experienced Guidance
*   **The Synthesis:** Do not summarize. Synthesize. Show how your arguments have collectively proven your thesis.
*   **Futuristic Vision:** FPSC loves "Rational Optimism." End with a vision of how Pakistan/The World can overcome the challenge.

### ✅ DOs
*   End on a high-vocabulary, impactful "Closing Quote" or statement.
*   Summarize your main arguments in a fresh, consolidated way.
*   Reiterate the urgency of the matter.

### ❌ DON'Ts
*   Don't introduce a **NEW** point in the conclusion.
*   Don't end on a pessimistic or hopeless note.
*   Don't make the conclusion a word-for-word copy of the introduction.
    `
  };

  const ESSAY_DOMAINS = [
    { name: "Socio-Economic Challenges", icon: <TrendingUp size={20} /> },
    { name: "Governance & Political Landscape", icon: <Shield size={20} /> },
    { name: "Education & Social Reforms", icon: <GraduationCap size={20} /> },
    { name: "Science, AI & Digital Future", icon: <Cpu size={20} /> },
    { name: "Environment & Climate Crisis", icon: <Zap size={20} /> },
    { name: "Women Empowerment & Gender Issue", icon: <Users size={20} /> },
    { name: "Global Issues & Foreign Policy", icon: <Globe size={20} /> },
    { name: "Philosophical & Abstract Themes", icon: <Sparkles size={20} /> }
  ];

  const OFFICIAL_ESSAY_TEXT = `
# Official FPSC Syllabus: English Essay

**Marks: 100** | **Time Allowed: 3 Hours**

Candidates will be required to write one or more Essay in English. A wide range of topics will be given. 

### Expected Competencies:
Candidates are expected to reflect comprehensive and research based knowledge on a selected topic. The candidate’s articulation, expression and technical treatment of the style of English Essay writing will be examined.

### Typical Essay Categories (Selection of One):
Candidates are usually presented with 10 distinct topics from which they must choose one (or sometimes more, depending on examiner variation). These topics generally fall into these crucial domains:

1.  **Socio-Economic Challenges**: 
    *   *Examples:* Economic instability, Poverty alleviation, Energy crisis, and Sustainable development.
2.  **Governance & Political Landscape**: 
    *   *Examples:* Future of Democracy in Pakistan, Accountability, Constitutional challenges, and Civil-Military relations.
3.  **Social Infrastructure**: 
    *   *Examples:* Education system reforms, Women empowerment, Population explosion, and Health sector crises.
4.  **Scientific & Technological Trends**: 
    *   *Examples:* Impact of Artificial Intelligence, Social Media and Privacy, The Digital Economy, and Cyber Warfare.
5.  **Environmental & Global Issues**: 
    *   *Examples:* Global Warming/Climate Change, The Water Crisis (Kalabagh Dam etc.), and Globalization.
6.  **Philosophical & Literary Themes**: 
    *   *Examples:* "Is Truth a rare commodity?", "The Role of Literature in Social Change", and complex psychological/abstract prompts.
7.  **International Relations**: 
    *   *Examples:* US-China rivalry, The role of UN/OIC, Foreign Policy of Pakistan, and Global pandemics.

### Marking Criteria (Standard FPSC Practice):
1. **Outline (10-15 Marks):** Logical structure, comprehensive coverage of dimensions.
2. **Grammar & Expression (20 Marks):** Sentence structure, vocabulary, punctuation, and academic tone.
3. **Content (40 Marks):** Relevancy of arguments, use of facts/figures, and analytical depth.
4. **Conclusion (10 Marks):** Synthesis of arguments and a futuristic/optimistic closing.

### Examiner's Advice:
*   **Logical Coherence:** Maintain unity of thought from the Introduction to the Conclusion.
*   **Analytical Depth:** Avoid generic statements; provide data-backed insights.
*   **Objectivity:** Maintain a balanced and professional viewpoint.
*   **English Proficiency:** Correct grammar, punctuation, and spelling are non-negotiable foundations.
  `;

  const [showOfficialSyllabus, setShowOfficialSyllabus] = useState(false);
  const [showEssayGuide, setShowEssayGuide] = useState(false);

  const ESSAY_WRITING_GUIDE = `
# The Anatomy of a CSS Essay: Structural Masterclass

A high-scoring CSS essay (2,500 – 3,000 words) is a test of your **articulation, logical coherence, and research-based knowledge**. It must follow a strict academic hierarchy.

---

## Part I: The Outline (The Skeleton)
The Outline is the most critical part of your essay. It allows the examiner to understand your entire argument in 2 minutes.

*   **Structure:** Use Roman Numerals (I, II, III) for main headings and alphabets (a, b, c) or numbers (1, 2, 3) for sub-points.
*   **Format:** Stick to "Phrase-form" headlines (e.g., *Socio-economic implications of the energy crisis*).
*   **Logical Flow:** Your outline must reflect a sequence: 
    1. Introduction 
    2. Context/Background 
    3. The Arguments (Pros/Cons) 
    4. Challenges/Hurdles 
    5. The Way Forward (Solutions) 
    6. Conclusion.

---

## Part II: The Introduction (The Hook & Stance)
An effective introduction (approx. 250-300 words) acts as a gateway to your thoughts.

1.  **The Hook:** Start with a broad, impactful statement, a startling fact, or a deep philosophical quote related to the topic.
2.  **Contextual Background:** Gradually narrow down from the global/broad context to the specific issue at hand.
3.  **The Thesis Statement (Crucial):** This is the core of your essay. It is a 2-3 line summary of your central argument. If your thesis is weak, the essay fails. It must be clear, assertive, and comprehensive.

---

## Part III: Body Paragraph Mechanics (The "Unity" Rule)
Each paragraph must be a self-contained unit that proves one single point.

*   **Topic Sentence:** Every paragraph must begin with a clear topic sentence that introduces the main idea of that paragraph.
*   **Expansion & Evidence:** Follow the topic sentence with logical reasoning and **solid evidence** (Data from World Bank, IMF, UN reports, or constitutional references).
*   **Analytical Depth:** Do not just state facts; explain *why* they matter in the context of your thesis.
*   **Transition Sentence:** End the paragraph by linking it to the next one to maintain "Flow."

---

## Part IV: Maintaining the "Golden Thread" (Coherence)
Coherence is the logical "bridge" between your ideas. 

*   **Connectors:** Use transition words (e.g., *Furthermore, Conversely, In the final analysis, Notwithstanding*) at the beginning of paragraphs to show the relationship between different arguments.
*   **Unity of Thought:** Ensure that every single paragraph refers back to your **Thesis Statement**. If a point doesn't support your thesis, delete it.

---

## Part V: The Way Forward (The Rational Optimist)
CSS examiners look for problem-solvers. In this section:
*   Avoid generic suggestions (e.g., "Government should do X").
*   Provide **specific, phased solutions** (Short-term vs. Long-term).
*   Propose institutional, legal, and social reforms.

---

## Part VI: The Conclusion (The Synthesis)
The conclusion is **not** a summary; it is a synthesis.

*   **Restate Thesis:** Briefly remind the examiner of your stance in different words.
*   **Summarize Arguments:** Re-emphasize the most powerful points you made.
*   **Futuristic Closing:** End on a visionary, high-vocabulary, and optimistic note that leaves a lasting impression of intellectual maturity.

---

## Technical Checklists for FPSC Success:
*   **Relevancy:** Is every word addressing the specific topic assigned? (Avoid "beating about the bush").
*   **Expression:** Use academic vocabulary, but avoid "flowery" or overly poetic language. Be precise.
*   **Grammar:** Zero tolerance for punctuation errors, subject-verb disagreement, or spelling mistakes.
*   **Objectivity:** Maintain a balanced, professional, and non-biased viewpoint (avoid extreme religious or political rhetoric).
`;

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('action') === 'history') {
      setTestSelectionType('history');
      setShowGlobalHistory(true);
      
      const unsubscribe = auth.onAuthStateChanged((user) => {
        if (user) {
          fetchHistory(true);
        }
      });
      return () => unsubscribe();
    }
  }, [location.search, subject?.id]);

  useEffect(() => {
    // Reset all states when subject changes
    setSyllabusTopics([]);
    setSelectedTopic(null);
    setTopicGuidance(null);
    setTopicTest(null);
    setTopicNotes(null);
    setEvaluationResult(null);
    setErrorStatus(null);
    setSelectedEssayDomain(null);
    setEssayDomainTopics([]);
    setExpandedTechnique(null);
    setExpandedTopic(null);
    setTopicMCQs([]);
    setUserAnswers({});
    setCustomEssayTopic("");
    setOpenedFromHistory(false);

    if (subject) {
      if (subject.id === 'english-essay') {
        setSyllabusTopics(ESSAY_SYLLABUS);
      } else if (subject.id === 'english-precis') {
        setSyllabusTopics(PRECIS_SYLLABUS);
      } else if (subject.id === 'general-science-ability') {
        setSyllabusTopics(GSA_SYLLABUS);
      } else if (subject.id === 'pakistan-affairs') {
        setSyllabusTopics(PAK_AFFAIRS_SYLLABUS);
      } else if (subject.id === 'current-affairs') {
        setSyllabusTopics(CURRENT_AFFAIRS_SYLLABUS);
      } else if (subject.id === 'islamic-studies') {
        setSyllabusTopics(ISLAMIC_STUDIES_SYLLABUS);
      } else {
        const fetchSyllabus = async () => {
          setLoadingSyllabus(true);
          try {
            const topics = await getSyllabusBreakdown(subject.name);
            setSyllabusTopics(topics);
          } catch (e) {
            // Error handled in service safely
          } finally {
            setLoadingSyllabus(false);
          }
        };
        fetchSyllabus();
      }
    }
  }, [subject]);

  const handleDomainSelect = async (domainName: string) => {
    setSelectedEssayDomain(domainName);
    setLoadingDomainTopics(true);
    setErrorStatus(null);

    try {
      const topics = await getEssayTopicsForDomain(domainName);
      setEssayDomainTopics(topics);
    } catch (e: any) {
      console.error(e);
      setErrorStatus("Failed to load topics for this domain. Please try again.");
    } finally {
      setLoadingDomainTopics(false);
    }
  };

  const fetchNotes = async (topic: string) => {
    setLoadingTopicData(true);
    setErrorStatus(null);
    try {
      const pastNotes = historyItems.find(h => h.topic === topic && h.type === 'notes');
      if (pastNotes && !isErrorMessage(pastNotes.data.content)) {
        setTopicNotes(pastNotes.data.content);
        setLoadingTopicData(false);
        return;
      }

      const notes = await getFullTopicNotes(subject!.name, topic);
      setTopicNotes(notes);
      await saveTestToHistory('notes', { content: notes }, topic);
    } catch (e: any) {
      console.error(e);
      setErrorStatus("Could not fetch topic notes. Please try again.");
    } finally {
      setLoadingTopicData(false);
    }
  };

  const fetchMCQs = async (topic: string, count: number) => {
    setLoadingMCQs(true);
    setUserAnswers({});
    setCurrentMCQIndex(0);
    try {
      const mcqs = await getTopicMCQs(subject!.name, topic, count);
      setTopicMCQs(mcqs);
      // Save objective test to history
      await saveTestToHistory('objective', { mcqs }, topic);
    } catch (e: any) {
      console.error(e);
      setErrorStatus("Could not fetch MCQs. Please try again.");
    } finally {
      setLoadingMCQs(false);
    }
  };

  const handleMCQCountChange = (topic: string, count: number) => {
    setMcqCount(count);
    fetchMCQs(topic, count);
  };

  const downloadTopicAsPDF = (title: string, content: string | null) => {
    if (!content) return;
    const doc = new jsPDF();
    const margin = 15;
    const width = 180;
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text(title, margin, 20);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    
    // Split text into lines
    const splitText = doc.splitTextToSize(content, width);
    
    let y = 30;
    const pageHeight = doc.internal.pageSize.height;
    
    splitText.forEach((line: string) => {
      if (y > pageHeight - 20) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, margin, y);
      y += 6;
    });
    
    doc.save(`${title.replace(/\s+/g, '_')}.pdf`);
  };

  const saveTestToHistory = async (type: 'subjective' | 'objective' | 'guidance' | 'evaluation' | 'notes', data: any, topicName?: string) => {
    if (!auth.currentUser || !subject) return;
    const topic = topicName || selectedTopic;
    if (!topic) return;
    
    try {
      await addDoc(collection(db, 'userProfiles', auth.currentUser.uid, 'testHistory'), {
        userId: auth.currentUser.uid,
        subjectId: subject.id,
        subjectName: subject.name,
        topic: topic,
        type,
        data,
        createdAt: serverTimestamp()
      });
    } catch (e: any) {
      console.error("Save history error:", e);
      handleFirestoreError(e, OperationType.WRITE, `userProfiles/${auth.currentUser.uid}/testHistory`);
    }
  };

  const fetchHistory = async (global = false) => {
    if (!auth.currentUser || !subject) return;
    if (!global && !selectedTopic) return;
    
    setLoadingHistory(true);
    try {
      let q;
      if (global) {
        q = query(
          collection(db, 'userProfiles', auth.currentUser.uid, 'testHistory'),
          where('subjectId', '==', subject.id)
        );
      } else {
        q = query(
          collection(db, 'userProfiles', auth.currentUser.uid, 'testHistory'),
          where('subjectId', '==', subject.id),
          where('topic', '==', selectedTopic)
        );
      }
      
      const snapshot = await getDocs(q);
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
      
      // Manual sort
      items.sort((a: any, b: any) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
        return timeB - timeA;
      });

      setHistoryItems(items);
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, 'testHistory');
    } finally {
      setLoadingHistory(false);
    }
  };

  const goToNextSyllabusTopic = () => {
    const list = subject?.id === 'english-essay' ? essayDomainTopics : syllabusTopics;
    if (!selectedTopic || list.length === 0) return;
    const currentIndex = list.indexOf(selectedTopic);
    if (currentIndex !== -1 && currentIndex < list.length - 1) {
      handleTopicClick(list[currentIndex + 1]);
    } else {
      setSelectedTopic(null);
    }
  };

  const generateNextTest = async () => {
    if (!selectedTopic) return;
    setLoadingNewTest(true);
    setErrorStatus(null);
    try {
      const test = await getPastPaperStyleTest(subject!.name, selectedTopic);
      setTopicTest(test);
      setActiveTab('test');
      setShowTopicMCQs(false);
      // Save to history
      await saveTestToHistory('subjective', { content: test });
    } catch (e: any) {
      console.error(e);
      setErrorStatus("Failed to generate next test. Please try again.");
    } finally {
      setLoadingNewTest(false);
    }
  };

  const startMCQsInModal = async (count: number = mcqCount) => {
    if (!selectedTopic) return;
    setLoadingNewMcqs(true);
    setSubjectMcqs([]);
    setSubjectMcqAnswers({});
    setCurrentSubjectMcqIdx(0);
    setShowTopicMCQs(true);
    setErrorStatus(null);
    try {
      const mcqs = await getTopicMCQs(subject!.name, selectedTopic, count);
      setSubjectMcqs(mcqs);
      // Save to history
      await saveTestToHistory('objective', { mcqs });
    } catch (e: any) {
      console.error(e);
      setErrorStatus("Failed to load MCQs. Please try again.");
    } finally {
      setLoadingNewMcqs(false);
    }
  };

  const handleSelectOption = (qIdx: number, option: string) => {
    if (userAnswers[qIdx]) return; // Prevent changing answer after selection
    setUserAnswers(prev => ({ ...prev, [qIdx]: option }));
  };

  const handleTopicClick = async (topic: string) => {
    if (ESSAY_TECHNIQUE_DETAILS[topic]) {
      setExpandedTechnique(topic === expandedTechnique ? null : topic);
      if (expandedTechnique !== topic) {
        // Smooth scroll to the expanded section
        setTimeout(() => {
          const element = document.getElementById('expanded-technique');
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      }
      return;
    }

    // Inline expansion for English Essay domain topics
    if (subject?.id === 'english-essay' && selectedEssayDomain) {
      if (expandedTopic === topic) {
        setExpandedTopic(null);
        return;
      }
      setExpandedTopic(topic);
      setLoadingTopicData(true);
      setTopicGuidance(null);
      setTopicTest(null);
      setTopicNotes(null);
      setTopicMCQs([]);
      setCurrentMCQIndex(0);
      setUserAnswers({});
      setEvaluationResult(null);
      setErrorStatus(null);
      setExpandedTopicTab('guidance');
      
      // Smooth scroll to the expanded section
      setTimeout(() => {
        const element = document.getElementById('expanded-topic-area');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);

      try {
        // AI Optimization: Check history first
        const pastGuidance = historyItems.find(h => h.topic === topic && h.type === 'guidance');
        const pastTest = historyItems.find(h => h.topic === topic && h.type === 'subjective');
        const pastNotes = historyItems.find(h => h.topic === topic && h.type === 'notes');

        if (pastGuidance && pastTest && pastNotes && !isErrorMessage(pastGuidance.data.content) && !isErrorMessage(pastTest.data.content) && !isErrorMessage(pastNotes.data.content)) {
          setTopicGuidance(pastGuidance.data.content);
          setTopicTest(pastTest.data.content);
          setTopicNotes(pastNotes.data.content);
          setLoadingTopicData(false);
          return;
        }

        const [guidanceResult, testResult, notesResult] = await Promise.allSettled([
          getTopicGuidance(subject!.name, topic),
          new Promise<string>(resolve => setTimeout(resolve, 500)).then(() => getPastPaperStyleTest(subject!.name, topic)),
          new Promise<string>(resolve => setTimeout(resolve, 1000)).then(() => getFullTopicNotes(subject!.name, topic))
        ]);

        const guidance = guidanceResult.status === 'fulfilled' ? guidanceResult.value : (pastGuidance?.data?.content || null);
        const test = testResult.status === 'fulfilled' ? testResult.value : (pastTest?.data?.content || null);
        const notes = notesResult.status === 'fulfilled' ? notesResult.value : (pastNotes?.data?.content || null);
        
        setTopicGuidance(guidance);
        setTopicTest(test);
        setTopicNotes(notes);
        
        // Save initial test and guidance to history
        if (guidance && (!pastGuidance || isErrorMessage(pastGuidance.data.content))) {
          await saveTestToHistory('guidance', { content: guidance }, topic);
        }
        if (test && (!pastTest || isErrorMessage(pastTest.data.content))) {
          await saveTestToHistory('subjective', { content: test }, topic);
        }
        if (notes && (!pastNotes || isErrorMessage(pastNotes.data.content))) {
          await saveTestToHistory('notes', { content: notes }, topic);
        }
      } catch (e: any) {
        console.error(e);
        setErrorStatus("Could not fetch topic details. Please try again.");
      } finally {
        setLoadingTopicData(false);
      }
      return;
    }

    setSelectedTopic(topic);
    setLoadingTopicData(true);
    setTopicGuidance(null);
    setTopicTest(null);
    setTopicNotes(null);
    setEvaluationResult(null);
    setErrorStatus(null);
    setActiveTab('guidance');
    setShowTopicMCQs(false);
    setShowPracticeSelector(false);
    setTestSelectionType('subjective');
    setSubjectMcqs([]);
    setSubjectMcqAnswers({});
    setCurrentSubjectMcqIdx(0);

    try {
      // AI Optimization: Check history first
      const pastGuidance = historyItems.find(h => h.topic === topic && h.type === 'guidance');
      const pastTest = historyItems.find(h => h.topic === topic && h.type === 'subjective');
      const pastNotes = historyItems.find(h => h.topic === topic && h.type === 'notes');

      if (pastGuidance && pastTest && pastNotes && !isErrorMessage(pastGuidance.data.content) && !isErrorMessage(pastTest.data.content) && !isErrorMessage(pastNotes.data.content)) {
        setTopicGuidance(pastGuidance.data.content);
        setTopicTest(pastTest.data.content);
        setTopicNotes(pastNotes.data.content);
        setLoadingTopicData(false);
        return;
      }

      if (ESSAY_TECHNIQUE_DETAILS[topic]) {
        // Pre-defined guidance for core techniques
        setTopicGuidance(ESSAY_TECHNIQUE_DETAILS[topic]);
        // No test practice for core techniques as requested
        setTopicTest(null);
        setTopicNotes(null);
        // Save to history
        await saveTestToHistory('guidance', { content: ESSAY_TECHNIQUE_DETAILS[topic] }, topic);
      } else {
        const [guidanceResult, testResult, notesResult] = await Promise.allSettled([
          getTopicGuidance(subject!.name, topic),
          new Promise<string>(resolve => setTimeout(resolve, 500)).then(() => getPastPaperStyleTest(subject!.name, topic)),
          new Promise<string>(resolve => setTimeout(resolve, 1000)).then(() => getFullTopicNotes(subject!.name, topic))
        ]);

        const guidance = guidanceResult.status === 'fulfilled' ? guidanceResult.value : (pastGuidance?.data?.content || null);
        const test = testResult.status === 'fulfilled' ? testResult.value : (pastTest?.data?.content || null);
        const notes = notesResult.status === 'fulfilled' ? notesResult.value : (pastNotes?.data?.content || null);

        setTopicGuidance(guidance);
        setTopicTest(test);
        setTopicNotes(notes);
        
        // Save initial test and guidance to history
        if (guidance && (!pastGuidance || isErrorMessage(pastGuidance.data.content))) {
          await saveTestToHistory('guidance', { content: guidance }, topic);
        }
        if (test && (!pastTest || isErrorMessage(pastTest.data.content))) {
          await saveTestToHistory('subjective', { content: test }, topic);
        }
        if (notes && (!pastNotes || isErrorMessage(pastNotes.data.content))) {
          await saveTestToHistory('notes', { content: notes }, topic);
        }
      }
    } catch (e: any) {
      console.error(e);
      if (e.message?.includes("AI_LIMIT")) {
        setErrorStatus(e.message.replace("AI_LIMIT: ", ""));
      } else {
        setErrorStatus("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoadingTopicData(false);
    }
  };

  const downloadAsPDF = () => {
    if (!evaluationResult) return;
    const doc = new jsPDF();
    const margin = 15;
    const width = 180;
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text(`CSS Evaluation: ${selectedTopic || 'General Topic'}`, margin, 20);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    
    // Split text into lines for PDF
    const splitText = doc.splitTextToSize(evaluationResult, width);
    
    let y = 30;
    const pageHeight = doc.internal.pageSize.height;
    
    splitText.forEach((line: string) => {
      if (y > pageHeight - 20) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, margin, y);
      y += 6;
    });
    
    doc.save(`CSS_Evaluation_${(selectedTopic || 'result').replace(/\s+/g, '_')}.pdf`);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (files.length > 10) {
      setErrorStatus("Maximum 10 items (images/PDFs) allowed at once to ensure AI processing succeeds.");
      return;
    }

    setUploadingImage(true);
    setActiveTab('evaluation');
    setEvaluationResult(null);
    setErrorStatus(null);

    try {
      const fileData = await Promise.all(
        files.map((file) => {
          return new Promise<{ data: string, mimeType: string }>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const result = reader.result as string;
              resolve({
                data: result,
                mimeType: file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg')
              });
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        })
      );

      const topicToEvaluate = customEssayTopic || selectedTopic || expandedTopic || (selectedEssayDomain ? `${selectedEssayDomain} Essay` : undefined);
      const result = await evaluateHandwriting(fileData, subject!.name, topicToEvaluate);
      setEvaluationResult(result);
      
      // Save evaluation to history
      if (result) {
        await saveTestToHistory('evaluation', { content: result }, topicToEvaluate || "Essay Evaluation");
      }
      
      if (!selectedTopic) {
        setSelectedTopic(topicToEvaluate || "General Essay Evaluation");
        setActiveTab('evaluation');
      }
    } catch (error: any) {
      console.error("Evaluation failed", error);
      if (error.message?.includes("QUOTA_EXCEEDED")) {
        setErrorStatus(error.message.replace("QUOTA_EXCEEDED: ", ""));
      } else if (error.message?.includes("403") || error.message?.includes("permission")) {
        setErrorStatus("AI access was denied. This can happen if the files are too large or the server is busy.");
      } else {
        setErrorStatus("Sorry, I couldn't process the files. Please ensure they are clear and try again.");
      }
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (!subject) return <div>Subject not found</div>;

  return (
    <>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <Link to="/subjects" className="inline-flex items-center gap-2 text-sm font-bold opacity-40 hover:opacity-100 transition-opacity mb-8">
        <ArrowLeft size={16} /> Back to Curriculum
      </Link>

      <header className="mb-12">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <span className={`text-[10px] uppercase font-black tracking-widest px-2 py-1 rounded-lg ${subject.isCompulsory ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
            {subject.isCompulsory ? 'Compulsory Foundation' : subject.group}
          </span>
          <span className="text-[10px] uppercase font-black tracking-widest px-2 py-1 bg-gray-100 text-gray-500 rounded-lg">FPSC Module</span>
        </div>
        <h1 className="text-5xl font-serif font-black italic mb-6 leading-tight">{subject.name}</h1>
        <p className="text-xl opacity-60 leading-relaxed max-w-3xl">
          {subject.description}
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-12">
          {/* Syllabus Section */}
          <section>
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-serif italic font-bold">
                Official Syllabus & AI Practice
              </h3>
              <div className="flex items-center gap-4">
                {subject.id === 'english-essay' && (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setShowOfficialSyllabus(!showOfficialSyllabus)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${showOfficialSyllabus ? 'bg-[#141414] text-white' : 'bg-white border border-[#141414]/10 opacity-60 hover:opacity-100'}`}
                    >
                      <BookOpen size={14} /> {showOfficialSyllabus ? 'Hide Official Syllabus' : 'View Official Syllabus'}
                    </button>
                  </div>
                )}
                {loadingSyllabus && <Loader2 className="animate-spin opacity-40" size={20} />}
              </div>
            </div>
            
            <AnimatePresence>
              {showOfficialSyllabus && subject.id === 'english-essay' && (
                <motion.div
                  key="official-syllabus-section"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden mb-4"
                >
                  <div className="p-8 bg-blue-50 border border-blue-200 rounded-[2.5rem] markdown-body">
                    <ReactMarkdown>{OFFICIAL_ESSAY_TEXT}</ReactMarkdown>
                  </div>
                </motion.div>
              )}

              {subject.id === 'english-essay' && (
                <motion.div 
                  key="essay-master-entry"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-12"
                >
                  {!showEssayGuide ? (
                    <div 
                      onClick={() => setShowEssayGuide(true)}
                      className="p-10 bg-blue-600 text-white rounded-[3rem] relative overflow-hidden group cursor-pointer shadow-2xl transition-all hover:-translate-y-1"
                    >
                      <div className="relative z-10 max-w-2xl">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center mb-8">
                          <GraduationCap size={32} className="text-white" />
                        </div>
                        <h3 className="text-4xl font-serif italic mb-4 font-bold">Master Essay Writing</h3>
                        <p className="text-lg opacity-80 mb-8 leading-relaxed">
                          Master the anatomy of a high-scoring essay. Learn how to write the Outline, Thesis Statement, and Body paragraphs like a topper with our comprehensive academic guide.
                        </p>
                        <div className="inline-flex py-4 px-8 bg-white text-blue-600 rounded-2xl font-black uppercase tracking-widest text-xs group-hover:bg-blue-50 transition-all shadow-xl">
                          Start Masterclass Now
                        </div>
                      </div>
                      <div className="absolute right-0 top-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 group-hover:scale-125 transition-transform duration-700" />
                    </div>
                  ) : (
                    <div key="essay-masterclass-section" className="space-y-12">
                      <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                            <GraduationCap size={24} />
                          </div>
                          <h3 className="text-2xl font-serif italic font-bold">Master Essay Writing</h3>
                        </div>
                        <button 
                          onClick={() => setShowEssayGuide(false)}
                          className="px-6 py-3 bg-[#141414] text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                        >
                          Close Masterclass
                        </button>
                      </div>
                      
                      <motion.div
                        key="essay-writing-guide-content"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="space-y-12"
                      >
                        {/* Anatomy of Essay */}
                        <div className="p-8 lg:p-12 bg-white border border-blue-600/20 rounded-[3rem] shadow-xl shadow-blue-600/5 relative">
                          <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-bold">
                              1
                            </div>
                            <h3 className="text-2xl font-serif italic font-bold">The Anatomy of a CSS Essay</h3>
                          </div>
                          <div className="markdown-body prose prose-blue prose-headings:font-serif prose-headings:italic max-w-none">
                            <ReactMarkdown>{ESSAY_WRITING_GUIDE}</ReactMarkdown>
                          </div>
                        </div>

                        {/* Core Techniques Grid */}
                        <div className="p-8 lg:p-12 bg-gray-50 border border-gray-200 rounded-[3rem]">
                          <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center">
                              <Zap size={24} />
                            </div>
                            <h3 className="text-2xl font-serif italic font-bold">Core Writing Techniques</h3>
                          </div>

                          <AnimatePresence>
                            {expandedTechnique && (
                              <motion.div
                                key={`expanded-${expandedTechnique}`}
                                id="expanded-technique"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mb-12 -mx-8 sm:mx-0 overflow-hidden"
                              >
                                <div className="relative p-6 sm:p-12 bg-white border-y sm:border border-blue-600/20 rounded-none sm:rounded-[3rem] shadow-xl shadow-blue-600/5 markdown-body prose prose-blue prose-headings:font-serif prose-headings:italic max-w-none">
                                  <button 
                                    onClick={() => setExpandedTechnique(null)}
                                    className="absolute top-4 right-4 sm:top-8 sm:right-8 p-3 hover:bg-gray-100 rounded-full transition-colors z-10 text-gray-400 hover:text-black"
                                  >
                                    <X size={20} />
                                  </button>
                                  <ReactMarkdown>{ESSAY_TECHNIQUE_DETAILS[expandedTechnique]}</ReactMarkdown>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {ESSAY_SYLLABUS.map((topic, idx) => (
                              <button
                                key={`technique-${idx}`}
                                onClick={() => handleTopicClick(topic)}
                                className={`group relative p-8 bg-white border ${expandedTechnique === topic ? 'border-blue-600 shadow-xl' : 'border-[#141414]/10'} rounded-[2.5rem] hover:border-[#141414] hover:shadow-2xl transition-all text-left overflow-hidden h-full flex flex-col`}
                              >
                                <span className="text-[10px] font-black opacity-20 group-hover:opacity-100 transition-opacity mb-4">TECHNIQUE 0{idx + 1}</span>
                                <h4 className={`font-serif italic font-bold text-lg mb-6 ${expandedTechnique === topic ? 'text-blue-600' : 'group-hover:text-purple-600'} flex-1`}>{topic}</h4>
                                <div className="flex gap-2">
                                  <div className="px-3 py-1 bg-gray-50 rounded-lg text-[8px] font-black uppercase tracking-widest opacity-40 group-hover:opacity-100 group-hover:bg-purple-50 group-hover:text-purple-600">Guidance</div>
                                  <div className="px-3 py-1 bg-gray-50 rounded-lg text-[8px] font-black uppercase tracking-widest opacity-40 group-hover:opacity-100 group-hover:bg-blue-50 group-hover:text-blue-600">Dos/Donts</div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Keep Domain Selector visible on main page */}
              {subject.id === 'english-essay' && (
                <div key="essay-domain-selector-section" className="p-8 lg:p-12 bg-purple-50/50 border border-purple-200 rounded-[3rem] mb-12">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center">
                        <Sparkles size={24} />
                      </div>
                      <h3 className="text-2xl font-serif italic font-bold">Select Your Essay Domain</h3>
                    </div>
                    {loadingDomainTopics && <Loader2 className="animate-spin text-purple-600" size={24} />}
                  </div>

                  <div className="max-w-2xl mx-auto">
                    <div className="relative group">
                      <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-[2rem] blur opacity-20 group-hover:opacity-40 transition"></div>
                      <div className="relative p-8 bg-white border border-purple-100 rounded-[2rem]">
                        <p className="text-sm opacity-50 mb-6 text-center italic">Choose your specialized area to see high-yield FPSC targets</p>
                        <select 
                          onChange={(e) => {
                            handleDomainSelect(e.target.value);
                            setExpandedTopic(null);
                          }}
                          value={selectedEssayDomain || ""}
                          className="w-full p-5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-purple-600 transition-all font-bold text-lg appearance-none cursor-pointer text-center"
                        >
                          <option value="" disabled>Select Official Essay Domain...</option>
                          {ESSAY_DOMAINS.map((domain) => (
                            <option key={`domain-opt-${domain.name}`} value={domain.name}>{domain.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {expandedTopic && (
                      <motion.div
                        id="expanded-topic-area"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="mb-8 -mx-8 sm:mx-0 overflow-hidden"
                      >
                        <div className="relative bg-white border-y-2 sm:border-2 border-purple-600 rounded-none sm:rounded-[3rem] shadow-2xl overflow-hidden">
                          {/* Expanded Header */}
                          <div className="p-6 sm:p-8 border-b border-gray-100 bg-purple-50 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="p-3 bg-purple-600 text-white rounded-2xl">
                                <Sparkles size={20} />
                              </div>
                              <div>
                                <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Topic Masterclass</span>
                                <h4 className="text-xl sm:text-2xl font-serif italic font-bold">{expandedTopic}</h4>
                              </div>
                            </div>
                            <button 
                              onClick={() => setExpandedTopic(null)}
                              className="p-3 hover:bg-white rounded-full transition-colors text-gray-400 hover:text-black"
                            >
                              <X size={20} />
                            </button>
                          </div>

                          {/* Quick Icons/Tabs Bar */}
                          <div className="flex bg-white border-b border-gray-100 px-4 sm:px-8 overflow-x-auto no-scrollbar">
                            <button 
                              onClick={() => {
                                setExpandedTopicTab('notes');
                                if (!topicNotes) fetchNotes(expandedTopic!);
                              }}
                              className={`py-4 px-4 sm:px-6 text-[10px] sm:text-xs font-black uppercase tracking-widest flex items-center gap-2 border-b-2 transition-all shrink-0 ${expandedTopicTab === 'notes' ? 'border-purple-600 text-purple-600' : 'border-transparent opacity-40 hover:opacity-100'}`}
                            >
                              <FileText size={14} /> Full Notes
                            </button>
                            <button 
                              onClick={() => setExpandedTopicTab('guidance')}
                              className={`py-4 px-4 sm:px-6 text-[10px] sm:text-xs font-black uppercase tracking-widest flex items-center gap-2 border-b-2 transition-all shrink-0 ${expandedTopicTab === 'guidance' ? 'border-purple-600 text-purple-600' : 'border-transparent opacity-40 hover:opacity-100'}`}
                            >
                              <BookOpen size={14} /> Detailed Material
                            </button>
                            <button 
                              onClick={() => {
                                setExpandedTopicTab('mcqs');
                                if (topicMCQs.length === 0) fetchMCQs(expandedTopic!, mcqCount);
                              }}
                              className={`py-4 px-4 sm:px-6 text-[10px] sm:text-xs font-black uppercase tracking-widest flex items-center gap-2 border-b-2 transition-all shrink-0 ${expandedTopicTab === 'mcqs' ? 'border-purple-600 text-purple-600' : 'border-transparent opacity-40 hover:opacity-100'}`}
                            >
                              <CheckSquare size={14} /> Practice MCQs
                            </button>
                          </div>

                          {/* Content Area */}
                          <div className="p-6 sm:p-8 lg:p-12 min-h-[300px]">
                            {loadingTopicData || loadingMCQs ? (
                              <div className="flex flex-col items-center justify-center py-20 text-center">
                                <Loader2 className="animate-spin text-purple-600 mb-4" size={32} />
                                <p className="font-serif italic opacity-40">{loadingMCQs ? 'Generating special MCQs for this topic...' : 'Compiling research and practice prompts...'}</p>
                              </div>
                            ) : errorStatus ? (
                              <div className="text-center py-12 px-6">
                                <div className={`inline-flex items-center justify-center p-4 rounded-full mb-6 ${errorStatus.includes('AI_LIMIT') ? 'bg-orange-100 text-orange-600' : 'bg-red-100 text-red-600'}`}>
                                  <AlertCircle size={24} />
                                </div>
                                <h4 className="text-lg font-serif italic font-bold mb-2">
                                  {errorStatus.includes('AI_LIMIT') ? 'Service is busy' : 'Something went wrong'}
                                </h4>
                                <p className={`max-w-md mx-auto text-sm opacity-60 mb-8 leading-relaxed`}>
                                  {errorStatus.includes('AI_LIMIT') ? errorStatus.replace('AI_LIMIT: ', '') : errorStatus}
                                </p>
                                <div className="flex flex-center justify-center gap-4">
                                  <button onClick={() => {
                                    setErrorStatus(null);
                                    if (expandedTopicTab === 'mcqs') fetchMCQs(expandedTopic!, mcqCount);
                                    else handleTopicClick(expandedTopic!);
                                  }} className="px-8 py-3 bg-[#141414] text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl">Retry</button>
                                  <button onClick={() => setShowGlobalHistory(true)} className="px-8 py-3 bg-white border border-gray-200 text-gray-600 rounded-xl text-xs font-black uppercase tracking-widest hover:border-purple-600 hover:text-purple-600 transition-all">Check History</button>
                                </div>
                              </div>
                            ) : (
                              <div className="markdown-body prose prose-purple max-w-none">
                                {expandedTopicTab === 'mcqs' ? (
                                  <div className="not-prose space-y-8">
                                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                                      <div className="flex flex-col gap-1">
                                        <span className="text-xs font-black uppercase tracking-widest opacity-50">Number of MCQs</span>
                                        <span className="text-[10px] opacity-40 font-bold">Pick your test length (up to 100)</span>
                                      </div>
                                      <div className="flex items-center gap-4">
                                        <input 
                                          type="range" 
                                          min="5" 
                                          max="100" 
                                          step="5"
                                          value={mcqCount}
                                          onChange={(e) => setMcqCount(parseInt(e.target.value))}
                                          className="w-32 sm:w-48 h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                                        />
                                        <div className="flex gap-2">
                                          <span className="w-12 h-10 bg-white border border-purple-100 rounded-xl flex items-center justify-center font-bold text-purple-600 shadow-sm">
                                            {mcqCount}
                                          </span>
                                          <button
                                            onClick={() => fetchMCQs(expandedTopic!, mcqCount)}
                                            className="px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 transition-colors shadow-lg"
                                          >
                                            Generate
                                          </button>
                                        </div>
                                      </div>
                                    </div>

                                    {topicMCQs.length > 0 && (
                                      <div className="space-y-8">
                                        {/* Progress Bar */}
                                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                          <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${((currentMCQIndex + 1) / topicMCQs.length) * 100}%` }}
                                            className="h-full bg-purple-600"
                                          />
                                        </div>

                                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest opacity-40">
                                          <span>Question {currentMCQIndex + 1} of {topicMCQs.length}</span>
                                          <span>{Object.keys(userAnswers).length} Attempted</span>
                                        </div>

                                        <AnimatePresence mode="wait">
                                          <motion.div 
                                            key={`mcq-slide-${currentMCQIndex}`}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className={`p-8 bg-white border rounded-[2.5rem] transition-all shadow-sm ${!!userAnswers[currentMCQIndex] ? 'border-gray-200' : 'border-purple-100 shadow-purple-600/5'}`}
                                          >
                                            {(() => {
                                              const mcq = topicMCQs[currentMCQIndex];
                                              const selectedOption = userAnswers[currentMCQIndex];
                                              const isAnswered = !!selectedOption;

                                              return (
                                                <>
                                                  <div className="flex gap-3 mb-4">
                                                    <span className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-[10px] sm:text-xs shrink-0 shadow-sm">{currentMCQIndex + 1}</span>
                                                    <h5 className="font-bold text-sm sm:text-base leading-snug">{mcq.question}</h5>
                                                  </div>
                                                  
                                                  <div className="grid grid-cols-1 gap-1.5 sm:gap-2 ml-0 sm:ml-10">
                                                    {mcq.options.map((opt: string, optIdx: number) => {
                                                      const isCorrect = opt === mcq.correctAnswer;
                                                      const isUserSelected = opt === selectedOption;
                                                      
                                                      let stateClasses = "bg-white border-gray-100 opacity-60";
                                                      if (isAnswered) {
                                                        if (isCorrect) {
                                                          stateClasses = "bg-green-50 border-green-500 text-green-700 font-bold ring-2 ring-green-500/10";
                                                        } else if (isUserSelected) {
                                                          stateClasses = "bg-red-50 border-red-500 text-red-700 font-bold ring-2 ring-red-500/10";
                                                        }
                                                      } else {
                                                        stateClasses = "bg-gray-50 border-gray-100 hover:border-purple-300 hover:bg-white hover:shadow-sm cursor-pointer text-gray-700";
                                                      }

                                                      return (
                                                        <button 
                                                          key={optIdx} 
                                                          disabled={isAnswered}
                                                          onClick={() => handleSelectOption(currentMCQIndex, opt)}
                                                          className={`group relative p-2.5 sm:p-3 rounded-lg sm:rounded-xl border text-[10px] sm:text-xs text-left transition-all ${stateClasses} flex items-center gap-2 sm:gap-3`}
                                                        >
                                                           <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${isAnswered && isCorrect ? 'border-green-500 bg-green-500 text-white' : isAnswered && isUserSelected ? 'border-red-500 bg-red-500 text-white' : 'border-gray-200 group-hover:border-purple-400'}`}>
                                                              {isAnswered && (isCorrect || isUserSelected) && <CheckSquare size={10} />}
                                                           </div>
                                                          <span className="leading-tight">{opt}</span>
                                                        </button>
                                                      );
                                                    })}
                                                  </div>

                                                  {isAnswered && mcq.explanation && (
                                                    <motion.div 
                                                      initial={{ opacity: 0, y: 10 }}
                                                      animate={{ opacity: 1, y: 0 }}
                                                      className="mt-10 ml-0 sm:ml-14 p-6 bg-blue-50/50 border border-blue-100 rounded-2xl text-sm text-blue-800"
                                                    >
                                                      <div className="flex items-center gap-2 mb-2">
                                                        <Sparkles size={16} className="text-blue-600" />
                                                        <span className="font-black uppercase tracking-widest text-[10px]">Examiner's Reasoning</span>
                                                      </div>
                                                      <p className="italic leading-relaxed">{mcq.explanation}</p>
                                                    </motion.div>
                                                  )}
                                                </>
                                              );
                                            })()}
                                          </motion.div>
                                        </AnimatePresence>

                                        {/* Navigation */}
                                        <div className="flex items-center justify-between pt-4">
                                          <button
                                            onClick={() => setCurrentMCQIndex(prev => Math.max(0, prev - 1))}
                                            disabled={currentMCQIndex === 0}
                                            className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all ${currentMCQIndex === 0 ? 'opacity-20 cursor-not-allowed' : 'bg-white border border-gray-200 hover:border-purple-600 text-purple-600 shadow-sm'}`}
                                          >
                                            Previous
                                          </button>
                                          
                                          <div className="flex items-center gap-4">
                                            {currentMCQIndex < topicMCQs.length - 1 ? (
                                              <button
                                                onClick={() => setCurrentMCQIndex(prev => prev + 1)}
                                                className="px-10 py-4 bg-purple-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-purple-700 transition-all shadow-xl shadow-purple-600/20"
                                              >
                                                Next Question
                                              </button>
                                            ) : (
                                              <div className="p-4 bg-green-50 text-green-700 rounded-2xl text-xs font-bold flex items-center gap-2 border border-green-100">
                                                <Sparkles size={16} /> End of Practice
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <ReactMarkdown>
                                    {expandedTopicTab === 'notes' ? topicNotes || '' : expandedTopicTab === 'guidance' ? topicGuidance || '' : topicTest || ''}
                                  </ReactMarkdown>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {selectedEssayDomain && (
                      <motion.div
                        key={`domain-topics-${selectedEssayDomain}`}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4"
                      >
                        {loadingDomainTopics ? (
                          [...Array(6)].map((_, i) => (
                            <div key={`skeleton-topic-${i}`} className="h-20 bg-white/50 animate-pulse rounded-2xl border border-purple-100" />
                          ))
                        ) : (
                          essayDomainTopics.map((topic, idx) => (
                            <button
                              key={`essay-topic-${idx}`}
                              onClick={() => handleTopicClick(topic)}
                              className={`p-6 bg-white border ${expandedTopic === topic ? 'border-purple-600 shadow-xl ring-2 ring-purple-600/20' : 'border-purple-100'} rounded-2xl hover:border-purple-600 hover:shadow-lg transition-all text-left flex items-start gap-4 group`}
                            >
                              <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-all ${expandedTopic === topic ? 'bg-purple-600 text-white' : 'bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white'}`}>
                                {idx + 1}
                              </div>
                              <h5 className={`font-bold text-sm leading-snug ${expandedTopic === topic ? 'text-purple-700' : 'group-hover:text-purple-700'}`}>{topic}</h5>
                            </button>
                          ))
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

          </AnimatePresence>

          {/* Standard non-essay view or default breakdown */}
          {subject.id !== 'english-essay' && (
            <div className="space-y-4">
              <h3 className="text-xl font-serif italic font-bold mb-4 opacity-40">
                {subject.id === 'english-essay' ? 'Core Writing Techniques' : 'Detailed Module Breakdown'}
              </h3>
              {syllabusTopics.length > 0 ? (
                syllabusTopics.map((topic, idx) => (
                  <button
                    key={`syllabus-topic-${idx}`}
                    onClick={() => handleTopicClick(topic)}
                    className="w-full flex items-center justify-between p-6 bg-white border border-[#141414]/10 rounded-3xl hover:border-[#141414] hover:shadow-xl transition-all group text-left"
                  >
                    <div className="flex items-center gap-6">
                      <div className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center font-serif italic font-bold opacity-30 group-hover:bg-[#141414] group-hover:text-white group-hover:opacity-100 transition-all">
                        {String(idx + 1).padStart(2, '0')}
                      </div>
                      <div>
                        <h4 className="font-bold text-lg mb-1">{topic}</h4>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] uppercase font-black tracking-widest opacity-30 flex items-center gap-1 group-hover:opacity-100 transition-opacity">
                            <CheckSquare size={12} /> Syllabus Unit
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                      <Sparkles size={20} />
                    </div>
                  </button>
                ))
              ) : !loadingSyllabus && (
                <div className="p-20 text-center bg-gray-50 rounded-[3rem] border border-dashed border-[#141414]/10">
                  <BookOpen size={40} className="mx-auto opacity-20 mb-4" />
                  <p className="opacity-40 italic">Loading subject modules based on latest FPSC guidelines...</p>
                </div>
              )}
            </div>
          )}
        </section>
        </div>

        {/* Sidebar Actions */}
        <aside className="relative">
          <div className="sticky top-8 space-y-6">
            <div className="p-8 bg-white border border-[#141414]/10 rounded-[2.5rem] shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
                  <Brain size={24} />
                </div>
                <h3 className="text-xl font-serif italic font-bold">Mastery Roadmap</h3>
              </div>
              
              <div className="space-y-0 relative">
                <div className="absolute left-[11px] top-4 bottom-4 w-0.5 bg-gray-100" />
                
                <div className="relative flex gap-4 pb-8">
                  <div className="mt-1.5 w-6 h-6 rounded-full bg-purple-600 border-4 border-purple-100 shrink-0 z-10" />
                  <div>
                    <h4 className="text-sm font-bold">Conceptual Clarity</h4>
                    <p className="text-[10px] opacity-50 uppercase font-black tracking-widest mt-1">Foundational Material</p>
                  </div>
                </div>

                <div className="relative flex gap-4 pb-8">
                  <div className="mt-1.5 w-6 h-6 rounded-full bg-gray-200 border-4 border-white shrink-0 z-10" />
                  <div>
                    <h4 className="text-sm font-bold opacity-40">Critical Analysis</h4>
                    <p className="text-[10px] opacity-20 uppercase font-black tracking-widest mt-1">The "Why" & "How"</p>
                  </div>
                </div>

                <div className="relative flex gap-4">
                  <div className="mt-1.5 w-6 h-6 rounded-full bg-gray-200 border-4 border-white shrink-0 z-10" />
                  <div>
                    <h4 className="text-sm font-bold opacity-40">Expert Evaluation</h4>
                    <p className="text-[10px] opacity-20 uppercase font-black tracking-widest mt-1">Handwritten Assessment</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 pt-6 border-t border-gray-100">
                <div className="flex flex-col gap-1 mb-4">
                  <span className="text-[8px] font-black uppercase tracking-widest text-purple-600">Learning Records</span>
                  <p className="text-[10px] opacity-40 italic">Full history of subject practice.</p>
                </div>
                <button 
                  onClick={() => {
                    setTestSelectionType('history');
                    setShowGlobalHistory(true);
                    fetchHistory(true);
                  }}
                  className="w-full py-4 bg-gray-50 border border-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white hover:border-purple-600 hover:text-purple-600 transition-all shadow-sm group"
                >
                  <History size={16} className="text-purple-600 group-hover:scale-110 transition-transform" />
                  View Subject Logs
                </button>
              </div>
            </div>

            <div className="p-8 bg-[#141414] text-white rounded-[2.5rem] overflow-hidden">
              <div className="relative z-10">
                <div className="mb-6 space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-50 block">{subject?.id === 'english-essay' ? 'Essay Topic (Optional)' : 'Question/Topic (Optional)'}</label>
                  <input 
                    type="text"
                    placeholder="e.g. Future of Democracy in Pakistan"
                    value={customEssayTopic}
                    onChange={(e) => setCustomEssayTopic(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-400 transition-colors placeholder:opacity-30"
                  />
                </div>

                <Camera size={40} className="mb-6 text-orange-400" />
                <h3 className="text-2xl font-serif italic mb-4">{subject?.id === 'english-essay' ? 'Handwritten Essay Check' : 'Paper Checker'}</h3>
                <p className="text-sm opacity-70 mb-6 leading-relaxed">
                  Written an essay or answer on paper? Upload a photo. Our AI examiner will analyze your handwriting and content based on CSS standards.
                </p>
                
                <input 
                  type="file" 
                  multiple
                  accept="image/*,application/pdf" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  className="hidden" 
                />
                
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="w-full py-4 bg-white text-[#141414] text-center font-black uppercase tracking-widest text-xs rounded-xl hover:bg-opacity-90 transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  {uploadingImage ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />}
                  {uploadingImage ? 'Analyzing All Pages...' : (subject?.id === 'english-essay' ? 'Check Written Essay' : 'Analyze Paper')}
                </button>
              </div>
              <div className="absolute right-0 bottom-0 w-32 h-32 bg-orange-500/10 blur-3xl" />
            </div>
          </div>
        </aside>

      </div>

      {/* Topic Detail Modal */}
      <AnimatePresence>
        {selectedTopic && (
          <div className={`fixed inset-0 z-50 flex items-center justify-center ${(activeTab === 'evaluation' && evaluationResult) || (subject?.id !== 'english-essay') || openedFromHistory ? 'p-0' : 'p-4'}`}>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setSelectedTopic(null); setEvaluationResult(null); setErrorStatus(null); setOpenedFromHistory(false); }}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className={`relative bg-[#F5F5F0] shadow-2xl flex flex-col overflow-hidden transition-all duration-500 ${(activeTab === 'evaluation' && evaluationResult) || (subject?.id !== 'english-essay') || openedFromHistory ? 'w-screen h-screen rounded-none' : 'w-[95vw] lg:w-[90vw] max-w-7xl max-h-[92vh] rounded-[3rem]'}`}
            >
              <header className="p-3 md:p-6 border-b border-[#141414]/10 bg-white flex items-center justify-between gap-3">
                <div className="flex flex-row items-center gap-3 flex-1 min-w-0">
                  {openedFromHistory && (
                    <button 
                      onClick={() => {
                        setOpenedFromHistory(false);
                        setSelectedTopic(null);
                        setEvaluationResult(null);
                        setErrorStatus(null);
                        setShowGlobalHistory(true);
                      }}
                      className="p-3 bg-gray-100 hover:bg-gray-200 text-[#141414] rounded-2xl transition-all flex items-center gap-2 shrink-0"
                    >
                      <ArrowLeft size={18} />
                      <span className="hidden sm:inline text-[10px] font-black uppercase tracking-widest">Back to History</span>
                    </button>
                  )}
                  {!openedFromHistory && (
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase font-black tracking-widest opacity-40 mb-1 block truncate">FPSC Module Selection • {subject.name}</span>
                      <h3 className="text-lg sm:text-xl font-serif italic font-bold truncate pr-2" title={selectedTopic || ''}>{selectedTopic}</h3>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                  {!evaluationResult && (
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => downloadTopicAsPDF(`${subject?.name}: ${selectedTopic}`, activeTab === 'notes' ? topicNotes : activeTab === 'guidance' ? topicGuidance : topicTest)}
                        className="p-3 bg-white border border-gray-200 text-[#141414] rounded-2xl hover:border-black transition-all flex items-center gap-2"
                      >
                        <FileDown size={18} className="text-blue-600" />
                        <span className="hidden md:inline text-[10px] font-black uppercase tracking-widest">Download PDF</span>
                      </button>
                      
                      {subject?.id !== 'english-essay' && (
                        <div className="relative">
                          <div className="flex flex-col items-center">
                            <span className="hidden md:block text-[10px] font-black tracking-widest text-purple-600 mb-1 uppercase">Practice Tests</span>
                            <button 
                              onClick={() => setShowPracticeSelector(!showPracticeSelector)}
                              className={`p-3 rounded-2xl transition-all flex items-center gap-2 ${showPracticeSelector ? 'bg-purple-600 text-white shadow-lg' : 'bg-white border border-gray-200 text-purple-600 hover:border-purple-600 shadow-sm'}`}
                            >
                              <Brain size={18} />
                              <span className="hidden md:inline text-[10px] font-black uppercase tracking-widest">Tests & Practice</span>
                            </button>
                          </div>

                          <AnimatePresence>
                            {showPracticeSelector && (
                              <motion.div 
                                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                className="absolute right-0 top-full mt-3 w-80 bg-white rounded-[2rem] border border-gray-100 shadow-2xl p-6 z-50 overflow-hidden"
                              >
                                <div className="space-y-6">
                                  <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-600">FPSC Exam Simulator</span>
                                    <h4 className="text-sm font-serif italic font-bold">Select test format or view history</h4>
                                  </div>
                                  
                                  <div className="grid grid-cols-3 gap-2 bg-gray-50 p-1 rounded-2xl border border-gray-100">
                                    <button 
                                      onClick={() => setTestSelectionType('subjective')}
                                      className={`py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${testSelectionType === 'subjective' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                    >
                                      Subjective
                                    </button>
                                    <button 
                                      onClick={() => setTestSelectionType('objective')}
                                      className={`py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${testSelectionType === 'objective' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                    >
                                      Objective
                                    </button>
                                    <button 
                                      onClick={() => {
                                        setTestSelectionType('history');
                                        fetchHistory();
                                      }}
                                      className={`py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${testSelectionType === 'history' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                    >
                                      History
                                    </button>
                                  </div>

                                  <div className="pt-2">
                                    {testSelectionType === 'history' ? (
                                      <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                        {loadingHistory ? (
                                          <div className="flex flex-col items-center py-8">
                                            <Loader2 size={24} className="animate-spin text-purple-600" />
                                            <span className="text-[10px] uppercase font-black tracking-widest opacity-40 mt-2">Loading logs...</span>
                                          </div>
                                        ) : historyItems.length === 0 ? (
                                          <div className="text-center py-8 opacity-40">
                                            <ClipboardList size={32} className="mx-auto mb-2 opacity-20" />
                                            <p className="text-[10px] font-black uppercase tracking-widest">No tests practiced yet</p>
                                          </div>
                                        ) : (
                                          historyItems.map((item) => (
                                            <button
                                              key={item.id}
                                              onClick={() => {
                                                setShowPracticeSelector(false);
                                                if (item.type === 'objective') {
                                                  setSubjectMcqs(item.data.mcqs);
                                                  setShowTopicMCQs(true);
                                                  setCurrentSubjectMcqIdx(0);
                                                  setSubjectMcqAnswers({});
                                                } else if (item.type === 'guidance') {
                                                  setTopicGuidance(item.data.content);
                                                  setActiveTab('guidance');
                                                  setShowTopicMCQs(false);
                                                } else if (item.type === 'notes') {
                                                  setTopicNotes(item.data.content);
                                                  setActiveTab('notes');
                                                  setShowTopicMCQs(false);
                                                } else if (item.type === 'evaluation') {
                                                  setEvaluationResult(item.data.content);
                                                  setActiveTab('evaluation');
                                                  setShowTopicMCQs(false);
                                                } else {
                                                  setTopicTest(item.data.content);
                                                  setActiveTab('test');
                                                  setShowTopicMCQs(false);
                                                }
                                              }}
                                              className="w-full p-4 rounded-2xl border border-gray-100 hover:border-purple-200 hover:bg-purple-50/30 transition-all text-left flex items-center justify-between group"
                                            >
                                              <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                  {item.type === 'objective' ? <CheckSquare size={12} className="text-purple-600" /> : 
                                                   item.type === 'guidance' ? <Sparkles size={12} className="text-blue-600" /> :
                                                   item.type === 'notes' ? <FileText size={12} className="text-emerald-600" /> :
                                                   item.type === 'evaluation' ? <FileText size={12} className="text-orange-600" /> :
                                                   <BookOpen size={12} className="text-blue-600" />}
                                                  <span className="text-[10px] font-black uppercase tracking-widest">{item.type}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 opacity-60">
                                                  <History size={10} />
                                                  <span className="text-[9px] font-bold">
                                                    {(() => {
                                                      const now = new Date();
                                                      const created = new Date(item.createdAt.seconds * 1000);
                                                      const diffInMs = now.getTime() - created.getTime();
                                                      const diffInMin = Math.floor(diffInMs / (1000 * 60));
                                                      const diffInHrs = Math.floor(diffInMs / (1000 * 60 * 60));
                                                      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

                                                      if (diffInMin < 1) return 'just now';
                                                      if (diffInMin < 60) return `${diffInMin}m ago`;
                                                      if (diffInHrs < 24) return `${diffInHrs}h ago`;
                                                      return `${diffInDays}d ago`;
                                                    })()}
                                                  </span>
                                                  <span className="text-[8px] opacity-50 font-mono">({new Date(item.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})</span>
                                                </div>
                                              </div>
                                              <Zap size={14} className="opacity-0 group-hover:opacity-100 text-yellow-500 transition-all" />
                                            </button>
                                          ))
                                        )}
                                      </div>
                                    ) : (
                                      <button 
                                        onClick={() => {
                                          setShowPracticeSelector(false);
                                          if (testSelectionType === 'objective') {
                                            setShowTopicMCQs(true);
                                            startMCQsInModal();
                                          } else {
                                            setShowTopicMCQs(false);
                                            generateNextTest();
                                          }
                                        }}
                                        className="w-full py-4 bg-[#141414] text-white rounded-[1.2rem] text-xs font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-black transition-all group overflow-hidden relative"
                                      >
                                        {loadingNewTest || loadingNewMcqs ? (
                                          <Loader2 size={16} className="animate-spin" />
                                        ) : (
                                          <>
                                            <Zap size={16} className="text-yellow-400 group-hover:scale-125 transition-transform" />
                                            Generate Test
                                          </>
                                        )}
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}
                    </div>
                  )}

                  {evaluationResult && activeTab === 'evaluation' && (
                    <>
                      <button 
                        onClick={() => setEvaluationResult(null)}
                        className="p-3 bg-gray-100 text-[#141414] rounded-full hover:bg-gray-200 transition-colors flex items-center gap-2 px-6"
                        title="Leave and go back to upload"
                      >
                        <Minimize2 size={20} />
                        <span className="text-xs font-black uppercase tracking-widest text-[10px]">Leave Result</span>
                      </button>
                      <button 
                        onClick={downloadAsPDF}
                        className="p-3 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors flex items-center gap-2 px-6"
                      >
                        <Download size={20} />
                        <span className="text-xs font-black uppercase tracking-widest text-[10px]">Download PDF</span>
                      </button>
                    </>
                  )}
                  <button 
                    onClick={() => { setSelectedTopic(null); setEvaluationResult(null); setErrorStatus(null); setOpenedFromHistory(false); }}
                    className="p-3 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
              </header>

              {!openedFromHistory && !(activeTab === 'evaluation' && evaluationResult) && (
                <div className="bg-white border-b border-[#141414]/10 px-8 overflow-x-auto no-scrollbar">
                  <div className="flex gap-8 min-w-max">
                    <button 
                      onClick={() => { setActiveTab('guidance'); setShowTopicMCQs(false); }}
                      className={`py-4 text-sm font-bold uppercase tracking-widest border-b-2 transition-all shrink-0 ${activeTab === 'guidance' ? 'border-[#141414] opacity-100' : 'border-transparent opacity-30'}`}
                    >
                      <div className="flex items-center gap-2">
                        <Sparkles size={14} /> {ESSAY_TECHNIQUE_DETAILS[selectedTopic || ''] ? 'Detailed Masterclass' : 'Detailed Material'}
                      </div>
                    </button>
                    
                    {!ESSAY_TECHNIQUE_DETAILS[selectedTopic || ''] && (
                      <button 
                        onClick={() => {
                          setActiveTab('notes');
                          if (!topicNotes && selectedTopic) {
                            fetchNotes(selectedTopic);
                          }
                          setShowTopicMCQs(false);
                        }}
                        className={`py-4 text-sm font-bold uppercase tracking-widest border-b-2 transition-all shrink-0 ${activeTab === 'notes' ? 'border-[#141414] opacity-100' : 'border-transparent opacity-30'}`}
                      >
                        <div className="flex items-center gap-2">
                          <FileText size={14} /> Detailed Notes
                        </div>
                      </button>
                    )}
                    
                    {!ESSAY_TECHNIQUE_DETAILS[selectedTopic || ''] && (
                      <>
                        <button 
                          onClick={() => { setActiveTab('evaluation'); setShowTopicMCQs(false); }}
                          className={`py-4 text-sm font-bold uppercase tracking-widest border-b-2 transition-all shrink-0 ${activeTab === 'evaluation' ? 'border-[#141414] opacity-100' : 'border-transparent opacity-30'}`}
                        >
                          <div className="flex items-center gap-2">
                            <Camera size={14} /> {subject?.id === 'english-essay' ? 'Pen-Paper Check' : 'Paper Checker'}
                          </div>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

              <div className={`flex-1 overflow-y-auto ${(activeTab === 'evaluation' && evaluationResult) || (subject?.id !== 'english-essay') || openedFromHistory ? 'p-0 bg-white' : 'p-4 md:p-8'}`}>
                {loadingTopicData || uploadingImage ? (
                  <div className="h-full flex flex-col items-center justify-center py-20 bg-white">
                    <Loader2 className="animate-spin text-purple-600 mb-4" size={40} />
                    <p className="font-serif italic opacity-50">CSS AI examiner is processing your response...</p>
                  </div>
                ) : errorStatus ? (
                  <div className="h-full flex flex-col items-center justify-center py-20 px-8 text-center bg-white">
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${errorStatus.includes('AI_LIMIT') ? 'bg-orange-50 text-orange-500' : 'bg-red-50 text-red-500'}`}>
                      <AlertCircle size={40} />
                    </div>
                    <h4 className="text-2xl font-serif italic mb-4">
                      {errorStatus.includes('AI_LIMIT') ? 'Capacity Reached' : 'Request Error'}
                    </h4>
                    <p className="max-w-xs mx-auto opacity-50 mb-8 leading-relaxed">
                      {errorStatus.includes('AI_LIMIT') ? errorStatus.replace('AI_LIMIT: ', '') : errorStatus}
                    </p>
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      <button 
                        onClick={() => {
                          setErrorStatus(null);
                          if (activeTab === 'evaluation') {
                            // Can't automatically re-upload without user selecting files again 
                            // But we can clear error and let them try again
                          } else {
                            handleTopicClick(selectedTopic!);
                          }
                        }}
                        className="px-8 py-4 bg-[#141414] text-white rounded-2xl font-bold hover:bg-opacity-90 transition-all"
                      >
                        Try Again
                      </button>
                      <button 
                        onClick={() => setShowGlobalHistory(true)}
                        className="px-8 py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-all"
                      >
                        Check Logs
                      </button>
                    </div>
                  </div>
                ) : activeTab === 'evaluation' && !evaluationResult ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-12 bg-white">
                    <h4 className="text-3xl font-serif italic mb-4">{subject?.id === 'english-essay' ? 'Evaluate Your Written Work' : 'Paper Checker'}</h4>
                    <p className="max-w-md mx-auto opacity-50 mb-10 leading-relaxed">
                      FPSC examiners reward clarity, structure, and depth. Upload clear files (Image/PDF) for <span className="font-bold opacity-100 italic">"{selectedTopic}"</span>.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-4">
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="px-10 py-5 bg-[#141414] text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-opacity-90 transition-all shadow-xl"
                      >
                        <Upload size={20} /> Select Files
                      </button>
                    </div>
                  </div>
                ) : showTopicMCQs ? (
                  <div className="bg-white p-4 md:p-6 lg:p-10 w-full pt-10">
                    <div className="w-full space-y-6">
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-gray-50 p-6 rounded-[2rem] border border-gray-100 shadow-sm text-black">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-black uppercase tracking-widest opacity-50">MCQs Practice Mode</span>
                          <span className="text-[10px] opacity-40 font-bold italic">Generated from FPSC Syllabus standards</span>
                        </div>
                        <div className="flex items-center gap-6">
                           <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Count: {mcqCount}</span>
                            <input 
                              type="range" 
                              min="5" 
                              max="100" 
                              step="5"
                              value={mcqCount}
                              onChange={(e) => setMcqCount(parseInt(e.target.value))}
                              className="w-32 h-1.5 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                            />
                           </div>
                           <button
                            onClick={() => startMCQsInModal()}
                            disabled={loadingNewMcqs}
                            className="px-6 py-3 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 transition-all shadow-lg flex items-center gap-2"
                           >
                            {loadingNewMcqs ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                            Refresh Set
                           </button>
                        </div>
                      </div>

                      {loadingNewMcqs ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                          <Loader2 className="animate-spin text-purple-600 mb-4" size={40} />
                          <p className="font-serif italic opacity-40">Hiring AI examiner to draft {mcqCount} MCQs...</p>
                        </div>
                      ) : subjectMcqs.length > 0 ? (
                        <div className="space-y-10 text-black">
                          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${((currentSubjectMcqIdx + 1) / subjectMcqs.length) * 100}%` }}
                              className="h-full bg-gradient-to-r from-purple-600 to-blue-600"
                            />
                          </div>

                          <div className="flex items-center justify-between text-xs font-black uppercase tracking-widest opacity-40">
                            <span>Target {currentSubjectMcqIdx + 1} of {subjectMcqs.length}</span>
                            <span className="text-purple-600">{Object.keys(subjectMcqAnswers).length} Attempted</span>
                          </div>

                          <AnimatePresence mode="wait">
                            <motion.div 
                              key={`modal-mcq-${currentSubjectMcqIdx}`}
                              initial={{ opacity: 0, x: 30 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -30 }}
                              className="p-6 md:p-8 bg-white border border-purple-50 rounded-[2rem] shadow-xl shadow-purple-600/5"
                            >
                              {(() => {
                                const mcq = subjectMcqs[currentSubjectMcqIdx];
                                const selectedOption = subjectMcqAnswers[currentSubjectMcqIdx];
                                const isAnswered = !!selectedOption;

                                return (
                                  <>
                                    <div className="flex gap-3 mb-4">
                                      <span className="w-6 h-6 sm:w-8 sm:h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-xs sm:text-sm shrink-0 shadow-sm shadow-purple-600/20">{currentSubjectMcqIdx + 1}</span>
                                      <h5 className="font-serif italic font-medium text-sm sm:text-base leading-snug">{mcq.question}</h5>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 gap-1.5 sm:gap-2">
                                      {mcq.options.map((opt: string, optIdx: number) => {
                                        const isCorrect = opt === mcq.correctAnswer;
                                        const isUserSelected = opt === selectedOption;
                                        
                                        let stateClasses = "bg-white border-gray-100";
                                        if (isAnswered) {
                                          if (isCorrect) {
                                            stateClasses = "bg-green-50 border-green-500 text-green-800 scale-[1.01] shadow-sm shadow-green-500/10";
                                          } else if (isUserSelected) {
                                            stateClasses = "bg-red-50 border-red-500 text-red-800 scale-[0.99]";
                                          } else {
                                            stateClasses = "bg-gray-50 border-gray-100 opacity-40";
                                          }
                                        } else {
                                          stateClasses = "bg-gray-50 border-transparent hover:border-purple-600 hover:bg-white hover:shadow-md cursor-pointer";
                                        }

                                        return (
                                          <button 
                                            key={`modal-opt-${optIdx}`} 
                                            disabled={isAnswered}
                                            onClick={() => {
                                              if (isAnswered) return;
                                              setSubjectMcqAnswers(prev => ({ ...prev, [currentSubjectMcqIdx]: opt }));
                                            }}
                                            className={`p-2.5 sm:p-3 rounded-lg sm:rounded-xl border text-[10px] sm:text-xs md:text-sm text-left transition-all duration-300 flex items-center gap-2 sm:gap-3 ${stateClasses}`}
                                          >
                                             <div className={`w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${isAnswered && isCorrect ? 'bg-green-500 border-green-500 text-white' : isAnswered && isUserSelected ? 'bg-red-500 border-red-500 text-white' : 'border-gray-200'}`}>
                                                {isAnswered && (isCorrect || isUserSelected) && <CheckSquare size={10} />}
                                             </div>
                                            <span className="flex-1 font-medium leading-tight">{opt}</span>
                                          </button>
                                        );
                                      })}
                                    </div>

                                    {isAnswered && (
                                      <motion.div 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mt-6 p-6 bg-blue-50/50 border border-blue-100 rounded-2xl"
                                      >
                                        <div className="flex items-center gap-3 mb-4">
                                          <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                            <Brain size={18} />
                                          </div>
                                          <span className="font-black uppercase tracking-widest text-xs">Correction Logic</span>
                                        </div>
                                        <p className="text-blue-900 italic leading-relaxed text-sm sm:text-base">{mcq.explanation || 'Verification successful based on subject literature standards.'}</p>
                                      </motion.div>
                                    )}
                                  </>
                                );
                              })()}
                            </motion.div>
                          </AnimatePresence>

                          <div className="flex items-center justify-between pb-12">
                            <button
                              onClick={() => setCurrentSubjectMcqIdx(prev => Math.max(0, prev - 1))}
                              disabled={currentSubjectMcqIdx === 0}
                              className={`px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all ${currentSubjectMcqIdx === 0 ? 'opacity-20 cursor-not-allowed' : 'bg-white border border-gray-200 hover:border-black shadow-sm'}`}
                            >
                              <ArrowLeft size={16} /> Previous Target
                            </button>
                            
                            <div className="flex items-center gap-6">
                              {currentSubjectMcqIdx < subjectMcqs.length - 1 ? (
                                <button
                                  onClick={() => setCurrentSubjectMcqIdx(prev => prev + 1)}
                                  className="px-12 py-5 bg-[#141414] text-white rounded-[1.5rem] text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-opacity-90 transition-all shadow-2xl"
                                >
                                  Next MCQ Target <ArrowLeft size={16} className="rotate-180" />
                                </button>
                              ) : (
                                  <button 
                                    onClick={() => startMCQsInModal()}
                                    className="px-12 py-5 bg-green-600 text-white rounded-[1.5rem] text-xs font-black uppercase tracking-widest flex items-center gap-3 hover:bg-green-700 transition-all shadow-2xl"
                                  >
                                    <Zap size={18} /> Generate Next Test
                                  </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : !loadingNewMcqs && (
                        <div className="text-center py-20 bg-gray-50 rounded-[3rem] border border-dashed border-gray-200">
                          <ListTodo size={40} className="mx-auto opacity-20 mb-4" />
                          <p className="opacity-40 font-serif italic text-xl">Press "Refresh Set" to generate {mcqCount} high-yield MCQs for this topic.</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className={`markdown-body prose prose-slate max-w-none prose-headings:font-serif prose-headings:italic ${(activeTab === 'evaluation' || subject?.id !== 'english-essay' || openedFromHistory) ? 'bg-white p-4 md:p-8 lg:p-12 w-full pt-10 px-8' : ''}`}>
                    <ReactMarkdown>
                      {activeTab === 'notes' ? topicNotes || '' :
                       activeTab === 'guidance' ? topicGuidance || '' : 
                       activeTab === 'test' ? topicTest || '' : 
                       evaluationResult || ''}
                    </ReactMarkdown>

                    {!openedFromHistory && (activeTab === 'guidance' || activeTab === 'notes') && (
                      <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 p-8 bg-purple-50 rounded-[2rem] border border-purple-100">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-600">Guidance Complete</span>
                          <h5 className="text-lg font-serif italic font-bold">Ready to test your knowledge?</h5>
                        </div>
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                          <button 
                            onClick={() => {
                              if (topicTest) {
                                setActiveTab('test');
                              } else {
                                generateNextTest();
                              }
                            }}
                            className="flex-1 sm:flex-none px-8 py-4 bg-purple-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-purple-700 transition-all shadow-lg shadow-purple-200 group"
                          >
                            Practice This Topic <Zap size={14} className="text-yellow-400 group-hover:scale-125 transition-all" />
                          </button>
                        </div>
                      </div>
                    )}

                    {!openedFromHistory && activeTab === 'test' && (
                       <>
                         <div className="mt-12 p-8 bg-[#F5F5F0] rounded-3xl border border-[#141414]/10">
                           <h5 className="text-xl font-serif italic font-bold mb-4">Submission & Review</h5>
                           <p className="text-sm opacity-60 mb-6">Once you have solved the questions above on paper, upload a photo to get it checked by the AI examiner.</p>
                           <button 
                             onClick={() => setActiveTab('evaluation')}
                             className="px-6 py-3 bg-white border border-[#141414]/10 rounded-xl text-xs font-black uppercase tracking-widest hover:border-[#141414] transition-all"
                           >
                             Check My Handwritten Answer →
                           </button>
                         </div>

                         <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 p-8 border-t border-gray-100">
                           <div className="flex flex-col gap-1">
                             <span className="text-[10px] font-black uppercase tracking-[0.1em] opacity-40">More Practice?</span>
                           </div>
                           <div className="flex items-center gap-3 w-full sm:w-auto">
                             <button 
                               onClick={generateNextTest}
                               className="flex-1 sm:flex-none px-6 py-4 bg-white border border-gray-200 text-gray-900 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-black transition-all flex items-center justify-center gap-2"
                             >
                               {loadingNewTest ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} className="text-purple-600" />}
                               Generate Another Test
                             </button>
                           </div>
                         </div>
                       </>
                    )}
                  </div>
                )}
              </div>

              {!openedFromHistory && !( (activeTab === 'evaluation' && evaluationResult) || (subject?.id !== 'english-essay' && (activeTab === 'guidance' || activeTab === 'test' || activeTab === 'notes')) ) && (
                <footer className="p-6 border-t border-[#141414]/5 bg-white text-center">
                  <p className="text-[10px] uppercase font-bold tracking-[0.2em] opacity-30 italic">Proprietary AI Examiner Logic based on FPSC Paper Checking Standards</p>
                </footer>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </div>
      
      {/* Global History Modal */}
    <AnimatePresence>
      {showGlobalHistory && (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="flex-1 flex flex-col h-full w-full"
          >
            <div className="p-6 md:p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-purple-600">
                  <History size={18} />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">{subject?.name}</span>
                </div>
                <h3 className="text-xl font-serif italic font-bold">History: Tests & Materials</h3>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => fetchHistory(true)}
                  disabled={loadingHistory}
                  className="p-3 hover:bg-white hover:text-purple-600 hover:shadow-sm rounded-xl transition-all disabled:opacity-30"
                  title="Refresh History"
                >
                  <Sparkles size={18} className={loadingHistory ? 'animate-spin' : ''} />
                </button>
                <button 
                  onClick={() => setShowGlobalHistory(false)}
                  className="p-3 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-white">
              {loadingHistory ? (
                <div className="flex flex-col items-center justify-center py-20 opacity-40">
                  <Loader2 size={32} className="animate-spin mb-4" />
                  <span className="text-xs font-black uppercase tracking-widest">Retrieving logs...</span>
                </div>
              ) : historyItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                  <ClipboardList size={48} className="mb-4 opacity-20" />
                  <p className="text-sm font-serif italic font-medium">No records found for this subject yet.</p>
                  <p className="text-[10px] font-black uppercase tracking-widest mt-2">Start exploring topics to build your history</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {historyItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setShowGlobalHistory(false);
                        setOpenedFromHistory(true);
                        setSelectedTopic(item.topic);
                        
                        if (item.type === 'objective') {
                          setSubjectMcqs(item.data.mcqs);
                          setShowTopicMCQs(true);
                          setCurrentSubjectMcqIdx(0);
                          setSubjectMcqAnswers({});
                        } else if (item.type === 'guidance') {
                          setTopicGuidance(item.data.content);
                          setActiveTab('guidance');
                          setShowTopicMCQs(false);
                        } else if (item.type === 'notes') {
                          setTopicNotes(item.data.content);
                          setActiveTab('notes');
                          setShowTopicMCQs(false);
                        } else if (item.type === 'evaluation') {
                          setEvaluationResult(item.data.content);
                          setActiveTab('evaluation');
                          setShowTopicMCQs(false);
                        } else {
                          setTopicTest(item.data.content);
                          setActiveTab('test');
                          setShowTopicMCQs(false);
                        }
                      }}
                      className="p-5 rounded-[1.8rem] border border-gray-100 hover:border-purple-200 hover:bg-purple-50/30 transition-all text-left flex items-center justify-between group"
                    >
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <div className={`p-2 rounded-lg ${
                            item.type === 'objective' ? 'bg-purple-100 text-purple-600' : 
                            item.type === 'guidance' ? 'bg-blue-100 text-blue-600' : 
                            item.type === 'notes' ? 'bg-emerald-100 text-emerald-600' :
                            item.type === 'evaluation' ? 'bg-orange-100 text-orange-600' :
                            'bg-green-100 text-green-600'
                          }`}>
                            {item.type === 'objective' ? <CheckSquare size={14} /> : 
                             item.type === 'guidance' ? <Sparkles size={14} /> : 
                             item.type === 'notes' ? <FileText size={14} /> :
                             item.type === 'evaluation' ? <FileText size={14} /> :
                             <BookOpen size={14} />}
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                            {item.type === 'guidance' ? 'Topic Overview' : 
                             item.type === 'objective' ? 'Objective Test' : 
                             item.type === 'notes' ? 'Detailed Notes' :
                             item.type === 'evaluation' ? 'AI Evaluation' :
                             'Subjective Test'}
                          </span>
                        </div>
                        <h4 className="text-sm font-serif italic font-bold group-hover:text-purple-600 transition-colors">
                          {item.topic}
                        </h4>
                        <div className="flex items-center gap-2 opacity-50">
                          <History size={10} />
                          <span className="text-[9px] font-bold">
                            {item.createdAt ? new Date(item.createdAt?.toMillis ? item.createdAt.toMillis() : item.createdAt.seconds * 1000).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Just now'}
                          </span>
                        </div>
                      </div>
                      <Zap size={18} className="opacity-0 group-hover:opacity-100 text-yellow-500 transition-all" />
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-6 bg-gray-50 border-t border-gray-100 text-center">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-30">Total Activities: {historyItems.length}</p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
    </>
  );
}
