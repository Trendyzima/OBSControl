import { BroadcastAnalytics } from '@/types/studio';
import { BarChart2, Download, Clock, Zap, Tv, TrendingUp, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnalyticsDashboardProps {
  analytics: BroadcastAnalytics;
  sceneNames: Record<string, string>;
  isLive: boolean;
}

function formatDur(s: number) {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  if (h > 0) return `${h}h ${m}m ${sec}s`;
  return `${m}m ${sec}s`;
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function AnalyticsDashboard({ analytics, sceneNames, isLive }: AnalyticsDashboardProps) {
  const duration = analytics.sessionEnd
    ? Math.floor((analytics.sessionEnd - analytics.sessionStart) / 1000)
    : Math.floor((Date.now() - analytics.sessionStart) / 1000);

  // Top 5 scenes by usage
  const topScenes = Object.entries(analytics.sceneUsage)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const maxSceneTime = topScenes[0]?.[1] || 1;

  // Health history chart points
  const chartPoints = analytics.healthHistory.slice(-60);
  const chartMax = 100;
  const chartW = 300;
  const chartH = 60;

  function toPath(points: { score: number }[]) {
    if (points.length < 2) return '';
    return points
      .map((p, i) => {
        const x = (i / (points.length - 1)) * chartW;
        const y = chartH - (p.score / chartMax) * chartH;
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }

  function exportCSV() {
    const rows = [
      ['Broadcast Analytics Report'],
      ['Session Start', formatTime(analytics.sessionStart)],
      ['Duration', formatDur(duration)],
      ['Scene Switches', String(analytics.sceneSwitches.length)],
      ['Peak Bitrate (kbps)', String(analytics.peakBitrate)],
      ['Avg Bitrate (kbps)', String(analytics.avgBitrate)],
      ['Ad Breaks', String(analytics.adBreaks)],
      ['Ticker Messages', String(analytics.tickerMessages)],
      [],
      ['Scene Usage'],
      ['Scene', 'Duration (s)'],
      ...Object.entries(analytics.sceneUsage).map(([id, s]) => [sceneNames[id] || id, String(s)]),
      [],
      ['Scene Switches Timeline'],
      ['Time', 'From', 'To'],
      ...analytics.sceneSwitches.map(sw => [formatTime(sw.time), sceneNames[sw.from] || sw.from, sceneNames[sw.to] || sw.to]),
      [],
      ['Health History (last 60 samples)'],
      ['Time', 'Score', 'Bitrate (kbps)'],
      ...analytics.healthHistory.map(h => [formatTime(h.time), String(h.score), String(h.bitrate)]),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `broadcast-analytics-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-mono-console text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
          <BarChart2 size={11} /> Stream Analytics
        </h3>
        <div className="flex items-center gap-2">
          {isLive && (
            <span className="flex items-center gap-1 font-mono-console text-[9px] text-red-400">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />LIVE
            </span>
          )}
          <button onClick={exportCSV}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground font-mono-console text-[9px] transition-colors">
            <Download size={10} /> Export CSV
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { icon: Clock, label: 'Duration', value: formatDur(duration), color: 'text-blue-400' },
          { icon: Zap, label: 'Scene Switches', value: String(analytics.sceneSwitches.length), color: 'text-amber-400' },
          { icon: Activity, label: 'Peak Bitrate', value: analytics.peakBitrate > 0 ? `${analytics.peakBitrate}k` : '—', color: 'text-emerald-400' },
          { icon: TrendingUp, label: 'Avg Bitrate', value: analytics.avgBitrate > 0 ? `${analytics.avgBitrate}k` : '—', color: 'text-purple-400' },
          { icon: Tv, label: 'Ad Breaks', value: String(analytics.adBreaks), color: 'text-orange-400' },
          { icon: BarChart2, label: 'Ticker Messages', value: String(analytics.tickerMessages), color: 'text-cyan-400' },
        ].map(kpi => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="p-2.5 rounded-xl border border-border bg-secondary/10">
              <div className="flex items-center gap-1.5 mb-1">
                <Icon size={9} className={kpi.color} />
                <span className="font-mono-console text-[8px] text-muted-foreground uppercase tracking-wider">{kpi.label}</span>
              </div>
              <p className={cn('font-mono-console text-base font-bold tabular-nums', kpi.color)}>{kpi.value}</p>
            </div>
          );
        })}
      </div>

      {/* Health score timeline */}
      {chartPoints.length > 2 && (
        <div className="p-3 rounded-xl border border-border bg-secondary/10">
          <p className="font-mono-console text-[9px] text-muted-foreground uppercase tracking-wider mb-2">Health Score Timeline</p>
          <svg width="100%" viewBox={`0 0 ${chartW} ${chartH}`} className="overflow-visible">
            {/* Grid lines */}
            {[25, 50, 75].map(y => (
              <line key={y}
                x1="0" y1={chartH - (y / chartMax) * chartH}
                x2={chartW} y2={chartH - (y / chartMax) * chartH}
                stroke="rgba(255,255,255,0.06)" strokeWidth="1"
              />
            ))}
            {/* Fill */}
            <path
              d={`${toPath(chartPoints)} L${chartW},${chartH} L0,${chartH} Z`}
              fill="rgba(16,185,129,0.1)"
            />
            {/* Line */}
            <path
              d={toPath(chartPoints)}
              fill="none"
              stroke="rgba(16,185,129,0.7)"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
          <div className="flex justify-between mt-1">
            <span className="font-mono-console text-[7px] text-muted-foreground/30">
              {chartPoints.length > 0 ? formatTime(chartPoints[0]?.time || Date.now()) : ''}
            </span>
            <span className="font-mono-console text-[7px] text-muted-foreground/30">
              {chartPoints.length > 0 ? formatTime(chartPoints[chartPoints.length - 1]?.time || Date.now()) : ''}
            </span>
          </div>
        </div>
      )}

      {/* Top scenes */}
      {topScenes.length > 0 && (
        <div className="space-y-2">
          <p className="font-mono-console text-[9px] text-muted-foreground/50 uppercase tracking-wider">Scene Time Distribution</p>
          {topScenes.map(([sceneId, seconds]) => (
            <div key={sceneId} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono-console text-[10px] text-foreground">{sceneNames[sceneId] || sceneId}</span>
                <span className="font-mono-console text-[9px] text-muted-foreground tabular-nums">{formatDur(seconds)}</span>
              </div>
              <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-red-400 transition-all duration-500"
                  style={{ width: `${(seconds / maxSceneTime) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Scene switches log */}
      {analytics.sceneSwitches.length > 0 && (
        <div className="space-y-1.5">
          <p className="font-mono-console text-[9px] text-muted-foreground/50 uppercase tracking-wider">Recent Scene Switches</p>
          <div className="max-h-36 overflow-y-auto space-y-1 no-scrollbar">
            {[...analytics.sceneSwitches].reverse().slice(0, 20).map((sw, i) => (
              <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-secondary/10">
                <span className="font-mono-console text-[8px] text-muted-foreground/50 shrink-0 tabular-nums">{formatTime(sw.time)}</span>
                <span className="font-mono-console text-[9px] text-muted-foreground/60 shrink-0">{sceneNames[sw.from] || sw.from}</span>
                <span className="text-muted-foreground/40 shrink-0">→</span>
                <span className="font-mono-console text-[9px] text-foreground truncate">{sceneNames[sw.to] || sw.to}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
