ALTER TABLE players ADD COLUMN best_streak INTEGER NOT NULL DEFAULT 0;
UPDATE players SET best_streak = CASE WHEN streak > best_streak THEN streak ELSE best_streak END;
CREATE INDEX IF NOT EXISTS idx_players_best_streak ON players(best_streak DESC);
