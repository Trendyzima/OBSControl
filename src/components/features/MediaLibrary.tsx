import { useState, useRef, useCallback, useEffect } from 'react';
import { MediaItem } from '@/types/obs';
import { MOCK_MEDIA } from '@/lib/obs-mock';
import { saveUploadedMedia, deleteUploadedMedia } from '@/lib/obs-mock';
import { Play, Film, Image, Music, Tag, Upload, Trash2, X, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type Category = 'all' | 'news' | 'ads' | 'podcast' | 'photos' | 'uploads';

const CATEGORIES: { key: Category; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'news', label: 'News' },
  { key: 'ads', label: 'Ads' },
  { key: 'podcast', label: 'Podcast' },
  { key: 'photos', label: 'Photos' },
  { key: 'uploads', label: 'Uploads' },
];

const TYPE_ICONS: Record<string, React.ElementType> = {
  video: Film,
  image: Image,
  audio: Music,
};

interface MediaLibraryProps {
  uploadedMedia: MediaItem[];
  onPlay: (item: MediaItem) => void;
  onAddUpload: (item: MediaItem) => void;
  onRemoveUpload: (id: string) => void;
  disabled: boolean;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getMediaType(file: File): MediaItem['type'] {
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('audio/')) return 'audio';
  return 'video';
}

export default function MediaLibrary({ uploadedMedia, onPlay, onAddUpload, onRemoveUpload, disabled }: MediaLibraryProps) {
  const [category, setCategory] = useState<Category>('all');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allMedia = [...MOCK_MEDIA, ...uploadedMedia];
  const filtered = category === 'all'
    ? allMedia
    : category === 'uploads'
      ? uploadedMedia
      : MOCK_MEDIA.filter(m => m.category === category);

  const processFile = useCallback(async (file: File) => {
    if (file.size > 500 * 1024 * 1024) {
      toast.error('File too large (max 500 MB)');
      return;
    }
    const id = `upload-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const url = URL.createObjectURL(file);
    const type = getMediaType(file);

    // Generate thumbnail for videos
    let thumbnail: string | undefined;
    if (type === 'video') {
      thumbnail = await new Promise<string>(resolve => {
        const video = document.createElement('video');
        video.src = url;
        video.crossOrigin = 'anonymous';
        video.currentTime = 1;
        video.onloadeddata = () => {
          const canvas = document.createElement('canvas');
          canvas.width = 200;
          canvas.height = 112;
          const ctx = canvas.getContext('2d');
          if (ctx) ctx.drawImage(video, 0, 0, 200, 112);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
          URL.revokeObjectURL(url);
        };
        video.onerror = () => resolve('');
      });
    } else if (type === 'image') {
      thumbnail = url;
    }

    const item: MediaItem = {
      id,
      name: file.name.replace(/\.[^.]+$/, ''),
      type,
      category: 'uploads',
      size: file.size,
      url: type === 'image' ? url : URL.createObjectURL(file),
      thumbnail,
    };

    await saveUploadedMedia(item, file);
    onAddUpload(item);
    toast.success(`Uploaded: ${item.name}`);
  }, [onAddUpload]);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach(f => processFile(f));
  }, [processFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleDelete = useCallback(async (item: MediaItem, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteUploadedMedia(item.id);
    if (item.url) URL.revokeObjectURL(item.url);
    onRemoveUpload(item.id);
    toast('Removed: ' + item.name);
  }, [onRemoveUpload]);

  return (
    <div className="space-y-3">
      {/* Header + upload button */}
      <div className="flex items-center justify-between">
        <h2 className="font-mono-console text-xs tracking-widest text-muted-foreground uppercase">Media Library</h2>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono-console bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors"
        >
          <Upload size={11} />
          Upload
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="video/*,image/*,audio/*"
          className="hidden"
          onChange={e => handleFiles(e.target.files)}
        />
      </div>

      {/* Category tabs */}
      <div className="flex gap-1 flex-wrap">
        {CATEGORIES.map(c => (
          <button
            key={c.key}
            onClick={() => setCategory(c.key)}
            className={cn(
              'px-2.5 py-1 rounded text-xs font-mono-console transition-colors',
              category === c.key
                ? 'bg-[hsl(var(--live-red))] text-white'
                : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80'
            )}
          >
            {c.label}
            {c.key === 'uploads' && uploadedMedia.length > 0 && (
              <span className="ml-1 px-1 rounded-full text-[9px] bg-white/20">{uploadedMedia.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          'rounded-lg border-2 border-dashed transition-colors p-2',
          dragOver ? 'border-[hsl(var(--live-red))] bg-[hsl(var(--live-red))]/5' : 'border-transparent'
        )}
      >
        {dragOver && (
          <div className="flex items-center justify-center gap-2 py-4 text-[hsl(var(--live-red))] font-mono-console text-sm">
            <Upload size={20} />
            Drop files to upload
          </div>
        )}

        {/* Media grid */}
        {!dragOver && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map(item => {
              const TypeIcon = TYPE_ICONS[item.type] || Film;
              const isUpload = item.category === 'uploads';
              return (
                <button
                  key={item.id}
                  onClick={() => !disabled && onPlay(item)}
                  disabled={disabled}
                  className={cn(
                    'group relative rounded-lg overflow-hidden border border-border bg-secondary/30 transition-all duration-150 text-left',
                    'hover:border-primary/50 hover:bg-secondary/60',
                    disabled && 'opacity-40 cursor-not-allowed'
                  )}
                >
                  {/* Thumbnail */}
                  <div className="aspect-video bg-muted relative overflow-hidden">
                    {item.thumbnail ? (
                      <img src={item.thumbnail} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <TypeIcon size={24} className="text-muted-foreground/40" />
                      </div>
                    )}
                    {/* Play overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-8 h-8 rounded-full bg-[hsl(var(--live-red))] flex items-center justify-center">
                        <Play size={12} className="text-white fill-white ml-0.5" />
                      </div>
                    </div>
                    {item.duration && (
                      <span className="absolute bottom-1 right-1 px-1 py-0.5 rounded text-[9px] font-mono-console bg-black/70 text-white">
                        {item.duration}
                      </span>
                    )}
                    <span className="absolute top-1 left-1">
                      <TypeIcon size={10} className="text-white/70" />
                    </span>
                    {/* Delete button for uploads */}
                    {isUpload && (
                      <button
                        onClick={e => handleDelete(item, e)}
                        className="absolute top-1 right-1 w-5 h-5 rounded bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                      >
                        <Trash2 size={9} className="text-white" />
                      </button>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-2">
                    <p className="font-mono-console text-[10px] text-foreground truncate">{item.name}</p>
                    <div className="flex items-center justify-between mt-0.5">
                      <div className="flex items-center gap-1">
                        <Tag size={8} className="text-muted-foreground/40" />
                        <span className="font-mono-console text-[9px] text-muted-foreground capitalize">{item.category}</span>
                      </div>
                      {item.size && (
                        <span className="font-mono-console text-[9px] text-muted-foreground/60">{formatBytes(item.size)}</span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {filtered.length === 0 && !dragOver && (
        <div className="flex flex-col items-center justify-center h-24 gap-2 text-xs text-muted-foreground font-mono-console">
          <Upload size={20} className="opacity-30" />
          {category === 'uploads' ? 'No uploaded files yet. Drag & drop or click Upload.' : 'No media in this category'}
        </div>
      )}
    </div>
  );
}
