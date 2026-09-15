CREATE TRIGGER IF NOT EXISTS trg_players_identity_after_insert
AFTER INSERT ON players
BEGIN
  INSERT OR IGNORE INTO player_identities (telegram_id, created_at, updated_at)
  VALUES (NEW.telegram_id, NEW.created_at, NEW.updated_at);
  UPDATE players
  SET identity_id = (SELECT id FROM player_identities WHERE telegram_id = NEW.telegram_id)
  WHERE id = NEW.id AND identity_id IS NULL;
END;

CREATE TRIGGER IF NOT EXISTS trg_players_identity_restore
AFTER UPDATE OF identity_id ON players
WHEN NEW.identity_id IS NOT NULL AND (OLD.identity_id IS NULL OR OLD.identity_id != NEW.identity_id)
BEGIN
  INSERT OR IGNORE INTO player_progress (player_id, case_id, current_step, solved, wrong_guesses, updated_at)
  SELECT NEW.id, case_id, current_step, solved, wrong_guesses, updated_at
  FROM identity_case_history WHERE identity_id = NEW.identity_id;

  INSERT OR IGNORE INTO player_achievements (player_id, achievement_id, unlocked_at)
  SELECT NEW.id, achievement_id, unlocked_at
  FROM identity_achievements WHERE identity_id = NEW.identity_id;

  UPDATE players
  SET last_daily_claim = (
    SELECT mission_date FROM identity_daily_claims
    WHERE identity_id = NEW.identity_id
    ORDER BY mission_date DESC LIMIT 1
  )
  WHERE id = NEW.id
    AND EXISTS (SELECT 1 FROM identity_daily_claims WHERE identity_id = NEW.identity_id);
END;

CREATE TRIGGER IF NOT EXISTS trg_progress_history_after_insert
AFTER INSERT ON player_progress
WHEN EXISTS (SELECT 1 FROM players WHERE id = NEW.player_id AND identity_id IS NOT NULL)
BEGIN
  INSERT INTO identity_case_history (identity_id, case_id, current_step, wrong_guesses, solved, updated_at)
  SELECT p.identity_id, NEW.case_id, NEW.current_step, NEW.wrong_guesses, NEW.solved, NEW.updated_at
  FROM players p WHERE p.id = NEW.player_id
  ON CONFLICT(identity_id, case_id) DO UPDATE SET
    current_step = excluded.current_step,
    wrong_guesses = MAX(identity_case_history.wrong_guesses, excluded.wrong_guesses),
    solved = MAX(identity_case_history.solved, excluded.solved),
    updated_at = excluded.updated_at;
END;

CREATE TRIGGER IF NOT EXISTS trg_progress_history_after_update
AFTER UPDATE OF current_step, wrong_guesses, solved, updated_at ON player_progress
WHEN EXISTS (SELECT 1 FROM players WHERE id = NEW.player_id AND identity_id IS NOT NULL)
BEGIN
  INSERT INTO identity_case_history (identity_id, case_id, current_step, wrong_guesses, solved, updated_at)
  SELECT p.identity_id, NEW.case_id, NEW.current_step, NEW.wrong_guesses, NEW.solved, NEW.updated_at
  FROM players p WHERE p.id = NEW.player_id
  ON CONFLICT(identity_id, case_id) DO UPDATE SET
    current_step = excluded.current_step,
    wrong_guesses = MAX(identity_case_history.wrong_guesses, excluded.wrong_guesses),
    solved = MAX(identity_case_history.solved, excluded.solved),
    updated_at = excluded.updated_at;
END;

CREATE TRIGGER IF NOT EXISTS trg_progress_history_after_delete
AFTER DELETE ON player_progress
WHEN EXISTS (SELECT 1 FROM players WHERE id = OLD.player_id AND identity_id IS NOT NULL)
BEGIN
  INSERT OR IGNORE INTO player_progress (player_id, case_id, current_step, solved, wrong_guesses, updated_at)
  SELECT OLD.player_id, case_id, current_step, solved, wrong_guesses, updated_at
  FROM identity_case_history
  WHERE identity_id = (SELECT identity_id FROM players WHERE id = OLD.player_id);
END;

CREATE TRIGGER IF NOT EXISTS trg_achievement_history_after_insert
AFTER INSERT ON player_achievements
WHEN EXISTS (SELECT 1 FROM players WHERE id = NEW.player_id AND identity_id IS NOT NULL)
BEGIN
  INSERT OR IGNORE INTO identity_achievements (identity_id, achievement_id, unlocked_at)
  SELECT identity_id, NEW.achievement_id, NEW.unlocked_at
  FROM players WHERE id = NEW.player_id;
END;

CREATE TRIGGER IF NOT EXISTS trg_achievement_history_after_delete
AFTER DELETE ON player_achievements
WHEN EXISTS (SELECT 1 FROM players WHERE id = OLD.player_id AND identity_id IS NOT NULL)
BEGIN
  INSERT OR IGNORE INTO player_achievements (player_id, achievement_id, unlocked_at)
  SELECT OLD.player_id, achievement_id, unlocked_at
  FROM identity_achievements
  WHERE identity_id = (SELECT identity_id FROM players WHERE id = OLD.player_id);
END;

CREATE TRIGGER IF NOT EXISTS trg_daily_claim_history_after_update
AFTER UPDATE OF last_daily_claim ON players
WHEN NEW.identity_id IS NOT NULL AND NEW.last_daily_claim IS NOT NULL
BEGIN
  INSERT OR IGNORE INTO identity_daily_claims (identity_id, mission_date, claimed_at)
  VALUES (NEW.identity_id, NEW.last_daily_claim, NEW.updated_at);
END;

CREATE TRIGGER IF NOT EXISTS trg_daily_claim_restore_after_reset
AFTER UPDATE OF last_daily_claim ON players
WHEN NEW.identity_id IS NOT NULL AND NEW.last_daily_claim IS NULL
  AND EXISTS (SELECT 1 FROM identity_daily_claims WHERE identity_id = NEW.identity_id)
BEGIN
  UPDATE players
  SET last_daily_claim = (
    SELECT mission_date FROM identity_daily_claims
    WHERE identity_id = NEW.identity_id
    ORDER BY mission_date DESC LIMIT 1
  )
  WHERE id = NEW.id;
END;
