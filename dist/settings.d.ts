import type { SettingsField } from './types.js';
/**
 * 按字段声明计算生效配置：缺省回填 `default`，未声明的键原样保留。
 *
 * 保留未声明键是刻意的：插件版本回退 / 前向兼容时必须不丢配置——旧版本写下的键
 * 在新版本里没有声明，若在这里丢弃，下一次落盘就会把它从磁盘永久抹掉。
 *
 * `preset` / `action` 跳过：它们不承载存储值，回填会让设置快照凭空多出一个键
 * （`preset` 的 `key` 只是标识，`action` 根本没有 `default`）。
 *
 * 注意用 `=== undefined` 判断，`0` / `false` / `''` 都是合法已存值。
 * 条件显示（`visibleWhen`）不影响回填：隐藏的字段仍然有默认值，否则用户切换开关后
 * 该键会一直缺失。
 */
export declare function applySettingsDefaults(fields: SettingsField[], values: Record<string, unknown>): Record<string, unknown>;
//# sourceMappingURL=settings.d.ts.map