'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Upload, Trash2, X, Crop, Loader2 } from 'lucide-react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';

interface SelfieCaptureProps {
  onUpload: (data: { name: string; storageId: string; url: string }) => void;
  existingSelfie?: { name: string; storageId: string; url?: string } | null;
  label?: string;
}

export function SelfieCapture({ onUpload, existingSelfie, label }: SelfieCaptureProps) {
  const [mode, setStep] = useState<'idle' | 'camera' | 'crop'>('idle');
  const [image, setImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play(); // Ensure video plays
        setStep('camera');
      }
    } catch (err) {
      console.error("Camera error:", err);
      alert("Could not access camera. Please allow camera permissions.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null; // Clear source
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        // Video not ready
        return;
      }
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      // Flip horizontal for selfie mirror effect if needed? usually getUserMedia is mirrored by CSS? 
      // transform: scaleX(-1) in CSS usually. 
      // But let's just draw raw.
      ctx?.drawImage(video, 0, 0);
      setImage(canvas.toDataURL('image/jpeg'));
      stopCamera();
      setStep('crop');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target?.result as string);
        setStep('crop');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async (dataUrl: string) => {
    setUploading(true);
    try {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      
      const postUrl = await generateUploadUrl();
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": blob.type },
        body: blob,
      });
      const { storageId } = await result.json();
      
      onUpload({
        name: 'selfie.jpg',
        storageId,
        url: dataUrl
      });
      setStep('idle');
      setImage(null);
    } catch (err) {
      console.error("Upload failed", err);
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const performCrop = () => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const img = new Image();
      img.onload = () => {
        const size = Math.min(img.width, img.height);
        const x = (img.width - size) / 2;
        const y = (img.height - size) / 2;
        
        canvas.width = 400;
        canvas.height = 400; // Square for selfie
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, x, y, size, size, 0, 0, 400, 400);
        const croppedDataUrl = canvas.toDataURL('image/jpeg');
        handleUpload(croppedDataUrl);
      };
      img.src = image!;
    }
  };

  return (
    <div className="space-y-4 border p-4 rounded-xl bg-muted/5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{label || "Picha ya Mwombaji (Selfie)"} <span className="text-red-500">*</span></h3>
        {existingSelfie && mode === 'idle' && (
          <Button variant="ghost" size="xs" onClick={() => onUpload({ name: '', storageId: '', url: '' })} className="text-destructive h-7">
            <Trash2 className="w-3 h-3 mr-1" /> Futa
          </Button>
        )}
      </div>

      {mode === 'idle' && (
        <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 bg-background space-y-4">
          {existingSelfie?.url ? (
            <div className="relative group">
              <img src={existingSelfie.url} alt="Selfie" className="w-32 h-32 object-cover rounded-full border-2 border-primary shadow-md" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
                <Button variant="secondary" size="xs" onClick={() => setStep('idle')}>
                  Badilisha
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-2">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-2">
                <Camera className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">Piga picha ya hivi karibuni (selfie)</p>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" size="sm" onClick={startCamera} className="h-9">
                  <Camera className="w-4 h-4 mr-2" /> Camera
                </Button>
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="h-9">
                  <Upload className="w-4 h-4 mr-2" /> Pakia
                </Button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleFileChange}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {mode === 'camera' && (
        <div className="relative bg-black rounded-lg overflow-hidden flex flex-col items-center">
          <video ref={videoRef} autoPlay playsInline className="w-full h-auto max-h-64" />
          <div className="p-4 flex gap-4">
            <Button variant="secondary" size="sm" onClick={capturePhoto} className="h-10 w-10 rounded-full p-0">
              <div className="w-6 h-6 rounded-full border-2 border-primary bg-white" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { stopCamera(); setStep('idle'); }} className="text-white">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>
      )}

      {mode === 'crop' && (
        <div className="flex flex-col items-center space-y-4">
          <div className="relative border rounded overflow-hidden">
            <img src={image!} alt="To Crop" className="max-h-64" />
            <div className="absolute inset-0 border-2 border-primary/50 pointer-events-none flex items-center justify-center">
               <div className="w-48 h-48 border-2 border-white rounded-full border-dashed" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setStep('idle')}>Ghairi</Button>
            <Button size="sm" onClick={performCrop} disabled={uploading}>
              {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Crop className="w-4 h-4 mr-2" />}
              Crop & Hifadhi
            </Button>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
