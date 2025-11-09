# Database Seeding Guide

## Available Seed Scripts

### 1. Full Seed (seed.ts)
Creates everything from scratch including users and organizations.

```bash
npm run db:seed
```

**⚠️ Warning**: This will delete ALL existing data including users!

### 2. Data-Only Seed (seed-data-only.ts)
Preserves existing users but creates extensive project and finance data for specific users.

```bash
npm run db:seed-data
```

**Current Configuration**: Creates data for User IDs: **13, 14, 15, 16**

## What Gets Created with Data-Only Seed

For each organization containing the specified users:

### Projects (6 per organization)
- Website Redesign Project
- Mobile App Development
- E-commerce Platform
- CRM System Integration
- Data Analytics Dashboard (completed)
- API Modernization

### Per Project:
- **Tasks**: 15-30 tasks with various statuses (new, in_progress, in_review, blocked, completed)
- **Task Lists**: 5 lists (Planning & Design, Development, Testing & QA, Deployment, Maintenance)
- **Timesheets**: Multiple timesheets for tasks with logged hours
- **Sales Orders**: 1-3 per project
- **Customer Invoices**: Linked to sales orders
- **Purchase Orders**: 1-3 per project
- **Vendor Bills**: Linked to purchase orders
- **Expenses**: 5-20 per project with various statuses
- **Notifications**: For assigned tasks
- **Audit Events**: For tracking changes

### Total Data Generated (approximate):
- **~6 projects**
- **~120 tasks** (15-30 per project)
- **~240 timesheets**
- **~12 sales orders**
- **~8 customer invoices**
- **~12 purchase orders**
- **~8 vendor bills**
- **~60 expenses**
- Plus notifications and audit events

## Customizing User IDs

To create data for different users, edit `prisma/seed-data-only.ts`:

```typescript
// Line 6: Change these user IDs
const specificUserIds = [13, 14, 15, 16]
```

Replace with your actual user IDs.

## Important Notes

1. **User Requirements**:
   - Users must exist in the database
   - At least one user should have `admin` or `manager` role
   - Users must be active (`isActive: true`)

2. **Data Cleanup**:
   - Only cleans data for organizations containing the specified users
   - Other organizations and users remain untouched
   - Preserves user accounts and organization settings

3. **Realistic Data**:
   - Random but realistic project statuses and progress
   - Proper date distributions (past, present, future)
   - Weighted status distributions (more "in_progress" than "new")
   - Billable/non-billable expenses
   - Various approval statuses

## Verification

After running the seed, verify in Prisma Studio:

```bash
npm run db:studio
```

Check:
- Projects are assigned to your users
- Tasks are distributed across team members
- Timesheets have proper hours logged
- Financial documents are linked correctly
- Expenses have realistic statuses

## Troubleshooting

### "No users found"
- Check if users with IDs 13, 14, 15, 16 exist
- Run query: `SELECT id, email, role FROM users WHERE id IN (13, 14, 15, 16);`

### "No managers found"
- At least one user needs `admin` or `manager` role
- Update user role: `UPDATE users SET role = 'manager' WHERE id = 13;`

### Foreign Key Errors
- Ensure Prisma schema is up to date
- Run: `npm run db:generate`
- Run migrations: `npm run db:migrate`
