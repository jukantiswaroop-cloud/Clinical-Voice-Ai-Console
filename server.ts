import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Express API middleware configurations
  app.use(express.json());

  // API Route: Google Translate Audio TTS proxy to bypass Sandbox / CORS policies
  app.get("/api/tts", async (req, res) => {
    try {
      const q = req.query.q as string;
      const tl = (req.query.tl as string) || "en";

      if (!q) {
        return res.status(400).json({ error: "Missing query parameter 'q'" });
      }

      // Request Google Translate TTS directly using standard User-Agent header (free translation endpoint)
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${encodeURIComponent(tl)}&client=tw-ob&q=${encodeURIComponent(q)}`;

      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      });

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
