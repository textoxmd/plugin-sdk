/**
 * Agent 能力面（宿主 `PluginHost.agent` 的契约）。
 *
 * 从宿主 `@texto/plugin-sdk` 逐字迁来：外部插件只依赖本包，故这些类型必须随作者包发布，
 * 宿主侧改为从这里转出，避免两份定义漂移。
 *
 * 所有入口都**显式**接收 `profileId`：不传 / 空串 / 未知 id 一律视为不可用，
 * 宿主不会回退到「当前默认配置」。
 */
export {};
//# sourceMappingURL=agent.js.map