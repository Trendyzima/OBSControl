export interface OBSProfile {
  id: string;
  name: string;
  host: string;
  port: number;
  password: string;
  lastConnected?: string;
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface OBSScene {
  sceneName: string;
  sceneIndex: number;
  sources?: OBSSource[];
  previewUrl?: string;
}

export interface OBSSource {
  sourceName: string;
  sourceType: string;
  inputKind?: string;
}

export interface AudioSource {
  id: string;
  name: string;
  volume: number; // 0-100
  muted: boolean;
  type: 'microphone' | 'desktop' | 'music' | 'guest';
}

export interface StreamStatus {
  streaming: boolean;
  recording: boolean;
  screenRecording: boolean;
  duration: string;
  bitrate?: number;
  droppedFrames?: number;
  fps?: number;
  cpuUsage?: number;
}

export interface BitratePoint {
  time: string;
  bitrate: number;
}

export interface MediaItem {
  id: string;
  name: string;
  type: 'video' | 'image' | 'audio';
  category: 'news' | 'ads' | 'podcast' | 'photos' | 'music' | 'uploads';
  duration?: string;
  thumbnail?: string;
  url?: string;    // for user-uploaded files (blob URL)
  size?: number;   // bytes
}

export type TransitionType = 'Cut' | 'Fade' | 'Swipe' | 'Stinger';

export interface HotkeyMap {
  [key: string]: string; // key → action label
}

// ── OBS Event Log ─────────────────────────────────────────────────────────────
export type OBSEventSeverity = 'info' | 'success' | 'warning' | 'error';

export interface OBSEventEntry {
  id: string;
  timestamp: string;
  severity: OBSEventSeverity;
  category: 'scene' | 'stream' | 'record' | 'audio' | 'media' | 'connection' | 'sequencer' | 'system';
  message: string;
  detail?: string;
}

// ── Scene Auto-Sequencer ──────────────────────────────────────────────────────
export interface SequencerStep {
  id: string;
  sceneName: string;
  durationSeconds: number; // how long to hold this scene
  label?: string;
}

export type SequencerState = 'idle' | 'running' | 'paused';

// ── Multi-Stream Destinations ─────────────────────────────────────────────────
export type StreamDestinationPlatform = 'youtube' | 'facebook' | 'twitch' | 'rtmp';

export interface StreamDestination {
  id: string;
  platform: StreamDestinationPlatform;
  label: string;
  url?: string;        // RTMP URL for custom
  streamKey?: string;
  enabled: boolean;
  status: 'idle' | 'live' | 'error';
  bitrate?: number;
}

// ── Recording File Manager ────────────────────────────────────────────────────
export interface RecordingFile {
  id: string;
  name: string;
  startedAt: string;
  durationSeconds: number;
  sizeBytes: number;
  blobUrl: string;
  thumbnail?: string; // data URL or placeholder
  type: 'screen' | 'obs';
}
