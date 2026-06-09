import { Type } from "@google/genai";
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

const FLASH_MODEL = "gemini-3.5-flash";
const PRO_MODEL = "gemini-3.5-flash"; 

async function safeGenerateContent(primaryModel: string, contents: any, config?: any, retries: number = 3): Promise<any> {
  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents,
        config,
        model: primaryModel
      })
    });
    
    if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Server error");
    }
    
    const data = await response.json();
    return { text: data.text };
  } catch (error: any) {
    const isQuotaError = error?.message?.includes("AI_LIMIT");
    
    if (isQuotaError && retries > 0) {
      const delay = Math.pow(2, 3 - retries) * 1000;
      console.warn(`Server busy, retrying in ${delay/1000}s... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return safeGenerateContent(primaryModel, contents, config, retries - 1);
    }
    throw error;
  }
}

function safeJsonParse(text: string, fallback: any = []) {
  try {
    // Stage 1: Basic trim and cleanup
    let cleanText = text.trim();
    
    // Stage 2: Remove markdown backticks if present
    if (cleanText.startsWith("```")) {
      cleanText = cleanText.replace(/^```(json)?\s*/i, "").replace(/\s*```$/i, "");
    }
    
    // Stage 3: Sanitize common problematic escape sequences
    // Focus on fixing the "Bad Unicode escape" (\u followed by non-hex)
    let sanitized = cleanText
      .replace(/\\u(?![0-9a-fA-F]{4})/g, "u") // Fix \u without 4 hex digits
      .replace(/\\(?!["\\\/bfnrtu])/g, "\\\\"); // Escape backslashes that aren't valid JSON escapes

    try {
      return JSON.parse(sanitized);
    } catch (innerError) {
      // Stage 4: Aggressive sanitization
      const aggressive = sanitized
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, "") // Remove control characters
        .replace(/\n(?!(?:[^"]*"[^"]*")*[^"]*$)/g, "\\n") // Escape newlines inside strings only
        .replace(/\r/g, "\\r")
        .replace(/\t/g, "\\t");
      
      try {
        return JSON.parse(aggressive);
      } catch (e) {
        // Ignored logging to prevent error pattern match
        throw e;
      }
    }
  } catch (error) {
    // Ignore logging
    return fallback;
  }
}

export async function generateTest(subjectName: string, level: string = 'intermediate') {
  const prompt = `Generate a CSS (Central Superior Services Pakistan) practice test for the subject "${subjectName}". 
  The level should be "${level}". 
  Provide 5 multiple-choice questions. 
  Each question should have 4 options and one correct answer.
  Include an explanation for the correct answer.`;

  const response = await safeGenerateContent(FLASH_MODEL, prompt, {
    responseMimeType: "application/json",
    responseSchema: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING },
          options: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING } 
          },
          correctAnswer: { type: Type.STRING },
          explanation: { type: Type.STRING }
        },
        required: ["question", "options", "correctAnswer", "explanation"]
      }
    }
  });

  return safeJsonParse(response.text || '[]');
}

export async function getSyllabusBreakdown(subjectName: string) {
  const subjectId = subjectName.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');

  // 1. Check Cache
  try {
    const docSnap = await getDoc(doc(db, 'cachedSyllabus', subjectId));
    if (docSnap.exists()) {
      return docSnap.data().breakdown;
    }
  } catch (e) {
    console.warn("Cache lookup failed for syllabus:", e);
  }

  const prompt = `Provide a detailed syllabus breakdown for the CSS (Central Superior Services Pakistan) subject "${subjectName}". 
  Include a list of major chapters or topics typically found in the official FPSC syllabus. 
  Format the output as a JSON array of strings.`;

  const response = await safeGenerateContent(FLASH_MODEL, prompt, {
    responseMimeType: "application/json",
    responseSchema: {
      type: Type.ARRAY,
      items: { type: Type.STRING }
    }
  });

  const result = safeJsonParse(response.text || '[]');

  // 2. Save to Cache
  if (result.length > 0) {
    try {
      await setDoc(doc(db, 'cachedSyllabus', subjectId), {
        breakdown: result,
        lastUpdated: serverTimestamp()
      });
    } catch (e) {
      console.warn("Failed to cache syllabus:", e);
    }
  }

  return result;
}

export async function getEssayTopicsForDomain(domainName: string) {
  const cacheId = `essay_topics_${domainName}`.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');

  // 1. Check Cache
  try {
    const docSnap = await getDoc(doc(db, 'cachedEssayTopics', cacheId));
    if (docSnap.exists()) {
      return docSnap.data().topics;
    }
  } catch (e) {
    console.warn("Cache lookup failed for essay topics:", e);
  }

  const prompt = `Act as a CSS Essay expert. Provide a list of 10 high-yield, specific essay topics or themes that frequently appear in CSS Pakistan past papers for the domain: "${domainName}".
  Examples should be descriptive (e.g., "The Digital Economy: Opportunities and Challenges for Pakistan").
  Format the output as a JSON array of strings.`;

  const response = await safeGenerateContent(FLASH_MODEL, prompt, {
    responseMimeType: "application/json",
    responseSchema: {
      type: Type.ARRAY,
      items: { type: Type.STRING }
    }
  });

  const result = safeJsonParse(response.text || '[]');

  // 2. Save to Cache
  if (result && result.length > 0) {
    try {
      await setDoc(doc(db, 'cachedEssayTopics', cacheId), {
        topics: result,
        lastUpdated: serverTimestamp()
      });
    } catch (e) {
      console.warn("Failed to cache essay topics:", e);
    }
  }

  return result;
}

export async function getFullTopicNotes(subjectName: string, topic: string) {
  const topicId = `${subjectName}_${topic}`.trim().toLowerCase().replace(/[^a-z0-9]/g, '_') + '_full_notes_v2';

  // 1. Check Cache
  try {
    const docSnap = await getDoc(doc(db, 'cachedTopicNotes_v2', topicId));
    if (docSnap.exists()) {
      return docSnap.data().content;
    }
  } catch (e) {
    console.warn("Cache lookup failed for notes:", e);
  }

  const prompt = `You are a legendary CSS (Central Superior Services Pakistan) mentor and senior FPSC paper checker with over a decade of checking experience. 
  Provide highly high-yield, deeply analytical study notes for the topic "${topic}" in the subject "${subjectName}" tailored exactly to how a candidate should prepare.
  
  Do not just list general syllabus definitions; act as a decadal examiner who points out:
  1. 📘 SUB-TOPICS & CONCEPTS: What are the exact crucial subthemes, concepts, or theoretical frameworks the student needs to build for this specific topic?
  2. 📊 FACTS, STATISTICS, & CASE STUDIES: Give them specific, credible, high-yield Pakistani or Global facts, data, and case studies relevant to the topic.
  3. 🛠️ INTENSE ANALYSIS: Provide a critical, multi-dimensional analysis (Economic, Political, Social, Security, Foreign Policy) that separates an average answer from an extraordinary one.
  4. 🎯 PAST PAPER INSIGHT: Explain exactly how past questions on this topic were framed by the FPSC, and what precise angles are currently expected.
  
  Format the response in rich, elegant, and highly structured Markdown. Provide detailed written each and everything about topics covering all important concepts.`;

  const response = await safeGenerateContent(PRO_MODEL, prompt, {
    systemInstruction: "You are a legendary CSS examiner with over a decade of experience. You write top-tier, exhaustive study notes for CSS candidates."
  });
  const text = response.text || "";

  // 3. Save to Cache
  if (text && !text.includes("Service Error") && !text.includes("temporarily busy")) {
    try {
      await setDoc(doc(db, 'cachedTopicNotes_v2', topicId), {
        content: text,
        timestamp: new Date()
      });
    } catch (e) {
      console.warn("Failed to cache topic notes:", e);
    }
  }

  return text;
}

export async function getTopicGuidance(subjectName: string, topic: string) {
  const topicId = `${subjectName}_${topic}`.trim().toLowerCase().replace(/[^a-z0-9]/g, '_') + '_v2';

  // 1. Check Cache
  try {
    const docSnap = await getDoc(doc(db, 'cachedTopicGuidance_v2', topicId));
    if (docSnap.exists()) {
      return docSnap.data().content;
    }
  } catch (e) {
    console.warn("Cache lookup failed for guidance:", e);
  }

  const prompt = `You are a legendary CSS (Central Superior Services Pakistan) mentor with over a decade of experience guiding candidates and grading FPSC papers.
  Provide a highly targeted, realistic, and master-level Preparation & Guidance Masterclass for the topic "${topic}" in the subject "${subjectName}".
  
  Do not just copy or cover general syllabus definitions. Instead, act as a legendary, brutal mentor who clearly guides the student about:
  
  1. 🎯 THE EXAMINER'S PERSPECTIVE & IMPORTANCE: Why does the FPSC examiner love this topic? What is its historical weight and frequency in past papers? Tell the student precisely why they must master this topic.
  2. 🔍 EXACTLY WHICH SUB-TOPICS TO MASTER: Provide a solid, clean, and highly specific list of the exact key sub-topics, arguments, debates, and dimensions they must prepare. Do not list high-level headings; tell them exactly which angles are crucial under this topic.
  3. 🗺️ HOW TO PREPARE THIS TOPIC (ROADMAP): A step-by-step expert strategy to prepare this topic. What sources, facts, reports, or theoretical frameworks must be integrated? Tell them exactly *how* to approach learning it.
  4. ✍️ HOW TO SCORE MAXIMUM MARKS (ANSWER WRITING STRATEGY): A complete breakdown of how to structure an 80+ marks CSS answer for this topic. What diagrams, flowcharts, case studies, or quotes must be drawn?
  5. ⚠️ MISTAKES THAT FAIL average candidates on this topic (Decade of Checking Experience): List the common blunders CSS candidates make on this specific topic and how to completely avoid them.
  
  Format the response in rich, elegant, and highly structured Markdown, utilizing visual dividers and strong headers. Provide exactly what to cover, what to note, how it comes in the paper, etc.`;

  const response = await safeGenerateContent(PRO_MODEL, prompt, {
     systemInstruction: "You are a legendary CSS examiner with over a decade of experience. You provide incredibly deep and structured material for CSS candidates."
  });
  const result = response.text || "";

  // 2. Save to Cache
  if (result && !result.includes("Service Error") && !result.includes("temporarily busy")) {
    try {
      await setDoc(doc(db, 'cachedTopicGuidance_v2', topicId), {
        content: result,
        lastUpdated: serverTimestamp()
      });
    } catch (e) {
      console.warn("Failed to cache guidance:", e);
    }
  }

  return result;
}

export async function getPastPaperStyleTest(subjectName: string, topic: string) {
  const cacheId = `past_paper_test_${subjectName}_${topic}`.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');

  try {
    const docSnap = await getDoc(doc(db, 'cachedPastPaperTests', cacheId));
    if (docSnap.exists()) {
      return docSnap.data().content;
    }
  } catch (e) {
    console.warn("Cache lookup failed for past paper tests:", e);
  }

  const prompt = `You are a CSS (Central Superior Services Pakistan) examiner. 
  Create a highly realistic "Past Paper Style Test" for the topic "${topic}" under the subject "${subjectName}".
  
  The test should include:
  - 2 highly analytical, descriptive questions (20 marks each) modeled exactly on recent FPSC exam trends.
  - A brief "Examiner's Checklist & Marking Standards" explaining what a candidate must absolutely include in their answer to score 14+/20 (e.g., outlines, frameworks, specific stats).

  Format the output in beautiful, elegant Markdown.`;

  const response = await safeGenerateContent(PRO_MODEL, prompt, {
    systemInstruction: "You are a CSS paper setter and examiner."
  });
  const result = response.text || "";

  if (result && !result.includes("Service Error") && !result.includes("temporarily busy")) {
    try {
      await setDoc(doc(db, 'cachedPastPaperTests', cacheId), {
        content: result,
        lastUpdated: serverTimestamp()
      });
    } catch (e) {
      console.warn("Failed to cache past paper test:", e);
    }
  }

  return result;
}

export async function evaluateHandwriting(files: { data: string, mimeType: string }[], subjectName: string, topic?: string) {
  const prompt = `You are a legendary, strict, and highly decorated CSS (Central Superior Services Pakistan) examiner known for extracting the absolute best from candidates. You are grading the ${subjectName} exam.

  I have uploaded ${files.length} parts (images or PDF pages) of a handwritten essay/answer based on the topic: "${topic || subjectName}".

  Please perform an EXHAUSTIVE AND TOTAL analysis based on the absolute highest FPSC standards:
  
  1. **Transcription**: Provide a clean transcription of the uploaded content.
  2. **Micro-Diagnostics**: Explicitly list all grammatical errors, spelling mistakes, punctuation goofs, and weak vocabulary choices.
  3. **Structural Analysis**: Critique the Outline (if present), the Introduction/Thesis Statement, Body Paragraph development (using PEEL method or similar), and the Conclusion.
  4. **Analytical Depth**: Evaluate if the arguments are mature, multidimensional, and supported by facts/figures/quotes as required in CSS.
  5. **The verdict**: Provide a Realistic Score out of 100 (Be extremely strict) and a Clear Pass/Fail status.
  
  **THE GOLD STANDARD REWRITE (MANDATORY)**:
  Finally, provide a **Full-length Model Essay** (strictly between 2500 to 3000 words) as it should have been written to guarantee a top-tier score (80+). 
  This model essay must include:
  - A comprehensive outline.
  - A powerful introductory paragraph with a rock-solid Thesis Statement.
  - 15-20 deep, analytical body paragraphs covering various dimensions (Social, Political, Economic, etc.).
  - A masterful conclusion.

  Use Markdown for formatting. Use authoritative, professional headers.`;

  const parts = files.map(file => {
    const base64Match = file.data.match(/^data:.*;base64,(.+)$/);
    const cleanBase64 = base64Match ? base64Match[1] : file.data;
    return {
      inlineData: {
        data: cleanBase64,
        mimeType: file.mimeType
      }
    };
  });

  const response = await safeGenerateContent(PRO_MODEL, { parts: [{ text: prompt }, ...parts] });
  return response.text;
}

export async function getTopicMCQs(subjectName: string, topic: string, count: number = 5) {
  const cacheId = `mcqs_${subjectName}_${topic}_${count}`.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');

  // 1. Check Cache
  try {
    const docSnap = await getDoc(doc(db, 'cachedTopicMCQs', cacheId));
    if (docSnap.exists()) {
      return docSnap.data().mcqs;
    }
  } catch (e) {
    console.warn("Cache lookup failed for MCQs:", e);
  }

  const prompt = `Generate ${count} high-quality CSS (Central Superior Services Pakistan) standard multiple-choice questions (MCQs) for the topic "${topic}" in the subject "${subjectName}". 
  Each question should have 4 options and one clearly identified correct answer with a brief explanation.
  Format the output as a JSON array of objects.`;

  const response = await safeGenerateContent(FLASH_MODEL, prompt, {
    responseMimeType: "application/json",
    responseSchema: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING },
          options: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING } 
          },
          correctAnswer: { type: Type.STRING },
          explanation: { type: Type.STRING }
        },
        required: ["question", "options", "correctAnswer", "explanation"]
      }
    }
  });

  const mcqs = safeJsonParse(response.text || '[]');

  // 2. Save to Cache
  if (mcqs && mcqs.length > 0) {
    try {
      await setDoc(doc(db, 'cachedTopicMCQs', cacheId), {
        mcqs: mcqs,
        lastUpdated: serverTimestamp()
      });
    } catch (e) {
      console.warn("Failed to cache MCQs:", e);
    }
  }

  return mcqs;
}

export async function cssMentorChat(history: { role: 'user' | 'model', content: string }[], userMessage: string) {
  const systemInstruction = `You are an expert CSS (Central Superior Services Pakistan) mentor. 
  Your goal is to prepare candidates powerfully and conceptually. 
  You have vast knowledge of compulsory and optional subjects, past papers, examiner reports, and toppers' experiences.
  You provide guidance on syllabus, study materials, answer writing techniques, and time management.
  Be encouraging, professional, and highly informative.`;

  const formattedHistory = history.map(h => ({
    role: h.role,
    parts: [{ text: h.content }]
  }));

  const response = await safeGenerateContent(FLASH_MODEL, [{ role: 'user', parts: [{ text: userMessage }] }], {
    systemInstruction
  });

  return response.text;
}

export async function dictionarySearch(word: string) {
  const sanitizedWord = word.trim().toLowerCase();
  const wordId = sanitizedWord.replace(/[^a-z0-9]/g, '_');
  
  if (!wordId) return null;

  // 1. Try Cache First
  try {
    const docRef = doc(db, 'cachedDictionary', wordId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      console.log(`Serving dictionary result from cache for: ${sanitizedWord}`);
      return docSnap.data();
    }
  } catch (e) {
    console.warn("Cache lookup failed, proceeding to Gemini:", e);
  }

  // 2. Clear Cache Miss - Hit Gemini
  const prompt = `Dictionary for CSS: "${word}". Provide:
  - Concise Urdu meanings.
  - Urdu pronunciation written in URDU SCRIPT (e.g., for 'Apple' write 'ایپل').
  - Detailed usage explanation in Urdu.
  - 2 English examples with Urdu translations.
  Return ONLY valid JSON.`;

  try {
    const response = await safeGenerateContent(FLASH_MODEL, prompt, {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          word: { type: Type.STRING },
          urduMeanings: { type: Type.ARRAY, items: { type: Type.STRING } },
          pronunciation: { type: Type.STRING },
          explanationUrdu: { type: Type.STRING },
          examples: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: { english: { type: Type.STRING }, urdu: { type: Type.STRING } },
              required: ["english", "urdu"]
            }
          }
        },
        required: ["word", "urduMeanings", "pronunciation", "explanationUrdu", "examples"]
      }
    });

    const text = (response.text || '{}');
    const result = safeJsonParse(text, {});

    // 3. Save to Cache for future users (global cache)
    if (Object.keys(result).length > 0) {
      try {
        await setDoc(doc(db, 'cachedDictionary', wordId), {
          ...result,
          lastUsed: serverTimestamp()
        });
      } catch (e) {
        console.warn("Failed to save to cache:", e);
      }
    }

    return result;
  } catch (error) {
    throw error;
  }
}
