/** 仅描述 id 的「形状」（段与段内字符），不含长度与段数上下限。 */
export declare const PLUGIN_ID_SHAPE_RE: RegExp;
export declare const PLUGIN_ID_MIN = 8;
export declare const PLUGIN_ID_MAX = 96;
export declare const PLUGIN_ID_MIN_SEGMENTS = 3;
export declare const PLUGIN_ID_MAX_SEGMENTS = 8;
export type PluginIdIssue = 'too-short' | 'too-long' | 'too-few-segments' | 'too-many-segments' | 'invalid-char' | 'bad-segment' | 'reserved';
/**
 * 校验插件 id。调用方负责保证入参是 string（manifest 侧由 validateManifest 负责）。
 *
 * 检查顺序是契约的一部分，测试向量依赖它：
 * reserved → 字符集 → 段数 → 长度 → 形状正则。
 * 例：'app' 命中 reserved；'com_texto.table' 命中 invalid-char（字符先于段数）；
 * 'table' 命中 too-few-segments；'a.b.c' 命中 too-short（段数先于长度）。
 */
export declare function validatePluginId(id: string): PluginIdIssue | null;
/** 便捷判定。调用方负责保证入参是 string（非字符串会抛 TypeError，本函数不做兜底）。 */
export declare function isValidPluginId(id: string): boolean;
//# sourceMappingURL=id.d.ts.map