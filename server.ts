import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import cors from "cors";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Initialize Gemini
let ai: GoogleGenAI | null = null;
function getAI() {
  if (!ai) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("GEMINI_API_KEY environment variable is required");
      return null;
    }
    ai = new GoogleGenAI({ apiKey: key });
  }
  return ai;
}

app.post("/api/chat", async (req, res) => {
  try {
    const { message, history } = req.body;
    const aiClient = getAI();
    if (!aiClient) {
      return res.status(500).json({ error: "Gemini API key is not configured" });
    }

    const response = await aiClient.models.generateContent({
      model: "gemini-2.5-flash",
      contents: message,
      config: {
        systemInstruction: `You are an AI assistant for a local Indian grocery store called "Aashirwad Stores".
Your job is to parse the shopkeeper's natural language input (Hindi or English) to extract customer transaction details.
Identify the customer's name, the amount, and whether they paid money (paid) or took goods on credit (udhari).
You must output ONLY valid JSON using the provided schema. Do not output markdown code blocks.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            customerName: { type: Type.STRING, description: "The name of the customer." },
            amount: { type: Type.NUMBER, description: "The amount of the transaction." },
            type: { type: Type.STRING, enum: ["paid", "udhari"], description: "Whether the customer paid money or took udhari (credit)." },
            description: { type: Type.STRING, description: "Any additional details or items purchased." }
          },
          required: ["customerName", "amount", "type"]
        }
      }
    });

    if (response.text) {
      try {
        const parsed = JSON.parse(response.text);
        res.json({ result: parsed });
      } catch (e) {
        res.status(500).json({ error: "Failed to parse AI response" });
      }
    } else {
      res.status(500).json({ error: "No response from AI" });
    }

  } catch (error: any) {
    console.error("Chat API error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/sms", async (req, res) => {
  try {
    const { number, message } = req.body;
    const apiKey = process.env.FAST2SMS_API_KEY;
    
    if (!apiKey) {
      // Simulate success if no key is provided in the preview
      console.log(`[SIMULATED SMS] To: ${number}, Message: ${message}`);
      return res.json({ success: true, simulated: true });
    }

    const response = await fetch("https://www.fast2sms.com/dev/bulkV2", {
      method: "POST",
      headers: {
        "authorization": apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        route: "v3",
        sender_id: "TXTIND",
        message: message,
        language: "english",
        flash: 0,
        numbers: number
      })
    });

    const data = await response.json();
    res.json({ success: true, data });

  } catch (error: any) {
    console.error("SMS API error:", error);
    res.status(500).json({ error: error.message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
