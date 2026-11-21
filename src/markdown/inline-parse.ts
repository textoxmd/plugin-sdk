// Shared inline-span primitives.
//
// The `consumed` bitmap and the serializer's extRanges helper live here. The
// editor's own inline-parse module (orchestration + serializer helpers)
// re-exports them so feature modules keep their existing import path.

import type { Node as PMNode } from 'prosemirror-model';

// Some inline features need parent context (e.g. task-list trigger only
// fires for textblocks directly inside a list_item). parseInline threads
// the parent textblock node through to each feature's derive.
export type InlineSpan = {
  type: string; // mark name — filled by the locating layer or a feature derive
  from: number;
  to: number;
  openFrom: number;
  openTo: number;
  closeFrom: number;
  closeTo: number;
  // Optional mark attrs — used by features whose mark carries data, e.g.
  // link's {href, title}. normalize passes these to markType.create(attrs).
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
  // When provided, overrides the default open/close delim emission. Each
  // entry becomes a DelimRange. Used by empty-content links where the
  // open/close split alone wouldn't capture the right rendering.
  delimRanges?: Array<{
    from: number;
    to: number;
    forceVisible?: boolean;
    // softInside: when true, the range is hidden when the cursor is
    // outside the span and rendered as plain text (no class) when the
    // cursor is inside. Used for bare leading/trailing whitespace inside
    // a code fence — it should disappear in the stable view but remain
    // visible (and editable) while the user has the fence open.
    softInside?: boolean;
    // forceHidden: chars are visually absent regardless of cursor — used
    // by atomic markers like task-list `[ ] ` whose source the user can
    // not navigate into.
    forceHidden?: boolean;
    // Override the CSS class on the forceHidden / soft / standard span.
    // Example: task uses a width:0 inline-block (so the line keeps a
    // normal caret-height) instead of the global syntax-hidden's
    // font-size:0 (which collapses caret height when nothing else is on
    // the line).
    className?: string;
  }>;
  // Extra inline decorations (non-delim) the feature wants drawn over its
  // span. Used to give an empty-text link's href a visible link-styled
  // wrapper without adding a stray link mark to the doc.
  extraDecorations?: Array<{
    from: number;
    to: number;
    nodeName: string;
    attrs?: Record<string, string>;
  }>;
  // Widget decorations (DOM nodes injected at a specific position, not
  // wrapping any source chars). `when` toggles them based on the cursor's
  // position relative to the span:
  //   - "inside":  cursor in [spanFrom, spanTo]
  //   - "outside": cursor not in [spanFrom, spanTo]
  //   - "always":  always rendered
  // Used by image to swap a rendered <img> (cursor outside) for an icon +
  // optional file input (cursor inside, source-as-text editing UI).
  widgetDecorations?: Array<{
    pos: number;
    when: "inside" | "outside" | "always";
    kind: string;
    attrs?: Record<string, string>;
    side?: number;
    // Opt into the "stopped" widget event semantics used by built-in widgets
    // (`ignoreSelection: true` + `stopEvent` returning true for everything but
    // click). Atomic decoration-only plugin widgets (e.g. the emoji glyph) set
    // this to preserve the historical builtin behavior; plugin widgets that
    // leave it unset get PM's default spec (events pass through) so interactive
    // inline widgets (e.g. math) can receive input.
    stopEvents?: boolean;
  }>;
};

export function markConsumed(consumed: Uint8Array, from: number, to: number): void {
  for (let i = from; i < to; i++) consumed[i] = 1;
}

// For serializer extRanges: find contiguous runs of a named mark over a
// textblock's children and extend each run by `openLen`/`closeLen` chars
// on the two sides (so the delim chars adjacent to the mark content fall
// inside the returned range and escape the serializer's backslash escape).
export function markExtRanges(
  parent: PMNode,
  markName: string,
  openLen: number,
  closeLen: number = openLen,
): Array<[number, number]> {
  const ranges: Array<[number, number]> = [];
  const markType = parent.type.schema.marks[markName];
  if (!markType) return ranges;
  let start = -1;
  let off = 0;
  parent.forEach((child) => {
    if (child.isText) {
      const has = child.marks.some((m) => m.type === markType);
      if (has && start < 0) start = off;
      if (!has && start >= 0) {
        ranges.push([start - openLen, off + closeLen]);
        start = -1;
      }
    }
    off += child.nodeSize;
  });
  if (start >= 0) ranges.push([start - openLen, off + closeLen]);
  return ranges;
}
