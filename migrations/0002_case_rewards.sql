CREATE TABLE IF NOT EXISTS case_rewards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id INTEGER NOT NULL,
  case_id TEXT NOT NULL,
  reward_token TEXT NOT NULL UNIQUE,
  awarded_at TEXT NOT NULL,
  UNIQUE(player_id, case_id),
  FOREIGN KEY(player_id) REFERENCES players(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_case_rewards_player ON case_rewards(player_id);
