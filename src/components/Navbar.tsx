import React from 'react';
import {
  RefreshCw,
  Plus,
  Download,
  Upload,
  Settings,
  LogOut,
  Layers,
  Activity,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
  onOpenAddModal: () => void;
  onOpenImportModal: () => void;
  onOpenSettingsModal: () => void;
  onExportCsv: () => void;
  onSyncAll: () => void;
  isSyncingAll: boolean;
  activeCount: number;
  totalCount: number;
  autoRefreshCountdown: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onLogout,
  onOpenAddModal,
  onOpenImportModal,
  onOpenSettingsModal,
  onExportCsv,
  onSyncAll,
  isSyncingAll,
  activeCount,
  totalCount,
  autoRefreshCountdown,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#27272a] bg-[#09090b]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand & Status Pill */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600 font-bold text-white shadow-sm">
            F
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-lg text-[#fafafa] tracking-tight">FikTracker</span>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-[#27272a] text-[#a1a1aa] border border-[#3f3f46]">
                Pro v2.4
              </span>
            </div>
            <p className="text-xs text-[#a1a1aa] hidden sm:block">Multi-Account Analytics Engine</p>
          </div>

          <div className="hidden lg:flex items-center ml-4 pl-4 border-l border-[#27272a] gap-3">
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#18181b] border border-[#27272a] text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[#fafafa] font-medium">{activeCount} / {totalCount} Online</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#a1a1aa]">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Next sync in {autoRefreshCountdown}s</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Sync All Button */}
          <button
            id="sync-all-btn"
            onClick={onSyncAll}
            disabled={isSyncingAll}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md text-[#a1a1aa] hover:text-[#fafafa] bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] transition disabled:opacity-50"
            title="Fetch latest metrics for all accounts"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingAll ? 'animate-spin text-indigo-400' : 'text-[#a1a1aa]'}`} />
            <span className="hidden sm:inline">{isSyncingAll ? 'Syncing...' : 'Sync All'}</span>
          </button>

          {/* Import CSV */}
          <button
            id="import-csv-btn"
            onClick={onOpenImportModal}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md text-[#a1a1aa] hover:text-[#fafafa] bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] transition"
            title="Bulk import FikFap accounts from CSV"
          >
            <Upload className="w-3.5 h-3.5 text-[#a1a1aa]" />
            <span>Import</span>
          </button>

          {/* Export CSV */}
          <button
            id="export-csv-btn"
            onClick={onExportCsv}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md text-[#a1a1aa] hover:text-[#fafafa] bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] transition"
            title="Export statistics to CSV"
          >
            <Download className="w-3.5 h-3.5 text-[#a1a1aa]" />
            <span>Export</span>
          </button>

          {/* Add Account Primary Action (High Contrast Elegant Dark Button) */}
          <button
            id="add-account-header-btn"
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-md text-black bg-white hover:bg-zinc-200 transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Account</span>
          </button>

          {/* Settings & Profile Menu */}
          <div className="flex items-center ml-2 pl-2 border-l border-[#27272a] gap-1">
            <button
              id="open-settings-btn"
              onClick={onOpenSettingsModal}
              className="p-2 rounded-md text-[#a1a1aa] hover:text-white hover:bg-[#27272a] transition"
              title="Tracker Settings & Webhooks"
            >
              <Settings className="w-4 h-4" />
            </button>

            <button
              id="logout-btn"
              onClick={onLogout}
              className="p-2 rounded-md text-[#a1a1aa] hover:text-rose-400 hover:bg-rose-950/20 transition"
              title={`Logged in as ${user?.email || 'User'} - Click to Log Out`}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
