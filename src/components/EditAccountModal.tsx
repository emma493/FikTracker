import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  Mail,
  Lock,
  Link as LinkIcon,
  Server,
  AlertCircle,
  Hash,
  MousePointerClick,
  Video,
  Eye,
  Users,
  CheckCircle2,
  ExternalLink,
  Edit3,
  Clock,
  Trash2,
} from 'lucide-react';
import { firebaseService } from '../services/firebaseService';
import { FikFapAccount, AccountStatus } from '../types';
import { formatMetricNumber } from '../utils/fikfapParser';

interface EditAccountModalProps {
  account: FikFapAccount | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateAccount: (account: FikFapAccount) => void;
  onDeleteAccount?: (id: string, name: string) => void;
}

export const EditAccountModal: React.FC<EditAccountModalProps> = ({
  account,
  isOpen,
  onClose,
  onUpdateAccount,
  onDeleteAccount,
}) => {
  // Form fields
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [label, setLabel] = useState('');
  const [targetBioLink, setTargetBioLink] = useState('');
  const [proxy, setProxy] = useState('');
  const [status, setStatus] = useState<AccountStatus>('active');
  const [syncFrequency, setSyncFrequency] = useState<'hourly' | 'every_6h' | 'daily' | 'manual'>('hourly');

  // Metrics
  const [totalVideos, setTotalVideos] = useState<string>('0');
  const [totalFollowers, setTotalFollowers] = useState<string>('0');
  const [totalViews, setTotalViews] = useState<string>('0');
  const [totalLinkClicks, setTotalLinkClicks] = useState<string>('0');

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (account) {
      setEmail(account.fikfapEmail || '');
      setUsername(account.fikfapUsername || '');
      setLabel(account.label || '');
      setTargetBioLink(account.targetBioLink || '');
      setProxy(account.proxy || '');
      setStatus(account.status || 'active');
      setSyncFrequency(account.syncFrequency || 'hourly');

      setTotalVideos(String(account.totalVideos ?? 0));
      setTotalFollowers(String(account.totalFollowers ?? 0));
      setTotalViews(String(account.totalViews ?? 0));
      setTotalLinkClicks(String(account.totalLinkClicks ?? 0));

      setSaveSuccess(false);
      setErrorMsg(null);
    }
  }, [account, isOpen]);

  if (!isOpen || !account) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username && !email) {
      setErrorMsg('Username or Email is required.');
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);
    setSaveSuccess(false);

    try {
      const updates: Partial<FikFapAccount> = {
        fikfapEmail: email.trim(),
        fikfapUsername: username.trim(),
        label: label.trim(),
        targetBioLink: targetBioLink.trim(),
        proxy: proxy.trim(),
        status,
        syncFrequency,
        totalVideos: Math.max(0, parseInt(totalVideos, 10) || 0),
        totalFollowers: Math.max(0, parseInt(totalFollowers, 10) || 0),
        totalViews: Math.max(0, parseInt(totalViews, 10) || 0),
        totalLinkClicks: Math.max(0, parseInt(totalLinkClicks, 10) || 0),
        lastUpdated: new Date().toISOString(),
      };

      await firebaseService.updateAccount(account.id, updates);

      const updatedAccount: FikFapAccount = {
        ...account,
        ...updates,
      };

      onUpdateAccount(updatedAccount);
      setSaveSuccess(true);
      setTimeout(() => {
        onClose();
      }, 600);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update account in database.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-xl rounded-xl bg-[#09090b] border border-[#27272a] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-[#27272a] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#18181b] text-white border border-[#27272a]">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[#fafafa]">Edit Account Details</h2>
              <p className="text-xs text-[#a1a1aa]">
                Update credentials, metrics, and parameters for <span className="font-mono text-white">@{account.fikfapUsername}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-md text-[#a1a1aa] hover:text-[#fafafa] hover:bg-[#27272a] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {saveSuccess && (
            <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
              <span>Account details saved successfully!</span>
            </div>
          )}

          {/* 1. Identity & Handle */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider">
              1. FikFap Account Details
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#a1a1aa] mb-1">
                  FikFap Username / Handle
                </label>
                <div className="relative">
                  <Hash className="w-4 h-4 text-[#71717a] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="edit-account-username-input"
                    type="text"
                    required
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-[#09090b] border border-[#27272a] rounded-lg text-[#fafafa] focus:outline-none focus:border-[#52525b] font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#a1a1aa] mb-1">
                  FikFap Login Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#71717a] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="edit-account-email-input"
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-[#09090b] border border-[#27272a] rounded-lg text-[#fafafa] focus:outline-none focus:border-[#52525b]"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#a1a1aa] mb-1">
                  Account Label / Nickname
                </label>
                <input
                  id="edit-account-label-input"
                  type="text"
                  placeholder="e.g. Bio Main Funnel"
                  value={label}
                  onChange={e => setLabel(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#09090b] border border-[#27272a] rounded-lg text-[#fafafa] focus:outline-none focus:border-[#52525b]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#a1a1aa] mb-1">
                  Account Status
                </label>
                <select
                  id="edit-account-status-select"
                  value={status}
                  onChange={e => setStatus(e.target.value as AccountStatus)}
                  className="w-full px-3 py-2 text-xs bg-[#09090b] border border-[#27272a] rounded-lg text-[#fafafa] focus:outline-none focus:border-[#52525b]"
                >
                  <option value="active">Active (Tracking Enabled)</option>
                  <option value="inactive">Inactive (Paused)</option>
                  <option value="error">Error State</option>
                </select>
              </div>
            </div>
          </div>

          {/* 2. Telemetry & Metrics Edit */}
          <div className="space-y-3 pt-3 border-t border-[#27272a]">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider">
                2. Metrics & Counts
              </label>
              <span className="text-[10px] text-zinc-400 font-mono">
                Manual Override or Synced
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* Total Videos */}
              <div className="p-2.5 rounded-lg bg-[#111113] border border-[#27272a]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] text-[#a1a1aa] flex items-center gap-1 font-medium">
                    <Video className="w-3 h-3 text-indigo-400" /> Total Videos
                  </span>
                </div>
                <input
                  id="edit-account-videos-input"
                  type="number"
                  min="0"
                  value={totalVideos}
                  onChange={e => setTotalVideos(e.target.value)}
                  className="w-full font-bold text-sm bg-transparent text-white border-b border-[#3f3f46] focus:border-white focus:outline-none py-0.5"
                />
                <span className="text-[10px] text-[#71717a] mt-1 block">Clips count</span>
              </div>

              {/* Total Link Clicks */}
              <div className="p-2.5 rounded-lg bg-[#111113] border border-[#27272a]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] text-[#a1a1aa] flex items-center gap-1 font-medium">
                    <MousePointerClick className="w-3 h-3 text-emerald-400" /> Link Clicks
                  </span>
                </div>
                <input
                  id="edit-account-clicks-input"
                  type="number"
                  min="0"
                  value={totalLinkClicks}
                  onChange={e => setTotalLinkClicks(e.target.value)}
                  className="w-full font-bold text-sm bg-transparent text-white border-b border-[#3f3f46] focus:border-white focus:outline-none py-0.5"
                />
                <span className="text-[10px] text-[#71717a] mt-1 block">Bio link clicks</span>
              </div>

              {/* Total Followers */}
              <div className="p-2.5 rounded-lg bg-[#111113] border border-[#27272a]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] text-[#a1a1aa] flex items-center gap-1 font-medium">
                    <Users className="w-3 h-3 text-amber-400" /> Followers
                  </span>
                </div>
                <input
                  id="edit-account-followers-input"
                  type="number"
                  min="0"
                  value={totalFollowers}
                  onChange={e => setTotalFollowers(e.target.value)}
                  className="w-full font-bold text-sm bg-transparent text-white border-b border-[#3f3f46] focus:border-white focus:outline-none py-0.5"
                />
                <span className="text-[10px] text-[#71717a] mt-1 block">Profile followers</span>
              </div>

              {/* Total Views */}
              <div className="p-2.5 rounded-lg bg-[#111113] border border-[#27272a]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] text-[#a1a1aa] flex items-center gap-1 font-medium">
                    <Eye className="w-3 h-3 text-sky-400" /> Total Views
                  </span>
                </div>
                <input
                  id="edit-account-views-input"
                  type="number"
                  min="0"
                  value={totalViews}
                  onChange={e => setTotalViews(e.target.value)}
                  className="w-full font-bold text-sm bg-transparent text-white border-b border-[#3f3f46] focus:border-white focus:outline-none py-0.5"
                />
                <span className="text-[10px] text-[#71717a] mt-1 block">
                  {formatMetricNumber(parseInt(totalViews, 10) || 0)} views
                </span>
              </div>
            </div>
          </div>

          {/* 3. Link & Proxy Settings */}
          <div className="space-y-3 pt-3 border-t border-[#27272a]">
            <label className="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider">
              3. Bio Link & Proxy Configuration
            </label>

            <div>
              <label className="block text-xs font-medium text-[#a1a1aa] mb-1">
                Target Bio Link (OnlyFans / Fansly / Linktree / Telegram)
              </label>
              <div className="relative">
                <LinkIcon className="w-4 h-4 text-[#71717a] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="edit-account-biolink-input"
                  type="url"
                  placeholder="https://onlyfans.com/yourhandle"
                  value={targetBioLink}
                  onChange={e => setTargetBioLink(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-[#09090b] border border-[#27272a] rounded-lg text-[#fafafa] focus:outline-none focus:border-[#52525b]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#a1a1aa] mb-1">
                  Proxy IP:Port (Optional)
                </label>
                <div className="relative">
                  <Server className="w-4 h-4 text-[#71717a] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="edit-account-proxy-input"
                    type="text"
                    placeholder="192.168.1.1:8080"
                    value={proxy}
                    onChange={e => setProxy(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-[#09090b] border border-[#27272a] rounded-lg text-[#fafafa] focus:outline-none focus:border-[#52525b] font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#a1a1aa] mb-1">
                  Sync Frequency
                </label>
                <select
                  id="edit-account-frequency-select"
                  value={syncFrequency}
                  onChange={e => setSyncFrequency(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-[#09090b] border border-[#27272a] rounded-lg text-[#fafafa] focus:outline-none focus:border-[#52525b]"
                >
                  <option value="hourly">Every 1 Hour</option>
                  <option value="every_6h">Every 6 Hours</option>
                  <option value="daily">Once Daily</option>
                  <option value="manual">Manual On-Demand</option>
                </select>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-[#27272a] flex items-center justify-between">
            {onDeleteAccount ? (
              <button
                type="button"
                onClick={() => {
                  onDeleteAccount(account.id, account.fikfapUsername);
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-400 hover:bg-rose-950/20 border border-rose-800/30 rounded-lg transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-[#a1a1aa] hover:text-[#fafafa] transition"
              >
                Cancel
              </button>
              <button
                id="edit-account-save-btn"
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg text-black bg-white hover:bg-zinc-200 transition shadow-sm disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
