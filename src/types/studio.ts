// ─── Studio Scene Types ────────────────────────────────────────────────────

export type SceneSourceType = 'camera' | 'video' | 'image' | 'color' | 'text';

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
  /** Thumbnail for preview */
  thumbnail?: string;
  /** Text overlays rendered on top */
  overlays?: OverlayText[];
}

export interface AudioTrack {
  id: string;
  name: string;
  type: 'mic' | 'video' | 'music';
  volume: number; // 0–100
  muted: boolean;
  /** Gain node reference key */
  gainKey?: string;
  /** Live VU level 0–100 */
  level?: number;
}

export type OutputMode = 'record' | 'whip' | 'none';

export interface StreamOutput {
  mode: OutputMode;
  whipUrl: string;
  rtmpUrl: string;
  streamKey: string;
  platform: 'youtube' | 'facebook' | 'twitch' | 'custom';
  resolution: '1920x1080' | '1280x720' | '854x480';
  fps: 30 | 60;
  bitrate: number; // kbps
}

export interface StudioState {
  currentSceneId: string;
  scenes: StudioScene[];
  audioTracks: AudioTrack[];
  output: StreamOutput;
  isLive: boolean;
  isRecording: boolean;
  duration: number; // seconds
  error: string | null;
}

export interface CameraDevice {
  deviceId: string;
  label: string;
}
