"use client";

import { ExpenseForm } from "@/components/CRUDPages/create-edit-expense/ExpenseForm";

export default function CreateExpensePage() {
  const handleSave = (data: any) => {
    console.log("Creating expense:", data);
  };

  const handleDiscard = () => {
    window.history.back();
  };

  return <ExpenseForm mode="create" onSave={handleSave} onDiscard={handleDiscard} />;
}
