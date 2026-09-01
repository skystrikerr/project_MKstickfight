# Fonts

Three faces, vendored rather than loaded from a CDN: the desktop build runs off disk with no network, and `pack:page` folds
everything into one HTML file.

| File | Family | Used for |
| --- | --- | --- |
| `ostrich-heavy` | Ostrich Sans Heavy | Headings, fighter names, the wordmark |
| `barlowsc-400/600-*` | Barlow Semi Condensed | Body and labels |
| `plexmono-500-*` | IBM Plex Mono | Notation, frame data, numbers |

All three are under the SIL Open Font License 1.1, which permits bundling and
redistribution inside a larger work:

- Ostrich Sans — Copyright The League of Moveable Type (see OFL-OstrichSans.md)
- Barlow Semi Condensed — Copyright The Barlow Project Authors
- IBM Plex Mono — Copyright IBM Corp.

Vite inlines them into the stylesheet as data URIs (`assetsInlineLimit` in
`vite.config.ts`), so there is nothing to copy at deploy time.

## On the Ostrich weight

Only the Heavy cut ships. Ostrich Sans Black and Bold carry 109-115 glyphs
and are missing `í`, `ó` and `ō` — which is two names on this roster rendered
as tofu. Heavy has 303 and covers them. If a future weight is added, check the
cmap before trusting it.
