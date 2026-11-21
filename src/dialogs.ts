/** 文件选择器的筛选组（与系统原生面板的 `filters` 同形）。 */
export interface PluginFileFilter {
  /** 面板里显示的分类名，如 `Images`。 */
  name: string;
  /** 不带点的扩展名，如 `['png', 'jpg']`。 */
  extensions: string[];
}

/** `app.dialogs.pickFile` 的入参；全部可省——至少给出 `filters` 才能限制可选类型。 */
export interface PickFileOptions {
  /** 面板标题；平台是否显示标题由系统决定。 */
  title?: string;
  filters?: PluginFileFilter[];
  /** 默认打开的目录或文件路径。 */
  defaultPath?: string;
}

/** `app.dialogs.confirm` 的入参。 */
export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

/**
 * 插件对话框能力面（`app.dialogs`）。
 *
 * 只承载「原生、无需宿主 UI 组件」的两类交互。自定义表单请用设置段声明字段，
 * 或渲染 `PluginHost` 的编辑器视图构件，不要指望对话框承载任意 HTML。
 *
 * 宿主在无原生能力的环境（浏览器预览）里降级：`pickFile` 恒为 `null`、
 * `confirm` 恒为 `false`——**不会 reject**，插件据此当作用户取消即可。
 */
export interface PluginDialogsApi {
  /** 选择单个文件；用户取消（或环境不支持）返回 `null`。 */
  pickFile(options?: PickFileOptions): Promise<string | null>;
  /** 二次确认；用户拒绝（或环境不支持）返回 `false`。 */
  confirm(options: ConfirmOptions): Promise<boolean>;
}
