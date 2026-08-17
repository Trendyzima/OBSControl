import { useState } from 'react';
import { MessageSquare, Settings, ExternalLink, X, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type ChatPlatform = 'youtube' | 'twitch' | 'facebook';

const PLATFORM_META: Record<ChatPlatform, { label: string; color: string; buildUrl: (id: string) => string; placeholder: string }> = {
  youtube: {
    label: 'YouTube',
    color: 'text-red-500',
    buildUrl: (id) => `https://www.youtube.com/live_chat?v=${id}&embed_domain=${window.location.hostname}`,
    placeholder: 'YouTube Video ID (e.g. dQw4w9WgXcQ)',
  },
  twitch: {
    label: 'Twitch',
    color: 'text-purple-400',
    buildUrl: (id) => `https://www.twitch.tv/embed/${id}/chat?parent=${window.location.hostname}&darkpopout`,
    placeholder: 'Twitch channel name (e.g. shroud)',
  },
  facebook: {
    label: 'Facebook',
    color: 'text-blue-500',
    buildUrl: (id) => `https://www.facebook.com/plugins/video.php?href=https://www.facebook.com/${id}&show_captions=false`,
    placeholder: 'Facebook Page/Video ID',
  },
};

interface ChatOverlayProps {
  disabled?: boolean;
}

export default function ChatOverlay({ disabled }: ChatOverlayProps) {
  const [collapsed, setCollapsed] = useState(true);
  const [platform, setPlatform] = useState<ChatPlatform>('youtube');
  const [channelId, setChannelId] = useState('');
  const [activeUrl, setActiveUrl] = useState('');
  const [showConfig, setShowConfig] = useState(false);
  const [inputVal, setInputVal] = useState('');

  function activate() {
    if (!inputVal.trim()) return;
    const meta = PLATFORM_META[platform];
    setChannelId(inputVal.trim());
    setActiveUrl(meta.buildUrl(inputVal.trim()));
    setShowConfig(false);
  }

  function disconnect() {
    setActiveUrl('');
    setChannelId('');
    setInputVal('');
  }

  return (
    <div className={cn('border border-border rounded-xl bg-[hsl(var(--card))] overflow-hidden flex flex-col', !collapsed && 'h-[420px]')}>
      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 h-10 border-b border-border cursor-pointer shrink-0"
        onClick={() => setCollapsed(v => !v)}
      >
        <ChevronRight size={13} className={cn('text-muted-foreground transition-transform', !collapsed && 'rotate-90')} />
        <MessageSquare size={12} className="text-muted-foreground" />
        <span className="font-mono-console text-[10px] uppercase tracking-widest text-muted-foreground flex-1">
          Live Chat
        </span>
        {channelId && (
          <span className={cn('font-mono-console text-[9px]', PLATFORM_META[platform].color)}>
            {PLATFORM_META[platform].label} · {channelId}
          </span>
        )}
        {activeUrl && (
          <button
            onClick={e => { e.stopPropagation(); window.open(activeUrl, '_blank'); }}
            className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-foreground"
          >
            <ExternalLink size={11} />
          </button>
        )}
        <button
          onClick={e => { e.stopPropagation(); setShowConfig(v => !v); }}
          className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-foreground"
        >
          <Settings size={11} />
        </button>
      </div>

      {!collapsed && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Config bar */}
          {(showConfig || !activeUrl) && (
            <div className="p-3 border-b border-border space-y-2 shrink-0">
              <div className="flex gap-1">
                {(Object.keys(PLATFORM_META) as ChatPlatform[]).map(p => (
                  <button
                    key={p}
                    onClick={() => { setPlatform(p); setActiveUrl(''); setChannelId(''); }}
                    className={cn(
                      'px-2.5 py-1 rounded text-[10px] font-mono-console transition-colors',
                      platform === p ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {PLATFORM_META[p].label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputVal}
                  onChange={e => setInputVal(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && activate()}
                  placeholder={PLATFORM_META[platform].placeholder}
                  className="flex-1 bg-input border border-border rounded px-2.5 py-1.5 font-mono-console text-[10px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary"
                />
                <button
                  onClick={activate}
                  disabled={!inputVal.trim()}
                  className="px-3 py-1.5 rounded bg-[hsl(var(--live-red))] text-white font-mono-console text-[10px] hover:bg-red-700 disabled:opacity-40 transition-colors"
                >
                  Load
                </button>
                {activeUrl && (
                  <button onClick={disconnect} className="w-8 flex items-center justify-center text-muted-foreground hover:text-red-400 transition-colors">
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Chat embed */}
          {activeUrl ? (
            <iframe
              key={activeUrl}
              src={activeUrl}
              className="flex-1 w-full border-0"
              allow="autoplay; encrypted-media"
              title="Live Chat"
            />
          ) : !showConfig && (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-6">
              <MessageSquare size={28} className="text-muted-foreground/20" />
              <p className="font-mono-console text-xs text-muted-foreground">
                Connect a YouTube, Twitch, or Facebook chat
              </p>
              <button
                onClick={() => setShowConfig(true)}
                className="px-4 py-2 rounded bg-secondary hover:bg-secondary/80 font-mono-console text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Configure Chat
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
