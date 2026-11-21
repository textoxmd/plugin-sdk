import type MarkdownIt from 'markdown-it';
import type Token from 'markdown-it/lib/token.mjs';
import type { InputRule } from 'prosemirror-inputrules';
import type { MarkSpec as PMMarkSpec, NodeSpec as PMNodeSpec, Node as PMNode, Schema } from 'prosemirror-model';
import type { Command, Plugin } from 'prosemirror-state';
import type { InlineSpan } from './inline-parse.js';
import type { TokenHandler } from './parser-types.js';
import type { BlockHandler, SerializerMarkSpec, SerializerState } from './serializer-types.js';
import type { SourcePreserveReconciler } from './source-preserve-reconciler.js';
import type { SourceVerbatimReconciler } from './source-verbatim.js';
export type SyntaxFeature = {
    name: string;
    order?: number;
    marks?: Record<string, PMMarkSpec>;
    nodes?: Record<string, PMNodeSpec>;
    mdItPlugins?: Array<(md: MarkdownIt) => void>;
    parserTokens?: Record<string, TokenHandler>;
    parserPostProcess?: (doc: PMNode) => PMNode;
    inlineNodeHandlers?: Record<string, (state: SerializerState, node: PMNode) => void>;
    markDelims?: Record<string, SerializerMarkSpec>;
    blockHandlers?: Record<string, BlockHandler>;
    inputRules?: (schema: Schema) => InputRule[];
    keymap?: (schema: Schema) => Record<string, Command>;
    plugins?: (schema: Schema) => Plugin[];
    sourcePreserve?: SourcePreserveReconciler;
    sourceVerbatim?: SourceVerbatimReconciler;
    inline?: InlineFeatureSpec;
};
/** 插件按 widget `kind` 注册的行内 widget DOM 构建器。 */
export type InlineDecorationWidgetBuilder = (attrs: Record<string, string>, ctx: {
    documentDir: string | null;
}) => HTMLElement;
/** 一个 md-it token 在源文中的区间；由骨架定位。 */
export type PositionedToken = {
    readonly token: Token;
    readonly pos: number;
    readonly end: number;
    /**
     * 是否可视为「已定位」：
     * - `true` 只表示游标在本 token 上推进过，**不保证**区间经过严格核对
     *   （text 失配、link/image 的 skipBracketTail 回退也会推进）；
     * - `false` 表示游标没有推进（如零宽 text），位置通常仍准确，但不可据此
     *   认为区间一定错。
     * 需要严格语义时，看 `verified`。
     */
    readonly exact: boolean;
    /**
     * 本 token 自身是否经过严格核对（未走猜测兜底）。为 `false` 时，消费方若依赖
     * 源码跨度应当放弃（加载期组装据此回退）。注意这是「逐 token」的：它不保证
     * 此前缀整体严格——更早的猜测可能已让后续 token 偏移，消费方需自行校验连续性。
     */
    readonly verified: boolean;
};
/**
 * 声明「我的 token 占多少源码字符」。
 *
 * - 必须是有限正整数；返回 `null` / `<= 0` / 非整数 ⇒ 视为无效，交给下一个声明；
 * - 抛错 ⇒ 该声明被忽略并 DEV 告警（与其它插件调用点一致）。
 */
export type TokenAdvance = (text: string, pos: number, token: Token) => number | null;
/** v2 派生上下文：只读源文与已定位 token；返回 span，不写 consumed。 */
export type InlineDeriveContext = {
    /** 文本块源文（含未消费的 markdown 记号）。 */
    readonly text: string;
    /**
     * 每个 token 的源文区间，按 `(pos, end)` 升序。
     * 容器的子 token 落在容器区间内部（如图片 alt），因此不是互不重叠的序列；
     * 同 `pos` 时按 `end` 升序。只读视图，不要修改元素。
     */
    readonly tokens: readonly PositionedToken[];
    /**
     * 当前已占用位图的**快照**（每个特性一份拷贝，`1` = 已占用）。
     * 供文本派生特性复用既有扫描器；对它的修改只影响本特性，不会回写引擎。
     */
    readonly consumed: Uint8Array;
    /** 所在文本块节点（个别特性需要块属性，如 auto-link 跳过 link_def）。 */
    readonly parentBlock: PMNode | null;
    /** `[from, to)` 是否已被占用；`to` 省略时只看 `from` 一个字符。 */
    isConsumed(from: number, to?: number): boolean;
    /** DEV 去重告警。 */
    warn(message: string): void;
};
/**
 * 声明了 v2 `derive` 的特性。
 *
 * 收窄成 `{ name, inline }` 而不是整个 `SyntaxFeature`：引擎只需要 derive 与
 * `markNames`（判定 mark/原子占用规则），类型上够不到 `marks/nodes/plugins`；
 * `name` 是告警去重与隔离的键。
 */
export type InlineDeriveFeature = {
    name: string;
    inline: InlineFeatureSpec;
};
export type InlineFeatureSpec = {
    /** 内联执行顺序（小者先，默认 0）。与 `SyntaxFeature.order`（特性聚合序）无关。 */
    order?: number;
    /** v2 派生入口：返回本特性认领的全部 span（纯函数）。 */
    derive?(ctx: InlineDeriveContext): InlineSpan[];
    /** v2：自定义 token 的源码宽度。 */
    tokenAdvance?: TokenAdvance;
    markNames: string[];
    extRanges: (parent: PMNode) => Array<[number, number]>;
    /** 声明该内联功能抑制悬浮格式工具栏（内容非可格式化富文本）。 */
    suppressFormatToolbar?: boolean;
    /** 该功能声明的行内 widget 构建器，按 `kind` 索引。 */
    decorationWidgets?: Record<string, InlineDecorationWidgetBuilder>;
};
//# sourceMappingURL=syntax-feature.d.ts.map