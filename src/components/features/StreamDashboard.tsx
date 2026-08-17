import { BitratePoint, StreamStatus } from '@/types/obs';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Wifi, Zap, Cpu, AlertTriangle, Clock, Download, BarChart2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface StreamDashboardProps {
  streamStatus: StreamStatus;
  bitrateHistory: BitratePoint[];
  sessionEvents?: { timestamp: string; message: string }[];
}

function Stat({ icon: Icon, label, value, warn, good }: {
  icon: React.ElementType;
  label: string;
  value: string;
  warn?: boolean;
  good?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1 p-3 rounded-xl bg-secondary/40 border border-border">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Icon size={10} className={warn ? 'text-amber-400' : good ? 'text-emerald-400' : ''} />
        <span className="font-mono-console text-[9px] uppercase tracking-wider">{label}</span>
      </div>
      <span className={cn(
        'font-mono-console text-lg font-bold tabular-nums leading-none',
        warn ? 'text-amber-400' : good ? 'text-emerald-400' : 'text-foreground'
      )}>
        {value}
      </span>
    </div>
  );
}

export default function StreamDashboard({ streamStatus, bitrateHistory, sessionEvents = [] }: StreamDashboardProps) {
  const { streaming, bitrate = 0, fps = 0, droppedFrames = 0, duration, cpuUsage = 0 } = streamStatus;

  function handleExport() {
    if (bitrateHistory.length === 0 && sessionEvents.length === 0) {
      toast.error('No stream data to export yet.');
      return;
    }

    const lines: string[] = [];
    lines.push('OBS Control Panel — Stream Analytics Report');
    lines.push(`Generated: ${new Date().toISOString()}`);
    lines.push('');
    lines.push('=== SESSION SUMMARY ===');
    lines.push(`Stream Duration: ${duration}`);
    lines.push(`Peak Bitrate: ${bitrateHistory.length ? Math.max(...bitrateHistory.map(b => b.bitrate)).toLocaleString() : '0'} kbps`);
    lines.push(`Avg Bitrate: ${bitrateHistory.length ? Math.round(bitrateHistory.reduce((s, b) => s + b.bitrate, 0) / bitrateHistory.length).toLocaleString() : '0'} kbps`);
    lines.push(`Current FPS: ${fps}`);
    lines.push(`CPU Usage: ${cpuUsage}%`);
    lines.push(`Dropped Frames: ${droppedFrames}`);
    lines.push('');
    lines.push('=== BITRATE HISTORY ===');
    lines.push('Time,Bitrate (kbps)');
    bitrateHistory.forEach(b => lines.push(`${b.time},${b.bitrate}`));
    lines.push('');
    if (sessionEvents.length > 0) {
      lines.push('=== EVENT LOG EXCERPT ===');
      lines.push('Timestamp,Event');
      sessionEvents.slice(-50).forEach(e => lines.push(`${e.timestamp},${e.message.replace(/,/g, ';')}`));
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stream-analytics-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Analytics report exported');
  }

  const peakBitrate = bitrateHistory.length ? Math.max(...bitrateHistory.map(b => b.bitrate)) : 0;
  const avgBitrate = bitrateHistory.length
    ? Math.round(bitrateHistory.reduce((s, b) => s + b.bitrate, 0) / bitrateHistory.length)
    : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart2 size={14} className="text-muted-foreground" />
          <h2 className="font-mono-console text-xs tracking-widest text-muted-foreground uppercase">Stream Dashboard</h2>
        </div>
        <div className="flex items-center gap-2">
          {streaming && (
            <span className="flex items-center gap-1.5 text-[10px] font-mono-console text-[hsl(var(--live-red))] pulse-red">
              <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--live-red))]" />
              LIVE
            </span>
          )}
          <button
            onClick={handleExport}
            title="Export analytics CSV"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border bg-secondary/40 hover:bg-secondary text-[10px] font-mono-console text-muted-foreground hover:text-foreground transition-colors"
          >
            <Download size={10} />
            Export
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat icon={Clock} label="Duration" value={duration} />
        <Stat
          icon={Wifi}
          label="Bitrate"
          value={streaming ? `${bitrate.toLocaleString()}` : '—'}
          good={streaming && bitrate > 4000}
          warn={streaming && bitrate < 2000 && bitrate > 0}
        />
        <Stat
          icon={Zap}
          label="FPS"
          value={streaming ? `${fps}` : '—'}
          warn={streaming && fps < 25}
          good={streaming && fps >= 29}
        />
        <Stat
          icon={droppedFrames > 0 ? AlertTriangle : Cpu}
          label={droppedFrames > 0 ? 'Dropped' : 'CPU'}
          value={droppedFrames > 0 ? `${droppedFrames}` : `${cpuUsage}%`}
          warn={droppedFrames > 0 || cpuUsage > 70}
        />
      </div>

      {/* Bitrate graph */}
      <div className="rounded-xl border border-border bg-secondary/20 p-3">
        <div className="flex items-center justify-between mb-2">
          <p className="font-mono-console text-[9px] text-muted-foreground uppercase tracking-wider">Bitrate (kbps)</p>
          {bitrateHistory.length > 1 && (
            <div className="flex items-center gap-3">
              <span className="font-mono-console text-[9px] text-muted-foreground">
                avg <span className="text-foreground">{avgBitrate.toLocaleString()}</span>
              </span>
              <span className="font-mono-console text-[9px] text-muted-foreground">
                peak <span className="text-foreground">{peakBitrate.toLocaleString()}</span>
              </span>
            </div>
          )}
        </div>
        {bitrateHistory.length > 1 ? (
          <ResponsiveContainer width="100%" height={80}>
            <AreaChart data={bitrateHistory} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="bitrateGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(0,85%,55%)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="hsl(0,85%,55%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" hide />
              <YAxis domain={['auto', 'auto']} hide />
              <Tooltip
                contentStyle={{ background: 'hsl(220,18%,11%)', border: '1px solid hsl(220,15%,18%)', borderRadius: 8, fontSize: 10, fontFamily: 'JetBrains Mono' }}
                labelStyle={{ color: 'hsl(215,10%,50%)' }}
                itemStyle={{ color: 'hsl(0,85%,55%)' }}
                formatter={(v: number) => [`${v.toLocaleString()} kbps`, 'Bitrate']}
              />
              <Area type="monotone" dataKey="bitrate" stroke="hsl(0,85%,55%)" strokeWidth={1.5} fill="url(#bitrateGrad)" dot={false} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[80px] flex items-center justify-center text-[10px] font-mono-console text-muted-foreground/40">
            {streaming ? 'Collecting data...' : 'Start streaming to see live metrics'}
          </div>
        )}
      </div>

      {/* CPU bar */}
      {streaming && cpuUsage > 0 && (
        <div className="flex items-center gap-3">
          <span className="font-mono-console text-[9px] text-muted-foreground w-8 shrink-0">CPU</span>
          <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all duration-500', cpuUsage > 70 ? 'bg-amber-400' : 'bg-emerald-400')}
              style={{ width: `${cpuUsage}%` }}
            />
          </div>
          <span className={cn('font-mono-console text-[9px] w-8 text-right tabular-nums shrink-0', cpuUsage > 70 ? 'text-amber-400' : 'text-muted-foreground')}>
            {cpuUsage}%
          </span>
        </div>
      )}
    </div>
  );
}
