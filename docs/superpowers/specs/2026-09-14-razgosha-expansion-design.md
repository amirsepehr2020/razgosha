# Razgosha Expansion Design

## Goal
Turn Razgosha from a single-case Telegram bot into a conversational Persian detective game with persistent player accounts, many replayable cases, progression, achievements, daily content, inventory, richer navigation, and strong anti-cheat/data integrity.

## Product direction
Razgosha should feel like a friendly Persian detective companion rather than a form-driven bot. Copy should be natural, short, conversational, and playful while remaining clear. The bot should guide players through investigations without overwhelming them with menus.

## Major subsystems

### 1. Account and player identity
Every player is represented by a persistent D1 player record created/updated from Telegram identity. Gameplay actions require a valid player record. The profile stores display name, Telegram identity, score, level, XP/progression statistics, timestamps, and future achievement/inventory references.

Account UX:
- First `/start` creates or initializes the player.
- Main menu is available after initialization.
- Gameplay callbacks resolve the player before changing progress or rewards.
- Invalid/missing player state receives a safe Persian recovery message.
- Telegram secrets are never stored in source or logs.

### 2. Case engine
Replace the current hard-coded single-case flow with a data-driven case catalog. A case contains metadata, introduction, suspects, scenes/steps, clues, puzzles, choices, scoring rules, and one or more endings. New cases should be addable without rewriting the main Worker routing logic.

Target initial content: 10-20 cases, each with multiple investigation steps. Cases should have easy/medium/hard difficulty and support locked/unlocked states.

Each case should expose stable IDs for case, step, clue, puzzle, option, and ending so progress can be persisted safely.

### 3. Conversational Persian UX
Rewrite visible bot copy into natural Persian. Prefer phrases such as "خب کارآگاه..." and "به نظرت کدومش مشکوکه؟" over formal administrative wording. Avoid excessive repetition. Error messages should remain calm and actionable.

The tone should be friendly and detective-themed, not childish. Buttons should be concise and descriptive.

### 4. Progression
Add XP and levels alongside score. Track solved cases, failed attempts, clues used, and other useful statistics. Level thresholds must be deterministic and tested. Reward calculations belong in server-side code and cannot be trusted from callback payloads.

### 5. Rewards and anti-cheat
Keep the existing unique reward protection and extend it to all future reward types. A player can receive a case-completion reward at most once per case. Database uniqueness must remain the final authority for duplicate prevention. Concurrent callback presses must not double-award points.

### 6. Inventory / hints
Introduce limited gameplay items such as a clue reveal or wrong-option elimination. Inventory changes must be atomic in D1 and validated server-side. Items cannot be granted or consumed merely by crafting callback data.

### 7. Navigation
Expand the menu with:
- 🔎 شروع بازی
- 📁 پرونده‌ها
- 🎯 مأموریت روزانه
- 🎒 کیف کارآگاه
- 🏆 رتبه‌بندی
- 👤 پروفایل
- 🥇 دستاوردها
- ⚙️ تنظیمات
- ℹ️ راهنما

Menus should remain manageable on mobile Telegram and use nested screens where needed.

### 8. Competition and achievements
Add global leaderboard, weekly leaderboard, personal bests, achievement definitions, and detective titles/medals. Achievement awarding must be idempotent through unique database constraints.

### 9. Daily systems
Add a deterministic daily challenge, daily mission, login streak, and optional daily reward. Daily content must be keyed by date and player so repeated Telegram callbacks cannot duplicate rewards.

### 10. Case discovery
Support:
- open cases
- solved cases
- locked cases
- special cases
- random case

Locked cases should communicate why they are locked (for example required level or solved-case count) without leaking future puzzle answers.

## Data model direction
Keep `players` and `player_progress` as core tables. Extend with focused tables rather than one oversized table:
- `cases` / catalog metadata if runtime storage is needed
- `case_rewards` (already present)
- `player_inventory`
- `achievements`
- `player_achievements`
- `daily_challenges`
- `player_daily_progress`
- optional `game_events` for compact analytics/audit events

Case definitions themselves may remain versioned JSON in GitHub when practical; mutable player state stays in D1.

All tables that represent one-time grants must have unique constraints that encode the invariant (for example player + case, player + achievement, player + date + reward type).

## Error handling and observability
Keep structured JSON logs with event names, timestamps, player/case IDs where safe, and no secrets. User-facing errors remain generic Persian messages. Database and Telegram failures should be logged with operation context. Webhook responses should avoid unnecessary retry loops.

## Testing strategy
Use Node's built-in test runner. Every new game rule gets a failing unit test before implementation. Database invariants are tested through schema/migration tests where possible. Critical reward paths must include duplicate and concurrent-style attempts. Invalid callback IDs, locked cases, missing players, and malformed indexes require tests.

## Rollout order
1. Account gating and richer profile foundation.
2. Data-driven case engine and case catalog.
3. Conversational copy refresh.
4. Progression, XP, levels, and achievements.
5. Inventory/hints.
6. Daily challenge/mission systems.
7. Expanded rankings and case discovery.
8. Final UX polish, documentation, migration verification, and production smoke test.

## Non-goals for this phase
Do not introduce a separate web dashboard, payments, external authentication, or a second database. Telegram remains the primary client and Cloudflare Worker + D1 remain the backend architecture.
