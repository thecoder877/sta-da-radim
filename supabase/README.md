# Supabase

Phase 1 uses mock place data. Apply `migrations/0001_init.sql` when connecting a real project.

Do not expose `SUPABASE_SERVICE_ROLE_KEY` to the browser. Row Level Security is defined in the migration so public visitors can read verified places and public trips, while authenticated users manage only their own trips, saved places, reviews, and submissions.
