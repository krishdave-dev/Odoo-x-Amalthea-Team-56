"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ShoppingCart, FileText, Receipt, CreditCard, Wallet, Search, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type Project = {
  id: number
  name: string
}

type SalesOrder = {
  id: number
  soNumber: string
  partnerName: string | null
  orderDate: string
  totalAmount: number
  status: string
  project: Project | null
  projectId: number | null
}

type PurchaseOrder = {
  id: number
  poNumber: string
  vendorName: string | null
  orderDate: string
  totalAmount: number
  status: string
  project: Project | null
  projectId: number | null
}

type CustomerInvoice = {
  id: number
  invoiceNumber: string
  invoiceDate: string
  amount: number
  status: string
  project: Project | null
  projectId: number | null
  salesOrder: { id: number; soNumber: string } | null
}

type VendorBill = {
  id: number
  vendorName: string | null
  billDate: string
  amount: number
  status: string
  project: Project | null
  projectId: number | null
  purchaseOrder: { id: number; poNumber: string } | null
}

type Expense = {
  id: number
  amount: number
  billable: boolean
  status: string
  note: string | null
  createdAt: string
  project: Project | null
  projectId: number | null
  user: { id: number; name: string | null; email: string } | null
}

export function FinanceManagement() {
  const { user } = useAuth()
  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState("sales-orders")
  const [projects, setProjects] = useState<Project[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [projectFilter, setProjectFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [groupBy, setGroupBy] = useState("none")
  
  // Data states
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([])
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [customerInvoices, setCustomerInvoices] = useState<CustomerInvoice[]>([])
  const [vendorBills, setVendorBills] = useState<VendorBill[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  
  const [loading, setLoading] = useState(false)

  // Reset filters when changing tabs
  useEffect(() => {
    setSearchTerm("")
    setProjectFilter("all")
    setStatusFilter("all")
    setGroupBy("none")
  }, [activeTab])

  useEffect(() => {
    if (user?.organizationId) {
      fetchProjects()
      fetchData()
    }
  }, [user?.organizationId, activeTab])

  const fetchProjects = async () => {
    try {
      const res = await fetch(`/api/projects?organizationId=${user?.organizationId}&pageSize=100`)
      const data = await res.json()
      if (data.success) {
        setProjects(data.data?.projects || [])
      }
    } catch (error) {
      console.error("Failed to fetch projects:", error)
    }
  }

  const fetchData = async () => {
    if (!user?.organizationId) return
    setLoading(true)
    try {
      let endpoint = ""
      switch (activeTab) {
        case "sales-orders":
          endpoint = `/api/finance/sales-orders?organizationId=${user.organizationId}&pageSize=100`
          break
        case "purchase-orders":
          endpoint = `/api/finance/purchase-orders?organizationId=${user.organizationId}`
          break
        case "customer-invoices":
          endpoint = `/api/finance/customer-invoices?organizationId=${user.organizationId}`
          break
        case "vendor-bills":
          endpoint = `/api/finance/vendor-bills?organizationId=${user.organizationId}`
          break
        case "expenses":
          endpoint = `/api/finance/expenses?organizationId=${user.organizationId}`
          break
      }

      const res = await fetch(endpoint)
      const data = await res.json()
      
      if (data.success) {
        switch (activeTab) {
          case "sales-orders":
            // Sales orders returns paginated: { success: true, data: [...], meta: {...} }
            setSalesOrders(data.data || [])
            break
          case "purchase-orders":
            // Purchase orders returns paginated: { success: true, data: [...], meta: {...} }
            setPurchaseOrders(data.data || [])
            break
          case "customer-invoices":
            // Invoices returns paginated: { success: true, data: [...], meta: {...} }
            setCustomerInvoices(data.data || [])
            break
          case "vendor-bills":
            // Bills returns paginated: { success: true, data: [...], meta: {...} }
            setVendorBills(data.data || [])
            break
          case "expenses":
            // Expenses returns { success: true, data: { expenses: [...] } }
            setExpenses(data.data?.expenses || [])
            break
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const linkToProject = async (docType: string, docId: number, projectId: number | null) => {
    try {
      const endpoints: Record<string, string> = {
        "sales-orders": `/api/finance/sales-orders/${docId}`,
        "purchase-orders": `/api/finance/purchase-orders/${docId}`,
        "customer-invoices": `/api/finance/customer-invoices/${docId}`,
        "vendor-bills": `/api/finance/vendor-bills/${docId}`,
        "expenses": `/api/finance/expenses/${docId}`,
      }

      const res = await fetch(endpoints[docType], {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, organizationId: user?.organizationId }),
      })

      const data = await res.json()
      if (data.success) {
        toast({
          title: "Success",
          description: projectId ? "Linked to project" : "Unlinked from project",
        })
        fetchData()
      } else {
        toast({
          title: "Error",
          description: "Failed to update",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred",
        variant: "destructive",
      })
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount)
  }

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      draft: "bg-gray-500",
      confirmed: "bg-blue-500",
      invoiced: "bg-green-500",
      cancelled: "bg-red-500",
      sent: "bg-blue-500",
      paid: "bg-green-500",
      received: "bg-blue-500",
      billed: "bg-green-500",
      submitted: "bg-yellow-500",
      approved: "bg-green-500",
      rejected: "bg-red-500",
    }
    return (
      <Badge className={`${colors[status] || "bg-gray-500"} text-white`}>
        {status}
      </Badge>
    )
  }

  // Filter logic - works on client-side for better UX
  const filterItems = (items: any[]) => {
    return items.filter((item) => {
      // Search filter - searches across all fields
      const matchesSearch = searchTerm === "" || 
        Object.values(item).some(val => 
          val && val.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      
      // Project filter
      const matchesProject = projectFilter === "all" || 
        (projectFilter === "unlinked" && !item.projectId) ||
        (item.projectId && item.projectId.toString() === projectFilter)
      
      // Status filter - only apply to expenses tab
      const matchesStatus = activeTab !== "expenses" || 
        statusFilter === "all" || 
        item.status === statusFilter
      
      return matchesSearch && matchesProject && matchesStatus
    })
  }

  // Grouping logic
  const groupItems = (items: any[]) => {
    if (groupBy === "none") {
      return { "All Items": items }
    }

    const grouped: Record<string, any[]> = {}
    
    items.forEach(item => {
      let key = "Ungrouped"
      
      if (groupBy === "project") {
        key = item.project ? item.project.name : "Unlinked"
      } else if (groupBy === "status") {
        key = item.status ? item.status.charAt(0).toUpperCase() + item.status.slice(1) : "No Status"
      } else if (groupBy === "date") {
        const dateField = activeTab === "expenses" ? "createdAt" : 
                         activeTab === "vendor-bills" ? "billDate" :
                         activeTab === "customer-invoices" ? "invoiceDate" : "orderDate"
        const date = new Date(item[dateField])
        key = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
      }
      
      if (!grouped[key]) {
        grouped[key] = []
      }
      grouped[key].push(item)
    })
    
    return grouped
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="sales-orders">
            <ShoppingCart className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Sales Orders</span>
          </TabsTrigger>
          <TabsTrigger value="purchase-orders">
            <FileText className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Purchase Orders</span>
          </TabsTrigger>
          <TabsTrigger value="customer-invoices">
            <Receipt className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Invoices</span>
          </TabsTrigger>
          <TabsTrigger value="vendor-bills">
            <CreditCard className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Bills</span>
          </TabsTrigger>
          <TabsTrigger value="expenses">
            <Wallet className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Expenses</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sales-orders">
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex gap-4 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <Select value={projectFilter} onValueChange={setProjectFilter}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filter by project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Projects</SelectItem>
                    <SelectItem value="unlinked">Unlinked</SelectItem>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={groupBy} onValueChange={setGroupBy}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Group by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Grouping</SelectItem>
                    <SelectItem value="project">By Project</SelectItem>
                    <SelectItem value="date">By Date</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : (
                <>
                  {Object.entries(groupItems(filterItems(salesOrders))).map(([groupName, groupedItems]) => (
                    <div key={groupName} className="space-y-2">
                      {groupBy !== "none" && (
                        <h3 className="text-lg font-semibold mt-4 mb-2">{groupName} ({groupedItems.length})</h3>
                      )}
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>SO Number</TableHead>
                            <TableHead>Partner</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Project</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {groupedItems.map((so: SalesOrder) => (
                            <TableRow key={so.id}>
                              <TableCell className="font-medium">{so.soNumber}</TableCell>
                              <TableCell>{so.partnerName || "-"}</TableCell>
                              <TableCell>{new Date(so.orderDate).toLocaleDateString()}</TableCell>
                              <TableCell>{formatCurrency(so.totalAmount)}</TableCell>
                              <TableCell>
                                {so.project ? (
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm">{so.project.name}</span>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => linkToProject("sales-orders", so.id, null)}
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ) : (
                                  <Select onValueChange={(v) => linkToProject("sales-orders", so.id, parseInt(v))}>
                                    <SelectTrigger className="w-[180px] h-8">
                                      <SelectValue placeholder="Link to project" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {projects.map((p) => (
                                        <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ))}
                </>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="purchase-orders">
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex gap-4 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-8" />
                  </div>
                </div>
                <Select value={projectFilter} onValueChange={setProjectFilter}>
                  <SelectTrigger className="w-[200px]"><SelectValue placeholder="Filter by project" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Projects</SelectItem>
                    <SelectItem value="unlinked">Unlinked</SelectItem>
                    {projects.map((p) => (<SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>))}
                  </SelectContent>
                </Select>
                <Select value={groupBy} onValueChange={setGroupBy}>
                  <SelectTrigger className="w-[150px]"><SelectValue placeholder="Group by" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Grouping</SelectItem>
                    <SelectItem value="project">By Project</SelectItem>
                    <SelectItem value="date">By Date</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {loading ? (<div className="text-center py-8">Loading...</div>) : (
                <>
                  {Object.entries(groupItems(filterItems(purchaseOrders))).map(([groupName, groupedItems]) => (
                    <div key={groupName} className="space-y-2">
                      {groupBy !== "none" && (
                        <h3 className="text-lg font-semibold mt-4 mb-2">{groupName} ({groupedItems.length})</h3>
                      )}
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>PO Number</TableHead>
                            <TableHead>Vendor</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Project</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {groupedItems.map((po: PurchaseOrder) => (
                            <TableRow key={po.id}>
                              <TableCell className="font-medium">{po.poNumber}</TableCell>
                              <TableCell>{po.vendorName || "-"}</TableCell>
                              <TableCell>{new Date(po.orderDate).toLocaleDateString()}</TableCell>
                              <TableCell>{formatCurrency(po.totalAmount)}</TableCell>
                              <TableCell>
                                {po.project ? (
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm">{po.project.name}</span>
                                    <Button size="sm" variant="ghost" onClick={() => linkToProject("purchase-orders", po.id, null)}>
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ) : (
                                  <Select onValueChange={(v) => linkToProject("purchase-orders", po.id, parseInt(v))}>
                                    <SelectTrigger className="w-[180px] h-8"><SelectValue placeholder="Link to project" /></SelectTrigger>
                                    <SelectContent>
                                      {projects.map((p) => (<SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>))}
                                    </SelectContent>
                                  </Select>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ))}
                </>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="customer-invoices">
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex gap-4 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-8" />
                  </div>
                </div>
                <Select value={projectFilter} onValueChange={setProjectFilter}>
                  <SelectTrigger className="w-[200px]"><SelectValue placeholder="Filter by project" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Projects</SelectItem>
                    <SelectItem value="unlinked">Unlinked</SelectItem>
                    {projects.map((p) => (<SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>))}
                  </SelectContent>
                </Select>
                <Select value={groupBy} onValueChange={setGroupBy}>
                  <SelectTrigger className="w-[150px]"><SelectValue placeholder="Group by" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Grouping</SelectItem>
                    <SelectItem value="project">By Project</SelectItem>
                    <SelectItem value="date">By Date</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {loading ? (<div className="text-center py-8">Loading...</div>) : (
                <>
                  {Object.entries(groupItems(filterItems(customerInvoices))).map(([groupName, groupedItems]) => (
                    <div key={groupName} className="space-y-2">
                      {groupBy !== "none" && (
                        <h3 className="text-lg font-semibold mt-4 mb-2">{groupName} ({groupedItems.length})</h3>
                      )}
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Invoice #</TableHead>
                            <TableHead>Sales Order</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Project</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {groupedItems.map((inv: CustomerInvoice) => (
                            <TableRow key={inv.id}>
                              <TableCell className="font-medium">{inv.invoiceNumber}</TableCell>
                              <TableCell>{inv.salesOrder?.soNumber || "-"}</TableCell>
                              <TableCell>{new Date(inv.invoiceDate).toLocaleDateString()}</TableCell>
                              <TableCell>{formatCurrency(inv.amount)}</TableCell>
                              <TableCell>
                                {inv.project ? (
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm">{inv.project.name}</span>
                                    <Button size="sm" variant="ghost" onClick={() => linkToProject("customer-invoices", inv.id, null)}>
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ) : (
                                  <Select onValueChange={(v) => linkToProject("customer-invoices", inv.id, parseInt(v))}>
                                    <SelectTrigger className="w-[180px] h-8"><SelectValue placeholder="Link to project" /></SelectTrigger>
                                    <SelectContent>
                                      {projects.map((p) => (<SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>))}
                                    </SelectContent>
                                  </Select>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ))}
                </>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="vendor-bills">
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex gap-4 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-8" />
                  </div>
                </div>
                <Select value={projectFilter} onValueChange={setProjectFilter}>
                  <SelectTrigger className="w-[200px]"><SelectValue placeholder="Filter by project" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Projects</SelectItem>
                    <SelectItem value="unlinked">Unlinked</SelectItem>
                    {projects.map((p) => (<SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>))}
                  </SelectContent>
                </Select>
                <Select value={projectFilter} onValueChange={setProjectFilter}>
                  <SelectTrigger className="w-[200px]"><SelectValue placeholder="Filter by project" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Projects</SelectItem>
                    <SelectItem value="unlinked">Unlinked</SelectItem>
                    {projects.map((p) => (<SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>))}
                  </SelectContent>
                </Select>
                <Select value={groupBy} onValueChange={setGroupBy}>
                  <SelectTrigger className="w-[150px]"><SelectValue placeholder="Group by" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Grouping</SelectItem>
                    <SelectItem value="project">By Project</SelectItem>
                    <SelectItem value="date">By Date</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {loading ? (<div className="text-center py-8">Loading...</div>) : (
                <>
                  {Object.entries(groupItems(filterItems(vendorBills))).map(([groupName, groupedItems]) => (
                    <div key={groupName} className="space-y-2">
                      {groupBy !== "none" && (
                        <h3 className="text-lg font-semibold mt-4 mb-2">{groupName} ({groupedItems.length})</h3>
                      )}
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Vendor</TableHead>
                            <TableHead>Purchase Order</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Project</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {groupedItems.map((bill: VendorBill) => (
                            <TableRow key={bill.id}>
                              <TableCell className="font-medium">{bill.vendorName || "-"}</TableCell>
                              <TableCell>{bill.purchaseOrder?.poNumber || "-"}</TableCell>
                              <TableCell>{new Date(bill.billDate).toLocaleDateString()}</TableCell>
                              <TableCell>{formatCurrency(bill.amount)}</TableCell>
                              <TableCell>
                                {bill.project ? (
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm">{bill.project.name}</span>
                                    <Button size="sm" variant="ghost" onClick={() => linkToProject("vendor-bills", bill.id, null)}>
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ) : (
                                  <Select onValueChange={(v) => linkToProject("vendor-bills", bill.id, parseInt(v))}>
                                    <SelectTrigger className="w-[180px] h-8"><SelectValue placeholder="Link to project" /></SelectTrigger>
                                    <SelectContent>
                                      {projects.map((p) => (<SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>))}
                                    </SelectContent>
                                  </Select>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ))}
                </>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="expenses">
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex gap-4 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-8" />
                  </div>
                </div>
                <Select value={projectFilter} onValueChange={setProjectFilter}>
                  <SelectTrigger className="w-[200px]"><SelectValue placeholder="Filter by project" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Projects</SelectItem>
                    <SelectItem value="unlinked">Unlinked</SelectItem>
                    {projects.map((p) => (<SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={groupBy} onValueChange={setGroupBy}>
                  <SelectTrigger className="w-[150px]"><SelectValue placeholder="Group by" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Grouping</SelectItem>
                    <SelectItem value="project">By Project</SelectItem>
                    <SelectItem value="status">By Status</SelectItem>
                    <SelectItem value="date">By Date</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {loading ? (<div className="text-center py-8">Loading...</div>) : (
                <>
                  {Object.entries(groupItems(filterItems(expenses))).map(([groupName, groupedItems]) => (
                    <div key={groupName} className="space-y-2">
                      {groupBy !== "none" && (
                        <h3 className="text-lg font-semibold mt-4 mb-2">{groupName} ({groupedItems.length})</h3>
                      )}
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Note</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Billable</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Project</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {groupedItems.map((exp: Expense) => (
                            <TableRow key={exp.id}>
                              <TableCell className="font-medium">{exp.user?.name || exp.user?.email || "-"}</TableCell>
                              <TableCell>{exp.note || "-"}</TableCell>
                              <TableCell>{new Date(exp.createdAt).toLocaleDateString()}</TableCell>
                              <TableCell>{formatCurrency(exp.amount)}</TableCell>
                              <TableCell>{exp.billable ? "Yes" : "No"}</TableCell>
                              <TableCell>{getStatusBadge(exp.status)}</TableCell>
                              <TableCell>
                                {exp.project ? (
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm">{exp.project.name}</span>
                                    <Button size="sm" variant="ghost" onClick={() => linkToProject("expenses", exp.id, null)}>
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ) : (
                                  <Select onValueChange={(v) => linkToProject("expenses", exp.id, parseInt(v))}>
                                    <SelectTrigger className="w-[180px] h-8"><SelectValue placeholder="Link to project" /></SelectTrigger>
                                    <SelectContent>
                                      {projects.map((p) => (<SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>))}
                                    </SelectContent>
                                  </Select>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ))}
                </>
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
