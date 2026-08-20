import { useRef, useEffect, useState } from 'react';
import { Users, Mic, MicOff, Camera, CameraOff, PhoneOff, Monitor, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface GuestPeerInfo {
  id: string;
  name: string;
  stream: MediaStream | null;
  connected: boolean;
  muted: boolean;
  onAir: boolean;
}

interface MultiGuestGridProps {
  guests: GuestPeerInfo[];
  onToggleMute: (id: string) => void;
  onRemove: (id: string) => void;
  onToggleOnAir: (id: string) => void;
  onInvite: () => void;
  guestLink: string;
}

const LAYOUT_COLS: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-2',
  4: 'grid-cols-2',
  5: 'grid-cols-3',
  6: 'grid-cols-3',
};

export default function MultiGuestGrid({
  guests, onToggleMute, onRemove, onToggleOnAir, onInvite, guestLink
}: MultiGuestGridProps) {
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const [speakingIds, setSpeakingIds] = useState<Set<string>>(new Set());

  // Attach streams
  useEffect(() => {
    guests.forEach(g => {
      const el = videoRefs.current[g.id];
      if (!el || !g.stream) return;
      if (el.srcObject !== g.stream) {
        el.srcObject = g.stream;
        el.play().catch(() => {});
      }
    });
  });

  // Audio activity detection (speaking indicator)
  useEffect(() => {
    const analyzers: { id: string; ctx: AudioContext; source: MediaStreamAudioSourceNode; analyser: AnalyserNode; interval: ReturnType<typeof setInterval> }[] = [];
    guests.forEach(g => {
      if (!g.stream || !g.connected || g.muted) return;
      try {
        const ctx = new AudioContext();
        const source = ctx.createMediaStreamSource(g.stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        const data = new Uint8Array(analyser.frequencyBinCount);
        const interval = setInterval(() => {
          analyser.getByteFrequencyData(data);
          const avg = data.reduce((s, v) => s + v, 0) / data.length;
          setSpeakingIds(prev => {
            const next = new Set(prev);
            if (avg > 20) next.add(g.id); else next.delete(g.id);
            return next;
          });
        }, 100);
        analyzers.push({ id: g.id, ctx, source, analyser, interval });
      } catch {}
    });
    return () => {
      analyzers.forEach(({ ctx, interval }) => { clearInterval(interval); ctx.close(); });
    };
  }, [guests]);

  const cols = LAYOUT_COLS[Math.min(guests.length, 6)] || 'grid-cols-3';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-mono-console text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
          <Users size={11} /> Guest Studio ({guests.filter(g => g.connected).length} live)
        </h3>
        <button onClick={onInvite}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-dashed border-blue-500/30 bg-blue-500/5 text-blue-400 font-mono-console text-[9px] hover:bg-blue-500/10 transition-colors">
          <UserPlus size={11} /> Invite
        </button>
      </div>

      {guests.length === 0 ? (
        <div className="text-center py-8 space-y-2">
          <Users size={28} className="mx-auto text-muted-foreground/20" />
          <p className="font-mono-console text-[10px] text-muted-foreground/40">No guests connected</p>
          <button onClick={onInvite}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-blue-500/30 bg-blue-500/5 text-blue-400 font-mono-console text-xs mx-auto transition-colors hover:bg-blue-500/10">
            <UserPlus size={13} /> Generate guest link
          </button>
        </div>
      ) : (
        <div className={cn('grid gap-2', cols)}>
          {guests.map(g => {
            const isSpeaking = speakingIds.has(g.id);
            return (
              <div key={g.id} className={cn(
                'relative rounded-xl overflow-hidden border-2 transition-all duration-200',
                g.onAir
                  ? 'border-red-500 shadow-[0_0_12px_rgba(220,38,38,0.4)]'
                  : isSpeaking && g.connected
                  ? 'border-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                  : g.connected
                  ? 'border-emerald-500/40'
                  : 'border-border/40'
              )}>
                {/* Video */}
                <div className="aspect-video bg-black relative">
                  {g.stream ? (
                    <video
                      ref={el => { videoRefs.current[g.id] = el; }}
                      className="w-full h-full object-cover"
                      playsInline
                      autoPlay
                      muted
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-secondary/20">
                      <Camera size={20} className="text-muted-foreground/30" />
                    </div>
                  )}

                  {/* Status badge */}
                  <div className={cn(
                    'absolute top-1 left-1 px-1.5 py-0.5 rounded font-mono-console text-[7px] font-bold text-white',
                    g.onAir ? 'bg-red-600/90' : g.connected ? 'bg-emerald-600/90' : 'bg-gray-600/90'
                  )}>
                    {g.onAir ? 'ON AIR' : g.connected ? 'LIVE' : 'WAIT'}
                  </div>

                  {/* Speaking indicator */}
                  {isSpeaking && !g.muted && (
                    <div className="absolute top-1 right-1 flex gap-0.5 items-end">
                      {[3, 5, 4, 6, 3].map((h, i) => (
                        <div key={i} className="w-0.5 bg-emerald-400 rounded-full animate-pulse" style={{ height: h * 2 }} />
                      ))}
                    </div>
                  )}

                  {/* Muted indicator */}
                  {g.muted && (
                    <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-600/90 flex items-center justify-center">
                      <MicOff size={8} className="text-white" />
                    </div>
                  )}
                </div>

                {/* Guest info + controls */}
                <div className="px-1.5 py-1 bg-black/60 flex items-center gap-1">
                  <span className="font-mono-console text-[8px] font-semibold text-foreground flex-1 truncate">{g.name}</span>
                  <button onClick={() => onToggleMute(g.id)}
                    className={cn('w-5 h-5 rounded flex items-center justify-center transition-colors shrink-0',
                      g.muted ? 'bg-red-500/20 text-red-400' : 'text-muted-foreground hover:text-foreground')}>
                    {g.muted ? <MicOff size={8} /> : <Mic size={8} />}
                  </button>
                  <button onClick={() => onToggleOnAir(g.id)}
                    className={cn('w-5 h-5 rounded flex items-center justify-center transition-colors shrink-0',
                      g.onAir ? 'bg-red-500/20 text-red-400' : 'text-muted-foreground hover:text-emerald-400')}>
                    <Monitor size={8} />
                  </button>
                  <button onClick={() => onRemove(g.id)}
                    className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground/40 hover:text-red-400 transition-colors shrink-0">
                    <PhoneOff size={8} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {guestLink && (
        <div className="flex items-center gap-2 p-2 rounded-xl border border-blue-500/20 bg-blue-500/5">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
          <p className="font-mono-console text-[9px] text-muted-foreground flex-1 truncate">{guestLink}</p>
        </div>
      )}
    </div>
  );
}
