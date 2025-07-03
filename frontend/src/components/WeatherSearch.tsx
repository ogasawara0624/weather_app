import { useState } from "react";
import { Link } from "react-router-dom";
import HourlyForecast from "./HourlyForecast"

type CurrentWeather = {
  location: {
    name: string;
    country: string;
  };
  current: {
    temp_c: number;
    feelslike_c: number;
    humidity: number;
    pressure_mb: number;
    condition: {
      text: string;
      icon: string;
    };
  };
};
const key = import.meta.env.VITE_OPENCAGE_API_KEY;

export default function WeatherSearch() {
  const [city, setCity] = useState("");
  const [jpCity, setJpCity] = useState<string | null>(null); //日本語地名
  const [data, setData] = useState<CurrentWeather | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = async () => {
    if (!city.trim()) return;

    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/current?city=${encodeURIComponent(city)}`);
      if (!res.ok) throw new Error(`ステータス: ${res.status}`);
      const json = await res.json();
      setData(json);
      setJpCity(null); //手動入力時は日本語地名クリア
    } catch (err) {
      console.error("天気取得エラー:", err);
      setError("天気データを取得できませんでした。");
    } finally {
      setLoading(false);
    }
  };

  const getJapaneseCityName = async (lat: number, lon: number): Promise<string | null> => {
    const res = await fetch(
      `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lon}&key=${key}&language=ja`
    );
    const data = await res.json() as {
      results: {
        components?: {
          city?: string;
          town?: string;
          village?: string;
          state?: string;
        };
      }[];
    };
    const c = data.results?.[0]?.components;
    return c?.city ?? c?.town ?? c?.village ?? c?.state ?? null;
  };

  const getCurrentLocationWeather = () => {
    if (!navigator.geolocation) {
      setError("このブラウザでは位置情報が利用できません。");
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          const [res, jpName] = await Promise.all([
            fetch(`/api/current?city=${latitude},${longitude}`),
            getJapaneseCityName(latitude, longitude)
          ]);

          if (!res.ok) throw new Error(`ステータス: ${res.status}`);
          const json = await res.json();
          setData(json);
          setCity(jpName ?? json.location.name); //入力欄
          setJpCity(jpName); //表示用日本語地名
        } catch (err) {
          console.error("現在地の天気取得エラー:", err);
          setError("現在地の天気を取得できませんでした。");
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        console.error("位置情報取得エラー:", err);
        setError("位置情報の取得に失敗しました。");
        setLoading(false);
      }
    );
  };

  const displayCity = jpCity ?? city ?? "都市不明"; //表示用都市名

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-sky-200 to-blue-400 p-4">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h1 className="text-2xl font-bold text-center mb-4 text-blue-700">天気検索</h1>

        <div className="flex flex-col gap-2 mt-4">
          <div className="flex gap-2">
            <input
  type="text"
  placeholder="都市名（例：札幌）"
  value={city}
  onChange={(e) => setCity(e.target.value)}
  onKeyDown={(e) => {
    if (e.key === "Enter") {
      fetchWeather()
    }
  }}
  className="flex-grow px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
/>
            <button
              onClick={fetchWeather}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
            >
              検索
            </button>
          </div>
          <button
            onClick={getCurrentLocationWeather}
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            現在地から取得
          </button>
        </div>

        {loading && <p className="mt-4 text-sm text-gray-500">読み込み中...</p>}
        {error && <p className="mt-4 text-sm text-red-500">エラー：{error}</p>}

        {data && (
          <div className="mt-6 text-center">
            <h2 className="text-xl font-semibold text-gray-800">
              {displayCity}（{data.location.country}）の天気
            </h2>
            <p className="text-gray-600">{data.current.condition.text}</p>
            <div className="flex justify-center items-center my-2">
              <img
                src={`https:${data.current.condition.icon}`}
                alt={data.current.condition.text}
                className="w-16 h-16"
              />
            </div>
            <p className="text-4xl font-bold text-blue-700">
              {Math.round(data.current.temp_c)}℃
            </p>
            <p className="text-sm text-gray-500 mt-1">体感 {Math.round(data.current.feelslike_c)}℃</p>
            <p className="text-sm text-gray-500">
              湿度: {data.current.humidity}% / 気圧: {data.current.pressure_mb}hPa
            </p>
          </div>
        )}
        {data && (
  <>
    <div className="mt-6 text-center">
    </div>
    <HourlyForecast city={jpCity ?? city} />
  </>
)}

        {data && (
          <Link
            to={`/weekly?city=${encodeURIComponent(displayCity)}`}
            className="mt-6 inline-block text-xl text-blue-600 underline"
          >
            ▶︎ 週間予報を見る
          </Link>
        )}
      </div>
    </div>
  );
}