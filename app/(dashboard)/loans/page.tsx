"use client"

import { useState } from "react"
import { usePaginatedQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/components/language-provider"
import { User, Tag, Banknote, CreditCard, Activity, MoreHorizontal } from "lucide-react"

export default function Page() {
  const { t } = useLanguage()
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<string>("")

  const { results, isLoading, loadMore, status: pagStatus } = usePaginatedQuery(
    api.loans.listPaginated,
    { search, status: (status as "new" | "active" | "completed" | "defaulted" | undefined) || undefined },
    { initialNumItems: 10 }
  )

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS' }).format(amount);
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{t.dashboard?.loans?.title || "Loans"}</h1>
      </div>
      <div className="space-y-4">
        <div className="flex gap-3">
          <Input
            placeholder={t.dashboard?.loans?.searchPlaceholder || "Search by contact..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-md h-9"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-48 border rounded-md px-3 h-9 bg-transparent"
          >
            <option value="">{t.dashboard?.loans?.status?.all || "All Statuses"}</option>
            <option value="new">{t.dashboard?.loans?.status?.new || "New"}</option>
            <option value="active">{t.dashboard?.loans?.status?.active || "Active"}</option>
            <option value="completed">{t.dashboard?.loans?.status?.completed || "Completed"}</option>
            <option value="defaulted">{t.dashboard?.loans?.status?.defaulted || "Defaulted"}</option>
          </select>
        </div>
        <div className="border rounded-md">
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>
                    <div className="flex items-center gap-2">
                        <User className="h-3 w-3" />
                        {t.dashboard?.loans?.table?.contact || "Contact"}
                    </div>
                </TableHead>
                <TableHead>
                    <div className="flex items-center gap-2">
                        <Tag className="h-3 w-3" />
                        {t.dashboard?.loans?.table?.product || "Product"}
                    </div>
                </TableHead>
                <TableHead>
                    <div className="flex items-center gap-2">
                        <Banknote className="h-3 w-3" />
                        {t.dashboard?.loans?.table?.principal || "Principal"}
                    </div>
                </TableHead>
                <TableHead>
                    <div className="flex items-center gap-2">
                        <CreditCard className="h-3 w-3" />
                        {t.dashboard?.loans?.table?.outstanding || "Outstanding"}
                    </div>
                </TableHead>
                <TableHead>
                    <div className="flex items-center gap-2">
                        <Activity className="h-3 w-3" />
                        {t.dashboard?.loans?.table?.status || "Status"}
                    </div>
                </TableHead>
                <TableHead className="text-right">
                    <div className="flex items-center gap-2 justify-end">
                        <MoreHorizontal className="h-3 w-3" />
                        {t.dashboard?.loans?.table?.actions || "Actions"}
                    </div>
                </TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {results?.map((l) => (
                <TableRow key={l._id}>
                    <TableCell className="font-medium">{(l as any).clientName ?? "-"}</TableCell>
                    <TableCell>{l.loanTypeSnapshot.name}</TableCell>
                    <TableCell>{formatCurrency(l.principalAmount)}</TableCell>
                    <TableCell>{formatCurrency(l.outstandingBalance)}</TableCell>
                    <TableCell className="capitalize">
                        <Badge variant={
                            l.status === 'active' ? 'default' :
                            l.status === 'completed' ? 'secondary' :
                            l.status === 'defaulted' ? 'destructive' :
                            'outline'
                        }>
                            {l.status}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                            <Link href={`/loans/${l._id}`}>{t.dashboard?.loans?.view || "View"}</Link>
                        </Button>
                    </TableCell>
                </TableRow>
                ))}
                {results && results.length === 0 && (
                <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                    {t.dashboard?.loans?.empty || "No loans found"}
                    </TableCell>
                </TableRow>
                )}
            </TableBody>
            </Table>
        </div>
        <div className="flex justify-end">
          <Button
            variant="outline"
            disabled={isLoading || pagStatus === "Exhausted"}
            onClick={() => loadMore(10)}
          >
            {pagStatus === "Exhausted" 
              ? (t.dashboard?.common?.noMore || "No more") 
              : isLoading 
                ? (t.dashboard?.common?.loading || "Loading...") 
                : (t.dashboard?.common?.loadMore || "Load more")}
          </Button>
        </div>
      </div>
    </div>
  )
}
