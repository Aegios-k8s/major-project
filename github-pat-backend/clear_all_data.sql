-- Clear all data from database while preserving schema
-- This removes all stored repositories, files, K8s resources, findings, sessions, and user data

-- Disable foreign key checks temporarily (PostgreSQL uses CASCADE)
BEGIN;

-- Clear findings (depends on kubernetes_resource)
TRUNCATE TABLE findings CASCADE;

-- Clear kubernetes resources (depends on github_files)
TRUNCATE TABLE kubernetes_resource CASCADE;

-- Clear github files (depends on github_repository)
TRUNCATE TABLE github_files CASCADE;

-- Clear github repositories (depends on organization and github_credentials)
TRUNCATE TABLE github_repository CASCADE;

-- Clear user sessions
TRUNCATE TABLE user_sessions CASCADE;

-- Clear github credentials (depends on organization)
TRUNCATE TABLE github_credentials CASCADE;

-- Clear organizations (root table)
TRUNCATE TABLE organization CASCADE;

COMMIT;

-- Verify all tables are empty
SELECT 
    'organization' as table_name, COUNT(*) as row_count FROM organization
UNION ALL
SELECT 'github_credentials', COUNT(*) FROM github_credentials
UNION ALL
SELECT 'user_sessions', COUNT(*) FROM user_sessions
UNION ALL
SELECT 'github_repository', COUNT(*) FROM github_repository
UNION ALL
SELECT 'github_files', COUNT(*) FROM github_files
UNION ALL
SELECT 'kubernetes_resource', COUNT(*) FROM kubernetes_resource
UNION ALL
SELECT 'findings', COUNT(*) FROM findings;
