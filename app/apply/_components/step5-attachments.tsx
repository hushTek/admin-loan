'use client';

import { useApplicationStore } from '@/lib/stores/application-store';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/components/language-provider';
import { useState, useEffect } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Loader2 } from 'lucide-react';

export function Step5Attachments() {
  const { attachments, setAttachments, nextStep, prevStep } = useApplicationStore();
  const { t } = useLanguage();
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Validate attachments state structure on mount to handle legacy/invalid data
    const validate = (att: unknown) => {
      if (!att) return null;
      if (typeof att === 'string') return null; // Invalid legacy state
      if (typeof att === 'object' && att !== null && !('storageId' in att)) return null; // Invalid state
      return att as { name: string; storageId: string };
    };

    const nidaId = validate(attachments.nidaId);
    const introLetter = validate(attachments.introLetter);
    const collateralDoc = validate(attachments.collateralDoc);

    if (
      nidaId !== attachments.nidaId ||
      introLetter !== attachments.introLetter ||
      collateralDoc !== attachments.collateralDoc
    ) {
        setAttachments({
          nidaId,
          introLetter,
          collateralDoc,
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, field: keyof typeof attachments) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(prev => ({ ...prev, [field]: true }));
    try {
      const postUrl = await generateUploadUrl();
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const { storageId } = await result.json();

      setAttachments({ [field]: { name: file.name, storageId } });
    } catch (error) {
      console.error("Upload failed", error);
      alert("Failed to upload file. Please try again.");
    } finally {
      setUploading(prev => ({ ...prev, [field]: false }));
    }
  };

  const isComplete = !!(attachments.nidaId && attachments.introLetter && attachments.collateralDoc);

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-xl font-bold">{t.apply.step5.title}</h2>
      
      <div className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="nidaId" className="text-xs">{t.apply.step5.nidaId}</Label>
          <div className="flex items-center gap-2">
            <Input
              id="nidaId"
              type="file"
              className="h-8 text-xs"
              disabled={uploading.nidaId}
              onChange={(e) => handleFileChange(e, 'nidaId')}
            />
            {uploading.nidaId && <Loader2 className="h-4 w-4 animate-spin" />}
          </div>
          {attachments.nidaId && <p className="text-[10px] text-green-600">Selected: {attachments.nidaId.name}</p>}
        </div>

        <div className="space-y-1">
          <Label htmlFor="introLetter" className="text-xs">{t.apply.step5.introLetter}</Label>
          <div className="flex items-center gap-2">
            <Input
              id="introLetter"
              type="file"
              className="h-8 text-xs"
              disabled={uploading.introLetter}
              onChange={(e) => handleFileChange(e, 'introLetter')}
            />
            {uploading.introLetter && <Loader2 className="h-4 w-4 animate-spin" />}
          </div>
          {attachments.introLetter && <p className="text-[10px] text-green-600">Selected: {attachments.introLetter.name}</p>}
        </div>

        <div className="space-y-1">
          <Label htmlFor="collateralDoc" className="text-xs">{t.apply.step5.collateralDoc}</Label>
          <div className="flex items-center gap-2">
            <Input
              id="collateralDoc"
              type="file"
              className="h-8 text-xs"
              disabled={uploading.collateralDoc}
              onChange={(e) => handleFileChange(e, 'collateralDoc')}
            />
            {uploading.collateralDoc && <Loader2 className="h-4 w-4 animate-spin" />}
          </div>
          {attachments.collateralDoc && <p className="text-[10px] text-green-600">Selected: {attachments.collateralDoc.name}</p>}
        </div>
      </div>

      <div className="flex justify-between pt-2">
        <Button variant="outline" size="sm" onClick={prevStep} className="cursor-pointer h-8">{t.apply.previous}</Button>
        <Button onClick={nextStep} size="sm" disabled={!isComplete || Object.values(uploading).some(Boolean)} className="cursor-pointer h-8">{t.apply.next}</Button>
      </div>
    </div>
  );
}
