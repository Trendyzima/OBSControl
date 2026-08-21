import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Users, Copy, PhoneOff, Mic, MicOff, Link2, UserPlus,
  Clock, CheckCircle, XCircle, AlertCircle, Video
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Guest {
  id: string;
  name: string;
  stream: MediaStream | null;
  pc: RTCPeerConnection;
  connected: boolean;
  muted: boolean;
  volume: number;
  status: 'waiting' | 'preview' | 'onair' | 'disconnected';
  joinedAt: number;
}

interface GuestCallPanelProps {
  onGuestStream: (stream: MediaStream | null, guestId: string) => void;
}

const CHANNEL_NAME = 'studio-guest-signal';

function makeGuestId() {
  return `g-${Math.random().toString(36).slice(2, 9)}`;
}

export default function GuestCallPanel({ onGuestStream }: GuestCallPanelProps) {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [guestLink, setGuestLink] = useState('');
  const [pendingGuestId, setPendingGuestId] = useState<string | null>(null);
  const [tab, setTab] = useState<'connected' | 'waiting'>('connected');
  const channelRef = useRef<BroadcastChannel | null>(null);
  const guestsRef = useRef<Guest[]>([]);
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});

  guestsRef.current = guests;

  const createGuestLink = useCallback(() => {
    const guestId = makeGuestId();
    const link = `${window.location.origin}/guest?id=${guestId}&ch=${CHANNEL_NAME}`;
    setGuestLink(link);
    setPendingGuestId(guestId);
    navigator.clipboard?.writeText(link).then(() => toast.success('Guest link copied to clipboard')).catch(() => toast.success('Guest link created'));
    return guestId;
  }, []);

  const copyLink = useCallback(() => {
    if (guestLink) navigator.clipboard.writeText(guestLink).then(() => toast.success('Link copied'));
  }, [guestLink]);

  const createPeerConnection = useCallback((guestId: string, name: string): RTCPeerConnection => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
      ],
    });

    pc.ontrack = (e) => {
      const stream = e.streams[0];
      setGuests(prev => prev.map(g =>
        g.id === guestId ? { ...g, stream, connected: true, status: 'preview' } : g
      ));
      const videoEl = videoRefs.current[guestId];
      if (videoEl) {
        videoEl.srcObject = stream;
        videoEl.play().catch(() => {});
      }
      toast.success(`${name} connected — in waiting room`);
    };

    pc.onicecandidate = (e) => {
      if (e.candidate && channelRef.current) {
        channelRef.current.postMessage({ type: 'ice', to: guestId, candidate: e.candidate });
      }
    };

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      if (state === 'disconnected' || state === 'failed') {
        setGuests(prev => prev.map(g =>
          g.id === guestId ? { ...g, connected: false, stream: null, status: 'disconnected' } : g
        ));
        onGuestStream(null, guestId);
        toast(`Guest ${name} disconnected`);
      }
    };

    return pc;
  }, [onGuestStream]);

  useEffect(() => {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channelRef.current = channel;

    channel.onmessage = async (e) => {
      const msg = e.data;
      if (!msg) return;

      if (msg.type === 'join') {
        const guestId = msg.from;
        const name = msg.name || `Guest ${guestsRef.current.length + 1}`;
        // Add to waiting room first
        const pc = createPeerConnection(guestId, name);
        const newGuest: Guest = {
          id: guestId, name, stream: null, pc, connected: false, muted: false,
          volume: 100, status: 'waiting', joinedAt: Date.now()
        };
        setGuests(prev => [...prev.filter(g => g.id !== guestId), newGuest]);
        setTab('waiting');
        // Send offer
        const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
        await pc.setLocalDescription(offer);
        channel.postMessage({ type: 'offer', to: guestId, from: 'host', sdp: offer });

      } else if (msg.type === 'answer' && msg.to === 'host') {
        const guest = guestsRef.current.find(g => g.id === msg.from);
        if (guest) await guest.pc.setRemoteDescription({ type: 'answer', sdp: msg.sdp });

      } else if (msg.type === 'ice' && msg.to === 'host') {
        const guest = guestsRef.current.find(g => g.id === msg.from);
        if (guest && msg.candidate) await guest.pc.addIceCandidate(msg.candidate);
      }
    };

    return () => channel.close();
  }, [createPeerConnection]);

  function admitGuest(guestId: string) {
    setGuests(prev => prev.map(g => {
      if (g.id !== guestId) return g;
      if (g.stream) onGuestStream(g.stream, guestId);
      return { ...g, status: 'preview' };
    }));
    setTab('connected');
    toast.success('Guest admitted to preview');
  }

  function putOnAir(guestId: string) {
    setGuests(prev => prev.map(g => {
      if (g.id !== guestId) return g;
      if (g.stream) onGuestStream(g.stream, guestId);
      return { ...g, status: 'onair' };
    }));
    toast.success('Guest is now ON AIR');
  }

  function removeFromAir(guestId: string) {
    setGuests(prev => prev.map(g =>
      g.id === guestId ? { ...g, status: 'preview' } : g
    ));
    onGuestStream(null, guestId);
  }

  function rejectGuest(guestId: string) {
    const guest = guests.find(g => g.id === guestId);
    if (guest) {
      guest.pc.close();
      guest.stream?.getTracks().forEach(t => t.stop());
    }
    setGuests(prev => prev.filter(g => g.id !== guestId));
    channelRef.current?.postMessage({ type: 'rejected', to: guestId });
    toast('Guest rejected');
  }

  function removeGuest(guestId: string) {
    const guest = guests.find(g => g.id === guestId);
    if (guest) {
      guest.pc.close();
      guest.stream?.getTracks().forEach(t => t.stop());
    }
    setGuests(prev => prev.filter(g => g.id !== guestId));
    onGuestStream(null, guestId);
    if (pendingGuestId === guestId) setPendingGuestId(null);
  }

  function toggleGuestMute(guestId: string) {
    setGuests(prev => prev.map(g => {
      if (g.id !== guestId) return g;
      const muted = !g.muted;
      g.stream?.getAudioTracks().forEach(t => { t.enabled = !muted; });
      const vid = videoRefs.current[guestId];
      if (vid) vid.muted = muted;
      return { ...g, muted };
    }));
  }

  const waitingGuests = guests.filter(g => g.status === 'waiting');
  const activeGuests = guests.filter(g => g.status === 'preview' || g.status === 'onair');

  const STATUS_CONFIG = {
    waiting: { color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', label: 'WAITING', dot: 'bg-amber-400' },
    preview: { color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', label: 'PREVIEW', dot: 'bg-emerald-400' },
    onair: { color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30', label: 'ON AIR', dot: 'bg-red-500 animate-pulse' },
    disconnected: { color: 'text-muted-foreground', bg: 'bg-secondary/20 border-border', label: 'OFF', dot: 'bg-muted-foreground/30' },
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-mono-console text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
          <Users size={11} /> Guest Studio
        </h3>
        <div className="flex items-center gap-1.5">
          {waitingGuests.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 font-mono-console text-[8px] text-amber-400 font-bold">
              {waitingGuests.length} waiting
            </span>
          )}
          <span className="font-mono-console text-[9px] text-muted-foreground">
            {activeGuests.filter(g => g.connected).length} live
          </span>
        </div>
      </div>

      {/* Generate link */}
      <button onClick={createGuestLink}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10 text-blue-400 font-mono-console text-xs transition-colors">
        <UserPlus size={13} /> Generate Guest Link
      </button>

      {guestLink && (
        <div className="flex items-center gap-2 p-2.5 rounded-xl border border-border bg-secondary/20">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
          <p className="flex-1 font-mono-console text-[9px] text-muted-foreground truncate">{guestLink}</p>
          <button onClick={copyLink}
            className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors">
            <Copy size={11} />
          </button>
        </div>
      )}

      {/* Tabs */}
      {guests.length > 0 && (
        <div className="flex rounded-xl overflow-hidden border border-border">
          <button onClick={() => setTab('connected')}
            className={cn('flex-1 py-2 font-mono-console text-[9px] uppercase tracking-wider transition-colors relative',
              tab === 'connected' ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground')}>
            Connected ({activeGuests.length})
          </button>
          <button onClick={() => setTab('waiting')}
            className={cn('flex-1 py-2 font-mono-console text-[9px] uppercase tracking-wider transition-colors relative',
              tab === 'waiting' ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground')}>
            Waiting {waitingGuests.length > 0 && (
              <span className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-500 text-white text-[7px] font-bold">
                {waitingGuests.length}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Waiting room */}
      {tab === 'waiting' && (
        <div className="space-y-2">
          {waitingGuests.length === 0 ? (
            <div className="text-center py-6 space-y-1">
              <Clock size={24} className="mx-auto text-muted-foreground/20" />
              <p className="font-mono-console text-[10px] text-muted-foreground/40">No guests waiting</p>
            </div>
          ) : waitingGuests.map(guest => (
            <div key={guest.id} className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
                <span className="font-mono-console text-xs font-semibold text-foreground flex-1">{guest.name}</span>
                <span className="font-mono-console text-[8px] text-amber-400">wants to join</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button onClick={() => admitGuest(guest.id)}
                  className="flex items-center justify-center gap-1.5 py-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 font-mono-console text-[9px] font-bold hover:bg-emerald-500/20 transition-colors">
                  <CheckCircle size={11} /> Admit
                </button>
                <button onClick={() => rejectGuest(guest.id)}
                  className="flex items-center justify-center gap-1.5 py-2 rounded-xl border border-red-500/30 bg-red-500/5 text-red-400 font-mono-console text-[9px] hover:bg-red-500/10 transition-colors">
                  <XCircle size={11} /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Connected guests */}
      {tab === 'connected' && (
        <div className="space-y-2">
          {activeGuests.length === 0 ? (
            <div className="text-center py-6 space-y-1">
              <Video size={24} className="mx-auto text-muted-foreground/20" />
              <p className="font-mono-console text-[10px] text-muted-foreground/40">No active guests</p>
              <p className="font-mono-console text-[9px] text-muted-foreground/30">Admit guests from the Waiting tab</p>
            </div>
          ) : activeGuests.map(guest => {
            const cfg = STATUS_CONFIG[guest.status];
            return (
              <div key={guest.id} className={cn('p-2.5 rounded-xl border space-y-2 transition-all', cfg.bg)}>
                <div className="flex items-center gap-2">
                  <div className={cn('w-2 h-2 rounded-full shrink-0', cfg.dot)} />
                  <span className="font-mono-console text-[11px] flex-1 font-semibold truncate">{guest.name}</span>
                  <span className={cn('font-mono-console text-[8px] font-bold px-1.5 py-0.5 rounded', cfg.color)}>{cfg.label}</span>
                  <button onClick={() => toggleGuestMute(guest.id)}
                    className={cn('w-6 h-6 flex items-center justify-center rounded border transition-colors',
                      guest.muted ? 'border-red-500/40 bg-red-500/10 text-red-400' : 'border-border text-muted-foreground hover:text-foreground')}>
                    {guest.muted ? <MicOff size={10} /> : <Mic size={10} />}
                  </button>
                  <button onClick={() => removeGuest(guest.id)}
                    className="w-6 h-6 flex items-center justify-center rounded border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors">
                    <PhoneOff size={10} />
                  </button>
                </div>

                {/* Video preview */}
                {guest.stream && (
                  <video
                    ref={el => {
                      videoRefs.current[guest.id] = el;
                      if (el && guest.stream) { el.srcObject = guest.stream; el.play().catch(() => {}); }
                    }}
                    className="w-full rounded-lg aspect-video object-cover bg-black"
                    playsInline muted={guest.muted} autoPlay
                  />
                )}

                {/* On air controls */}
                <div className="flex gap-1.5">
                  {guest.status === 'preview' ? (
                    <button onClick={() => putOnAir(guest.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg border-2 border-red-500/50 bg-red-500/10 text-red-400 font-mono-console text-[9px] font-bold hover:bg-red-500/20 transition-colors">
                      🔴 PUT ON AIR
                    </button>
                  ) : guest.status === 'onair' ? (
                    <button onClick={() => removeFromAir(guest.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-border text-muted-foreground font-mono-console text-[9px] hover:text-foreground transition-colors">
                      Remove from Air
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info */}
      <div className="p-2.5 rounded-xl border border-border/40 bg-secondary/5">
        <div className="flex items-start gap-2">
          <AlertCircle size={11} className="text-muted-foreground/50 mt-0.5 shrink-0" />
          <p className="font-mono-console text-[9px] text-muted-foreground/60 leading-relaxed">
            Guests join via browser link — no app needed. They enter the waiting room; you admit or reject each one. Guest video composites onto the canvas automatically.
          </p>
        </div>
      </div>
    </div>
  );
}
