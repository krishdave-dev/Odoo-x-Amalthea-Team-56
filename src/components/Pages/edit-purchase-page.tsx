"use client";

import { PurchaseOrderForm } from "@/components/CRUDPages/create-edit-purchaseorder/PurchaseOrderForm";

const mockData = {
  lines: [
    { product: "P1", qty: 10, unit: "Kg", price: 15, tax: "15%" },
    { product: "P1", qty: 10, unit: "Litre", price: 20, tax: "15%" },
  ],
};

export default function EditPurchasePage() {
  return <PurchaseOrderForm mode="edit" initialData={mockData} />;
}
