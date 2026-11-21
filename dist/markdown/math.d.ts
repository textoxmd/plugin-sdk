/** 公式渲染选项。 */
export interface RenderFormulaOptions {
    /** 缺省 'inline'（display:false）；'display' 对应 display:true。 */
    mode?: "inline" | "display";
    /** 序列化前对解析出的 SVG 施加调用方样式。 */
    decorate?: (svg: SVGSVGElement) => void;
}
/**
 * 把 TeX 渲染为 SVG 字符串（纯函数，无缓存）。
 * 引擎不可用或未产出 SVG 时抛出。
 */
export declare function renderFormulaToSVG(tex: string, options?: RenderFormulaOptions): Promise<string>;
//# sourceMappingURL=math.d.ts.map