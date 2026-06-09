import { Subject } from '../types';

export const COMPULSORY_SUBJECTS: Subject[] = [
  {
    id: 'english-essay',
    name: 'English Essay',
    group: 'Compulsory',
    isCompulsory: true,
    description: 'Requires candidates to write one or more essays in English on a variety of topics.',
  },
  {
    id: 'english-precis',
    name: 'English (Précis and Composition)',
    group: 'Compulsory',
    isCompulsory: true,
    description: 'Focuses on précis writing, comprehension, grammar, vocabulary, and sentence structure.',
  },
  {
    id: 'general-science-ability',
    name: 'General Science & Ability',
    group: 'Compulsory',
    isCompulsory: true,
    description: 'Covers physical sciences, biological sciences, environmental sciences, food sciences, information technology, and quantitative ability.',
  },
  {
    id: 'current-affairs',
    name: 'Current Affairs',
    group: 'Compulsory',
    isCompulsory: true,
    description: 'Tests knowledge on national and international issues, events, and developments.',
  },
  {
    id: 'pakistan-affairs',
    name: 'Pakistan Affairs',
    group: 'Compulsory',
    isCompulsory: true,
    description: 'Explores history, constitutional developments, foreign policy, and socio-economic issues of Pakistan.',
  },
  {
    id: 'islamic-studies',
    name: 'Islamic Studies',
    group: 'Compulsory',
    isCompulsory: true,
    description: 'Covers fundamental beliefs, history, laws, and socio-economic system of Islam. Non-Muslims may opt for Comparative Study of Major Religions.',
  },
];

export const OPTIONAL_SUBJECTS: Subject[] = [
  // Group I (200 marks - Pick one)
  { id: 'accountancy', name: 'Accountancy & Auditing', group: 'Group I', isCompulsory: false, description: 'Financial accounting, cost accounting, auditing, taxation.' },
  { id: 'economics', name: 'Economics', group: 'Group I', isCompulsory: false, description: 'Micro/Macro economics, monetary policy, international trade.' },
  { id: 'computer-science', name: 'Computer Science', group: 'Group I', isCompulsory: false, description: 'Software engineering, hardware, data structures, algorithms.' },
  { id: 'political-science', name: 'Political Science', group: 'Group I', isCompulsory: false, description: 'Political theory, comparative politics, ideologies.' },
  { id: 'international-relations', name: 'International Relations', group: 'Group I', isCompulsory: false, description: 'Global politics, security, international law/organizations.' },

  // Group II (200 marks - Pick one or two totaling 200)
  { id: 'physics', name: 'Physics', group: 'Group II', isCompulsory: false, description: 'Mechanics, Electromagnetism, Quantum theory.' },
  { id: 'chemistry', name: 'Chemistry', group: 'Group II', isCompulsory: false, description: 'Physical, Organic, Inorganic, Analytical chemistry.' },
  { id: 'pure-mathematics', name: 'Pure Mathematics', group: 'Group II', isCompulsory: false, description: 'Algebra, Calculus, Number theory.' },
  { id: 'applied-mathematics', name: 'Applied Mathematics', group: 'Group II', isCompulsory: false, description: 'Dynamics, Statics, Fluid mechanics.' },
  { id: 'statistics', name: 'Statistics', group: 'Group II', isCompulsory: false, description: 'Probability, inference, data analysis.' },
  { id: 'geology', name: 'Geology', group: 'Group II', isCompulsory: false, description: 'Earth science, mineralogy, paleontology.' },

  // Group III (100 marks - Pick one)
  { id: 'business-administration', name: 'Business Administration', group: 'Group III', isCompulsory: false, description: 'Management, marketing, finance, human resources.' },
  { id: 'public-administration', name: 'Public Administration', group: 'Group III', isCompulsory: false, description: 'Public policy, local government, administrative law.' },
  { id: 'governance-public-policy', name: 'Governance & Public Policy', group: 'Group III', isCompulsory: false, description: 'Public sector reform, policy cycles, institutional analysis.' },
  { id: 'town-planning', name: 'Town Planning & Urban Management', group: 'Group III', isCompulsory: false, description: 'Urbanization, land use, infrastructure planning.' },

  // Group IV (100 marks - Pick one)
  { id: 'history-pakistan-india', name: 'History of Pakistan & India', group: 'Group IV', isCompulsory: false, description: 'Subcontinent history from 712 to 1947.' },
  { id: 'islamic-history-culture', name: 'Islamic History & Culture', group: 'Group IV', isCompulsory: false, description: 'Islamic civilizations, contributions to science/arts.' },
  { id: 'british-history', name: 'British History', group: 'Group IV', isCompulsory: false, description: 'Political and social history of Britain.' },
  { id: 'european-history', name: 'European History', group: 'Group IV', isCompulsory: false, description: 'European politics and wars since 1789.' },
  { id: 'history-usa', name: 'History of USA', group: 'Group IV', isCompulsory: false, description: 'American history from colonies to superpower.' },

  // Group V (100 marks - Pick one)
  { id: 'gender-studies', name: 'Gender Studies', group: 'Group V', isCompulsory: false, description: 'Gender theories, women movements, social constructs.' },
  { id: 'environmental-sciences', name: 'Environmental Sciences', group: 'Group V', isCompulsory: false, description: 'Ecology, pollution, sustainable development.' },
  { id: 'agriculture-forestry', name: 'Agriculture & Forestry', group: 'Group V', isCompulsory: false, description: 'Crop production, soil science, forest management.' },
  { id: 'botany', name: 'Botany', group: 'Group V', isCompulsory: false, description: 'Plant biology, physiology, genetics.' },
  { id: 'zoology', name: 'Zoology', group: 'Group V', isCompulsory: false, description: 'Animal biology, evolution, physiology.' },
  { id: 'english-literature', name: 'English Literature', group: 'Group V', isCompulsory: false, description: 'Study of plays, poetry, and novels.' },
  { id: 'urdu-literature', name: 'Urdu Literature', group: 'Group V', isCompulsory: false, description: 'Classic and modern Urdu prose/poetry.' },

  // Group VI (100 marks - Pick one)
  { id: 'law', name: 'Law', group: 'Group VI', isCompulsory: false, description: 'Jurisprudence, constitutional law.' },
  { id: 'constitutional-law', name: 'Constitutional Law', group: 'Group VI', isCompulsory: false, description: 'Study of constitutions of various countries.' },
  { id: 'international-law', name: 'International Law', group: 'Group VI', isCompulsory: false, description: 'Global treaties, human rights, maritime law.' },
  { id: 'muslim-law-jurisprudence', name: 'Muslim Law & Jurisprudence', group: 'Group VI', isCompulsory: false, description: 'Sharia law sources, principles.' },
  { id: 'mercantile-law', name: 'Mercantile Law', group: 'Group VI', isCompulsory: false, description: 'Contract law, company law, logistics.' },
  { id: 'criminology', name: 'Criminology', group: 'Group VI', isCompulsory: false, description: 'Theories of crime, policing, corrections.' },
  { id: 'philosophy', name: 'Philosophy', group: 'Group VI', isCompulsory: false, description: 'Ethics, logic, metaphysics.' },

  // Group VII (100 marks - Pick one)
  { id: 'journalism-mass-comm', name: 'Journalism & Mass Communication', group: 'Group VII', isCompulsory: false, description: 'Media theories, ethics, reporting.' },
  { id: 'psychology', name: 'Psychology', group: 'Group VII', isCompulsory: false, description: 'Behavior, mind, development, mental health.' },
  { id: 'geography', name: 'Geography', group: 'Group VII', isCompulsory: false, description: 'Physical and human geography.' },
  { id: 'sociology', name: 'Sociology', group: 'Group VII', isCompulsory: false, description: 'Social structures, groups, change.' },
  { id: 'anthropology', name: 'Anthropology', group: 'Group VII', isCompulsory: false, description: 'Human evolution, cultures, origins.' },
  { id: 'punjabi', name: 'Punjabi', group: 'Group VII', isCompulsory: false, description: 'Punjabi language and literature.' },
  { id: 'sindhi', name: 'Sindhi', group: 'Group VII', isCompulsory: false, description: 'Sindhi language and literature.' },
  { id: 'pashto', name: 'Pashto', group: 'Group VII', isCompulsory: false, description: 'Pashto language and literature.' },
  { id: 'balochi', name: 'Balochi', group: 'Group VII', isCompulsory: false, description: 'Balochi language and literature.' },
  { id: 'arabic', name: 'Arabic', group: 'Group VII', isCompulsory: false, description: 'Arabic language and literature.' },
  { id: 'persian', name: 'Persian', group: 'Group VII', isCompulsory: false, description: 'Persian language and literature.' },
];
