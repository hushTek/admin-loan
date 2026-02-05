"use client"

import { useState, useMemo } from "react";
import { usePaginatedQuery, useMutation } from "convex/react";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { TypeForm, LoanTypeFormValues } from "./_components/type-form";
import { api } from "@/convex/_generated/api";
import { useLanguage } from "@/components/language-provider";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tag, Banknote, Percent, Clock, RotateCw, Calculator, Activity, Trash, Edit } from "lucide-react";

type LoanType = LoanTypeFormValues & {
  _id: Id<"loanTypes">;
  createdAt: number;
};

export default function Page() {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [includeInactive, setIncludeInactive] = useState(false);
  const [editing, setEditing] = useState<LoanType | null>(null);
  const [creating, setCreating] = useState(false);

  const { results, isLoading, loadMore, status } = usePaginatedQuery(
    api.loantype.listPaginated,
    { search, includeInactive },
    { initialNumItems: 10 }
  );
  const remove = useMutation("loantype:remove" as unknown as never) as unknown as (
    args: { id: Id<"loanTypes"> }
  ) => Promise<boolean>;

  const items = useMemo(() => results ?? [], [results]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t.dashboard?.loanTypes?.title || "Loan Types"}</h1>
        <Button onClick={() => setCreating(true)}>{t.dashboard?.loanTypes?.new || "New Loan Type"}</Button>
      </div>
      <section className="space-y-4 pt-6">
        <div className="flex gap-3">
          <Input
            placeholder={t.dashboard?.loanTypes?.searchPlaceholder || "Search name or description..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-md"
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={includeInactive}
              onChange={(e) => setIncludeInactive(e.target.checked)}
            />
            {t.dashboard?.loanTypes?.includeInactive || "Include inactive"}
          </label>
        </div>
        <Separator />
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                    <div className="flex items-center gap-2">
                        <Tag className="h-3 w-3" />
                        {t.dashboard?.loanTypes?.table?.name || "Name"}
                    </div>
                </TableHead>
                <TableHead>
                    <div className="flex items-center gap-2">
                        <Banknote className="h-3 w-3" />
                        {t.dashboard?.loanTypes?.table?.range || "Range"}
                    </div>
                </TableHead>
                <TableHead>
                    <div className="flex items-center gap-2">
                        <Percent className="h-3 w-3" />
                        {t.dashboard?.loanTypes?.table?.interestRate || "Interest %"}
                    </div>
                </TableHead>
                <TableHead>
                    <div className="flex items-center gap-2">
                        <Percent className="h-3 w-3" />
                        {t.dashboard?.loanTypes?.table?.penaltyRate || "Penalty %"}
                    </div>
                </TableHead>
                <TableHead>
                    <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        {t.dashboard?.loanTypes?.table?.duration || "Duration"}
                    </div>
                </TableHead>
                <TableHead>
                    <div className="flex items-center gap-2">
                        <RotateCw className="h-3 w-3" />
                        {t.dashboard?.loanTypes?.table?.frequency || "Frequency"}
                    </div>
                </TableHead>
                <TableHead>
                    <div className="flex items-center gap-2">
                        <Calculator className="h-3 w-3" />
                        {t.dashboard?.loanTypes?.table?.method || "Method"}
                    </div>
                </TableHead>
                <TableHead>
                    <div className="flex items-center gap-2">
                        <Activity className="h-3 w-3" />
                        {t.dashboard?.loanTypes?.table?.active || "Active"}
                    </div>
                </TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((lt) => (
                <TableRow key={lt._id}>
                  <TableCell className="font-medium">{lt.name}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {Intl.NumberFormat().format(lt.minAmount)} –{" "}
                    {Intl.NumberFormat().format(lt.maxAmount)}
                  </TableCell>
                  <TableCell>{lt.interestRate}%</TableCell>
                  <TableCell>{lt.penaltyRate}%</TableCell>
                  <TableCell>{lt.durationMonths} {t.apply.step3.month || "months"}</TableCell>
                  <TableCell className="capitalize">{lt.repaymentFrequency}</TableCell>
                  <TableCell className="capitalize">{lt.calculationMethod.replace("_", " ")}</TableCell>
                  <TableCell>
                    <span
                      className={
                        lt.active
                          ? "text-green-600 font-medium text-xs flex items-center gap-1"
                          : "text-gray-400 text-xs flex items-center gap-1"
                      }
                    >
                      {lt.active ? "Active" : "Inactive"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => setEditing(lt)}
                        title={t.dashboard?.common?.edit || "Edit"}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        onClick={async () => {
                          if (confirm(t.dashboard?.loanTypes?.deleteConfirm || "Delete this loan type? This cannot be undone.")) {
                            try {
                              await remove({ id: lt._id });
                            } catch (err: unknown) {
                              const msg = err instanceof Error ? err.message : (t.dashboard?.loanTypes?.deleteFailed || "Failed to delete");
                              alert(msg);
                            }
                          }
                        }}
                        title={t.dashboard?.common?.delete || "Delete"}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {items.length === 0 && (
                <TableRow>
                  <TableCell className="py-6 text-center text-muted-foreground" colSpan={9}>
                    {t.dashboard?.loanTypes?.empty || "No loan types found"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex justify-end">
          <Button
            variant="outline"
            disabled={isLoading || status === "Exhausted"}
            onClick={() => loadMore(10)}
          >
            {status === "Exhausted" ? (t.dashboard?.applications?.noMore || "No more") : isLoading ? (t.dashboard?.common?.loading || "Loading...") : (t.dashboard?.applications?.loadMore || "Load more")}
          </Button>
        </div>
      </section>

      {creating && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg w-full max-w-2xl p-6 shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">{t.dashboard?.loanTypes?.create || "Create Loan Type"}</h2>
              <Button variant="ghost" onClick={() => setCreating(false)}>
                {t.dashboard?.loanTypes?.close || "Close"}
              </Button>
            </div>
            <TypeForm
              onSaved={() => {
                setCreating(false);
              }}
              key="create"
            />
          </div>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg w-full max-w-2xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">{t.dashboard?.loanTypes?.edit || "Edit Loan Type"}</h2>
              <Button variant="ghost" onClick={() => setEditing(null)}>
                {t.dashboard?.loanTypes?.close || "Close"}
              </Button>
            </div>
            <TypeForm
              id={editing._id}
              initial={editing}
              onSaved={() => {
                setEditing(null);
              }}
              key={String(editing._id)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
