import { useState } from 'react';
import { Layers, Play, Edit2, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { OverlayText, StudioScene } from '@/types/studio';

interface LowerThirdLibraryProps {
  currentScene: StudioScene | undefined;
  onApply: (overlays: Omit<OverlayText, 'id'>[]) => void;
  onClear: () => void;
}

interface LowerThirdTemplate {
  id: string;
  name: string;
  category: string;
  color: string;
  accentColor: string;
  bgColor: string;
  preview: string;
  build: (line1: string, line2: string) => Omit<OverlayText, 'id'>[];
}

const TEMPLATES: LowerThirdTemplate[] = [
  {
    id: 'news-classic',
    name: 'News Classic',
    category: 'News',
    color: 'text-red-400',
    accentColor: '#cc0000',
    bgColor: '#111',
    preview: '— NEWS —',
    build: (l1, l2) => [
      { text: l1, x: 50, y: 82, fontSize: 34, color: '#ffffff', bgColor: '#cc0000', bold: true, visible: true },
      { text: l2, x: 50, y: 90, fontSize: 22, color: '#eeeeee', bgColor: '#111111', bold: false, visible: true },
    ],
  },
  {
    id: 'interview',
    name: 'Interview',
    category: 'Talk',
    color: 'text-blue-400',
    accentColor: '#1d4ed8',
    bgColor: '#0a0a1a',
    preview: 'GUEST NAME',
    build: (l1, l2) => [
      { text: l1, x: 20, y: 84, fontSize: 32, color: '#ffffff', bgColor: '#1d4ed8', bold: true, visible: true },
      { text: l2, x: 20, y: 91, fontSize: 20, color: '#93c5fd', bgColor: 'transparent', bold: false, visible: true },
    ],
  },
  {
    id: 'breaking',
    name: 'Breaking News',
    category: 'News',
    color: 'text-amber-400',
    accentColor: '#d97706',
    bgColor: '#1a0a00',
    preview: '⚡ BREAKING',
    build: (l1, l2) => [
      { text: '⚡ BREAKING NEWS', x: 50, y: 10, fontSize: 28, color: '#ffffff', bgColor: '#cc0000', bold: true, visible: true },
      { text: l1, x: 50, y: 84, fontSize: 30, color: '#ffffff', bgColor: '#d97706', bold: true, visible: true },
      { text: l2, x: 50, y: 91, fontSize: 20, color: '#fef3c7', bgColor: '#1a0a00', bold: false, visible: true },
    ],
  },
  {
    id: 'sports',
    name: 'Sports Score',
    category: 'Sports',
    color: 'text-emerald-400',
    accentColor: '#059669',
    bgColor: '#001a0a',
    preview: 'SCORE 3 – 1',
    build: (l1, l2) => [
      { text: l1, x: 50, y: 83, fontSize: 42, color: '#ffffff', bgColor: '#059669', bold: true, visible: true },
      { text: l2, x: 50, y: 91, fontSize: 18, color: '#6ee7b7', bgColor: 'transparent', bold: false, visible: true },
    ],
  },
  {
    id: 'weather',
    name: 'Weather',
    category: 'Weather',
    color: 'text-cyan-400',
    accentColor: '#0891b2',
    bgColor: '#001a2e',
    preview: '🌤 WEATHER',
    build: (l1, l2) => [
      { text: l1, x: 50, y: 82, fontSize: 32, color: '#ffffff', bgColor: '#0891b2', bold: true, visible: true },
      { text: l2, x: 50, y: 90, fontSize: 22, color: '#a5f3fc', bgColor: 'transparent', bold: false, visible: true },
    ],
  },
  {
    id: 'social',
    name: 'Social Media',
    category: 'Social',
    color: 'text-purple-400',
    accentColor: '#7c3aed',
    bgColor: '#0a001a',
    preview: '@username',
    build: (l1, l2) => [
      { text: l1, x: 50, y: 83, fontSize: 30, color: '#e9d5ff', bgColor: '#7c3aed', bold: true, visible: true },
      { text: l2 || '✓ Follow us for more', x: 50, y: 91, fontSize: 18, color: '#c4b5fd', bgColor: 'transparent', bold: false, visible: true },
    ],
  },
  {
    id: 'credits',
    name: 'Credits',
    category: 'Production',
    color: 'text-muted-foreground',
    accentColor: '#374151',
    bgColor: '#000',
    preview: 'CREDITS',
    build: (l1, l2) => [
      { text: l1, x: 50, y: 82, fontSize: 28, color: '#f9fafb', bgColor: 'transparent', bold: false, visible: true },
      { text: l2, x: 50, y: 89, fontSize: 20, color: '#9ca3af', bgColor: 'transparent', bold: false, visible: true },
    ],
  },
  {
    id: 'quote',
    name: 'Quote',
    category: 'Content',
    color: 'text-rose-400',
    accentColor: '#be185d',
    bgColor: '#0a0a0a',
    preview: '" Quote "',
    build: (l1, l2) => [
      { text: `" ${l1} "`, x: 50, y: 80, fontSize: 28, color: '#fda4af', bgColor: 'transparent', bold: false, visible: true },
      { text: `— ${l2}`, x: 80, y: 89, fontSize: 20, color: '#9f1239', bgColor: 'transparent', bold: true, visible: true },
    ],
  },
];

export default function LowerThirdLibrary({ currentScene, onApply, onClear }: LowerThirdLibraryProps) {
  const [selected, setSelected] = useState<LowerThirdTemplate | null>(null);
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [filterCat, setFilterCat] = useState('All');

  const categories = ['All', ...Array.from(new Set(TEMPLATES.map(t => t.category)))];
  const filtered = filterCat === 'All' ? TEMPLATES : TEMPLATES.filter(t => t.category === filterCat);

  function handleApply() {
    if (!selected) return;
    const overlays = selected.build(line1 || selected.preview, line2 || 'Subtitle / Role');
    onApply(overlays);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-mono-console text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
          <Layers size={11} /> Lower-Third Library
        </h3>
        <button onClick={onClear}
          className="font-mono-console text-[9px] text-muted-foreground/50 hover:text-red-400 transition-colors">
          Clear All
        </button>
      </div>

      {/* Category filter */}
      <div className="flex gap-1 overflow-x-auto no-scrollbar">
        {categories.map(cat => (
          <button key={cat} onClick={() => setFilterCat(cat)}
            className={cn('flex-shrink-0 px-2.5 py-1 rounded-lg border font-mono-console text-[9px] transition-colors',
              filterCat === cat ? 'border-primary bg-primary/15 text-primary' : 'border-border text-muted-foreground hover:text-foreground')}>
            {cat}
          </button>
        ))}
      </div>

      {/* Template grid */}
      <div className="grid grid-cols-2 gap-2">
        {filtered.map(template => (
          <button key={template.id} onClick={() => setSelected(template)}
            className={cn(
              'p-2.5 rounded-xl border-2 text-left transition-all active:scale-[0.97]',
              selected?.id === template.id ? `border-current ${template.color} bg-current/5` : 'border-border hover:border-border/80'
            )}>
            <div className="rounded-lg p-2 mb-1.5 text-center font-mono-console text-[10px]"
              style={{ background: template.bgColor, borderLeft: `3px solid ${template.accentColor}` }}>
              <span style={{ color: template.accentColor }}>{template.preview}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-mono-console text-[9px] text-foreground">{template.name}</span>
              <span className={cn('font-mono-console text-[7px] uppercase', template.color)}>{template.category}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Text inputs + apply */}
      {selected && (
        <div className="p-3 rounded-xl border border-primary/30 bg-primary/5 space-y-2.5">
          <p className="font-mono-console text-[10px] text-muted-foreground uppercase">{selected.name}</p>
          <input type="text" placeholder="Line 1 (name / headline)..." value={line1} onChange={e => setLine1(e.target.value)}
            className="w-full bg-input border border-border rounded-lg px-3 py-2 font-mono-console text-xs text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary" />
          <input type="text" placeholder="Line 2 (role / subtitle)..." value={line2} onChange={e => setLine2(e.target.value)}
            className="w-full bg-input border border-border rounded-lg px-3 py-2 font-mono-console text-xs text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary" />
          <div className="flex gap-2">
            <button onClick={() => setSelected(null)}
              className="flex-1 py-2 rounded-xl border border-border font-mono-console text-xs text-muted-foreground flex items-center justify-center gap-1">
              <X size={11} /> Cancel
            </button>
            <button onClick={handleApply}
              className="flex-1 py-2 rounded-xl bg-primary text-white font-mono-console text-xs font-bold flex items-center justify-center gap-1">
              <Play size={11} /> Apply to Scene
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
