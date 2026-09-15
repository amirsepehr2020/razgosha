CREATE TABLE IF NOT EXISTS player_identities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  telegram_id TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

ALTER TABLE players ADD COLUMN identity_id INTEGER;

INSERT OR IGNORE INTO player_identities (telegram_id, created_at, updated_at)
SELECT telegram_id, created_at, updated_at FROM players;

UPDATE players
SET identity_id = (
  SELECT id FROM player_identities WHERE player_identities.telegram_id = players.telegram_id
)
WHERE identity_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_players_identity_id ON players(identity_id);

CREATE TABLE IF NOT EXISTS identity_case_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  identity_id INTEGER NOT NULL,
  case_id TEXT NOT NULL,
  current_step INTEGER NOT NULL DEFAULT 0,
  wrong_guesses INTEGER NOT NULL DEFAULT 0,
  solved INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL,
  UNIQUE(identity_id, case_id),
  FOREIGN KEY(identity_id) REFERENCES player_identities(id) ON DELETE CASCADE
);

INSERT OR IGNORE INTO identity_case_history
  (identity_id, case_id, current_step, wrong_guesses, solved, updated_at)
SELECT
  p.identity_id,
  pp.case_id,
  pp.current_step,
  COALESCE(pp.wrong_guesses, 0),
  pp.solved,
  pp.updated_at
FROM player_progress pp
JOIN players p ON p.id = pp.player_id
WHERE p.identity_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_identity_case_history_identity
  ON identity_case_history(identity_id);

CREATE TABLE IF NOT EXISTS identity_achievements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  identity_id INTEGER NOT NULL,
  achievement_id TEXT NOT NULL,
  unlocked_at TEXT NOT NULL,
  UNIQUE(identity_id, achievement_id),
  FOREIGN KEY(identity_id) REFERENCES player_identities(id) ON DELETE CASCADE
);

INSERT OR IGNORE INTO identity_achievements (identity_id, achievement_id, unlocked_at)
SELECT p.identity_id, pa.achievement_id, pa.unlocked_at
FROM player_achievements pa
JOIN players p ON p.id = pa.player_id
WHERE p.identity_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_identity_achievements_identity
  ON identity_achievements(identity_id);

CREATE TABLE IF NOT EXISTS identity_daily_claims (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  identity_id INTEGER NOT NULL,
  mission_date TEXT NOT NULL,
  claimed_at TEXT NOT NULL,
  UNIQUE(identity_id, mission_date),
  FOREIGN KEY(identity_id) REFERENCES player_identities(id) ON DELETE CASCADE
);

INSERT OR IGNORE INTO identity_daily_claims (identity_id, mission_date, claimed_at)
SELECT p.identity_id, p.last_daily_claim, p.updated_at
FROM players p
WHERE p.identity_id IS NOT NULL AND p.last_daily_claim IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_identity_daily_claims_identity
  ON identity_daily_claims(identity_id);
