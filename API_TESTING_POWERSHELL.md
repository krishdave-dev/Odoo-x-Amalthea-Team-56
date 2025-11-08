# PowerShell API Testing Guide - OneFlow Backend

Complete guide for testing all API endpoints using PowerShell commands.

## 🚀 Prerequisites

1. **Start the development server** (in a separate terminal):
```powershell
npm run dev
```

2. **Keep server running** - All commands below should be run in a different PowerShell terminal

---

## 📝 PowerShell Testing Basics

### Method 1: Using Invoke-RestMethod (Recommended)
Returns parsed JSON objects directly:
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/organizations" -Method Get
```

### Method 2: Using Invoke-WebRequest
Returns full HTTP response:
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/organizations" -Method Get
```

**We'll use `Invoke-RestMethod` throughout this guide for cleaner output.**

---

## 🏢 1. Organizations API

### Create Organization

```powershell
$body = @{
    name = "Acme Corporation"
    currency = "USD"
    timezone = "America/New_York"
} | ConvertTo-Json

$org = Invoke-RestMethod -Uri "http://localhost:3000/api/organizations" `
    -Method Post `
    -Body $body `
    -ContentType "application/json"

# Display the result
$org

# Save the organization ID for later use
$ORG_ID = $org.data.id
Write-Host "Organization ID saved: $ORG_ID" -ForegroundColor Green
```

**Expected Output:**
```
success data
------- ----
   True @{id=a1b2c3d4-...; name=Acme Corporation; currency=USD; ...}
```

---

### List Organizations

```powershell
$orgs = Invoke-RestMethod -Uri "http://localhost:3000/api/organizations?page=1&pageSize=10" -Method Get
$orgs.data | Format-Table
```

---

### Get Organization by ID

```powershell
$org = Invoke-RestMethod -Uri "http://localhost:3000/api/organizations/$ORG_ID" -Method Get
$org.data
```

---

### Get Organization Statistics

```powershell
$stats = Invoke-RestMethod -Uri "http://localhost:3000/api/organizations/$ORG_ID/stats" -Method Get
$stats.data
```

---

### Update Organization

```powershell
$updateBody = @{
    name = "Acme Corp (Updated)"
    currency = "EUR"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/organizations/$ORG_ID" `
    -Method Put `
    -Body $updateBody `
    -ContentType "application/json"
```

---

### Search Organizations

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/organizations?q=acme&page=1&pageSize=25" -Method Get
```

---

## 👤 2. Users API

### Create User (Admin)

```powershell
$adminBody = @{
    organizationId = $ORG_ID
    email = "admin@acme.com"
    name = "Admin User"
    role = "admin"
    hourlyRate = 150
    isActive = $true
} | ConvertTo-Json

$admin = Invoke-RestMethod -Uri "http://localhost:3000/api/users" `
    -Method Post `
    -Body $adminBody `
    -ContentType "application/json"

# Save admin ID
$ADMIN_ID = $admin.data.id
Write-Host "Admin ID saved: $ADMIN_ID" -ForegroundColor Green
```

---

### Create User (Manager)

```powershell
$managerBody = @{
    organizationId = $ORG_ID
    email = "manager@acme.com"
    name = "Project Manager"
    role = "manager"
    hourlyRate = 100
    isActive = $true
} | ConvertTo-Json

$manager = Invoke-RestMethod -Uri "http://localhost:3000/api/users" `
    -Method Post `
    -Body $managerBody `
    -ContentType "application/json"

$MANAGER_ID = $manager.data.id
Write-Host "Manager ID saved: $MANAGER_ID" -ForegroundColor Green
```

---

### Create User (Developer)

```powershell
$devBody = @{
    organizationId = $ORG_ID
    email = "dev@acme.com"
    name = "John Developer"
    role = "developer"
    hourlyRate = 75
    isActive = $true
} | ConvertTo-Json

$dev = Invoke-RestMethod -Uri "http://localhost:3000/api/users" `
    -Method Post `
    -Body $devBody `
    -ContentType "application/json"

$DEV_ID = $dev.data.id
Write-Host "Developer ID saved: $DEV_ID" -ForegroundColor Green
```

---

### List Users with Filters

```powershell
# All users
Invoke-RestMethod -Uri "http://localhost:3000/api/users?organizationId=$ORG_ID&page=1&pageSize=10" -Method Get

# Filter by role
Invoke-RestMethod -Uri "http://localhost:3000/api/users?organizationId=$ORG_ID&role=developer" -Method Get

# Filter by active status
Invoke-RestMethod -Uri "http://localhost:3000/api/users?organizationId=$ORG_ID&isActive=true" -Method Get

# Search by name or email
Invoke-RestMethod -Uri "http://localhost:3000/api/users?organizationId=$ORG_ID&q=john" -Method Get
```

---

### Get User by ID

```powershell
$user = Invoke-RestMethod -Uri "http://localhost:3000/api/users/$DEV_ID`?organizationId=$ORG_ID" -Method Get
$user.data
```

---

### Update User

```powershell
$updateUserBody = @{
    name = "John Senior Developer"
    hourlyRate = 85
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/users/$DEV_ID`?organizationId=$ORG_ID" `
    -Method Put `
    -Body $updateUserBody `
    -ContentType "application/json"
```

---

### Get User Statistics

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/users/$DEV_ID/stats?organizationId=$ORG_ID" -Method Get
```

---

## 📁 3. Projects API

### Create Project

```powershell
$projectBody = @{
    organizationId = $ORG_ID
    name = "Website Redesign"
    code = "WEB-001"
    description = "Complete website overhaul with modern design"
    projectManagerId = $MANAGER_ID
    startDate = "2025-01-01"
    endDate = "2025-06-30"
    budget = 100000
    status = "planned"
} | ConvertTo-Json

$project = Invoke-RestMethod -Uri "http://localhost:3000/api/projects" `
    -Method Post `
    -Body $projectBody `
    -ContentType "application/json"

$PROJECT_ID = $project.data.id
Write-Host "Project ID saved: $PROJECT_ID" -ForegroundColor Green
```

---

### List Projects

```powershell
# All projects
Invoke-RestMethod -Uri "http://localhost:3000/api/projects?organizationId=$ORG_ID&page=1&pageSize=10" -Method Get

# Filter by status
Invoke-RestMethod -Uri "http://localhost:3000/api/projects?organizationId=$ORG_ID&status=planned" -Method Get

# Filter by manager
Invoke-RestMethod -Uri "http://localhost:3000/api/projects?organizationId=$ORG_ID&managerId=$MANAGER_ID" -Method Get

# Search
Invoke-RestMethod -Uri "http://localhost:3000/api/projects?organizationId=$ORG_ID&q=website" -Method Get
```

---

### Get Project by ID

```powershell
$project = Invoke-RestMethod -Uri "http://localhost:3000/api/projects/$PROJECT_ID`?organizationId=$ORG_ID" -Method Get
$project.data
```

---

### Update Project (with Optimistic Locking)

```powershell
$updateProjectBody = @{
    name = "Website Redesign v2"
    status = "in_progress"
    progressPct = 10
    version = 1
} | ConvertTo-Json

$updated = Invoke-RestMethod -Uri "http://localhost:3000/api/projects/$PROJECT_ID`?organizationId=$ORG_ID" `
    -Method Put `
    -Body $updateProjectBody `
    -ContentType "application/json"

$updated.data
```

---

### Test Version Conflict

```powershell
# This should fail with 409 Conflict
$conflictBody = @{
    name = "Should Fail"
    version = 1
} | ConvertTo-Json

try {
    Invoke-RestMethod -Uri "http://localhost:3000/api/projects/$PROJECT_ID`?organizationId=$ORG_ID" `
        -Method Put `
        -Body $conflictBody `
        -ContentType "application/json"
} catch {
    Write-Host "Expected error: Version conflict detected" -ForegroundColor Yellow
    $_.Exception.Response.StatusCode
}
```

---

## 👥 4. Project Members API

### Add Member to Project

```powershell
$memberBody = @{
    userId = $DEV_ID
    roleInProject = "Full Stack Developer"
} | ConvertTo-Json

$member = Invoke-RestMethod -Uri "http://localhost:3000/api/projects/$PROJECT_ID/members" `
    -Method Post `
    -Body $memberBody `
    -ContentType "application/json"

$member.data
```

---

### Add Another Member

```powershell
$member2Body = @{
    userId = $ADMIN_ID
    roleInProject = "Tech Lead"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/projects/$PROJECT_ID/members" `
    -Method Post `
    -Body $member2Body `
    -ContentType "application/json"
```

---

### List Project Members

```powershell
$members = Invoke-RestMethod -Uri "http://localhost:3000/api/projects/$PROJECT_ID/members" -Method Get
$members.data | Format-Table
```

---

### Get Specific Member

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/projects/$PROJECT_ID/members/$DEV_ID" -Method Get
```

---

### Update Member Role

```powershell
$updateRoleBody = @{
    roleInProject = "Senior Full Stack Developer"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/projects/$PROJECT_ID/members/$DEV_ID" `
    -Method Patch `
    -Body $updateRoleBody `
    -ContentType "application/json"
```

---

### Remove Member from Project

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/projects/$PROJECT_ID/members/$DEV_ID" -Method Delete
```

---

## 🗂️ 5. Task Lists API

### Create Task List (Sprint 1)

```powershell
$list1Body = @{
    title = "Sprint 1 - Setup"
    ordinal = 1
} | ConvertTo-Json

$list1 = Invoke-RestMethod -Uri "http://localhost:3000/api/projects/$PROJECT_ID/task-lists" `
    -Method Post `
    -Body $list1Body `
    -ContentType "application/json"

$LIST1_ID = $list1.data.id
Write-Host "Task List 1 ID saved: $LIST1_ID" -ForegroundColor Green
```

---

### Create Task List (Sprint 2)

```powershell
$list2Body = @{
    title = "Sprint 2 - Development"
} | ConvertTo-Json

$list2 = Invoke-RestMethod -Uri "http://localhost:3000/api/projects/$PROJECT_ID/task-lists" `
    -Method Post `
    -Body $list2Body `
    -ContentType "application/json"

$LIST2_ID = $list2.data.id
Write-Host "Task List 2 ID saved: $LIST2_ID" -ForegroundColor Green
```

---

### Create Task List (Sprint 3)

```powershell
$list3Body = @{
    title = "Sprint 3 - Testing"
} | ConvertTo-Json

$list3 = Invoke-RestMethod -Uri "http://localhost:3000/api/projects/$PROJECT_ID/task-lists" `
    -Method Post `
    -Body $list3Body `
    -ContentType "application/json"

$LIST3_ID = $list3.data.id
Write-Host "Task List 3 ID saved: $LIST3_ID" -ForegroundColor Green
```

---

### List Task Lists for Project

```powershell
$taskLists = Invoke-RestMethod -Uri "http://localhost:3000/api/projects/$PROJECT_ID/task-lists" -Method Get
$taskLists.data | Format-Table
```

---

### Get Single Task List

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/task-lists/$LIST1_ID" -Method Get
```

---

### Update Task List

```powershell
$updateListBody = @{
    title = "Sprint 1 - Project Setup & Infrastructure"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/task-lists/$LIST1_ID" `
    -Method Put `
    -Body $updateListBody `
    -ContentType "application/json"
```

---

### Reorder Task Lists

```powershell
$reorderBody = @{
    orderedListIds = @($LIST3_ID, $LIST1_ID, $LIST2_ID)
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/projects/$PROJECT_ID/task-lists/reorder" `
    -Method Put `
    -Body $reorderBody `
    -ContentType "application/json"
```

---

## ✅ 6. Tasks API

### Create Task (High Priority)

```powershell
$task1Body = @{
    title = "Setup development environment"
    description = "Install Node.js, PostgreSQL, and configure VS Code"
    assigneeId = $DEV_ID
    priority = 3
    status = "new"
    estimateHours = 4
    dueDate = "2025-11-15"
    metadata = @{
        tags = @("setup", "infrastructure")
    }
} | ConvertTo-Json -Depth 3

$task1 = Invoke-RestMethod -Uri "http://localhost:3000/api/task-lists/$LIST1_ID/tasks" `
    -Method Post `
    -Body $task1Body `
    -ContentType "application/json"

$TASK1_ID = $task1.data.id
Write-Host "Task 1 ID saved: $TASK1_ID" -ForegroundColor Green
```

---

### Create More Tasks

```powershell
# Task 2
$task2Body = @{
    title = "Design database schema"
    description = "Create ERD and Prisma schema"
    assigneeId = $ADMIN_ID
    priority = 4
    status = "new"
    estimateHours = 8
    dueDate = "2025-11-20"
} | ConvertTo-Json -Depth 3

$task2 = Invoke-RestMethod -Uri "http://localhost:3000/api/task-lists/$LIST1_ID/tasks" `
    -Method Post `
    -Body $task2Body `
    -ContentType "application/json"

$TASK2_ID = $task2.data.id
Write-Host "Task 2 ID saved: $TASK2_ID" -ForegroundColor Green

# Task 3
$task3Body = @{
    title = "Implement user authentication"
    description = "JWT-based auth with refresh tokens"
    assigneeId = $DEV_ID
    priority = 4
    status = "new"
    estimateHours = 16
    dueDate = "2025-12-01"
} | ConvertTo-Json -Depth 3

$task3 = Invoke-RestMethod -Uri "http://localhost:3000/api/task-lists/$LIST2_ID/tasks" `
    -Method Post `
    -Body $task3Body `
    -ContentType "application/json"

$TASK3_ID = $task3.data.id
Write-Host "Task 3 ID saved: $TASK3_ID" -ForegroundColor Green
```

---

### List Tasks with Filters

```powershell
# All tasks (paginated)
Invoke-RestMethod -Uri "http://localhost:3000/api/tasks?page=1&pageSize=10" -Method Get

# Tasks for specific project
Invoke-RestMethod -Uri "http://localhost:3000/api/tasks?projectId=$PROJECT_ID&page=1&pageSize=25" -Method Get

# Tasks for specific assignee
Invoke-RestMethod -Uri "http://localhost:3000/api/tasks?assigneeId=$DEV_ID" -Method Get

# Filter by status
Invoke-RestMethod -Uri "http://localhost:3000/api/tasks?status=new&page=1&pageSize=10" -Method Get

# Filter by priority
Invoke-RestMethod -Uri "http://localhost:3000/api/tasks?priority=4&page=1&pageSize=10" -Method Get

# Search tasks
Invoke-RestMethod -Uri "http://localhost:3000/api/tasks?q=authentication" -Method Get

# Combine filters
Invoke-RestMethod -Uri "http://localhost:3000/api/tasks?projectId=$PROJECT_ID&status=new&priority=4" -Method Get
```

---

### Get Single Task

```powershell
$task = Invoke-RestMethod -Uri "http://localhost:3000/api/tasks/$TASK1_ID" -Method Get
$task.data
```

---

### Update Task - Start Working (State Transition)

```powershell
$startTaskBody = @{
    status = "in_progress"
    version = 1
} | ConvertTo-Json

$updated = Invoke-RestMethod -Uri "http://localhost:3000/api/tasks/$TASK1_ID" `
    -Method Put `
    -Body $startTaskBody `
    -ContentType "application/json"

$updated.data
```

---

### Test Invalid State Transition

```powershell
# Try to go from "new" directly to "completed" (should fail)
$invalidBody = @{
    status = "completed"
    version = 1
} | ConvertTo-Json

try {
    Invoke-RestMethod -Uri "http://localhost:3000/api/tasks/$TASK2_ID" `
        -Method Put `
        -Body $invalidBody `
        -ContentType "application/json"
} catch {
    Write-Host "Expected error: Invalid state transition" -ForegroundColor Yellow
    $_.Exception.Message
}
```

---

### Valid State Transition Flow

```powershell
# 1. Start task: new -> in_progress
$step1 = @{
    status = "in_progress"
    version = 1
} | ConvertTo-Json

$result1 = Invoke-RestMethod -Uri "http://localhost:3000/api/tasks/$TASK2_ID" `
    -Method Put `
    -Body $step1 `
    -ContentType "application/json"

Write-Host "Step 1: Task is now in_progress (version $($result1.data.version))" -ForegroundColor Green

# 2. Submit for review: in_progress -> in_review
$step2 = @{
    status = "in_review"
    version = $result1.data.version
} | ConvertTo-Json

$result2 = Invoke-RestMethod -Uri "http://localhost:3000/api/tasks/$TASK2_ID" `
    -Method Put `
    -Body $step2 `
    -ContentType "application/json"

Write-Host "Step 2: Task is now in_review (version $($result2.data.version))" -ForegroundColor Green

# 3. Complete task: in_review -> completed
$step3 = @{
    status = "completed"
    version = $result2.data.version
} | ConvertTo-Json

$result3 = Invoke-RestMethod -Uri "http://localhost:3000/api/tasks/$TASK2_ID" `
    -Method Put `
    -Body $step3 `
    -ContentType "application/json"

Write-Host "Step 3: Task is now completed (version $($result3.data.version))" -ForegroundColor Green
```

---

### Update Task - Multiple Fields

```powershell
$multiUpdateBody = @{
    title = "Implement user authentication & authorization"
    priority = 4
    estimateHours = 20
    status = "in_progress"
    metadata = @{
        tags = @("auth", "security", "backend")
        blockers = @()
    }
    version = 1
} | ConvertTo-Json -Depth 3

Invoke-RestMethod -Uri "http://localhost:3000/api/tasks/$TASK3_ID" `
    -Method Put `
    -Body $multiUpdateBody `
    -ContentType "application/json"
```

---

### Block a Task

```powershell
# First get current version
$currentTask = Invoke-RestMethod -Uri "http://localhost:3000/api/tasks/$TASK3_ID" -Method Get
$currentVersion = $currentTask.data.version

$blockBody = @{
    status = "blocked"
    metadata = @{
        tags = @("auth", "security", "backend")
        blockers = @("Waiting for API keys from third-party service")
    }
    version = $currentVersion
} | ConvertTo-Json -Depth 3

Invoke-RestMethod -Uri "http://localhost:3000/api/tasks/$TASK3_ID" `
    -Method Put `
    -Body $blockBody `
    -ContentType "application/json"
```

---

### Get Kanban Board View

```powershell
$kanban = Invoke-RestMethod -Uri "http://localhost:3000/api/projects/$PROJECT_ID/tasks/kanban" -Method Get
$kanban.data
```

---

### Move Task to Different List

```powershell
# Get current version first
$task = Invoke-RestMethod -Uri "http://localhost:3000/api/tasks/$TASK1_ID" -Method Get

$moveBody = @{
    listId = $LIST2_ID
    version = $task.data.version
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/tasks/$TASK1_ID" `
    -Method Put `
    -Body $moveBody `
    -ContentType "application/json"
```

---

### Reassign Task

```powershell
$task = Invoke-RestMethod -Uri "http://localhost:3000/api/tasks/$TASK1_ID" -Method Get

$reassignBody = @{
    assigneeId = $ADMIN_ID
    version = $task.data.version
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/tasks/$TASK1_ID" `
    -Method Put `
    -Body $reassignBody `
    -ContentType "application/json"
```

---

### Unassign Task (set to null)

```powershell
$task = Invoke-RestMethod -Uri "http://localhost:3000/api/tasks/$TASK1_ID" -Method Get

$unassignBody = @{
    assigneeId = $null
    version = $task.data.version
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/tasks/$TASK1_ID" `
    -Method Put `
    -Body $unassignBody `
    -ContentType "application/json"
```

---

### Delete Task (Soft Delete)

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/tasks/$TASK1_ID" -Method Delete
```

---

## 🧪 Advanced Testing Scenarios

### Test Pagination

```powershell
# Create 30 tasks for pagination test
1..30 | ForEach-Object {
    $taskBody = @{
        projectId = $PROJECT_ID
        listId = $LIST1_ID
        title = "Task $_"
        priority = Get-Random -Minimum 1 -Maximum 5
        status = "new"
    } | ConvertTo-Json
    
    Invoke-RestMethod -Uri "http://localhost:3000/api/tasks" `
        -Method Post `
        -Body $taskBody `
        -ContentType "application/json"
    
    Write-Host "Created Task $_" -ForegroundColor Cyan
}

# Test pagination
$page1 = Invoke-RestMethod -Uri "http://localhost:3000/api/tasks?projectId=$PROJECT_ID&page=1&pageSize=10" -Method Get
$page2 = Invoke-RestMethod -Uri "http://localhost:3000/api/tasks?projectId=$PROJECT_ID&page=2&pageSize=10" -Method Get
$page3 = Invoke-RestMethod -Uri "http://localhost:3000/api/tasks?projectId=$PROJECT_ID&page=3&pageSize=10" -Method Get

Write-Host "Page 1: $($page1.data.Count) tasks" -ForegroundColor Green
Write-Host "Page 2: $($page2.data.Count) tasks" -ForegroundColor Green
Write-Host "Page 3: $($page3.data.Count) tasks" -ForegroundColor Green
```

---

### Test Concurrent Updates (Version Conflict)

```powershell
# Get current task
$task = Invoke-RestMethod -Uri "http://localhost:3000/api/tasks/$TASK2_ID" -Method Get
$version = $task.data.version

# Update 1: Success
$update1 = @{
    status = "in_progress"
    version = $version
} | ConvertTo-Json

$result1 = Invoke-RestMethod -Uri "http://localhost:3000/api/tasks/$TASK2_ID" `
    -Method Put `
    -Body $update1 `
    -ContentType "application/json"

Write-Host "Update 1 succeeded: version now $($result1.data.version)" -ForegroundColor Green

# Update 2: Should fail (using old version)
$update2 = @{
    status = "blocked"
    version = $version
} | ConvertTo-Json

try {
    Invoke-RestMethod -Uri "http://localhost:3000/api/tasks/$TASK2_ID" `
        -Method Put `
        -Body $update2 `
        -ContentType "application/json"
} catch {
    Write-Host "Update 2 failed as expected: Version conflict detected!" -ForegroundColor Yellow
}
```

---

## 📊 Complete Testing Script

Save this as `Test-API.ps1` to run all tests at once:

```powershell
# Complete API Test Script

Write-Host "=== Starting OneFlow API Tests ===" -ForegroundColor Cyan

# 1. Create Organization
Write-Host "`n1. Creating Organization..." -ForegroundColor Yellow
$orgBody = @{
    name = "Test Corp"
    currency = "USD"
    timezone = "America/New_York"
} | ConvertTo-Json

$org = Invoke-RestMethod -Uri "http://localhost:3000/api/organizations" `
    -Method Post -Body $orgBody -ContentType "application/json"
$ORG_ID = $org.data.id
Write-Host "✓ Organization created: $ORG_ID" -ForegroundColor Green

# 2. Create Users
Write-Host "`n2. Creating Users..." -ForegroundColor Yellow
$users = @(
    @{ email="admin@test.com"; name="Admin"; role="admin"; rate=150 },
    @{ email="manager@test.com"; name="Manager"; role="manager"; rate=100 },
    @{ email="dev@test.com"; name="Developer"; role="developer"; rate=75 }
)

$userIds = @{}
foreach ($u in $users) {
    $userBody = @{
        organizationId = $ORG_ID
        email = $u.email
        name = $u.name
        role = $u.role
        hourlyRate = $u.rate
        isActive = $true
    } | ConvertTo-Json
    
    $result = Invoke-RestMethod -Uri "http://localhost:3000/api/users" `
        -Method Post -Body $userBody -ContentType "application/json"
    $userIds[$u.role] = $result.data.id
    Write-Host "✓ Created $($u.role): $($result.data.id)" -ForegroundColor Green
}

# 3. Create Project
Write-Host "`n3. Creating Project..." -ForegroundColor Yellow
$projectBody = @{
    organizationId = $ORG_ID
    name = "Test Project"
    code = "TEST-001"
    projectManagerId = $userIds["manager"]
    budget = 50000
    status = "planned"
} | ConvertTo-Json

$project = Invoke-RestMethod -Uri "http://localhost:3000/api/projects" `
    -Method Post -Body $projectBody -ContentType "application/json"
$PROJECT_ID = $project.data.id
Write-Host "✓ Project created: $PROJECT_ID" -ForegroundColor Green

# 4. Add Project Members
Write-Host "`n4. Adding Project Members..." -ForegroundColor Yellow
$memberBody = @{
    userId = $userIds["developer"]
    roleInProject = "Developer"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/projects/$PROJECT_ID/members" `
    -Method Post -Body $memberBody -ContentType "application/json"
Write-Host "✓ Member added" -ForegroundColor Green

# 5. Create Task Lists
Write-Host "`n5. Creating Task Lists..." -ForegroundColor Yellow
$listBody = @{ title = "Sprint 1" } | ConvertTo-Json
$list = Invoke-RestMethod -Uri "http://localhost:3000/api/projects/$PROJECT_ID/task-lists" `
    -Method Post -Body $listBody -ContentType "application/json"
$LIST_ID = $list.data.id
Write-Host "✓ Task list created: $LIST_ID" -ForegroundColor Green

# 6. Create Tasks
Write-Host "`n6. Creating Tasks..." -ForegroundColor Yellow
$taskBody = @{
    title = "Test Task"
    assigneeId = $userIds["developer"]
    priority = 3
    status = "new"
    estimateHours = 4
} | ConvertTo-Json

$task = Invoke-RestMethod -Uri "http://localhost:3000/api/task-lists/$LIST_ID/tasks" `
    -Method Post -Body $taskBody -ContentType "application/json"
$TASK_ID = $task.data.id
Write-Host "✓ Task created: $TASK_ID" -ForegroundColor Green

# 7. Test State Transitions
Write-Host "`n7. Testing State Transitions..." -ForegroundColor Yellow
$updateBody = @{
    status = "in_progress"
    version = 1
} | ConvertTo-Json

$updated = Invoke-RestMethod -Uri "http://localhost:3000/api/tasks/$TASK_ID" `
    -Method Put -Body $updateBody -ContentType "application/json"
Write-Host "✓ Task status: $($updated.data.status)" -ForegroundColor Green

# 8. Get Kanban View
Write-Host "`n8. Getting Kanban View..." -ForegroundColor Yellow
$kanban = Invoke-RestMethod -Uri "http://localhost:3000/api/projects/$PROJECT_ID/tasks/kanban" -Method Get
Write-Host "✓ Kanban view retrieved" -ForegroundColor Green

Write-Host "`n=== All Tests Completed Successfully! ===" -ForegroundColor Cyan
```

---

## 💡 PowerShell Tips

### Save Variables Between Sessions

```powershell
# Save IDs to file
@{
    ORG_ID = $ORG_ID
    ADMIN_ID = $ADMIN_ID
    MANAGER_ID = $MANAGER_ID
    DEV_ID = $DEV_ID
    PROJECT_ID = $PROJECT_ID
} | Export-Clixml -Path ".\test-ids.xml"

# Load IDs from file
$ids = Import-Clixml -Path ".\test-ids.xml"
$ORG_ID = $ids.ORG_ID
$ADMIN_ID = $ids.ADMIN_ID
# etc.
```

---

### Format Output

```powershell
# Table format
$result.data | Format-Table

# List format
$result.data | Format-List

# Custom properties
$result.data | Select-Object id, name, status | Format-Table

# Export to CSV
$result.data | Export-Csv -Path "tasks.csv" -NoTypeInformation
```

---

### Error Handling

```powershell
try {
    $result = Invoke-RestMethod -Uri "http://localhost:3000/api/..." -Method Post
    Write-Host "Success!" -ForegroundColor Green
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    $_.Exception.Response.StatusCode
}
```

---

## 🎯 Quick Reference

### Common Commands

```powershell
# GET request
Invoke-RestMethod -Uri "URL" -Method Get

# POST request
$body = @{ key = "value" } | ConvertTo-Json
Invoke-RestMethod -Uri "URL" -Method Post -Body $body -ContentType "application/json"

# PUT request
Invoke-RestMethod -Uri "URL" -Method Put -Body $body -ContentType "application/json"

# DELETE request
Invoke-RestMethod -Uri "URL" -Method Delete
```

---

## 📚 Additional Resources

- **Full API Documentation**: `API_DOCUMENTATION.md`
- **Quick Start Guide**: `QUICK_START_API.md`
- **Setup Instructions**: `SETUP_AND_TESTING.md`
- **Bash Testing Guide**: `API_TESTING_GUIDE.md`

---

**Happy Testing with PowerShell! 🚀**
