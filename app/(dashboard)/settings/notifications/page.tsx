"use client"

import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

function parseList(raw: string) {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
}

function normalizeTzPhoneToE164(input: string): string | null {
  const raw = input.trim()
  if (!raw) return null
  const cleaned = raw.startsWith("+")
    ? "+" + raw.slice(1).replace(/\D/g, "")
    : raw.replace(/\D/g, "")
  if (cleaned.startsWith("+255")) {
    const rest = cleaned.slice(4)
    if (rest.length !== 9) return null
    return `+255${rest}`
  }
  if (cleaned.startsWith("255")) {
    const rest = cleaned.slice(3)
    if (rest.length !== 9) return null
    return `+255${rest}`
  }
  if (cleaned.startsWith("0")) {
    const rest = cleaned.slice(1)
    if (rest.length !== 9) return null
    return `+255${rest}`
  }
  return null
}

type ReminderTemplate = {
  id: string
  name: string
  enabled: boolean
  direction: "before" | "after"
  days: number
  message: string
}

function newId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (crypto as any).randomUUID() as string
  }
  return `tmp_${Date.now()}_${Math.floor(Math.random() * 1e6)}`
}

export default function Page() {
  const settings = useQuery(api.notificationSettings.get, {})
  const upsert = useMutation(api.notificationSettings.upsert)

  const [enabled, setEnabled] = useState(true)
  const [emails, setEmails] = useState("")
  const [phones, setPhones] = useState("")
  const [reminderTemplates, setReminderTemplates] = useState<ReminderTemplate[]>([])
  const [saving, setSaving] = useState(false)

  const initial = useMemo(() => settings, [settings])

  useEffect(() => {
    if (!initial) return
    setEnabled(initial.enabled)
    setEmails((initial.emails ?? []).join(", "))
    setPhones((initial.phones ?? []).join(", "))
    setReminderTemplates((initial.reminderTemplates ?? []) as ReminderTemplate[])
  }, [initial])

  const save = async () => {
    setSaving(true)
    try {
      const normalizedPhones = parseList(phones)
        .map((p) => normalizeTzPhoneToE164(p))
        .filter((p): p is string => Boolean(p))
      await upsert({
        enabled,
        emails: parseList(emails),
        phones: normalizedPhones,
        reminderTemplates,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 space-y-6 w-full">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Notifications</h1>
        <p className="text-muted-foreground">
          Choose who should receive alerts when users interact with the system (e.g. new loan applications).
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        {/* Recipients + enable */}
        <div className="border rounded-lg p-5 space-y-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">Recipients</h2>
              <p className="text-sm text-muted-foreground">
                Configure where system notifications should be delivered.
              </p>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
              />
              Enable notifications
            </label>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label>Email recipients</Label>
              <Input
                placeholder="admin@company.com, manager@company.com"
                value={emails}
                onChange={(e) => setEmails(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Separate multiple emails with commas.
              </p>
            </div>

            <div className="space-y-2">
              <Label>SMS recipients</Label>
              <Input
                placeholder="0712345678, 255712345678, +255712345678"
                value={phones}
                onChange={(e) => setPhones(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                You can type numbers starting with <span className="font-mono">0</span>. We will automatically convert them to{" "}
                <span className="font-mono">+255XXXXXXXXX</span> before sending.
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={save} disabled={saving}>
              {saving ? "Saving..." : "Save recipients"}
            </Button>
          </div>
        </div>

        {/* Reminder scheme */}
        <div className="border rounded-lg p-5 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Loan reminder scheme</h2>
            <p className="text-sm text-muted-foreground">
              Create SMS templates that send automatically a number of days before or after a loan’s expiry date.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Available variables: <span className="font-mono">{`{name}`}</span>,{" "}
              <span className="font-mono">{`{dueDate}`}</span>,{" "}
              <span className="font-mono">{`{amount}`}</span>,{" "}
              <span className="font-mono">{`{principal}`}</span>,{" "}
              <span className="font-mono">{`{total}`}</span>,{" "}
              <span className="font-mono">{`{loanId}`}</span>
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              setReminderTemplates((prev) => [
                ...prev,
                {
                  id: newId(),
                  name: `Reminder ${prev.length + 1}`,
                  enabled: true,
                  direction: "before",
                  days: 3,
                  message: "Dear {name}, your loan is due on {dueDate}. Outstanding: {amount}.",
                },
              ])
            }
          >
            Add template
          </Button>
        </div>

        {reminderTemplates.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            No templates yet. Click “Add template”.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {reminderTemplates.map((t, idx) => (
              <div key={t.id} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={t.enabled}
                        onChange={(e) =>
                          setReminderTemplates((prev) =>
                            prev.map((x) => (x.id === t.id ? { ...x, enabled: e.target.checked } : x))
                          )
                        }
                      />
                      Enabled
                    </label>
                    <span className="text-xs text-muted-foreground">Template #{idx + 1}</span>
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => setReminderTemplates((prev) => prev.filter((x) => x.id !== t.id))}
                  >
                    Remove
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2 md:col-span-1">
                    <Label>Template name</Label>
                    <Input
                      value={t.name}
                      onChange={(e) =>
                        setReminderTemplates((prev) =>
                          prev.map((x) => (x.id === t.id ? { ...x, name: e.target.value } : x))
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2 md:col-span-1">
                    <Label>When</Label>
                    <Select
                      value={t.direction}
                      onValueChange={(v) =>
                        setReminderTemplates((prev) =>
                          prev.map((x) => (x.id === t.id ? { ...x, direction: v as "before" | "after" } : x))
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="before">Before expiry</SelectItem>
                        <SelectItem value="after">After expiry</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 md:col-span-1">
                    <Label>Days</Label>
                    <Input
                      type="number"
                      min={0}
                      value={String(t.days)}
                      onChange={(e) =>
                        setReminderTemplates((prev) =>
                          prev.map((x) =>
                            x.id === t.id
                              ? { ...x, days: Number.isFinite(Number(e.target.value)) ? Number(e.target.value) : 0 }
                              : x
                          )
                        )
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Message template (SMS)</Label>
                  <Textarea
                    value={t.message}
                    onChange={(e) =>
                      setReminderTemplates((prev) =>
                        prev.map((x) => (x.id === t.id ? { ...x, message: e.target.value } : x))
                      )
                    }
                    rows={3}
                    placeholder="Dear {name}, your loan is due on {dueDate}..."
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end">
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving..." : "Save scheme"}
          </Button>
        </div>
        </div>
      </div>
    </div>
  )
}

