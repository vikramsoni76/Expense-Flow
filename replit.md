# Expense Tracker Application

## Overview

This is a full-stack expense tracking application built with React frontend and Express backend. Users can log expenses with details like travel mode, customer name, and category. The app provides a dashboard for viewing and managing expenses, plus report generation with CSV export functionality.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript, using Vite as the build tool
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state, with custom hooks for authentication and expense management
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom theme configuration supporting light/dark modes
- **Forms**: React Hook Form with Zod validation schemas
- **Charts**: Recharts for dashboard analytics visualization

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript compiled with tsx for development, esbuild for production
- **API Design**: RESTful endpoints defined in shared routes file with Zod schemas for type-safe request/response handling
- **Authentication**: Passport.js with local strategy, session-based auth using express-session
- **Password Security**: Scrypt hashing with timing-safe comparison

### Data Storage
- **Database**: PostgreSQL with Drizzle ORM
- **Schema Location**: `shared/schema.ts` contains all table definitions
- **Migrations**: Drizzle Kit for schema migrations (output to `./migrations`)
- **Tables**:
  - `users`: Authentication with username/password
  - `expenses`: Expense records with category, travel mode, status, and optional Google Sheets integration

### Project Structure
```
├── client/           # React frontend
│   └── src/
│       ├── components/  # UI components (shadcn/ui + custom)
│       ├── hooks/       # Custom React hooks
│       ├── lib/         # Utilities and query client
│       └── pages/       # Route components
├── server/           # Express backend
│   ├── auth.ts       # Passport authentication setup
│   ├── db.ts         # Database connection
│   ├── routes.ts     # API route handlers
│   └── storage.ts    # Database access layer
├── shared/           # Shared code between client/server
│   ├── routes.ts     # API route definitions with Zod schemas
│   └── schema.ts     # Drizzle database schema
```

### Key Design Patterns
- **Type-safe API contracts**: Shared route definitions in `shared/routes.ts` ensure frontend and backend stay in sync
- **Repository pattern**: `storage.ts` abstracts database operations through an interface
- **Component composition**: shadcn/ui provides unstyled primitives that are customized via Tailwind

## External Dependencies

### Database
- **PostgreSQL**: Primary database, connection via `DATABASE_URL` environment variable
- **Drizzle ORM**: Type-safe database queries and migrations

### Authentication
- **express-session**: Server-side session management
- **passport / passport-local**: Username/password authentication strategy

### Frontend Libraries
- **@tanstack/react-query**: Server state management and caching
- **react-hook-form**: Form state management
- **zod**: Schema validation (shared between client and server)
- **recharts**: Data visualization for dashboard
- **date-fns**: Date formatting and manipulation
- **react-day-picker**: Calendar/date selection components

### UI Framework
- **Radix UI**: Accessible component primitives (dialog, dropdown, tabs, etc.)
- **Tailwind CSS**: Utility-first styling
- **class-variance-authority**: Component variant management
- **lucide-react**: Icon library

### Build Tools
- **Vite**: Frontend development server and bundler
- **esbuild**: Production server bundling
- **tsx**: TypeScript execution for development

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Secret for session encryption (defaults to "r3pl1t" in development)