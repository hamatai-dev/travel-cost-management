import { describe, expect, it } from "vitest";
import { resolveDateRangePreset } from "./dateRangePresets";

// new Date("YYYY-MM-DD") はUTCとして解釈されるため、実行環境のタイムゾーンに
// よっては前日にずれてしまう。テストでは常にローカル時刻のコンストラクタ
// (年, 月(0始まり), 日)を使い、実際の呼び出し方(new Date() = 現在時刻)に近い
// 形でローカル日付を明確に指定する。
describe("resolveDateRangePreset", () => {
  it("Given preset='all', When resolveDateRangePreset を呼ぶ, Then 絞り込みなし(from/toともにundefined)を返す", () => {
    // Given / When
    const result = resolveDateRangePreset("all", new Date(2026, 5, 15));

    // Then
    expect(result).toEqual({});
  });

  it("Given preset='this_month'で基準日が月の途中(2026-06-15), When resolveDateRangePreset を呼ぶ, Then その月の1日〜末日を返す", () => {
    // Given / When
    const result = resolveDateRangePreset("this_month", new Date(2026, 5, 15));

    // Then
    expect(result).toEqual({ from: "2026-06-01", to: "2026-06-30" });
  });

  it("Given preset='last_month'で基準日が2026-06-15, When resolveDateRangePreset を呼ぶ, Then 前月(5月)の1日〜末日を返す", () => {
    // Given / When
    const result = resolveDateRangePreset("last_month", new Date(2026, 5, 15));

    // Then
    expect(result).toEqual({ from: "2026-05-01", to: "2026-05-31" });
  });

  it("Given preset='last_month'で基準日が年始(2026-01-15), When resolveDateRangePreset を呼ぶ, Then 前年12月を返す(年またぎ)", () => {
    // Given / When
    const result = resolveDateRangePreset("last_month", new Date(2026, 0, 15));

    // Then
    expect(result).toEqual({ from: "2025-12-01", to: "2025-12-31" });
  });

  it("Given preset='this_month'で基準日が月初(2026-01-01), When resolveDateRangePreset を呼ぶ, Then その月の1日〜末日を返す", () => {
    // Given / When
    const result = resolveDateRangePreset("this_month", new Date(2026, 0, 1));

    // Then
    expect(result).toEqual({ from: "2026-01-01", to: "2026-01-31" });
  });

  it("Given preset='this_week'で基準日が週の途中(2026-06-17は水曜日), When resolveDateRangePreset を呼ぶ, Then 月曜始まりの週の範囲(月曜〜日曜)を返す", () => {
    // Given / When
    const result = resolveDateRangePreset("this_week", new Date(2026, 5, 17));

    // Then
    expect(result).toEqual({ from: "2026-06-15", to: "2026-06-21" });
  });

  it("Given preset='this_week'で基準日が週をまたいで月をまたぐ(2026-07-01は水曜日), When resolveDateRangePreset を呼ぶ, Then 月境界に関わらずその週(6/29月〜7/5日)を返す", () => {
    // Given / When
    const result = resolveDateRangePreset("this_week", new Date(2026, 6, 1));

    // Then
    expect(result).toEqual({ from: "2026-06-29", to: "2026-07-05" });
  });
});
