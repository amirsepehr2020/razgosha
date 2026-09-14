ALTER TABLE player_progress ADD COLUMN wrong_guesses INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_progress_case_mistakes ON player_progress(player_id, case_id, wrong_guesses);
