import { describe, expect, it, vi } from 'vitest';
import { DisposableStore, toDisposable } from './disposable';

describe('DisposableStore', () => {
  it('disposes in reverse registration order', () => {
    const order: number[] = [];
    const store = new DisposableStore();
    store.add(toDisposable(() => order.push(1)));
    store.add(toDisposable(() => order.push(2)));
    store.add(toDisposable(() => order.push(3)));
    store.dispose();
    expect(order).toEqual([3, 2, 1]);
  });

  it('keeps disposing after a throwing disposable in the middle, and logs it', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const order: string[] = [];
    const store = new DisposableStore();
    store.add(toDisposable(() => order.push('last-registered')));
    store.add(
      toDisposable(() => {
        throw new Error('boom');
      })
    );
    store.add(toDisposable(() => order.push('first-registered')));

    expect(() => store.dispose()).not.toThrow();
    expect(order).toEqual(['first-registered', 'last-registered']);
    expect(errorSpy).toHaveBeenCalledTimes(1);

    // 幂等：第二次释放不再触发任何项，也不再记录错误
    store.dispose();
    expect(order).toEqual(['first-registered', 'last-registered']);
    expect(errorSpy).toHaveBeenCalledTimes(1);

    errorSpy.mockRestore();
  });

  it('disposes immediately when adding after dispose', () => {
    const spy = vi.fn();
    const store = new DisposableStore();
    store.dispose();
    store.add(toDisposable(spy));
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('disposes a raw non-idempotent disposable twice when added twice (no dedupe by design)', () => {
    let calls = 0;
    const raw = {
      dispose() {
        calls++;
      },
    };
    const store = new DisposableStore();
    store.add(raw);
    store.add(raw);
    store.dispose();
    expect(calls).toBe(2);
  });

  it('does not release the same item twice across repeated dispose calls', () => {
    const calls: string[] = [];
    const store = new DisposableStore('test');
    store.add({ dispose: () => calls.push('raw') });
    expect(store.isDisposed).toBe(false);

    store.dispose();
    expect(store.isDisposed).toBe(true);

    store.dispose();

    expect(calls).toEqual(['raw']);
  });

  it('immediately disposes items added from within a disposing callback', () => {
    const order: string[] = [];
    const store = new DisposableStore();
    store.add(
      toDisposable(() => {
        order.push('outer');
        store.add(toDisposable(() => order.push('late')));
      })
    );
    store.dispose();
    expect(order).toEqual(['outer', 'late']);
    expect(store.isDisposed).toBe(true);
  });
});
