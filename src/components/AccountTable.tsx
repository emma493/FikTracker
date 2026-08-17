import React, { useState } from 'react';
import {
  Search,
  Filter,
  RefreshCw,
  Trash2,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Video,
  MousePointerClick,
  Eye,
  MoreVertical,
  Plus,
  Flame,
  ArrowUpDown,
  Shield,
  Layers,
} from 'lucide-react';
import { FikFapAccount, AccountStatus } from '../types';

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
  const [sortBy, setSortBy] = useState<'clicks' | 'videos' | 'todayClicks' | 'lastUpdated'>('clicks');
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

  // Filter accounts
  const filteredAccounts = accounts.filter(acc => {
    const matchesSearch =
      acc.fikfapEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.fikfapUsername.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (acc.label && acc.label.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || acc.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Sort accounts
  const sortedAccounts = [...filteredAccounts].sort((a, b) => {
    let valA = 0;
    let valB = 0;

    if (sortBy === 'clicks') {
      valA = a.totalLinkClicks;
      valB = b.totalLinkClicks;
    } else if (sortBy === 'videos') {
      valA = a.totalVideos;
      valB = b.totalVideos;
    } else if (sortBy === 'todayClicks') {
      valA = a.todayLinkClicks;
      valB = b.todayLinkClicks;
    } else if (sortBy === 'lastUpdated') {
      valA = new Date(a.lastUpdated || 0).getTime();
      valB = new Date(b.lastUpdated || 0).getTime();
    }

    return sortOrder === 'desc' ? valB - valA : valA - valB;
  });

  const toggleSort = (field: 'clicks' | 'videos' | 'todayClicks' | 'lastUpdated') => {
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
            title={acc.errorMessage || 'Authentication or scraping error'}
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
    <div className="rounded-xl bg-[#09090b] border border-[#27272a] overflow-hidden">
      {/* Controls & Filter Bar */}
      <div className="p-4 sm:p-5 border-b border-[#27272a] bg-[#111113] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-[#fafafa]">Managed FikFap Accounts</h3>
            <span className="text-xs px-2 py-0.5 rounded-md bg-[#27272a] text-[#a1a1aa] font-medium border border-[#3f3f46]">
              {accounts.length} total
            </span>
          </div>
          <p className="text-xs text-[#a1a1aa] mt-0.5">
            Monitor real-time video counts, bio link click attribution, and sync health
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Box */}
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 text-[#71717a] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="account-search-input"
              type="text"
              placeholder="Search accounts..."
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

          {/* Add Account CTA & Clear All */}
          <div className="flex items-center gap-2">
            {onClearAll && accounts.length > 0 && (
              <button
                id="table-clear-all-btn"
                onClick={onClearAll}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-400 hover:bg-rose-950/20 border border-rose-800/30 rounded-lg transition"
                title="Delete all accounts from database"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All</span>
              </button>
            )}

            <button
              id="table-add-account-btn"
              onClick={onOpenAddModal}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-black bg-white hover:bg-zinc-200 transition shadow-sm"
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
              <th className="py-3 px-4">Status</th>
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
                onClick={() => toggleSort('todayClicks')}
              >
                <div className="flex items-center gap-1">
                  <span>Today's Activity</span>
                  <ArrowUpDown className="w-3 h-3 text-[#71717a]" />
                </div>
              </th>
              <th className="py-3 px-4">Target Bio Link</th>
              <th
                className="py-3 px-4 cursor-pointer hover:text-[#fafafa] transition"
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
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-400" />
                  <span>Loading tracked accounts...</span>
                </td>
              </tr>
            ) : sortedAccounts.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-[#a1a1aa]">
                  <Layers className="w-8 h-8 mx-auto mb-2 text-[#71717a]" />
                  <p className="font-medium text-[#fafafa]">No FikFap accounts found</p>
                  <p className="text-xs text-[#71717a] mt-1">
                    {searchTerm ? 'Try adjusting your search query or status filter.' : 'Click "Add Account" above to connect your first FikFap profile.'}
                  </p>
                </td>
              </tr>
            ) : (
              sortedAccounts.map(acc => {
                const isSyncing = syncingId === acc.id || acc.status === 'syncing';
                return (
                  <tr
                    key={acc.id}
                    id={`account-row-${acc.id}`}
                    className="hover:bg-[#111113] transition group"
                  >
                    {/* Account Identity */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#18181b] border border-[#27272a] flex items-center justify-center font-semibold text-[#fafafa]">
                          {acc.fikfapUsername.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <button
                            onClick={() => onOpenDetails(acc)}
                            className="font-medium text-[#fafafa] hover:underline transition text-left flex items-center gap-1.5"
                          >
                            <span>@{acc.fikfapUsername}</span>
                            {acc.label && (
                              <span className="text-[10px] font-normal px-1.5 py-0.2 rounded bg-[#18181b] text-[#a1a1aa] border border-[#27272a]">
                                {acc.label}
                              </span>
                            )}
                          </button>
                          <p className="text-[11px] text-[#71717a] font-mono mt-0.5">{acc.fikfapEmail}</p>
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        {renderStatusBadge(acc)}
                        {acc.status === 'error' && acc.errorMessage && (
                          <p className="text-[10px] text-rose-400 max-w-[180px] truncate" title={acc.errorMessage}>
                            {acc.errorMessage}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Total Videos */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <Video className="w-3.5 h-3.5 text-[#a1a1aa]" />
                        <span className="font-semibold text-[#fafafa]">{acc.totalVideos.toLocaleString()}</span>
                      </div>
                      <span className="text-[10px] text-[#71717a]">Total clips</span>
                    </td>

                    {/* Total Link Clicks */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <MousePointerClick className="w-3.5 h-3.5 text-[#a1a1aa]" />
                        <span className="font-semibold text-[#fafafa]">{acc.totalLinkClicks.toLocaleString()}</span>
                      </div>
                      <span className="text-[10px] text-[#71717a]">
                        {acc.totalVideos > 0 ? `~${Math.round(acc.totalLinkClicks / acc.totalVideos)} / vid` : 'No vids'}
                      </span>
                    </td>

                    {/* Today's Performance */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium text-[11px]">
                          +{acc.todayVideos} vids
                        </div>
                        <div className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium text-[11px]">
                          +{acc.todayLinkClicks} clicks
                        </div>
                      </div>
                      <div className="text-[10px] text-[#71717a] mt-0.5">
                        {acc.todayViews.toLocaleString()} views today
                      </div>
                    </td>

                    {/* Target Bio Link */}
                    <td className="py-3.5 px-4">
                      {acc.targetBioLink ? (
                        <a
                          href={acc.targetBioLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[#a1a1aa] hover:text-[#fafafa] font-mono text-[11px] max-w-[150px] truncate transition"
                          title={acc.targetBioLink}
                        >
                          <span className="truncate">{acc.targetBioLink.replace(/^https?:\/\//, '')}</span>
                          <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        </a>
                      ) : (
                        <span className="text-[#71717a] text-[11px] italic">Not configured</span>
                      )}
                    </td>

                    {/* Last Sync */}
                    <td className="py-3.5 px-4 text-[#a1a1aa] font-mono text-[11px]">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#71717a]" />
                        <span>{formatTimeAgo(acc.lastUpdated)}</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Sync Single Account */}
                        <button
                          id={`sync-account-btn-${acc.id}`}
                          onClick={() => onSyncAccount(acc.id)}
                          disabled={isSyncing}
                          className="p-1.5 rounded-md text-[#a1a1aa] hover:text-[#fafafa] hover:bg-[#27272a] border border-[#27272a] transition disabled:opacity-50"
                          title="Sync fresh data from FikFap"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-indigo-400' : ''}`} />
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
                          title="Delete account from tracker"
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
