use security_framework::passwords::{get_generic_password, set_generic_password};

const SERVICE_NAME: &str = "octopus";

#[tauri::command]
pub fn get_api_key(provider: String) -> Result<String, String> {
    match get_generic_password(SERVICE_NAME, &provider) {
        Ok(password) => String::from_utf8(password).map_err(|err| err.to_string()),
        Err(_) => Ok(String::new()),
    }
}

#[tauri::command]
pub fn set_api_key(provider: String, key: String) -> Result<(), String> {
    set_generic_password(SERVICE_NAME, &provider, key.as_bytes()).map_err(|err| err.to_string())
}
