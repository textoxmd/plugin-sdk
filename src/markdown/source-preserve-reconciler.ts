import type { Node as PMNode } from 'prosemirror-model';
import type Token from 'markdown-it/lib/token.mjs';

import type { BlockSpan } from './source-preserve.js';

/** 顶层块的子单元保真信息（功能私有 meta 可选）。 */
export interface SourcePreserveUnitSet {
  spans: BlockSpan[];
  sigs: string[];
  meta?: unknown;
}

/** collect 的返回值：核心随后用 canonicalUnits(oldNode) 填 sigs。 */
export interface SourcePreserveCollected {
  spans: BlockSpan[];
  meta?: unknown;
}

export interface SourcePreserveReconciler {
  /** 我负责的节点类型名（如 ['table']）。 */
  nodeTypes: readonly string[];
  /**
   * 从 token 流收集本功能各顶层块的子单元行区间。
   * matches 为命中本功能 nodeTypes 的顶层 root 序号（按文档顺序）；
   * 返回数组与 matches 一一对应，无法处理的位置为 null。
   */
  collect(
    tokens: readonly Token[],
    rootSpans: readonly BlockSpan[],
    matches: readonly number[],
  ): Array<SourcePreserveCollected | null>;
  /**
   * 新节点对应的 canonical 子单元文本（顺序与 sigs 对齐）。
   * `renderBlockCanon` 是核心注入的块级 canonical 渲染回调：插件不可 import
   * 编辑器序列化器，必须由核心注入（走 SerializerState）。
   */
  canonicalUnits(node: PMNode, renderBlockCanon: (n: PMNode) => string): string[];
  /**
   * 生成脏顶层块的替换文本；返回 null 回退整块 canonical。
   * 最终签名含核心注入的 `renderBlockCanon`（与 canonicalUnits 共用）。
   */
  splice(
    src: string,
    eol: '\n' | '\r\n',
    old: SourcePreserveUnitSet,
    newNode: PMNode,
    renderBlockCanon: (n: PMNode) => string,
  ): string | null;
}
