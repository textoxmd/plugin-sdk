import { DisposableStore } from './disposable.js';
/**
 * 插件基类。生命周期由宿主驱动：加载模块 → `new` → `onload()`；
 * 停用时先 `onunload()`（插件自己的异步收尾），宿主须 `await` 其 Promise 后再 `dispose()`
 * （释放本类登记的贡献）。`dispose()` 不调用 `onunload()`，两者职责不重叠。
 */
export class Plugin {
    app;
    manifest;
    /** 声明式设置字段：宿主读它渲染设置页，值的读写走 `this.settings`。 */
    static settingsFields;
    store;
    constructor(app, manifest) {
        this.app = app;
        this.manifest = manifest;
        this.store = new DisposableStore(`plugin:${manifest.id}`);
    }
    onunload() { }
    /**
     * 登记命令；返回值可单独释放，插件整体 `dispose()` 时也会再释放一次
     * （因此宿主 `register` 返回的 Disposable 必须幂等——统一经 `toDisposable` 包装）。
     * 插件 `dispose()` 之后再调用本方法：仍会调用一次 `app.register`，但贡献会被立即释放（静默不生效）。
     */
    addCommand(command) {
        return this.store.add(this.app.register('command', command.id, command));
    }
    /** 登记嵌入预览；返回值可单独释放，插件 `dispose()` 时也会释放。 */
    registerEmbed(options) {
        return this.store.add(this.app.editor.registerEmbed(options));
    }
    /** 登记自定义文件编辑器；返回值可单独释放，插件 `dispose()` 时也会释放。 */
    registerFileEditor(options) {
        return this.store.add(this.app.workspace.registerFileEditor(options));
    }
    /** 注入本插件的 `plugins` 命名空间文案；一次传全部语言，`defaultLocale` 用于缺失语言回退。 */
    addMessages(locales, defaultLocale) {
        this.app.i18n.addMessages(locales, defaultLocale);
    }
    get settings() {
        return this.app.settings;
    }
    t(key, vars) {
        return this.app.i18n.t(key, vars);
    }
    dispose() {
        this.store.dispose();
    }
}
//# sourceMappingURL=plugin.js.map