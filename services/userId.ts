import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'appUserId';

function randomId(): string {
  const rand = Math.random().toString(36).slice(2);
  const ts = Date.now().toString(36);
  return `mm_${ts}_${rand}`;
}

export async function getAppUserId(): Promise<string> {
  try {
    const existing = await AsyncStorage.getItem(KEY);
    if (existing) return existing;
    const id = randomId();
    await AsyncStorage.setItem(KEY, id);
    return id;
  } catch {
    // Fallback to volatile id
    return randomId();
  }
}

