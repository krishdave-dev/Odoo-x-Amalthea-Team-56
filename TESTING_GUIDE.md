# 🧪 Comprehensive Testing Guide - Timesheet API

**Step-by-step guide to test all 7 Timesheet API endpoints**

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Getting Sample Data](#getting-sample-data)
3. [Testing All Endpoints](#testing-all-endpoints)
4. [Complete Workflow Test](#complete-workflow-test)
5. [Error Testing](#error-testing)
6. [Using PowerShell](#using-powershell)
7. [Quick Reference](#quick-reference)

---

## Prerequisites

### 1. Start the Development Server

```powershell
npm run dev
```

✅ Server starts at: **http://localhost:3000**

### 2. Verify Database is Seeded

```powershell
npm run db:seed
```

You should see output like:
```
🎉 Seed completed successfully!
📋 Login credentials:
   Admin: admin@demo.com / admin123
   Manager: manager@demo.com / manager123
   Developer: dev@demo.com / dev123
🏢 Organization ID: 05522f0d-85d0-4c5e-b464-6ba15530217c
```

---

## Getting Sample Data

### Option 1: Open Prisma Studio

```powershell
npm run db:studio
```

Navigate to **http://localhost:5555** and note down:

| Table | Fields to Copy |
|-------|----------------|
| `users` | Pick any user's `id` field |
| `tasks` | Pick any task's `id` field |
| `projects` | Pick any project's `id` field |
| `timesheets` | Copy an existing timesheet `id` |

### Option 2: Query via API

```powershell
# Get all timesheets (this will show IDs)
curl http://localhost:3000/api/v1/timesheets
```

Copy the `userId`, `taskId`, `projectId`, and `id` from the response.

---

## Testing All Endpoints

### ✅ Test 1: List All Timesheets

**Endpoint:** `GET /api/v1/timesheets`

**PowerShell:**
```powershell
curl http://localhost:3000/api/v1/timesheets?page=1&pageSize=10
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "...",
        "userId": "...",
        "taskId": "...",
        "projectId": "...",
        "start": "2025-01-10T09:00:00.000Z",
        "end": "2025-01-10T17:00:00.000Z",
        "durationHours": "8.00",
        "billable": true,
        "notes": "Wireframe design work",
        "costAtTime": "480.00",
        "status": "draft",
        "user": {...},
        "task": {...},
        "project": {...}
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "total": 4,
      "totalPages": 1
    }
  },
  "message": "Retrieved 4 timesheets"
}
```

---

### ✅ Test 2: Filter Timesheets

**A. Filter by Project**
```powershell
curl "http://localhost:3000/api/v1/timesheets?projectId=YOUR_PROJECT_ID"
```

**B. Filter by User**
```powershell
curl "http://localhost:3000/api/v1/timesheets?userId=YOUR_USER_ID"
```

**C. Filter by Status**
```powershell
curl "http://localhost:3000/api/v1/timesheets?status=draft"
```

**D. Filter by Billable**
```powershell
curl "http://localhost:3000/api/v1/timesheets?billable=true"
```

**E. Filter by Date Range**
```powershell
curl "http://localhost:3000/api/v1/timesheets?from=2025-01-01T00:00:00Z&to=2025-01-31T23:59:59Z"
```

**F. Combine Multiple Filters**
```powershell
curl "http://localhost:3000/api/v1/timesheets?userId=YOUR_USER_ID&billable=true&status=draft&sort=createdAt:desc"
```

---

### ✅ Test 3: Create a New Timesheet

**Endpoint:** `POST /api/v1/timesheets`

**⚠️ IMPORTANT:** Replace `YOUR_TASK_ID` and `YOUR_USER_ID` with actual UUIDs from your database.

**PowerShell:**
```powershell
$body = @{
    taskId = "YOUR_TASK_ID"
    userId = "YOUR_USER_ID"
    start = "2025-11-08T09:00:00Z"
    end = "2025-11-08T12:00:00Z"
    billable = $true
    notes = "Testing API - Morning work"
} | ConvertTo-Json

curl -Method POST -Uri "http://localhost:3000/api/v1/timesheets" -Headers @{"Content-Type"="application/json"} -Body $body
```

**Alternative (one-liner):**
```powershell
curl -Method POST -Uri http://localhost:3000/api/v1/timesheets -Headers @{"Content-Type"="application/json"} -Body '{"taskId":"YOUR_TASK_ID","userId":"YOUR_USER_ID","start":"2025-11-08T09:00:00Z","end":"2025-11-08T12:00:00Z","billable":true,"notes":"Test"}'
```

**Expected Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "new-uuid-here",
    "userId": "...",
    "taskId": "...",
    "projectId": "...",
    "start": "2025-11-08T09:00:00.000Z",
    "end": "2025-11-08T12:00:00.000Z",
    "durationHours": "3.00",
    "billable": true,
    "notes": "Testing API - Morning work",
    "costAtTime": "180.00",
    "status": "draft",
    "createdAt": "...",
    "updatedAt": "...",
    "user": {...},
    "task": {...},
    "project": {...}
  },
  "message": "Timesheet created successfully"
}
```

**💡 Notice:**
- ✅ `durationHours` calculated automatically (3 hours)
- ✅ `costAtTime` calculated from user's hourly rate
- ✅ `projectId` derived from the task
- ✅ Default status is `draft`

---

### ✅ Test 4: Bulk Create Timesheets

**Endpoint:** `POST /api/v1/timesheets` (with `entries` array)

**PowerShell:**
```powershell
$bulkBody = @{
    entries = @(
        @{
            taskId = "YOUR_TASK_ID"
            userId = "YOUR_USER_ID"
            start = "2025-11-08T09:00:00Z"
            end = "2025-11-08T12:00:00Z"
            billable = $true
            notes = "Morning session"
        },
        @{
            taskId = "YOUR_TASK_ID"
            userId = "YOUR_USER_ID"
            start = "2025-11-08T13:00:00Z"
            end = "2025-11-08T17:00:00Z"
            billable = $true
            notes = "Afternoon session"
        }
    )
} | ConvertTo-Json -Depth 5

curl -Method POST -Uri "http://localhost:3000/api/v1/timesheets" -Headers @{"Content-Type"="application/json"} -Body $bulkBody
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "inserted": 2,
    "failed": 0,
    "errors": []
  },
  "message": "Bulk operation completed. Inserted: 2, Failed: 0"
}
```

---

### ✅ Test 5: Get Timesheet by ID

**Endpoint:** `GET /api/v1/timesheets/:id`

**⚠️ IMPORTANT:** Use an existing timesheet ID from Test 1 or Test 3.

**PowerShell:**
```powershell
curl http://localhost:3000/api/v1/timesheets/YOUR_TIMESHEET_ID
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "YOUR_TIMESHEET_ID",
    "userId": "...",
    "taskId": "...",
    "start": "2025-11-08T09:00:00.000Z",
    "end": "2025-11-08T12:00:00.000Z",
    "durationHours": "3.00",
    "billable": true,
    "notes": "Testing API - Morning work",
    "costAtTime": "180.00",
    "status": "draft",
    "user": {...},
    "task": {...},
    "project": {...}
  }
}
```

**Test Not Found (404):**
```powershell
curl http://localhost:3000/api/v1/timesheets/00000000-0000-0000-0000-000000000000
```

**Expected Error:**
```json
{
  "success": false,
  "error": {
    "message": "Timesheet not found",
    "code": "NOT_FOUND"
  }
}
```

---

### ✅ Test 6: Update Timesheet

**Endpoint:** `PUT /api/v1/timesheets/:id`

**⚠️ IMPORTANT:** Only works if timesheet status is `draft` or `submitted`.

**PowerShell:**
```powershell
$updateBody = @{
    notes = "Updated: Completed the feature"
    end = "2025-11-08T13:00:00Z"
} | ConvertTo-Json

curl -Method PUT -Uri "http://localhost:3000/api/v1/timesheets/YOUR_TIMESHEET_ID" -Headers @{"Content-Type"="application/json"} -Body $updateBody
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "YOUR_TIMESHEET_ID",
    "end": "2025-11-08T13:00:00.000Z",
    "durationHours": "4.00",
    "costAtTime": "240.00",
    "notes": "Updated: Completed the feature",
    ...
  },
  "message": "Timesheet updated successfully"
}
```

**💡 Notice:** Duration and cost automatically recalculated!

---

### ✅ Test 7: Update Timesheet Status

**Endpoint:** `PATCH /api/v1/timesheets/:id/status`

**Status Workflow:**
```
draft → submitted → approved → locked
```

**A. Draft → Submitted**
```powershell
$statusBody = @{ status = "submitted" } | ConvertTo-Json

curl -Method PATCH -Uri "http://localhost:3000/api/v1/timesheets/YOUR_DRAFT_TIMESHEET_ID/status" -Headers @{"Content-Type"="application/json"} -Body $statusBody
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "status": "submitted",
    ...
  },
  "message": "Timesheet status updated to submitted"
}
```

**B. Submitted → Approved**
```powershell
$statusBody = @{ status = "approved" } | ConvertTo-Json

curl -Method PATCH -Uri "http://localhost:3000/api/v1/timesheets/YOUR_SUBMITTED_TIMESHEET_ID/status" -Headers @{"Content-Type"="application/json"} -Body $statusBody
```

**C. Approved → Locked**
```powershell
$statusBody = @{ status = "locked" } | ConvertTo-Json

curl -Method PATCH -Uri "http://localhost:3000/api/v1/timesheets/YOUR_APPROVED_TIMESHEET_ID/status" -Headers @{"Content-Type"="application/json"} -Body $statusBody
```

**Test Invalid Transition (400 Error):**
```powershell
# Try to go backwards: submitted → draft
$statusBody = @{ status = "draft" } | ConvertTo-Json

curl -Method PATCH -Uri "http://localhost:3000/api/v1/timesheets/YOUR_SUBMITTED_TIMESHEET_ID/status" -Headers @{"Content-Type"="application/json"} -Body $statusBody
```

**Expected Error:**
```json
{
  "success": false,
  "error": {
    "message": "Invalid status transition from submitted to draft. Allowed transitions: draft → submitted → approved → locked",
    "code": "VALIDATION_ERROR"
  }
}
```

---

### ✅ Test 8: Delete Timesheet

**Endpoint:** `DELETE /api/v1/timesheets/:id`

**⚠️ IMPORTANT:** Cannot delete if status is `locked`.

**PowerShell:**
```powershell
curl -Method DELETE -Uri "http://localhost:3000/api/v1/timesheets/YOUR_DRAFT_TIMESHEET_ID"
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Timesheet deleted successfully"
}
```

**Verify Deletion (404):**
```powershell
curl http://localhost:3000/api/v1/timesheets/YOUR_DELETED_TIMESHEET_ID
```

**Test Delete Locked (403 Error):**
```powershell
curl -Method DELETE -Uri "http://localhost:3000/api/v1/timesheets/YOUR_LOCKED_TIMESHEET_ID"
```

**Expected Error:**
```json
{
  "success": false,
  "error": {
    "message": "Cannot delete locked timesheet",
    "code": "FORBIDDEN"
  }
}
```

---

## Complete Workflow Test

**Full lifecycle: Create → Update → Submit → Approve → Lock → Try to Edit/Delete**

```powershell
# Step 1: Create a new timesheet
$body = @{
    taskId = "YOUR_TASK_ID"
    userId = "YOUR_USER_ID"
    start = "2025-11-08T09:00:00Z"
    end = "2025-11-08T17:00:00Z"
    billable = $true
    notes = "Full workflow test"
} | ConvertTo-Json

$response = curl -Method POST -Uri "http://localhost:3000/api/v1/timesheets" -Headers @{"Content-Type"="application/json"} -Body $body | ConvertFrom-Json
$timesheetId = $response.data.id

Write-Host "Created timesheet: $timesheetId"

# Step 2: View the timesheet
curl "http://localhost:3000/api/v1/timesheets/$timesheetId"

# Step 3: Update the timesheet
$updateBody = @{ notes = "Updated notes" } | ConvertTo-Json
curl -Method PUT -Uri "http://localhost:3000/api/v1/timesheets/$timesheetId" -Headers @{"Content-Type"="application/json"} -Body $updateBody

# Step 4: Submit for approval
$statusBody = @{ status = "submitted" } | ConvertTo-Json
curl -Method PATCH -Uri "http://localhost:3000/api/v1/timesheets/$timesheetId/status" -Headers @{"Content-Type"="application/json"} -Body $statusBody

# Step 5: Approve
$statusBody = @{ status = "approved" } | ConvertTo-Json
curl -Method PATCH -Uri "http://localhost:3000/api/v1/timesheets/$timesheetId/status" -Headers @{"Content-Type"="application/json"} -Body $statusBody

# Step 6: Try to edit (should fail - 403)
$updateBody = @{ notes = "This should fail" } | ConvertTo-Json
curl -Method PUT -Uri "http://localhost:3000/api/v1/timesheets/$timesheetId" -Headers @{"Content-Type"="application/json"} -Body $updateBody

# Step 7: Lock
$statusBody = @{ status = "locked" } | ConvertTo-Json
curl -Method PATCH -Uri "http://localhost:3000/api/v1/timesheets/$timesheetId/status" -Headers @{"Content-Type"="application/json"} -Body $statusBody

# Step 8: Try to delete (should fail - 403)
curl -Method DELETE -Uri "http://localhost:3000/api/v1/timesheets/$timesheetId"

Write-Host "Workflow test complete! ✅"
```

---

## Error Testing

### Test 1: Invalid Start/End Time

```powershell
# Start after end
$body = @{
    taskId = "YOUR_TASK_ID"
    userId = "YOUR_USER_ID"
    start = "2025-11-08T17:00:00Z"
    end = "2025-11-08T09:00:00Z"
    billable = $true
} | ConvertTo-Json

curl -Method POST -Uri "http://localhost:3000/api/v1/timesheets" -Headers @{"Content-Type"="application/json"} -Body $body
```

**Expected (400 Bad Request):**
```json
{
  "success": false,
  "error": {
    "message": "Validation error",
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "code": "custom",
        "message": "End time must be after start time",
        "path": ["end"]
      }
    ]
  }
}
```

### Test 2: Invalid UUID

```powershell
$body = @{
    taskId = "invalid-uuid"
    userId = "YOUR_USER_ID"
    start = "2025-11-08T09:00:00Z"
    end = "2025-11-08T17:00:00Z"
} | ConvertTo-Json

curl -Method POST -Uri "http://localhost:3000/api/v1/timesheets" -Headers @{"Content-Type"="application/json"} -Body $body
```

**Expected (400 Bad Request):**
```json
{
  "success": false,
  "error": {
    "message": "Validation error",
    "code": "VALIDATION_ERROR",
    "details": [...]
  }
}
```

### Test 3: Non-existent User

```powershell
$body = @{
    taskId = "YOUR_TASK_ID"
    userId = "00000000-0000-0000-0000-000000000000"
    start = "2025-11-08T09:00:00Z"
    end = "2025-11-08T17:00:00Z"
} | ConvertTo-Json

curl -Method POST -Uri "http://localhost:3000/api/v1/timesheets" -Headers @{"Content-Type"="application/json"} -Body $body
```

**Expected (400 Bad Request):**
```json
{
  "success": false,
  "error": {
    "message": "User not found",
    "code": "INTERNAL_ERROR"
  }
}
```

---

## Using PowerShell

### Save Helper Functions

Create a file `Test-Timesheets.ps1`:

```powershell
# Test-Timesheets.ps1
$baseUrl = "http://localhost:3000/api/v1/timesheets"

# Replace these with your actual IDs
$taskId = "YOUR_TASK_ID"
$userId = "YOUR_USER_ID"

function Get-Timesheets {
    curl "$baseUrl?page=1&pageSize=10"
}

function New-Timesheet {
    param(
        [string]$Notes = "Test timesheet"
    )
    
    $body = @{
        taskId = $taskId
        userId = $userId
        start = "2025-11-08T09:00:00Z"
        end = "2025-11-08T17:00:00Z"
        billable = $true
        notes = $Notes
    } | ConvertTo-Json
    
    curl -Method POST -Uri $baseUrl -Headers @{"Content-Type"="application/json"} -Body $body
}

function Update-TimesheetStatus {
    param(
        [string]$TimesheetId,
        [string]$Status
    )
    
    $body = @{ status = $Status } | ConvertTo-Json
    curl -Method PATCH -Uri "$baseUrl/$TimesheetId/status" -Headers @{"Content-Type"="application/json"} -Body $body
}

function Remove-Timesheet {
    param([string]$TimesheetId)
    curl -Method DELETE -Uri "$baseUrl/$TimesheetId"
}

# Usage:
# . .\Test-Timesheets.ps1
# Get-Timesheets
# $response = New-Timesheet -Notes "My test"
# Update-TimesheetStatus -TimesheetId "uuid" -Status "submitted"
# Remove-Timesheet -TimesheetId "uuid"
```

**Run it:**
```powershell
. .\Test-Timesheets.ps1
Get-Timesheets
```

---

## Quick Reference

### All Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/timesheets` | List all timesheets |
| GET | `/api/v1/timesheets/:id` | Get single timesheet |
| POST | `/api/v1/timesheets` | Create timesheet(s) |
| PUT | `/api/v1/timesheets/:id` | Update timesheet |
| PATCH | `/api/v1/timesheets/:id/status` | Update status |
| DELETE | `/api/v1/timesheets/:id` | Delete timesheet |

### Query Parameters

| Parameter | Type | Example |
|-----------|------|---------|
| `projectId` | UUID | `?projectId=xxx` |
| `taskId` | UUID | `?taskId=xxx` |
| `userId` | UUID | `?userId=xxx` |
| `billable` | Boolean | `?billable=true` |
| `status` | String | `?status=draft` |
| `from` | DateTime | `?from=2025-11-01T00:00:00Z` |
| `to` | DateTime | `?to=2025-11-30T23:59:59Z` |
| `page` | Integer | `?page=1` |
| `pageSize` | Integer | `?pageSize=20` |
| `sort` | String | `?sort=createdAt:desc` |

### Status Values

| Status | Description |
|--------|-------------|
| `draft` | Initial state, can edit |
| `submitted` | Submitted for approval, can edit |
| `approved` | Approved, cannot edit |
| `locked` | Locked for billing, cannot edit/delete |

### Status Transitions

```
draft → submitted → approved → locked
```

- ✅ Forward only
- ❌ No backward transitions
- ❌ Cannot skip states

---

## Testing Checklist

- [ ] ✅ List all timesheets (GET /timesheets)
- [ ] ✅ Filter by project
- [ ] ✅ Filter by user
- [ ] ✅ Filter by status
- [ ] ✅ Filter by date range
- [ ] ✅ Create single timesheet (POST)
- [ ] ✅ Bulk create timesheets (POST with entries)
- [ ] ✅ Get timesheet by ID (GET /timesheets/:id)
- [ ] ✅ Update timesheet (PUT)
- [ ] ✅ Submit timesheet (PATCH status → submitted)
- [ ] ✅ Approve timesheet (PATCH status → approved)
- [ ] ✅ Lock timesheet (PATCH status → locked)
- [ ] ✅ Delete timesheet (DELETE)
- [ ] ✅ Test validation errors (invalid data)
- [ ] ✅ Test permission errors (edit locked)
- [ ] ✅ Test not found errors (invalid ID)
- [ ] ✅ Test status transition errors (backward transition)

---

## Debugging Tips

### 1. View Database

```powershell
npm run db:studio
```

Opens http://localhost:5555

### 2. Check Server Logs

Look at the terminal where `npm run dev` is running.

### 3. Pretty Print JSON

```powershell
curl http://localhost:3000/api/v1/timesheets | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

### 4. Check Audit Events

In Prisma Studio, check the `events` table to see all logged operations.

---

## Common Issues

### Issue: "User not found"
**Solution:** Verify the user ID exists in the database using Prisma Studio.

### Issue: "Task not found"
**Solution:** Check the task ID and ensure it's not soft-deleted.

### Issue: "Cannot edit timesheet"
**Solution:** Check the timesheet status. Only `draft` and `submitted` can be edited.

### Issue: "Invalid status transition"
**Solution:** Follow the workflow order: draft → submitted → approved → locked

### Issue: curl command not recognized
**Solution:** PowerShell uses `Invoke-WebRequest` or `Invoke-RestMethod`. Use the `-Method` parameter format shown in examples.

---

## Next Steps

After testing all endpoints:

1. ✅ Build frontend UI components
2. ✅ Add authentication middleware
3. ✅ Create reporting/analytics endpoints
4. ✅ Add real-time notifications
5. ✅ Set up automated tests (Jest/Vitest)

---

## 📚 Related Documentation

- **API Reference:** `TIMESHEET_API.md` - Complete API documentation
- **Implementation:** `TIMESHEET_IMPLEMENTATION.md` - Technical details
- **Checklist:** `TIMESHEET_CHECKLIST.md` - Feature completion status
- **Quick Reference:** `TIMESHEET_QUICK_REFERENCE.md` - Quick API reference

---

## 🎉 Success!

You now have everything you need to thoroughly test all Timesheet API endpoints!

**Happy Testing! 🚀**
