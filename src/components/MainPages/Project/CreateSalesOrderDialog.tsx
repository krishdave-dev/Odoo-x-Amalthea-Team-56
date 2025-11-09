"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface CreateSalesOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: number;
  organizationId: number;
  onSuccess: () => void;
}

export function CreateSalesOrderDialog({
  open,
  onOpenChange,
  projectId,
  organizationId,
  onSuccess,
}: CreateSalesOrderDialogProps) {
  const [soNumber, setSoNumber] = useState("");
  const [partnerName, setPartnerName] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [orderDate, setOrderDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!soNumber.trim()) {
      toast({
        title: "Validation Error",
        description: "SO Number is required",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(totalAmount);
    if (isNaN(amount) || amount < 0) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/finance/sales-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          organizationId,
          projectId,
          soNumber: soNumber.trim(),
          partnerName: partnerName.trim() || undefined,
          orderDate: new Date(orderDate),
          totalAmount: amount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg =
          typeof data.error === "string"
            ? data.error
            : data.error?.message || "Failed to create sales order";
        toast({
          title: "Error",
          description: errorMsg,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Sales order created successfully",
      });

      // Reset form
      setSoNumber("");
      setPartnerName("");
      setTotalAmount("");
      setOrderDate(new Date().toISOString().split("T")[0]);

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create sales order",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Sales Order</DialogTitle>
            <DialogDescription>
              Add a new sales order for this project. This represents what the
              customer is buying.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="soNumber">
                SO Number <span className="text-destructive">*</span>
              </Label>
              <Input
                id="soNumber"
                placeholder="e.g., SO-2024-001"
                value={soNumber}
                onChange={(e) => setSoNumber(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="partnerName">Customer Name</Label>
              <Input
                id="partnerName"
                placeholder="e.g., Acme Corporation"
                value={partnerName}
                onChange={(e) => setPartnerName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="orderDate">Order Date</Label>
              <Input
                id="orderDate"
                type="date"
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalAmount">
                Total Amount (₹) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="totalAmount"
                type="number"
                step="0.01"
                min="0"
                placeholder="e.g., 50000"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Creating..." : "Create Sales Order"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
