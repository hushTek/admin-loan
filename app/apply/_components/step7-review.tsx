'use client';

import { useApplicationStore } from '@/lib/stores/application-store';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/components/language-provider';
import { useState, useMemo } from 'react';
import { Loader2, FileIcon, Eye, Download } from 'lucide-react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { sendApplicationNumberEmail } from '../../actions/send-app-number';
import { sendGuarantorInviteEmail } from '../../actions/send-guarantor-invite';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function AttachmentPreview({ name, storageId }: { name: string; storageId: string }) {
  const url = useQuery(api.files.getUrl, { storageId });

  if (!url) return <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="w-3 h-3 animate-spin" /> Loading...</div>;

  const isImage = name.match(/\.(jpg|jpeg|png|gif|webp)$/i);

  return (
    <div className="flex items-center justify-between p-2 border rounded-md bg-background">
      <div className="flex items-center gap-2 overflow-hidden">
        <FileIcon className="w-4 h-4 shrink-0 text-blue-500" />
        <span className="text-sm truncate max-w-[150px]" title={name}>{name}</span>
      </div>
      <div className="flex gap-1 shrink-0">
        {isImage ? (
          <a href={url} target="_blank" rel="noopener noreferrer" className="p-1.5 hover:bg-muted rounded-md transition-colors" title="Preview">
            <Eye className="w-4 h-4 text-gray-600" />
          </a>
        ) : (
          <a href={url} download={name} className="p-1.5 hover:bg-muted rounded-md transition-colors" title="Download">
            <Download className="w-4 h-4 text-gray-600" />
          </a>
        )}
      </div>
    </div>
  );
}

export function Step7Review() {
  const { personalInfo, loanDetails, collateral, declaration, attachments, resetForm, nextStep, setApplicationNumber, applicationNumber } = useApplicationStore();
  const { t, language } = useLanguage();
  const submitApp = useMutation(api.applications.submit);
  const [submitting, setSubmitting] = useState(false);
  const review = (t as unknown as { apply: { review: { title: string; submit: string; cancel: string }}}).apply.review;

  const loanType = useQuery(api.loantype.get, loanDetails.loanTypeId ? { id: loanDetails.loanTypeId as Id<"loanTypes"> } : "skip");
  const amountNum = Number(loanDetails.amount || 0);

  const calculations = useMemo(() => {
    if (!loanType) return null;

    // Processing Fee
    let processingFee = 0;
    const feeType = loanType.processingFeeType as "percentage" | "fixed" | undefined;
    const feeValue = loanType.processingFeeValue ?? 0;
    if (feeType === "percentage") {
      processingFee = amountNum * (feeValue / 100);
    } else if (feeType === "fixed") {
      processingFee = feeValue;
    }

    // Monthly Return (Installment)
    const periods = loanType.repaymentFrequency === 'monthly' ? loanType.durationMonths : loanType.durationMonths * 4;
    const totalRate = loanType.interestRate / 100;
    let installment = 0;

    if (loanType.calculationMethod === 'flat') {
      const totalInterest = amountNum * totalRate;
      installment = (amountNum + totalInterest) / periods;
    } else {
      const perMonthRate = totalRate / loanType.durationMonths;
      const r = loanType.repaymentFrequency === 'monthly' ? perMonthRate : perMonthRate / 4;
      const emi = (amountNum * r * Math.pow(1 + r, periods)) / (Math.pow(1 + r, periods) - 1);
      installment = emi;
    }
    
    // Adjust for display if weekly (show monthly equivalent or just installment)
    const monthlyReturn = loanType.repaymentFrequency === 'monthly' ? installment : installment * 4;

    return {
      processingFee,
      monthlyReturn
    };
  }, [loanType, amountNum]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await submitApp({
        applicationNumber: applicationNumber || undefined,
        contact: {
          name: personalInfo.fullName,
          dateOfBirth: personalInfo.dateOfBirth,
          phoneNumber: personalInfo.phoneNumber,
          email: personalInfo.email,
          maritalStatus: personalInfo.maritalStatus,
          spouseName: personalInfo.spouseName,
          residence: {
            street: personalInfo.residence.street,
            houseNumber: personalInfo.residence.houseNumber,
            ward: personalInfo.residence.ward,
            district: personalInfo.residence.district,
            region: personalInfo.residence.region,
            ownership: personalInfo.residence.ownership,
          },
          employment: {
            status: personalInfo.employment.status,
            companyName: personalInfo.employment.companyName,
            address: personalInfo.employment.address,
            position: personalInfo.employment.position,
          },
          nidaNumber: personalInfo.nidaNumber,
        },
        loanDetails: {
          loanTypeId: loanDetails.loanTypeId as Id<"loanTypes">,
          amount: loanDetails.amount,
          existingLoan: loanDetails.existingLoan,
          purpose: loanDetails.purpose,
        },
        guarantors: collateral.guarantors.map(g => ({
          fullName: g.fullName,
          phoneNumber: g.phoneNumber,
          email: g.email,
          relationship: g.relationship,
          residence: g.residence,
          nidaNumber: g.nidaNumber,
        })),
        attachments: [
          ...(attachments.nidaId && attachments.nidaId.storageId ? [{ type: "nida" as const, storageId: attachments.nidaId.storageId, fileName: attachments.nidaId.name }] : []),
          ...(attachments.introLetter && attachments.introLetter.storageId ? [{ type: "local_letter" as const, storageId: attachments.introLetter.storageId, fileName: attachments.introLetter.name }] : []),
          ...(attachments.collateralDoc && attachments.collateralDoc.storageId ? [{ type: "collateral" as const, storageId: attachments.collateralDoc.storageId, fileName: attachments.collateralDoc.name }] : []),
          ...(declaration.selfie && declaration.selfie.storageId ? [{ type: "photo" as const, storageId: declaration.selfie.storageId, fileName: declaration.selfie.name }] : []),
          ...(collateral.signature && collateral.signature.storageId ? [{ type: "signature" as const, storageId: collateral.signature.storageId, fileName: collateral.signature.name }] : []),
        ],
        declarationAccepted: declaration.confirmed,
      });
      const result = res as { applicationId: Id<"loanApplications">; applicationNumber: string; invitations?: { email?: string; url: string }[] };
      setApplicationNumber(result.applicationNumber);
      if (personalInfo.email) {
        await sendApplicationNumberEmail(personalInfo.email, result.applicationNumber, language);
      }
      if (Array.isArray(result.invitations)) {
        for (const inv of result.invitations) {
          if (inv.email) {
            await sendGuarantorInviteEmail(inv.email, inv.url, language);
          }
        }
      }
      nextStep();
    } catch {
      alert('Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-xl font-bold">{review.title}</h2>

      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-base">Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="text-xs flex flex-col sm:flex-row gap-3">
             <div className="flex-1 space-y-0.5">
                <p className="font-semibold">{personalInfo.fullName}</p>
                <p className="text-muted-foreground">{personalInfo.phoneNumber} • {personalInfo.email}</p>
                <p className="text-muted-foreground truncate">{personalInfo.residence.street}, {personalInfo.residence.ward}, {personalInfo.residence.district}, {personalInfo.residence.region}</p>
             </div>
             {declaration.selfie?.url && (
               <div className="shrink-0">
                 <img src={declaration.selfie.url} alt="Selfie" className="w-16 h-16 object-cover rounded-full border border-primary/20" />
               </div>
             )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-base">Loan Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-x-4 gap-y-2 sm:grid-cols-2 md:grid-cols-4 text-xs">
             <div>
                <p className="text-muted-foreground">Requested Amount</p>
                <p className="font-semibold">{Intl.NumberFormat().format(amountNum)} TZS</p>
             </div>
             <div className="col-span-1 md:col-span-1">
                <p className="text-muted-foreground">Purpose</p>
                <p className="font-semibold truncate" title={loanDetails.purpose}>{loanDetails.purpose}</p>
             </div>
             <div>
                <p className="text-muted-foreground">Processing Fee</p>
                <p className="font-semibold">
                    {calculations ? `${Intl.NumberFormat().format(Math.round(calculations.processingFee))} TZS` : <Loader2 className="w-3 h-3 animate-spin inline" />}
                </p>
             </div>
             <div>
                <p className="text-muted-foreground">Monthly Return</p>
                <p className="font-semibold">
                    {calculations ? `~${Intl.NumberFormat().format(Math.round(calculations.monthlyReturn))} TZS` : <Loader2 className="w-3 h-3 animate-spin inline" />}
                </p>
             </div>
          </CardContent>
        </Card>

        {collateral.guarantors.length > 0 && (
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-base">Guarantors</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="divide-y text-xs">
                    {collateral.guarantors.map((g, i) => (
                        <div key={i} className="py-1.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                            <div className="font-medium">{g.fullName}</div>
                            <div className="text-muted-foreground flex gap-3">
                                <span>{g.relationship}</span>
                                <span>•</span>
                                <span>{g.phoneNumber}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-base">Attachments & Verification</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {attachments.nidaId && attachments.nidaId.storageId && (
                <div className="space-y-1">
                    <span className="text-[10px] text-muted-foreground">NIDA ID</span>
                    <AttachmentPreview name={attachments.nidaId.name} storageId={attachments.nidaId.storageId} />
                </div>
              )}
              {attachments.introLetter && attachments.introLetter.storageId && (
                <div className="space-y-1">
                    <span className="text-[10px] text-muted-foreground">Intro Letter</span>
                    <AttachmentPreview name={attachments.introLetter.name} storageId={attachments.introLetter.storageId} />
                </div>
              )}
              {attachments.collateralDoc && attachments.collateralDoc.storageId && (
                <div className="space-y-1">
                    <span className="text-[10px] text-muted-foreground">Collateral Doc</span>
                    <AttachmentPreview name={attachments.collateralDoc.name} storageId={attachments.collateralDoc.storageId} />
                </div>
              )}
               {!attachments.nidaId && !attachments.introLetter && !attachments.collateralDoc && !declaration.selfie && !collateral.signature && (
                <p className="text-xs text-muted-foreground italic">No attachments uploaded</p>
              )}
              {collateral.signature?.url && (
                <div className="space-y-1">
                    <span className="text-[10px] text-muted-foreground">Applicant Signature</span>
                    <div className="p-1.5 border rounded-md bg-background flex items-center justify-center h-[42px]">
                        <img src={collateral.signature.url} alt="Signature" className="max-h-8" />
                    </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between gap-4 pt-2">
        <Button variant="destructive" size="sm" onClick={resetForm} className="cursor-pointer h-8">{review.cancel}</Button>
        <Button onClick={handleSubmit} size="sm" disabled={submitting} className="cursor-pointer h-8">
          {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {review.submit}
        </Button>
      </div>
    </div>
  );
}
