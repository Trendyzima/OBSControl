import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Radio, Mic, MicOff, Camera, CameraOff } from 'lucide-react';
import { cn } from '@/lib/utils';

// Minimal guest join page — works in any browser
// Guest opens this link, grants camera/mic, and WebRTC connects to the host via BroadcastChannel
export default function GuestPage() {
  const [params] = useSearchParams();
  const guestId = params.get('id') || '';
  const channelName = params.get('ch') || 'studio-guest-signal';

  const [name, setName] = useState('');
  const [joined, setJoined] = useState(false);
  const [connected, setConnected] = useState(false);
  const [camActive, setCamActive] = useState(false);
  const [micMuted, setMicMuted] = useState(false);
  const [error, setError] = useState('');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    if (!joined) return;

    const channel = new BroadcastChannel(channelName);
    channelRef.current = channel;

    channel.onmessage = async (e) => {
      const msg = e.data;
      if (!msg || msg.to !== guestId) return;

      if (msg.type === 'rejected') {
        setError('The host has declined your request to join.');
        setJoined(false);
        streamRef.current?.getTracks().forEach(t => t.stop());
        return;
      }

      if (msg.type === 'offer') {
        const pc = new RTCPeerConnection({
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
          ],
        });
        pcRef.current = pc;

        // Add local tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => pc.addTrack(t, streamRef.current!));
        }

        pc.onicecandidate = (e) => {
          if (e.candidate) {
            channel.postMessage({ type: 'ice', to: 'host', from: guestId, candidate: e.candidate });
          }
        };

        pc.onconnectionstatechange = () => {
          if (pc.connectionState === 'connected') setConnected(true);
          if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') setConnected(false);
        };

        await pc.setRemoteDescription({ type: 'offer', sdp: msg.sdp });
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        channel.postMessage({ type: 'answer', to: 'host', from: guestId, sdp: answer });

      } else if (msg.type === 'ice') {
        if (pcRef.current && msg.candidate) {
          await pcRef.current.addIceCandidate(msg.candidate);
        }
      }
    };

    // Notify host
    channel.postMessage({ type: 'join', from: guestId, name });

    return () => channel.close();
  }, [joined, guestId, channelName, name]);

  async function handleJoin() {
    if (!name.trim()) return;
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play().catch(() => {}); }
      setCamActive(true);
      setJoined(true);
    } catch {
      setError('Camera/microphone permission denied. Please allow access and try again.');
    }
  }

  function toggleMic() {
    if (!streamRef.current) return;
    const muted = !micMuted;
    streamRef.current.getAudioTracks().forEach(t => { t.enabled = !muted; });
    setMicMuted(muted);
  }

  function toggleCam() {
    if (!streamRef.current) return;
    const active = !camActive;
    streamRef.current.getVideoTracks().forEach(t => { t.enabled = active; });
    setCamActive(active);
  }

  return (
    <div className="min-h-screen bg-[hsl(220,25%,3%)] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-4">
        {/* Header */}
        <div className="flex flex-col items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.5)]">
            <Radio size={22} className="text-white" />
          </div>
          <div className="text-center">
            <h1 className="font-mono-console text-lg font-bold text-foreground uppercase tracking-widest">Guest Studio</h1>
            <p className="font-mono-console text-[10px] text-muted-foreground mt-0.5">Join a live broadcast as a guest</p>
          </div>
        </div>

        {!joined ? (
          <div className="space-y-3 p-5 rounded-2xl border border-border bg-secondary/10">
            <p className="font-mono-console text-[10px] text-muted-foreground text-center">
              You have been invited to join a live broadcast. Enter your name and click Join.
            </p>
            <input
              autoFocus
              type="text"
              placeholder="Your display name..."
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
              className="w-full bg-input border border-border rounded-xl px-4 py-3 font-mono-console text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-blue-500"
            />
            {error && (
              <p className="font-mono-console text-[10px] text-red-400">{error}</p>
            )}
            <button
              onClick={handleJoin}
              disabled={!name.trim()}
              className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-mono-console text-sm font-bold tracking-widest transition-all active:scale-[0.98] disabled:opacity-40"
            >
              JOIN BROADCAST
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Video preview */}
            <div className={cn(
              'relative rounded-2xl overflow-hidden border-2 aspect-video bg-black',
              connected ? 'border-emerald-500 shadow-[0_0_16px_rgba(16,185,129,0.4)]' : 'border-blue-500/50'
            )}>
              <video ref={videoRef} className="w-full h-full object-cover" playsInline muted autoPlay />
              <div className={cn(
                'absolute top-2 left-2 px-2 py-1 rounded-lg font-mono-console text-[9px] font-bold',
                connected ? 'bg-emerald-600/90 text-white' : 'bg-blue-600/90 text-white'
              )}>
                {connected ? '● CONNECTED' : '◌ CONNECTING...'}
              </div>
              {!camActive && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                  <CameraOff size={32} className="text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Status */}
            <div className="p-3 rounded-xl border border-border bg-secondary/10 text-center">
              <p className="font-mono-console text-[11px] font-semibold text-foreground">{name}</p>
              <p className="font-mono-console text-[9px] text-muted-foreground mt-0.5">
                {connected ? 'Your video is live in the broadcast' : 'Waiting for host to connect...'}
              </p>
            </div>

            {/* Controls */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={toggleMic}
                className={cn(
                  'flex items-center justify-center gap-2 py-3 rounded-xl border font-mono-console text-xs font-semibold transition-colors',
                  micMuted
                    ? 'border-red-500/50 bg-red-500/10 text-red-400'
                    : 'border-border bg-secondary/40 text-muted-foreground hover:text-foreground'
                )}
              >
                {micMuted ? <MicOff size={14} /> : <Mic size={14} />}
                {micMuted ? 'Unmute' : 'Mute'}
              </button>
              <button
                onClick={toggleCam}
                className={cn(
                  'flex items-center justify-center gap-2 py-3 rounded-xl border font-mono-console text-xs font-semibold transition-colors',
                  !camActive
                    ? 'border-red-500/50 bg-red-500/10 text-red-400'
                    : 'border-border bg-secondary/40 text-muted-foreground hover:text-foreground'
                )}
              >
                {camActive ? <Camera size={14} /> : <CameraOff size={14} />}
                {camActive ? 'Stop Video' : 'Start Video'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
