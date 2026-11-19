# RVMKK — November 2026 approved update handoff

**Scope:** Only the current Rejects Very Mortal Kumbat / RVMKK game. No other game or site. This is an integration checklist, **not** proof of finished character models, fighting animations, or completed combat overhaul.

## Roster
Playable roster, in order: GAIBDEN; GARE-CHI; DA’TENNISHA BLAZE; TREYTARO; KITARIA; KEEN-KAHN; KARDOZO; NICOLEENA; COKANE-O; SCORPURTIS. **X-MAN** is separate as final boss. X-Man calls out **"KEYZER SÖZE!"** to his dogs; it is *not* a separate fighter. Do not restore Cokane-O's retired name or add Da’Stonya as another roster slot (already represented elsewhere under another name). Do not use dragon emblems.

## Character art and moves
- **Preserve approved appearance/reference art.** Do not substitute newly invented likenesses for fighters.
- **Gaibden:** first combat overhaul target, preserving original design. Include named special **BAD CONNECTION** and finisher **LOW BATTERY**. Integrate actual combat animations and specials only from the approved reference work; do not pretend these metadata notes implement them.
- **Nicoleena:** longer, thinner, more durable tongue; forward-reaching spiral/slinky action, including a clearly visible spiral pose. Do not change her established appearance.
- **Cokane-O:** use the approved reference images and established body proportions; do not substitute a skinny redesign. Additional position/reference chart must be integrated from the source images, not guessed from descriptions.
- **Kitaria:** the three approved reference pictures are all the same fighter; a legacy "KITANA" label on one picture must not become a new character.
- **Kardozo:** **DO NOT TOUCH.** User instructed to skip him in the current pass because he is being worked on separately. Do not modify his art, animations, slam, or combat logic specific to him without renewed permission.
- The rest of the playable cast retains the approved existing designs and move sets.

## Gameplay defects to fix in full game
1. **No disconnected anatomy:** all parts stay attached through idle, walking, jumping, attacks, knockdown, ragdoll, and recovery, unless intentional separation is part of a specific move. Fix parent/root joint transforms and frame-to-frame position jumps. A horizontally downed fighter's head/limbs must not appear several feet away.
2. **Both fighters remain visible:** during ordinary close-range combat, neither fighter should cover or cloak the other. Maintain legible horizontal spacing and facing; only intentional special sequences can break this rule.
3. Validate collision/hit reactions and camera framing with multiple fighter body widths and knockdown orientations; prevent tunneling or impossible position swaps.

## GitHub integration boundary
GitHub main initially held a small colored-box prototype (public/fighter.js, public/main.js), not the separate recent game build. This branch documents approved changes and implements a **prototype-level spacing fix only**. It does not contain finished character visuals, move animations, character-specific rigging, knockdowns, or an installer. Merge/integrate into the actual working game only after identifying the up-to-date source files. **Do not deploy.**


## November 18 source recovery / integration safety
A separate, SHA-256-verified **current RVMKK site integration export** was recovered from the user's saved project Library: `RVMKK-Recent-Verified-Updates-2026-11-18.zip`. It contains 22 files from the November three-fighter import: 8 character WebP assets and 14 source files. It is **not** the older `rejects-vmkc` box-fighter prototype, and is not the whole site's current source tree.

A second safety-filtered ZIP, `RVMKK-Current-Game-Safe-Integration-2026-11-18.zip`, was produced with 20 SHA-256 verified entries (8 art assets + 12 review-only source files), explicitly **excluding** `KardozoSlam.mjs` and `KardozoSlamView.mjs`. It also includes a read-only Node worktree audit. This ZIP is a separate user-accessible artifact, **not uploaded to this GitHub repo**.

Do not overwrite any game source file from these snapshots without comparing with the live working checkout at `C:\Projects\rvmkk-phone-preview` (last known root, not newly reverified). Importer snapshot may be older than current local edits. In particular `CombatModel.mjs` and `ArenaEngine.mjs` are shared combat source files and could indirectly impact Kardozo; review them line-by-line.

The user-reported full-body disconnection and close-combat silhouette occlusion issues remain **unverified/fix pending in the actual game**. The earlier proof-of-concept spacing guard in `public/main.js` belongs only to the old prototype; it is **not a fix** for the current website game. Preserve originals, no deploy.
