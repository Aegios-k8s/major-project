-- Migration: Update findings table to support namespace-level validation findings
-- This allows recording missing Kubernetes kinds at the namespace level

-- Step 1: Drop the foreign key constraint temporarily
ALTER TABLE findings DROP CONSTRAINT IF EXISTS fk_finding_resource;

-- Step 2: Make resource_id nullable (for namespace-level findings)
ALTER TABLE findings ALTER COLUMN resource_id DROP NOT NULL;

-- Step 3: Add new columns for namespace-level findings
ALTER TABLE findings ADD COLUMN IF NOT EXISTS namespace VARCHAR(255);
ALTER TABLE findings ADD COLUMN IF NOT EXISTS missing_kind VARCHAR(100);
ALTER TABLE findings ADD COLUMN IF NOT EXISTS finding_type VARCHAR(50) DEFAULT 'resource';

-- Step 4: Add index for namespace and missing_kind
CREATE INDEX IF NOT EXISTS idx_findings_namespace ON findings(namespace);
CREATE INDEX IF NOT EXISTS idx_findings_missing_kind ON findings(missing_kind);
CREATE INDEX IF NOT EXISTS idx_findings_type ON findings(finding_type);

-- Step 5: Re-add foreign key constraint with ON DELETE SET NULL
ALTER TABLE findings 
ADD CONSTRAINT fk_finding_resource 
FOREIGN KEY (resource_id) 
REFERENCES kubernetes_resource(resource_id) 
ON DELETE SET NULL;

-- Step 6: Add comment to explain the schema
COMMENT ON COLUMN findings.resource_id IS 'Resource ID - NULL for namespace-level findings';
COMMENT ON COLUMN findings.namespace IS 'Namespace where the finding was detected';
COMMENT ON COLUMN findings.missing_kind IS 'Missing Kubernetes kind (for validation findings)';
COMMENT ON COLUMN findings.finding_type IS 'Type of finding: resource, namespace, validation';
