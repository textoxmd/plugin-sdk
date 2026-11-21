import { describe, expect, it } from 'vitest';
import type { IconDef, IconElement, IconSpec } from './icon.js';

describe('IconSpec', () => {
  it('接受 lucide 图标名', () => {
    const a: IconSpec = 'underline';
    expect(a).toBe('underline');
  });

  it('接受手绘 IconDef', () => {
    const b: IconSpec = [['path', 'M0 0']];
    expect(b).toHaveLength(1);
  });
});

describe('IconElement', () => {
  it('元素联合覆盖 line / rect / circle 形状', () => {
    const line: IconElement = ['line', 0, 0, 1, 1];
    const rect: IconElement = ['rect', 0, 0, 24, 24];
    const circle: IconElement = ['circle', 12, 12, 6];
    const def: IconDef = [line, rect, circle];
    expect(line).toEqual(['line', 0, 0, 1, 1]);
    expect(rect[0]).toBe('rect');
    expect(circle[0]).toBe('circle');
    expect(def).toHaveLength(3);
  });
});
