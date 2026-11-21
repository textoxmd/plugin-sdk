/**
 * Agent 能力面（宿主 `PluginHost.agent` 的契约）。
 *
 * 从宿主 `@texto/plugin-sdk` 逐字迁来：外部插件只依赖本包，故这些类型必须随作者包发布，
 * 宿主侧改为从这里转出，避免两份定义漂移。
 *
 * 所有入口都**显式**接收 `profileId`：不传 / 空串 / 未知 id 一律视为不可用，
 * 宿主不会回退到「当前默认配置」。
 */
export interface AgentMessageInput {
    role: 'user' | 'assistant';
    content: string;
}
/** 一次 Agent 请求。`system` 作为系统提示。 */
export interface AgentRequest {
    system?: string;
    messages: AgentMessageInput[];
}
/** 锚点矩形：**视口坐标**（与 CSS `position: fixed` 一致）。 */
export interface AgentAnchorRect {
    left: number;
    top: number;
    right: number;
    bottom: number;
    width: number;
    height: number;
}
/**
 * 流式事件：
 * - `text-delta`：增量文本；
 * - `reasoning-delta`：推理过程增量（如模型支持）；
 * - `done`：`text` 是**完整最终文本**，在全部 `text-delta` 之后发出；中止不保证发 `done`；
 * - `error`：`retryable` 为 true 表示值得重试（provider/网络/限流/auth 类错误，
 *   改 key 或稍后可重试）；请求构造/参数错误为 false。
 */
export type AgentEvent = {
    type: 'text-delta';
    text: string;
} | {
    type: 'reasoning-delta';
    text: string;
} | {
    type: 'done';
    text: string;
} | {
    type: 'error';
    message: string;
    retryable: boolean;
};
export interface AgentHandlers {
    /** 每个事件回调一次，按产生顺序。 */
    onEvent(event: AgentEvent): void;
}
export interface AgentRunHandle {
    /** 中止本次运行：幂等；中止后不保证再发事件。 */
    abort(): void;
}
export interface AgentToolInfo {
    name: string;
    description: string;
    /** JSON Schema（object） */
    parameters: Record<string, unknown>;
}
/** 一次工具调用的结果。 */
export interface AgentToolResult {
    content: string;
    details?: unknown;
}
/** 悬浮结果卡的尺寸偏好（宿主会按视口夹取）。 */
export interface AgentPresentSize {
    /** 默认宽度（缺省 420；宿主按视口夹取，不小于 280）。 */
    width?: number;
    /** 最大高度（缺省视口高度的 60%；宿主同样按视口夹取）。 */
    maxHeight?: number;
}
/** 一次运行必需的上下文。 */
export interface AgentRunOptions {
    /** 显式指定的模型配置 id；空串或未知 id 一律视为不可用。 */
    profileId: string;
}
/** `present` 的选项。 */
export interface AgentPresentOptions extends AgentRunOptions {
    /** 锚点矩形（视口坐标）。 */
    anchor: AgentAnchorRect;
    /** 会话/视图标题；缺省由宿主决定。 */
    title?: string;
    /** 侧栏 tab 标签（如「解释 / 翻译 / 简化」）；缺省用宿主默认（释义）。 */
    tabLabel?: string;
    /** 悬浮结果卡的尺寸偏好（仅 `floating` 承载面生效）。 */
    size?: AgentPresentSize;
    /** 展开查看的原文（通常是选中文字）；缺省不显示展开按钮。 */
    sourceText?: string;
}
/** 插件可见的模型配置摘要：只读，不含 Key / baseUrl。 */
export interface AgentProfileInfo {
    readonly id: string;
    readonly name: string;
    /** provider id，来自宿主的 provider 目录（如 openai / deepseek / custom）；插件不应据此分支业务逻辑。 */
    readonly provider: string;
    /** 模型 id；可能为空串（配置未填完）。可用性一律用 available(id) 判定，不要自行推断。 */
    readonly model: string;
    /** 仅表示是否出现在宿主的配置下拉里；**不代表可用**（enabled 为 false 时 available 仍可能为 true）。 */
    readonly enabled: boolean;
}
/** 宿主提供的 Agent 能力。 */
export interface AgentCapability {
    /** 显式指定配置；空串/未知 id 一律 false，不抛错。 */
    available(profileId: string): boolean;
    /** 只经 `handlers` 流式回调，不产生任何 UI。 */
    run(request: AgentRequest, handlers: AgentHandlers, options: AgentRunOptions): AgentRunHandle;
    /**
     * 写入共享 session，并按配置显示悬浮块 / 右侧面板；
     * 会中止上一条请求（同一时刻只有一条 `present` 在跑）。
     */
    present(request: AgentRequest, options: AgentPresentOptions): AgentRunHandle;
    /**
     * 只读列表，供插件展示；不含 Key / baseUrl。
     * 每次调用返回新数组，不通知变更；需要新鲜数据请在显示前重新读取。
     */
    profiles: {
        list(): AgentProfileInfo[];
    };
    /**
     * 工具注册表：核心内置工具 + 插件经 `app:agentTool` 的贡献（同名 last-wins）。
     * v1 只支持插件**手动调用**，宿主不把工具注册给模型。
     */
    tools: {
        list(): AgentToolInfo[];
        call(name: string, args?: Record<string, unknown>): Promise<AgentToolResult>;
    };
}
//# sourceMappingURL=agent.d.ts.map