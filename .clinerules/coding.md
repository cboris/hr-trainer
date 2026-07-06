## Stack
- Frontend: Next.js 14 App Router. Backend: FastAPI. Database: PostgreSQL via Prisma.
- Do not use the Pages Router. All routes go in `app/`.

## Architecture decisions
- State management: Zustand only. Do not introduce Redux or Context API for state.
- All database queries go through service functions in `src/services/`. Never query directly from components.

## Conventions
- API response format: always `{ success: boolean, data?: T, error?: string }`.
- Environment variables: access only through `src/config/env.ts`, never `process.env` directly.