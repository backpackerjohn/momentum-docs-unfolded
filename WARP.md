# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Development Commands

### Core Development
```bash
# Install dependencies
npm i

# Start development server (runs on localhost:8080)
npm run dev

# Build for production
npm run build

# Build for development mode
npm run build:dev

# Preview production build
npm run preview

# Run ESLint
npm run lint
```

### Package Management
- Uses npm with `package-lock.json`
- Dependencies are managed through `package.json`

## Project Architecture

### Tech Stack
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 5
- **Styling**: Tailwind CSS with shadcn/ui components
- **Database**: Supabase (PostgreSQL with real-time subscriptions)
- **State Management**: TanStack Query (React Query)
- **Routing**: React Router v6
- **Forms**: React Hook Form with Zod validation
- **Icons**: Lucide React

### Application Structure

**Main App Features:**
1. **Dashboard** - Central hub with feature cards
2. **Brain Dump** - Thought capture and organization system
3. **Momentum Maps** - Task breakdown and management
4. **Smart Reminders** - Habit tracking and scheduling

**Authentication Flow:**
- Protected routes wrapped in `AppShell` component
- Supabase auth with localStorage persistence
- Automatic redirects to `/auth` for unauthenticated users

### Key Architectural Patterns

**Component Organization:**
- `src/pages/` - Route-level components
- `src/components/` - Reusable components
- `src/components/ui/` - shadcn/ui components
- `src/components/brain-dump/` - Feature-specific components

**Data Layer:**
- Custom hooks for data fetching (e.g., `useBrainDumpData`)
- Real-time Supabase subscriptions for live updates
- TanStack Query for caching and state management

**State Management:**
- Local component state with useState/useEffect
- Global auth state through Supabase client
- Real-time data synchronization via Supabase channels

### Database Schema (Supabase)
- `thoughts` table with user relationships and status tracking
- `categories` table for thought organization
- Real-time subscriptions on table changes
- Row-level security enabled

### Configuration Files
- `vite.config.ts` - Vite configuration with path aliases (`@` -> `./src`)
- `components.json` - shadcn/ui configuration
- `tailwind.config.ts` - Tailwind CSS customization
- `supabase/config.toml` - Supabase project configuration

### Development Notes
- Development server runs on port 8080
- Uses SWC for fast React compilation
- ESLint configured with React hooks and TypeScript rules
- Path aliases configured for clean imports (`@/components`, `@/lib`, etc.)
- Lovable platform integration for automated commits

### Key Integration Points
- Supabase client configured in `src/integrations/supabase/`
- Auth state managed globally through AppShell
- Toast notifications using shadcn/ui toaster
- Theme support via next-themes

### Testing
No test framework is currently configured in this project.