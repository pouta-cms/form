CREATE TABLE IF NOT EXISTS submissions (
  id TEXT PRIMARY KEY,
  form_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('partial', 'completed')),
  answers TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_submissions_form_status ON submissions (form_id, status);
