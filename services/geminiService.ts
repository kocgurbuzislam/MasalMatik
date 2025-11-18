import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { Story } from '../types';

function deriveBaseUrl(): string {
  const anyConst: any = Constants as any;
  // 1) Prefer app.config extra.apiUrl
  const fromConfig = anyConst?.expoConfig?.extra?.apiUrl || anyConst?.manifest?.extra?.apiUrl;
  if (fromConfig && typeof fromConfig === 'string') return fromConfig;
  // 2) Fallback to public env
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv;
  // 3) Dev fallback to local packager host
  const hostUri: string | undefined =
    anyConst?.expoConfig?.hostUri ||
    anyConst?.manifest?.debuggerHost ||
    anyConst?.manifest2?.extra?.expoGo?.developer?.url;
  if (hostUri && typeof hostUri === 'string') {
    const host = hostUri.split(':')[0];
    return `http://${host}:3001`;
  }
  // 4) Emulator defaults
  return Platform.OS === 'android' ? 'http://10.0.2.2:3001' : 'http://localhost:3001';
}

export async function generateStoryAndImage(prompt: string): Promise<Story> {
  try {
    const baseUrl = deriveBaseUrl();

    async function warmUpBackend() {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        await fetch(`${baseUrl}/health`, { signal: controller.signal });
        clearTimeout(timeoutId);
      } catch (_) {
        // Health check failures are non-fatal; proceed to main request.
      }
    }

    async function fetchWithTimeout(timeoutMs: number) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      try {
        return await fetch(`${baseUrl}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt }),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }
    }

    await warmUpBackend();

    const MAX_TIMEOUT = 90000; // 90s – Render gibi ücretsiz barındırmalarda soğuk başlatma için yeterli.
    let res = await fetchWithTimeout(MAX_TIMEOUT);

    if (!res.ok && res.status === 503) {
      // Backend henüz hazır değilse kısa bir süre bekleyip yeniden dene.
      await new Promise(resolve => setTimeout(resolve, 1500));
      res = await fetchWithTimeout(MAX_TIMEOUT);
    }

    if (!res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json().catch(() => ({}));
        const err: any = new Error(data?.message || `Backend error ${res.status}`);
        if (data?.code) err.code = data.code;
        err.status = res.status;
        throw err;
      } else {
        const text = await res.text();
        const err: any = new Error(`Backend error ${res.status}: ${text}`);
        err.status = res.status;
        throw err;
      }
    }
    const data = (await res.json()) as { text: string; imageUrl?: string };
    return {
      text: data.text,
      imageUrl: data.imageUrl || '',
    };
  } catch (error: any) {
    console.error('Error in Gemini service (client):', error);
    
    // Check if it's a rate limit error
    const errorMessage = error?.message || String(error);
    if (errorMessage.includes('429') || 
        errorMessage.includes('Too Many Requests') || 
        errorMessage.includes('Resource exhausted') ||
        errorMessage.includes('API limit')) {
      throw new Error('API limit aşıldı. Lütfen birkaç dakika bekleyip tekrar deneyin.');
    }
    
    // Check if it's a network error
    if (error?.name === 'AbortError' || errorMessage.includes('aborted')) {
      throw new Error('İstek zaman aşımına uğradı. Lütfen tekrar deneyin.');
    }
    
    throw new Error('Hikaye oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.');
  }
}
