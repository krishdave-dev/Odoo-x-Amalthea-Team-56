"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Search, Filter } from "lucide-react";
import { format } from "date-fns";
import { CreateSalesOrderDialog } from "@/components/CRUDPages/create-edit-salesorder/CreateSalesOrderDialog";

interface SalesOrder {
  id: number;
  soNumber: string;
  partnerName: string | null;
  orderDate: string;
  totalAmount: number;
  status: string;
  project: { id: number; name: string } | null;
}

export function SalesOrdersList() {
  const { user } = useAuth();
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [groupBy, setGroupBy] = useState<string>("none");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  useEffect(() => {
    fetchSalesOrders();
  }, [user?.organizationId]);

  const fetchSalesOrders = async () => {
    if (!user?.organizationId) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/finance/sales-orders?organizationId=${user.organizationId}`,
        { credentials: "include" }
      );

      if (response.ok) {
        const result = await response.json();
        setSalesOrders(result.data || []);
      }
    } catch (error) {
      console.error("Error fetching sales orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      draft: "bg-gray-100 text-gray-800",
      confirmed: "bg-blue-100 text-blue-800",
      invoiced: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  // Filter logic
  const filteredOrders = salesOrders.filter((order) => {
    const matchesSearch =
      order.soNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.partnerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.totalAmount.toString().includes(searchTerm);

    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    const matchesProject =
      projectFilter === "all" ||
      (projectFilter === "unlinked" && !order.project) ||
      order.project?.id.toString() === projectFilter;

    return matchesSearch && matchesStatus && matchesProject;
  });

  // Group by logic
  const groupedOrders = () => {
    if (groupBy === "none") {
      return { "All Sales Orders": filteredOrders };
    }

    const groups: Record<string, SalesOrder[]> = {};
    filteredOrders.forEach((order) => {
      let key = "";
      if (groupBy === "project") {
        key = order.project?.name || "Unlinked";
      } else if (groupBy === "status") {
        key = order.status;
      } else if (groupBy === "partner") {
        key = order.partnerName || "No Partner";
      }

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(order);
    });

    return groups;
  };

  const groups = groupedOrders();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Sales Orders</CardTitle>
            <CardDescription>Manage all sales orders across your organization</CardDescription>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Sales Order
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by number, partner, or amount..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="invoiced">Invoiced</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={groupBy} onValueChange={setGroupBy}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Group by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Grouping</SelectItem>
              <SelectItem value="project">Group by Project</SelectItem>
              <SelectItem value="partner">Group by Partner</SelectItem>
              <SelectItem value="status">Group by Status</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : Object.keys(groups).length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No sales orders found. Create your first one!
          </div>
        ) : (
          Object.entries(groups).map(([groupName, orders]) => (
            <div key={groupName} className="mb-6">
              {groupBy !== "none" && (
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  {groupName} ({orders.length})
                </h3>
              )}
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SO Number</TableHead>
                      <TableHead>Partner</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell className="font-medium">{order.soNumber}</TableCell>
                        <TableCell>{order.partnerName || "-"}</TableCell>
                        <TableCell>
                          {order.project ? (
                            <span className="text-sm text-blue-600">{order.project.name}</span>
                          ) : (
                            <span className="text-sm text-muted-foreground">Unlinked</span>
                          )}
                        </TableCell>
                        <TableCell>{format(new Date(order.orderDate), "MMM dd, yyyy")}</TableCell>
                        <TableCell>{formatCurrency(Number(order.totalAmount))}</TableCell>
                        <TableCell>
                          <Badge className={getStatusBadge(order.status)}>{order.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ))
        )}
      </CardContent>

      <CreateSalesOrderDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={() => {
          fetchSalesOrders();
          setCreateDialogOpen(false);
        }}
      />
    </Card>
  );
}
