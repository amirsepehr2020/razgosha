-- Purchased hints are tied to Telegram identity, not the current player row.
-- This prevents reset/delete/recreate from restoring already purchased hints.
CREATE TABLE IF NOT EXISTS identity_paid_hints (
  telegram_id TEXT NOT NULL,
  case_id TEXT NOT NULL,
  hint_index INTEGER NOT NULL CHECK (hint_index BETWEEN 0 AND 2),
  purchased_at TEXT NOT NULL,
  PRIMARY KEY (telegram_id, case_id, hint_index)
);

CREATE INDEX IF NOT EXISTS idx_identity_paid_hints_case
  ON identity_paid_hints (telegram_id, case_id);
