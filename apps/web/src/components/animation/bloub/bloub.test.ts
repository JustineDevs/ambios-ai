import { describe, expect, it } from "vitest";
import { BotEngine } from "./bot/engine";
import { DEFAULT_EXPRESSION, EXPRESSION_BY_ID } from "./bot/expressions";
import { DEFAULT_SHAPE, SHAPE_BY_ID } from "./bot/skins";

describe("AmbiOS Bloub renderer contract", () => {
  it("renders finite SVG frames and preserves measured state morphing", () => {
    const engine = new BotEngine(
      100,
      "idle",
      SHAPE_BY_ID.get(DEFAULT_SHAPE)?.radii ?? null,
      EXPRESSION_BY_ID.get(DEFAULT_EXPRESSION) ?? null,
    );
    const before = engine.sample(0);
    engine.setState("thinking", 0);
    const transition = engine.sample(0.15);
    const after = engine.sample(1);
    expect(before.bodyPath).toMatch(/^M/);
    expect(transition.bodyPath).toMatch(/^M/);
    expect(after.bodyPath).toMatch(/^M/);
    expect(
      [before, transition, after].every((frame) =>
        frame.eyes.every((eye) => eye.alpha >= 0 && Number.isFinite(eye.alpha)),
      ),
    ).toBe(true);
  });
});
