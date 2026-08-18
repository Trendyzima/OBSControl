import { useState, useRef } from 'react';
import { AdSlot } from '@/types/studio';
import { Plus, Trash2, Play, Square, Upload, Tv } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface AdManagerProps {
  adSlots: AdSlot[];
  onAdd: (ad: Omit<AdSlot, 'id'>) => void;
  onRemove: (id: string) => void;
  onPlayAd: (ad: AdSlot) => void;
  isPlaying: boolean;
  playingId: string | null;
  onStopAd: () => void;
}

export default function AdManager({ adSlots, onAdd, onRemove, onPlayAd, isPlaying, playingId, onStopAd }: AdManagerProps) {
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDuration, setNewDuration] = useState(30);
  const [newMediaUrl, setNewMediaUrl] = useState('');
  const [newThumbnail, setNewThumbnail] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFileLoad(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setNewMediaUrl(url);
    if (file.type.startsWith('image/')) setNewThumbnail(url);
    if (!newTitle) setNewTitle(file.name.replace(/\.[^.]+$/, ''));
    toast.success(`Loaded: ${file.name}`);
    e.target.value = '';
  }

  function handleAdd() {
    if (!newTitle.trim() || !newMediaUrl) return;
    onAdd({ title: newTitle.trim(), mediaUrl: newMediaUrl, duration: newDuration, thumbnail: newThumbnail || undefined });
    setNewTitle(''); setNewMediaUrl(''); setNewThumbnail('');
    setAdding(false);
  }

  // Also allow URL-only text ads (color overlay scenes)
  function handleAddTextAd() {
    if (!newTitle.trim()) return;
    onAdd({ title: newTitle.trim(), mediaUrl: '__text__', duration: newDuration });
    setNewTitle('');
    setAdding(false);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-mono-console text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
          <Tv size={11} /> Ad Manager
        </h3>
        {isPlaying && (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 font-mono-console text-[8px] text-amber-400 animate-pulse">
            ● ON AIR
          </span>
        )}
      </div>

      {/* Ad slots */}
      <div className="space-y-1.5">
        {adSlots.length === 0 && (
          <div className="text-center py-4 font-mono-console text-[10px] text-muted-foreground/40">
            No ads loaded — add video or text ads below
          </div>
        )}
        {adSlots.map(ad => {
          const isThisPlaying = isPlaying && playingId === ad.id;
          return (
            <div key={ad.id} className={cn(
              'flex items-center gap-2.5 p-2.5 rounded-xl border transition-all',
              isThisPlaying ? 'border-amber-500/50 bg-amber-500/8' : 'border-border bg-secondary/20'
            )}>
              {/* Thumbnail */}
              <div className="w-10 h-7 rounded overflow-hidden bg-secondary/50 shrink-0 flex items-center justify-center">
                {ad.thumbnail ? (
                  <img src={ad.thumbnail} className="w-full h-full object-cover" alt="" />
                ) : (
                  <Tv size={12} className="text-muted-foreground/40" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-mono-console text-[10px] font-semibold truncate">{ad.title}</p>
                <p className="font-mono-console text-[8px] text-muted-foreground">
                  {ad.duration}s · {ad.mediaUrl === '__text__' ? 'Text/Color' : 'Video'}
                </p>
              </div>
              <button
                onClick={() => isThisPlaying ? onStopAd() : onPlayAd(ad)}
                className={cn('w-7 h-7 flex items-center justify-center rounded-lg border transition-colors shrink-0',
                  isThisPlaying ? 'border-amber-500/50 bg-amber-500/15 text-amber-400' : 'border-border text-muted-foreground hover:text-amber-400 hover:border-amber-500/50'
                )}>
                {isThisPlaying ? <Square size={10} /> : <Play size={10} />}
              </button>
              <button onClick={() => onRemove(ad.id)} className="w-6 h-6 flex items-center justify-center rounded text-muted-foreground/30 hover:text-red-400 transition-colors shrink-0">
                <Trash2 size={9} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Add ad */}
      {adding ? (
        <div className="p-3 rounded-xl border border-primary/30 bg-primary/5 space-y-2">
          <input autoFocus type="text" placeholder="Ad / sponsor title..." value={newTitle} onChange={e => setNewTitle(e.target.value)}
            className="w-full bg-input border border-border rounded-lg px-3 py-2 font-mono-console text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary" />
          
          <div className="flex gap-2">
            <label className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 border-dashed border-border/60 hover:border-amber-500/40 text-muted-foreground hover:text-amber-400 cursor-pointer transition-colors">
              <Upload size={13} />
              <span className="font-mono-console text-[10px]">{newMediaUrl ? 'File loaded ✓' : 'Load video/image'}</span>
              <input ref={fileRef} type="file" accept="video/*,image/*" className="hidden" onChange={handleFileLoad} />
            </label>
          </div>

          <div className="flex items-center gap-2">
            <label className="font-mono-console text-[9px] text-muted-foreground uppercase shrink-0">Duration (sec)</label>
            <input type="number" min={5} max={300} value={newDuration} onChange={e => setNewDuration(Number(e.target.value))}
              className="flex-1 bg-input border border-border rounded px-2 py-1 font-mono-console text-xs text-foreground focus:outline-none" />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setAdding(false)} className="flex-1 py-1.5 rounded-lg border border-border font-mono-console text-xs text-muted-foreground">Cancel</button>
            <button onClick={handleAddTextAd} className="flex-1 py-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-400 font-mono-console text-xs">Text Ad</button>
            <button onClick={handleAdd} disabled={!newTitle.trim() || !newMediaUrl} className="flex-1 py-1.5 rounded-lg bg-primary text-white font-mono-console text-xs font-semibold disabled:opacity-40">Add</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-border/50 text-muted-foreground hover:text-foreground hover:border-amber-500/30 font-mono-console text-xs transition-colors">
          <Plus size={13} /> Add Ad / Sponsor
        </button>
      )}
    </div>
  );
}
