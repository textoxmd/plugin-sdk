import { describe, expect, it, vi } from 'vitest';
import { toDisposable } from './disposable.js';
import { Plugin } from './plugin.js';
import type {
  CommandContribution,
  ContributionKind,
  EmbedBridgeOptions,
  FileEditorBridgeOptions,
  PluginApp,
  PluginManifest,
  SettingsField,
} from './types.js';

const manifest: PluginManifest = {
  id: 'app.textox.demo',
  name: 'Demo',
  version: '1.0.0',
  minAppVersion: '2.3.8',
  author: { name: 'Textox' },
};

function createApp() {
  const live = new Set<string>();
  const registered: Array<{ kind: ContributionKind; id: string; value: unknown }> = [];
  const disposals: string[] = [];
  const app = {
    version: '2.3.8',
    edition: 'full' as const,
    register: (kind: ContributionKind, id: string, value: unknown) => {
      const key = `${kind}:${id}`;
      live.add(key);
      registered.push({ kind, id, value });
      return toDisposable(() => {
        disposals.push(key);
        live.delete(key);
      });
    },
    workspace: {
      getActiveFilePath: vi.fn(() => null),
      getDocumentDir: vi.fn(() => null),
      openFile: vi.fn(async () => {}),
      registerFileEditor: vi.fn((options: FileEditorBridgeOptions) =>
        toDisposable(() => {
          disposals.push(`fileEditor:${options.id}`);
        })
      ),
    },
    editor: {
      insertText: vi.fn(),
      canEdit: vi.fn(() => true),
      registerEmbed: vi.fn((options: EmbedBridgeOptions) =>
        toDisposable(() => {
          disposals.push(`embed:${options.id}`);
        })
      ),
      parseEmbedRef: vi.fn(() => null),
    },
    documents: { createNewDocument: vi.fn(async () => {}) },
    settings: { get: () => undefined, set: async () => {}, all: () => ({}) },
    i18n: {
      t: vi.fn((key: string, vars?: Record<string, unknown>) =>
        vars ? `${key}:${JSON.stringify(vars)}` : key
      ),
      addMessages: vi.fn(),
    },
    toast: { success: vi.fn(), error: vi.fn() },
    log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  } satisfies PluginApp;
  return { app, live, registered, disposals };
}

class Demo extends Plugin {
  static settingsFields: SettingsField[] = [
    { key: 'limit', type: 'number', default: 10, labelKey: 'limit' },
  ];

  onload(): void {
    this.addCommand({ id: 'hello', name: 'Hello', callback: () => {} });
  }
}

describe('Plugin', () => {
  it('registers commands through the app and releases them on dispose', () => {
    const { app, live } = createApp();
    const plugin = new Demo(app, manifest);
    plugin.onload();
    expect([...live]).toEqual(['command:hello']);
    plugin.dispose();
    expect([...live]).toEqual([]);
  });

  it('is idempotent: a second dispose releases nothing more', () => {
    const { app, disposals } = createApp();
    const plugin = new Demo(app, manifest);
    plugin.onload();
    plugin.dispose();
    expect(disposals).toEqual(['command:hello']);
    expect(() => plugin.dispose()).not.toThrow();
    expect(disposals).toEqual(['command:hello']);
  });

  it('lets callers release a single contribution without disposing the plugin', () => {
    const { app, live } = createApp();
    const plugin = new Demo(app, manifest);
    const disposable = plugin.addCommand({ id: 'one', name: 'One', callback: () => {} });
    plugin.addCommand({ id: 'two', name: 'Two', callback: () => {} });
    disposable.dispose();
    expect([...live]).toEqual(['command:two']);
    plugin.dispose();
    expect([...live]).toEqual([]);
  });

  it('does not call onunload from dispose (host owns the lifecycle)', () => {
    const { app } = createApp();
    const spy = vi.fn();
    class WithUnload extends Plugin {
      onload(): void {}
      onunload(): void {
        spy();
      }
    }
    new WithUnload(app, manifest).dispose();
    expect(spy).not.toHaveBeenCalled();
  });

  it('exposes the app settings API and the static field declaration', () => {
    const { app } = createApp();
    const plugin = new Demo(app, manifest);
    expect(plugin.settings).toBe(app.settings);

    const baseDecl: SettingsField[] | undefined = Plugin.settingsFields; // 基类默认不声明字段
    expect(baseDecl).toBeUndefined();
    expect(Demo.settingsFields).toHaveLength(1);
  });

  it('exposes app and manifest by reference', () => {
    const { app } = createApp();
    const plugin = new Demo(app, manifest);
    expect(plugin.app).toBe(app);
    expect(plugin.manifest).toBe(manifest);
  });

  it('delegates t() to the host i18n with interpolation vars', () => {
    const { app } = createApp();
    const plugin = new Demo(app, manifest);
    expect(plugin.t('greeting')).toBe('greeting');
    expect(plugin.t('greeting', { name: 'Textox' })).toBe('greeting:{"name":"Textox"}');
    expect(app.i18n.t).toHaveBeenCalledWith('greeting', { name: 'Textox' });
  });

  it('registers embeds through the store and releases them on dispose', () => {
    const { app, disposals } = createApp();
    const plugin = new Demo(app, manifest);
    const options: EmbedBridgeOptions = {
      id: 'app.textox.demo.embed',
      extensions: ['.demo'],
      insertLabelKey: 'embed',
      matches: () => true,
      createPreview: () => ({ render: () => {} }),
    };

    plugin.registerEmbed(options);
    plugin.dispose();

    expect(app.editor.registerEmbed).toHaveBeenCalledWith(options);
    expect(disposals).toContain('embed:app.textox.demo.embed');
  });

  it('registers file editors through the store and releases them on dispose', () => {
    const { app, disposals } = createApp();
    const plugin = new Demo(app, manifest);
    const options: FileEditorBridgeOptions = {
      id: 'app.textox.demo.editor',
      extensions: ['.demo'],
      newFile: 'newDemo',
      createEmptyContent: () => '',
      load: async () => ({ default: {} }),
    };

    plugin.registerFileEditor(options);
    plugin.dispose();

    expect(app.workspace.registerFileEditor).toHaveBeenCalledWith(options);
    expect(disposals).toContain('fileEditor:app.textox.demo.editor');
  });

  it('delegates addMessages to the host i18n', () => {
    const { app } = createApp();
    const plugin = new Demo(app, manifest);

    const locales = { 'zh-CN': { greeting: '你好' }, en: { greeting: 'Hello' } };

    plugin.addMessages(locales, 'zh-CN');

    expect(app.i18n.addMessages).toHaveBeenCalledWith(locales, 'zh-CN');
  });

  it('passes the command contribution object through to the registry', () => {
    const { app, registered } = createApp();
    const plugin = new Demo(app, manifest);
    const command: CommandContribution = { id: 'hello', name: 'Hello', callback: () => {} };
    plugin.addCommand(command);
    expect(registered).toEqual([{ kind: 'command', id: 'hello', value: command }]);
  });
});
