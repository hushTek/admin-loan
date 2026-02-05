 "use client"
 
 import { useState } from "react"
 import { useQuery, useMutation } from "convex/react"
import { useLanguage } from "@/components/language-provider"
import { Button } from "@/components/ui/button"
 import { Input } from "@/components/ui/input"
 import { Separator } from "@/components/ui/separator"
  import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table"
 
 export default function BankDetailsPage() {
  const { t } = useLanguage()
  const bank = useQuery("bank:get" as unknown as never) as { balance: number } | undefined
   const setBalance = useMutation("bank:set" as unknown as never) as unknown as (args: { balance: number }) => Promise<string>
   const unconfirmed = useQuery("transactions:listUnconfirmedBank" as unknown as never) as Array<
     {
       _id: string
       createdAt: number
       amount: number
       type: "disbursement" | "repayment" | "penalty"
       method: "bank"
       clientName?: string
     }
   > | undefined
   const confirmTx = useMutation("transactions:confirm" as unknown as never) as unknown as (args: { id: string }) => Promise<boolean>
 
   const [manualBalance, setManualBalance] = useState<number | "">(bank?.balance ?? "")
   const current = bank?.balance ?? 0
 
   return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t.dashboard?.bankDetails?.title || "Bank Details"}</h1>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">{t.dashboard?.bankDetails?.floatBalance || "Float (Capital) Balance"}</h2>
        <div className="flex items-center gap-6">
          <div className="text-2xl font-bold">{Intl.NumberFormat().format(current)}</div>
          <div className="flex items-center gap-3">
            <Input
              type="number"
              placeholder={t.dashboard?.bankDetails?.setBalance || "Set balance"}
              value={manualBalance}
              onChange={(e) => setManualBalance(e.target.value === "" ? "" : Number(e.target.value))}
              className="max-w-xs"
            />
            <Button
              onClick={async () => {
                if (manualBalance === "") return
                await setBalance({ balance: Number(manualBalance) })
              }}
            >
              {t.dashboard?.bankDetails?.save || "Save"}
            </Button>
          </div>
        </div>
      </section>

      <Separator />

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">{t.dashboard?.bankDetails?.unconfirmed || "Unconfirmed Bank Transactions"}</h2>
        {!unconfirmed || unconfirmed.length === 0 ? (
          <div className="text-sm text-muted-foreground">{t.dashboard?.bankDetails?.emptyUnconfirmed || "No unconfirmed transactions."}</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.dashboard?.bankDetails?.table?.date || "Date"}</TableHead>
                <TableHead>{t.dashboard?.bankDetails?.table?.contact || "Contact"}</TableHead>
                <TableHead>{t.dashboard?.bankDetails?.table?.type || "Type"}</TableHead>
                <TableHead>{t.dashboard?.bankDetails?.table?.amount || "Amount"}</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {unconfirmed.map((tx) => (
                <TableRow key={tx._id}>
                  <TableCell>{new Date(tx.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="font-medium">{tx.clientName ?? "-"}</TableCell>
                  <TableCell className="capitalize">{tx.type}</TableCell>
                  <TableCell>{tx.amount.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      onClick={async () => {
                        await confirmTx({ id: tx._id })
                      }}
                    >
                      {t.dashboard?.bankDetails?.confirm || "Confirm"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>
    </div>
  )
}
