import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { User, FikFapAccount, DailyStat, AppSettings } from '../src/types.js';

interface DatabaseSchema {
  users: Array<User & { passwordHash: string; salt: string }>;
  accounts: Array<FikFapAccount & { fikfapPasswordEncrypted?: string }>;
  dailyStats: DailyStat[];
  settings: Record<string, AppSettings>;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Password hashing utilities
export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const generatedSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, generatedSalt, 1000, 64, 'sha512').toString('hex');
  return { hash, salt: generatedSalt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const result = hashPassword(password, salt);
  return result.hash === hash;
}

// Simple reversible encryption for credentials
const ENCRYPTION_KEY = crypto.scryptSync(process.env.APP_SECRET || 'fikfap-tracker-secret-key-2025', 'salt', 32);
const IV_LENGTH = 16;

export function encryptCredential(text: string): string {
  if (!text) return '';
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

export function decryptCredential(text: string): string {
  try {
    if (!text || !text.includes(':')) return text;
    const parts = text.split(':');
    const iv = Buffer.from(parts.shift()!, 'hex');
    const encryptedText = parts.join(':');
    const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (e) {
    return '***';
  }
}

// Empty initial schema (No mock data)
function generateSeedData(): DatabaseSchema {
  return {
    users: [],
    accounts: [],
    dailyStats: [],
    settings: {},
  };
}

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error('Failed to read database file, generating seeds:', e);
    }
    const seeds = generateSeedData();
    this.saveData(seeds);
    return seeds;
  }

  private saveData(dataToSave: DatabaseSchema) {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(dataToSave, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to write database file:', e);
    }
  }

  public save() {
    this.saveData(this.data);
  }

  // User Operations
  public findUserByEmail(email: string) {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public findUserById(id: string) {
    return this.data.users.find(u => u.id === id);
  }

  public createUser(email: string, password: string, name: string): User {
    const { hash, salt } = hashPassword(password);
    const newUser = {
      id: 'usr_' + crypto.randomUUID().slice(0, 8),
      email: email.toLowerCase(),
      name,
      role: 'user',
      createdAt: new Date().toISOString(),
      passwordHash: hash,
      salt,
    };
    this.data.users.push(newUser);
    this.data.settings[newUser.id] = {
      autoRefreshIntervalMinutes: 5,
      notifyOnError: true,
      notificationEmail: email,
      webhookUrl: '',
      autoSyncEnabled: true,
    };
    this.save();
    const { passwordHash: _, salt: __, ...userProfile } = newUser;
    return userProfile;
  }

  // Account Operations
  public getAccounts(userId: string): FikFapAccount[] {
    return this.data.accounts
      .filter(a => a.userId === userId)
      .map(({ fikfapPasswordEncrypted: _, ...rest }) => rest);
  }

  public getAccountById(id: string, userId: string): (FikFapAccount & { fikfapPasswordEncrypted?: string }) | undefined {
    return this.data.accounts.find(a => a.id === id && a.userId === userId);
  }

  public addAccount(userId: string, accountData: Partial<FikFapAccount> & { fikfapPassword?: string }): FikFapAccount {
    const now = new Date().toISOString();
    const id = 'acc_' + crypto.randomUUID().slice(0, 8);
    const newAccount: FikFapAccount & { fikfapPasswordEncrypted?: string } = {
      id,
      userId,
      fikfapEmail: accountData.fikfapEmail || '',
      fikfapUsername: accountData.fikfapUsername || accountData.fikfapEmail?.split('@')[0] || 'fikfap_user',
      label: accountData.label || '',
      status: 'active',
      totalVideos: accountData.totalVideos ?? 0,
      totalLinkClicks: accountData.totalLinkClicks ?? 0,
      totalViews: accountData.totalViews ?? 0,
      totalFollowers: accountData.totalFollowers ?? 0,
      totalLikes: accountData.totalLikes ?? 0,
      todayVideos: accountData.todayVideos ?? 0,
      todayLinkClicks: accountData.todayLinkClicks ?? 0,
      todayViews: accountData.todayViews ?? 0,
      targetBioLink: accountData.targetBioLink || '',
      proxy: accountData.proxy || '',
      syncFrequency: accountData.syncFrequency || 'hourly',
      lastUpdated: now,
      createdAt: now,
      fikfapPasswordEncrypted: accountData.fikfapPassword ? encryptCredential(accountData.fikfapPassword) : undefined,
      recentVideos: accountData.recentVideos || [],
      syncLogs: [
        {
          id: 'log_' + Date.now(),
          timestamp: now,
          status: 'success',
          message: 'Account added to tracking system.',
          durationMs: 450,
        }
      ]
    };

    this.data.accounts.push(newAccount);
    this.save();
    const { fikfapPasswordEncrypted: _, ...publicAccount } = newAccount;
    return publicAccount;
  }

  public updateAccount(id: string, userId: string, updates: Partial<FikFapAccount> & { fikfapPassword?: string }): FikFapAccount | null {
    const index = this.data.accounts.findIndex(a => a.id === id && a.userId === userId);
    if (index === -1) return null;

    const existing = this.data.accounts[index];
    const updated: FikFapAccount & { fikfapPasswordEncrypted?: string } = {
      ...existing,
      ...updates,
      lastUpdated: updates.lastUpdated || new Date().toISOString(),
    };

    if (updates.fikfapPassword) {
      updated.fikfapPasswordEncrypted = encryptCredential(updates.fikfapPassword);
    }

    this.data.accounts[index] = updated;
    this.save();
    const { fikfapPasswordEncrypted: _, ...publicAccount } = updated;
    return publicAccount;
  }

  public deleteAccount(id: string, userId: string): boolean {
    const initialLen = this.data.accounts.length;
    this.data.accounts = this.data.accounts.filter(a => !(a.id === id && a.userId === userId));
    this.data.dailyStats = this.data.dailyStats.filter(s => s.accountId !== id);
    this.save();
    return this.data.accounts.length < initialLen;
  }

  public addSyncLog(accountId: string, log: { status: 'success' | 'warning' | 'error'; message: string; durationMs: number; details?: string }) {
    const account = this.data.accounts.find(a => a.id === accountId);
    if (!account) return;

    if (!account.syncLogs) account.syncLogs = [];
    account.syncLogs.unshift({
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      timestamp: new Date().toISOString(),
      ...log,
    });
    // Keep max 20 logs
    if (account.syncLogs.length > 20) {
      account.syncLogs = account.syncLogs.slice(0, 20);
    }
    this.save();
  }

  // Daily Stats Operations
  public recordDailyStat(stat: Omit<DailyStat, 'id'>) {
    const id = `stat_${stat.accountId}_${stat.date}`;
    const existingIndex = this.data.dailyStats.findIndex(s => s.id === id);
    const newStat: DailyStat = { ...stat, id };

    if (existingIndex >= 0) {
      this.data.dailyStats[existingIndex] = newStat;
    } else {
      this.data.dailyStats.push(newStat);
    }
    this.save();
  }

  public getDailyStats(userId: string, days = 7) {
    const userAccountIds = new Set(this.data.accounts.filter(a => a.userId === userId).map(a => a.id));
    return this.data.dailyStats.filter(s => userAccountIds.has(s.accountId));
  }

  // Settings
  public getSettings(userId: string): AppSettings {
    if (!this.data.settings[userId]) {
      this.data.settings[userId] = {
        autoRefreshIntervalMinutes: 5,
        notifyOnError: true,
        notificationEmail: '',
        webhookUrl: '',
        autoSyncEnabled: true,
      };
      this.save();
    }
    return this.data.settings[userId];
  }

  public updateSettings(userId: string, newSettings: Partial<AppSettings>): AppSettings {
    const current = this.getSettings(userId);
    this.data.settings[userId] = { ...current, ...newSettings };
    this.save();
    return this.data.settings[userId];
  }
}

export const db = new Database();
