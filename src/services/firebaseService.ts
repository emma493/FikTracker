import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { User, FikFapAccount, DashboardStats, AppSettings } from '../types';

export const firebaseService = {
  // ==========================================
  // AUTHENTICATION
  // ==========================================

  async login(email: string, password: string): Promise<User> {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const fbUser = userCredential.user;
    return this.mapFirebaseUser(fbUser);
  },

  async register(email: string, password: string, displayName?: string): Promise<User> {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const fbUser = userCredential.user;
    if (displayName) {
      await updateProfile(fbUser, { displayName });
    }

    // Initialize user profile in Firestore
    const userProfile: User = {
      id: fbUser.uid,
      email: fbUser.email || email,
      name: displayName || email.split('@')[0],
      role: 'creator',
      createdAt: new Date().toISOString(),
    };

    await setDoc(doc(db, 'users', fbUser.uid), userProfile);
    return userProfile;
  },

  async loginQuickDemo(): Promise<User> {
    // Sign in anonymously for direct access
    const userCredential = await signInAnonymously(auth);
    const fbUser = userCredential.user;
    const userProfile: User = {
      id: fbUser.uid,
      email: fbUser.email || 'guest@fikfap-tracker.local',
      name: 'Guest User',
      role: 'creator',
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'users', fbUser.uid), userProfile, { merge: true });
    return userProfile;
  },

  async logout(): Promise<void> {
    await signOut(auth);
  },

  onAuthChange(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      if (fbUser) {
        const userDocRef = doc(db, 'users', fbUser.uid);
        try {
          const snap = await getDoc(userDocRef);
          if (snap.exists()) {
            callback(snap.data() as User);
          } else {
            callback(this.mapFirebaseUser(fbUser));
          }
        } catch {
          callback(this.mapFirebaseUser(fbUser));
        }
      } else {
        // Automatically sign in anonymously in background without interrupting the user
        try {
          const userCredential = await signInAnonymously(auth);
          const newUser = this.mapFirebaseUser(userCredential.user);
          callback(newUser);
        } catch (e) {
          console.warn('Anonymous sign in fallback:', e);
          // Fallback guest user object so dashboard works immediately
          callback({
            id: 'guest_user',
            email: 'workspace@fikfap.local',
            name: 'Workspace',
            role: 'creator',
            createdAt: new Date().toISOString(),
          });
        }
      }
    });
  },

  mapFirebaseUser(fbUser: FirebaseUser): User {
    return {
      id: fbUser.uid,
      email: fbUser.email || 'anonymous@fikfap.io',
      name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Creator User',
      role: 'creator',
      createdAt: fbUser.metadata.creationTime || new Date().toISOString(),
    };
  },

  // ==========================================
  // FIK FAP ACCOUNTS (FIRESTORE)
  // ==========================================

  subscribeAccounts(userId: string, callback: (accounts: FikFapAccount[]) => void) {
    const q = query(collection(db, 'accounts'), where('userId', '==', userId));
    return onSnapshot(
      q,
      snapshot => {
        const accounts: FikFapAccount[] = [];
        snapshot.forEach(docSnap => {
          accounts.push({
            id: docSnap.id,
            ...(docSnap.data() as Omit<FikFapAccount, 'id'>),
          });
        });
        // Sort by lastUpdated or createdAt descending
        accounts.sort((a, b) => new Date(b.lastUpdated || b.createdAt).getTime() - new Date(a.lastUpdated || a.createdAt).getTime());
        callback(accounts);
      },
      error => {
        console.error('Firestore accounts subscription error:', error);
      }
    );
  },

  async getAccounts(userId: string): Promise<FikFapAccount[]> {
    const q = query(collection(db, 'accounts'), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    const accounts: FikFapAccount[] = [];
    snapshot.forEach(docSnap => {
      accounts.push({
        id: docSnap.id,
        ...(docSnap.data() as Omit<FikFapAccount, 'id'>),
      });
    });
    accounts.sort((a, b) => new Date(b.lastUpdated || b.createdAt).getTime() - new Date(a.lastUpdated || a.createdAt).getTime());
    return accounts;
  },

  async addAccount(userId: string, data: Partial<FikFapAccount>): Promise<FikFapAccount> {
    const now = new Date().toISOString();
    const accountRef = doc(collection(db, 'accounts'));
    const newAccount: FikFapAccount = {
      id: accountRef.id,
      userId,
      fikfapEmail: data.fikfapEmail || '',
      fikfapUsername: data.fikfapUsername || data.fikfapEmail?.split('@')[0] || 'fikfap_user',
      label: data.label || '',
      status: (data.status as any) || 'active',
      totalVideos: Number(data.totalVideos) || 0,
      totalLinkClicks: Number(data.totalLinkClicks) || 0,
      totalViews: Number(data.totalViews) || 0,
      totalFollowers: Number(data.totalFollowers) || 0,
      totalLikes: Number(data.totalLikes) || 0,
      todayVideos: Number(data.todayVideos) || 0,
      todayLinkClicks: Number(data.todayLinkClicks) || 0,
      todayViews: Number(data.todayViews) || 0,
      targetBioLink: data.targetBioLink || '',
      proxy: data.proxy || '',
      syncFrequency: data.syncFrequency || 'hourly',
      lastUpdated: now,
      createdAt: now,
      recentVideos: data.recentVideos || [],
      syncLogs: data.syncLogs || [
        {
          id: 'log_' + Date.now(),
          timestamp: now,
          status: 'success',
          message: 'Account added to Firebase tracking system.',
          durationMs: 320,
        },
      ],
    };

    await setDoc(accountRef, newAccount);
    return newAccount;
  },

  async updateAccount(id: string, updates: Partial<FikFapAccount>): Promise<void> {
    const accountRef = doc(db, 'accounts', id);
    await updateDoc(accountRef, {
      ...updates,
      lastUpdated: new Date().toISOString(),
    });
  },

  async deleteAccount(id: string): Promise<void> {
    const accountRef = doc(db, 'accounts', id);
    await deleteDoc(accountRef);
  },

  async clearAllData(userId: string): Promise<void> {
    try {
      const q = query(collection(db, 'accounts'), where('userId', '==', userId));
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      snapshot.forEach(docSnap => {
        batch.delete(docSnap.ref);
      });
      await batch.commit();

      // Reset settings
      await setDoc(doc(db, 'settings', userId), {
        userId,
        autoRefreshIntervalMinutes: 5,
        notifyOnError: true,
        notificationEmail: '',
        webhookUrl: '',
        defaultProxy: '',
        autoSyncEnabled: true,
      });
    } catch (err) {
      console.error('Error clearing data in Firestore:', err);
      throw err;
    }
  },

  async bulkImportAccounts(userId: string, rawAccounts: any[]): Promise<FikFapAccount[]> {
    const batch = writeBatch(db);
    const now = new Date().toISOString();
    const created: FikFapAccount[] = [];

    for (const item of rawAccounts) {
      if (!item.fikfapEmail) continue;
      const accountRef = doc(collection(db, 'accounts'));
      const account: FikFapAccount = {
        id: accountRef.id,
        userId,
        fikfapEmail: item.fikfapEmail,
        fikfapUsername: item.fikfapUsername || item.fikfapEmail.split('@')[0],
        label: item.label || 'Imported Account',
        status: 'active',
        totalVideos: Number(item.totalVideos) || 0,
        totalLinkClicks: Number(item.totalLinkClicks) || 0,
        totalViews: Number(item.totalViews) || 0,
        totalFollowers: Number(item.totalFollowers) || 0,
        totalLikes: Number(item.totalLikes) || 0,
        todayVideos: Number(item.todayVideos) || 0,
        todayLinkClicks: Number(item.todayLinkClicks) || 0,
        todayViews: Number(item.todayViews) || 0,
        targetBioLink: item.targetBioLink || '',
        proxy: item.proxy || '',
        syncFrequency: 'hourly',
        lastUpdated: now,
        createdAt: now,
        recentVideos: [],
        syncLogs: [
          {
            id: 'log_' + Date.now(),
            timestamp: now,
            status: 'success',
            message: 'Imported via CSV into Firebase.',
            durationMs: 250,
          },
        ],
      };

      batch.set(accountRef, account);
      created.push(account);
    }

    await batch.commit();
    return created;
  },

  // ==========================================
  // SETTINGS (FIRESTORE)
  // ==========================================

  async getSettings(userId: string): Promise<AppSettings> {
    const defaultSettings: AppSettings = {
      autoRefreshIntervalMinutes: 5,
      notifyOnError: true,
      notificationEmail: '',
      webhookUrl: '',
      defaultProxy: '',
      autoSyncEnabled: true,
    };

    try {
      const docSnap = await getDoc(doc(db, 'settings', userId));
      if (docSnap.exists()) {
        return { ...defaultSettings, ...(docSnap.data() as AppSettings) };
      }
    } catch (e) {
      console.warn('Could not read settings from Firestore:', e);
    }
    return defaultSettings;
  },

  async saveSettings(userId: string, settings: Partial<AppSettings>): Promise<AppSettings> {
    const current = await this.getSettings(userId);
    const merged = { ...current, ...settings, userId };
    await setDoc(doc(db, 'settings', userId), merged, { merge: true });
    return merged;
  },

  async updateSettings(userId: string, settings: Partial<AppSettings>): Promise<AppSettings> {
    return this.saveSettings(userId, settings);
  },

  // ==========================================
  // LIVE STATS AGGREGATOR
  // ==========================================

  calculateStats(accounts: FikFapAccount[]): DashboardStats {
    const todayVideos = accounts.reduce((sum, a) => sum + (a.todayVideos || 0), 0);
    const todayLinkClicks = accounts.reduce((sum, a) => sum + (a.todayLinkClicks || 0), 0);
    const todayViews = accounts.reduce((sum, a) => sum + (a.todayViews || 0), 0);

    const totalVideos = accounts.reduce((sum, a) => sum + (a.totalVideos || 0), 0);
    const totalLinkClicks = accounts.reduce((sum, a) => sum + (a.totalLinkClicks || 0), 0);
    const totalViews = accounts.reduce((sum, a) => sum + (a.totalViews || 0), 0);

    const statusCounts = {
      active: accounts.filter(a => a.status === 'active').length,
      inactive: accounts.filter(a => a.status === 'inactive').length,
      error: accounts.filter(a => a.status === 'error').length,
      syncing: accounts.filter(a => a.status === 'syncing').length,
      total: accounts.length,
    };

    // Past 7 days data based on genuine account metrics
    const now = new Date();
    const trend7d = [];

    // Aggregate any date-stamped video records across accounts
    const historicalMap: Record<string, { videos: number; clicks: number; views: number }> = {};
    accounts.forEach(acc => {
      if (acc.recentVideos && Array.isArray(acc.recentVideos)) {
        acc.recentVideos.forEach(v => {
          if (v.uploadedAt) {
            const dateStr = v.uploadedAt.split('T')[0];
            if (!historicalMap[dateStr]) {
              historicalMap[dateStr] = { videos: 0, clicks: 0, views: 0 };
            }
            historicalMap[dateStr].videos += 1;
            historicalMap[dateStr].clicks += Number(v.linkClicks || v.clicks) || 0;
            historicalMap[dateStr].views += Number(v.views) || 0;
          }
        });
      }
    });

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const isToday = i === 0;

      if (isToday) {
        trend7d.push({
          date: dateStr.slice(5),
          fullDate: dateStr,
          videos: todayVideos,
          linkClicks: todayLinkClicks,
          views: todayViews,
        });
      } else {
        const hist = historicalMap[dateStr];
        trend7d.push({
          date: dateStr.slice(5),
          fullDate: dateStr,
          videos: hist ? hist.videos : 0,
          linkClicks: hist ? hist.clicks : 0,
          views: hist ? hist.views : 0,
        });
      }
    }

    return {
      today: {
        totalVideos: todayVideos,
        totalLinkClicks: todayLinkClicks,
        totalViews: todayViews,
        activeAccounts: statusCounts.active,
        videoGrowthPct: 0,
        clickGrowthPct: 0,
      },
      allTime: {
        totalVideos,
        totalLinkClicks,
        totalViews,
        totalAccounts: accounts.length,
        avgClicksPerVideo: totalVideos > 0 ? Math.round(totalLinkClicks / totalVideos) : 0,
      },
      statusCounts,
      trend7d,
    };
  },
};
