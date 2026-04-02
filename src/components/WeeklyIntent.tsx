import { useState } from "react";
import { useWeekStore } from "../store/week";

interface WeeklyIntentProps {
  onPlanBuilt?: () => void;
}

export default function WeeklyIntent({ onPlanBuilt }: WeeklyIntentProps) {
  const { submitWeeklyIntent, isLoading, lastError, isFallbackPlan } = useWeekStore();
  const [rawGoals, setRawGoals] = useState("");
  const [identityStatement, setIdentityStatement] = useState("");

  const handleBuild = async () => {
    const built = await submitWeeklyIntent(rawGoals, identityStatement);
    if (built) {
      onPlanBuilt?.();
    }
  };

  return (
    <div className="screen">
      <div className="section">
        <label className="label" htmlFor="weekly-goals">
          Weekly Goals
        </label>
        <textarea
          id="weekly-goals"
          className="textarea"
          value={rawGoals}
          onChange={(event) => setRawGoals(event.target.value)}
          placeholder="Write your goals for this week in plain language"
        />
      </div>

      <div className="section">
        <label className="label" htmlFor="identity-statement">
          Identity Statement
        </label>
        <input
          id="identity-statement"
          className="input"
          value={identityStatement}
          onChange={(event) => setIdentityStatement(event.target.value)}
          placeholder="I am someone who..."
        />
      </div>

      <button
        className="button"
        onClick={() => void handleBuild()}
        disabled={isLoading}
      >
        {isLoading ? "Building plan..." : "Build 7-Day Plan"}
      </button>

      {isFallbackPlan && (
        <p className="status warning">
          Planner fallback active: shifted previous week plan loaded.
        </p>
      )}
      {lastError && <p className="error">{lastError}</p>}
    </div>
  );
}
