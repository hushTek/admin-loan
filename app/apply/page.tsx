'use client';

import { useApplicationStore } from '@/lib/stores/application-store';
import { Step1PersonalInfo } from './_components/step1-personal-info';
import { Step2Employment } from './_components/step2-employment';
import { Step3LoanDetails } from './_components/step3-loan-details';
import { Step4Collateral } from './_components/step4-collateral';
import { Step5Attachments } from './_components/step5-attachments';
import { Step6Declaration } from './_components/step6-declaration';
import { Step7Confirmation } from './_components/step7-confirmation';
import { Step7Review } from './_components/step7-review';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/components/language-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Save, Copy, Download, Check, FileText } from 'lucide-react';
import { useState } from 'react';
import { useMutation, useConvex } from 'convex/react';
import { api } from '@/convex/_generated/api';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { ApplicationFlow } from './_components/application-flow';

export default function ApplyPage() {
  const { 
    currentStep, 
    personalInfo, 
    loanDetails, 
    collateral, 
    attachments, 
    declaration, 
    applicationNumber, 
    setApplicationNumber, 
    hydrate,
    resetForm
  } = useApplicationStore();
  
  const { t } = useLanguage();
  const convex = useConvex();

  // Reset form when entering the apply page to ensure it's a "New Applicant" flow
  useState(() => {
    // Only reset if we are at step 1 and it's not a resumed application
    if (currentStep === 1 && !applicationNumber) {
      resetForm();
    }
  });

  const [resumeId, setResumeId] = useState('');
  const [isLoadingResume, setIsLoadingResume] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [savedAppId, setSavedAppId] = useState('');
  const [copied, setCopied] = useState(false);
  const [showResumeDialog, setShowResumeDialog] = useState(false);

  const handleResume = async () => {
    if (!resumeId) return;
    setIsLoadingResume(true);
    try {
      const result = await convex.query(api.applications.getByApplicationNumber, { applicationNumber: resumeId });
      if (result && result.application && result.application.formData) {
         const savedData = JSON.parse(result.application.formData);
         hydrate({
           ...savedData,
           currentStep: result.application.currentStep || 1,
           applicationNumber: result.application.applicationNumber
         });
         setShowResumeDialog(false);
      } else {
         alert(t.apply.resume?.notFound || "Application not found or no draft data saved");
      }
    } catch (error) {
      console.error(error);
      alert(t.apply.resume?.error || "Failed to resume application");
    } finally {
      setIsLoadingResume(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(savedAppId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadTxt = () => {
    const element = document.createElement("a");
    const file = new Blob([`Chap Chap Loan Application\nApplication Number: ${savedAppId}\nDate: ${new Date().toLocaleString()}`], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `Loan-Application-${savedAppId}.txt`;
    document.body.appendChild(element); // Required for this to work in FireFox
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="container max-w-3xl mx-auto py-6 px-4">
      <ApplicationFlow />

      {/* Resume Dialog */}
      <AlertDialog open={showResumeDialog} onOpenChange={setShowResumeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.apply.resume?.dialogTitle || "Resume Application"}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.apply.resume?.dialogDescription || "Enter your application number to continue where you left off."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="app-number" className="text-right">
                {t.apply.resume?.appNumberLabel || "App Number"}
              </Label>
              <Input
                id="app-number"
                value={resumeId}
                onChange={(e) => setResumeId(e.target.value)}
                className="col-span-3"
                placeholder={t.apply.resume?.appNumberPlaceholder || "e.g. LN-2024-ABC123"}
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.apply.review.cancel || "Cancel"}</AlertDialogCancel>
            <Button onClick={handleResume} disabled={isLoadingResume || !resumeId}>
               {isLoadingResume ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
               {t.apply.resume?.resumeButton || "Resume"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Save Draft Success Dialog */}
      <AlertDialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.apply.saveDraft?.successTitle || "Draft Saved Successfully"}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.apply.saveDraft?.successDescription || "Your application has been saved. Please keep your Application Number safe to resume later."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="flex items-center space-x-2 p-4 bg-muted rounded-md border">
            <div className="grid flex-1 gap-2">
               <Label htmlFor="saved-app-id" className="sr-only">{t.apply.saveDraft?.appNumberLabel || "Application Number"}</Label>
               <Input 
                 id="saved-app-id" 
                 value={savedAppId} 
                 readOnly 
                 className="h-9 font-mono text-center font-bold"
               />
            </div>
            <Button type="submit" size="sm" className="px-3" onClick={copyToClipboard}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <span className="sr-only">{t.apply.saveDraft?.copy || "Copy"}</span>
            </Button>
          </div>

          <AlertDialogFooter className="sm:justify-between">
             <Button variant="secondary" onClick={downloadTxt} className="gap-2">
                <Download className="h-4 w-4" />
                {t.apply.saveDraft?.download || "Download Info"}
             </Button>
            <AlertDialogAction onClick={() => setShowSaveDialog(false)}>{t.apply.saveDraft?.close || "Close"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
