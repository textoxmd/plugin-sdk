# @textox/plugin-sdk

Textox 插件的**契约层**：插件与宿主之间唯一的共享类型与基类包。它不包含宿主实现，也不包含任何编辑器/UI 依赖（零运行时依赖），只声明「插件能调用宿主什么、宿主能要求插件什么」。

## 安装

```sh
npm i @textox/plugin-sdk
# 或
bun add @textox/plugin-sdk
```

## 最小示例

```ts
import { Plugin, type PluginManifest, type SettingsField } from '@textox/plugin-sdk';

export default class MyPlugin extends Plugin {
  static settingsFields: SettingsField[] = [
    { key: 'uppercase', type: 'boolean', default: false, labelKey: 'uppercase' },
  ];

  override async onload(): Promise<void> {
    this.addMessages(
      {
        'zh-CN': { hello: '你好，Textox', uppercase: '转为大写' },
        'en-US': { hello: 'Hello, Textox', uppercase: 'Uppercase' },
      },
      'zh-CN',
    );

    this.addCommand({
      id: 'hello',
      name: 'Hello',
      callback: () => this.app.toast.success(this.t('hello')),
    });
  }
}

export const manifest: PluginManifest = {
  id: 'app.textox.hello',
  name: 'Hello',
  version: '0.1.0',
  minAppVersion: '2.2.0',
  author: { name: 'Textox' },
};
```

插件入口与清单一律由构建工具读取并打包，构建配置写在 `plugin.config.ts`（由 `@textox/plugin-build` 读取，产物为 `dist/{main.js, manifest.json, styles.css}`）。运行时宿主加载 `main.js` 后 `new` 出插件实例并调用 `onload()`。

## 生命周期

宿主驱动，语义固定：

1. 加载模块 → `new Plugin(app, manifest)`
2. `onload()`（可返回 Promise）
3. 停用时先 `onunload()`（插件自己的异步收尾），宿主 `await` 完成后再 `dispose()`
4. `dispose()` 只释放本类登记的贡献，**不**调用 `onunload()`

`addCommand` / `registerEmbed` / `registerFileEditor` 返回的 `Disposable` 可单独释放，产出的 Disposable 必须幂等。

## 能力清单（`PluginApp`）

插件经 `this.app`（或 `this.settings` / `this.t` / `this.addMessages`）访问宿主能力：

| 能力 | 说明 |
|------|------|
| `app.settings` | `get` / `set` / `all`，按插件隔离持久化；字段声明写在清单的 `settings`（由构建工具写入），宿主据此回填默认值并渲染设置界面 |
| `app.i18n` | `t(key, vars)`、`addMessages(locales, defaultLocale?)` 与 `language()`；语言码用宿主形态（`zh-CN`、`en-US`） |
| `app.theme` | `appearance`、`applyCodeHighlightTheme(light, dark)`、`subscribe(listener)`、`codeHighlightThemeDefaults()` |
| `app.dialogs` | `pickFile(options?)` 与 `confirm(options)`（无原生环境降级为取消，不抛错） |
| `app.toast` | `info` / `success` / `error` 轻提示 |
| `app.log` | `info` / `warn` / `error`，统一进宿主日志 |
| `app.workspace` | 活动文件路径、文档目录、打开文件、注册自定义文件编辑器 |
| `app.editor` | 插入文本、是否可编辑、注册嵌入预览、解析嵌入引用语法、7 个编辑器贡献注册点 |
| `app.documents` | 以给定内容新建并打开临时（未保存）文档 |
| `app.exporters` / `app.imageUploader` / `app.agent` | 导出器、图片上传器、宿主 Agent 能力（`available` / `run` / `present`） |

另有 `app.version` / `app.edition`（`'full' | 'lite'`）用于宿主版本与发行版分支判断。

## 编辑器贡献

编辑器契约在 `@textox/plugin-sdk/editor`（ProseMirror 视图、NodeView、工具栏/菜单项），语法引擎契约在 `@textox/plugin-sdk/markdown`（`SyntaxFeature`、行内解析助手）；两者也经根入口转出。

`app.editor` 的七个 `register*` 各登记一类贡献，均返回 `Disposable`（`dispose()` 即注销）：

| 方法 | 说明 |
|------|------|
| `registerSyntaxFeature(feature)` | 语法功能：schema / markdown-it 插件 / 解析 / 序列化 / 装饰 / 输入规则 |
| `registerExtension(extension)` | 编辑器扩展：ProseMirror `plugins` 与 `nodeViews` |
| `registerFormatToolbarItem(item)` | 行内格式按钮（悬浮栏 + 顶部工具栏 + 激活态） |
| `registerInsertCommand(command)` | 「插入块」命令（工具栏 / 斜杠菜单 / 快捷键共用的裸 slug） |
| `registerContextMenuItem(item)` | 正文右键菜单项 |
| `registerSelectionAction(action)` | 选区动作（释义等，不改 schema） |
| `registerSyntaxHighlight(contribution)` | 代码块语法高亮（语言定义，可惰性加载） |

`SyntaxFeature` 的最小形状：`{ name, inline }`（行内语法）或 `{ name, marks / nodes, mdItPlugins }`（块级 / 新节点）；按 `name` 去重（后注册原位覆盖）。

```ts
import type { SyntaxFeature } from '@textox/plugin-sdk/markdown';

const feature: SyntaxFeature = {
  name: 'demo',
  marks: { demo: { toDOM: () => ['span', { class: 'demo' }, 0] } },
  mdItPlugins: [],
};
const sub = app.editor.registerSyntaxFeature(feature);
// 注册 / 注销后宿主不会自动重建编辑器：
app.editor.requestReload();
sub.dispose();
app.editor.requestReload();
```

`registerExtension` 的 `nodeViews` 工厂返回 `NodeView` 即「我认领该节点」，返回 `null` 交给下一个贡献或内置视图。**DOM 结构必须在交给 ProseMirror 之前就绪**（不要挂载后再 `appendChild` 渲染容器），懒加载只延迟行为、不延迟结构；`ignoreMutation` 要放行插件私有渲染容器内部的变更。

ProseMirror（`prosemirror-model` / `-state` / `-view` / `-inputrules`）由宿主经共享模块注入，插件**不要**自带副本：`instanceof` 与 schema/plugin 身份都会割裂。构建时同样要 external 掉它们（见下文 `SHARED_MODULES`）。

## 清单校验

`validateManifest(raw)` 返回 `{ ok: true, manifest }` 或 `{ ok: false, issue }`。只有 `id` / `name` / `version` / `minAppVersion` / `author` 五项经校验，其余已知可选字段按类型过滤，未知字段原样保留（便于清单向前扩展）。

`isValidPluginId(id)` / `validatePluginId(id)` 校验插件 id 形状：至少三段、`[a-z0-9-]`、8–96 字符，且不得占用保留 id（如 `app`、`markdown-editor`）。

## `SHARED_MODULES` 必须保持外部化

`SHARED_MODULES` 是宿主通过 import map 提供的裸模块白名单（React、ProseMirror、i18next、`@textox/plugin-sdk` 自身等）。插件构建时**必须**把它们全部标记为 external：

```ts
// plugin.config.ts（片段，由 @textox/plugin-build 读取）
external: [...SHARED_MODULES]
```

漏标会把这些包（包括本契约包）内联进插件产物，插件将持有第二份独立实例：`instanceof Plugin` 失败、`Disposable` 语义割裂、React hooks 崩溃。判断某个 specifier 是否需要外部化可直接用 `isSharedModule(specifier)`。

## 版本与宿主锁步

本包的版本与宿主（Textox 应用）能力面锁步：`PluginApp` 只增不改，破坏性变更才升主版本。插件清单里应写清 `minAppVersion` 与 `builtAgainst`，宿主据此拒绝加载不匹配的插件。升级本包后请同时更新插件清单中的 `builtAgainst`。

## 许可

MIT
