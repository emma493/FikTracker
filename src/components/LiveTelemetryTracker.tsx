import React, { useState } from 'react';
import {
  Activity,
  Radio,
  Zap,
  Clock,
  Play,
  Pause,
  RefreshCw,
  Server,
  MousePointerClick,
  Eye,
  Video,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Terminal,
  ShieldCheck,
} from 'lucide-react';
import { TelemetryPingEvent } from '../types';

interface LiveTelemetryTrackerProps {
  isLivePinging: boolean;
  onToggleLive: () => void;
  pingIntervalSec: number;
  onChangePingInterval: (sec: number) => void;
  latencyMs: number;
  totalPingsCount: number;
  lastPingTime: string | null;
  liveClicksRate: number;
  liveViewsRate: number;
  activeAccountsCount: number;
  recentPingEvents: TelemetryPingEvent[];
  onTriggerManualPing: () => void;
}

export const LiveTelemetryTracker: React.FC<LiveTelemetryTrackerProps> = ({
  isLivePinging,
  onToggleLive,
  pingIntervalSec,
  onChangePingInterval,
  latencyMs,
  totalPingsCount,
  lastPingTime,
  liveClicksRate,
  liveViewsRate,
  activeAccountsCount,
  recentPingEvents,
  onTriggerManualPing,
}) => {
  const [showEventLog, setShowEventLog] = useState(false);

  const formatTime = (iso?: string | null) => {
    if (!iso) return 'Waiting...';
    const date = new Date(iso);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="rounded-xl bg-[#09090b] border border-[#27272a] overflow-hidden shadow-sm">
      {/* Main Real-Time Telemetry Bar */}
      <div className="p-3.5 sm:p-4 bg-gradient-to-r from-[#111113] via-[#09090b] to-[#111113] border-b border-[#27272a] flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left side: Live Ping Indicator & Status */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            {isLivePinging ? (
              <>
                <span className="absolute w-3.5 h-3.5 rounded-full bg-emerald-500/40 animate-ping" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-emerald-500/50" />
              </>
            ) : (
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-amber-500/50" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white tracking-wide uppercase flex items-center gap-1.5">
                <Radio className={`w-3.5 h-3.5 ${isLivePinging ? 'text-emerald-400 animate-pulse' : 'text-zinc-500'}`} />
                {isLivePinging ? 'Real-Time 1s Telemetry Active' : 'Live Tracking Paused'}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-medium">
                Every {pingIntervalSec}s
              </span>
              <span className="text-[10px] text-zinc-500 font-mono hidden sm:inline">
                • {activeAccountsCount} accounts streaming
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5 flex items-center gap-2">
              <span>Last Ping: <strong className="text-zinc-200 font-mono">{formatTime(lastPingTime)}</strong></span>
              <span>•</span>
              <span>Latency: <strong className="text-emerald-400 font-mono">{latencyMs}ms</strong></span>
              <span>•</span>
              <span>Total Pings: <strong className="text-zinc-200 font-mono">{totalPingsCount.toLocaleString()}</strong></span>
            </p>
          </div>
        </div>

        {/* Right side: Controls & Intervals */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Interval selector */}
          <div className="flex items-center p-0.5 rounded-lg bg-[#18181b] border border-[#27272a] text-xs">
            <button
              onClick={() => onChangePingInterval(1)}
              className={`px-2 py-1 rounded text-[11px] font-semibold transition ${
                pingIntervalSec === 1
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Ultra-fast 1-second live telemetry updates"
            >
              1s (Fast)
            </button>
            <button
              onClick={() => onChangePingInterval(3)}
              className={`px-2 py-1 rounded text-[11px] font-medium transition ${
                pingIntervalSec === 3
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              3s
            </button>
            <button
              onClick={() => onChangePingInterval(5)}
              className={`px-2 py-1 rounded text-[11px] font-medium transition ${
                pingIntervalSec === 5
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              5s
            </button>
          </div>

          {/* Toggle Live Ping Engine */}
          <button
            onClick={onToggleLive}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
              isLivePinging
                ? 'bg-[#18181b] text-amber-300 border-amber-500/30 hover:bg-amber-950/20'
                : 'bg-emerald-600 text-white border-emerald-500 hover:bg-emerald-500'
            }`}
          >
            {isLivePinging ? (
              <>
                <Pause className="w-3.5 h-3.5 text-amber-400" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Resume 1s Ping</span>
              </>
            )}
          </button>

          {/* Manual Ping Now */}
          <button
            onClick={onTriggerManualPing}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-300 bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] transition"
            title="Execute instant telemetry ping right now"
          >
            <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Ping Now</span>
          </button>

          {/* Toggle Event Logs */}
          <button
            onClick={() => setShowEventLog(!showEventLog)}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-white bg-[#18181b] border border-[#27272a] transition"
            title="Toggle Live Telemetry Terminal"
          >
            <Terminal className="w-3.5 h-3.5 text-zinc-400" />
            {showEventLog ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Expandable Live Event Log Stream */}
      {showEventLog && (
        <div className="p-3 bg-[#0c0c0e] border-t border-[#27272a] font-mono text-[11px]">
          <div className="flex items-center justify-between text-zinc-500 mb-2 pb-1 border-b border-zinc-800">
            <span className="flex items-center gap-1 text-zinc-300 font-semibold text-xs">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              Live 1-Second Telemetry Ingestion Stream
            </span>
            <span className="text-[10px] text-zinc-500">Auto-refreshing every 1s</span>
          </div>

          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
            {recentPingEvents.length === 0 ? (
              <div className="text-zinc-500 py-2 text-center">Awaiting telemetry pings...</div>
            ) : (
              recentPingEvents.slice(0, 8).map(event => (
                <div
                  key={event.id}
                  className="flex items-center justify-between text-xs py-1 px-2 rounded bg-[#18181b]/60 border border-zinc-800/60"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-500 text-[10px]">{event.timestamp}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span className="text-zinc-200">{event.message}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {event.deltaClicks !== undefined && event.deltaClicks > 0 && (
                      <span className="text-emerald-400 font-bold text-[10px]">
                        +{event.deltaClicks} click{event.deltaClicks > 1 ? 's' : ''}
                      </span>
                    )}
                    {event.deltaViews !== undefined && event.deltaViews > 0 && (
                      <span className="text-sky-400 text-[10px]">+{event.deltaViews} views</span>
                    )}
                    <span className="text-zinc-500 text-[10px] font-mono">{event.latencyMs}ms</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
