# API Testing Guide - OneFlow Backend

Complete step-by-step guide to test all API endpoints with example requests and expected responses.

## 🚀 Setup Before Testing

### 1. Start the Development Server
```bash
npm run dev
```

Server will start at: **http://localhost:3000**

### 2. Install a REST Client

Choose one:
- **cURL** (command line) - Already installed on most systems
- **Postman** - Download from https://www.postman.com/downloads/
- **Insomnia** - Download from https://insomnia.rest/download
- **Thunder Client** - VS Code extension
- **REST Client** - VS Code extension

### 3. Set Base URL
All examples use: `http://localhost:3000/api`

---

## 📝 Test Flow (Recommended Order)

Follow this order to build up test data:

1. ✅ Create Organization
2. ✅ Create Users
3. ✅ Create Project
4. ✅ Add Project Members
5. ✅ Create Task Lists
6. ✅ Create Tasks
7. ✅ Update Task Status (test state machine)
8. ✅ Test Filters & Pagination
9. ✅ Test Statistics Endpoints

---

## 🏢 1. Organizations API

### Create Organization
```bash
curl -X POST http://localhost:3000/api/organizations \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Acme Corporation",
    "currency": "USD",
    "timezone": "America/New_York"
  }'
```

**Expected Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "name": "Acme Corporation",
    "currency": "USD",
    "timezone": "America/New_York",
    "createdAt": "2025-11-08T10:00:00.000Z",
    "updatedAt": "2025-11-08T10:00:00.000Z"
  }
}
```

**💡 Save the `id` as `ORG_ID` for next requests!**

---

### List Organizations
```bash
curl "http://localhost:3000/api/organizations?page=1&pageSize=10"
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "name": "Acme Corporation",
      "currency": "USD",
      "_count": {
        "users": 0,
        "projects": 0
      }
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

---

### Get Organization by ID
```bash
curl "http://localhost:3000/api/organizations/{ORG_ID}"
```

---

### Get Organization Statistics
```bash
curl "http://localhost:3000/api/organizations/{ORG_ID}/stats"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      { "role": "admin", "_count": 1 },
      { "role": "member", "_count": 3 }
    ],
    "projects": [
      { "status": "in_progress", "_count": 2 }
    ],
    "financial": {
      "_sum": {
        "budget": 100000,
        "cachedRevenue": 75000,
        "cachedCost": 50000,
        "cachedProfit": 25000
      }
    }
  }
}
```

---

### Update Organization
```bash
curl -X PUT http://localhost:3000/api/organizations/{ORG_ID} \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Acme Corp (Updated)",
    "currency": "EUR"
  }'
```

---

### Search Organizations
```bash
curl "http://localhost:3000/api/organizations?q=acme&page=1&pageSize=25"
```

---

## 👤 2. Users API

### Create User (Admin)
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "organizationId": "{ORG_ID}",
    "email": "admin@acme.com",
    "name": "Admin User",
    "role": "admin",
    "hourlyRate": 150,
    "isActive": true
  }'
```

**💡 Save the user `id` as `ADMIN_ID`**

---

### Create User (Manager)
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "organizationId": "{ORG_ID}",
    "email": "manager@acme.com",
    "name": "Project Manager",
    "role": "manager",
    "hourlyRate": 100,
    "isActive": true
  }'
```

**💡 Save as `MANAGER_ID`**

---

### Create User (Developer)
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "organizationId": "{ORG_ID}",
    "email": "dev@acme.com",
    "name": "John Developer",
    "role": "developer",
    "hourlyRate": 75,
    "isActive": true
  }'
```

**💡 Save as `DEV_ID`**

---

### List Users with Filters
```bash
# All users
curl "http://localhost:3000/api/users?organizationId={ORG_ID}&page=1&pageSize=10"

# Filter by role
curl "http://localhost:3000/api/users?organizationId={ORG_ID}&role=developer"

# Filter by active status
curl "http://localhost:3000/api/users?organizationId={ORG_ID}&isActive=true"

# Search by name or email
curl "http://localhost:3000/api/users?organizationId={ORG_ID}&q=john"
```

---

### Get User by ID
```bash
curl "http://localhost:3000/api/users/{DEV_ID}?organizationId={ORG_ID}"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "email": "dev@acme.com",
    "name": "John Developer",
    "role": "developer",
    "hourlyRate": 75,
    "isActive": true,
    "projectMembers": [],
    "managedProjects": [],
    "_count": {
      "assignedTasks": 0,
      "timesheets": 0
    }
  }
}
```

---

### Update User
```bash
curl -X PUT http://localhost:3000/api/users/{DEV_ID}?organizationId={ORG_ID} \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Senior Developer",
    "hourlyRate": 85
  }'
```

---

### Get User Statistics
```bash
curl "http://localhost:3000/api/users/{DEV_ID}/stats?organizationId={ORG_ID}"
```

---

## 📁 3. Projects API

### Create Project
```bash
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "organizationId": "{ORG_ID}",
    "name": "Website Redesign",
    "code": "WEB-001",
    "description": "Complete website overhaul with modern design",
    "projectManagerId": "{MANAGER_ID}",
    "startDate": "2025-01-01",
    "endDate": "2025-06-30",
    "budget": 100000,
    "status": "planned"
  }'
```

**💡 Save the project `id` as `PROJECT_ID`**

---

### List Projects
```bash
# All projects
curl "http://localhost:3000/api/projects?organizationId={ORG_ID}&page=1&pageSize=10"

# Filter by status
curl "http://localhost:3000/api/projects?organizationId={ORG_ID}&status=planned"

# Filter by manager
curl "http://localhost:3000/api/projects?organizationId={ORG_ID}&managerId={MANAGER_ID}"

# Search
curl "http://localhost:3000/api/projects?organizationId={ORG_ID}&q=website"
```

---

### Get Project by ID
```bash
curl "http://localhost:3000/api/projects/{PROJECT_ID}?organizationId={ORG_ID}"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "name": "Website Redesign",
    "code": "WEB-001",
    "status": "planned",
    "budget": 100000,
    "projectManager": {
      "id": "...",
      "name": "Project Manager",
      "email": "manager@acme.com"
    },
    "members": [],
    "_count": {
      "tasks": 0,
      "members": 0
    }
  }
}
```

---

### Update Project (with Optimistic Locking)
```bash
curl -X PUT "http://localhost:3000/api/projects/{PROJECT_ID}?organizationId={ORG_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Website Redesign v2",
    "status": "in_progress",
    "progressPct": 10,
    "version": 1
  }'
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "name": "Website Redesign v2",
    "status": "in_progress",
    "progressPct": 10,
    "version": 2
  }
}
```

---

### Test Version Conflict
```bash
# Try updating with old version (should fail with 409)
curl -X PUT "http://localhost:3000/api/projects/{PROJECT_ID}?organizationId={ORG_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Should Fail",
    "version": 1
  }'
```

**Expected Response (409):**
```json
{
  "success": false,
  "error": "Version mismatch - project was updated by another user"
}
```

---

## 👥 4. Project Members API

### Add Member to Project
```bash
curl -X POST http://localhost:3000/api/projects/{PROJECT_ID}/members \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "{DEV_ID}",
    "roleInProject": "Full Stack Developer"
  }'
```

**Expected Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "projectId": "...",
    "userId": "...",
    "roleInProject": "Full Stack Developer",
    "assignedAt": "2025-11-08T10:00:00.000Z",
    "user": {
      "id": "...",
      "name": "John Developer",
      "email": "dev@acme.com",
      "role": "developer"
    }
  }
}
```

---

### Add Another Member
```bash
curl -X POST http://localhost:3000/api/projects/{PROJECT_ID}/members \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "{ADMIN_ID}",
    "roleInProject": "Tech Lead"
  }'
```

---

### List Project Members
```bash
curl "http://localhost:3000/api/projects/{PROJECT_ID}/members"
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "roleInProject": "Full Stack Developer",
      "user": {
        "id": "...",
        "name": "John Developer",
        "email": "dev@acme.com",
        "hourlyRate": 75
      }
    },
    {
      "id": "...",
      "roleInProject": "Tech Lead",
      "user": {
        "name": "Admin User",
        "email": "admin@acme.com"
      }
    }
  ]
}
```

---

### Get Specific Member
```bash
curl "http://localhost:3000/api/projects/{PROJECT_ID}/members/{DEV_ID}"
```

---

### Update Member Role
```bash
curl -X PATCH http://localhost:3000/api/projects/{PROJECT_ID}/members/{DEV_ID} \
  -H "Content-Type: application/json" \
  -d '{
    "roleInProject": "Senior Full Stack Developer"
  }'
```

---

### Remove Member from Project
```bash
curl -X DELETE "http://localhost:3000/api/projects/{PROJECT_ID}/members/{DEV_ID}"
```

**Expected Response (204 No Content)**

---

### Test Duplicate Member (should fail)
```bash
# Add same user again
curl -X POST http://localhost:3000/api/projects/{PROJECT_ID}/members \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "{ADMIN_ID}",
    "roleInProject": "Duplicate"
  }'
```

**Expected Response (409):**
```json
{
  "success": false,
  "error": "User is already a member of this project"
}
```

---

## 🗂️ 5. Task Lists API

### Create Task List (Sprint 1)
```bash
curl -X POST http://localhost:3000/api/projects/{PROJECT_ID}/task-lists \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Sprint 1 - Setup",
    "ordinal": 1
  }'
```

**💡 Save as `LIST1_ID`**

---

### Create Task List (Sprint 2)
```bash
curl -X POST http://localhost:3000/api/projects/{PROJECT_ID}/task-lists \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Sprint 2 - Development"
  }'
```

**💡 Save as `LIST2_ID`** (ordinal auto-calculated as 2)

---

### Create Task List (Sprint 3)
```bash
curl -X POST http://localhost:3000/api/projects/{PROJECT_ID}/task-lists \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Sprint 3 - Testing"
  }'
```

**💡 Save as `LIST3_ID`**

---

### List Task Lists for Project
```bash
curl "http://localhost:3000/api/projects/{PROJECT_ID}/task-lists"
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "title": "Sprint 1 - Setup",
      "ordinal": 1,
      "_count": {
        "tasks": 0
      },
      "tasks": []
    },
    {
      "id": "...",
      "title": "Sprint 2 - Development",
      "ordinal": 2,
      "_count": {
        "tasks": 0
      }
    }
  ]
}
```

---

### Get Single Task List
```bash
curl "http://localhost:3000/api/task-lists/{LIST1_ID}"
```

---

### Update Task List
```bash
curl -X PUT http://localhost:3000/api/task-lists/{LIST1_ID} \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Sprint 1 - Project Setup & Infrastructure"
  }'
```

---

### Reorder Task Lists
```bash
curl -X PUT http://localhost:3000/api/projects/{PROJECT_ID}/task-lists/reorder \
  -H "Content-Type: application/json" \
  -d '{
    "orderedListIds": ["{LIST3_ID}", "{LIST1_ID}", "{LIST2_ID}"]
  }'
```

---

## ✅ 6. Tasks API

### Create Task (High Priority)
```bash
curl -X POST http://localhost:3000/api/task-lists/{LIST1_ID}/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Setup development environment",
    "description": "Install Node.js, PostgreSQL, and configure VS Code",
    "assigneeId": "{DEV_ID}",
    "priority": 3,
    "status": "new",
    "estimateHours": 4,
    "dueDate": "2025-11-15",
    "metadata": {
      "tags": ["setup", "infrastructure"]
    }
  }'
```

**💡 Save as `TASK1_ID`**

**Expected Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "title": "Setup development environment",
    "status": "new",
    "priority": 3,
    "assigneeId": "...",
    "estimateHours": 4,
    "dueDate": "2025-11-15",
    "version": 1,
    "createdAt": "2025-11-08T10:00:00.000Z"
  }
}
```

---

### Create More Tasks
```bash
# Task 2
curl -X POST http://localhost:3000/api/task-lists/{LIST1_ID}/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Design database schema",
    "description": "Create ERD and Prisma schema",
    "assigneeId": "{ADMIN_ID}",
    "priority": 4,
    "status": "new",
    "estimateHours": 8,
    "dueDate": "2025-11-20"
  }'
```

**💡 Save as `TASK2_ID`**

```bash
# Task 3
curl -X POST http://localhost:3000/api/task-lists/{LIST2_ID}/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Implement user authentication",
    "description": "JWT-based auth with refresh tokens",
    "assigneeId": "{DEV_ID}",
    "priority": 4,
    "status": "new",
    "estimateHours": 16,
    "dueDate": "2025-12-01"
  }'
```

**💡 Save as `TASK3_ID`**

---

### List All Tasks
```bash
# All tasks (paginated)
curl "http://localhost:3000/api/tasks?page=1&pageSize=10"

# Tasks for specific project
curl "http://localhost:3000/api/tasks?projectId={PROJECT_ID}&page=1&pageSize=25"

# Tasks for specific assignee
curl "http://localhost:3000/api/tasks?assigneeId={DEV_ID}"

# Filter by status
curl "http://localhost:3000/api/tasks?status=new&page=1&pageSize=10"

# Filter by priority
curl "http://localhost:3000/api/tasks?priority=4&page=1&pageSize=10"

# Search tasks
curl "http://localhost:3000/api/tasks?q=authentication"

# Combine filters
curl "http://localhost:3000/api/tasks?projectId={PROJECT_ID}&status=new&priority=4"
```

---

### List Tasks in Specific List
```bash
curl "http://localhost:3000/api/task-lists/{LIST1_ID}/tasks?page=1&pageSize=10"
```

---

### Get Single Task
```bash
curl "http://localhost:3000/api/tasks/{TASK1_ID}"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "title": "Setup development environment",
    "description": "Install Node.js, PostgreSQL, and configure VS Code",
    "status": "new",
    "priority": 3,
    "estimateHours": 4,
    "dueDate": "2025-11-15",
    "version": 1,
    "assignee": {
      "id": "...",
      "name": "John Developer",
      "email": "dev@acme.com"
    },
    "taskList": {
      "id": "...",
      "title": "Sprint 1 - Setup"
    },
    "project": {
      "id": "...",
      "name": "Website Redesign"
    },
    "comments": []
  }
}
```

---

### Update Task - Start Working (State Transition)
```bash
curl -X PUT http://localhost:3000/api/tasks/{TASK1_ID} \
  -H "Content-Type: application/json" \
  -d '{
    "status": "in_progress",
    "version": 1
  }'
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "status": "in_progress",
    "version": 2
  }
}
```

---

### Test Invalid State Transition (should fail)
```bash
# Try to go from "new" directly to "completed" (invalid)
curl -X PUT http://localhost:3000/api/tasks/{TASK2_ID} \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed",
    "version": 1
  }'
```

**Expected Response (400):**
```json
{
  "success": false,
  "error": "Invalid status transition from \"new\" to \"completed\""
}
```

---

### Valid State Transition Flow
```bash
# 1. Start task: new -> in_progress
curl -X PUT http://localhost:3000/api/tasks/{TASK2_ID} \
  -H "Content-Type: application/json" \
  -d '{"status": "in_progress", "version": 1}'

# 2. Submit for review: in_progress -> in_review
curl -X PUT http://localhost:3000/api/tasks/{TASK2_ID} \
  -H "Content-Type: application/json" \
  -d '{"status": "in_review", "version": 2}'

# 3. Complete task: in_review -> completed
curl -X PUT http://localhost:3000/api/tasks/{TASK2_ID} \
  -H "Content-Type: application/json" \
  -d '{"status": "completed", "version": 3}'
```

---

### Update Task - Multiple Fields
```bash
curl -X PUT http://localhost:3000/api/tasks/{TASK3_ID} \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Implement user authentication & authorization",
    "priority": 4,
    "estimateHours": 20,
    "status": "in_progress",
    "metadata": {
      "tags": ["auth", "security", "backend"],
      "blockers": []
    },
    "version": 1
  }'
```

---

### Block a Task
```bash
curl -X PUT http://localhost:3000/api/tasks/{TASK3_ID} \
  -H "Content-Type: application/json" \
  -d '{
    "status": "blocked",
    "metadata": {
      "tags": ["auth", "security", "backend"],
      "blockers": ["Waiting for API keys from third-party service"]
    },
    "version": 2
  }'
```

---

### Unblock and Resume
```bash
curl -X PUT http://localhost:3000/api/tasks/{TASK3_ID} \
  -H "Content-Type: application/json" \
  -d '{
    "status": "in_progress",
    "metadata": {
      "tags": ["auth", "security", "backend"],
      "blockers": []
    },
    "version": 3
  }'
```

---

### Get Kanban Board View
```bash
curl "http://localhost:3000/api/projects/{PROJECT_ID}/tasks/kanban"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "new": [],
    "in_progress": [
      {
        "id": "...",
        "title": "Setup development environment",
        "priority": 3,
        "assignee": {
          "name": "John Developer"
        }
      },
      {
        "id": "...",
        "title": "Implement user authentication & authorization",
        "priority": 4
      }
    ],
    "in_review": [],
    "blocked": [],
    "completed": [
      {
        "id": "...",
        "title": "Design database schema",
        "priority": 4
      }
    ]
  }
}
```

---

### Move Task to Different List
```bash
curl -X PUT http://localhost:3000/api/tasks/{TASK1_ID} \
  -H "Content-Type: application/json" \
  -d '{
    "listId": "{LIST2_ID}",
    "version": 2
  }'
```

---

### Reassign Task
```bash
curl -X PUT http://localhost:3000/api/tasks/{TASK1_ID} \
  -H "Content-Type: application/json" \
  -d '{
    "assigneeId": "{ADMIN_ID}",
    "version": 3
  }'
```

---

### Unassign Task (set to null)
```bash
curl -X PUT http://localhost:3000/api/tasks/{TASK1_ID} \
  -H "Content-Type: application/json" \
  -d '{
    "assigneeId": null,
    "version": 4
  }'
```

---

### Delete Task (Soft Delete)
```bash
curl -X DELETE "http://localhost:3000/api/tasks/{TASK1_ID}"
```

**Expected Response (204 No Content)**

---

## 🧪 Advanced Testing Scenarios

### Test Pagination
```bash
# Create 30 tasks for pagination test
for i in {1..30}; do
  curl -X POST http://localhost:3000/api/tasks \
    -H "Content-Type: application/json" \
    -d "{
      \"projectId\": \"{PROJECT_ID}\",
      \"listId\": \"{LIST1_ID}\",
      \"title\": \"Task $i\",
      \"priority\": $((1 + $RANDOM % 4)),
      \"status\": \"new\"
    }"
done

# Test pagination
curl "http://localhost:3000/api/tasks?projectId={PROJECT_ID}&page=1&pageSize=10"
curl "http://localhost:3000/api/tasks?projectId={PROJECT_ID}&page=2&pageSize=10"
curl "http://localhost:3000/api/tasks?projectId={PROJECT_ID}&page=3&pageSize=10"
```

---

### Test Concurrent Updates (Version Conflict)
```bash
# Terminal 1: Update task
curl -X PUT http://localhost:3000/api/tasks/{TASK2_ID} \
  -H "Content-Type: application/json" \
  -d '{"status": "in_progress", "version": 4}'

# Terminal 2: Try to update with same version (should fail)
curl -X PUT http://localhost:3000/api/tasks/{TASK2_ID} \
  -H "Content-Type: application/json" \
  -d '{"status": "blocked", "version": 4}'
```

**Terminal 2 Expected (409):**
```json
{
  "success": false,
  "error": "Version mismatch - task was updated by another user"
}
```

---

### Test Validation Errors
```bash
# Invalid email
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "organizationId": "{ORG_ID}",
    "email": "not-an-email",
    "name": "Test",
    "role": "member"
  }'

# Expected: 400 with validation details

# Invalid UUID
curl "http://localhost:3000/api/tasks/invalid-uuid-format"

# Expected: 400

# Missing required field
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "organizationId": "{ORG_ID}"
  }'

# Expected: 400 (name required)
```

---

### Test Soft Deletes
```bash
# Delete a task
curl -X DELETE "http://localhost:3000/api/tasks/{TASK3_ID}"

# Try to get deleted task
curl "http://localhost:3000/api/tasks/{TASK3_ID}"

# Expected: 404 Not Found

# List tasks (deleted task should not appear)
curl "http://localhost:3000/api/tasks?projectId={PROJECT_ID}"
```

---

### Test Cascade Deletes
```bash
# Delete task list (should soft-delete all tasks in it)
curl -X DELETE "http://localhost:3000/api/task-lists/{LIST3_ID}"

# Verify tasks in that list are deleted
curl "http://localhost:3000/api/task-lists/{LIST3_ID}/tasks"
```

---

## 📊 Testing Checklist

Use this to track your testing progress:

### Organizations
- [ ] Create organization
- [ ] List organizations with pagination
- [ ] Get organization by ID
- [ ] Update organization
- [ ] Get organization statistics
- [ ] Search organizations
- [ ] Delete organization

### Users
- [ ] Create user
- [ ] List users with pagination
- [ ] Filter users by role
- [ ] Filter users by active status
- [ ] Search users by name/email
- [ ] Get user by ID
- [ ] Update user
- [ ] Get user statistics
- [ ] Soft delete user
- [ ] Test duplicate email validation

### Projects
- [ ] Create project
- [ ] List projects with pagination
- [ ] Filter by status
- [ ] Filter by manager
- [ ] Search projects
- [ ] Get project by ID
- [ ] Update project with version
- [ ] Test version conflict
- [ ] Soft delete project

### Project Members
- [ ] Add member to project
- [ ] List project members
- [ ] Get specific member
- [ ] Update member role
- [ ] Remove member
- [ ] Test duplicate member validation

### Task Lists
- [ ] Create task list
- [ ] Create task list with auto ordinal
- [ ] List task lists
- [ ] Get task list by ID
- [ ] Update task list
- [ ] Reorder task lists
- [ ] Delete task list (cascade to tasks)

### Tasks
- [ ] Create task via list endpoint
- [ ] Create task via tasks endpoint
- [ ] List all tasks with pagination
- [ ] Filter by project
- [ ] Filter by assignee
- [ ] Filter by status
- [ ] Filter by priority
- [ ] Search tasks
- [ ] Get task by ID
- [ ] Update task (valid state transition)
- [ ] Test invalid state transition
- [ ] Test all valid state flows
- [ ] Update multiple fields
- [ ] Move task to different list
- [ ] Reassign task
- [ ] Unassign task
- [ ] Get kanban board view
- [ ] Test version conflict
- [ ] Soft delete task

---

## 🔧 Troubleshooting

### "organizationId is required"
Many endpoints require `organizationId` as a query parameter (until auth is implemented).

**Fix:**
```bash
curl "http://localhost:3000/api/users?organizationId={ORG_ID}"
```

### "Version mismatch"
You're using an old version number for optimistic locking.

**Fix:** Get current version first, then update:
```bash
# Get current task
curl "http://localhost:3000/api/tasks/{TASK_ID}"
# Note the version number, use it in update
```

### "Invalid status transition"
Check the valid transitions in `QUICK_START_API.md`.

### "Cannot find module 'zod'"
```bash
npm install zod
```

### "Prisma client not generated"
```bash
npm run db:generate
```

---

## 🎯 Next Steps

1. ✅ Complete all tests in the checklist
2. ✅ Try error scenarios (invalid data, missing fields)
3. ✅ Test edge cases (pagination limits, very long strings)
4. ✅ Performance test with many records
5. ✅ Set up Postman collection for easier testing

---

**Happy Testing! 🚀**
