import React, { useState, useEffect } from 'react';
import {
  X,
  RefreshCw,
  Video,
  MousePointerClick,
  Eye,
  ExternalLink,
  Save,
  Trash2,
  CheckCircle2,
  Activity,
  Plus,
  Users,
  Heart,
} from 'lucide-react';
import { FikFapAccount, AccountStatus, VideoRecord } from '../types';
import { firebaseService } from '../services/firebaseService';

interface AccountDetailsModalProps {
  account: FikFapAccount | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateAccount: (account: FikFapAccount) => void;
  onDeleteAccount: (id: string, name: string) => void;
  onSyncAccount: (id: string) => void;
  isSyncing: boolean;
}

export const AccountDetailsModal: React.FC<AccountDetailsModalProps> = ({
  account,
  isOpen,
  onClose,
  onUpdateAccount,
  onDeleteAccount,
  onSyncAccount,
  isSyncing,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'videos' | 'logs' | 'settings'>('overview');

  // Edit states
  const [editLabel, setEditLabel] = useState(account?.label || '');
  const [editUsername, setEditUsername] = useState(account?.fikfapUsername || '');
  const [editBioLink, setEditBioLink] = useState(account?.targetBioLink || '');
  const [editProxy, setEditProxy] = useState(account?.proxy || '');
  const [editStatus, setEditStatus] = useState<AccountStatus>(account?.status || 'active');

  // Metric edit states
  const [editTotalVideos, setEditTotalVideos] = useState(String(account?.totalVideos || 0));
  const [editTodayVideos, setEditTodayVideos] = useState(String(account?.todayVideos || 0));
  const [editTotalClicks, setEditTotalClicks] = useState(String(account?.totalLinkClicks || 0));
  const [editTodayClicks, setEditTodayClicks] = useState(String(account?.todayLinkClicks || 0));
  const [editTotalViews, setEditTotalViews] = useState(String(account?.totalViews || 0));
  const [editTotalFollowers, setEditTotalFollowers] = useState(String(account?.totalFollowers || 0));
  const [editTotalLikes, setEditTotalLikes] = useState(String(account?.totalLikes || 0));

  // Add new video record states
  const [showAddVideoForm, setShowAddVideoForm] = useState(false);
  const [newVideoTitle, setNewVideoTitle] = useState('');
  const [newVideoViews, setNewVideoViews] = useState('0');
  const [newVideoClicks, setNewVideoClicks] = useState('0');

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync state when account changes
  useEffect(() => {
    if (account) {
      setEditLabel(account.label || '');
      setEditUsername(account.fikfapUsername || '');
      setEditBioLink(account.targetBioLink || '');
      setEditProxy(account.proxy || '');
      setEditStatus(account.status);
      setEditTotalVideos(String(account.totalVideos || 0));
      setEditTodayVideos(String(account.todayVideos || 0));
      setEditTotalClicks(String(account.totalLinkClicks || 0));
      setEditTodayClicks(String(account.todayLinkClicks || 0));
      setEditTotalViews(String(account.totalViews || 0));
      setEditTotalFollowers(String(account.totalFollowers || 0));
      setEditTotalLikes(String(account.totalLikes || 0));
      setSaveSuccess(false);
    }
  }, [account]);

  if (!isOpen || !account) return null;

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updates: Partial<FikFapAccount> = {
        label: editLabel,
        fikfapUsername: editUsername,
        targetBioLink: editBioLink.trim(),
        proxy: editProxy.trim(),
        status: editStatus,
        totalVideos: Math.max(0, parseInt(editTotalVideos, 10) || 0),
        todayVideos: Math.max(0, parseInt(editTodayVideos, 10) || 0),
        totalLinkClicks: Math.max(0, parseInt(editTotalClicks, 10) || 0),
        todayLinkClicks: Math.max(0, parseInt(editTodayClicks, 10) || 0),
        totalViews: Math.max(0, parseInt(editTotalViews, 10) || 0),
        totalFollowers: Math.max(0, parseInt(editTotalFollowers, 10) || 0),
        totalLikes: Math.max(0, parseInt(editTotalLikes, 10) || 0),
      };

      await firebaseService.updateAccount(account.id, updates);
      const updatedAccount: FikFapAccount = {
        ...account,
        ...updates,
      };
      onUpdateAccount(updatedAccount);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to update account in Firestore:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVideoTitle.trim()) return;

    const views = Math.max(0, parseInt(newVideoViews, 10) || 0);
    const clicks = Math.max(0, parseInt(newVideoClicks, 10) || 0);
    const now = new Date().toISOString();

    const newVideo: VideoRecord = {
      id: 'vid_' + Date.now(),
      title: newVideoTitle.trim(),
      uploadedAt: now,
      uploadDate: new Date().toLocaleDateString(),
      views,
      clicks,
      linkClicks: clicks,
      duration: '0:45',
      status: 'Live',
    };

    const updatedVideos = [newVideo, ...(account.recentVideos || [])];
    const newTotalVideos = account.totalVideos + 1;
    const newTodayVideos = (account.todayVideos || 0) + 1;
    const newTotalClicks = account.totalLinkClicks + clicks;
    const newTodayClicks = (account.todayLinkClicks || 0) + clicks;
    const newTotalViews = account.totalViews + views;

    try {
      await firebaseService.updateAccount(account.id, {
        recentVideos: updatedVideos,
        totalVideos: newTotalVideos,
        todayVideos: newTodayVideos,
        totalLinkClicks: newTotalClicks,
        todayLinkClicks: newTodayClicks,
        totalViews: newTotalViews,
      });

      const updatedAccount: FikFapAccount = {
        ...account,
        recentVideos: updatedVideos,
        totalVideos: newTotalVideos,
        todayVideos: newTodayVideos,
        totalLinkClicks: newTotalClicks,
        todayLinkClicks: newTodayClicks,
        totalViews: newTotalViews,
      };

      onUpdateAccount(updatedAccount);
      setNewVideoTitle('');
      setNewVideoViews('0');
      setNewVideoClicks('0');
      setShowAddVideoForm(false);
    } catch (err) {
      console.error('Failed to add video record:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-3xl rounded-xl bg-[#09090b] border border-[#27272a] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-[#27272a] flex items-center justify-between bg-[#111113]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#18181b] border border-[#27272a] flex items-center justify-center font-bold text-base text-[#fafafa]">
              {account.fikfapUsername.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#fafafa]">@{account.fikfapUsername}</h2>
                <span
                  className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                    account.status === 'active'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : account.status === 'error'
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      : 'bg-[#18181b] text-[#a1a1aa] border border-[#27272a]'
                  }`}
                >
                  {account.status.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-[#a1a1aa]">{account.fikfapEmail}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="details-sync-now-btn"
              onClick={() => onSyncAccount(account.id)}
              disabled={isSyncing}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-[#18181b] hover:bg-[#27272a] text-[#fafafa] border border-[#27272a] transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-indigo-400' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Telemetry'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-md text-[#a1a1aa] hover:text-[#fafafa] hover:bg-[#27272a] transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 border-b border-[#27272a] flex gap-4 bg-[#09090b]">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 text-xs font-semibold border-b-2 transition ${
              activeTab === 'overview'
                ? 'border-white text-white'
                : 'border-transparent text-[#a1a1aa] hover:text-[#fafafa]'
            }`}
          >
            Overview & Stats
          </button>
          <button
            onClick={() => setActiveTab('videos')}
            className={`py-3 text-xs font-semibold border-b-2 transition ${
              activeTab === 'videos'
                ? 'border-white text-white'
                : 'border-transparent text-[#a1a1aa] hover:text-[#fafafa]'
            }`}
          >
            Tracked Videos ({account.recentVideos?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`py-3 text-xs font-semibold border-b-2 transition ${
              activeTab === 'logs'
                ? 'border-white text-white'
                : 'border-transparent text-[#a1a1aa] hover:text-[#fafafa]'
            }`}
          >
            Audit Logs ({account.syncLogs?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-3 text-xs font-semibold border-b-2 transition ${
              activeTab === 'settings'
                ? 'border-white text-white'
                : 'border-transparent text-[#a1a1aa] hover:text-[#fafafa]'
            }`}
          >
            Edit Account & Metrics
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 bg-[#09090b]">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Quick Stat Blocks */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-lg bg-[#09090b] border border-[#27272a]">
                  <div className="flex items-center gap-1.5 text-xs text-[#a1a1aa] mb-1">
                    <Video className="w-3.5 h-3.5 text-[#a1a1aa]" />
                    <span>Total Videos</span>
                  </div>
                  <div className="text-xl font-bold text-[#fafafa]">{(account.totalVideos || 0).toLocaleString()}</div>
                  <div className="text-[10px] text-emerald-400 mt-0.5">+{account.todayVideos || 0} today</div>
                </div>

                <div className="p-3.5 rounded-lg bg-[#09090b] border border-[#27272a]">
                  <div className="flex items-center gap-1.5 text-xs text-[#a1a1aa] mb-1">
                    <MousePointerClick className="w-3.5 h-3.5 text-[#a1a1aa]" />
                    <span>Bio Link Clicks</span>
                  </div>
                  <div className="text-xl font-bold text-[#fafafa]">{(account.totalLinkClicks || 0).toLocaleString()}</div>
                  <div className="text-[10px] text-emerald-400 mt-0.5">+{account.todayLinkClicks || 0} today</div>
                </div>

                <div className="p-3.5 rounded-lg bg-[#09090b] border border-[#27272a]">
                  <div className="flex items-center gap-1.5 text-xs text-[#a1a1aa] mb-1">
                    <Eye className="w-3.5 h-3.5 text-[#a1a1aa]" />
                    <span>Total Views</span>
                  </div>
                  <div className="text-xl font-bold text-[#fafafa]">{(account.totalViews || 0).toLocaleString()}</div>
                  <div className="text-[10px] text-[#71717a] mt-0.5">+{(account.todayViews || 0).toLocaleString()} today</div>
                </div>

                <div className="p-3.5 rounded-lg bg-[#09090b] border border-[#27272a]">
                  <div className="flex items-center gap-1.5 text-xs text-[#a1a1aa] mb-1">
                    <Activity className="w-3.5 h-3.5 text-[#a1a1aa]" />
                    <span>Followers</span>
                  </div>
                  <div className="text-xl font-bold text-[#fafafa]">{(account.totalFollowers || 0).toLocaleString()}</div>
                  <div className="text-[10px] text-[#71717a] mt-0.5">
                    {(account.totalLikes || 0).toLocaleString()} likes
                  </div>
                </div>
              </div>

              {/* Attribution & Bio Link Box */}
              <div className="p-4 rounded-lg bg-[#09090b] border border-[#27272a] space-y-2">
                <div className="text-xs font-semibold text-[#fafafa]">Target Bio Funnel Destination</div>
                {account.targetBioLink ? (
                  <div className="flex items-center justify-between p-2.5 rounded-md bg-[#18181b] border border-[#27272a]">
                    <span className="text-xs font-mono text-indigo-300 truncate max-w-[80%]">
                      {account.targetBioLink}
                    </span>
                    <a
                      href={account.targetBioLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 text-[#a1a1aa] hover:text-white"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                ) : (
                  <p className="text-xs text-[#71717a] italic">No destination link assigned.</p>
                )}
              </div>

              {/* Connection & Firestore Info */}
              <div className="p-4 rounded-lg bg-[#09090b] border border-[#27272a] space-y-2">
                <div className="text-xs font-semibold text-[#fafafa]">Account & System Records</div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[#a1a1aa]">Assigned Proxy:</span>
                    <p className="font-mono text-[#fafafa] mt-0.5">{account.proxy || 'Direct connection'}</p>
                  </div>
                  <div>
                    <span className="text-[#a1a1aa]">Sync Interval:</span>
                    <p className="text-[#fafafa] mt-0.5 font-medium">{account.syncFrequency?.toUpperCase() || 'HOURLY'}</p>
                  </div>
                  <div>
                    <span className="text-[#a1a1aa]">Created:</span>
                    <p className="text-[#fafafa] mt-0.5">{new Date(account.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="text-[#a1a1aa]">Last Updated:</span>
                    <p className="text-[#fafafa] mt-0.5">{new Date(account.lastUpdated).toLocaleTimeString()}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: VIDEOS */}
          {activeTab === 'videos' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#a1a1aa]">Recorded Video Posts</span>
                <button
                  type="button"
                  onClick={() => setShowAddVideoForm(!showAddVideoForm)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-[#18181b] hover:bg-[#27272a] text-[#fafafa] border border-[#27272a] transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{showAddVideoForm ? 'Cancel' : 'Log Video Record'}</span>
                </button>
              </div>

              {/* Add Video Record Form */}
              {showAddVideoForm && (
                <form onSubmit={handleAddVideo} className="p-4 rounded-xl bg-[#18181b] border border-[#27272a] space-y-3">
                  <h4 className="text-xs font-semibold text-[#fafafa]">Log Video Telemetry</h4>
                  <div>
                    <label className="block text-[11px] font-medium text-[#a1a1aa] mb-1">Video Title / Caption</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Promo clip #14"
                      value={newVideoTitle}
                      onChange={e => setNewVideoTitle(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-[#09090b] border border-[#27272a] rounded-lg text-[#fafafa] focus:outline-none focus:border-[#52525b]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-[#a1a1aa] mb-1">Views</label>
                      <input
                        type="number"
                        min="0"
                        value={newVideoViews}
                        onChange={e => setNewVideoViews(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-[#09090b] border border-[#27272a] rounded-lg text-[#fafafa] focus:outline-none focus:border-[#52525b]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-[#a1a1aa] mb-1">Bio Link Clicks</label>
                      <input
                        type="number"
                        min="0"
                        value={newVideoClicks}
                        onChange={e => setNewVideoClicks(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-[#09090b] border border-[#27272a] rounded-lg text-[#fafafa] focus:outline-none focus:border-[#52525b]"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white text-black hover:bg-zinc-200 transition"
                    >
                      Save Video
                    </button>
                  </div>
                </form>
              )}

              {/* Videos list */}
              {(!account.recentVideos || account.recentVideos.length === 0) ? (
                <div className="py-8 text-center text-[#71717a] text-xs">
                  No individual video records logged yet. Click "Log Video Record" to add video entries.
                </div>
              ) : (
                account.recentVideos.map(vid => (
                  <div
                    key={vid.id}
                    className="p-3.5 rounded-lg bg-[#09090b] border border-[#27272a] flex items-center justify-between gap-3 hover:border-[#3f3f46] transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[#18181b] border border-[#27272a] flex items-center justify-center text-[#fafafa]">
                        <Video className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-[#fafafa]">{vid.title}</h4>
                        <div className="flex items-center gap-3 text-[11px] text-[#a1a1aa] mt-0.5">
                          <span>{vid.uploadDate}</span>
                          <span>•</span>
                          <span className="text-emerald-400 font-medium">{vid.status || 'Live'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <div className="text-xs font-semibold text-[#fafafa]">{vid.views.toLocaleString()}</div>
                        <div className="text-[10px] text-[#71717a]">Views</div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-emerald-400">+{vid.clicks}</div>
                        <div className="text-[10px] text-[#71717a]">Bio Clicks</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: LOGS */}
          {activeTab === 'logs' && (
            <div className="space-y-2 font-mono text-xs">
              {(!account.syncLogs || account.syncLogs.length === 0) ? (
                <div className="py-8 text-center text-[#71717a] text-xs font-sans">
                  No sync audit logs recorded yet.
                </div>
              ) : (
                account.syncLogs.map(log => (
                  <div
                    key={log.id}
                    className={`p-3 rounded-lg border ${
                      log.status === 'success'
                        ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-300'
                        : log.status === 'error'
                        ? 'bg-rose-950/20 border-rose-500/20 text-rose-300'
                        : 'bg-[#09090b] border-[#27272a] text-[#fafafa]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] text-[#a1a1aa] mb-1">
                      <span>{new Date(log.timestamp).toLocaleString()}</span>
                      <span className="px-1.5 py-0.2 rounded bg-[#18181b] border border-[#27272a] text-[10px]">
                        {log.durationMs}ms
                      </span>
                    </div>
                    <p className="font-sans text-xs">{log.message}</p>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 4: SETTINGS & METRICS EDIT */}
          {activeTab === 'settings' && (
            <form onSubmit={handleSaveSettings} className="space-y-4">
              {saveSuccess && (
                <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Account & metric updates saved to Firestore!</span>
                </div>
              )}

              {/* Profile Config */}
              <div className="space-y-3">
                <label className="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider">
                  Account Configuration
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[#a1a1aa] mb-1">Account Label</label>
                    <input
                      type="text"
                      value={editLabel}
                      onChange={e => setEditLabel(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-[#09090b] border border-[#27272a] rounded-lg text-[#fafafa] focus:outline-none focus:border-[#52525b]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#a1a1aa] mb-1">FikFap Username</label>
                    <input
                      type="text"
                      value={editUsername}
                      onChange={e => setEditUsername(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-[#09090b] border border-[#27272a] rounded-lg text-[#fafafa] focus:outline-none focus:border-[#52525b]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#a1a1aa] mb-1">Target Bio Link</label>
                  <input
                    type="url"
                    value={editBioLink}
                    onChange={e => setEditBioLink(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#09090b] border border-[#27272a] rounded-lg text-[#fafafa] focus:outline-none focus:border-[#52525b]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#a1a1aa] mb-1">Residential Proxy</label>
                  <input
                    type="text"
                    value={editProxy}
                    onChange={e => setEditProxy(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#09090b] border border-[#27272a] rounded-lg text-[#fafafa] font-mono focus:outline-none focus:border-[#52525b]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#a1a1aa] mb-1">Status Override</label>
                  <select
                    value={editStatus}
                    onChange={e => setEditStatus(e.target.value as AccountStatus)}
                    className="w-full px-3 py-2 text-xs bg-[#09090b] border border-[#27272a] rounded-lg text-[#fafafa] focus:outline-none focus:border-[#52525b]"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive (Paused)</option>
                    <option value="error">Error (Flagged)</option>
                  </select>
                </div>
              </div>

              {/* Exact Real Metrics Override */}
              <div className="space-y-3 pt-3 border-t border-[#27272a]">
                <label className="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider">
                  Telemetry Metrics (Direct Factual Numbers)
                </label>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-[#a1a1aa] mb-1">Total Videos</label>
                    <input
                      type="number"
                      min="0"
                      value={editTotalVideos}
                      onChange={e => setEditTotalVideos(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-[#09090b] border border-[#27272a] rounded-lg text-[#fafafa] focus:outline-none focus:border-[#52525b]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-[#a1a1aa] mb-1">Total Bio Clicks</label>
                    <input
                      type="number"
                      min="0"
                      value={editTotalClicks}
                      onChange={e => setEditTotalClicks(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-[#09090b] border border-[#27272a] rounded-lg text-[#fafafa] focus:outline-none focus:border-[#52525b]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-[#a1a1aa] mb-1">Total Views</label>
                    <input
                      type="number"
                      min="0"
                      value={editTotalViews}
                      onChange={e => setEditTotalViews(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-[#09090b] border border-[#27272a] rounded-lg text-[#fafafa] focus:outline-none focus:border-[#52525b]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-[#a1a1aa] mb-1">Followers</label>
                    <input
                      type="number"
                      min="0"
                      value={editTotalFollowers}
                      onChange={e => setEditTotalFollowers(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-[#09090b] border border-[#27272a] rounded-lg text-[#fafafa] focus:outline-none focus:border-[#52525b]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-[#a1a1aa] mb-1">Likes</label>
                    <input
                      type="number"
                      min="0"
                      value={editTotalLikes}
                      onChange={e => setEditTotalLikes(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-[#09090b] border border-[#27272a] rounded-lg text-[#fafafa] focus:outline-none focus:border-[#52525b]"
                    />
                  </div>
                </div>
              </div>

              {/* Form buttons */}
              <div className="pt-3 border-t border-[#27272a] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    onDeleteAccount(account.id, account.fikfapUsername || account.fikfapEmail);
                    onClose();
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-400 hover:bg-rose-950/20 rounded-lg transition border border-rose-500/20"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Account</span>
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-white text-black hover:bg-zinc-200 transition disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Saving...' : 'Save to Firestore'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
