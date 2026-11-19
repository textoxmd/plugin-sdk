import { describe, expect, it } from 'vitest';
import { isValidPluginId, validatePluginId } from './id';

const ACCEPTED = [
  'app.textox.table',
  'io.github.acme.test',
  'com.example.my-plugin',
  'app.textox.sub-sup',
  `a.b.${'c'.repeat(92)}`, // 恰好 96 字符
  'a.b.c.d.e.f.g.h', // 恰好 8 段
];

const REJECTED: Array<[string, string]> = [
  ['table', 'too-few-segments'],
  ['app.textox', 'too-few-segments'],
  ['Com.textox.table', 'invalid-char'],
  ['com_texto.table', 'invalid-char'],
  ['com..table', 'bad-segment'],
  ['app.textox.-table', 'bad-segment'],
  ['app.textox.table-', 'bad-segment'],
  ['app', 'reserved'],
  ['markdown-editor', 'reserved'],
  ['a.b.c.d.e.f.g.h.i', 'too-many-segments'],
  ['a.b.c', 'too-short'],
  [`aa.bb.${'c'.repeat(91)}`, 'too-long'],
];

describe('validatePluginId', () => {
  it.each(ACCEPTED)('accepts %s', (id) => {
    expect(validatePluginId(id)).toBeNull();
    expect(isValidPluginId(id)).toBe(true);
  });

  it.each(REJECTED)('rejects %s with %s', (id, issue) => {
    expect(validatePluginId(id)).toBe(issue);
  });
});
