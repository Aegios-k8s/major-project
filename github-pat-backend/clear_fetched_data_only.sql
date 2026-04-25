-- Clear only fetched data (repos, files, K8s resources, findings)
-- Keep user accounts (organization, github_credentials, user_sessions)

BEGIN;

-- Clear findings (depends on kubernetes_resource)
TRUNCATE TABLE findings CASCADE;

-- Clear kubernetes resources (depends on github_files)
TRUNCATE TABLE kubernetes_resource CASCADE;

-- Clear github files (depends on github_repository)
TRUNCATE TABLE github_files CASCADE;

-- Clear github repositories
TRUNCATE TABLE github_repository CASCADE;

-- Clear user sessions (logout all users)
TRUNCATE TABLE user_sessions CASCADE;

COMMIT;

-- Verify what's left
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
