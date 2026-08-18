import { useState } from 'react';
import { CameraDevice, StudioScene } from '@/types/studio';
import { Camera, Video, Image, Upload, X, Play, Square, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface CameraSetupProps {
  cameras: CameraDevice[];
  scenes: StudioScene[];
  currentSceneId: string;
  cameraStream: MediaStream | null;
  onStartCamera: (deviceId?: string) => Promise<MediaStream | null>;
  onStopCamera: () => void;
  onLoadMedia: (sceneId: string, url: string, type: 'video' | 'image') => void;
  onUpdateScene: (id: string, patch: Partial<StudioScene>) => void;
}

export default function CameraSetup({
  cameras, scenes, currentSceneId, cameraStream,
  onStartCamera, onStopCamera, onLoadMedia, onUpdateScene
}: CameraSetupProps) {
  const [selectedCamera, setSelectedCamera] = useState('');
  const [activeTab, setActiveTab] = useState<'camera' | 'media'>('camera');

  const currentScene = scenes.find(s => s.id === currentSceneId);
  const isCameraActive = !!cameraStream;

  async function handleStartCamera() {
    await onStartCamera(selectedCamera || undefined);
  }

  function handleVideoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('video/')) { toast.error('Select a video file'); return; }
    const url = URL.createObjectURL(file);
    // Find the VIDEO scene or use current
    const videoScene = scenes.find(s => s.sourceType === 'video');
    const targetId = videoScene?.id || currentSceneId;
    onLoadMedia(targetId, url, 'video');
    onUpdateScene(targetId, { thumbnail: undefined });
    toast.success(`Loaded: ${file.name}`);
    e.target.value = '';
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Select an image file'); return; }
    const url = URL.createObjectURL(file);
    const imageScene = scenes.find(s => s.sourceType === 'image');
    const targetId = imageScene?.id || currentSceneId;
    onLoadMedia(targetId, url, 'image');
    onUpdateScene(targetId, { thumbnail: url });
    toast.success(`Loaded: ${file.name}`);
    e.target.value = '';
  }

  return (
    <div className="space-y-3">
      {/* Tab selector */}
      <div className="flex rounded-xl overflow-hidden border border-border">
        {(['camera', 'media'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'flex-1 py-2 font-mono-console text-[10px] uppercase tracking-wider transition-colors',
              activeTab === tab ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {tab === 'camera' ? '📷 Camera' : '📁 Media'}
          </button>
        ))}
      </div>

      {activeTab === 'camera' && (
        <div className="space-y-3">
          {/* Camera status */}
          <div className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-xl border',
            isCameraActive ? 'border-emerald-500/40 bg-emerald-500/8' : 'border-border bg-secondary/20'
          )}>
            <div className={cn('w-2 h-2 rounded-full shrink-0', isCameraActive ? 'bg-emerald-400 animate-pulse' : 'bg-muted-foreground/30')} />
            <span className={cn('font-mono-console text-[10px] flex-1', isCameraActive ? 'text-emerald-400' : 'text-muted-foreground')}>
              {isCameraActive ? 'Camera Active' : 'Camera Off'}
            </span>
            {isCameraActive && cameraStream && (
              <span className="font-mono-console text-[9px] text-muted-foreground">
                {cameraStream.getVideoTracks()[0]?.label?.slice(0, 20) || 'Camera'}
              </span>
            )}
          </div>

          {/* Camera selector */}
          {cameras.length > 1 && (
            <div>
              <label className="font-mono-console text-[9px] text-muted-foreground uppercase block mb-1">Camera Device</label>
              <select
                value={selectedCamera}
                onChange={e => setSelectedCamera(e.target.value)}
                className="w-full bg-input border border-border rounded-lg px-3 py-2 font-mono-console text-xs text-foreground focus:outline-none focus:border-primary"
              >
                <option value="">Default Camera</option>
                {cameras.map(cam => (
                  <option key={cam.deviceId} value={cam.deviceId}>{cam.label}</option>
                ))}
              </select>
            </div>
          )}

          {/* Camera controls */}
          <div className="flex gap-2">
            {!isCameraActive ? (
              <button
                onClick={handleStartCamera}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-mono-console text-xs font-semibold transition-colors active:scale-[0.98]"
              >
                <Camera size={14} />
                Start Camera + Mic
              </button>
            ) : (
              <>
                <button
                  onClick={handleStartCamera}
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 font-mono-console text-xs transition-colors"
                  title="Switch camera"
                >
                  <RefreshCw size={12} />
                  Switch
                </button>
                <button
                  onClick={onStopCamera}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border bg-secondary/40 text-muted-foreground hover:text-foreground font-mono-console text-xs transition-colors"
                >
                  <X size={12} />
                  Stop Camera
                </button>
              </>
            )}
          </div>

          <p className="font-mono-console text-[9px] text-muted-foreground/50 text-center">
            Microphone is captured automatically with camera
          </p>
        </div>
      )}

      {activeTab === 'media' && (
        <div className="space-y-3">
          {/* Video upload */}
          <div>
            <p className="font-mono-console text-[9px] text-muted-foreground uppercase tracking-wider mb-2">Load Video into VIDEO Scene</p>
            <label className="flex items-center justify-center gap-2 py-4 rounded-xl border-2 border-dashed border-border/60 hover:border-primary/40 text-muted-foreground hover:text-primary cursor-pointer transition-colors">
              <Video size={16} />
              <span className="font-mono-console text-xs">Tap to select video file</span>
              <input type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} />
            </label>
          </div>

          {/* Image upload */}
          <div>
            <p className="font-mono-console text-[9px] text-muted-foreground uppercase tracking-wider mb-2">Load Image into PHOTO Scene</p>
            <label className="flex items-center justify-center gap-2 py-4 rounded-xl border-2 border-dashed border-border/60 hover:border-cyan-500/40 text-muted-foreground hover:text-cyan-400 cursor-pointer transition-colors">
              <Image size={16} />
              <span className="font-mono-console text-xs">Tap to select image file</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
          </div>

          <p className="font-mono-console text-[9px] text-muted-foreground/40 text-center">
            Files are loaded directly on this device — no upload to server
          </p>
        </div>
      )}
    </div>
  );
}
