import type { Node as PMNode } from 'prosemirror-model';
import { describe, expect, it } from 'vitest';

import type { SourceVerbatimReconciler, SourceVerbatimRegion } from './source-verbatim.js';

// 该测试同时是类型契约：实现必须能被赋给 SourceVerbatimReconciler。
const reconciler: SourceVerbatimReconciler = {
  matches: (node: PMNode) => node.type.name === 'paragraph',
  keyOf: () => 'k',
  collect: (_src, _doc): SourceVerbatimRegion[] => [],
  render: (node, renderBlockCanon) => renderBlockCanon(node),
};

describe('SourceVerbatimReconciler', () => {
  it('exposes the four contract methods', () => {
    expect(typeof reconciler.matches).toBe('function');
    expect(typeof reconciler.keyOf).toBe('function');
    expect(typeof reconciler.collect).toBe('function');
    expect(typeof reconciler.render).toBe('function');
  });
});
