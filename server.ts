import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Needed for large text inputs
  app.use(express.json({ limit: "50mb" }));

  async function tryGenerate(apiKey: string, contents: any, config: any, reqModel?: string) {
    const ai = new GoogleGenAI({ apiKey });
    
    // Prioritize passed model, then 3.5-flash
    const model = reqModel || "gemini-3.5-flash";

    try {
      console.log(`[API] Using single model ${model}...`);
      const response = await ai.models.generateContent({
        model,
        contents,
        config
      });
      return { text: response.text };
    } catch (err: any) {
      // Just throw to the outer try/catch
      throw err;
    }
  }

  // Generate Endpoint
  app.post("/api/generate", async (req, res) => {
    try {
      const { contents, config, model } = req.body;
      
      let allKeys: string[] = [];
      if (process.env.GEMINI_API_KEY) {
        allKeys.push(...process.env.GEMINI_API_KEY.split(",").map((k: string) => k.trim()).filter(Boolean));
      }

      // De-duplicate keys while preserving order
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
          const msg = err?.message?.toLowerCase() || "";
          const isInvalidKey = msg.includes("api key not valid") || msg.includes("api_key_invalid") || msg.includes("leaked") || err?.status === 400 || err?.status === 403;
          const isQuotaOrNotFound = err?.status === 429 || err?.status === 404 || msg.includes("429") || msg.includes("quota") || msg.includes("not found");
          
          if (isQuotaOrNotFound && model && (model.includes("2.5") || model.includes("3.5"))) {
             try {
                const fallbackModelResult = await tryGenerate(currentKey, contents, config, "gemini-1.5-flash");
                return res.json(fallbackModelResult);
             } catch(fallbackModelErr) {
                lastErr = fallbackModelErr;
                continue; // Move to the next API key
             }
          }
          
          lastErr = err;
          if (isInvalidKey || isQuotaOrNotFound) {
            continue; // Move to the next API key
          } else {
            throw err; // For structural or other unrecoverable errors, stop iterating
          }
        }
      }

      throw lastErr; // If all keys failed, throw the last error encountered
    } catch (error: any) {
      console.error("[API ERROR]:", error.message);
      return res.status(500).json({ error: error.message || "An unexpected error occurred during generation." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    // Using express.static as expected
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);
