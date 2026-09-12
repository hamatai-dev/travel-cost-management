"use client";

import { useState } from "react";
import { computePieSlices } from "@/lib/analytics/pieChartSlices";
import { cn } from "@/lib/utils";

export interface PieChartDatum {
  label: string;
  value: number;
  /** Tailwindのfillユーティリティクラス(例: "fill-red-500") */
  colorClass: string;
}

const SIZE = 160;
const CENTER = SIZE / 2;
const RADIUS = SIZE / 2;
// 選択中のラベルを読みやすくするための、中央に敷く背景円の半径
const LABEL_BACKDROP_RADIUS = RADIUS * 0.6;

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
 * カーソルを乗せる(PC)・タップする(スマホ)と、その項目の詳細(金額・割合)を
 * 中央に表示する。同じ項目を再度タップすると解除できる。
 */
export function PieChart({ data }: { data: PieChartDatum[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const hasData = data.some((d) => d.value > 0);
  const slices = computePieSlices(data.map((d) => ({ label: d.label, value: d.value })));
  const total = data.reduce((sum, d) => sum + d.value, 0);

  const active = activeIndex != null ? data[activeIndex] : null;
  const activePercent =
    active && total > 0 ? Math.round((active.value / total) * 100) : null;

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      width={SIZE}
      height={SIZE}
      role="img"
      aria-label="内訳の円グラフ(項目にカーソルを合わせるかタップすると詳細を表示)"
    >
      {hasData ? (
        slices.map((slice, i) => (
          <path
            key={data[i].label}
            d={describeSlicePath(slice.startAngle, slice.endAngle)}
            className={cn(
              data[i].colorClass,
              "cursor-pointer transition-opacity",
              activeIndex != null && activeIndex !== i && "opacity-40",
            )}
            onMouseEnter={() => setActiveIndex(i)}
            onMouseLeave={() => setActiveIndex(null)}
            onClick={() => setActiveIndex((prev) => (prev === i ? null : i))}
          >
            <title>
              {data[i].label}: ¥{data[i].value.toLocaleString()}
              {total > 0 ? `(${Math.round((data[i].value / total) * 100)}%)` : ""}
            </title>
          </path>
        ))
      ) : (
        <circle cx={CENTER} cy={CENTER} r={RADIUS} className="fill-muted" />
      )}

      {active && (
        <g className="pointer-events-none">
          <circle
            cx={CENTER}
            cy={CENTER}
            r={LABEL_BACKDROP_RADIUS}
            className="fill-background opacity-90"
          />
          <text
            x={CENTER}
            y={CENTER - 4}
            textAnchor="middle"
            className="fill-foreground text-[13px] font-medium"
          >
            {active.label}
          </text>
          <text
            x={CENTER}
            y={CENTER + 14}
            textAnchor="middle"
            className="fill-muted-foreground text-[11px]"
          >
            ¥{active.value.toLocaleString()}
            {activePercent != null ? `(${activePercent}%)` : ""}
          </text>
        </g>
      )}
    </svg>
  );
}
