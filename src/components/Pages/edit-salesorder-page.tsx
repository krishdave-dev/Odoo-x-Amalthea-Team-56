"use client";

import { SalesOrderForm } from "@/components/CRUDPages/create-edit-salesorder/SalesOrderForm";

const mockData = {
  lines: [
    { product: "P1", qty: 10, unit: "Kg", price: 15, tax: "15%" },
    { product: "P1", qty: 10, unit: "Litre", price: 20, tax: "15%" },
  ],
};

export default function EditSalesOrderPage() {
  return <SalesOrderForm mode="edit" initialData={mockData} />;
}
