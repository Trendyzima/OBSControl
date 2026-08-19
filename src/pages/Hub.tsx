import { Link } from 'react-router-dom';
import {
  Radio, Wifi, Smartphone, Monitor, ArrowRight, CheckCircle2, Tv, Layers,
  Clock, FlipHorizontal, FolderOpen, Activity, Scissors, Captions, Users,
  BarChart2, Music, Grid, Keyboard, AudioLines, RadioTower
} from 'lucide-react';
import heroBg from '@/assets/hero-bg.jpg';

const STUDIO_FEATURES = [
  'Front & rear camera flip',
  'Preview + Program dual bus',
  'Picture-in-picture overlay',
  'Scene thumbnail capture',
  'Direct folder recording (4K)',
  'Stream health monitor',
  'Show rundown with timers',
  'Ad / sponsor manager',
  'Cut / Fade / Dissolve transitions',
  'Tally light system',
  'Chroma key (green screen)',
  'Live speech-to-text captions',
  'WebRTC guest video calls',
  'Stream analytics + CSV export',
  'News ticker & text overlays',
  'AutoDJ with playlists',
  'Multi-camera grid monitor',
  'Scene keyboard hotkeys',
  'Waveform audio visualizer',
  'Radio station panel',
  'Guest layout templates',
  'RTMP / WHIP live streaming',
];

const OBS_FEATURES = [
  'Remote scene switching',
  'Audio mixer control',
  'Stream/record buttons',
  'Scene sequencer',
  'Event log',
  'Plugin marketplace',
];

export default function Hub() {
  return (
    <div className="min-h-screen flex flex-col bg-background">

      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center opacity-15" style={{ backgroundImage: `url(${heroBg})` }} />
        <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-background/60 to-background" />
        <div className="relative z-10 flex flex-col items-center justify-center px-4 py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-600 flex items-center justify-center shadow-[0_0_40px_rgba(220,38,38,0.6)] mb-5">
            <Radio size={28} className="text-white" />
          </div>
          <h1 className="font-mono-console text-3xl sm:text-4xl font-bold tracking-wider text-foreground uppercase mb-2">
            Broadcast Studio
          </h1>
          <p className="font-mono-console text-xs text-muted-foreground max-w-sm leading-relaxed">
            Professional TV + Radio production from your phone — no hardware, no OBS required
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-2 mt-5 max-w-xl">
            {[
              { icon: Layers,         label: 'PGM/PVW Bus' },
              { icon: FlipHorizontal, label: 'Camera Flip' },
              { icon: FolderOpen,     label: '4K Folder Save' },
              { icon: Activity,       label: 'Health Monitor' },
              { icon: Clock,          label: 'Rundown Clock' },
              { icon: Tv,             label: 'Ad Manager' },
              { icon: Scissors,       label: 'Chroma Key' },
              { icon: Captions,       label: 'Live Captions' },
              { icon: Users,          label: 'Guest Calls' },
              { icon: BarChart2,      label: 'Analytics' },
              { icon: Music,          label: 'AutoDJ' },
              { icon: Grid,           label: 'Multi-Cam Grid' },
              { icon: Keyboard,       label: 'Scene Hotkeys' },
              { icon: AudioLines,     label: 'Waveform' },
              { icon: RadioTower,     label: 'Radio Station' },
            ].map(f => (
              <div key={f.label} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-secondary/40 border border-border">
                <f.icon size={10} className="text-muted-foreground" />
                <span className="font-mono-console text-[9px] text-muted-foreground">{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cards */}
      <div className="flex-1 flex flex-col items-center px-4 pb-10 gap-4 max-w-3xl mx-auto w-full">

        {/* Mobile Studio */}
        <Link
          to="/studio"
          className="w-full group relative p-5 rounded-2xl border-2 border-emerald-500/40 bg-emerald-500/5 hover:bg-emerald-500/10 hover:border-emerald-500/70 transition-all duration-200 hover:shadow-[0_0_30px_rgba(16,185,129,0.2)] active:scale-[0.99]"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <Smartphone size={22} className="text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h2 className="font-mono-console text-base font-bold text-foreground uppercase tracking-wider">Mobile Studio</h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 font-mono-console text-[8px] text-emerald-400 uppercase tracking-wider">No OBS Needed</span>
                <span className="px-2 py-0.5 rounded-full bg-primary/20 border border-primary/30 font-mono-console text-[8px] text-primary uppercase tracking-wider">Pro TV + Radio</span>
              </div>
              <p className="font-mono-console text-[10px] text-muted-foreground leading-relaxed mb-3">
                Full TV control room + Radio automation in your browser — camera, AutoDJ, guests, analytics, ads, and live streaming.
              </p>
              <div className="grid grid-cols-2 gap-1">
                {STUDIO_FEATURES.map(f => (
                  <div key={f} className="flex items-center gap-1.5">
                    <CheckCircle2 size={10} className="text-emerald-400 shrink-0" />
                    <span className="font-mono-console text-[9px] text-muted-foreground">{f}</span>
                  </div>
                ))}
              </div>
            </div>
            <ArrowRight size={18} className="text-emerald-400 shrink-0 group-hover:translate-x-1 transition-transform mt-1" />
          </div>
        </Link>

        {/* OBS Controller */}
        <Link
          to="/obs"
          className="w-full group relative p-5 rounded-2xl border-2 border-border bg-secondary/10 hover:bg-secondary/20 hover:border-primary/40 transition-all duration-200 active:scale-[0.99]"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-secondary/40 border border-border flex items-center justify-center shrink-0">
              <Monitor size={22} className="text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="font-mono-console text-base font-bold text-foreground uppercase tracking-wider">OBS Controller</h2>
                <span className="px-2 py-0.5 rounded-full bg-secondary border border-border font-mono-console text-[8px] text-muted-foreground uppercase tracking-wider">Requires OBS</span>
              </div>
              <p className="font-mono-console text-[10px] text-muted-foreground leading-relaxed mb-3">
                Use your phone as a remote control panel for OBS Studio running on a desktop over Wi-Fi via WebSocket.
              </p>
              <div className="grid grid-cols-2 gap-1">
                {OBS_FEATURES.map(f => (
                  <div key={f} className="flex items-center gap-1.5">
                    <CheckCircle2 size={10} className="text-muted-foreground/40 shrink-0" />
                    <span className="font-mono-console text-[9px] text-muted-foreground/60">{f}</span>
                  </div>
                ))}
              </div>
            </div>
            <ArrowRight size={18} className="text-muted-foreground shrink-0 group-hover:translate-x-1 transition-transform mt-1" />
          </div>
        </Link>

        {/* Tech stack */}
        <div className="w-full p-4 rounded-xl border border-border/40 bg-secondary/10">
          <p className="font-mono-console text-[8px] text-muted-foreground/40 uppercase tracking-wider mb-2.5">Mobile Studio Technology</p>
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'getUserMedia', desc: '4K Camera + Mic' },
              { label: 'Canvas API', desc: 'Scene compositor' },
              { label: 'Web Audio API', desc: 'Audio mixer + DJ' },
              { label: 'MediaRecorder', desc: '4K encoder' },
              { label: 'File System API', desc: 'Folder save' },
              { label: 'WHIP/WebRTC', desc: 'Live stream' },
              { label: 'SpeechRecognition', desc: 'Live captions' },
              { label: 'BroadcastChannel', desc: 'Guest signaling' },
              { label: 'ImageData API', desc: 'Chroma key' },
              { label: 'Web Audio Analyser', desc: 'Waveform + VU' },
              { label: 'MediaElement API', desc: 'AutoDJ playback' },
            ].map(item => (
              <div key={item.label} className="px-2.5 py-1.5 rounded-lg bg-secondary border border-border">
                <p className="font-mono-console text-[9px] text-foreground">{item.label}</p>
                <p className="font-mono-console text-[7px] text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
