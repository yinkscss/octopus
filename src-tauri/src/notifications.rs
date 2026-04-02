use tauri::AppHandle;
use tauri_plugin_notification::NotificationExt;

pub fn send_alarm_notification(
    app: &AppHandle,
    alarm_id: i64,
    title: &str,
    body: &str,
) -> Result<(), String> {
    app.notification()
        .builder()
        .title(title)
        .body(body)
        .group("octopus-alarms")
        .action_type_id("octopus_alarm_actions")
        .extra("alarm_id", alarm_id)
        .show()
        .map(|_| ())
        .map_err(|err| format!("notification dispatch failed: {err}"))
}
