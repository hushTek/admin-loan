'use client';

import { useApplicationStore } from '@/lib/stores/application-store';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/components/language-provider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function Step2Employment() {
  const { personalInfo, setPersonalInfo, nextStep, prevStep } = useApplicationStore();
  const { t } = useLanguage();

  const handleEmploymentChange = (field: "status" | "companyName" | "address" | "position", value: string) => {
    setPersonalInfo({
      ...personalInfo,
      employment: {
        ...personalInfo.employment,
        [field]: value,
      },
    });
  };

  const isEmployed = personalInfo.employment.status === 'employed' || personalInfo.employment.status === 'self_employed';
  
  const isComplete = 
    !!personalInfo.employment.status && 
    (!isEmployed || (
      !!personalInfo.employment.companyName &&
      !!personalInfo.employment.address &&
      !!personalInfo.employment.position
    ));

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-xl font-bold">{t.apply.step2.title}</h2>
      
      <div className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="employment.status" className="text-xs">{t.apply.step2.employmentStatus}</Label>
          <Select
            value={personalInfo.employment.status}
            onValueChange={(val) => handleEmploymentChange("status", val)}
          >
            <SelectTrigger className="w-full h-8">
              <SelectValue placeholder={t.apply.step2.employmentStatus} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="employed">{t.apply.step2.employed}</SelectItem>
              <SelectItem value="self_employed">{t.apply.step2.selfEmployed}</SelectItem>
              <SelectItem value="unemployed">{t.apply.step2.unemployed}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isEmployed && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3 animate-in fade-in zoom-in-95 duration-300">
            <div className="space-y-1">
              <Label htmlFor="employment.companyName" className="text-xs">{t.apply.step2.companyName}</Label>
              <Input
                id="employment.companyName"
                value={personalInfo.employment.companyName}
                onChange={(e) => handleEmploymentChange("companyName", e.target.value)}
                className="h-8"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="employment.address" className="text-xs">{t.apply.step2.address}</Label>
              <Input
                id="employment.address"
                value={personalInfo.employment.address}
                onChange={(e) => handleEmploymentChange("address", e.target.value)}
                className="h-8"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="employment.position" className="text-xs">{t.apply.step2.position}</Label>
              <Input
                id="employment.position"
                value={personalInfo.employment.position}
                onChange={(e) => handleEmploymentChange("position", e.target.value)}
                className="h-8"
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between pt-2">
        <Button variant="outline" size="sm" onClick={prevStep} className="cursor-pointer h-8">{t.apply.previous}</Button>
        <Button onClick={nextStep} size="sm" disabled={!isComplete} className="cursor-pointer h-8">{t.apply.next}</Button>
      </div>
    </div>
  );
}
