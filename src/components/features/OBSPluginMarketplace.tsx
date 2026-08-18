import { useState } from 'react';
import { Package, Star, ExternalLink, Bookmark, BookmarkCheck, ChevronRight, Search, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OBSPlugin {
  id: string;
  name: string;
  author: string;
  description: string;
  category: 'effects' | 'audio' | 'sources' | 'streaming' | 'utility' | 'graphics';
  stars: number; // out of 5
  downloads: string; // e.g. "50K+"
  url: string;
  tags: string[];
  version: string;
  featured?: boolean;
}

const PLUGINS: OBSPlugin[] = [
  {
    id: 'streamfx', name: 'StreamFX', author: 'Xaymar', version: '0.12.0',
    description: 'Unlocks powerful effects: blur, motion blur, SDF effects, shader filters, and advanced color correction. The most popular OBS plugin.',
    category: 'effects', stars: 5, downloads: '2M+',
    url: 'https://github.com/Xaymar/obs-StreamFX',
    tags: ['blur', 'shader', 'effects', 'color'], featured: true,
  },
  {
    id: 'move-transition', name: 'Move Transition', author: 'exeldro', version: '2.9.1',
    description: 'Smooth animated transitions between scenes with per-source movement, scaling, and rotation — cinematic broadcast-quality cuts.',
    category: 'effects', stars: 5, downloads: '800K+',
    url: 'https://github.com/exeldro/obs-move-transition',
    tags: ['transition', 'animation', 'motion'], featured: true,
  },
  {
    id: 'obs-ndi', name: 'OBS-NDI', author: 'obs-ndi', version: '4.13.0',
    description: 'NewTek NDI technology for OBS — receive and send video/audio over local network without capture cards. Essential for multi-PC setups.',
    category: 'sources', stars: 5, downloads: '1M+',
    url: 'https://github.com/obs-ndi/obs-ndi',
    tags: ['NDI', 'network', 'multi-pc', 'source'], featured: true,
  },
  {
    id: 'advanced-masks', name: 'Advanced Masks', author: 'FiniteSingularity', version: '1.0.4',
    description: 'Powerful masking plugin with circle, rectangle, gradient, and image masks. Create professional overlays and scene borders.',
    category: 'graphics', stars: 4, downloads: '200K+',
    url: 'https://github.com/FiniteSingularity/obs-advanced-masks',
    tags: ['mask', 'overlay', 'shape', 'graphics'],
  },
  {
    id: 'source-clone', name: 'Source Clone', author: 'exeldro', version: '0.1.4',
    description: 'Clone any OBS source and apply independent transforms/filters to each clone. Use one camera feed in multiple scenes simultaneously.',
    category: 'sources', stars: 4, downloads: '150K+',
    url: 'https://github.com/exeldro/obs-source-clone',
    tags: ['clone', 'source', 'multi-scene'],
  },
  {
    id: 'noise-suppression', name: 'NVIDIA RTX Voice', author: 'NVIDIA', version: '1.0.0',
    description: 'AI-powered background noise suppression using RTX GPUs. Removes keyboard, fan, and ambient noise in real time.',
    category: 'audio', stars: 5, downloads: '3M+',
    url: 'https://www.nvidia.com/en-us/geforce/broadcasting/broadcast-app/',
    tags: ['noise', 'AI', 'microphone', 'RTX'],
  },
  {
    id: 'virtual-cam', name: 'OBS Virtual Camera', author: 'OBS Project', version: 'Built-in',
    description: 'Built-in virtual camera — output your OBS scene to Zoom, Teams, Google Meet, or any video conferencing software as a camera source.',
    category: 'streaming', stars: 5, downloads: 'Built-in',
    url: 'https://obsproject.com',
    tags: ['virtual camera', 'zoom', 'teams', 'meet'],
  },
  {
    id: 'downstream-keyer', name: 'Downstream Keyer', author: 'exeldro', version: '0.2.4',
    description: 'Add graphics overlays that appear on top of all scenes — perfect for persistent lower thirds, logos, and bug/DOG graphics.',
    category: 'graphics', stars: 4, downloads: '300K+',
    url: 'https://github.com/exeldro/obs-downstream-keyer',
    tags: ['overlay', 'logo', 'lower-third', 'DOG'],
  },
  {
    id: 'transition-table', name: 'Transition Table', author: 'exeldro', version: '0.2.8',
    description: 'Define custom transitions between specific scene pairs — e.g. always use Stinger when going from CAMERA to NEWS, Fade for everything else.',
    category: 'effects', stars: 4, downloads: '250K+',
    url: 'https://github.com/exeldro/obs-transition-table',
    tags: ['transition', 'scene', 'stinger', 'per-scene'],
  },
  {
    id: 'revert-scene', name: 'Scene Notes', author: 'exeldro', version: '0.0.4',
    description: 'Add private production notes to each OBS scene — invisible to viewers but visible to the operator in the OBS interface.',
    category: 'utility', stars: 3, downloads: '80K+',
    url: 'https://github.com/exeldro/obs-scene-notes-dock',
    tags: ['notes', 'production', 'scene'],
  },
  {
    id: 'replay-source', name: 'Replay Source', author: 'exeldro', version: '1.6.9',
    description: 'Capture and instantly replay the last N seconds of any source — create live instant replay moments for sports and gaming streams.',
    category: 'sources', stars: 4, downloads: '400K+',
    url: 'https://github.com/exeldro/obs-replay-source',
    tags: ['replay', 'instant replay', 'sports', 'buffer'],
  },
  {
    id: 'obs-websocket', name: 'OBS WebSocket', author: 'OBS Project', version: '5.x (built-in)',
    description: 'Built-in WebSocket server (OBS 28+) enabling remote control from external apps, scripts, and stream decks — powers this control panel.',
    category: 'utility', stars: 5, downloads: 'Built-in',
    url: 'https://github.com/obsproject/obs-websocket',
    tags: ['API', 'remote control', 'websocket', 'automation'],
  },
  {
    id: 'animated-lower-thirds', name: 'Animated Lower Thirds', author: 'Community', version: 'Template',
    description: 'HTML/CSS animated lower third templates ready for OBS Browser Source — professional TV-quality chyrons and name cards.',
    category: 'graphics', stars: 4, downloads: '500K+',
    url: 'https://obsproject.com/forum/threads/animated-lower-thirds.75427/',
    tags: ['lower-third', 'chyron', 'HTML', 'animation'],
  },
  {
    id: 'media-playlist', name: 'VLC Video Source', author: 'OBS Project', version: 'Built-in',
    description: 'Play playlists of video files with shuffle, loop, and trim controls — ideal for ad breaks, intros, and pre-show content queues.',
    category: 'sources', stars: 4, downloads: 'Built-in',
    url: 'https://obsproject.com/wiki/Sources-Guide#vlc-video-source',
    tags: ['VLC', 'playlist', 'video', 'ads', 'built-in'],
  },
  {
    id: 'chapter-marker', name: 'Chapter Marker', author: 'exeldro', version: '0.0.5',
    description: 'Add timestamped chapter markers to OBS recordings for YouTube chapters — one click to mark a segment during your live stream.',
    category: 'utility', stars: 4, downloads: '120K+',
    url: 'https://github.com/exeldro/obs-chapter-marker',
    tags: ['chapters', 'YouTube', 'markers', 'recording'],
  },
];

const CATEGORIES = ['all', 'effects', 'audio', 'sources', 'streaming', 'utility', 'graphics'] as const;
type CategoryFilter = (typeof CATEGORIES)[number];

const CATEGORY_COLORS: Record<string, string> = {
  effects: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  audio: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  sources: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  streaming: 'bg-red-500/20 text-red-400 border-red-500/30',
  utility: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  graphics: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
};

const STORAGE_KEY = 'obs-plugin-bookmarks';

function loadBookmarks(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'));
  } catch { return new Set(); }
}

function saveBookmarks(bm: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...bm]));
}

export default function OBSPluginMarketplace() {
  const [collapsed, setCollapsed] = useState(false);
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [search, setSearch] = useState('');
  const [bookmarks, setBookmarks] = useState<Set<string>>(loadBookmarks);
  const [showBookmarked, setShowBookmarked] = useState(false);

  function toggleBookmark(id: string) {
    setBookmarks(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      saveBookmarks(next);
      return next;
    });
  }

  const filtered = PLUGINS.filter(p => {
    const catMatch = category === 'all' || p.category === category;
    const bmMatch = !showBookmarked || bookmarks.has(p.id);
    const q = search.toLowerCase();
    const searchMatch = !q || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.tags.some(t => t.toLowerCase().includes(q));
    return catMatch && bmMatch && searchMatch;
  });

  const featured = filtered.filter(p => p.featured);
  const rest = filtered.filter(p => !p.featured);

  function StarRow({ count }: { count: number }) {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(i => (
          <Star key={i} size={9} className={i <= count ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/20'} />
        ))}
      </div>
    );
  }

  function PluginCard({ plugin }: { plugin: OBSPlugin }) {
    const bm = bookmarks.has(plugin.id);
    return (
      <div className={cn(
        'p-3 rounded-xl border transition-all',
        plugin.featured ? 'border-primary/30 bg-primary/5' : 'border-border bg-secondary/10 hover:bg-secondary/20'
      )}>
        <div className="flex items-start gap-2">
          <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center shrink-0">
            <Package size={16} className="text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-mono-console text-[11px] font-bold text-foreground">{plugin.name}</span>
              {plugin.featured && (
                <span className="px-1.5 py-0.5 rounded text-[8px] font-mono-console bg-primary/20 text-primary border border-primary/30">Featured</span>
              )}
              <span className={cn('px-1.5 py-0.5 rounded text-[8px] font-mono-console border', CATEGORY_COLORS[plugin.category])}>
                {plugin.category}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <StarRow count={plugin.stars} />
              <span className="font-mono-console text-[9px] text-muted-foreground/60">{plugin.downloads}</span>
              <span className="font-mono-console text-[9px] text-muted-foreground/40">v{plugin.version}</span>
            </div>
          </div>
          <button
            onClick={() => toggleBookmark(plugin.id)}
            className={cn('w-7 h-7 flex items-center justify-center rounded shrink-0 transition-colors',
              bm ? 'text-amber-400 hover:text-amber-300' : 'text-muted-foreground/30 hover:text-muted-foreground'
            )}
            title={bm ? 'Remove bookmark' : 'Bookmark plugin'}
          >
            {bm ? <BookmarkCheck size={13} /> : <Bookmark size={13} />}
          </button>
        </div>

        <p className="font-mono-console text-[10px] text-muted-foreground/80 mt-2 leading-relaxed line-clamp-2">
          {plugin.description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mt-2">
          {plugin.tags.slice(0, 4).map(tag => (
            <span key={tag} className="px-1.5 py-0.5 rounded font-mono-console text-[8px] bg-secondary text-muted-foreground/60">
              {tag}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-2 mt-2.5">
          <a
            href={plugin.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border bg-secondary/40 hover:bg-secondary font-mono-console text-[10px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <ExternalLink size={10} />
            {plugin.downloads === 'Built-in' ? 'Docs' : 'Download'}
          </a>
          {bm && (
            <span className="font-mono-console text-[9px] text-amber-400 flex items-center gap-1">
              <BookmarkCheck size={10} />
              Saved
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="border border-border rounded-xl bg-[hsl(var(--card))] overflow-hidden">
      <div
        className="flex items-center gap-2 px-3 h-11 border-b border-border cursor-pointer hover:bg-secondary/10 transition-colors"
        onClick={() => setCollapsed(v => !v)}
      >
        <ChevronRight size={13} className={cn('text-muted-foreground transition-transform shrink-0', !collapsed && 'rotate-90')} />
        <Package size={12} className="text-muted-foreground shrink-0" />
        <span className="font-mono-console text-[10px] uppercase tracking-widest text-muted-foreground flex-1">
          OBS Plugin Marketplace
        </span>
        {bookmarks.size > 0 && (
          <span className="flex items-center gap-1 font-mono-console text-[9px] text-amber-400 shrink-0">
            <Bookmark size={9} />
            {bookmarks.size}
          </span>
        )}
        <span className="font-mono-console text-[9px] text-muted-foreground shrink-0">{PLUGINS.length} plugins</span>
      </div>

      {!collapsed && (
        <div className="p-3 space-y-3">
          {/* Search + filter */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
              <input
                type="text"
                placeholder="Search plugins..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-input border border-border rounded-lg pl-8 pr-3 py-1.5 font-mono-console text-[10px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary"
              />
            </div>
            <button
              onClick={() => setShowBookmarked(v => !v)}
              className={cn('flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border font-mono-console text-[10px] transition-colors shrink-0',
                showBookmarked
                  ? 'border-amber-500/40 bg-amber-500/10 text-amber-400'
                  : 'border-border text-muted-foreground hover:text-foreground'
              )}
            >
              <Bookmark size={10} />
              Saved
            </button>
          </div>

          {/* Category tabs */}
          <div className="flex gap-1 flex-wrap">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={cn(
                  'px-2.5 py-1 rounded-lg font-mono-console text-[9px] uppercase tracking-wide transition-colors',
                  category === cat
                    ? 'bg-secondary text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/40'
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Results count */}
          <div className="flex items-center justify-between">
            <p className="font-mono-console text-[9px] text-muted-foreground">
              {filtered.length} plugin{filtered.length !== 1 ? 's' : ''} found
            </p>
            <div className="flex items-center gap-1 text-muted-foreground/40">
              <Download size={9} />
              <span className="font-mono-console text-[9px]">Click to install from GitHub</span>
            </div>
          </div>

          {/* Plugin cards */}
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {featured.length > 0 && (
              <>
                <p className="font-mono-console text-[8px] uppercase tracking-widest text-muted-foreground/50">Featured</p>
                {featured.map(p => <PluginCard key={p.id} plugin={p} />)}
              </>
            )}
            {rest.length > 0 && (
              <>
                {featured.length > 0 && (
                  <p className="font-mono-console text-[8px] uppercase tracking-widest text-muted-foreground/50 pt-1">All Plugins</p>
                )}
                {rest.map(p => <PluginCard key={p.id} plugin={p} />)}
              </>
            )}
            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 gap-2 text-muted-foreground/40">
                <Package size={24} />
                <p className="font-mono-console text-xs">No plugins match your search</p>
              </div>
            )}
          </div>

          <p className="font-mono-console text-[8px] text-muted-foreground/30 text-center">
            Curated list of 15 essential OBS plugins · Bookmarks saved to localStorage
          </p>
        </div>
      )}
    </div>
  );
}
