import test from "node:test";
import assert from "node:assert/strict";
import {
  colorTokens,
  layoutTokens,
  radiusTokens,
  spacingTokens,
  themeTokens,
  typographyTokens
} from "../src/theme/tokens.mjs";

test("theme tokens define the shared iOS-like surfaces and spacing scale for reusable screens", () => {
  assert.equal(colorTokens.background, "#f4f7fb");
  assert.equal(colorTokens.surface, "#ffffff");
  assert.equal(colorTokens.accentPrimary, "#1f6fff");
  assert.notEqual(colorTokens.accentPrimary, colorTokens.background);

  assert.equal(spacingTokens.screenHorizontal, 20);
  assert.ok(spacingTokens.xl > spacingTokens.md);

  assert.equal(radiusTokens.card, 24);
  assert.equal(radiusTokens.pill, 999);
  assert.ok(radiusTokens.pill > radiusTokens.card);

  assert.equal(layoutTokens.screenMaxWidth, 720);
  assert.equal(layoutTokens.sectionGap, spacingTokens.lg);

  assert.equal(typographyTokens.heroValue.fontSize, 34);
  assert.equal(themeTokens.colors.surface, colorTokens.surface);
  assert.equal(themeTokens.layout.screenMaxWidth, layoutTokens.screenMaxWidth);
});
