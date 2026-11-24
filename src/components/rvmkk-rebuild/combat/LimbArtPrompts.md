# RVMKK limb and reaction art

Generated with the built-in image-generation tool from the existing fighter attack atlases. Original atlases and character portraits were preserved. Output PNGs are copied unchanged; runtime UV rectangles select individual poses. No offline raster editing was performed.

## Sixteen-frame common prompt

Use case: identity-preserve.
Asset type: a production fighting-game transparent sprite atlas, exactly FOUR COLUMNS by FOUR ROWS, sixteen equally-sized cells, square 2048x2048 or larger. No cell borders or text. Transparent background, generous clear gaps between cells. Each cell contains ONE complete full-body pose of the SAME SINGLE referenced adult fighter. These are animation frames, not additional characters.
Reference: the uploaded four-pose atlas is the exact identity, outfit, likeness, colors, body shape, props and render style to preserve. Keep semi-realistic richly textured fighting-game illustration. DO NOT make chibi, cartoon, toy or redesign. Keep face recognizable even while reacting. No opponents.
Every pose faces screen RIGHT, THREE-QUARTER SIDE view. Left/right below always refer to the FIGHTER'S ANATOMICAL limbs, not mirrored copies; clearly rotate torso and bring the other shoulder/hip forward. Keep all arms/legs anatomically connected, same limb count and same costume.
Rows, left to right, STRICT order:
ROW1: standing LEFT-hand awkward slap/punch; standing RIGHT-hand awkward slap/punch; standing LEFT-leg extended kick; standing RIGHT-leg extended kick.
ROW2: low crouching LEFT-hand upward awkward slap; low crouching RIGHT-hand awkward backhand; low crouching LEFT-leg sweep extended toward right; low crouching RIGHT-leg sweep extended toward right.
ROW3: airborne LEFT-hand extended punch/swimming slap; airborne RIGHT-hand extended punch/swimming slap; airborne LEFT-leg extended flailing kick; airborne RIGHT-leg extended flailing kick. Air poses tuck the supporting leg, no ground.
ROW4: head-hit reaction: recoils backward, eyes squeezed and hands up to cheek; stomach-hit reaction: doubles over clutching stomach, cheeks puffed; leg-hit reaction: bends knee, clutches struck shin, hopping in pain; completely knocked down ON THEIR BACK, supine, face/chest toward ceiling, head to left and feet to right, full body lying horizontally. No wounds or gore, no blood. Last pose must actually lie flat, not a rotated standing guard.
No new people, no outfit changes, no duplicate limbs, no text, no floor shadows or scenery. Keep every pose wholly inside its own cell, even the full kick and flat-back frame.

## Character invariants

### gaibden

GAIBDEN: same long black hair, goatee, rice hat, red/black/gold armor, blue lightning. His unique attacks are panicked chicken-wing slaps and stiff static-shock goose kicks, silly elbow positions and surprised concentration. Keep hat in all frames.

### keen-kahn

KEEN-KAHN: same face, goatee, gold crown, black/gold spiked lion armor. His unique attacks are pompous doggy-paddle royal slaps and prissy toe-pointing kicks, deeply ridiculous body mechanics, confident facial arrogance.

### kitaria

KITARIA: same face, adult woman, black ponytail, blue black gold costume, blue fans. Her unique attacks are frantic fan-hand swats, wrist-floppy backhands, and shoe-stuck-to-gum leg kicks, awkward fancy balance. Keep twin fans with her (fold as appropriate), no wardrobe changes.

### treytaro

TREYTARO is the SAME muscular black male CENTAUR: ram horns, beard, black/gold harness with red RK tabard, pizza, spiked tail, EXACTLY TWO HUMAN ARMS and FOUR HORSE LEGS. His unique strikes are a left pizza-hand awkward swat, right spaghetti-wrist punch, left FRONT horse-leg kick and right FRONT horse-leg kick. Crouch with horse legs folded; jump has all FOUR hooves off ground; reactions preserve centaur horse body; supine entire centaur with four hooves upward. Do not convert him to a biped or add horse legs. Pizza remains his identifying prop.

### kardozo

KARDOZO: same brown skin, beard, mohawk ponytail, leather harness and red loincloth, spiked bracers/shinguards. EXACTLY FOUR ARMS and TWO LEGS in EVERY frame. His unique attack: one upper arm flails while lower arms grab his own elbow/waist getting in his way, left/right upper hands attack alternately, other three remain visibly anatomically connected. Legs do panicky knock-kneed kicks. Never give him only two arms or six arms.

### datennisha-blaze

DA'TENNISHA BLAZE: same adult woman's face, blonde/brown bob, olive military cap, olive crop outfit, black gloves and tall boots. Her unique attacks are enraged drill-sergeant doggy-paddle swats and extremely high goose-step kicks with accidental duck-foot wobble. Preserve cap/hair/costume exactly.

### gare-chi

GARE-CHI: same older adult white-bearded face, glasses, white skin with red target/body markings, brown/green gladiator armor, quiver, Bugles bag and snack cones. His unique attacks are petty snack-bag left-hand backhands and right-hand Bugle-finger claws, awkward old-man hip-stiff kicks while protecting snacks. Preserve beard, glasses, bag, target markings.

## Opposite-limb sheets

Six-frame sheets give the right limb its own artwork. Production prompt example:

Use case: identity-preserve. Production transparent sprite sheet, TWO columns THREE rows, SIX full-body poses, no lines/text/background. Preserve the EXACT same fighter, face, hair, clothing, colors and semi-realistic game art style as the reference. Full body and generous empty gaps. These are SIX animation poses of the same character.
IMPORTANT opposite limbs: The reference usually attacks with the far arm whose shoulder is at screen RIGHT. Now the NEAR arm attached to the SCREEN LEFT shoulder must cross IN FRONT of the chest to reach RIGHT; the other hand must be visibly tucked beside the face. Clearly show the other shoulder and forearm doing the work. The other leg, normally supporting the character, must now kick in front of the hips; change supporting leg. No whole-character mirroring, no same-arm palm/fist substitution. For four-armed Kardozo, keep ALL FOUR ARMS visible and connected. All face right.
Row1: standing RIGHT-arm cross-body awkward swat, standing RIGHT-leg kick. Row2: crouching RIGHT-arm swat, crouching RIGHT-leg sweep. Row3: airborne RIGHT-arm flailing punch, airborne RIGHT-leg flailing kick.
DA'TENNISHA BLAZE: same adult woman's face, blonde/brown bob, olive military cap, olive crop outfit, black gloves and tall boots. Her unique attacks are enraged drill-sergeant doggy-paddle swats and extremely high goose-step kicks with accidental duck-foot wobble. Preserve cap/hair/costume exactly.
No added characters, changed outfit, changed face, gore or cell labels. True transparent alpha.

The same constraints were applied to all seven fighters. The other character-specific invariants above replace the example's description. All outputs use transparent alpha. Assets: `combat/limbs/{fighter}.png` and `combat/opposite/{fighter}.png`. Metadata: `LimbAtlasMetadata.mjs`.

