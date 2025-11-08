-- AlterTable
ALTER TABLE "attachments" ADD COLUMN     "last_verified_at" TIMESTAMPTZ(6),
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active';

-- AlterTable
ALTER TABLE "expenses" ADD COLUMN     "approved_by" INTEGER,
ADD COLUMN     "deleted_at" TIMESTAMPTZ(6),
ADD COLUMN     "paid_at" TIMESTAMPTZ(6),
ADD COLUMN     "rejection_reason" TEXT,
ADD COLUMN     "submitted_at" TIMESTAMPTZ(6),
ADD COLUMN     "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "status" SET DEFAULT 'draft';

-- CreateTable
CREATE TABLE "outbox_events" (
    "event_id" SERIAL NOT NULL,
    "event_type" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" INTEGER NOT NULL,
    "payload" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processed_at" TIMESTAMPTZ(6),
    "error" TEXT,
    "retry_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "outbox_events_pkey" PRIMARY KEY ("event_id")
);

-- CreateIndex
CREATE INDEX "ix_outbox_unprocessed" ON "outbox_events"("processed", "created_at");

-- CreateIndex
CREATE INDEX "ix_outbox_event_type" ON "outbox_events"("event_type");

-- CreateIndex
CREATE INDEX "ix_attachments_status" ON "attachments"("status");

-- CreateIndex
CREATE INDEX "ix_attachments_org" ON "attachments"("organization_id");

-- CreateIndex
CREATE INDEX "ix_expenses_org_status" ON "expenses"("organization_id", "status");

-- CreateIndex
CREATE INDEX "ix_expenses_user_status" ON "expenses"("user_id", "status");
