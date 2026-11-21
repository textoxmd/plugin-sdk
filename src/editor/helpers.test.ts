import { describe, expect, it } from 'vitest';

import {
  EMBED_REF_RE,
  contextMenuItemAppliesTo,
  defineInsertExtension,
  formatToolbarItemIncludesSurface,
  parseEmbedRef,
} from './helpers.js';
import type { EditorContextMenuItemMeta, FormatToolbarItemMeta, InsertCommandMeta } from './types.js';

describe('parseEmbedRef', () => {
  it('parses embed refs', () => {
    expect(parseEmbedRef('![alt](a.png "t")')).toMatchObject({ src: 'a.png', alt: 'alt' });
  });

  it('returns null for plain text', () => {
    expect(parseEmbedRef('not an embed')).toBeNull();
  });

  it('EMBED_REF_RE 与解析结果同源', () => {
    expect(EMBED_REF_RE.test('![a](b.png)')).toBe(true);
    expect(parseEmbedRef('  ![a](b.png)  ')).toEqual({ src: 'b.png', alt: 'a', title: null });
  });
});

describe('formatToolbarItemIncludesSurface', () => {
  it('matches toolbar surfaces', () => {
    const item: FormatToolbarItemMeta = {
      id: 'demo.item',
      markName: 'demo',
      delim: '<demo>',
      labelKey: 'demo.label',
      icon: [['path', 'M0 0h1v1H0z']],
      surfaces: ['floating'],
    };
    expect(formatToolbarItemIncludesSurface(item, 'floating')).toBe(true);
    expect(formatToolbarItemIncludesSurface(item, 'toolbar')).toBe(false);
  });

  it('未声明 surfaces 时两面都投', () => {
    const item: FormatToolbarItemMeta = {
      id: 'demo.default',
      markName: 'demo',
      delim: '<demo>',
      labelKey: 'demo.label',
      icon: 'underline',
    };
    expect(formatToolbarItemIncludesSurface(item, 'floating')).toBe(true);
    expect(formatToolbarItemIncludesSurface(item, 'toolbar')).toBe(true);
  });
});

describe('contextMenuItemAppliesTo', () => {
  it('值导出 contextMenuItemAppliesTo（场景可用性判定）', () => {
    const onlyBlock: EditorContextMenuItemMeta = {
      id: 'demo.copy',
      labelKey: 'demo.copy',
      requires: ['block'],
      run: () => {},
    };
    expect(contextMenuItemAppliesTo(onlyBlock, ['block'])).toBe(true);
    expect(contextMenuItemAppliesTo(onlyBlock, ['selection'])).toBe(false);
  });

  it('未声明 requires 时任何场景都列出', () => {
    const always: EditorContextMenuItemMeta = {
      id: 'demo.always',
      labelKey: 'demo.always',
      run: () => {},
    };
    expect(contextMenuItemAppliesTo(always, [])).toBe(true);
    expect(contextMenuItemAppliesTo(always, ['selection'])).toBe(true);
  });
});

describe('defineInsertExtension', () => {
  it('InsertCommandMeta 形状可被类型接受', () => {
    const cmd: InsertCommandMeta = {
      id: 'demo',
      keyword: 'demo',
      labelKey: 'demo.label',
      icon: [['path', 'M0 0h1v1H0z']],
      insert: () => {},
    };
    expect(cmd.id).toBe('demo');
  });

  it('InsertCommandMeta 接受全部可选字段', () => {
    const cmd: InsertCommandMeta = {
      id: 'demo',
      keyword: 'demo',
      labelKey: 'demo.label',
      descriptionKey: 'demo.description',
      icon: [['path', 'M0 0h1v1H0z']],
      defaultShortcut: 'Cmd+Opt+D',
      category: 'paragraph',
      order: 10,
      insert: () => {},
      isDisabled: () => false,
    };
    expect(cmd.descriptionKey).toBe('demo.description');
    expect(cmd.defaultShortcut).toBe('Cmd+Opt+D');
    expect(cmd.category).toBe('paragraph');
    expect(cmd.order).toBe(10);
    expect(cmd.isDisabled).toBeTypeOf('function');
  });

  it('包成仅含 insert 的编辑器扩展', () => {
    const ext = defineInsertExtension({
      id: 'demo',
      insert: { id: 'demo', keyword: 'demo', labelKey: 'demo.label', icon: 'table', insert: () => {} },
    });
    expect(ext.id).toBe('demo');
    expect(ext.insert?.keyword).toBe('demo');
    expect(ext.create({} as never)).toEqual({});
  });
});
