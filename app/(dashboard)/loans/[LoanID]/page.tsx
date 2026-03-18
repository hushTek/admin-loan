"use client"

import { useEffect, useMemo, useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Doc, Id } from "@/convex/_generated/dataModel"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { CheckCircle2, AlertCircle, Info, Send, ArrowUpRight, ArrowDownLeft } from "lucide-react"
import { useLanguage } from "@/components/language-provider"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function LoanDetailsPage() {
    const params = useParams()
    const loanId = params.LoanID as Id<"loans">
    const { t } = useLanguage()
    const router = useRouter()
    
    const data = useQuery(api.loans.get, { id: loanId })
    const activities = useQuery(api.loans.getActivities, { loanId })
    const transactions = useQuery(api.loans.getTransactions, { loanId })
    const accounts = useQuery(api.accounts.list)
    const loanTypes = useQuery(api.loantype.list, { includeInactive: false })
    const me = useQuery(api.user.getMe, {})
    const notificationSettings = useQuery(
      api.notificationSettings.get,
      me?.role === "admin" || me?.role === "loan_officer" ? {} : "skip"
    )
    const sendReminder = useMutation(api.loans.sendReminder)
    const createTransaction = useMutation(api.transactions.create)
    const amendLoan = useMutation(api.loans.amend)
    const deleteLoan = useMutation(api.loans.adminDelete)
    
    const [reminderType, setReminderType] = useState<"sms" | "email">("sms")
    const [reminderMessage, setReminderMessage] = useState("")
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>("")
    const [sending, setSending] = useState(false)
    const [activeTab, setActiveTab] = useState("overview")

    // Transaction Form State
    const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false)
    const [transactionType, setTransactionType] = useState<"disbursement" | "repayment">("repayment")
    const [selectedAccountId, setSelectedAccountId] = useState<string>("")
    const [amount, setAmount] = useState("")
    const [method, setMethod] = useState<"cash" | "mobile_money" | "bank">("cash")
    const [reference, setReference] = useState("")
    const [submittingTx, setSubmittingTx] = useState(false)

    // Amend dialog state
    const [isEditCustomerDialogOpen, setIsEditCustomerDialogOpen] = useState(false)
    const [isEditTermsDialogOpen, setIsEditTermsDialogOpen] = useState(false)

    const [customerReason, setCustomerReason] = useState("")
    const [customerName, setCustomerName] = useState("")
    const [customerPhone, setCustomerPhone] = useState("")
    const [customerEmail, setCustomerEmail] = useState("")
    const [customerStreet, setCustomerStreet] = useState("")
    const [customerWard, setCustomerWard] = useState("")
    const [customerHouseNumber, setCustomerHouseNumber] = useState("")
    const [customerDistrict, setCustomerDistrict] = useState("")
    const [savingCustomer, setSavingCustomer] = useState(false)

    const [termsReason, setTermsReason] = useState("")
    const [termsLoanTypeId, setTermsLoanTypeId] = useState<string>("")
    const [termsPrincipal, setTermsPrincipal] = useState("")
    const [savingTerms, setSavingTerms] = useState(false)

    // Audit logs sheet
    const [isAuditSheetOpen, setIsAuditSheetOpen] = useState(false)
    const auditLogs = useQuery(
      api.auditLogs.listForLoan,
      me?.role === "admin" && isAuditSheetOpen ? { loanId } : "skip"
    )
    const [selectedLogIndex, setSelectedLogIndex] = useState(0)
    const [logsTab, setLogsTab] = useState<"details" | "diff">("diff")

    const getErrorMessage = (e: unknown) =>
      e instanceof Error ? e.message : "Something went wrong"

    const formatCurrency = (amount: number) =>
      new Intl.NumberFormat("en-TZ", { style: "currency", currency: "TZS" }).format(amount)

    const formatDate = (ts: number) => {
      const d = new Date(ts)
      const dd = String(d.getDate()).padStart(2, "0")
      const mm = String(d.getMonth() + 1).padStart(2, "0")
      const yyyy = d.getFullYear()
      return `${dd}/${mm}/${yyyy}`
    }

    const formatDateTime = (ts: number) => {
      const d = new Date(ts)
      const dd = String(d.getDate()).padStart(2, "0")
      const mm = String(d.getMonth() + 1).padStart(2, "0")
      const yyyy = d.getFullYear()
      const hh = String(d.getHours()).padStart(2, "0")
      const min = String(d.getMinutes()).padStart(2, "0")
      return `${dd}/${mm}/${yyyy} ${hh}:${min}`
    }

    const renderTemplate = (template: string, vars: Record<string, string>) =>
      template.replace(/\{(\w+)\}/g, (_m, key) => vars[key] ?? `{${key}}`)

    const FIELD_LABELS: Record<string, string> = {
      name: "Customer name",
      phone: "Phone number",
      email: "Email",
      dateOfBirth: "Date of birth",
      principalAmount: "Loan amount (principal)",
      interestAmount: "Interest amount",
      totalPayable: "Total to repay",
      installmentAmount: "Monthly installment",
      outstandingBalance: "Outstanding balance",
      status: "Status",
      startDate: "Start date",
      expectedEndDate: "End date",
      requestedAmount: "Requested amount",
      "loanTypeSnapshot.name": "Loan product",
      "loanTypeSnapshot.interestRate": "Interest rate (%)",
      "loanTypeSnapshot.durationMonths": "Duration (months)",
      "loanTypeSnapshot.penaltyRate": "Penalty rate (%)",
      "address.street": "Street address",
      "address.ward": "Ward",
      "address.district": "District",
      "address.region": "Region",
      "address.houseNumber": "House number",
      "marital.status": "Marital status",
      "marital.name": "Spouse name",
      "identity.serial": "NIDA number",
    }

    const formatDiffValue = (val: unknown, path: string): string => {
      if (val === null || val === undefined) return "—"
      if (typeof val === "number") {
        if (path.includes("Amount") || path.includes("Balance") || path.includes("Payable") || path === "requestedAmount" || path === "principalAmount")
          return formatCurrency(val)
        if (path.includes("Date") || path.includes("At")) return formatDate(val)
        if (path.includes("Rate") || path.includes("Months")) return String(val)
      }
      if (typeof val === "string" && path.includes("Date")) {
        const n = Number(val)
        if (!isNaN(n)) return formatDate(n)
      }
      return String(val)
    }

    const getLabel = (path: string): string => {
      if (FIELD_LABELS[path]) return FIELD_LABELS[path]
      const parts = path.split(".")
      const key = parts[parts.length - 1]
      if (FIELD_LABELS[key]) return FIELD_LABELS[key]
      return parts[parts.length - 1].replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()).trim()
    }

    const computeDiff = (before: unknown, after: unknown) => {
      const rows: Array<{ path: string; before: unknown; after: unknown }> = []
      const walk = (b: unknown, a: unknown, path: string, depth: number) => {
        if (depth > 5) return
        if (Object.is(b, a)) return
        const bObj = typeof b === "object" && b !== null
        const aObj = typeof a === "object" && a !== null
        if (!bObj || !aObj) {
          rows.push({ path, before: b, after: a })
          return
        }
        if (Array.isArray(b) || Array.isArray(a)) {
          rows.push({ path, before: b, after: a })
          return
        }
        const keys = new Set([
          ...Object.keys(b as Record<string, unknown>),
          ...Object.keys(a as Record<string, unknown>),
        ])
        for (const k of keys) {
          walk(
            (b as Record<string, unknown>)[k],
            (a as Record<string, unknown>)[k],
            path ? `${path}.${k}` : k,
            depth + 1
          )
        }
      }
      walk(before, after, "", 0)
      return rows
    }

    const humanChangeLines = (): Array<{ label: string; before: string; after: string }> => {
      if (!parsedSnapshot?.before || !parsedSnapshot?.after) return []
      const rows = computeDiff(parsedSnapshot.before, parsedSnapshot.after)
      return rows
        .filter((r) => r.path && !r.path.includes("_id"))
        .slice(0, 100)
        .map((r) => ({
          label: getLabel(r.path),
          before: formatDiffValue(r.before, r.path),
          after: formatDiffValue(r.after, r.path),
        }))
    }

    const deleteSummaryLines = (): string[] => {
      if (!selectedLog || selectedLog.action !== "loan.delete") return []
      try {
        const snap = JSON.parse(selectedLog.snapshotJson) as {
          loan?: { principalAmount?: number; status?: string }
          contact?: { name?: string }
          application?: { applicationNumber?: string }
        }
        const lines: string[] = []
        if (snap.loan?.principalAmount != null)
          lines.push(`Loan amount: ${formatCurrency(snap.loan.principalAmount)}`)
        if (snap.contact?.name) lines.push(`Customer: ${snap.contact.name}`)
        if (snap.application?.applicationNumber)
          lines.push(`Application number: ${snap.application.applicationNumber}`)
        return lines
      } catch {
        return []
      }
    }

    useEffect(() => {
      if (!isAuditSheetOpen) return
      setSelectedLogIndex(0)
      setLogsTab("diff")
    }, [isAuditSheetOpen])

    const selectedLog = (auditLogs ?? [])[selectedLogIndex]
    const parsedSnapshot: null | {
      before?: { loan?: unknown; application?: unknown; contact?: unknown }
      after?: { loan?: unknown; application?: unknown; contact?: unknown }
    } = selectedLog
      ? (() => {
          try {
            return JSON.parse(selectedLog.snapshotJson) as any
          } catch {
            return null
          }
        })()
      : null

    const reminderTemplates = useMemo(() => {
      const rows = (notificationSettings?.reminderTemplates ?? []) as Array<{
        id: string
        name: string
        enabled: boolean
        message: string
      }>
      return rows.filter((t) => t.enabled)
    }, [notificationSettings])

    const loan = (data as { loan?: Doc<"loans"> } | null | undefined)?.loan ?? null
    const contact = (data as { contact?: Doc<"contacts"> | null } | null | undefined)?.contact ?? null
    const application =
      (data as { application?: Doc<"loanApplications"> | null } | null | undefined)?.application ??
      null

    const templateVars: Record<string, string> = useMemo(
      () => ({
        name: contact?.name ?? "Customer",
        dueDate: loan ? formatDate(loan.expectedEndDate) : "",
        amount: loan ? formatCurrency(loan.outstandingBalance) : "",
        principal: loan ? formatCurrency(loan.principalAmount) : "",
        total: loan ? formatCurrency(loan.totalPayable) : "",
        loanId: loan?._id ?? "",
      }),
      [
        contact?.name,
        loan?.expectedEndDate,
        loan?.outstandingBalance,
        loan?.principalAmount,
        loan?.totalPayable,
        loan?._id,
      ]
    )

    useEffect(() => {
      if (!loan) return
      if (!selectedTemplateId) return
      const t = reminderTemplates.find((x) => x.id === selectedTemplateId)
      if (!t) return
      setReminderMessage(renderTemplate(t.message, templateVars))
    }, [loan, selectedTemplateId, reminderTemplates, templateVars])

    if (!data) return <div className="p-6">{t.dashboard?.common?.loading || "Loading..."}</div>
    if (!loan) return <div className="p-6">{t.dashboard?.loans?.empty || "Loan not found"}</div>

    const selectedAccount = accounts?.find(a => a._id === selectedAccountId)
    const isBalanceInsufficient = transactionType === 'disbursement' && selectedAccount && Number(amount) > selectedAccount.balance

    const handleSendReminder = async () => {
        setSending(true)
        try {
            await sendReminder({
                loanId,
                type: reminderType,
                message: reminderMessage || undefined
            })
            setReminderMessage("")
        } catch (_e) {
            alert(t.dashboard?.loanDetails?.dialog?.error || "Failed to send reminder")
        } finally {
            setSending(false)
        }
    }

    const handleCreateTransaction = async () => {
        if (!amount || isNaN(Number(amount))) {
            alert("Please enter a valid amount")
            return
        }

        if (transactionType === 'disbursement' && !selectedAccountId) {
            alert("Please select a source account")
            return
        }

        if (isBalanceInsufficient) {
            alert("Insufficient funds in selected account")
            return
        }

        setSubmittingTx(true)
        try {
            await createTransaction({
                loanId,
                amount: Number(amount),
                type: transactionType,
                method,
                accountId: selectedAccountId ? (selectedAccountId as Id<"accounts">) : undefined,
                reference: reference || undefined,
            })
            setIsTransactionDialogOpen(false)
            setAmount("")
            setReference("")
            setSelectedAccountId("")
            alert(t.dashboard?.loanDetails?.dialog?.success || "Transaction recorded successfully")
        } catch (e) {
            console.error(e)
            alert(t.dashboard?.loanDetails?.dialog?.error || "Failed to record transaction")
        } finally {
            setSubmittingTx(false)
        }
    }

    const openTransactionDialog = (type: "disbursement" | "repayment") => {
        setTransactionType(type)
        setAmount(type === "disbursement" ? loan.principalAmount.toString() : "")
        setSelectedAccountId("")
        setIsTransactionDialogOpen(true)
    }

    const openEditCustomerDialog = () => {
      setCustomerReason("")
      setCustomerName(contact?.name ?? "")
      setCustomerPhone(contact?.phone ?? "")
      setCustomerEmail(contact?.email ?? "")
      setCustomerStreet(contact?.address?.street ?? "")
      setCustomerWard(contact?.address?.ward ?? "")
      setCustomerHouseNumber(contact?.address?.houseNumber ?? "")
      setCustomerDistrict(contact?.address?.district ?? "")
      setIsEditCustomerDialogOpen(true)
    }

    const openEditTermsDialog = () => {
      setTermsReason("")
      setTermsLoanTypeId((application?.loanTypeId as string | undefined) ?? "")
      setTermsPrincipal(String(loan.principalAmount ?? ""))
      setIsEditTermsDialogOpen(true)
    }

    const handleSaveCustomer = async () => {
      if (!customerName.trim()) {
        alert("Name is required")
        return
      }
      if (!customerPhone.trim()) {
        alert("Phone is required")
        return
      }
      setSavingCustomer(true)
      try {
        await amendLoan({
          loanId,
          contactPatch: {
            name: customerName.trim(),
            phone: customerPhone.trim(),
            email: customerEmail.trim() || undefined,
            address: {
              street: customerStreet.trim() || undefined,
              ward: customerWard.trim() || undefined,
              houseNumber: customerHouseNumber.trim() || undefined,
              district: customerDistrict.trim() || undefined,
            },
          },
          reason: customerReason.trim() || undefined,
        })
        setIsEditCustomerDialogOpen(false)
      } catch (e: unknown) {
        console.error(e)
        alert(getErrorMessage(e))
      } finally {
        setSavingCustomer(false)
      }
    }

    const handleSaveTerms = async () => {
      if (!termsPrincipal || isNaN(Number(termsPrincipal))) {
        alert("Please enter a valid principal amount")
        return
      }
      if (!termsLoanTypeId) {
        alert("Please select a loan type")
        return
      }
      setSavingTerms(true)
      try {
        await amendLoan({
          loanId,
          loanTypeId: termsLoanTypeId as Id<"loanTypes">,
          principalAmount: Number(termsPrincipal),
          reason: termsReason.trim() || undefined,
        })
        setIsEditTermsDialogOpen(false)
      } catch (e: unknown) {
        console.error(e)
        alert(getErrorMessage(e))
      } finally {
        setSavingTerms(false)
      }
    }

    const handleDelete = async () => {
      try {
        await deleteLoan({ loanId, reason: termsReason.trim() || undefined })
        router.push("/loans")
      } catch (e: unknown) {
        console.error(e)
        alert(getErrorMessage(e))
      }
    }

    const daysAfterReturnBeforePenalty = 10
    const penaltyGraceMs = daysAfterReturnBeforePenalty * 24 * 60 * 60 * 1000
    const penaltyStartAt = loan.expectedEndDate + penaltyGraceMs
    const nowMs = Date.now()
    const penaltyRate = loan.loanTypeSnapshot.penaltyRate ?? 0
    const isPenaltyEligible =
      penaltyRate > 0 && loan.outstandingBalance > 0 && nowMs > penaltyStartAt
    const overdueDays = isPenaltyEligible
      ? Math.floor((nowMs - penaltyStartAt) / (24 * 60 * 60 * 1000))
      : 0
    const overdueMonthsApprox = isPenaltyEligible ? Math.max(1, Math.ceil(overdueDays / 30)) : 0
    const calculatedPenalty = isPenaltyEligible
      ? loan.outstandingBalance * (penaltyRate / 100) * overdueMonthsApprox
      : 0

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-bold">{t.dashboard?.loanDetails?.title.replace("{id}", loan._id.slice(-6)) || `Loan #${loan._id.slice(-6)}`}</h1>
                        <Badge variant={
                            loan.status === 'active' ? 'default' :
                            loan.status === 'completed' ? 'secondary' :
                            loan.status === 'defaulted' ? 'destructive' :
                            'outline'
                        }>{loan.status}</Badge>
                    </div>
                    <p className="text-muted-foreground">
                        {contact?.name} • {loan.loanTypeSnapshot.name}
                    </p>
                </div>
                <div className="flex gap-2">
                    {me?.role === "admin" && (
                      <Button variant="outline" onClick={() => setIsAuditSheetOpen(true)}>
                        Audit logs
                      </Button>
                    )}
                    {loan.status === 'new' && (
                        <Button onClick={() => openTransactionDialog("disbursement")}>
                            <ArrowUpRight className="mr-2 h-4 w-4" />
                            {t.dashboard?.loanDetails?.disburse || "Disburse Loan"}
                        </Button>
                    )}
                    {(loan.status === 'active' || loan.status === 'defaulted') && (
                        <Button onClick={() => openTransactionDialog("repayment")}>
                            <ArrowDownLeft className="mr-2 h-4 w-4" />
                            {t.dashboard?.loanDetails?.repayment || "Add Repayment"}
                        </Button>
                    )}

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive">Delete</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete loan?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will remove the loan and its application. A detailed snapshot will be saved for undo.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="space-y-2">
                          <Label>Reason (optional)</Label>
                          <Input value={termsReason} onChange={(e) => setTermsReason(e.target.value)} placeholder="Why are you deleting this loan?" />
                        </div>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction variant="destructive" onClick={handleDelete}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    
                    <Dialog open={isTransactionDialogOpen} onOpenChange={setIsTransactionDialogOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>
                                    {transactionType === 'disbursement' 
                                        ? (t.dashboard?.loanDetails?.dialog?.disburseTitle || 'Disburse Loan')
                                        : (t.dashboard?.loanDetails?.dialog?.repayTitle || 'Add Repayment')}
                                </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>{t.dashboard?.loanDetails?.dialog?.amount || "Amount"}</Label>
                                    <Input 
                                        type="number" 
                                        value={amount} 
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder="0.00"
                                    />
                                </div>

                                {transactionType === 'disbursement' && (
                                    <div className="space-y-2">
                                        <Label>Source Account</Label>
                                        <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select source account" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {accounts?.map((acc) => (
                                                    <SelectItem key={acc._id} value={acc._id}>
                                                        {acc.name} ({formatCurrency(acc.balance)})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {selectedAccount && (
                                            <div className={`text-sm ${isBalanceInsufficient ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                                                Available Balance: {formatCurrency(selectedAccount.balance)}
                                                {isBalanceInsufficient && " (Insufficient Funds)"}
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label>{t.dashboard?.loanDetails?.dialog?.method || "Method"}</Label>
                                    <Select
                                      value={method}
                                      onValueChange={(v) =>
                                        setMethod(v as "cash" | "mobile_money" | "bank")
                                      }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="cash">{t.dashboard?.transactions?.method?.cash || "Cash"}</SelectItem>
                                            <SelectItem value="bank">{t.dashboard?.transactions?.method?.bank || "Bank"}</SelectItem>
                                            <SelectItem value="mobile_money">{t.dashboard?.transactions?.method?.mobile_money || "Mobile Money"}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>{t.dashboard?.loanDetails?.dialog?.reference || "Reference"}</Label>
                                    <Input 
                                        value={reference} 
                                        onChange={(e) => setReference(e.target.value)}
                                        placeholder={t.dashboard?.loanDetails?.dialog?.referencePlaceholder || "Receipt No, Transaction ID, etc."}
                                    />
                                </div>
                                <Button className="w-full" onClick={handleCreateTransaction} disabled={submittingTx || isBalanceInsufficient}>
                                    {submittingTx ? (t.dashboard?.loanDetails?.dialog?.processing || "Processing...") : (t.dashboard?.loanDetails?.dialog?.confirm || "Confirm Transaction")}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>

                    {/* Edit Customer Dialog */}
                    <Dialog open={isEditCustomerDialogOpen} onOpenChange={setIsEditCustomerDialogOpen}>
                      <DialogContent className="max-w-xl">
                        <DialogHeader>
                          <DialogTitle>Edit customer details</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-5 py-2">
                          <div className="space-y-2">
                            <Label>Reason (optional)</Label>
                            <Input value={customerReason} onChange={(e) => setCustomerReason(e.target.value)} placeholder="Reason for change" />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Name</Label>
                              <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                              <Label>Phone</Label>
                              <Input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                              <Label>Email</Label>
                              <Input value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2 md:col-span-2">
                              <Label>Street</Label>
                              <Input value={customerStreet} onChange={(e) => setCustomerStreet(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                              <Label>House No.</Label>
                              <Input value={customerHouseNumber} onChange={(e) => setCustomerHouseNumber(e.target.value)} />
                            </div>
                            <div className="space-y-2 md:col-span-3">
                              <Label>Ward</Label>
                              <Input value={customerWard} onChange={(e) => setCustomerWard(e.target.value)} />
                            </div>
                            <div className="space-y-2 md:col-span-3">
                              <Label>District</Label>
                              <Input value={customerDistrict} onChange={(e) => setCustomerDistrict(e.target.value)} />
                            </div>
                          </div>

                          <Button className="w-full" onClick={handleSaveCustomer} disabled={savingCustomer}>
                            {savingCustomer ? "Saving..." : "Save customer"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>

                    {/* Edit Terms Dialog */}
                    <Dialog open={isEditTermsDialogOpen} onOpenChange={setIsEditTermsDialogOpen}>
                      <DialogContent className="max-w-xl">
                        <DialogHeader>
                          <DialogTitle>Change loan terms</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-5 py-2">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Loan type</Label>
                              <Select value={termsLoanTypeId} onValueChange={setTermsLoanTypeId}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select loan type" />
                                </SelectTrigger>
                                <SelectContent>
                                  {(loanTypes ?? []).map((lt: Doc<"loanTypes">) => (
                                    <SelectItem key={lt._id} value={lt._id}>
                                      {lt.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Principal amount</Label>
                              <Input type="number" value={termsPrincipal} onChange={(e) => setTermsPrincipal(e.target.value)} />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>Reason (optional)</Label>
                            <Input value={termsReason} onChange={(e) => setTermsReason(e.target.value)} placeholder="Reason for change" />
                          </div>

                          <Button className="w-full" onClick={handleSaveTerms} disabled={savingTerms}>
                            {savingTerms ? "Saving..." : "Save terms"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Sheet open={isAuditSheetOpen} onOpenChange={setIsAuditSheetOpen}>
                      <SheetContent side="right" className="sm:max-w-xl">
                        <SheetHeader>
                          <SheetTitle>Change history</SheetTitle>
                          <SheetDescription>
                            Who changed what and when. Select an entry below to see the details.
                          </SheetDescription>
                        </SheetHeader>
                        <div className="px-4 pb-4 flex-1 overflow-hidden flex flex-col gap-4">
                          <div className="border rounded-lg overflow-auto max-h-44">
                            {(auditLogs ?? []).length === 0 ? (
                              <div className="p-4 text-sm text-muted-foreground">
                                No changes recorded yet.
                              </div>
                            ) : (
                              <div className="divide-y">
                                {(auditLogs ?? []).map((l, idx) => (
                                  <button
                                    key={l._id}
                                    className={`w-full text-left p-3 text-sm hover:bg-muted ${
                                      idx === selectedLogIndex ? "bg-muted" : ""
                                    }`}
                                    onClick={() => setSelectedLogIndex(idx)}
                                    type="button"
                                  >
                                    <div className="font-medium capitalize">
                                      {l.action === "loan.amend" ? "Loan or customer updated" : "Loan removed"}
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-0.5">
                                        {formatDateTime(l.createdAt)}
                                      {l.performedByName ? ` · By ${l.performedByName}` : ""}
                                    </div>
                                    {l.reason ? (
                                      <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                        Reason: {l.reason}
                                      </div>
                                    ) : null}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          {selectedLog ? (
                            <div className="flex-1 overflow-auto space-y-4">
                              <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                                <h4 className="font-semibold text-sm">
                                  {selectedLog.action === "loan.delete"
                                    ? "What was removed"
                                    : "What changed"}
                                </h4>
                                {selectedLog.action === "loan.delete" ? (
                                  <ul className="space-y-2 text-sm">
                                    <li className="font-medium text-destructive">
                                      This loan was permanently removed from the system.
                                    </li>
                                    {deleteSummaryLines().map((line, i) => (
                                      <li key={i} className="text-muted-foreground">
                                        {line}
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <ul className="space-y-2 text-sm">
                                    {humanChangeLines().length === 0 ? (
                                      <li className="text-muted-foreground">No field-by-field changes recorded.</li>
                                    ) : (
                                      humanChangeLines().map((row, i) => (
                                        <li key={i} className="flex flex-col gap-0.5">
                                          <span className="font-medium text-foreground">{row.label}</span>
                                          <span className="text-muted-foreground">
                                            <span className="line-through">{row.before}</span>
                                            {" → "}
                                            <span className="font-medium text-foreground">{row.after}</span>
                                          </span>
                                        </li>
                                      ))
                                    )}
                                  </ul>
                                )}
                              </div>

                              <details className="rounded-lg border">
                                <summary className="cursor-pointer p-3 text-sm text-muted-foreground">
                                  Technical details (for IT support)
                                </summary>
                                <pre className="p-3 text-xs whitespace-pre-wrap wrap-break-word border-t bg-muted/20 max-h-48 overflow-auto">
                                  {selectedLog.snapshotJson}
                                </pre>
                              </details>
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground py-4">
                              Select an entry above to see what changed.
                            </div>
                          )}
                        </div>
                      </SheetContent>
                    </Sheet>
                </div>
            </div>

            {/* Stats - Flat UI */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="border rounded-lg p-4">
                    <div className="text-sm font-medium text-muted-foreground">{t.dashboard?.loanDetails?.stats?.principal || "Principal"}</div>
                    <div className="text-2xl font-bold mt-1">{formatCurrency(loan.principalAmount)}</div>
                </div>
                <div className="border rounded-lg p-4">
                    <div className="text-sm font-medium text-muted-foreground">{t.dashboard?.loanDetails?.stats?.outstanding || "Outstanding"}</div>
                    <div className="text-2xl font-bold text-red-600 mt-1">{formatCurrency(loan.outstandingBalance)}</div>
                </div>
                <div className="border rounded-lg p-4">
                    <div className="text-sm font-medium text-muted-foreground">{t.dashboard?.loanDetails?.stats?.payable || "Total Payable"}</div>
                    <div className="text-2xl font-bold mt-1">{formatCurrency(loan.totalPayable)}</div>
                </div>
                <div className="border rounded-lg p-4">
                    <div className="text-sm font-medium text-muted-foreground">{t.dashboard?.loanDetails?.stats?.nextDue || "Next Due"}</div>
                    <div className="text-2xl font-bold mt-1">
                        {formatDate(loan.startDate + 30 * 24 * 60 * 60 * 1000)}
                    </div>
                </div>
                {penaltyRate > 0 && (
                  <div className="border rounded-lg p-4">
                    <div className="text-sm font-medium text-muted-foreground">
                      Penalty
                    </div>
                    <div className="text-2xl font-bold mt-1">
                      {isPenaltyEligible ? formatCurrency(calculatedPenalty) : formatCurrency(0)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {isPenaltyEligible
                        ? `Penalty started on ${formatDate(penaltyStartAt)} (${daysAfterReturnBeforePenalty} days after return date)`
                        : `Starts ${formatDate(penaltyStartAt)} (${daysAfterReturnBeforePenalty} days after return date)`}
                    </div>
                  </div>
                )}
            </div>

            {/* Tabs Navigation */}
            <div className="flex border-b">
                <button
                    className={`px-4 py-2 text-sm font-medium border-b-2 ${activeTab === 'overview' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}
                    onClick={() => setActiveTab('overview')}
                >
                    {t.dashboard?.loanDetails?.tabs?.overview || "Overview"}
                </button>
                <button
                    className={`px-4 py-2 text-sm font-medium border-b-2 ${activeTab === 'repayments' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}
                    onClick={() => setActiveTab('repayments')}
                >
                    {t.dashboard?.loanDetails?.tabs?.repayments || "Repayments"}
                </button>
                <button
                    className={`px-4 py-2 text-sm font-medium border-b-2 ${activeTab === 'activities' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}
                    onClick={() => setActiveTab('activities')}
                >
                    {t.dashboard?.loanDetails?.tabs?.activities || "Activities & Reminders"}
                </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold">{t.dashboard?.loanDetails?.overview?.customerDetails || "Customer Details"}</h3>
                          <Button size="sm" variant="outline" onClick={openEditCustomerDialog}>
                            Edit
                          </Button>
                        </div>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-2">
                                <span className="text-muted-foreground">{t.dashboard?.loanDetails?.overview?.labels?.name || "Name"}:</span>
                                <span className="font-medium">{contact?.name}</span>
                                <span className="text-muted-foreground">{t.dashboard?.loanDetails?.overview?.labels?.phone || "Phone"}:</span>
                                <span className="font-medium">{contact?.phone}</span>
                                <span className="text-muted-foreground">{t.dashboard?.loanDetails?.overview?.labels?.email || "Email"}:</span>
                                <span className="font-medium">{contact?.email}</span>
                                <span className="text-muted-foreground">{t.dashboard?.loanDetails?.overview?.labels?.address || "Address"}:</span>
                                <span className="font-medium">
                                    {contact?.address?.street}, {contact?.address?.ward}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="border rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold">{t.dashboard?.loanDetails?.overview?.loanTerms || "Loan Terms"}</h3>
                          <Button size="sm" variant="outline" onClick={openEditTermsDialog}>
                            Change terms
                          </Button>
                        </div>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-2">
                                <span className="text-muted-foreground">{t.dashboard?.loanDetails?.overview?.labels?.interestRate || "Interest Rate"}:</span>
                                <span className="font-medium">{loan.loanTypeSnapshot.interestRate}%</span>
                                <span className="text-muted-foreground">{t.dashboard?.loanDetails?.overview?.labels?.duration || "Duration"}:</span>
                                <span className="font-medium">{loan.loanTypeSnapshot.durationMonths} {t.dashboard?.loanDetails?.overview?.labels?.months || "Months"}</span>
                                <span className="text-muted-foreground">{t.dashboard?.loanDetails?.overview?.labels?.startDate || "Start Date"}:</span>
                                <span className="font-medium">{formatDate(loan.startDate)}</span>
                                <span className="text-muted-foreground">{t.dashboard?.loanDetails?.overview?.labels?.endDate || "End Date"}:</span>
                                <span className="font-medium">{formatDate(loan.expectedEndDate)}</span>
                                <span className="text-muted-foreground">{t.dashboard?.loanDetails?.overview?.labels?.installment || "Installment"}:</span>
                                <span className="font-medium">{formatCurrency(loan.installmentAmount)}</span>
                            </div>
                            {penaltyRate > 0 && (
                              <div className="pt-2 text-sm text-muted-foreground">
                                Penalty rule: {penaltyRate}% per month, starts {daysAfterReturnBeforePenalty} days after return date.
                              </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'repayments' && (
                <div className="border rounded-lg p-6">
                    <h3 className="font-semibold mb-4">{t.dashboard?.loanDetails?.repayments?.history || "Transaction History"}</h3>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t.dashboard?.common?.date || "Date"}</TableHead>
                                <TableHead>{t.dashboard?.transactions?.table?.type || "Type"}</TableHead>
                                <TableHead>{t.dashboard?.transactions?.table?.method || "Method"}</TableHead>
                                <TableHead>{t.dashboard?.transactions?.table?.reference || "Reference"}</TableHead>
                                <TableHead className="text-right">{t.dashboard?.common?.amount || "Amount"}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {transactions?.map((tx) => (
                                <TableRow key={tx._id}>
                                    <TableCell>{formatDate(tx.createdAt)}</TableCell>
                                    <TableCell className="capitalize">
                                        <Badge variant={
                                            tx.type === 'disbursement' ? 'outline' : 
                                            tx.type === 'penalty' ? 'destructive' : 'default'
                                        }>
                                            {tx.type}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="capitalize">{tx.method.replace('_', ' ')}</TableCell>
                                    <TableCell>{tx.reference || '-'}</TableCell>
                                    <TableCell className="text-right font-medium">
                                        {formatCurrency(tx.amount)}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {transactions?.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                                        {t.dashboard?.loanDetails?.repayments?.noTransactions || "No transactions found."}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            )}

            {activeTab === 'activities' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-4">
                        <div className="border rounded-lg p-6">
                            <h3 className="font-semibold mb-4">{t.dashboard?.loanDetails?.activities?.log || "Activity Log"}</h3>
                            <div className="space-y-6 relative border-l pl-6 ml-2">
                                {activities?.map((activity) => (
                                    <div key={activity._id} className="relative">
                                        <div className={`absolute -left-[31px] top-0 p-1 rounded-full ${
                                            activity.type === 'success' ? 'bg-green-100 text-green-600' :
                                            activity.type === 'warning' ? 'bg-orange-100 text-orange-600' :
                                            activity.type === 'error' ? 'bg-red-100 text-red-600' :
                                            'bg-blue-100 text-blue-600'
                                        }`}>
                                            {activity.type === 'success' ? <CheckCircle2 size={16} /> :
                                                activity.type === 'warning' ? <AlertCircle size={16} /> :
                                                <Info size={16} />}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{activity.title}</span>
                                            <span className="text-sm text-muted-foreground">{activity.description}</span>
                                            <span className="text-xs text-muted-foreground mt-1">
                                                {formatDateTime(activity.createdAt)} • {activity.performedBy}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                                {activities?.length === 0 && (
                                    <div className="text-muted-foreground text-sm">{t.dashboard?.loanDetails?.activities?.noActivities || "No activities recorded."}</div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div>
                        <div className="border rounded-lg p-6">
                            <h3 className="font-semibold mb-4">{t.dashboard?.loanDetails?.activities?.sendReminder || "Send Reminder"}</h3>
                            <div className="space-y-4">
                                <div className="flex gap-2">
                                    <Button 
                                        variant={reminderType === 'sms' ? 'default' : 'outline'} 
                                        onClick={() => setReminderType('sms')}
                                        className="flex-1"
                                    >
                                        {t.dashboard?.loanDetails?.activities?.sms || "SMS"}
                                    </Button>
                                    <Button 
                                        variant={reminderType === 'email' ? 'default' : 'outline'} 
                                        onClick={() => setReminderType('email')}
                                        className="flex-1"
                                    >
                                        {t.dashboard?.loanDetails?.activities?.email || "Email"}
                                    </Button>
                                </div>
                                <div className="space-y-2">
                                    <Label>Template</Label>
                                    <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a template" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {reminderTemplates.map((t) => (
                                                <SelectItem key={t.id} value={t.id}>
                                                    {t.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {selectedTemplateId ? (
                                      <div className="text-xs text-muted-foreground">
                                        Filled with: {templateVars.name} · Due {templateVars.dueDate} · Outstanding {templateVars.amount}
                                      </div>
                                    ) : null}
                                </div>
                                <Textarea
                                    placeholder={t.dashboard?.loanDetails?.activities?.messagePlaceholder || "Enter message..."}
                                    value={reminderMessage}
                                    onChange={(e) => setReminderMessage(e.target.value)}
                                    rows={4}
                                />
                                <Button 
                                    className="w-full" 
                                    onClick={handleSendReminder}
                                    disabled={sending}
                                >
                                    <Send className="mr-2 h-4 w-4" />
                                    {sending ? (t.dashboard?.loanDetails?.activities?.sending || "Sending...") : (t.dashboard?.loanDetails?.activities?.send || "Send Reminder")}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
