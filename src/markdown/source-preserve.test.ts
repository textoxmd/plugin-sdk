import { describe, expect, it } from 'vitest';
import { alignUnits, ensureEol, lineStarts } from './source-preserve.js';

describe('source-preserve primitives', () => {
  it('lineStarts returns 0-based offsets for LF and CRLF', () => {
    expect(lineStarts('a\nb\nc')).toEqual([0, 2, 4]);
    expect(lineStarts('a\r\nb')).toEqual([0, 3]);
  });

  it('alignUnits finds LCS anchors for small inputs', () => {
    expect(alignUnits(['a', 'b', 'c'], ['a', 'x', 'c'])).toEqual([[0, 0], [2, 2]]);
  });

  it('alignUnits falls back to prefix/suffix for large inputs', () => {
    const a = Array.from({ length: 300 }, (_, i) => `a${i}`);
    // 大文档退化分支只保留前缀/后缀匹配锚点：除首尾外全部不同，锚点收敛到两端。
    const b = a.map((v, i) => (i === 0 || i === 299 ? v : `changed${i}`));
    const anchors = alignUnits(a, b);
    expect(anchors).toEqual([[0, 0], [299, 299]]);
  });

  it('ensureEol appends missing EOL without doubling CRLF', () => {
    expect(ensureEol('a', '\n')).toBe('a\n');
    expect(ensureEol('a\n', '\n')).toBe('a\n');
    expect(ensureEol('a', '\r\n')).toBe('a\r\n');
    expect(ensureEol('a\r\n', '\r\n')).toBe('a\r\n');
  });
});
