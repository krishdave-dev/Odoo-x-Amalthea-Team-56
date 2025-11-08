# OneFlow - Project Management System

A comprehensive project management and ERP system built with Next.js, TypeScript, Prisma, and PostgreSQL.

## Features

- 🏢 **Multi-tenant Architecture** - Organization-based isolation
- 📊 **Project Management** - Complete project lifecycle management
- ✅ **Task Management** - Task boards with priorities and assignments
- ⏱️ **Time Tracking** - Timesheet management with cost calculation
- 💰 **Financial Management** - Sales orders, purchase orders, invoices, and bills
- 💳 **Expense Tracking** - Employee expense management
- 📎 **Attachments** - File management for all entities
- 📝 **Audit Logging** - Complete audit trail for all operations
- 🔒 **Optimistic Locking** - Prevent concurrent update conflicts
- 🗑️ **Soft Deletes** - Safe deletion with recovery options

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Styling:** Tailwind CSS
- **UI Components:** Lucide Icons, Class Variance Authority

## Getting Started

### Prerequisites

- Node.js 20+ installed
- PostgreSQL 14+ installed and running
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Odoo-x-Amalthea-Team-56
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and configure your database connection:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/oneflow_db?schema=public"
   ```

4. **Set up the database**
   
   Create the database:
   ```bash
   createdb oneflow_db
   ```
   
   Or using psql:
   ```sql
   CREATE DATABASE oneflow_db;
   ```

5. **Enable UUID extension in PostgreSQL**
   ```sql
   \c oneflow_db
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   ```

6. **Push the schema to database**
   ```bash
   npm run db:push
   ```
   
   Or use migrations (recommended for production):
   ```bash
   npm run db:migrate
   ```

7. **Generate Prisma Client**
   ```bash
   npm run db:generate
   ```

8. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema

The database schema includes the following main entities:

- **Organizations** - Multi-tenant isolation
- **Users** - User authentication and profiles
- **Projects** - Project management with cached aggregates
- **Tasks** - Task management with priorities and assignments
- **Timesheets** - Time tracking with cost calculation
- **Sales Orders** - Customer orders
- **Purchase Orders** - Vendor orders
- **Customer Invoices** - Billing management
- **Vendor Bills** - Payable management
- **Expenses** - Employee expense tracking
- **Attachments** - File management
- **Events** - Audit log

### Key Design Features

- **UUID Primary Keys** - For distributed systems and security
- **Optimistic Locking** - Version-based concurrency control
- **Soft Deletes** - Preserve historical data
- **Audit Trail** - Event logging for all critical operations
- **Cached Aggregates** - Pre-computed values for performance
- **JSONB Metadata** - Flexible extensibility
- **Multi-tenant Ready** - Organization-scoped data

## API Routes

### Projects

- `GET /api/projects` - List projects
- `POST /api/projects` - Create project
- `GET /api/projects/[id]` - Get project details
- `PUT /api/projects/[id]` - Update project (with optimistic locking)
- `DELETE /api/projects/[id]` - Soft delete project

### Query Parameters

- `organizationId` - Required for all endpoints
- `page` - Pagination page number (default: 1)
- `pageSize` - Items per page (default: 20)
- `status` - Filter by status
- `search` - Search in name, code, description

## Project Structure

```
src/
├── app/
│   ├── api/          # API routes
│   ├── layout.tsx    # Root layout
│   └── page.tsx      # Home page
├── lib/
│   ├── prisma.ts     # Prisma client
│   ├── db-helpers.ts # Database utilities
│   ├── auth.ts       # Authentication utilities
│   └── validation.ts # Validation helpers
├── services/
│   └── project.service.ts  # Business logic
└── types/
    ├── common.ts     # Common types
    └── enums.ts      # Enumerations
```

## Database Scripts

- `npm run db:generate` - Generate Prisma Client
- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Run migrations
- `npm run db:studio` - Open Prisma Studio (database GUI)
- `npm run db:seed` - Seed database with sample data

## Development Guidelines

### Optimistic Locking

All updates to projects and tasks use optimistic locking via the `version` field:

```typescript
const result = await projectService.updateProject(
  projectId,
  organizationId,
  currentVersion, // Must match current DB version
  updateData
);

if (!result.success) {
  // Handle version conflict
}
```

### Soft Deletes

Entities are soft-deleted by setting `deletedAt`:

```typescript
await projectService.deleteProject(projectId, organizationId);
```

### Audit Logging

Critical operations are logged to the `events` table:

```typescript
await createAuditEvent(
  organizationId,
  'project',
  projectId,
  'project.created',
  { name: 'New Project' }
);
```

## Security Considerations

- Row-Level Security (RLS) can be implemented in PostgreSQL
- Organization ID validation on all API routes
- Email uniqueness scoped per organization
- Soft deletes preserve audit trail
- Version-based optimistic locking prevents race conditions

## Performance Optimization

- **Indexes** - Strategic indexes on common query patterns
- **Cached Aggregates** - Pre-computed values in project table
- **Pagination** - All list endpoints support pagination
- **Materialized Views** - For heavy analytics (can be added)
- **Partitioning** - Timesheets and events can be partitioned by date

## Future Enhancements

- [ ] Implement authentication (NextAuth.js)
- [ ] Add task service and API routes
- [ ] Implement timesheet tracking
- [ ] Add financial management features
- [ ] Create dashboard with analytics
- [ ] Implement real-time updates (WebSockets)
- [ ] Add email notifications
- [ ] Implement file upload for attachments
- [ ] Add reporting and export features
- [ ] Implement Row-Level Security (RLS)

## License

MIT

## Contributing

Contributions are welcome! Please read the contributing guidelines before getting started.
