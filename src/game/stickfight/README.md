# Plank Fighter World

A 2D fighting game rendered with three.js. Two stickmen, side view, orthographic
camera, 60 Hz fixed-step simulation. Everything about a character is data, so
adding fighters means adding one file.

Play it at `/arcade`. Run the checks with `npm run arcade:test`.

## Layout

```
game/stickfight/
  types.ts        every data shape: poses, hitboxes, moves, props, fighters
  skeleton.ts     forward kinematics - joint angles in, joint positions out
  clips.ts        shared movement/reaction animations (idle, walk, hit, KO...)
  constants.ts    the rules: gravity, meter, guard, knockdown, camera, rounds
  selftest.ts     headless checks, including the roster contract

  engine/         pure simulation, no three.js
    input.ts      key/pad state -> facing-relative directions, buffer, motions
    physics.ts    momentum, bounces and the verlet ragdoll
    fighter.ts    one fighter: state machine, move selection, physics
    match.ts      collision, hit resolution, projectiles, rounds, effects queue
    ai.ts         CPU opponent - emits the same RawInput a human would
    audio.ts      procedural SFX (no audio files)
    game.ts       fixed-step loop tying simulation, renderer and React together

  render/         three.js only, reads simulation state, never writes it
    post.ts       bloom, colour grade, vignette, impact flash
    shapes.ts     ink strokes, blob hands and feet, the open-circle head
    cloth.ts      verlet capes and coat tails
    trail.ts      fading ribbon off a swinging weapon
    rig.ts        skeleton -> inked body, props, cloth and trails
    stage.ts      parallax backdrops
    fx.ts         pooled particle effects
    renderer.ts   scene, camera framing, projectiles, debug boxes

  fighters/       the roster (one file each) + builders.ts helpers
  ui/             React: HUD, character select, move list, touch controls
```

The simulation never imports three.js and the renderer never mutates the
simulation. That split is what lets the self-test run the whole game headlessly.

## Roster contract

Every fighter must provide, and `npm run arcade:test` enforces it:

| Requirement | Where it comes from |
| --- | --- |
| **5 specials** | moves tagged `special` (EX versions and `variant` moves don't count) |
| **1 light attack** | a move tagged `light` (`5A`) |
| **1 heavy attack** | a move tagged `heavy` (`5C`) |
| **Block** | `universalMoves()` - hold S, or hold back |
| **Dodge** | `universalMoves()` - → + S roll with strike invulnerability |
| **Jump** | `stats.jumpVel` / `stats.gravity` |
| **Character skill** | one move tagged `skill` (A + C) |
| **Super** | one move tagged `super`, 100 meter |
| **Throws** | `universalMoves()` - A + B, and back throw |

Most fighters also carry mediums (`5B`), crouching normals (`2A/2B/2C`), a
command overhead (`6B`), a launcher (`3C`), air normals (`j.A/j.B/j.C`), a dash
attack and one or two EX specials. Copy an existing file and you get the shape
for free.

### Resources

A fighter can carry one resource bar next to their health: the Roman's pila,
the gunslinger's rounds, the samurai's Ki, the Spartan's Aegis, the soldier's
magazine, the Viking's Fury, the shinobi's Kage, the archer's Quiver, the Muay
Thai fighter's Rhythm. Moves declare `resourceCost` / `resourceMin` /
`resourceGain`, and the bar itself can `regen` passively, only while idle, or
fill from the fight through `gainOnHit`, `gainOnTakeHit` and `gainOnBlocked` -
which is how Fury works: she powers up by being in a fight she is losing.

## Adding a fighter

1. Copy `fighters/roman.ts` to `fighters/<name>.ts`.
2. Change `id`, `name`, bio, palette, `stats` and `stance`.
3. Rework the props (hat, weapon, cape) - they are declarative shapes attached
   to a joint, so no modelling is involved.
4. Write the moves. Five specials, and keep the standard ids so the AI and the
   move list group them correctly.
5. Register it in `fighters/index.ts`.
6. `npm run arcade:test` - it will tell you about dangling follow-up ids,
   hitboxes past the end of a move, animations that stop early, and any missing
   part of the contract.

Nothing else needs touching: select screen, portraits, move list, stages and AI
all read the definition.

### Poses in one minute

A pose is joint angles in degrees, layered over the fighter's stance. `F` is the
lead limb (nearer the opponent), `B` the back limb.

- `shoulderF: 90` raises the front arm straight forward, `180` straight up.
- `elbowF` bends the forearm forward, `kneeF` bends the shin backwards.
- `hipF: 40` swings the front leg forward, negative swings it back.
- `torso` leans towards the opponent, `crouch` (0..1) drops the hips.
- `weapon` rotates whatever is held in the front hand.
- `free: 1` unglues the feet from the floor (airborne poses).

Hitboxes live in facing space too: `bx(x, y, w, h)` with `x` forward from the
fighter and `y` up from the ground.

### Props in one minute

A prop is a list of flat shapes attached to a joint. `box`, `cyl`, `disc`,
`cone` and `tri` cover the simple pieces; `blade` is a sword or an axe edge
(`[length, width, taper]`, running along +x); `ring` is an annulus
(`[radius, thickness]`) for shield rims and headbands; and `poly` takes a flat
list of x,y pairs, which is what a cuirass, a helmet bowl or a recurve limb
wants. Hand props run along **+x** from the grip - the samurai's katana sits at
`pos: [50, 3]`, not above the hand - and `behind: true` puts a piece behind the
body. Set `conditional: true` for anything a move has to reveal through
`showProps` (a drawn pistol, a nocked arrow).

## Physics

Movement is momentum-based: walking accelerates towards its target speed and
sheds it again through ground drag, air control has drag and a terminal
velocity, and landing keeps part of your horizontal speed.

Launched bodies bounce. A hit tagged `groundbounce` or `wallbounce` gives the
victim one bounce, so a hard enough slam skips them off the floor or peels them
out of the corner - which is what the Spartan's kick and the samurai's EX draw
are built around. Thrown objects have their own restitution and drag: the
gunslinger's dynamite skips twice before it detonates.

When a fighter is knocked down or knocked out, the animated pose is handed to a
**verlet ragdoll** (`engine/physics.ts`): thirteen mass points, bone-length
constraints plus a few loose braces, gravity, floor collision with restitution
and friction. It produces a `Skeleton` exactly like an animation does, so the
renderer draws it with no special cases, and props keep following their joints.

Gameplay position stays authoritative - the ragdoll's hips are leashed to the
fighter's simulated x/y, easing in over the first 24 frames so the initial
tumble still comes from the hit. Physics changes how a body looks as it falls,
never where the game thinks it is. Getting up drops the ragdoll and returns to
the wakeup animation.

## How a fighter is drawn

The look is a stick figure drawn in ink, wearing real kit. `rig.ts` turns a
posed `Skeleton` into that:

- **Ink strokes.** Each bone is a thin capsule, slightly wider at the joint
  carrying the weight, painted in the fighter's outline colour. The body stays
  ink; the costume carries all the colour.
- **A halo of paper.** Behind every stroke sits a slightly fatter one in the
  fighter's skin tone. A stick figure is ink on paper, and without the paper a
  black stroke vanishes against Neon Bazaar or the Ember Forge - so each
  fighter carries a sliver of their own around with them.
- **Blob hands and feet, and an open circle for a head.** Fists swell off the
  end of the forearm, feet are teardrops lying along the floor, and the head is
  a pale disc inside a heavy ink ring. There is no face: which way a fighter is
  looking comes from the pose, the same way it does in the drawing.
- **Props** (`ShapePart[]`) get the same ink line, so a helmet reads as part of
  the drawing rather than a sticker over it. All of one prop's lines merge into
  a single mesh per layer, so full armour costs two extra draw calls, not
  thirty. On top of that they carry an across-the-form gradient with a hot band
  along the top eighth, which is what makes bronze and steel read as bevelled -
  and the ramp is measured along the part's own rotation, so a spear held flat
  shades across its thickness instead of from butt to tip.
- **Cloth.** A prop can declare `cloth`, which hangs a verlet strip from its
  attachment point: capes lag behind a dash, snap on a reversal and settle when
  the fighter stands still. Simulated in world space, so it keeps its momentum.
- **Weapon trails.** Anything held with real reach leaves a fading ribbon off
  its tip while an attack is live.

Portraits on the select screen (`ui/Portrait.tsx`) are drawn in SVG from the
same stance data and the same proportions, so they cannot drift from the game.

## Presentation

The scene is flat, unlit art, so the post chain does the work a lighting rig
normally would (`render/post.ts`):

- **Bloom** picks out the hot things - muzzle flashes, supers, lava, neon,
  weapon trails. It runs at half resolution because it is a soft glow and
  nobody can tell, which makes it four times cheaper on fill rate. Its
  threshold is high on purpose: bright backdrops sit just under it, so a sky
  full of clouds does not flare the whole frame.
- **Soft particles.** Sparks, smoke and embers sample a radial alpha falloff
  drawn once into a canvas, so they have no polygon edge and their bright
  centres are what the bloom picks up.
- **Grade and vignette** add a little contrast and saturation and pull focus to
  the middle of the arena.
- **Impact channel**: supers, explosions, parries and KOs wash the screen for a
  frame or two, and chromatic aberration scales with screen shake so heavy hits
  smear the edges.

The camera has its own feedback: a spike in screen shake punches it in for a few
frames, and the end of a round pushes in slowly on whoever is on the floor.

Effects are on by default on desktop and off on touch/small screens. A watchdog
samples frame time for the first 90 frames and drops to the plain render if the
machine cannot hold it - and the in-match FX button overrides either way.

## Stages

Nine arenas, each a few parallax layers plus optional ambient weather. Two
scrims of the horizon colour sit over the far and mid layers, so distance reads
as distance instead of every backdrop sharing a plane with the fighters.

| Stage | Weather |
| --- | --- |
| The Colosseum | drifting sand |
| Storm Deck | driving rain |
| Perdition Flats | blowing dust |
| Blossom Dojo | falling petals |
| Neon Bazaar | neon-lit rain |
| Frozen Pass | snow under an aurora |
| Ember Forge | rising embers |
| Cloudbreak Temple | drifting motes |
| Monsoon Delta | monsoon rain |

Pick one on the select screen or leave it on Random. To add a stage: add a key
to `StageTheme`, an entry to `STAGE_THEMES` (sky, ground, accent, ambient) and a
`build<Name>()` method in `stage.ts`. The select screen and the random roll pick
it up automatically.

Ambient weather is a small pooled particle field that wraps around the camera,
so density is independent of how far the fighters travel.

## Controls

| Input | Action |
| --- | --- |
| WASD / arrows / d-pad | move, jump, crouch |
| J / K / L | light, medium, heavy |
| hold U or `;` | block (add ↓ to block low) |
| ← + S / → + S | parry / sidestep |
| J + L | character skill |
| J + K | throw |
| ↓↘→ + button | quarter-circle specials |
| →↓↘ + button | dragon punch specials |
| motion + S | EX special (50 meter) |
| hold ← then → + button | charge specials (the archer's Heartseeker) |
| Esc / Start | pause · F2 shows hitboxes |

Gamepads use the standard mapping: ✕ light, ○ medium, □ heavy, △/L1/L2 guard,
R1 skill, R2 throw, Start pause. Player 1 gets the first pad, player 2 the
second; keyboard and pad both work at once.
