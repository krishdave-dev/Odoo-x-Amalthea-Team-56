# OneFlow - Project Management & Resource Planning Platform

> **Video Demo**: [Add your project video link here]

## 📋 Overview

OneFlow is a comprehensive project management and resource planning platform built with modern web technologies. It enables teams to collaborate efficiently on projects, manage tasks, track timesheets, and gain insights through detailed analytics dashboards.

---

## ✨ Key Features

### 📊 **Analytics Dashboard**
- Real-time KPI cards (Total Projects, Tasks Completed, Hours Logged, Billable/Non-billable Hours)
- Project progress tracking with visual charts
- Resource utilization analytics
- Cost vs Revenue analysis
- **PDF Export** - Download analytics reports as PDF documents

### 📝 **Project Management**
- Create and manage projects with detailed descriptions
- Track project status and timeline
- View project progress metrics
- Assign team members to projects

### ✅ **Task Management**
- Create, edit, and manage tasks within projects
- Task assignment with role-based filtering
- Priority levels (Urgent, High, Medium, Low)
- Status tracking (New, In Progress, Blocked, Completed, Cancelled)
- Kanban board and list view options
- Due date management and task deadlines

### ⏱️ **Timesheet Management**
- Log billable and non-billable hours
- Track time spent on tasks
- Monthly timesheet generation
- Expense tracking and management

### 👥 **Multi-tenancy & RBAC**
- Organization-scoped data isolation
- Role-based access control (Admin, Project Manager, Team Member)
- User authentication and authorization
- Invitation-based team management

### 💰 **Financial Tracking**
- Project budget management
- Cost tracking and analysis
- Revenue calculations
- Financial performance insights

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | Next.js 16.0.1 (App Router) |
| **Frontend** | React 19.2.0 with TypeScript |
| **Styling** | Tailwind CSS 4 |
| **UI Components** | shadcn/ui with Radix UI |
| **Database** | PostgreSQL with Prisma ORM |
| **Charts** | Recharts 3.3.0 |
| **PDF Export** | html2canvas + jsPDF |
| **Authentication** | Iron Session with bcrypt |
| **Validation** | Zod |
| **Image Upload** | Cloudinary |
| **Development** | Turbopack, TypeScript, ESLint |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/krishdave-dev/Odoo-x-Amalthea-Team-56.git
   cd oneflow
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/oneflow_db"
   NEXTAUTH_SECRET="your-secret-key-here"
   CLOUDINARY_URL="your-cloudinary-url"
   ```

4. **Setup database**
   ```bash
   npm run db:push          # Push schema to database
   npm run db:seed          # Seed sample data (optional)
   ```

5. **Run development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📖 Available Scripts

```bash
# Development
npm run dev              # Start development server with Turbopack

# Production
npm run build            # Build for production
npm start                # Start production server

# Database
npm run db:generate      # Generate Prisma client
npm run db:push          # Push schema changes to database
npm run db:migrate       # Create and run migrations
npm run db:studio        # Open Prisma Studio UI
npm run db:seed          # Seed database with sample data

# Code Quality
npm run lint             # Run ESLint
```

---

## 📁 Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Authentication pages
│   ├── (mainpages)/              # Main application pages
│   │   ├── analytics/            # Analytics dashboard
│   │   ├── project/              # Project management
│   │   ├── task/                 # Task management
│   │   └── settings/             # User settings
│   ├── (crudpages)/              # CRUD pages for create/edit
│   ├── api/                      # API endpoints
│   │   ├── analytics/            # Analytics data API
│   │   ├── projects/             # Project APIs
│   │   ├── tasks/                # Task APIs
│   │   ├── timesheets/           # Timesheet APIs
│   │   ├── organizations/        # Organization APIs
│   │   └── users/                # User APIs
│   └── layout.tsx                # Root layout
├── components/
│   ├── Auth/                     # Authentication components
│   ├── CRUDPages/                # Create/Edit components
│   ├── MainPages/                # Main page components
│   ├── Pages/                    # Page-level components
│   │   ├── analytics-page.tsx    # Analytics dashboard
│   │   ├── project-page.tsx      # Projects page
│   │   ├── task-page.tsx         # Tasks page
│   │   └── ...
│   └── ui/                       # Reusable UI components
├── services/                     # Business logic services
│   ├── project.service.ts
│   ├── task.service.ts
│   ├── timesheet.service.ts
│   └── ...
├── lib/                          # Utilities and helpers
│   ├── auth.ts                   # Authentication utilities
│   ├── db-helpers.ts             # Database helpers
│   ├── error.ts                  # Error handling
│   ├── prisma.ts                 # Prisma client
│   └── ...
├── types/                        # TypeScript type definitions
│   ├── common.ts
│   └── enums.ts
├── validations/                  # Zod validation schemas
│   └── timesheetSchema.ts
└── contexts/                     # React contexts
    └── AuthContext.tsx           # Authentication context
```

---

## 🔐 Authentication & Authorization

### Authentication Flow
- User signup/login with email and password
- Password hashing with bcryptjs
- Session management with iron-session
- Protected routes and API endpoints

### Role-Based Access Control (RBAC)
- **Admin**: Full system access, organization management
- **Project Manager**: Create/manage projects, view all team tasks, manage timesheets
- **Team Member**: View assigned projects and tasks, log time

---

## 📊 API Documentation

### Key Endpoints

#### Analytics
- `GET /api/analytics?organizationId={id}` - Fetch analytics data

#### Projects
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create new project
- `GET /api/projects/{id}` - Get project details
- `PUT /api/projects/{id}` - Update project
- `DELETE /api/projects/{id}` - Delete project

#### Tasks
- `GET /api/tasks` - List tasks (with pagination)
- `POST /api/tasks` - Create task
- `PUT /api/tasks/{id}` - Update task
- `DELETE /api/tasks/{id}` - Delete task

#### Timesheets
- `GET /api/timesheets` - List timesheets
- `POST /api/timesheets` - Create timesheet entry
- `PUT /api/timesheets/{id}` - Update timesheet

#### Users
- `GET /api/users` - List users in organization
- `GET /api/auth/me` - Get current user

---

## 📈 Analytics Features

### KPI Cards
- **Total Projects**: Count of all active projects
- **Tasks Completed**: Number of completed tasks
- **Hours Logged**: Total hours logged across timesheets
- **Billable Hours**: Hours marked as billable
- **Non-billable Hours**: Hours marked as non-billable

### Charts & Visualizations
1. **Project Progress** - Completion percentage by project
2. **Resource Utilization** - Hours allocated vs available by team member
3. **Cost vs Revenue** - Project cost vs revenue analysis
4. **Billable Hours Distribution** - Pie chart of billable vs non-billable

### PDF Export
- Export complete analytics dashboard as PDF
- Includes all KPI cards and charts
- Auto-generated timestamp
- Multi-page support for large reports

---

## 🗄️ Database Schema

### Core Models
- **User**: User accounts and authentication
- **Organization**: Organization/company data
- **Project**: Project information and metadata
- **Task**: Individual tasks with status and assignments
- **TaskList**: Task collections within projects
- **Timesheet**: Hour tracking and billable status
- **TaskTag**: Task categorization
- **Expense**: Expense tracking

### Key Features
- Numeric primary keys for performance
- Audit trails on all entities
- Soft deletes support
- Org-scoped data isolation

---

## 🔧 Development

### Setting Up Local Development

1. **Install dependencies**: `npm install`
2. **Setup PostgreSQL**: Create a local database
3. **Configure .env.local** with database URL
4. **Run migrations**: `npm run db:migrate`
5. **Seed data** (optional): `npm run db:seed`
6. **Start dev server**: `npm run dev`

### Code Quality
- TypeScript for type safety
- ESLint for code linting
- Shadcn/ui components for consistency
- Prisma for type-safe database access

---

## 📦 Deployment

### Production Build
```bash
npm run build
npm start
```

### Environment Variables (Production)
- `DATABASE_URL` - Production PostgreSQL connection
- `NEXTAUTH_SECRET` - Secure secret for sessions
- `CLOUDINARY_URL` - Cloudinary API URL
- `NODE_ENV=production`

### Hosting Options
- Vercel (recommended for Next.js)
- Docker containers
- Traditional Node.js hosting

---

## 🐛 Troubleshooting

### Common Issues

**PDF Generation Error**
- Ensure `html2canvas` and `jsPDF` are installed
- Check browser console for specific error messages
- Clear browser cache if styling issues occur

**Database Connection Error**
- Verify PostgreSQL is running
- Check DATABASE_URL in .env.local
- Ensure database user has correct permissions

**Build Errors**
- Clear `.next` directory: `rm -rf .next`
- Reinstall dependencies: `npm install`
- Run type check: `npx tsc --noEmit`

---

## 📝 License

This project is part of the Odoo-x-Amalthea collaboration.

---

## 👥 Contributing

We welcome contributions! Please:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📧 Support

For questions or issues, please:
- Check existing documentation files
- Review API documentation
- Open an issue on GitHub
- Contact the development team

---

## 🙏 Acknowledgments

Built by the Amalthea Team with the Odoo framework integration.

---

**Last Updated**: November 2025  
**Version**: 0.1.0  
**Status**: Active Development
