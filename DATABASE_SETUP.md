# Database Setup Guide

This guide will help you set up the PostgreSQL database for the OneFlow project management system.

## Prerequisites

- PostgreSQL 14 or higher installed
- psql command-line tool or pgAdmin

## Step 1: Create Database

### Using psql:

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE oneflow_db;

# Connect to the new database
\c oneflow_db

# Enable UUID extension (required)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

# Exit psql
\q
```

### Using pgAdmin:

1. Right-click on "Databases" → Create → Database
2. Name: `oneflow_db`
3. Save
4. Open Query Tool and run:
   ```sql
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   ```

## Step 2: Configure Environment

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and update the DATABASE_URL:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/oneflow_db?schema=public"
   ```
   
   Replace:
   - `username` with your PostgreSQL username (default: `postgres`)
   - `password` with your PostgreSQL password
   - `localhost:5432` with your server address if different

## Step 3: Push Schema to Database

Run one of the following commands:

### Option A: Push Schema (for development)
```bash
npm run db:push
```

This command will:
- Push the Prisma schema to your database
- Create all tables, indexes, and constraints
- **Warning:** This will reset your database if it already has data

### Option B: Create Migration (recommended for production)
```bash
npm run db:migrate
```

This command will:
- Create a migration file
- Apply the migration to your database
- Track schema changes

## Step 4: Generate Prisma Client

```bash
npm run db:generate
```

This generates the TypeScript types and Prisma Client code.

## Step 5: Seed Database (Optional)

To populate the database with sample data:

```bash
npm run db:seed
```

This will create:
- 1 demo organization
- 3 users (admin, manager, developer)
- 2 projects
- Several tasks and timesheets
- Sample invoices and expenses

### Sample Login Credentials:
- **Admin:** admin@demo.com / admin123
- **Manager:** manager@demo.com / manager123
- **Developer:** dev@demo.com / dev123

## Step 6: Verify Setup

Start Prisma Studio to view your database:

```bash
npm run db:studio
```

This will open a web interface at http://localhost:5555 where you can:
- View all tables
- Browse data
- Edit records
- Run queries

## Troubleshooting

### Error: "uuid-ossp extension not found"

Run this in your database:
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### Error: "Connection refused"

Check:
1. PostgreSQL is running: `pg_ctl status`
2. Connection string is correct in `.env`
3. PostgreSQL is accepting connections on port 5432

### Error: "Database does not exist"

Create the database first:
```bash
createdb oneflow_db
```

Or using psql:
```sql
CREATE DATABASE oneflow_db;
```

### Error: "Permission denied"

Make sure your PostgreSQL user has the necessary permissions:
```sql
GRANT ALL PRIVILEGES ON DATABASE oneflow_db TO your_username;
```

## Database Structure Overview

### Core Tables
- `organizations` - Multi-tenant isolation
- `users` - User authentication and profiles
- `projects` - Project management
- `tasks` - Task tracking
- `timesheets` - Time logging

### Financial Tables
- `sales_orders` - Customer orders
- `purchase_orders` - Vendor orders
- `customer_invoices` - Invoices sent to customers
- `vendor_bills` - Bills from vendors
- `expenses` - Employee expenses

### Supporting Tables
- `project_members` - Project team assignments
- `task_lists` - Task grouping/milestones
- `task_comments` - Task discussions
- `attachments` - File metadata
- `events` - Audit log

## Performance Optimization

The schema includes several optimizations:

1. **Indexes** for common queries
2. **Cached aggregates** in projects table
3. **JSONB** for flexible metadata
4. **UUID** primary keys for distributed systems

## Security Features

1. **Soft deletes** - `deletedAt` field preserves data
2. **Optimistic locking** - `version` field prevents conflicts
3. **Audit trail** - Events table logs all changes
4. **Multi-tenant** - Organization-scoped data

## Next Steps

After setting up the database:

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Test the API endpoints:
   ```
   GET http://localhost:3000/api/projects?organizationId=<org-id>
   ```

3. Build your application features using the generated Prisma Client

## Maintenance

### Create a new migration
```bash
npm run db:migrate
```

### Reset database (⚠️ WARNING: Deletes all data)
```bash
npx prisma migrate reset
```

### Update schema
1. Edit `prisma/schema.prisma`
2. Run `npm run db:push` or `npm run db:migrate`
3. Run `npm run db:generate`

## Backup and Restore

### Backup
```bash
pg_dump -U postgres oneflow_db > backup.sql
```

### Restore
```bash
psql -U postgres oneflow_db < backup.sql
```
