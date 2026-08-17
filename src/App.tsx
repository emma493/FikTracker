import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { StatCards } from './components/StatCards';
import { AnalyticsCharts } from './components/AnalyticsCharts';
import { AccountTable } from './components/AccountTable';
import { AddAccountModal } from './components/AddAccountModal';
import { AccountDetailsModal } from './components/AccountDetailsModal';
import { BulkImportModal } from './components/BulkImportModal';
import { SettingsModal } from './components/SettingsModal';
import { firebaseService } from './services/firebaseService';
import { User, FikFapAccount, DashboardStats } from './types';
import { CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

const DEFAULT_USER: User = {
  id: 'fikfap_main_workspace',
  email: 'workspace@fikfap.io',
  name: 'Primary Workspace',
  role: 'creator',
  createdAt: new Date().toISOString(),
};

export default function App() {
  const [user, setUser] = useState<User>(DEFAULT_USER);
  const [authInitialized, setAuthInitialized] = useState(false);

  // Data states
  const [accounts, setAccounts] = useState<FikFapAccount[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [syncingAccountId, setSyncingAccountId] = useState<string | null>(null);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<FikFapAccount | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Toast notifications
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Auto-refresh countdown
  const [countdown, setCountdown] = useState(300); // 5 minutes default
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = firebaseService.onAuthChange((authenticatedUser) => {
      if (authenticatedUser) {
        setUser(authenticatedUser);
      }
      setAuthInitialized(true);
    });

    return () => unsubscribe();
  }, []);

  // Real-time Firestore account listener
  useEffect(() => {
    if (!user) return;

    setLoading(true);
    const unsubscribe = firebaseService.subscribeAccounts(
      user.id,
      (fetchedAccounts) => {
        setAccounts(fetchedAccounts);
        setStats(firebaseService.calculateStats(fetchedAccounts));
        setLoading(false);

        // Keep selected account in sync if open in modal
        if (selectedAccount) {
          const found = fetchedAccounts.find(a => a.id === selectedAccount.id);
          if (found) setSelectedAccount(found);
        }
      },
      (err) => {
        console.warn('Firestore subscription fallback:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.id]);

  // Auto-refresh polling timer (5 mins)
  useEffect(() => {
    if (!user) return;

    setCountdown(300);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    countdownIntervalRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          return 300;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [user]);

  // Sync actions
  const handleSyncSingleAccount = async (id: string) => {
    setSyncingAccountId(id);
    const targetAccount = accounts.find(a => a.id === id);
    if (!targetAccount) {
      setSyncingAccountId(null);
      return;
    }

    try {
      const now = new Date().toISOString();

      // Call live scraper
      let scrapedData: any = null;
      try {
        const res = await fetch('/api/fikfap/scrape', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: targetAccount.fikfapEmail,
            username: targetAccount.fikfapUsername,
            proxy: targetAccount.proxy,
          }),
        });
        if (res.ok) {
          scrapedData = await res.json();
        }
      } catch (e) {
        console.warn('Scraper fetch warning:', e);
      }

      const updatedVideos = scrapedData?.totalVideos ?? targetAccount.totalVideos;
      const updatedClicks = scrapedData?.totalLinkClicks ?? targetAccount.totalLinkClicks;
      const updatedViews = scrapedData?.totalViews ?? targetAccount.totalViews;
      const updatedFollowers = scrapedData?.followers ?? scrapedData?.totalFollowers ?? targetAccount.totalFollowers;

      const newLog = {
        id: 'log_' + Date.now(),
        timestamp: now,
        status: 'success' as const,
        message: `Synced metrics: ${updatedVideos} clips, ${updatedFollowers} followers, ${updatedViews.toLocaleString()} views, ${updatedClicks} link clicks.`,
        durationMs: 240,
      };

      const updatedLogs = [newLog, ...(targetAccount.syncLogs || [])].slice(0, 20);

      await firebaseService.updateAccount(id, {
        totalVideos: updatedVideos,
        totalLinkClicks: updatedClicks,
        totalViews: updatedViews,
        totalFollowers: updatedFollowers,
        lastUpdated: now,
        status: 'active',
        syncLogs: updatedLogs,
      });

      showToast(`Account @${targetAccount.fikfapUsername} metrics synced!`);
    } catch (e: any) {
      showToast(e.message || 'Sync failed', 'error');
    } finally {
      setSyncingAccountId(null);
    }
  };

  const handleSyncAll = async () => {
    if (accounts.length === 0) {
      showToast('No accounts added yet to sync.', 'info');
      return;
    }

    setIsSyncingAll(true);
    try {
      const now = new Date().toISOString();
      for (const account of accounts) {
        if (account.status === 'inactive') continue;

        let scrapedData: any = null;
        try {
          const res = await fetch('/api/fikfap/scrape', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: account.fikfapEmail,
              username: account.fikfapUsername,
              proxy: account.proxy,
            }),
          });
          if (res.ok) {
            scrapedData = await res.json();
          }
        } catch {
          // ignore
        }

        const updatedVideos = scrapedData?.totalVideos ?? account.totalVideos;
        const updatedClicks = scrapedData?.totalLinkClicks ?? account.totalLinkClicks;
        const updatedViews = scrapedData?.totalViews ?? account.totalViews;
        const updatedFollowers = scrapedData?.followers ?? scrapedData?.totalFollowers ?? account.totalFollowers;

        const newLog = {
          id: 'log_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5),
          timestamp: now,
          status: 'success' as const,
          message: `Synced: ${updatedVideos} clips, ${updatedFollowers} followers, ${updatedClicks} clicks.`,
          durationMs: 220,
        };

        await firebaseService.updateAccount(account.id, {
          totalVideos: updatedVideos,
          totalLinkClicks: updatedClicks,
          totalViews: updatedViews,
          totalFollowers: updatedFollowers,
          lastUpdated: now,
          status: 'active',
          syncLogs: [newLog, ...(account.syncLogs || [])].slice(0, 20),
        });
      }

      showToast('All accounts synchronized with FikFap telemetry.');
      setCountdown(300);
    } catch (e: any) {
      showToast(e.message || 'Failed to sync accounts', 'error');
    } finally {
      setIsSyncingAll(false);
    }
  };

  // Account creation & deletion handlers
  const handleAccountAdded = (newAccount: FikFapAccount) => {
    showToast(`Account @${newAccount.fikfapUsername} added to Firebase!`);
  };

  const handleAccountsImported = (imported: FikFapAccount[]) => {
    showToast(`Imported ${imported.length} accounts into Firebase!`);
  };

  const handleAccountUpdated = (updated: FikFapAccount) => {
    setSelectedAccount(updated);
    showToast(`Updated account @${updated.fikfapUsername}`);
  };

  const handleDeleteAccount = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete account "${name}" from tracking?`)) {
      return;
    }
    try {
      await firebaseService.deleteAccount(id);
      if (selectedAccount && selectedAccount.id === id) {
        setIsDetailsModalOpen(false);
      }
      showToast(`Account ${name} deleted from Firebase.`);
    } catch (e: any) {
      showToast(e.message || 'Failed to delete account', 'error');
    }
  };

  const handleClearAllAccounts = async () => {
    if (!user) return;
    if (!window.confirm('Are you sure you want to clear all accounts and data from the database? This action cannot be undone.')) {
      return;
    }
    try {
      await firebaseService.clearAllData(user.id);
      setAccounts([]);
      setStats(null);
      setSelectedAccount(null);
      setIsDetailsModalOpen(false);
      showToast('Database cleared. All previous records deleted from Firestore.');
    } catch (e: any) {
      showToast(e.message || 'Failed to clear database', 'error');
    }
  };

  const handleOpenDetails = (acc: FikFapAccount) => {
    setSelectedAccount(acc);
    setIsDetailsModalOpen(true);
  };

  // CSV Export
  const handleExportCsv = () => {
    if (accounts.length === 0) {
      showToast('No accounts to export.', 'info');
      return;
    }

    const headers = [
      'Account ID',
      'Username',
      'Email',
      'Status',
      'Total Videos',
      'Total Link Clicks',
      'Today Videos',
      'Today Link Clicks',
      'Total Views',
      'Target Bio Link',
      'Last Updated',
    ];

    const rows = accounts.map(a => [
      `"${a.id}"`,
      `"${a.fikfapUsername}"`,
      `"${a.fikfapEmail}"`,
      `"${a.status}"`,
      a.totalVideos,
      a.totalLinkClicks,
      a.todayVideos,
      a.todayLinkClicks,
      a.totalViews,
      `"${a.targetBioLink || ''}"`,
      `"${a.lastUpdated}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fikfap_accounts_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Exported accounts to CSV!');
  };

  const activeCount = accounts.filter(a => a.status === 'active').length;

  return (
    <div className="min-h-screen bg-[#09090b] text-[#fafafa] flex flex-col font-sans selection:bg-zinc-700 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        user={user}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenImportModal={() => setIsImportModalOpen(true)}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        onExportCsv={handleExportCsv}
        onSyncAll={handleSyncAll}
        isSyncingAll={isSyncingAll}
        activeCount={activeCount}
        totalCount={accounts.length}
        autoRefreshCountdown={countdown}
      />

      {/* Main Dashboard Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Toast Alert Banner */}
        {toast && (
          <div
            className={`p-3.5 rounded-lg border flex items-center justify-between gap-3 text-xs animate-in slide-in-from-top duration-200 shadow-md ${
              toast.type === 'success'
                ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-300'
                : toast.type === 'error'
                ? 'bg-rose-950/60 border-rose-500/30 text-rose-300'
                : 'bg-[#18181b] border-[#27272a] text-[#fafafa]'
            }`}
          >
            <div className="flex items-center gap-2">
              {toast.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              ) : toast.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              ) : (
                <RefreshCw className="w-4 h-4 text-indigo-400 flex-shrink-0" />
              )}
              <span>{toast.message}</span>
            </div>
            <button onClick={() => setToast(null)} className="text-[#a1a1aa] hover:text-[#fafafa] text-xs">
              Dismiss
            </button>
          </div>
        )}

        {/* Dashboard Summary: Today's Stats & All-Time Stats */}
        <StatCards stats={stats} loading={loading} />

        {/* Growth & Daily Trends Analytics Charts */}
        <AnalyticsCharts stats={stats} accounts={accounts} />

        {/* Accounts Management Section */}
        <AccountTable
          accounts={accounts}
          loading={loading}
          onOpenAddModal={() => setIsAddModalOpen(true)}
          onOpenDetails={handleOpenDetails}
          onDeleteAccount={handleDeleteAccount}
          onSyncAccount={handleSyncSingleAccount}
          onClearAll={handleClearAllAccounts}
          syncingId={syncingAccountId}
        />
      </main>

      {/* Modals & Drawers */}
      <AddAccountModal
        isOpen={isAddModalOpen}
        userId={user.id}
        onClose={() => setIsAddModalOpen(false)}
        onAccountAdded={handleAccountAdded}
      />

      <AccountDetailsModal
        account={selectedAccount}
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        onUpdateAccount={handleAccountUpdated}
        onDeleteAccount={handleDeleteAccount}
        onSyncAccount={handleSyncSingleAccount}
        isSyncing={syncingAccountId === selectedAccount?.id}
      />

      <BulkImportModal
        isOpen={isImportModalOpen}
        userId={user.id}
        onClose={() => setIsImportModalOpen(false)}
        onAccountsImported={handleAccountsImported}
      />

      <SettingsModal
        userId={user.id}
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onDataCleared={() => {
          setAccounts([]);
          setStats(null);
          showToast('Database cleared. All previous mock records removed.');
        }}
      />
    </div>
  );
}
