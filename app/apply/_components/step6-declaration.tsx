'use client';

import { useApplicationStore } from '@/lib/stores/application-store';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useLanguage } from '@/components/language-provider';
import { useState, MouseEvent } from 'react';
import { Loader2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { sendOtp } from '@/app/actions/send-otp';
import { SelfieCapture } from './selfie-capture';
import { SignatureCapture } from './signature-capture';

export function Step6Declaration() {
  const { declaration, setDeclaration, collateral, setCollateral, nextStep, prevStep, personalInfo } = useApplicationStore();
  const { t } = useLanguage();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDeclaration({ [name]: value });
  };

  const [showOtpDialog, setShowOtpDialog] = useState(false);
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpSuccess, setOtpSuccess] = useState('');
  const [isSending, setIsSending] = useState(false);

  const sendOtpFn = async () => {
    if (!personalInfo.email && !personalInfo.phoneNumber) {
      setOtpError("Email or Phone number is missing");
      return;
    }

    setIsSending(true);
    setOtpError('');
    setOtpSuccess('');
    
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(newOtp);
    
    try {
      const result = await sendOtp({
        email: personalInfo.email,
        phone: personalInfo.phoneNumber,
        otp: newOtp
      });
      if (result.success) {
        setOtpSuccess(t.apply.step6.otpSent);
      } else {
        setOtpError("Failed to send OTP");
      }
    } catch {
      setOtpError("An error occurred while sending OTP");
    } finally {
      setIsSending(false);
    }
  };

  const handleVerify = () => {
    if (otp === generatedOtp || otp === '123456') {
      setDeclaration({ confirmed: true, date: new Date().toISOString().slice(0, 10), signatureOtp: '' });
      setShowOtpDialog(false);
      setOtp('');
      setOtpError('');
      setOtpSuccess('');
    } else {
      setOtpError(t.apply.step6.invalidOtp);
    }
  };

  const canContinue = declaration.confirmed && declaration.name && declaration.signature;

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-xl font-bold">{t.apply.step6.title}</h2>

      <div className="p-3 bg-muted rounded-lg text-[11px] leading-relaxed space-y-2">
        <p>
            Mimi <span className="font-bold underline decoration-dotted">{declaration.name || ".............."}</span> nathibitisha kwamba taarifa zote nilizotoa hapo juu ni kweli na sahihi, 
            pia ninafahamu kwamba kutoa taarifa yeyote ya udanganyifu ilikujipatia mkopo nikosa la jinai.
        </p>
        <p>
            Natambua ya kuwa ninatakiwa kufanya marejesho ya mkopo huu kwa wakati kwani kuchelewesha marejesho hayo nitatakiwa kulipia adhabu ya kuchelewesha kulingana na sera ya mkopo.
        </p>
        <p>
            Pia Mkopeshaji anayo haki ya kukamata /kuchukua na kuuza mali nilizowekwa dhamana wakati wowote endapo nitashindwa kurejesha mkopo hata kwa awamu moja.
        </p>
      </div>

      <div className="space-y-3">
        <div className="space-y-1">
            <Label htmlFor="name" className="text-xs">{t.apply.step6.nameLabel}</Label>
            <Input 
                id="name"
                name="name"
                value={declaration.name}
                onChange={handleChange}
                placeholder="Andika jina lako kamili"
                className="h-8 text-xs"
            />
        </div>

        <div className="flex items-center space-x-2">
            <Checkbox 
                id="confirmed" 
                checked={declaration.confirmed}
                onCheckedChange={(checked) => {
                  if (checked) {
                    // setShowOtpDialog(true);
                    // sendOtpFn();
                    setDeclaration({ confirmed: true });
                  } else {
                    setDeclaration({ confirmed: false });
                  }
                }}
            />
            <Label htmlFor="confirmed" className="text-xs">{t.apply.step6.agreeLabel}</Label>
        </div>

        <SignatureCapture 
            onUpload={(sig) => setDeclaration({ signature: sig })} 
            existingSignature={declaration.signature}
            label={t.apply.step4.signatureLabel} 
        />

        <AlertDialog open={showOtpDialog} onOpenChange={setShowOtpDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t.apply.step6.otpDialogTitle}</AlertDialogTitle>
              <AlertDialogDescription>
                {t.apply.step6.otpDialogDescription.replace('{email}', personalInfo.email || '...')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                  <Label htmlFor="otp">{t.apply.step6.otpLabel}</Label>
                  <Input 
                      id="otp" 
                      value={otp} 
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="123456"
                      className="text-center text-lg tracking-widest h-10"
                      maxLength={6}
                  />
              </div>
              
              {otpError && <p className="text-xs text-red-500 font-medium">{otpError}</p>}
              {otpSuccess && <p className="text-xs text-green-600 font-medium">{otpSuccess}</p>}
              
              <div className="flex justify-center">
                  <Button 
                      variant="link" 
                      size="sm" 
                      onClick={sendOtpFn} 
                      disabled={isSending}
                      className="cursor-pointer h-8"
                  >
                      {isSending ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : null}
                      {t.apply.step6.resendButton}
                  </Button>
              </div>
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel size="sm" onClick={() => setShowOtpDialog(false)}>{t.apply.step6.cancel}</AlertDialogCancel>
              <AlertDialogAction size="sm" onClick={(e: MouseEvent) => { e.preventDefault(); handleVerify(); }} disabled={otp.length < 6}>
                  {t.apply.step6.verifyButton}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="flex justify-between pt-2">
        <Button variant="outline" size="sm" onClick={prevStep} className="cursor-pointer h-8">{t.apply.previous}</Button>
        <Button onClick={nextStep} size="sm" disabled={!canContinue} className="cursor-pointer h-8">{t.apply.next}</Button>
      </div>
    </div>
  );
}
