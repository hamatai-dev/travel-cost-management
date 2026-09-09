import { describe, expect, it } from "vitest";
import { computeRange } from "./pagination";

describe("computeRange", () => {
  it("Given page=1, pageSize=20, When computeRange を呼ぶ, Then {from:0, to:19}を返す", () => {
    expect(computeRange(1, 20)).toEqual({ from: 0, to: 19 });
  });

  it("Given page=3, pageSize=20, When computeRange を呼ぶ, Then {from:40, to:59}を返す", () => {
    expect(computeRange(3, 20)).toEqual({ from: 40, to: 59 });
  });

  it("Given page=0や負の数のような不正値, When computeRange を呼ぶ, Then 1ページ目として扱う", () => {
    expect(computeRange(0, 20)).toEqual({ from: 0, to: 19 });
    expect(computeRange(-5, 20)).toEqual({ from: 0, to: 19 });
  });
});
