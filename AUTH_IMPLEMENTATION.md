# Authentication Implementation

This project now includes a complete authentication system with role-based access control.

## Features

✅ **Session-based authentication** using `iron-session` with secure HTTP-only cookies
✅ **Role-based access control** (Admin, Manager, Member)
✅ **Protected routes** with automatic redirects
✅ **Login/Signup pages** with form validation
✅ **Auth context** for client-side state management
✅ **Middleware** for server-side route protection

## Setup

1. **Add Session Secret to `.env`**
   ```bash
   # Copy the example file
   cp .env.example .env
   
   # Generate a secure session secret (at least 32 characters)
   # On Linux/Mac:
   openssl rand -base64 32
   
   # Then add it to your .env file:
   SESSION_SECRET="your_generated_secret_here"
   ```

2. **Database Setup** (if not already done)
   ```bash
   npx prisma generate
   npx prisma db push
   npm run db:seed
   ```

## Demo Accounts

After seeding the database, you can use these demo accounts:

- **Admin**: `admin@demo.com` / `admin123`
- **Manager**: `manager@demo.com` / `manager123`
- **Member**: `dev@demo.com` / `dev123`

## How It Works

### Authentication Flow

1. **Login/Signup** → User credentials are validated
2. **Session Creation** → Secure session cookie is created
3. **Role-based Redirect**:
   - Admin/Manager → `/project` (Projects page)
   - Member → `/task` (Tasks page)

### Route Protection

The middleware automatically protects routes:

- **Public routes**: `/login`, `/signup`
- **Protected routes**: `/project`, `/task`, `/settings`, all CRUD pages
- **API routes**: All `/api/*` except `/api/auth/*` require authentication

### Role-Based Access

Different user roles have different access levels:

- **Admin**: Full access to all features
- **Manager**: Access to projects, tasks, and team management
- **Member**: Access to assigned tasks and personal timesheets

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/signup` - Create new account
- `POST /api/auth/logout` - Logout and destroy session
- `GET /api/auth/me` - Get current user info

## Code Structure

```
src/
├── app/
│   ├── api/auth/          # Auth API routes
│   ├── login/             # Login page
│   └── signup/            # Signup page
├── contexts/
│   └── AuthContext.tsx    # Client-side auth state
├── lib/
│   ├── auth.ts            # Password hashing utilities
│   └── session.ts         # Session management helpers
├── types/
│   └── auth.ts            # Auth-related TypeScript types
└── middleware.ts          # Route protection middleware
```

## Usage in Components

### Using Auth Context

```tsx
'use client'

import { useAuth } from '@/contexts/AuthContext'

export default function MyComponent() {
  const { user, logout } = useAuth()
  
  return (
    <div>
      <p>Welcome, {user?.name}!</p>
      <p>Role: {user?.role}</p>
      <button onClick={logout}>Logout</button>
    </div>
  )
}
```

### Server-Side Auth

```tsx
import { getCurrentUser, requireAuth, requireRole } from '@/lib/session'

// Get current user (returns null if not authenticated)
const user = await getCurrentUser()

// Require authentication (throws if not authenticated)
const user = await requireAuth()

// Require specific role (throws if user doesn't have role)
const admin = await requireRole('admin')
const manager = await requireRole(['admin', 'manager'])
```

## Security Features

- ✅ HTTP-only cookies (prevent XSS attacks)
- ✅ Secure cookies in production (HTTPS only)
- ✅ Password hashing with bcrypt
- ✅ CSRF protection via SameSite cookies
- ✅ Session expiration (7 days)
- ✅ Input validation with Zod schemas

## Next Steps

The frontend team can now:
1. Add more role-based features to existing pages
2. Implement user profile management
3. Add password reset functionality
4. Enhance the UI/UX of login/signup pages
5. Add more granular permissions within roles

## Troubleshooting

**Issue**: Session not persisting
- **Solution**: Ensure `SESSION_SECRET` is set in `.env`

**Issue**: Redirecting to login unexpectedly
- **Solution**: Check that your route is listed in the middleware's protected routes

**Issue**: Can't access API routes
- **Solution**: Ensure you're authenticated. API routes (except `/api/auth/*`) require authentication
