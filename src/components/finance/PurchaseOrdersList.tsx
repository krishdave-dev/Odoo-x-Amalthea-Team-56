"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function PurchaseOrdersList() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Purchase Orders</CardTitle>
        <CardDescription>Manage all purchase orders across your organization</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">
          Purchase Orders list - Coming soon
        </div>
      </CardContent>
    </Card>
  );
}
