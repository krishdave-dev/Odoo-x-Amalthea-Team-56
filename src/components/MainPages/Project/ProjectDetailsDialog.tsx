"use client";

import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText,
  ShoppingCart,
  Receipt,
  DollarSign,
  Loader2,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ProjectDetailsDialogProps {
  projectId: number;
  projectName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: number;
}

interface ProjectLinks {
  salesOrders: Array<{
    id: number;
    soNumber: string;
    partnerName: string | null;
    totalAmount: number;
    status: string;
    orderDate: Date;
  }>;
  purchaseOrders: Array<{
    id: number;
    poNumber: string;
    vendorName: string | null;
    totalAmount: number;
    status: string;
    orderDate: Date;
  }>;
  invoices: Array<{
    id: number;
    invoiceNumber: string;
    amount: number;
    status: string;
    invoiceDate: Date;
  }>;
  bills: Array<{
    id: number;
    vendorName: string | null;
    amount: number;
    status: string;
    billDate: Date;
  }>;
  expenses: Array<{
    id: number;
    amount: number;
    billable: boolean;
    status: string;
    note: string | null;
    user: {
      id: number;
      name: string | null;
    } | null;
    createdAt: Date;
  }>;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

const getStatusColor = (status: string) => {
  const statusMap: Record<string, string> = {
    draft: "bg-gray-500",
    pending: "bg-yellow-500",
    confirmed: "bg-blue-500",
    sent: "bg-blue-500",
    approved: "bg-green-500",
    paid: "bg-green-500",
    invoiced: "bg-green-500",
    billed: "bg-green-500",
    rejected: "bg-red-500",
    cancelled: "bg-red-500",
    submitted: "bg-blue-500",
  };
  return statusMap[status.toLowerCase()] || "bg-gray-500";
};

export function ProjectDetailsDialog({
  projectId,
  projectName,
  open,
  onOpenChange,
  organizationId,
}: ProjectDetailsDialogProps) {
  const [links, setLinks] = useState<ProjectLinks | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && projectId) {
      fetchProjectLinks();
    }
  }, [open, projectId]);

  const fetchProjectLinks = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/projects/${projectId}/links?organizationId=${organizationId}&include=salesOrders,purchaseOrders,invoices,bills,expenses&limit=10`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch project links");
      }

      const data = await response.json();
      setLinks(data.data.links);
    } catch (error) {
      console.error("Error fetching project links:", error);
      toast({
        title: "Error",
        description: "Failed to load project details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{projectName}</DialogTitle>
          <p className="text-sm text-muted-foreground">Project Links & Financial Documents</p>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : links ? (
          <Tabs defaultValue="salesOrders" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="salesOrders" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Sales Orders</span>
                <Badge variant="secondary" className="ml-1">
                  {links.salesOrders.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="purchaseOrders" className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                <span className="hidden sm:inline">Purchase Orders</span>
                <Badge variant="secondary" className="ml-1">
                  {links.purchaseOrders.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="invoices" className="flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                <span className="hidden sm:inline">Invoices</span>
                <Badge variant="secondary" className="ml-1">
                  {links.invoices.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="bills" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                <span className="hidden sm:inline">Bills</span>
                <Badge variant="secondary" className="ml-1">
                  {links.bills.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="expenses" className="flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                <span className="hidden sm:inline">Expenses</span>
                <Badge variant="secondary" className="ml-1">
                  {links.expenses.length}
                </Badge>
              </TabsTrigger>
            </TabsList>

            {/* Sales Orders */}
            <TabsContent value="salesOrders" className="mt-4">
              {links.salesOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mb-4 opacity-20" />
                  <p>No sales orders linked to this project</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {links.salesOrders.map((so) => (
                    <div
                      key={so.id}
                      className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{so.soNumber}</h4>
                            <Badge className={getStatusColor(so.status)}>
                              {so.status}
                            </Badge>
                          </div>
                          {so.partnerName && (
                            <p className="text-sm text-muted-foreground">
                              Customer: {so.partnerName}
                            </p>
                          )}
                          <p className="text-sm text-muted-foreground">
                            Date: {format(new Date(so.orderDate), "MMM dd, yyyy")}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">{formatCurrency(so.totalAmount)}</p>
                          <Button variant="ghost" size="sm" className="mt-2">
                            <ExternalLink className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Purchase Orders */}
            <TabsContent value="purchaseOrders" className="mt-4">
              {links.purchaseOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <ShoppingCart className="h-12 w-12 mb-4 opacity-20" />
                  <p>No purchase orders linked to this project</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {links.purchaseOrders.map((po) => (
                    <div
                      key={po.id}
                      className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{po.poNumber}</h4>
                            <Badge className={getStatusColor(po.status)}>
                              {po.status}
                            </Badge>
                          </div>
                          {po.vendorName && (
                            <p className="text-sm text-muted-foreground">
                              Vendor: {po.vendorName}
                            </p>
                          )}
                          <p className="text-sm text-muted-foreground">
                            Date: {format(new Date(po.orderDate), "MMM dd, yyyy")}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">{formatCurrency(po.totalAmount)}</p>
                          <Button variant="ghost" size="sm" className="mt-2">
                            <ExternalLink className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Customer Invoices */}
            <TabsContent value="invoices" className="mt-4">
              {links.invoices.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Receipt className="h-12 w-12 mb-4 opacity-20" />
                  <p>No customer invoices linked to this project</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {links.invoices.map((invoice) => (
                    <div
                      key={invoice.id}
                      className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{invoice.invoiceNumber}</h4>
                            <Badge className={getStatusColor(invoice.status)}>
                              {invoice.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Date: {format(new Date(invoice.invoiceDate), "MMM dd, yyyy")}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">{formatCurrency(invoice.amount)}</p>
                          <Button variant="ghost" size="sm" className="mt-2">
                            <ExternalLink className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Vendor Bills */}
            <TabsContent value="bills" className="mt-4">
              {links.bills.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <DollarSign className="h-12 w-12 mb-4 opacity-20" />
                  <p>No vendor bills linked to this project</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {links.bills.map((bill) => (
                    <div
                      key={bill.id}
                      className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">
                              {bill.vendorName || "Unknown Vendor"}
                            </h4>
                            <Badge className={getStatusColor(bill.status)}>
                              {bill.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Date: {format(new Date(bill.billDate), "MMM dd, yyyy")}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">{formatCurrency(bill.amount)}</p>
                          <Button variant="ghost" size="sm" className="mt-2">
                            <ExternalLink className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Expenses */}
            <TabsContent value="expenses" className="mt-4">
              {links.expenses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Receipt className="h-12 w-12 mb-4 opacity-20" />
                  <p>No expenses linked to this project</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {links.expenses.map((expense) => (
                    <div
                      key={expense.id}
                      className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">
                              {expense.user?.name || "Unknown User"}
                            </h4>
                            <Badge className={getStatusColor(expense.status)}>
                              {expense.status}
                            </Badge>
                            {expense.billable && (
                              <Badge variant="outline" className="bg-blue-50">
                                Billable
                              </Badge>
                            )}
                          </div>
                          {expense.note && (
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {expense.note}
                            </p>
                          )}
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(expense.createdAt), "MMM dd, yyyy")}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">{formatCurrency(expense.amount)}</p>
                          <Button variant="ghost" size="sm" className="mt-2">
                            <ExternalLink className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <AlertCircle className="h-12 w-12 mb-4 opacity-20" />
            <p>Failed to load project details</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
