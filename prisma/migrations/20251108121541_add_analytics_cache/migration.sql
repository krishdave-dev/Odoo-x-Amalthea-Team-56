-- CreateTable
CREATE TABLE "analytics_cache" (
    "cache_id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "cache_type" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "computed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "compute_duration_ms" INTEGER,

    CONSTRAINT "analytics_cache_pkey" PRIMARY KEY ("cache_id")
);

-- CreateIndex
CREATE INDEX "ix_analytics_lookup" ON "analytics_cache"("organization_id", "cache_type", "expires_at");

-- CreateIndex
CREATE INDEX "ix_analytics_expires" ON "analytics_cache"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "ux_analytics_org_type" ON "analytics_cache"("organization_id", "cache_type");
