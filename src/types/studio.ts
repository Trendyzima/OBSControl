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

export interface StudioScene {
  id: string;
  name: string;
  sourceType: SceneSourceType;
  /** For camera scenes: which camera device id */
  cameraDeviceId?: string;
  /** For video scenes: the loaded media URL */
  mediaUrl?: string;
  /** For image scenes: the loaded image URL */
  imageUrl?: string;
  /** For color scenes: hex color */
  bgColor?: string;
  /** Label shown on scene button */
  icon: string;
  /** Thumbnail for preview (data URL) */
  thumbnail?: string;
  /** Text overlays rendered on top */
  overlays?: OverlayText[];
  /** Category tag */
  category?: 'main' | 'ad' | 'transition' | 'graphics';
  /** Duration in seconds (for ads/rundown) */
  plannedDuration?: number;
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

export type OutputMode = 'record' | 'whip' | 'folder' | 'none';

export interface StreamOutput {
  mode: OutputMode;
  whipUrl: string;
  rtmpUrl: string;
  streamKey: string;
  platform: 'youtube' | 'facebook' | 'twitch' | 'custom';
  resolution: '1920x1080' | '1280x720' | '854x480';
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
}

export interface StudioState {
  currentSceneId: string;
  previewSceneId: string; // what's in Preview bus
  scenes: StudioScene[];
  audioTracks: AudioTrack[];
  output: StreamOutput;
  isLive: boolean;
  isRecording: boolean;
  duration: number; // seconds
  error: string | null;
  transition: TransitionType;
  transitionDuration: number; // ms
  pip: PiPSource;
  health: StreamHealth;
}

export interface CameraDevice {
  deviceId: string;
  label: string;
  facing?: 'user' | 'environment';
}
