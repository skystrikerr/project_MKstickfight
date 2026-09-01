# Fonts

Three faces, subset to latin + latin-ext (the roster needs the accents in
Freydís Eiríksdóttir and Hattori Hanzō), vendored rather than loaded from a
CDN: the desktop build runs off disk with no network, and `pack:page` folds
everything into one HTML file.

| File | Family | Used for |
| --- | --- | --- |
| `chakra-400/700-*` | Chakra Petch | Headings, fighter names, labels |
| `barlowsc-400/600-*` | Barlow Semi Condensed | Body and labels |
| `plexmono-500-*` | IBM Plex Mono | Notation, frame data, numbers |

All three are under the SIL Open Font License 1.1, which permits bundling and
redistribution inside a larger work:

- Chakra Petch — Copyright Cadson Demak
- Barlow Semi Condensed — Copyright The Barlow Project Authors
- IBM Plex Mono — Copyright IBM Corp.

Vite inlines them into the stylesheet as data URIs (`assetsInlineLimit` in
`vite.config.ts`), so there is nothing to copy at deploy time.
