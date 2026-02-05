// Server: get Supabase tokens from NextAuth session

import NextLink from "next/link";
import { CustomersImporter } from "./importer";
import { Button } from "@/components/ui/button";

export default async function Page() {
 
  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="space-y-1">
        <div className="flex justify-between">
          <h4 className="text-sm leading-none font-semibold">Import customers</h4>
          <div className="flex justify-between gap-2">
            <NextLink href="/loans/import">
              <Button size="sm" variant="outline">Import</Button>
            </NextLink>
          </div>
        </div>

        <p className="text-muted-foreground text-sm">
          Only csv files are allowed.
        </p>
      </div>
     
      <div style={{ height: 500 }}>
          <CustomersImporter />
      </div>
    </div>
  )
}