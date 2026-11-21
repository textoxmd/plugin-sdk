import { describe, expect, it } from "vitest";

import { pairMarks, wholeTokenSpan } from "./inline-helpers.js";
import type { InlineDeriveContext, PositionedToken } from "./syntax-feature.js";

function tok(type: string, pos: number, end: number): PositionedToken {
  return { token: { type } as never, pos, end, exact: true, verified: true };
}

function ctx(tokens: PositionedToken[], warnings: string[] = []): InlineDeriveContext {
  return {
    text: "",
    tokens,
    consumed: new Uint8Array(0),
    parentBlock: null,
    isConsumed: () => false,
    warn: (message) => warnings.push(message),
  };
}

describe("pairMarks", () => {
  it("把成对 token 组合成 mark span", () => {
    const spans = pairMarks(
      ctx([tok("mark_open", 0, 2), tok("text", 2, 3), tok("mark_close", 3, 5)]),
      { open: "mark_open", close: "mark_close", mark: "highlight" },
    );
    expect(spans).toEqual([
      { type: "highlight", from: 2, to: 3, openFrom: 0, openTo: 2, closeFrom: 3, closeTo: 5 },
    ]);
  });

  it("嵌套时后开先闭", () => {
    const spans = pairMarks(
      ctx([
        tok("mark_open", 0, 2),
        tok("mark_open", 2, 4),
        tok("mark_close", 4, 6),
        tok("mark_close", 6, 8),
      ]),
      { open: "mark_open", close: "mark_close", mark: "highlight" },
    );
    expect(spans.map((s) => [s.from, s.to, s.openFrom, s.closeTo])).toEqual([
      [4, 4, 2, 6],
      [2, 6, 0, 8],
    ]);
  });

  it("未配对的 close 告警且不产出", () => {
    const warnings: string[] = [];
    expect(
      pairMarks(ctx([tok("mark_close", 0, 2)], warnings), {
        open: "mark_open",
        close: "mark_close",
        mark: "highlight",
      }),
    ).toEqual([]);
    expect(warnings).toHaveLength(1);
  });

  it("未配对的 open 静默丢弃", () => {
    const warnings: string[] = [];
    expect(
      pairMarks(ctx([tok("mark_open", 0, 2)], warnings), {
        open: "mark_open",
        close: "mark_close",
        mark: "highlight",
      }),
    ).toEqual([]);
    expect(warnings).toEqual([]);
  });

  it("attrs 原样带出", () => {
    const spans = pairMarks(
      ctx([tok("mark_open", 0, 2), tok("mark_close", 2, 4)]),
      { open: "mark_open", close: "mark_close", mark: "highlight", attrs: { k: "v" } },
    );
    expect(spans[0]?.attrs).toEqual({ k: "v" });
  });
});

describe("wholeTokenSpan", () => {
  it("整 token 作为 span，可带 widget", () => {
    const span = wholeTokenSpan(tok("emoji", 2, 9), {
      type: "emoji",
      widget: { kind: "emoji", attrs: { glyph: "😄", len: "7" }, when: "always", side: -1, stopEvents: true },
    });
    expect(span).toEqual({
      type: "emoji",
      from: 2,
      to: 9,
      openFrom: 2,
      openTo: 2,
      closeFrom: 9,
      closeTo: 9,
      delimRanges: [{ from: 2, to: 9 }],
      widgetDecorations: [
        { pos: 2, when: "always", kind: "emoji", attrs: { glyph: "😄", len: "7" }, side: -1, stopEvents: true },
      ],
    });
  });

  it("widget 省略 when/side/stopEvents 时不写这些键", () => {
    const span = wholeTokenSpan(tok("emoji", 0, 3), {
      type: "emoji",
      widget: { kind: "emoji" },
    });
    expect(span?.widgetDecorations).toStrictEqual([{ pos: 0, when: "always", kind: "emoji" }]);
  });

  it("delimRanges 可显式覆盖（空数组 = 不隐藏源码）", () => {
    expect(wholeTokenSpan(tok("x", 0, 3), { type: "x", delimRanges: [] })?.delimRanges).toEqual([]);
  });

  it("跳过 exact=false 的 token", () => {
    expect(wholeTokenSpan({ ...tok("emoji", 0, 3), exact: false }, { type: "emoji" })).toBeNull();
    const warnings: string[] = [];
    expect(
      pairMarks(
        ctx([{ ...tok("mark_open", 0, 2), exact: false }, tok("mark_close", 2, 4)], warnings),
        { open: "mark_open", close: "mark_close", mark: "highlight" },
      ),
    ).toEqual([]);
    expect(warnings).toEqual([]);
  });
});
