# RVMKK: left/right combat and FUCKTALITIES

Route: `/rvmkk-rebuild`. Seven original fighters, original rooster branding and seven living stages. The established transparent illustrated fighter art is rendered in a Three.js arena. No remote match/account writes occur.

## Controls

| Action | Player 1 | Player 2 |
| --- | --- | --- |
| Move | A / D | Left / Right arrows |
| Jump / crouch | W / S | Up / Down arrows |
| Left punch / right punch | F / T | J / I |
| Left kick / right kick | G / Y | K / P |
| Block | H | L |
| Signature gag | R | O |
| Special | E | U |
| Pause | Escape | Escape |

Phones have four separate attack buttons per player, plus movement, jump, crouch, block, GAG and SPECIAL. Hold crouch or jump and tap a limb button to select that posture. Each fighter has twelve distinct standing/crouching/air inputs. Forward plus a standing strike gives a stronger hit. The menu can show either player or both.

## Combat and reactions

The fixed 60 Hz simulation consumes attack edges during locked states. Active hitboxes exist only during an active strike. Left/right attacks select independently rendered limbs; facing reversal is separate from limb selection. Upper body hurtbox height follows the larger foreground artwork. Impact height relative to the defender selects head, torso or leg pain. Guards and misses never select pain poses.

Heavy kicks and sweeps launch and knock fighters onto their backs. Landing leads to a brief grounded knockdown, then a protected get-up when health remains. Zero-health fighters stay down. Rematches reset reaction state and cameras.

## FUCKTALITIES

Win the match with a KO (first to two rounds). After the finish cue, the winner's ten-second cinematic runs automatically; combat controls and the round timer stop. Pause freezes the cinematic. A timeout or drawn match does not trigger it.

- KEEN-KAHN: ROYAL FLUSH OF SHAME — royal swats and a golden toilet launch.
- KITARIA: SIX SNEEZES TO OBLIVION — six left-shoulder sneezes feed a fan cyclone.
- TREYTARO: DEEP-DISH DISRESPECT — the opponent becomes a hand-tossed delivery.
- KARDOZO: FOUR-HAND CUSTOMER SERVICE — squeeze, fold and eject the complaint.
- GAIBDEN: VOIDING YOUR WARRANTY — a tiny test shock becomes the wrong voltage.
- DA’TENNISHA BLAZE: MANDATORY BOOTY CAMP — drills, a launch and a literal giant boot.
- GARE-CHI: CORNHOLE CANNONADE — the snack bag escalates into a corn barrage.

Cinematics animate the selected fighter sprites in the same arena, with native 3D props, four camera compositions, automatic framing and grounded final poses. They use no prerecorded movies or substitute cartoon actors. The oblique cameras keep the illustrated actors facing the lens. Existing signature gags, including the six-sneeze salute and royal pelvic thrust, remain available.

## Installation

Run the delivered guarded installer against the existing Floor/Depth Fix version:

`node "$env:USERPROFILE\Downloads\RVMKK-Awkward-Combat-Fucktalities.cjs" "C:\Projects\rejects-kombat-lab"`

The installer backs up replacements, verifies hashes, refuses unfamiliar local edits before writing and rolls back a failed write. It changes only this game’s combat files and new pose atlases. It does not deploy, change dependencies or edit other games. Restart a running dev server if needed and hard-refresh the game.

## Release verification

The simulation matrix checks all 84 character/limb/posture inputs, body-region hits, knockdown/get-up, permanent KO, the ten-second finisher, pausing, rematches, held-input single hits, guards, crouch ducking and phone input edges. Browser checks cover all seven fighters, all pose variants, seven cinematics and camera resets, keyboard controls and 22 phone controls. Test-only routes are excluded from the shipped update.
