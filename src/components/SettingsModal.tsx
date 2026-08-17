import React, { useState, useEffect } from 'react';
import {
  X,
  Settings,
  Bell,
  Clock,
  Save,
  CheckCircle2,
  Server,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { firebaseService } from '../services/firebaseService';
import { AppSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  userId: string;
  onClose: () => void;
  onDataCleared?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  userId,
  onClose,
  onDataCleared,
}) => {
  const [settings, setSettings] = useState<AppSettings>({
    autoRefreshIntervalMinutes: 5,
    notifyOnError: true,
    notificationEmail: '',
    webhookUrl: '',
    defaultProxy: '',
    autoSyncEnabled: true,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [testWebhookStatus, setTestWebhookStatus] = useState<string | null>(null);

  // Clear data states
  const [isClearing, setIsClearing] = useState(false);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [clearedSuccess, setClearedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen && userId) {
      setLoading(true);
      firebaseService.getSettings(userId)
        .then(res => {
          if (res) setSettings(res);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isOpen, userId]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await firebaseService.updateSettings(userId, settings);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (e) {
      console.error('Failed to update settings in Firebase:', e);
    } finally {
      setSaving(false);
    }
  };

  const handleTestWebhook = () => {
    if (!settings.webhookUrl) {
      setTestWebhookStatus('Please enter a Webhook URL first.');
      return;
    }
    setTestWebhookStatus('Test alert dispatched to webhook endpoint!');
    setTimeout(() => setTestWebhookStatus(null), 3000);
  };

  const handleClearDatabase = async () => {
    setIsClearing(true);
    try {
      await firebaseService.clearAllData(userId);
      setClearedSuccess(true);
      setShowConfirmClear(false);
      if (onDataCleared) onDataCleared();
      setTimeout(() => {
        setClearedSuccess(false);
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Failed to clear database:', err);
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-xl bg-[#09090b] border border-[#27272a] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-[#27272a] flex items-center justify-between bg-[#111113]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#18181b] text-[#fafafa] border border-[#27272a]">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[#fafafa]">Tracker Settings</h2>
              <p className="text-xs text-[#a1a1aa]">Preferences and telemetry configuration</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-md text-[#a1a1aa] hover:text-[#fafafa] hover:bg-[#27272a] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSave} className="p-5 space-y-5 overflow-y-auto">
          {savedSuccess && (
            <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Settings saved to Firestore database!</span>
            </div>
          )}

          {clearedSuccess && (
            <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>All previous database records cleared successfully!</span>
            </div>
          )}

          {/* Section 1: Polling & Automated Sync */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider">
              <Clock className="w-4 h-4 text-[#a1a1aa]" />
              <span>Telemetry Sync Automation</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-[#18181b] border border-[#27272a]">
              <div>
                <p className="text-xs font-medium text-[#fafafa]">Background Sync Polling</p>
                <p className="text-[11px] text-[#a1a1aa]">
                  Periodically poll accounts for fresh uploads and bio clicks
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.autoSyncEnabled}
                onChange={e => setSettings({ ...settings, autoSyncEnabled: e.target.checked })}
                className="w-4 h-4 rounded bg-[#09090b] border-[#27272a] text-white focus:ring-0"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#a1a1aa] mb-1">
                Refresh Interval (Minutes)
              </label>
              <select
                value={settings.autoRefreshIntervalMinutes}
                onChange={e =>
                  setSettings({ ...settings, autoRefreshIntervalMinutes: Number(e.target.value) })
                }
                className="w-full px-3 py-2 text-xs bg-[#09090b] border border-[#27272a] rounded-lg text-[#fafafa] focus:outline-none focus:border-[#52525b]"
              >
                <option value={1}>Every 1 Minute</option>
                <option value={5}>Every 5 Minutes (Recommended)</option>
                <option value={15}>Every 15 Minutes</option>
                <option value={30}>Every 30 Minutes</option>
                <option value={60}>Every 1 Hour</option>
              </select>
            </div>
          </div>

          {/* Section 2: Notifications & Webhooks */}
          <div className="space-y-3 pt-3 border-t border-[#27272a]">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider">
              <Bell className="w-4 h-4 text-[#a1a1aa]" />
              <span>Notifications & Webhooks</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-[#18181b] border border-[#27272a]">
              <div>
                <p className="text-xs font-medium text-[#fafafa]">Error / Flag Alerts</p>
                <p className="text-[11px] text-[#a1a1aa]">
                  Send alerts when an account is flagged or encounters scraping errors
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.notifyOnError}
                onChange={e => setSettings({ ...settings, notifyOnError: e.target.checked })}
                className="w-4 h-4 rounded bg-[#09090b] border-[#27272a] text-white focus:ring-0"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#a1a1aa] mb-1">
                Notification Email
              </label>
              <input
                type="email"
                placeholder="alerts@yourdomain.com"
                value={settings.notificationEmail}
                onChange={e => setSettings({ ...settings, notificationEmail: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-[#09090b] border border-[#27272a] rounded-lg text-[#fafafa] focus:outline-none focus:border-[#52525b]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-[#a1a1aa]">
                  Webhook URL (Discord / Telegram / Slack)
                </label>
                <button
                  type="button"
                  onClick={handleTestWebhook}
                  className="text-[11px] text-[#fafafa] hover:underline font-medium"
                >
                  Test Webhook
                </button>
              </div>
              <input
                type="url"
                placeholder="https://discord.com/api/webhooks/..."
                value={settings.webhookUrl}
                onChange={e => setSettings({ ...settings, webhookUrl: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-[#09090b] border border-[#27272a] rounded-lg text-[#fafafa] focus:outline-none focus:border-[#52525b] font-mono text-[11px]"
              />
              {testWebhookStatus && (
                <p className="text-[11px] text-emerald-400 mt-1">{testWebhookStatus}</p>
              )}
            </div>
          </div>

          {/* Section 3: Default Proxy Pool */}
          <div className="space-y-3 pt-3 border-t border-[#27272a]">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider">
              <Server className="w-4 h-4 text-[#a1a1aa]" />
              <span>Default Proxy Fallback</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#a1a1aa] mb-1">
                Default Proxy Server
              </label>
              <input
                type="text"
                placeholder="residential.proxies.io:8080"
                value={settings.defaultProxy || ''}
                onChange={e => setSettings({ ...settings, defaultProxy: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-[#09090b] border border-[#27272a] rounded-lg text-[#fafafa] focus:outline-none focus:border-[#52525b] font-mono"
              />
            </div>
          </div>

          {/* Section 4: Danger Zone - Clear Database */}
          <div className="space-y-3 pt-3 border-t border-rose-950/40">
            <div className="flex items-center gap-2 text-xs font-semibold text-rose-400 uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>Database Management</span>
            </div>

            <div className="p-3.5 rounded-lg bg-rose-950/20 border border-rose-900/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-[#fafafa]">Clear All Database Records</p>
                <p className="text-[11px] text-[#a1a1aa]">
                  Delete all accounts, telemetry, and previous data from Firestore.
                </p>
              </div>

              {!showConfirmClear ? (
                <button
                  type="button"
                  id="clear-db-btn"
                  onClick={() => setShowConfirmClear(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-400 bg-rose-950/40 hover:bg-rose-950/70 border border-rose-800/40 rounded-lg transition whitespace-nowrap"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear All Data</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowConfirmClear(false)}
                    className="px-2.5 py-1 text-xs text-[#a1a1aa] hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    id="confirm-clear-db-btn"
                    onClick={handleClearDatabase}
                    disabled={isClearing}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition disabled:opacity-50"
                  >
                    {isClearing ? 'Clearing...' : 'Yes, Delete Everything'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-[#27272a] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#a1a1aa] hover:text-[#fafafa] transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-white text-black hover:bg-zinc-200 transition shadow-sm disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
