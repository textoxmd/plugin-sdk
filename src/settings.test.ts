import { describe, expect, it } from 'vitest';
import { applySettingsDefaults } from './settings.js';
import type { SettingsField } from './types.js';

const fields: SettingsField[] = [
  { key: 'apiKey', type: 'password', default: '', labelKey: 'apiKey' },
  { key: 'limit', type: 'number', default: 10, labelKey: 'limit' },
  { key: 'enabled', type: 'boolean', default: true, labelKey: 'enabled' },
];

describe('applySettingsDefaults', () => {
  it('fills defaults for missing keys', () => {
    expect(applySettingsDefaults(fields, {})).toEqual({ apiKey: '', limit: 10, enabled: true });
  });

  it('keeps falsy stored values instead of replacing them with defaults', () => {
    expect(applySettingsDefaults(fields, { apiKey: 'k', limit: 0, enabled: false })).toEqual({
      apiKey: 'k',
      limit: 0,
      enabled: false,
    });
  });

  it('keeps undeclared keys so a downgrade does not lose config', () => {
    const fields: SettingsField[] = [{ key: 'a', type: 'text', labelKey: 'a', default: 'x' }];
    expect(applySettingsDefaults(fields, { a: 'y', extra: 1 })).toEqual({ a: 'y', extra: 1 });
  });

  it('keeps undeclared keys as-is and only backfills missing declared keys', () => {
    expect(applySettingsDefaults(fields, { legacyKey: 'x' })).toEqual({
      apiKey: '',
      limit: 10,
      enabled: true,
      legacyKey: 'x',
    });
    // 已存值优先于默认值：未声明键不被覆盖，声明键也不被回填改写
    expect(applySettingsDefaults(fields, { apiKey: 'k', limit: 0, legacyKey: 2 })).toEqual({
      apiKey: 'k',
      limit: 0,
      enabled: true,
      legacyKey: 2,
    });
  });
});
