import { useState } from 'react';
import { CameraDevice, StudioScene, PiPSource } from '@/types/studio';
import { Camera, Video, Image, X, RefreshCw, FlipHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface CameraSetupProps {
  cameras: CameraDevice[];
  scenes: StudioScene[];
  currentSceneId: string;
  cameraStream: MediaStream | null;
  facingMode: 'user' | 'environment';
  onStartCamera: (deviceId?: string, facing?: 'user' | 'environment') => Promise<MediaStream | null>;
  onStopCamera: () => void;
  onFlipCamera: () => Promise<void>;
  onLoadMedia: (sceneId: string, url: string, type: 'video' | 'image') => void;
  onUpdateScene: (id: string, patch: Partial<StudioScene>) => void;
}

export default function CameraSetup({
  cameras, scenes, currentSceneId, cameraStream, facingMode,
  onStartCamera, onStopCamera, onFlipCamera, onLoadMedia, onUpdateScene
}: CameraSetupProps) {
  const [selectedCamera, setSelectedCamera] = useState('');
  const [activeTab, setActiveTab] = useState<'camera' | 'media'>('camera');
  const [flipping, setFlipping] = useState(false);

  const isCameraActive = !!cameraStream;

  async function handleFlip() {
    setFlipping(true);
    await onFlipCamera();
    setFlipping(false);
  }

  function handleVideoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('video/')) { toast.error('Select a video file'); return; }
    const url = URL.createObjectURL(file);
    const videoScene = scenes.find(s => s.sourceType === 'video');
    onLoadMedia(videoScene?.id || currentSceneId, url, 'video');
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
      <div className="flex rounded-xl overflow-hidden border border-border">
        {(['camera', 'media'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={cn('flex-1 py-2 font-mono-console text-[10px] uppercase tracking-wider transition-colors',
              activeTab === tab ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'
            )}>
            {tab === 'camera' ? '📷 Camera' : '📁 Media'}
          </button>
        ))}
      </div>

      {activeTab === 'camera' && (
        <div className="space-y-3">
          {/* Status */}
          <div className={cn('flex items-center gap-2 px-3 py-2 rounded-xl border',
            isCameraActive ? 'border-emerald-500/40 bg-emerald-500/8' : 'border-border bg-secondary/20'
          )}>
            <div className={cn('w-2 h-2 rounded-full shrink-0', isCameraActive ? 'bg-emerald-400 animate-pulse' : 'bg-muted-foreground/30')} />
            <span className={cn('font-mono-console text-[10px] flex-1', isCameraActive ? 'text-emerald-400' : 'text-muted-foreground')}>
              {isCameraActive ? `Camera Active — ${facingMode === 'environment' ? 'Rear' : 'Front'}` : 'Camera Off'}
            </span>
            {isCameraActive && (
              <span className="font-mono-console text-[9px] text-muted-foreground/60">
                {cameraStream?.getVideoTracks()[0]?.label?.slice(0, 16) || ''}
              </span>
            )}
          </div>

          {/* Camera selector */}
          {cameras.length > 1 && (
            <select
              value={selectedCamera}
              onChange={e => setSelectedCamera(e.target.value)}
              className="w-full bg-input border border-border rounded-lg px-3 py-2 font-mono-console text-xs text-foreground focus:outline-none focus:border-primary"
            >
              <option value="">Default Camera</option>
              {cameras.map(cam => <option key={cam.deviceId} value={cam.deviceId}>{cam.label}</option>)}
            </select>
          )}

          {/* Controls */}
          <div className="grid grid-cols-2 gap-2">
            {!isCameraActive ? (
              <>
                <button
                  onClick={() => onStartCamera(selectedCamera || undefined, 'user')}
                  className="col-span-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-mono-console text-[11px] font-semibold transition-colors active:scale-[0.98]"
                >
                  <Camera size={13} />
                  Front
                </button>
                <button
                  onClick={() => onStartCamera(undefined, 'environment')}
                  className="col-span-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-mono-console text-[11px] font-semibold transition-colors active:scale-[0.98]"
                >
                  <Camera size={13} />
                  Rear
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleFlip}
                  disabled={flipping}
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-400 font-mono-console text-xs font-semibold transition-colors disabled:opacity-50 active:scale-[0.97]"
                >
                  <FlipHorizontal size={13} className={flipping ? 'animate-spin' : ''} />
                  Flip Cam
                </button>
                <button
                  onClick={onStopCamera}
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-border bg-secondary/40 text-muted-foreground hover:text-foreground font-mono-console text-xs transition-colors"
                >
                  <X size={12} />
                  Stop
                </button>
              </>
            )}
          </div>

          {isCameraActive && (
            <div className="grid grid-cols-3 gap-1.5">
              <button onClick={() => onStartCamera(undefined, 'user')}
                className={cn('py-1.5 rounded-lg border font-mono-console text-[9px] transition-colors',
                  facingMode === 'user' ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400' : 'border-border text-muted-foreground')}>
                Front
              </button>
              <button onClick={() => onStartCamera(undefined, 'environment')}
                className={cn('py-1.5 rounded-lg border font-mono-console text-[9px] transition-colors',
                  facingMode === 'environment' ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400' : 'border-border text-muted-foreground')}>
                Rear
              </button>
              {cameras.length > 1 && cameras.map((cam, i) => i < 1 && (
                <button key={cam.deviceId} onClick={() => onStartCamera(cam.deviceId)}
                  className="py-1.5 rounded-lg border border-border font-mono-console text-[9px] text-muted-foreground hover:text-foreground">
                  Cam {i + 2}
                </button>
              ))}
            </div>
          )}

          <p className="font-mono-console text-[9px] text-muted-foreground/40 text-center">
            Mic captured automatically with camera
          </p>
        </div>
      )}

      {activeTab === 'media' && (
        <div className="space-y-3">
          <div>
            <p className="font-mono-console text-[9px] text-muted-foreground uppercase tracking-wider mb-2">Load Video into VIDEO Scene</p>
            <label className="flex items-center justify-center gap-2 py-4 rounded-xl border-2 border-dashed border-border/60 hover:border-primary/40 text-muted-foreground hover:text-primary cursor-pointer transition-colors">
              <Video size={16} />
              <span className="font-mono-console text-xs">Tap to select video</span>
              <input type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} />
            </label>
          </div>
          <div>
            <p className="font-mono-console text-[9px] text-muted-foreground uppercase tracking-wider mb-2">Load Image into PHOTO Scene</p>
            <label className="flex items-center justify-center gap-2 py-4 rounded-xl border-2 border-dashed border-border/60 hover:border-cyan-500/40 text-muted-foreground hover:text-cyan-400 cursor-pointer transition-colors">
              <Image size={16} />
              <span className="font-mono-console text-xs">Tap to select image</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
          </div>
          <p className="font-mono-console text-[9px] text-muted-foreground/40 text-center">
            Files load locally — no server upload
          </p>
        </div>
      )}
    </div>
  );
}
