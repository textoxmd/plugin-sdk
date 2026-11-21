import type { Mark, Node as PMNode } from 'prosemirror-model';
/** A mark's open/close delimiters. Functions receive the node/mark for
 *  dynamic delimiters (e.g. code fences). */
export type SerializerMarkSpec = {
    open: string | ((node: PMNode) => string);
    close: string | ((mark: Mark) => string);
};
export interface SerializerState {
    /** Accumulated markdown output. */
    out: string;
    /** Current block prefix repeated on each line (e.g. `"> "`, list indent). */
    delim: string;
    /** Emit any positional marker whose position matches the output cursor. */
    tick(side: 'inner' | 'outer'): void;
    advance(n: number): void;
    write(content?: string): void;
    closeBlock(node: PMNode): void;
    /** Serialize a block's inline content through the configured mark
     *  delimiters. Needed by handlers that introduce inline-bearing blocks. */
    renderInline(parent: PMNode): void;
}
export type BlockHandler = (state: SerializerState, node: PMNode) => void;
//# sourceMappingURL=serializer-types.d.ts.map