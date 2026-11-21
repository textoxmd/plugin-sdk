// Handler-facing contract for the Markdown serializer.
//
// External plugins contribute `blockHandlers` / `markDelims` against these
// types. The editor's concrete `SerializerState` class implements the
// interface and may carry additional internal/orchestration members
// (`renderDoc`, `wrapBlock`, `onBlock`, positional bookkeeping, ...) that are
// deliberately not part of the plugin contract.

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
