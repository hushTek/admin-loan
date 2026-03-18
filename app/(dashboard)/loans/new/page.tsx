"use client"

import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Doc, Id } from "@/convex/_generated/dataModel"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function NewLoanPage() {
  const router = useRouter()
  const me = useQuery(api.user.getMe, {})
  const loanTypes = useQuery(api.loantype.list, { includeInactive: false })
  const [nidaLookup, setNidaLookup] = useState("")
  const nidaContact = useQuery(
    api.contacts.getByNida,
    nidaLookup.trim() ? { nida: nidaLookup.trim() } : "skip"
  )
  const create = useMutation(api.loans.adminCreateApproved)

  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [dateOfBirth, setDateOfBirth] = useState("")
  const [maritalStatus, setMaritalStatus] = useState("")
  const [spouseName, setSpouseName] = useState("")
  const [nidaNumber, setNidaNumber] = useState("")
  const [loadedFromNida, setLoadedFromNida] = useState<null | { nida: string; contactId: string }>(null)

  const [street, setStreet] = useState("")
  const [houseNumber, setHouseNumber] = useState("")
  const [ward, setWard] = useState("")
  const [district, setDistrict] = useState("")
  const [region, setRegion] = useState("")

  const [loanTypeId, setLoanTypeId] = useState<string>("")
  const [principalAmount, setPrincipalAmount] = useState("")
  const [loanPurpose, setLoanPurpose] = useState("")
  const [startDate, setStartDate] = useState("")

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Debounce NIDA lookups so paste/typing doesn't spam queries.
  useEffect(() => {
    const nida = nidaNumber.trim()
    if (!nida) {
      setNidaLookup("")
      return
    }
    const t = window.setTimeout(() => {
      setNidaLookup(nida)
    }, 450)
    return () => window.clearTimeout(t)
  }, [nidaNumber])

  useEffect(() => {
    if (!nidaLookup.trim()) return
    if (!nidaContact) {
      setLoadedFromNida(null)
      return
    }
    // Auto-fill from database
    setName(nidaContact.name ?? "")
    setPhone(nidaContact.phone ?? "")
    setEmail(nidaContact.email ?? "")
    setDateOfBirth(nidaContact.dateOfBirth ?? "")
    setMaritalStatus(nidaContact.marital?.status ?? "")
    setSpouseName(nidaContact.marital?.name ?? "")
    setNidaNumber(nidaContact.identity?.serial ?? nidaLookup.trim())
    setStreet(nidaContact.address?.street ?? "")
    setWard(nidaContact.address?.ward ?? "")
    setDistrict(nidaContact.address?.district ?? "")
    setRegion(nidaContact.address?.region ?? "")
    setHouseNumber(nidaContact.address?.houseNumber ?? "")
    setLoadedFromNida({ nida: nidaLookup.trim(), contactId: nidaContact._id })
  }, [nidaLookup, nidaContact])

  const loanType = useMemo(
    () => (loanTypes ?? []).find((lt: Doc<"loanTypes">) => lt._id === loanTypeId),
    [loanTypes, loanTypeId]
  )

  const canCreate = me?.role === "admin" || me?.role === "loan_officer"

  const onSave = async () => {
    setError(null)
    if (!canCreate) {
      setError("Forbidden")
      return
    }
    if (!name.trim()) return setError("Customer name is required")
    if (!phone.trim()) return setError("Phone number is required")
    if (!email.trim()) return setError("Email is required")
    if (!dateOfBirth.trim()) return setError("Date of birth is required")
    if (!maritalStatus.trim()) return setError("Marital status is required")
    if (!loanTypeId) return setError("Loan type is required")
    if (!principalAmount.trim() || isNaN(Number(principalAmount)))
      return setError("Principal amount must be a number")

    setSaving(true)
    try {
      const res = await create({
        contact: {
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          dateOfBirth: dateOfBirth.trim(),
          maritalStatus: maritalStatus.trim(),
          spouseName: spouseName.trim() || undefined,
          nidaNumber: nidaNumber.trim() || undefined,
          address: {
            street: street.trim() || undefined,
            houseNumber: houseNumber.trim() || undefined,
            ward: ward.trim() || undefined,
            district: district.trim() || undefined,
            region: region.trim() || undefined,
          },
        },
        loan: {
          loanTypeId: loanTypeId as Id<"loanTypes">,
          principalAmount: Number(principalAmount),
          loanPurpose: loanPurpose.trim() || undefined,
          startDate: startDate.trim()
            ? new Date(`${startDate.trim()}T00:00:00`).getTime()
            : undefined,
        },
      })
      router.push(`/loans/${res.loanId}`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 space-y-6 w-full">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Create new loan</h1>
          <p className="text-muted-foreground text-sm mt-1">
            This will create the customer contact (if missing), create an
            application, and create a loan that is approved automatically.
          </p>
        </div>
        <Button onClick={onSave} disabled={!canCreate || saving}>
          {saving ? "Creating..." : "Create loan"}
        </Button>
      </div>

      {error ? (
        <div className="border border-red-200 bg-red-50 text-red-700 rounded-md px-4 py-3 text-sm">
          {error}
        </div>
      ) : null}

      {loadedFromNida ? (
        <div className="border rounded-md px-4 py-3 text-sm bg-muted/30">
          Loaded customer from NIDA <span className="font-medium">{loadedFromNida.nida}</span>.
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="space-y-4 border rounded-lg p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold">Customer</h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setError(null)
                setLoadedFromNida(null)
                setNidaLookup(nidaNumber.trim())
              }}
              disabled={!nidaNumber.trim()}
            >
              Load by NIDA
            </Button>
          </div>

          <div className="space-y-2">
            <Label>NIDA number</Label>
            <Input
              value={nidaNumber}
              onChange={(e) => {
                setLoadedFromNida(null)
                setNidaNumber(e.target.value)
              }}
              placeholder="Enter NIDA to load customer (if registered)"
            />
            {nidaLookup.trim() && nidaContact === undefined ? (
              <div className="text-xs text-muted-foreground">Searching…</div>
            ) : null}
            {nidaLookup.trim() && nidaContact === null ? (
              <div className="text-xs text-muted-foreground">
                No customer found for NIDA {nidaLookup.trim()}.
              </div>
            ) : null}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0XXXXXXXXX / 255XXXXXXXXX / +255XXXXXXXXX"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date of birth</Label>
              <Input
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                placeholder="YYYY-MM-DD"
              />
            </div>
            <div className="space-y-2">
              <Label>Marital status</Label>
              <Input
                value={maritalStatus}
                onChange={(e) => setMaritalStatus(e.target.value)}
                placeholder="single / married / ..."
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Spouse name (optional)</Label>
              <Input value={spouseName} onChange={(e) => setSpouseName(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="space-y-4 border rounded-lg p-5">
          <h2 className="font-semibold">Loan</h2>

          <div className="space-y-2">
            <Label>Loan type</Label>
            <Select value={loanTypeId} onValueChange={setLoanTypeId}>
              <SelectTrigger>
                <SelectValue placeholder="Select loan type" />
              </SelectTrigger>
              <SelectContent>
                {(loanTypes ?? []).map((lt: Doc<"loanTypes">) => (
                  <SelectItem key={lt._id} value={lt._id}>
                    {lt.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {loanType ? (
              <div className="text-xs text-muted-foreground">
                {loanType.interestRate}% interest · {loanType.durationMonths} months ·{" "}
                {loanType.repaymentFrequency}
              </div>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label>Principal amount (TZS)</Label>
            <Input
              type="number"
              value={principalAmount}
              onChange={(e) => setPrincipalAmount(e.target.value)}
              placeholder="0"
            />
          </div>

          <div className="space-y-2">
            <Label>Start date (optional)</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <div className="text-xs text-muted-foreground">
              Leave blank to use today. Used to calculate the expected end date.
            </div>
          </div>

          <div className="space-y-2">
            <Label>Purpose (optional)</Label>
            <Input value={loanPurpose} onChange={(e) => setLoanPurpose(e.target.value)} />
          </div>
        </div>

        <div className="border rounded-lg p-5 space-y-4">
          <h2 className="font-semibold">Address</h2>
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label>Street</Label>
              <Input value={street} onChange={(e) => setStreet(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>House number</Label>
              <Input value={houseNumber} onChange={(e) => setHouseNumber(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Ward</Label>
              <Input value={ward} onChange={(e) => setWard(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>District</Label>
              <Input value={district} onChange={(e) => setDistrict(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Region</Label>
              <Input value={region} onChange={(e) => setRegion(e.target.value)} />
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            Address is optional. If the NIDA exists in the system, it will auto-fill here.
          </div>
        </div>
      </div>
    </div>
  )
}

