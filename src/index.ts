export type RgbColor = {
  readonly r: number;
  readonly g: number;
  readonly b: number;
};

export type PaletteEntry = {
  readonly name: string;
  readonly value: string | RgbColor;
  readonly meta?: unknown;
};

export type DistanceMode = "weighted-rgb" | "rgb";

export type ColorMatcherOptions = {
  readonly distance?: DistanceMode;
};

export type RankOptions = ColorMatcherOptions & {
  readonly limit?: number;
};

export type ColorMatch = {
  readonly name: string;
  readonly value: string;
  readonly rgb: RgbColor;
  readonly distance: number;
  readonly meta?: unknown;
};

export type ColorMatchError =
  | "empty-palette"
  | "invalid-color"
  | "invalid-distance"
  | "invalid-palette-entry"
  | "invalid-limit";

export type ColorResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: ColorMatchError; readonly message: string };

export type MatchResult =
  | { readonly ok: true; readonly match: ColorMatch }
  | { readonly ok: false; readonly error: ColorMatchError; readonly message: string };

export type RankResult =
  | { readonly ok: true; readonly matches: readonly ColorMatch[] }
  | { readonly ok: false; readonly error: ColorMatchError; readonly message: string };

export type ColorMatcher = {
  readonly size: number;
  readonly match: (input: unknown, options?: ColorMatcherOptions) => MatchResult;
  readonly rank: (input: unknown, options?: RankOptions) => RankResult;
};

type CompiledEntry = {
  readonly name: string;
  readonly value: string;
  readonly rgb: RgbColor;
  readonly meta?: unknown;
};

const HEX_SHORT = /^[0-9a-f]{3}$/i;
const HEX_LONG = /^[0-9a-f]{6}$/i;

export function parseHexColor(input: unknown): ColorResult<RgbColor> {
  if (typeof input !== "string") {
    return {
      ok: false,
      error: "invalid-color",
      message: "Expected a hex color string."
    };
  }

  const normalized = input.trim().replace(/^#/, "");

  if (HEX_SHORT.test(normalized)) {
    const [r, g, b] = normalized;
    return {
      ok: true,
      value: {
        r: parseInt(`${r}${r}`, 16),
        g: parseInt(`${g}${g}`, 16),
        b: parseInt(`${b}${b}`, 16)
      }
    };
  }

  if (HEX_LONG.test(normalized)) {
    return {
      ok: true,
      value: {
        r: parseInt(normalized.slice(0, 2), 16),
        g: parseInt(normalized.slice(2, 4), 16),
        b: parseInt(normalized.slice(4, 6), 16)
      }
    };
  }

  return {
    ok: false,
    error: "invalid-color",
    message: "Expected a hex color in #rgb, rgb, #rrggbb, or rrggbb format."
  };
}

export function toHexColor(input: unknown): ColorResult<string> {
  const rgb = normalizeRgb(input);

  if (!rgb.ok) {
    return rgb;
  }

  return {
    ok: true,
    value: `#${channelToHex(rgb.value.r)}${channelToHex(rgb.value.g)}${channelToHex(rgb.value.b)}`
  };
}

export function createColorMatcher(
  palette: readonly PaletteEntry[],
  defaultOptions: ColorMatcherOptions = {}
): ColorMatcher {
  const compiled = compilePalette(palette);

  return {
    size: compiled.ok ? compiled.value.length : 0,
    match(input, options) {
      const ranked = rankCompiled(compiled, input, { ...defaultOptions, ...options, limit: 1 });

      if (!ranked.ok) {
        return ranked;
      }

      const [match] = ranked.matches;

      if (!match) {
        return {
          ok: false,
          error: "empty-palette",
          message: "Cannot match colors against an empty palette."
        };
      }

      return { ok: true, match };
    },
    rank(input, options) {
      return rankCompiled(compiled, input, { ...defaultOptions, ...options });
    }
  };
}

export function findNearestColor(
  input: unknown,
  palette: readonly PaletteEntry[],
  options?: ColorMatcherOptions
): MatchResult {
  return createColorMatcher(palette, options).match(input);
}

function compilePalette(palette: readonly PaletteEntry[]): ColorResult<readonly CompiledEntry[]> {
  if (!Array.isArray(palette)) {
    return {
      ok: false,
      error: "invalid-palette-entry",
      message: "Palette must be an array of entries."
    };
  }

  if (palette.length === 0) {
    return {
      ok: false,
      error: "empty-palette",
      message: "Cannot create a color matcher from an empty palette."
    };
  }

  const entries: CompiledEntry[] = [];

  for (const entry of palette) {
    if (!isPaletteEntryLike(entry)) {
      return {
        ok: false,
        error: "invalid-palette-entry",
        message: "Palette entries must be objects with a non-empty name and color value."
      };
    }

    if (typeof entry.name !== "string" || entry.name.trim() === "") {
      return {
        ok: false,
        error: "invalid-palette-entry",
        message: "Palette entries must include a non-empty name."
      };
    }

    const rgb = typeof entry.value === "string" ? parseHexColor(entry.value) : normalizeRgb(entry.value);

    if (!rgb.ok) {
      return {
        ok: false,
        error: "invalid-palette-entry",
        message: `Palette entry "${entry.name}" has an invalid color value.`
      };
    }

    const hex = toHexColor(rgb.value);

    if (!hex.ok) {
      return {
        ok: false,
        error: "invalid-palette-entry",
        message: `Palette entry "${entry.name}" has an invalid RGB value.`
      };
    }

    entries.push({
      name: entry.name,
      value: hex.value,
      rgb: rgb.value,
      meta: entry.meta
    });
  }

  return { ok: true, value: entries };
}

function rankCompiled(
  compiled: ColorResult<readonly CompiledEntry[]>,
  input: unknown,
  options: RankOptions
): RankResult {
  if (!compiled.ok) {
    return compiled;
  }

  const rgb = typeof input === "string" ? parseHexColor(input) : normalizeRgb(input);

  if (!rgb.ok) {
    return rgb;
  }

  const limit = options.limit ?? compiled.value.length;

  if (!Number.isInteger(limit) || limit < 1) {
    return {
      ok: false,
      error: "invalid-limit",
      message: "Rank limit must be a positive integer."
    };
  }

  const distanceMode = options.distance ?? "weighted-rgb";
  if (distanceMode !== "weighted-rgb" && distanceMode !== "rgb") {
    return {
      ok: false,
      error: "invalid-distance",
      message: "Distance mode must be \"weighted-rgb\" or \"rgb\"."
    };
  }

  const matches = compiled.value
    .map((entry) => ({
      ...entry,
      distance: distanceBetween(rgb.value, entry.rgb, distanceMode)
    }))
    .sort((left, right) => left.distance - right.distance || left.name.localeCompare(right.name))
    .slice(0, limit);

  return { ok: true, matches };
}

function normalizeRgb(input: unknown): ColorResult<RgbColor> {
  if (!isRgbLike(input)) {
    return {
      ok: false,
      error: "invalid-color",
      message: "RGB input must be an object with integer r, g, and b channels."
    };
  }

  if (!isChannel(input.r) || !isChannel(input.g) || !isChannel(input.b)) {
    return {
      ok: false,
      error: "invalid-color",
      message: "RGB channels must be integers between 0 and 255."
    };
  }

  return { ok: true, value: { r: input.r, g: input.g, b: input.b } };
}

function isChannel(value: number): boolean {
  return Number.isInteger(value) && value >= 0 && value <= 255;
}

function isRgbLike(input: unknown): input is RgbColor {
  return typeof input === "object" && input !== null && "r" in input && "g" in input && "b" in input;
}

function isPaletteEntryLike(input: unknown): input is PaletteEntry {
  return typeof input === "object" && input !== null && "name" in input && "value" in input;
}

function channelToHex(value: number): string {
  return value.toString(16).padStart(2, "0");
}

function distanceBetween(left: RgbColor, right: RgbColor, mode: DistanceMode): number {
  const red = left.r - right.r;
  const green = left.g - right.g;
  const blue = left.b - right.b;

  if (mode === "rgb") {
    return Math.sqrt(red * red + green * green + blue * blue);
  }

  return Math.sqrt(2 * red * red + 4 * green * green + 3 * blue * blue);
}
