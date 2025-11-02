import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { Story } from '../types';

function deriveBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv;
  const anyConst: any = Constants as any;
  const hostUri: string | undefined =
    anyConst?.expoConfig?.hostUri ||
    anyConst?.manifest?.debuggerHost ||
    anyConst?.manifest2?.extra?.expoGo?.developer?.url;
  if (hostUri && typeof hostUri === 'string') {
    const host = hostUri.split(':')[0];
    return `http://${host}:3001`;
  }
  return Platform.OS === 'android' ? 'http://10.0.2.2:3001' : 'http://localhost:3001';
}

export async function generateStoryAndImage(prompt: string): Promise<Story> {
  try {
    const baseUrl = deriveBaseUrl();

    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 20000);
    const res = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
      signal: controller.signal,
    });
    clearTimeout(t);
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Backend error ${res.status}: ${text}`);
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
