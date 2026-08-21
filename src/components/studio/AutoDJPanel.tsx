import { useState, useRef } from 'react';
import { Music, Play, Pause, SkipForward, Plus, Trash2, Shuffle,
  List, Clock, Radio, ChevronDown, ChevronUp, AlertCircle, Square } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AutoDJState, MediaItem, Playlist, AutoDJMode } from '@/types/studio';
import { toast } from 'sonner';

interface AutoDJPanelProps {
  autoDJ: AutoDJState;
  playlists: Playlist[];
  onPlay: () => void;
  onPause: () => void;
  onSkip: () => void;
  onStop?: () => void;
  onSetMode: (mode: AutoDJMode) => void;
  onSetPlaylist: (id: string) => void;
  onAddPlaylist: (pl: Omit<Playlist, 'id'>) => void;
  onRemovePlaylist: (id: string) => void;
  onAddMediaToPlaylist: (playlistId: string, item: Omit<MediaItem, 'id'>) => void;
  onRemoveMediaFromPlaylist: (playlistId: string, itemId: string) => void;
  onSetCrossfade: (secs: number) => void;
  onSetAdInterval: (n: number) => void;
  onToggleAutoSwitchLive: () => void;
}

function formatDur(s: number) {
  if (!s || isNaN(s)) return '0:00';
  const m = Math.floor(s / 60), sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
}

const TYPE_ICONS: Record<MediaItem['type'], string> = {
  music: '🎵', jingle: '🎙️', stationid: '📻', ad: '📢', video: '🎬',
};

const MODE_OPTIONS: { id: AutoDJMode; label: string; icon: React.ElementType }[] = [
  { id: 'manual', label: 'Manual', icon: List },
  { id: 'automatic', label: 'Auto', icon: Play },
  { id: 'scheduled', label: 'Sched', icon: Clock },
];

export default function AutoDJPanel({
  autoDJ, playlists, onPlay, onPause, onSkip, onStop, onSetMode, onSetPlaylist,
  onAddPlaylist, onRemovePlaylist, onAddMediaToPlaylist, onRemoveMediaFromPlaylist,
  onSetCrossfade, onSetAdInterval, onToggleAutoSwitchLive
}: AutoDJPanelProps) {
  const [tab, setTab] = useState<'control' | 'playlists' | 'settings'>('control');
  const [expandedPl, setExpandedPl] = useState<string | null>(null);
  const [addingPl, setAddingPl] = useState(false);
  const [newPlName, setNewPlName] = useState('');
  const [newPlMode, setNewPlMode] = useState<Playlist['mode']>('sequential');
  const uploadInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const currentPl = playlists.find(p => p.id === autoDJ.currentPlaylistId);
  const totalTracks = currentPl?.items.length ?? 0;

  const STATUS_COLORS = {
    idle: 'text-muted-foreground/50',
    playing: 'text-emerald-400',
    paused: 'text-amber-400',
    transitioning: 'text-blue-400',
  };

  function handleCreatePlaylist() {
    if (!newPlName.trim()) return;
    onAddPlaylist({ name: newPlName.trim(), items: [], mode: newPlMode, icon: '🎵' });
    setNewPlName('');
    setAddingPl(false);
    toast.success(`Playlist "${newPlName}" created`);
  }

  function handleUploadToPlaylist(playlistId: string, type: MediaItem['type'], files: FileList | null) {
    if (!files) return;
    Array.from(files).forEach(file => {
      const url = URL.createObjectURL(file);
      const name = file.name.replace(/\.[^.]+$/, '');
      const parts = name.split(' - ');

      if (file.type.startsWith('audio/') || file.type.startsWith('video/')) {
        const el = file.type.startsWith('audio/')
          ? document.createElement('audio')
          : document.createElement('video');
        el.preload = 'metadata';
        el.onloadedmetadata = () => {
          onAddMediaToPlaylist(playlistId, {
            title: parts[1] || name,
            artist: parts[0] !== (parts[1] || name) ? parts[0] : undefined,
            url,
            type,
            duration: el.duration || 0,
            dateAdded: Date.now(),
            usageCount: 0,
          });
        };
        el.onerror = () => {
          onAddMediaToPlaylist(playlistId, {
            title: name, url, type, duration: 0, dateAdded: Date.now(), usageCount: 0,
          });
        };
        el.src = url;
      } else {
        onAddMediaToPlaylist(playlistId, {
          title: name, url, type, duration: 0, dateAdded: Date.now(), usageCount: 0,
        });
      }
    });
  }

  return (
    <div className="space-y-3">
      {/* Header with status */}
      <div className="flex items-center justify-between">
        <h3 className="font-mono-console text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
          <Radio size={11} /> AutoDJ
        </h3>
        <span className={cn('font-mono-console text-[9px] font-bold', STATUS_COLORS[autoDJ.status])}>
          ● {autoDJ.status.toUpperCase()}
        </span>
      </div>

      {/* No playlist warning */}
      {tab === 'control' && !autoDJ.currentPlaylistId && (
        <div className="flex items-start gap-2 p-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5">
          <AlertCircle size={11} className="text-amber-400 mt-0.5 shrink-0" />
          <p className="font-mono-console text-[9px] text-amber-400 leading-relaxed">
            Create a playlist in the Playlists tab, upload music tracks, then select it here to play.
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex rounded-xl overflow-hidden border border-border">
        {(['control', 'playlists', 'settings'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={cn('flex-1 py-2 font-mono-console text-[9px] uppercase tracking-wider transition-colors',
              tab === t ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground')}>
            {t}
          </button>
        ))}
      </div>

      {/* ── CONTROL ─────────────────────────────────────────── */}
      {tab === 'control' && (
        <div className="space-y-3">
          {/* Now playing card */}
          <div className={cn(
            'p-3 rounded-xl border space-y-2 transition-all',
            autoDJ.status === 'playing'
              ? 'border-purple-500/30 bg-purple-500/5 shadow-[0_0_12px_rgba(192,132,252,0.1)]'
              : 'border-border bg-secondary/10'
          )}>
            <p className="font-mono-console text-[8px] text-muted-foreground/50 uppercase tracking-wider">
              {autoDJ.status === 'playing' ? '♪ Now Playing' : 'Not Playing'}
            </p>
            {autoDJ.currentItem ? (
              <div className="flex items-center gap-2">
                <span className="text-2xl shrink-0">{TYPE_ICONS[autoDJ.currentItem.type]}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-mono-console text-sm font-bold text-foreground truncate">{autoDJ.currentItem.title}</p>
                  {autoDJ.currentItem.artist && (
                    <p className="font-mono-console text-[9px] text-muted-foreground">{autoDJ.currentItem.artist}</p>
                  )}
                  <p className="font-mono-console text-[8px] text-muted-foreground/50">{formatDur(autoDJ.currentItem.duration)}</p>
                </div>
              </div>
            ) : (
              <p className="font-mono-console text-[10px] text-muted-foreground/40 text-center py-1">
                {playlists.length === 0 ? 'No playlists yet' : autoDJ.currentPlaylistId ? 'Press PLAY to start' : 'Select a playlist below'}
              </p>
            )}

            {/* Up next */}
            {autoDJ.nextItem && (
              <div className="pt-1.5 border-t border-border/50">
                <p className="font-mono-console text-[7px] text-muted-foreground/40 uppercase mb-1">Up Next</p>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">{TYPE_ICONS[autoDJ.nextItem.type]}</span>
                  <p className="font-mono-console text-[9px] text-muted-foreground truncate flex-1">{autoDJ.nextItem.title}</p>
                  <span className="font-mono-console text-[8px] text-muted-foreground/50">{formatDur(autoDJ.nextItem.duration)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Playlist selector */}
          {playlists.length > 0 ? (
            <div>
              <label className="font-mono-console text-[9px] text-muted-foreground uppercase block mb-1">Active Playlist</label>
              <select
                value={autoDJ.currentPlaylistId || ''}
                onChange={e => onSetPlaylist(e.target.value)}
                className="w-full bg-input border border-border rounded-xl px-3 py-2.5 font-mono-console text-xs text-foreground focus:outline-none focus:border-primary"
              >
                <option value="">— Select playlist —</option>
                {playlists.map(pl => (
                  <option key={pl.id} value={pl.id}>
                    {pl.icon} {pl.name} ({pl.items.length} tracks)
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <button onClick={() => setTab('playlists')}
              className="w-full py-2.5 rounded-xl border border-dashed border-purple-500/30 text-purple-400 font-mono-console text-xs hover:bg-purple-500/5 transition-colors">
              + Create your first playlist
            </button>
          )}

          {/* Transport */}
          <div className="grid grid-cols-4 gap-1.5">
            <button
              onClick={autoDJ.status === 'playing' ? onPause : onPlay}
              disabled={!autoDJ.currentPlaylistId}
              className={cn(
                'col-span-2 flex items-center justify-center gap-2 py-3.5 rounded-xl border-2 font-mono-console text-sm font-bold transition-all active:scale-[0.97] disabled:opacity-40',
                autoDJ.status === 'playing'
                  ? 'border-amber-500 bg-amber-500/15 text-amber-400'
                  : 'border-emerald-500 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
              )}
            >
              {autoDJ.status === 'playing' ? <><Pause size={16} /> PAUSE</> : <><Play size={16} /> PLAY</>}
            </button>
            <button onClick={onSkip} disabled={autoDJ.status === 'idle'}
              className="flex items-center justify-center py-3.5 rounded-xl border border-border bg-secondary/20 text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors">
              <SkipForward size={15} />
            </button>
            {onStop && (
              <button onClick={onStop} disabled={autoDJ.status === 'idle'}
                className="flex items-center justify-center py-3.5 rounded-xl border border-border bg-secondary/20 text-muted-foreground hover:text-red-400 disabled:opacity-40 transition-colors">
                <Square size={14} />
              </button>
            )}
          </div>

          {/* Mode */}
          <div className="grid grid-cols-3 gap-1.5">
            {MODE_OPTIONS.map(m => {
              const Icon = m.icon;
              return (
                <button key={m.id} onClick={() => onSetMode(m.id)}
                  className={cn('flex flex-col items-center gap-1 py-2.5 rounded-xl border font-mono-console text-[9px] transition-colors',
                    autoDJ.mode === m.id
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:text-foreground')}>
                  <Icon size={12} />
                  {m.label}
                </button>
              );
            })}
          </div>

          {/* Auto switch */}
          <button onClick={onToggleAutoSwitchLive}
            className={cn(
              'w-full flex items-center justify-between px-3 py-2.5 rounded-xl border font-mono-console text-xs transition-colors',
              autoDJ.autoSwitchToLive
                ? 'border-emerald-500/40 bg-emerald-500/8 text-emerald-400'
                : 'border-border bg-secondary/20 text-muted-foreground'
            )}>
            <span>Pause when host goes live</span>
            <span className={cn('text-[9px] px-2 py-0.5 rounded-full border',
              autoDJ.autoSwitchToLive ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-border bg-secondary')}>
              {autoDJ.autoSwitchToLive ? 'ON' : 'OFF'}
            </span>
          </button>

          {/* Ad counter */}
          {totalTracks > 0 && (
            <div className="flex items-center justify-between px-3 py-2 rounded-xl border border-amber-500/20 bg-amber-500/5">
              <span className="font-mono-console text-[9px] text-amber-400">📢 Next ad in</span>
              <span className="font-mono-console text-sm font-bold text-amber-400 tabular-nums">
                {Math.max(0, autoDJ.songsUntilAd)} songs
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── PLAYLISTS ────────────────────────────────────────── */}
      {tab === 'playlists' && (
        <div className="space-y-2">
          {playlists.length === 0 && (
            <div className="text-center py-4 space-y-1">
              <Music size={24} className="mx-auto text-muted-foreground/20" />
              <p className="font-mono-console text-[10px] text-muted-foreground/40">
                No playlists yet. Create one and upload audio files.
              </p>
            </div>
          )}

          {playlists.map(pl => (
            <div key={pl.id} className="rounded-xl border border-border bg-secondary/10 overflow-hidden">
              <div className="flex items-center gap-2 p-2.5">
                <span className="text-lg shrink-0">{pl.icon}</span>
                <button onClick={() => setExpandedPl(expandedPl === pl.id ? null : pl.id)} className="flex-1 text-left min-w-0">
                  <p className="font-mono-console text-xs font-semibold text-foreground truncate">{pl.name}</p>
                  <p className="font-mono-console text-[8px] text-muted-foreground">{pl.items.length} tracks · {pl.mode}</p>
                </button>
                <button onClick={() => onSetPlaylist(pl.id)}
                  className={cn('px-2 py-1 rounded-lg border font-mono-console text-[9px] transition-colors shrink-0',
                    autoDJ.currentPlaylistId === pl.id
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:text-foreground')}>
                  {autoDJ.currentPlaylistId === pl.id ? '✓ Active' : 'Use'}
                </button>
                <button onClick={() => setExpandedPl(expandedPl === pl.id ? null : pl.id)}
                  className="w-6 h-6 flex items-center justify-center text-muted-foreground shrink-0">
                  {expandedPl === pl.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
                <button onClick={() => onRemovePlaylist(pl.id)}
                  className="w-6 h-6 flex items-center justify-center text-muted-foreground/40 hover:text-red-400 shrink-0">
                  <Trash2 size={10} />
                </button>
              </div>

              {expandedPl === pl.id && (
                <div className="border-t border-border/50 p-2.5 space-y-2">
                  {/* Upload buttons */}
                  <p className="font-mono-console text-[8px] text-muted-foreground/50 uppercase tracking-wider">Upload Tracks</p>
                  <div className="flex gap-1 flex-wrap">
                    {[
                      { accept: 'audio/*', type: 'music' as const, label: '🎵 Music' },
                      { accept: 'audio/*', type: 'jingle' as const, label: '🎙️ Jingle' },
                      { accept: 'audio/*', type: 'stationid' as const, label: '📻 Station ID' },
                      { accept: 'audio/*,video/*', type: 'ad' as const, label: '📢 Ad' },
                    ].map(btn => (
                      <label key={btn.type}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-dashed border-border/60 hover:border-primary/40 text-muted-foreground hover:text-primary cursor-pointer transition-colors font-mono-console text-[9px]">
                        {btn.label}
                        <input
                          type="file"
                          accept={btn.accept}
                          className="hidden"
                          multiple
                          onChange={e => handleUploadToPlaylist(pl.id, btn.type, e.target.files)}
                        />
                      </label>
                    ))}
                  </div>

                  {/* Shuffle toggle */}
                  <div className="flex gap-1">
                    {(['sequential', 'shuffle'] as const).map(m => (
                      <button key={m} onClick={() => {/* mode change via parent would need update */}}
                        className={cn('flex items-center gap-1 px-2 py-1 rounded-lg border font-mono-console text-[8px] transition-colors',
                          pl.mode === m ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground')}>
                        {m === 'shuffle' ? <Shuffle size={9} /> : <List size={9} />}
                        {m}
                      </button>
                    ))}
                  </div>

                  {/* Track list */}
                  <div className="max-h-48 overflow-y-auto space-y-1 no-scrollbar">
                    {pl.items.length === 0 && (
                      <p className="font-mono-console text-[9px] text-muted-foreground/40 text-center py-3">
                        Upload audio files above to add tracks
                      </p>
                    )}
                    {pl.items.map((item, idx) => (
                      <div key={item.id} className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-secondary/20">
                        <span className="font-mono-console text-[8px] text-muted-foreground/40 w-4 shrink-0 tabular-nums">{idx + 1}</span>
                        <span className="text-sm shrink-0">{TYPE_ICONS[item.type]}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-mono-console text-[10px] text-foreground truncate">{item.title}</p>
                          {item.artist && <p className="font-mono-console text-[8px] text-muted-foreground/60 truncate">{item.artist}</p>}
                        </div>
                        <span className="font-mono-console text-[8px] text-muted-foreground/50 shrink-0">{formatDur(item.duration)}</span>
                        <button onClick={() => onRemoveMediaFromPlaylist(pl.id, item.id)}
                          className="w-5 h-5 flex items-center justify-center text-muted-foreground/30 hover:text-red-400 shrink-0">
                          <Trash2 size={9} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Add playlist */}
          {addingPl ? (
            <div className="p-3 rounded-xl border border-primary/30 bg-primary/5 space-y-2">
              <input autoFocus type="text" placeholder="Playlist name..." value={newPlName}
                onChange={e => setNewPlName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreatePlaylist()}
                className="w-full bg-input border border-border rounded-lg px-3 py-2 font-mono-console text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary" />
              <div className="flex gap-1">
                {(['sequential', 'shuffle', 'smart'] as const).map(m => (
                  <button key={m} onClick={() => setNewPlMode(m)}
                    className={cn('flex-1 py-1.5 rounded-lg border font-mono-console text-[9px] capitalize transition-colors',
                      newPlMode === m ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground')}>
                    {m}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setAddingPl(false)} className="flex-1 py-1.5 rounded-lg border border-border font-mono-console text-xs text-muted-foreground">Cancel</button>
                <button onClick={handleCreatePlaylist} disabled={!newPlName.trim()} className="flex-1 py-1.5 rounded-lg bg-primary text-white font-mono-console text-xs font-semibold disabled:opacity-40">Create</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setAddingPl(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/40 font-mono-console text-xs transition-colors">
              <Plus size={13} /> New Playlist
            </button>
          )}
        </div>
      )}

      {/* ── SETTINGS ─────────────────────────────────────────── */}
      {tab === 'settings' && (
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-mono-console text-[9px] text-muted-foreground uppercase">Crossfade</label>
              <span className="font-mono-console text-[10px] text-foreground">{autoDJ.crossfadeDuration}s</span>
            </div>
            <input type="range" min={0} max={15} step={0.5} value={autoDJ.crossfadeDuration}
              onChange={e => onSetCrossfade(Number(e.target.value))}
              className="w-full accent-primary h-1" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-mono-console text-[9px] text-muted-foreground uppercase">Ad Every N Songs</label>
              <span className="font-mono-console text-[10px] text-foreground">{autoDJ.adInterval}</span>
            </div>
            <input type="range" min={1} max={20} value={autoDJ.adInterval}
              onChange={e => onSetAdInterval(Number(e.target.value))}
              className="w-full accent-amber-500 h-1" />
          </div>

          <div className="p-3 rounded-xl border border-border bg-secondary/10 space-y-1.5">
            <p className="font-mono-console text-[9px] text-muted-foreground font-semibold">How AutoDJ works:</p>
            <ul className="space-y-0.5">
              {[
                '1. Create a playlist in the Playlists tab',
                '2. Upload audio files (music, jingles, ads)',
                '3. Select the playlist in Control tab',
                '4. Press PLAY — audio plays through speakers',
                '5. AutoDJ watermark appears on canvas',
              ].map(step => (
                <li key={step} className="font-mono-console text-[8px] text-muted-foreground/60">{step}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
