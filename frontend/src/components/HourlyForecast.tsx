import { useEffect, useState } from "react"

type HourData = {
  time: string
  temp_c: number
  condition: {
    text: string
    icon: string
  }
}

export default function HourlyForecast({ city }: { city: string }) {
  const [hourly, setHourly] = useState<HourData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!city || city.trim().length < 2) {
      setError("都市名が正しくありません。")
      setLoading(false)
      return
    }

    const fetchHourly = async () => {
  try {
    const res = await fetch(`/api/hourly?city=${encodeURIComponent(city)}`);
    const json = await res.json();

    if (!res.ok) {
      throw new Error(json?.error ?? `ステータスコード: ${res.status}`);
    }

    setHourly(json.hourly);
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("時間予報エラー:", err.message);
      setError(err.message);
    } else {
      console.error("未知のエラー:", err);
      setError("時間ごとの予報を取得できませんでした。");
    }
  } finally {
    setLoading(false); // ✅ 確実に off にする
  }
};
    fetchHourly()
  }, [city])

  if (!city) return null

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-2">{city} の時間別予報</h3>
      {loading && <p className="text-gray-500">読み込み中...</p>}
      {error && <p className="text-red-500">{error}</p>}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
        {hourly.map((hour) => (
          <div key={hour.time} className="bg-white rounded shadow p-2 text-center">
            <p className="text-sm">{new Date(hour.time).getHours()}時</p>
            <img
              src={`https:${hour.condition.icon}`}
              alt={hour.condition.text}
              className="w-10 h-10 mx-auto"
            />
            <p className="text-xs text-gray-500">{hour.condition.text}</p>
            <p className="font-bold text-blue-600">{Math.round(hour.temp_c)}℃</p>
          </div>
        ))}
      </div>
    </div>
  )
}