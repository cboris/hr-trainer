## Web App frontend layer

the frontend is where users spend all their time, so it deserves real depth. Here's how I'd break it down across structure, screens, and the component architecture.

**Technology stack**: Next.js 14+ (App Router) is the right choice — you get SSR for the public-facing pages (landing, login), and client-side SPA behavior for the authenticated app. TypeScript throughout. Tailwind for styling. Zustand or Jotai for lightweight client state. React Query / TanStack Query for all server data.
**Key screens and their roles**:
The first diagram shows how all the screens relate to each other:

![Frontend screen map](frontend_screen_map.png)

The most important design decision here is the persistent AI chat panel — it lives in a side-drawer or bottom sheet across all screens, so the user can ask the AI anything in context ("make me a CV for this job", "quiz me on this role") without losing where they are.
Now here's what the dashboard and a key screen (the job detail with match score) actually look like:

