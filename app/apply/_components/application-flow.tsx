'use client';

import { useApplicationStore } from '@/lib/stores/application-store';
import { Step1PersonalInfo } from './step1-personal-info';
import { Step2Employment } from './step2-employment';
import { Step3LoanDetails } from './step3-loan-details';
import { Step4Collateral } from './step4-collateral';
import { Step5Attachments } from './step5-attachments';
import { Step6Declaration } from './step6-declaration';
import { Step7Confirmation } from './step7-confirmation';
import { Step7Review } from './step7-review';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/components/language-provider';

export function ApplicationFlow() {
  const { currentStep } = useApplicationStore();
  const { t } = useLanguage();

  // Calculate progress percentage based on 8 steps
  const progress = (currentStep / 8) * 100;

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1PersonalInfo />;
      case 2:
        return <Step2Employment />;
      case 3:
        return <Step3LoanDetails />;
      case 4:
        return <Step4Collateral />;
      case 5:
        return <Step5Attachments />;
      case 6:
        return <Step6Declaration />;
      case 7:
        return <Step7Review />;
      case 8:
        return <Step7Confirmation />;
      default:
        return <Step1PersonalInfo />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="mb-6 space-y-3">
        <h1 className="text-2xl font-bold text-center">{t.apply.pageTitle}</h1>
        
        {currentStep < 8 && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{t.apply.stepLabel} {currentStep} {t.apply.ofTotal}</span>
                    <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-1.5" />
            </div>
        )}
      </div>

      <div className="p-0">
        {renderStep()}
      </div>
    </div>
  );
}
