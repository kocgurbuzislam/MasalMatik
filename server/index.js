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

// Simple rate limiting - track last request time
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 2000; // Minimum 2 seconds between requests

app.post('/api/generate', async (req, res) => {
  try {
    // Simple rate limiting to prevent too many requests
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    lastRequestTime = Date.now();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).send('Missing GEMINI_API_KEY');
    }
    const { prompt } = req.body || {};
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).send('Missing prompt');
    }

    const genAI = new GoogleGenerativeAI(apiKey, { apiVersion: 'v1' });
    
    // Retry function with exponential backoff
    async function sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    async function generateTextWithFallback(promptText, retries = 1) {
      // Use only gemini-1.5-flash (most stable, less likely to hit rate limits)
      const models = ['gemini-1.5-flash'];
      let lastErr;
      
      for (let attempt = 0; attempt <= retries; attempt++) {
        for (const m of models) {
          try {
            // Exponential backoff: wait before retry
            if (attempt > 0) {
              const waitTime = Math.min(2000 * Math.pow(2, attempt), 10000); // Max 10 seconds
              console.log(`Retrying with ${m} after ${waitTime}ms (attempt ${attempt + 1}/${retries + 1})`);
              await sleep(waitTime);
            }
            
            const model = genAI.getGenerativeModel({ model: m });
            const resp = await model.generateContent(promptText);
            return resp.response.text();
          } catch (e) {
            lastErr = e;
            const msg = String(e?.message || '').toLowerCase();
            const statusCode = e?.status || e?.code || '';
            
            // If it's a rate limit error, try next model or retry
            if (msg.includes('429') || msg.includes('too many requests') || msg.includes('resource exhausted')) {
              console.warn(`Rate limit hit for ${m}, trying next model or retry...`);
              if (attempt < retries) {
                continue; // Try next model or retry
              }
              // If all retries exhausted, throw user-friendly error
              throw new Error('API limit aşıldı. Lütfen birkaç dakika bekleyip tekrar deneyin.');
            }
            
            if (msg.includes('not found') || msg.includes('not supported')) {
              console.warn(`Text model ${m} unsupported; trying next...`);
              continue;
            }
            
            // For other errors, break and try next model
            if (attempt < retries) {
              continue;
            }
          }
        }
      }
      
      // If we get here, all models and retries failed
      if (lastErr) {
        const msg = String(lastErr?.message || '').toLowerCase();
        if (msg.includes('429') || msg.includes('too many requests') || msg.includes('resource exhausted')) {
          throw new Error('API limit aşıldı. Lütfen birkaç dakika bekleyip tekrar deneyin.');
        }
      }
      
      throw lastErr || new Error('Tüm modeller başarısız oldu. Lütfen daha sonra tekrar deneyin.');
    }

    // Generate story text only (no image generation)
    const storyPrompt = `Bana "${prompt}" hakkında, çocuklar için yazılmış, 3-4 paragraflık basit, eğlenceli ve sihirli bir hikaye yaz. Hikayenin sonunda mutlaka bir ders olsun.`;
    const storyText = await generateTextWithFallback(storyPrompt);

    // Return only story text (no image)
    return res.json({ text: storyText, imageUrl: '' });
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
