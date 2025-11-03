import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { Story } from '../types';
import { getAppUserId } from './userId';

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

    const appUserId = await getAppUserId();
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 20000);
    const res = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, withImage: true, appUserId }),
      signal: controller.signal,
    });
    clearTimeout(t);
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
  } catch (error) {
    console.error('Error in Gemini service (client):', error);
    throw new Error('Failed to generate story and image.');
  }
}
