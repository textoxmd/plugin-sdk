/**
 * 按字段声明计算生效配置：缺省回填 `default`，未声明的键原样保留。
 *
 * 保留未声明键是刻意的：插件版本回退 / 前向兼容时必须不丢配置——旧版本写下的键
 * 在新版本里没有声明，若在这里丢弃，下一次落盘就会把它从磁盘永久抹掉。
 *
 * 注意用 `=== undefined` 判断，`0` / `false` / `''` 都是合法已存值。
 */
export function applySettingsDefaults(fields, values) {
    const result = { ...values };
    for (const field of fields) {
        const value = values[field.key];
        if (value === undefined)
            result[field.key] = field.default;
    }
    return result;
}
//# sourceMappingURL=settings.js.map