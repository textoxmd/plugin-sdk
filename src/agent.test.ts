import { describe, expectTypeOf, it } from 'vitest';
import type {
  AgentCapability,
  AgentEvent,
  AgentHandlers,
  AgentPresentOptions,
  AgentProfileInfo,
  AgentRequest,
  AgentRunHandle,
  AgentRunOptions,
  AgentToolInfo,
  AgentToolResult,
} from './agent.js';

/**
 * 只做**编译期**断言：`bun run typecheck` 会验证签名，运行期不构造任何桩实现。
 * 形状与宿主 `PluginHost.agent` 一致（宿主那份从本包转出）。
 */
describe('AgentCapability 类型契约', () => {
  it('要求所有入口显式传 profileId', () => {
    expectTypeOf<AgentCapability['available']>().toEqualTypeOf<(profileId: string) => boolean>();
    expectTypeOf<AgentCapability['run']>().toEqualTypeOf<
      (
        request: AgentRequest,
        handlers: AgentHandlers,
        options: AgentRunOptions,
      ) => AgentRunHandle
    >();
    expectTypeOf<AgentCapability['present']>().toEqualTypeOf<
      (request: AgentRequest, options: AgentPresentOptions) => AgentRunHandle
    >();
    expectTypeOf<AgentRunOptions['profileId']>().toEqualTypeOf<string>();
    // present 的选项以 run 的选项为前提（必须有 profileId）
    expectTypeOf<AgentPresentOptions>().toMatchTypeOf<AgentRunOptions>();
  });

  it('暴露只读 profile 列表与可调用的工具注册表', () => {
    expectTypeOf<AgentCapability['profiles']>().toEqualTypeOf<{
      list(): AgentProfileInfo[];
    }>();
    expectTypeOf<AgentCapability['tools']['list']>().toEqualTypeOf<() => AgentToolInfo[]>();
    expectTypeOf<AgentCapability['tools']['call']>().toEqualTypeOf<
      (name: string, args?: Record<string, unknown>) => Promise<AgentToolResult>
    >();
  });

  it('流式事件覆盖文本 / 推理 / 结束 / 可重试错误', () => {
    expectTypeOf<AgentEvent>().toEqualTypeOf<
      | { type: 'text-delta'; text: string }
      | { type: 'reasoning-delta'; text: string }
      | { type: 'done'; text: string }
      | { type: 'error'; message: string; retryable: boolean }
    >();
  });
});
