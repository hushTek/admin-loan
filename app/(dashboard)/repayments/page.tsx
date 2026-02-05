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
import { Calendar, User, Banknote, CreditCard, Hash, Activity } from "lucide-react"

export default function RepaymentsPage() {
  const { t } = useLanguage()
  const [search, setSearch] = useState("")
  const [method, setMethod] = useState<string>("")

  const { results, isLoading, loadMore, status } = usePaginatedQuery(
    api.transactions.listRepaymentsPaginated,
    { search, method: (method as "cash" | "mobile_money" | "bank" | undefined) || undefined },
    { initialNumItems: 10 }
  )

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-xl font-bold">{t.dashboard?.repayments?.title || "Repayments"}</h1>
            <p className="text-muted-foreground">
                {t.dashboard?.repayments?.subtitle || "Track and manage loan repayments from customers."}
            </p>
        </div>
      </div>

      <div>
        <div className="flex gap-3 mb-3">
          <Input
            placeholder={t.dashboard?.repayments?.searchPlaceholder || "Search by contact..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-md h-9"
          />
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="w-44 border rounded-md px-3 h-9 bg-transparent"
          >
            <option value="">{t.dashboard?.repayments?.method?.all || "All Methods"}</option>
            <option value="cash">{t.dashboard?.repayments?.method?.cash || "Cash"}</option>
            <option value="mobile_money">{t.dashboard?.repayments?.method?.mobile_money || "Mobile Money"}</option>
            <option value="bank">{t.dashboard?.repayments?.method?.bank || "Bank"}</option>
          </select>
        </div>
        {!results ? (
          <div className="p-4 text-center">{t.dashboard?.repayments?.loading || "Loading repayments..."}</div>
        ) : results.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            {t.dashboard?.repayments?.empty || "No repayments found."}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        {t.dashboard?.repayments?.table?.date || "Date"}
                    </div>
                </TableHead>
                <TableHead>
                    <div className="flex items-center gap-2">
                        <User className="h-3 w-3" />
                        {t.dashboard?.repayments?.table?.contact || "Contact"}
                    </div>
                </TableHead>
                <TableHead className="w-[120px]">
                    <div className="flex items-center gap-2">
                        <Banknote className="h-3 w-3" />
                        {t.dashboard?.repayments?.table?.amount || "Amount"}
                    </div>
                </TableHead>
                <TableHead className="w-[120px]">
                    <div className="flex items-center gap-2">
                        <CreditCard className="h-3 w-3" />
                        {t.dashboard?.repayments?.table?.method || "Method"}
                    </div>
                </TableHead>
                <TableHead className="w-[150px]">
                    <div className="flex items-center gap-2">
                        <Hash className="h-3 w-3" />
                        {t.dashboard?.repayments?.table?.reference || "Reference"}
                    </div>
                </TableHead>
                <TableHead className="w-[120px]">
                    <div className="flex items-center gap-2">
                        <Activity className="h-3 w-3" />
                        {t.dashboard?.repayments?.table?.status || "Status"}
                    </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((transaction) => (
                <TableRow key={transaction._id}>
                  <TableCell>{new Date(transaction.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="font-medium">{(transaction as { clientName?: string }).clientName}</TableCell>
                  <TableCell className="font-bold text-green-600">
                    +{transaction.amount.toLocaleString()}
                  </TableCell>
                  <TableCell className="capitalize">{transaction.method.replace("_", " ")}</TableCell>
                  <TableCell className="font-mono text-xs">{transaction.reference || "-"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      {t.dashboard?.repayments?.received || "Received"}
                    </Badge>
                  </TableCell>
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
