import { useEffect, useState } from "react";
import Dashboard from "./components/Dashboard";
import Settings from "./components/Settings";
import TestScreen from "./components/TestScreen";
import WeeklyIntent from "./components/WeeklyIntent";
import { useWeekStore } from "./store/week";
import "./App.css";

type Tab = "weekly-intent" | "dashboard" | "test" | "settings";

function App() {
  const [activeTab, setActiveTab] = useState<Tab>("weekly-intent");
  const { loadWeekPlan } = useWeekStore();

  useEffect(() => {
    void loadWeekPlan();
  }, [loadWeekPlan]);

  return (
    <div className="app">
      <div className="tabs">
        <button
          className={`tab ${activeTab === "weekly-intent" ? "active" : ""}`}
          onClick={() => setActiveTab("weekly-intent")}
        >
          Weekly Intent
        </button>
        <button
          className={`tab ${activeTab === "dashboard" ? "active" : ""}`}
          onClick={() => setActiveTab("dashboard")}
        >
          Dashboard
        </button>
        <button
          className={`tab ${activeTab === "test" ? "active" : ""}`}
          onClick={() => setActiveTab("test")}
        >
          Test
        </button>
        <button
          className={`tab ${activeTab === "settings" ? "active" : ""}`}
          onClick={() => setActiveTab("settings")}
        >
          Settings
        </button>
      </div>

      {activeTab === "weekly-intent" && <WeeklyIntent />}
      {activeTab === "dashboard" && <Dashboard />}
      {activeTab === "test" && <TestScreen />}
      {activeTab === "settings" && <Settings />}
    </div>
  );
}

export default App;
