# Helm Command Execution Test

## What the validation endpoint does now:

### 1. Dynamic Release Names
For each values file, it extracts the service name and creates a release name:

| Values File | Service Name | Release Name |
|------------|--------------|--------------|
| values-ecommerce.yaml | ecommerce | dummy-ecommerce |
| values-frontend.yaml | frontend | dummy-frontend |
| values-wallpaper.yaml | wallpaper | dummy-wallpaper |

### 2. Relative Path Calculation
From working directory: `Helm/environments/dummy-tenant/`

To chart directory: `Helm/charts/backend-common/`

Relative path: `../../charts/backend-common`

### 3. Actual Commands Executed

```bash
# Working directory: tempDir/Helm/environments/dummy-tenant/

# Command 1: backend-common + ecommerce
helm template dummy-ecommerce ../../charts/backend-common -f values-ecommerce.yaml

# Command 2: backend-common + frontend  
helm template dummy-frontend ../../charts/backend-common -f values-frontend.yaml

# Command 3: backend-common + wallpaper
helm template dummy-wallpaper ../../charts/backend-common -f values-wallpaper.yaml

# Command 4: frontend + frontend
helm template dummy-frontend ../../charts/frontend -f values-frontend.yaml
```

### 4. Command Breakdown

**User's required pattern:**
```bash
helm template dummy-ecommerce ../../charts/backend-common -f values-ecommerce.yaml
```

**Components:**
- `helm template` - Helm command
- `dummy-ecommerce` - Release name (DYNAMIC based on values file)
- `../../charts/backend-common` - Chart path (RELATIVE from values directory)
- `-f values-ecommerce.yaml` - Values file (JUST FILENAME, not full path)

**Execution context:**
- Working directory is set to: `tempDir/Helm/environments/dummy-tenant/`
- This allows relative paths to work correctly
- Values file is in the current directory

### 5. Why This Works

The `../../` notation works because:
1. We set `cmd.Dir = valuesDir` (working directory)
2. From `Helm/environments/dummy-tenant/`:
   - `../` goes to `Helm/environments/`
   - `../../` goes to `Helm/`
   - `../../charts/` goes to `Helm/charts/`
   - `../../charts/backend-common` goes to `Helm/charts/backend-common/`

### 6. Code Implementation

```go
// Calculate relative path
relChartPath, err := filepath.Rel(valuesDir, chartFolder)
// Result: ../../charts/backend-common

// Get just filename
valuesFileName := filepath.Base(valuesFile)
// Result: values-ecommerce.yaml

// Execute from valuesDir
cmd := exec.Command(helmPath, "template", release, relChartPath, "-f", valuesFileName)
cmd.Dir = valuesDir
```

## Test It

1. Start backend: `go run main.go`
2. Click "Validation" button in frontend
3. Check console output for commands being executed
4. Verify K8s resources are inserted into database

## Expected Output

```
🔄 Rendering: release=dummy-ecommerce, chart=backend-common, values=values-ecommerce.yaml
   📍 Working dir: C:\...\Helm\environments\dummy-tenant
   📍 Chart path: ../../charts/backend-common
   📍 Values file: values-ecommerce.yaml
   📍 Command: helm template dummy-ecommerce ../../charts/backend-common -f values-ecommerce.yaml
📝 Rendered YAML length: 3524 bytes
✅ Parsed 2 resources from backend-common + values-ecommerce.yaml
```
