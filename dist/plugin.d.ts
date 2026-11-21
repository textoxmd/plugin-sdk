import { DisposableStore, type Disposable } from './disposable.js';
import type { CommandContribution, EmbedBridgeOptions, FileEditorBridgeOptions, PluginApp, PluginManifest } from './types.js';
/**
 * 插件基类。生命周期由宿主驱动：加载模块 → `new` → `onload()`；
 * 停用时先 `onunload()`（插件自己的异步收尾），宿主须 `await` 其 Promise 后再 `dispose()`
 * （释放本类登记的贡献）。`dispose()` 不调用 `onunload()`，两者职责不重叠。
 */
export declare abstract class Plugin implements Disposable {
    readonly app: PluginApp;
    readonly manifest: PluginManifest;
    /**
     * 声明式设置字段（0.1.x 形态）：宿主曾据此回填默认值并渲染设置页。
     *
     * @deprecated 从 0.2.0 起字段声明写在清单里（`manifest.settings`，由构建工具写入）；
     * 静态字段仅为 0.1.x 插件保留一个版本，宿主不再从它推默认值。
     */
    static settingsFields?: unknown[];
    private readonly store;
    /** 子类登记贡献用的容器：插件 `dispose()` 时统一释放（后注册先释放）。 */
    protected readonly disposables: DisposableStore;
    constructor(app: PluginApp, manifest: PluginManifest);
    abstract onload(): void | Promise<void>;
    onunload(): void | Promise<void>;
    /**
     * 登记命令；返回值可单独释放，插件整体 `dispose()` 时也会再释放一次
     * （因此宿主 `register` 返回的 Disposable 必须幂等——统一经 `toDisposable` 包装）。
     * 插件 `dispose()` 之后再调用本方法：仍会调用一次 `app.register`，但贡献会被立即释放（静默不生效）。
     */
    addCommand(command: CommandContribution): Disposable;
    /** 登记嵌入预览；返回值可单独释放，插件 `dispose()` 时也会释放。 */
    registerEmbed(options: EmbedBridgeOptions): Disposable;
    /** 登记自定义文件编辑器；返回值可单独释放，插件 `dispose()` 时也会释放。 */
    registerFileEditor(options: FileEditorBridgeOptions): Disposable;
    /** 注入本插件的 `plugins` 命名空间文案；一次传全部语言，`defaultLocale` 用于缺失语言回退。 */
    addMessages(locales: Record<string, Record<string, unknown>>, defaultLocale?: string): void;
    get settings(): PluginApp['settings'];
    t(key: string, vars?: Record<string, unknown>): string;
    dispose(): void;
}
//# sourceMappingURL=plugin.d.ts.map