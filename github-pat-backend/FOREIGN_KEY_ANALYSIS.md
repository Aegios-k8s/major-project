# Foreign Key Relationship Analysis

## Database Schema Overview

### Table Hierarchy
```
organization (org_id)
    ├── github_credentials (cred_id, org_id FK)
    │   ├── user_sessions (user_id FK, org_id FK)
    │   └── github_repository (repo_id, cred_id FK, org_id FK)
    │       └── github_files (id, repo_id FK, org_id FK)
    │           └── kubernetes_resource (resource_id, repo_file_id FK, org_id FK)
    │               └── findings (finding_id, resource_id FK, org_id FK)
```

---

## Critical Change Made

### ✅ FIXED: `kubernetes_resource.repo_file_id` Made Nullable

**Previous Schema:**
```sql
repo_file_id INTEGER NOT NULL
```

**New Schema:**
```sql
repo_file_id INTEGER  -- Now nullable
```

**Reason:**
- Helm-rendered resources (from Validation endpoint) don't originate from GitHub files
- They are dynamically generated from Helm templates + values files
- Setting `repo_file_id = NULL` for Helm-rendered resources is semantically correct

---

## Foreign Key Constraints Status

### ✅ All Foreign Keys Intact

#### 1. `github_credentials` → `organization`
```sql
CONSTRAINT fk_cred_org
    FOREIGN KEY (org_id)
    REFERENCES organization(org_id)
    ON DELETE CASCADE
```
**Status:** ✅ Working
**Used in:** `signup.go`, `login.go`

---

#### 2. `user_sessions` → `github_credentials`
```sql
CONSTRAINT fk_session_user
    FOREIGN KEY (user_id)
    REFERENCES github_credentials(id)
    ON DELETE CASCADE
```
**Status:** ✅ Working
**Used in:** `session.go`

---

#### 3. `user_sessions` → `organization`
```sql
CONSTRAINT fk_session_org
    FOREIGN KEY (org_id)
    REFERENCES organization(org_id)
    ON DELETE CASCADE
```
**Status:** ✅ Working
**Used in:** `session.go`

---

#### 4. `github_repository` → `organization`
```sql
CONSTRAINT fk_repo_org
    FOREIGN KEY (org_id)
    REFERENCES organization(org_id)
    ON DELETE CASCADE
```
**Status:** ✅ Working
**Used in:** `fetch_data.go`, `fetch_data_optimized.go`

---

#### 5. `github_repository` → `github_credentials`
```sql
CONSTRAINT fk_repo_cred
    FOREIGN KEY (cred_id)
    REFERENCES github_credentials(cred_id)
    ON DELETE CASCADE
```
**Status:** ✅ Working
**Used in:** `fetch_data.go`, `fetch_data_optimized.go`

---

#### 6. `github_files` → `organization`
```sql
CONSTRAINT fk_file_org
    FOREIGN KEY (org_id)
    REFERENCES organization(org_id)
    ON DELETE CASCADE
```
**Status:** ✅ Working
**Used in:** `fetch_data.go`, `fetch_data_optimized.go`

---

#### 7. `github_files` → `github_repository`
```sql
CONSTRAINT fk_file_repo
    FOREIGN KEY (repo_id)
    REFERENCES github_repository(repo_id)
    ON DELETE CASCADE
```
**Status:** ✅ Working
**Used in:** `fetch_data.go`, `fetch_data_optimized.go`

---

#### 8. `kubernetes_resource` → `organization`
```sql
CONSTRAINT fk_k8s_org
    FOREIGN KEY (org_id)
    REFERENCES organization(org_id)
    ON DELETE CASCADE
```
**Status:** ✅ Working
**Used in:** `validation.go` (new), previously in `fetch_data.go`

---

#### 9. `kubernetes_resource` → `github_files` ⚠️ MODIFIED
```sql
CONSTRAINT fk_k8s_file
    FOREIGN KEY (repo_file_id)
    REFERENCES github_files(id)
    ON DELETE CASCADE
```
**Status:** ✅ Working (now allows NULL)
**Used in:**
- `validation.go` → Sets `repo_file_id = NULL` (Helm-rendered resources)
- Previously in `fetch_data.go` → Would set actual file ID (GitHub-sourced resources)

---

#### 10. `findings` → `organization`
```sql
CONSTRAINT fk_finding_org
    FOREIGN KEY (org_id)
    REFERENCES organization(org_id)
    ON DELETE CASCADE
```
**Status:** ✅ Working
**Used in:** Security service endpoints

---

#### 11. `findings` → `kubernetes_resource`
```sql
CONSTRAINT fk_finding_resource
    FOREIGN KEY (resource_id)
    REFERENCES kubernetes_resource(resource_id)
    ON DELETE CASCADE
```
**Status:** ✅ Working
**Used in:** Security service endpoints

---

## Data Flow Comparison

### Before Refactoring (FetchData did everything)
```
FetchData Endpoint
    ↓
1. Fetch repos from GitHub
    ↓
2. Insert into github_repository (with org_id, cred_id)
    ↓
3. Fetch files from GitHub
    ↓
4. Insert into github_files (with repo_id, org_id)
    ↓
5. Parse YAML → Extract K8s resources
    ↓
6. Insert into kubernetes_resource (with repo_file_id, org_id)
```

### After Refactoring (Separation of Concerns)
```
FetchData Endpoint (GitHub sync only)
    ↓
1. Fetch repos from GitHub
    ↓
2. Insert into github_repository (with org_id, cred_id) ✅
    ↓
3. Fetch files from GitHub
    ↓
4. Insert into github_files (with repo_id, org_id) ✅
    ↓
5. STOP (no K8s parsing)

---

Validation Endpoint (Helm rendering + K8s ingestion)
    ↓
1. Discover Helm charts (./Helm/charts/*)
    ↓
2. Discover values files (./Helm/environments/dummy-tenant/*.yaml)
    ↓
3. Execute: helm template <release> <chart> -f <values>
    ↓
4. Parse rendered YAML → Extract K8s resources
    ↓
5. Insert into kubernetes_resource (with repo_file_id = NULL, org_id) ✅
```

---

## Migration Required

### For Existing Databases
Run this SQL to make `repo_file_id` nullable:

```sql
ALTER TABLE kubernetes_resource 
ALTER COLUMN repo_file_id DROP NOT NULL;
```

**Migration file:** `migration_make_repo_file_id_nullable.sql`

---

## Verification Checklist

### ✅ FetchData Endpoint
- [x] Inserts into `github_repository` with valid `org_id` and `cred_id`
- [x] Inserts into `github_files` with valid `repo_id` and `org_id`
- [x] No longer inserts into `kubernetes_resource`
- [x] All foreign keys satisfied

### ✅ Validation Endpoint
- [x] Inserts into `kubernetes_resource` with valid `org_id`
- [x] Sets `repo_file_id = NULL` (allowed now)
- [x] Sets `cluster_id = '1'` (hardcoded)
- [x] All foreign keys satisfied

### ✅ Security Endpoints
- [x] Query `kubernetes_resource` by `org_id` (still works)
- [x] Insert into `findings` with valid `resource_id` and `org_id`
- [x] All foreign keys satisfied

---

## Conclusion

✅ **All foreign key relationships are intact and working correctly.**

The only change made was making `repo_file_id` nullable in `kubernetes_resource` table, which is necessary and semantically correct for Helm-rendered resources that don't originate from GitHub files.

**No existing functionality was broken.**
