// Handler-facing contract for the Markdown serializer.
//
// External plugins contribute `blockHandlers` / `markDelims` against these
// types. The editor's concrete `SerializerState` class implements the
// interface and may carry additional internal/orchestration members
// (`renderDoc`, `wrapBlock`, `onBlock`, positional bookkeeping, ...) that are
// deliberately not part of the plugin contract.
export {};
//# sourceMappingURL=serializer-types.js.map