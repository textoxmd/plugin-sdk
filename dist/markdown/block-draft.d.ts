import type { Node as PMNode } from "prosemirror-model";
import { Plugin, type Transaction } from "prosemirror-state";
import { DecorationSet, type EditorView } from "prosemirror-view";
export type MatchResult<M> = {
    data: M;
    prefixLen: number;
};
export type LeaveLineDraftSpec<M> = {
    match: (text: string) => MatchResult<M> | null;
    draftClass: (data: M) => string;
    commit: (tr: Transaction, paragraphPos: number, paragraph: PMNode, data: M) => void;
    shouldCommit?: () => boolean;
};
export type LeaveLineDraftHandle = {
    plugin: Plugin<DecorationSet>;
    commit: (view: EditorView) => boolean;
};
export declare function leaveLineDraft<M>(spec: LeaveLineDraftSpec<M>): LeaveLineDraftHandle;
//# sourceMappingURL=block-draft.d.ts.map