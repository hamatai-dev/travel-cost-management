/**
 * 背景色(#rgbまたは#rrggbb)に対して読みやすい文字色("#000000"か"#ffffff")を返す。
 * WCAGの相対輝度計算をもとに、輝度が高い(明るい)背景には黒文字、低い(暗い)
 * 背景には白文字を選ぶ。不正な形式の場合は黒文字を返す。
 */
export function contrastTextColor(backgroundColor: string): string {
  const rgb = parseHexColor(backgroundColor);
  if (!rgb) return "#000000";

  const luminance = relativeLuminance(rgb);
  return luminance > 0.5 ? "#000000" : "#ffffff";
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
