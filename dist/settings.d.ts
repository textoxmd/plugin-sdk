import type { SettingsField } from './types';
/**
 * 按字段声明计算生效配置：缺省回填 `default`，未声明的键不保留。
 * 注意用 `=== undefined` 判断，`0` / `false` / `''` 都是合法已存值。
 */
export declare function applySettingsDefaults(fields: SettingsField[], values: Record<string, unknown>): Record<string, unknown>;
//# sourceMappingURL=settings.d.ts.map