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
import { useLanguage } from "@/components/language-provider"
import { User, Mail, Phone, MapPin } from "lucide-react"

export default function Page() {
  const { t } = useLanguage()
  const [search, setSearch] = useState("")

  const { results, isLoading, loadMore, status } = usePaginatedQuery(
    api.contacts.listPaginated,
    { search },
    { initialNumItems: 10 }
  )

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{t.dashboard?.contacts?.title || "Contacts"}</h1>
      </div>
      <div className="space-y-4">
        <div className="flex gap-3">
          <Input
            placeholder={t.dashboard?.contacts?.searchPlaceholder || "Search name, email or phone..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-md h-9"
          />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <div className="flex items-center gap-2">
                    <User className="h-3 w-3" />
                    {t.dashboard?.contacts?.table?.name || "Name"}
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-2">
                    <Mail className="h-3 w-3" />
                    {t.dashboard?.contacts?.table?.email || "Email"}
                </div>
              </TableHead>
              <TableHead className="w-[150px]">
                <div className="flex items-center gap-2">
                    <Phone className="h-3 w-3" />
                    {t.dashboard?.contacts?.table?.phone || "Phone"}
                </div>
              </TableHead>
              <TableHead className="w-[150px]">
                <div className="flex items-center gap-2">
                    <MapPin className="h-3 w-3" />
                    {t.dashboard?.contacts?.table?.region || "Region"}
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results?.map((c) => (
              <TableRow key={c._id}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell>{c.email}</TableCell>
                <TableCell>{c.phone}</TableCell>
                <TableCell>{c.address?.region ?? "-"}</TableCell>
              </TableRow>
            ))}
            {results && results.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                  {t.dashboard?.contacts?.empty || "No clients found"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <div className="flex justify-end">
          <Button
            variant="outline"
            disabled={isLoading || status === "Exhausted"}
            onClick={() => loadMore(10)}
          >
            {status === "Exhausted" 
              ? (t.dashboard?.contacts?.noMore || "No more") 
              : isLoading 
                ? (t.dashboard?.common?.loading || "Loading...") 
                : (t.dashboard?.contacts?.loadMore || "Load more")}
          </Button>
        </div>
      </div>
    </div>
  )
}
