import { computePieSlices } from "@/lib/analytics/pieChartSlices";

export interface PieChartDatum {
  label: string;
  value: number;
  /** Tailwindのfillユーティリティクラス(例: "fill-red-500") */
  colorClass: string;
}

const SIZE = 160;
const CENTER = SIZE / 2;
const RADIUS = SIZE / 2;

function polarToCartesian(angleDeg: number): { x: number; y: number } {
  // 12時位置(角度0)を起点に時計回りにするため、SVG座標系の0度(3時位置)から-90度回転させる
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: CENTER + RADIUS * Math.cos(angleRad),
    y: CENTER + RADIUS * Math.sin(angleRad),
  };
}

function describeSlicePath(startAngle: number, endAngle: number): string {
  // 100%(1項目のみ)の場合、始点と終点が一致してパスが描けなくなるため、
  // ごくわずかに欠けさせて円として成立させる
  const sweep = endAngle - startAngle >= 360 ? 359.99 : endAngle - startAngle;
  const start = polarToCartesian(startAngle);
  const end = polarToCartesian(startAngle + sweep);
  const largeArcFlag = sweep > 180 ? 1 : 0;

  return `M ${CENTER} ${CENTER} L ${start.x} ${start.y} A ${RADIUS} ${RADIUS} 0 ${largeArcFlag} 1 ${end.x} ${end.y} Z`;
}

/**
 * 支出/収入などの内訳を表示する、依存ライブラリなしの円グラフ。
 * 値が全て0(データなし)の場合は空の円だけを描く。
 */
export function PieChart({ data }: { data: PieChartDatum[] }) {
  const hasData = data.some((d) => d.value > 0);
  const slices = computePieSlices(data.map((d) => ({ label: d.label, value: d.value })));

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      width={SIZE}
      height={SIZE}
      role="img"
      aria-label="支出と収入の内訳円グラフ"
    >
      {hasData ? (
        slices.map((slice, i) => (
          <path
            key={data[i].label}
            d={describeSlicePath(slice.startAngle, slice.endAngle)}
            className={data[i].colorClass}
          />
        ))
      ) : (
        <circle cx={CENTER} cy={CENTER} r={RADIUS} className="fill-muted" />
      )}
    </svg>
  );
}
