import type { Node as PMNode } from 'prosemirror-model';
import type { EditorContextMenuItemMeta, EditorContextMenuRequirement, EditorExtension, EmbedRef, FormatToolbarItemMeta, FormatToolbarSurface, InsertCommandMeta, PreviewRegion } from './types.js';
/** image_ref 节点文本（`![alt](src "title")`）的解析；编辑器与嵌入插件共用。 */
export declare const EMBED_REF_RE: RegExp;
export declare function parseEmbedRef(text: string): EmbedRef | null;
/** 便捷构造：把"渲染区工厂"包成一个代码块编辑器扩展（内部走 views.codeBlock）。 */
export declare function defineCodeBlockExtension(args: {
    id: string;
    languages: string[];
    createPreview(node: PMNode): PreviewRegion;
}): EditorExtension;
/** 便捷构造：把"渲染区工厂"包成一个嵌入编辑器扩展（含插入元数据），内部走 views.embed。 */
export declare function defineEmbedExtension(args: {
    id: string;
    extensions: string[];
    insertLabelKey: string;
    matches(src: string): boolean;
    createPreview(node: PMNode): PreviewRegion;
}): EditorExtension;
/** 便捷构造：把「插入块命令」包成一个仅含 insert 的编辑器扩展。 */
export declare function defineInsertExtension(args: {
    id: string;
    insert: InsertCommandMeta;
}): EditorExtension;
/** 该项在当前场景是否参与（`available` 是当前可用场景集合）。 */
export declare function contextMenuItemAppliesTo(meta: EditorContextMenuItemMeta, available: readonly EditorContextMenuRequirement[]): boolean;
/** `surfaces` 缺省判定：未声明时两面都投。 */
export declare function formatToolbarItemIncludesSurface(meta: FormatToolbarItemMeta, surface: FormatToolbarSurface): boolean;
//# sourceMappingURL=helpers.d.ts.map