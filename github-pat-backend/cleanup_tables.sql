-- Migration: Clean up tables
-- 1. Remove auto-increment id from github_repository, make repo_id primary key
-- 2. Remove created_at from github_files

BEGIN;

-- ==========================================
-- PART 1: github_repository table cleanup
-- ==========================================

-- Step 1: Drop foreign key constraint from github_files
ALTER TABLE github_files DROP CONSTRAINT IF EXISTS fk_file_repo;

-- Step 2: Drop primary key and id column from github_repository
ALTER TABLE github_repository DROP CONSTRAINT IF EXISTS github_repository_pkey;
ALTER TABLE github_repository DROP CONSTRAINT IF EXISTS github_repository_repo_id_key;
ALTER TABLE github_repository DROP COLUMN IF EXISTS id;

-- Step 3: Make repo_id the primary key
ALTER TABLE github_repository ADD PRIMARY KEY (repo_id);

-- Step 4: Re-add foreign key from github_files to github_repository
ALTER TABLE github_files 
ADD CONSTRAINT fk_file_repo 
FOREIGN KEY (repo_id) 
REFERENCES github_repository(repo_id) 
ON DELETE CASCADE;

-- ==========================================
-- PART 2: github_files table cleanup
-- ==========================================

-- Remove created_at column from github_files
ALTER TABLE github_files DROP COLUMN IF EXISTS created_at;

COMMIT;

-- Verify the changes
\d github_repository
\d github_files

-- Show data
SELECT * FROM github_repository;
SELECT * FROM github_files;
