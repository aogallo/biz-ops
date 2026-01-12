-- Initial database setup for Docker PostgreSQL
-- This runs automatically when the container is first created

-- The database is already created by POSTGRES_DB env var
-- Just add any extensions or initial setup here

-- Connect to the bizops_dev database
\c bizops_dev;

-- Create UUID extension (useful for generating IDs)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Log success
\echo 'Database initialized successfully!'
