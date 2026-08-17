import React from 'react';
import {
  Video,
  MousePointerClick,
  TrendingUp,
  Layers,
  Sparkles,
} from 'lucide-react';
import { DashboardStats } from '../types';

interface StatCardsProps {
  stats: DashboardStats | null;
  loading: boolean;
}

export const StatCards: React.FC<StatCardsProps> = ({ stats, loading }) => {
  const today = stats?.today || {
    totalVideos: 0,
    totalLinkClicks: 0,
    totalViews: 0,
    activeAccounts: 0,
    videoGrowthPct: 0,
    clickGrowthPct: 0,
  };

  const allTime = stats?.allTime || {
    totalVideos: 0,
    totalLinkClicks: 0,
    totalViews: 0,
    totalAccounts: 0,
    avgClicksPerVideo: 0,
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Today's Videos */}
      <div id="stat-card-today-videos" className="bg-[#09090b] border border-[#27272a] p-5 rounded-xl flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-[#a1a1aa] uppercase tracking-wider mb-1">Today's Videos</p>
            <Video className="w-4 h-4 text-[#a1a1aa]" />
          </div>
          <h3 className="text-2xl font-bold text-[#fafafa]">
            {loading ? '...' : `+${today.totalVideos.toLocaleString()}`}
          </h3>
        </div>
        <p className="text-xs text-emerald-400 mt-3 flex items-center gap-1 font-medium">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>{today.totalVideos > 0 ? `+${today.videoGrowthPct || 0}% vs yesterday` : '0 uploaded today'}</span>
        </p>
      </div>

      {/* 2. Today's Clicks */}
      <div id="stat-card-today-clicks" className="bg-[#09090b] border border-[#27272a] p-5 rounded-xl flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-[#a1a1aa] uppercase tracking-wider mb-1">Today's Clicks</p>
            <MousePointerClick className="w-4 h-4 text-[#a1a1aa]" />
          </div>
          <h3 className="text-2xl font-bold text-[#fafafa]">
            {loading ? '...' : today.totalLinkClicks.toLocaleString()}
          </h3>
        </div>
        <p className="text-xs text-emerald-400 mt-3 flex items-center gap-1 font-medium">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>{today.totalLinkClicks > 0 ? `+${today.clickGrowthPct || 0}% increase` : '0 bio clicks today'}</span>
        </p>
      </div>

      {/* 3. Total Videos */}
      <div id="stat-card-alltime-videos" className="bg-[#09090b] border border-[#27272a] p-5 rounded-xl flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-[#a1a1aa] uppercase tracking-wider mb-1">Total Videos</p>
            <Layers className="w-4 h-4 text-[#a1a1aa]" />
          </div>
          <h3 className="text-2xl font-bold text-[#fafafa]">
            {loading ? '...' : allTime.totalVideos.toLocaleString()}
          </h3>
        </div>
        <p className="text-xs text-[#71717a] mt-3">
          Across {allTime.totalAccounts} connected {allTime.totalAccounts === 1 ? 'account' : 'accounts'}
        </p>
      </div>

      {/* 4. Total Clicks */}
      <div id="stat-card-alltime-clicks" className="bg-[#09090b] border border-[#27272a] p-5 rounded-xl flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-[#a1a1aa] uppercase tracking-wider mb-1">Total Bio Clicks</p>
            <Sparkles className="w-4 h-4 text-[#a1a1aa]" />
          </div>
          <h3 className="text-2xl font-bold text-[#fafafa]">
            {loading ? '...' : allTime.totalLinkClicks > 1000 ? `${(allTime.totalLinkClicks / 1000).toFixed(1)}k` : allTime.totalLinkClicks.toLocaleString()}
          </h3>
        </div>
        <p className="text-xs text-[#71717a] mt-3">
          {allTime.totalVideos > 0 ? `~${allTime.avgClicksPerVideo} clicks / video` : 'Bio funnel telemetry'}
        </p>
      </div>
    </div>
  );
};
