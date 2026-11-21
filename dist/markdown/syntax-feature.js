// SyntaxFeature — the public "语法功能" contract.
//
// This is the editor's internal `FeatureSpec` promoted to a stable, external
// contract: the editor re-exports it as `FeatureSpec`, and plugins contribute
// instances of it against the `markdown-editor:syntaxFeature` extension point.
//
// A feature contributes its pieces across every cross-cutting seam:
// schema (node/mark), parser (md-it plugin + token handlers), serializer
// (mark delimiters + block handlers), decorations (gray delim hints),
// input rules, and the test-pretty render map. Aggregation happens in
// features/index.ts; each core module reads from there.
//
// The shape is intentionally minimal — it will grow as real features
// require it. Optional fields stay undefined when a feature doesn't
// need them (inline marks don't need block handlers, etc.).
export {};
//# sourceMappingURL=syntax-feature.js.map