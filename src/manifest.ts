import { isValidPluginId } from './id';
import type { PluginManifest } from './types';

const SEMVER_RE = /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/;

/** 清单校验失败原因；声明顺序即 `validateManifest` 的检查顺序。 */
export type ManifestIssue =
  | 'not-object'
  | 'missing-id'
  | 'invalid-id'
  | 'missing-name'
  | 'missing-version'
  | 'invalid-version'
  | 'missing-min-app-version'
  | 'invalid-min-app-version'
  | 'missing-author';

export type ManifestResult =
  | { ok: true; manifest: PluginManifest }
  | { ok: false; issue: ManifestIssue };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * 校验清单。只有 id / name / version / minAppVersion / author 五项经过校验；
 * 其余已知可选字段是直通值，仅按声明类型过滤（类型不符即删除，缺省语义由消费方定义，
 * 例如 `defaultEnabled` 缺失即视为不默认启用）；未知字段原样保留，便于清单向前扩展。
 *
 * 返回顶层浅拷贝：顶层字段与入参解耦，嵌套对象（如 `author`）仍与入参共享引用。
 * 检查顺序见 `ManifestIssue` 的声明顺序。
 */
export function validateManifest(raw: unknown): ManifestResult {
  if (!isRecord(raw)) return { ok: false, issue: 'not-object' };
  const value = raw;
  if (typeof value.id !== 'string') return { ok: false, issue: 'missing-id' };
  if (!isValidPluginId(value.id)) return { ok: false, issue: 'invalid-id' };
  if (typeof value.name !== 'string' || value.name.length === 0) {
    return { ok: false, issue: 'missing-name' };
  }
  if (typeof value.version !== 'string') return { ok: false, issue: 'missing-version' };
  if (!SEMVER_RE.test(value.version)) return { ok: false, issue: 'invalid-version' };
  if (typeof value.minAppVersion !== 'string') {
    return { ok: false, issue: 'missing-min-app-version' };
  }
  if (!SEMVER_RE.test(value.minAppVersion)) {
    return { ok: false, issue: 'invalid-min-app-version' };
  }
  const author = value.author;
  if (!isRecord(author) || typeof author.name !== 'string' || author.name.length === 0) {
    return { ok: false, issue: 'missing-author' };
  }
  // 已知可选字段只接受声明类型，类型不符即丢弃（缺省语义由消费方定义，例如 defaultEnabled 缺失 = false）；
  // 未知字段原样保留，便于清单向前扩展。
  const manifest = { ...value } as unknown as PluginManifest;
  if (typeof value.description !== 'string') delete manifest.description;
  if (typeof value.category !== 'string') delete manifest.category;
  if (typeof value.icon !== 'string') delete manifest.icon;
  if (typeof value.defaultEnabled !== 'boolean') delete manifest.defaultEnabled;
  if (typeof value.isDesktopOnly !== 'boolean') delete manifest.isDesktopOnly;
  if (
    !isRecord(value.builtAgainst) ||
    !Object.values(value.builtAgainst).every((item) => typeof item === 'string')
  ) {
    delete manifest.builtAgainst;
  }
  return { ok: true, manifest };
}
