import assert from "node:assert/strict";
import test from "node:test";
import { parseCaaResultText } from "../src/caa.mjs";

test("parses the four fields displayed by the CAA video example", () => {
  assert.deepEqual(parseCaaResultText(`
    查詢結果 機場名稱： 松山機場 高程基準(*註1)： 海拔3.82公尺
    坐落位置： 進場面 限建高度： 海拔42.14公尺
  `), { airport: "松山機場", elevationBaselineM: 3.82, location: "進場面", heightLimitM: 42.14 });
});
