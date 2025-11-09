"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function VendorBillsList() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Vendor Bills</CardTitle>
        <CardDescription>Manage all vendor bills across your organization</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">
          Vendor Bills list - Coming soon
        </div>
      </CardContent>
    </Card>
  );
}
