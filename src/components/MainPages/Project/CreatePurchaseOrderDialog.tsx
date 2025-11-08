"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface CreatePurchaseOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: number;
  organizationId: number;
  onSuccess: () => void;
}

export function CreatePurchaseOrderDialog({
  open,
  onOpenChange,
  projectId,
  organizationId,
  onSuccess,
}: CreatePurchaseOrderDialogProps) {
  const [poNumber, setPoNumber] = useState("");
  const [vendorName, setVendorName] = useState("");
  const [orderDate, setOrderDate] = useState<Date>(new Date());
  const [totalAmount, setTotalAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!poNumber.trim()) {
      toast({
        title: "Validation Error",
        description: "PO Number is required",
        variant: "destructive",
      });
      return;
    }

    if (!totalAmount || parseFloat(totalAmount) < 0) {
      toast({
        title: "Validation Error",
        description: "Total amount must be a non-negative number",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/finance/purchase-orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organizationId,
          projectId,
          poNumber: poNumber.trim(),
          vendorName: vendorName.trim() || undefined,
          orderDate: orderDate.toISOString(),
          totalAmount: parseFloat(totalAmount),
          status: "draft",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create purchase order");
      }

      toast({
        title: "Success",
        description: "Purchase order created successfully",
      });

      // Reset form
      setPoNumber("");
      setVendorName("");
      setOrderDate(new Date());
      setTotalAmount("");
      
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create purchase order",
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
          <DialogTitle>Create Purchase Order</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="poNumber">
              PO Number <span className="text-red-500">*</span>
            </Label>
            <Input
              id="poNumber"
              value={poNumber}
              onChange={(e) => setPoNumber(e.target.value)}
              placeholder="e.g., PO-2024-001"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vendorName">Vendor Name</Label>
            <Input
              id="vendorName"
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
              placeholder="e.g., ABC Suppliers"
            />
          </div>

          <div className="space-y-2">
            <Label>Order Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !orderDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {orderDate ? format(orderDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={orderDate}
                  onSelect={(date) => date && setOrderDate(date)}
                  disabled={(date) => date > new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="totalAmount">
              Total Amount (₹) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="totalAmount"
              type="number"
              step="0.01"
              min="0"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
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
              {isSubmitting ? "Creating..." : "Create Purchase Order"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
