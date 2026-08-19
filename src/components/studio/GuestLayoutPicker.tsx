import { GuestLayout } from '@/types/studio';
import { cn } from '@/lib/utils';

interface GuestLayoutPickerProps {
  layout: GuestLayout;
  onChange: (layout: GuestLayout) => void;
  guestCount: number;
}

const LAYOUTS: { id: GuestLayout; label: string; grid: string; slots: number; preview: React.ReactNode }[] = [
  {
    id: 'solo',
    label: 'Solo',
    grid: 'grid-cols-1',
    slots: 1,
    preview: (
      <div className="w-full aspect-video bg-red-500/20 border-2 border-red-500/50 rounded flex items-center justify-center">
        <span className="text-[8px] font-mono-console text-red-400">HOST</span>
      </div>
    ),
  },
  {
    id: 'duo',
    label: 'Duo',
    grid: 'grid-cols-2',
    slots: 2,
    preview: (
      <div className="w-full grid grid-cols-2 gap-0.5 aspect-video">
        <div className="bg-red-500/20 border border-red-500/50 rounded flex items-center justify-center">
          <span className="text-[7px] font-mono-console text-red-400">HOST</span>
        </div>
        <div className="bg-blue-500/20 border border-blue-500/50 rounded flex items-center justify-center">
          <span className="text-[7px] font-mono-console text-blue-400">G1</span>
        </div>
      </div>
    ),
  },
  {
    id: 'trio',
    label: 'Trio',
    grid: 'grid-cols-3',
    slots: 3,
    preview: (
      <div className="w-full aspect-video space-y-0.5">
        <div className="bg-red-500/20 border border-red-500/50 rounded h-[55%] flex items-center justify-center">
          <span className="text-[7px] font-mono-console text-red-400">HOST</span>
        </div>
        <div className="grid grid-cols-2 gap-0.5 h-[40%]">
          <div className="bg-blue-500/20 border border-blue-500/50 rounded flex items-center justify-center">
            <span className="text-[7px] font-mono-console text-blue-400">G1</span>
          </div>
          <div className="bg-blue-500/20 border border-blue-500/50 rounded flex items-center justify-center">
            <span className="text-[7px] font-mono-console text-blue-400">G2</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'quad',
    label: '2×2',
    grid: 'grid-cols-2',
    slots: 4,
    preview: (
      <div className="w-full grid grid-cols-2 gap-0.5 aspect-video">
        {[['HOST', 'red'], ['G1', 'blue'], ['G2', 'blue'], ['G3', 'blue']].map(([label, c]) => (
          <div key={label} className={`bg-${c}-500/20 border border-${c}-500/50 rounded flex items-center justify-center`}>
            <span className={`text-[7px] font-mono-console text-${c}-400`}>{label}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 'panel-5',
    label: 'Panel 5',
    grid: 'grid-cols-3',
    slots: 5,
    preview: (
      <div className="w-full aspect-video space-y-0.5">
        <div className="grid grid-cols-3 gap-0.5 h-[50%]">
          {['HOST', 'G1', 'G2'].map(l => (
            <div key={l} className="bg-secondary/40 border border-border rounded flex items-center justify-center">
              <span className="text-[7px] font-mono-console text-muted-foreground">{l}</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-0.5 h-[45%]">
          {['G3', 'G4'].map(l => (
            <div key={l} className="bg-secondary/40 border border-border rounded flex items-center justify-center">
              <span className="text-[7px] font-mono-console text-muted-foreground">{l}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 'panel-6',
    label: '3×2',
    grid: 'grid-cols-3',
    slots: 6,
    preview: (
      <div className="w-full grid grid-cols-3 gap-0.5 aspect-video">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="bg-secondary/40 border border-border rounded flex items-center justify-center">
            <span className="text-[7px] font-mono-console text-muted-foreground">{i === 0 ? 'HOST' : `G${i}`}</span>
          </div>
        ))}
      </div>
    ),
  },
];

export default function GuestLayoutPicker({ layout, onChange, guestCount }: GuestLayoutPickerProps) {
  return (
    <div className="space-y-2">
      <p className="font-mono-console text-[9px] text-muted-foreground uppercase tracking-wider">Layout Template</p>
      <div className="grid grid-cols-3 gap-2">
        {LAYOUTS.map(l => (
          <button
            key={l.id}
            onClick={() => onChange(l.id)}
            className={cn(
              'flex flex-col gap-1.5 p-2 rounded-xl border-2 transition-all',
              layout === l.id
                ? 'border-primary bg-primary/10'
                : 'border-border bg-secondary/10 hover:border-border/80'
            )}
          >
            <div className="w-full">{l.preview}</div>
            <div className="flex items-center justify-between">
              <span className="font-mono-console text-[9px] text-muted-foreground">{l.label}</span>
              <span className={cn('font-mono-console text-[8px]',
                guestCount >= l.slots - 1 ? 'text-emerald-400' : 'text-muted-foreground/40')}>
                {l.slots - 1}G
              </span>
            </div>
          </button>
        ))}
      </div>
      <p className="font-mono-console text-[8px] text-muted-foreground/40 text-center">
        {guestCount} guest{guestCount !== 1 ? 's' : ''} connected
      </p>
    </div>
  );
}
