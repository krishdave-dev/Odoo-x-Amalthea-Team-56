"use client";

import { ExpenseForm } from "@/components/CRUDPages/create-edit-expense/ExpenseForm";

const mockData = {
  name: "Office Supplies",
  period: "2025-10",
  project: "Office Setup",
  image: "",
  description: "Purchase of stationery and office supplies.",
};

export default function EditExpensePage() {
  const handleSave = (data: any) => {
    console.log("Saving expense:", data);
  };

  const handleDiscard = () => {
    window.history.back();
  };

  return <ExpenseForm mode="edit" initialData={mockData} onSave={handleSave} onDiscard={handleDiscard} />;
}
