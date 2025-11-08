"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

interface LineItem {
  product?: string;
  qty?: number;
  price?: number;
}

interface InvoicePopupProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (payload?: { lines?: LineItem[]; customer?: string }) => void;
  lines?: LineItem[];
  onAddProduct?: () => void;
}

export default function InvoicePopup({ open, onClose, onConfirm, lines = [], onAddProduct }: InvoicePopupProps) {
  const [customer, setCustomer] = React.useState("");

  React.useEffect(() => {
    if (!open) setCustomer("");
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

  <Card className="relative z-10 w-[920px] max-w-full rounded-2xl border-2 border-border bg-card text-card-foreground p-6">
        <div className="mb-4 flex items-center gap-4">
          <Button className="border-dashed border-2" onClick={() => { onConfirm({ lines, customer }); onClose(); }}>Confirm</Button>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
        </div>

  <hr className="border-border mb-4" />

        <h3 className="text-xl font-medium mb-3">Customer Invoice</h3>
        <div className="mb-6">
          <Input value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="Select customer" className="bg-transparent border-b text-lg" />
        </div>

        <hr className="border-neutral-200 mb-4" />

        <h4 className="text-lg font-medium mb-3">Invoice Lines</h4>

        <div className="mb-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.length ? (
                lines.map((l, i) => (
                  <TableRow key={i}>
                    <TableCell>{l.product ?? "-"}</TableCell>
                    <TableCell>{l.qty ?? "-"}</TableCell>
                    <TableCell>{l.price ?? "-"}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell>Product</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell>-</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex justify-between items-center">
          <button onClick={() => onAddProduct && onAddProduct()} className="text-accent font-medium">Add a product</button>

          <div className="relative">
            <div className="absolute -right-4 -bottom-8">
              {/* <span className="inline-flex items-center gap-2 bg-teal-100 text-teal-800 px-3 py-1 rounded-full text-sm"></span> */}
            </div>
          </div>
        </div>
      </Card>
    </div>,
    document.body
  );
}
