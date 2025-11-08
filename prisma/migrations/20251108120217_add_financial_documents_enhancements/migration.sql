-- AlterTable
ALTER TABLE "customer_invoices" ADD COLUMN     "deleted_at" TIMESTAMPTZ(6),
ADD COLUMN     "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "purchase_orders" ADD COLUMN     "deleted_at" TIMESTAMPTZ(6),
ADD COLUMN     "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "sales_orders" ADD COLUMN     "deleted_at" TIMESTAMPTZ(6),
ADD COLUMN     "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "vendor_bills" ADD COLUMN     "deleted_at" TIMESTAMPTZ(6),
ADD COLUMN     "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "ix_invoice_org_status" ON "customer_invoices"("organization_id", "status");

-- CreateIndex
CREATE INDEX "ix_invoice_so" ON "customer_invoices"("so_id");

-- CreateIndex
CREATE INDEX "ix_po_org_status" ON "purchase_orders"("organization_id", "status");

-- CreateIndex
CREATE INDEX "ix_po_project" ON "purchase_orders"("project_id");

-- CreateIndex
CREATE INDEX "ix_so_org_status" ON "sales_orders"("organization_id", "status");

-- CreateIndex
CREATE INDEX "ix_so_project" ON "sales_orders"("project_id");

-- CreateIndex
CREATE INDEX "ix_bill_org_status" ON "vendor_bills"("organization_id", "status");

-- CreateIndex
CREATE INDEX "ix_bill_po" ON "vendor_bills"("po_id");
