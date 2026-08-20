// ─── Studio Scene Types ────────────────────────────────────────────────────

export type SceneSourceType = 'camera' | 'video' | 'image' | 'color' | 'text';

export type TransitionType = 'cut' | 'fade' | 'wipe-left' | 'wipe-right' | 'dissolve';

export interface OverlayText {
  id: string;
  text: string;
  x: number; // 0–100 percent of canvas
  y: number;
  fontSize: number;
  color: string;
  bgColor: string;
  bold: boolean;
  visible: boolean;
}

export interface PiPSource {
  enabled: boolean;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  size: number; // 15–40 percent of canvas width
}

export interface ChromaKeySettings {
  enabled: boolean;
  color: string;   // hex target color
  tolerance: number; // 0–100
  softness: number;  // 0–100
}

export interface StudioScene {
  id: string;
  name: string;
  sourceType: SceneSourceType;
  cameraDeviceId?: string;
  mediaUrl?: string;
  imageUrl?: string;
  bgColor?: string;
  icon: string;
  thumbnail?: string;
  overlays?: OverlayText[];
  category?: 'main' | 'ad' | 'transition' | 'graphics';
  plannedDuration?: number;
  chromaKey?: ChromaKeySettings;
}

export interface AudioTrack {
  id: string;
  name: string;
  type: 'mic' | 'video' | 'music';
  volume: number; // 0–100
  muted: boolean;
  gainKey?: string;
  level?: number; // 0–100 live VU
}

export type OutputMode = 'record' | 'whip' | 'folder' | 'rtmp' | 'none';

export interface StreamOutput {
  mode: OutputMode;
  whipUrl: string;
  rtmpUrl: string;
  streamKey: string;
  platform: 'youtube' | 'facebook' | 'twitch' | 'custom';
  resolution: '3840x2160' | '1920x1080' | '1280x720' | '854x480';
  fps: 30 | 60;
  bitrate: number; // kbps
  folderHandle?: FileSystemDirectoryHandle | null;
}

export interface StreamHealth {
  estimatedBitrate: number; // kbps
  droppedFrames: number;
  encoderStatus: 'idle' | 'encoding' | 'degraded' | 'critical';
  score: number; // 0–100
  latencyMs: number;
  packetsLost: number;
}

export interface RundownSegment {
  id: string;
  title: string;
  sceneId: string;
  plannedDuration: number; // seconds
  elapsed?: number;
  status: 'pending' | 'live' | 'done' | 'overrun';
  notes?: string;
}

export interface AdSlot {
  id: string;
  title: string;
  mediaUrl: string;
  duration: number; // seconds
  thumbnail?: string;
  scheduled?: boolean;
  advertiser?: string;
  playSongsAfter?: number;
}

export interface StudioState {
  currentSceneId: string;
  previewSceneId: string;
  scenes: StudioScene[];
  audioTracks: AudioTrack[];
  output: StreamOutput;
  isLive: boolean;
  isRecording: boolean;
  duration: number;
  error: string | null;
  transition: TransitionType;
  transitionDuration: number;
  pip: PiPSource;
  health: StreamHealth;
  chromaKey: ChromaKeySettings;
  captions: string;
  captionsEnabled: boolean;
  chatOverlayEnabled: boolean;
  pinnedChatMessage: { author: string; text: string } | null;
}

export interface CameraDevice {
  deviceId: string;
  label: string;
  facing?: 'user' | 'environment';
}

export interface GuestPeer {
  id: string;
  name: string;
  stream: MediaStream | null;
  connected: boolean;
  muted: boolean;
  volume: number;
  role?: 'host' | 'guest' | 'caller';
}

export type GuestLayout = 'solo' | 'duo' | 'trio' | 'quad' | 'panel-5' | 'panel-6';

export interface MediaItem {
  id: string;
  title: string;
  artist?: string;
  duration: number;
  url: string;
  type: 'music' | 'video' | 'jingle' | 'stationid' | 'ad';
  thumbnail?: string;
  category?: string;
  tags?: string[];
  usageCount?: number;
  dateAdded?: number;
}

export interface Playlist {
  id: string;
  name: string;
  items: MediaItem[];
  mode: 'sequential' | 'shuffle' | 'smart';
  icon?: string;
}

export type AutoDJMode = 'manual' | 'automatic' | 'scheduled';
export type AutoDJStatus = 'idle' | 'playing' | 'paused' | 'transitioning';

export interface AutoDJState {
  enabled: boolean;
  status: AutoDJStatus;
  mode: AutoDJMode;
  currentPlaylistId: string | null;
  currentIndex: number;
  currentItem: MediaItem | null;
  nextItem: MediaItem | null;
  crossfadeDuration: number;
  songsUntilAd: number;
  adInterval: number;
  autoSwitchToLive: boolean;
  graceBeforeReturn: number;
}

export interface BroadcastAnalytics {
  sessionStart: number;
  sessionEnd: number | null;
  totalDuration: number;
  sceneSwitches: { time: number; from: string; to: string }[];
  healthHistory: { time: number; score: number; bitrate: number }[];
  peakBitrate: number;
  avgBitrate: number;
  adBreaks: number;
  tickerMessages: number;
  sceneUsage: Record<string, number>;
}

export interface SceneHotkey {
  key: string;
  sceneId: string;
}
