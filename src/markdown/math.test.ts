// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { renderFormulaToSVG } from './math.js';

type WindowWithMathJax = Window & { MathJax?: unknown };

function stubMathJax(api: Record<string, unknown>): void {
  (window as WindowWithMathJax).MathJax = api;
}

afterEach(() => {
  delete (window as WindowWithMathJax).MathJax;
  document.querySelectorAll('script[src*="/mathjax/tex-svg.min.js"]').forEach((el) => el.remove());
  vi.useRealTimers();
});

describe('renderFormulaToSVG', () => {
  it('injects the MathJax script on demand instead of relying on index.html', async () => {
    vi.useFakeTimers();
    // 拦截插入，避免 happy-dom 真的去 fetch 脚本。
    const appendSpy = vi.spyOn(document.head, 'appendChild');
    appendSpy.mockImplementation(((node: Node) => node) as typeof document.head.appendChild);
    const pending = renderFormulaToSVG('x');
    const appended = appendSpy.mock.calls[appendSpy.mock.calls.length - 1]?.[0] as
      | HTMLScriptElement
      | undefined;
    expect(appended?.tagName).toBe('SCRIPT');
    expect(appended?.src).toContain('/mathjax/tex-svg.min.js');

    // 脚本就绪后（全局出现）继续渲染，不重复注入。
    const element = document.createElement('div');
    element.innerHTML = '<svg></svg>';
    stubMathJax({ tex2svgPromise: vi.fn(async () => element) });
    await vi.advanceTimersByTimeAsync(100);
    await expect(pending).resolves.toContain('<svg');
    expect(appendSpy).toHaveBeenCalledTimes(1);
    appendSpy.mockRestore();
  });

  it('extracts the SVG from a tex2svgPromise result', async () => {
    const element = document.createElement('div');
    element.innerHTML = '<svg viewBox="0 0 1 1"><g></g></svg>';
    stubMathJax({ tex2svgPromise: vi.fn(async () => element) });

    const svg = await renderFormulaToSVG('x^2');

    expect(svg).toContain('<svg');
  });

  it('passes display mode through and applies decorate', async () => {
    const element = document.createElement('div');
    element.innerHTML = '<svg></svg>';
    const tex2svgPromise = vi.fn(async () => element);
    stubMathJax({ tex2svgPromise });

    const svg = await renderFormulaToSVG('y', {
      mode: 'display',
      decorate: (el) => {
        el.style.maxWidth = '100%';
      },
    });

    expect(tex2svgPromise).toHaveBeenCalledWith('y', { display: true });
    expect(svg).toContain('<svg');
    expect(svg).toContain('max-width');
  });

  it('supports the synchronous tex2svg fallback', async () => {
    const element = document.createElement('div');
    element.innerHTML = '<svg></svg>';
    stubMathJax({ tex2svg: vi.fn(() => element) });

    await expect(renderFormulaToSVG('a')).resolves.toContain('<svg');
  });

  it('supports the typesetPromise fallback', async () => {
    const typesetPromise = vi.fn(async ([container]: HTMLElement[]) => {
      container.innerHTML = '<svg></svg>';
    });
    stubMathJax({ typesetPromise });

    await expect(renderFormulaToSVG('b')).resolves.toContain('<svg');
    expect(typesetPromise).toHaveBeenCalledTimes(1);
  });

  it('throws when no render API produces an SVG', async () => {
    stubMathJax({ tex2svgPromise: vi.fn(async () => document.createElement('div')) });

    await expect(renderFormulaToSVG('z')).rejects.toThrow(/no SVG output/);
  });

  it('rejects when the renderer never becomes available', async () => {
    vi.useFakeTimers();
    const appendSpy = vi.spyOn(document.head, 'appendChild');
    appendSpy.mockImplementation(((node: Node) => node) as typeof document.head.appendChild);
    const pending = renderFormulaToSVG('slow');
    const assertion = expect(pending).rejects.toThrow(/not available/);
    await vi.advanceTimersByTimeAsync(11_000);
    await assertion;
    appendSpy.mockRestore();
  });
});
