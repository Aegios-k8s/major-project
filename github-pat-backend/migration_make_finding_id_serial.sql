-- One-time migration: make findings.finding_id serial-like (1,2,3,...) while keeping VARCHAR type.
-- This migration does not require application code changes.

-- Allow growth beyond 6 digits.
ALTER TABLE findings ALTER COLUMN finding_id TYPE VARCHAR(20);

-- Sequence used to assign the next finding_id.
CREATE SEQUENCE IF NOT EXISTS findings_finding_id_seq;

-- Step 1: Re-number all existing rows deterministically to temporary values.
WITH ordered AS (
  SELECT ctid, ROW_NUMBER() OVER (ORDER BY detected_at, finding_id) AS rn
  FROM findings
)
UPDATE findings f
SET finding_id = 'TMP_' || ordered.rn::text
FROM ordered
WHERE f.ctid = ordered.ctid;

-- Step 2: Convert temporary values to final serial IDs (1..N).
WITH ordered AS (
  SELECT ctid, ROW_NUMBER() OVER (ORDER BY detected_at, finding_id) AS rn
  FROM findings
)
UPDATE findings f
SET finding_id = ordered.rn::text
FROM ordered
WHERE f.ctid = ordered.ctid;

-- Sync sequence to current maximum finding_id.
DO $$
DECLARE
  max_id BIGINT;
  has_rows BOOLEAN;
BEGIN
  SELECT COALESCE(MAX(CAST(finding_id AS BIGINT)), 1), COUNT(*) > 0
  INTO max_id, has_rows
  FROM findings;

  PERFORM setval('findings_finding_id_seq', max_id, has_rows);
END $$;

-- Enforce serial assignment for all future inserts, regardless of supplied finding_id.
CREATE OR REPLACE FUNCTION set_findings_finding_id_serial()
RETURNS TRIGGER AS $$
BEGIN
  NEW.finding_id := nextval('findings_finding_id_seq')::text;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_findings_finding_id_serial ON findings;
CREATE TRIGGER trg_set_findings_finding_id_serial
BEFORE INSERT ON findings
FOR EACH ROW
EXECUTE FUNCTION set_findings_finding_id_serial();
