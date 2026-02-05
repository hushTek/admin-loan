'use client';

import { useApplicationStore } from '@/lib/stores/application-store';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Eye, Download, FileIcon, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/components/language-provider';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useMemo } from 'react';
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

export function Step7Confirmation() {
  const { resetForm, applicationNumber, loanDetails, collateral, attachments } = useApplicationStore();
  const { t } = useLanguage();

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
    // User asked for "monthly returns ( each month )"
    // If frequency is weekly, the monthly return is approx installment * 4
    const monthlyReturn = loanType.repaymentFrequency === 'monthly' ? installment : installment * 4;

    return {
      processingFee,
      monthlyReturn
    };
  }, [loanType, amountNum]);

  const handleFinish = () => {
    resetForm();
    // Navigate to home or dashboard
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-8 text-center animate-in zoom-in duration-500 py-10 max-w-2xl mx-auto">
      <div className="flex flex-col items-center space-y-4">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        
        <h2 className="text-3xl font-bold">{t.apply.step7.title}</h2>
        
        <p className="text-muted-foreground max-w-md">
          {t.apply.step7.thanks}
        </p>

        <div className="p-4 border border-dashed rounded-lg bg-muted/30 w-full max-xs mx-auto">
          <p className="text-sm text-muted-foreground mb-1">{t.apply.step7.appNumber}</p>
          <p className="text-xl font-mono font-bold tracking-wider">{applicationNumber || 'TFM-......'}</p>
        </div>
      </div>

      <div className="grid gap-6 w-full text-left">
        {/* Loan Details */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Loan Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3 text-sm">
             <div>
                <p className="text-muted-foreground">Requested Amount</p>
                <p className="font-semibold">{Intl.NumberFormat().format(amountNum)} TZS</p>
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

        {/* Guarantors */}
        {collateral.guarantors.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Guarantors</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="divide-y">
                    {collateral.guarantors.map((g, i) => (
                        <div key={i} className="py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                            <div className="font-medium">{g.fullName}</div>
                            <div className="text-sm text-muted-foreground flex gap-3">
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

        {/* Attachments */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Attachments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {attachments.nidaId && (
                <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">NIDA ID</span>
                    <AttachmentPreview name={attachments.nidaId.name} storageId={attachments.nidaId.storageId} />
                </div>
              )}
              {attachments.introLetter && (
                <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">Intro Letter</span>
                    <AttachmentPreview name={attachments.introLetter.name} storageId={attachments.introLetter.storageId} />
                </div>
              )}
              {attachments.collateralDoc && (
                <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">Collateral Doc</span>
                    <AttachmentPreview name={attachments.collateralDoc.name} storageId={attachments.collateralDoc.storageId} />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="pt-4 space-x-4">
        <Link href="/">
            <Button variant="outline" onClick={handleFinish} className="cursor-pointer">{t.apply.step7.backHome}</Button>
        </Link>
        <Link href="/status">
            <Button onClick={handleFinish} className="cursor-pointer">{t.apply.step7.checkStatus}</Button>
        </Link>
      </div>
    </div>
  );
}
