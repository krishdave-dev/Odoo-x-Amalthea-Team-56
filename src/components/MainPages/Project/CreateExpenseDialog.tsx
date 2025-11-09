"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { FileUpload } from "@/components/ui/file-upload";
import { AttachmentList } from "@/components/ui/attachment-list";

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachmentRefresh, setAttachmentRefresh] = useState(0);
  
  // Generate temporary ID for pending expense
  const [tempExpenseId] = useState(() => -Math.floor(Math.random() * 1000000));
  
  const { toast } = useToast();

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
      
      // Create expense
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
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create expense");
      }

      const data = await response.json();

      // Reassociate attachments from temporary ID to actual expense ID
      if (data.success && data.data?.id) {
        console.log('🔄 Reassociating expense attachments from temp ID:', tempExpenseId, 'to expense ID:', data.data.id);
        
        try {
          const reassociateResponse = await fetch('/api/attachments/reassociate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              organizationId,
              temporaryOwnerId: tempExpenseId,
              temporaryOwnerType: 'pending_expense',
              actualOwnerId: data.data.id,
              actualOwnerType: 'expense',
            }),
          });

          const reassociateResult = await reassociateResponse.json();
          console.log('🔄 Reassociate result:', reassociateResult);
        } catch (error) {
          console.error('Failed to reassociate attachments:', error);
        }
      }

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
      setAttachmentRefresh(prev => prev + 1);
      
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
            <Label>Receipts & Documents</Label>
            <p className="text-xs text-muted-foreground mb-2">
              Upload receipts, invoices, or supporting documents (Images, PDFs, Word/Excel files)
            </p>
            <FileUpload
              organizationId={organizationId}
              ownerType="pending_expense"
              ownerId={tempExpenseId}
              uploadedBy={userId}
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
              maxSizeMB={10}
              multiple={true}
              showPreview={true}
              onUploadComplete={() => setAttachmentRefresh(prev => prev + 1)}
            />
            <div className="mt-2">
              <AttachmentList
                ownerType="pending_expense"
                ownerId={tempExpenseId}
                organizationId={organizationId}
                allowDelete={true}
                refreshTrigger={attachmentRefresh}
              />
            </div>
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
