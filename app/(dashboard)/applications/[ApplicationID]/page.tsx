

"use client"

import { use, useState } from "react"
import { useLanguage } from "@/components/language-provider"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"
import { Loader2, Download, FileText, CheckCircle, XCircle, AlertCircle, Edit, Save } from "lucide-react"

export default function Page({ params }: { params: Promise<{ ApplicationID: string }> }) {
  const { ApplicationID } = use(params)
  const { t } = useLanguage()
  const applicationId = ApplicationID as Id<"loanApplications">
  
  const data = useQuery(api.applications.getById, { id: applicationId })
  const loanTypes = useQuery(api.applications.listLoanTypes)
  
  const updateStatus = useMutation(api.applications.updateStatus)
  const updateDetails = useMutation(api.applications.updateDetails)
  
  const [isEditing, setIsEditing] = useState(false)
  const [editAmount, setEditAmount] = useState("")
  const [editLoanType, setEditLoanType] = useState("")
  const [reviewNotes, setReviewNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [isRejecting, setIsRejecting] = useState(false)

  if (!data || !loanTypes) {
    return <div className="flex items-center justify-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  const { application, contact, loanType, referees, documents } = data

  const headshot = documents.find(d => d.type === 'photo')
  const signatureDoc = documents.find(d => d.type === 'signature')
  // @ts-ignore
  const signatureUrl = application.applicantSignatureUrl || signatureDoc?.fileUrl

  const handleEdit = () => {
    setEditAmount((application.requestedAmount ?? 0).toString())
    setEditLoanType(application.loanTypeId ?? "")
    setIsEditing(true) 
  }

  const handleSaveDetails = async () => {
    try {
      setIsSubmitting(true)
      await updateDetails({
        id: applicationId,
        amount: parseFloat(editAmount),
        loanTypeId: editLoanType as Id<"loanTypes">
      })
      setIsEditing(false)
    } catch (error) {
      console.error("Failed to update details", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStatusUpdate = async (newStatus: "approved" | "rejected" | "under_review", notes?: string) => {
    try {
      setIsSubmitting(true)
      await updateStatus({
        id: applicationId,
        status: newStatus,
        reviewNotes: notes
      })
      setReviewNotes("")
      setIsRejecting(false)
    } catch (error) {
      console.error("Failed to update status", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-green-500 hover:bg-green-600"
      case "rejected": return "bg-red-500 hover:bg-red-600"
      case "under_review": return "bg-blue-500 hover:bg-blue-600"
      case "submitted": return "bg-yellow-500 hover:bg-yellow-600"
      default: return "bg-gray-500 hover:bg-gray-600"
    }
  }

  const isImage = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase()
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')
  }

  return (
    <div className="p-4 space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          {headshot && (
            <div className="h-16 w-16 rounded-full overflow-hidden border-2 border-muted shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={headshot.fileUrl} alt="Applicant Headshot" className="h-full w-full object-cover" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{t.dashboard?.applicationDetails?.title.replace("{number}", application.applicationNumber) || `Application ${application.applicationNumber}`}</h1>
              <Badge className={getStatusColor(application.status)}>
                {t.dashboard?.applications?.status?.[application.status as keyof typeof t.dashboard.applications.status] || application.status.replace("_", " ")}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{t.dashboard?.applicationDetails?.submittedOn.replace("{date}", format(new Date(application.createdAt), "PPP p")) || `Submitted on ${format(new Date(application.createdAt), "PPP p")}`}</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          {application.status !== "approved" && application.status !== "rejected" && (
            <>
              {isRejecting ? (
                <div className="flex items-center gap-2 bg-muted p-2 rounded-md animate-in slide-in-from-right">
                  <Input 
                    placeholder={t.dashboard?.applicationDetails?.reasonPlaceholder || "Reason for rejection..."} 
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    className="w-64"
                  />
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setIsRejecting(false)
                      setReviewNotes("")
                    }}
                  >
                    {t.dashboard?.applicationDetails?.cancel || "Cancel"}
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => handleStatusUpdate("rejected", reviewNotes)}
                    disabled={isSubmitting || !reviewNotes}
                  >
                    {t.dashboard?.applicationDetails?.confirm || "Confirm"}
                  </Button>
                </div>
              ) : (
                <Button 
                  variant="destructive" 
                  className="gap-2"
                  onClick={() => setIsRejecting(true)}
                >
                  <XCircle className="h-4 w-4" /> {t.dashboard?.applicationDetails?.reject || "Reject"}
                </Button>
              )}

              <Button 
                className="gap-2 bg-green-600 hover:bg-green-700"
                onClick={() => handleStatusUpdate("approved")}
                disabled={isSubmitting || isRejecting}
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4" />}
                {t.dashboard?.applicationDetails?.approve || "Approve Application"}
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Content - Left Column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Contact Details */}
          <div className="border rounded-lg bg-background">
            <div className="px-4 py-3 border-b">
              <h3 className="text-base font-semibold">{t.dashboard?.applicationDetails?.sections?.contactInfo || "Contact Information"}</h3>
            </div>
            <div className="p-4 grid md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">{t.dashboard?.applicationDetails?.labels?.fullName || "Full Name"}</Label>
                <p className="text-sm font-medium">{contact?.name}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">{t.dashboard?.applicationDetails?.labels?.dob || "Date of Birth"}</Label>
                <p className="text-sm font-medium">{contact?.dateOfBirth}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">{t.dashboard?.applicationDetails?.labels?.phone || "Phone Number"}</Label>
                <p className="text-sm font-medium">{contact?.phone}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">{t.dashboard?.applicationDetails?.labels?.email || "Email"}</Label>
                <p className="text-sm font-medium">{contact?.email}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">{t.dashboard?.applicationDetails?.labels?.nida || "NIDA Number"}</Label>
                <p className="text-sm font-medium">{contact?.identity?.serial || "-"}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">{t.dashboard?.applicationDetails?.labels?.maritalStatus || "Marital Status"}</Label>
                <p className="text-sm font-medium capitalize">{contact?.marital?.status} {contact?.marital?.name ? `(${contact.marital.name})` : ""}</p>
              </div>
              <div className="col-span-2 space-y-1">
                <Label className="text-xs text-muted-foreground">{t.dashboard?.applicationDetails?.labels?.address || "Address"}</Label>
                <p className="text-sm font-medium">
                  {[
                    contact?.address?.street,
                    contact?.address?.houseNumber,
                    contact?.address?.ward,
                    contact?.address?.district,
                    contact?.address?.region
                  ].filter(Boolean).join(", ")}
                </p>
                <p className="text-xs text-muted-foreground capitalize">{contact?.address?.ownership} ({contact?.address?.residenceOwnership})</p>
              </div>
              
              {signatureUrl && (
                <div className="col-span-2 mt-2 pt-2 border-t">
                  <Label className="text-xs text-muted-foreground block mb-2">Applicant Signature</Label>
                  <div className="h-20 w-40 border border-dashed rounded flex items-center justify-center bg-muted/20 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={signatureUrl} alt="Applicant Signature" className="max-h-full max-w-full object-contain" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Employment Details */}
          <div className="border rounded-lg bg-background">
            <div className="px-4 py-3 border-b">
              <h3 className="text-base font-semibold">{t.dashboard?.applicationDetails?.sections?.employmentInfo || "Employment Information"}</h3>
            </div>
            <div className="p-4 grid md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">{t.dashboard?.applicationDetails?.labels?.employmentStatus || "Employment Status"}</Label>
                <p className="text-sm font-medium capitalize">{contact?.work?.status}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">{t.dashboard?.applicationDetails?.labels?.companyName || "Company Name"}</Label>
                <p className="text-sm font-medium">{contact?.work?.company || "-"}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">{t.dashboard?.applicationDetails?.labels?.position || "Position"}</Label>
                <p className="text-sm font-medium">{contact?.work?.designation || "-"}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">{t.dashboard?.applicationDetails?.labels?.workAddress || "Work Address"}</Label>
                <p className="text-sm font-medium">{contact?.work?.address || "-"}</p>
              </div>
            </div>
          </div>

          {/* Attachments */}
          <div className="border rounded-lg bg-background">
            <div className="px-4 py-3 border-b">
              <h3 className="text-base font-semibold">{t.dashboard?.applicationDetails?.sections?.attachments || "Attachments"}</h3>
              <p className="text-xs text-muted-foreground">{t.dashboard?.applicationDetails?.attachmentsDesc || "Documents and photos uploaded by the applicant."}</p>
            </div>
            <div className="p-4">
              {documents.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">{t.dashboard?.applicationDetails?.noAttachments || "No attachments found."}</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {documents.map((doc) => (
                    <div key={doc._id} className="border rounded-lg overflow-hidden flex flex-col">
                      <div className="bg-muted aspect-video flex items-center justify-center relative group">
                        {isImage(doc.fileName) ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img 
                            src={doc.fileUrl} 
                            alt={doc.fileName} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <FileText className="h-10 w-10 text-muted-foreground" />
                        )}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <a 
                            href={doc.fileUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-white flex items-center gap-2 hover:underline text-xs"
                            download={!isImage(doc.fileName)}
                          >
                            <Download className="h-4 w-4" />
                            {isImage(doc.fileName) ? (t.dashboard?.applicationDetails?.viewFull || "View") : (t.dashboard?.applicationDetails?.download || "Download")}
                          </a>
                        </div>
                      </div>
                      <div className="p-2 bg-card border-t">
                        <p className="font-medium truncate text-xs" title={doc.fileName}>{doc.fileName}</p>
                        <Badge variant="outline" className="mt-1 capitalize text-[10px] px-1.5 py-0 h-5">{doc.type.replace("_", " ")}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar - Right Column */}
        <div className="space-y-4">
          {/* Loan Details Card */}
          <div className="border rounded-lg bg-background">
            <div className="px-4 py-3 border-b flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-base font-semibold">{t.dashboard?.applicationDetails?.sections?.loanDetails || "Loan Details"}</h3>
              {!isEditing ? (
                <Button variant="ghost" size="icon" onClick={handleEdit} className="h-8 w-8">
                  <Edit className="h-4 w-4" />
                </Button>
              ) : (
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} className="h-8 text-xs">{t.dashboard?.applicationDetails?.cancel || "Cancel"}</Button>
                  <Button size="sm" onClick={handleSaveDetails} disabled={isSubmitting} className="h-8 w-8 p-0">
                    {isSubmitting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                  </Button>
                </div>
              )}
            </div>
            <div className="p-4 space-y-4 pt-4">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">{t.dashboard?.applicationDetails?.labels?.amountRequested || "Amount Requested"}</Label>
                {isEditing ? (
                  <Input 
                    type="number" 
                    value={editAmount} 
                    onChange={(e) => setEditAmount(e.target.value)}
                    className="h-8"
                  />
                ) : (
                  <p className="text-xl font-bold">
                    {Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS' }).format(application.requestedAmount ?? 0)}
                  </p>
                )}
              </div>
              
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">{t.dashboard?.applicationDetails?.labels?.loanProduct || "Loan Product"}</Label>
                {isEditing ? (
                  <Select value={editLoanType} onValueChange={setEditLoanType}>
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder={t.dashboard?.applicationDetails?.selectLoanType || "Select loan type"} />
                    </SelectTrigger>
                    <SelectContent>
                      {loanTypes.map((t) => (
                        <SelectItem key={t._id} value={t._id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm font-medium">{loanType?.name || (t.dashboard?.applicationDetails?.unknownProduct || "Unknown Product")}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">{t.dashboard?.applicationDetails?.labels?.purpose || "Purpose"}</Label>
                <p className="text-sm font-medium">{application.loanPurpose}</p>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">{t.dashboard?.applicationDetails?.labels?.otherLoans || "Other Loans?"}</Label>
                <Badge variant={application.hasOtherLoans ? "destructive" : "secondary"} className="text-xs">
                  {application.hasOtherLoans ? (t.dashboard?.applicationDetails?.labels?.yes || "Yes") : (t.dashboard?.applicationDetails?.labels?.no || "No")}
                </Badge>
              </div>
            </div>
          </div>

          {/* Guarantors Card */}
          <div className="border rounded-lg bg-background">
            <div className="px-4 py-3 border-b">
              <h3 className="text-base font-semibold">{t.dashboard?.applicationDetails?.sections?.guarantors || "Guarantors"}</h3>
            </div>
            <div className="p-4 space-y-4">
              {referees.length === 0 ? (
                <p className="text-xs text-muted-foreground">{t.dashboard?.applicationDetails?.noGuarantors || "No guarantors listed."}</p>
              ) : (
                referees.map((ref) => (
                  <div key={ref._id} className="relative pl-4 border-l-2 border-muted pb-4 last:pb-0">
                    <div className="absolute -left-[5px] top-1 h-2 w-2 rounded-full bg-primary" />
                    <p className="text-sm font-medium">{ref.fullName}</p>
                    <p className="text-xs text-muted-foreground">{ref.relationship}</p>
                    <p className="text-xs">{ref.phone}</p>
                    {ref.email && <p className="text-xs text-muted-foreground">{ref.email}</p>}
                    <div className="mt-1">
                      {ref.acknowledged ? (
                        <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 text-[10px] px-1.5 py-0 h-5">
                          <CheckCircle className="h-3 w-3 mr-1" /> {t.dashboard?.applicationDetails?.confirmed || "Confirmed"}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-yellow-600 border-yellow-200 bg-yellow-50 text-[10px] px-1.5 py-0 h-5">
                          <AlertCircle className="h-3 w-3 mr-1" /> {t.dashboard?.applicationDetails?.pending || "Pending"}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}