"use client"

import { use } from "react"
import { useLanguage } from "@/components/language-provider"

export default function Page ({ params }: { params: Promise<{ ContactID: string }> }) {
    const { ContactID } = use(params)
    const { t } = useLanguage()

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">{t.dashboard?.contactDetails?.title.replace("{id}", ContactID) || `Contact ${ContactID}`}</h1>
            <p className="text-muted-foreground">{t.dashboard?.contactDetails?.subtitle || "Track and manage contact details here."}</p>
        </div>
    )
}
