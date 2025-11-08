"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Upload, X } from "lucide-react";

interface CreateExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: number;
  organizationId: number;
  userId: number;
  userRole: string;
  onSuccess: () => void;
}

export function CreateExpenseDialog({
  open,
  onOpenChange,
  projectId,
  organizationId,
  userId,
  userRole,
  onSuccess,
}: CreateExpenseDialogProps) {
  const [amount, setAmount] = useState("");
  const [billable, setBillable] = useState(false);
  const [note, setNote] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveFile = () => {
    setReceiptFile(null);
    setReceiptPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Validation Error",
        description: "Amount must be a positive number",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const isManagerOrAdmin = userRole === "manager" || userRole === "admin";
      
      // For now, we'll create without receipt upload
      // In production, you'd upload to Cloudinary first
      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organizationId,
          projectId,
          userId,
          amount: parseFloat(amount),
          billable,
          note: note.trim() || undefined,
          autoApprove: isManagerOrAdmin, // Managers and admins auto-approve
          // receiptUrl would be added after Cloudinary upload
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create expense");
      }

      const data = await response.json();

      // Show success message based on role
      const successMessage = isManagerOrAdmin
        ? "Expense created and approved"
        : "Expense created and submitted for approval";

      toast({
        title: "Success",
        description: successMessage,
      });

      // Reset form
      setAmount("");
      setBillable(false);
      setNote("");
      setReceiptFile(null);
      setReceiptPreview(null);
      
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create expense",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Expense</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">
              Amount (₹) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g., 1500"
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="billable"
              checked={billable}
              onChange={(e) => setBillable(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label
              htmlFor="billable"
              className="text-sm font-medium leading-none cursor-pointer"
            >
              Billable to client (will be included in revenue calculation)
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Description / Notes</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g., Travel to client site for meeting"
              rows={3}
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground">
              {note.length}/1000 characters
            </p>
          </div>

          <div className="space-y-2">
            <Label>Receipt / Proof (Optional)</Label>
            {receiptPreview ? (
              <div className="relative inline-block">
                <img
                  src={receiptPreview}
                  alt="Receipt preview"
                  className="h-32 w-auto rounded-md border object-cover"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6"
                  onClick={handleRemoveFile}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Button type="button" variant="outline" asChild className="h-10">
                  <label htmlFor="receipt-file" className="cursor-pointer inline-flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Upload Receipt
                    <input
                      id="receipt-file"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </label>
                </Button>
                <span className="text-sm text-muted-foreground">
                  Upload image of receipt
                </span>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Expense"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
