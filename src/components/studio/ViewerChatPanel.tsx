import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Pin, Eye, EyeOff, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ChatMessage {
  id: string;
  platform: 'youtube' | 'twitch' | 'facebook' | 'custom';
  author: string;
  text: string;
  timestamp: number;
  pinned: boolean;
  color?: string;
}

interface ViewerChatPanelProps {
  onPinMessage: (msg: ChatMessage) => void;
  pinnedMessage: ChatMessage | null;
  onUnpin: () => void;
}

const PLATFORMS = [
  { id: 'youtube' as const, label: 'YouTube', color: 'text-red-400', embedUrl: (channelId: string) => `https://www.youtube.com/live_chat?v=${channelId}&embed_domain=${window.location.hostname}` },
  { id: 'twitch' as const, label: 'Twitch', color: 'text-purple-400', embedUrl: (channel: string) => `https://www.twitch.tv/embed/${channel}/chat?parent=${window.location.hostname}&darkpopout` },
];

// Demo messages for testing
const DEMO_MESSAGES: ChatMessage[] = [
  { id: '1', platform: 'youtube', author: 'John_Live', text: 'Great stream! Love the setup 🔥', timestamp: Date.now() - 30000, pinned: false, color: '#ff6b6b' },
  { id: '2', platform: 'youtube', author: 'TechFan99', text: 'Can you show the camera setup?', timestamp: Date.now() - 25000, pinned: false },
  { id: '3', platform: 'twitch', author: 'StreamWatcher', text: 'PogChamp the quality is amazing', timestamp: Date.now() - 20000, pinned: false, color: '#9d4edd' },
  { id: '4', platform: 'youtube', author: 'Supporter_2024', text: 'Subscribed! Keep it up! 💪', timestamp: Date.now() - 15000, pinned: false },
  { id: '5', platform: 'youtube', author: 'NewsViewer', text: 'What topic are we covering today?', timestamp: Date.now() - 10000, pinned: false },
];

export default function ViewerChatPanel({ onPinMessage, pinnedMessage, onUnpin }: ViewerChatPanelProps) {
  const [tab, setTab] = useState<'embed' | 'overlay'>('embed');
  const [platform, setPlatform] = useState<'youtube' | 'twitch'>('youtube');
  const [channelId, setChannelId] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>(DEMO_MESSAGES);
  const [overlayEnabled, setOverlayEnabled] = useState(false);
  const [showDemoChat, setShowDemoChat] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const platformConfig = PLATFORMS.find(p => p.id === platform)!;

  // Auto-scroll demo chat
  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  // Simulate incoming messages
  useEffect(() => {
    if (!showDemoChat) return;
    const names = ['Viewer_7', 'BroadcastFan', 'LiveWatcher', 'Chat_Pro', 'StreamerX'];
    const texts = ['🔥 Great content!', 'Love this!', 'How do you do this?', '👏👏', 'First time here, amazing!'];
    const interval = setInterval(() => {
      const msg: ChatMessage = {
        id: `msg-${Date.now()}`,
        platform: Math.random() > 0.5 ? 'youtube' : 'twitch',
        author: names[Math.floor(Math.random() * names.length)],
        text: texts[Math.floor(Math.random() * texts.length)],
        timestamp: Date.now(),
        pinned: false,
      };
      setMessages(prev => [...prev.slice(-50), msg]);
    }, 3000 + Math.random() * 4000);
    return () => clearInterval(interval);
  }, [showDemoChat]);

  const PLATFORM_COLORS: Record<string, string> = {
    youtube: 'text-red-400',
    twitch: 'text-purple-400',
    facebook: 'text-blue-400',
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-mono-console text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
          <MessageSquare size={11} /> Viewer Chat
        </h3>
        <button onClick={() => setOverlayEnabled(v => !v)}
          className={cn('flex items-center gap-1 px-2 py-1 rounded-lg border font-mono-console text-[9px] transition-colors',
            overlayEnabled ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400' : 'border-border text-muted-foreground')}>
          {overlayEnabled ? <Eye size={9} /> : <EyeOff size={9} />}
          {overlayEnabled ? 'Overlay ON' : 'Overlay OFF'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl overflow-hidden border border-border">
        {(['embed', 'overlay'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={cn('flex-1 py-2 font-mono-console text-[9px] uppercase tracking-wider transition-colors',
              tab === t ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground')}>
            {t === 'embed' ? 'Live Chat' : 'Chat Overlay'}
          </button>
        ))}
      </div>

      {tab === 'embed' && (
        <div className="space-y-2">
          {/* Platform */}
          <div className="flex gap-1">
            {PLATFORMS.map(p => (
              <button key={p.id} onClick={() => setPlatform(p.id)}
                className={cn('flex-1 py-1.5 rounded-lg border font-mono-console text-[9px] transition-colors',
                  platform === p.id ? `border-current ${p.color} bg-current/10` : 'border-border text-muted-foreground')}>
                {p.label}
              </button>
            ))}
          </div>

          <input type="text" value={channelId} onChange={e => setChannelId(e.target.value)}
            placeholder={platform === 'youtube' ? 'Video ID (e.g. dQw4w9WgXcQ)' : 'Channel name'}
            className="w-full bg-input border border-border rounded-lg px-3 py-2 font-mono-console text-[10px] text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary" />

          {channelId && (
            <div className="rounded-xl overflow-hidden border border-border" style={{ height: 280 }}>
              <iframe
                src={platformConfig.embedUrl(channelId)}
                width="100%"
                height="100%"
                frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                title="Live Chat"
                className="block"
              />
            </div>
          )}

          {!channelId && (
            <div className="p-3 rounded-xl border border-border bg-secondary/10">
              <p className="font-mono-console text-[9px] text-muted-foreground/60 leading-relaxed">
                Enter your {platformConfig.label} {platform === 'youtube' ? 'video ID' : 'channel name'} above to embed the live chat. 
                Chat will appear inside this panel during your broadcast.
              </p>
              {/* Demo chat toggle */}
              <button onClick={() => setShowDemoChat(v => !v)}
                className={cn('mt-2 w-full py-1.5 rounded-lg border font-mono-console text-[9px] transition-colors',
                  showDemoChat ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5' : 'border-border text-muted-foreground')}>
                {showDemoChat ? 'Stop demo' : 'Preview with demo chat'}
              </button>
            </div>
          )}

          {/* Demo chat view */}
          {showDemoChat && (
            <div ref={chatRef} className="max-h-48 overflow-y-auto space-y-1.5 no-scrollbar p-2 rounded-xl border border-border bg-black/30">
              {messages.map(msg => (
                <div key={msg.id} className="flex items-start gap-2 group">
                  <div className="flex-1 min-w-0">
                    <span className={cn('font-mono-console text-[9px] font-bold mr-1', PLATFORM_COLORS[msg.platform] || 'text-muted-foreground')}
                      style={msg.color ? { color: msg.color } : {}}>
                      {msg.author}:
                    </span>
                    <span className="font-mono-console text-[10px] text-foreground">{msg.text}</span>
                  </div>
                  <button onClick={() => onPinMessage(msg)}
                    className="w-5 h-5 hidden group-hover:flex items-center justify-center rounded text-muted-foreground/40 hover:text-amber-400 transition-colors shrink-0">
                    <Pin size={9} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'overlay' && (
        <div className="space-y-3">
          {pinnedMessage ? (
            <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono-console text-[9px] text-amber-400 flex items-center gap-1"><Pin size={9} /> Pinned on canvas</span>
                <button onClick={onUnpin} className="font-mono-console text-[9px] text-muted-foreground hover:text-red-400">Unpin</button>
              </div>
              <div>
                <p className="font-mono-console text-[10px] font-bold text-foreground">{pinnedMessage.author}</p>
                <p className="font-mono-console text-[10px] text-muted-foreground">{pinnedMessage.text}</p>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl border border-border bg-secondary/10">
              <p className="font-mono-console text-[9px] text-muted-foreground/60 leading-relaxed">
                Pin a chat message to display it on the program canvas as a comment overlay for 10 seconds.
                Switch to Live Chat tab → hover a message → click the pin icon.
              </p>
            </div>
          )}

          <div className={cn(
            'p-3 rounded-xl border transition-all',
            overlayEnabled ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-border bg-secondary/10'
          )}>
            <p className="font-mono-console text-[9px] text-muted-foreground/60 leading-relaxed">
              Chat overlay shows the latest messages as a scrolling strip at the bottom of the program canvas. Toggle using the button above.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
