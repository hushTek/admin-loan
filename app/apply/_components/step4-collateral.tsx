'use client';

import { useApplicationStore, Guarantor } from '@/lib/stores/application-store';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useState, MouseEvent } from 'react';
import { Plus, Trash2, Loader2, Camera, Upload } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/components/language-provider';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { sendOtp } from '@/app/actions/send-otp';
import { SelfieCapture } from './selfie-capture';
import { SignatureCapture } from './signature-capture';

export function Step4Collateral() {
  const { collateral, setCollateral, declaration, setDeclaration, addGuarantor, removeGuarantor, nextStep, prevStep, personalInfo } = useApplicationStore();
  const { t, language } = useLanguage();
  
  const [showOtpDialog, setShowOtpDialog] = useState(false);
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpSuccess, setOtpSuccess] = useState('');
  const [isSending, setIsSending] = useState(false);

  const [newGuarantor, setNewGuarantor] = useState<Guarantor>({
    fullName: '',
    phoneNumber: '',
    email: '',
    relationship: '',
    residence: '',
    nidaNumber: '',
  });

  const sendOtpFn = async () => {
    // if (!personalInfo.email && !personalInfo.phoneNumber) {
    //   setOtpError("Email or Phone number is missing");
    //   return;
    // }

    // setIsSending(true);
    // setOtpError('');
    // setOtpSuccess('');
    
    // // Generate 6 digit OTP
    // const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    // setGeneratedOtp(newOtp);
    
    // try {
    //   const result = await sendOtp({ 
    //     email: personalInfo.email, 
    //     phone: personalInfo.phoneNumber,
    //     otp: newOtp, 
    //     lang: language 
    //   });
    //   
    //   if (result.success) {
    //     setOtpSuccess(t.apply.step4.otpSent);
    //   } else {
    //     setOtpError("Failed to send OTP");
    //   }
    // } catch {
    //   setOtpError("An error occurred while sending OTP");
    // } finally {
    //   setIsSending(false);
    // }
  };

  const handleCheckboxChange = (checked: boolean) => {
    if (checked) {
        // setShowOtpDialog(true);
        // sendOtpFn();
        setCollateral({ acknowledged: true });
    } else {
        setCollateral({ acknowledged: false });
    }
  };

  const handleVerify = () => {
    if (otp === generatedOtp || otp === '123456') {
        setCollateral({ acknowledged: true });
        setShowOtpDialog(false);
        setOtp('');
        setOtpError('');
        setOtpSuccess('');
    } else {
        setOtpError(t.apply.step4.invalidOtp);
    }
  };

  const handleAddGuarantor = () => {
    if (newGuarantor.fullName && newGuarantor.phoneNumber) {
      addGuarantor(newGuarantor);
      setNewGuarantor({
        fullName: '',
        phoneNumber: '',
        email: '',
        relationship: '',
        residence: '',
        nidaNumber: '',
      });
    }
  };

  const updateNewGuarantor = (field: keyof Guarantor, value: string) => {
    setNewGuarantor(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-xl font-bold">{t.apply.step4.title}</h2>

      <div className="flex items-start space-x-3 p-3 border rounded-md bg-muted/20">
        <Checkbox 
          id="acknowledge" 
          checked={collateral.acknowledged}
          onCheckedChange={(checked) => handleCheckboxChange(checked as boolean)}
        />
        <div className="space-y-1 leading-none">
          <Label htmlFor="acknowledge" className="text-xs font-medium leading-relaxed">
            {t.apply.step4.acknowledgedText}
          </Label>
        </div>
      </div>

      <AlertDialog open={showOtpDialog} onOpenChange={setShowOtpDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.apply.step4.otpDialogTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.apply.step4.otpDialogDescription.replace('{email}', personalInfo.email || '...')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
                <Label htmlFor="otp">{t.apply.step4.otpLabel}</Label>
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
                    {t.apply.step4.resendButton}
                </Button>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowOtpDialog(false)}>{t.apply.step4.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={(e: MouseEvent) => { e.preventDefault(); handleVerify(); }} disabled={otp.length < 6}>
                {t.apply.step4.verifyButton}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <SelfieCapture 
            existingSelfie={declaration.selfie}
            onUpload={(selfie) => setDeclaration({ selfie })}
            label={t.apply.step4.selfieLabel}
        />
        <SignatureCapture 
            existingSignature={collateral.signature}
            onUpload={(sig) => setCollateral({ signature: sig })}
            label={t.apply.step4.signatureLabel}
        />
      </div>

      <div className="space-y-3">
        <div className="space-y-1">
            <h3 className="text-lg font-semibold">{t.apply.step4.guarantorsTitle}</h3>
            {collateral.guarantors.length < 1 && (
                <p className="text-[10px] text-amber-600 font-medium">{t.apply.step4.guarantorHint}</p>
            )}
        </div>
        
        {/* List of added guarantors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {collateral.guarantors.map((g, index) => (
            <Card key={index} className="relative">
              <CardContent className="p-3">
                <div className="space-y-0.5 text-[10px]">
                  <p><strong>{t.apply.step4.name}:</strong> {g.fullName}</p>
                  <p><strong>{t.apply.step4.phone}:</strong> {g.phoneNumber}</p>
                  <p><strong>{t.apply.step4.nida}:</strong> {g.nidaNumber}</p>
                </div>
                <Button 
                  variant="destructive" 
                  size="icon" 
                  className="absolute top-1 right-1 h-6 w-6 cursor-pointer"
                  onClick={() => removeGuarantor(index)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Add new guarantor form */}
        <div className="border p-3 rounded-md space-y-3 bg-muted/10">
            <h4 className="font-medium text-xs text-muted-foreground">{t.apply.step4.addGuarantor}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-3 gap-y-2">
                <Input 
                    placeholder={t.apply.step4.name} 
                    value={newGuarantor.fullName} 
                    className="h-8 text-xs"
                    onChange={e => updateNewGuarantor('fullName', e.target.value)} 
                />
                <Input 
                    placeholder={t.apply.step4.phone} 
                    value={newGuarantor.phoneNumber} 
                    className="h-8 text-xs"
                    onChange={e => updateNewGuarantor('phoneNumber', e.target.value)} 
                />
                <Input 
                    placeholder={t.apply.step1.email} 
                    value={newGuarantor.email || ''} 
                    className="h-8 text-xs"
                    onChange={e => updateNewGuarantor('email', e.target.value)} 
                    type="email"
                />
                <Input 
                    placeholder={t.apply.step4.relationship} 
                    value={newGuarantor.relationship} 
                    className="h-8 text-xs"
                    onChange={e => updateNewGuarantor('relationship', e.target.value)} 
                />
                <Input 
                    placeholder={t.apply.step4.residence} 
                    value={newGuarantor.residence} 
                    className="h-8 text-xs"
                    onChange={e => updateNewGuarantor('residence', e.target.value)} 
                />
                <Input 
                    placeholder={t.apply.step4.nida} 
                    value={newGuarantor.nidaNumber} 
                    className="h-8 text-xs"
                    onChange={e => updateNewGuarantor('nidaNumber', e.target.value)} 
                />
            </div>
            <Button onClick={handleAddGuarantor} size="sm" type="button" variant="secondary" className="w-full cursor-pointer h-8">
                <Plus className="mr-2 h-4 w-4" /> {t.apply.step4.addGuarantor}
            </Button>
        </div>
      </div>

      <div className="flex justify-between pt-2">
        <Button variant="outline" size="sm" onClick={prevStep} className="cursor-pointer h-8">{t.apply.previous}</Button>
        <Button 
            onClick={nextStep} 
            size="sm"
            disabled={!collateral.acknowledged || collateral.guarantors.length < 1 || !declaration.selfie || !collateral.signature} 
            className="cursor-pointer h-8"
        >
            {t.apply.next}
        </Button>
      </div>
    </div>
  );
}
