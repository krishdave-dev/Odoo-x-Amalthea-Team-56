# OneFlow Backend - Quick Start Guide

## 🚀 Setup (5 Minutes)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Create `.env` file:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/oneflow"
NODE_ENV="development"
```

### 3. Setup Database
```bash
npm run db:generate   # Generate Prisma client
npm run db:push       # Create database tables
```

### 4. Start Server
```bash
npm run dev
```

API available at: **http://localhost:3000/api**

---

## 📋 Quick Test Commands

### Create Organization
```bash
curl -X POST http://localhost:3000/api/organizations \
  -H "Content-Type: application/json" \
  -d '{"name":"Acme Corp","currency":"USD","timezone":"America/New_York"}'
```

### Create User
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "organizationId":"<org-uuid>",
    "email":"john@example.com",
    "name":"John Doe",
    "role":"member",
    "hourlyRate":75
  }'
```

### Create Project
```bash
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "organizationId":"<org-uuid>",
    "name":"Website Redesign",
    "status":"planned",
    "budget":50000
  }'
```

### List Projects with Filters
```bash
curl "http://localhost:3000/api/projects?organizationId=<uuid>&page=1&pageSize=10&status=planned"
```

---

## 🗂️ Project Structure

```
src/
├── app/api/              # API Routes (Next.js App Router)
│   ├── organizations/    # Organization endpoints
│   ├── users/           # User endpoints
│   ├── projects/        # Project + nested (members, task-lists, kanban)
│   ├── task-lists/      # Task list endpoints + nested tasks
│   └── tasks/           # Task endpoints
│
├── services/            # Business Logic Layer
│   ├── organization.service.ts
│   ├── user.service.ts
│   ├── project.service.ts
│   ├── taskList.service.ts
│   └── task.service.ts
│
├── lib/                 # Shared Utilities
│   ├── prisma.ts       # Prisma client
│   ├── response.ts     # Response helpers
│   ├── error.ts        # Error handling
│   ├── validation.ts   # Zod schemas
│   └── db-helpers.ts   # DB utilities
│
└── types/               # TypeScript Types
    ├── common.ts       # Common types
    └── enums.ts        # Enums & constants
```

---

## 🎯 Key Endpoints

### Organizations
- `GET    /api/organizations` - List all (paginated)
- `POST   /api/organizations` - Create new
- `GET    /api/organizations/:id` - Get one
- `PUT    /api/organizations/:id` - Update
- `DELETE /api/organizations/:id` - Delete
- `GET    /api/organizations/:id/stats` - Statistics

### Users
- `GET    /api/users` - List all (paginated, filtered)
- `POST   /api/users` - Create new
- `GET    /api/users/:id` - Get one
- `PUT    /api/users/:id` - Update
- `DELETE /api/users/:id` - Soft delete
- `GET    /api/users/:id/stats` - User statistics

### Projects
- `GET    /api/projects` - List all (paginated, filtered)
- `POST   /api/projects` - Create new
- `GET    /api/projects/:id` - Get one
- `PUT    /api/projects/:id` - Update (with version)
- `DELETE /api/projects/:id` - Soft delete

### Project Members (Nested)
- `GET    /api/projects/:projectId/members` - List members
- `POST   /api/projects/:projectId/members` - Add member
- `GET    /api/projects/:projectId/members/:userId` - Get member
- `PATCH  /api/projects/:projectId/members/:userId` - Update role
- `DELETE /api/projects/:projectId/members/:userId` - Remove member

### Task Lists (Nested)
- `GET    /api/projects/:projectId/task-lists` - List all
- `POST   /api/projects/:projectId/task-lists` - Create new
- `PUT    /api/projects/:projectId/task-lists/reorder` - Reorder
- `GET    /api/task-lists/:listId` - Get one
- `PUT    /api/task-lists/:listId` - Update
- `DELETE /api/task-lists/:listId` - Delete (cascades to tasks)

### Tasks
- `GET    /api/tasks` - List all (paginated, filtered)
- `POST   /api/tasks` - Create new
- `GET    /api/tasks/:taskId` - Get one
- `PUT    /api/tasks/:taskId` - Update (with version & state validation)
- `DELETE /api/tasks/:taskId` - Soft delete
- `GET    /api/task-lists/:listId/tasks` - List tasks in list
- `POST   /api/task-lists/:listId/tasks` - Create in list
- `GET    /api/projects/:projectId/tasks/kanban` - Kanban view

---

## 💡 Common Patterns

### Pagination
All list endpoints support:
```
?page=1&pageSize=25
```

### Search
```
?q=search+term
```

### Filtering
```
?status=in_progress&priority=3&assigneeId=<uuid>
```

### Response Format
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "pageSize": 25,
    "total": 100,
    "totalPages": 4
  }
}
```

---

## 🔐 Important Features

### Optimistic Locking (Projects & Tasks)
Always send `version` when updating:
```json
{
  "name": "Updated name",
  "version": 1
}
```

Returns `409 Conflict` if version mismatch.

### Task State Machine
Valid transitions:
- `new` → `in_progress`, `blocked`
- `in_progress` → `in_review`, `blocked`, `new`
- `in_review` → `completed`, `in_progress`, `blocked`
- `blocked` → `new`, `in_progress`
- `completed` → `in_progress`

Invalid transition returns `400 Bad Request`.

### Soft Deletes
Deleted items have `deletedAt` timestamp and are excluded from queries.

### Audit Trail
All major operations logged to `events` table:
- `organization.created`, `organization.updated`, etc.
- `task.created`, `task.status_changed`, `task.deleted`, etc.

---

## 🛠️ Development Workflow

### Adding a New Endpoint

1. **Create Zod Schema** (`src/lib/validation.ts`)
```typescript
export const createThingSchema = z.object({
  name: z.string().min(1),
  value: z.number(),
})
```

2. **Add Service Method** (`src/services/thing.service.ts`)
```typescript
async createThing(input: CreateThingInput) {
  return prisma.thing.create({ data: input })
}
```

3. **Create Route Handler** (`src/app/api/things/route.ts`)
```typescript
export async function POST(req: Request) {
  try {
    const body = await parseBody(req, createThingSchema)
    const thing = await thingService.createThing(body)
    return createdResponse(thing)
  } catch (error) {
    return handleError(error)
  }
}
```

### Running Database Migrations
```bash
# Create migration
npm run db:migrate

# Apply to database
npm run db:push

# Open Prisma Studio
npm run db:studio
```

---

## 📊 Database Schema

### Core Models
- **Organization** - Multi-tenant root
- **User** - People in organizations
- **Project** - Projects with manager and budget
- **ProjectMember** - M:N relation User ↔ Project
- **TaskList** - Grouping of tasks (sprint, milestone)
- **Task** - Work items with state machine

### Key Relationships
```
Organization (1) ─→ (N) Users
Organization (1) ─→ (N) Projects
Project (1) ─→ (N) TaskLists
Project (1) ─→ (N) Tasks
TaskList (1) ─→ (N) Tasks
User (N) ←─→ (N) Projects (via ProjectMembers)
User (1) ─→ (N) Tasks (as assignee)
```

---

## 🧪 Testing Tips

### Postman/Insomnia Collection
1. Set base URL: `http://localhost:3000/api`
2. Create environment variables for UUIDs
3. Chain requests (save org ID → use in project creation)

### Test Scenarios
1. ✅ Happy path: Create org → user → project → task list → task
2. ✅ Validation: Send invalid data, expect 400
3. ✅ Not found: Request non-existent ID, expect 404
4. ✅ Conflict: Duplicate email, expect 409
5. ✅ State transition: Invalid task status change, expect 400
6. ✅ Version mismatch: Update with old version, expect 409
7. ✅ Pagination: Test with different page sizes
8. ✅ Filtering: Combine multiple filters

---

## 🚨 Common Errors & Solutions

### 400 Bad Request
- **Cause**: Validation failed (Zod schema)
- **Fix**: Check request body matches schema in `validation.ts`

### 404 Not Found
- **Cause**: Resource doesn't exist or is soft-deleted
- **Fix**: Verify UUID is correct

### 409 Conflict
- **Cause**: Duplicate entry or version mismatch
- **Fix**: Check unique constraints or version number

### 500 Internal Server Error
- **Cause**: Unhandled exception
- **Fix**: Check server logs for stack trace

---

## 📝 Environment Variables

```env
# Required
DATABASE_URL="postgresql://user:pass@localhost:5432/oneflow"

# Optional
NODE_ENV="development"  # development | production
```

---

## 📚 Documentation Files

- **`API_DOCUMENTATION.md`** - Complete API reference with examples
- **`BACKEND_IMPLEMENTATION.md`** - Implementation summary and architecture
- **`DATABASE_SETUP.md`** - Database setup instructions
- **`prisma/schema.prisma`** - Database schema definition

---

## 🎓 Learn More

### Prisma
```bash
npx prisma studio      # Visual database browser
npx prisma format      # Format schema.prisma
npx prisma validate    # Validate schema
```

### Next.js App Router
- Routes in `src/app/api/` automatically become endpoints
- `route.ts` exports HTTP method handlers (GET, POST, PUT, DELETE)
- `params` are async in Next.js 15

### Zod Validation
```typescript
const schema = z.object({
  email: z.string().email(),
  age: z.number().min(18),
})

const data = schema.parse(input) // Throws if invalid
```

---

## ✅ Pre-deployment Checklist

- [ ] All tests passing
- [ ] Database migrations applied
- [ ] Environment variables set
- [ ] Prisma client generated
- [ ] Error handling tested
- [ ] Documentation updated
- [ ] Performance optimized (indexes, pagination)
- [ ] Security reviewed (input validation, SQL injection)

---

## 🤝 Need Help?

1. Check `API_DOCUMENTATION.md` for endpoint details
2. Review service files for business logic examples
3. Examine Zod schemas in `validation.ts`
4. Check Prisma schema for data model
5. Look at existing routes for patterns

---

**Happy coding! 🚀**
