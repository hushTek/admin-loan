"use client"

import { useState } from "react"
import { usePaginatedQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/components/language-provider"
import { Calendar, User, Activity, Banknote, CreditCard, Hash } from "lucide-react"

export default function TransactionsPage() {
  const { t } = useLanguage()
  const [search, setSearch] = useState("")
  const [type, setType] = useState<string>("")
  const [method, setMethod] = useState<string>("")

  const { results, isLoading, loadMore, status } = usePaginatedQuery(
    api.transactions.listPaginated,
    { search, type: (type as "repayment" | "disbursement" | "penalty" | undefined) || undefined, method: (method as "cash" | "mobile_money" | "bank" | undefined) || undefined },
    { initialNumItems: 10 }
  )

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-xl font-bold">{t.dashboard?.transactions?.title || "Transactions"}</h1>
            <p className="text-muted-foreground">
                {t.dashboard?.transactions?.subtitle || "View all system transactions including disbursements, repayments, and penalties."}
            </p>
        </div>
      </div>
      <div>
        <div className="flex gap-3 mb-3">
          <Input
            placeholder={t.dashboard?.transactions?.searchPlaceholder || "Search by contact..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-md h-9"
          />
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-44 border rounded-md px-3 h-9 bg-transparent"
          >
            <option value="">{t.dashboard?.transactions?.type?.all || "All Types"}</option>
            <option value="disbursement">{t.dashboard?.transactions?.type?.disbursement || "Disbursement"}</option>
            <option value="repayment">{t.dashboard?.transactions?.type?.repayment || "Repayment"}</option>
            <option value="penalty">{t.dashboard?.transactions?.type?.penalty || "Penalty"}</option>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
            <option value="adjustment">Adjustment</option>
          </select>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="w-44 border rounded-md px-3 h-9 bg-transparent"
          >
            <option value="">{t.dashboard?.transactions?.method?.all || "All Methods"}</option>
            <option value="cash">{t.dashboard?.transactions?.method?.cash || "Cash"}</option>
            <option value="mobile_money">{t.dashboard?.transactions?.method?.mobile_money || "Mobile Money"}</option>
            <option value="bank">{t.dashboard?.transactions?.method?.bank || "Bank"}</option>
          </select>
        </div>
        {!results ? (
          <div className="p-4 text-center">{t.dashboard?.transactions?.loading || "Loading transactions..."}</div>
        ) : results.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            {t.dashboard?.transactions?.empty || "No transactions found."}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        {t.dashboard?.transactions?.table?.date || "Date"}
                    </div>
                </TableHead>
                <TableHead>
                    <div className="flex items-center gap-2">
                        <User className="h-3 w-3" />
                        {t.dashboard?.transactions?.table?.contact || "Contact/Account"}
                    </div>
                </TableHead>
                <TableHead className="w-[120px]">
                    <div className="flex items-center gap-2">
                        <Activity className="h-3 w-3" />
                        {t.dashboard?.transactions?.table?.type || "Type"}
                    </div>
                </TableHead>
                <TableHead className="w-[120px]">
                    <div className="flex items-center gap-2">
                        <Banknote className="h-3 w-3" />
                        {t.dashboard?.transactions?.table?.amount || "Amount"}
                    </div>
                </TableHead>
                <TableHead className="w-[120px]">
                    <div className="flex items-center gap-2">
                        <CreditCard className="h-3 w-3" />
                        {t.dashboard?.transactions?.table?.method || "Method"}
                    </div>
                </TableHead>
                <TableHead className="w-[150px]">
                    <div className="flex items-center gap-2">
                        <Hash className="h-3 w-3" />
                        {t.dashboard?.transactions?.table?.reference || "Reference"}
                    </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((t) => (
                <TableRow key={t._id}>
                  <TableCell>{new Date(t.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="font-medium">{(t as { clientName?: string }).clientName || (t as { accountName?: string }).accountName || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={
                      t.type === "repayment" ? "default" :
                      t.type === "disbursement" ? "secondary" : "destructive"
                    }>
                      {t.type.charAt(0).toUpperCase() + t.type.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>{t.amount.toLocaleString()}</TableCell>
                  <TableCell className="capitalize">{t.method.replace("_", " ")}</TableCell>
                  <TableCell className="font-mono text-xs">{t.reference || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <div className="flex justify-end mt-4">
          <Button
            variant="outline"
            disabled={isLoading || status === "Exhausted"}
            onClick={() => loadMore(10)}
            className="h-9"
          >
            {status === "Exhausted" 
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
