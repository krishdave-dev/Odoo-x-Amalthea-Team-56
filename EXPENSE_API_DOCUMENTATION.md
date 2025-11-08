# 🧾 Expense Management API Documentation

## Overview

The Expense Management module provides a complete workflow for employees to submit expenses, managers to approve/reject them, and finance teams to process payments. The system implements enterprise-grade features including:

- **State Machine Workflow**: Enforced status transitions (draft → submitted → approved → paid)
- **Role-Based Access Control (RBAC)**: Different permissions based on user roles
- **Audit Logging**: Complete traceability of all expense lifecycle events
- **Soft Deletes**: Non-destructive deletion with recovery capability
- **Receipt Management**: Integration with Cloudinary for receipt uploads

---

## Expense Status Flow

```
┌─────────┐
│  DRAFT  │ ──submit──> ┌───────────┐
└─────────┘             │ SUBMITTED │
                        └───────────┘
                             │
                    ┌────────┴────────┐
                    │                 │
                approve            reject
                    │                 │
                    ▼                 ▼
              ┌──────────┐      ┌──────────┐
              │ APPROVED │      │ REJECTED │
              └──────────┘      └──────────┘
                    │
                   pay
                    │
                    ▼
              ┌──────────┐
              │   PAID   │
              └──────────┘
```

---

## Role-Based Access Control

### User Roles

| Role              | Create | Edit Own | Submit | Approve | Reject | Pay | Delete Own |
|-------------------|--------|----------|--------|---------|--------|-----|------------|
| **employee**      | ✅     | ✅       | ✅     | ❌      | ❌     | ❌  | ✅         |
| **manager**       | ✅     | ✅       | ✅     | ✅      | ✅     | ❌  | ✅         |
| **project_manager**| ✅    | ✅       | ✅     | ✅      | ✅     | ❌  | ✅         |
| **finance**       | ✅     | ✅       | ✅     | ❌      | ❌     | ✅  | ✅         |
| **admin**         | ✅     | ✅       | ✅     | ✅      | ✅     | ✅  | ✅         |

### Permission Rules

1. **Create**: Any active user can create expenses
2. **Edit**: Only allowed in `draft` status, by owner or admin
3. **Submit**: Only expense owner can submit
4. **Approve**: Managers, project managers, and admins only
5. **Reject**: Managers, project managers, and admins only
6. **Pay**: Finance and admin roles only
7. **Delete**: Owner or admin, cannot delete `paid` expenses

---

## API Endpoints

### Base URL
```
/api/expenses
```

---

## 📋 List Expenses

**GET** `/api/expenses`

Fetch expenses with filters and pagination.

### Query Parameters

| Parameter        | Type    | Required | Description                          |
|-----------------|---------|----------|--------------------------------------|
| organizationId  | number  | ✅       | Organization ID                      |
| page            | number  | ❌       | Page number (default: 1)             |
| pageSize        | number  | ❌       | Items per page (default: 25)         |
| status          | string  | ❌       | Filter by status                     |
| userId          | number  | ❌       | Filter by user                       |
| projectId       | number  | ❌       | Filter by project                    |
| billable        | boolean | ❌       | Filter by billable flag              |
| startDate       | string  | ❌       | Filter by date range (ISO 8601)      |
| endDate         | string  | ❌       | Filter by date range (ISO 8601)      |
| minAmount       | number  | ❌       | Minimum expense amount               |
| maxAmount       | number  | ❌       | Maximum expense amount               |

### Example Request

```bash
curl -X GET "http://localhost:3000/api/expenses?organizationId=1&status=submitted&page=1&pageSize=10"
```

### Response

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "organizationId": 1,
      "projectId": 5,
      "userId": 10,
      "amount": "1250.00",
      "billable": true,
      "status": "submitted",
      "receiptUrl": "https://res.cloudinary.com/...",
      "note": "Client dinner meeting",
      "rejectionReason": null,
      "approvedBy": null,
      "createdAt": "2025-11-01T10:30:00Z",
      "updatedAt": "2025-11-01T10:30:00Z",
      "submittedAt": "2025-11-01T10:35:00Z",
      "approvedAt": null,
      "paidAt": null,
      "deletedAt": null,
      "user": {
        "id": 10,
        "name": "John Doe",
        "email": "john@example.com",
        "role": "employee"
      },
      "project": {
        "id": 5,
        "name": "Website Redesign",
        "code": "WEB-001"
      }
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 10,
    "total": 45,
    "totalPages": 5
  }
}
```

---

## ➕ Create Expense

**POST** `/api/expenses`

Create a new expense (status: `draft`).

### Request Body

```json
{
  "organizationId": 1,
  "projectId": 5,
  "userId": 10,
  "amount": 1250.00,
  "billable": true,
  "note": "Client dinner meeting",
  "receiptUrl": "https://res.cloudinary.com/..."
}
```

### Fields

| Field          | Type    | Required | Description                          |
|----------------|---------|----------|--------------------------------------|
| organizationId | number  | ✅       | Organization ID                      |
| projectId      | number  | ❌       | Associated project                   |
| userId         | number  | ❌       | Expense owner (defaults to creator)  |
| amount         | number  | ✅       | Expense amount (positive)            |
| billable       | boolean | ❌       | Billable to client (default: false)  |
| note           | string  | ❌       | Description (max 1000 chars)         |
| receiptUrl     | string  | ❌       | Cloudinary URL for receipt           |

### Example Request

```bash
curl -X POST "http://localhost:3000/api/expenses" \
  -H "Content-Type: application/json" \
  -d '{
    "organizationId": 1,
    "projectId": 5,
    "amount": 1250.00,
    "billable": true,
    "note": "Client dinner meeting"
  }'
```

### Response (201 Created)

```json
{
  "success": true,
  "data": {
    "id": 42,
    "organizationId": 1,
    "projectId": 5,
    "userId": 10,
    "amount": "1250.00",
    "billable": true,
    "status": "draft",
    "receiptUrl": null,
    "note": "Client dinner meeting",
    "createdAt": "2025-11-08T14:30:00Z",
    "updatedAt": "2025-11-08T14:30:00Z"
  }
}
```

---

## 🔍 Get Single Expense

**GET** `/api/expenses/{id}`

Retrieve detailed information about a specific expense.

### URL Parameters

| Parameter      | Type   | Description     |
|---------------|--------|-----------------|
| id            | number | Expense ID      |

### Query Parameters

| Parameter        | Type   | Required | Description         |
|-----------------|--------|----------|---------------------|
| organizationId  | number | ✅       | Organization ID     |

### Example Request

```bash
curl -X GET "http://localhost:3000/api/expenses/42?organizationId=1"
```

### Response

```json
{
  "success": true,
  "data": {
    "id": 42,
    "organizationId": 1,
    "projectId": 5,
    "userId": 10,
    "amount": "1250.00",
    "billable": true,
    "status": "approved",
    "receiptUrl": "https://res.cloudinary.com/...",
    "note": "Client dinner meeting",
    "rejectionReason": null,
    "approvedBy": 3,
    "createdAt": "2025-11-08T14:30:00Z",
    "updatedAt": "2025-11-08T15:00:00Z",
    "submittedAt": "2025-11-08T14:35:00Z",
    "approvedAt": "2025-11-08T15:00:00Z",
    "paidAt": null,
    "user": {
      "id": 10,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "employee"
    },
    "project": {
      "id": 5,
      "name": "Website Redesign",
      "code": "WEB-001"
    }
  }
}
```

---

## 📤 Submit Expense

**POST** `/api/expenses/{id}/submit`

Submit expense for approval (draft → submitted).

### Authorization
- Must be expense owner

### URL Parameters

| Parameter | Type   | Description |
|-----------|--------|-------------|
| id        | number | Expense ID  |

### Query Parameters

| Parameter        | Type   | Required | Description     |
|-----------------|--------|----------|-----------------|
| organizationId  | number | ✅       | Organization ID |
| userId          | number | ✅       | User ID         |

### Example Request

```bash
curl -X POST "http://localhost:3000/api/expenses/42/submit?organizationId=1&userId=10"
```

### Response

```json
{
  "success": true,
  "data": {
    "id": 42,
    "status": "submitted",
    "submittedAt": "2025-11-08T14:35:00Z",
    "updatedAt": "2025-11-08T14:35:00Z"
  }
}
```

---

## ✅ Approve Expense

**POST** `/api/expenses/{id}/approve`

Approve expense (submitted → approved).

### Authorization
- Requires role: `manager`, `project_manager`, or `admin`

### URL Parameters

| Parameter | Type   | Description |
|-----------|--------|-------------|
| id        | number | Expense ID  |

### Query Parameters

| Parameter        | Type   | Required | Description     |
|-----------------|--------|----------|-----------------|
| organizationId  | number | ✅       | Organization ID |
| userId          | number | ✅       | Approver ID     |

### Example Request

```bash
curl -X POST "http://localhost:3000/api/expenses/42/approve?organizationId=1&userId=3"
```

### Response

```json
{
  "success": true,
  "data": {
    "id": 42,
    "status": "approved",
    "approvedBy": 3,
    "approvedAt": "2025-11-08T15:00:00Z",
    "updatedAt": "2025-11-08T15:00:00Z"
  }
}
```

---

## ❌ Reject Expense

**POST** `/api/expenses/{id}/reject`

Reject expense (submitted → rejected).

### Authorization
- Requires role: `manager`, `project_manager`, or `admin`

### URL Parameters

| Parameter | Type   | Description |
|-----------|--------|-------------|
| id        | number | Expense ID  |

### Query Parameters

| Parameter        | Type   | Required | Description     |
|-----------------|--------|----------|-----------------|
| organizationId  | number | ✅       | Organization ID |
| userId          | number | ✅       | Rejector ID     |

### Request Body (Optional)

```json
{
  "reason": "Missing receipt or insufficient documentation"
}
```

### Example Request

```bash
curl -X POST "http://localhost:3000/api/expenses/42/reject?organizationId=1&userId=3" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Missing receipt or insufficient documentation"
  }'
```

### Response

```json
{
  "success": true,
  "data": {
    "id": 42,
    "status": "rejected",
    "rejectionReason": "Missing receipt or insufficient documentation",
    "updatedAt": "2025-11-08T15:10:00Z"
  }
}
```

---

## 💰 Mark as Paid

**POST** `/api/expenses/{id}/pay`

Mark expense as paid (approved → paid).

### Authorization
- Requires role: `finance` or `admin`

### URL Parameters

| Parameter | Type   | Description |
|-----------|--------|-------------|
| id        | number | Expense ID  |

### Query Parameters

| Parameter        | Type   | Required | Description     |
|-----------------|--------|----------|-----------------|
| organizationId  | number | ✅       | Organization ID |
| userId          | number | ✅       | Finance user ID |

### Example Request

```bash
curl -X POST "http://localhost:3000/api/expenses/42/pay?organizationId=1&userId=8"
```

### Response

```json
{
  "success": true,
  "data": {
    "id": 42,
    "status": "paid",
    "paidAt": "2025-11-08T16:00:00Z",
    "updatedAt": "2025-11-08T16:00:00Z"
  }
}
```

---

## 🗑️ Delete Expense

**DELETE** `/api/expenses/{id}`

Soft delete an expense (sets `deletedAt` timestamp).

### Authorization
- Expense owner or admin
- Cannot delete `paid` expenses

### URL Parameters

| Parameter | Type   | Description |
|-----------|--------|-------------|
| id        | number | Expense ID  |

### Query Parameters

| Parameter        | Type   | Required | Description     |
|-----------------|--------|----------|-----------------|
| organizationId  | number | ✅       | Organization ID |
| userId          | number | ✅       | User ID         |

### Example Request

```bash
curl -X DELETE "http://localhost:3000/api/expenses/42?organizationId=1&userId=10"
```

### Response

```json
{
  "success": true,
  "data": {
    "message": "Expense deleted successfully"
  }
}
```

---

## 🔄 State Transition Rules

### Valid Transitions

| From Status | To Status   | Action   | Required Role                    |
|------------|-------------|----------|----------------------------------|
| draft      | submitted   | submit   | Owner                            |
| submitted  | approved    | approve  | manager, project_manager, admin  |
| submitted  | rejected    | reject   | manager, project_manager, admin  |
| approved   | paid        | pay      | finance, admin                   |

### Constraints

1. **Draft → Submitted**: Only expense owner can submit
2. **Submitted → Approved/Rejected**: Only managers/admins
3. **Approved → Paid**: Only finance/admin
4. **No Backward Transitions**: Cannot revert to previous states
5. **Final States**: `rejected` and `paid` are terminal states
6. **Edit Lock**: Only `draft` expenses can be edited

---

## 📊 Audit Logging

All expense lifecycle events are logged to the `events` table:

### Event Types

| Event Type         | Triggered By          | Payload Includes                    |
|--------------------|-----------------------|-------------------------------------|
| EXPENSE_CREATED    | POST /expenses        | amount, userId, projectId, billable |
| EXPENSE_UPDATED    | PATCH /expenses/{id}  | changes                             |
| EXPENSE_SUBMITTED  | POST submit           | submittedBy, amount, projectId      |
| EXPENSE_APPROVED   | POST approve          | approvedBy, amount, userId          |
| EXPENSE_REJECTED   | POST reject           | rejectedBy, reason, amount          |
| EXPENSE_PAID       | POST pay              | paidBy, amount, userId              |
| EXPENSE_DELETED    | DELETE /expenses/{id} | deletedBy, amount                   |

### Example Event Log Query

```sql
SELECT * FROM events 
WHERE entity_type = 'expense' 
  AND entity_id = 42 
ORDER BY created_at DESC;
```

---

## 🔗 Receipt Upload Integration

### Using Cloudinary

1. **Upload receipt** to Cloudinary via `/api/attachments/upload`
2. **Get Cloudinary URL** from response
3. **Include URL** in expense creation or update

### Example Workflow

```bash
# Step 1: Upload receipt
curl -X POST "http://localhost:3000/api/attachments/upload" \
  -F "file=@receipt.jpg" \
  -F "organizationId=1" \
  -F "ownerType=expense"

# Response includes cloudUrl
{
  "success": true,
  "data": {
    "cloudUrl": "https://res.cloudinary.com/..."
  }
}

# Step 2: Create expense with receipt URL
curl -X POST "http://localhost:3000/api/expenses" \
  -H "Content-Type: application/json" \
  -d '{
    "organizationId": 1,
    "amount": 1250.00,
    "receiptUrl": "https://res.cloudinary.com/..."
  }'
```

---

## ⚠️ Error Responses

### Validation Error (400)

```json
{
  "success": false,
  "error": {
    "message": "Validation error",
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "code": "too_small",
        "minimum": 0,
        "type": "number",
        "inclusive": false,
        "message": "Amount must be positive",
        "path": ["amount"]
      }
    ]
  }
}
```

### Permission Error (403)

```json
{
  "success": false,
  "error": {
    "message": "User role 'employee' is not authorized. Required: manager, project_manager, admin",
    "code": "FORBIDDEN"
  }
}
```

### State Transition Error (400)

```json
{
  "success": false,
  "error": {
    "message": "Cannot transition from 'paid' to 'approved'",
    "code": "INTERNAL_ERROR"
  }
}
```

### Not Found Error (404)

```json
{
  "success": false,
  "error": {
    "message": "Expense not found",
    "code": "NOT_FOUND"
  }
}
```

---

## 📈 Statistics & Reporting

### Get Expense Stats

While not a dedicated endpoint yet, you can use the ExpenseService directly:

```typescript
import { expenseService } from '@/services/expense.service'

const stats = await expenseService.getExpenseStats({
  organizationId: 1,
  projectId: 5,
  startDate: new Date('2025-01-01'),
  endDate: new Date('2025-12-31')
})

// Returns:
// {
//   byStatus: [ { status: 'paid', _count: 45, _sum: { amount: 125000 } } ],
//   totals: { _count: 120, _sum: { amount: 350000 }, _avg: { amount: 2916.67 } },
//   byBillable: [ { billable: true, _count: 80, _sum: { amount: 280000 } } ]
// }
```

---

## 🧪 Testing with PowerShell

### Create Organization & User First

```powershell
# Create organization
$orgBody = @{
    name = "Test Company"
    currency = "USD"
} | ConvertTo-Json

$org = Invoke-RestMethod -Uri "http://localhost:3000/api/organizations" `
  -Method POST -Body $orgBody -ContentType "application/json"

# Create user
$userBody = @{
    organizationId = $org.data.id
    email = "employee@test.com"
    name = "John Employee"
    role = "employee"
} | ConvertTo-Json

$user = Invoke-RestMethod -Uri "http://localhost:3000/api/users" `
  -Method POST -Body $userBody -ContentType "application/json"
```

### Test Expense Workflow

```powershell
$orgId = $org.data.id
$userId = $user.data.id

# 1. Create expense
$expenseBody = @{
    organizationId = $orgId
    userId = $userId
    amount = 1250.00
    billable = $true
    note = "Client dinner"
} | ConvertTo-Json

$expense = Invoke-RestMethod -Uri "http://localhost:3000/api/expenses" `
  -Method POST -Body $expenseBody -ContentType "application/json"

$expenseId = $expense.data.id

# 2. Submit for approval
Invoke-RestMethod -Uri "http://localhost:3000/api/expenses/$expenseId/submit?organizationId=$orgId&userId=$userId" `
  -Method POST

# 3. Approve (create manager user first)
$managerBody = @{
    organizationId = $orgId
    email = "manager@test.com"
    name = "Jane Manager"
    role = "manager"
} | ConvertTo-Json

$manager = Invoke-RestMethod -Uri "http://localhost:3000/api/users" `
  -Method POST -Body $managerBody -ContentType "application/json"

$managerId = $manager.data.id

Invoke-RestMethod -Uri "http://localhost:3000/api/expenses/$expenseId/approve?organizationId=$orgId&userId=$managerId" `
  -Method POST

# 4. Mark as paid (create finance user first)
$financeBody = @{
    organizationId = $orgId
    email = "finance@test.com"
    name = "Bob Finance"
    role = "finance"
} | ConvertTo-Json

$finance = Invoke-RestMethod -Uri "http://localhost:3000/api/users" `
  -Method POST -Body $financeBody -ContentType "application/json"

$financeId = $finance.data.id

Invoke-RestMethod -Uri "http://localhost:3000/api/expenses/$expenseId/pay?organizationId=$orgId&userId=$financeId" `
  -Method POST

# 5. Get final expense
Invoke-RestMethod -Uri "http://localhost:3000/api/expenses/$expenseId?organizationId=$orgId" `
  -Method GET
```

---

## 🎯 Best Practices

1. **Always Upload Receipts**: Include receipt URLs for audit compliance
2. **Add Descriptive Notes**: Help approvers understand the expense context
3. **Link to Projects**: Associate billable expenses with projects
4. **Timely Submission**: Submit expenses within your organization's policy window
5. **Check Status**: Verify expense status before attempting transitions
6. **Handle Rejections**: Read rejection reasons and resubmit with corrections

---

## 🔮 Future Enhancements

- [ ] Multi-level approval workflows
- [ ] Expense categories and tags
- [ ] Budget limit enforcement
- [ ] Email/Slack notifications on status changes
- [ ] Expense report generation (PDF/Excel)
- [ ] Currency conversion for multi-currency organizations
- [ ] Mileage and per-diem expense types
- [ ] Integration with vendor bills for reimbursements
- [ ] Mobile app support for receipt capture
- [ ] OCR for automatic receipt data extraction

---

## 📝 Database Schema

```sql
CREATE TABLE expenses (
  expense_id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(organization_id) ON DELETE CASCADE,
  project_id INTEGER REFERENCES projects(project_id),
  user_id INTEGER REFERENCES users(user_id),
  amount DECIMAL(12, 2) NOT NULL,
  billable BOOLEAN DEFAULT false,
  status VARCHAR NOT NULL DEFAULT 'draft',
  receipt_url VARCHAR,
  note TEXT,
  rejection_reason VARCHAR,
  approved_by INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

CREATE INDEX ix_expenses_proj_status ON expenses(project_id, status);
CREATE INDEX ix_expenses_org_status ON expenses(organization_id, status);
CREATE INDEX ix_expenses_user_status ON expenses(user_id, status);
```

---

## 📞 Support

For issues or questions:
- GitHub Issues: [Create an issue](https://github.com/your-repo/issues)
- Email: support@yourcompany.com
- Slack: #expense-management

---

**Last Updated**: November 8, 2025  
**API Version**: 1.0.0
