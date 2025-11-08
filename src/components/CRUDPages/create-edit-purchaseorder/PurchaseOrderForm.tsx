"use client";

import * as React from "react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

interface PurchaseOrderFormProps {
  mode?: "create" | "edit";
  initialData?: any;
}

export function PurchaseOrderForm({ mode = "create", initialData }: PurchaseOrderFormProps) {
  interface Line {
    product: string;
    qty: number;
    unit: string;
    price: number;
    tax: string;
  }

  interface LineState extends Line {
    amount: number;
  }

  const initialLines: Line[] =
    initialData?.lines ?? [
      { product: "P1", qty: 10, unit: "Kg", price: 15, tax: "15%" },
      { product: "P1", qty: 10, unit: "Litre", price: 20, tax: "15%" },
    ];

  const [lines, setLines] = React.useState<LineState[]>(
    initialLines.map((l: Line) => ({ ...l, amount: Number(l.qty) * Number(l.price) }))
  );

  const parseTax = (tax: string) => {
    if (!tax) return 0;
    const cleaned = String(tax).replace("%", "");
    const n = Number(cleaned);
    return isNaN(n) ? 0 : n / 100;
  };

  const untaxedAmount = lines.reduce((s: number, l: LineState) => s + Number(l.qty) * Number(l.price), 0);
  const taxAmount = lines.reduce(
    (s: number, l: LineState) => s + Number(l.qty) * Number(l.price) * parseTax(l.tax || "0%"),
    0
  );
  const total = untaxedAmount + taxAmount;

  const updateLine = (index: number, patch: Partial<Line>) => {
    setLines((prev: LineState[]) => {
      const next = prev.map((r: LineState, i: number) => (i === index ? { ...r, ...patch } : r));
      return next.map((r: LineState) => ({ ...r, amount: Number(r.qty) * Number(r.price) }));
    });
  };

  const addLine = () => {
    setLines((prev: LineState[]) => [...prev, { product: "", qty: 1, unit: "", price: 0, tax: "0%", amount: 0 }]);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="p-6 min-h-[520px]">
        {/* Action buttons */}
        <div className="flex items-center gap-3 mb-4">
          <Button>Create Bills</Button>
          <Button>Confirm</Button>
          <Button variant="outline">Cancel</Button>
        </div>

        <hr className="border-neutral-700 mb-4" />

        {/* Order header */}
        <div className="mb-6">
          <h2 className="text-2xl font-semibold">P001</h2>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="block mb-2">Vendor</Label>
              <Input placeholder="Select vendor" className="bg-transparent border-b text-lg" />
            </div>

            <div>
              <Label className="block mb-2">Project</Label>
              <Input placeholder="Select project" className="bg-transparent border-b text-lg" />
            </div>
          </div>
        </div>

        <hr className="border-neutral-700 my-4" />

        {/* Order lines */}
        <div className="mb-4">
          <h3 className="text-lg font-medium mb-3">Order Lines</h3>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Unit Price</TableHead>
                <TableHead>Taxes</TableHead>
                <TableHead>Amount</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {lines.map((l: any, idx: number) => (
                <TableRow key={idx}>
                  <TableCell>
                    {mode === "edit" ? (
                      <Input value={l.product} onChange={(e) => updateLine(idx, { product: e.target.value })} className="w-full" />
                    ) : (
                      l.product
                    )}
                  </TableCell>

                  <TableCell>
                    {mode === "edit" ? (
                      <Input type="number" value={String(l.qty)} onChange={(e) => updateLine(idx, { qty: Number(e.target.value) })} className="w-24" />
                    ) : (
                      l.qty
                    )}
                  </TableCell>

                  <TableCell>
                    {mode === "edit" ? (
                      <Input value={l.unit} onChange={(e) => updateLine(idx, { unit: e.target.value })} className="w-24" />
                    ) : (
                      l.unit
                    )}
                  </TableCell>

                  <TableCell>
                    {mode === "edit" ? (
                      <Input type="number" value={String(l.price)} onChange={(e) => updateLine(idx, { price: Number(e.target.value) })} className="w-28" />
                    ) : (
                      l.price
                    )}
                  </TableCell>

                  <TableCell>
                    {mode === "edit" ? (
                      <Input value={l.tax} onChange={(e) => updateLine(idx, { tax: e.target.value })} className="w-20" />
                    ) : (
                      <Badge variant="outline">{l.tax}</Badge>
                    )}
                  </TableCell>

                  <TableCell>{Number(l.amount).toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="mt-4">
            <Button variant="ghost" onClick={addLine} className="text-red-400 font-medium">Add a product</Button>
          </div>
        </div>

        {/* Totals area aligned right */}
        <div className="flex justify-end mt-6">
          <div className="w-64 text-right">
            <div className="mb-2">
              <span className="block text-sm text-muted-foreground">UnTaxed Amount:</span>
              <span className="text-lg font-semibold">${untaxedAmount.toFixed(2)}</span>
            </div>
            <div>
              <span className="block text-sm text-muted-foreground">Total:</span>
              <span className="text-lg font-semibold">${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
