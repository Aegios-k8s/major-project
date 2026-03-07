-- Check if Helm files exist in database

-- 1. Check total files
SELECT COUNT(*) as total_files FROM github_files;

-- 2. Check if content column exists and has data
SELECT 
    COUNT(*) as files_with_content,
    COUNT(*) FILTER (WHERE content IS NOT NULL) as non_null_content,
    COUNT(*) FILTER (WHERE LENGTH(content) > 0) as has_content
FROM github_files;

-- 3. Check for Helm chart files
SELECT COUNT(*) as helm_chart_files
FROM github_files 
WHERE file_path LIKE 'Helm/charts/%/Chart.yaml';

-- 4. Check for Helm values files
SELECT COUNT(*) as helm_values_files
FROM github_files 
WHERE file_path LIKE 'Helm/environments/%';

-- 5. Show sample Helm files (if any)
SELECT file_path, 
       CASE WHEN content IS NULL THEN 'NULL' 
            WHEN LENGTH(content) = 0 THEN 'EMPTY'
            ELSE 'HAS CONTENT (' || LENGTH(content) || ' bytes)'
       END as content_status
FROM github_files 
WHERE file_path LIKE 'Helm/%'
LIMIT 20;

-- 6. Check if migration was run (repo_file_id nullable)
SELECT 
    column_name, 
    is_nullable, 
    data_type 
FROM information_schema.columns 
WHERE table_name = 'kubernetes_resource' 
AND column_name = 'repo_file_id';
