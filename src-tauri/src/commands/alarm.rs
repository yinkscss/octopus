use crate::alarm_engine::{
    AlarmActionReport, AlarmDaemonStatus, AlarmEngine, AlarmScheduleReport, AlarmTimelineItem,
};
use crate::launch_agent;
use tauri::State;

#[tauri::command]
pub async fn schedule_week_alarms(
    engine: State<'_, AlarmEngine>,
    week_start: String,
) -> Result<AlarmScheduleReport, String> {
    engine.schedule_week_alarms(&week_start).await
}

#[tauri::command]
pub async fn reschedule_pending_alarms(
    engine: State<'_, AlarmEngine>,
) -> Result<AlarmScheduleReport, String> {
    engine.reschedule_pending_alarms().await
}

#[tauri::command]
pub async fn acknowledge_alarm(
    engine: State<'_, AlarmEngine>,
    alarm_id: i64,
) -> Result<AlarmActionReport, String> {
    engine.acknowledge_alarm(alarm_id).await
}

#[tauri::command]
pub async fn snooze_alarm_once(
    engine: State<'_, AlarmEngine>,
    alarm_id: i64,
) -> Result<AlarmActionReport, String> {
    engine.snooze_alarm_once(alarm_id).await
}

#[tauri::command]
pub async fn escalate_alarm_if_unacked(
    engine: State<'_, AlarmEngine>,
    alarm_id: i64,
) -> Result<AlarmActionReport, String> {
    engine.escalate_alarm_if_unacked(alarm_id).await
}

#[tauri::command]
pub async fn get_alarm_timeline(
    engine: State<'_, AlarmEngine>,
    week_start: String,
) -> Result<Vec<AlarmTimelineItem>, String> {
    engine.get_alarm_timeline(&week_start).await
}

#[tauri::command]
pub async fn get_alarm_daemon_status(
    engine: State<'_, AlarmEngine>,
) -> Result<AlarmDaemonStatus, String> {
    Ok(engine.daemon_status().await)
}

#[tauri::command]
pub fn ensure_alarm_launch_agent() -> Result<String, String> {
    launch_agent::ensure_alarm_launch_agent()
}
