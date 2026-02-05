"use client"

import { useState } from "react"
import { usePaginatedQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useLanguage } from "@/components/language-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from "next/link"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { CreditCard, Tag, Hash, Wallet } from "lucide-react"

export default function AccountsPage() {
  const { t } = useLanguage()
  const [search, setSearch] = useState("")
  const [type, setType] = useState<string>("")
  const { results, isLoading, loadMore, status } = usePaginatedQuery(
    api.accounts.listPaginated,
    { search, type: (type as "cash" | "bank" | "mobile_money" | "other" | undefined) || undefined, active: true },
    { initialNumItems: 10 }
  )
  const createAccount = useMutation(api.accounts.create)
  const [newAccount, setNewAccount] = useState({ name: "", type: "cash", balance: 0, accountNumber: "" })
  const [creating, setCreating] = useState(false)
  const [open, setOpen] = useState(false)

  const handleCreate = async () => {
    if (!newAccount.name) return
    setCreating(true)
    try {
      await createAccount({
        name: newAccount.name,
        type: newAccount.type as "cash" | "bank" | "mobile_money" | "other",
        balance: Number(newAccount.balance) || 0,
        currency: "TZS",
        accountNumber: newAccount.accountNumber || undefined,
      })
      setNewAccount({ name: "", type: "cash", balance: 0, accountNumber: "" })
      setOpen(false)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Accounts</h1>
          <p className="text-muted-foreground">Manage treasury accounts and balances.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="h-9">New Account</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Account</DialogTitle>
              <DialogDescription>Open a new account to track balances and transactions.</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="name" className="text-sm font-medium">Account Name</label>
                <Input id="name" placeholder="e.g., Main Cash, CRDB Bank" value={newAccount.name} onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })} className="h-9" />
              </div>
              <div className="grid gap-2">
                <label htmlFor="type" className="text-sm font-medium">Account Type</label>
                <select id="type" value={newAccount.type} onChange={(e) => setNewAccount({ ...newAccount, type: e.target.value })} className="h-9 rounded-md border px-3 bg-background">
                  <option value="cash">Cash</option>
                  <option value="bank">Bank</option>
                  <option value="mobile_money">Mobile Money</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="grid gap-2">
                <label htmlFor="accountNumber" className="text-sm font-medium">Account Number <span className="text-muted-foreground font-normal">(Optional)</span></label>
                <Input id="accountNumber" placeholder="e.g., 123456789" value={newAccount.accountNumber} onChange={(e) => setNewAccount({ ...newAccount, accountNumber: e.target.value })} className="h-9" />
              </div>
              <div className="grid gap-2">
                <label htmlFor="balance" className="text-sm font-medium">Opening Balance</label>
                <Input id="balance" placeholder="0.00" type="number" value={newAccount.balance} onChange={(e) => setNewAccount({ ...newAccount, balance: Number(e.target.value) })} className="h-9" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" className="h-9" onClick={() => setOpen(false)}>Cancel</Button>
              <Button
                onClick={handleCreate}
                disabled={creating || !newAccount.name}
                className="h-9"
              >
                {creating ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-3">
        <Input placeholder="Search accounts..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs h-9" />
        <select value={type} onChange={(e) => setType(e.target.value)} className="h-9 rounded-md border px-3">
          <option value="">All Types</option>
          <option value="cash">Cash</option>
          <option value="bank">Bank</option>
          <option value="mobile_money">Mobile Money</option>
          <option value="other">Other</option>
        </select>
      </div>

      {!results ? (
        <div className="p-3 text-center text-sm">Loading...</div>
      ) : results.length === 0 ? (
        <div className="p-3 text-center text-muted-foreground text-sm">No accounts found.</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <div className="flex items-center gap-2">
                    <CreditCard className="h-3 w-3" />
                    Name
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-2">
                    <Tag className="h-3 w-3" />
                    Type
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-2">
                    <Hash className="h-3 w-3" />
                    Account No.
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-2">
                    <Wallet className="h-3 w-3" />
                    Balance
                </div>
              </TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.map((a) => (
              <TableRow key={a._id}>
                <TableCell className="font-medium">{a.name}</TableCell>
                <TableCell className="capitalize">{a.type.replace("_", " ")}</TableCell>
                <TableCell className="font-mono text-xs">{(a as any).accountNumber}</TableCell>
                <TableCell className="font-mono">{Intl.NumberFormat().format(a.balance)} TZS</TableCell>
                <TableCell className="text-right">
                  <Link href={`/accounts/${a._id}`} className="text-primary hover:underline">View</Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <div className="flex justify-end">
        <Button variant="outline" disabled={isLoading || status === "Exhausted"} onClick={() => loadMore(10)} className="h-9">
          {status === "Exhausted" ? "No more" : isLoading ? "Loading..." : "Load more"}
        </Button>
      </div>
    </div>
  )
}
