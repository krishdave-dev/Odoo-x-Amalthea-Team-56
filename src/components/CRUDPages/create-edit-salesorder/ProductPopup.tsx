"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface ProductPopupProps {
  open: boolean;
  onClose: () => void;
  onSave: (payload: {
    productName: string;
    sales: boolean;
    purchase: boolean;
    expenses: boolean;
    price?: number;
    tax?: string;
    cost?: number;
  }) => void;
}

export default function ProductPopup({ open, onClose, onSave }: ProductPopupProps) {
  const [productName, setProductName] = React.useState("");
  const [sales, setSales] = React.useState(true);
  const [purchase, setPurchase] = React.useState(false);
  const [expenses, setExpenses] = React.useState(false);
  const [price, setPrice] = React.useState<number | "">("");
  const [tax, setTax] = React.useState("");
  const [cost, setCost] = React.useState<number | "">("");

  React.useEffect(() => {
    if (!open) {
      // reset when closed
      setProductName("");
      setSales(true);
      setPurchase(false);
      setExpenses(false);
      setPrice("");
      setTax("");
      setCost("");
    }
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <Card className="relative z-10 w-[900px] max-w-full rounded-2xl border border-border bg-card text-card-foreground p-8">
        <h3 className="text-2xl font-semibold text-red mb-6">Product Create/Edit view</h3>

        <div className="mb-4">
          <Label className="block mb-2">Product name</Label>
          <Input value={productName} onChange={(e) => setProductName(e.target.value)} className="bg-transparent border-b text-lg" />
        </div>

        <div className="mb-6 flex items-center gap-6">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={sales} onChange={(e) => setSales(e.target.checked)} className="w-5 h-5" />
            <span className="ml-1">Sales</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={purchase} onChange={(e) => setPurchase(e.target.checked)} className="w-5 h-5" />
            <span className="ml-1">Purchase</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={expenses} onChange={(e) => setExpenses(e.target.checked)} className="w-5 h-5" />
            <span className="ml-1">Expenses</span>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6 items-end">
          <div>
            <Label className="block mb-2">Sales price</Label>
            <Input type="number" value={price === "" ? "" : String(price)} onChange={(e) => setPrice(e.target.value === "" ? "" : Number(e.target.value))} className="bg-transparent border-b" />
          </div>

          <div>
            <Label className="block mb-2">Sales Taxes</Label>
            <Input value={tax} onChange={(e) => setTax(e.target.value)} className="bg-transparent border-b" />
          </div>

          <div>
            <Label className="block mb-2">Cost</Label>
            <Input type="number" value={cost === "" ? "" : String(cost)} onChange={(e) => setCost(e.target.value === "" ? "" : Number(e.target.value))} className="bg-transparent border-b" />
          </div>

          <div className="relative">
            {/* small green tag shown near center as in screenshot */}
            <div className="absolute left-6 top-3 -translate-y-2">
              <span className="inline-block bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm">Brilliant Goose</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => {
            onSave({
              productName,
              sales,
              purchase,
              expenses,
              price: price === "" ? undefined : Number(price),
              tax,
              cost: cost === "" ? undefined : Number(cost),
            });
            onClose();
          }}>Save</Button>
        </div>
      </Card>
    </div>,
    document.body
  );
}
