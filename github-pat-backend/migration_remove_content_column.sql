-- Migration: Remove content column from github_files table
-- The content column is no longer needed as rendered K8s resources 
-- are stored in kubernetes_resource table, not github_files

-- Drop the content column
ALTER TABLE github_files DROP COLUMN IF EXISTS content;

-- Verification query
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'github_files' 
ORDER BY ordinal_position;
