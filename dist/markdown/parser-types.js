// Handler-facing contract for the markdown-it → ProseMirror parser.
//
// External plugins contribute `parserTokens` handlers against this interface.
// The editor's concrete `ParserState` class implements it and may carry
// additional internal members (stack/mark bookkeeping, `finish`, ...); only
// the operations below are promised to handlers.
export {};
//# sourceMappingURL=parser-types.js.map