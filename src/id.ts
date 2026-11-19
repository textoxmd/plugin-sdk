/** 仅描述 id 的「形状」（段与段内字符），不含长度与段数上下限。 */
export const PLUGIN_ID_SHAPE_RE =
  /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*(?:\.[a-z][a-z0-9]*(?:-[a-z0-9]+)*){2,}$/;

/** 字符集预筛：用于区分 invalid-char 与 bad-segment。 */
const PLUGIN_ID_CHARSET_RE = /^[a-z0-9.-]*$/;

export const PLUGIN_ID_MIN = 8;
export const PLUGIN_ID_MAX = 96;
export const PLUGIN_ID_MIN_SEGMENTS = 3;
export const PLUGIN_ID_MAX_SEGMENTS = 8;

export type PluginIdIssue =
  | 'too-short'
  | 'too-long'
  | 'too-few-segments'
  | 'too-many-segments'
  | 'invalid-char'
  | 'bad-segment'
  | 'reserved';

const RESERVED_IDS = new Set(['app', 'markdown-editor']);

/**
 * 校验插件 id。调用方负责保证入参是 string（manifest 侧由 validateManifest 负责）。
 *
 * 检查顺序是契约的一部分，测试向量依赖它：
 * reserved → 字符集 → 段数 → 长度 → 形状正则。
 * 例：'app' 命中 reserved；'com_texto.table' 命中 invalid-char（字符先于段数）；
 * 'table' 命中 too-few-segments；'a.b.c' 命中 too-short（段数先于长度）。
 */
export function validatePluginId(id: string): PluginIdIssue | null {
  if (RESERVED_IDS.has(id)) return 'reserved';
  if (!PLUGIN_ID_CHARSET_RE.test(id)) return 'invalid-char';
  const segments = id.split('.');
  if (segments.length < PLUGIN_ID_MIN_SEGMENTS) return 'too-few-segments';
  if (segments.length > PLUGIN_ID_MAX_SEGMENTS) return 'too-many-segments';
  if (id.length < PLUGIN_ID_MIN) return 'too-short';
  if (id.length > PLUGIN_ID_MAX) return 'too-long';
  if (!PLUGIN_ID_SHAPE_RE.test(id)) return 'bad-segment';
  return null;
}

/** 便捷判定。调用方负责保证入参是 string（非字符串会抛 TypeError，本函数不做兜底）。 */
export function isValidPluginId(id: string): boolean {
  return validatePluginId(id) === null;
}
