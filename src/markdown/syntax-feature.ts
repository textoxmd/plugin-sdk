// SyntaxFeature — the public "语法功能" contract.
//
// This is the editor's internal `FeatureSpec` promoted to a stable, external
// contract: the editor re-exports it as `FeatureSpec`, and plugins contribute
// instances of it against the `markdown-editor:syntaxFeature` extension point.
//
// A feature contributes its pieces across every cross-cutting seam:
// schema (node/mark), parser (md-it plugin + token handlers), serializer
// (mark delimiters + block handlers), decorations (gray delim hints),
// input rules, and the test-pretty render map. Aggregation happens in
// features/index.ts; each core module reads from there.
//
// The shape is intentionally minimal — it will grow as real features
// require it. Optional fields stay undefined when a feature doesn't
// need them (inline marks don't need block handlers, etc.).

import type MarkdownIt from 'markdown-it';
import type Token from 'markdown-it/lib/token.mjs';
import type { InputRule } from 'prosemirror-inputrules';
import type {
  MarkSpec as PMMarkSpec,
  NodeSpec as PMNodeSpec,
  Node as PMNode,
  Schema,
} from 'prosemirror-model';
import type { Command, Plugin } from 'prosemirror-state';

import type { InlineSpan } from './inline-parse.js';
import type { TokenHandler } from './parser-types.js';
import type { BlockHandler, SerializerMarkSpec, SerializerState } from './serializer-types.js';
import type { SourcePreserveReconciler } from './source-preserve-reconciler.js';
import type { SourceVerbatimReconciler } from './source-verbatim.js';

export type SyntaxFeature = {
  // The feature's unique identifier. The editor aggregates contributions and
  // dedupes by `name`: a later contribution with the same `name` replaces the
  // earlier one in place (keeping its original position). This is why there is
  // no separate `id` field — it is the semantic equivalent of the plugin SDK
  // deduping contributions by `value.id`, except dedup happens in the editor's
  // aggregation layer.
  name: string;
  // Optional aggregation order. Lower runs first; features without it keep
  // registration order. Reserved for callers that need deterministic
  // sequencing across features.
  order?: number;
  marks?: Record<string, PMMarkSpec>;
  nodes?: Record<string, PMNodeSpec>;
  mdItPlugins?: Array<(md: MarkdownIt) => void>;
  parserTokens?: Record<string, TokenHandler>;
  // Optional post-processor: runs once after parse() builds the doc, e.g.
  // to fold `[ ] ` text prefixes inside list_items into task_marker nodes.
  parserPostProcess?: (doc: PMNode) => PMNode;
  // Inline atom-node serializers — mirror blockHandlers but for inline
  // nodes. Called from serializer's renderInline before the default text/
  // hard-break path.
  inlineNodeHandlers?: Record<string, (state: SerializerState, node: PMNode) => void>;
  markDelims?: Record<string, SerializerMarkSpec>;
  // Block-level serializer handlers — one entry per node type the feature
  // contributes (or overrides). The core serializer has a fixed table for
  // paragraph / heading / blockquote / lists / code_block / horizontal_rule;
  // features can add new node types here, or (in principle) override a core
  // entry when migrating.
  blockHandlers?: Record<string, BlockHandler>;
  inputRules?: (schema: Schema) => InputRule[];
  // Block-level interactions (Enter to exit an empty blockquote, Backspace
  // to unwrap a heading, etc.). Merged before baseKeymap so features win.
  keymap?: (schema: Schema) => Record<string, Command>;
  // Escape hatch for feature-owned PM plugins: leave-line draft watchers,
  // NodeViews (via Plugin.props.nodeViews), DOM event handlers for custom
  // UI overlays. Anything that doesn't fit inputRules / keymap / normalize.
  plugins?: (schema: Schema) => Plugin[];
  // 顶层块的子单元源保真（当前仅表格使用）。
  sourcePreserve?: SourcePreserveReconciler;
  // 顶层「verbatim 节点」源保真：节点无 root span、被解析器重定位，
  // 按源区域原位保留 + 按 key 写回（插件经 sourceVerbatim 声明）。
  sourceVerbatim?: SourceVerbatimReconciler;
  inline?: InlineFeatureSpec;
};

/** 插件按 widget `kind` 注册的行内 widget DOM 构建器。 */
export type InlineDecorationWidgetBuilder = (
  attrs: Record<string, string>,
  ctx: { documentDir: string | null },
) => HTMLElement;

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
export type InlineDeriveFeature = { name: string; inline: InlineFeatureSpec };

// An inline feature contributes to the method-B parse/normalize/decoration/
// serialize pipeline. Each feature is a self-contained participant:
//
//   - derive: the v2 entry point. The skeleton positions markdown-it tokens
//     to source offsets and hands the feature a read-only context
//     (`text` / `tokens` / a `consumed` snapshot); the feature returns the
//     InlineSpans it recognises without mutating the engine's ownership map.
//   - markNames: the PM mark types this feature produces. normalize syncs
//     these; decorations routes them through the inline path.
//   - extRanges: for a given textblock node, return char-offset ranges
//     (textblock-local) whose chars must NOT be escaped by the serializer —
//     typically content range ± delim length.
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
