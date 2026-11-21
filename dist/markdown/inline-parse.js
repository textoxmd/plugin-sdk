// Shared inline-span primitives.
//
// The `consumed` bitmap and the serializer's extRanges helper live here. The
// editor's own inline-parse module (orchestration + serializer helpers)
// re-exports them so feature modules keep their existing import path.
export function markConsumed(consumed, from, to) {
    for (let i = from; i < to; i++)
        consumed[i] = 1;
}
// For serializer extRanges: find contiguous runs of a named mark over a
// textblock's children and extend each run by `openLen`/`closeLen` chars
// on the two sides (so the delim chars adjacent to the mark content fall
// inside the returned range and escape the serializer's backslash escape).
export function markExtRanges(parent, markName, openLen, closeLen = openLen) {
    const ranges = [];
    const markType = parent.type.schema.marks[markName];
    if (!markType)
        return ranges;
    let start = -1;
    let off = 0;
    parent.forEach((child) => {
        if (child.isText) {
            const has = child.marks.some((m) => m.type === markType);
            if (has && start < 0)
                start = off;
            if (!has && start >= 0) {
                ranges.push([start - openLen, off + closeLen]);
                start = -1;
            }
        }
        off += child.nodeSize;
    });
    if (start >= 0)
        ranges.push([start - openLen, off + closeLen]);
    return ranges;
}
//# sourceMappingURL=inline-parse.js.map