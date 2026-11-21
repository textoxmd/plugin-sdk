// 引擎无关的公式渲染入口。当前后端为全局加载的 MathJax。
// MathJax 只作为本模块的私有实现细节出现，将来替换渲染引擎只需改这里，
// 调用方（骨架 inline-math 与 math 插件）无需改动。
//
// 脚本按需注入：以前 index.html 用 `<script async>` 在每次开窗时加载 2MB 的
// tex-svg.min.js，即使文档里没有任何公式也要付出下载 + 解析/求值成本。现在
// 只有真正渲染公式时才注入（单例 Promise，同一窗口只注入一次）。
const READY_MAX_WAIT_MS = 10_000;
const READY_POLL_MS = 100;
const MHCHEM_EXTENSION = "input/tex/extensions/mhchem";
const MATHJAX_SRC = "/mathjax/tex-svg.min.js";
let extensionsLoaded = false;
/** 脚本注入单例；失败/超时后清空，允许下次渲染重试。 */
let loadPromise = null;
function getMathJax() {
    return window.MathJax ?? null;
}
function existingMathJaxScript() {
    return document.querySelector('script[src*="/mathjax/tex-svg.min.js"]');
}
function waitForMathJax(maxWaitMs = READY_MAX_WAIT_MS) {
    return new Promise((resolve) => {
        if (getMathJax()) {
            resolve(true);
            return;
        }
        const startedAt = Date.now();
        const timer = setInterval(() => {
            if (getMathJax()) {
                clearInterval(timer);
                resolve(true);
                return;
            }
            if (Date.now() - startedAt > maxWaitMs) {
                clearInterval(timer);
                console.warn("Math renderer load timed out");
                resolve(false);
            }
        }, READY_POLL_MS);
    });
}
/** 按需注入 MathJax 脚本；已存在脚本（如浏览器/演示页）时只等待不重复注入。 */
function loadMathJax() {
    if (getMathJax())
        return Promise.resolve(true);
    if (loadPromise)
        return loadPromise;
    loadPromise = new Promise((resolve) => {
        const finish = (ok) => {
            if (!ok)
                loadPromise = null;
            resolve(ok);
        };
        if (!existingMathJaxScript()) {
            const script = document.createElement("script");
            script.src = MATHJAX_SRC;
            script.async = true;
            script.addEventListener("error", () => {
                console.warn("Math renderer script failed to load");
                finish(false);
            }, { once: true });
            document.head.appendChild(script);
        }
        void waitForMathJax().then(finish);
    });
    return loadPromise;
}
async function ensureExtensions() {
    if (extensionsLoaded)
        return;
    const mathJax = getMathJax();
    if (!mathJax?.loader)
        return;
    try {
        await mathJax.loader.load(MHCHEM_EXTENSION);
        extensionsLoaded = true;
    }
    catch (err) {
        console.warn("Failed to load math extensions:", err);
    }
}
function extractSvg(svgOutput) {
    const doc = new DOMParser().parseFromString(`<div>${svgOutput}</div>`, "text/html");
    return doc.querySelector("svg");
}
/**
 * 把 TeX 渲染为 SVG 字符串（纯函数，无缓存）。
 * 引擎不可用或未产出 SVG 时抛出。
 */
export async function renderFormulaToSVG(tex, options = {}) {
    const display = options.mode === "display";
    if (!(await loadMathJax())) {
        throw new Error("Math renderer not available");
    }
    await ensureExtensions();
    const mathJax = getMathJax();
    if (!mathJax)
        throw new Error("Math renderer not available");
    let svgOutput;
    if (mathJax.tex2svgPromise) {
        const element = await mathJax.tex2svgPromise(tex, { display });
        svgOutput = element.firstElementChild?.outerHTML || element.innerHTML;
    }
    else if (mathJax.tex2svg) {
        const element = mathJax.tex2svg(tex, { display });
        svgOutput = element.firstElementChild?.outerHTML || element.innerHTML;
    }
    else {
        const container = document.createElement(display ? "div" : "span");
        if (!display) {
            container.style.cssText =
                "display: inline-block; overflow: visible; vertical-align: middle;";
        }
        container.textContent = display ? `$$${tex}$$` : `$${tex}$`;
        document.body.appendChild(container);
        try {
            await mathJax.typesetPromise?.([container]);
            svgOutput = container.innerHTML;
        }
        finally {
            document.body.removeChild(container);
        }
    }
    const svg = extractSvg(svgOutput);
    if (!svg) {
        throw new Error("Math renderer produced no SVG output");
    }
    options.decorate?.(svg);
    return svg.outerHTML;
}
//# sourceMappingURL=math.js.map