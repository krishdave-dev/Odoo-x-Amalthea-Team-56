/**
 * FinanceAnalyticsService - Financial Documents Analytics
 * 
 * Computes:
 * - Sales Orders (SO) value and status breakdown
 * - Purchase Orders (PO) value and status breakdown
 * - Invoices (paid vs unpaid receivables)
 * - Bills (paid vs unpaid payables)
 * - Cashflow trends
 * - Working capital metrics
 */

import { prisma } from '@/lib/prisma'

export interface SalesOrderMetrics {
  totalValue: number
  count: number
  draft: number
  confirmed: number
  invoiced: number
  cancelled: number
  avgOrderValue: number
}

export interface PurchaseOrderMetrics {
  totalValue: number
  count: number
  draft: number
  confirmed: number
  billed: number
  cancelled: number
  avgOrderValue: number
}

export interface InvoiceMetrics {
  totalValue: number
  count: number
  paid: number
  unpaid: number
  sent: number
  draft: number
  outstandingReceivables: number
}

export interface BillMetrics {
  totalValue: number
  count: number
  paid: number
  unpaid: number
  received: number
  draft: number
  outstandingPayables: number
}

export interface CashflowTrend {
  month: string
  revenue: number // Paid invoices
  cost: number // Paid bills + expenses
  netCashflow: number
  receivables: number // Unpaid invoices
  payables: number // Unpaid bills
}

export interface FinanceAnalyticsResponse {
  salesOrders: SalesOrderMetrics
  purchaseOrders: PurchaseOrderMetrics
  invoices: InvoiceMetrics
  bills: BillMetrics
  cashflowTrend: CashflowTrend[]
  workingCapital: {
    currentReceivables: number
    currentPayables: number
    netWorkingCapital: number
  }
}

export class FinanceAnalyticsService {
  /**
   * Get comprehensive finance analytics
   */
  static async getAnalytics(organizationId: number): Promise<FinanceAnalyticsResponse> {
    // Fetch all financial documents
    const [salesOrders, purchaseOrders, invoices, bills] = await Promise.all([
      prisma.salesOrder.findMany({
        where: { organizationId, deletedAt: null },
        select: { id: true, totalAmount: true, status: true, createdAt: true },
      }),
      prisma.purchaseOrder.findMany({
        where: { organizationId, deletedAt: null },
        select: { id: true, totalAmount: true, status: true, createdAt: true },
      }),
      prisma.customerInvoice.findMany({
        where: { organizationId, deletedAt: null },
        select: { id: true, amount: true, status: true, createdAt: true, invoiceDate: true },
      }),
      prisma.vendorBill.findMany({
        where: { organizationId, deletedAt: null },
        select: { id: true, amount: true, status: true, createdAt: true, billDate: true },
      }),
    ])

    // Sales Order Metrics
    const soTotalValue = salesOrders.reduce((sum: number, so: any) => sum + Number(so.totalAmount), 0)
    const soMetrics: SalesOrderMetrics = {
      totalValue: Math.round(soTotalValue * 100) / 100,
      count: salesOrders.length,
      draft: salesOrders.filter((so: any) => so.status === 'draft').length,
      confirmed: salesOrders.filter((so: any) => so.status === 'confirmed').length,
      invoiced: salesOrders.filter((so: any) => so.status === 'invoiced').length,
      cancelled: salesOrders.filter((so: any) => so.status === 'cancelled').length,
      avgOrderValue: salesOrders.length > 0
        ? Math.round((soTotalValue / salesOrders.length) * 100) / 100
        : 0,
    }

    // Purchase Order Metrics
    const poTotalValue = purchaseOrders.reduce((sum: number, po: any) => sum + Number(po.totalAmount), 0)
    const poMetrics: PurchaseOrderMetrics = {
      totalValue: Math.round(poTotalValue * 100) / 100,
      count: purchaseOrders.length,
      draft: purchaseOrders.filter((po: any) => po.status === 'draft').length,
      confirmed: purchaseOrders.filter((po: any) => po.status === 'confirmed').length,
      billed: purchaseOrders.filter((po: any) => po.status === 'billed').length,
      cancelled: purchaseOrders.filter((po: any) => po.status === 'cancelled').length,
      avgOrderValue: purchaseOrders.length > 0
        ? Math.round((poTotalValue / purchaseOrders.length) * 100) / 100
        : 0,
    }

    // Invoice Metrics
    const invoiceTotalValue = invoices.reduce((sum: number, inv: any) => sum + Number(inv.amount), 0)
    const paidInvoiceValue = invoices
      .filter((inv: any) => inv.status === 'paid')
      .reduce((sum: number, inv: any) => sum + Number(inv.amount), 0)
    const unpaidInvoiceValue = invoices
      .filter((inv: any) => inv.status === 'sent' || inv.status === 'draft')
      .reduce((sum: number, inv: any) => sum + Number(inv.amount), 0)

    const invoiceMetrics: InvoiceMetrics = {
      totalValue: Math.round(invoiceTotalValue * 100) / 100,
      count: invoices.length,
      paid: Math.round(paidInvoiceValue * 100) / 100,
      unpaid: Math.round(unpaidInvoiceValue * 100) / 100,
      sent: invoices.filter((inv: any) => inv.status === 'sent').length,
      draft: invoices.filter((inv: any) => inv.status === 'draft').length,
      outstandingReceivables: Math.round(unpaidInvoiceValue * 100) / 100,
    }

    // Bill Metrics
    const billTotalValue = bills.reduce((sum: number, bill: any) => sum + Number(bill.amount), 0)
    const paidBillValue = bills
      .filter((bill: any) => bill.status === 'paid')
      .reduce((sum: number, bill: any) => sum + Number(bill.amount), 0)
    const unpaidBillValue = bills
      .filter((bill: any) => bill.status === 'received' || bill.status === 'draft')
      .reduce((sum: number, bill: any) => sum + Number(bill.amount), 0)

    const billMetrics: BillMetrics = {
      totalValue: Math.round(billTotalValue * 100) / 100,
      count: bills.length,
      paid: Math.round(paidBillValue * 100) / 100,
      unpaid: Math.round(unpaidBillValue * 100) / 100,
      received: bills.filter((bill: any) => bill.status === 'received').length,
      draft: bills.filter((bill: any) => bill.status === 'draft').length,
      outstandingPayables: Math.round(unpaidBillValue * 100) / 100,
    }

    // Cashflow Trend (last 6 months)
    const cashflowTrend = await this.getCashflowTrend(organizationId)

    // Working Capital
    const workingCapital = {
      currentReceivables: Math.round(unpaidInvoiceValue * 100) / 100,
      currentPayables: Math.round(unpaidBillValue * 100) / 100,
      netWorkingCapital: Math.round((unpaidInvoiceValue - unpaidBillValue) * 100) / 100,
    }

    return {
      salesOrders: soMetrics,
      purchaseOrders: poMetrics,
      invoices: invoiceMetrics,
      bills: billMetrics,
      cashflowTrend,
      workingCapital,
    }
  }

  /**
   * Get monthly cashflow trend
   */
  private static async getCashflowTrend(organizationId: number): Promise<CashflowTrend[]> {
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const [invoices, bills, expenses] = await Promise.all([
      prisma.customerInvoice.findMany({
        where: {
          organizationId,
          deletedAt: null,
          invoiceDate: { gte: sixMonthsAgo },
        },
        select: {
          amount: true,
          status: true,
          invoiceDate: true,
        },
      }),
      prisma.vendorBill.findMany({
        where: {
          organizationId,
          deletedAt: null,
          billDate: { gte: sixMonthsAgo },
        },
        select: {
          amount: true,
          status: true,
          billDate: true,
        },
      }),
      prisma.expense.findMany({
        where: {
          organizationId,
          deletedAt: null,
          paidAt: { gte: sixMonthsAgo },
          status: 'paid',
        },
        select: {
          amount: true,
          paidAt: true,
        },
      }),
    ])

    // Group by month
    const monthlyData = new Map<string, {
      month: string
      revenue: number
      cost: number
      netCashflow: number
      receivables: number
      payables: number
    }>()

    // Process invoices
    invoices.forEach((inv: any) => {
      const month = new Date(inv.invoiceDate).toISOString().substring(0, 7)
      const amount = Number(inv.amount)

      if (!monthlyData.has(month)) {
        monthlyData.set(month, {
          month,
          revenue: 0,
          cost: 0,
          netCashflow: 0,
          receivables: 0,
          payables: 0,
        })
      }

      const data = monthlyData.get(month)!
      if (inv.status === 'paid') {
        data.revenue += amount
      } else {
        data.receivables += amount
      }
    })

    // Process bills
    bills.forEach((bill: any) => {
      const month = new Date(bill.billDate).toISOString().substring(0, 7)
      const amount = Number(bill.amount)

      if (!monthlyData.has(month)) {
        monthlyData.set(month, {
          month,
          revenue: 0,
          cost: 0,
          netCashflow: 0,
          receivables: 0,
          payables: 0,
        })
      }

      const data = monthlyData.get(month)!
      if (bill.status === 'paid') {
        data.cost += amount
      } else {
        data.payables += amount
      }
    })

    // Process expenses
    expenses.forEach((exp: any) => {
      const month = new Date(exp.paidAt).toISOString().substring(0, 7)
      const amount = Number(exp.amount)

      if (!monthlyData.has(month)) {
        monthlyData.set(month, {
          month,
          revenue: 0,
          cost: 0,
          netCashflow: 0,
          receivables: 0,
          payables: 0,
        })
      }

      const data = monthlyData.get(month)!
      data.cost += amount
    })

    // Calculate net cashflow
    const trend = Array.from(monthlyData.values())
      .map((data: any) => ({
        ...data,
        netCashflow: data.revenue - data.cost,
        revenue: Math.round(data.revenue * 100) / 100,
        cost: Math.round(data.cost * 100) / 100,
        receivables: Math.round(data.receivables * 100) / 100,
        payables: Math.round(data.payables * 100) / 100,
      }))
      .map((data: any) => ({
        ...data,
        netCashflow: Math.round(data.netCashflow * 100) / 100,
      }))
      .sort((a: any, b: any) => a.month.localeCompare(b.month))

    return trend
  }

  /**
   * Get revenue vs cost comparison
   */
  static async getRevenueVsCost(organizationId: number): Promise<{
    totalRevenue: number
    totalCost: number
    grossProfit: number
    profitMargin: number
  }> {
    const [paidInvoices, paidBills, paidExpenses] = await Promise.all([
      prisma.customerInvoice.aggregate({
        where: {
          organizationId,
          deletedAt: null,
          status: 'paid',
        },
        _sum: { amount: true },
      }),
      prisma.vendorBill.aggregate({
        where: {
          organizationId,
          deletedAt: null,
          status: 'paid',
        },
        _sum: { amount: true },
      }),
      prisma.expense.aggregate({
        where: {
          organizationId,
          deletedAt: null,
          status: 'paid',
        },
        _sum: { amount: true },
      }),
    ])

    const totalRevenue = Number(paidInvoices._sum.amount || 0)
    const totalCost = Number(paidBills._sum.amount || 0) + Number(paidExpenses._sum.amount || 0)
    const grossProfit = totalRevenue - totalCost
    const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0

    return {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
      grossProfit: Math.round(grossProfit * 100) / 100,
      profitMargin: Math.round(profitMargin * 100) / 100,
    }
  }
}

export const financeAnalyticsService = FinanceAnalyticsService
