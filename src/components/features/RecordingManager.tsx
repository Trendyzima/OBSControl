import { useState } from 'react';
import { RecordingFile } from '@/types/obs';
import { Film, Download, Trash2, Clock, HardDrive, Monitor, ChevronRight, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

function formatBytes(b: number) {
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  if (b < 1024 * 1024 * 1024) return `${(b / (1024 * 1024)).toFixed(1)} MB`;
  return `${(b / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatDuration(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

interface RecordingManagerProps {
  recordings: RecordingFile[];
  onDelete: (id: string) => void;
}

export default function RecordingManager({ recordings, onDelete }: RecordingManagerProps) {
  const [collapsed, setCollapsed] = useState(true);
  const [filter, setFilter] = useState<'all' | 'screen' | 'obs'>('all');

  const filtered = filter === 'all' ? recordings : recordings.filter(r => r.type === filter);
  const totalSize = recordings.reduce((sum, r) => sum + r.sizeBytes, 0);

  function handleDownload(rec: RecordingFile) {
    const a = document.createElement('a');
    a.href = rec.blobUrl;
    a.download = rec.name;
    a.click();
  }

  function handleDelete(rec: RecordingFile) {
    URL.revokeObjectURL(rec.blobUrl);
    onDelete(rec.id);
  }

  return (
    <div className="border border-border rounded-xl bg-[hsl(var(--card))] overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 h-10 border-b border-border cursor-pointer"
        onClick={() => setCollapsed(v => !v)}
      >
        <ChevronRight size={13} className={cn('text-muted-foreground transition-transform', !collapsed && 'rotate-90')} />
        <Film size={12} className="text-muted-foreground" />
        <span className="font-mono-console text-[10px] uppercase tracking-widest text-muted-foreground flex-1">
          Recordings
        </span>
        {recordings.length > 0 && (
          <span className="font-mono-console text-[9px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
            {recordings.length} · {formatBytes(totalSize)}
          </span>
        )}
      </div>

      {!collapsed && (
        <div className="p-3 space-y-2">
          {/* Filter tabs */}
          {recordings.length > 0 && (
            <div className="flex gap-1">
              {(['all', 'screen', 'obs'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    'px-2.5 py-1 rounded text-[9px] font-mono-console uppercase tracking-wide transition-colors',
                    filter === f ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {f === 'all' ? 'All' : f === 'screen' ? 'Screen' : 'OBS'}
                </button>
              ))}
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <FolderOpen size={28} className="text-muted-foreground/20" />
              <p className="font-mono-console text-[10px] text-muted-foreground/50 text-center">
                {recordings.length === 0
                  ? 'No recordings yet. Start a screen recording or OBS record session.'
                  : 'No recordings in this category.'}
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {filtered.map(rec => (
                <div
                  key={rec.id}
                  className="flex items-center gap-3 p-2.5 rounded-lg border border-border bg-secondary/20 group hover:bg-secondary/40 transition-colors"
                >
                  {/* Thumbnail / icon */}
                  <div className="w-16 h-10 rounded overflow-hidden shrink-0 bg-secondary flex items-center justify-center relative">
                    {rec.thumbnail ? (
                      <img src={rec.thumbnail} alt={rec.name} className="w-full h-full object-cover" />
                    ) : (
                      <Film size={16} className="text-muted-foreground/30" />
                    )}
                    <span className={cn(
                      'absolute top-0.5 right-0.5 w-4 h-4 rounded flex items-center justify-center',
                      rec.type === 'screen' ? 'bg-purple-500/80' : 'bg-amber-500/80'
                    )}>
                      {rec.type === 'screen'
                        ? <Monitor size={8} className="text-white" />
                        : <Film size={8} className="text-white" />
                      }
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-mono-console text-[10px] text-foreground truncate">{rec.name}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="flex items-center gap-1 font-mono-console text-[9px] text-muted-foreground">
                        <Clock size={8} />
                        {formatDuration(rec.durationSeconds)}
                      </span>
                      <span className="flex items-center gap-1 font-mono-console text-[9px] text-muted-foreground">
                        <HardDrive size={8} />
                        {formatBytes(rec.sizeBytes)}
                      </span>
                      <span className="font-mono-console text-[9px] text-muted-foreground/50">
                        {new Date(rec.startedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleDownload(rec)}
                      title="Download"
                      className="w-7 h-7 rounded flex items-center justify-center text-muted-foreground hover:text-emerald-400 hover:bg-emerald-400/10 transition-colors"
                    >
                      <Download size={12} />
                    </button>
                    <button
                      onClick={() => handleDelete(rec)}
                      title="Delete"
                      className="w-7 h-7 rounded flex items-center justify-center text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
