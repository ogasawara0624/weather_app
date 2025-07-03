import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"
import axios from "axios"

interface WeatherData {
  location: {
    name: string
    country: string
  }
  current: {
    temp_c: number
    feelslike_c: number
    humidity: number
    pressure_mb: number
    condition: {
      text: string
      icon: string
    }
  }
}

interface WeatherState {
  loading: boolean
  data: WeatherData | null
  error: string | null
}

const initialState: WeatherState = {
  loading: false,
  data: null,
  error: null,
}

export const fetchWeather = createAsyncThunk(
  "weather/fetchWeather",
  async (city: string) => {
    const response = await axios.get(`/api/weather?city=${city}`)
    return response.data
  }
)

const weatherSlice = createSlice({
  name: "weather",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchWeather.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchWeather.fulfilled, (state, action) => {
        state.loading = false
        state.data = action.payload
      })
      .addCase(fetchWeather.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || "Failed to fetch weather"
      })
  },
})

export default weatherSlice.reducer