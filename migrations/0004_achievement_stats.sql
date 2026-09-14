ALTER TABLE players ADD COLUMN clues_viewed INTEGER NOT NULL DEFAULT 0;
ALTER TABLE players ADD COLUMN puzzles_solved INTEGER NOT NULL DEFAULT 0;
ALTER TABLE players ADD COLUMN perfect_streak INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_player_achievements_player ON player_achievements(player_id);
