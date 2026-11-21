import type { Disposable } from './disposable.js';
import type { AgentCapability } from './agent.js';
import type { EditorContextMenuItemMeta, EditorExtension, FormatToolbarItemMeta, InsertCommandMeta, SelectionActionMeta, SyntaxHighlightContribution } from './editor/index.js';
import type { PluginExporter } from './exporter.js';
import type { PluginImageUploader } from './image-uploader.js';
import type { SyntaxFeature } from './markdown/index.js';
/** 插件清单：只有元数据，能力一律由代码（`Plugin.onload`）注册，清单不承载能力投影。 */
export interface PluginManifest {
    id: string;
    name: string;
    version: string;
    minAppVersion: string;
    description?: string;
    author: {
        name: string;
        id?: string;
    };
    category?: string;
    icon?: string;
    defaultEnabled?: boolean;
    isDesktopOnly?: boolean;
    builtAgainst?: Record<string, string>;
    /**
     * 声明式设置字段（形状见 `SettingsField`，构建期由 `plugin-build` 写入）。
     * 宿主据此回填缺省值与渲染设置页；`0.1.x` 的静态字段声明仍兼容一个版本。
     */
    settings?: unknown[];
}
/** 声明式设置字段：宿主渲染控件，值存于插件 `data.json` 的 `settings` 键。 */
export type SettingsField = {
    key: string;
    type: 'text' | 'password';
    default: string;
    labelKey: string;
    placeholderKey?: string;
} | {
    key: string;
    type: 'number';
    default: number;
    labelKey: string;
    min?: number;
    max?: number;
    step?: number;
} | {
    key: string;
    type: 'boolean';
    default: boolean;
    labelKey: string;
} | {
    key: string;
    type: 'select';
    default: string;
    labelKey: string;
    options: Array<{
        value: string;
        labelKey: string;
    }>;
} | SettingsActionField;
/**
 * 动作型设置项：点击即执行，**不承载存储值**（不参与默认值回填，也不出现在 `settings.all()`）。
 * 与 `text` / `number` 等值字段不同，它没有 `default`。
 */
export interface SettingsActionField {
    key: string;
    type: 'action';
    labelKey: string;
    descriptionKey?: string;
    group?: string;
    groupLabelKey?: string;
    /** 执行动作；`app` 是本插件自己的能力面（可读写设置、发 toast 等）。 */
    run(app: PluginApp): void | Promise<void>;
}
export interface CommandContribution {
    id: string;
    name: string;
    callback: () => void | Promise<void>;
    defaultShortcut?: string;
}
/** 生效配置的只读快照（已回填 `manifest.settings` 的默认值）。 */
export interface SettingsSnapshot {
    readonly values: Readonly<Record<string, unknown>>;
    read<T = unknown>(key: string): T | undefined;
}
export type ContributionKind = 'command';
/** ProseMirror 节点的结构化视图（契约包不依赖 prosemirror）。 */
export interface EmbedNodeLike {
    /** ProseMirror 节点的 textContent（宿主已经解析过引用），实现方可再解析。 */
    textContent: string;
    attrs: Record<string, unknown>;
    type: string;
}
/** 嵌入预览区：实现方把内容渲染进宿主给的容器；`destroy` 用于清理监听/实例。 */
export interface EmbedPreviewRegionLike {
    render(target: HTMLElement): void;
    /** 节点内容变化（同一 owner 内换了 src）时调用；不实现则宿主销毁后重建。 */
    update?(node: EmbedNodeLike): void;
    destroy?(): void;
}
/** `app.editor.registerEmbed(...)` 的入参；宿主适配为编辑器扩展（nodeViews）。 */
export interface EmbedBridgeOptions {
    /** 裸 slug，例如 `app.textox.excalidraw.embed`。 */
    id: string;
    /** 形如 `['.excalidraw']`。 */
    extensions: string[];
    insertLabelKey: string;
    /** 纯函数：判断某个 src 是否由本插件处理。 */
    matches(src: string): boolean;
    createPreview(node: EmbedNodeLike): EmbedPreviewRegionLike;
}
/** `app.workspace.registerFileEditor(...)` 的入参；宿主适配为 `app:fileEditor` 贡献。 */
export interface FileEditorBridgeOptions {
    id: string;
    extensions: string[];
    /**
     * 目录树「新建」项的 i18n labelKey。
     *
     * 宿主还会读取 `<newFile>.defaultFileName` 这个 key 作为默认文件名（翻译后作为唯一名 base，
     * 例如生成 `未命名.excalidraw`），**插件必须在 `addMessages` 里同时提供该 key**。
     */
    newFile: string;
    /** 新建该类型文件时的初始内容；`path` 是即将创建的目标路径（可用于写 front matter）。 */
    createEmptyContent(path?: string): string;
    /**
     * 懒加载编辑器组件。宿主按 `ComponentType<FileEditorPropsLike>` 使用；
     * 契约包不依赖 React，故此处只声明 `unknown`——插件实际导出的是 React 组件。
     */
    load(): Promise<{
        default: unknown;
    }>;
    preload?(context: {
        singleFileMode: boolean;
        currentFile: string | null;
    }): Promise<void>;
    capabilities?: {
        customSave?: boolean;
        externalModify?: boolean;
        exportable?: boolean;
    };
}
/**
 * 插件可见的编辑器能力面。
 *
 * `register*` 的贡献值使用作者包自带的编辑器契约类型（`./editor` / `./markdown`），
 * 宿主按同一份类型实现桥接。
 */
export interface PluginEditorApi {
    insertText(text: string): void;
    canEdit(): boolean;
    /** 解析嵌入引用语法（`![alt](src "title")`）；无法解析返回 null。 */
    parseEmbedRef(text: string): {
        src: string;
        alt: string;
        title?: string;
    } | null;
    /** 注册嵌入（图片类引用）的预览渲染；返回值释放后预览不再接管该类型的新节点。 */
    registerEmbed(options: EmbedBridgeOptions): Disposable;
    /** 注册语法功能协调器（源保真 / verbatim 等）。 */
    registerSyntaxFeature(feature: SyntaxFeature): Disposable;
    /** 注册编辑器扩展（ProseMirror 插件、NodeView 等）。 */
    registerExtension(extension: EditorExtension): Disposable;
    /** 注册行内格式工具栏项。 */
    registerFormatToolbarItem(item: FormatToolbarItemMeta): Disposable;
    /** 注册插入块命令。 */
    registerInsertCommand(command: InsertCommandMeta): Disposable;
    /** 注册正文右键菜单项。 */
    registerContextMenuItem(item: EditorContextMenuItemMeta): Disposable;
    /** 注册选区动作。 */
    registerSelectionAction(action: SelectionActionMeta): Disposable;
    /** 注册代码块语法高亮贡献。 */
    registerSyntaxHighlight(contribution: SyntaxHighlightContribution): Disposable;
    /** 请求编辑器按最新运行期配置重建（贡献增删后由宿主调用）。 */
    requestReload(): void;
}
/** 插件可见的宿主能力面；由宿主按插件 id 绑定实现。 */
export interface PluginApp {
    readonly version: string;
    readonly edition: 'full' | 'lite';
    register(kind: ContributionKind, id: string, value: unknown): Disposable;
    workspace: {
        getActiveFilePath(): string | null;
        getDocumentDir(): string | null;
        openFile(path: string): Promise<void>;
        /** 注册自定义文件类型的编辑器（新建/打开该扩展名时由宿主加载）。 */
        registerFileEditor(options: FileEditorBridgeOptions): Disposable;
    };
    editor: PluginEditorApi;
    documents: {
        /** 以给定内容新建临时（未保存）文档并打开；`extension` 决定编辑器类型。 */
        createNewDocument(options: {
            content: string;
            extension?: string;
        }): Promise<void>;
    };
    settings: {
        get<T>(key: string): T | undefined;
        set(key: string, value: unknown): Promise<void>;
        /** 生效配置的只读快照（与 `onDidChange` 收到的形状一致，含默认值回填）。 */
        all(): SettingsSnapshot;
        /** 订阅生效配置变更（含 `manifest.settings` 回填的默认值）；释放返回值即退订。 */
        onDidChange(listener: (snapshot: SettingsSnapshot) => void): Disposable;
    };
    i18n: {
        t(key: string, vars?: Record<string, unknown>): string;
        /**
         * 注入 `plugins` 命名空间下的文案；一次传全部语言，`defaultLocale` 用于缺失语言回退。
         * 语言码必须使用宿主 `APP_LANGUAGES` 的形态（如 `en-US`、`zh-CN`）；写 `en` 这类简写不会被识别，
         * 会静默回退到 `defaultLocale`。
         */
        addMessages(locales: Record<string, Record<string, unknown>>, defaultLocale?: string): void;
    };
    toast: {
        success(message: string): void;
        error(message: string): void;
    };
    /**
     * 注册导出器；`labelKey` 写裸 key（相对本插件文案），宿主补插件 id 前缀。
     * 释放返回值即注销（原生「导出」菜单同步移除，插件的 `menuAction` 不再分派）。
     */
    exporters: {
        register(exporter: PluginExporter): Disposable;
    };
    /**
     * 注册图片上传器（本地路径 → Markdown `src`）。同一插件内后注册者覆盖先注册者，
     * 释放返回值即注销（宿主回退到「仅本地保存」）。
     */
    imageUploader: {
        register(uploader: PluginImageUploader): Disposable;
    };
    /** 宿主 Agent 能力（模型配置未就绪时 `available()` 为 false）。 */
    readonly agent: AgentCapability;
    log: {
        info(...args: unknown[]): void;
        warn(...args: unknown[]): void;
        error(...args: unknown[]): void;
    };
}
//# sourceMappingURL=types.d.ts.map