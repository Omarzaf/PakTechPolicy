import assert from "node:assert/strict";
import { access, readFile, stat } from "node:fs/promises";
import test from "node:test";
import { SOURCE_BRANDS, getSourceBrand } from "../src/source-brands.js";

const dataset = JSON.parse(
  await readFile(new URL("../data/official-sources.json", import.meta.url), "utf8"),
);

test("every official publisher has a local verified brand asset", async () => {
  const publishers = [...new Set(dataset.sources.map(({ publisher }) => publisher))];

  assert.equal(Object.keys(SOURCE_BRANDS).length, publishers.length);
  for (const publisher of publishers) {
    const brand = getSourceBrand(publisher);
    assert.ok(brand, `${publisher}: missing source brand mapping`);
    assert.match(brand.asset, /^\.\/assets\/source-logos\/[^/]+$/);
    assert.ok([undefined, "dark"].includes(brand.tone));

    const asset = new URL(`../src/${brand.asset.replace(/^\.\//, "")}`, import.meta.url);
    await access(asset);
    assert.ok((await stat(asset)).size >= 100, `${publisher}: brand asset is unexpectedly small`);
  }
});

test("unknown publishers do not receive an invented mark", () => {
  assert.equal(getSourceBrand("Unlisted publisher"), null);
});
