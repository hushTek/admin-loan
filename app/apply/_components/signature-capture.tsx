'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, Check, Upload, PenTool } from 'lucide-react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Loader2 } from 'lucide-react';
import { SignaturePad } from '@ark-ui/react';

interface SignatureCaptureProps {
  onUpload: (data: { name: string; storageId: string; url: string }) => void;
  existingSignature?: { name: string; storageId: string; url?: string } | null;
  label?: string;
}

export function SignatureCapture({ onUpload, existingSignature, label }: SignatureCaptureProps) {
  const [uploading, setUploading] = useState(false);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);

  const handleUpload = async (dataUrl: string) => {
    setUploading(true);
    try {
      // Convert dataUrl to blob
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
        name: 'signature.png',
        storageId,
        url: dataUrl
      });
    } catch (err) {
      console.error("Upload failed", err);
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4 border p-4 rounded-xl bg-muted/5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{label || "Sahihi (Signature)"} <span className="text-red-500">*</span></h3>
        {existingSignature && (
          <Button variant="ghost" size="sm" onClick={() => onUpload({ name: '', storageId: '', url: '' })} className="text-destructive h-7 px-2">
            <Trash2 className="w-3 h-3 mr-1" /> Futa
          </Button>
        )}
      </div>

      {!existingSignature?.url ? (
        <SignaturePad.Root 
            onDrawEnd={(details) => console.log('Drawing ended', details)}
            className="flex flex-col gap-4 w-full"
        >
            <SignaturePad.Control className="relative w-full h-40 border-2 border-dashed border-gray-300 rounded-lg bg-white overflow-hidden touch-none">
                <SignaturePad.Segment className="w-full h-full" />
                <SignaturePad.Guide className="absolute bottom-4 left-4 right-4 border-b border-gray-200" />
                <SignaturePad.ClearTrigger asChild>
                    <Button variant="ghost" size="sm" className="absolute top-2 right-2 h-6 w-6 p-0 text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-3 h-3" />
                    </Button>
                </SignaturePad.ClearTrigger>
            </SignaturePad.Control>
            
            <div className="flex justify-end gap-2">
                 <div className="text-xs text-muted-foreground mr-auto flex items-center">
                    <PenTool className="w-3 h-3 mr-1" /> Weka sahihi hapo juu
                 </div>
                 {/* Use Context Render Prop to access API */}
                 <SignaturePad.Context>
                    {(api) => (
                        <Button 
                            size="sm" 
                            onClick={async () => {
                                const url = await api.getDataUrl('image/png');
                                handleUpload(url);
                            }}
                            disabled={api.empty || uploading}
                        >
                            {uploading ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Check className="w-3 h-3 mr-2" />}
                            Hifadhi Sahihi
                        </Button>
                    )}
                 </SignaturePad.Context>
            </div>
        </SignaturePad.Root>
      ) : (
        <div className="relative group flex justify-center border-2 border-dashed rounded-lg p-4 bg-background">
            <img src={existingSignature.url} alt="Signature" className="max-h-32 rounded" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded">
            <Button variant="secondary" size="sm" onClick={() => onUpload({ name: '', storageId: '', url: '' })}>
                Badilisha
            </Button>
            </div>
        </div>
      )}
    </div>
  );
}
