"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function CustomerInvoicesList() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer Invoices</CardTitle>
        <CardDescription>Manage all customer invoices across your organization</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">
          Customer Invoices list - Coming soon
        </div>
      </CardContent>
    </Card>
  );
}
