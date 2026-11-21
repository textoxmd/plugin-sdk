import type { LanguageFn } from 'highlight.js';
import type { Node as PMNode, Schema } from 'prosemirror-model';
import type { EditorState, Plugin as PMPlugin } from 'prosemirror-state';
import type { Decoration, EditorView, NodeView } from 'prosemirror-view';
import type { IconSpec } from '../icon.js';

/** 嵌入引用解析结果。 */
export interface EmbedRef {
  src: string;
  alt: string;
  title: string | null;
}

/**
 * PM 原生 NodeView 工厂。
 * 返回 NodeView 表示"我认领这个节点"；返回 null 表示"不是我的"，交给下一个贡献或内置视图。
 */
export type NodeViewFactory = (
  node: PMNode,
  view: EditorView,
  getPos: () => number | undefined,
  decorations: readonly Decoration[],
) => NodeView | null;

export interface EditorExtensionResult {
  /** 行为 / 装饰 / 键盘等 ProseMirror 插件 */
  plugins?: PMPlugin[];
  /** 键为 schema 节点类型名。同一类型可有多个贡献，由编辑器按序（后注册优先）分发。 */
  nodeViews?: Record<string, NodeViewFactory | undefined>;
}

/** 应用层嵌入插入元数据（非 PM 概念）。 */
export interface EmbedInsertMeta {
  /** 文件后缀（含点） */
  extensions: string[];
  /** "插入 X"菜单项 i18n key */
  insertLabelKey: string;
  /** 匹配某 src 是否属于本嵌入（供编辑器在 src 变化时就地重判归属） */
  matches?(src: string): boolean;
}

/**
 * 嵌入插入项 DTO：宿主"插入 X"流程所需（由扩展 embed 元数据派生）。
 * 与 `EmbedInsertMeta` 的区别：本类型带 `id`、不含 `matches`（供插入菜单消费）。
 */
export interface EmbedInsert {
  id: string;
  extensions: string[];
  insertLabelKey: string;
}

/** 预览区运行期上下文。 */
export interface PreviewContext {
  documentDir: string | null;
  /** 主题标识；当前恒为 'base'。 */
  theme: string;
  onError(msg: string): void;
  /** 预览成功写入内容后调用；宿主可据此清除错误态。 */
  onSuccess?(): void;
}

/** 插件提供的渲染区内容。 */
export interface PreviewRegion {
  dom: HTMLElement;
  update?(node: PMNode, ctx: PreviewContext): void;
  destroy?(): void;
}

export interface CodeBlockViewArgs {
  node: PMNode;
  view: EditorView;
  getPos: () => number | undefined;
  decorations: readonly Decoration[];
  preview: PreviewRegion;
}

export type EmbedViewArgs = CodeBlockViewArgs;

/** 编辑器注入的可复用视图构件；插件可选使用。 */
export interface EditorViewKit {
  /** 内置代码块视图 + 插件的渲染区。 */
  codeBlock(args: CodeBlockViewArgs): NodeView;
  /** 内置 image_ref 视图 + 插件的嵌入渲染区。 */
  embed(args: EmbedViewArgs): NodeView;
}

/** 插件实时配置只读读取器；由骨架按扩展 owner 注入，随设置变更自动更新。读取为顶层只读快照。 */
export interface PluginConfigReader {
  get<T>(key: string): T | undefined;
  all<T = Record<string, unknown>>(): T;
}

/** 编辑器创建时传给扩展的上下文（不含 EditorView，创建时尚不存在）。 */
export interface EditorContext {
  schema: Schema;
  documentPath?: string;
  isSingleFileMode?: boolean;
  /** 编辑器注入的可复用视图构件；插件可选使用。 */
  views: EditorViewKit;
  /** 本扩展所属插件的实时配置（只读，框架维护）。 */
  config: PluginConfigReader;
}

// 图标值类型由同包的 `../icon` 定义（单一真相）；此处只做类型转发，
// 保持宿主 `@texto/*` 壳的对外导入路径不变。
export type { IconDef, IconElement, IconSpec } from '../icon.js';

/** 插件贡献的「插入块命令」：驱动工具栏 / 斜杠菜单 / 快捷键 / 命令分发。 */
export interface InsertCommandMeta {
  /** 命令 id：裸 slug，须与快捷键 / 原生菜单 action id 一致（如 'table'）；贡献间按 id 去重（后注册优先）。 */
  id: string;
  /** 斜杠菜单关键词（如 'table'）。 */
  keyword: string;
  /** 工具栏 / 斜杠菜单 / 快捷键名共用的完整 i18n key（如 'table.pluginName'）。 */
  labelKey: string;
  /** 快捷键设置页描述 i18n key（缺省回退 labelKey）。 */
  descriptionKey?: string;
  /** 图标：手绘 IconDef，或 lucide 图标名（kebab-case）。 */
  icon: IconSpec;
  /** 快捷键设置页展示的默认组合键（如 'Cmd+Opt+T'）。 */
  defaultShortcut?: string;
  /** 快捷键分组（复用既有分组名，缺省 'paragraph'）。 */
  category?: string;
  /** 工具栏排序权重（升序，缺省 0）。 */
  order?: number;
  /** 在当前光标处插入；用 view.state.schema 构造节点。 */
  insert(view: EditorView): void;
  /** 缺省由骨架复用 canInsertBlockAt(state)。 */
  isDisabled?(state: EditorState): boolean;
}

/** 编辑器唯一扩展入口：插件向 `markdown-editor:extension` 提交它。 */
export interface EditorExtension {
  id: string;
  /** 若为嵌入：主界面插入流程所需元数据 */
  embed?: EmbedInsertMeta;
  /** 若提供代码块视图：其支持的语言（供语言下拉框合并） */
  languages?: string[];
  /** 若贡献块插入命令：驱动工具栏 / 斜杠 / 快捷键。 */
  insert?: InsertCommandMeta;
  /** 编辑器实例创建时调用一次；owner = editor view */
  create(ctx: EditorContext): EditorExtensionResult;
}

/** 一条 highlight.js 语法贡献（编辑器扩展点 markdown-editor:syntaxHighlight）。 */
export interface HighlightLanguage {
  /** 规范语言名：写入 code_block.attrs.lang 的值（如 'javascript'）。 */
  id: string;
  /** 语言下拉显示名；缺省回退 id。 */
  label?: string;
  /** 别名（如 js / jsx）：用于 hljs 别名注册与下拉过滤。 */
  aliases?: string[];
  /**
   * highlight.js 语法定义（同步）。与 `loadGrammar` 二选一；同时给出时以本字段为准。
   *
   * 大语料库（如官方 syntax-highlight 插件的 23 个语法包）应改用 `loadGrammar`，
   * 否则语法包会被打进入口包。
   */
  grammar?: LanguageFn;
  /**
   * 惰性加载语法定义：编辑器按「文档里实际出现的语言」按需调用一次，
   * 加载完成后自动重算受影响的代码块高亮。
   *
   * 返回的仍是同一个 `LanguageFn`；同时提供 `grammar` 时本字段不会被调用。
   */
  loadGrammar?: () => Promise<LanguageFn>;
}

/** `markdown-editor:syntaxHighlight` 扩展点贡献体。 */
export interface SyntaxHighlightContribution {
  languages: HighlightLanguage[];
}

/** 行内格式按钮的投放面。 */
export type FormatToolbarSurface = 'floating' | 'toolbar';

/** 插件贡献的「行内格式按钮」：驱动悬浮工具栏 + 顶部工具栏 + 激活态。 */
export interface FormatToolbarItemMeta {
  /** 去重键；重复时后注册覆盖（位置遵循 SDK 注册语义）。 */
  id: string;
  /** schema mark 名，用于默认激活态（如 'underline'）。 */
  markName: string;
  /** 开分隔符文本（'**' / '<u>'）。 */
  delim: string;
  /** 闭合分隔符，缺省 = delim（'</u>'）。 */
  closeDelim?: string;
  /** i18n key（'underline.pluginName'）。 */
  labelKey: string;
  /** 图标：手绘 IconDef，或 lucide 图标名（kebab-case）。 */
  icon: IconSpec;
  /** 排序权重（升序，缺省 0）。 */
  order?: number;
  /** 投放面；缺省同时投悬浮与顶部。 */
  surfaces?: FormatToolbarSurface[];
  /** 可选逃生舱：自定义 toggle；缺省走共享 toggleInlineDelim。 */
  run?(view: EditorView): void;
  /** 可选逃生舱：自定义激活判定；缺省按 markName 判选中态。 */
  isActive?(state: EditorState): boolean;
}

/** 插件贡献的「选区动作」（释义等）：悬浮栏按钮，不改 schema。 */
export interface SelectionActionMeta {
  /** 去重键（建议 `<插件id>.<name>`）；重复时后注册覆盖（last-wins）。 */
  id: string;
  /** 文案 i18n key（插件自带 locales；`t()` 经 fallbackNS 解析 `plugins` 命名空间）。 */
  labelKey: string;
  icon: IconSpec;
  /** 排序权重（升序，缺省 0；相等按注册序）。 */
  order?: number;
  /** 可见性；缺省恒可见。每次悬浮栏显示时求值，抛错视为不可见。 */
  when?(): boolean;
  /**
   * 点击执行。调用时选区仍存在（悬浮栏 mousedown 已 preventDefault），
   * 插件可直接读 `view.state.selection`。
   */
  run(view: EditorView): void | Promise<void>;
}

/** 右键菜单场景：有非折叠选区（`selection`）或右键命中块（`block`；仅在无选区时可用）。 */
export type EditorContextMenuRequirement = 'selection' | 'block';

/** 正文右键菜单上下文。 */
export interface EditorContextMenuCtx {
  /** 编辑器视图：读选区 / 派发事务 / 取焦点。 */
  view: EditorView;
  /** 当前是否有非折叠选区（内置复制项的可用性也由它决定）。 */
  hasSelection: boolean;
  /** 右键命中的目标顶层块；未命中（如点在块之间的留白）时为 null。 */
  block: { pos: number; node: PMNode } | null;
}

/** 插件贡献的「正文右键菜单项」。 */
export interface EditorContextMenuItemMeta {
  /** 去重键（裸 slug，建议 `<插件id>.<name>`）；重复时后注册覆盖、位置遵循 SDK 注册语义。 */
  id: string;
  /** 文案 i18n key（插件自带 locales；`t()` 经 fallbackNS 解析 `plugins` 命名空间）。 */
  labelKey: string;
  /**
   * 该向在什么场景可用；**不写 = 任何场景都列出**（可点性交给 `enabled`）。
   * `['block']`：只在「无选区且命中块」时出现；`['selection']`：只在有选区时出现。
   * 场景互斥：**有选区时选区优先**，`block` 场景的项不参与。
   */
  requires?: EditorContextMenuRequirement[];
  /** 排序权重（组内升序，缺省 0；相等按注册序）。 */
  order?: number;
  /** 可见性；缺省恒可见。抛错 ⇒ 该项不可见（被隔离）。 */
  when?(ctx: EditorContextMenuCtx): boolean;
  /** 可用性（列出但置灰）；缺省恒可用。抛错 ⇒ 置灰。 */
  enabled?(ctx: EditorContextMenuCtx): boolean;
  /** 点击执行。允许返回 Promise（编辑器不等待）。抛错被隔离。 */
  run(ctx: EditorContextMenuCtx): void | Promise<void>;
}
