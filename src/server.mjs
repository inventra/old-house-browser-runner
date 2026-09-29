import express from "express";
import { queryCaaHeight } from "./caa.mjs";

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "8kb" }));

let active = 0;
app.get("/health", (_request, response) => response.json({ ok: true, active }));
app.post("/caa/query", async (request, response) => {
  const xTwd97 = Number(request.body?.xTwd97);
  const yTwd97 = Number(request.body?.yTwd97);
  if (!Number.isFinite(xTwd97) || !Number.isFinite(yTwd97) || xTwd97 < 100000 || xTwd97 > 400000 || yTwd97 < 2400000 || yTwd97 > 2900000) {
    return response.status(400).json({ success: false, error: "TWD97 坐標超出台灣有效範圍" });
  }
  if (active >= 2) return response.status(429).json({ success: false, error: "瀏覽器查詢忙碌中，請稍後重試" });
  active += 1;
  try {
    const data = await queryCaaHeight({ xTwd97, yTwd97 });
    return response.json({ success: true, data });
  } catch (error) {
    return response.status(502).json({ success: false, error: error instanceof Error ? error.message : "民航局查詢失敗" });
  } finally {
    active -= 1;
  }
});

const port = Number(process.env.PORT ?? 8080);
app.listen(port, "0.0.0.0", () => console.log(`browser runner listening on ${port}`));
