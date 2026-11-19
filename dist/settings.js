/**
 * 按字段声明计算生效配置：缺省回填 `default`，未声明的键不保留。
 * 注意用 `=== undefined` 判断，`0` / `false` / `''` 都是合法已存值。
 */
export function applySettingsDefaults(fields, values) {
    const result = {};
    for (const field of fields) {
        const value = values[field.key];
        result[field.key] = value === undefined ? field.default : value;
    }
    return result;
}
//# sourceMappingURL=settings.js.map