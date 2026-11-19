import { describe, expect, it } from 'vitest';
import { SHARED_MODULES, isSharedModule } from './shared-modules';

describe('isSharedModule', () => {
  it.each([
    ['react', true],
    ['@textox/plugin-sdk', true],
    ['react-dom/server', false],
    ['lodash', false],
  ] as const)('%s => %s', (specifier, expected) => {
    expect(isSharedModule(specifier)).toBe(expected);
  });

  it('列出 14 个共享模块', () => {
    expect(SHARED_MODULES).toHaveLength(14);
  });
});
