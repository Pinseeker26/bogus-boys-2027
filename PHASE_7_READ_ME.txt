PHASE 7 — PLAYER ROSTER & GUESTS
1. BACK UP your existing Supabase data before running a migration.
2. Open Supabase > SQL Editor and run PHASE_7_SETUP.sql once.
3. In Supabase > Integrations > Data API > Settings, expose the new golfers and guest_appearances tables (leave automatic exposure off).
4. Copy your working Project URL and sb_publishable_ key into js/supabase-config.js. NEVER use a secret key.
5. Open login.html, sign in, then open Online Commissioner HQ.
6. Add a TEST golfer and a TEST guest; assign the guest to a week and refresh to verify persistence.
IMPORTANT: This is the FIRST ROSTER MODULE. It does NOT yet migrate old demo players, link login accounts, or feed attendance, scores, handicaps, standings, or money-hole results. Do not enter real scoring data until those integrations are implemented and tested.
Guests are eligible ONLY for closest-to-pin and longest-putt money holes, not BBPts or playoffs. League nights are Tuesdays; schedule dates are still edited manually.
