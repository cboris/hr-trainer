## Other layers

**Data layer** uses three stores: a relational DB (Postgres) for structured user data and auth, a vector store (Pinecone or pgvector) for semantic profile retrieval so the LLM can find the most relevant experience snippets, and a document store (S3 + metadata DB) for CVs and saved job postings.

**Suggested tech stack for a first version:** Next.js frontend + FastAPI or Node backend + Postgres + pgvector (avoids a separate vector DB) + OpenAI or Anthropic API + Supabase for auth (reduces boilerplate significantly). The browser extension can start as a simple bookmarklet that sends a URL to the Market Scout.
