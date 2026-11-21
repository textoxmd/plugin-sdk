import type { Disposable } from './disposable.js';
/**
 * 插件可见的当前外观：**已解析**的实际明暗。
 *
 * 宿主外观设置可能是 `'system'`（跟随系统），插件拿不到这个中间态——它要的是
 * 「现在屏幕上是浅色还是深色」来决定用哪套配色。系统偏好变化时宿主会广播一次。
 */
export type PluginAppearance = 'light' | 'dark';
/**
 * 插件主题能力面（`app.theme`）。
 *
 * 只覆盖插件真正需要的那部分：应用/订阅**代码块**高亮配色、读当前外观、
 * 拿宿主配色主题里的历史默认值（迁移用）。界面主题由用户设置，插件不改。
 */
export interface PluginThemeApi {
    /** 当前外观（已解析的实际明暗）。 */
    readonly appearance: PluginAppearance;
    /**
     * 应用代码块高亮主题：亮/暗各一个主题 id，宿主按当前外观挑一个生效。
     *
     * 传入空串表示该侧「跟随默认」，即不覆盖宿主自己的配色。id 必须是宿主内置
     * 高亮主题（见你声明设置项时用的同一份目录），未知 id 会被宿主忽略。
     */
    applyCodeHighlightTheme(light: string, dark: string): void;
    /**
     * 订阅外观变化（用户切换亮/暗、跟随系统时系统偏好改变）。
     * 释放返回值即退订。
     */
    subscribe(listener: (appearance: PluginAppearance) => void): Disposable;
    /**
     * 宿主配色主题里记录的历史代码高亮主题（`undefined` = 该侧未设置）。
     *
     * 仅用于一次性迁移：插件自己的配置缺失时，用它作为初值种子。
     */
    codeHighlightThemeDefaults(): Promise<{
        light?: string;
        dark?: string;
    }>;
}
//# sourceMappingURL=theme.d.ts.map