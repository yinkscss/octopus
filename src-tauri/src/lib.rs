use sqlx::SqlitePool;
use tauri::tray::TrayIconEvent;
use tauri::{Manager, State};

mod alarm_engine;
mod commands;
mod db;
mod keychain;
mod launch_agent;
mod notifications;

#[tauri::command]
async fn store_llm_response(pool: State<'_, SqlitePool>, response: String) -> Result<i64, String> {
    let result = sqlx::query("INSERT INTO test_responses (response) VALUES (?1)")
        .bind(response)
        .execute(&*pool)
        .await
        .map_err(|err| err.to_string())?;

    Ok(result.last_insert_rowid())
}

#[tauri::command]
async fn get_last_llm_response(pool: State<'_, SqlitePool>) -> Result<Option<String>, String> {
    let response = sqlx::query_scalar::<_, String>(
        "SELECT response FROM test_responses ORDER BY id DESC LIMIT 1",
    )
    .fetch_optional(&*pool)
    .await
    .map_err(|err| err.to_string())?;

    Ok(response)
}

#[tauri::command]
fn debug_log(message: String) {
    println!("[DEBUG FROM FRONTEND] {}", message);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init())
        .setup(|app| {
            #[cfg(target_os = "macos")]
            {
                app.set_activation_policy(tauri::ActivationPolicy::Accessory);
            }

            let pool = tauri::async_runtime::block_on(db::init_db())?;
            let alarm_engine = alarm_engine::AlarmEngine::new(app.handle().clone(), pool.clone());
            tauri::async_runtime::block_on(alarm_engine.recover_pending_after_restart())?;
            app.manage(pool);
            app.manage(alarm_engine);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            keychain::get_api_key,
            keychain::set_api_key,
            commands::planning::create_weekly_goal,
            commands::planning::store_task_plan,
            commands::planning::get_week_plan,
            commands::planning::shift_last_plan_forward,
            commands::planning::mark_task_completed,
            commands::alarm::schedule_week_alarms,
            commands::alarm::reschedule_pending_alarms,
            commands::alarm::acknowledge_alarm,
            commands::alarm::snooze_alarm_once,
            commands::alarm::escalate_alarm_if_unacked,
            commands::alarm::get_alarm_timeline,
            commands::alarm::get_alarm_daemon_status,
            commands::alarm::ensure_alarm_launch_agent,
            store_llm_response,
            get_last_llm_response,
            debug_log
        ])
        .on_tray_icon_event(|app, event| {
            if let TrayIconEvent::Click { button, .. } = event {
                if button == tauri::tray::MouseButton::Left {
                    if let Some(window) = app.get_webview_window("main") {
                        let is_visible = window.is_visible().unwrap_or(false);
                        if is_visible {
                            let _ = window.hide();
                        } else {
                            // Show window and ensure it gets focus
                            let _ = window.show();
                            let _ = window.set_focus();
                            let _ = window.set_always_on_top(true);
                            
                            // Position window near tray icon (top-right on macOS)
                            #[cfg(target_os = "macos")]
                            if let Ok(monitor) = window.current_monitor() {
                                if let Some(monitor) = monitor {
                                    let screen_size = monitor.size();
                                    let window_size = window.outer_size().unwrap_or_default();
                                    // Position near top-right corner with some padding
                                    let x = screen_size.width as i32 - window_size.width as i32 - 10;
                                    let y = 30;
                                    let _ = window.set_position(tauri::PhysicalPosition::new(x, y));
                                }
                            }
                        }
                    }
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
