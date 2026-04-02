use sqlx::SqlitePool;
use tauri::tray::TrayIconEvent;
use tauri::{Manager, State};

mod db;
mod keychain;

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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            #[cfg(target_os = "macos")]
            {
                app.set_activation_policy(tauri::ActivationPolicy::Accessory);
            }

            let pool = tauri::async_runtime::block_on(db::init_db())?;
            app.manage(pool);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            keychain::get_api_key,
            keychain::set_api_key,
            store_llm_response,
            get_last_llm_response
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
