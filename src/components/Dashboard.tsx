import { useMemo } from "react";
import { getTodayName, useWeekStore } from "../store/week";

export default function Dashboard() {
  const {
    currentPlan,
    markTaskComplete,
    acknowledgeAlarm,
    snoozeAlarmOnce,
    isFallbackPlan,
    isLoading,
    lastError,
    alarmSync,
  } = useWeekStore();

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

  const todaysAlarms = useMemo(
    () => currentPlan?.alarms.filter((alarm) => alarm.day === today) ?? [],
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
      {alarmSync && (
        <p className="status">
          Alarm sync: {alarmSync.scheduledCount} scheduled, {alarmSync.failedCount} failed, last sync {alarmSync.lastSyncAt}.
        </p>
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

      {!isLoading && todaysAlarms.length > 0 && (
        <div className="section" style={{ marginTop: 12 }}>
          <p className="label">alarms</p>
          {todaysAlarms.map((alarm) => (
            <div className="task-card" key={`${alarm.id ?? "tmp"}-${alarm.day}-${alarm.time}`}>
              <div className="task-row">
                <span className="task-time">{alarm.time}</span>
                <span className="task-status pending">Tier {alarm.tier ?? 1}</span>
              </div>
              <p className="task-note">{alarm.label}</p>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  className="button secondary"
                  onClick={() => alarm.id && void acknowledgeAlarm(alarm.id)}
                  disabled={!alarm.id}
                >
                  I'M ON IT
                </button>
                <button
                  className="button secondary"
                  onClick={() => alarm.id && void snoozeAlarmOnce(alarm.id)}
                  disabled={!alarm.id}
                >
                  SNOOZE ONCE
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
