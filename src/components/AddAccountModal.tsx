import React, { useState } from 'react';
import {
  X,
  Plus,
  Mail,
  Link as LinkIcon,
  Server,
  AlertCircle,
  Hash,
  MousePointerClick,
  Video,
  Eye,
  Users,
} from 'lucide-react';
import { firebaseService } from '../services/firebaseService';
import { FikFapAccount } from '../types';

interface AddAccountModalProps {
  isOpen: boolean;
  userId: string;
  onClose: () => void;
  onAccountAdded: (account: FikFapAccount) => void;
}

export const AddAccountModal: React.FC<AddAccountModalProps> = ({
  isOpen,
  userId,
  onClose,
  onAccountAdded,
}) => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [label, setLabel] = useState('');
  const [targetBioLink, setTargetBioLink] = useState('');
  const [proxy, setProxy] = useState('');
  const [syncFrequency, setSyncFrequency] = useState<'hourly' | 'every_6h' | 'daily' | 'manual'>('hourly');

  // Exact starting metrics (real user data)
  const [initialVideos, setInitialVideos] = useState<string>('0');
  const [initialClicks, setInitialClicks] = useState<string>('0');
  const [initialViews, setInitialViews] = useState<string>('0');
  const [initialFollowers, setInitialFollowers] = useState<string>('0');
  const [initialLikes, setInitialLikes] = useState<string>('0');

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email && !username) {
      setSaveError('FikFap Email or Username is required.');
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const newAccount = await firebaseService.addAccount(userId, {
        fikfapEmail: email || `${username}@fikfap.me`,
        fikfapUsername: username || (email.includes('@') ? email.split('@')[0] : email),
        label: label || username || email,
        targetBioLink: targetBioLink.trim(),
        proxy: proxy.trim(),
        syncFrequency: syncFrequency,
        totalVideos: Math.max(0, parseInt(initialVideos, 10) || 0),
        totalLinkClicks: Math.max(0, parseInt(initialClicks, 10) || 0),
        totalViews: Math.max(0, parseInt(initialViews, 10) || 0),
        totalFollowers: Math.max(0, parseInt(initialFollowers, 10) || 0),
        totalLikes: Math.max(0, parseInt(initialLikes, 10) || 0),
        todayVideos: 0,
        todayLinkClicks: 0,
        todayViews: 0,
      });

      onAccountAdded(newAccount);
      // Reset form
      setEmail('');
      setUsername('');
      setLabel('');
      setTargetBioLink('');
      setProxy('');
      setInitialVideos('0');
      setInitialClicks('0');
      setInitialViews('0');
      setInitialFollowers('0');
      setInitialLikes('0');
      onClose();
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save account to Firestore.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-xl bg-[#09090b] border border-[#27272a] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-[#27272a] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#18181b] text-[#fafafa] border border-[#27272a]">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[#fafafa]">Add FikFap Account</h2>
              <p className="text-xs text-[#a1a1aa]">Save valid creator details directly to Firestore</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-md text-[#a1a1aa] hover:text-[#fafafa] hover:bg-[#27272a] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          {saveError && (
            <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{saveError}</span>
            </div>
          )}

          {/* Account Identifiers */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider">
              1. Account Identifiers
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#a1a1aa] mb-1">
                  FikFap Username / Handle <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Hash className="w-4 h-4 text-[#71717a] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="add-account-username-input"
                    type="text"
                    required
                    placeholder="e.g. creator_handle"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-[#09090b] border border-[#27272a] rounded-lg text-[#fafafa] placeholder-[#71717a] focus:outline-none focus:border-[#52525b]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#a1a1aa] mb-1">
                  Account Email / Login
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#71717a] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="add-account-email-input"
                    type="text"
                    placeholder="creator@domain.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-[#09090b] border border-[#27272a] rounded-lg text-[#fafafa] placeholder-[#71717a] focus:outline-none focus:border-[#52525b]"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#a1a1aa] mb-1">
                Account Label / Funnel Name
              </label>
              <input
                id="add-account-label-input"
                type="text"
                placeholder="e.g. US Funnel #1"
                value={label}
                onChange={e => setLabel(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#09090b] border border-[#27272a] rounded-lg text-[#fafafa] placeholder-[#71717a] focus:outline-none focus:border-[#52525b]"
              />
            </div>
          </div>

          {/* Attribution & Bio link */}
          <div className="space-y-3 pt-2 border-t border-[#27272a]">
            <label className="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider">
              2. Attribution & Bio Funnel
            </label>

            <div>
              <label className="block text-xs font-medium text-[#a1a1aa] mb-1">
                Target Bio Link (OnlyFans / Fansly / Linktree / Beacons / Telegram)
              </label>
              <div className="relative">
                <LinkIcon className="w-4 h-4 text-[#71717a] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="add-account-biolink-input"
                  type="url"
                  placeholder="https://onlyfans.com/yourhandle"
                  value={targetBioLink}
                  onChange={e => setTargetBioLink(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-[#09090b] border border-[#27272a] rounded-lg text-[#fafafa] placeholder-[#71717a] focus:outline-none focus:border-[#52525b]"
                />
              </div>
            </div>
          </div>

          {/* Current Real Metrics */}
          <div className="space-y-3 pt-2 border-t border-[#27272a]">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider">
                3. Current Account Metrics (Factual Data)
              </label>
              <span className="text-[10px] text-[#71717a]">Defaults to 0</span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="block text-[11px] font-medium text-[#a1a1aa] mb-1 flex items-center gap-1">
                  <Video className="w-3 h-3 text-[#71717a]" /> Total Videos
                </label>
                <input
                  id="add-account-videos-input"
                  type="number"
                  min="0"
                  value={initialVideos}
                  onChange={e => setInitialVideos(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-[#09090b] border border-[#27272a] rounded-lg text-[#fafafa] focus:outline-none focus:border-[#52525b]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#a1a1aa] mb-1 flex items-center gap-1">
                  <MousePointerClick className="w-3 h-3 text-[#71717a]" /> Total Clicks
                </label>
                <input
                  id="add-account-clicks-input"
                  type="number"
                  min="0"
                  value={initialClicks}
                  onChange={e => setInitialClicks(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-[#09090b] border border-[#27272a] rounded-lg text-[#fafafa] focus:outline-none focus:border-[#52525b]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#a1a1aa] mb-1 flex items-center gap-1">
                  <Eye className="w-3 h-3 text-[#71717a]" /> Total Views
                </label>
                <input
                  id="add-account-views-input"
                  type="number"
                  min="0"
                  value={initialViews}
                  onChange={e => setInitialViews(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-[#09090b] border border-[#27272a] rounded-lg text-[#fafafa] focus:outline-none focus:border-[#52525b]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-medium text-[#a1a1aa] mb-1 flex items-center gap-1">
                  <Users className="w-3 h-3 text-[#71717a]" /> Followers
                </label>
                <input
                  id="add-account-followers-input"
                  type="number"
                  min="0"
                  value={initialFollowers}
                  onChange={e => setInitialFollowers(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-[#09090b] border border-[#27272a] rounded-lg text-[#fafafa] focus:outline-none focus:border-[#52525b]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#a1a1aa] mb-1">
                  Total Likes
                </label>
                <input
                  id="add-account-likes-input"
                  type="number"
                  min="0"
                  value={initialLikes}
                  onChange={e => setInitialLikes(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-[#09090b] border border-[#27272a] rounded-lg text-[#fafafa] focus:outline-none focus:border-[#52525b]"
                />
              </div>
            </div>
          </div>

          {/* Proxy & Sync Frequency */}
          <div className="space-y-3 pt-2 border-t border-[#27272a]">
            <label className="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider">
              4. Network & Schedule
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#a1a1aa] mb-1">
                  Proxy IP / Port (Optional)
                </label>
                <div className="relative">
                  <Server className="w-4 h-4 text-[#71717a] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="add-account-proxy-input"
                    type="text"
                    placeholder="ip:port or host:port"
                    value={proxy}
                    onChange={e => setProxy(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-[#09090b] border border-[#27272a] rounded-lg text-[#fafafa] placeholder-[#71717a] focus:outline-none focus:border-[#52525b] font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#a1a1aa] mb-1">
                  Sync Frequency
                </label>
                <select
                  id="add-account-frequency-select"
                  value={syncFrequency}
                  onChange={e => setSyncFrequency(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-[#09090b] border border-[#27272a] rounded-lg text-[#fafafa] focus:outline-none focus:border-[#52525b]"
                >
                  <option value="hourly">Every 1 Hour</option>
                  <option value="every_6h">Every 6 Hours</option>
                  <option value="daily">Once Daily</option>
                  <option value="manual">Manual On-Demand Only</option>
                </select>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-[#27272a] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#a1a1aa] hover:text-[#fafafa] transition"
            >
              Cancel
            </button>
            <button
              id="save-account-submit-btn"
              type="submit"
              disabled={isSaving || (!email && !username)}
              className="px-4 py-2 text-xs font-semibold rounded-lg text-black bg-white hover:bg-zinc-200 transition shadow-sm disabled:opacity-50"
            >
              {isSaving ? 'Saving to Firestore...' : 'Save Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
