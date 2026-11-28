CREATE TABLE IF NOT EXISTS margin_rate (
  ip_key TEXT PRIMARY KEY,
  bucket INTEGER NOT NULL,
  hits INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS margin_rate_bucket ON margin_rate(bucket);
