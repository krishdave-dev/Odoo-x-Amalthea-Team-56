# 🗄️ Expense Module Migration Guide

## Overview

This guide walks you through setting up the Expense Management module for your OneFlow project management system.

---

## Prerequisites

- PostgreSQL database running
- Node.js and npm installed
- Prisma CLI installed (`npm install -g prisma`)
- Database connection string configured in `.env`

---

## Step 1: Review Schema Changes

The following changes have been made to `prisma/schema.prisma`:

### Expense Model Updates

```prisma
model Expense {
  // Added fields for complete workflow tracking:
  rejectionReason String?   @map("rejection_reason")
  approvedBy      Int?      @map("approved_by")
  updatedAt       DateTime  @default(now()) @updatedAt @map("updated_at") @db.Timestamptz(6)
  submittedAt     DateTime? @map("submitted_at") @db.Timestamptz(6)
  paidAt          DateTime? @map("paid_at") @db.Timestamptz(6)
  deletedAt       DateTime? @map("deleted_at") @db.Timestamptz(6)
  
  // Changed default status from 'submitted' to 'draft'
  status          String    @default("draft")
  
  // Added indexes for performance
  @@index([organizationId, status], map: "ix_expenses_org_status")
  @@index([userId, status], map: "ix_expenses_user_status")
}
```

---

## Step 2: Generate Prisma Client

First, regenerate the Prisma client with the updated schema:

```bash
npx prisma generate
```

This will update the TypeScript types to include the new Expense fields.

---

## Step 3: Create Database Migration

Create a new migration for the expense module updates:

```bash
npx prisma migrate dev --name add_expense_workflow_fields
```

This will:
1. Create a new migration file in `prisma/migrations/`
2. Apply the migration to your database
3. Regenerate the Prisma client

### Expected Migration SQL

```sql
-- AlterTable
ALTER TABLE "expenses" 
  ADD COLUMN "rejection_reason" VARCHAR,
  ADD COLUMN "approved_by" INTEGER,
  ADD COLUMN "updated_at" TIMESTAMPTZ(6) DEFAULT NOW(),
  ADD COLUMN "submitted_at" TIMESTAMPTZ(6),
  ADD COLUMN "paid_at" TIMESTAMPTZ(6),
  ADD COLUMN "deleted_at" TIMESTAMPTZ(6),
  ALTER COLUMN "status" SET DEFAULT 'draft';

-- CreateIndex
CREATE INDEX "ix_expenses_org_status" ON "expenses"("organization_id", "status");

-- CreateIndex
CREATE INDEX "ix_expenses_user_status" ON "expenses"("user_id", "status");
```

---

## Step 4: Verify Migration

Check that the migration was applied successfully:

```bash
npx prisma migrate status
```

You should see:
```
Database schema is up to date!
```

---

## Step 5: Seed Test Data (Optional)

Create test data for expenses:

```bash
npx prisma db seed
```

Or manually create test expenses via the API (see PowerShell examples below).

---

## Step 6: Test API Endpoints

### Using PowerShell

```powershell
# 1. Create organization
$orgBody = @{
    name = "Test Company"
    currency = "USD"
} | ConvertTo-Json

$org = Invoke-RestMethod -Uri "http://localhost:3000/api/organizations" `
  -Method POST -Body $orgBody -ContentType "application/json"

$orgId = $org.data.id

# 2. Create employee user
$empBody = @{
    organizationId = $orgId
    email = "employee@test.com"
    name = "John Employee"
    role = "employee"
} | ConvertTo-Json

$emp = Invoke-RestMethod -Uri "http://localhost:3000/api/users" `
  -Method POST -Body $empBody -ContentType "application/json"

$empId = $emp.data.id

# 3. Create expense
$expBody = @{
    organizationId = $orgId
    userId = $empId
    amount = 1250.00
    billable = $true
    note = "Client dinner meeting"
} | ConvertTo-Json

$expense = Invoke-RestMethod -Uri "http://localhost:3000/api/expenses" `
  -Method POST -Body $expBody -ContentType "application/json"

Write-Host "✅ Created expense with ID: $($expense.data.id)"
Write-Host "Status: $($expense.data.status)"

# 4. Submit expense
$expenseId = $expense.data.id
$submitted = Invoke-RestMethod `
  -Uri "http://localhost:3000/api/expenses/$expenseId/submit?organizationId=$orgId&userId=$empId" `
  -Method POST

Write-Host "✅ Submitted expense, new status: $($submitted.data.status)"

# 5. Create manager
$mgrBody = @{
    organizationId = $orgId
    email = "manager@test.com"
    name = "Jane Manager"
    role = "manager"
} | ConvertTo-Json

$mgr = Invoke-RestMethod -Uri "http://localhost:3000/api/users" `
  -Method POST -Body $mgrBody -ContentType "application/json"

$mgrId = $mgr.data.id

# 6. Approve expense
$approved = Invoke-RestMethod `
  -Uri "http://localhost:3000/api/expenses/$expenseId/approve?organizationId=$orgId&userId=$mgrId" `
  -Method POST

Write-Host "✅ Approved expense, new status: $($approved.data.status)"

# 7. Create finance user
$finBody = @{
    organizationId = $orgId
    email = "finance@test.com"
    name = "Bob Finance"
    role = "finance"
} | ConvertTo-Json

$fin = Invoke-RestMethod -Uri "http://localhost:3000/api/users" `
  -Method POST -Body $finBody -ContentType "application/json"

$finId = $fin.data.id

# 8. Mark as paid
$paid = Invoke-RestMethod `
  -Uri "http://localhost:3000/api/expenses/$expenseId/pay?organizationId=$orgId&userId=$finId" `
  -Method POST

Write-Host "✅ Marked as paid, new status: $($paid.data.status)"

# 9. Get expense history
$final = Invoke-RestMethod `
  -Uri "http://localhost:3000/api/expenses/$expenseId?organizationId=$orgId" `
  -Method GET

Write-Host "`n📊 Final Expense Details:"
$final.data | Format-List
```

---

## Step 7: Verify Audit Logs

Check that events are being logged:

```sql
SELECT 
  event_type,
  payload,
  created_at
FROM events
WHERE entity_type = 'expense'
ORDER BY created_at DESC
LIMIT 10;
```

You should see events like:
- `EXPENSE_CREATED`
- `EXPENSE_SUBMITTED`
- `EXPENSE_APPROVED`
- `EXPENSE_PAID`

---

## Step 8: Run Development Server

Start your Next.js development server:

```bash
npm run dev
```

The API will be available at:
```
http://localhost:3000/api/expenses
```

---

## Rollback (If Needed)

If you need to rollback the migration:

```bash
# Reset database (WARNING: Destroys all data)
npx prisma migrate reset

# Or revert to a specific migration
npx prisma migrate resolve --rolled-back <migration-name>
```

---

## Production Deployment

For production environments:

```bash
# 1. Set DATABASE_URL in production environment
export DATABASE_URL="postgresql://user:password@host:5432/dbname"

# 2. Run migrations (no --name flag in production)
npx prisma migrate deploy

# 3. Generate Prisma client
npx prisma generate

# 4. Start application
npm run build
npm start
```

---

## Common Issues

### Issue: "Table already exists"

**Solution**: Drop the table and re-run migration:
```sql
DROP TABLE IF EXISTS expenses CASCADE;
```

### Issue: "Column already exists"

**Solution**: Check migration status and resolve conflicts:
```bash
npx prisma migrate status
npx prisma migrate resolve --applied <migration-name>
```

### Issue: Prisma types not updating

**Solution**: Regenerate client:
```bash
rm -rf node_modules/.prisma
npx prisma generate
```

---

## File Structure

After migration, your structure should be:

```
src/
├── app/api/expenses/
│   ├── route.ts                    # GET, POST
│   └── [id]/
│       ├── route.ts                # GET, DELETE
│       ├── submit/route.ts         # POST
│       ├── approve/route.ts        # POST
│       ├── reject/route.ts         # POST
│       └── pay/route.ts            # POST
├── lib/
│   └── validation.ts               # Updated with expense schemas
├── services/
│   ├── expense.service.ts          # Business logic
│   └── event.service.ts            # Audit logging
prisma/
├── schema.prisma                   # Updated schema
└── migrations/
    └── XXXXXX_add_expense_workflow_fields/
        └── migration.sql
```

---

## Next Steps

1. ✅ Run migration
2. ✅ Test all API endpoints
3. ✅ Verify audit logging
4. ✅ Review RBAC permissions
5. 📝 Integrate with frontend
6. 📝 Add receipt upload flow
7. 📝 Configure email notifications
8. 📝 Set up budget limits

---

## Support

- Documentation: `EXPENSE_API_DOCUMENTATION.md`
- Issues: GitHub Issues
- Slack: #backend-support

---

**Migration Created**: November 8, 2025  
**Schema Version**: 2.0.0  
**Estimated Migration Time**: < 1 minute
