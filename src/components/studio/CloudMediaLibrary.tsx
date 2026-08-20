import { useState, useEffect, useRef } from 'react';
import {
  Cloud, Upload, Trash2, Play, Music, Video, Image, Mic,
  Search, RefreshCw, AlertTriangle, LogIn, Film, X, Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCloudStorage, CloudMediaItem } from '@/hooks/useCloudStorage';
import { UserProfile } from '@/lib/supabase';
import { toast } from 'sonner';

interface CloudMediaLibraryProps {
  user: UserProfile | null;
  onLoadToScene: (url: string, type: 'video' | 'image' | 'audio', name: string) => void;
  onSignIn: () => void;
}

type FilterType = 'all' | 'video' | 'audio' | 'image' | 'recording';

const TYPE_ICONS: Record<string, React.ElementType> = {
  video: Video,
  audio: Music,
  image: Image,
  recording: Film,
};

const TYPE_COLORS: Record<string, string> = {
  video: 'text-blue-400',
  audio: 'text-purple-400',
  image: 'text-emerald-400',
  recording: 'text-amber-400',
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + 'B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + 'KB';
  if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + 'MB';
  return (bytes / 1073741824).toFixed(2) + 'GB';
}

function formatDur(s: number): string {
  if (!s) return '';
  const m = Math.floor(s / 60), sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
}

export default function CloudMediaLibrary({ user, onLoadToScene, onSignIn }: CloudMediaLibraryProps) {
  const { items, loading, uploading, uploadProgress, fetchMedia, uploadMedia, deleteMedia, wipeAllMedia, getSignedUrl } = useCloudStorage(user?.id ?? null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');
  const [confirmWipe, setConfirmWipe] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) fetchMedia();
  }, [user, fetchMedia]);

  const filtered = items.filter(item => {
    if (filter !== 'all' && item.type !== filter) return false;
    if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    for (const file of files) {
      const type: 'video' | 'audio' | 'image' =
        file.type.startsWith('video/') ? 'video' :
        file.type.startsWith('audio/') ? 'audio' : 'image';
      await uploadMedia(file, type);
    }
    e.target.value = '';
  }

  async function getOrFetchSignedUrl(item: CloudMediaItem): Promise<string | null> {
    if (signedUrls[item.id]) return signedUrls[item.id];
    const bucket = item.type === 'recording' ? 'studio-recordings' : 'studio-media';
    const url = await getSignedUrl(item.storage_path, bucket);
    if (url) setSignedUrls(prev => ({ ...prev, [item.id]: url }));
    return url;
  }

  async function handleLoad(item: CloudMediaItem) {
    const url = await getOrFetchSignedUrl(item);
    if (!url) { toast.error('Could not load file'); return; }
    const loadType = item.type === 'recording' ? 'video' : item.type as 'video' | 'image' | 'audio';
    onLoadToScene(url, loadType, item.name);
    toast.success(`Loaded: ${item.name}`);
  }

  async function handlePlay(item: CloudMediaItem) {
    const url = await getOrFetchSignedUrl(item);
    if (!url) return;
    if (playingId === item.id) { setPlayingId(null); return; }
    setPlayingId(item.id);
  }

  if (!user) {
    return (
      <div className="space-y-3">
        <h3 className="font-mono-console text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
          <Cloud size={11} /> Cloud Media
        </h3>
        <div className="p-5 rounded-2xl border border-border bg-secondary/10 text-center space-y-3">
          <Cloud size={32} className="mx-auto text-muted-foreground/30" />
          <div>
            <p className="font-mono-console text-sm font-semibold text-foreground">Sign in for Cloud Storage</p>
            <p className="font-mono-console text-[10px] text-muted-foreground mt-1 leading-relaxed">
              Upload unlimited videos, music, photos and recordings to the cloud. Access them from any device.
            </p>
          </div>
          <button onClick={onSignIn}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-mono-console text-sm font-bold transition-all active:scale-[0.98]">
            <LogIn size={15} /> Sign In / Create Account
          </button>
          <p className="font-mono-console text-[9px] text-muted-foreground/50">
            Free account · No credit card · Local-only mode still works without login
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-mono-console text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
          <Cloud size={11} /> Cloud Media
        </h3>
        <div className="flex items-center gap-1.5">
          <span className="font-mono-console text-[9px] text-muted-foreground">{items.length} files</span>
          <button onClick={fetchMedia} disabled={loading}
            className={cn('w-6 h-6 flex items-center justify-center rounded border border-border text-muted-foreground hover:text-foreground transition-colors', loading && 'animate-spin')}>
            <RefreshCw size={10} />
          </button>
        </div>
      </div>

      {/* User info + wipe */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-secondary/20">
        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
          <span className="font-mono-console text-[9px] text-primary font-bold">{(user.username || user.email)[0].toUpperCase()}</span>
        </div>
        <span className="font-mono-console text-[10px] text-foreground flex-1 truncate">{user.username || user.email}</span>
        {!confirmWipe ? (
          <button onClick={() => setConfirmWipe(true)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg border border-red-500/30 text-red-400 font-mono-console text-[8px] hover:bg-red-500/10 transition-colors shrink-0">
            <Trash2 size={9} /> Wipe All
          </button>
        ) : (
          <div className="flex gap-1 shrink-0">
            <button onClick={() => { wipeAllMedia(); setConfirmWipe(false); }}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-600 text-white font-mono-console text-[8px]">
              <Check size={9} /> Confirm
            </button>
            <button onClick={() => setConfirmWipe(false)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg border border-border text-muted-foreground font-mono-console text-[8px]">
              <X size={9} />
            </button>
          </div>
        )}
      </div>

      {/* Upload area */}
      <label className={cn(
        'flex flex-col items-center justify-center gap-2 py-4 rounded-xl border-2 border-dashed cursor-pointer transition-all',
        uploading ? 'border-primary/40 bg-primary/5' : 'border-border/50 hover:border-primary/40 hover:bg-primary/5'
      )}>
        {uploading ? (
          <div className="w-full px-4 space-y-1">
            <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
            </div>
            <p className="font-mono-console text-[9px] text-primary text-center">Uploading {uploadProgress}%</p>
          </div>
        ) : (
          <>
            <Upload size={18} className="text-muted-foreground" />
            <span className="font-mono-console text-[10px] text-muted-foreground">Upload video, audio, or image</span>
            <span className="font-mono-console text-[8px] text-muted-foreground/50">Up to 500MB per file</span>
          </>
        )}
        <input ref={fileInputRef} type="file" accept="video/*,audio/*,image/*" multiple className="hidden" onChange={handleFileUpload} disabled={uploading} />
      </label>

      {/* Filter + search */}
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
        <div className="relative">
          <Search size={10} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search..."
            className="w-full bg-input border border-border rounded-lg pl-8 pr-3 py-2 font-mono-console text-[10px] text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary" />
        </div>
      </div>

      {/* Media list */}
      {loading ? (
        <div className="text-center py-6 font-mono-console text-[10px] text-muted-foreground/40">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-6 font-mono-console text-[10px] text-muted-foreground/40">
          {items.length === 0 ? 'No media yet — upload files above' : 'No results'}
        </div>
      ) : (
        <div className="space-y-1.5 max-h-64 overflow-y-auto no-scrollbar">
          {filtered.map(item => {
            const Icon = TYPE_ICONS[item.type] || Film;
            const colorClass = TYPE_COLORS[item.type] || 'text-muted-foreground';
            const isPlaying = playingId === item.id;

            return (
              <div key={item.id} className="flex items-center gap-2.5 p-2 rounded-xl border border-border/50 bg-secondary/10 hover:bg-secondary/20 transition-colors">
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center bg-secondary shrink-0', colorClass)}>
                  {item.thumbnail_url ? (
                    <img src={item.thumbnail_url} className="w-full h-full rounded-lg object-cover" alt="" />
                  ) : (
                    <Icon size={14} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-mono-console text-[10px] font-semibold text-foreground truncate">{item.name}</p>
                  <p className="font-mono-console text-[8px] text-muted-foreground/60">
                    {formatSize(item.size)}{item.duration > 0 ? ` · ${formatDur(item.duration)}` : ''}
                  </p>
                </div>
                {/* Load to scene */}
                <button onClick={() => handleLoad(item)} title="Load to scene"
                  className="w-7 h-7 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-emerald-400 hover:border-emerald-500/40 transition-colors shrink-0">
                  <Play size={11} />
                </button>
                {/* Delete */}
                <button onClick={() => deleteMedia(item)} title="Delete"
                  className="w-7 h-7 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-red-400 hover:border-red-500/30 transition-colors shrink-0">
                  <Trash2 size={10} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {items.length > 0 && (
        <p className="font-mono-console text-[8px] text-muted-foreground/30 text-center">
          Tap ▶ to load into current scene · Files stored in OnSpace Cloud
        </p>
      )}
    </div>
  );
}
