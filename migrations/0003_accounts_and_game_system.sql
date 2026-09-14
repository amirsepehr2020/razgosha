ALTER TABLE players ADD COLUMN account_status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE players ADD COLUMN detective_name TEXT;
ALTER TABLE players ADD COLUMN streak INTEGER NOT NULL DEFAULT 0;
ALTER TABLE players ADD COLUMN last_daily_claim TEXT;

CREATE TABLE IF NOT EXISTS daily_missions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mission_date TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  reward INTEGER NOT NULL DEFAULT 25
);

CREATE TABLE IF NOT EXISTS player_achievements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id INTEGER NOT NULL,
  achievement_id TEXT NOT NULL,
  unlocked_at TEXT NOT NULL,
  UNIQUE(player_id, achievement_id),
  FOREIGN KEY(player_id) REFERENCES players(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS player_inventory (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id INTEGER NOT NULL,
  item_id TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  UNIQUE(player_id, item_id),
  FOREIGN KEY(player_id) REFERENCES players(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_achievements_player ON player_achievements(player_id);
CREATE INDEX IF NOT EXISTS idx_inventory_player ON player_inventory(player_id);
