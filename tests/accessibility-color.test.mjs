import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const css = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");

function cssVariable(name) {
  const match = css.match(new RegExp(`${name}:\\s*(#[0-9a-f]{6})`, "i"));
  assert.ok(match, `missing ${name}`);
  return match[1];
}

function luminance(hex) {
  const channels = [1, 3, 5]
    .map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16) / 255)
    .map((value) => (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4));
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(foreground, background) {
  const values = [luminance(foreground), luminance(background)].toSorted((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

test("core text and control-boundary colors meet their contrast targets", () => {
  const paper = cssVariable("--paper");
  const surface = cssVariable("--surface");
  for (const token of ["--ink", "--ink-soft", "--green", "--green-dark", "--warning", "--danger"]) {
    assert.ok(contrast(cssVariable(token), paper) >= 4.5, `${token} must meet 4.5:1 on paper`);
  }
  assert.ok(contrast(cssVariable("--line-dark"), paper) >= 3, "--line-dark must meet 3:1 on paper");
  assert.ok(contrast(cssVariable("--line-dark"), surface) >= 3, "--line-dark must meet 3:1 on surface");
});
