"use client";

import * as React from "react";
import { CsvImporter } from "@/components/csv-importer";
import { Button } from "@/components/base-button";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const IMPORT_FIELDS = [
  { label: "Customer Name", value: "customer_name", required: true },
  { label: "Phone", value: "customer_phone", required: true },
  { label: "NIDA", value: "customer_nida" },
  { label: "Email", value: "customer_email" },
  { label: "Address", value: "customer_address" },
  { label: "Loan Amount", value: "loan_amount", required: true },
  { label: "Product Name", value: "loan_product" },
  { label: "Interest Rate (%)", value: "interest_rate", required: true },
  { label: "Duration (Months)", value: "duration_months", required: true },
  { label: "Start Date (YYYY-MM-DD)", value: "start_date", required: true },
  { label: "Total Repaid", value: "repayment_amount" },
  { label: "Last Repayment Date", value: "repayment_date" },
];

export function CustomersImporter() {
  const [data, setData] = React.useState<any[]>([]);
  const [isSaving, setIsSaving] = React.useState(false);
  const router = useRouter();
  
  // @ts-ignore
  const importLoans = useMutation(api.import.importLegacyLoans);
  // @ts-ignore
  const loanTypes = useQuery(api.loantype.list, {});

  const handleSave = async () => {
    if (data.length === 0) return;
    setIsSaving(true);
    try {
      const result = await importLoans({ loans: data });
      if (result.failed > 0) {
        toast.warning(`Imported ${result.success} loans. Failed: ${result.failed}`, {
          description: result.errors.slice(0, 3).join(", ") + (result.errors.length > 3 ? "..." : ""),
        });
      } else {
        toast.success(`Successfully imported ${result.success} loans`);
        setData([]);
        router.push("/loans");
      }
    } catch (error: any) {
      toast.error("Import failed", { description: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadSample = () => {
    // 1. Create Data for Sheet 1 (Import Template)
    const headers = IMPORT_FIELDS.map((f) => f.label);
    const sampleRow = [
      "John Doe", "0700000000", "123456789", "john@example.com", "Dar es Salaam",
      1000000, "Business Loan", 10, 6, "2023-01-01", 200000, "2023-02-01"
    ];
    
    // 2. Create Data for Sheet 2 (Reference)
    const referenceData = [
      ["Available Loan Types", "Interest Rate (%)", "Default Duration (Months)", "Min Amount", "Max Amount"],
      ...(loanTypes || []).map((lt: any) => [
        lt.name,
        lt.interestRate,
        lt.durationMonths,
        lt.minAmount,
        lt.maxAmount
      ]),
      [], // Empty row
      ["Other Instructions"],
      ["Date Format", "YYYY-MM-DD (e.g. 2023-01-30)"],
      ["Phone Format", "Start with 0 or 255 (e.g. 0712345678)"],
      ["Required Fields", "Customer Name, Phone, Loan Amount, Interest Rate, Duration, Start Date"]
    ];

    // 3. Create Workbook
    const wb = XLSX.utils.book_new();

    // Sheet 1
    const ws1 = XLSX.utils.aoa_to_sheet([headers, sampleRow]);
    XLSX.utils.book_append_sheet(wb, ws1, "Import Template");

    // Sheet 2
    const ws2 = XLSX.utils.aoa_to_sheet(referenceData);
    XLSX.utils.book_append_sheet(wb, ws2, "Reference");

    // 4. Download
    XLSX.writeFile(wb, "loans_import_sample.xlsx");
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={handleDownloadSample}>
          Download Sample CSV
        </Button>
        <div className="flex gap-2">
          <Button 
            disabled={data.length === 0 || isSaving}
            onClick={handleSave}
          >
            {isSaving ? <Spinner className="mr-2" /> : null}
            Save Data
          </Button>
          <CsvImporter
            fields={IMPORT_FIELDS}
            onImport={(parsedData) => {
              // Convert string numbers to actual numbers
              const formattedData = parsedData.map((row: any) => ({
                ...row,
                loan_amount: Number(row.loan_amount),
                interest_rate: Number(row.interest_rate),
                duration_months: Number(row.duration_months),
                repayment_amount: row.repayment_amount ? Number(row.repayment_amount) : 0,
              }));
              setData((prev: any[]) => [...prev, ...formattedData]);
            }}
            className="self-end"
          />
        </div>
      </div>

      <div className="rounded-md border overflow-auto" style={{ maxHeight: 600 }}>
        {data.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>Repaid</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, index) => (
                <TableRow key={index}>
                  <TableCell>{row.customer_name}</TableCell>
                  <TableCell>{row.customer_phone}</TableCell>
                  <TableCell>{row.loan_amount}</TableCell>
                  <TableCell>{row.loan_product || "-"}</TableCell>
                  <TableCell>{row.start_date}</TableCell>
                  <TableCell>{row.repayment_amount || 0}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex items-center justify-center h-40 text-muted-foreground">
            No data to preview. Import a CSV file.
          </div>
        )}
      </div>
    </div>
  );
}
