// Simple JSON file store for user entitlements and credits
// Note: On serverless/ephemeral hosts this resets on redeploy. Use DB later.
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.resolve('server', 'data');
const USERS_PATH = path.join(DATA_DIR, 'users.json');

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

export function loadUsers() {
  try {
    ensureDir();
    if (!fs.existsSync(USERS_PATH)) return {};
    const raw = fs.readFileSync(USERS_PATH, 'utf8');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveUsers(users) {
  ensureDir();
  fs.writeFileSync(USERS_PATH, JSON.stringify(users, null, 2), 'utf8');
}

export function getUser(appUserId) {
  const u = loadUsers();
  return u[appUserId];
}

export function upsertUser(appUserId, patch) {
  const u = loadUsers();
  const prev = u[appUserId] || { premium: false, credits: 0, daily_text_used: 0, daily_reset_at: null, updatedAt: null };
  const next = { ...prev, ...patch, updatedAt: new Date().toISOString() };
  u[appUserId] = next;
  saveUsers(u);
  return next;
}

export function addCredits(appUserId, amount) {
  const u = loadUsers();
  const prev = u[appUserId] || { premium: false, credits: 0 };
  const next = { ...prev, credits: Math.max(0, (prev.credits || 0) + amount), updatedAt: new Date().toISOString() };
  u[appUserId] = next;
  saveUsers(u);
  return next;
}

export function consumeCredit(appUserId, amount = 1) {
  const u = loadUsers();
  const prev = u[appUserId] || { premium: false, credits: 0 };
  if ((prev.credits || 0) < amount) return false;
  prev.credits -= amount;
  prev.updatedAt = new Date().toISOString();
  u[appUserId] = prev;
  saveUsers(u);
  return true;
}

export function getAndMaybeResetDaily(appUserId) {
  const u = loadUsers();
  const prev = u[appUserId] || { premium: false, credits: 0, daily_text_used: 0, daily_reset_at: null };
  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);
  if (prev.daily_reset_at !== todayKey) {
    prev.daily_reset_at = todayKey;
    prev.daily_text_used = 0;
    u[appUserId] = prev;
    saveUsers(u);
  }
  return prev;
}

export function incDailyText(appUserId, amount = 1) {
  const u = loadUsers();
  const prev = getAndMaybeResetDaily(appUserId);
  prev.daily_text_used = (prev.daily_text_used || 0) + amount;
  prev.updatedAt = new Date().toISOString();
  u[appUserId] = prev;
  saveUsers(u);
  return prev.daily_text_used;
}
