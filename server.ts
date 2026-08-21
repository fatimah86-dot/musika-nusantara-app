import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialize GoogleGenAI
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", app: "Musika Nusantara" });
});

// Generate Koplo Song API Endpoint
app.post("/api/generate-koplo", async (req, res) => {
  try {
    const { prompt, genre = 'Dangdut Koplo', language = 'Jawa Ngoko', vocalType = 'wanita' } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    if (!process.env.GEMINI_API_KEY) {
      // Return structured fallback if no key is configured
      return res.json({
        fallback: true,
        message: "Generated via Musika Nusantara Local Engine",
      });
    }

    const ai = getGeminiClient();

    const systemInstruction = `Kamu adalah produser musik dan pencipta lagu Dangdut Koplo, Pop Jawa (Ambyar), dan Campursari legendaris di Indonesia (setara Denny Caknan, Didi Kempot, Ndarboy Genk).
Tugasmu adalah mengubah curhatan / ide / cerita pengguna menjadi lirik lagu Nusantara yang sangat berjiwa (catchy, berima indah, menyentuh hati atau asik buat goyang).
Lagu harus memiliki 2 versi aransemen:
1. Versi 1: Aransemen utama (biasanya Dangdut Koplo / Koplo Horeg 135-142 BPM dengan ketukan kendang tak-tung dan teriakan khas seperti 'Tarik Sis! Semongko!', 'Hak e Hak e!')
2. Versi 2: Aransemen alternatif (biasanya Pop Jawa Ambyar 100-110 BPM yang syahdu atau Campursari / Reggae Jawa).

Setiap bait lirik HARUS memiliki terjemahan Bahasa Indonesia yang akurat dan puitis.`;

    const promptText = `Buatlah lagu berdasarkan cerita/ide ini:
Ide Lagu: "${prompt}"
Genre Utama: ${genre}
Bahasa: ${language}
Tipe Vokal: ${vocalType}

Hasilkan JSON lengkap dengan judul lagu, lirik berseri, terjemahan Indonesia untuk tiap baris, BPM, dan catatan produser.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: promptText,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Judul lagu yang catchy dan khas Koplo/Jawa" },
            genre: { type: Type.STRING },
            storySummary: { type: Type.STRING },
            version1: {
              type: Type.OBJECT,
              properties: {
                versionName: { type: Type.STRING, description: "Contoh: Versi 1 - Koplo Horeg" },
                genre: { type: Type.STRING },
                bpm: { type: Type.NUMBER },
                mood: { type: Type.STRING },
                producerNotes: { type: Type.STRING },
                lyrics: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      time: { type: Type.NUMBER, description: "Perkiraan detik dalam lagu" },
                      section: { type: Type.STRING, description: "intro, verse, pre-chorus, chorus, kendang-drop, outro" },
                      text: { type: Type.STRING, description: "Lirik dalam bahasa yang dipilih" },
                      translation: { type: Type.STRING, description: "Terjemahan bahasa Indonesia" },
                      cue: { type: Type.STRING, description: "Teriakan khas kendang seperti 'Tarik Sis!', 'Hak e Hak e!', 'Buka Titik Joss!'" }
                    },
                    required: ["time", "text", "translation"]
                  }
                }
              },
              required: ["versionName", "genre", "bpm", "mood", "lyrics"]
            },
            version2: {
              type: Type.OBJECT,
              properties: {
                versionName: { type: Type.STRING, description: "Contoh: Versi 2 - Pop Jawa Ambyar" },
                genre: { type: Type.STRING },
                bpm: { type: Type.NUMBER },
                mood: { type: Type.STRING },
                producerNotes: { type: Type.STRING },
                lyrics: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      time: { type: Type.NUMBER },
                      section: { type: Type.STRING },
                      text: { type: Type.STRING },
                      translation: { type: Type.STRING },
                      cue: { type: Type.STRING }
                    },
                    required: ["time", "text", "translation"]
                  }
                }
              },
              required: ["versionName", "genre", "bpm", "mood", "lyrics"]
            }
          },
          required: ["title", "genre", "version1", "version2"]
        }
      }
    });

    const parsedData = JSON.parse(response.text || "{}");
    return res.json(parsedData);
  } catch (error: unknown) {
    console.error("Gemini Generation Error:", error);
    res.status(500).json({ error: "Failed to generate song lyrics", details: (error as Error).message });
  }
});

// Vite middleware & Static server
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
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Musika Nusantara server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
