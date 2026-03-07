-- Migration: Make repo_file_id nullable in kubernetes_resource table
-- This allows Helm-rendered resources (from Validation endpoint) to be stored without a file reference

-- Step 1: Drop the NOT NULL constraint
ALTER TABLE kubernetes_resource 
ALTER COLUMN repo_file_id DROP NOT NULL;

-- Verify the change
SELECT 
    column_name, 
    is_nullable, 
    data_type 
FROM information_schema.columns 
WHERE table_name = 'kubernetes_resource' 
AND column_name = 'repo_file_id';
