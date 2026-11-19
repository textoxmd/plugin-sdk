import { describe, expect, it } from 'vitest';
import { validateManifest } from './manifest.js';
import type { ManifestIssue } from './manifest.js';
import type { PluginManifest } from './types.js';

const base = {
  id: 'app.textox.hello-world',
  name: 'Hello World',
  version: '1.0.0',
  minAppVersion: '2.3.8',
  author: { name: 'Textox' },
};

function expectOk(raw: unknown): PluginManifest {
  const result = validateManifest(raw);
  if (!result.ok) throw new Error(`expected ok, got issue: ${result.issue}`);
  return result.manifest;
}

describe('validateManifest', () => {
  it('accepts a valid manifest', () => {
    const result = validateManifest(base);
    expect(result.ok).toBe(true);
  });

  it('rejects invalid id', () => {
    expect(validateManifest({ ...base, id: 'hello' })).toEqual({
      ok: false,
      issue: 'invalid-id',
    });
  });

  it('rejects missing minAppVersion', () => {
    const { minAppVersion: _drop, ...rest } = base;
    expect(validateManifest(rest)).toEqual({ ok: false, issue: 'missing-min-app-version' });
  });

  it('rejects non-object', () => {
    expect(validateManifest(null)).toEqual({ ok: false, issue: 'not-object' });
  });

  it.each<[ManifestIssue, unknown]>([
    ['missing-id', { ...base, id: undefined }],
    ['missing-name', { ...base, name: '' }],
    ['missing-version', { ...base, version: 1 }],
    ['invalid-version', { ...base, version: '1.0' }],
    ['invalid-min-app-version', { ...base, minAppVersion: '2.3' }],
    ['missing-author', { ...base, author: { id: 'x' } }],
    ['missing-author', { ...base, author: { name: '' } }],
  ])('rejects with issue %s', (issue, raw) => {
    expect(validateManifest(raw)).toEqual({ ok: false, issue });
  });

  it('accepts prerelease and build-metadata versions', () => {
    expect(validateManifest({ ...base, version: '1.0.0-beta.1' }).ok).toBe(true);
    expect(validateManifest({ ...base, minAppVersion: '2.3.8+20260101' }).ok).toBe(true);
  });

  it.each(['1.0', 'v1.0.0', '1.0.0-'])('rejects malformed version %s', (version) => {
    expect(validateManifest({ ...base, version })).toEqual({ ok: false, issue: 'invalid-version' });
  });

  it('drops known optional fields whose type does not match', () => {
    const manifest = expectOk({
      ...base,
      description: 123,
      category: {},
      icon: 123,
      defaultEnabled: 'false',
      isDesktopOnly: 'no',
      builtAgainst: 'v1',
    });
    const filteredKeys: Array<keyof PluginManifest> = [
      'description',
      'category',
      'icon',
      'defaultEnabled',
      'isDesktopOnly',
      'builtAgainst',
    ];
    for (const key of filteredKeys) {
      expect(key in manifest, key).toBe(false);
    }
  });

  it.each<[string, Record<string, unknown>]>([
    ['a non-string map', { react: 19 }],
    ['a boolean map', { react: true }],
  ])('drops builtAgainst when it is %s', (_label, builtAgainst) => {
    const manifest = expectOk({ ...base, builtAgainst });
    expect('builtAgainst' in manifest).toBe(false);
  });

  it('keeps known optional fields whose type matches', () => {
    const manifest = expectOk({
      ...base,
      description: 'demo',
      category: 'editing',
      icon: 'table',
      defaultEnabled: false,
      isDesktopOnly: true,
      builtAgainst: { app: '2.3.8', react: '19.1.0' },
    });
    expect(manifest.description).toBe('demo');
    expect(manifest.category).toBe('editing');
    expect(manifest.icon).toBe('table');
    expect(manifest.defaultEnabled).toBe(false);
    expect(manifest.isDesktopOnly).toBe(true);
    expect(manifest.builtAgainst).toEqual({ app: '2.3.8', react: '19.1.0' });
  });

  it('keeps unknown fields as-is', () => {
    const manifest = expectOk({ ...base, homepage: 'x' });
    expect((manifest as unknown as Record<string, unknown>).homepage).toBe('x');
  });

  it('returns a snapshot rather than the input reference', () => {
    const result = validateManifest(base);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.manifest).not.toBe(base);
  });
});
