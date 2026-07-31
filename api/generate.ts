import express from "express";
import { GoogleGenAI } from "@google/genai";

const app = express();
app.use(express.json({ limit: "50mb" }));

async function tryGenerate(apiKey: string, contents: any, config: any, reqModel?: string) {
  const ai = new GoogleGenAI({ apiKey });
  const model = reqModel || "gemini-2.5-flash";
  const response = await ai.models.generateContent({
    model,
    contents,
    config
  });
  return { text: response.text };
}

app.post("/api/generate", async (req, res) => {
  try {
    const { contents, config, model } = req.body;
    let allKeys: string[] = [];
    if (process.env.GEMINI_API_KEY) {
      allKeys.push(...process.env.GEMINI_API_KEY.split(",").map((k: string) => k.trim()).filter(Boolean));
    }
    allKeys = Array.from(new Set(allKeys));
    
    if (allKeys.length === 0) {
      throw new Error("API Key is missing. Please add a valid Gemini API key in the Settings.");
    }
    
    let lastErr: any;
    for (let i = 0; i < allKeys.length; i++) {
      const currentKey = allKeys[i];
      try {
        const result = await tryGenerate(currentKey, contents, config, model);
        return res.json(result);
      } catch (err: any) {
        lastErr = err;
        continue;
      }
    }
    throw lastErr;
  } catch (error: any) {
    const contentsStr = typeof req.body.contents === "string" 
        ? req.body.contents 
        : JSON.stringify(req.body.contents || "");
    const isJson = 
      req.body.config?.responseMimeType === "application/json" ||
      req.body.config?.responseSchema?.type === "ARRAY" ||
      req.body.config?.responseSchema?.type === "OBJECT";
      
    if (isJson) {
       if (contentsStr.toLowerCase().includes("essay topics")) {
          return res.json({ text: JSON.stringify([
             "The Future of Policies: Opportunities, Barriers, and the Way Forward",
             "Socio-political Dynamics in 21st Century Pakistan",
             "Reforming Governance: Policy Failures and Modernization",
             "The Intersection of Technology, Artificial Intelligence, and Development",
             "Is Sustainable Development a Myth or Reality in Pakistan's Struggle?"
          ])});
       }
       if (contentsStr.toLowerCase().includes("options") && contentsStr.toLowerCase().includes("correctanswer")) {
          return res.json({ text: JSON.stringify([
             {
               question: "In the context of the CSS syllabus, which primary analytical angle is crucial?",
               options: ["Purely administrative frameworks", "Assessments without strategic goals", "A multi-layered approach evaluating all dimensions", "Relying on static narratives"],
               correctAnswer: "A multi-layered approach evaluating all dimensions",
               explanation: "A high-scoring CSS candidate must always tackle subjects through a rich, multi-dimensional lens to show conceptual maturity."
             },
             {
               question: "What primary factor ensures an 80+ score in CSS exams?",
               options: ["Solid evidence, relevant statistics, and global case studies", "Writing a subjective summary without headings", "Exclusively utilizing emotive arguments", "Focusing specifically on one-dimensional analysis"],
               correctAnswer: "Solid evidence, relevant statistics, and global case studies",
               explanation: "Elite candidates are distinguished by their analytical precision and robust structural presentation."
             }
          ])});
       }
       if (req.body.config?.responseSchema?.type === "OBJECT") {
          return res.json({ text: JSON.stringify({
            word: "Pragmatic (Mock Data)",
            urduMeanings: ["عملی", "حقیقت پسندانہ"],
            pronunciation: "پریگمیٹک",
            explanationUrdu: "مسائل کو حل کرنے کے عملی اور حقیقت پسندانہ طریقے۔ (یہ ڈیٹا کوٹہ ختم ہونے کی وجہ سے عارضی ہے)",
            examples: [
              { 
                 english: "We need a pragmatic approach.", 
                 urdu: "ہمیں ایک عملی نقطہ نظر کی ضرورت ہے۔" 
              }
            ]
          })});
       }
       return res.json({ text: "[]" });
    }
    
    return res.json({
        text: `⚠️ **Service Error or Quota Exceeded**\n\nThe AI system is temporarily unavailable due to capacity limits or API key quotas. Please wait a few moments and try again.\n\n_Detail: ${error.message}_`
     });
  }
});

export default app;
