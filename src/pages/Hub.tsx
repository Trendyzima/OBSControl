import { Link } from 'react-router-dom';
import { Radio, Wifi, Smartphone, Monitor, ArrowRight, CheckCircle2 } from 'lucide-react';
import heroBg from '@/assets/hero-bg.jpg';

export default function Hub() {
  return (
    <div className="min-h-screen flex flex-col bg-background">

      {/* Hero */}
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${heroBg})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/60 to-background" />

        <div className="relative z-10 flex flex-col items-center justify-center px-4 py-20 text-center">
          {/* Logo */}
          <div className="w-16 h-16 rounded-2xl bg-red-600 flex items-center justify-center shadow-[0_0_40px_rgba(220,38,38,0.6)] mb-6">
            <Radio size={28} className="text-white" />
          </div>
          <h1 className="font-mono-console text-3xl sm:text-4xl font-bold tracking-wider text-foreground uppercase mb-3">
            Broadcast Studio
          </h1>
          <p className="font-mono-console text-sm text-muted-foreground max-w-md leading-relaxed">
            Professional live streaming from your phone or desktop — no hardware required
          </p>
        </div>
      </div>

      {/* Cards */}
      <div className="flex-1 flex flex-col items-center px-4 pb-12 gap-4 max-w-3xl mx-auto w-full">

        {/* Mobile Studio card */}
        <Link
          to="/studio"
          className="w-full group relative p-6 rounded-2xl border-2 border-emerald-500/40 bg-emerald-500/5 hover:bg-emerald-500/10 hover:border-emerald-500/70 transition-all duration-200 hover:shadow-[0_0_30px_rgba(16,185,129,0.2)] active:scale-[0.99]"
        >
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <Smartphone size={24} className="text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="font-mono-console text-lg font-bold text-foreground uppercase tracking-wider">Mobile Studio</h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 font-mono-console text-[9px] text-emerald-400 uppercase tracking-wider">No OBS</span>
              </div>
              <p className="font-mono-console text-xs text-muted-foreground leading-relaxed mb-4">
                Your phone IS the broadcast engine. Camera, microphone, video playback, scene switching, audio mixing and streaming — all built-in.
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  'Phone camera capture',
                  'Built-in mic mixing',
                  'Scene switcher',
                  'Text overlays',
                  'Video/image playback',
                  'Record or stream live',
                ].map(f => (
                  <div key={f} className="flex items-center gap-1.5">
                    <CheckCircle2 size={11} className="text-emerald-400 shrink-0" />
                    <span className="font-mono-console text-[10px] text-muted-foreground">{f}</span>
                  </div>
                ))}
              </div>
            </div>
            <ArrowRight size={20} className="text-emerald-400 shrink-0 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* OBS Controller card */}
        <Link
          to="/obs"
          className="w-full group relative p-6 rounded-2xl border-2 border-border bg-secondary/10 hover:bg-secondary/20 hover:border-primary/40 transition-all duration-200 hover:shadow-[0_0_30px_rgba(220,38,38,0.1)] active:scale-[0.99]"
        >
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-secondary/40 border border-border flex items-center justify-center shrink-0">
              <Monitor size={24} className="text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="font-mono-console text-lg font-bold text-foreground uppercase tracking-wider">OBS Controller</h2>
                <span className="px-2 py-0.5 rounded-full bg-secondary border border-border font-mono-console text-[9px] text-muted-foreground uppercase tracking-wider">Requires OBS</span>
              </div>
              <p className="font-mono-console text-xs text-muted-foreground leading-relaxed mb-4">
                Use your phone as a remote control panel for OBS Studio running on a computer over Wi-Fi via WebSocket.
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  'Remote scene switching',
                  'Audio mixer control',
                  'Stream/record buttons',
                  'Scene sequencer',
                  'Event log',
                  'Plugin marketplace',
                ].map(f => (
                  <div key={f} className="flex items-center gap-1.5">
                    <CheckCircle2 size={11} className="text-muted-foreground/50 shrink-0" />
                    <span className="font-mono-console text-[10px] text-muted-foreground/70">{f}</span>
                  </div>
                ))}
              </div>
            </div>
            <ArrowRight size={20} className="text-muted-foreground shrink-0 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Tech stack note */}
        <div className="w-full p-4 rounded-xl border border-border/50 bg-secondary/10">
          <p className="font-mono-console text-[9px] text-muted-foreground/50 uppercase tracking-wider mb-2">Mobile Studio — How it works</p>
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'getUserMedia', desc: 'Camera + Mic' },
              { label: 'Canvas API', desc: 'Scene compositor' },
              { label: 'Web Audio', desc: 'Audio mixer' },
              { label: 'MediaRecorder', desc: 'Encoder' },
              { label: 'WHIP', desc: 'WebRTC live ingest' },
            ].map(item => (
              <div key={item.label} className="px-2.5 py-1.5 rounded-lg bg-secondary border border-border">
                <p className="font-mono-console text-[10px] text-foreground">{item.label}</p>
                <p className="font-mono-console text-[8px] text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
