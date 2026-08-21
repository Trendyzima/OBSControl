import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Cloud, Upload, Trash2, Play, Pause, Music, Video, Image, Film,
  Search, RefreshCw, LogIn, X, Check, Folder, Star, Download,
  BarChart2, Tag, Clock, Eye, ChevronDown, ChevronUp, Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCloudStorage, CloudMediaItem } from '@/hooks/useCloudStorage';
import { UserProfile } from '@/lib/supabase';
import { toast } from 'sonner';

interface CloudMediaLibraryProps {
  user: UserProfile | null;
  onLoadToScene: (url: string, type: 'video' | 'image' | 'audio', name: string) => void;
  onSignIn: () => void;
  onAddToPlaylist?: (url: string, title: string, type: 'music' | 'video' | 'ad') => void;
}

type FilterType = 'all' | 'video' | 'audio' | 'image' | 'recording';
type SortBy = 'recent' | 'name' | 'size' | 'usage';

const TYPE_ICONS: Record<string, React.ElementType> = {
  video: Video,
  audio: Music,
  image: Image,
  recording: Film,
};

const TYPE_COLORS: Record<string, string> = {
  video: 'text-blue-400 bg-blue-500/10',
  audio: 'text-purple-400 bg-purple-500/10',
  image: 'text-emerald-400 bg-emerald-500/10',
  recording: 'text-amber-400 bg-amber-500/10',
};

function formatSize(bytes: number): string {
  if (!bytes) return '0B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + 'KB';
  if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + 'MB';
  return (bytes / 1073741824).toFixed(2) + 'GB';
}

function formatDur(s: number): string {
  if (!s || isNaN(s)) return '';
  const m = Math.floor(s / 60), sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function CloudMediaLibrary({ user, onLoadToScene, onSignIn, onAddToPlaylist }: CloudMediaLibraryProps) {
  const {
    items, loading, uploading, uploadProgress,
    fetchMedia, uploadMedia, deleteMedia, wipeAllMedia, getSignedUrl
  } = useCloudStorage(user?.id ?? null);

  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('recent');
  const [confirmWipe, setConfirmWipe] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showStats, setShowStats] = useState(false);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragOverRef = useRef(false);

  useEffect(() => {
    if (user) fetchMedia();
  }, [user, fetchMedia]);

  // Stop preview when unmounting
  useEffect(() => {
    return () => { audioPreviewRef.current?.pause(); };
  }, []);

  const filtered = items
    .filter(item => {
      if (filter !== 'all' && item.type !== filter) return false;
      if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'size') return b.size - a.size;
      if (sortBy === 'usage') return (b.usage_count || 0) - (a.usage_count || 0);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  // Storage stats
  const totalSize = items.reduce((s, i) => s + (i.size || 0), 0);
  const byType = {
    video: items.filter(i => i.type === 'video').reduce((s, i) => s + (i.size || 0), 0),
    audio: items.filter(i => i.type === 'audio').reduce((s, i) => s + (i.size || 0), 0),
    image: items.filter(i => i.type === 'image').reduce((s, i) => s + (i.size || 0), 0),
    recording: items.filter(i => i.type === 'recording').reduce((s, i) => s + (i.size || 0), 0),
  };

  async function getOrFetchSignedUrl(item: CloudMediaItem): Promise<string | null> {
    if (signedUrls[item.id]) return signedUrls[item.id];
    const bucket = item.type === 'recording' ? 'studio-recordings' : 'studio-media';
    const url = await getSignedUrl(item.storage_path, bucket);
    if (url) setSignedUrls(prev => ({ ...prev, [item.id]: url }));
    return url;
  }

  async function handleLoad(item: CloudMediaItem) {
    const url = await getOrFetchSignedUrl(item);
    if (!url) { toast.error('Could not load file — try refreshing'); return; }
    const loadType = (item.type === 'recording' ? 'video' : item.type) as 'video' | 'image' | 'audio';
    onLoadToScene(url, loadType, item.name);
    toast.success(`Loaded: ${item.name}`);
  }

  async function handleAudioPreview(item: CloudMediaItem) {
    if (playingId === item.id) {
      audioPreviewRef.current?.pause();
      setPlayingId(null);
      return;
    }
    const url = await getOrFetchSignedUrl(item);
    if (!url) return;
    if (!audioPreviewRef.current) audioPreviewRef.current = new Audio();
    audioPreviewRef.current.pause();
    audioPreviewRef.current.src = url;
    audioPreviewRef.current.play().catch(() => toast.error('Cannot preview — check browser permissions'));
    audioPreviewRef.current.onended = () => setPlayingId(null);
    setPlayingId(item.id);
  }

  async function handleAddToPlaylist(item: CloudMediaItem) {
    if (!onAddToPlaylist) return;
    const url = await getOrFetchSignedUrl(item);
    if (!url) return;
    const type = item.type === 'audio' ? 'music' : item.type === 'video' ? 'video' : 'ad';
    onAddToPlaylist(url, item.name, type as 'music' | 'video' | 'ad');
    toast.success(`Added to AutoDJ: ${item.name}`);
  }

  async function handleDownload(item: CloudMediaItem) {
    const url = await getOrFetchSignedUrl(item);
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = item.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    for (const file of files) {
      const type: 'video' | 'audio' | 'image' =
        file.type.startsWith('video/') ? 'video' :
        file.type.startsWith('audio/') ? 'audio' : 'image';
      await uploadMedia(file, type, type);
    }
    e.target.value = '';
  }

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    dragOverRef.current = false;
    if (!user) { onSignIn(); return; }
    const files = Array.from(e.dataTransfer.files);
    for (const file of files) {
      const type: 'video' | 'audio' | 'image' =
        file.type.startsWith('video/') ? 'video' :
        file.type.startsWith('audio/') ? 'audio' : 'image';
      await uploadMedia(file, type, type);
    }
  }, [user, uploadMedia, onSignIn]);

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function deleteSelected() {
    const toDelete = items.filter(i => selectedIds.has(i.id));
    for (const item of toDelete) await deleteMedia(item);
    setSelectedIds(new Set());
  }

  if (!user) {
    return (
      <div className="space-y-3">
        <h3 className="font-mono-console text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
          <Cloud size={11} /> Cloud Media Library
        </h3>
        <div className="p-5 rounded-2xl border border-border bg-secondary/10 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
            <Cloud size={24} className="text-primary" />
          </div>
          <div>
            <p className="font-mono-console text-sm font-bold text-foreground">Cloud Media Storage</p>
            <p className="font-mono-console text-[10px] text-muted-foreground mt-1.5 leading-relaxed">
              Store unlimited videos, music, photos and recordings. Access from any device. Auto-upload recordings after broadcast.
            </p>
          </div>
          {/* Feature list */}
          <div className="grid grid-cols-2 gap-1.5 text-left">
            {[
              '📁 500MB per file',
              '🎵 AutoDJ integration',
              '🔄 Auto-upload recordings',
              '📱 Access anywhere',
              '🗑️ One-click wipe',
              '🔍 Search & filter',
            ].map(f => (
              <div key={f} className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-secondary/20">
                <span className="font-mono-console text-[9px] text-muted-foreground">{f}</span>
              </div>
            ))}
          </div>
          <button onClick={onSignIn}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-mono-console text-sm font-bold transition-all active:scale-[0.98]">
            <LogIn size={15} /> Sign In / Create Account
          </button>
          <p className="font-mono-console text-[9px] text-muted-foreground/50">
            Free · No credit card · Local mode still works without login
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-mono-console text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
          <Cloud size={11} /> Cloud Library
          <span className="text-foreground/60">({items.length})</span>
        </h3>
        <div className="flex items-center gap-1.5">
          <button onClick={() => setShowStats(v => !v)} title="Storage stats"
            className="w-6 h-6 flex items-center justify-center rounded border border-border text-muted-foreground hover:text-foreground transition-colors">
            <BarChart2 size={10} />
          </button>
          <button onClick={fetchMedia} disabled={loading}
            className={cn('w-6 h-6 flex items-center justify-center rounded border border-border text-muted-foreground hover:text-foreground transition-colors', loading && 'animate-spin')}>
            <RefreshCw size={10} />
          </button>
        </div>
      </div>

      {/* User info + wipe */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-secondary/20">
        <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
          <span className="font-mono-console text-[10px] text-primary font-bold">
            {(user.username || user.email)[0].toUpperCase()}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-mono-console text-[10px] text-foreground truncate">{user.username || user.email}</p>
          <p className="font-mono-console text-[8px] text-muted-foreground">{formatSize(totalSize)} used</p>
        </div>
        {!confirmWipe ? (
          <button onClick={() => setConfirmWipe(true)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg border border-red-500/30 text-red-400 font-mono-console text-[8px] hover:bg-red-500/10 transition-colors shrink-0">
            <Trash2 size={9} /> Wipe All
          </button>
        ) : (
          <div className="flex gap-1 shrink-0">
            <button onClick={() => { wipeAllMedia(); setConfirmWipe(false); setSignedUrls({}); }}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-600 text-white font-mono-console text-[8px]">
              <Check size={9} /> Confirm
            </button>
            <button onClick={() => setConfirmWipe(false)}
              className="w-6 h-6 flex items-center justify-center rounded border border-border text-muted-foreground font-mono-console text-[8px]">
              <X size={9} />
            </button>
          </div>
        )}
      </div>

      {/* Storage stats */}
      {showStats && (
        <div className="p-3 rounded-xl border border-border bg-secondary/10 space-y-2">
          <p className="font-mono-console text-[9px] text-muted-foreground uppercase tracking-wider">Storage Breakdown</p>
          {Object.entries(byType).map(([type, size]) => (
            <div key={type} className="flex items-center gap-2">
              <span className="font-mono-console text-[8px] text-muted-foreground w-16 capitalize">{type}</span>
              <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: totalSize > 0 ? `${(size / totalSize) * 100}%` : '0%' }} />
              </div>
              <span className="font-mono-console text-[8px] text-muted-foreground w-12 text-right">{formatSize(size)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Upload area — drag & drop */}
      <label
        className={cn(
          'flex flex-col items-center justify-center gap-2 py-4 rounded-xl border-2 border-dashed cursor-pointer transition-all',
          uploading ? 'border-primary/40 bg-primary/5' : 'border-border/50 hover:border-primary/40 hover:bg-primary/5'
        )}
        onDragOver={e => { e.preventDefault(); dragOverRef.current = true; }}
        onDrop={handleDrop}
      >
        {uploading ? (
          <div className="w-full px-4 space-y-1.5">
            <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
            </div>
            <p className="font-mono-console text-[9px] text-primary text-center">Uploading {uploadProgress}%</p>
          </div>
        ) : (
          <>
            <Upload size={18} className="text-muted-foreground" />
            <div className="text-center">
              <p className="font-mono-console text-[10px] text-muted-foreground">Click to upload or drag & drop</p>
              <p className="font-mono-console text-[8px] text-muted-foreground/50 mt-0.5">Video, audio, images · Max 500MB</p>
            </div>
          </>
        )}
        <input ref={fileInputRef} type="file" accept="video/*,audio/*,image/*" multiple className="hidden" onChange={handleFileUpload} disabled={uploading} />
      </label>

      {/* Bulk actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-amber-500/20 bg-amber-500/5">
          <span className="font-mono-console text-[9px] text-amber-400 flex-1">{selectedIds.size} selected</span>
          <button onClick={deleteSelected}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-600 text-white font-mono-console text-[8px]">
            <Trash2 size={9} /> Delete
          </button>
          <button onClick={() => setSelectedIds(new Set())}
            className="w-6 h-6 flex items-center justify-center rounded border border-border text-muted-foreground">
            <X size={9} />
          </button>
        </div>
      )}

      {/* Filter + search + sort */}
      <div className="space-y-2">
        <div className="flex gap-1 overflow-x-auto no-scrollbar">
          {(['all', 'video', 'audio', 'image', 'recording'] as FilterType[]).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={cn('flex-shrink-0 px-2.5 py-1 rounded-lg border font-mono-console text-[9px] uppercase tracking-wide transition-colors',
                filter === f ? 'border-primary bg-primary/15 text-primary' : 'border-border text-muted-foreground hover:text-foreground')}>
              {f}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={10} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search files..."
              className="w-full bg-input border border-border rounded-lg pl-8 pr-3 py-2 font-mono-console text-[10px] text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary" />
          </div>
          <select value={sortBy} onChange={e => setSortBy(e.target.value as SortBy)}
            className="bg-input border border-border rounded-lg px-2 py-2 font-mono-console text-[9px] text-foreground focus:outline-none">
            <option value="recent">Recent</option>
            <option value="name">Name</option>
            <option value="size">Size</option>
            <option value="usage">Used</option>
          </select>
        </div>
      </div>

      {/* Media list */}
      {loading ? (
        <div className="text-center py-6">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-2" />
          <p className="font-mono-console text-[10px] text-muted-foreground/40">Loading media...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-8 space-y-2">
          <Folder size={28} className="mx-auto text-muted-foreground/20" />
          <p className="font-mono-console text-[10px] text-muted-foreground/40">
            {items.length === 0 ? 'No media yet — upload files above' : 'No results for your search'}
          </p>
        </div>
      ) : (
        <div className="space-y-1.5 max-h-80 overflow-y-auto no-scrollbar">
          {filtered.map(item => {
            const Icon = TYPE_ICONS[item.type] || Film;
            const colorClass = TYPE_COLORS[item.type] || 'text-muted-foreground bg-secondary';
            const isPlaying = playingId === item.id;
            const isSelected = selectedIds.has(item.id);
            const isExpanded = expandedId === item.id;
            const isAudioType = item.type === 'audio' || item.type === 'recording';

            return (
              <div key={item.id} className={cn(
                'rounded-xl border transition-colors overflow-hidden',
                isSelected ? 'border-primary/50 bg-primary/5' : 'border-border/50 bg-secondary/10 hover:bg-secondary/20'
              )}>
                <div className="flex items-center gap-2.5 p-2">
                  {/* Checkbox */}
                  <button
                    onClick={() => toggleSelect(item.id)}
                    className={cn('w-4 h-4 rounded border shrink-0 flex items-center justify-center transition-colors',
                      isSelected ? 'border-primary bg-primary' : 'border-border')}
                  >
                    {isSelected && <Check size={9} className="text-white" />}
                  </button>

                  {/* Type icon / thumbnail */}
                  <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', colorClass)}>
                    {item.thumbnail_url ? (
                      <img src={item.thumbnail_url} className="w-full h-full rounded-lg object-cover" alt="" />
                    ) : (
                      <Icon size={14} />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-mono-console text-[10px] font-semibold text-foreground truncate">{item.name}</p>
                    <p className="font-mono-console text-[8px] text-muted-foreground/60">
                      {formatSize(item.size)}
                      {item.duration > 0 && ` · ${formatDur(item.duration)}`}
                      {` · ${formatDate(item.created_at)}`}
                      {item.usage_count > 0 && ` · ${item.usage_count}× used`}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {isAudioType && (
                      <button onClick={() => handleAudioPreview(item)} title="Preview"
                        className={cn('w-6 h-6 flex items-center justify-center rounded border transition-colors',
                          isPlaying ? 'border-purple-500/40 bg-purple-500/10 text-purple-400' : 'border-border text-muted-foreground hover:text-purple-400')}>
                        {isPlaying ? <Pause size={9} /> : <Play size={9} />}
                      </button>
                    )}
                    {onAddToPlaylist && (item.type === 'audio' || item.type === 'video') && (
                      <button onClick={() => handleAddToPlaylist(item)} title="Add to AutoDJ playlist"
                        className="w-6 h-6 flex items-center justify-center rounded border border-border text-muted-foreground hover:text-purple-400 hover:border-purple-500/40 transition-colors">
                        <Plus size={9} />
                      </button>
                    )}
                    <button onClick={() => handleLoad(item)} title="Load to scene"
                      className="w-6 h-6 flex items-center justify-center rounded border border-border text-muted-foreground hover:text-emerald-400 hover:border-emerald-500/40 transition-colors">
                      <Eye size={9} />
                    </button>
                    <button onClick={() => setExpandedId(isExpanded ? null : item.id)}
                      className="w-6 h-6 flex items-center justify-center rounded border border-border text-muted-foreground hover:text-foreground transition-colors">
                      {isExpanded ? <ChevronUp size={9} /> : <ChevronDown size={9} />}
                    </button>
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="border-t border-border/50 px-3 py-2 space-y-2 bg-secondary/10">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                      <div className="flex items-center gap-1">
                        <Tag size={8} className="text-muted-foreground/50" />
                        <span className="font-mono-console text-[8px] text-muted-foreground capitalize">{item.category || 'general'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock size={8} className="text-muted-foreground/50" />
                        <span className="font-mono-console text-[8px] text-muted-foreground">{formatDate(item.created_at)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star size={8} className="text-muted-foreground/50" />
                        <span className="font-mono-console text-[8px] text-muted-foreground">{item.usage_count || 0} times used</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Folder size={8} className="text-muted-foreground/50" />
                        <span className="font-mono-console text-[8px] text-muted-foreground truncate">{item.type}</span>
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={() => handleDownload(item)}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground font-mono-console text-[9px] transition-colors">
                        <Download size={10} /> Download
                      </button>
                      <button onClick={() => handleLoad(item)}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 font-mono-console text-[9px] transition-colors">
                        <Eye size={10} /> Load to Scene
                      </button>
                      <button onClick={() => deleteMedia(item)}
                        className="flex items-center justify-center px-2 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 font-mono-console text-[9px] transition-colors">
                        <Trash2 size={10} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {items.length > 0 && (
        <p className="font-mono-console text-[8px] text-muted-foreground/30 text-center">
          {filtered.length} of {items.length} files · {formatSize(totalSize)} total
        </p>
      )}
    </div>
  );
}
