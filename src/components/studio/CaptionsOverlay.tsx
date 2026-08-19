import { useState, useEffect, useRef } from 'react';
import { Captions, MicOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CaptionsOverlayProps {
  enabled: boolean;
  onEnable: () => void;
  onDisable: () => void;
  onCaptionUpdate: (text: string) => void;
}

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

export default function CaptionsOverlay({ enabled, onEnable, onDisable, onCaptionUpdate }: CaptionsOverlayProps) {
  const [supported, setSupported] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [interim, setInterim] = useState('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const historyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSupported(!!(window.SpeechRecognition || window.webkitSpeechRecognition));
  }, []);

  useEffect(() => {
    if (!supported) return;

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (enabled) {
      const rec = new SR();
      rec.lang = 'en-US';
      rec.continuous = true;
      rec.interimResults = true;
      rec.maxAlternatives = 1;

      rec.onresult = (e) => {
        let final = '';
        let interimText = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          if (e.results[i].isFinal) {
            final += e.results[i][0].transcript;
          } else {
            interimText += e.results[i][0].transcript;
          }
        }
        if (final.trim()) {
          setHistory(prev => {
            const updated = [...prev, final.trim()].slice(-20);
            return updated;
          });
          onCaptionUpdate(final.trim());
        }
        setInterim(interimText);
      };

      rec.onerror = (e) => {
        console.log('Speech recognition error:', e.error);
        if (e.error !== 'no-speech' && e.error !== 'aborted') {
          // Restart on recoverable errors
          setTimeout(() => {
            if (recognitionRef.current) {
              try { recognitionRef.current.start(); } catch {}
            }
          }, 500);
        }
      };

      rec.onend = () => {
        // Auto-restart if still enabled
        if (recognitionRef.current && enabled) {
          try { rec.start(); } catch {}
        }
      };

      try {
        rec.start();
      } catch (err) {
        console.log('Could not start speech recognition:', err);
      }

      recognitionRef.current = rec;
    } else {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
        recognitionRef.current = null;
      }
      setInterim('');
    }

    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
    };
  }, [enabled, supported, onCaptionUpdate]);

  // Auto-scroll history
  useEffect(() => {
    if (historyRef.current) {
      historyRef.current.scrollTop = historyRef.current.scrollHeight;
    }
  }, [history]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-mono-console text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
          <Captions size={11} /> Live Captions
        </h3>
        {supported ? (
          <button
            onClick={enabled ? onDisable : onEnable}
            className={cn(
              'px-3 py-1 rounded-lg border font-mono-console text-[9px] transition-colors',
              enabled
                ? 'border-blue-500/50 bg-blue-500/10 text-blue-400'
                : 'border-border text-muted-foreground hover:text-foreground'
            )}
          >
            {enabled ? '● LIVE' : 'START'}
          </button>
        ) : (
          <span className="font-mono-console text-[9px] text-muted-foreground/40">Not supported</span>
        )}
      </div>

      {!supported && (
        <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/5">
          <p className="font-mono-console text-[10px] text-amber-400">
            Live captions require Chrome or Edge browser with microphone access.
          </p>
        </div>
      )}

      {supported && (
        <>
          <div className="p-3 rounded-xl border border-border bg-black/40 space-y-2">
            {/* Interim text */}
            {interim && (
              <p className="font-mono-console text-[11px] text-blue-300/70 italic leading-relaxed">
                {interim}
              </p>
            )}

            {/* History */}
            <div
              ref={historyRef}
              className="max-h-28 overflow-y-auto space-y-1 no-scrollbar"
            >
              {history.length === 0 && !interim && (
                <p className="font-mono-console text-[10px] text-muted-foreground/30 text-center py-2">
                  {enabled ? 'Listening... speak to see captions' : 'Start captions and speak'}
                </p>
              )}
              {history.map((line, i) => (
                <p
                  key={i}
                  className={cn(
                    'font-mono-console text-[11px] leading-relaxed',
                    i === history.length - 1 ? 'text-white' : 'text-muted-foreground/50'
                  )}
                >
                  {line}
                </p>
              ))}
            </div>
          </div>

          {enabled && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/8 border border-blue-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse shrink-0" />
              <span className="font-mono-console text-[9px] text-blue-400">
                Captions rendering on Program canvas · Speech to text active
              </span>
            </div>
          )}

          {history.length > 0 && (
            <button
              onClick={() => setHistory([])}
              className="font-mono-console text-[9px] text-muted-foreground/40 hover:text-muted-foreground transition-colors"
            >
              Clear history
            </button>
          )}
        </>
      )}
    </div>
  );
}
