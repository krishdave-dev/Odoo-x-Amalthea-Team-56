"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SalesOrdersList } from "./SalesOrdersList";
import { PurchaseOrdersList } from "./PurchaseOrdersList";
import { CustomerInvoicesList } from "./CustomerInvoicesList";
import { VendorBillsList } from "./VendorBillsList";
import { ExpensesList } from "./ExpensesList";
import { 
  ShoppingCart, 
  FileText, 
  Receipt, 
  CreditCard, 
  Wallet 
} from "lucide-react";

export function FinanceManagement() {
  const [activeTab, setActiveTab] = useState("sales-orders");

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5 lg:w-auto">
          <TabsTrigger value="sales-orders" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            <span className="hidden sm:inline">Sales Orders</span>
            <span className="sm:hidden">SO</span>
          </TabsTrigger>
          <TabsTrigger value="purchase-orders" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Purchase Orders</span>
            <span className="sm:hidden">PO</span>
          </TabsTrigger>
          <TabsTrigger value="invoices" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            <span className="hidden sm:inline">Invoices</span>
            <span className="sm:hidden">INV</span>
          </TabsTrigger>
          <TabsTrigger value="bills" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Bills</span>
            <span className="sm:hidden">Bills</span>
          </TabsTrigger>
          <TabsTrigger value="expenses" className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            <span className="hidden sm:inline">Expenses</span>
            <span className="sm:hidden">EXP</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sales-orders" className="mt-6">
          <SalesOrdersList />
        </TabsContent>

        <TabsContent value="purchase-orders" className="mt-6">
          <PurchaseOrdersList />
        </TabsContent>

        <TabsContent value="invoices" className="mt-6">
          <CustomerInvoicesList />
        </TabsContent>

        <TabsContent value="bills" className="mt-6">
          <VendorBillsList />
        </TabsContent>

        <TabsContent value="expenses" className="mt-6">
          <ExpensesList />
        </TabsContent>
      </Tabs>
    </div>
  );
}
