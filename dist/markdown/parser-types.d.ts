import type Token from 'markdown-it/lib/token.mjs';
import type { Attrs, Mark, MarkType, Node as PMNode, NodeType, Schema } from 'prosemirror-model';
export interface ParserState {
    /** Append an already-built node to the current frame. */
    push(node: PMNode): void;
    /** Append text (with the currently open marks) to the current frame. */
    addText(text: string): void;
    openMark(mark: Mark): void;
    closeMarkType(type: MarkType): void;
    /** Peek the currently-open mark of a given type. */
    topMark(type: MarkType): Mark | undefined;
    openNode(type: NodeType, attrs?: Attrs | null): void;
    closeNode(): void;
}
export type TokenHandler = (state: ParserState, token: Token, schema: Schema) => void;
//# sourceMappingURL=parser-types.d.ts.map