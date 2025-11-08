# Timesheet API Documentation

Complete API documentation for the Timesheets & Hours Logging module.

## Base URL

```
/api/v1/timesheets
```

## Authentication

🔒 **Note:** Authentication will be added in a future phase. Currently, all endpoints are accessible without authentication.

---

## Endpoints

### 1. List Timesheets

**GET** `/api/v1/timesheets`

Retrieve a paginated list of timesheet entries with filtering options.

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `projectId` | UUID | No | Filter by project ID |
| `taskId` | UUID | No | Filter by task ID |
| `userId` | UUID | No | Filter by user ID |
| `billable` | Boolean | No | Filter by billable status (true/false) |
| `status` | String | No | Filter by status (draft/submitted/approved/locked) |
| `from` | ISO DateTime | No | Start date for date range filter |
| `to` | ISO DateTime | No | End date for date range filter |
| `page` | Integer | No | Page number (default: 1) |
| `pageSize` | Integer | No | Items per page (default: 20, max: 100) |
| `sort` | String | No | Sort field and order (e.g., `createdAt:desc`) |

#### Example Request

```bash
GET /api/v1/timesheets?projectId=123e4567-e89b-12d3-a456-426614174000&page=1&pageSize=20&sort=createdAt:desc
```

#### Response

```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "userId": "223e4567-e89b-12d3-a456-426614174000",
        "taskId": "323e4567-e89b-12d3-a456-426614174000",
        "projectId": "423e4567-e89b-12d3-a456-426614174000",
        "start": "2025-11-07T09:00:00Z",
        "end": "2025-11-07T11:00:00Z",
        "durationHours": 2.0,
        "billable": true,
        "notes": "Implemented header component",
        "costAtTime": 120.00,
        "status": "draft",
        "createdAt": "2025-11-07T09:00:00Z",
        "updatedAt": "2025-11-07T09:00:00Z",
        "deletedAt": null,
        "user": {
          "id": "223e4567-e89b-12d3-a456-426614174000",
          "name": "John Doe",
          "email": "john@example.com",
          "hourlyRate": 60.00
        },
        "task": {
          "id": "323e4567-e89b-12d3-a456-426614174000",
          "title": "Implement Header",
          "status": "in_progress"
        },
        "project": {
          "id": "423e4567-e89b-12d3-a456-426614174000",
          "name": "Website Redesign",
          "code": "WEB-001"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 45,
      "totalPages": 3
    }
  },
  "message": "Retrieved 20 timesheets"
}
```

---

### 2. Create Timesheet

**POST** `/api/v1/timesheets`

Create a new timesheet entry.

#### Request Body

```json
{
  "taskId": "323e4567-e89b-12d3-a456-426614174000",
  "userId": "223e4567-e89b-12d3-a456-426614174000",
  "start": "2025-11-07T09:00:00Z",
  "end": "2025-11-07T11:00:00Z",
  "billable": true,
  "notes": "Implemented header component"
}
```

#### Field Validations

- `taskId`: Required, must be a valid UUID
- `userId`: Required, must be a valid UUID
- `start`: Required, must be a valid ISO 8601 datetime
- `end`: Required, must be a valid ISO 8601 datetime, must be after `start`
- `billable`: Optional, defaults to `true`
- `notes`: Optional

#### Behavior

1. **Validates** `start < end`
2. **Calculates** `durationHours = (end - start) / 3600000`
3. **Fetches** user's `hourlyRate` from database
4. **Computes** `costAtTime = hourlyRate * durationHours`
5. **Derives** `projectId` from the linked task
6. **Creates** record in a database transaction
7. **Logs** audit event

#### Response

```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "userId": "223e4567-e89b-12d3-a456-426614174000",
    "taskId": "323e4567-e89b-12d3-a456-426614174000",
    "projectId": "423e4567-e89b-12d3-a456-426614174000",
    "start": "2025-11-07T09:00:00Z",
    "end": "2025-11-07T11:00:00Z",
    "durationHours": 2.0,
    "billable": true,
    "notes": "Implemented header component",
    "costAtTime": 120.00,
    "status": "draft",
    "createdAt": "2025-11-07T09:00:00Z",
    "updatedAt": "2025-11-07T09:00:00Z",
    "deletedAt": null,
    "user": { ... },
    "task": { ... },
    "project": { ... }
  },
  "message": "Timesheet created successfully"
}
```

---

### 3. Bulk Create Timesheets

**POST** `/api/v1/timesheets`

Create multiple timesheet entries at once.

#### Request Body

```json
{
  "entries": [
    {
      "taskId": "323e4567-e89b-12d3-a456-426614174000",
      "userId": "223e4567-e89b-12d3-a456-426614174000",
      "start": "2025-11-07T09:00:00Z",
      "end": "2025-11-07T11:00:00Z",
      "billable": true,
      "notes": "Morning work"
    },
    {
      "taskId": "323e4567-e89b-12d3-a456-426614174000",
      "userId": "223e4567-e89b-12d3-a456-426614174000",
      "start": "2025-11-07T13:00:00Z",
      "end": "2025-11-07T17:00:00Z",
      "billable": true,
      "notes": "Afternoon work"
    }
  ]
}
```

#### Response

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

If some entries fail:

```json
{
  "success": true,
  "data": {
    "inserted": 1,
    "failed": 1,
    "errors": [
      {
        "index": 1,
        "error": "End time must be after start time"
      }
    ]
  },
  "message": "Bulk operation completed. Inserted: 1, Failed: 1"
}
```

---

### 4. Get Timesheet by ID

**GET** `/api/v1/timesheets/:id`

Retrieve a single timesheet entry by ID.

#### Path Parameters

- `id`: Timesheet ID (UUID)

#### Response

```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "userId": "223e4567-e89b-12d3-a456-426614174000",
    "taskId": "323e4567-e89b-12d3-a456-426614174000",
    "projectId": "423e4567-e89b-12d3-a456-426614174000",
    "start": "2025-11-07T09:00:00Z",
    "end": "2025-11-07T11:00:00Z",
    "durationHours": 2.0,
    "billable": true,
    "notes": "Implemented header component",
    "costAtTime": 120.00,
    "status": "draft",
    "createdAt": "2025-11-07T09:00:00Z",
    "updatedAt": "2025-11-07T09:00:00Z",
    "deletedAt": null,
    "user": { ... },
    "task": { ... },
    "project": { ... }
  }
}
```

#### Error Response (404)

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

### 5. Update Timesheet

**PUT** `/api/v1/timesheets/:id`

Update an existing timesheet entry.

#### Path Parameters

- `id`: Timesheet ID (UUID)

#### Request Body

All fields are optional. Only provided fields will be updated.

```json
{
  "taskId": "323e4567-e89b-12d3-a456-426614174000",
  "userId": "223e4567-e89b-12d3-a456-426614174000",
  "start": "2025-11-07T09:00:00Z",
  "end": "2025-11-07T12:00:00Z",
  "billable": false,
  "notes": "Updated notes"
}
```

#### Business Rules

- ❌ **Cannot edit** if status is `approved` or `locked`
- ✅ **Recalculates** `durationHours` and `costAtTime` if `start`, `end`, or `userId` changes
- ✅ **Updates** `updatedAt` automatically
- ✅ **Logs** audit event

#### Response

```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "durationHours": 3.0,
    "costAtTime": 180.00,
    ...
  },
  "message": "Timesheet updated successfully"
}
```

#### Error Response (403)

```json
{
  "success": false,
  "error": {
    "message": "Cannot edit timesheet with status: approved. Only draft and submitted timesheets can be edited.",
    "code": "FORBIDDEN"
  }
}
```

---

### 6. Delete Timesheet

**DELETE** `/api/v1/timesheets/:id`

Soft delete a timesheet entry.

#### Path Parameters

- `id`: Timesheet ID (UUID)

#### Business Rules

- ❌ **Cannot delete** if status is `locked`
- ✅ **Soft deletes** by setting `deletedAt` timestamp
- ✅ **Logs** audit event

#### Response

```json
{
  "success": true,
  "message": "Timesheet deleted successfully"
}
```

#### Error Response (403)

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

### 7. Update Timesheet Status

**PATCH** `/api/v1/timesheets/:id/status`

Update the status of a timesheet with workflow validation.

#### Path Parameters

- `id`: Timesheet ID (UUID)

#### Request Body

```json
{
  "status": "submitted"
}
```

#### Valid Status Values

- `draft` - Initial state
- `submitted` - Submitted for approval
- `approved` - Approved by manager
- `locked` - Locked for billing

#### Status Transition Rules

```
draft → submitted → approved → locked
```

- ✅ Forward transitions only
- ❌ No backward transitions
- ❌ Cannot skip states

#### Response

```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "status": "submitted",
    ...
  },
  "message": "Timesheet status updated to submitted"
}
```

#### Error Response (400)

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

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": { ... }
  }
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 403 | Forbidden (operation not allowed) |
| 404 | Not Found |
| 409 | Conflict (duplicate entry) |
| 500 | Internal Server Error |

### Error Codes

- `VALIDATION_ERROR` - Invalid input data
- `NOT_FOUND` - Resource not found
- `FORBIDDEN` - Action not allowed
- `DUPLICATE_ENTRY` - Unique constraint violation
- `FOREIGN_KEY_VIOLATION` - Related record not found
- `INTERNAL_ERROR` - Server error

---

## Data Model

### Timesheet Object

```typescript
{
  id: string                 // UUID
  userId: string            // UUID - User who logged the time
  taskId: string            // UUID - Task being worked on
  projectId: string         // UUID - Project (derived from task)
  start: string             // ISO 8601 datetime
  end: string               // ISO 8601 datetime
  durationHours: number     // Calculated: (end - start) / 3600000
  billable: boolean         // Whether this time is billable
  notes?: string            // Optional notes
  costAtTime: number        // Calculated: hourlyRate * durationHours
  status: string            // draft | submitted | approved | locked
  createdAt: string         // ISO 8601 datetime
  updatedAt: string         // ISO 8601 datetime
  deletedAt?: string        // ISO 8601 datetime (null if not deleted)
  
  // Relations
  user: {
    id: string
    name: string
    email: string
    hourlyRate: number
  }
  task: {
    id: string
    title: string
    status: string
  }
  project: {
    id: string
    name: string
    code: string
  }
}
```

---

## Performance Considerations

### Indexes

The following indexes are automatically created for optimal query performance:

- `timesheets(projectId, createdAt)` - For project-based filtering
- `timesheets(userId, createdAt)` - For user-based filtering
- `timesheets(taskId)` - For task-based filtering
- `timesheets(status)` - For status filtering

### Pagination

- Default page size: 20
- Maximum page size: 100
- Use pagination for large result sets to maintain performance

### N+1 Query Prevention

All list endpoints use Prisma's `include` to fetch related data in a single query, preventing N+1 query problems.

---

## Future Enhancements

- 🔐 **Authentication**: JWT-based authentication with `myTimesheets=true` auto-filtering
- 📊 **Analytics**: Timesheet aggregation and reporting endpoints
- 💰 **Billing Integration**: Mark timesheets as invoiced
- 🔔 **Notifications**: Email/webhook notifications on status changes
- 📅 **Calendar Integration**: Export timesheets to calendar formats

---

## Testing Examples

### Using cURL

```bash
# List timesheets
curl "http://localhost:3000/api/v1/timesheets?page=1&pageSize=10"

# Create timesheet
curl -X POST http://localhost:3000/api/v1/timesheets \
  -H "Content-Type: application/json" \
  -d '{
    "taskId": "323e4567-e89b-12d3-a456-426614174000",
    "userId": "223e4567-e89b-12d3-a456-426614174000",
    "start": "2025-11-07T09:00:00Z",
    "end": "2025-11-07T11:00:00Z",
    "billable": true,
    "notes": "Work done"
  }'

# Update timesheet
curl -X PUT http://localhost:3000/api/v1/timesheets/123e4567-e89b-12d3-a456-426614174000 \
  -H "Content-Type: application/json" \
  -d '{"notes": "Updated notes"}'

# Update status
curl -X PATCH http://localhost:3000/api/v1/timesheets/123e4567-e89b-12d3-a456-426614174000/status \
  -H "Content-Type: application/json" \
  -d '{"status": "submitted"}'

# Delete timesheet
curl -X DELETE http://localhost:3000/api/v1/timesheets/123e4567-e89b-12d3-a456-426614174000
```

---

## Support

For issues or questions, please refer to the main project documentation or open an issue in the repository.
