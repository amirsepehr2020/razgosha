# رازگشا — Global Wrong-Guess Score Penalty

## Goal
Apply one reusable mistake/score-penalty system to every current case/stage and every future case without duplicating penalty logic inside individual stages.

## Rules
- 0 wrong guesses: 100% of the case score.
- 1st wrong guess: 50% of the case score.
- 2nd wrong guess: 25% of the case score.
- 3rd or later wrong guess: 0% of the case score.
- The case can still be completed after the score reaches 0; only the score reward is lost.
- Mistakes belong to the active player + case attempt, not globally to all players.
- Starting a fresh attempt resets that attempt's mistake counter.

## UX
Before a consequential guess, show a prominent warning. The warning adapts to the current mistake count:
- Before first guess: `⚠️ هشدار! در صورت پاسخ اشتباه، امتیاز این پرونده نصف خواهد شد!`
- Before second guess: explain that another wrong guess reduces the case score to 25%.
- Before third guess: clearly state that another wrong guess makes the case score 0.
After a wrong guess, show the new penalty state and remaining score multiplier.

## Architecture
Create a centralized score-penalty module with pure functions for:
- converting mistake count to score multiplier;
- calculating awarded score from base score;
- generating the correct warning/status text;
- recording/reading the mistake count for the active case attempt.

Integrate the final case-answer path in `src/index.js` with this module. The stage engine and case data remain unchanged, so future stages inherit the behavior automatically. Do not hard-code penalty behavior separately in cases 1–60.

## Persistence
Reuse the existing per-user game/account persistence where available. Store mistake state by active case attempt so a new attempt starts cleanly while the same in-progress attempt keeps its penalty after navigation/reloads.

## Tests
Add focused tests covering:
- multipliers 0/1/2/3+;
- awarded-score calculation;
- warning text for each guess state;
- wrong-answer progression 0 -> 1 -> 2 -> 3;
- score remaining 100% -> 50% -> 25% -> 0%.

## Acceptance criteria
1. Cases 1–60 use the same centralized penalty logic.
2. Future cases automatically use it without per-case changes.
3. Warnings appear before the final guess.
4. A wrong guess never accidentally awards full case points.
5. Three wrong guesses permanently reduce that active attempt's case score to 0.
6. Existing account/progress/reward behavior remains intact.
7. Tests pass.
