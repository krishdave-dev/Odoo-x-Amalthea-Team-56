# Quick Start Guide

Get up and running with OneFlow in 5 minutes!

## Prerequisites

- ✅ Node.js 20+ installed
- ✅ PostgreSQL 14+ installed and running
- ✅ Git installed

## 1. Clone & Install (1 minute)

```bash
# Navigate to project
cd Odoo-x-Amalthea-Team-56

# Install dependencies
npm install
```

## 2. Database Setup (2 minutes)

```bash
# Create database
createdb oneflow_db

# Or using psql
psql -U postgres -c "CREATE DATABASE oneflow_db;"

# Enable UUID extension
psql -U postgres -d oneflow_db -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"
```

## 3. Configure Environment (30 seconds)

```bash
# Copy environment file
cp .env.example .env

# Edit .env and update DATABASE_URL
# DATABASE_URL="postgresql://postgres:password@localhost:5432/oneflow_db?schema=public"
```

## 4. Initialize Database (1 minute)

```bash
# Push schema to database
npm run db:push

# Generate Prisma Client
npm run db:generate

# Seed with sample data (optional)
npm run db:seed
```

## 5. Start Development (30 seconds)

```bash
# Start Next.js dev server
npm run dev
```

Visit http://localhost:3000 🎉

## Sample Data (if seeded)

### Organizations
- **Name:** Demo Organization
- **Currency:** INR
- **Timezone:** Asia/Kolkata

### Users
| Email | Password | Role |
|-------|----------|------|
| admin@demo.com | admin123 | Admin |
| manager@demo.com | manager123 | Manager |
| dev@demo.com | dev123 | Member |

### Projects
1. **Website Redesign** (WEB-001) - In Progress
2. **Mobile App Development** (MOB-001) - Planned

## Quick API Test

Get your organization ID from the seed output, then:

```bash
# List projects (replace <org-id> with actual ID)
curl "http://localhost:3000/api/projects?organizationId=<org-id>"
```

## View Database

```bash
# Open Prisma Studio
npm run db:studio
```

Visit http://localhost:5555

## Common Commands

```bash
# Development
npm run dev              # Start dev server
npm run build           # Build for production
npm run start           # Start production server

# Database
npm run db:generate     # Generate Prisma Client
npm run db:push         # Push schema to DB
npm run db:migrate      # Create migration
npm run db:studio       # Open Prisma Studio
npm run db:seed         # Seed sample data

# Code Quality
npm run lint            # Run ESLint
```

## Troubleshooting

### "Cannot find module '@prisma/client'"
```bash
npm run db:generate
```

### "Connection refused"
Check PostgreSQL is running:
```bash
# On macOS/Linux
pg_ctl status

# On Windows
net start postgresql-x64-14
```

### "Database does not exist"
```bash
createdb oneflow_db
```

### "uuid-ossp extension not found"
```bash
psql -U postgres -d oneflow_db -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"
```

## Next Steps

1. **Read Documentation:**
   - `PROJECT_README.md` - Full documentation
   - `DATABASE_SETUP.md` - Detailed DB setup
   - `IMPLEMENTATION_SUMMARY.md` - Architecture overview

2. **Explore the Code:**
   - `prisma/schema.prisma` - Database schema
   - `src/services/project.service.ts` - Business logic
   - `src/app/api/projects/` - API routes

3. **Build Features:**
   - Add task management UI
   - Implement authentication
   - Create dashboards
   - Add timesheet tracking

## Project Structure

```
src/
├── app/
│   ├── api/              # API routes
│   │   └── projects/     # Project endpoints
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Home page
├── lib/
│   ├── prisma.ts         # Database client
│   ├── db-helpers.ts     # DB utilities
│   ├── auth.ts           # Password hashing
│   └── validation.ts     # Input validation
├── services/
│   └── project.service.ts # Business logic
└── types/
    ├── common.ts         # Common types
    └── enums.ts          # Enumerations

prisma/
├── schema.prisma         # Database schema
└── seed.ts              # Sample data
```

## Support

- **Issues:** Check GitHub issues
- **Documentation:** See README files
- **Database:** Use Prisma Studio for inspection

## Success! 🎉

You now have a fully functional project management system with:
- ✅ Multi-tenant database
- ✅ Project management API
- ✅ Sample data
- ✅ Type-safe database access
- ✅ Audit logging
- ✅ Optimistic locking

Ready to build amazing features!
