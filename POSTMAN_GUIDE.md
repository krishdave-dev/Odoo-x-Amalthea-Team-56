# 📮 Postman Testing Guide - Timesheet API

Complete guide to test all Timesheet API endpoints using Postman.

---

## 📋 Table of Contents

1. [Setup Postman Collection](#setup-postman-collection)
2. [Environment Variables](#environment-variables)
3. [All API Requests](#all-api-requests)
4. [Testing Workflow](#testing-workflow)
5. [Postman Collection JSON](#postman-collection-json)

---

## Setup Postman Collection

### Method 1: Import JSON (Recommended)

1. Copy the [Postman Collection JSON](#postman-collection-json) at the bottom of this file
2. Open Postman
3. Click **Import** button (top left)
4. Select **Raw text** tab
5. Paste the JSON
6. Click **Import**

### Method 2: Manual Setup

Follow the steps below to create each request manually.

---

## Environment Variables

### Create a New Environment

1. Click **Environments** (left sidebar)
2. Click **+** to create new environment
3. Name it: `Timesheet API - Local`
4. Add these variables:

| Variable | Initial Value | Current Value |
|----------|---------------|---------------|
| `base_url` | `http://localhost:3000` | `http://localhost:3000` |
| `api_version` | `v1` | `v1` |
| `task_id` | *(leave empty)* | *(will be set from Prisma Studio)* |
| `user_id` | *(leave empty)* | *(will be set from Prisma Studio)* |
| `project_id` | *(leave empty)* | *(will be set from Prisma Studio)* |
| `timesheet_id` | *(leave empty)* | *(auto-set by tests)* |

5. Click **Save**
6. Select this environment from the dropdown (top right)

### Get Sample IDs

**Open Prisma Studio:**
```bash
npm run db:studio
```

Navigate to **http://localhost:5555** and copy IDs:

1. Go to `users` table → Copy any `id` → Paste into `user_id` variable
2. Go to `tasks` table → Copy any `id` → Paste into `task_id` variable
3. Go to `projects` table → Copy any `id` → Paste into `project_id` variable
4. Click **Save** in environment

---

## All API Requests

### 📁 Create a Collection

1. Click **Collections** (left sidebar)
2. Click **+** to create collection
3. Name it: `Timesheet API`
4. Click **Save**

---

### Request 1: List All Timesheets

**Name:** `List All Timesheets`

**Method:** `GET`

**URL:** `{{base_url}}/api/{{api_version}}/timesheets`

**Query Params:**
| Key | Value | Description |
|-----|-------|-------------|
| `page` | `1` | Page number |
| `pageSize` | `10` | Items per page |

**Tests Script:**
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response is success", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.success).to.be.true;
});

pm.test("Has pagination", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data.pagination).to.exist;
    pm.expect(jsonData.data.data).to.be.an('array');
});

// Save first timesheet ID for later tests
pm.test("Save timesheet ID", function () {
    var jsonData = pm.response.json();
    if (jsonData.data.data.length > 0) {
        pm.environment.set("timesheet_id", jsonData.data.data[0].id);
        console.log("Saved timesheet ID:", jsonData.data.data[0].id);
    }
});
```

---

### Request 2: Filter by Project

**Name:** `Filter by Project`

**Method:** `GET`

**URL:** `{{base_url}}/api/{{api_version}}/timesheets`

**Query Params:**
| Key | Value |
|-----|-------|
| `projectId` | `{{project_id}}` |
| `page` | `1` |
| `pageSize` | `10` |

**Tests Script:**
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("All results match project filter", function () {
    var jsonData = pm.response.json();
    jsonData.data.data.forEach(function(timesheet) {
        pm.expect(timesheet.projectId).to.eql(pm.environment.get("project_id"));
    });
});
```

---

### Request 3: Filter by Status

**Name:** `Filter by Status (Draft)`

**Method:** `GET`

**URL:** `{{base_url}}/api/{{api_version}}/timesheets`

**Query Params:**
| Key | Value |
|-----|-------|
| `status` | `draft` |
| `page` | `1` |
| `pageSize` | `10` |

**Tests Script:**
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("All results have draft status", function () {
    var jsonData = pm.response.json();
    jsonData.data.data.forEach(function(timesheet) {
        pm.expect(timesheet.status).to.eql("draft");
    });
});
```

---

### Request 4: Filter by Date Range

**Name:** `Filter by Date Range`

**Method:** `GET`

**URL:** `{{base_url}}/api/{{api_version}}/timesheets`

**Query Params:**
| Key | Value |
|-----|-------|
| `from` | `2025-01-01T00:00:00Z` |
| `to` | `2025-12-31T23:59:59Z` |
| `page` | `1` |
| `pageSize` | `20` |

**Tests Script:**
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Results are within date range", function () {
    var jsonData = pm.response.json();
    var fromDate = new Date("2025-01-01T00:00:00Z");
    var toDate = new Date("2025-12-31T23:59:59Z");
    
    jsonData.data.data.forEach(function(timesheet) {
        var startDate = new Date(timesheet.start);
        pm.expect(startDate.getTime()).to.be.at.least(fromDate.getTime());
        pm.expect(startDate.getTime()).to.be.at.most(toDate.getTime());
    });
});
```

---

### Request 5: Create Timesheet

**Name:** `Create Timesheet`

**Method:** `POST`

**URL:** `{{base_url}}/api/{{api_version}}/timesheets`

**Headers:**
| Key | Value |
|-----|-------|
| `Content-Type` | `application/json` |

**Body (raw JSON):**
```json
{
  "taskId": "{{task_id}}",
  "userId": "{{user_id}}",
  "start": "2025-11-08T09:00:00Z",
  "end": "2025-11-08T12:00:00Z",
  "billable": true,
  "notes": "Testing via Postman - Morning work"
}
```

**Pre-request Script:**
```javascript
// Generate current datetime for start
var now = new Date();
var startTime = new Date(now.getTime());
startTime.setHours(9, 0, 0, 0);

var endTime = new Date(now.getTime());
endTime.setHours(17, 0, 0, 0);

pm.environment.set("test_start_time", startTime.toISOString());
pm.environment.set("test_end_time", endTime.toISOString());

console.log("Start:", startTime.toISOString());
console.log("End:", endTime.toISOString());
```

**Tests Script:**
```javascript
pm.test("Status code is 201", function () {
    pm.response.to.have.status(201);
});

pm.test("Response is success", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.success).to.be.true;
});

pm.test("Timesheet created with correct data", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data.id).to.exist;
    pm.expect(jsonData.data.userId).to.eql(pm.environment.get("user_id"));
    pm.expect(jsonData.data.taskId).to.eql(pm.environment.get("task_id"));
    pm.expect(jsonData.data.status).to.eql("draft");
    pm.expect(jsonData.data.billable).to.be.true;
});

pm.test("Duration calculated correctly", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data.durationHours).to.exist;
    pm.expect(parseFloat(jsonData.data.durationHours)).to.be.above(0);
});

pm.test("Cost calculated", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data.costAtTime).to.exist;
    pm.expect(parseFloat(jsonData.data.costAtTime)).to.be.above(0);
});

// Save the new timesheet ID
pm.test("Save created timesheet ID", function () {
    var jsonData = pm.response.json();
    pm.environment.set("timesheet_id", jsonData.data.id);
    console.log("Created timesheet ID:", jsonData.data.id);
});
```

---

### Request 6: Bulk Create Timesheets

**Name:** `Bulk Create Timesheets`

**Method:** `POST`

**URL:** `{{base_url}}/api/{{api_version}}/timesheets`

**Headers:**
| Key | Value |
|-----|-------|
| `Content-Type` | `application/json` |

**Body (raw JSON):**
```json
{
  "entries": [
    {
      "taskId": "{{task_id}}",
      "userId": "{{user_id}}",
      "start": "2025-11-08T09:00:00Z",
      "end": "2025-11-08T12:00:00Z",
      "billable": true,
      "notes": "Bulk entry 1 - Morning session"
    },
    {
      "taskId": "{{task_id}}",
      "userId": "{{user_id}}",
      "start": "2025-11-08T13:00:00Z",
      "end": "2025-11-08T17:00:00Z",
      "billable": true,
      "notes": "Bulk entry 2 - Afternoon session"
    }
  ]
}
```

**Tests Script:**
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Bulk operation succeeded", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.success).to.be.true;
    pm.expect(jsonData.data.inserted).to.eql(2);
    pm.expect(jsonData.data.failed).to.eql(0);
});

pm.test("No errors in bulk operation", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data.errors).to.be.an('array').that.is.empty;
});
```

---

### Request 7: Get Timesheet by ID

**Name:** `Get Timesheet by ID`

**Method:** `GET`

**URL:** `{{base_url}}/api/{{api_version}}/timesheets/{{timesheet_id}}`

**Tests Script:**
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response contains timesheet data", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.success).to.be.true;
    pm.expect(jsonData.data.id).to.eql(pm.environment.get("timesheet_id"));
});

pm.test("Contains user relation", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data.user).to.exist;
    pm.expect(jsonData.data.user.id).to.exist;
    pm.expect(jsonData.data.user.name).to.exist;
});

pm.test("Contains task relation", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data.task).to.exist;
    pm.expect(jsonData.data.task.id).to.exist;
});

pm.test("Contains project relation", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data.project).to.exist;
    pm.expect(jsonData.data.project.id).to.exist;
});
```

---

### Request 8: Update Timesheet

**Name:** `Update Timesheet`

**Method:** `PUT`

**URL:** `{{base_url}}/api/{{api_version}}/timesheets/{{timesheet_id}}`

**Headers:**
| Key | Value |
|-----|-------|
| `Content-Type` | `application/json` |

**Body (raw JSON):**
```json
{
  "notes": "Updated via Postman - Work completed",
  "end": "2025-11-08T13:00:00Z"
}
```

**Tests Script:**
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Timesheet updated successfully", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.success).to.be.true;
    pm.expect(jsonData.data.notes).to.include("Updated via Postman");
});

pm.test("Duration recalculated", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data.durationHours).to.exist;
    console.log("New duration:", jsonData.data.durationHours, "hours");
});

pm.test("Cost recalculated", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data.costAtTime).to.exist;
    console.log("New cost:", jsonData.data.costAtTime);
});
```

---

### Request 9: Submit Timesheet (Draft → Submitted)

**Name:** `Submit Timesheet`

**Method:** `PATCH`

**URL:** `{{base_url}}/api/{{api_version}}/timesheets/{{timesheet_id}}/status`

**Headers:**
| Key | Value |
|-----|-------|
| `Content-Type` | `application/json` |

**Body (raw JSON):**
```json
{
  "status": "submitted"
}
```

**Tests Script:**
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Status updated to submitted", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.success).to.be.true;
    pm.expect(jsonData.data.status).to.eql("submitted");
});

pm.test("Message confirms status change", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.message).to.include("submitted");
});
```

---

### Request 10: Approve Timesheet (Submitted → Approved)

**Name:** `Approve Timesheet`

**Method:** `PATCH`

**URL:** `{{base_url}}/api/{{api_version}}/timesheets/{{timesheet_id}}/status`

**Headers:**
| Key | Value |
|-----|-------|
| `Content-Type` | `application/json` |

**Body (raw JSON):**
```json
{
  "status": "approved"
}
```

**Tests Script:**
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Status updated to approved", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.success).to.be.true;
    pm.expect(jsonData.data.status).to.eql("approved");
});
```

---

### Request 11: Lock Timesheet (Approved → Locked)

**Name:** `Lock Timesheet`

**Method:** `PATCH`

**URL:** `{{base_url}}/api/{{api_version}}/timesheets/{{timesheet_id}}/status`

**Headers:**
| Key | Value |
|-----|-------|
| `Content-Type` | `application/json` |

**Body (raw JSON):**
```json
{
  "status": "locked"
}
```

**Tests Script:**
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Status updated to locked", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.success).to.be.true;
    pm.expect(jsonData.data.status).to.eql("locked");
});
```

---

### Request 12: Try to Edit Locked Timesheet (Should Fail)

**Name:** `Try to Edit Locked (Error Test)`

**Method:** `PUT`

**URL:** `{{base_url}}/api/{{api_version}}/timesheets/{{timesheet_id}}`

**Headers:**
| Key | Value |
|-----|-------|
| `Content-Type` | `application/json` |

**Body (raw JSON):**
```json
{
  "notes": "This should fail"
}
```

**Tests Script:**
```javascript
pm.test("Status code is 403", function () {
    pm.response.to.have.status(403);
});

pm.test("Error message for locked timesheet", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.success).to.be.false;
    pm.expect(jsonData.error.code).to.eql("FORBIDDEN");
    pm.expect(jsonData.error.message).to.include("Cannot edit");
});
```

---

### Request 13: Try Invalid Status Transition (Should Fail)

**Name:** `Invalid Transition (Error Test)`

**Method:** `PATCH`

**URL:** `{{base_url}}/api/{{api_version}}/timesheets/{{timesheet_id}}/status`

**Headers:**
| Key | Value |
|-----|-------|
| `Content-Type` | `application/json` |

**Body (raw JSON):**
```json
{
  "status": "draft"
}
```

**Tests Script:**
```javascript
pm.test("Status code is 400", function () {
    pm.response.to.have.status(400);
});

pm.test("Error message for invalid transition", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.success).to.be.false;
    pm.expect(jsonData.error.code).to.eql("VALIDATION_ERROR");
    pm.expect(jsonData.error.message).to.include("Invalid status transition");
});
```

---

### Request 14: Delete Timesheet

**Name:** `Delete Timesheet`

**Method:** `DELETE`

**URL:** `{{base_url}}/api/{{api_version}}/timesheets/{{timesheet_id}}`

**Tests Script:**
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Deletion successful", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.success).to.be.true;
    pm.expect(jsonData.message).to.include("deleted successfully");
});
```

---

### Request 15: Verify Deletion (Should Return 404)

**Name:** `Verify Deletion (Error Test)`

**Method:** `GET`

**URL:** `{{base_url}}/api/{{api_version}}/timesheets/{{timesheet_id}}`

**Tests Script:**
```javascript
pm.test("Status code is 404", function () {
    pm.response.to.have.status(404);
});

pm.test("Not found error", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.success).to.be.false;
    pm.expect(jsonData.error.code).to.eql("NOT_FOUND");
});
```

---

## Testing Workflow

### Complete Test Sequence

Run requests in this order for a complete workflow test:

1. **List All Timesheets** - Get overview
2. **Create Timesheet** - Create new entry (saves ID)
3. **Get Timesheet by ID** - Verify creation
4. **Update Timesheet** - Modify notes and time
5. **Submit Timesheet** - Change status to submitted
6. **Approve Timesheet** - Change status to approved
7. **Try to Edit Locked** - Verify cannot edit approved
8. **Lock Timesheet** - Change status to locked
9. **Try to Edit Locked** - Verify cannot edit locked
10. **Try Invalid Transition** - Test backward transition (should fail)
11. **Delete Timesheet** - Should fail (locked)
12. Create another timesheet (draft status)
13. **Delete Timesheet** - Should succeed (draft)
14. **Verify Deletion** - Confirm it's gone

### Using Collection Runner

1. Click on collection **"Timesheet API"**
2. Click **Run** (top right)
3. Select all requests or specific ones
4. Click **Run Timesheet API**
5. View test results

---

## Postman Collection JSON

**Copy and import this into Postman:**

```json
{
  "info": {
    "name": "Timesheet API",
    "description": "Complete API testing for Timesheet & Hours Logging module",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:3000",
      "type": "string"
    },
    {
      "key": "api_version",
      "value": "v1",
      "type": "string"
    }
  ],
  "item": [
    {
      "name": "List All Timesheets",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "{{base_url}}/api/{{api_version}}/timesheets?page=1&pageSize=10",
          "host": ["{{base_url}}"],
          "path": ["api", "{{api_version}}", "timesheets"],
          "query": [
            {"key": "page", "value": "1"},
            {"key": "pageSize", "value": "10"}
          ]
        }
      },
      "event": [
        {
          "listen": "test",
          "script": {
            "exec": [
              "pm.test(\"Status code is 200\", function () {",
              "    pm.response.to.have.status(200);",
              "});",
              "",
              "pm.test(\"Response is success\", function () {",
              "    var jsonData = pm.response.json();",
              "    pm.expect(jsonData.success).to.be.true;",
              "});",
              "",
              "pm.test(\"Save timesheet ID\", function () {",
              "    var jsonData = pm.response.json();",
              "    if (jsonData.data.data.length > 0) {",
              "        pm.environment.set(\"timesheet_id\", jsonData.data.data[0].id);",
              "    }",
              "});"
            ]
          }
        }
      ]
    },
    {
      "name": "Create Timesheet",
      "request": {
        "method": "POST",
        "header": [
          {"key": "Content-Type", "value": "application/json"}
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"taskId\": \"{{task_id}}\",\n  \"userId\": \"{{user_id}}\",\n  \"start\": \"2025-11-08T09:00:00Z\",\n  \"end\": \"2025-11-08T12:00:00Z\",\n  \"billable\": true,\n  \"notes\": \"Testing via Postman\"\n}"
        },
        "url": {
          "raw": "{{base_url}}/api/{{api_version}}/timesheets",
          "host": ["{{base_url}}"],
          "path": ["api", "{{api_version}}", "timesheets"]
        }
      },
      "event": [
        {
          "listen": "test",
          "script": {
            "exec": [
              "pm.test(\"Status code is 201\", function () {",
              "    pm.response.to.have.status(201);",
              "});",
              "",
              "pm.test(\"Save created timesheet ID\", function () {",
              "    var jsonData = pm.response.json();",
              "    pm.environment.set(\"timesheet_id\", jsonData.data.id);",
              "});"
            ]
          }
        }
      ]
    },
    {
      "name": "Get Timesheet by ID",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "{{base_url}}/api/{{api_version}}/timesheets/{{timesheet_id}}",
          "host": ["{{base_url}}"],
          "path": ["api", "{{api_version}}", "timesheets", "{{timesheet_id}}"]
        }
      },
      "event": [
        {
          "listen": "test",
          "script": {
            "exec": [
              "pm.test(\"Status code is 200\", function () {",
              "    pm.response.to.have.status(200);",
              "});",
              "",
              "pm.test(\"Contains timesheet data\", function () {",
              "    var jsonData = pm.response.json();",
              "    pm.expect(jsonData.data.user).to.exist;",
              "    pm.expect(jsonData.data.task).to.exist;",
              "    pm.expect(jsonData.data.project).to.exist;",
              "});"
            ]
          }
        }
      ]
    },
    {
      "name": "Update Timesheet",
      "request": {
        "method": "PUT",
        "header": [
          {"key": "Content-Type", "value": "application/json"}
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"notes\": \"Updated via Postman\",\n  \"end\": \"2025-11-08T13:00:00Z\"\n}"
        },
        "url": {
          "raw": "{{base_url}}/api/{{api_version}}/timesheets/{{timesheet_id}}",
          "host": ["{{base_url}}"],
          "path": ["api", "{{api_version}}", "timesheets", "{{timesheet_id}}"]
        }
      },
      "event": [
        {
          "listen": "test",
          "script": {
            "exec": [
              "pm.test(\"Status code is 200\", function () {",
              "    pm.response.to.have.status(200);",
              "});"
            ]
          }
        }
      ]
    },
    {
      "name": "Submit Timesheet",
      "request": {
        "method": "PATCH",
        "header": [
          {"key": "Content-Type", "value": "application/json"}
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"status\": \"submitted\"\n}"
        },
        "url": {
          "raw": "{{base_url}}/api/{{api_version}}/timesheets/{{timesheet_id}}/status",
          "host": ["{{base_url}}"],
          "path": ["api", "{{api_version}}", "timesheets", "{{timesheet_id}}", "status"]
        }
      },
      "event": [
        {
          "listen": "test",
          "script": {
            "exec": [
              "pm.test(\"Status updated to submitted\", function () {",
              "    var jsonData = pm.response.json();",
              "    pm.expect(jsonData.data.status).to.eql(\"submitted\");",
              "});"
            ]
          }
        }
      ]
    },
    {
      "name": "Delete Timesheet",
      "request": {
        "method": "DELETE",
        "header": [],
        "url": {
          "raw": "{{base_url}}/api/{{api_version}}/timesheets/{{timesheet_id}}",
          "host": ["{{base_url}}"],
          "path": ["api", "{{api_version}}", "timesheets", "{{timesheet_id}}"]
        }
      },
      "event": [
        {
          "listen": "test",
          "script": {
            "exec": [
              "pm.test(\"Deletion successful\", function () {",
              "    var jsonData = pm.response.json();",
              "    pm.expect(jsonData.success).to.be.true;",
              "});"
            ]
          }
        }
      ]
    }
  ]
}
```

---

## Pro Tips

### 1. **Use Pre-request Scripts**

Add this to collection-level pre-request:
```javascript
// Log environment variables
console.log("Base URL:", pm.environment.get("base_url"));
console.log("User ID:", pm.environment.get("user_id"));
console.log("Task ID:", pm.environment.get("task_id"));
console.log("Timesheet ID:", pm.environment.get("timesheet_id"));
```

### 2. **Use Snippets**

Postman has code snippets on the right side:
- "Status code is 200"
- "Response body contains string"
- "Response time is less than 200ms"

### 3. **Save Responses**

Click **Save Response** to save examples for documentation.

### 4. **Share Collection**

Export collection: **⋯** → **Export** → Share JSON with team

### 5. **Monitor API**

Set up monitors to run tests automatically every hour.

---

## Troubleshooting

### Issue: Variables not working

**Solution:** Make sure environment is selected in top-right dropdown

### Issue: 400 Bad Request

**Solution:** Check that `task_id` and `user_id` are valid UUIDs from your database

### Issue: Connection refused

**Solution:** Ensure dev server is running: `npm run dev`

### Issue: 404 Not Found

**Solution:** Check the `timesheet_id` variable is set (run "Create Timesheet" first)

---

## Next Steps

After testing in Postman:

1. ✅ Export collection for team members
2. ✅ Set up Postman monitors for automated testing
3. ✅ Create documentation from collection
4. ✅ Write integration tests using Newman (Postman CLI)
5. ✅ Build frontend UI that consumes these endpoints

---

## Resources

- **API Documentation:** `TIMESHEET_API.md`
- **Testing Guide:** `TESTING_GUIDE.md`
- **Postman Docs:** https://learning.postman.com/docs

---

**Happy Testing! 🚀**
