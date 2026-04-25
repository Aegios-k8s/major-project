-- One-time migration: backfill findings.resource_id and remove findings.finding_type

-- 1) Try exact resource match using resource name parsed from description and kind/namespace.
UPDATE findings f
SET resource_id = kr.resource_id
FROM kubernetes_resource kr
WHERE f.resource_id IS NULL
  AND f.org_id = kr.org_id
  AND f.namespace = kr.namespace
  AND LOWER(kr.kind) = LOWER(f.missing_kind)
  AND kr.name = COALESCE(
    (regexp_match(f.description, 'in [A-Za-z]+ ''([^'']+)'''))[1],
    (regexp_match(f.description, '^(?:Service|ConfigMap|Secret|NetworkPolicy|Deployment|DaemonSet) ''([^'']+)'''))[1]
  );

-- 2) Fallback: map remaining NULL resource_id rows to the latest resource in the same namespace.
WITH namespace_anchor AS (
  SELECT DISTINCT ON (org_id, namespace) org_id, namespace, resource_id
  FROM kubernetes_resource
  WHERE namespace IS NOT NULL AND namespace <> ''
  ORDER BY org_id, namespace, created_at DESC
)
UPDATE findings f
SET resource_id = na.resource_id
FROM namespace_anchor na
WHERE f.resource_id IS NULL
  AND f.org_id = na.org_id
  AND f.namespace = na.namespace;

-- 3) Final fallback: map any remaining NULL rows to the latest resource in the same organization.
WITH org_anchor AS (
  SELECT DISTINCT ON (org_id) org_id, resource_id
  FROM kubernetes_resource
  ORDER BY org_id, created_at DESC
)
UPDATE findings f
SET resource_id = oa.resource_id
FROM org_anchor oa
WHERE f.resource_id IS NULL
  AND f.org_id = oa.org_id;

-- 4) Remove finding_type now that it is no longer used.
DROP INDEX IF EXISTS idx_findings_type;
ALTER TABLE findings DROP COLUMN IF EXISTS finding_type;
