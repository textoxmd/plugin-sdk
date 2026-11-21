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

  it('skips action fields: no default value, no key in the snapshot', () => {
    const withAction: SettingsField[] = [
      { key: 'apiKey', type: 'text', default: '', labelKey: 'apiKey' },
      { key: 'testConnection', type: 'action', labelKey: 'test', run: () => {} },
    ];

    const values = applySettingsDefaults(withAction, {});

    // action 不承载存储值：回填会让设置快照 / 落盘凭空多出一个键
    expect(values).toEqual({ apiKey: '' });
    expect(Object.prototype.hasOwnProperty.call(values, 'testConnection')).toBe(false);
  });

  it('keeps an explicitly stored action key untouched', () => {
    const withAction: SettingsField[] = [
      { key: 'testConnection', type: 'action', labelKey: 'test', run: () => {} },
    ];

    // 旧版本遗留值/前向兼容：不声明为值字段，但也不主动丢弃
    expect(applySettingsDefaults(withAction, { testConnection: 1 })).toEqual({
      testConnection: 1,
    });
  });
});
