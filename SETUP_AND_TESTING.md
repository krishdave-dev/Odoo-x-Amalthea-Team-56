# 🎯 Complete Setup & Testing Guide

## Quick Navigation

- **🗄️ Database Setup** → See below (5 minutes)
- **🧪 API Testing** → `API_TESTING_GUIDE.md` (Complete testing guide)
- **📚 API Documentation** → `API_DOCUMENTATION.md` (Full API reference)
- **⚡ Quick Reference** → `QUICK_START_API.md` (Cheat sheet)

---

## 🗄️ Database Setup (5 Minutes)

### Option 1: Automated Setup (Recommended)

#### Windows (PowerShell):
```powershell
.\setup-database.ps1
```

#### Linux/Mac:
```bash
chmod +x setup-database.sh
./setup-database.sh
```

### Option 2: Manual Setup

#### Step 1: Create `.env` File

Create a `.env` file in the project root:

```env
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/oneflow_db"
NODE_ENV="development"
```

**Replace:**
- `postgres` with your PostgreSQL username
- `your_password` with your PostgreSQL password
- `localhost:5432` with your PostgreSQL server address

#### Step 2: Create Database

**Option A: Using psql**
```bash
psql -U postgres
CREATE DATABASE oneflow_db;
\c oneflow_db
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
\q
```

**Option B: Using pgAdmin**
1. Right-click "Databases" → Create → Database
2. Name: `oneflow_db`
3. Open Query Tool and run:
   ```sql
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   ```

#### Step 3: Run Database Commands

```bash
# Generate Prisma Client
npm run db:generate

# Push schema to database (creates all tables)
npm run db:push

# (Optional) Seed with sample data
npm run db:seed
```

#### Step 4: Verify Setup

```bash
# Open Prisma Studio (visual database browser)
npm run db:studio
```

This opens `http://localhost:5555` where you can see all your tables.

---

## 🚀 Start the Server

```bash
npm run dev
```

Server starts at: **http://localhost:3000**

API available at: **http://localhost:3000/api**

---

## 🧪 Quick API Test

Once the server is running, test it works:

### 1. Create an Organization

```bash
curl -X POST http://localhost:3000/api/organizations \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Company",
    "currency": "USD",
    "timezone": "America/New_York"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "a1b2c3d4-...",
    "name": "Test Company",
    "currency": "USD",
    "timezone": "America/New_York",
    "createdAt": "2025-11-08T...",
    "updatedAt": "2025-11-08T..."
  }
}
```

**✅ If you see this response, everything is working!**

---

### 2. List Organizations

```bash
curl "http://localhost:3000/api/organizations?page=1&pageSize=10"
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "a1b2c3d4-...",
      "name": "Test Company",
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

### 3. Create a User

**⚠️ Save the organization ID from step 1 as `{ORG_ID}`**

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "organizationId": "{ORG_ID}",
    "email": "test@example.com",
    "name": "Test User",
    "role": "developer",
    "hourlyRate": 75,
    "isActive": true
  }'
```

---

## 📊 Complete Testing Workflow

For comprehensive testing of all 30+ endpoints, see **`API_TESTING_GUIDE.md`**

The guide includes:
- ✅ Step-by-step testing flow
- ✅ Example requests for every endpoint
- ✅ Expected responses
- ✅ Error scenario testing
- ✅ State machine validation
- ✅ Optimistic locking tests
- ✅ Pagination & filtering examples

---

## 🎓 Testing Order (Recommended)

Follow this order to build up test data properly:

1. **Organizations** - Create your tenant
2. **Users** - Create admin, manager, and developer users
3. **Projects** - Create a project with a manager
4. **Project Members** - Add team members to the project
5. **Task Lists** - Create sprints/milestones
6. **Tasks** - Create tasks and test state transitions
7. **Filters & Search** - Test pagination and filtering
8. **Statistics** - Test aggregation endpoints

---

## 🛠️ Useful Commands

### Database

```bash
# Open visual database browser
npm run db:studio

# Generate Prisma Client (after schema changes)
npm run db:generate

# Push schema changes to database
npm run db:push

# Create a new migration
npm run db:migrate

# Seed database with sample data
npm run db:seed

# Reset database (⚠️ deletes all data)
npx prisma migrate reset
```

### Development

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

---

## 📚 Documentation Overview

| Document | Purpose | When to Use |
|----------|---------|-------------|
| **This File** | Setup & quick start | First time setup |
| **API_TESTING_GUIDE.md** | Complete testing guide | Testing all endpoints |
| **API_DOCUMENTATION.md** | Full API reference | Understanding API structure |
| **QUICK_START_API.md** | Quick reference & tips | Daily development |
| **BACKEND_IMPLEMENTATION.md** | Implementation details | Understanding architecture |
| **DATABASE_SETUP.md** | Database setup details | Database troubleshooting |

---

## 🎯 Key Features to Test

### 1. CRUD Operations
Every entity (Organization, User, Project, Task, etc.) has:
- ✅ Create (POST)
- ✅ Read/List (GET)
- ✅ Update (PUT/PATCH)
- ✅ Delete (DELETE - soft delete)

### 2. Pagination
All list endpoints support:
```
?page=1&pageSize=25
```

### 3. Filtering & Search
```bash
# Search
?q=search+term

# Filter by status
?status=in_progress

# Filter by assignee
?assigneeId=uuid

# Combine filters
?status=new&priority=4&assigneeId=uuid
```

### 4. Task State Machine
Valid transitions:
- `new` → `in_progress`, `blocked`
- `in_progress` → `in_review`, `blocked`, `new`
- `in_review` → `completed`, `in_progress`, `blocked`
- `blocked` → `new`, `in_progress`
- `completed` → `in_progress` (reopen)

### 5. Optimistic Locking
Projects and Tasks use version-based concurrency:
```json
{
  "status": "in_progress",
  "version": 1
}
```

Returns `409 Conflict` if version mismatch (concurrent update detected).

---

## 🔍 Verification Checklist

Before moving to frontend integration:

- [ ] Database is set up and accessible
- [ ] Prisma Client generated successfully
- [ ] Development server starts without errors
- [ ] Can create an organization
- [ ] Can create a user
- [ ] Can create a project
- [ ] Can add members to project
- [ ] Can create task lists
- [ ] Can create tasks
- [ ] Task state transitions work correctly
- [ ] Pagination works on list endpoints
- [ ] Filtering works correctly
- [ ] Search functionality works
- [ ] Optimistic locking prevents conflicts
- [ ] Validation errors return proper 400 responses
- [ ] Not found errors return 404
- [ ] Statistics endpoints return aggregated data

---

## 🐛 Common Issues & Solutions

### Issue: "Cannot find module 'zod'"
**Solution:**
```bash
npm install zod
```

### Issue: "Prisma Client not generated"
**Solution:**
```bash
npm run db:generate
```

### Issue: "Database connection failed"
**Solution:**
1. Check PostgreSQL is running
2. Verify DATABASE_URL in `.env`
3. Ensure database `oneflow_db` exists
4. Test connection: `psql -U postgres -d oneflow_db`

### Issue: "uuid-ossp extension not found"
**Solution:**
```sql
-- Run in your database
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### Issue: "organizationId is required"
**Solution:**
Many endpoints need `organizationId` as query parameter:
```bash
curl "http://localhost:3000/api/users?organizationId={UUID}"
```

### Issue: "Version mismatch" (409)
**Solution:**
Get the current version first:
```bash
# Get current object
curl "http://localhost:3000/api/tasks/{ID}"
# Note the version number, use it in update
```

### Issue: "Invalid status transition" (400)
**Solution:**
Check valid transitions in state machine. Can't go directly from `new` to `completed`.

---

## 🎨 Using Postman/Insomnia

### Postman Setup

1. **Create Collection**: "OneFlow API"
2. **Set Variables**:
   - `base_url`: `http://localhost:3000/api`
   - `org_id`: Save from organization creation
   - `user_id`: Save from user creation
   - `project_id`: Save from project creation

3. **Create Requests**:
   ```
   POST {{base_url}}/organizations
   GET  {{base_url}}/organizations/{{org_id}}
   POST {{base_url}}/users
   GET  {{base_url}}/users?organizationId={{org_id}}
   ```

4. **Save Responses**:
   Use Postman's "Tests" tab to auto-save IDs:
   ```javascript
   pm.environment.set("org_id", pm.response.json().data.id);
   ```

---

## 📈 Performance Testing

### Create Many Records
```bash
# Create 100 tasks for performance testing
for i in {1..100}; do
  curl -X POST http://localhost:3000/api/tasks \
    -H "Content-Type: application/json" \
    -d "{
      \"projectId\": \"{PROJECT_ID}\",
      \"title\": \"Task $i\",
      \"status\": \"new\",
      \"priority\": $((1 + RANDOM % 4))
    }"
done
```

### Test Pagination Performance
```bash
# Test different page sizes
curl "http://localhost:3000/api/tasks?page=1&pageSize=10"
curl "http://localhost:3000/api/tasks?page=1&pageSize=50"
curl "http://localhost:3000/api/tasks?page=1&pageSize=100"
```

---

## 🎓 Next Steps After Testing

1. **✅ Complete Testing Checklist** in `API_TESTING_GUIDE.md`
2. **✅ Review API Documentation** in `API_DOCUMENTATION.md`
3. **✅ Set up Authentication** (future: JWT middleware)
4. **✅ Build Frontend** using these APIs
5. **✅ Add Real-time Features** (WebSockets)
6. **✅ Deploy to Production**

---

## 💡 Pro Tips

### Tip 1: Use Prisma Studio
```bash
npm run db:studio
```
Visual database browser - perfect for debugging and viewing data.

### Tip 2: Save cURL Commands
Create a file `test-commands.sh` with your most-used commands.

### Tip 3: Use Environment Variables
```bash
export ORG_ID="your-org-uuid"
export PROJECT_ID="your-project-uuid"

curl "http://localhost:3000/api/projects/$PROJECT_ID"
```

### Tip 4: Pretty Print JSON
```bash
curl "..." | jq .
```
(Requires `jq` - install with `brew install jq` or `choco install jq`)

### Tip 5: Check Logs
Development server logs show all requests and errors.

---

## 🎯 Success Criteria

Your backend is ready for frontend integration when:

- ✅ All CRUD operations work for all entities
- ✅ Pagination works correctly
- ✅ Filtering and search return expected results
- ✅ Validation errors are clear and helpful
- ✅ State transitions enforce business rules
- ✅ Optimistic locking prevents conflicts
- ✅ Soft deletes preserve data
- ✅ Statistics endpoints return aggregated data
- ✅ Error responses are consistent
- ✅ No crashes or unhandled exceptions

---

## 📞 Getting Help

If you run into issues:

1. Check the relevant documentation file
2. Review error messages in terminal
3. Inspect database with Prisma Studio
4. Check Prisma schema for data model
5. Review service files for business logic
6. Check validation schemas in `lib/validation.ts`

---

**You're all set! Start testing and building! 🚀**

---

## Quick Command Reference

```bash
# Database Setup
npm run db:generate        # Generate Prisma Client
npm run db:push           # Push schema to database
npm run db:seed           # Seed sample data
npm run db:studio         # Open database browser

# Development
npm run dev               # Start dev server
npm run build             # Build for production
npm start                 # Start production server

# Testing
curl localhost:3000/api/organizations  # Test endpoint
```

**Happy Coding! 🎉**
