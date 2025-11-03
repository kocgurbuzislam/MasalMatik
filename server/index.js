/* Simple backend for RN client to call Gemini safely (ESM) */
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

const PORT = process.env.PORT || 3001;

app.post('/api/ggenerate', async (_req, res) => res.status(404).send('moved'));

app.post('/api/generate', async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).send('Missing GEMINI_API_KEY');
    }
    const { prompt, withImage = false } = req.body || {};
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).send('Missing prompt');
    }

    const genAI = new GoogleGenerativeAI(apiKey, { apiVersion: 'v1' });
    async function generateTextWithFallback(promptText) {
      const models = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];
      let lastErr;
      for (const m of models) {
        try {
          const model = genAI.getGenerativeModel({ model: m });
          const resp = await model.generateContent(promptText);
          return resp.response.text();
        } catch (e) {
          lastErr = e;
          const msg = String(e?.message || '').toLowerCase();
          if (msg.includes('not found') || msg.includes('not supported')) {
            console.warn(`Text model ${m} unsupported; trying next...`);
            continue;
          }
          break;
        }
      }
      throw lastErr || new Error('All text models failed');
    }

    // 1) Story text
    const storyPrompt = `Bana "${prompt}" hakkında, çocuklar için yazılmış, 3-4 paragraflık basit, eğlenceli ve sihirli bir hikaye yaz. Hikayenin sonunda mutlaka bir ders olsun.`;
    const storyText = await generateTextWithFallback(storyPrompt);

    // 2) Image prompt in English derived from story
    const imagePromptGeneratorPrompt = `Create a short, descriptive English prompt for an image generation model. The image should be a vibrant, colorful, whimsical children's book illustration that captures the main scene or character of the following story. Do not describe text, just the visual scene. Story: "${storyText}"`;
    const imagePrompt = (await generateTextWithFallback(imagePromptGeneratorPrompt)).trim() + ', digital art, vibrant colors, storybook illustration';

    // 3) Generate image via Images API (optional)
    let imageUrl = '';
    if (withImage) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0:generateImage?key=${apiKey}`;
      const imgRes = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: { text: imagePrompt },
          imageGenerationConfig: {
            numberOfImages: 1,
            aspectRatio: '1:1',
            mimeType: 'image/png',
          },
        }),
      });
      if (imgRes.ok) {
        const imgJson = await imgRes.json();
        const base64 = (imgJson?.generatedImages?.[0]?.image?.imageBytes) || (imgJson?.images?.[0]?.image?.bytes) || '';
        imageUrl = base64 ? `data:image/png;base64,${base64}` : '';
      } else {
        const errText = await imgRes.text();
        console.warn('Image generation error:', imgRes.status, errText);
      }
    }

    return res.json({ text: storyText, imageUrl });
  } catch (err) {
    console.error('Backend error:', err);
    return res.status(500).send(err?.message || 'Internal error');
  }
});

app.get('/health', (_req, res) => res.send('ok'));
// Root route for platform health checks
app.get('/', (_req, res) => res.status(200).send('ok'));

// Debug: list available models for this API key (v1)
app.get('/api/models', async (_req, res) => {
  try {
    const key = process.env.GEMINI_API_KEY;
    if (!key) return res.status(500).send('Missing GEMINI_API_KEY');
    const r = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${key}`);
    const j = await r.json();
    return res.json(j);
  } catch (e) {
    console.error('List models error:', e);
    return res.status(500).send(e?.message || 'list models failed');
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
