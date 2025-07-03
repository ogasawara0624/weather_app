import { useEffect, useState } from "react"
import { useSearchParams, Link } from "react-router-dom"

type ForecastDay = {
  date: string
  day: {
    maxtemp_c: number
    mintemp_c: number
    condition: {
      text: string
      icon: string
    }
  }
}

export default function WeeklyForecast() {
  const [forecast, setForecast] = useState<ForecastDay[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchParams] = useSearchParams()
  const city = searchParams.get("city")

  useEffect(() => {
    if (!city) {
      setError("都市名が指定されていません。")
      setLoading(false)
      return
    }

    const fetchWeekly = async () => {
      try {
        const res = await fetch(`/api/weekly?city=${encodeURIComponent(city)}`)
        if (!res.ok) throw new Error(`ステータスコード: ${res.status}`)
        const data = await res.json()
        console.log("📦 API レスポンス:", data)

        if (!data.forecast?.forecastday || !Array.isArray(data.forecast.forecastday)) {
  throw new Error("予報データが見つかりませんでした（forecastday が存在しない）")
}

setForecast(data.forecast.forecastday)
            } catch (err: unknown) {
        if (err instanceof Error) {
          console.error("週間予報取得エラー:", err.message);
        } else {
          console.error("未知のエラー:", err);
        }
        setError("週間予報を取得できませんでした。");
      } finally {
        setLoading(false)
      }
    }

    fetchWeekly()
  }, [city])

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h2 className="text-2xl font-bold mb-4 text-blue-700">
        {city ?? "都市不明"} の週間天気予報
      </h2>

      <Link to="/" className="text-blue-500 underline block mb-4">← トップに戻る</Link>

      {loading && <p className="text-gray-600">読み込み中...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && !error && forecast.length === 0 && (
        <p className="text-gray-500">予報データが見つかりませんでした。</p>
      )}

      <div className="flex flex-col gap-4">
        {forecast.map((day, index) => (
          <div key={index} className="bg-blue-100 p-4 rounded shadow">
            <p className="font-semibold">
              {new Date(day.date).toLocaleDateString("ja-JP", {
                weekday: "long",
                month: "numeric",
                day: "numeric",
              })}
            </p>
                <p>{day.day.condition.text}</p>
                <div className="flex justify-center items-center my-2">
<img
  src={`https:${day.day.condition.icon}`}
  alt={day.day.condition.text}
  className={`w-16 h-16 ${
    day.day.condition.text.includes("雨")
      ? "animate-ping"
      : day.day.condition.text.includes("晴")
      ? "animate-bounce"
      : day.day.condition.text.includes("雪")
      ? "animate-spin"
      : "animate-pulse"
  }`}
/>
</div>

            
            <p>
              最高: {Math.round(day.day.maxtemp_c)}℃ / 最低: {Math.round(day.day.mintemp_c)}℃
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}