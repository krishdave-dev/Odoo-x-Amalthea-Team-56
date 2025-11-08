-- AlterTable: Enhance attachments table for Cloudinary + PostgreSQL hybrid storage
-- Add fields for file metadata, Cloudinary integration, and backup storage

-- Add new columns
ALTER TABLE "attachments" 
  ADD COLUMN IF NOT EXISTS "mime_type" TEXT,
  ADD COLUMN IF NOT EXISTS "file_size" INTEGER,
  ADD COLUMN IF NOT EXISTS "cloud_public_id" TEXT,
  ADD COLUMN IF NOT EXISTS "backup_data" BYTEA,
  ADD COLUMN IF NOT EXISTS "backup_type" TEXT,
  ADD COLUMN IF NOT EXISTS "backup_available" BOOLEAN NOT NULL DEFAULT false;

-- Make file_url nullable (for pending uploads)
ALTER TABLE "attachments" 
  ALTER COLUMN "file_url" DROP NOT NULL;

-- Create index on cloud_public_id for faster lookups during verification
CREATE INDEX IF NOT EXISTS "ix_attachments_cloud_id" ON "attachments"("cloud_public_id");

-- Add comments for documentation
COMMENT ON COLUMN "attachments"."mime_type" IS 'MIME type of the file (e.g., image/png, application/pdf)';
COMMENT ON COLUMN "attachments"."file_size" IS 'File size in bytes';
COMMENT ON COLUMN "attachments"."cloud_public_id" IS 'Cloudinary public_id for file management and deletion';
COMMENT ON COLUMN "attachments"."backup_data" IS 'Compressed preview/thumbnail stored in PostgreSQL for fallback';
COMMENT ON COLUMN "attachments"."backup_type" IS 'Type of backup: thumbnail, compressed, or snippet';
COMMENT ON COLUMN "attachments"."backup_available" IS 'Flag indicating if backup data is available for fallback';
