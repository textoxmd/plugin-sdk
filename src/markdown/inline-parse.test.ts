import { Schema } from 'prosemirror-model';
import { describe, expect, it } from 'vitest';

import { markExtRanges } from './inline-parse.js';

const schema = new Schema({
  nodes: {
    doc: { content: 'block+' },
    paragraph: { content: 'inline*', group: 'block' },
    text: { group: 'inline' },
  },
  marks: { m: {} },
});

describe('markExtRanges', () => {
  it('extends a contiguous mark run by the delim lengths', () => {
    const para = schema.nodes.paragraph!.create(null, [
      schema.text('ab'),
      schema.text('cd', [schema.marks.m!.create()]),
      schema.text('ef'),
    ]);
    expect(markExtRanges(para, 'm', 1, 1)).toEqual([[1, 5]]);
  });

  it('returns empty ranges when the mark type is absent', () => {
    const para = schema.nodes.paragraph!.create(null, [schema.text('ab')]);
    expect(markExtRanges(para, 'nope', 1)).toEqual([]);
  });

  it('extends each of multiple discontinuous mark runs', () => {
    const para = schema.nodes.paragraph!.create(null, [
      schema.text('a'),
      schema.text('b', [schema.marks.m!.create()]),
      schema.text('c'),
      schema.text('d', [schema.marks.m!.create()]),
    ]);
    expect(markExtRanges(para, 'm', 1, 1)).toEqual([
      [0, 3],
      [2, 5],
    ]);
  });
});
