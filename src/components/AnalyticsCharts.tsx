import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { TrendingUp, BarChart3, LineChart as LineChartIcon, Eye, MousePointerClick } from 'lucide-react';
import { DashboardStats, FikFapAccount } from '../types';

interface AnalyticsChartsProps {
  stats: DashboardStats | null;
  accounts: FikFapAccount[];
}

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({ stats, accounts }) => {
  const [chartMode, setChartMode] = useState<'trends' | 'distribution'>('trends');

  const trendData = stats?.trend7d || [];

  // Top accounts by link clicks for distribution chart
  const accountDistributionData = accounts
    .slice()
    .sort((a, b) => b.totalLinkClicks - a.totalLinkClicks)
    .slice(0, 6)
    .map(a => ({
      name: a.label || a.fikfapUsername || a.fikfapEmail.split('@')[0],
      totalClicks: a.totalLinkClicks,
      todayClicks: a.todayLinkClicks,
      videos: a.totalVideos,
    }));

  return (
    <div className="p-5 rounded-xl bg-[#09090b] border border-[#27272a]">
      {/* Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-[#fafafa]">Performance & Growth Analytics</h3>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-[#18181b] text-[#a1a1aa] border border-[#27272a]">
              7-Day Telemetry
            </span>
          </div>
          <p className="text-xs text-[#a1a1aa] mt-0.5">
            Cross-account video publishing and bio link conversion trends
          </p>
        </div>

        <div className="flex items-center p-1 rounded-lg bg-[#18181b] border border-[#27272a] self-start sm:self-auto">
          <button
            id="chart-tab-trends"
            onClick={() => setChartMode('trends')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition ${
              chartMode === 'trends'
                ? 'bg-[#27272a] text-[#fafafa] font-semibold'
                : 'text-[#a1a1aa] hover:text-[#fafafa]'
            }`}
          >
            <LineChartIcon className="w-3.5 h-3.5" />
            <span>Daily Trends</span>
          </button>
          <button
            id="chart-tab-distribution"
            onClick={() => setChartMode('distribution')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition ${
              chartMode === 'distribution'
                ? 'bg-[#27272a] text-[#fafafa] font-semibold'
                : 'text-[#a1a1aa] hover:text-[#fafafa]'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Top Accounts</span>
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-64 w-full">
        {chartMode === 'trends' ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorVideos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="date" stroke="#71717a" fontSize={11} tickLine={false} />
              <YAxis yAxisId="left" stroke="#71717a" fontSize={11} tickLine={false} />
              <YAxis yAxisId="right" orientation="right" stroke="#71717a" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#09090b',
                  borderColor: '#27272a',
                  borderRadius: '0.5rem',
                  fontSize: '12px',
                  color: '#fafafa',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="linkClicks"
                name="Link Clicks"
                stroke="#6366f1"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorClicks)"
              />
              <Area
                yAxisId="right"
                type="monotone"
                dataKey="videos"
                name="Videos Published"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorVideos)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={accountDistributionData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="name" stroke="#71717a" fontSize={11} tickLine={false} />
              <YAxis stroke="#71717a" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#09090b',
                  borderColor: '#27272a',
                  borderRadius: '0.5rem',
                  fontSize: '12px',
                  color: '#fafafa',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Bar dataKey="totalClicks" name="Total Bio Clicks" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="todayClicks" name="Today's Clicks" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
