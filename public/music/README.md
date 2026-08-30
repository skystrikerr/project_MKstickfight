# Music

Sound effects are synthesised in code, but music is not. Drop audio files in
this folder and name them in `src/game/stickfight/engine/music.ts`.

## Adding a track

1. Put the file here, e.g. `public/music/theme.mp3`.
   `.mp3`, `.ogg` and `.m4a` all work in every browser the game targets.

2. Name it in the `TRACKS` table in
   `src/game/stickfight/engine/music.ts`:

   ```ts
   export const TRACKS: Partial<Record<MusicCue, TrackDef | TrackDef[]>> = {
     menu: { file: "theme.mp3" },
     select: { file: "select.mp3" },
     fight: [{ file: "fight-1.mp3" }, { file: "fight-2.mp3" }],
     victory: { file: "win.mp3", loop: false },
   };
   ```

That is the whole job. The cues are:

| Cue       | When it plays                                  |
| --------- | ---------------------------------------------- |
| `menu`    | Title screen                                    |
| `select`  | Character select                                |
| `fight`   | The match. An array picks one at random a round |
| `victory` | The win screen. Set `loop: false` for a sting   |

A cue with no track is silent, and a file that fails to load is ignored, so
the game runs fine with this folder empty - which is how it ships.

`gain` trims a track that was mastered louder or quieter than the others:
`{ file: "theme.mp3", gain: 0.7 }`.

## Before you commit a track

Files in here are copied into the build and published with it - to GitHub
Pages, and inside the Windows `.exe`. Only add music you wrote, licensed, or
that is genuinely free to redistribute, and put the licence and attribution
in this file. A track you merely have a copy of is not one you can ship.

## Tracks in this build

_None yet._
