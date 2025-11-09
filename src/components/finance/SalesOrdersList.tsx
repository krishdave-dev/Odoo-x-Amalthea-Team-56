"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Search, Filter, ExternalLink, Link as LinkIcon, X } from "lucide-react";
import { format } from "date-fns";

interface SalesOrder {
  id: number;
  soNumber: string;
  partnerName: string | null;
  orderDate: string;
  totalAmount: number;
  status: string;
  project: { id: number; name: string } | null;
  projectId: number | null;
}

interface Project {
  id: number;
  name: string;
}

export function SalesOrdersList() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [partnerFilter, setPartnerFilter] = useState<string>("all");
  const [groupBy, setGroupBy] = useState<string>("none");
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [linkProjectDialogOpen, setLinkProjectDialogOpen] = useState(false);
  const [selectedProjectToLink, setSelectedProjectToLink] = useState<string>("");
  const [linking, setLinking] = useState(false);

  useEffect(() => {
    if (user?.organizationId) {
      fetchSalesOrders();
      fetchProjects();
    }
  }, [user?.organizationId]);

  const fetchProjects = async () => {
    if (!user?.organizationId) return;

    try {
      const response = await fetch(
        `/api/projects?organizationId=${user.organizationId}&pageSize=1000`,
        { credentials: "include" }
      );

      if (response.ok) {
        const result = await response.json();
        setProjects(result.data || []);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  const fetchSalesOrders = async () => {
    if (!user?.organizationId) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/finance/sales-orders?organizationId=${user.organizationId}&pageSize=1000`,
        { credentials: "include" }
      );

      if (response.ok) {
        const result = await response.json();
        setSalesOrders(result.data || []);
      }
    } catch (error) {
      console.error("Error fetching sales orders:", error);
      toast({
        title: "Error",
        description: "Failed to fetch sales orders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLinkToProject = async () => {
    if (!selectedOrder || !selectedProjectToLink) return;

    setLinking(true);
    try {
      const response = await fetch(
        `/api/finance/sales-orders/${selectedOrder.id}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId: parseInt(selectedProjectToLink),
            organizationId: user?.organizationId,
          }),
        }
      );

      if (response.ok) {
        toast({
          title: "Success",
          description: "Sales order linked to project",
        });
        fetchSalesOrders();
        setLinkProjectDialogOpen(false);
        setSelectedProjectToLink("");
      } else {
        throw new Error("Failed to link project");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to link sales order to project",
        variant: "destructive",
      });
    } finally {
      setLinking(false);
    }
  };

  const handleUnlinkProject = async (orderId: number) => {
    try {
      const response = await fetch(
        `/api/finance/sales-orders/${orderId}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId: null,
            organizationId: user?.organizationId,
          }),
        }
      );

      if (response.ok) {
        toast({
          title: "Success",
          description: "Sales order unlinked from project",
        });
        fetchSalesOrders();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to unlink sales order",
        variant: "destructive",
      });
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

  // Get unique partners
  const uniquePartners = Array.from(new Set(salesOrders.map(o => o.partnerName).filter(Boolean)));

  // Filter logic
  const filteredOrders = salesOrders.filter((order) => {
    const matchesSearch =
      order.soNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.partnerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.totalAmount.toString().includes(searchTerm) ||
      order.status.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    const matchesProject =
      projectFilter === "all" ||
      (projectFilter === "unlinked" && !order.project) ||
      order.project?.id.toString() === projectFilter;
    const matchesPartner =
      partnerFilter === "all" ||
      order.partnerName === partnerFilter;

    return matchesSearch && matchesStatus && matchesProject && matchesPartner;
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
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Sales Orders</CardTitle>
              <CardDescription>
                Manage all sales orders across your organization
              </CardDescription>
            </div>
            <Button asChild>
              <a href="/createsalesorder">
                <Plus className="h-4 w-4 mr-2" />
                New Sales Order
              </a>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by number, partner, amount, or status..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
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
              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  <SelectItem value="unlinked">Unlinked</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={partnerFilter} onValueChange={setPartnerFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by partner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Partners</SelectItem>
                  {uniquePartners.map((partner) => (
                    <SelectItem key={partner} value={partner as string}>
                      {partner}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={groupBy} onValueChange={setGroupBy}>
                <SelectTrigger>
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
          </div>

          {/* Table */}
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : Object.keys(groups).length === 0 || filteredOrders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No sales orders found. Create your first one!
            </div>
          ) : (
            Object.entries(groups).map(([groupName, orders]) => (
              <div key={groupName} className="mb-6 last:mb-0">
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
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order) => (
                        <TableRow
                          key={order.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => {
                            setSelectedOrder(order);
                            setDetailsDialogOpen(true);
                          }}
                        >
                          <TableCell className="font-medium">{order.soNumber}</TableCell>
                          <TableCell>{order.partnerName || "-"}</TableCell>
                          <TableCell>
                            {order.project ? (
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-blue-600">
                                  {order.project.name}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUnlinkProject(order.id);
                                  }}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedOrder(order);
                                  setLinkProjectDialogOpen(true);
                                }}
                              >
                                <LinkIcon className="h-3 w-3 mr-1" />
                                Link
                              </Button>
                            )}
                          </TableCell>
                          <TableCell>
                            {format(new Date(order.orderDate), "MMM dd, yyyy")}
                          </TableCell>
                          <TableCell>{formatCurrency(Number(order.totalAmount))}</TableCell>
                          <TableCell>
                            <Badge className={getStatusBadge(order.status)}>
                              {order.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.location.href = `/editsalesorder?id=${order.id}`;
                              }}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
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
      </Card>

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sales Order Details</DialogTitle>
            <DialogDescription>
              {selectedOrder?.soNumber}
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Partner</Label>
                  <p className="font-medium">{selectedOrder.partnerName || "-"}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Status</Label>
                  <div className="mt-1">
                    <Badge className={getStatusBadge(selectedOrder.status)}>
                      {selectedOrder.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Date</Label>
                  <p className="font-medium">
                    {format(new Date(selectedOrder.orderDate), "MMM dd, yyyy")}
                  </p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Amount</Label>
                  <p className="font-medium">
                    {formatCurrency(Number(selectedOrder.totalAmount))}
                  </p>
                </div>
                <div className="col-span-2">
                  <Label className="text-sm text-muted-foreground">Project</Label>
                  <p className="font-medium">
                    {selectedOrder.project?.name || "Not linked to any project"}
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDetailsDialogOpen(false)}
            >
              Close
            </Button>
            <Button
              onClick={() => {
                window.location.href = `/editsalesorder?id=${selectedOrder?.id}`;
              }}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Link to Project Dialog */}
      <Dialog open={linkProjectDialogOpen} onOpenChange={setLinkProjectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link Sales Order to Project</DialogTitle>
            <DialogDescription>
              Select a project to link {selectedOrder?.soNumber} to
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="project">Project</Label>
              <Select
                value={selectedProjectToLink}
                onValueChange={setSelectedProjectToLink}
              >
                <SelectTrigger id="project">
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setLinkProjectDialogOpen(false);
                setSelectedProjectToLink("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleLinkToProject}
              disabled={!selectedProjectToLink || linking}
            >
              {linking ? "Linking..." : "Link to Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
