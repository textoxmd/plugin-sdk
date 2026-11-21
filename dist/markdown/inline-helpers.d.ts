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
export declare function pairMarks(ctx: InlineDeriveContext, spec: PairMarksSpec): InlineSpan[];
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
export declare function wholeTokenSpan(tok: PositionedToken, spec: WholeTokenSpec): InlineSpan | null;
export {};
//# sourceMappingURL=inline-helpers.d.ts.map