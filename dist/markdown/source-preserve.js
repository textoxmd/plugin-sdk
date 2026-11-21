// Shared source-preservation primitives. Extracted from the editor's
// `source-preserve.ts` so plugins and the core editor can reuse the same
// line-offset / EOL / sequence-alignment helpers without depending on the
// editor package.
export function lineStarts(text) {
    const starts = [0];
    for (let i = 0; i < text.length; i++) {
        if (text[i] === "\n")
            starts.push(i + 1);
    }
    return starts;
}
function lcsAnchors(a, b) {
    const m = a.length;
    const n = b.length;
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    for (let i = m - 1; i >= 0; i--) {
        for (let j = n - 1; j >= 0; j--) {
            dp[i][j] =
                a[i] === b[j]
                    ? dp[i + 1][j + 1] + 1
                    : Math.max(dp[i + 1][j], dp[i][j + 1]);
        }
    }
    const anchors = [];
    let i = 0;
    let j = 0;
    while (i < m && j < n) {
        if (a[i] === b[j]) {
            anchors.push([i, j]);
            i++;
            j++;
        }
        else if (dp[i + 1][j] >= dp[i][j + 1]) {
            i++;
        }
        else {
            j++;
        }
    }
    return anchors;
}
/**
 * 块级对齐。小文档用 LCS；大文档退化为前缀/后缀两端扫描，避免 O(n·m)。
 */
export function alignUnits(a, b) {
    if (a.length * b.length <= 50_000)
        return lcsAnchors(a, b);
    const anchors = [];
    let i = 0;
    while (i < Math.min(a.length, b.length) && a[i] === b[i]) {
        anchors.push([i, i]);
        i++;
    }
    const suffix = [];
    let x = a.length - 1;
    let y = b.length - 1;
    while (x >= i && y >= i && a[x] === b[y]) {
        suffix.push([x, y]);
        x--;
        y--;
    }
    suffix.reverse();
    anchors.push(...suffix);
    return anchors;
}
export function eolOf(src) {
    return src.includes("\r\n") ? "\r\n" : "\n";
}
export function toEol(text, eol) {
    if (eol === "\n")
        return text;
    // 幂等：已经带 \r 的换行不再重复转换（如列表项拼接结果本身已是 CRLF）。
    return text.replace(/(?<!\r)\n/g, eol);
}
export function ensureEol(text, eol) {
    const converted = toEol(text, eol);
    return converted.endsWith(eol) ? converted : converted + eol;
}
export function endsWithEol(text, eol) {
    return text.endsWith(eol);
}
//# sourceMappingURL=source-preserve.js.map