import type { InlineSpan } from './inline-parse.js';
import type { InlineDeriveContext, PositionedToken } from './syntax-feature.js';

export type PairMarksSpec = {
  open: string;
  close: string;
  mark: string;
  attrs?: Record<string, unknown>;
};

/**
 * 成对 token → mark span（后开先闭）。
 *
 * 返回顺序 = 配对（close）出现的顺序：嵌套时内层在前，**不保证源文序**。
 * 排序是引擎的职责：先按 `(openFrom, closeTo, type)` 稳定排序做特性内确定性，
 * 再按 `(closeFrom, openFrom)` 把核心与派生 span 归并成闭合序（内层先）。
 * 未配对的 close 会 `ctx.warn` 且不产出；未配对的 open 静默丢弃（与定位层既有行为一致）。
 * 跳过 `exact === false` 的 token（位置不可靠，不参与配对）；由此造成的 close 无 open
 * 可配同样静默丢弃、**不告警**——不确定性来自骨架，不应归咎于插件。
 */
export function pairMarks(ctx: InlineDeriveContext, spec: PairMarksSpec): InlineSpan[] {
  const out: InlineSpan[] = [];
  const stack: PositionedToken[] = [];
  // 记录「见过但位置不可靠」的 open 数量，用于区分「真的没有 open」与「open 存在但不可定位」。
  let inexactOpens = 0;
  for (const tok of ctx.tokens) {
    if (!tok.exact) {
      if (tok.token.type === spec.open) inexactOpens += 1;
      continue;
    }
    if (tok.token.type === spec.open) {
      stack.push(tok);
      continue;
    }
    if (tok.token.type !== spec.close) continue;
    const open = stack.pop();
    if (!open) {
      // 有一个位置不可靠的 open 先行出现 ⇒ 配对结果不确定，静默跳过。
      if (inexactOpens > 0) {
        inexactOpens -= 1;
        continue;
      }
      ctx.warn(`pairMarks("${spec.mark}"): 未配对的 ${spec.close} @${tok.pos}`);
      continue;
    }
    out.push({
      type: spec.mark,
      from: open.end,
      to: tok.pos,
      openFrom: open.pos,
      openTo: open.end,
      closeFrom: tok.pos,
      closeTo: tok.end,
      ...(spec.attrs ? { attrs: { ...spec.attrs } } : {}),
    });
  }
  return out;
}

/** widget 声明：字段跟随 `InlineSpan.widgetDecorations`，但 `pos` 由 helper 填、`when` 有默认值。 */
type WidgetSpec = Omit<NonNullable<InlineSpan["widgetDecorations"]>[number], "pos" | "when"> & {
  when?: NonNullable<InlineSpan["widgetDecorations"]>[number]["when"];
};

export type WholeTokenSpec = {
  type: string;
  attrs?: Record<string, unknown>;
  /** 省略 ⇒ 整个 token 区间（源码默认隐藏）；传 `[]` 表示不隐藏。 */
  delimRanges?: InlineSpan["delimRanges"];
  widget?: WidgetSpec;
};

/**
 * 整个 token 作为一个 span（原子 / widget），无分隔符。
 *
 * `exact === false` ⇒ 返回 `null`（骨架无法保证位置）；调用方无需再自行过滤。
 * `when` 省略 ⇒ `always`（widget 与源码同时可见）。
 */
export function wholeTokenSpan(tok: PositionedToken, spec: WholeTokenSpec): InlineSpan | null {
  if (!tok.exact) return null;
  const span: InlineSpan = {
    type: spec.type,
    from: tok.pos,
    to: tok.end,
    openFrom: tok.pos,
    openTo: tok.pos,
    closeFrom: tok.end,
    closeTo: tok.end,
    delimRanges: spec.delimRanges ?? [{ from: tok.pos, to: tok.end }],
    ...(spec.attrs ? { attrs: { ...spec.attrs } } : {}),
  };
  if (spec.widget) {
    span.widgetDecorations = [
      {
        ...spec.widget,
        pos: tok.pos,
        when: spec.widget.when ?? 'always',
        ...(spec.widget.attrs ? { attrs: { ...spec.widget.attrs } } : {}),
      },
    ];
  }
  return span;
}
