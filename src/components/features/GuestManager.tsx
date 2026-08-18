import { useState, useEffect, useRef } from 'react';
import { Users, Plus, Trash2, Mic, MicOff, Volume2, VolumeX, ChevronRight, Wifi, WifiOff, Phone, PhoneOff, UserCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Guest {
  id: string;
  name: string;
  role: string;
  platform: 'zoom' | 'teams' | 'skype' | 'phone' | 'in-studio';
  status: 'connected' | 'disconnected' | 'standby';
  muted: boolean;
  volume: number; // 0-100
  audioLevel: number; // simulated 0-100
  notes: string;
  avatar?: string;
}

const PLATFORM_LABELS: Record<string, string> = {
  zoom: 'Zoom',
  teams: 'MS Teams',
  skype: 'Skype',
  phone: 'Phone',
  'in-studio': 'In Studio',
};

const PLATFORM_COLORS: Record<string, string> = {
  zoom: 'bg-blue-600',
  teams: 'bg-indigo-600',
  skype: 'bg-sky-600',
  phone: 'bg-emerald-600',
  'in-studio': 'bg-purple-600',
};

const STATUS_COLORS: Record<string, string> = {
  connected: 'bg-emerald-400',
  disconnected: 'bg-red-400',
  standby: 'bg-amber-400',
};

const STORAGE_KEY = 'obs-guests-v1';

function loadGuests(): Guest[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch { return []; }
}

function saveGuests(guests: Guest[]) {
  // Strip audioLevel (ephemeral) before saving
  const toSave = guests.map(({ audioLevel: _, ...g }) => ({ ...g, audioLevel: 0 }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
}

function genId() { return `guest-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`; }

// Simulated audio level animation
function useAudioLevels(guests: Guest[], running: boolean) {
  const [levels, setLevels] = useState<Record<string, number>>({});
  const rafRef = useRef<number>();
  const lastRef = useRef<number>(0);

  useEffect(() => {
    if (!running) { setLevels({}); return; }
    function tick(now: number) {
      if (now - lastRef.current > 100) {
        lastRef.current = now;
        setLevels(prev => {
          const next = { ...prev };
          guests.forEach(g => {
            if (g.status !== 'connected' || g.muted) { next[g.id] = 0; return; }
            const delta = (Math.random() - 0.48) * 20;
            next[g.id] = Math.max(0, Math.min(100, (prev[g.id] ?? 30) + delta));
          });
          return next;
        });
      }
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [running, guests]);

  return levels;
}

interface GuestManagerProps {
  disabled: boolean;
  onLogEvent?: (msg: string, category?: string) => void;
}

export default function GuestManager({ disabled, onLogEvent }: GuestManagerProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [guests, setGuests] = useState<Guest[]>(() => {
    const saved = loadGuests();
    return saved.length > 0 ? saved : [
      { id: genId(), name: 'Jane Smith', role: 'Co-Host', platform: 'zoom', status: 'connected', muted: false, volume: 80, audioLevel: 0, notes: 'Main co-host' },
      { id: genId(), name: 'Dr. John Lee', role: 'Expert Guest', platform: 'teams', status: 'standby', muted: false, volume: 75, audioLevel: 0, notes: '' },
    ];
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [newGuest, setNewGuest] = useState<Partial<Guest>>({ platform: 'zoom', status: 'standby', muted: false, volume: 75 });
  const levels = useAudioLevels(guests, !disabled);

  useEffect(() => { saveGuests(guests); }, [guests]);

  function addGuest() {
    if (!newGuest.name?.trim()) { toast.error('Guest name is required'); return; }
    const g: Guest = {
      id: genId(),
      name: newGuest.name.trim(),
      role: newGuest.role || 'Guest',
      platform: (newGuest.platform as Guest['platform']) || 'zoom',
      status: 'standby',
      muted: false,
      volume: 75,
      audioLevel: 0,
      notes: newGuest.notes || '',
    };
    setGuests(prev => [...prev, g]);
    setNewGuest({ platform: 'zoom', status: 'standby', muted: false, volume: 75 });
    setShowAddForm(false);
    onLogEvent?.(`Guest added: ${g.name}`, 'audio');
    toast.success(`Guest added: ${g.name}`);
  }

  function toggleStatus(id: string) {
    setGuests(prev => prev.map(g => {
      if (g.id !== id) return g;
      const next = g.status === 'connected' ? 'disconnected' : g.status === 'disconnected' ? 'standby' : 'connected';
      onLogEvent?.(`${g.name}: ${next}`, 'audio');
      toast(`${g.name}: ${next}`);
      return { ...g, status: next as Guest['status'] };
    }));
  }

  function toggleMute(id: string) {
    setGuests(prev => prev.map(g => {
      if (g.id !== id) return g;
      const next = !g.muted;
      toast(next ? `Muted: ${g.name}` : `Unmuted: ${g.name}`);
      onLogEvent?.(`${next ? 'Muted' : 'Unmuted'}: ${g.name}`, 'audio');
      return { ...g, muted: next };
    }));
  }

  function setVolume(id: string, volume: number) {
    setGuests(prev => prev.map(g => g.id === id ? { ...g, volume } : g));
  }

  function deleteGuest(id: string) {
    const g = guests.find(g => g.id === id);
    setGuests(prev => prev.filter(g => g.id !== id));
    if (g) onLogEvent?.(`Guest removed: ${g.name}`, 'audio');
  }

  const connectedCount = guests.filter(g => g.status === 'connected').length;

  return (
    <div className="border border-border rounded-xl bg-[hsl(var(--card))] overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 h-11 border-b border-border cursor-pointer hover:bg-secondary/10 transition-colors"
        onClick={() => setCollapsed(v => !v)}
      >
        <ChevronRight size={13} className={cn('text-muted-foreground transition-transform shrink-0', !collapsed && 'rotate-90')} />
        <Users size={12} className={cn('shrink-0', connectedCount > 0 ? 'text-emerald-400' : 'text-muted-foreground')} />
        <span className="font-mono-console text-[10px] uppercase tracking-widest text-muted-foreground flex-1">
          Guest Manager
        </span>
        <span className="flex items-center gap-1.5 font-mono-console text-[9px] text-muted-foreground shrink-0">
          {connectedCount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
          {guests.length} guest{guests.length !== 1 ? 's' : ''}
          {connectedCount > 0 && ` · ${connectedCount} live`}
        </span>
        <button
          onClick={e => { e.stopPropagation(); setShowAddForm(v => !v); }}
          className="w-7 h-7 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors shrink-0"
          title="Add guest"
        >
          <Plus size={13} />
        </button>
      </div>

      {!collapsed && (
        <div className="p-3 space-y-2">
          {/* Add form */}
          {showAddForm && (
            <div className="p-3 rounded-xl border border-primary/30 bg-primary/5 space-y-2">
              <p className="font-mono-console text-[9px] uppercase tracking-wider text-muted-foreground">New Guest</p>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Name *"
                  value={newGuest.name || ''}
                  onChange={e => setNewGuest(p => ({ ...p, name: e.target.value }))}
                  className="bg-input border border-border rounded-lg px-2.5 py-1.5 font-mono-console text-[10px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary"
                />
                <input
                  type="text"
                  placeholder="Role (e.g. Expert)"
                  value={newGuest.role || ''}
                  onChange={e => setNewGuest(p => ({ ...p, role: e.target.value }))}
                  className="bg-input border border-border rounded-lg px-2.5 py-1.5 font-mono-console text-[10px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={newGuest.platform || 'zoom'}
                  onChange={e => setNewGuest(p => ({ ...p, platform: e.target.value as Guest['platform'] }))}
                  className="bg-input border border-border rounded-lg px-2.5 py-1.5 font-mono-console text-[10px] text-foreground focus:outline-none"
                >
                  {Object.entries(PLATFORM_LABELS).map(([k, v]) => (
                    <option key={k} value={k} className="bg-[hsl(220,18%,11%)]">{v}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Notes..."
                  value={newGuest.notes || ''}
                  onChange={e => setNewGuest(p => ({ ...p, notes: e.target.value }))}
                  className="bg-input border border-border rounded-lg px-2.5 py-1.5 font-mono-console text-[10px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowAddForm(false)} className="px-3 py-1.5 rounded-lg border border-border font-mono-console text-[10px] text-muted-foreground hover:text-foreground transition-colors">
                  Cancel
                </button>
                <button onClick={addGuest} className="px-3 py-1.5 rounded-lg bg-primary text-white font-mono-console text-[10px] hover:opacity-90 transition-opacity">
                  Add Guest
                </button>
              </div>
            </div>
          )}

          {/* Guest cards */}
          {guests.length === 0 && (
            <div className="flex flex-col items-center justify-center py-6 gap-2 text-muted-foreground/40">
              <UserCircle2 size={24} />
              <p className="font-mono-console text-xs">No guests added yet</p>
            </div>
          )}

          {guests.map(guest => {
            const level = levels[guest.id] ?? 0;
            return (
              <div
                key={guest.id}
                className={cn(
                  'rounded-xl border p-3 space-y-2.5 transition-all',
                  guest.status === 'connected' ? 'border-border bg-secondary/10' :
                  guest.status === 'standby' ? 'border-amber-500/20 bg-amber-500/5' :
                  'border-border/40 bg-transparent opacity-60'
                )}
              >
                {/* Guest header */}
                <div className="flex items-center gap-2">
                  {/* Avatar placeholder */}
                  <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center shrink-0">
                    <span className="font-mono-console text-sm font-bold text-muted-foreground">
                      {guest.name.charAt(0).toUpperCase()}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono-console text-xs text-foreground font-semibold truncate">{guest.name}</span>
                      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', STATUS_COLORS[guest.status])} />
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="font-mono-console text-[9px] text-muted-foreground">{guest.role}</span>
                      <span className={cn('px-1.5 py-0.5 rounded text-[8px] font-mono-console text-white', PLATFORM_COLORS[guest.platform] || 'bg-secondary')}>
                        {PLATFORM_LABELS[guest.platform]}
                      </span>
                    </div>
                  </div>

                  {/* Status toggle */}
                  <button
                    onClick={() => toggleStatus(guest.id)}
                    disabled={disabled}
                    title="Toggle connection status"
                    className={cn(
                      'w-8 h-8 rounded-xl flex items-center justify-center transition-all shrink-0',
                      guest.status === 'connected'
                        ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                        : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80'
                    )}
                  >
                    {guest.status === 'connected' ? <Wifi size={13} /> : <WifiOff size={13} />}
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => deleteGuest(guest.id)}
                    className="w-7 h-7 flex items-center justify-center rounded text-muted-foreground/30 hover:text-red-400 hover:bg-red-400/10 transition-colors shrink-0"
                  >
                    <Trash2 size={10} />
                  </button>
                </div>

                {/* Audio level + controls */}
                {guest.status === 'connected' && (
                  <div className="space-y-2">
                    {/* VU meter */}
                    <div className="flex items-center gap-2">
                      <Mic size={9} className={cn('shrink-0', guest.muted ? 'text-red-400' : 'text-muted-foreground/50')} />
                      <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all duration-75',
                            guest.muted ? 'bg-red-500/30' :
                            level > 80 ? 'bg-red-500' : level > 60 ? 'bg-amber-400' : 'bg-emerald-400'
                          )}
                          style={{ width: `${guest.muted ? 0 : level}%` }}
                        />
                      </div>
                      <span className="font-mono-console text-[8px] text-muted-foreground/50 w-8 text-right tabular-nums">
                        {guest.muted ? 'MUTE' : `${Math.round(level)}%`}
                      </span>
                    </div>

                    {/* Volume + mute row */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleMute(guest.id)}
                        disabled={disabled}
                        className={cn(
                          'w-7 h-7 flex items-center justify-center rounded-lg border transition-all shrink-0',
                          guest.muted
                            ? 'border-red-500/60 bg-red-500/15 text-red-400'
                            : 'border-border bg-secondary/40 text-muted-foreground hover:text-foreground'
                        )}
                      >
                        {guest.muted ? <MicOff size={11} /> : <Mic size={11} />}
                      </button>
                      <Volume2 size={9} className="text-muted-foreground/40 shrink-0" />
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={guest.volume}
                        disabled={disabled || guest.muted}
                        onChange={e => setVolume(guest.id, Number(e.target.value))}
                        className="flex-1 h-1.5 accent-emerald-400 disabled:opacity-40"
                      />
                      <span className="font-mono-console text-[9px] text-muted-foreground/60 w-8 text-right tabular-nums">{guest.volume}%</span>
                    </div>

                    {/* Notes */}
                    {guest.notes && (
                      <p className="font-mono-console text-[9px] text-muted-foreground/50 truncate">{guest.notes}</p>
                    )}
                  </div>
                )}

                {/* Standby call button */}
                {guest.status === 'standby' && (
                  <button
                    onClick={() => toggleStatus(guest.id)}
                    disabled={disabled}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-mono-console text-[9px] hover:bg-emerald-500/20 transition-colors disabled:opacity-40"
                  >
                    <Phone size={10} />
                    Bring On Air
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
