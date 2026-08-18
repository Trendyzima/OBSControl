import { useState } from 'react';
import { FileText, Download, ChevronRight, Printer, Calendar, Clock, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface RundownSegment {
  label: string;
  startTime: string;
  durationMinutes: number;
  scene?: string;
  color: string;
}

interface RundownGuest {
  name: string;
  role: string;
  platform: string;
}

interface BroadcastRundownExportProps {
  segments: RundownSegment[];
  guests?: RundownGuest[];
  disabled: boolean;
  onLogEvent?: (msg: string, category?: string) => void;
}

export default function BroadcastRundownExport({
  segments,
  guests = [],
  disabled,
  onLogEvent,
}: BroadcastRundownExportProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [showTitle, setShowTitle] = useState('Podcast Live Show');
  const [host, setHost] = useState('');
  const [producer, setProducer] = useState('');
  const [notes, setNotes] = useState('');
  const [showDate] = useState(() => new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));

  function timeToMinutes(t: string): number {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  }
  function minutesToTime(m: number): string {
    const h = Math.floor(m / 60) % 24;
    const min = m % 60;
    return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
  }
  function getEnd(seg: RundownSegment): string {
    return minutesToTime(timeToMinutes(seg.startTime) + seg.durationMinutes);
  }
  const totalMins = segments.reduce((s, seg) => s + seg.durationMinutes, 0);

  function buildRundownText(): string {
    const lines: string[] = [];
    const border = '═'.repeat(60);
    const thin = '─'.repeat(60);

    lines.push(border);
    lines.push(`  BROADCAST RUNDOWN`);
    lines.push(border);
    lines.push(`  Show: ${showTitle}`);
    lines.push(`  Date: ${showDate}`);
    if (host) lines.push(`  Host: ${host}`);
    if (producer) lines.push(`  Producer: ${producer}`);
    lines.push(`  Total Duration: ${totalMins} min`);
    lines.push(thin);
    lines.push('');

    if (segments.length > 0) {
      lines.push('  SHOW RUNDOWN');
      lines.push(thin);
      lines.push(`  ${'#'.padEnd(4)} ${'START'.padEnd(7)} ${'END'.padEnd(7)} ${'DUR'.padEnd(6)} ${'SEGMENT'.padEnd(24)} SCENE`);
      lines.push(thin);
      segments.forEach((seg, i) => {
        const num = String(i + 1).padEnd(4);
        const start = seg.startTime.padEnd(7);
        const end = getEnd(seg).padEnd(7);
        const dur = `${seg.durationMinutes}min`.padEnd(6);
        const label = seg.label.slice(0, 24).padEnd(24);
        const scene = seg.scene || '—';
        lines.push(`  ${num} ${start} ${end} ${dur} ${label} ${scene}`);
      });
      lines.push(thin);
      lines.push(`  TOTAL: ${totalMins} minutes`);
      lines.push('');
    }

    if (guests.length > 0) {
      lines.push('  GUESTS');
      lines.push(thin);
      guests.forEach(g => {
        lines.push(`  • ${g.name} — ${g.role} (${g.platform})`);
      });
      lines.push('');
    }

    if (notes) {
      lines.push('  PRODUCTION NOTES');
      lines.push(thin);
      notes.split('\n').forEach(l => lines.push(`  ${l}`));
      lines.push('');
    }

    lines.push(border);
    lines.push(`  Generated: ${new Date().toISOString()}`);
    lines.push(`  OBS Control Panel — Broadcast Studio`);
    lines.push(border);

    return lines.join('\n');
  }

  function buildRundownHTML(): string {
    const segRows = segments.map((seg, i) => `
      <tr style="border-bottom:1px solid #2a2a3e;">
        <td style="padding:8px 12px;color:#666;font-size:11px;">${i + 1}</td>
        <td style="padding:8px 12px;font-weight:700;color:#e0e0e0;">${seg.startTime}</td>
        <td style="padding:8px 12px;color:#999;">${getEnd(seg)}</td>
        <td style="padding:8px 12px;color:#cc9955;">${seg.durationMinutes}m</td>
        <td style="padding:8px 12px;color:#e0e0e0;font-weight:600;">${seg.label}</td>
        <td style="padding:8px 12px;color:#6688cc;font-size:11px;">${seg.scene || '—'}</td>
      </tr>
    `).join('');

    const guestRows = guests.map(g => `
      <tr style="border-bottom:1px solid #2a2a3e;">
        <td style="padding:8px 12px;font-weight:700;color:#e0e0e0;">${g.name}</td>
        <td style="padding:8px 12px;color:#999;">${g.role}</td>
        <td style="padding:8px 12px;color:#6688cc;font-size:11px;">${g.platform}</td>
      </tr>
    `).join('');

    return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<title>Rundown — ${showTitle}</title>
<style>
  body{background:#0d0d1a;color:#e0e0e0;font-family:'Courier New',monospace;margin:0;padding:24px;}
  .header{border:2px solid #cc0000;padding:20px 24px;margin-bottom:24px;background:#1a0000;}
  h1{color:#ff3333;margin:0 0 8px;font-size:22px;letter-spacing:3px;text-transform:uppercase;}
  .meta{color:#666;font-size:12px;line-height:2;}
  h2{color:#cc0000;font-size:13px;letter-spacing:2px;text-transform:uppercase;margin:24px 0 8px;border-bottom:1px solid #2a2a3e;padding-bottom:6px;}
  table{width:100%;border-collapse:collapse;font-size:13px;}
  th{background:#1a1a2e;padding:8px 12px;text-align:left;color:#666;font-size:11px;letter-spacing:1px;text-transform:uppercase;}
  .footer{margin-top:32px;color:#333;font-size:11px;border-top:1px solid #1a1a2e;padding-top:12px;}
  .total{color:#cc9955;font-weight:700;}
  pre{background:#1a1a2e;padding:16px;border-radius:6px;font-size:12px;color:#ccc;white-space:pre-wrap;}
  @media print{body{background:#fff;color:#000;}.header{background:#f0f0f0;border-color:#cc0000;}th{background:#e0e0e0;}pre{background:#f5f5f5;color:#333;}}
</style></head><body>
<div class="header">
  <h1>${showTitle}</h1>
  <div class="meta">
    <div><strong>Date:</strong> ${showDate}</div>
    ${host ? `<div><strong>Host:</strong> ${host}</div>` : ''}
    ${producer ? `<div><strong>Producer:</strong> ${producer}</div>` : ''}
    <div class="total"><strong>Total Duration:</strong> ${totalMins} min</div>
  </div>
</div>

${segments.length > 0 ? `
<h2>Show Rundown</h2>
<table>
  <thead><tr>
    <th>#</th><th>Start</th><th>End</th><th>Dur</th><th>Segment</th><th>Scene</th>
  </tr></thead>
  <tbody>${segRows}</tbody>
</table>
` : ''}

${guests.length > 0 ? `
<h2>Guests</h2>
<table>
  <thead><tr><th>Name</th><th>Role</th><th>Platform</th></tr></thead>
  <tbody>${guestRows}</tbody>
</table>
` : ''}

${notes ? `<h2>Production Notes</h2><pre>${notes}</pre>` : ''}

<div class="footer">
  Generated: ${new Date().toISOString()} · OBS Control Panel — Broadcast Studio
</div>
</body></html>`;
  }

  function downloadText() {
    const blob = new Blob([buildRundownText()], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rundown-${showTitle.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    onLogEvent?.('Broadcast rundown exported (TXT)', 'system');
    toast.success('Rundown exported as text file');
  }

  function downloadHTML() {
    const blob = new Blob([buildRundownHTML()], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rundown-${showTitle.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.html`;
    a.click();
    URL.revokeObjectURL(url);
    onLogEvent?.('Broadcast rundown exported (HTML/PDF-ready)', 'system');
    toast.success('Rundown exported as HTML — open in browser to print/save as PDF');
  }

  function printRundown() {
    const html = buildRundownHTML();
    const win = window.open('', '_blank');
    if (!win) { toast.error('Popup blocked — use Download HTML instead'); return; }
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 500);
    onLogEvent?.('Broadcast rundown sent to print', 'system');
  }

  return (
    <div className="border border-border rounded-xl bg-[hsl(var(--card))] overflow-hidden">
      <div
        className="flex items-center gap-2 px-3 h-11 border-b border-border cursor-pointer hover:bg-secondary/10 transition-colors"
        onClick={() => setCollapsed(v => !v)}
      >
        <ChevronRight size={13} className={cn('text-muted-foreground transition-transform shrink-0', !collapsed && 'rotate-90')} />
        <FileText size={12} className="text-muted-foreground shrink-0" />
        <span className="font-mono-console text-[10px] uppercase tracking-widest text-muted-foreground flex-1">
          Broadcast Rundown Export
        </span>
        <span className="font-mono-console text-[9px] text-muted-foreground shrink-0">
          {segments.length} segment{segments.length !== 1 ? 's' : ''} · {totalMins}min
        </span>
      </div>

      {!collapsed && (
        <div className="p-3 space-y-3">
          {/* Show details */}
          <div className="grid grid-cols-1 gap-2">
            <div>
              <label className="font-mono-console text-[9px] text-muted-foreground block mb-1">Show Title</label>
              <input
                type="text"
                value={showTitle}
                onChange={e => setShowTitle(e.target.value)}
                className="w-full bg-input border border-border rounded-lg px-2.5 py-1.5 font-mono-console text-[10px] text-foreground focus:outline-none focus:border-primary"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-mono-console text-[9px] text-muted-foreground flex items-center gap-1 mb-1">
                <User size={9} /> Host
              </label>
              <input
                type="text"
                placeholder="Host name..."
                value={host}
                onChange={e => setHost(e.target.value)}
                className="w-full bg-input border border-border rounded-lg px-2.5 py-1.5 font-mono-console text-[10px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="font-mono-console text-[9px] text-muted-foreground flex items-center gap-1 mb-1">
                <User size={9} /> Producer
              </label>
              <input
                type="text"
                placeholder="Producer name..."
                value={producer}
                onChange={e => setProducer(e.target.value)}
                className="w-full bg-input border border-border rounded-lg px-2.5 py-1.5 font-mono-console text-[10px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Date + duration summary */}
          <div className="flex items-center gap-3 p-2.5 rounded-lg bg-secondary/30 border border-border">
            <Calendar size={11} className="text-muted-foreground shrink-0" />
            <span className="font-mono-console text-[9px] text-muted-foreground flex-1">{showDate}</span>
            <Clock size={11} className="text-muted-foreground shrink-0" />
            <span className="font-mono-console text-[9px] text-foreground">{totalMins} min total</span>
          </div>

          {/* Segment preview */}
          {segments.length > 0 ? (
            <div className="rounded-lg border border-border overflow-hidden">
              <div className="px-3 py-1.5 bg-secondary/30 font-mono-console text-[9px] text-muted-foreground uppercase tracking-wider">
                Rundown Preview
              </div>
              <div className="divide-y divide-border/40 max-h-36 overflow-y-auto">
                {segments.map((seg, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-1.5">
                    <span className="font-mono-console text-[9px] text-muted-foreground w-5">{i + 1}</span>
                    <span className="font-mono-console text-[10px] text-foreground w-12 tabular-nums">{seg.startTime}</span>
                    <span className="font-mono-console text-[9px] text-muted-foreground/60 w-12 tabular-nums">{getEnd(seg)}</span>
                    <span className="font-mono-console text-[9px] text-amber-400/80 w-10 tabular-nums">{seg.durationMinutes}m</span>
                    <span className="font-mono-console text-[10px] text-foreground flex-1 truncate">{seg.label}</span>
                    {seg.scene && (
                      <span className="font-mono-console text-[8px] text-blue-400/70 shrink-0 hidden sm:block">{seg.scene}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-4 text-muted-foreground/40 font-mono-console text-xs">
              No segments in Show Schedule — add segments above
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="font-mono-console text-[9px] text-muted-foreground block mb-1">Production Notes</label>
            <textarea
              placeholder="Camera angles, cue points, technical notes..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              className="w-full bg-input border border-border rounded-lg px-2.5 py-1.5 font-mono-console text-[10px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary resize-none"
            />
          </div>

          {/* Export buttons */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={downloadText}
              disabled={segments.length === 0}
              className="flex items-center justify-center gap-1.5 py-2 rounded-xl border border-border bg-secondary/40 hover:bg-secondary font-mono-console text-[10px] text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
            >
              <Download size={11} />
              TXT
            </button>
            <button
              onClick={downloadHTML}
              disabled={segments.length === 0}
              className="flex items-center justify-center gap-1.5 py-2 rounded-xl border border-border bg-secondary/40 hover:bg-secondary font-mono-console text-[10px] text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
            >
              <FileText size={11} />
              HTML
            </button>
            <button
              onClick={printRundown}
              disabled={segments.length === 0}
              className="flex items-center justify-center gap-1.5 py-2 rounded-xl border border-primary/40 bg-primary/10 hover:bg-primary/20 font-mono-console text-[10px] text-primary transition-colors disabled:opacity-40"
            >
              <Printer size={11} />
              Print
            </button>
          </div>

          <p className="font-mono-console text-[8px] text-muted-foreground/30 text-center">
            HTML export opens in browser for print-to-PDF — formats for A4/Letter
          </p>
        </div>
      )}
    </div>
  );
}
