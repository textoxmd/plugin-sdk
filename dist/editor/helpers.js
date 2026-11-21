/** image_ref 节点文本（`![alt](src "title")`）的解析；编辑器与嵌入插件共用。 */
export const EMBED_REF_RE = /^!\[([^\]]*)\]\(([^\s)]+)(?:\s+"([^"]*)")?\)$/i;
export function parseEmbedRef(text) {
    const m = EMBED_REF_RE.exec(text.trim());
    if (!m)
        return null;
    return { src: m[2], alt: m[1], title: m[3] ?? null };
}
/** 便捷构造：把"渲染区工厂"包成一个代码块编辑器扩展（内部走 views.codeBlock）。 */
export function defineCodeBlockExtension(args) {
    return {
        id: args.id,
        languages: args.languages,
        create: (ctx) => ({
            nodeViews: {
                code_block: (node, view, getPos, decorations) => {
                    const lang = node.attrs.lang;
                    if (typeof lang !== 'string' || !args.languages.includes(lang))
                        return null;
                    return ctx.views.codeBlock({
                        node,
                        view,
                        getPos,
                        decorations,
                        preview: args.createPreview(node),
                    });
                },
            },
        }),
    };
}
/** 便捷构造：把"渲染区工厂"包成一个嵌入编辑器扩展（含插入元数据），内部走 views.embed。 */
export function defineEmbedExtension(args) {
    return {
        id: args.id,
        embed: { extensions: args.extensions, insertLabelKey: args.insertLabelKey, matches: args.matches },
        create: (ctx) => ({
            nodeViews: {
                image_ref: (node, view, getPos, decorations) => {
                    const ref = parseEmbedRef(node.textContent);
                    if (!ref || !args.matches(ref.src))
                        return null;
                    return ctx.views.embed({
                        node,
                        view,
                        getPos,
                        decorations,
                        preview: args.createPreview(node),
                    });
                },
            },
        }),
    };
}
/** 便捷构造：把「插入块命令」包成一个仅含 insert 的编辑器扩展。 */
export function defineInsertExtension(args) {
    return { id: args.id, insert: args.insert, create: () => ({}) };
}
/** 该项在当前场景是否参与（`available` 是当前可用场景集合）。 */
export function contextMenuItemAppliesTo(meta, available) {
    const requires = meta.requires;
    if (!requires || requires.length === 0)
        return true;
    return requires.some((r) => available.includes(r));
}
/** `surfaces` 缺省判定：未声明时两面都投。 */
export function formatToolbarItemIncludesSurface(meta, surface) {
    return (meta.surfaces ?? ['floating', 'toolbar']).includes(surface);
}
//# sourceMappingURL=helpers.js.map