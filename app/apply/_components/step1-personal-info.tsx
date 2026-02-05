'use client';

import { useApplicationStore } from '@/lib/stores/application-store';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/components/language-provider';
import { useState, useMemo } from 'react';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox';

const TZ_REGIONS = [
  "Arusha", "Dar es Salaam", "Dodoma", "Geita", "Iringa", "Kagera", "Katavi", 
  "Kigoma", "Kilimanjaro", "Lindi", "Manyara", "Mara", "Mbeya", "Morogoro", 
  "Mtwara", "Mwanza", "Njombe", "Pemba North", "Pemba South", "Pwani", 
  "Rukwa", "Ruvuma", "Shinyanga", "Simiyu", "Singida", "Songwe", "Tabora", 
  "Tanga", "Zanzibar North", "Zanzibar South", "Zanzibar Urban/West"
];

export function Step1PersonalInfo() {
  const { personalInfo, setPersonalInfo, nextStep, prevStep } = useApplicationStore();
  const { t } = useLanguage();
  const [showValidation, setShowValidation] = useState(false);
  const [regionSearch, setRegionSearch] = useState('');
  const [regionPage, setRegionPage] = useState(0);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      // Type assertion to handle the nested dynamic access safely
      const parentKey = parent as keyof typeof personalInfo;
      // We need to ensure parentKey corresponds to an object property in personalInfo
      if (typeof personalInfo[parentKey] === 'object' && personalInfo[parentKey] !== null) {
          setPersonalInfo({
            ...personalInfo,
            [parentKey]: {
              ...(personalInfo[parentKey] as object),
              [child]: value,
            },
          });
      }
    } else {
      setPersonalInfo({ ...personalInfo, [name]: value });
    }
  };

  const handleNestedChange = (parent: keyof typeof personalInfo, child: string, value: string) => {
     // Verify parent is an object property before spreading
     if (typeof personalInfo[parent] === 'object' && personalInfo[parent] !== null) {
        setPersonalInfo({
            ...personalInfo,
            [parent]: {
                ...(personalInfo[parent] as object),
                [child]: value
            }
        });
     }
  }

  // Calculate errors
  const errors = useMemo(() => {
    const errs: Record<string, string> = {};
    if (!personalInfo.fullName) errs.fullName = "Jina Kamili linahitajika";
    if (!personalInfo.dateOfBirth) errs.dateOfBirth = "Tarehe ya Kuzaliwa inahitajika";
    if (!personalInfo.email) errs.email = "Barua pepe inahitajika"; // Email is now mandatory
    // if (!personalInfo.phoneNumber) errs.phoneNumber = "Nambari ya simu inahitajika"; // Phone is optional for now
    if (!personalInfo.maritalStatus) errs.maritalStatus = "Hali ya Ndoa inahitajika";
    if (!personalInfo.nidaNumber) errs.nidaNumber = "Namba ya NIDA inahitajika";
    
    if (!personalInfo.residence.street) errs['residence.street'] = "Mtaa unahitajika";
    if (!personalInfo.residence.region) errs['residence.region'] = "Mkoa unahitajika";
    if (!personalInfo.residence.ownership) errs['residence.ownership'] = "Umiliki wa Makaazi unahitajika";
    
    return errs;
  }, [personalInfo]);

  const hasErrors = Object.keys(errors).length > 0;
  const filteredRegions = TZ_REGIONS.filter(r => r.toLowerCase().includes(regionSearch.toLowerCase()));
  const pageSize = 7;
  const totalPages = Math.max(1, Math.ceil(filteredRegions.length / pageSize));
  const currentPage = Math.min(regionPage, totalPages - 1);
  const pageRegions = filteredRegions.slice(currentPage * pageSize, currentPage * pageSize + pageSize);

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-xl font-bold">{t.apply.step1.title}</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
        <div className="space-y-1">
          <Label htmlFor="fullName" className="text-xs">
            {t.apply.step1.fullName} <span className="text-red-500">*</span>
          </Label>
          <Input
            id="fullName"
            name="fullName"
            value={personalInfo.fullName}
            onChange={handleChange}
            placeholder="John Doe"
            className={(showValidation && errors.fullName) ? "border-red-500 h-8" : "h-8"}
          />
          {showValidation && errors.fullName && <p className="text-[10px] text-red-500">{errors.fullName}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="dateOfBirth" className="text-xs">
            {t.apply.step1.dateOfBirth} <span className="text-red-500">*</span>
          </Label>
          <Input
            id="dateOfBirth"
            name="dateOfBirth"
            type="date"
            value={personalInfo.dateOfBirth}
            onChange={handleChange}
            className={(showValidation && errors.dateOfBirth) ? "border-red-500 h-8" : "h-8"}
          />
          {showValidation && errors.dateOfBirth && <p className="text-[10px] text-red-500">{errors.dateOfBirth}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="phoneNumber" className="text-xs">
            {t.apply.step1.phoneNumber} (Optional)
          </Label>
          <Input
            id="phoneNumber"
            name="phoneNumber"
            value={personalInfo.phoneNumber}
            onChange={handleChange}
            placeholder="+255..."
            className="h-8"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="email" className="text-xs">
            {t.apply.step1.email} <span className="text-red-500">*</span>
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={personalInfo.email}
            onChange={handleChange}
            placeholder="john@example.com"
            className={(showValidation && errors.email) ? "border-red-500 h-8" : "h-8"}
          />
          {showValidation && errors.email && <p className="text-[10px] text-red-500">{errors.email}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="maritalStatus" className="text-xs">
            {t.apply.step1.maritalStatus} <span className="text-red-500">*</span>
          </Label>
          <Input
            id="maritalStatus"
            name="maritalStatus"
            value={personalInfo.maritalStatus}
            onChange={handleChange}
            className={(showValidation && errors.maritalStatus) ? "border-red-500 h-8" : "h-8"}
          />
          {showValidation && errors.maritalStatus && <p className="text-[10px] text-red-500">{errors.maritalStatus}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="nidaNumber" className="text-xs">
            {t.apply.step1.nidaNumber} <span className="text-red-500">*</span>
          </Label>
          <Input
            id="nidaNumber"
            name="nidaNumber"
            value={personalInfo.nidaNumber}
            onChange={handleChange}
            className={(showValidation && errors.nidaNumber) ? "border-red-500 h-8" : "h-8"}
          />
          {showValidation && errors.nidaNumber && <p className="text-[10px] text-red-500">{errors.nidaNumber}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="spouseName" className="text-xs">{t.apply.step1.spouseName} (Optional)</Label>
          <Input
            id="spouseName"
            name="spouseName"
            value={personalInfo.spouseName}
            onChange={handleChange}
            className="h-8"
          />
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-lg font-semibold">{t.apply.step1.residenceTitle}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
          <div className="space-y-1">
            <Label htmlFor="residence.street" className="text-xs">
              {t.apply.step1.street} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="residence.street"
              value={personalInfo.residence.street}
              onChange={(e) => handleNestedChange('residence', 'street', e.target.value)}
              className={(showValidation && errors['residence.street']) ? "border-red-500 h-8" : "h-8"}
            />
            {showValidation && errors['residence.street'] && <p className="text-[10px] text-red-500">{errors['residence.street']}</p>}
          </div>
          <div className="space-y-1">
          <Label htmlFor="residence.houseNumber" className="text-xs">
              {t.apply.step1.houseNumber} (Optional)
            </Label>
            <Input
              id="residence.houseNumber"
              value={personalInfo.residence.houseNumber}
              onChange={(e) => handleNestedChange('residence', 'houseNumber', e.target.value)}
              className="h-8"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="residence.ward" className="text-xs">{t.apply.step1.ward} (Optional)</Label>
            <Input
              id="residence.ward"
              value={personalInfo.residence.ward}
              onChange={(e) => handleNestedChange('residence', 'ward', e.target.value)}
              className="h-8"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="residence.district" className="text-xs">{t.apply.step1.district} (Optional)</Label>
            <Input
              id="residence.district"
              value={personalInfo.residence.district}
              onChange={(e) => handleNestedChange('residence', 'district', e.target.value)}
              className="h-8"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="residence.region" className="text-xs">
              {t.apply.step1.region} <span className="text-red-500">*</span>
            </Label>
            <div className="w-full">
              <Combobox>
                <ComboboxInput
                  id="residence.region"
                  placeholder="Chagua Mkoa"
                  className={(showValidation && errors['residence.region']) ? "w-full border-red-500 h-8" : "w-full h-8"}
                  onChange={(e) => {
                    setRegionSearch(e.currentTarget.value);
                    setRegionPage(0);
                  }}
                />
                <ComboboxContent>
                  <ComboboxEmpty>Hakuna mkoa umepatikana.</ComboboxEmpty>
                  <ComboboxList>
                    {pageRegions.map((region) => (
                      <ComboboxItem
                        key={region}
                        value={region}
                        onClick={() => handleNestedChange('residence', 'region', region)}
                      >
                        {region}
                      </ComboboxItem>
                    ))}
                  </ComboboxList>
                  <div className="flex items-center justify-between p-2 border-t text-xs">
                    <span>Ukurasa {currentPage + 1} / {totalPages}</span>
                    <div className="space-x-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="xs"
                        className="cursor-pointer"
                        onClick={() => setRegionPage(Math.max(0, currentPage - 1))}
                        disabled={currentPage === 0}
                      >
                        Nyuma
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="xs"
                        className="cursor-pointer"
                        onClick={() => setRegionPage(Math.min(totalPages - 1, currentPage + 1))}
                        disabled={currentPage >= totalPages - 1}
                      >
                        Mbele
                      </Button>
                    </div>
                  </div>
                </ComboboxContent>
              </Combobox>
            </div>
            {showValidation && errors['residence.region'] && <p className="text-[10px] text-red-500">{errors['residence.region']}</p>}
          </div>
           <div className="space-y-1">
            <Label htmlFor="residence.ownership" className="text-xs">
              {t.apply.step1.ownership} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="residence.ownership"
              value={personalInfo.residence.ownership}
              onChange={(e) => handleNestedChange('residence', 'ownership', e.target.value)}
              className={(showValidation && errors['residence.ownership']) ? "border-red-500 h-8" : "h-8"}
            />
            {showValidation && errors['residence.ownership'] && <p className="text-[10px] text-red-500">{errors['residence.ownership']}</p>}
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-2">
        <Button variant="outline" size="sm" onClick={prevStep} className="cursor-pointer h-8">{t.apply.previous}</Button>
        <div 
            title={hasErrors ? `Tafadhali jaza fomu: ${Object.values(errors).join(', ')}` : "Endelea"} 
            className="inline-block"
            onMouseEnter={() => setShowValidation(true)}
        >
            <Button 
                onClick={nextStep} 
                size="sm"
                disabled={hasErrors} 
                className={`cursor-pointer h-8 ${hasErrors ? "opacity-50 cursor-not-allowed" : ""}`}
            >
                {t.apply.next}
            </Button>
        </div>
      </div>
    </div>
  );
}
