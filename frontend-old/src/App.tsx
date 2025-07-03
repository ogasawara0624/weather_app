import React from "react";
import {BrowserRouter as Router, Routes, Route} from "react-router-dom";
import WeatherSearch from "../../frontend/src/components/WeatherSearch";
import WeeklyForecast from "../../frontend/src/components/WeeklyForecast";

import "./App.css";

function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/" element={<WeatherSearch />} />
          <Route path="/weekly" element={<WeeklyForecast />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
