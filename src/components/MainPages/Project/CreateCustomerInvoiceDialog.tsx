"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { FileUpload } from "@/components/ui/file-upload";
import { AttachmentList } from "@/components/ui/attachment-list";

interface SalesOrder {
  id: number;
  soNumber: string;
  totalAmount: number;
}

interface CreateCustomerInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: number;
  organizationId: number;
  userId: number;
  salesOrders?: SalesOrder[];
  onSuccess: () => void;
}

export function CreateCustomerInvoiceDialog({
  open,
  onOpenChange,
  projectId,
  organizationId,
  userId,
  salesOrders = [],
  onSuccess,
}: CreateCustomerInvoiceDialogProps) {
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState<Date>(new Date());
  const [amount, setAmount] = useState("");
  const [selectedSoId, setSelectedSoId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachmentRefresh, setAttachmentRefresh] = useState(0);
  
  // Generate temporary ID for pending invoice
  const [tempInvoiceId] = useState(() => -Math.floor(Math.random() * 1000000));
  
  const { toast } = useToast();

  // Auto-fill amount when sales order is selected
  useEffect(() => {
    if (selectedSoId) {
      const so = salesOrders.find((s) => s.id.toString() === selectedSoId);
      if (so) {
        setAmount(so.totalAmount.toString());
      }
    }
  }, [selectedSoId, salesOrders]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!invoiceNumber.trim()) {
      toast({
        title: "Validation Error",
        description: "Invoice Number is required",
        variant: "destructive",
      });
      return;
    }

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
      const response = await fetch("/api/finance/customer-invoices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organizationId,
          projectId,
          soId: selectedSoId ? parseInt(selectedSoId) : undefined,
          invoiceNumber: invoiceNumber.trim(),
          invoiceDate: invoiceDate.toISOString(),
          amount: parseFloat(amount),
          status: "draft",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create customer invoice");
      }

      const data = await response.json();

      // Reassociate attachments from temporary ID to actual invoice ID
      if (data.success && data.data?.id) {
        console.log('🔄 Reassociating invoice attachments from temp ID:', tempInvoiceId, 'to invoice ID:', data.data.id);
        
        try {
          const reassociateResponse = await fetch('/api/attachments/reassociate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              organizationId,
              temporaryOwnerId: tempInvoiceId,
              temporaryOwnerType: 'pending_customer_invoice',
              actualOwnerId: data.data.id,
              actualOwnerType: 'customer_invoice',
            }),
          });

          const reassociateResult = await reassociateResponse.json();
          console.log('🔄 Reassociate result:', reassociateResult);
        } catch (error) {
          console.error('Failed to reassociate attachments:', error);
        }
      }

      toast({
        title: "Success",
        description: "Customer invoice created successfully",
      });

      // Reset form
      setInvoiceNumber("");
      setInvoiceDate(new Date());
      setAmount("");
      setSelectedSoId("");
      setAttachmentRefresh(prev => prev + 1);
      
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create customer invoice",
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
          <DialogTitle>Create Customer Invoice</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {salesOrders.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="salesOrder">Link to Sales Order (Optional)</Label>
              <Select value={selectedSoId} onValueChange={setSelectedSoId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a sales order" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {salesOrders.map((so) => (
                    <SelectItem key={so.id} value={so.id.toString()}>
                      {so.soNumber} - ₹{so.totalAmount.toLocaleString("en-IN")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="invoiceNumber">
              Invoice Number <span className="text-red-500">*</span>
            </Label>
            <Input
              id="invoiceNumber"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              placeholder="e.g., INV-2024-001"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Invoice Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !invoiceDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {invoiceDate ? format(invoiceDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={invoiceDate}
                  onSelect={(date) => date && setInvoiceDate(date)}
                  disabled={(date) => date > new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

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
              placeholder="e.g., 40000"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Invoice Documents</Label>
            <p className="text-xs text-muted-foreground mb-2">
              Upload invoice copy, supporting documents (Images, PDFs, Word/Excel files)
            </p>
            <FileUpload
              organizationId={organizationId}
              ownerType="pending_customer_invoice"
              ownerId={tempInvoiceId}
              uploadedBy={userId}
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
              maxSizeMB={10}
              multiple={true}
              showPreview={true}
              onUploadComplete={() => setAttachmentRefresh(prev => prev + 1)}
            />
            <div className="mt-2">
              <AttachmentList
                ownerType="pending_customer_invoice"
                ownerId={tempInvoiceId}
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
              {isSubmitting ? "Creating..." : "Create Invoice"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
