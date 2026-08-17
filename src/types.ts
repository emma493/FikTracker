export type AccountStatus = 'active' | 'inactive' | 'error' | 'syncing';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
}

export interface VideoRecord {
  id: string;
  title: string;
  uploadDate: string;
  uploadedAt?: string;
  views: number;
  clicks: number;
  linkClicks?: number;
  duration: string;
  status: 'published' | 'processing' | 'flagged' | 'Live';
  thumbnailUrl?: string;
}

export interface SyncLog {
  id: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error';
  message: string;
  durationMs: number;
  details?: string;
}

export interface FikFapAccount {
  id: string;
  userId: string;
  fikfapEmail: string;
  fikfapUsername: string;
  label?: string;
  status: AccountStatus;
  errorMessage?: string;
  totalVideos: number;
  totalLinkClicks: number;
  totalViews: number;
  totalFollowers: number;
  totalLikes: number;
  todayVideos: number;
  todayLinkClicks: number;
  todayViews: number;
  targetBioLink?: string;
  proxy?: string;
  syncFrequency: 'hourly' | 'every_6h' | 'daily' | 'manual';
  lastUpdated: string;
  createdAt: string;
  recentVideos?: VideoRecord[];
  syncLogs?: SyncLog[];
}

export interface DailyStat {
  id: string;
  accountId: string;
  accountEmail: string;
  date: string; // YYYY-MM-DD
  videosCount: number;
  linkClicksCount: number;
  viewsCount: number;
  followersGained?: number;
}

export interface DashboardStats {
  today: {
    totalVideos: number;
    totalLinkClicks: number;
    totalViews: number;
    activeAccounts: number;
    videoGrowthPct: number;
    clickGrowthPct: number;
  };
  allTime: {
    totalVideos: number;
    totalLinkClicks: number;
    totalViews: number;
    totalAccounts: number;
    avgClicksPerVideo: number;
  };
  statusCounts: {
    active: number;
    inactive: number;
    error: number;
    syncing: number;
    total: number;
  };
  trend7d: Array<{
    date: string;
    videos: number;
    linkClicks: number;
    views: number;
  }>;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface AppSettings {
  autoRefreshIntervalMinutes: number;
  notifyOnError: boolean;
  notificationEmail: string;
  webhookUrl: string;
  defaultProxy?: string;
  autoSyncEnabled: boolean;
}

export interface TelemetryPingEvent {
  id: string;
  timestamp: string;
  latencyMs: number;
  accountId?: string;
  accountUsername?: string;
  type: 'ping' | 'traffic_pulse' | 'metric_update' | 'sync';
  message: string;
  deltaClicks?: number;
  deltaViews?: number;
}

export interface TelemetryState {
  isLive: boolean;
  pingIntervalSec: number;
  latencyMs: number;
  lastPingTime: string | null;
  totalPingsCount: number;
  liveClicksPerSec: number;
  liveViewsPerSec: number;
}

