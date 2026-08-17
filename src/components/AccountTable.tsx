import React, { useState } from 'react';
import {
  Search,
  RefreshCw,
  Trash2,
  ExternalLink,
  AlertTriangle,
  Clock,
  Video,
  MousePointerClick,
  Eye,
  Users,
  Plus,
  ArrowUpDown,
  Layers,
  Sparkles,
} from 'lucide-react';
import { FikFapAccount, AccountStatus } from '../types';
import { formatMetricNumber } from '../utils/fikfapParser';

interface AccountTableProps {
  accounts: FikFapAccount[];
  loading: boolean;
  onOpenAddModal: () => void;
  onOpenDetails: (account: FikFapAccount) => void;
  onDeleteAccount: (id: string, name: string) => void;
  onSyncAccount: (id: string) => void;
  onClearAll?: () => void;
  syncingId: string | null;
}

export const AccountTable: React.FC<AccountTableProps> = ({
  accounts,
  loading,
  onOpenAddModal,
  onOpenDetails,
  onDeleteAccount,
  onSyncAccount,
  onClearAll,
  syncingId,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | AccountStatus>('all');
  const [sortBy, setSortBy] = useState<'videos' | 'clicks' | 'followers' | 'views' | 'lastUpdated'>('clicks');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Format relative time
  const formatTimeAgo = (isoString?: string) => {
    if (!isoString) return 'Never';
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  // Filter accounts by search query and status tab
  const filteredAccounts = accounts.filter(acc => {
    const q = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !q ||
      acc.fikfapEmail.toLowerCase().includes(q) ||
      acc.fikfapUsername.toLowerCase().includes(q) ||
      (acc.label && acc.label.toLowerCase().includes(q)) ||
      (acc.targetBioLink && acc.targetBioLink.toLowerCase().includes(q)) ||
      acc.status.toLowerCase().includes(q) ||
      String(acc.totalVideos).includes(q) ||
      String(acc.totalLinkClicks).includes(q) ||
      String(acc.totalFollowers).includes(q) ||
      String(acc.totalViews).includes(q);

    const matchesStatus = statusFilter === 'all' || acc.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Sort accounts by selected metric
  const sortedAccounts = [...filteredAccounts].sort((a, b) => {
    let valA = 0;
    let valB = 0;

    if (sortBy === 'videos') {
      valA = a.totalVideos;
      valB = b.totalVideos;
    } else if (sortBy === 'clicks') {
      valA = a.totalLinkClicks;
      valB = b.totalLinkClicks;
    } else if (sortBy === 'followers') {
      valA = a.totalFollowers;
      valB = b.totalFollowers;
    } else if (sortBy === 'views') {
      valA = a.totalViews;
      valB = b.totalViews;
    } else if (sortBy === 'lastUpdated') {
      valA = new Date(a.lastUpdated || 0).getTime();
      valB = new Date(b.lastUpdated || 0).getTime();
    }

    return sortOrder === 'desc' ? valB - valA : valA - valB;
  });

  const toggleSort = (field: 'videos' | 'clicks' | 'followers' | 'views' | 'lastUpdated') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  // Status Badge Component
  const renderStatusBadge = (acc: FikFapAccount) => {
    const isCurrentlySyncing = syncingId === acc.id || acc.status === 'syncing';

    if (isCurrentlySyncing) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <RefreshCw className="w-3 h-3 animate-spin" />
          <span>Syncing...</span>
        </span>
      );
    }

    switch (acc.status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Active</span>
          </span>
        );
      case 'error':
        return (
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20 cursor-help"
            title={acc.errorMessage || 'Authentication or scraping error on https://fikfap.com'}
          >
            <AlertTriangle className="w-3 h-3" />
            <span>Error</span>
          </span>
        );
      case 'inactive':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#18181b] text-[#a1a1aa] border border-[#27272a]">
            <Clock className="w-3 h-3" />
            <span>Inactive</span>
          </span>
        );
    }
  };

  return (
    <div className="rounded-xl bg-[#09090b] border border-[#27272a] overflow-hidden shadow-sm">
      {/* Controls & Filter Bar */}
      <div className="p-4 sm:p-5 border-b border-[#27272a] bg-[#111113] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-[#fafafa]">FikFap Accounts</h3>
            <span className="text-xs px-2 py-0.5 rounded-md bg-[#27272a] text-[#a1a1aa] font-medium border border-[#3f3f46]">
              {filteredAccounts.length} of {accounts.length}
            </span>
          </div>
          <p className="text-xs text-[#a1a1aa] mt-0.5">
            Displaying Total Videos, Total Link Clicks, Total Followers, Total Views, and Status
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-[#71717a] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="account-search-input"
              type="text"
              placeholder="Search by username, email, metric..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#09090b] border border-[#27272a] rounded-lg text-[#fafafa] placeholder-[#71717a] focus:outline-none focus:border-[#52525b]"
            />
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center p-1 rounded-lg bg-[#09090b] border border-[#27272a]">
            <button
              id="filter-all-btn"
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition ${
                statusFilter === 'all' ? 'bg-[#27272a] text-[#fafafa] font-semibold' : 'text-[#a1a1aa] hover:text-[#fafafa]'
              }`}
            >
              All
            </button>
            <button
              id="filter-active-btn"
              onClick={() => setStatusFilter('active')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition ${
                statusFilter === 'active' ? 'bg-[#27272a] text-emerald-400 font-semibold' : 'text-[#a1a1aa] hover:text-[#fafafa]'
              }`}
            >
              Active
            </button>
            <button
              id="filter-error-btn"
              onClick={() => setStatusFilter('error')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition ${
                statusFilter === 'error' ? 'bg-[#27272a] text-rose-400 font-semibold' : 'text-[#a1a1aa] hover:text-[#fafafa]'
              }`}
            >
              Errors
            </button>
            <button
              id="filter-inactive-btn"
              onClick={() => setStatusFilter('inactive')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition ${
                statusFilter === 'inactive' ? 'bg-[#27272a] text-[#fafafa] font-semibold' : 'text-[#a1a1aa] hover:text-[#fafafa]'
              }`}
            >
              Inactive
            </button>
          </div>

          {/* Actions: Clear All & Add Account */}
          <div className="flex items-center gap-2">
            {onClearAll && accounts.length > 0 && (
              <button
                id="table-clear-all-btn"
                onClick={onClearAll}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-400 hover:bg-rose-950/20 border border-rose-800/30 rounded-lg transition"
                title="Delete all accounts from database"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            )}

            <button
              id="table-add-account-btn"
              onClick={onOpenAddModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg text-black bg-white hover:bg-zinc-200 transition shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Account</span>
            </button>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#27272a] bg-[#09090b] text-[11px] font-semibold text-[#a1a1aa] uppercase tracking-wider">
              <th className="py-3 px-4">Account / Creator</th>
              <th
                className="py-3 px-4 cursor-pointer hover:text-[#fafafa] transition"
                onClick={() => toggleSort('videos')}
              >
                <div className="flex items-center gap-1">
                  <span>Total Videos</span>
                  <ArrowUpDown className="w-3 h-3 text-[#71717a]" />
                </div>
              </th>
              <th
                className="py-3 px-4 cursor-pointer hover:text-[#fafafa] transition"
                onClick={() => toggleSort('clicks')}
              >
                <div className="flex items-center gap-1">
                  <span>Total Link Clicks</span>
                  <ArrowUpDown className="w-3 h-3 text-[#71717a]" />
                </div>
              </th>
              <th
                className="py-3 px-4 cursor-pointer hover:text-[#fafafa] transition"
                onClick={() => toggleSort('followers')}
              >
                <div className="flex items-center gap-1">
                  <span>Total Followers</span>
                  <ArrowUpDown className="w-3 h-3 text-[#71717a]" />
                </div>
              </th>
              <th
                className="py-3 px-4 cursor-pointer hover:text-[#fafafa] transition"
                onClick={() => toggleSort('views')}
              >
                <div className="flex items-center gap-1">
                  <span>Total Views</span>
                  <ArrowUpDown className="w-3 h-3 text-[#71717a]" />
                </div>
              </th>
              <th className="py-3 px-4">Status</th>
              <th
                className="py-3 px-4 cursor-pointer hover:text-[#fafafa] transition hidden md:table-cell"
                onClick={() => toggleSort('lastUpdated')}
              >
                <div className="flex items-center gap-1">
                  <span>Last Sync</span>
                  <ArrowUpDown className="w-3 h-3 text-[#71717a]" />
                </div>
              </th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#27272a] text-xs bg-[#09090b]">
            {loading && accounts.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-[#a1a1aa]">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-white" />
                  <span>Loading tracked accounts...</span>
                </td>
              </tr>
            ) : sortedAccounts.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-[#a1a1aa]">
                  <Layers className="w-8 h-8 mx-auto mb-2 text-[#71717a]" />
                  <p className="font-medium text-[#fafafa]">No FikFap accounts found</p>
                  <p className="text-xs text-[#71717a] mt-1">
                    {searchTerm
                      ? `No accounts matching "${searchTerm}". Try another search term.`
                      : 'Click "Add Account" above to connect your first FikFap profile.'}
                  </p>
                </td>
              </tr>
            ) : (
              sortedAccounts.map(acc => {
                const isSyncing = syncingId === acc.id || acc.status === 'syncing';
                const profilePageUrl = `https://fikfap.com/user/${acc.fikfapUsername}`;

                return (
                  <tr
                    key={acc.id}
                    id={`account-row-${acc.id}`}
                    className="hover:bg-[#111113] transition group"
                  >
                    {/* 1. Account / Creator */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#18181b] border border-[#27272a] flex items-center justify-center font-semibold text-[#fafafa]">
                          {acc.fikfapUsername.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => onOpenDetails(acc)}
                              className="font-medium text-[#fafafa] hover:underline transition text-left"
                            >
                              @{acc.fikfapUsername}
                            </button>
                            <a
                              href={profilePageUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-zinc-500 hover:text-zinc-300 transition"
                              title={`Open ${profilePageUrl}`}
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                            {acc.label && (
                              <span className="text-[10px] font-normal px-1.5 py-0.2 rounded bg-[#18181b] text-[#a1a1aa] border border-[#27272a]">
                                {acc.label}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-[#71717a] font-mono mt-0.5">{acc.fikfapEmail}</p>
                        </div>
                      </div>
                    </td>

                    {/* 2. Total Videos (Clips) */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <Video className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="font-semibold text-[#fafafa] text-sm">
                          {acc.totalVideos.toLocaleString()}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#71717a]">Clips</span>
                    </td>

                    {/* 3. Total Link Clicks */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <MousePointerClick className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="font-semibold text-[#fafafa] text-sm">
                          {acc.totalLinkClicks.toLocaleString()}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#71717a]">
                        {acc.totalVideos > 0
                          ? `~${Math.round(acc.totalLinkClicks / acc.totalVideos)} / clip`
                          : 'Profile links'}
                      </span>
                    </td>

                    {/* 4. Total Followers */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-amber-400" />
                        <span className="font-semibold text-[#fafafa] text-sm">
                          {acc.totalFollowers.toLocaleString()}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#71717a]">Followers</span>
                    </td>

                    {/* 5. Total Views */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5 text-sky-400" />
                        <span className="font-semibold text-[#fafafa] text-sm">
                          {formatMetricNumber(acc.totalViews)}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#71717a]">
                        {acc.totalViews.toLocaleString()} views
                      </span>
                    </td>

                    {/* 6. Status */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        {renderStatusBadge(acc)}
                        {acc.status === 'error' && acc.errorMessage && (
                          <p className="text-[10px] text-rose-400 max-w-[160px] truncate" title={acc.errorMessage}>
                            {acc.errorMessage}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* 7. Last Sync */}
                    <td className="py-3.5 px-4 text-[#a1a1aa] font-mono text-[11px] hidden md:table-cell">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#71717a]" />
                        <span>{formatTimeAgo(acc.lastUpdated)}</span>
                      </div>
                    </td>

                    {/* 8. Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Sync Single Account */}
                        <button
                          id={`sync-account-btn-${acc.id}`}
                          onClick={() => onSyncAccount(acc.id)}
                          disabled={isSyncing}
                          className="p-1.5 rounded-md text-[#a1a1aa] hover:text-[#fafafa] hover:bg-[#27272a] border border-[#27272a] transition disabled:opacity-50"
                          title="Sync fresh telemetry from FikFap"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-white' : ''}`} />
                        </button>

                        {/* View Details / Logs */}
                        <button
                          id={`details-account-btn-${acc.id}`}
                          onClick={() => onOpenDetails(acc)}
                          className="px-2.5 py-1 text-[11px] font-medium rounded-md text-[#fafafa] bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] transition"
                        >
                          Details
                        </button>

                        {/* Delete Account */}
                        <button
                          id={`delete-account-btn-${acc.id}`}
                          onClick={() => onDeleteAccount(acc.id, acc.fikfapUsername || acc.fikfapEmail)}
                          className="p-1.5 rounded-md text-[#71717a] hover:text-rose-400 hover:bg-rose-950/20 border border-[#27272a] transition"
                          title="Delete account"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
