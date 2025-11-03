import { Story } from '../types';

const STORAGE_KEY = 'saved_stories';
const DAILY_LIMIT_KEY = 'daily_limit_data';

// Check if we're in a web environment
function isWeb(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

// Web: localStorage
async function saveStoryWeb(story: Story): Promise<void> {
  try {
    const stories = await getAllStoriesWeb();
    stories.unshift(story);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stories));
  } catch (error) {
    console.error('Error saving story:', error);
  }
}

async function getAllStoriesWeb(): Promise<Story[]> {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading stories:', error);
    return [];
  }
}

async function deleteStoryWeb(storyId: string): Promise<void> {
  try {
    const stories = await getAllStoriesWeb();
    const filtered = stories.filter(s => s.id !== storyId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting story:', error);
  }
}

// React Native: AsyncStorage (dynamic import)
async function saveStoryNative(story: Story): Promise<void> {
  try {
    const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
    const stories = await getAllStoriesNative();
    stories.unshift(story);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(stories));
  } catch (error) {
    console.error('Error saving story:', error);
  }
}

async function getAllStoriesNative(): Promise<Story[]> {
  try {
    const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading stories:', error);
    return [];
  }
}

async function deleteStoryNative(storyId: string): Promise<void> {
  try {
    const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
    const stories = await getAllStoriesNative();
    const filtered = stories.filter(s => s.id !== storyId);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting story:', error);
  }
}

// Public API
export async function saveStory(story: Story): Promise<void> {
  if (isWeb()) {
    await saveStoryWeb(story);
    // Increment daily count when story is saved
    await incrementDailyStoryCount();
  } else {
    await saveStoryNative(story);
    // Increment daily count when story is saved
    await incrementDailyStoryCount();
  }
}

export async function getAllStories(): Promise<Story[]> {
  if (isWeb()) {
    return await getAllStoriesWeb();
  } else {
    return await getAllStoriesNative();
  }
}

export async function deleteStory(storyId: string): Promise<void> {
  if (isWeb()) {
    await deleteStoryWeb(storyId);
  } else {
    await deleteStoryNative(storyId);
  }
}

export async function clearAllStories(): Promise<void> {
  if (isWeb()) {
    localStorage.removeItem(STORAGE_KEY);
  } else {
    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing stories:', error);
    }
  }
}

// Daily limit data structure
interface DailyLimitData {
  count: number;
  firstStoryTime: number; // Timestamp of first story created in current period
  lastResetTime: number; // Timestamp when limit was last reset
}

// Helper function to check if 24 hours have passed
function is24HoursPassed(firstStoryTime: number): boolean {
  if (firstStoryTime === 0) return false; // No story created yet
  const now = Date.now();
  const hoursPassed = (now - firstStoryTime) / (1000 * 60 * 60);
  return hoursPassed >= 24;
}

// Get daily limit data (Web)
async function getDailyLimitDataWeb(): Promise<DailyLimitData | null> {
  try {
    const data = localStorage.getItem(DAILY_LIMIT_KEY);
    if (!data) return null;
    const parsed = JSON.parse(data) as DailyLimitData;
    
    // Check if 24 hours have passed since first story
    if (is24HoursPassed(parsed.firstStoryTime)) {
      // Reset the limit
      const resetData: DailyLimitData = {
        count: 0,
        firstStoryTime: 0,
        lastResetTime: Date.now(),
      };
      localStorage.setItem(DAILY_LIMIT_KEY, JSON.stringify(resetData));
      return resetData;
    }
    
    return parsed;
  } catch (error) {
    console.error('Error loading daily limit data:', error);
    return null;
  }
}

// Get daily limit data (Native)
async function getDailyLimitDataNative(): Promise<DailyLimitData | null> {
  try {
    const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
    const data = await AsyncStorage.getItem(DAILY_LIMIT_KEY);
    if (!data) return null;
    const parsed = JSON.parse(data) as DailyLimitData;
    
    // Check if 24 hours have passed since first story
    if (is24HoursPassed(parsed.firstStoryTime)) {
      // Reset the limit
      const resetData: DailyLimitData = {
        count: 0,
        firstStoryTime: 0,
        lastResetTime: Date.now(),
      };
      await AsyncStorage.setItem(DAILY_LIMIT_KEY, JSON.stringify(resetData));
      return resetData;
    }
    
    return parsed;
  } catch (error) {
    console.error('Error loading daily limit data:', error);
    return null;
  }
}

// Set daily limit data (Web)
async function setDailyLimitDataWeb(data: DailyLimitData): Promise<void> {
  try {
    localStorage.setItem(DAILY_LIMIT_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving daily limit data:', error);
  }
}

// Set daily limit data (Native)
async function setDailyLimitDataNative(data: DailyLimitData): Promise<void> {
  try {
    const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
    await AsyncStorage.setItem(DAILY_LIMIT_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving daily limit data:', error);
  }
}

// Get count of stories created in current 24-hour period
export async function getTodayStoryCount(): Promise<number> {
  if (isWeb()) {
    const data = await getDailyLimitDataWeb();
    return data?.count || 0;
  } else {
    const data = await getDailyLimitDataNative();
    return data?.count || 0;
  }
}

// Increment daily story count (called when a story is created)
export async function incrementDailyStoryCount(): Promise<void> {
  if (isWeb()) {
    let data = await getDailyLimitDataWeb(); // This already handles 24-hour reset
    const now = Date.now();
    
    if (!data || data.count === 0 || data.firstStoryTime === 0) {
      // First story of the period or reset period
      const newData: DailyLimitData = {
        count: 1,
        firstStoryTime: now,
        lastResetTime: data?.lastResetTime || now,
      };
      await setDailyLimitDataWeb(newData);
    } else {
      // Increment existing count
      const newData: DailyLimitData = {
        ...data,
        count: data.count + 1,
      };
      await setDailyLimitDataWeb(newData);
    }
  } else {
    let data = await getDailyLimitDataNative(); // This already handles 24-hour reset
    const now = Date.now();
    
    if (!data || data.count === 0 || data.firstStoryTime === 0) {
      // First story of the period or reset period
      const newData: DailyLimitData = {
        count: 1,
        firstStoryTime: now,
        lastResetTime: data?.lastResetTime || now,
      };
      await setDailyLimitDataNative(newData);
    } else {
      // Increment existing count
      const newData: DailyLimitData = {
        ...data,
        count: data.count + 1,
      };
      await setDailyLimitDataNative(newData);
    }
  }
}

// Daily limit constant
export const DAILY_STORY_LIMIT = 3;

