import { describe, expect, it } from 'vitest';
import type { ExportRequestContext, PluginExporter } from './exporter.js';

const context: ExportRequestContext = { currentFile: '/notes/a.md', documentDir: '/notes' };

describe('PluginExporter', () => {
  it('treats kind as optional (text is the host default)', async () => {
    const exporter: PluginExporter = {
      id: 'plain',
      labelKey: 'plain',
      extension: 'txt',
      run: async () => ({ data: '# hi', suggestedName: 'a.txt' }),
    };

    // 缺省不补 `kind`：作者包只声明可选性，默认值由宿主在登记时收敛
    expect(exporter.kind).toBeUndefined();
    await expect(exporter.run(context)).resolves.toEqual({
      data: '# hi',
      suggestedName: 'a.txt',
    });
  });

  it('accepts binary output as Uint8Array', async () => {
    const bytes = new Uint8Array([1, 2, 3]);
    const exporter: PluginExporter = {
      id: 'bundle',
      labelKey: 'bundle',
      extension: 'zip',
      kind: 'binary',
      run: async () => ({ data: bytes, suggestedName: 'a.zip' }),
    };

    const output = await exporter.run({ currentFile: null, documentDir: null });

    expect(output.data).toBeInstanceOf(Uint8Array);
    expect(output.suggestedName).toBe('a.zip');
  });

  it('passes an unsaved document through as null context', async () => {
    const seen: ExportRequestContext[] = [];
    const exporter: PluginExporter = {
      id: 'probe',
      labelKey: 'probe',
      extension: 'md',
      run: async (ctx) => {
        seen.push(ctx);
        return { data: '', suggestedName: 'untitled.md' };
      },
    };

    await exporter.run({ currentFile: null, documentDir: null });

    expect(seen).toEqual([{ currentFile: null, documentDir: null }]);
  });
});
