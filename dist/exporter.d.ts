/** 导出请求上下文。 */
export interface ExportRequestContext {
    /** 当前活动文件的绝对路径；未保存的新文档为 null。 */
    currentFile: string | null;
    /** 当前文档所在目录；未保存时为 null。 */
    documentDir: string | null;
}
export interface ExportOutput {
    data: string | Uint8Array;
    /** 含扩展名的建议文件名，例如 `note.html`。 */
    suggestedName: string;
}
export interface PluginExporter {
    /** 导出器 id，全局唯一（建议 `<插件id>.<name>` 之外用裸 slug，如 `html`）。 */
    id: string;
    /** i18n key，不写插件 id 前缀（宿主补）。 */
    labelKey: string;
    /** 扩展名，不含点。 */
    extension: string;
    /** 默认 `text`。 */
    kind?: 'text' | 'binary';
    /** 原生「导出」菜单项 id；声明后宿主把它加进子菜单。 */
    menuAction?: string;
    /** 子菜单排序，缺省 0。 */
    order?: number;
    run(context: ExportRequestContext): Promise<ExportOutput>;
}
//# sourceMappingURL=exporter.d.ts.map