# Content Column Removal - Architecture Simplification

## Changes Made

Removed the `content` column from `github_files` table since rendered Kubernetes resources are stored in `kubernetes_resource` table, not in `github_files`.

## Database Changes

### Migration SQL
```sql
ALTER TABLE github_files DROP COLUMN IF EXISTS content;
```

File: `migration_remove_content_column.sql`

### Updated Schema
`github_files` table now contains only metadata:
- `id` - Primary key
- `org_id` - Organization reference
- `repo_id` - Repository reference
- `branch` - Git branch
- `file_path` - Path to file in repository
- `commit_sha` - Git commit SHA
- `content_hash` - Hash for change detection
- `commit_time` - Last commit timestamp
- `is_deleted` - Soft delete flag

## Code Changes

### 1. pkg/database/db.go
- Removed `content TEXT` column from `github_files` table definition

### 2. services/fetching-service/fetch_data.go
- Removed `fetchFileContent()` function
- Removed `Content` field from `File` struct
- Updated `scanRepositoryFiles()` to only track file metadata
- Updated `storeFilesAndExtractK8s()` to not store content
- Updated INSERT/UPDATE queries to exclude content column

### 3. services/fetching-service/render.go
- Changed `RenderHelmAndStoreResources()` to fetch Helm files directly from GitHub
- Added `fetchHelmFilesFromGitHub()` function to fetch files on-demand
- Removed dependency on `github_files.content` column
- Now fetches fresh Helm files from GitHub API during validation

## New Architecture

### Before (Old Flow)
```
FetchData:
1. Fetch files from GitHub
2. Store file content in github_files.content
3. Store metadata in github_files

Validation:
1. Read file content from github_files.content
2. Write to temp directory
3. Render with Helm
4. Store in kubernetes_resource
```

### After (New Flow)
```
FetchData:
1. Fetch file metadata from GitHub
2. Store only metadata in github_files (no content)

Validation:
1. Fetch Helm files directly from GitHub API
2. Write to temp directory
3. Render with Helm
4. Store in kubernetes_resource
```

## Benefits

1. **Reduced Storage**: No duplicate storage of file content
2. **Always Fresh**: Validation always uses latest files from GitHub
3. **Simpler Schema**: github_files is now purely metadata
4. **Clear Separation**: 
   - `github_files` = File tracking/metadata
   - `kubernetes_resource` = Rendered K8s manifests

## Migration Steps

1. **Backup database** (recommended)
   ```bash
   pg_dump -U alivevivek -d github_pat_db > backup.sql
   ```

2. **Run migration**
   ```bash
   psql -U alivevivek -d github_pat_db -f migration_remove_content_column.sql
   ```

3. **Restart backend**
   ```bash
   go run main.go
   ```

4. **Test flow**
   - Click "FetchData" - should track files without storing content
   - Click "Validation" - should fetch from GitHub and render

## Verification

Check that content column is removed:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'github_files';
```

Should NOT show `content` column.

## Files Modified

- `pkg/database/db.go` - Schema update
- `services/fetching-service/fetch_data.go` - Removed content fetching/storage
- `services/fetching-service/render.go` - Added GitHub API fetching
- `migration_remove_content_column.sql` - Migration script
- `CONTENT_COLUMN_REMOVAL.md` - This documentation
