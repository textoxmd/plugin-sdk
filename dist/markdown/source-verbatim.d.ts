import type { Node as PMNode } from 'prosemirror-model';
/** 一个 verbatim 顶层节点在原文中的源区域（绝对字符偏移）。 */
export interface SourceVerbatimRegion {
    start: number;
    end: number;
    /** 稳定 key（新旧文档配对用；脚注：label）。 */
    key: string;
    /** 原文。 */
    raw: string;
}
/**
 * 顶层「verbatim 节点」源保真协调器：节点不含 root span、被解析器重定位，
 * 不参与位置对齐；原文按区域原位保留，编辑/新增按 key 配对后写回。
 * 与 SourcePreserveReconciler（位置式子单元）并列的第二种源保真缝。
 */
export interface SourceVerbatimReconciler {
    /** 该顶层节点是否由本功能按 verbatim 处理（从位置对齐中排除）。 */
    matches(node: PMNode): boolean;
    /** 新文档中某 verbatim 节点的稳定 key。 */
    keyOf(node: PMNode): string;
    /** 从原文收集全部 verbatim 区域（key 与 keyOf 对齐）。 */
    collect(src: string, doc: PMNode): SourceVerbatimRegion[];
    /** 新节点的 canonical 文本（写回 / 新增）；renderBlockCanon 由核心注入。 */
    render(node: PMNode, renderBlockCanon: (n: PMNode) => string): string;
}
//# sourceMappingURL=source-verbatim.d.ts.map