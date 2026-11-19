/**
 * 可释放资源：插件注册的一切能力都返回该形状，停用插件时统一释放。
 *
 * 必须同步完成——释放顺序（逆序）只有在同步语义下才有确定时点；
 * 异步收尾请放在插件的 `onunload` 里 await，不要返回 Promise。
 */
export interface Disposable {
  dispose(): void;
}

export function toDisposable(fn: () => void): Disposable {
  let disposed = false;
  return {
    dispose() {
      if (disposed) return;
      disposed = true;
      fn();
    },
  };
}

/**
 * 逆序释放的容器：后注册的先释放；单个释放抛错不影响其余；释放后再 add 会立即释放
 * （此时异常会向上抛出，便于在调用点发现「停用后仍在注册」的 bug）。
 *
 * 容器不去重、也不跟踪单项释放：同一对象重复 add、或调用方提前 dispose 某项后，
 * 该项会被再释放一次。请始终用 `toDisposable` 包装后再 add（其内部幂等）。
 */
export class DisposableStore implements Disposable {
  constructor(private readonly label?: string) {}

  private items: Disposable[] = [];
  private disposed = false;

  add<T extends Disposable>(item: T): T {
    if (this.disposed) {
      item.dispose();
      return item;
    }
    this.items.push(item);
    return item;
  }

  get isDisposed(): boolean {
    return this.disposed;
  }

  /**
   * 防「重复释放」有两层冗余保护，两处都别删（删任一层，重复 dispose 的释放次数都不变，
   * 需两层同时删掉才会真的重复释放）：
   * - 进入循环前把 `this.items` 摘空：释放过的项不再被 store 持有，第二次调用无项可释放；
   * - `this.disposed` 提前返回：释放过后不再产生任何副作用与日志（`isDisposed` 语义）。
   *
   * `disposable.test.ts` 的「重复 dispose 不重复释放」用例锁的是「两层都失效」这一侧；
   * 另注意贡献通常经 `toDisposable` 包装，其自身幂等会再遮住 store 层的重复调用。
   */
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    const items = this.items;
    this.items = [];
    for (let i = items.length - 1; i >= 0; i--) {
      try {
        items[i].dispose();
      } catch (error) {
        const suffix = this.label ? ` (${this.label})` : '';
        console.error(`[plugin] dispose failed${suffix}`, { item: items[i], error });
      }
    }
  }
}
