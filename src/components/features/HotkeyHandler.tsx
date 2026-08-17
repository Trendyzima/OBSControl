import { useEffect, useRef } from 'react';
import { OBSScene, AudioSource } from '@/types/obs';
import { HotkeyConfig, loadHotkeys } from '@/components/features/HotkeyRemapper';
import { toast } from 'sonner';

interface HotkeyHandlerProps {
  scenes: OBSScene[];
  audioSources: AudioSource[];
  currentScene: string;
  disabled: boolean;
  hotkeys?: HotkeyConfig[];
  onSwitchScene: (name: string) => void;
  onToggleMute: (id: string) => void;
  onToggleStream: () => void;
  onToggleRecord: () => void;
  onToggleScreenRecording: () => void;
}

export default function HotkeyHandler({
  scenes,
  audioSources,
  disabled,
  hotkeys,
  onSwitchScene,
  onToggleMute,
  onToggleStream,
  onToggleRecord,
  onToggleScreenRecording,
}: HotkeyHandlerProps) {
  const stateRef = useRef({
    scenes, audioSources, disabled, hotkeys,
    onSwitchScene, onToggleMute, onToggleStream, onToggleRecord, onToggleScreenRecording
  });
  useEffect(() => {
    stateRef.current = {
      scenes, audioSources, disabled, hotkeys,
      onSwitchScene, onToggleMute, onToggleStream, onToggleRecord, onToggleScreenRecording
    };
  });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

      const { scenes, audioSources, disabled, hotkeys, onSwitchScene, onToggleMute, onToggleStream, onToggleRecord, onToggleScreenRecording } = stateRef.current;

      // Build a key → action map from current hotkeys (or defaults)
      const hk = hotkeys || loadHotkeys();
      const keyMap: Record<string, string> = {};
      hk.forEach(h => {
        const k = h.currentKey.toUpperCase();
        keyMap[k] = h.id;
      });

      let pressedKey = e.key;
      if (pressedKey === ' ') pressedKey = 'Space';
      if (pressedKey.length === 1) pressedKey = pressedKey.toUpperCase();

      const actionId = keyMap[pressedKey] || keyMap[e.key];
      if (!actionId) return;

      // Scene keys
      const sceneMatch = actionId.match(/^scene_(\d+)$/);
      if (sceneMatch) {
        const idx = parseInt(sceneMatch[1]) - 1;
        if (!disabled && scenes[idx]) {
          e.preventDefault();
          onSwitchScene(scenes[idx].sceneName);
          toast(`Scene: ${scenes[idx].sceneName}`, { duration: 1200 });
        }
        return;
      }

      if (actionId === 'mute_host') {
        const hostMic = audioSources.find(s => s.type === 'microphone');
        if (!disabled && hostMic) { e.preventDefault(); onToggleMute(hostMic.id); }
        return;
      }

      if (actionId === 'mute_guest') {
        const guestMic = audioSources.find(s => s.type === 'guest');
        if (!disabled && guestMic) { e.preventDefault(); onToggleMute(guestMic.id); }
        return;
      }

      if (actionId === 'toggle_stream') {
        e.preventDefault();
        if (!disabled) onToggleStream();
        return;
      }

      if (actionId === 'toggle_record') {
        if (!disabled && !e.ctrlKey && !e.metaKey) { e.preventDefault(); onToggleRecord(); }
        return;
      }

      if (actionId === 'screen_record') {
        if (!e.ctrlKey && !e.metaKey) { e.preventDefault(); onToggleScreenRecording(); }
        return;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return null;
}
