import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const app = express();
app.use(cors());

const apiKey = process.env.WEATHER_API_KEY;
const GEOCODE_API_KEY = process.env.GEOCODE_API_KEY;

if (!apiKey) {
  throw new Error("❌ WEATHER_API_KEY が設定されていません！");
}

// ✅ 現在の天気：/api/current
app.get("/api/current", async (req: Request, res: Response) => {
  const city = (req.query.city as string)?.trim();
  if (!city) res.status(400).json({ error: "都市名が指定されていません。" });

  try {
    // ① OpenCage で緯度経度取得
    const geoRes = await fetch(
      `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(city)}&key=${GEOCODE_API_KEY}&language=ja`
    );
    const geoData = await geoRes.json() as {
  results: { geometry: { lat: number; lng: number } }[];
};
    if (!geoData.results?.length) throw new Error("地名が見つかりませんでした。");

    const { lat, lng } = geoData.results[0].geometry;

    // ② WeatherAPI で天気取得
    const weatherRes = await fetch(
      `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${lat},${lng}&lang=ja`
    );
    if (!weatherRes.ok) throw new Error("天気APIエラー");

    const weatherData = await weatherRes.json();
    res.json(weatherData);
  } catch (err) {
    console.error("天気取得エラー:", err);
    res.status(500).json({ error: "天気情報の取得に失敗しました。" });
  }
});

// ✅ 週間予報：/api/weekly
app.get("/api/weekly", async (req: Request, res: Response) => {
  const city = (req.query.city as string)?.trim();
  if (!city) res.status(400).json({ error: "都市名が指定されていません。" });

  // タイムアウト設定（AbortController）
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000); // 10秒

  try {
    // ① OpenCage Geocoder で緯度経度取得
    const geoUrl = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(city)}&key=${GEOCODE_API_KEY}&language=ja`;
    const geoRes = await fetch(geoUrl, { signal: controller.signal });
    clearTimeout(timeout);

    if (!geoRes.ok) {
  const errText = await geoRes.text();
  console.error("地名変換エラー:", errText);
  res.status(geoRes.status).json({ error: "地名の取得に失敗しました。" });
  return; // ✅ これで関数の実行を止めるだけ（戻り値は返さない）
}
    const geoData = await geoRes.json() as {
      results: { geometry: { lat: number; lng: number } }[];
    };

    if (!geoData.results.length) throw new Error("場所が見つかりませんでした");

    const { lat, lng } = geoData.results[0].geometry;

    // ② WeatherAPI で週間予報取得（再度タイムアウト設定）
    const forecastController = new AbortController();
    const forecastTimeout = setTimeout(() => forecastController.abort(), 10000);

    const forecastUrl = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${lat},${lng}&days=7&lang=ja`;
    const weatherRes = await fetch(forecastUrl, { signal: forecastController.signal });
    clearTimeout(forecastTimeout);

    if (!weatherRes.ok) {
      const errText = await weatherRes.text();
      console.error("週間予報エラー:", errText);
      res.status(weatherRes.status).json({ error: "週間予報の取得に失敗しました。" });
    }

    const forecastData = await weatherRes.json();
    res.json(forecastData);
  } catch (err: any) {
    clearTimeout(timeout);
    console.error("❌ エラー:", err);

    if (err.name === "AbortError") {
      res.status(504).json({ error: "接続がタイムアウトしました。" });
    }

    res.status(500).json({ error: "週間予報取得中にエラーが発生しました。" });
  }
});

// ✅ 時間別予報：/api/hourly
app.get("/api/hourly", async (req: Request, res: Response) => {
  const city = (req.query.city as string)?.trim();
  if (!city) res.status(400).json({ error: "都市名が指定されていません。" });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000); // 10秒

  try {
    // OpenCageで緯度経度取得
    const geoRes = await fetch(
      `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(city)}&key=${GEOCODE_API_KEY}&language=ja`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);

    if (!geoRes.ok) {
      const errText = await geoRes.text();
      console.error("地名取得失敗:", errText);
      res.status(geoRes.status).json({ error: "地名の取得に失敗しました。" });
    }

    const geoData = await geoRes.json() as {
  results: { geometry: { lat: number; lng: number } }[];
};
    const { lat, lng } = geoData.results?.[0]?.geometry ?? {};
    if (!lat || !lng) throw new Error("緯度経度が見つかりませんでした");

    // WeatherAPIから24時間の予報を取得（days=1）
    const weatherRes = await fetch(
      `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${lat},${lng}&days=1&lang=ja`
    );
    if (!weatherRes.ok) throw new Error("天気APIエラー");

    const weatherData = await weatherRes.json() as {
  forecast: { forecastday: any[] };
  location: { name: string };
};
    const hourly = weatherData.forecast?.forecastday?.[0]?.hour;
    if (!Array.isArray(hourly)) throw new Error("時間別データが見つかりませんでした");

    res.json({ location: weatherData.location, hourly });
  } catch (err) {
    clearTimeout(timeout);
    console.error("⏳ 時間予報取得エラー:", err);
    res.status(500).json({ error: "時間別予報の取得に失敗しました。" });
  }
});

app.listen(3001, () => {
  console.log("✅ Server running at http://localhost:3001");
});