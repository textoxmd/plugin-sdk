/**
 * 宿主与插件共用的图标值类型：编辑器贡献项与插件清单卡片图标共用，React-free、零运行时依赖。
 * 放在作者包里，插件与宿主各自渲染。
 */
/** 共享图标定义（24×24 viewBox），React-free，供骨架渲染。 */
export type IconElement = ['path', string] | ['line', number, number, number, number] | ['rect', number, number, number, number, number?] | ['circle', number, number, number] | ['ellipse', number, number, number, number] | ['polyline', string] | ['polygon', string];
export type IconDef = IconElement[];
/** 图标规格：手绘 IconDef，或 lucide 图标名（kebab-case，如 'underline'）。 */
export type IconSpec = IconDef | string;
//# sourceMappingURL=icon.d.ts.map