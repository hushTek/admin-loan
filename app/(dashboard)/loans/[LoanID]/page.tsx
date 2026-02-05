"use client"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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

export default function LoanDetailsPage() {
    const params = useParams()
    const loanId = params.LoanID as Id<"loans">
    const { t } = useLanguage()
    
    const data = useQuery(api.loans.get, { id: loanId })
    const activities = useQuery(api.loans.getActivities, { loanId })
    const transactions = useQuery(api.loans.getTransactions, { loanId })
    const accounts = useQuery(api.accounts.list)
    const sendReminder = useMutation(api.loans.sendReminder)
    const createTransaction = useMutation(api.transactions.create)
    
    const [reminderType, setReminderType] = useState<"sms" | "email">("sms")
    const [reminderMessage, setReminderMessage] = useState("")
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

    if (!data) return <div className="p-6">{t.dashboard?.common?.loading || "Loading..."}</div>
    if (!data.loan) return <div className="p-6">{t.dashboard?.loans?.empty || "Loan not found"}</div>

    const { loan, contact } = data

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
            alert(t.dashboard?.loanDetails?.dialog?.reminderSuccess || "Reminder sent successfully")
        } catch (e) {
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

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS' }).format(amount);
    }

    const formatDate = (ts: number) => {
        return new Date(ts).toLocaleDateString()
    }

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
                                    <Select value={method} onValueChange={(v: any) => setMethod(v)}>
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
                        <h3 className="font-semibold mb-4">{t.dashboard?.loanDetails?.overview?.customerDetails || "Customer Details"}</h3>
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
                        <h3 className="font-semibold mb-4">{t.dashboard?.loanDetails?.overview?.loanTerms || "Loan Terms"}</h3>
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
                                    <TableCell>{new Date(tx.createdAt).toLocaleDateString()}</TableCell>
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
                                                {new Date(activity.createdAt).toLocaleString()} • {activity.performedBy}
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
