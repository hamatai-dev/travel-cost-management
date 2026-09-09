export interface PieChartInput {
  label: string;
  value: number;
}

export interface PieSlice {
  label: string;
  value: number;
  /** 全体に対する割合(0〜100) */
  percentage: number;
  /** 12時位置(0度)を起点に時計回りの角度(度) */
  startAngle: number;
  endAngle: number;
}

/**
 * 支出・収入などの内訳を円グラフのスライス(角度・割合)に変換する。
 * SVGの描画自体(角度→座標)はコンポーネント側の責務にして、ここでは
 * 「どれだけの角度・割合を占めるか」という計算だけを純粋関数として切り出す。
 * 合計が0(データなし)の場合はゼロ除算を避け、全スライスを0%として返す。
 */
export function computePieSlices(items: PieChartInput[]): PieSlice[] {
  const total = items.reduce((sum, item) => sum + item.value, 0);

  if (total <= 0) {
    return items.map((item) => ({
      label: item.label,
      value: item.value,
      percentage: 0,
      startAngle: 0,
      endAngle: 0,
    }));
  }

  let angle = 0;
  return items.map((item) => {
    const sweep = (item.value / total) * 360;
    const startAngle = angle;
    const endAngle = angle + sweep;
    angle = endAngle;

    return {
      label: item.label,
      value: item.value,
      percentage: (item.value / total) * 100,
      startAngle,
      endAngle,
    };
  });
}
