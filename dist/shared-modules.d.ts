/**
 * 宿主通过 import map 提供给插件的裸模块。插件构建时必须把它们标记为 external
 * （见 `@textox/plugin-build`），否则插件包会内联第二份实例。
 */
export declare const SHARED_MODULES: readonly ["react", "react/jsx-runtime", "react-dom", "react-dom/client", "prosemirror-model", "prosemirror-state", "prosemirror-view", "prosemirror-transform", "i18next", "react-i18next", "@textox/plugin-sdk", "@texto/export-runtime", "@tauri-apps/api/core", "@tauri-apps/api/event"];
export type SharedModule = (typeof SHARED_MODULES)[number];
export declare function isSharedModule(specifier: string): specifier is SharedModule;
//# sourceMappingURL=shared-modules.d.ts.map