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

interface PurchaseOrder {
  id: number;
  poNumber: string;
  vendorName?: string;
  totalAmount: number;
}

interface CreateVendorBillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: number;
  organizationId: number;
  purchaseOrders?: PurchaseOrder[];
  onSuccess: () => void;
}

export function CreateVendorBillDialog({
  open,
  onOpenChange,
  projectId,
  organizationId,
  purchaseOrders = [],
  onSuccess,
}: CreateVendorBillDialogProps) {
  const [vendorName, setVendorName] = useState("");
  const [billDate, setBillDate] = useState<Date>(new Date());
  const [amount, setAmount] = useState("");
  const [selectedPoId, setSelectedPoId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Auto-fill vendor name and amount when purchase order is selected
  useEffect(() => {
    if (selectedPoId) {
      const po = purchaseOrders.find((p) => p.id.toString() === selectedPoId);
      if (po) {
        setAmount(po.totalAmount.toString());
        if (po.vendorName) {
          setVendorName(po.vendorName);
        }
      }
    }
  }, [selectedPoId, purchaseOrders]);

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
      const response = await fetch("/api/finance/vendor-bills", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organizationId,
          projectId,
          poId: selectedPoId ? parseInt(selectedPoId) : undefined,
          vendorName: vendorName.trim() || undefined,
          billDate: billDate.toISOString(),
          amount: parseFloat(amount),
          status: "draft",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create vendor bill");
      }

      toast({
        title: "Success",
        description: "Vendor bill created successfully",
      });

      // Reset form
      setVendorName("");
      setBillDate(new Date());
      setAmount("");
      setSelectedPoId("");
      
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create vendor bill",
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
          <DialogTitle>Create Vendor Bill</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {purchaseOrders.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="purchaseOrder">Link to Purchase Order (Optional)</Label>
              <Select value={selectedPoId} onValueChange={setSelectedPoId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a purchase order" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {purchaseOrders.map((po) => (
                    <SelectItem key={po.id} value={po.id.toString()}>
                      {po.poNumber} - ₹{po.totalAmount.toLocaleString("en-IN")}
                      {po.vendorName && ` (${po.vendorName})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="vendorName">Vendor Name</Label>
            <Input
              id="vendorName"
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
              placeholder="e.g., Photographer Services Ltd"
            />
          </div>

          <div className="space-y-2">
            <Label>Bill Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !billDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {billDate ? format(billDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={billDate}
                  onSelect={(date) => date && setBillDate(date)}
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
              placeholder="e.g., 12000"
              required
            />
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
              {isSubmitting ? "Creating..." : "Create Bill"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
