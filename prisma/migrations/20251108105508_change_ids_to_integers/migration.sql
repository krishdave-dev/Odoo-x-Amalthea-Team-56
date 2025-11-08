-- CreateTable
CREATE TABLE "organizations" (
    "organization_id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'INR',
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("organization_id")
);

-- CreateTable
CREATE TABLE "users" (
    "user_id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password_hash" TEXT,
    "role" TEXT NOT NULL,
    "hourly_rate" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "projects" (
    "project_id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "project_manager_id" INTEGER,
    "start_date" DATE,
    "end_date" DATE,
    "status" TEXT NOT NULL DEFAULT 'planned',
    "budget" DECIMAL(14,2),
    "cached_hours_logged" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "cached_cost" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "cached_revenue" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "cached_profit" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "progress_pct" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "projects_pkey" PRIMARY KEY ("project_id")
);

-- CreateTable
CREATE TABLE "project_members" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "role_in_project" TEXT,
    "assigned_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_lists" (
    "list_id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "ordinal" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "task_lists_pkey" PRIMARY KEY ("list_id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "task_id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "list_id" INTEGER,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "assignee_id" INTEGER,
    "priority" SMALLINT NOT NULL DEFAULT 2,
    "status" TEXT NOT NULL DEFAULT 'new',
    "estimate_hours" DECIMAL(8,2),
    "hours_logged" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "due_date" DATE,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "version" INTEGER NOT NULL DEFAULT 1,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("task_id")
);

-- CreateTable
CREATE TABLE "timesheets" (
    "timesheet_id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "task_id" INTEGER,
    "user_id" INTEGER NOT NULL,
    "start" TIMESTAMPTZ(6) NOT NULL,
    "end" TIMESTAMPTZ(6) NOT NULL,
    "duration_hours" DECIMAL(8,2) NOT NULL,
    "billable" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "cost_at_time" DECIMAL(14,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "timesheets_pkey" PRIMARY KEY ("timesheet_id")
);

-- CreateTable
CREATE TABLE "sales_orders" (
    "so_id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "project_id" INTEGER,
    "so_number" TEXT NOT NULL,
    "partner_name" TEXT,
    "order_date" DATE NOT NULL DEFAULT current_date,
    "total_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sales_orders_pkey" PRIMARY KEY ("so_id")
);

-- CreateTable
CREATE TABLE "purchase_orders" (
    "po_id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "project_id" INTEGER,
    "po_number" TEXT NOT NULL,
    "vendor_name" TEXT,
    "order_date" DATE NOT NULL DEFAULT current_date,
    "total_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("po_id")
);

-- CreateTable
CREATE TABLE "customer_invoices" (
    "invoice_id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "project_id" INTEGER,
    "so_id" INTEGER,
    "invoice_number" TEXT NOT NULL,
    "invoice_date" DATE NOT NULL DEFAULT current_date,
    "amount" DECIMAL(14,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_invoices_pkey" PRIMARY KEY ("invoice_id")
);

-- CreateTable
CREATE TABLE "vendor_bills" (
    "bill_id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "project_id" INTEGER,
    "po_id" INTEGER,
    "vendor_name" TEXT,
    "bill_date" DATE NOT NULL DEFAULT current_date,
    "amount" DECIMAL(14,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vendor_bills_pkey" PRIMARY KEY ("bill_id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "expense_id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "project_id" INTEGER,
    "user_id" INTEGER,
    "amount" DECIMAL(12,2) NOT NULL,
    "billable" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'submitted',
    "receipt_url" TEXT,
    "note" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approved_at" TIMESTAMPTZ(6),

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("expense_id")
);

-- CreateTable
CREATE TABLE "attachments" (
    "attachment_id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "owner_type" TEXT NOT NULL,
    "owner_id" INTEGER NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_name" TEXT,
    "uploaded_by" INTEGER,
    "uploaded_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("attachment_id")
);

-- CreateTable
CREATE TABLE "task_comments" (
    "comment_id" SERIAL NOT NULL,
    "task_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_comments_pkey" PRIMARY KEY ("comment_id")
);

-- CreateTable
CREATE TABLE "events" (
    "event_id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" INTEGER,
    "event_type" TEXT NOT NULL,
    "payload" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "events_pkey" PRIMARY KEY ("event_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ux_users_org_email" ON "users"("organization_id", "email");

-- CreateIndex
CREATE INDEX "ix_projects_org_status" ON "projects"("organization_id", "status");

-- CreateIndex
CREATE INDEX "ix_projects_org_pm" ON "projects"("organization_id", "project_manager_id");

-- CreateIndex
CREATE UNIQUE INDEX "project_members_project_id_user_id_key" ON "project_members"("project_id", "user_id");

-- CreateIndex
CREATE INDEX "ix_tasks_proj_status" ON "tasks"("project_id", "status");

-- CreateIndex
CREATE INDEX "ix_tasks_assignee" ON "tasks"("assignee_id");

-- CreateIndex
CREATE INDEX "ix_timesheets_project_date" ON "timesheets"("project_id", "created_at");

-- CreateIndex
CREATE INDEX "ix_timesheets_user_date" ON "timesheets"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "ix_timesheets_task" ON "timesheets"("task_id");

-- CreateIndex
CREATE INDEX "ix_timesheets_status" ON "timesheets"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ux_so_org_number" ON "sales_orders"("organization_id", "so_number");

-- CreateIndex
CREATE UNIQUE INDEX "ux_po_org_number" ON "purchase_orders"("organization_id", "po_number");

-- CreateIndex
CREATE UNIQUE INDEX "ux_invoice_org_number" ON "customer_invoices"("organization_id", "invoice_number");

-- CreateIndex
CREATE INDEX "ix_expenses_proj_status" ON "expenses"("project_id", "status");

-- CreateIndex
CREATE INDEX "ix_attachments_owner" ON "attachments"("owner_type", "owner_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("organization_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("organization_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_project_manager_id_fkey" FOREIGN KEY ("project_manager_id") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("project_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_lists" ADD CONSTRAINT "task_lists_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("project_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("project_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_list_id_fkey" FOREIGN KEY ("list_id") REFERENCES "task_lists"("list_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timesheets" ADD CONSTRAINT "timesheets_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("project_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timesheets" ADD CONSTRAINT "timesheets_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("task_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timesheets" ADD CONSTRAINT "timesheets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("organization_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("project_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("organization_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("project_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_invoices" ADD CONSTRAINT "customer_invoices_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("organization_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_invoices" ADD CONSTRAINT "customer_invoices_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("project_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_invoices" ADD CONSTRAINT "customer_invoices_so_id_fkey" FOREIGN KEY ("so_id") REFERENCES "sales_orders"("so_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_bills" ADD CONSTRAINT "vendor_bills_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("organization_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_bills" ADD CONSTRAINT "vendor_bills_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("project_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_bills" ADD CONSTRAINT "vendor_bills_po_id_fkey" FOREIGN KEY ("po_id") REFERENCES "purchase_orders"("po_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("organization_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("project_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("organization_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_comments" ADD CONSTRAINT "task_comments_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("task_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_comments" ADD CONSTRAINT "task_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;
