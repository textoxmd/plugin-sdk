// Handler-facing contract for the markdown-it → ProseMirror parser.
//
// External plugins contribute `parserTokens` handlers against this interface.
// The editor's concrete `ParserState` class implements it and may carry
// additional internal members (stack/mark bookkeeping, `finish`, ...); only
// the operations below are promised to handlers.

import type Token from 'markdown-it/lib/token.mjs';
import type {
  Attrs,
  Mark,
  MarkType,
  Node as PMNode,
  NodeType,
  Schema,
} from 'prosemirror-model';

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
