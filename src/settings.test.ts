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
      { key: 'testConnection', type: 'action', labelKey: 'test', command: 'picgo.test' },
    ];

    const values = applySettingsDefaults(withAction, {});

    // action 不承载存储值：回填会让设置快照 / 落盘凭空多出一个键
    expect(values).toEqual({ apiKey: '' });
    expect(Object.prototype.hasOwnProperty.call(values, 'testConnection')).toBe(false);
  });

  it('keeps an explicitly stored action key untouched', () => {
    const withAction: SettingsField[] = [
      { key: 'testConnection', type: 'action', labelKey: 'test', command: 'picgo.test' },
    ];

    // 旧版本遗留值/前向兼容：不声明为值字段，但也不主动丢弃
    expect(applySettingsDefaults(withAction, { testConnection: 1 })).toEqual({
      testConnection: 1,
    });
  });

  it('fills modelProfile defaults (empty string means unbound)', () => {
    const withProfile: SettingsField[] = [
      { key: 'profile', type: 'modelProfile', default: '', labelKey: 'profile' },
      { key: 'translateProfile', type: 'modelProfile', default: 'p_default', labelKey: 'x' },
    ];

    expect(applySettingsDefaults(withProfile, {})).toEqual({
      profile: '',
      translateProfile: 'p_default',
    });
    // 空串是合法已存值（未绑定），不能被默认值覆盖
    expect(applySettingsDefaults(withProfile, { profile: '', translateProfile: 'p_user' })).toEqual({
      profile: '',
      translateProfile: 'p_user',
    });
  });

  it('fills color defaults', () => {
    const withColor: SettingsField[] = [
      {
        key: 'highlightColor',
        type: 'color',
        default: '#f7d54e',
        labelKey: 'color',
        presets: [{ value: '#f7d54e' }, { value: '#a0e8a0', labelKey: 'green' }],
      },
    ];

    expect(applySettingsDefaults(withColor, {})).toEqual({ highlightColor: '#f7d54e' });
    expect(applySettingsDefaults(withColor, { highlightColor: '#000' })).toEqual({
      highlightColor: '#000',
    });
  });

  it('skips preset fields: they write other keys, never their own', () => {
    const withPreset: SettingsField[] = [
      { key: 'density', type: 'number', default: 1, labelKey: 'density' },
      {
        key: 'theme',
        type: 'preset',
        labelKey: 'theme',
        options: [
          { value: 'compact', labelKey: 'compact', values: { density: 0 } },
          { value: 'roomy', labelKey: 'roomy', values: { density: 2 } },
        ],
      },
    ];

    const values = applySettingsDefaults(withPreset, {});

    // preset 没有 default：快照里只有它要写的那些键（此处 density 仍由自己的字段回填）
    expect(values).toEqual({ density: 1 });
    expect(Object.prototype.hasOwnProperty.call(values, 'theme')).toBe(false);
  });

  it('backfills hidden fields too (visibleWhen only affects rendering)', () => {
    const conditional: SettingsField[] = [
      { key: 'mode', type: 'select', default: 'auto', labelKey: 'mode', options: [
        { value: 'auto', labelKey: 'auto' },
        { value: 'fixed', labelKey: 'fixed' },
      ] },
      {
        key: 'fixedValue',
        type: 'number',
        default: 12,
        labelKey: 'fixedValue',
        visibleWhen: { key: 'mode', equals: 'fixed' },
      },
    ];

    // 条件不满足时字段不渲染，但默认值仍要回填：否则用户切到 fixed 后该键一直缺失
    expect(applySettingsDefaults(conditional, {})).toEqual({ mode: 'auto', fixedValue: 12 });
  });
});
