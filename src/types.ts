import type { Disposable } from './disposable';

/** 插件清单：只有元数据，能力一律由代码（`Plugin.onload`）注册，清单不承载能力投影。 */
export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  minAppVersion: string;
  description?: string;
  author: { name: string; id?: string };
  category?: string;
  icon?: string;
  defaultEnabled?: boolean;
  isDesktopOnly?: boolean;
  builtAgainst?: Record<string, string>;
}

/** 声明式设置字段：宿主渲染控件，值存于插件 `data.json` 的 `settings` 键。 */
export type SettingsField =
  | { key: string; type: 'text' | 'password'; default: string; labelKey: string; placeholderKey?: string }
  | { key: string; type: 'number'; default: number; labelKey: string; min?: number; max?: number; step?: number }
  | { key: string; type: 'boolean'; default: boolean; labelKey: string }
  | {
      key: string;
      type: 'select';
      default: string;
      labelKey: string;
      options: Array<{ value: string; labelKey: string }>;
    };

export interface CommandContribution {
  id: string;
  name: string;
  callback: () => void | Promise<void>;
  defaultShortcut?: string;
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
  load(): Promise<{ default: unknown }>;
  preload?(context: { singleFileMode: boolean; currentFile: string | null }): Promise<void>;
  capabilities?: { customSave?: boolean; externalModify?: boolean; exportable?: boolean };
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
  editor: {
    insertText(text: string): void;
    canEdit(): boolean;
    /** 注册嵌入（图片类引用）的预览渲染；返回值释放后预览不再接管该类型的新节点。 */
    registerEmbed(options: EmbedBridgeOptions): Disposable;
    /** 解析嵌入引用语法（`![alt](src "title")`）；无法解析返回 null。 */
    parseEmbedRef(text: string): { src: string; alt: string; title?: string } | null;
  };
  documents: {
    /** 以给定内容新建临时（未保存）文档并打开；`extension` 决定编辑器类型。 */
    createNewDocument(options: { content: string; extension?: string }): Promise<void>;
  };
  settings: {
    get<T>(key: string): T | undefined;
    set(key: string, value: unknown): Promise<void>;
    all(): Record<string, unknown>;
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
  toast: { success(message: string): void; error(message: string): void };
  log: {
    info(...args: unknown[]): void;
    warn(...args: unknown[]): void;
    error(...args: unknown[]): void;
  };
}
