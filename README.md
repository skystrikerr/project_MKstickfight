# Stick Fighter

A 2D fighting game in the browser, built on three.js. Fifteen fighters, every
one of them a person the historical record actually names, drawn as inked stick
figures and armed with the weapon the sources give them.

```bash
npm install
npm run dev      # http://localhost:5173
npm run test     # headless simulation self-tests
npm run build    # typecheck + production bundle
```

## The roster

| Fighter | Era | Archetype |
|---|---|---|
| Lucius Vorenus | Nervii country, 54 BC | Zoner / Wall |
| Dienekes | Thermopylae, 480 BC | Grappler / Wall |
| Freydís Eiríksdóttir | Vinland, c. 1000 | Berserker / Bruiser |
| Tomoe Gozen | Awazu, 1184 | Footsies / Counter |
| Subutai | Kalka River, 1223 | Zoner / Charge |
| John Chandos | Poitiers, 1356 | Armoured Bruiser |
| Tzilacatzin | Tenochtitlan, 1521 | Rushdown / Mix-up |
| Yuekong | Jiangnan coast, 1553 | Zoner / Stance |
| Hattori Hanzō | Iga crossing, 1582 | Mix-up / Mobility |
| Anne Bonny | Negril Point, 1720 | Rushdown / Mix-up |
| Nai Khanom Tom | Ava, 1774 | Rushdown / Clinch |
| Akali Phula Singh | Punjab, 1807 | Zoner / Resource |
| Mgobozi ovela Ntla | Gqokli Hill, 1818 | Pressure / Footsies |
| Wyatt Earp | Tombstone, 1881 | Zoner / Punisher |
| The Ia Drang Trooper | Ia Drang Valley, 1965 | Zoner / Resource |

The last of these is the one deliberate exception: the unit, the valley and
every piece of the kit are real, but the man is a composite rather than a named
individual.

## Controls

| | Player 1 | Player 2 |
|---|---|---|
| Move / jump / crouch | `W A S D` | Arrow keys |
| Light / Medium / Heavy | `J` `K` `L` | `N` `M` `,` |
| Guard | hold `U` or `;` | `.` or Numpad 0 |

Gamepads work too — plug one in and press a button. `←` + Guard parries, `→` +
Guard rolls, `A + B` throws, `A + C` is the character's skill.

Every fighter has five specials on motion inputs (`↓↘→` quarter circles, `→↓↘`
dragon punches), EX versions on the Guard button for 50 meter, and a super for
100.

## How it is put together

```
src/game/stickfight/
  types.ts          every fighter is plain data - stats, poses, hitboxes, props
  constants.ts      the global rules: meter, guard, knockback, juggle decay
  skeleton.ts       joint angles -> world-space bone positions
  skins.ts          alternate colour schemes as a transform, not a second art set
  selftest.ts       headless simulation tests, run with `npm run test`
  engine/           the simulation: input buffer, fighter state, match, AI
  fighters/         one file per character
  render/           three.js: rig, stage, particles, post-processing
  ui/               React: select screen, HUD, move list, touch controls
```

The simulation is a fixed 60 Hz step and knows nothing about rendering. Adding a
fighter means adding one file in `fighters/` and listing it in `fighters/index.ts`
— the select screen, move list, AI and renderer are all driven off the data.

`npm run test` runs every matchup to completion under AI control and checks each
character honours the roster contract: five specials, a light, a heavy, a block,
a parry, a dodge, a throw, a skill and a super.
