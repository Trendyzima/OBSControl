import { useState, useRef, useEffect, useCallback } from 'react';
import { Music, Play, Pause, SkipForward, Plus, Trash2, Upload, Shuffle, List, Clock, Radio, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AutoDJState, MediaItem, Playlist, AutoDJMode } from '@/types/studio';
import { toast } from 'sonner';

interface AutoDJPanelProps {
  autoDJ: AutoDJState;
  playlists: Playlist[];
  onPlay: () => void;
  onPause: () => void;
  onSkip: () => void;
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
  music: '🎵',
  jingle: '🎙️',
  stationid: '📻',
  ad: '📢',
  video: '🎬',
};

const MODE_OPTIONS: { id: AutoDJMode; label: string; desc: string; icon: React.ElementType }[] = [
  { id: 'manual', label: 'Manual', desc: 'Producer controls playback', icon: List },
  { id: 'automatic', label: 'Auto', desc: 'Plays playlist automatically', icon: Play },
  { id: 'scheduled', label: 'Scheduled', desc: 'Follows rundown schedule', icon: Clock },
];

export default function AutoDJPanel({
  autoDJ, playlists, onPlay, onPause, onSkip, onSetMode, onSetPlaylist,
  onAddPlaylist, onRemovePlaylist, onAddMediaToPlaylist, onRemoveMediaFromPlaylist,
  onSetCrossfade, onSetAdInterval, onToggleAutoSwitchLive
}: AutoDJPanelProps) {
  const [tab, setTab] = useState<'control' | 'playlists' | 'settings'>('control');
  const [expandedPl, setExpandedPl] = useState<string | null>(null);
  const [addingPl, setAddingPl] = useState(false);
  const [newPlName, setNewPlName] = useState('');
  const [newPlMode, setNewPlMode] = useState<Playlist['mode']>('sequential');

  const currentPl = playlists.find(p => p.id === autoDJ.currentPlaylistId);

  function handleCreatePlaylist() {
    if (!newPlName.trim()) return;
    onAddPlaylist({ name: newPlName.trim(), items: [], mode: newPlMode, icon: '🎵' });
    setNewPlName('');
    setAddingPl(false);
    toast.success(`Playlist "${newPlName}" created`);
  }

  function handleUploadToPlaylist(playlistId: string, type: MediaItem['type'], e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const audio = document.createElement('audio');
    audio.src = url;
    const name = file.name.replace(/\.[^.]+$/, '');
    const parts = name.split(' - ');

    audio.onloadedmetadata = () => {
      onAddMediaToPlaylist(playlistId, {
        title: parts[1] || name,
        artist: parts[0] || undefined,
        url,
        type,
        duration: audio.duration || 0,
        dateAdded: Date.now(),
        usageCount: 0,
      });
      toast.success(`Added: ${name}`);
    };
    audio.onerror = () => {
      onAddMediaToPlaylist(playlistId, {
        title: name,
        url,
        type,
        duration: 0,
        dateAdded: Date.now(),
        usageCount: 0,
      });
      toast.success(`Added: ${name}`);
    };
    e.target.value = '';
  }

  const STATUS_COLOR = {
    idle: 'text-muted-foreground',
    playing: 'text-emerald-400',
    paused: 'text-amber-400',
    transitioning: 'text-blue-400',
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-mono-console text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
          <Radio size={11} /> AutoDJ
        </h3>
        <div className="flex items-center gap-1.5">
          <span className={cn('font-mono-console text-[9px] font-semibold', STATUS_COLOR[autoDJ.status])}>
            {autoDJ.status.toUpperCase()}
          </span>
        </div>
      </div>

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

      {/* ── CONTROL tab ─────────────────────────────────────────────── */}
      {tab === 'control' && (
        <div className="space-y-3">
          {/* Now playing */}
          <div className="p-3 rounded-xl border border-border bg-secondary/10 space-y-2">
            <p className="font-mono-console text-[8px] text-muted-foreground/50 uppercase tracking-wider">Now Playing</p>
            {autoDJ.currentItem ? (
              <div className="flex items-center gap-2">
                <span className="text-xl shrink-0">{TYPE_ICONS[autoDJ.currentItem.type]}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-mono-console text-sm font-bold text-foreground truncate">{autoDJ.currentItem.title}</p>
                  {autoDJ.currentItem.artist && (
                    <p className="font-mono-console text-[9px] text-muted-foreground truncate">{autoDJ.currentItem.artist}</p>
                  )}
                </div>
                <span className="font-mono-console text-[9px] text-muted-foreground shrink-0">{formatDur(autoDJ.currentItem.duration)}</span>
              </div>
            ) : (
              <p className="font-mono-console text-[10px] text-muted-foreground/40 text-center py-2">
                {autoDJ.enabled ? 'Select a playlist to start' : 'AutoDJ is off'}
              </p>
            )}

            {/* Up next */}
            {autoDJ.nextItem && (
              <div className="pt-2 border-t border-border/50">
                <p className="font-mono-console text-[8px] text-muted-foreground/50 uppercase mb-1">Up Next</p>
                <div className="flex items-center gap-2">
                  <span className="text-sm">{TYPE_ICONS[autoDJ.nextItem.type]}</span>
                  <p className="font-mono-console text-[10px] text-muted-foreground truncate flex-1">{autoDJ.nextItem.title}</p>
                  <span className="font-mono-console text-[9px] text-muted-foreground/50 shrink-0">{formatDur(autoDJ.nextItem.duration)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Playlist selector */}
          {playlists.length > 0 && (
            <div>
              <label className="font-mono-console text-[9px] text-muted-foreground uppercase block mb-1">Active Playlist</label>
              <select
                value={autoDJ.currentPlaylistId || ''}
                onChange={e => onSetPlaylist(e.target.value)}
                className="w-full bg-input border border-border rounded-xl px-3 py-2 font-mono-console text-xs text-foreground focus:outline-none focus:border-primary"
              >
                <option value="">— Select playlist —</option>
                {playlists.map(pl => (
                  <option key={pl.id} value={pl.id}>{pl.icon} {pl.name} ({pl.items.length} tracks)</option>
                ))}
              </select>
            </div>
          )}

          {/* Transport controls */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={autoDJ.status === 'playing' ? onPause : onPlay}
              disabled={!autoDJ.currentPlaylistId || playlists.find(p => p.id === autoDJ.currentPlaylistId)?.items.length === 0}
              className={cn(
                'col-span-2 flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-mono-console text-xs font-bold transition-all active:scale-[0.97] disabled:opacity-40',
                autoDJ.status === 'playing'
                  ? 'border-amber-500 bg-amber-500/15 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                  : 'border-emerald-500 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
              )}
            >
              {autoDJ.status === 'playing'
                ? <><Pause size={15} /> PAUSE</>
                : <><Play size={15} /> PLAY</>
              }
            </button>
            <button
              onClick={onSkip}
              disabled={autoDJ.status === 'idle'}
              className="flex items-center justify-center gap-1 py-3 rounded-xl border border-border bg-secondary/20 text-muted-foreground hover:text-foreground font-mono-console text-xs transition-colors disabled:opacity-40"
            >
              <SkipForward size={14} />
            </button>
          </div>

          {/* Mode */}
          <div>
            <label className="font-mono-console text-[9px] text-muted-foreground uppercase block mb-2">Playback Mode</label>
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
          </div>

          {/* Auto switch to live */}
          <button
            onClick={onToggleAutoSwitchLive}
            className={cn(
              'w-full flex items-center justify-between px-3 py-2.5 rounded-xl border font-mono-console text-xs transition-colors',
              autoDJ.autoSwitchToLive
                ? 'border-emerald-500/40 bg-emerald-500/8 text-emerald-400'
                : 'border-border bg-secondary/20 text-muted-foreground'
            )}
          >
            <span>Auto switch when host goes live</span>
            <span className={cn('text-[9px] px-2 py-0.5 rounded-full border',
              autoDJ.autoSwitchToLive ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-border bg-secondary')}>
              {autoDJ.autoSwitchToLive ? 'ON' : 'OFF'}
            </span>
          </button>

          {/* Ad counter */}
          <div className="flex items-center justify-between px-3 py-2 rounded-xl border border-amber-500/20 bg-amber-500/5">
            <span className="font-mono-console text-[9px] text-amber-400">Next ad in</span>
            <span className="font-mono-console text-sm font-bold text-amber-400 tabular-nums">
              {Math.max(0, autoDJ.songsUntilAd)} songs
            </span>
          </div>
        </div>
      )}

      {/* ── PLAYLISTS tab ────────────────────────────────────────────── */}
      {tab === 'playlists' && (
        <div className="space-y-2">
          {playlists.length === 0 && (
            <p className="font-mono-console text-[10px] text-muted-foreground/40 text-center py-3">
              No playlists yet — create one below
            </p>
          )}
          {playlists.map(pl => (
            <div key={pl.id} className="rounded-xl border border-border bg-secondary/10 overflow-hidden">
              {/* Playlist header */}
              <div className="flex items-center gap-2 p-2.5">
                <span className="text-base shrink-0">{pl.icon}</span>
                <button onClick={() => setExpandedPl(expandedPl === pl.id ? null : pl.id)} className="flex-1 text-left min-w-0">
                  <p className="font-mono-console text-xs font-semibold text-foreground truncate">{pl.name}</p>
                  <p className="font-mono-console text-[8px] text-muted-foreground">{pl.items.length} tracks · {pl.mode}</p>
                </button>
                <button
                  onClick={() => onSetPlaylist(pl.id)}
                  className={cn('px-2 py-1 rounded-lg border font-mono-console text-[9px] transition-colors shrink-0',
                    autoDJ.currentPlaylistId === pl.id
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:text-foreground')}
                >
                  {autoDJ.currentPlaylistId === pl.id ? 'Active' : 'Use'}
                </button>
                <button
                  onClick={() => setExpandedPl(expandedPl === pl.id ? null : pl.id)}
                  className="w-6 h-6 flex items-center justify-center text-muted-foreground shrink-0">
                  {expandedPl === pl.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
                <button onClick={() => onRemovePlaylist(pl.id)} className="w-6 h-6 flex items-center justify-center text-muted-foreground/40 hover:text-red-400 shrink-0">
                  <Trash2 size={10} />
                </button>
              </div>

              {/* Expanded tracks + upload */}
              {expandedPl === pl.id && (
                <div className="border-t border-border/50 p-2.5 space-y-1.5">
                  {/* Upload buttons */}
                  <div className="flex gap-1.5 flex-wrap">
                    {[
                      { accept: 'audio/*', type: 'music' as const, label: '🎵 Music' },
                      { accept: 'audio/*', type: 'jingle' as const, label: '🎙️ Jingle' },
                      { accept: 'audio/*', type: 'stationid' as const, label: '📻 ID' },
                      { accept: 'audio/*,video/*', type: 'ad' as const, label: '📢 Ad' },
                    ].map(btn => (
                      <label key={btn.type} className="flex items-center gap-1 px-2 py-1 rounded-lg border border-dashed border-border/60 hover:border-primary/40 text-muted-foreground hover:text-primary cursor-pointer transition-colors font-mono-console text-[9px]">
                        {btn.label}
                        <input type="file" accept={btn.accept} className="hidden" onChange={e => handleUploadToPlaylist(pl.id, btn.type, e)} multiple />
                      </label>
                    ))}
                  </div>

                  {/* Track list */}
                  <div className="max-h-40 overflow-y-auto space-y-1 no-scrollbar">
                    {pl.items.length === 0 && (
                      <p className="font-mono-console text-[9px] text-muted-foreground/40 text-center py-2">Upload tracks above</p>
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
                        <button onClick={() => onRemoveMediaFromPlaylist(pl.id, item.id)} className="w-5 h-5 flex items-center justify-center text-muted-foreground/30 hover:text-red-400 shrink-0">
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
              <input autoFocus type="text" placeholder="Playlist name..." value={newPlName} onChange={e => setNewPlName(e.target.value)}
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

      {/* ── SETTINGS tab ─────────────────────────────────────────────── */}
      {tab === 'settings' && (
        <div className="space-y-3">
          {/* Crossfade */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-mono-console text-[9px] text-muted-foreground uppercase">Crossfade Duration</label>
              <span className="font-mono-console text-[10px] text-foreground">{autoDJ.crossfadeDuration}s</span>
            </div>
            <input type="range" min={0} max={15} step={0.5} value={autoDJ.crossfadeDuration}
              onChange={e => onSetCrossfade(Number(e.target.value))}
              className="w-full accent-primary h-1" />
            <div className="flex justify-between mt-0.5">
              <span className="font-mono-console text-[8px] text-muted-foreground/40">No fade</span>
              <span className="font-mono-console text-[8px] text-muted-foreground/40">15s</span>
            </div>
          </div>

          {/* Ad interval */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-mono-console text-[9px] text-muted-foreground uppercase">Ad Every N Songs</label>
              <span className="font-mono-console text-[10px] text-foreground">{autoDJ.adInterval} songs</span>
            </div>
            <input type="range" min={1} max={20} step={1} value={autoDJ.adInterval}
              onChange={e => onSetAdInterval(Number(e.target.value))}
              className="w-full accent-amber-500 h-1" />
            <div className="flex justify-between mt-0.5">
              <span className="font-mono-console text-[8px] text-muted-foreground/40">Every song</span>
              <span className="font-mono-console text-[8px] text-muted-foreground/40">Every 20</span>
            </div>
          </div>

          {/* Grace period */}
          <div className="p-3 rounded-xl border border-border bg-secondary/10">
            <p className="font-mono-console text-[9px] text-muted-foreground/60 leading-relaxed">
              When AutoDJ is active and a host goes live, playback pauses. When the host leaves, AutoDJ resumes after {autoDJ.graceBeforeReturn}s.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
