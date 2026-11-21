import type { Node as PMNode } from 'prosemirror-model';
export type InlineSpan = {
    type: string;
    from: number;
    to: number;
    openFrom: number;
    openTo: number;
    closeFrom: number;
    closeTo: number;
    attrs?: Record<string, unknown>;
    /**
     * 内容不透明：归派生引擎记账时占满 `openFrom..closeTo`（而不是只占分隔符），
     * 冲突检查按整段（不允许包住已有 span），后续特性不能再认领其内容。用于
     * 「内容是原子数据、不参与其它行内语法」的 mark（如行内公式的 `inline_math`）。
     * 默认 false（mark 只占分隔符）。
     *
     * 仅 `derive` 的占用记账读取。
     * 与 `markNames` 同现时，opaque 优先于分隔符占用。
     */
    opaque?: boolean;
    /**
     * 包裹式内容：冲突检查只看分隔符（允许内容里已有嵌套 span），
     * 但记账时占整段 `openFrom..closeTo`，后续特性不能再认领其内容。
     * 用于 `<u>…</u>`、脚注引用这类"内容整体不再解析、但可以包住已有 mark"的构造。
     *
     * 仅 `derive` 的占用记账读取；与 `opaque` 同现时 `opaque` 优先。
     */
    wrap?: boolean;
    delimRanges?: Array<{
        from: number;
        to: number;
        forceVisible?: boolean;
        softInside?: boolean;
        forceHidden?: boolean;
        className?: string;
    }>;
    extraDecorations?: Array<{
        from: number;
        to: number;
        nodeName: string;
        attrs?: Record<string, string>;
    }>;
    widgetDecorations?: Array<{
        pos: number;
        when: "inside" | "outside" | "always";
        kind: string;
        attrs?: Record<string, string>;
        side?: number;
        stopEvents?: boolean;
    }>;
};
export declare function markConsumed(consumed: Uint8Array, from: number, to: number): void;
export declare function markExtRanges(parent: PMNode, markName: string, openLen: number, closeLen?: number): Array<[number, number]>;
//# sourceMappingURL=inline-parse.d.ts.map