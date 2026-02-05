"use client"

import { useState } from "react"
import { usePaginatedQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { useLanguage } from "@/components/language-provider"
import { Hash, User, Calendar, FileText, Banknote, Activity } from "lucide-react"

export default function Page() {
  const router = useRouter()
  const { t } = useLanguage()
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<string>("")

  const { results, isLoading, loadMore, status: pagStatus } = usePaginatedQuery(
    api.applications.listPaginated,
    { search, status: (status as "draft" | "submitted" | "awaiting_referee" | "under_review" | "approved" | "rejected" | undefined) || undefined },
    { initialNumItems: 10 }
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-green-500 hover:bg-green-600"
      case "rejected": return "bg-red-500 hover:bg-red-600"
      case "under_review": return "bg-blue-500 hover:bg-blue-600"
      case "submitted": return "bg-yellow-500 hover:bg-yellow-600"
      default: return "bg-gray-500 hover:bg-gray-600"
    }
  }

  // Helper to get translated status label
  const getStatusLabel = (status: string) => {
    switch (status) {
      case "draft": return t.dashboard?.applications?.status?.draft || "Draft"
      case "submitted": return t.dashboard?.applications?.status?.submitted || "Submitted"
      case "awaiting_referee": return t.dashboard?.applications?.status?.awaiting_referee || "Awaiting Referee"
      case "under_review": return t.dashboard?.applications?.status?.under_review || "Under Review"
      case "approved": return t.dashboard?.applications?.status?.approved || "Approved"
      case "rejected": return t.dashboard?.applications?.status?.rejected || "Rejected"
      default: return status.replace("_", " ")
    }
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">{t.dashboard?.applications?.title || "Applications"}</h1>
          <p className="text-muted-foreground">{t.dashboard?.applications?.subtitle || "Manage and track loan applications."}</p>
        </div>
      </div>

      <div className="border rounded-md bg-background">
        <div className="p-3 border-b">
          <div className="flex flex-col md:flex-row gap-3 justify-between items-center">
            <h2 className="text-base font-semibold">{t.dashboard?.applications?.recent || "Recent Applications"}</h2>
            <div className="flex gap-3 w-full md:w-auto">
              <Input
                placeholder={t.dashboard?.applications?.searchPlaceholder || "Search by contact or purpose..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-xs h-9"
              />
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-40 h-9 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">{t.dashboard?.applications?.status?.all || "All Statuses"}</option>
                <option value="draft">{t.dashboard?.applications?.status?.draft || "Draft"}</option>
                <option value="submitted">{t.dashboard?.applications?.status?.submitted || "Submitted"}</option>
                <option value="awaiting_referee">{t.dashboard?.applications?.status?.awaiting_referee || "Awaiting Referee"}</option>
                <option value="under_review">{t.dashboard?.applications?.status?.under_review || "Under Review"}</option>
                <option value="approved">{t.dashboard?.applications?.status?.approved || "Approved"}</option>
                <option value="rejected">{t.dashboard?.applications?.status?.rejected || "Rejected"}</option>
              </select>
            </div>
          </div>
        </div>
        <div className="p-3">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">
                    <div className="flex items-center gap-2">
                        <Hash className="h-3 w-3" />
                        {t.dashboard?.applications?.table?.appNo || "App No."}
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center gap-2">
                        <User className="h-3 w-3" />
                        {t.dashboard?.applications?.table?.contact || "Contact"}
                    </div>
                  </TableHead>
                  <TableHead className="w-[120px]">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        {t.dashboard?.applications?.table?.date || "Date"}
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center gap-2">
                        <FileText className="h-3 w-3" />
                        {t.dashboard?.applications?.table?.purpose || "Purpose"}
                    </div>
                  </TableHead>
                  <TableHead className="w-[140px]">
                    <div className="flex items-center gap-2">
                        <Banknote className="h-3 w-3" />
                        {t.dashboard?.applications?.table?.amount || "Amount"}
                    </div>
                  </TableHead>
                  <TableHead className="w-[140px]">
                    <div className="flex items-center gap-2">
                        <Activity className="h-3 w-3" />
                        {t.dashboard?.applications?.table?.status || "Status"}
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results?.map((a) => (
                  <TableRow 
                    key={a._id} 
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => router.push(`/applications/${a._id}`)}
                  >
                    <TableCell className="font-mono text-sm">{a.applicationNumber}</TableCell>
                    <TableCell className="font-medium">{(a as { contactName?: string; contact?: any }).contactName || (a as { contact?: any }).contact?.name || "-"}</TableCell>
                    <TableCell>{format(new Date(a.createdAt), "MMM d, yyyy")}</TableCell>
                    <TableCell>{a.loanPurpose}</TableCell>
                    <TableCell className="font-medium">
                      {Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS' }).format(a.requestedAmount ?? 0)}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(a.status)}>
                        {getStatusLabel(a.status)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {results && results.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                      {t.dashboard?.applications?.empty || "No applications found matching your criteria."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex justify-center mt-4">
            <Button
              variant="outline"
              disabled={isLoading || pagStatus === "Exhausted"}
              onClick={() => loadMore(10)}
              className="w-full max-w-xs h-9"
            >
              {pagStatus === "Exhausted" 
                ? (t.dashboard?.applications?.noMore || "No more applications")
                : isLoading 
                  ? (t.dashboard?.common?.loading || "Loading...") 
                  : (t.dashboard?.applications?.loadMore || "Load more")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
