// leaveLineDraft — reusable "type a prefix, cursor leaves, commit to a new
// block node" plugin. Three features share this shape: heading (`#` …),
// horizontal rule (`---`), fenced code (``` ```).
//
// While the cursor is in a paragraph whose textContent matches the feature's
// regex, the helper:
//
//   1. paints a node decoration on the paragraph (CSS class for
//      bold/indent/etc. while in draft)
//   2. optionally paints an inline decoration on the leading `prefixLen`
//      chars with class `syntax-hint` (gray `#` / ``` delim visible
//      only while in draft, same CSS used by inline marks)
//
// When the selection moves to a DIFFERENT paragraph (any reason — arrow
// keys, Enter splitting, mouse click, programmatic), the helper calls the
// feature's `commit` callback with a transaction whose `replaceWith` /
// `setBlockType` / whatever builds the real node. Typing inside the
// paragraph (even making it no longer match) does NOT commit — the commit
// trigger is "cursor exits this paragraph", not "match invalidated".
//
// A second, imperative commit path is exposed as `handle.commit(view)` —
// for triggers that aren't selection changes (fenced code's autocomplete
// dropdown click is the motivating case).
import { Plugin, PluginKey, } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";
export function leaveLineDraft(spec) {
    const key = new PluginKey("leaveLineDraft");
    function matchForCursorParagraph(state) {
        const sel = state.selection;
        if (!sel.empty)
            return null;
        const $from = sel.$from;
        const paragraph = $from.parent;
        if (paragraph.type.name !== "paragraph")
            return null;
        const m = spec.match(paragraph.textContent);
        if (!m)
            return null;
        return {
            paragraph,
            paragraphPos: $from.before(),
            paragraphStart: $from.start(),
            data: m.data,
            prefixLen: m.prefixLen,
        };
    }
    function buildDecos(state) {
        const hit = matchForCursorParagraph(state);
        if (!hit)
            return DecorationSet.empty;
        const { paragraph, paragraphPos, paragraphStart, data, prefixLen } = hit;
        const decos = [
            Decoration.node(paragraphPos, paragraphPos + paragraph.nodeSize, {
                class: spec.draftClass(data),
            }),
        ];
        if (prefixLen > 0) {
            decos.push(Decoration.inline(paragraphStart, paragraphStart + prefixLen, {
                class: "syntax-hint",
            }));
        }
        return DecorationSet.create(state.doc, decos);
    }
    const plugin = new Plugin({
        key,
        state: {
            init: (_, state) => buildDecos(state),
            apply: (_tr, _old, _oldState, newState) => buildDecos(newState),
        },
        props: {
            decorations(state) {
                return key.getState(state);
            },
        },
        appendTransaction(trs, oldState, newState) {
            // Trigger: oldState's cursor was in a matching paragraph, newState's
            // cursor is in a DIFFERENT paragraph (mapped-position compare).
            // Typing inside the same paragraph — even edits that break the match
            // — does not commit; only "leaving the line" does.
            // Check if commit is allowed (e.g., not during IME composition)
            if (spec.shouldCommit && !spec.shouldCommit())
                return null;
            const oldSel = oldState.selection;
            if (!oldSel.empty)
                return null;
            const oldPara = oldSel.$from.parent;
            if (oldPara.type.name !== "paragraph")
                return null;
            if (!spec.match(oldPara.textContent))
                return null;
            const oldParaPos = oldSel.$from.before();
            let mapped = oldParaPos;
            for (const tr of trs)
                mapped = tr.mapping.map(mapped);
            const newSel = newState.selection;
            if (newSel.empty && newSel.$from.before() === mapped)
                return null;
            // Paragraph might have been deleted or replaced already — bail
            // rather than corrupt the doc.
            const paraNow = newState.doc.nodeAt(mapped);
            if (!paraNow || paraNow.type.name !== "paragraph")
                return null;
            // Recheck the match on the (possibly edited) paragraph. If the
            // leaving edit itself broke the pattern (e.g. user deleted the `#`
            // with a shortcut that also moved the cursor), skip.
            const reMatched = spec.match(paraNow.textContent);
            if (!reMatched)
                return null;
            const tr = newState.tr;
            spec.commit(tr, mapped, paraNow, reMatched.data);
            return tr.docChanged ? tr : null;
        },
    });
    const commit = (view) => {
        const hit = matchForCursorParagraph(view.state);
        if (!hit)
            return false;
        const tr = view.state.tr;
        spec.commit(tr, hit.paragraphPos, hit.paragraph, hit.data);
        if (!tr.docChanged)
            return false;
        view.dispatch(tr);
        return true;
    };
    return { plugin, commit };
}
//# sourceMappingURL=block-draft.js.map