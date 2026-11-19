import type { PluginManifest } from './types.js';
/** 清单校验失败原因；声明顺序即 `validateManifest` 的检查顺序。 */
export type ManifestIssue = 'not-object' | 'missing-id' | 'invalid-id' | 'missing-name' | 'missing-version' | 'invalid-version' | 'missing-min-app-version' | 'invalid-min-app-version' | 'missing-author';
export type ManifestResult = {
    ok: true;
    manifest: PluginManifest;
} | {
    ok: false;
    issue: ManifestIssue;
};
/**
 * 校验清单。只有 id / name / version / minAppVersion / author 五项经过校验；
 * 其余已知可选字段是直通值，仅按声明类型过滤（类型不符即删除，缺省语义由消费方定义，
 * 例如 `defaultEnabled` 缺失即视为不默认启用）；未知字段原样保留，便于清单向前扩展。
 *
 * 返回顶层浅拷贝：顶层字段与入参解耦，嵌套对象（如 `author`）仍与入参共享引用。
 * 检查顺序见 `ManifestIssue` 的声明顺序。
 */
export declare function validateManifest(raw: unknown): ManifestResult;
//# sourceMappingURL=manifest.d.ts.map