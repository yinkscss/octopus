import { useMemo } from "react";
import { getTodayName, useWeekStore } from "../store/week";

export default function Dashboard() {
  const { currentPlan, markTaskComplete, isFallbackPlan, isLoading, lastError } = useWeekStore();

  const today = getTodayName();

  const todaysTasks = useMemo(
    () =>
      currentPlan?.tasks
        .filter((task) => task.day === today) ?? [],
    [currentPlan, today]
  );

  return (
    <div className="screen">
      <div className="section">
        <p className="label">Today</p>
        <h2 className="heading">{today}</h2>
      </div>

      {isFallbackPlan && (
        <p className="status warning">Showing shifted plan because LLM fallback was used.</p>
      )}

      {isLoading && <p className="status">Loading plan...</p>}
      {lastError && <p className="error">{lastError}</p>}

      {!isLoading && todaysTasks.length === 0 && (
        <p className="status">No tasks scheduled for today yet.</p>
      )}

      {todaysTasks.map((task) => (
        <div className="task-card" key={`${task.id ?? "tmp"}-${task.day}-${task.time_block}`}>
          <div className="task-row">
            <span className="task-time">{task.time_block}</span>
            <span className={`task-status ${task.status === "done" ? "done" : "pending"}`}>
              {task.status === "done" ? "Done" : "Pending"}
            </span>
          </div>
          <p className="task-title">{task.title}</p>
          <p className="task-note">{task.implementation_intention}</p>
          <p className="task-note">Start: {task.two_minute_start}</p>
          <button
            className="button secondary"
            onClick={() => task.id && void markTaskComplete(task.id)}
            disabled={task.status === "done" || !task.id}
          >
            {task.status === "done" ? "Completed" : "Mark Complete"}
          </button>
        </div>
      ))}
    </div>
  );
}
