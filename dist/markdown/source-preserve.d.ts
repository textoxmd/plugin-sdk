export interface BlockSpan {
    /** 起始行（含） */
    start: number;
    /** 结束行（不含） */
    end: number;
}
export declare function lineStarts(text: string): number[];
/**
 * 块级对齐。小文档用 LCS；大文档退化为前缀/后缀两端扫描，避免 O(n·m)。
 */
export declare function alignUnits(a: readonly string[], b: readonly string[]): Array<[number, number]>;
export declare function eolOf(src: string): "\n" | "\r\n";
export declare function toEol(text: string, eol: "\n" | "\r\n"): string;
export declare function ensureEol(text: string, eol: "\n" | "\r\n"): string;
export declare function endsWithEol(text: string, eol: string): boolean;
//# sourceMappingURL=source-preserve.d.ts.map