/**
 * 背景色(#rgbまたは#rrggbb)に対して読みやすい文字色("#000000"か"#ffffff")を返す。
 * 輝度が0.5を超えるかどうかだけで黒/白を決めると、黄色や黄緑のような明るい
 * 中間色で白文字を選んでしまいコントラスト不足になる(WCAG比で2前後しか出ない)。
 * 背景輝度に対して黒・白それぞれとのWCAGコントラスト比を計算し、比率が高い方を
 * 採用することで、どの背景色でも実際に読みやすい方を選ぶ。不正な形式の場合は
 * 黒文字を返す。
 */
export function contrastTextColor(backgroundColor: string): string {
  const rgb = parseHexColor(backgroundColor);
  if (!rgb) return "#000000";

  const luminance = relativeLuminance(rgb);
  const contrastWithBlack = contrastRatio(luminance, 0);
  const contrastWithWhite = contrastRatio(luminance, 1);
  return contrastWithBlack >= contrastWithWhite ? "#000000" : "#ffffff";
}

function contrastRatio(luminanceA: number, luminanceB: number): number {
  const lighter = Math.max(luminanceA, luminanceB);
  const darker = Math.min(luminanceA, luminanceB);
  return (lighter + 0.05) / (darker + 0.05);
}

function parseHexColor(hex: string): [number, number, number] | null {
  const match = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return null;

  const value = match[1];
  if (value.length === 3) {
    const [r, g, b] = value.split("");
    return [
      Number.parseInt(r + r, 16),
      Number.parseInt(g + g, 16),
      Number.parseInt(b + b, 16),
    ];
  }

  return [
    Number.parseInt(value.slice(0, 2), 16),
    Number.parseInt(value.slice(2, 4), 16),
    Number.parseInt(value.slice(4, 6), 16),
  ];
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const [rl, gl, bl] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
}
