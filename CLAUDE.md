# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

QuizV1 is a comprehensive SaaS platform for creating interactive and gamified funnels/quizzes. It's built as a modern full-stack application with a React frontend, Node.js backend, and Supabase for database, authentication, and storage.

## Architecture

### Monorepo Structure
```
quizv1/
├── frontend/           # React + Vite + Tailwind + shadcn/ui
├── backend/            # Node.js + Express + TypeScript
├── supabase/           # Database migrations and functions
├── scripts/            # Deployment and automation scripts
├── .do/                # DigitalOcean App Platform config
└── .github/workflows/  # CI/CD pipelines
```

### Technology Stack
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui, React Query
- **Backend**: Node.js, Express, TypeScript, Supabase client
- **Database**: Supabase PostgreSQL with RLS
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage (images, videos, documents, avatars)
- **Caching/Queue**: Upstash Redis
- **Monitoring**: Sentry, Healthchecks
- **Deploy**: DigitalOcean App Platform

## Development Commands

### Installation and Setup
```bash
# Install all dependencies
npm run install:all

# Setup development environment
./scripts/setup-complete.sh --mode development

# Start development servers (frontend + backend)
npm run dev

# Start with Docker
./start-docker.sh
```

### Frontend Commands
```bash
cd frontend/

# Development
npm run dev                # Start dev server (port 3000)
npm run build             # Build for production
npm run preview           # Preview production build
npm run lint              # Run ESLint
npm run type-check        # TypeScript checking
```

### Backend Commands
```bash
cd backend/

# Development
npm run dev               # Start with nodemon
npm run build             # Build TypeScript
npm run start             # Start production server
npm run test              # Run Jest tests
npm run test:watch        # Run tests in watch mode
npm run lint              # Run ESLint
```

### Database Commands
```bash
cd supabase/

# Setup database
./setup.sh

# Run migrations manually
supabase db reset
supabase migration up
```

## Core Features Implementation

### 1. Visual Editor (Drag & Drop)
- **Location**: `frontend/src/components/editor/`
- **Library**: @dnd-kit for drag-and-drop
- **Elements**: 12 types (text, multiple choice, image, video, button, input, rating, comparison, carousel, testimonial, chart, price)
- **Features**: Real-time preview, auto-save, responsive design, conditional logic

### 2. Analytics System
- **Location**: `frontend/src/components/analytics/`
- **Charts**: Recharts library
- **Features**: Real-time metrics, funnel analysis, UTM tracking, lead analytics
- **Backend**: Optimized PostgreSQL functions with caching

### 3. File Upload System
- **Location**: `frontend/src/components/upload/`
- **Storage**: Supabase Storage with 4 buckets
- **Features**: Drag-and-drop, image compression, progress tracking, user-specific folders

### 4. Authentication & Plans
- **Auth**: Supabase Auth with JWT
- **Plans**: Free (3 funnels), Pro (50 funnels), Enterprise (unlimited)
- **Webhooks**: Support for Hotmart, Eduzz, Stripe, Kirvano, Monetizze
- **Middleware**: Plan verification on protected routes

### 5. Lead Management
- **Location**: `frontend/src/components/leads/`
- **Features**: Advanced filtering, CSV export, UTM tracking, real-time updates

## Database Schema

### Key Tables
- `users` - User accounts with plan information
- `funnels` - Quiz/funnel configurations (JSON storage)
- `steps` - Individual steps within funnels
- `elements` - UI elements with styling and behavior
- `leads` - Captured leads with answers and UTM data
- `analytics` - Performance metrics and tracking
- `templates` - Reusable funnel templates
- `user_plans` - Subscription management

### Security
- Row Level Security (RLS) enabled on all tables
- User isolation enforced at database level
- File access restricted to owners

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `GET /api/v1/auth/profile` - Get user profile

### Funnels
- `GET /api/v1/funnels` - List user's funnels
- `POST /api/v1/funnels` - Create new funnel
- `PUT /api/v1/funnels/:id` - Update funnel
- `DELETE /api/v1/funnels/:id` - Delete funnel

### Analytics
- `GET /api/v1/analytics/dashboard` - Dashboard metrics
- `GET /api/v1/analytics/quiz/:id` - Quiz-specific analytics

### Webhooks
- `POST /api/webhooks/payment` - Payment webhook handler (public)

## Environment Variables

### Frontend (.env.local)
```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_SENTRY_DSN=
VITE_ANALYTICS_GA_ID=
```

### Backend (.env)
```env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
SENTRY_DSN=
```

## Deployment

### DigitalOcean App Platform
- Configuration: `.do/app.yaml`
- Frontend: Static site deployment
- Backend: Web service with autoscaling
- Workers: Analytics and webhook processing

### CI/CD
- GitHub Actions: `.github/workflows/deploy.yml`
- Automated testing and deployment
- Rollback on failure
- Security scanning

## Code Patterns

### State Management
- React Query for server state
- Context API for global state
- Local state for UI components

### File Organization
- Feature-based folder structure
- Shared components in `components/ui/`
- Custom hooks in `hooks/`
- Services in `services/`
- Types in `types/`

### Error Handling
- Global error boundary
- Sentry integration
- User-friendly error messages
- Graceful degradation

## Testing

### Frontend
```bash
cd frontend/
npm run test              # Run React tests
npm run test:coverage     # Coverage report
```

### Backend
```bash
cd backend/
npm run test              # Run Jest tests
npm run test:e2e          # End-to-end tests
```

## Security Considerations

- JWT tokens for authentication
- CORS configured for specific origins
- Rate limiting on API endpoints
- Input validation with Zod schemas
- SQL injection prevention with parameterized queries
- File upload restrictions and validation

## Performance Optimizations

- React Query caching
- Image compression and optimization
- Redis caching for analytics
- Database query optimization
- CDN for static assets
- Lazy loading for components

## Monitoring and Logs

- Sentry for error tracking
- Structured logging with Winston
- Health checks for all services
- Performance monitoring
- Real-time alerts

## Troubleshooting

### Common Issues

1. **Build Failures**: Check TypeScript errors and dependency versions
2. **Database Connection**: Verify Supabase URL and service role key
3. **Upload Issues**: Check storage bucket permissions and file size limits
4. **Authentication**: Ensure JWT secrets match between frontend and backend

### Debug Commands
```bash
# Check service health
./scripts/health-check.sh

# View logs
docker-compose logs -f

# Database connection test
cd backend && npm run test:db
```

## Contributing

- Follow TypeScript strict mode
- Use Prettier for code formatting
- Write tests for new features
- Update documentation for API changes
- Follow conventional commit messages