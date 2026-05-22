import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Express API middleware configurations
  app.use(express.json());

  // Use lazy initialization for GoogleGenAI SDK to prevent app crash if API key is missing
  let aiClient: GoogleGenAI | null = null;
  function getGeminiClient() {
    if (!aiClient) {
      const key = process.env.GEMINI_API_KEY;
      if (!key) {
        throw new Error("GEMINI_API_KEY environment variable is required in secrets");
      }
      aiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build"
          }
        }
      });
    }
    return aiClient;
  }

  // API Route: Modern Gemini AI Parsing & Conversation Engine
  app.post("/api/gemini/chat", async (req, res) => {
    try {
      const { rawQuery, currentLanguage, activeAppointment, conversationHistory } = req.body;

      if (!rawQuery || typeof rawQuery !== "string") {
        return res.status(400).json({ error: "Missing or invalid 'rawQuery' parameter" });
      }

      const client = getGeminiClient();

      const systemInstruction = `You are Aura Clinical AI, a realtime multilingual healthcare voice assistant for appointment management.
Your personality: Calm, professional, friendly, conversational, empathetic, concise, human-like.
Sound like: OpenAI Voice, Siri, a modern assistant, or a professional clinic receptionist.
DO NOT sound like: hospital IVR, formal clinical documentation, chatbot script, or legal system.

CRITICAL VOICE RESPONSE STYLE RULES:
1. Maximum response length is strictly 1-2 short sentences (Keep it voice-friendly and low cognitive load!).
2. NEVER generate long robotic paragraphs or clinical jargon.
3. Use simple, direct conversational speech.
4. Ask only ONE question at a time.
5. NEVER list all doctors or specialties unless specifically asked by the user.
6. If the user already provided info (e.g. doctor name, specialty, time, or date), do NOT ask for it again; continue naturally to the next step.

SUPPORTED LANGUAGES:
- English, Hindi, Tamil.
- Detect the user's language automatically and continue the conversation in that same language.
- Keep the voice-friendly short responses in the detected language.

CLINICAL INFORMATION AND AVAILABILITY:
Currently we have 4 doctors on the roster:
1. Dr. Angela Patel (Cardiologist)
   - Slots: 09:00 AM (available), 02:00 PM (available).
   - Conflicted Slots: 11:30 AM is conflicted. If selected, you MUST report conflict and offer alternatives: ['09:00 AM', '02:00 PM', 'Tomorrow 10:00 AM'].
2. Dr. Rajesh Kumar (Pediatrician)
   - Slots: 09:30 AM (available), 10:30 AM (available), 03:00 PM (available).
3. Dr. Sarah Jenkins (Neurologist)
   - Slots: 10:00 AM (available), 03:30 PM (available).
   - Conflicted Slots: 12:00 PM is conflicted. If selected, report conflict and offer alternatives: ['10:00 AM', '03:30 PM', 'Tomorrow 11:00 AM'].
4. Dr. Venkat Rao (General Physician)
   - Slots: 11:00 AM (available), 11:30 AM (available), 04:00 PM (available).

REALTIME PROCESSING PHRASES:
In your 'responseText', feel free to use natural realtime updates if booking/updating, like "Checking availability...", "Fetching available slots...", "Updating your appointment...", etc. but keep it very human.

INTENT FLOWS AND CORRESPONDING ACTIONS:
- BOOK:
  - If user wants to book, collect doctor/specialty, preferred date, and preferred time.
  - If they mention a doctor/specialty, do NOT ask again or list all doctors, just greet and ask: "Sure. What date would you prefer?"
  - If date/time specified, check if slot is available or conflicted. If conflicted, output conflictDetected=true and list alternative slots. Otherwise confirm slot by setting actionConfirmed=true.
- RESCHEDULE:
  - If user wants to reschedule (identifying an existing appointment), collect new preferred date/time. Check alternatives if conflicted, and confirm slot.
- CANCEL:
  - If user wants to cancel (identifying an existing appointment), ask to confirm, then cancel.
- OTHER / GREETING:
  - Keep generic queries simple, warm, and low-latency. Do NOT list your options/menu robotically!

Active Appointment context: ${JSON.stringify(activeAppointment || null)}
Conversation context: ${JSON.stringify(conversationHistory || [])}
Manually force-aligned/current user language preference: ${currentLanguage || "English"}

Your response MUST be parsed according to the required schema, providing a natural conversational voice response ('responseText') in the detected language, alongside structured state indicators for the web application's states.`;

      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `The patient says: "${rawQuery}"`,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              responseText: {
                type: Type.STRING,
                description: "Concise clinical reply of 1-2 short sentences in the user's detected language. Highly conversational and natural, voice-friendly, asking only ONE question at a time."
              },
              detectedLang: {
                type: Type.STRING,
                description: "The language detected and spoken. Must be one of: 'English', 'Hindi', 'Tamil' (or others like 'Telugu', 'Kannada' if matched)."
              },
              intent: {
                type: Type.STRING,
                description: "The clinical operation intent. Must be 'BOOK', 'RESCHEDULE', 'CANCEL', 'GREETING', or 'OTHER'."
              },
              doctorName: {
                type: Type.STRING,
                description: "Name of the doctor mentioned or found in context (e.g. 'Dr. Angela Patel', 'Dr. Rajesh Kumar', 'Dr. Sarah Jenkins', 'Dr. Venkat Rao', or 'None')."
              },
              specialty: {
                type: Type.STRING,
                description: "The medical specialty mentioned or found in context (e.g. 'Cardiologist', 'Pediatrician', 'Neurologist', 'General Physician', or 'None')."
              },
              preferredDate: {
                type: Type.STRING,
                description: "Date slot specified or found in context, e.g. 'tomorrow morning', 'Friday afternoon', 'May 22' or 'None'."
              },
              preferredTime: {
                type: Type.STRING,
                description: "Time slot specified or found in context, e.g. '11:00 AM', '09:30 AM' or 'None'."
              },
              actionConfirmed: {
                type: Type.BOOLEAN,
                description: "Whether the appointment booking, reschedule, or cancel action is fully confirmed and finalized with the user."
              },
              updatedAppointment: {
                type: Type.OBJECT,
                description: "The active appointment's details if action is confirmed. Otherwise null.",
                properties: {
                  doctorName: { type: Type.STRING },
                  specialty: { type: Type.STRING },
                  date: { type: Type.STRING },
                  time: { type: Type.STRING },
                  status: { type: Type.STRING, description: "'CONFIRMED' or 'CANCELLED'" }
                },
                required: ["doctorName", "specialty", "date", "time", "status"]
              },
              conflictDetected: {
                type: Type.BOOLEAN,
                description: "Set to true if the selected slot is conflicted/unavailable on the clinic roster."
              },
              alternatives: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Alternative slots (e.g., ['09:00 AM', '02:00 PM', 'Tomorrow 10:00 AM']) if conflict is detected."
              },
              reasoning: {
                type: Type.STRING,
                description: "Short internal reasoning trace for telemetry logging."
              }
            },
            required: [
              "responseText",
              "detectedLang",
              "intent",
              "doctorName",
              "specialty",
              "preferredDate",
              "preferredTime",
              "actionConfirmed",
              "conflictDetected",
              "alternatives",
              "reasoning"
            ]
          }
        }
      });

      const parsedData = JSON.parse(response.text || "{}");
      res.json(parsedData);
    } catch (err: any) {
      console.error("Gemini request failure:", err);
      res.status(500).json({ error: err.message || "Failed to process chat response with Gemini" });
    }
  });

  // API Route: Google Translate Audio TTS proxy to bypass Sandbox / CORS policies
  app.get("/api/tts", async (req, res) => {
    try {
      const q = req.query.q as string;
      const tl = (req.query.tl as string) || "en";

      if (!q) {
        return res.status(400).json({ error: "Missing query parameter 'q'" });
      }

      // We use translate.googleapis.com with client=gtx as primary, as it is incredibly stable and bypasses Cloud Run IP level blocks/captchas.
      const url1 = `https://translate.googleapis.com/translate_tts?ie=UTF-8&tl=${encodeURIComponent(tl)}&client=gtx&q=${encodeURIComponent(q)}`;
      const url2 = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${encodeURIComponent(tl)}&client=tw-ob&q=${encodeURIComponent(q)}`;

      let response;
      try {
        response = await fetch(url1, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          },
        });
        
        if (!response.ok) {
          console.warn(`Primary TTS (translate.googleapis.com) returned status ${response.status}. Retrying fallback...`);
          response = await fetch(url2, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            },
          });
        }
      } catch (fetchErr) {
        console.warn("Primary fetch error. Retrying fallback...", fetchErr);
        response = await fetch(url2, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          },
        });
      }

      if (!response.ok) {
        throw new Error(`Google TTS failed with status code ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Return high-quality compressed audio
      res.setHeader("Content-Type", "audio/mpeg");
      res.setHeader("Content-Length", buffer.length);
      res.setHeader("Cache-Control", "public, max-age=86400");
      res.send(buffer);
    } catch (err: any) {
      console.error("Express Server TTS Proxy failure:", err);
      res.status(500).json({ error: err.message || "Failed to fetch TTS resource stream" });
    }
  });

  // Vite development middleware vs Static Production build setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server successfully listening on port ${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Crucial: Server initialization failed:", err);
});
