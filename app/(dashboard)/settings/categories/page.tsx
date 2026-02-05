"use client"

import { useState } from "react"
import { usePaginatedQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tag, Hash, Activity, ArrowUp, ArrowDown, Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function CategoriesPage() {
  const [search, setSearch] = useState("")
  const { results, isLoading, loadMore, status } = usePaginatedQuery(
    api.categories.listPaginated,
    { active: true },
    { initialNumItems: 10 }
  )
  const createCategory = useMutation(api.categories.create)
  
  const [newCategory, setNewCategory] = useState({ 
    name: "", 
    code: "", 
    kind: "expense", 
    effect: "decrease" 
  })
  const [creating, setCreating] = useState(false)
  const [open, setOpen] = useState(false)

  const handleCreate = async () => {
    if (!newCategory.name) return
    setCreating(true)
    try {
      await createCategory({
        name: newCategory.name,
        code: newCategory.code || undefined,
        kind: newCategory.kind as any,
        effect: newCategory.effect as any,
      })
      setNewCategory({ name: "", code: "", kind: "expense", effect: "decrease" })
      setOpen(false)
    } finally {
      setCreating(false)
    }
  }

  // Update effect based on kind
  const updateKind = (kind: string) => {
    let effect = "decrease"
    if (kind === "income" || kind === "repayment") effect = "increase"
    if (kind === "expense" || kind === "disbursement") effect = "decrease"
    // adjustment can be either, defaulting to decrease but user can change if we expose it
    setNewCategory(prev => ({ ...prev, kind, effect }))
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Categories</h1>
          <p className="text-muted-foreground">Manage transaction categories for expenses and income.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="h-9 gap-1">
              <Plus className="h-4 w-4" />
              New Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Category</DialogTitle>
              <DialogDescription>Add a new category for classifying transactions.</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Name</label>
                <Input 
                  placeholder="e.g., Office Supplies, Salary" 
                  value={newCategory.name} 
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })} 
                  className="h-9" 
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Code (Optional)</label>
                <Input 
                  placeholder="e.g., EXP-001" 
                  value={newCategory.code} 
                  onChange={(e) => setNewCategory({ ...newCategory, code: e.target.value })} 
                  className="h-9" 
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Type</label>
                <select 
                  value={newCategory.kind} 
                  onChange={(e) => updateKind(e.target.value)} 
                  className="h-9 rounded-md border px-3 bg-background"
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                  <option value="repayment">Repayment</option>
                  <option value="disbursement">Disbursement</option>
                  <option value="adjustment">Adjustment</option>
                </select>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Effect on Balance</label>
                <div className="flex items-center gap-2 text-sm text-muted-foreground h-9 px-3 border rounded-md bg-muted/20">
                    {newCategory.effect === "increase" ? (
                        <div className="flex items-center gap-2 text-green-600">
                            <ArrowUp className="h-4 w-4" />
                            Increases Balance
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-red-600">
                            <ArrowDown className="h-4 w-4" />
                            Decreases Balance
                        </div>
                    )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)} className="h-9">Cancel</Button>
              <Button 
                onClick={handleCreate} 
                disabled={creating || !newCategory.name} 
                className="h-9"
              >
                {creating ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {!results ? (
        <div className="p-3 text-center text-sm">Loading...</div>
      ) : results.length === 0 ? (
        <div className="p-3 text-center text-muted-foreground text-sm">No categories found.</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <div className="flex items-center gap-2">
                    <Tag className="h-3 w-3" />
                    Name
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-2">
                    <Hash className="h-3 w-3" />
                    Code
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-2">
                    <Activity className="h-3 w-3" />
                    Type
                </div>
              </TableHead>
              <TableHead>Effect</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.map((c) => (
              <TableRow key={c._id}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell className="font-mono text-xs">{c.code || "-"}</TableCell>
                <TableCell className="capitalize">
                    <Badge variant="outline">{c.kind}</Badge>
                </TableCell>
                <TableCell>
                    {c.effect === "increase" ? (
                        <span className="flex items-center gap-1 text-green-600 text-xs font-medium">
                            <ArrowUp className="h-3 w-3" /> Increase
                        </span>
                    ) : (
                        <span className="flex items-center gap-1 text-red-600 text-xs font-medium">
                            <ArrowDown className="h-3 w-3" /> Decrease
                        </span>
                    )}
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
