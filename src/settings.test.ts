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

  it('ignores undeclared keys', () => {
    expect(applySettingsDefaults(fields, { legacyKey: 'x' })).toEqual({
      apiKey: '',
      limit: 10,
      enabled: true,
    });
  });
});
