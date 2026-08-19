import { useState, useRef, useEffect, useCallback } from 'react';
import { Users, Copy, PhoneOff, Mic, MicOff, Video, VideoOff, Link2 } from 'lucide-react';
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
}

interface GuestCallPanelProps {
  onGuestStream: (stream: MediaStream | null, guestId: string) => void;
}

// Simple signaling via BroadcastChannel (same origin / same browser tab for demo)
// In production: replace with a WebSocket signaling server
const CHANNEL_NAME = 'studio-guest-signal';

function makeGuestId() {
  return `g-${Math.random().toString(36).slice(2, 9)}`;
}

export default function GuestCallPanel({ onGuestStream }: GuestCallPanelProps) {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [guestLink, setGuestLink] = useState('');
  const [pendingGuestId, setPendingGuestId] = useState<string | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const guestsRef = useRef<Guest[]>([]);
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});

  guestsRef.current = guests;

  const createGuestLink = useCallback(() => {
    const guestId = makeGuestId();
    const link = `${window.location.origin}/guest?id=${guestId}&ch=${CHANNEL_NAME}`;
    setGuestLink(link);
    setPendingGuestId(guestId);
    toast.success('Guest link created — share it with your guest');
    return guestId;
  }, []);

  const copyLink = useCallback(() => {
    if (guestLink) {
      navigator.clipboard.writeText(guestLink).then(() => toast.success('Link copied'));
    }
  }, [guestLink]);

  const createPeerConnection = useCallback((guestId: string, name: string): RTCPeerConnection => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    });

    pc.ontrack = (e) => {
      const stream = e.streams[0];
      setGuests(prev => prev.map(g =>
        g.id === guestId ? { ...g, stream, connected: true } : g
      ));
      onGuestStream(stream, guestId);
      const videoEl = videoRefs.current[guestId];
      if (videoEl) {
        videoEl.srcObject = stream;
        videoEl.play().catch(() => {});
      }
      toast.success(`${name} connected!`);
    };

    pc.onicecandidate = (e) => {
      if (e.candidate && channelRef.current) {
        channelRef.current.postMessage({
          type: 'ice',
          to: guestId,
          candidate: e.candidate,
        });
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        setGuests(prev => prev.map(g =>
          g.id === guestId ? { ...g, connected: false, stream: null } : g
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
        // Guest requesting to join
        const guestId = msg.from;
        const name = msg.name || `Guest ${guests.length + 1}`;

        const pc = createPeerConnection(guestId, name);
        const newGuest: Guest = {
          id: guestId, name, stream: null, pc, connected: false, muted: false, volume: 100
        };

        setGuests(prev => [...prev.filter(g => g.id !== guestId), newGuest]);

        // Create offer
        const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
        await pc.setLocalDescription(offer);
        channel.postMessage({ type: 'offer', to: guestId, from: 'host', sdp: offer });

      } else if (msg.type === 'answer' && msg.to === 'host') {
        // Guest answered our offer
        const guest = guestsRef.current.find(g => g.id === msg.from);
        if (guest) {
          await guest.pc.setRemoteDescription({ type: 'answer', sdp: msg.sdp });
        }

      } else if (msg.type === 'ice' && msg.to === 'host') {
        const guest = guestsRef.current.find(g => g.id === msg.from);
        if (guest && msg.candidate) {
          await guest.pc.addIceCandidate(msg.candidate);
        }
      }
    };

    return () => channel.close();
  }, [createPeerConnection, guests.length]);

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
      if (g.stream) {
        g.stream.getAudioTracks().forEach(t => { t.enabled = !muted; });
      }
      const vid = videoRefs.current[guestId];
      if (vid) vid.muted = muted;
      return { ...g, muted };
    }));
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-mono-console text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
          <Users size={11} /> Guest Calls
        </h3>
        <span className="font-mono-console text-[9px] text-muted-foreground">{guests.filter(g => g.connected).length} live</span>
      </div>

      {/* Create guest link */}
      <div className="space-y-2">
        <button
          onClick={createGuestLink}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10 text-blue-400 font-mono-console text-xs transition-colors"
        >
          <Link2 size={13} /> Generate Guest Link
        </button>

        {guestLink && (
          <div className="flex items-center gap-2 p-2.5 rounded-xl border border-border bg-secondary/20">
            <p className="flex-1 font-mono-console text-[9px] text-muted-foreground truncate">{guestLink}</p>
            <button onClick={copyLink} className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors">
              <Copy size={11} />
            </button>
          </div>
        )}

        {pendingGuestId && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/8 border border-amber-500/20">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
            <span className="font-mono-console text-[9px] text-amber-400">Waiting for guest to join...</span>
          </div>
        )}
      </div>

      {/* Connected guests */}
      {guests.length > 0 && (
        <div className="space-y-2">
          <p className="font-mono-console text-[9px] text-muted-foreground/50 uppercase tracking-wider">Connected Guests</p>
          {guests.map(guest => (
            <div key={guest.id} className={cn(
              'p-2.5 rounded-xl border space-y-2 transition-all',
              guest.connected ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-border bg-secondary/10'
            )}>
              <div className="flex items-center gap-2">
                <div className={cn('w-2 h-2 rounded-full shrink-0', guest.connected ? 'bg-emerald-400 animate-pulse' : 'bg-muted-foreground/30')} />
                <span className="font-mono-console text-[11px] flex-1 font-semibold">{guest.name}</span>
                <span className="font-mono-console text-[9px] text-muted-foreground">{guest.connected ? 'Connected' : 'Connecting...'}</span>
                <button onClick={() => toggleGuestMute(guest.id)}
                  className={cn('w-6 h-6 flex items-center justify-center rounded border transition-colors',
                    guest.muted ? 'border-red-500/40 bg-red-500/10 text-red-400' : 'border-border text-muted-foreground hover:text-foreground'
                  )}>
                  {guest.muted ? <MicOff size={10} /> : <Mic size={10} />}
                </button>
                <button onClick={() => removeGuest(guest.id)}
                  className="w-6 h-6 flex items-center justify-center rounded border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors">
                  <PhoneOff size={10} />
                </button>
              </div>

              {/* Guest video preview */}
              {guest.stream && (
                <video
                  ref={el => { videoRefs.current[guest.id] = el; if (el && guest.stream) { el.srcObject = guest.stream; el.play().catch(() => {}); } }}
                  className="w-full rounded-lg aspect-video object-cover bg-black"
                  playsInline
                  muted={guest.muted}
                  autoPlay
                />
              )}
            </div>
          ))}
        </div>
      )}

      <div className="p-3 rounded-xl border border-border/40 bg-secondary/5">
        <p className="font-mono-console text-[9px] text-muted-foreground/60 leading-relaxed">
          Guest joins via browser link — no app install needed. Video composited directly onto program canvas as PiP or scene source. Works on same network or via TURN relay.
        </p>
      </div>
    </div>
  );
}
