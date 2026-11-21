import { describe, expect, it } from 'vitest';

import { toDisposable } from './disposable.js';
import type { PluginDialogsApi } from './dialogs.js';
import type { PluginAppearance, PluginThemeApi } from './theme.js';
import type { PluginApp } from './types.js';

/**
 * 能力面契约测试：`app.theme` / `app.dialogs` / `app.i18n.language` / `app.toast.info`
 * 在作者包里只有类型、没有实现（实现是宿主），所以这里锁两件事：
 *
 * 1. **类型形状**：宿主必须能提供一个通过这些成员即可装配的实例（`CapabilitySurface`），
 *    少一个成员 / 签名漂移都会让下面的宿主替身编译失败；
 * 2. **约定用法**：插件按文档写出来的调用序列（读外观 → 应用主题 → 订阅 → 退订、
 *    取消选文件）在宿主替身上行为符合预期。真实宿主实现见父仓
 *    `src/plugins/runtime/app.ts` 的接线测试。
 */
type CapabilitySurface = Pick<PluginApp, 'theme' | 'dialogs' | 'i18n' | 'toast'>;

/** 宿主替身：主题外观可切换，其余能力只记录调用。 */
function createHostDouble(options: { appearance?: PluginAppearance } = {}) {
  let appearance: PluginAppearance = options.appearance ?? 'light';
  const listeners = new Set<(next: PluginAppearance) => void>();
  const applied: Array<{ light: string; dark: string }> = [];
  const toasts: Array<{ level: 'info' | 'success' | 'error'; message: string }> = [];
  const picked = { count: 0 };

  const theme: PluginThemeApi = {
    get appearance() {
      return appearance;
    },
    applyCodeHighlightTheme: (light, dark) => {
      applied.push({ light, dark });
    },
    subscribe: (listener) => {
      // 与宿主实现一致：Set + 幂等释放
      const entry = (next: PluginAppearance) => listener(next);
      listeners.add(entry);
      return toDisposable(() => {
        listeners.delete(entry);
      });
    },
    codeHighlightThemeDefaults: async () => ({ light: 'githubLight', dark: 'githubDark' }),
  };

  const dialogs: PluginDialogsApi = {
    pickFile: async () => {
      picked.count += 1;
      return null;
    },
    confirm: async () => false,
  };

  const app: CapabilitySurface = {
    theme,
    dialogs,
    i18n: {
      t: (key) => key,
      addMessages: () => {},
      language: () => 'zh-CN',
    },
    toast: {
      info: (message) => toasts.push({ level: 'info', message }),
      success: (message) => toasts.push({ level: 'success', message }),
      error: (message) => toasts.push({ level: 'error', message }),
    },
  };

  return {
    app,
    applied,
    toasts,
    picked,
    switchAppearance(next: PluginAppearance) {
      appearance = next;
      for (const listener of [...listeners]) listener(next);
    },
    get subscriberCount() {
      return listeners.size;
    },
  };
}

describe('PluginApp capability surface', () => {
  it('exposes appearance, theme application and subscription on the theme api', () => {
    const host = createHostDouble({ appearance: 'dark' });
    const { theme } = host.app;

    expect(theme.appearance).toBe('dark');

    theme.applyCodeHighlightTheme('githubLight', 'githubDark');
    expect(host.applied).toEqual([{ light: 'githubLight', dark: 'githubDark' }]);

    const seen: PluginAppearance[] = [];
    const subscription = theme.subscribe((next) => seen.push(next));
    expect(host.subscriberCount).toBe(1);

    host.switchAppearance('light');
    expect(seen).toEqual(['light']);
    expect(theme.appearance).toBe('light');

    subscription.dispose();
    subscription.dispose();
    expect(host.subscriberCount).toBe(0);
    host.switchAppearance('dark');
    expect(seen).toEqual(['light']);
  });

  it('reports the legacy code highlight defaults as an optional light/dark pair', async () => {
    const host = createHostDouble();
    await expect(host.app.theme.codeHighlightThemeDefaults()).resolves.toEqual({
      light: 'githubLight',
      dark: 'githubDark',
    });
  });

  it('treats a cancelled file pick as null and reports the current language', async () => {
    const host = createHostDouble();
    expect(host.app.i18n.language()).toBe('zh-CN');
    await expect(host.app.dialogs.pickFile()).resolves.toBeNull();
    expect(host.picked.count).toBe(1);
  });

  it('routes info toasts through the same channel as success / error', () => {
    const host = createHostDouble();
    host.app.toast.info('uploaded');
    host.app.toast.success('done');
    host.app.toast.error('nope');
    expect(host.toasts.map((entry) => entry.level)).toEqual(['info', 'success', 'error']);
  });

  it('supports the documented migration pattern of a code-highlight plugin', async () => {
    // 语法高亮插件的启动序：历史值种子化 → 应用 → 订阅外观变化 → 配置变更后重新应用
    const host = createHostDouble({ appearance: 'light' });
    const legacy = await host.app.theme.codeHighlightThemeDefaults();
    let current = { light: legacy.light ?? '', dark: legacy.dark ?? '' };
    const apply = () => host.app.theme.applyCodeHighlightTheme(current.light, current.dark);
    apply();
    const subscription = host.app.theme.subscribe(apply);

    current = { light: 'xcodeLight', dark: 'oneDark' };
    apply();
    expect(host.applied).toEqual([
      { light: 'githubLight', dark: 'githubDark' },
      { light: 'xcodeLight', dark: 'oneDark' },
    ]);

    host.switchAppearance('dark');
    expect(host.applied).toHaveLength(3);
    subscription.dispose();
  });
});
