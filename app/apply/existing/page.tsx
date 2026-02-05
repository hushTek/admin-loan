 "use client"
 
 import { useState, useEffect } from "react"
 import { useRouter } from "next/navigation"
 import { useQuery } from "convex/react"
 import { api } from "@/convex/_generated/api"
 import { useApplicationStore } from "@/lib/stores/application-store"
 import { useLanguage } from "@/components/language-provider"
 import { Button } from "@/components/ui/button"
 import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ApplicationFlow } from "../_components/application-flow"

export default function ExistingApplyPage() {
  const { t } = useLanguage()
  const [nida, setNida] = useState("")
  const [submittedNida, setSubmittedNida] = useState<string | null>(null)
  const contact = useQuery(api.contacts.getByNida, submittedNida ? { nida: submittedNida } : "skip")
  const { setPersonalInfo, setStep, currentStep } = useApplicationStore()
  const [isVerified, setIsVerified] = useState(false)

  useEffect(() => {
    if (contact) {
      setPersonalInfo({
        fullName: contact.name || "",
        dateOfBirth: contact.dateOfBirth || "",
        phoneNumber: contact.phone || "",
        email: contact.email || "",
        maritalStatus: contact.marital?.status || "",
        spouseName: contact.marital?.name || "",
        nidaNumber: contact.identity?.serial || "",
        residence: {
          street: contact.address?.street || "",
          houseNumber: contact.address?.houseNumber || "",
          ward: contact.address?.ward || "",
          district: contact.address?.district || "",
          region: contact.address?.region || "",
          ownership: contact.address?.ownership || contact.address?.residenceOwnership || "",
        },
        employment: {
          status: contact.work?.status || "",
          companyName: contact.work?.company || "",
          address: contact.work?.address || "",
          position: contact.work?.designation || "",
        },
      })
      setStep(3)
      setIsVerified(true)
    }
  }, [contact, setPersonalInfo, setStep])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (nida.trim()) {
      setSubmittedNida(nida.trim())
    }
  }

  if (isVerified) {
    return (
      <div className="container max-w-3xl mx-auto py-6 px-4">
        <ApplicationFlow />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
       <div className="container mx-auto py-12 px-4 max-w-xl">
         <Card className="border-none shadow-md">
           <CardHeader>
             <CardTitle className="text-xl">{t.apply?.existing?.title || "Existing Customer"}</CardTitle>
             <CardDescription>{t.apply?.existing?.description || "Enter your NIDA number to prefill your application."}</CardDescription>
           </CardHeader>
           <CardContent>
             <form onSubmit={handleSubmit} className="space-y-4">
               <Input
                 placeholder={t.apply?.existing?.nidaPlaceholder || "NIDA Number"}
                 value={nida}
                 onChange={(e) => setNida(e.target.value)}
                 className="h-12 text-lg"
               />
               <div className="flex justify-end">
                 <Button type="submit" className="h-12 px-6">{t.apply?.existing?.continue || "Continue"}</Button>
               </div>
             </form>
           </CardContent>
         </Card>
       </div>
     </div>
   )
 }
