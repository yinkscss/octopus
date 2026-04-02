import { useState } from "react";
import Settings from "./components/Settings";
import TestScreen from "./components/TestScreen";
import "./App.css";

type Tab = "test" | "settings";

function App() {
  const [activeTab, setActiveTab] = useState<Tab>("test");

  return (
    <div className="app">
      <div className="tabs">
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

      {activeTab === "test" ? <TestScreen /> : <Settings />}
    </div>
  );
}

export default App;
