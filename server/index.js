/* Simple backend for RN client to call Gemini safely (ESM) */
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { loadUsers, upsertUser, addCredits, consumeCredit, getUser, getAndMaybeResetDaily, incDailyText } from './store.js';

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
    const { prompt, appUserId = 'guest', withImage = true } = req.body || {};
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).send('Missing prompt');
    }

    // Enforce daily free text limit for non-premium users
    const FREE_LIMIT = Number(process.env.FREE_DAILY_TEXT_LIMIT || 3);
    const daily = getAndMaybeResetDaily(appUserId);
    if (!daily.premium && daily.daily_text_used >= FREE_LIMIT) {
      return res.status(429).json({ code: 'LIMIT_REACHED', message: `Günlük ücretsiz hikaye limitiniz (${FREE_LIMIT}) doldu. Premium olun veya yarın tekrar deneyin.` });
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
    // Count only when text successfully generated
    incDailyText(appUserId, 1);

    // 2) Image prompt in English derived from story
    const imagePromptGeneratorPrompt = `Create a short, descriptive English prompt for an image generation model. The image should be a vibrant, colorful, whimsical children's book illustration that captures the main scene or character of the following story. Do not describe text, just the visual scene. Story: "${storyText}"`;
    const imagePrompt = (await generateTextWithFallback(imagePromptGeneratorPrompt)).trim() + ', digital art, vibrant colors, storybook illustration';

    // 3) Gate image generation via entitlements/credits
    let imageUrl = '';
    const user = getUser(appUserId) || { premium: false, credits: 0 };
    const canGenerateImage = withImage && (user.premium || (user.credits || 0) > 0);
    if (canGenerateImage) {
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
        if (!user.premium && imageUrl) {
          // consume one credit
          consumeCredit(appUserId, 1);
        }
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

// RevenueCat webhook: set REVENUECAT_WEBHOOK_SECRET to validate requests
app.post('/api/rc/webhook', async (req, res) => {
  try {
    const secret = process.env.REVENUECAT_WEBHOOK_SECRET;
    const auth = req.headers['authorization'] || '';
    if (secret && auth !== `Bearer ${secret}`) {
      return res.status(401).send('Unauthorized');
    }
    const body = req.body || {};
    const event = body?.event || body; // some RC examples nest under event
    const appUserId = event?.app_user_id || event?.appUserId;
    if (!appUserId) return res.status(400).send('Missing app_user_id');

    const type = (event?.type || '').toString().toLowerCase();
    const entitlementIds = event?.entitlement_ids || event?.entitlements || [];
    const productId = event?.product_id || event?.productId;

    // Premium entitlement toggle
    const hasPremium = Array.isArray(entitlementIds)
      ? entitlementIds.some((e) => String(e).toLowerCase().includes('premium'))
      : false;

    if (type.includes('initial_purchase') || type.includes('renewal') || type.includes('uncancellation')) {
      // Subscription or purchase event
      if (hasPremium) upsertUser(appUserId, { premium: true });
      // Credit packs by product id
      if (productId) {
        const id = String(productId).toLowerCase();
        if (id.includes('images_50')) addCredits(appUserId, 50);
        if (id.includes('images_200')) addCredits(appUserId, 200);
      }
    }
    if (type.includes('expiration') || type.includes('cancellation')) {
      // Subscription ended
      upsertUser(appUserId, { premium: false });
    }

    return res.json({ ok: true });
  } catch (e) {
    console.error('RC webhook error:', e);
    return res.status(500).send(e?.message || 'webhook error');
  }
});

// Simple user status endpoint
app.get('/api/users/:id', (req, res) => {
  const id = req.params.id;
  const u = getUser(id) || { premium: false, credits: 0 };
  res.json(u);
});

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
