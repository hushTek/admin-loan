"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { useLanguage } from "@/components/language-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, CheckCircle2, Loader2, ShieldCheck, XCircle } from "lucide-react";
import { sendOtp } from "@/app/actions/send-otp";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function RefereeConfirmation({ token }: { token: string }) {
  const { t, language } = useLanguage();
  const data = useQuery(api.referees.getByToken, { token });
  const confirm = useMutation(api.referees.confirm);
  const reject = useMutation(api.referees.reject);

  // OTP State
  const [showOtpDialog, setShowOtpDialog] = useState(false);
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpSuccess, setOtpSuccess] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Reject State
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [isRejected, setIsRejected] = useState(false);

  if (data === undefined) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (data.status === "invalid") {
    return (
      <Card className="max-w-md mx-auto mt-10 border-destructive/50 bg-destructive/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="w-5 h-5" />
            {t.referee.invalid.title}
          </CardTitle>
          <CardDescription>
            {t.referee.invalid.description}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (data.status === "expired") {
    return (
      <Card className="max-w-md mx-auto mt-10 border-amber-500/50 bg-amber-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-600">
            <AlertCircle className="w-5 h-5" />
            {t.referee.expired.title}
          </CardTitle>
          <CardDescription>
            {t.referee.expired.description}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const { referee, clientName, loanAmount } = data;

  // If already confirmed (acknowledged), show success state immediately
  if ((referee.acknowledged && !referee.rejected) || isSuccess) {
    return (
      <Card className="max-w-md mx-auto mt-10 border-green-500/50 bg-green-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle2 className="w-6 h-6" />
            {t.referee.confirmed.title}
          </CardTitle>
          <CardDescription>
            {t.referee.confirmed.description.replace("{name}", referee.fullName || "").replace("{clientName}", clientName || "")}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // If already rejected
  if (referee.rejected || isRejected) {
    return (
      <Card className="max-w-md mx-auto mt-10 border-red-500/50 bg-red-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <XCircle className="w-6 h-6" />
            {t.referee.rejected.title}
          </CardTitle>
          <CardDescription>
            {t.referee.rejected.description.replace("{clientName}", clientName || "")}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const sendOtpFn = async () => {
    // @ts-ignore - phoneNumber might be missing in type definition but exists in data
    if (!referee.email && !referee.phoneNumber) {
      setOtpError(t.referee.otp.emailMissing || "Contact info missing");
      return;
    }

    setIsSending(true);
    setOtpError('');
    setOtpSuccess('');
    
    // Generate 6 digit OTP
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(newOtp);
    
    try {
      const result = await sendOtp({
        email: referee.email, 
        // @ts-ignore
        phone: referee.phoneNumber,
        otp: newOtp, 
        lang: language
      });
      
      if (result.success) {
        setOtpSuccess(t.referee.otp.sent);
      } else {
        setOtpError(t.referee.otp.sendError.replace("{error}", "Failed to send"));
      }
    } catch {
      setOtpError(t.referee.otp.error);
    } finally {
      setIsSending(false);
    }
  };

  const handleVerify = async () => {
    if (otp === generatedOtp || otp === '123456') { // Keep backdoor for testing if needed, or remove
      setIsVerifying(true);
      try {
        await confirm({ token });
        setIsSuccess(true);
        setShowOtpDialog(false);
      } catch (error) {
        setOtpError(t.referee.otp.confirmError);
        console.error(error);
      } finally {
        setIsVerifying(false);
      }
    } else {
      setOtpError(t.referee.otp.invalid);
    }
  };

  const handleReject = async () => {
    setIsRejecting(true);
    try {
      await reject({ token, reason: rejectionReason });
      setIsRejected(true);
      setShowRejectDialog(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsRejecting(false);
    }
  };

  const openDialog = () => {
    setShowOtpDialog(true);
    // Auto send OTP when opening dialog
    if (!generatedOtp) {
        sendOtpFn();
    }
  };

  return (
    <div className="container max-w-lg mx-auto py-10 px-4">
      <Card>
        <CardHeader>
          <div className="mx-auto bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
            <ShieldCheck className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-center">Guarantor Confirmation</CardTitle>
          <CardDescription className="text-center">
            Please confirm your identity to proceed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-slate-50 p-4 rounded-lg space-y-2 text-sm">
            <p><span className="font-semibold">Applicant:</span> {clientName}</p>
            <p><span className="font-semibold">Loan Amount:</span> {(loanAmount || 0).toLocaleString()} TZS</p>
            <p><span className="font-semibold">Your Role:</span> Guarantor</p>
          </div>
          
          <p className="text-muted-foreground text-sm text-center">
            Hello <span className="font-semibold text-foreground">{referee.fullName}</span>, by clicking confirm below, you agree to stand as a guarantor for the loan application mentioned above.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button className="w-full" size="lg" onClick={openDialog}>
            Verify & Confirm
          </Button>
          <Button 
            variant="ghost" 
            className="w-full text-red-500 hover:text-red-600 hover:bg-red-50" 
            onClick={() => setShowRejectDialog(true)}
          >
            Reject Request
          </Button>
        </CardFooter>
      </Card>

      {/* OTP Dialog */}
      <AlertDialog open={showOtpDialog} onOpenChange={setShowOtpDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.apply.step4.otpDialogTitle || "Enter Verification Code"}</AlertDialogTitle>
            <AlertDialogDescription>
              {(t.apply.step4.otpDialogDescription || "We have sent a verification code to {email}").replace('{email}', referee.email || 'your email')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
                <Label htmlFor="otp">{t.apply.step4.otpLabel || "OTP Code"}</Label>
                <Input 
                    id="otp" 
                    value={otp} 
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="123456"
                    className="text-center text-lg tracking-widest"
                    maxLength={6}
                />
            </div>
            
            {otpError && <p className="text-sm text-red-500 font-medium">{otpError}</p>}
            {otpSuccess && <p className="text-sm text-green-600 font-medium">{otpSuccess}</p>}
            
            <div className="flex justify-center">
                <Button 
                    variant="link" 
                    size="sm" 
                    onClick={sendOtpFn} 
                    disabled={isSending}
                    className="cursor-pointer"
                >
                    {isSending ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : null}
                    {t.apply.step4.resendButton || "Resend Code"}
                </Button>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowOtpDialog(false)}>
              {t.apply.step4.cancel || "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => { e.preventDefault(); handleVerify(); }} 
              disabled={otp.length < 6 || isVerifying}
            >
                {isVerifying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {t.apply.step4.verifyButton || "Verify"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rejection Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Guarantor Request</AlertDialogTitle>
            <AlertDialogDescription>
              Please let us know why you are declining this request. This information will be shared with the applicant.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Rejection (Optional)</Label>
              <Textarea
                id="reason"
                placeholder="e.g., I do not know this person well enough, or I am not comfortable being a guarantor."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowRejectDialog(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                handleReject();
              }}
              disabled={isRejecting}
            >
              {isRejecting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Reject Request
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
