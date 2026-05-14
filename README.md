# color-nearest-match-kit

[![License: MPL-2.0](https://img.shields.io/badge/license-MPL--2.0-blue.svg)](LICENSE)
[![CI](https://github.com/Recoveredd/color-nearest-match-kit/actions/workflows/ci.yml/badge.svg)](https://github.com/Recoveredd/color-nearest-match-kit/actions/workflows/ci.yml)

Small browser-friendly TypeScript toolkit for matching one color against a named palette.

It is designed for UI tools, design token checks, dashboards, and import flows where callers need a stable nearest color result without Node-only APIs or runtime dependencies.

## Demo

Try the browser preview: [packages.wasta-wocket.fr/color-nearest-match-kit](https://packages.wasta-wocket.fr/color-nearest-match-kit/).

## Package quality

- TypeScript types are generated from the source.
- ESM-only package with no runtime dependencies.
- Marked as side-effect free for bundlers.
- CI runs `npm ci`, `typecheck`, `build`, and `test`.
- Tested on Node.js 20 and 22 with GitHub Actions.
- Browser-friendly implementation with no Node-only APIs.

## Install

```bash
npm install color-nearest-match-kit
```

## Quick Start

```ts
import { createColorMatcher } from "color-nearest-match-kit";

const matcher = createColorMatcher([
  { name: "brand-blue", value: "#2563eb" },
  { name: "brand-green", value: "#16a34a" },
  { name: "brand-red", value: "#dc2626" }
]);

const result = matcher.match("#1d4ed8");

if (result.ok) {
  console.log(result.match.name);
  console.log(result.match.distance);
}
```

## API

### `createColorMatcher(palette, options?)`

Compiles and validates a palette once, then returns a matcher object.

```ts
const matcher = createColorMatcher([
  { name: "ink", value: "#111827" },
  { name: "paper", value: "#ffffff" }
]);
```

### `matcher.match(input, options?)`

Returns the closest entry as a structured result. Invalid input does not throw.

```ts
const result = matcher.match("#101010");
```

Runtime-invalid RGB objects and invalid distance options return `{ ok: false, error, message }` instead of throwing, which keeps UI import flows easy to diagnose.
Runtime-invalid palette entries also return `invalid-palette-entry`.

### `matcher.rank(input, options?)`

Returns the closest entries sorted from nearest to farthest.

```ts
const topThree = matcher.rank("#101010", { limit: 3 });
```

### `parseHexColor(input)`

Parses `#rgb`, `#rrggbb`, `rgb`, and `rrggbb` hex strings into RGB channels.

## Distance Modes

The default `weighted-rgb` mode gives green channel differences slightly more influence, which usually better matches visual perception than raw Euclidean RGB for simple UI palettes.

Use `distance: "rgb"` when you need plain Euclidean RGB distance.

```ts
matcher.match("#77aa33", { distance: "rgb" });
```

## Browser Compatibility

The core uses only JavaScript arrays, objects, strings, and math. It does not require `fs`, `path`, `Buffer`, `process`, network access, or native modules.

## CLI

No CLI is included in this draft. The primary use case is in-app color matching, and a CLI would add Node packaging surface without clear value for the first version.
