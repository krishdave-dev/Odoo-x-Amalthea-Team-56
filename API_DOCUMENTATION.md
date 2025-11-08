# OneFlow Backend API Documentation

## Overview

This document describes the complete REST API implementation for the **OneFlow** project management platform. The backend is built using **Next.js App Router**, **TypeScript**, **Prisma ORM**, and follows clean architecture principles.

## Architecture

### Directory Structure

```
src/
├── app/api/                      # API route handlers
│   ├── organizations/            # Organization endpoints
│   │   ├── route.ts              # List & create organizations
│   │   └── [id]/
│   │       ├── route.ts          # Get, update, delete organization
│   │       └── stats/
│   │           └── route.ts      # Organization statistics
│   ├── users/                    # User endpoints
│   │   ├── route.ts              # List & create users
│   │   └── [id]/
│   │       ├── route.ts          # Get, update, delete user
│   │       └── stats/
│   │           └── route.ts      # User statistics
│   ├── projects/                 # Project endpoints
│   │   ├── route.ts              # List & create projects
│   │   └── [projectId]/
│   │       ├── route.ts          # Get, update, delete project
│   │       ├── members/          # Project member management
│   │       │   ├── route.ts      # List & add members
│   │       │   └── [userId]/
│   │       │       └── route.ts  # Get, update, remove member
│   │       ├── task-lists/       # Project task lists
│   │       │   └── route.ts      # List, create, reorder task lists
│   │       └── tasks/
│   │           └── kanban/
│   │               └── route.ts  # Kanban board view
│   ├── task-lists/               # Task list endpoints
│   │   └── [listId]/
│   │       ├── route.ts          # Get, update, delete task list
│   │       └── tasks/
│   │           └── route.ts      # List & create tasks in list
│   └── tasks/                    # Task endpoints
│       ├── route.ts              # List & create tasks
│       └── [taskId]/
│           └── route.ts          # Get, update, delete task
├── lib/                          # Shared utilities
│   ├── prisma.ts                 # Prisma client instance
│   ├── response.ts               # Response helper functions
│   ├── error.ts                  # Error handling utilities
│   ├── validation.ts             # Zod schemas & validators
│   └── db-helpers.ts             # Database utility functions
├── services/                     # Business logic layer
│   ├── organization.service.ts   # Organization service
│   ├── user.service.ts           # User service
│   ├── project.service.ts        # Project service
│   ├── taskList.service.ts       # Task list service
│   └── task.service.ts           # Task service with state management
└── types/                        # TypeScript type definitions
    ├── common.ts                 # Common types (ApiResponse, PaginatedResponse)
    └── enums.ts                  # Enums (statuses, priorities, roles)
```

### Design Principles

1. **Separation of Concerns**: Route handlers delegate to service layer for business logic
2. **Type Safety**: Strong typing throughout with TypeScript and Zod validation
3. **Error Handling**: Centralized error handling with custom error classes
4. **Consistent Responses**: Standardized API response format
5. **Validation**: Input validation using Zod schemas before processing
6. **Soft Deletes**: Non-destructive deletion with `deletedAt` timestamps
7. **Optimistic Locking**: Version-based concurrency control for updates
8. **Audit Trail**: Event logging for all major operations

---

## API Response Format

All endpoints return responses in this consistent format:

### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Paginated Response
```json
{
  "success": true,
  "data": [ ... ],
  "meta": {
    "page": 1,
    "pageSize": 25,
    "total": 100,
    "totalPages": 4
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message here"
}
```

---

## API Endpoints

### 1. Organizations

#### `GET /api/organizations`
List all organizations with pagination and search.

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `pageSize` (number, default: 25, max: 100) - Items per page
- `q` (string, optional) - Search query
- `includeProjects` (boolean, optional) - Include related projects

**Response:** Paginated list of organizations

---

#### `POST /api/organizations`
Create a new organization.

**Request Body:**
```json
{
  "name": "Acme Corporation",
  "currency": "USD",
  "timezone": "America/New_York"
}
```

**Response:** Created organization (201)

---

#### `GET /api/organizations/:id`
Get a single organization by ID.

**Query Parameters:**
- `includeProjects` (boolean, optional) - Include related projects

**Response:** Organization object

---

#### `PUT /api/organizations/:id`
Update an organization.

**Request Body:**
```json
{
  "name": "Updated Name",
  "currency": "EUR",
  "timezone": "Europe/London"
}
```

**Response:** Updated organization

---

#### `DELETE /api/organizations/:id`
Delete an organization (hard delete - use with caution).

**Response:** 204 No Content

---

#### `GET /api/organizations/:id/stats`
Get organization statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      { "role": "admin", "_count": 2 },
      { "role": "member", "_count": 15 }
    ],
    "projects": [
      { "status": "in_progress", "_count": 5 },
      { "status": "completed", "_count": 10 }
    ],
    "financial": {
      "_sum": {
        "budget": 500000,
        "cachedRevenue": 350000,
        "cachedCost": 200000,
        "cachedProfit": 150000
      }
    }
  }
}
```

---

### 2. Users

#### `GET /api/users`
List all users with filters and pagination.

**Query Parameters:**
- `organizationId` (UUID, required) - Organization filter
- `page` (number, default: 1)
- `pageSize` (number, default: 25, max: 100)
- `q` (string, optional) - Search by name or email
- `role` (string, optional) - Filter by role
- `isActive` (boolean, optional) - Filter by active status

**Response:** Paginated list of users

---

#### `POST /api/users`
Create a new user.

**Request Body:**
```json
{
  "organizationId": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "member",
  "hourlyRate": 75.00,
  "isActive": true
}
```

**Response:** Created user (201)

---

#### `GET /api/users/:id`
Get a single user by ID.

**Query Parameters:**
- `organizationId` (UUID, required)

**Response:** User object with related projects and statistics

---

#### `PUT /api/users/:id`
Update a user.

**Query Parameters:**
- `organizationId` (UUID, required)

**Request Body:**
```json
{
  "name": "Jane Doe",
  "role": "manager",
  "hourlyRate": 100.00,
  "isActive": true
}
```

**Response:** Updated user

---

#### `DELETE /api/users/:id`
Soft delete a user.

**Query Parameters:**
- `organizationId` (UUID, required)

**Response:** 204 No Content

---

#### `GET /api/users/:id/stats`
Get user activity statistics.

**Response:** Task counts, timesheet data, project count

---

### 3. Projects

#### `GET /api/projects`
List all projects with filters and pagination.

**Query Parameters:**
- `organizationId` (UUID, required)
- `page` (number, default: 1)
- `pageSize` (number, default: 25)
- `q` (string, optional) - Search query
- `status` (string, optional) - Filter by status
- `managerId` (UUID, optional) - Filter by project manager

**Response:** Paginated list of projects

---

#### `POST /api/projects`
Create a new project.

**Request Body:**
```json
{
  "organizationId": "uuid",
  "name": "Website Redesign",
  "code": "WEB-001",
  "description": "Complete website overhaul",
  "projectManagerId": "uuid",
  "startDate": "2025-01-01",
  "endDate": "2025-06-30",
  "budget": 100000,
  "status": "planned"
}
```

**Response:** Created project (201)

---

#### `GET /api/projects/:id`
Get a single project with members and task lists.

**Query Parameters:**
- `organizationId` (UUID, required)

**Response:** Project object with relationships

---

#### `PUT /api/projects/:id`
Update a project with optimistic locking.

**Query Parameters:**
- `organizationId` (UUID, required)

**Request Body:**
```json
{
  "name": "Updated Project Name",
  "status": "in_progress",
  "progressPct": 45.5,
  "version": 1
}
```

**Response:** Updated project or 409 Conflict if version mismatch

---

#### `DELETE /api/projects/:id`
Soft delete a project.

**Query Parameters:**
- `organizationId` (UUID, required)

**Response:** 204 No Content

---

### 4. Project Members

#### `GET /api/projects/:projectId/members`
List all members of a project.

**Response:** Array of project members with user details

---

#### `POST /api/projects/:projectId/members`
Add a member to a project.

**Request Body:**
```json
{
  "userId": "uuid",
  "roleInProject": "Developer"
}
```

**Response:** Created project member (201)

**Validations:**
- User must exist and belong to same organization
- Unique constraint on (projectId, userId)

---

#### `GET /api/projects/:projectId/members/:userId`
Get a specific project member.

**Response:** Project member object

---

#### `PATCH /api/projects/:projectId/members/:userId`
Update a project member's role.

**Request Body:**
```json
{
  "roleInProject": "Lead Developer"
}
```

**Response:** Updated project member

---

#### `DELETE /api/projects/:projectId/members/:userId`
Remove a member from a project.

**Response:** 204 No Content

---

### 5. Task Lists

#### `GET /api/projects/:projectId/task-lists`
Get all task lists for a project.

**Response:** Array of task lists with task counts

---

#### `POST /api/projects/:projectId/task-lists`
Create a new task list.

**Request Body:**
```json
{
  "title": "Sprint 1",
  "ordinal": 1
}
```

**Response:** Created task list (201)

**Note:** If `ordinal` is not provided, it's auto-calculated as max + 1

---

#### `PUT /api/projects/:projectId/task-lists/reorder`
Reorder task lists.

**Request Body:**
```json
{
  "orderedListIds": ["uuid1", "uuid2", "uuid3"]
}
```

**Response:** Success message

---

#### `GET /api/task-lists/:listId`
Get a single task list with all tasks.

**Response:** Task list object with tasks

---

#### `PUT /api/task-lists/:listId`
Update a task list.

**Request Body:**
```json
{
  "title": "Updated Title",
  "ordinal": 2
}
```

**Response:** Updated task list

---

#### `DELETE /api/task-lists/:listId`
Delete a task list and soft delete all its tasks.

**Response:** 204 No Content

---

### 6. Tasks

#### `GET /api/tasks`
Get all tasks with filters and pagination.

**Query Parameters:**
- `page` (number, default: 1)
- `pageSize` (number, default: 25)
- `projectId` (UUID, optional) - Filter by project
- `assigneeId` (UUID, optional) - Filter by assignee
- `status` (string, optional) - Filter by status
- `priority` (number, optional) - Filter by priority (1-4)
- `q` (string, optional) - Search query

**Response:** Paginated list of tasks

---

#### `POST /api/tasks`
Create a new task.

**Request Body:**
```json
{
  "projectId": "uuid",
  "listId": "uuid",
  "title": "Implement user authentication",
  "description": "Add JWT-based authentication",
  "assigneeId": "uuid",
  "priority": 3,
  "status": "new",
  "estimateHours": 8.5,
  "dueDate": "2025-12-31",
  "metadata": { "tags": ["backend", "security"] }
}
```

**Response:** Created task (201)

---

#### `GET /api/tasks/:taskId`
Get a single task with comments.

**Response:** Task object with full details

---

#### `PUT /api/tasks/:taskId`
Update a task with state validation and optimistic locking.

**Request Body:**
```json
{
  "title": "Updated title",
  "status": "in_progress",
  "assigneeId": "uuid",
  "priority": 4,
  "version": 1
}
```

**Response:** Updated task or 409 Conflict if:
- Version mismatch (concurrent update)
- Invalid state transition

**Valid State Transitions:**
- `new` → `in_progress`, `blocked`
- `in_progress` → `in_review`, `blocked`, `new`
- `in_review` → `completed`, `in_progress`, `blocked`
- `blocked` → `new`, `in_progress`
- `completed` → `in_progress` (reopen)

---

#### `DELETE /api/tasks/:taskId`
Soft delete a task.

**Response:** 204 No Content

---

#### `GET /api/task-lists/:listId/tasks`
Get all tasks in a specific task list.

**Query Parameters:**
- `page`, `pageSize`, `assigneeId`, `status`, `priority`, `q` (same as `/api/tasks`)

**Response:** Paginated list of tasks

---

#### `POST /api/task-lists/:listId/tasks`
Create a new task in a task list.

**Request Body:**
```json
{
  "title": "New task",
  "description": "Task description",
  "assigneeId": "uuid",
  "priority": 2,
  "status": "new"
}
```

**Response:** Created task (201)

**Note:** `listId` and `projectId` are auto-filled from the URL

---

#### `GET /api/projects/:projectId/tasks/kanban`
Get tasks grouped by status for kanban board view.

**Response:**
```json
{
  "success": true,
  "data": {
    "new": [ ... ],
    "in_progress": [ ... ],
    "in_review": [ ... ],
    "blocked": [ ... ],
    "completed": [ ... ]
  }
}
```

---

## Data Models

### Organization
```typescript
{
  id: string (UUID)
  name: string
  currency: string (ISO 4217, 3 chars)
  timezone: string (IANA timezone)
  createdAt: DateTime
  updatedAt: DateTime
}
```

### User
```typescript
{
  id: string (UUID)
  organizationId: string (UUID)
  email: string
  name: string | null
  role: string
  hourlyRate: Decimal
  isActive: boolean
  createdAt: DateTime
  updatedAt: DateTime
  deletedAt: DateTime | null
}
```

### Project
```typescript
{
  id: string (UUID)
  organizationId: string (UUID)
  name: string
  code: string | null
  description: string | null
  projectManagerId: string (UUID) | null
  startDate: Date | null
  endDate: Date | null
  status: string
  budget: Decimal | null
  progressPct: Decimal
  version: number
  createdAt: DateTime
  updatedAt: DateTime
  deletedAt: DateTime | null
}
```

### Task
```typescript
{
  id: string (UUID)
  projectId: string (UUID)
  listId: string (UUID) | null
  title: string
  description: string | null
  assigneeId: string (UUID) | null
  priority: number (1-4)
  status: string
  estimateHours: Decimal | null
  hoursLogged: Decimal
  dueDate: Date | null
  metadata: JSON | null
  version: number
  createdAt: DateTime
  updatedAt: DateTime
  deletedAt: DateTime | null
}
```

---

## Error Codes & HTTP Status

| Status Code | Meaning | When Used |
|-------------|---------|-----------|
| 200 | OK | Successful GET, PUT, PATCH |
| 201 | Created | Successful POST |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Validation error |
| 401 | Unauthorized | Authentication required (future) |
| 403 | Forbidden | Insufficient permissions (future) |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate entry or version mismatch |
| 500 | Internal Server Error | Unexpected server error |

---

## Features

### ✅ Implemented

1. **CRUD Operations** - Full create, read, update, delete for all entities
2. **Pagination** - Page-based pagination with configurable page sizes
3. **Search & Filters** - Text search and field-based filtering
4. **Soft Deletes** - Non-destructive deletion with `deletedAt` timestamps
5. **Optimistic Locking** - Version-based concurrency control for Projects and Tasks
6. **State Validation** - Enforced state machine for task status transitions
7. **Nested Routes** - RESTful nested resources (e.g., `/projects/:id/members`)
8. **Audit Trail** - Event logging for all major operations
9. **Type Safety** - Full TypeScript typing with Zod validation
10. **Error Handling** - Centralized error handling with consistent responses
11. **Relationships** - Properly handled foreign key relationships
12. **Statistics Endpoints** - Aggregated data for organizations and users

### 🔜 Future Enhancements

1. **Authentication** - JWT-based auth with middleware
2. **Authorization** - Role-based access control (RBAC)
3. **WebSockets** - Real-time updates for collaborative features
4. **File Uploads** - Attachment management
5. **Bulk Operations** - Batch create/update/delete
6. **Advanced Analytics** - Dashboards and reporting
7. **Export/Import** - Data export in various formats
8. **Rate Limiting** - API rate limiting per organization
9. **Webhooks** - Event-driven integrations
10. **GraphQL** - Alternative GraphQL API layer

---

## Running the Application

### Prerequisites

```bash
# Install dependencies
npm install

# Install zod for validation (if not already in package.json)
npm install zod
```

### Environment Setup

Create a `.env` file:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/oneflow"
NODE_ENV="development"
```

### Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Or run migrations
npm run db:migrate

# Seed database (optional)
npm run db:seed
```

### Start Development Server

```bash
npm run dev
```

The API will be available at `http://localhost:3000/api`

---

## Testing Examples

### Create Organization
```bash
curl -X POST http://localhost:3000/api/organizations \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Acme Corp",
    "currency": "USD",
    "timezone": "America/New_York"
  }'
```

### List Users
```bash
curl "http://localhost:3000/api/users?organizationId=<uuid>&page=1&pageSize=10"
```

### Create Project
```bash
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "organizationId": "<uuid>",
    "name": "Website Redesign",
    "status": "planned",
    "budget": 50000
  }'
```

### Update Task with State Transition
```bash
curl -X PUT http://localhost:3000/api/tasks/<task-uuid> \
  -H "Content-Type: application/json" \
  -d '{
    "status": "in_progress",
    "version": 1
  }'
```

---

## Architecture Decisions

### Why Service Layer?
- Separates business logic from HTTP handling
- Makes code testable without HTTP mocking
- Allows reuse across different API versions or protocols

### Why Zod?
- Runtime type validation
- Type inference for TypeScript
- Clear, composable schemas
- Better error messages than manual validation

### Why Optimistic Locking?
- Prevents lost updates in concurrent environments
- Simple to implement with version field
- Clear feedback to users about conflicts

### Why Soft Deletes?
- Data recovery capability
- Audit trail preservation
- Referential integrity maintenance
- Historical analysis support

---

## Contributing

When adding new endpoints:

1. Create/update service in `src/services/`
2. Add Zod validation schema in `src/lib/validation.ts`
3. Create route handler in `src/app/api/`
4. Use helper functions from `src/lib/response.ts` and `src/lib/error.ts`
5. Add audit events for state changes
6. Update this documentation

---

## Support

For issues or questions about the API, please refer to:
- Database schema: `prisma/schema.prisma`
- Type definitions: `src/types/`
- Implementation summary: `IMPLEMENTATION_SUMMARY.md`
