-- Clear Database Script
-- This will delete all K8s resources, files, and repositories
-- but keep user accounts and organizations

-- Delete in order to respect foreign key constraints
DELETE FROM findings;
DELETE FROM kubernetes_resource;
DELETE FROM github_files;
DELETE FROM github_repository;

-- Optional: Also clear sessions (uncomment if you want to force re-login)
-- DELETE FROM user_sessions;

-- Verify deletion
SELECT 'findings' as table_name, COUNT(*) as count FROM findings
UNION ALL
SELECT 'kubernetes_resource', COUNT(*) FROM kubernetes_resource
UNION ALL
SELECT 'github_files', COUNT(*) FROM github_files
UNION ALL
SELECT 'github_repository', COUNT(*) FROM github_repository
UNION ALL
SELECT 'user_sessions', COUNT(*) FROM user_sessions
UNION ALL
SELECT 'github_credentials', COUNT(*) FROM github_credentials
UNION ALL
SELECT 'organization', COUNT(*) FROM organization;
