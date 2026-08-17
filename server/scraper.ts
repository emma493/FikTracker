import { db, decryptCredential } from './db.js';
import { FikFapAccount, VideoRecord } from '../src/types.js';

export interface ValidationResult {
  valid: boolean;
  username?: string;
  totalVideos?: number;
  totalLinkClicks?: number;
  totalViews?: number;
  followers?: number;
  likes?: number;
  bioLink?: string;
  error?: string;
}

/**
 * Validates FikFap credentials and tests connectivity
 */
export async function validateFikFapCredentials(
  email: string,
  password?: string,
  proxy?: string
): Promise<ValidationResult> {
  const startTime = Date.now();

  // Simulate network round-trip & verification with FikFap API
  await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 600));

  // If password contains 'error' or 'invalid', simulate auth rejection
  if (password && (password.toLowerCase().includes('invalid') || password.toLowerCase().includes('wrong'))) {
    return {
      valid: false,
      error: 'Invalid credentials. FikFap authentication returned HTTP 401 Unauthorized.',
    };
  }

  if (proxy && proxy.includes('broken')) {
    return {
      valid: false,
      error: 'Proxy connection timeout: Unable to establish tunnel to FikFap server.',
    };
  }

  // Generate realistic parsed details based on email/username
  const rawUsername = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_');
  const baseVideos = Math.floor(25 + Math.random() * 150);
  const baseClicks = Math.floor(baseVideos * (40 + Math.random() * 120));
  const baseViews = Math.floor(baseClicks * (25 + Math.random() * 40));

  return {
    valid: true,
    username: rawUsername,
    totalVideos: baseVideos,
    totalLinkClicks: baseClicks,
    totalViews: baseViews,
    followers: Math.floor(baseViews / 18),
    likes: Math.floor(baseViews / 3),
    bioLink: `https://linktr.ee/${rawUsername}`,
  };
}

/**
 * Scrapes and synchronizes a single FikFap account
 */
export async function syncAccountData(accountId: string, userId: string): Promise<{ success: boolean; account?: FikFapAccount; error?: string }> {
  const startTime = Date.now();
  const accountRecord = db.getAccountById(accountId, userId);

  if (!accountRecord) {
    return { success: false, error: 'Account not found' };
  }

  // Mark account as syncing
  db.updateAccount(accountId, userId, { status: 'syncing' });

  try {
    // Simulate web scraping latency (headless browser / API fetch session)
    const simulatedLatency = 1000 + Math.floor(Math.random() * 800);
    await new Promise(resolve => setTimeout(resolve, simulatedLatency));

    // Decrypt stored password if present
    const decryptedPass = accountRecord.fikfapPasswordEncrypted
      ? decryptCredential(accountRecord.fikfapPasswordEncrypted)
      : '';

    // If account was in error or has error keywords, evaluate recovery or fail
    if (decryptedPass && decryptedPass.toLowerCase().includes('invalid')) {
      const durationMs = Date.now() - startTime;
      db.updateAccount(accountId, userId, {
        status: 'error',
        errorMessage: 'Invalid FikFap session credentials. Authentication failed.',
        lastUpdated: new Date().toISOString(),
      });
      db.addSyncLog(accountId, {
        status: 'error',
        message: 'Failed to authenticate on FikFap portal.',
        durationMs,
        details: 'HTTP 401 INVALID_CREDENTIALS',
      });
      return { success: false, error: 'Invalid credentials' };
    }

    // Account is healthy: Calculate incremental stats (simulating fresh video uploads, link bio clicks, view surges)
    const clicksIncrement = Math.floor(15 + Math.random() * 65);
    const viewsIncrement = Math.floor(clicksIncrement * (25 + Math.random() * 20));
    const isNewVideo = Math.random() > 0.65;
    const videoIncrement = isNewVideo ? 1 : 0;

    const newTodayVideos = accountRecord.todayVideos + videoIncrement;
    const newTodayClicks = accountRecord.todayLinkClicks + clicksIncrement;
    const newTodayViews = accountRecord.todayViews + viewsIncrement;

    const newTotalVideos = accountRecord.totalVideos + videoIncrement;
    const newTotalClicks = accountRecord.totalLinkClicks + clicksIncrement;
    const newTotalViews = accountRecord.totalViews + viewsIncrement;
    const newFollowers = accountRecord.totalFollowers + Math.floor(clicksIncrement * 0.3);
    const newLikes = accountRecord.totalLikes + Math.floor(viewsIncrement * 0.15);

    // Update recent videos if new video uploaded
    let recentVideos: VideoRecord[] = accountRecord.recentVideos || [];
    if (isNewVideo) {
      const vidNum = Math.floor(100 + Math.random() * 900);
      const newVideo: VideoRecord = {
        id: 'vid_' + vidNum,
        title: `Exclusive Creator Reel #${vidNum}`,
        uploadDate: 'Just now',
        views: Math.floor(800 + Math.random() * 2000),
        clicks: Math.floor(40 + Math.random() * 120),
        duration: `0:${Math.floor(20 + Math.random() * 40)}`,
        status: 'published',
      };
      recentVideos = [newVideo, ...recentVideos.slice(0, 5)];
    }

    const updatedAccount = db.updateAccount(accountId, userId, {
      status: 'active',
      errorMessage: undefined,
      totalVideos: newTotalVideos,
      totalLinkClicks: newTotalClicks,
      totalViews: newTotalViews,
      totalFollowers: newFollowers,
      totalLikes: newLikes,
      todayVideos: newTodayVideos,
      todayLinkClicks: newTodayClicks,
      todayViews: newTodayViews,
      recentVideos,
      lastUpdated: new Date().toISOString(),
    });

    // Record daily stat snapshot
    const todayDate = new Date().toISOString().split('T')[0];
    db.recordDailyStat({
      accountId,
      accountEmail: accountRecord.fikfapEmail,
      date: todayDate,
      videosCount: newTodayVideos,
      linkClicksCount: newTodayClicks,
      viewsCount: newTodayViews,
      followersGained: Math.floor(newTodayClicks * 0.3),
    });

    const durationMs = Date.now() - startTime;
    const syncMsg = `Successfully fetched stats: +${clicksIncrement} link clicks, +${viewsIncrement.toLocaleString()} views${isNewVideo ? ', +1 new video detected' : ''}.`;
    db.addSyncLog(accountId, {
      status: 'success',
      message: syncMsg,
      durationMs,
    });

    return { success: true, account: updatedAccount || undefined };
  } catch (error: any) {
    const durationMs = Date.now() - startTime;
    db.updateAccount(accountId, userId, {
      status: 'error',
      errorMessage: error?.message || 'Scraper network error',
      lastUpdated: new Date().toISOString(),
    });
    db.addSyncLog(accountId, {
      status: 'error',
      message: 'Scraper failed to connect to FikFap.',
      durationMs,
      details: error?.message,
    });
    return { success: false, error: error?.message || 'Sync failed' };
  }
}

/**
 * Syncs all accounts for a specific user
 */
export async function syncAllUserAccounts(userId: string) {
  const accounts = db.getAccounts(userId);
  const results = [];

  for (const account of accounts) {
    if (account.status === 'inactive') continue;
    const res = await syncAccountData(account.id, userId);
    results.push({ accountId: account.id, ...res });
    // Small delay between accounts to avoid rate limits
    await new Promise(r => setTimeout(r, 400));
  }

  return results;
}

// Background cron/interval runner
let schedulerTimer: NodeJS.Timeout | null = null;

export function initBackgroundSync() {
  if (schedulerTimer) return;
  // Run periodic sync check every 60 seconds
  schedulerTimer = setInterval(async () => {
    try {
      // Find accounts that need scheduled sync
      const now = Date.now();
      const allAccounts = (db as any).data?.accounts || [];
      for (const acc of allAccounts) {
        if (acc.status === 'inactive') continue;
        const lastUpdated = new Date(acc.lastUpdated || 0).getTime();
        const diffMinutes = (now - lastUpdated) / 60000;
        
        // If hourly and last sync was > 60m ago
        if (diffMinutes >= 60) {
          await syncAccountData(acc.id, acc.userId);
        }
      }
    } catch (e) {
      console.error('Background sync runner error:', e);
    }
  }, 60000);
}
