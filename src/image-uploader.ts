import type { PluginApp } from './types.js';

/**
 * 图片上传器：本地图片路径 → 插入 Markdown 的 `src`。
 *
 * 同一插件内后注册者覆盖先注册者；停用插件时宿主自动注销。
 */
export interface PluginImageUploader {
  /** 诊断用标识；缺省用插件 id。 */
  id?: string;
  /** 返回插入 Markdown 的 src（URL 或文档相对路径）。 */
  upload(app: PluginApp, filePath: string): Promise<string>;
}
