-- Drop everything in the public schema without replaying migrations.
-- Used by CI to leave the test database blank between runs.
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
