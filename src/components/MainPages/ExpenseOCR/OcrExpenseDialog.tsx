"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { FileUpload } from "@/components/ui/file-upload";
import { AttachmentList } from "@/components/ui/attachment-list";
import { Progress } from "@/components/ui/progress";
import { Sparkles, FileText } from "lucide-react";

interface OcrExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: number;
  organizationId: number;
  userId: number;
  onSuccess: () => void;
}

export function OcrExpenseDialog({
  open,
  onOpenChange,
  projectId,
  organizationId,
  userId,
  onSuccess,
}: OcrExpenseDialogProps) {
  const { toast } = useToast();
  const [tempExpenseId] = useState(() => -Math.floor(Math.random() * 1000000));
  const [uploads, setUploads] = useState<number>(0);
  const [thinking, setThinking] = useState(false);
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState(0);
  const steps = [
    "Scanning document",
    "Detecting text",
    "Extracting totals",
    "Summarizing notes",
    "Preparing expense",
  ];

  // Extracted (dummy) fields
  const [amount, setAmount] = useState("1500");
  const [billable, setBillable] = useState(true);
  const [note, setNote] = useState("Taxi bill from client visit (OCR)");
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Start OCR simulation once a file is present
  useEffect(() => {
    if (uploads > 0 && open) {
      setThinking(true);
      setProgress(0);
      setStep(0);
      const interval = setInterval(() => {
        setProgress((p) => {
          const next = Math.min(p + 10, 100);
          // Advance step every 20% until last step
          if (next % 20 === 0)
            setStep((s) => Math.min(s + 1, steps.length - 1));
          return next;
        });
      }, 400);
      return () => clearInterval(interval);
    } else {
      setThinking(false);
      setProgress(0);
      setStep(0);
    }
  }, [uploads, open, steps.length]);

  const ready = useMemo(() => progress >= 100, [progress]);

  const handleConfirm = async () => {
    try {
      setSubmitting(true);
      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          projectId,
          userId,
          amount: parseFloat(amount),
          billable,
          note: note.trim() || undefined,
          autoApprove: false,
        }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to create expense");
      }
      const data = await response.json();

      // Reassociate uploaded attachments
      if (data.success && data.data?.id) {
        try {
          await fetch("/api/attachments/reassociate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              organizationId,
              temporaryOwnerId: tempExpenseId,
              temporaryOwnerType: "pending_expense",
              actualOwnerId: data.data.id,
              actualOwnerType: "expense",
            }),
          });
        } catch {}
      }

      toast({
        title: "Expense created",
        description: "OCR extracted details applied.",
      });
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to create expense",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Reset state on close for a fresh experience
  useEffect(() => {
    if (!open) {
      setUploads(0);
      setThinking(false);
      setProgress(0);
      setStep(0);
      setEditing(false);
      setSubmitting(false);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" /> Create Expense with OCR
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Upload */}
          <div className="space-y-2 max-w-full">
            <Label>Upload Bill (Image/PDF)</Label>
            <p className="text-xs text-muted-foreground">
              Accepted: image/*, .pdf (max 10MB)
            </p>
            <div className="max-w-full break-words">
              <FileUpload
                organizationId={organizationId}
                ownerType="pending_expense"
                ownerId={tempExpenseId}
                uploadedBy={userId}
                accept="image/*,.pdf"
                maxSizeMB={10}
                multiple={false}
                showPreview={true}
                onUploadComplete={() => setUploads((u) => u + 1)}
              />
            </div>
            {uploads > 0 && (
              <div className="max-w-full overflow-hidden">
                <AttachmentList
                  ownerType="pending_expense"
                  ownerId={tempExpenseId}
                  organizationId={organizationId}
                  allowDelete={true}
                  refreshTrigger={uploads}
                />
              </div>
            )}
          </div>

          {/* Thinking progress */}
          {thinking && (
            <div className="rounded-md border p-3 bg-muted/40">
              <div className="flex items-center gap-2 text-sm">
                <Sparkles className="h-4 w-4" />
                <span>{steps[step]}</span>
              </div>
              <div className="mt-3">
                <Progress value={progress} />
                <p className="text-xs text-muted-foreground mt-1">
                  {Math.round(progress)}% complete
                </p>
              </div>
            </div>
          )}

          {/* Extracted preview */}
          {ready && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span>Extracted Details (editable)</span>
              </div>
              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (₹)</Label>
                  <Input
                    id="amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    disabled={!editing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="billable">Billable</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      id="billable"
                      type="checkbox"
                      checked={billable}
                      onChange={(e) => setBillable(e.target.checked)}
                      disabled={!editing}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <span className="text-xs text-muted-foreground">
                      Include in revenue
                    </span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="note">Description / Notes</Label>
                <Textarea
                  id="note"
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  disabled={!editing}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditing((e) => !e)}
                >
                  {editing ? "Lock" : "Edit"}
                </Button>
                <Button
                  type="button"
                  onClick={handleConfirm}
                  disabled={submitting}
                >
                  {submitting ? "Creating..." : "Confirm & Create"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
