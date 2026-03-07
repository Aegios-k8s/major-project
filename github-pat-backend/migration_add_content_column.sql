-- Migration: Add content column to github_files table
-- This allows storing file content for Helm template rendering

-- Step 1: Add content column
ALTER TABLE github_files 
ADD COLUMN IF NOT EXISTS content TEXT;

-- Step 2: Make repo_file_id nullable in kubernetes_resource
ALTER TABLE kubernetes_resource 
ALTER COLUMN repo_file_id DROP NOT NULL;

-- Verify the changes
SELECT 
    column_name, 
    is_nullable, 
    data_type 
FROM information_schema.columns 
WHERE table_name = 'github_files' 
AND column_name = 'content';

SELECT 
    column_name, 
    is_nullable, 
    data_type 
FROM information_schema.columns 
WHERE table_name = 'kubernetes_resource' 
AND column_name = 'repo_file_id';
