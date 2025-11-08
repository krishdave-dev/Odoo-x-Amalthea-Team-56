"use client";

import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableCaption } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export function SettingsPage() {
  const headers = [
    "Tasks",
    "Sales Order",
    "Purchase Order",
    "Expenses",
    "Dashboard",
    "Invoices",
  ];

  // Sample placeholder rows — frontend-only, will be replaced by backend data later
  const rows = [
    {
      Tasks: "Design UI",
      "Sales Order": "SO-001",
      "Purchase Order": "PO-123",
      Expenses: "$120.00",
      Dashboard: "Ready",
      Invoices: "INV-900",
    },
    {
      Tasks: "Implement API",
      "Sales Order": "SO-002",
      "Purchase Order": "PO-456",
      Expenses: "$560.00",
      Dashboard: "In Progress",
      Invoices: "INV-901",
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-4">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your account and preferences</p>
      </div>

      {/* Action row */}
      <div className="flex items-center justify-between mb-4">
        <button className="bg-violet-600 text-white px-4 py-2 rounded-md font-semibold">New</button>
        <input
          aria-label="Search"
          placeholder="Search......"
          className="bg-transparent border rounded-md px-3 py-2 text-sm w-56 placeholder:text-muted-foreground"
        />
      </div>

      {/* Table area */}
      <div className="rounded-lg border p-4">
        <Table>
          <TableHeader>
            <TableRow>
              {headers.map((h) => (
                <TableHead key={h}>{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {rows.map((r, i) => (
              <TableRow key={i}>
                <TableCell>{r.Tasks}</TableCell>
                <TableCell>
                  <Badge variant="outline">{r["Sales Order"]}</Badge>
                </TableCell>
                <TableCell>{r["Purchase Order"]}</TableCell>
                <TableCell>{r.Expenses}</TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">{r.Dashboard}</span>
                </TableCell>
                <TableCell>{r.Invoices}</TableCell>
              </TableRow>
            ))}
          </TableBody>

          <TableCaption>List of items (frontend placeholder)</TableCaption>
        </Table>
      </div>
    </div>
  );
}
