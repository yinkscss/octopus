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

  const upcomingTasks = useMemo(
    () => currentPlan?.tasks.filter((task) => task.day !== today) ?? [],
    [currentPlan, today]
  );

  const hasTodayTasks = todaysTasks.length > 0;
  const visibleTasks = hasTodayTasks ? todaysTasks : upcomingTasks;
  const headingLabel = hasTodayTasks ? "today" : "upcoming";

  return (
    <div className="screen">
      <div className="section">
        <p className="label">{headingLabel}</p>
        <h2 className="heading">{hasTodayTasks ? today : "next tasks"}</h2>
      </div>

      {isFallbackPlan && (
        <p className="status warning">Showing shifted plan because LLM fallback was used.</p>
      )}

      {isLoading && <p className="status">Loading plan...</p>}
      {lastError && <p className="error">{lastError}</p>}

      {!isLoading && visibleTasks.length === 0 && (
        <p className="status">No tasks scheduled yet. Build a weekly plan first.</p>
      )}

      {!isLoading && !hasTodayTasks && upcomingTasks.length > 0 && (
        <p className="status">No tasks for today. Showing upcoming tasks.</p>
      )}

      {visibleTasks.map((task) => (
        <div className="task-card" key={`${task.id ?? "tmp"}-${task.day}-${task.time_block}`}>
          <div className="task-row">
            <span className="task-time">{task.time_block}</span>
            <span className={`task-status ${task.status === "done" ? "done" : "pending"}`}>
              {task.status === "done" ? "Done" : "Pending"}
            </span>
          </div>
          <p className="task-note">{task.day}</p>
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
