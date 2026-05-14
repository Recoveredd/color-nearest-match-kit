import { describe, expect, it } from "vitest";
import {
  createColorMatcher,
  findNearestColor,
  parseHexColor,
  toHexColor
} from "../src/index";

const palette = [
  { name: "blue", value: "#2563eb", meta: { token: "primary" } },
  { name: "green", value: "#16a34a" },
  { name: "red", value: "#dc2626" }
] as const;

describe("parseHexColor", () => {
  it("parses short and long hex values", () => {
    expect(parseHexColor("#0af")).toEqual({ ok: true, value: { r: 0, g: 170, b: 255 } });
    expect(parseHexColor("112233")).toEqual({ ok: true, value: { r: 17, g: 34, b: 51 } });
  });

  it("returns diagnostics for invalid colors", () => {
    expect(parseHexColor("#12")).toMatchObject({ ok: false, error: "invalid-color" });
    expect(parseHexColor("not-a-color")).toMatchObject({ ok: false, error: "invalid-color" });
    expect(parseHexColor(null)).toMatchObject({ ok: false, error: "invalid-color" });
  });
});

describe("toHexColor", () => {
  it("normalizes RGB colors to lowercase hex", () => {
    expect(toHexColor({ r: 255, g: 10, b: 0 })).toEqual({ ok: true, value: "#ff0a00" });
  });

  it("rejects invalid RGB channels", () => {
    expect(toHexColor({ r: 256, g: 0, b: 0 })).toMatchObject({ ok: false, error: "invalid-color" });
    expect(toHexColor(null)).toMatchObject({ ok: false, error: "invalid-color" });
  });
});

describe("createColorMatcher", () => {
  it("matches the nearest palette entry", () => {
    const matcher = createColorMatcher(palette);
    const result = matcher.match("#1d4ed8");

    expect(result).toMatchObject({
      ok: true,
      match: {
        name: "blue",
        value: "#2563eb",
        meta: { token: "primary" }
      }
    });
  });

  it("ranks matches with a caller-provided limit", () => {
    const matcher = createColorMatcher(palette);
    const result = matcher.rank("#ef4444", { limit: 2 });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.matches.map((match) => match.name)).toEqual(["red", "green"]);
    }
  });

  it("supports plain RGB distance mode", () => {
    const matcher = createColorMatcher([
      { name: "near-red", value: { r: 200, g: 20, b: 20 } },
      { name: "near-purple", value: { r: 190, g: 20, b: 120 } }
    ]);

    expect(matcher.match({ r: 220, g: 20, b: 30 }, { distance: "rgb" })).toMatchObject({
      ok: true,
      match: { name: "near-red" }
    });
  });

  it("returns diagnostics for empty palettes, bad entries, bad input, and bad limits", () => {
    expect(createColorMatcher([]).match("#ffffff")).toMatchObject({ ok: false, error: "empty-palette" });
    expect(createColorMatcher(null as unknown as typeof palette).match("#ffffff")).toMatchObject({
      ok: false,
      error: "invalid-palette-entry"
    });
    expect(createColorMatcher([{ name: "", value: "#fff" }]).match("#ffffff")).toMatchObject({
      ok: false,
      error: "invalid-palette-entry"
    });
    expect(createColorMatcher(palette).match("oops")).toMatchObject({ ok: false, error: "invalid-color" });
    expect(createColorMatcher(palette).rank("#ffffff", { limit: 0 })).toMatchObject({
      ok: false,
      error: "invalid-limit"
    });
    expect(createColorMatcher(palette).rank("#ffffff", { distance: "lab" as "rgb" })).toMatchObject({
      ok: false,
      error: "invalid-distance"
    });
  });

  it("handles runtime-invalid RGB objects without throwing", () => {
    const matcher = createColorMatcher(palette);

    expect(matcher.match(null)).toMatchObject({ ok: false, error: "invalid-color" });
    expect(matcher.match({ r: 1, g: 2 })).toMatchObject({ ok: false, error: "invalid-color" });
  });
});

describe("findNearestColor", () => {
  it("provides a one-shot helper", () => {
    expect(findNearestColor("#14943f", palette)).toMatchObject({
      ok: true,
      match: { name: "green" }
    });
  });
});
